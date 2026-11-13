import { ingestionService } from "../src/modules/ingestion/ingestion.service";
import { prisma } from "../src/shared/db/prisma";

async function main() {
  console.log("Iniciando importación asistida oficial de Copart...");

  const copartCsv = `Lot number,Year,Make,Model Detail,Body Style,Color,Damage Description,Secondary Damage,Sale Title State,Sale Title Type,Has Keys-Yes or No,Odometer,Odometer Brand,High Bid =non-vix,Buy-It-Now Price,Yard name,Location state,Location city,Sale Date M/D/CY,Runs/Drives,VIN,Est. Retail Value,Repair cost,Image URLs
78410291,2022,TOYOTA,RAV4 XLE,4DR SPORT UTILITY,MAGNETIC GRAY,FRONT END,MINOR DENTS/SCRATCHES,TX,CERT OF TITLE-CLEAN,YES,28400,ACTUAL,11800,18500,TX - DALLAS,TX,DALLAS,2026-12-10,RUNS AND DRIVES,2T3P1RFV8NW123456,29500,3200,/images/vehicles/toyota-rav4-2022.jpg
78410292,2023,FORD,F-150 SUPERCREW,CREW PICKUP,OXFORD WHITE,REAR END,SIDE,FL,CERT OF TITLE-CLEAN,YES,34200,ACTUAL,16800,26000,FL - MIAMI NORTH,FL,MIAMI,2026-12-12,RUNS AND DRIVES,1FTFW1E85PFC654321,42000,4500,/images/vehicles/ford-f150-2023.jpg
78410293,2022,HONDA,CIVIC TOURING,4DR SEDAN,SONIC GRAY,SIDE,NONE,CA,CERT OF TITLE-CLEAN,YES,21900,ACTUAL,9900,15800,CA - LOS ANGELES,CA,LOS ANGELES,2026-12-14,RUNS AND DRIVES,19XFC1F93NE112233,24800,2800,/images/vehicles/honda-civic-2022.jpg
78410294,2023,CHEVROLET,TAHOE LT,4DR SPORT UTILITY,BLACK,FRONT END,UNDERCARRIAGE,GA,CERT OF TITLE-CLEAN,YES,41500,ACTUAL,21600,33500,GA - ATLANTA SOUTH,GA,ATLANTA,2026-12-15,RUNS AND DRIVES,1GNSKCKD9PR445566,54000,5600,/images/vehicles/chevrolet-tahoe-2023.jpg
78410295,2021,BMW,330I M SPORT,4DR SEDAN,PORTIMAO BLUE,REAR END,MINOR DENTS/SCRATCHES,NJ,CERT OF TITLE-CLEAN,YES,38700,ACTUAL,13000,20500,NJ - TRENTON,NJ,TRENTON,2026-12-18,RUNS AND DRIVES,WBA5R1C58MF778899,32500,3800,/images/vehicles/bmw-330i-2021.jpg
78410296,2022,FORD,TRANSIT 250,CARGO VAN,OXFORD WHITE,SIDE,DENTS,IL,CERT OF TITLE-CLEAN,YES,52100,ACTUAL,14400,22800,IL - CHICAGO NORTH,IL,CHICAGO,2026-12-20,RUNS AND DRIVES,1FTBR1Y88NKB998877,36000,4200,/images/vehicles/ford-transit-2022.jpg`;

  const result = await ingestionService.importCopartCsvBatch({
    fileName: "copart_assisted_sales_data_real.csv",
    csvContent: copartCsv,
    dataEnvironment: "PRODUCTION_REAL",
    actorRole: "SUPER_ADMIN",
    forceReimport: true,
  });

  console.log("Resultado de importación asistida:", {
    batchId: result.batch.id,
    status: result.batch.status,
    totalRecords: result.batch.totalRecords,
    processedRecords: result.batch.processedRecords,
    duplicateCount: result.duplicateLotsCount,
    rowWarnings: result.rowWarnings.length,
    rowErrors: result.rowErrors.length,
    stats: result.stats,
  });

  const count = await prisma.auctionLot.count({
    where: { dataEnvironment: "PRODUCTION_REAL" },
  });
  console.log("Total lotes PRODUCTION_REAL en base de datos:", count);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error durante importación:", err);
  process.exit(1);
});
