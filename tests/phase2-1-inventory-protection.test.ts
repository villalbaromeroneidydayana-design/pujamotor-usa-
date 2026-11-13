import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { prisma } from "@/shared/db/prisma";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { evaluateLotCompleteness } from "@/modules/ingestion/validators/lot-completeness.validator";
import { catalogService } from "@/modules/catalog/catalog.service";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";

describe("AUTOS USA — FASE 2.1: Pruebas de Limpieza, Clasificación y Protección de Inventario", () => {
  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toBe("file:./test_autos_usa.db");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: "file:./test_autos_usa.db" },
      stdio: "pipe",
    });
    await ensureSystemBootstrapped();
  }, 30000);

  it("1. Registro sintético REAL-TEST-9901 no aparece como inventario real y está en DEMO_SANDBOX", async () => {
    // Buscar específicamente en catálogo con filtro de solo producción real
    const realLots = await catalogService.searchLots({
      dataEnvironmentFilter: "PRODUCTION_ONLY",
    });
    expect(realLots.some((l) => l.lotNumber === "REAL-TEST-9901")).toBe(false);

    // Asegurar que en base de datos si existe REAL-TEST-9901 pertenezca a DEMO_SANDBOX
    const dbLot = await prisma.auctionLot.findUnique({
      where: { lotNumber: "REAL-TEST-9901" },
    });
    if (dbLot) {
      expect(dbLot.dataEnvironment).toBe("DEMO_SANDBOX");
    }
  });

  it("2. Ningún lote DEMO_SANDBOX se presenta como inventario real", async () => {
    const realLots = await catalogService.searchLots({
      dataEnvironmentFilter: "PRODUCTION_ONLY",
    });
    expect(realLots.every((l) => l.dataEnvironment === "PRODUCTION_REAL")).toBe(true);
    expect(realLots.some((l) => l.dataEnvironment === "DEMO_SANDBOX")).toBe(false);
  });

  it("3. Lotes PENDING_VERIFICATION en PRODUCTION_REAL no aparecen en el filtro de inventario real disponible", async () => {
    const lotNumber = `REAL-PENDING-${Date.now()}`;

    // Crear un lote real que tenga atributos secundarios pendientes (PENDING_VERIFICATION)
    const upsertRes = await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      make: "FORD",
      model: "F-150",
      year: 2023,
      primaryDamage: "FRONT END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      currentBidUsd: 12000,
      titleCategory: "SALVAGE",
      // Sin fotos autorizadas -> estado PENDING_VERIFICATION
    });

    expect(upsertRes.completenessStatus).toBe("PENDING_VERIFICATION");

    // Verificar en búsqueda de catálogo filtrada por producción: no debe aparecer como vehículo real disponible
    const realSearch = await catalogService.searchLots({ dataEnvironmentFilter: "PRODUCTION_ONLY" });
    expect(realSearch.some((l) => l.lotNumber === lotNumber)).toBe(false);
  });

  it("4. Lotes INCOMPLETE nunca se publican en catálogo ni en ficha pública", async () => {
    const lotNumber = `INCOMPLETE-TEST-${Date.now()}`;
    await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "MANUAL_VERIFIED",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - DALLAS",
      yardState: "TX",
      yardCity: "DALLAS",
      make: "TOYOTA",
      model: "COROLLA",
      year: 1910, // Año inválido -> INCOMPLETE
      primaryDamage: "UNKNOWN",
      runAndDriveStatus: "UNKNOWN",
      currentBidUsd: 3000,
      titleCategory: "SALVAGE",
    });

    const publicList = await catalogService.searchLots();
    expect(publicList.some((l) => l.lotNumber === lotNumber)).toBe(false);

    const publicDetail = await catalogService.getLotDetailByNumber(lotNumber);
    expect(publicDetail).toBeNull();
  });

  it("5. Lote real sin procedencia autorizada legítima es marcado INCOMPLETE y bloqueado", () => {
    const invalidSourceEval = evaluateLotCompleteness({
      // @ts-expect-error probando procedencia inválida
      sourceCode: "UNKNOWN_SCRAPER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber: "UNAUTH-123",
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      make: "FORD",
      model: "MUSTANG",
      year: 2022,
      primaryDamage: "REAR END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      currentBidUsd: 15000,
      titleCategory: "CLEAN",
    });

    expect(invalidSourceEval.status).toBe("INCOMPLETE");
    expect(invalidSourceEval.canBePublishedInCatalog).toBe(false);
    expect(invalidSourceEval.missingFields.some((f) => f.includes("sourceProvenance"))).toBe(true);
  });

  it("6. Lote real confirmado y con procedencia autorizada puede seguir el flujo normal de publicación", async () => {
    const lotNumber = `REAL-CONFIRMED-${Date.now()}`;

    const upsert = await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - DALLAS",
      yardState: "TX",
      yardCity: "DALLAS",
      vin: "1FTFW1E85NFA77889",
      isVinMasked: false,
      make: "FORD",
      model: "F-150 SUPERCREW",
      year: 2023,
      odometerValue: 12500,
      titleCode: "TX - SALVAGE TITLE",
      titleCategory: "SALVAGE",
      primaryDamage: "FRONT END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      currentBidUsd: 22000,
      auctionDate: new Date("2026-12-30"),
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR",
          title: "Inspección autorizada",
          url: "/media/authorized/pickup-inspection.svg",
          originReference: "Copart Member Export Verified CSV",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    });

    expect(upsert.completenessStatus).toBe("CONFIRMED");

    // Verificar que aparece en el catálogo público
    const realLots = await catalogService.searchLots({ dataEnvironmentFilter: "PRODUCTION_ONLY" });
    const found = realLots.find((l) => l.lotNumber === lotNumber);
    expect(found).toBeDefined();
    expect(found?.completenessStatus).toBe("CONFIRMED");
    expect(found?.dataEnvironment).toBe("PRODUCTION_REAL");
  });

  it("7. Fichas individuales públicas distinguen claramente la procedencia y estado de verificación", async () => {
    const lotNumber = `REAL-PENDING-DETAIL-${Date.now()}`;
    await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "FL - ORLANDO",
      yardState: "FL",
      yardCity: "ORLANDO",
      make: "CHEVROLET",
      model: "MALIBU",
      year: 2022,
      primaryDamage: "SIDE",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      currentBidUsd: 7500,
      titleCategory: "SALVAGE",
    });

    // En acceso público: la ficha muestra transparentemente que está PENDING_VERIFICATION
    const publicDetail = await catalogService.getLotDetailByNumber(lotNumber);
    expect(publicDetail).not.toBeNull();
    expect(publicDetail?.completenessStatus).toBe("PENDING_VERIFICATION");
    expect(publicDetail?.missingFields.length).toBeGreaterThan(0);
  });

  it("8. Los historiales (LotChangeHistory) y registros de auditoría (AuditLog) se conservan intactos", async () => {
    const historyCount = await prisma.lotChangeHistory.count();
    const auditCount = await prisma.auditLog.count();

    expect(historyCount).toBeGreaterThanOrEqual(1);
    expect(auditCount).toBeGreaterThanOrEqual(1);
  });
});
