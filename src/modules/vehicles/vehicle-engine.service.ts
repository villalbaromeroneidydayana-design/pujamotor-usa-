import { prisma } from "@/shared/db/prisma";
import { domainEventBus } from "@/shared/event-bus/event-bus";
import { auditService } from "@/modules/admin/audit.service";
import { UserRole } from "@/modules/admin/auth.service";
import {
  AuthorizedMediaInput,
  NormalizedAuctionLotDTO,
} from "@/modules/ingestion/contracts/auction-provider.interface";
import { evaluateLotCompleteness } from "@/modules/ingestion/validators/lot-completeness.validator";

export interface UpsertLotOutcome {
  action: "CREATED" | "UPDATED" | "UNCHANGED";
  lotId: string;
  lotNumber: string;
  internalVehicleCode: string;
  completenessStatus: string;
  missingFields: string[];
  changedFields: string[];
}

export class VehicleEngineService {
  /**
   * Garantiza que exista el registro de fuente de información (DataSource)
   */
  async ensureDataSource(sourceCode: NormalizedAuctionLotDTO["sourceCode"]) {
    const definitions: Record<
      NormalizedAuctionLotDTO["sourceCode"],
      { name: string; integrationType: string; description: string; requiresAuth: boolean }
    > = {
      COPART_CSV_MEMBER: {
        name: "Exportación Oficial CSV Miembro Copart",
        integrationType: "CSV_FEED",
        description:
          "Archivo Sales Data CSV descargado desde una cuenta autorizada de miembro de Copart.",
        requiresAuth: true,
      },
      COPART_B2B_API: {
        name: "API / Feed B2B Autorizado Copart",
        integrationType: "REST_API",
        description:
          "Conexión B2B directa mediante credenciales OAuth2 bajo convenio corporativo con Copart.",
        requiresAuth: true,
      },
      MANUAL_VERIFIED: {
        name: "Registro Operativo Verificado por Especialista",
        integrationType: "MANUAL",
        description:
          "Ingreso directo verificado por un gestor de inventario con enriquecimiento NHTSA.",
        requiresAuth: true,
      },
      DEMO_SANDBOX_GENERATOR: {
        name: "Generador de Datos de Demostración (Sandbox)",
        integrationType: "SANDBOX",
        description:
          "Conjunto de lotes sintéticos claramente marcados como DEMO_SANDBOX para pruebas de interfaz y flujos.",
        requiresAuth: false,
      },
    };

    const def = definitions[sourceCode];
    return prisma.dataSource.upsert({
      where: { code: sourceCode },
      update: { lastSyncAt: new Date() },
      create: {
        code: sourceCode,
        name: def.name,
        integrationType: def.integrationType,
        description: def.description,
        isAuthorized: true,
        isActive: true,
        requiresAuth: def.requiresAuth,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Recibe, valida, organiza, almacena o actualiza la información de un vehículo y su lote de subasta
   * dentro de una transacción ACID (prisma.$transaction) para impedir vehículos huérfanos sin lote.
   */
  async upsertVehicleAndLot(
    dto: NormalizedAuctionLotDTO,
    options?: {
      batchId?: string;
      actorUserId?: string | null;
      actorRole?: UserRole | "SYSTEM_AUTOMATION";
      changeSourceLabel?: string;
    }
  ): Promise<UpsertLotOutcome> {
    const dataSource = await this.ensureDataSource(dto.sourceCode);
    const completeness = evaluateLotCompleteness(dto);

    const existingLot = await prisma.auctionLot.findUnique({
      where: { lotNumber: dto.lotNumber },
      include: { vehicle: true, media: true },
    });

    if (!existingLot) {
      const txResult = await prisma.$transaction(async (tx) => {
        const count = await tx.vehicle.count();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const internalCode = `AUTOS-USA-${new Date().getFullYear()}-${String(
          count + 1
        ).padStart(4, "0")}-${randomSuffix}`;

        const createdVehicle = await tx.vehicle.create({
          data: {
            internalCode,
            vin: dto.vin ?? null,
            isVinMasked: dto.isVinMasked ?? Boolean(dto.vin && dto.vin.includes("*")),
            vinDecodedByNhtsa: dto.vinDecodedByNhtsa ?? false,
            make: dto.make.toUpperCase(),
            model: dto.model.toUpperCase(),
            trim: dto.trim ?? null,
            year: dto.year,
            bodyStyle: dto.bodyStyle ?? null,
            engineSpec: dto.engineSpec ?? null,
            cylinders: dto.cylinders ?? null,
            transmission: dto.transmission ?? null,
            drivetrain: dto.drivetrain ?? null,
            fuelType: dto.fuelType ?? null,
            exteriorColor: dto.exteriorColor ?? null,
            manufacturedIn: dto.manufacturedIn ?? null,
            dataEnvironment: dto.dataEnvironment,
          },
        });

        const createdLot = await tx.auctionLot.create({
          data: {
            vehicleId: createdVehicle.id,
            dataSourceId: dataSource.id,
            lastBatchId: options?.batchId ?? null,
            lotNumber: dto.lotNumber,
            auctionHouse: dto.auctionHouse ?? "COPART",
            yardName: dto.yardName,
            yardState: dto.yardState,
            yardCity: dto.yardCity,
            yardZip: dto.yardZip ?? null,
            odometerValue: dto.odometerValue ?? null,
            odometerUnit: dto.odometerUnit ?? "MILES",
            odometerBrand: dto.odometerBrand ?? "ACTUAL",
            titleCode: dto.titleCode ?? null,
            titleCategory: dto.titleCategory,
            primaryDamage: dto.primaryDamage,
            secondaryDamage: dto.secondaryDamage ?? null,
            damageNotes: dto.damageNotes ?? null,
            runAndDriveStatus: dto.runAndDriveStatus,
            hasKeys: dto.hasKeys ?? null,
            estimatedRetailValue: dto.estimatedRetailValue ?? null,
            repairCostEstimate: dto.repairCostEstimate ?? null,
            currentBidUsd: dto.currentBidUsd,
            buyItNowPriceUsd: dto.buyItNowPriceUsd ?? null,
            sellerType: dto.sellerType ?? null,
            requiresBrokerLicense: dto.requiresBrokerLicense ?? true,
            auctionDate: dto.auctionDate ?? null,
            saleStatus: dto.saleStatus ?? "UPCOMING",
            availabilityStatus: "AVAILABLE",
            completenessStatus: completeness.status,
            missingFieldsJson: JSON.stringify(completeness.missingFields),
            verificationNotes: completeness.verificationSummary,
            isPublished: completeness.canBePublishedInCatalog,
            dataEnvironment: dto.dataEnvironment,
            sourceQueriedAt: dto.sourceQueriedAt ?? new Date(),
          },
        });

        if (dto.authorizedMedia && dto.authorizedMedia.length > 0) {
          await tx.vehicleMedia.createMany({
            data: dto.authorizedMedia.map((m, idx) => ({
              auctionLotId: createdLot.id,
              mediaType: m.mediaType,
              title: m.title,
              url: m.url,
              originReference: m.originReference,
              isAuthorizedCopy: m.isAuthorizedCopy,
              sortOrder: idx,
              isPrimary: m.isPrimary ?? idx === 0,
            })),
          });
        }

        await tx.lotChangeHistory.create({
          data: {
            auctionLotId: createdLot.id,
            changedByUserId: options?.actorUserId ?? null,
            changeSource: options?.changeSourceLabel ?? dto.sourceCode,
            summary: `Registro inicial del lote #${dto.lotNumber} (${dto.year} ${dto.make} ${dto.model}). Estado de datos: ${completeness.status}.`,
            changedFieldsJson: JSON.stringify(["INITIAL_REGISTRATION"]),
            previousValuesJson: JSON.stringify({}),
            newValuesJson: JSON.stringify({
              currentBidUsd: dto.currentBidUsd,
              buyItNowPriceUsd: dto.buyItNowPriceUsd ?? null,
              saleStatus: createdLot.saleStatus,
              completenessStatus: completeness.status,
            }),
          },
        });

        return { createdVehicle, createdLot };
      });

      await domainEventBus.publish({
        type: "LOT_INGESTED",
        occurredAt: new Date(),
        module: "VEHICLES",
        payload: { lotId: txResult.createdLot.id, lotNumber: dto.lotNumber },
      });

      return {
        action: "CREATED",
        lotId: txResult.createdLot.id,
        lotNumber: txResult.createdLot.lotNumber,
        internalVehicleCode: txResult.createdVehicle.internalCode,
        completenessStatus: completeness.status,
        missingFields: completeness.missingFields,
        changedFields: ["INITIAL_REGISTRATION"],
      };
    }

    // Si el lote ya existe: comparar campos auditables y actualizar dentro de una transacción atómica
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const changedFields: string[] = [];

    const checkDiff = (field: string, oldVal: unknown, nextVal: unknown) => {
      const normalizedOld = oldVal instanceof Date ? oldVal.toISOString() : oldVal ?? null;
      const normalizedNext = nextVal instanceof Date ? nextVal.toISOString() : nextVal ?? null;
      if (normalizedOld !== normalizedNext) {
        changedFields.push(field);
        previousValues[field] = normalizedOld;
        newValues[field] = normalizedNext;
      }
    };

    checkDiff("currentBidUsd", existingLot.currentBidUsd, dto.currentBidUsd);
    checkDiff("buyItNowPriceUsd", existingLot.buyItNowPriceUsd, dto.buyItNowPriceUsd ?? null);
    checkDiff(
      "odometerValue",
      existingLot.odometerValue,
      dto.odometerValue ?? existingLot.odometerValue
    );
    checkDiff("titleCategory", existingLot.titleCategory, dto.titleCategory);
    checkDiff("primaryDamage", existingLot.primaryDamage, dto.primaryDamage);
    checkDiff("runAndDriveStatus", existingLot.runAndDriveStatus, dto.runAndDriveStatus);
    checkDiff("saleStatus", existingLot.saleStatus, dto.saleStatus ?? existingLot.saleStatus);

    const effectiveDtoForCompleteness: NormalizedAuctionLotDTO = {
      ...dto,
      authorizedMedia:
        dto.authorizedMedia && dto.authorizedMedia.length > 0
          ? dto.authorizedMedia
          : existingLot.media.map((m) => ({
              mediaType: m.mediaType as AuthorizedMediaInput["mediaType"],
              title: m.title,
              url: m.url,
              originReference: m.originReference,
              isAuthorizedCopy: m.isAuthorizedCopy,
              isPrimary: m.isPrimary,
            })),
    };
    const updatedCompleteness = evaluateLotCompleteness(effectiveDtoForCompleteness);
    checkDiff("completenessStatus", existingLot.completenessStatus, updatedCompleteness.status);

    const updatedLot = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: existingLot.vehicleId },
        data: {
          vin: dto.vin ?? existingLot.vehicle.vin,
          isVinMasked:
            dto.isVinMasked ??
            (dto.vin ? dto.vin.includes("*") : existingLot.vehicle.isVinMasked),
          vinDecodedByNhtsa: dto.vinDecodedByNhtsa ?? existingLot.vehicle.vinDecodedByNhtsa,
          make: dto.make.toUpperCase(),
          model: dto.model.toUpperCase(),
          trim: dto.trim ?? existingLot.vehicle.trim,
          year: dto.year,
          bodyStyle: dto.bodyStyle ?? existingLot.vehicle.bodyStyle,
          engineSpec: dto.engineSpec ?? existingLot.vehicle.engineSpec,
          cylinders: dto.cylinders ?? existingLot.vehicle.cylinders,
          transmission: dto.transmission ?? existingLot.vehicle.transmission,
          drivetrain: dto.drivetrain ?? existingLot.vehicle.drivetrain,
          fuelType: dto.fuelType ?? existingLot.vehicle.fuelType,
          exteriorColor: dto.exteriorColor ?? existingLot.vehicle.exteriorColor,
          manufacturedIn: dto.manufacturedIn ?? existingLot.vehicle.manufacturedIn,
        },
      });

      const lotRecord = await tx.auctionLot.update({
        where: { id: existingLot.id },
        data: {
          dataSourceId: dataSource.id,
          lastBatchId: options?.batchId ?? existingLot.lastBatchId,
          yardName: dto.yardName,
          yardState: dto.yardState,
          yardCity: dto.yardCity,
          yardZip: dto.yardZip ?? existingLot.yardZip,
          odometerValue: dto.odometerValue ?? existingLot.odometerValue,
          odometerBrand: dto.odometerBrand ?? existingLot.odometerBrand,
          titleCode: dto.titleCode ?? existingLot.titleCode,
          titleCategory: dto.titleCategory,
          primaryDamage: dto.primaryDamage,
          secondaryDamage: dto.secondaryDamage ?? existingLot.secondaryDamage,
          runAndDriveStatus: dto.runAndDriveStatus,
          hasKeys: dto.hasKeys ?? existingLot.hasKeys,
          estimatedRetailValue: dto.estimatedRetailValue ?? existingLot.estimatedRetailValue,
          repairCostEstimate: dto.repairCostEstimate ?? existingLot.repairCostEstimate,
          currentBidUsd: dto.currentBidUsd,
          buyItNowPriceUsd: dto.buyItNowPriceUsd ?? null,
          auctionDate: dto.auctionDate ?? existingLot.auctionDate,
          saleStatus: dto.saleStatus ?? existingLot.saleStatus,
          completenessStatus: updatedCompleteness.status,
          missingFieldsJson: JSON.stringify(updatedCompleteness.missingFields),
          verificationNotes: updatedCompleteness.verificationSummary,
          isPublished: updatedCompleteness.canBePublishedInCatalog,
          sourceQueriedAt: dto.sourceQueriedAt ?? new Date(),
        },
      });

      if (changedFields.length > 0) {
        await tx.lotChangeHistory.create({
          data: {
            auctionLotId: existingLot.id,
            changedByUserId: options?.actorUserId ?? null,
            changeSource: options?.changeSourceLabel ?? dto.sourceCode,
            summary: `Actualización de lote #${dto.lotNumber}: modificados [${changedFields.join(
              ", "
            )}]`,
            changedFieldsJson: JSON.stringify(changedFields),
            previousValuesJson: JSON.stringify(previousValues),
            newValuesJson: JSON.stringify(newValues),
          },
        });
      }

      return lotRecord;
    });

