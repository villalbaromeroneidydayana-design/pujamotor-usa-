import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { prisma } from "@/shared/db/prisma";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { copartCsvProvider } from "@/modules/ingestion/providers/copart-csv.provider";
import { copartB2bApiProvider } from "@/modules/ingestion/providers/copart-b2b-api.provider";
import { ingestionService } from "@/modules/ingestion/ingestion.service";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";
import { catalogService } from "@/modules/catalog/catalog.service";

describe("AUTOS USA — FASE 2: Pruebas de Ingesta Copart, Calidad de Datos, Deduplicación y Catálogo", () => {
  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toBe("file:./test_autos_usa.db");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: "file:./test_autos_usa.db" },
      stdio: "pipe",
    });
    await ensureSystemBootstrapped();
  }, 30000);

  it("1. Importación CSV auténtica de Copart: maneja encabezados de exportación de miembro y campos completos", () => {
    // CSV con formato y encabezados auténticos de 'Copart Sales Data CSV / Member Download'
    const authenticCopartCsv = `Lot number,Year,Make,Model Detail,Damage Description,Secondary Damage,Sale Title State,Sale Title Type,Has Keys-Yes or No,Odometer,High Bid =non-vix,Buy-It-Now Price,Est. Retail Value,Repair Cost,Location state,Location city,Runs/Drives,VIN,Image URLs
55443322,2023,CHEVROLET,SILVERADO 1500 RST,FRONT END,SIDE,TX,CERTIFICATE OF TITLE - SALVAGE,YES,18500,24500,29000,46000,11500,TX,DALLAS,RUNS AND DRIVES,1GCRYDED7PZ112233,/media/authorized/pickup-inspection.svg;/media/authorized/sedan-inspection.svg`;

    const parsed = copartCsvProvider.parseCsvContent(authenticCopartCsv, "PRODUCTION_REAL");
    expect(parsed.totalRows).toBe(1);
    expect(parsed.validLots.length).toBe(1);
    expect(parsed.rowErrors.length).toBe(0);

    const lot = parsed.validLots[0];
    expect(lot.lotNumber).toBe("55443322");
    expect(lot.make).toBe("CHEVROLET");
    expect(lot.model).toBe("SILVERADO 1500 RST");
    expect(lot.year).toBe(2023);
    expect(lot.odometerValue).toBe(18500);
    expect(lot.titleCategory).toBe("SALVAGE");
    expect(lot.primaryDamage).toBe("FRONT END");
    expect(lot.secondaryDamage).toBe("SIDE");
    expect(lot.runAndDriveStatus).toBe("RUNS_AND_DRIVES");
    expect(lot.hasKeys).toBe(true);
    expect(lot.currentBidUsd).toBe(24500);
    expect(lot.buyItNowPriceUsd).toBe(29000);
    expect(lot.estimatedRetailValue).toBe(46000);
    expect(lot.repairCostEstimate).toBe(11500);
    expect(lot.yardState).toBe("TX");
    expect(lot.yardCity).toBe("DALLAS");
    expect(lot.vin).toBe("1GCRYDED7PZ112233");
    expect(lot.isVinMasked).toBe(false);
    expect(lot.authorizedMedia?.length).toBe(2);
    expect(lot.authorizedMedia?.[0].url).toBe("/media/authorized/pickup-inspection.svg");
    expect(lot.authorizedMedia?.[1].url).toBe("/media/authorized/sedan-inspection.svg");
  });

  it("2. Tolerancia a encabezados desconocidos y rechazo de filas sin datos críticos", () => {
    // Encabezados con nombres variantes o columnas desconocidas adicionales
    const csvWithUnknownHeaders = `ColumnaDesconocidaX,Lot #,Ano,Marca,Modelo,Estado,Dano,VIN,High Bid
CustomData1,99887711,2021,HONDA,CR-V EX-L,FL,REAR END,3CZRM4H74MM999888,14200
CustomData2,,2022,FORD,EXPLORER,TX,FRONT END,1FTFW1E85NFA00112,18000
CustomData3,99887712,1890,NISSAN,SENTRA,CA,SIDE,3N1AB7AP5KL002233,5000`;

    const parsed = copartCsvProvider.parseCsvContent(csvWithUnknownHeaders, "PRODUCTION_REAL");
    expect(parsed.totalRows).toBe(3);
    expect(parsed.validLots.length).toBe(1); // Solo 99887711 es válido
    expect(parsed.rowErrors.length).toBe(2);

    expect(parsed.rowErrors[0].reason).toContain("Falta columna obligatoria o valor de 'Lot number'");
    expect(parsed.rowErrors[1].reason).toContain("Año de vehículo inválido o fuera de rango [1890]");
    expect(parsed.validLots[0].lotNumber).toBe("99887711");
    expect(parsed.validLots[0].make).toBe("HONDA");
  });

  it("3. Deduplicación interna: filas repetidas del mismo lote conservan la última versión con advertencia", () => {
    const csvWithDuplicateLots = `Lot number,Year,Make,Model Detail,Damage Description,Sale Title State,Sale Title Type,High Bid =non-vix,Location state,Location city,VIN
77112233,2022,JEEP,WRANGLER UNLIMITED,FRONT END,TX,CERT OF TITLE-SALVAGE,15000,TX,AUSTIN,1C4HJXDG4NW111222
77112233,2022,JEEP,WRANGLER UNLIMITED,FRONT END,TX,CERT OF TITLE-SALVAGE,18500,TX,AUSTIN,1C4HJXDG4NW111222`;

    const parsed = copartCsvProvider.parseCsvContent(csvWithDuplicateLots, "PRODUCTION_REAL");
    expect(parsed.totalRows).toBe(2);
    expect(parsed.validLots.length).toBe(1); // Deduplicado a 1 lote
    expect(parsed.duplicateLotsCount).toBe(1);
    expect(parsed.rowWarnings.length).toBe(1);
    expect(parsed.rowWarnings[0].reason).toContain("Lote duplicado dentro del archivo CSV");
    // Conserva la última versión (puja actualizada a 18500 en vez de 15000)
    expect(parsed.validLots[0].currentBidUsd).toBe(18500);
  });

  it("4. Prevención de importaciones duplicadas idénticas mediante fileHashSha256", async () => {
    const uniqueCsv = `Lot number,Year,Make,Model Detail,Damage Description,Sale Title State,Sale Title Type,High Bid =non-vix,Location state,Location city,VIN
HASH-LOT-${Date.now()},2023,GMC,SIERRA 1500,SIDE,TX,CERT OF TITLE-SALVAGE,22000,TX,SAN ANTONIO,1GT49TEY7PZ998877`;

    // 1. Primera importación: debe procesarse
    const firstResult = await ingestionService.importCopartCsvBatch({
      fileName: "copart_test_batch_hash.csv",
      csvContent: uniqueCsv,
      dataEnvironment: "PRODUCTION_REAL",
      actorRole: "SUPER_ADMIN",
    });
    expect(firstResult.isDuplicateFile).toBe(false);
    expect(firstResult.stats.createdRecords).toBe(1);

    // 2. Segunda importación con el mismo contenido y mismo hash: debe omitirse
    const secondResult = await ingestionService.importCopartCsvBatch({
      fileName: "copart_test_batch_hash_repeated.csv",
      csvContent: uniqueCsv,
      dataEnvironment: "PRODUCTION_REAL",
      actorRole: "SUPER_ADMIN",
    });
    expect(secondResult.isDuplicateFile).toBe(true);
    expect(secondResult.stats.createdRecords).toBe(0);
    expect(secondResult.stats.skippedRecords).toBe(1);
    expect(secondResult.message).toContain("ya fue procesado exitosamente");
  });

  it("5. Actualización legítima de lote existente y registro estricto en LotChangeHistory", async () => {
    const lotNumber = `UPDATE-LOT-${Date.now()}`;
    const initialCsv = `Lot number,Year,Make,Model Detail,Damage Description,Sale Title State,Sale Title Type,High Bid =non-vix,Location state,Location city,VIN
${lotNumber},2023,HYUNDAI,TUCSON SEL,FRONT END,TX,SALVAGE,12000,TX,HOUSTON,KM8JB3AE6PU112233`;

    const updatedCsv = `Lot number,Year,Make,Model Detail,Damage Description,Sale Title State,Sale Title Type,High Bid =non-vix,Buy-It-Now Price,Location state,Location city,VIN
${lotNumber},2023,HYUNDAI,TUCSON SEL,FRONT END,TX,SALVAGE,14500,18900,TX,HOUSTON,KM8JB3AE6PU112233`;

    await ingestionService.importCopartCsvBatch({
      fileName: "initial_update.csv",
      csvContent: initialCsv,
      dataEnvironment: "PRODUCTION_REAL",
      actorRole: "SUPER_ADMIN",
    });

    // Importar la actualización (archivo con contenido distinto, nuevo hash)
    const updateResult = await ingestionService.importCopartCsvBatch({
      fileName: "updated_prices.csv",
      csvContent: updatedCsv,
      dataEnvironment: "PRODUCTION_REAL",
      actorRole: "SUPER_ADMIN",
    });
    expect(updateResult.isDuplicateFile).toBe(false);
    expect(updateResult.stats.updatedRecords).toBe(1);

    const lotDetail = await catalogService.getLotDetailByNumber(lotNumber);
    expect(lotDetail?.currentBidUsd).toBe(14500);
    expect(lotDetail?.buyItNowPriceUsd).toBe(18900);
    expect(lotDetail?.changeHistory.length).toBeGreaterThanOrEqual(2);
    expect(lotDetail?.changeHistory[0].changedFields).toContain("currentBidUsd");
  });

  it("6. Conexión B2B Copart: Reporta credenciales faltantes y transforma payloads simulados con precisión", () => {
    const health = copartB2bApiProvider.getHealthStatus();
    expect(health.providerCode).toBe("COPART_B2B_API");
    expect(health.requiresExternalCredentials).toBe(true);
    expect(health.missingCredentials.length).toBeGreaterThanOrEqual(4);
    expect(health.legalComplianceNotice).toContain("Copart no ofrece una API pública abierta");

    // Probar el transformador oficial con una respuesta estructurada B2B simulada
    const mockB2b = copartB2bApiProvider.createMockB2bResponse("B2B-88990011");
    const dto = copartB2bApiProvider.transformB2bPayloadToDTO(mockB2b, "PRODUCTION_REAL");

    expect(dto.lotNumber).toBe("B2B-88990011");
    expect(dto.make).toBe("FORD");
    expect(dto.model).toBe("BRONCO SPORT");
    expect(dto.trim).toBe("BADLANDS");
    expect(dto.year).toBe(2023);
    expect(dto.currentBidUsd).toBe(16500);
    expect(dto.buyItNowPriceUsd).toBe(21500);
    expect(dto.runAndDriveStatus).toBe("RUNS_AND_DRIVES");
    expect(dto.hasKeys).toBe(true);
    expect(dto.titleCategory).toBe("SALVAGE");
    expect(dto.authorizedMedia?.length).toBe(1);
    expect(dto.authorizedMedia?.[0].originReference).toContain("Copart B2B API Licensed Feed");
  });

  it("7. Fotografías y Documentación: Rechaza fotografías sin autorización y vincula imágenes autorizadas", async () => {
    const lotNumber = `PHOTO-LOT-${Date.now()}`;
    const upsertRes = await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "MANUAL_VERIFIED",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - AUSTIN",
      yardState: "TX",
      yardCity: "AUSTIN",
      make: "TOYOTA",
      model: "CAMRY",
      year: 2022,
      titleCategory: "SALVAGE",
      primaryDamage: "REAR END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      currentBidUsd: 9000,
    });

    // 1. Intento de vincular fotografía sin autorización o sin referencia documental: debe lanzar error
    await expect(
      vehicleEngineService.addAuthorizedMedia({
        lotId: upsertRes.lotId,
        media: {
          mediaType: "PHOTO_EXTERIOR",
          title: "Foto descargada sin permiso",
          url: "https://copart.com/unauthorized.jpg",
          originReference: "", // Origen ausente
          isAuthorizedCopy: false, // Sin autorización explícita
        },
        actorRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow("Política de cumplimiento");

    // 2. Vinculación de fotografía debidamente autorizada
    const validMedia = await vehicleEngineService.addAuthorizedMedia({
      lotId: upsertRes.lotId,
      media: {
        mediaType: "PHOTO_EXTERIOR",
        title: "Inspección presencial autorizada en yarda",
        url: "/media/authorized/sedan-inspection.svg",
        originReference: "Dossier Inspección Mecánica Autorizada #INSP-2026-09",
        isAuthorizedCopy: true,
        isPrimary: true,
      },
      actorRole: "SUPER_ADMIN",
    });

    expect(validMedia.id).toBeDefined();
    expect(validMedia.isAuthorizedCopy).toBe(true);

    const lotDetail = await catalogService.getLotDetailByNumber(lotNumber);
    expect(lotDetail?.media.length).toBe(1);
    expect(lotDetail?.media[0].originReference).toContain("Dossier Inspección");
  });

  it("8. Catálogo Público: Filtros avanzados por modelo, año mín/máx, precio mín/máx, daño primario y separación estricta", async () => {
    // 1. Filtrado por modelo
    const broncoResults = await catalogService.searchLots({ model: "BRONCO" });
    expect(broncoResults.every((l) => l.vehicle.model.includes("BRONCO"))).toBe(true);

    // 2. Filtrado por año mínimo y máximo
    const yearFiltered = await catalogService.searchLots({ minYear: 2022, maxYear: 2024 });
    expect(yearFiltered.every((l) => l.vehicle.year >= 2022 && l.vehicle.year <= 2024)).toBe(true);

    // 3. Filtrado por precio mínimo y máximo
    const priceFiltered = await catalogService.searchLots({ minPrice: 10000, maxPrice: 20000 });
    expect(priceFiltered.every((l) => l.currentBidUsd >= 10000 && l.currentBidUsd <= 20000)).toBe(true);

    // 4. Filtrado por daño primario
    const damageFiltered = await catalogService.searchLots({ primaryDamage: "FRONT END" });
    expect(damageFiltered.every((l) => l.primaryDamage.includes("FRONT"))).toBe(true);

    // 5. Separación estricta de entornos
    const prodOnly = await catalogService.searchLots({ dataEnvironmentFilter: "PRODUCTION_ONLY" });
    expect(prodOnly.every((l) => l.dataEnvironment === "PRODUCTION_REAL")).toBe(true);

    const demoOnly = await catalogService.searchLots({ dataEnvironmentFilter: "DEMO_ONLY" });
    expect(demoOnly.every((l) => l.dataEnvironment === "DEMO_SANDBOX")).toBe(true);
  });
});
