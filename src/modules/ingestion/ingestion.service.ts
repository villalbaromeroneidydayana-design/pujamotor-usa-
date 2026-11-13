import { prisma } from "@/shared/db/prisma";
import { auditService } from "@/modules/admin/audit.service";
import { UserRole } from "@/modules/admin/auth.service";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";
import { copartCsvProvider } from "./providers/copart-csv.provider";
import { copartB2bApiProvider } from "./providers/copart-b2b-api.provider";
import { nhtsaVinProvider } from "./providers/nhtsa-vin.provider";
import { ProviderHealthStatus } from "./contracts/auction-provider.interface";

export class IngestionService {
  /**
   * Devuelve el estado técnico real de todos los conectores de información
   */
  async getIntegrationsOverview(): Promise<{
    providers: ProviderHealthStatus[];
    recentBatches: unknown[];
    dataSources: unknown[];
  }> {
    const b2bHealth = copartB2bApiProvider.getHealthStatus();

    const providers: ProviderHealthStatus[] = [
      {
        providerCode: "COPART_CSV_MEMBER",
        providerName: "Importador Oficial Copart Sales Data (CSV de Miembro)",
        integrationType: "CSV_MEMBER_EXPORT",
        isConfigured: true,
        isReadyForLiveUse: true,
        requiresExternalCredentials: false,
        missingCredentials: [],
        legalComplianceNotice:
          "Canal autorizado para miembros registrados de Copart mediante descarga legítima de archivos Sales Data CSV desde el portal de miembro.",
      },
      b2bHealth,
      {
        providerCode: "NHTSA_VPIC_OFFICIAL",
        providerName: "Decodificador Oficial de VIN — NHTSA vPIC (Gobierno EE. UU.)",
        integrationType: "OFFICIAL_GOV_API",
        isConfigured: true,
        isReadyForLiveUse: true,
        requiresExternalCredentials: false,
        missingCredentials: [],
        legalComplianceNotice:
          "API pública y oficial del Departamento de Transporte de Estados Unidos (vpic.nhtsa.dot.gov) para verificación técnica de VIN.",
      },
    ];

    const [recentBatches, dataSources] = await Promise.all([
      prisma.ingestionBatch.findMany({
        include: { dataSource: true },
        orderBy: { startedAt: "desc" },
        take: 15,
      }),
      prisma.dataSource.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return { providers, recentBatches, dataSources };
  }

  /**
   * Procesa un archivo CSV de miembro de Copart, valida cada fila,
   * comprueba fileHashSha256 para evitar duplicaciones accidentales idénticas,
   * deduplica lotes repetidos conservando la última versión,
   * actualiza el Motor Central de Vehículos y genera el registro auditable del lote de importación.
   */
  async importCopartCsvBatch(input: {
    fileName: string;
    csvContent: string;
    dataEnvironment?: "PRODUCTION_REAL" | "DEMO_SANDBOX";
    actorUserId?: string | null;
    actorRole: UserRole;
    forceReimport?: boolean;
  }) {
    const envType = input.dataEnvironment ?? "PRODUCTION_REAL";
    const dataSource = await vehicleEngineService.ensureDataSource("COPART_CSV_MEMBER");
    const parsed = copartCsvProvider.parseCsvContent(input.csvContent, envType);

    // 1. Verificación de hash SHA-256 para evitar reprocesar archivos idénticos
    const existingSameHashBatch = await prisma.ingestionBatch.findFirst({
      where: {
        fileHashSha256: parsed.fileHashSha256,
        status: { in: ["COMPLETED", "COMPLETED_WITH_WARNINGS"] },
      },
      orderBy: { completedAt: "desc" },
    });

    if (existingSameHashBatch && !input.forceReimport) {
      await auditService.record({
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole,
        action: "COPART_CSV_DUPLICATE_FILE_SKIPPED",
        module: "INGESTION",
        targetType: "IngestionBatch",
        targetId: existingSameHashBatch.id,
        details: {
          fileName: input.fileName,
          fileHashSha256: parsed.fileHashSha256,
          originalBatchId: existingSameHashBatch.id,
          originalCompletedAt: existingSameHashBatch.completedAt,
        },
      });

      return {
        batch: existingSameHashBatch,
        isDuplicateFile: true,
        message: `El archivo '${input.fileName}' con hash SHA-256 [${parsed.fileHashSha256.slice(
          0,
          12
        )}...] ya fue procesado exitosamente en el lote #${existingSameHashBatch.id}. No se reimportó para evitar duplicidad.`,
        rowErrors: parsed.rowErrors,
        rowWarnings: parsed.rowWarnings,
        duplicateLotsCount: parsed.duplicateLotsCount,
        stats: {
          totalRows: parsed.totalRows,
          createdRecords: 0,
          updatedRecords: 0,
          skippedRecords: parsed.validLots.length,
          failedRecords: parsed.rowErrors.length,
        },
      };
    }

    // 2. Registro del lote de ingesta en estado RUNNING
    const batch = await prisma.ingestionBatch.create({
      data: {
        dataSourceId: dataSource.id,
        fileName: input.fileName,
        fileHashSha256: parsed.fileHashSha256,
        totalRecords: parsed.totalRows,
        status: "RUNNING",
        triggeredByUserId: input.actorUserId ?? null,
      },
    });

    let createdRecords = 0;
    let updatedRecords = 0;
    let incompleteRecords = 0;
    let unchangedRecords = 0;

    // 3. Procesamiento atómico e individual de cada lote deduplicado
    for (const dto of parsed.validLots) {
      const outcome = await vehicleEngineService.upsertVehicleAndLot(dto, {
        batchId: batch.id,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole,
        changeSourceLabel: `CSV_SYNC (${input.fileName})`,
      });

      if (outcome.action === "CREATED") createdRecords++;
      else if (outcome.action === "UPDATED") updatedRecords++;
      else unchangedRecords++;

      if (outcome.completenessStatus !== "CONFIRMED") incompleteRecords++;
    }

    const failedRecords = parsed.rowErrors.length;
    const finalStatus =
      failedRecords > 0 && parsed.validLots.length === 0
        ? "FAILED"
        : failedRecords > 0 || incompleteRecords > 0 || parsed.duplicateLotsCount > 0
        ? "COMPLETED_WITH_WARNINGS"
        : "COMPLETED";

    const errorSummary = {
      errors: parsed.rowErrors,
      warnings: parsed.rowWarnings,
      deduplicatedLotsWithinFile: parsed.duplicateLotsCount,
    };

    const completedBatch = await prisma.ingestionBatch.update({
      where: { id: batch.id },
      data: {
        processedRecords: parsed.validLots.length,
        createdRecords,
        updatedRecords,
        incompleteRecords,
        failedRecords,
        status: finalStatus,
        errorSummaryJson: JSON.stringify(errorSummary),
        completedAt: new Date(),
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "COPART_CSV_BATCH_IMPORTED",
      module: "INGESTION",
      targetType: "IngestionBatch",
      targetId: completedBatch.id,
      details: {
        fileName: input.fileName,
        fileHashSha256: parsed.fileHashSha256,
        totalRows: parsed.totalRows,
        processedLots: parsed.validLots.length,
        createdRecords,
        updatedRecords,
        unchangedRecords,
        incompleteRecords,
        failedRecords,
        duplicateLotsWithinFile: parsed.duplicateLotsCount,
        dataEnvironment: envType,
      },
    });

    return {
      batch: completedBatch,
      isDuplicateFile: false,
      rowErrors: parsed.rowErrors,
      rowWarnings: parsed.rowWarnings,
      duplicateLotsCount: parsed.duplicateLotsCount,
      stats: {
        totalRows: parsed.totalRows,
        createdRecords,
        updatedRecords,
        unchangedRecords,
        incompleteRecords,
        failedRecords,
      },
    };
  }

  /**
   * Decodifica un VIN utilizando la API oficial NHTSA vPIC y opcionalmente enriquece un lote existente
   */
  async decodeVinAndEnrichLot(input: {
    vin: string;
    lotId?: string;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const decoded = await nhtsaVinProvider.decodeVin(input.vin);

    if (input.lotId && decoded.isValidVin) {
      const lot = await prisma.auctionLot.findUnique({
        where: { id: input.lotId },
        include: { vehicle: true },
      });

      if (lot) {
        await prisma.vehicle.update({
          where: { id: lot.vehicleId },
          data: {
            vin: decoded.vin,
            isVinMasked: false,
            vinDecodedByNhtsa: true,
            make: decoded.make || lot.vehicle.make,
            model: decoded.model || lot.vehicle.model,
            trim: decoded.trim || lot.vehicle.trim,
            year: decoded.year || lot.vehicle.year,
            bodyStyle: decoded.bodyStyle || lot.vehicle.bodyStyle,
            engineSpec: decoded.engineSpec || lot.vehicle.engineSpec,
            cylinders: decoded.cylinders || lot.vehicle.cylinders,
            transmission: decoded.transmission || lot.vehicle.transmission,
            drivetrain: decoded.drivetrain || lot.vehicle.drivetrain,
            fuelType: decoded.fuelType || lot.vehicle.fuelType,
            manufacturedIn: decoded.manufacturedIn || lot.vehicle.manufacturedIn,
          },
        });

        await vehicleEngineService.updateLotConditionsAdmin({
          lotId: lot.id,
          vin: decoded.vin,
          actorUserId: input.actorUserId,
          actorRole: input.actorRole,
        });

        await auditService.record({
          actorUserId: input.actorUserId ?? null,
          actorRole: input.actorRole,
          action: "VIN_ENRICHED_VIA_NHTSA",
          module: "INGESTION",
          targetType: "AuctionLot",
          targetId: lot.id,
          details: {
            vin: decoded.vin,
            make: decoded.make,
            model: decoded.model,
            year: decoded.year,
            engineSpec: decoded.engineSpec,
          },
        });
      }
    }

    return decoded;
  }
}

export const ingestionService = new IngestionService();