    if (changedFields.length > 0) {
      await domainEventBus.publish({
        type: "LOT_UPDATED",
        occurredAt: new Date(),
        module: "VEHICLES",
        payload: { lotId: existingLot.id, lotNumber: dto.lotNumber, changedFields },
      });
    }

    return {
      action: changedFields.length > 0 ? "UPDATED" : "UNCHANGED",
      lotId: updatedLot.id,
      lotNumber: updatedLot.lotNumber,
      internalVehicleCode: existingLot.vehicle.internalCode,
      completenessStatus: updatedCompleteness.status,
      missingFields: updatedCompleteness.missingFields,
      changedFields,
    };
  }

  /**
   * Actualización manual controlada de precios, estado de subasta o disponibilidad desde el Panel Administrativo
   */
  async updateLotConditionsAdmin(input: {
    lotId: string;
    currentBidUsd?: number;
    buyItNowPriceUsd?: number | null;
    saleStatus?: string;
    availabilityStatus?: string;
    primaryDamage?: string;
    runAndDriveStatus?: string;
    hasKeys?: boolean | null;
    odometerValue?: number | null;
    vin?: string | null;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: input.lotId },
      include: { vehicle: true, media: true, dataSource: true },
    });

    if (!lot) {
      throw new Error("El lote indicado no existe en el Motor Central de Vehículos.");
    }

    const changedFields: string[] = [];
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    const track = (field: string, oldVal: unknown, nextVal: unknown) => {
      if (nextVal !== undefined && oldVal !== nextVal) {
        changedFields.push(field);
        previousValues[field] = oldVal;
        newValues[field] = nextVal;
      }
    };

    track("currentBidUsd", lot.currentBidUsd, input.currentBidUsd);
    track("buyItNowPriceUsd", lot.buyItNowPriceUsd, input.buyItNowPriceUsd);
    track("saleStatus", lot.saleStatus, input.saleStatus);
    track("availabilityStatus", lot.availabilityStatus, input.availabilityStatus);
    track("primaryDamage", lot.primaryDamage, input.primaryDamage);
    track("runAndDriveStatus", lot.runAndDriveStatus, input.runAndDriveStatus);
    track("hasKeys", lot.hasKeys, input.hasKeys);
    track("odometerValue", lot.odometerValue, input.odometerValue);
    track("vin", lot.vehicle.vin, input.vin);

    const completeness = evaluateLotCompleteness({
      sourceCode:
        (lot.dataSource.code as NormalizedAuctionLotDTO["sourceCode"]) || "MANUAL_VERIFIED",
      dataEnvironment: lot.dataEnvironment as "PRODUCTION_REAL" | "DEMO_SANDBOX",
      lotNumber: lot.lotNumber,
      yardName: lot.yardName,
      yardState: lot.yardState,
      yardCity: lot.yardCity,
      vin: input.vin !== undefined ? input.vin : lot.vehicle.vin,
      isVinMasked:
        input.vin !== undefined
          ? Boolean(input.vin && input.vin.includes("*"))
          : lot.vehicle.isVinMasked,
      make: lot.vehicle.make,
      model: lot.vehicle.model,
      year: lot.vehicle.year,
      odometerValue:
        input.odometerValue !== undefined ? input.odometerValue : lot.odometerValue,
      titleCode: lot.titleCode,
      titleCategory: lot.titleCategory as NormalizedAuctionLotDTO["titleCategory"],
      primaryDamage: input.primaryDamage ?? lot.primaryDamage,
      runAndDriveStatus: (input.runAndDriveStatus ??
        lot.runAndDriveStatus) as NormalizedAuctionLotDTO["runAndDriveStatus"],
      hasKeys: input.hasKeys !== undefined ? input.hasKeys : lot.hasKeys,
      currentBidUsd: input.currentBidUsd ?? lot.currentBidUsd,
      buyItNowPriceUsd:
        input.buyItNowPriceUsd !== undefined ? input.buyItNowPriceUsd : lot.buyItNowPriceUsd,
      auctionDate: lot.auctionDate,
      authorizedMedia: lot.media.map((m) => ({
        mediaType: m.mediaType as AuthorizedMediaInput["mediaType"],
        title: m.title,
        url: m.url,
        originReference: m.originReference,
        isAuthorizedCopy: m.isAuthorizedCopy,
        isPrimary: m.isPrimary,
      })),
    });

    const updated = await prisma.$transaction(async (tx) => {
      if (input.vin !== undefined && input.vin !== lot.vehicle.vin) {
        await tx.vehicle.update({
          where: { id: lot.vehicleId },
          data: {
            vin: input.vin,
            isVinMasked: Boolean(input.vin && input.vin.includes("*")),
          },
        });
      }

      const updatedLotRecord = await tx.auctionLot.update({
        where: { id: lot.id },
        data: {
          currentBidUsd: input.currentBidUsd ?? lot.currentBidUsd,
          buyItNowPriceUsd:
            input.buyItNowPriceUsd !== undefined ? input.buyItNowPriceUsd : lot.buyItNowPriceUsd,
          saleStatus: input.saleStatus ?? lot.saleStatus,
          availabilityStatus: input.availabilityStatus ?? lot.availabilityStatus,
          primaryDamage: input.primaryDamage ?? lot.primaryDamage,
          runAndDriveStatus: input.runAndDriveStatus ?? lot.runAndDriveStatus,
          hasKeys: input.hasKeys !== undefined ? input.hasKeys : lot.hasKeys,
          odometerValue:
            input.odometerValue !== undefined ? input.odometerValue : lot.odometerValue,
          completenessStatus: completeness.status,
          missingFieldsJson: JSON.stringify(completeness.missingFields),
          verificationNotes: completeness.verificationSummary,
          isPublished: completeness.canBePublishedInCatalog,
        },
        include: {
          vehicle: true,
          media: true,
          changeHistory: { orderBy: { createdAt: "desc" } },
        },
      });

      if (changedFields.length > 0) {
        await tx.lotChangeHistory.create({
          data: {
            auctionLotId: lot.id,
            changedByUserId: input.actorUserId ?? null,
            changeSource: "ADMIN_MANUAL_UPDATE",
            summary: `Actualización administrativa de lote #${lot.lotNumber}: [${changedFields.join(
              ", "
            )}]`,
            changedFieldsJson: JSON.stringify(changedFields),
            previousValuesJson: JSON.stringify(previousValues),
            newValuesJson: JSON.stringify(newValues),
          },
        });
      }

      return updatedLotRecord;
    });

    if (changedFields.length > 0) {
      await auditService.record({
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole,
        action: "LOT_CONDITIONS_UPDATED",
        module: "VEHICLES",
        targetType: "AuctionLot",
        targetId: lot.id,
        details: {
          lotNumber: lot.lotNumber,
          changedFields,
          previousValues,
          newValues,
          completenessStatus: completeness.status,
        },
      });
    }

    return updated;
  }

  /**
   * Vincula una fotografía autorizada a un lote y recalcula su estado de completitud
   */
  async addAuthorizedMedia(input: {
    lotId: string;
    media: AuthorizedMediaInput;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    if (!input.media.isAuthorizedCopy || !input.media.originReference.trim()) {
      throw new Error(
        "Política de cumplimiento: Solo se pueden vincular fotografías que cuenten con confirmación de autorización y referencia de origen documental."
      );
    }

    const lot = await prisma.auctionLot.findUnique({
      where: { id: input.lotId },
      include: { media: true, vehicle: true, dataSource: true },
    });

    if (!lot) {
      throw new Error("Lote no encontrado.");
    }

    const createdMedia = await prisma.vehicleMedia.create({
      data: {
        auctionLotId: lot.id,
        mediaType: input.media.mediaType,
        title: input.media.title,
        url: input.media.url,
        originReference: input.media.originReference,
        isAuthorizedCopy: true,
        sortOrder: lot.media.length,
        isPrimary: lot.media.length === 0 ? true : Boolean(input.media.isPrimary),
      },
    });

    await this.updateLotConditionsAdmin({
      lotId: lot.id,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "AUTHORIZED_MEDIA_ATTACHED",
      module: "VEHICLES",
      targetType: "AuctionLot",
      targetId: lot.id,
      details: {
        lotNumber: lot.lotNumber,
        mediaId: createdMedia.id,
        originReference: input.media.originReference,
      },
    });

    return createdMedia;
  }

  /**
   * Establece una fotografía como principal del lote y ajusta el orden
   */
  async setPrimaryMedia(input: {
    lotId: string;
    mediaId: string;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: input.lotId },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });

    if (!lot) throw new Error("Lote no encontrado.");
    const targetMedia = lot.media.find((m) => m.id === input.mediaId);
    if (!targetMedia) throw new Error("Fotografía no encontrada en este lote.");

    await prisma.$transaction(async (tx) => {
      // 1. Quitar flag primario a todas
      await tx.vehicleMedia.updateMany({
        where: { auctionLotId: lot.id },
        data: { isPrimary: false },
      });

      // 2. Establecer la elegida como primaria y orden 0
      await tx.vehicleMedia.update({
        where: { id: input.mediaId },
        data: { isPrimary: true, sortOrder: 0 },
      });

      // 3. Reordenar las demás
      const others = lot.media.filter((m) => m.id !== input.mediaId);
      for (let i = 0; i < others.length; i++) {
        await tx.vehicleMedia.update({
          where: { id: others[i].id },
          data: { sortOrder: i + 1 },
        });
      }
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "PRIMARY_MEDIA_CHANGED",
      module: "VEHICLES",
      targetType: "AuctionLot",
      targetId: lot.id,
      details: { lotNumber: lot.lotNumber, mediaId: input.mediaId },
    });

    return prisma.vehicleMedia.findMany({
      where: { auctionLotId: lot.id },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Elimina una fotografía del lote y reasigna primaria si era la principal
   */
  async deleteMedia(input: {
    lotId: string;
    mediaId: string;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: input.lotId },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });

    if (!lot) throw new Error("Lote no encontrado.");
    const targetMedia = lot.media.find((m) => m.id === input.mediaId);
    if (!targetMedia) throw new Error("Fotografía no encontrada en este lote.");

    await prisma.$transaction(async (tx) => {
      await tx.vehicleMedia.delete({
        where: { id: input.mediaId },
      });

      const remaining = lot.media.filter((m) => m.id !== input.mediaId);
      if (remaining.length > 0) {
        // Asegurar que haya una primaria
        const hasPrimary = remaining.some((m) => m.id !== input.mediaId && m.isPrimary);
        for (let i = 0; i < remaining.length; i++) {
          await tx.vehicleMedia.update({
            where: { id: remaining[i].id },
            data: {
              sortOrder: i,
              isPrimary: !hasPrimary && i === 0 ? true : remaining[i].isPrimary,
            },
          });
        }
      }
    });

    await this.updateLotConditionsAdmin({
      lotId: lot.id,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "AUTHORIZED_MEDIA_DELETED",
      module: "VEHICLES",
      targetType: "AuctionLot",
      targetId: lot.id,
      details: { lotNumber: lot.lotNumber, deletedMediaId: input.mediaId },
    });

    return prisma.vehicleMedia.findMany({
      where: { auctionLotId: lot.id },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Reordena las fotografías de un lote según una lista ordenada de IDs
   */
  async reorderMedia(input: {
    lotId: string;
    mediaIdsInOrder: string[];
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const lot = await prisma.auctionLot.findUnique({
      where: { id: input.lotId },
      include: { media: true },
    });

    if (!lot) throw new Error("Lote no encontrado.");

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < input.mediaIdsInOrder.length; i++) {
        const id = input.mediaIdsInOrder[i];
        await tx.vehicleMedia.update({
          where: { id },
          data: {
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }
    });

    return prisma.vehicleMedia.findMany({
      where: { auctionLotId: lot.id },
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const vehicleEngineService = new VehicleEngineService();
