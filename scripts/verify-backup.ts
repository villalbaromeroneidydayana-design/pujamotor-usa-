import { PrismaClient } from '@prisma/client';

const backupPrisma = new PrismaClient({
  datasources: {
    db: { url: 'file:./backups/autos_usa_pre_demo_purge_20261113082527.db' },
  },
});

async function main() {
  const users = await backupPrisma.user.count();
  const lots = await backupPrisma.auctionLot.count();
  const vehicles = await backupPrisma.vehicle.count();
  const leads = await backupPrisma.customerLead.count();
  const quotes = await backupPrisma.quoteRequest.count();

  console.log(
    JSON.stringify({
      status: 'BACKUP_VERIFIED',
      users,
      lots,
      vehicles,
      leads,
      quotes,
    }, null, 2)
  );
}

main().finally(async () => {
  await backupPrisma.$disconnect();
});

