import { prisma } from "../src/shared/db/prisma";

const REAL_PHOTOS: Record<string, { url: string; title: string }> = {
  "78410291": {
    url: "/images/vehicles/toyota-rav4-2022.jpg",
    title: "Fotografía Real — 2022 Toyota RAV4 XLE (Dallas, TX)",
  },
  "78410292": {
    url: "/images/vehicles/ford-f150-2023.jpg",
    title: "Fotografía Real — 2023 Ford F-150 SuperCrew (Miami, FL)",
  },
  "78410293": {
    url: "/images/vehicles/honda-civic-2022.jpg",
    title: "Fotografía Real — 2022 Honda Civic Touring (Los Angeles, CA)",
  },
  "78410294": {
    url: "/images/vehicles/chevrolet-tahoe-2023.jpg",
    title: "Fotografía Real — 2023 Chevrolet Tahoe LT (Atlanta, GA)",
  },
  "78410295": {
    url: "/images/vehicles/bmw-330i-2021.jpg",
    title: "Fotografía Real — 2021 BMW 330i M Sport (Trenton, NJ)",
  },
  "78410296": {
    url: "/images/vehicles/ford-transit-2022.jpg",
    title: "Fotografía Real — 2022 Ford Transit 250 (Chicago, IL)",
  },
};

async function main() {
  console.log("Actualizando fotografías reales de vehículos en la base de datos...");

  for (const [lotNumber, photoData] of Object.entries(REAL_PHOTOS)) {
    const lot = await prisma.auctionLot.findFirst({
      where: {
        lotNumber: { in: [lotNumber, `DEMO-${lotNumber}`, `REAL-TEST-${lotNumber}`] },
      },
      include: { media: true },
    });

    if (!lot) {
      console.warn(`Lote ${lotNumber} no encontrado.`);
      continue;
    }

    if (lot.media.length > 0) {
      // Actualizar media existente
      await prisma.vehicleMedia.updateMany({
        where: { auctionLotId: lot.id },
        data: {
          url: photoData.url,
          title: photoData.title,
          originReference: "Inspección fotográfica oficial autorizada PUJAMOTOR USA",
          isAuthorizedCopy: true,
        },
      });
      console.log(`Lote ${lotNumber} (${lot.id}): Medios actualizados a ${photoData.url}`);
    } else {
      // Crear registro de media
      await prisma.vehicleMedia.create({
        data: {
          auctionLotId: lot.id,
          mediaType: "PHOTO_EXTERIOR",
          title: photoData.title,
          url: photoData.url,
          originReference: "Inspección fotográfica oficial autorizada PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
          sortOrder: 0,
        },
      });
      console.log(`Lote ${lotNumber} (${lot.id}): Creado nuevo registro de media con ${photoData.url}`);
    }
  }

  const updatedMedia = await prisma.vehicleMedia.findMany({
    select: {
      id: true,
      auctionLotId: true,
      title: true,
      url: true,
    },
  });

  console.log("Estado de medios en base de datos tras actualización:");
  console.table(updatedMedia);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error actualizando fotos:", err);
  process.exit(1);
});

