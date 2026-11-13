import { prisma } from '../src/shared/db/prisma';

async function purgeDemoRecords() {
  console.log("Iniciando purga autorizada de registros sintéticos DEMO_SANDBOX...");

  const demoLots = await prisma.auctionLot.findMany({
    where: { dataEnvironment: "DEMO_SANDBOX" },
    select: { id: true, lotNumber: true, vehicleId: true }
  });

  console.log(`Encontrados ${demoLots.length} lotes DEMO_SANDBOX para purgar:`, demoLots.map(l => l.lotNumber));

  const lotIds = demoLots.map(l => l.id);
  const vehicleIds = demoLots.map(l => l.vehicleId).filter(Boolean) as string[];

  // 1. Eliminar medios asociados a lotes demo
  const deletedMedia = await prisma.vehicleMedia.deleteMany({
    where: { auctionLotId: { in: lotIds } }
  });
  console.log(`Fotografías/esquemas asociados eliminados: ${deletedMedia.count}`);

  // 2. Eliminar documentos asociados a lotes demo
  const deletedDocs = await prisma.vehicleDocument.deleteMany({
    where: { auctionLotId: { in: lotIds } }
  });
  console.log(`Documentos asociados eliminados: ${deletedDocs.count}`);

  // 3. Eliminar historial de cambios de lotes demo
  const deletedHistory = await prisma.lotChangeHistory.deleteMany({
    where: { auctionLotId: { in: lotIds } }
  });
  console.log(`Historiales de lotes demo eliminados: ${deletedHistory.count}`);

  // 4. Desvincular lotes de posibles estimaciones de costo
  const updatedEstimates = await prisma.costEstimate.updateMany({
    where: { auctionLotId: { in: lotIds } },
    data: { auctionLotId: null }
  });
  console.log(`Estimaciones de costo desvinculadas: ${updatedEstimates.count}`);

  // 5. Desvincular lotes de posibles solicitudes de cotización
  const updatedQuotes = await prisma.quoteRequest.updateMany({
    where: { auctionLotId: { in: lotIds } },
    data: { auctionLotId: null }
  });
  console.log(`Cotizaciones desvinculadas: ${updatedQuotes.count}`);

  // 6. Eliminar lotes demo
  const deletedLots = await prisma.auctionLot.deleteMany({
    where: { id: { in: lotIds } }
  });
  console.log(`Lotes demo eliminados de AuctionLot: ${deletedLots.count}`);

  // 7. Eliminar vehículos sintéticos asociados
  const deletedVehicles = await prisma.vehicle.deleteMany({
    where: { id: { in: vehicleIds } }
  });
  console.log(`Vehículos sintéticos eliminados de Vehicle: ${deletedVehicles.count}`);

  // 8. Verificar estado final de la base de datos
  const remainingLots = await prisma.auctionLot.count();
  const remainingVehicles = await prisma.vehicle.count();
  const remainingUsers = await prisma.user.count();

  console.log({
    status: "PURGE_COMPLETE",
    remainingLots,
    remainingVehicles,
    remainingUsers
  });
}

purgeDemoRecords()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
