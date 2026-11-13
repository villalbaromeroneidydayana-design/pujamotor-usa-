import crypto from "crypto";
import { prisma } from "./prisma";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";
import { NormalizedAuctionLotDTO } from "@/modules/ingestion/contracts/auction-provider.interface";
import { calculatorService } from "@/modules/calculator/calculator.service";
import { auditService } from "@/modules/admin/audit.service";
import {
  encryptPii,
  hashPassword,
  isEncryptedPii,
} from "@/shared/security/crypto-pii";

let isBootstrapped = false;

const INITIAL_RBAC_ROLES = [
  {
    email: "admin@autos-usa.internal",
    fullName: "Dirección General de Arquitectura",
    role: "SUPER_ADMIN",
  },
  {
    email: "inventario@autos-usa.internal",
    fullName: "Coordinación de Lotes e Ingesta",
    role: "INVENTORY_MANAGER",
  },
  {
    email: "comercial@autos-usa.internal",
    fullName: "Especialista en Logística y Exportación",
    role: "COMMERCIAL_ADVISOR",
  },
  {
    email: "auditoria@autos-usa.internal",
    fullName: "Auditoría Interna y Cumplimiento",
    role: "AUDITOR_READONLY",
  },
];

export async function ensureSystemBootstrapped() {
  if (isBootstrapped) return;

  // Asegurar que los 4 perfiles RBAC existan sin contraseñas predeterminadas en código
  for (const u of INITIAL_RBAC_ROLES) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const randomOneTimePassword = crypto.randomBytes(24).toString("base64url");
      await prisma.user.create({
        data: {
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          passwordHash: hashPassword(randomOneTimePassword),
          mustChangePassword: true,
          isActive: true,
        },
      });
    }
  }

  // Asegurar que cualquier registro existente en CustomerLead tenga sus datos sensibles cifrados con AES-256-GCM
  const allLeads = await prisma.customerLead.findMany();
  for (const lead of allLeads) {
    const needsEmailEnc = !isEncryptedPii(lead.email);
    const needsPhoneEnc = !isEncryptedPii(lead.phoneWhatsapp);
    if (needsEmailEnc || needsPhoneEnc) {
      await prisma.customerLead.update({
        where: { id: lead.id },
        data: {
          email: needsEmailEnc
            ? encryptPii(lead.email.trim().toLowerCase())
            : lead.email,
          phoneWhatsapp: needsPhoneEnc
            ? encryptPii(lead.phoneWhatsapp.trim())
            : lead.phoneWhatsapp,
        },
      });
    }
  }

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@autos-usa.internal" },
  });

  await vehicleEngineService.ensureDataSource("COPART_CSV_MEMBER");
  await vehicleEngineService.ensureDataSource("COPART_B2B_API");
  await vehicleEngineService.ensureDataSource("MANUAL_VERIFIED");
  await vehicleEngineService.ensureDataSource("DEMO_SANDBOX_GENERATOR");

  await calculatorService.ensureActiveTariffRuleSet();

  // Definición de las 7 Categorías Reales Automotrices de PUJAMOTOR USA
  const showcaseLots: NormalizedAuctionLotDTO[] = [
    // 1. PICKUPS
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410201",
      auctionHouse: "COPART",
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      yardZip: "77032",
      vin: "1FTFW1E85NFA10201",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "FORD",
      model: "F-150",
      trim: "XLT SUPERCREW 4X4",
      year: 2022,
      bodyStyle: "Pickups",
      engineSpec: "3.5L V6 EcoBoost Twin-Turbo",
      cylinders: 6,
      transmission: "AUTOMATIC 10-SPEED",
      drivetrain: "4WD",
      fuelType: "GASOLINE",
      exteriorColor: "OXFORD WHITE",
      manufacturedIn: "Dearborn, Michigan, USA",
      odometerValue: 28450,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "TX - CERT OF TITLE-SALVAGE",
      titleCategory: "SALVAGE",
      primaryDamage: "FRONT END",
      secondaryDamage: "MINOR DENTS/SCRATCHES",
      damageNotes: "Parachoques delantero y faro derecho afectados; bolsas de aire intactas.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 41200,
      repairCostEstimate: 5400,
      currentBidUsd: 15200,
      buyItNowPriceUsd: 19800,
      sellerType: "Insurance Company",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      saleStatus: "BUY_IT_NOW_AVAILABLE",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Pickups 4x4",
          url: "/media/authorized/pickup-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 2. SUV
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410202",
      auctionHouse: "COPART",
      yardName: "FL - MIAMI CENTRAL",
      yardState: "FL",
      yardCity: "MIAMI",
      yardZip: "33167",
      vin: "2T3P1RFV8PW10202",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "TOYOTA",
      model: "RAV4",
      trim: "HYBRID XLE AWD",
      year: 2023,
      bodyStyle: "SUV",
      engineSpec: "2.5L I4 Hybrid Synergy Drive",
      cylinders: 4,
      transmission: "ECVT AUTOMATIC",
      drivetrain: "AWD",
      fuelType: "HYBRID",
      exteriorColor: "MAGNETIC GRAY METALLIC",
      manufacturedIn: "Georgetown, Kentucky, USA",
      odometerValue: 16200,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "FL - CERT OF TITLE-SALVAGE",
      titleCategory: "SALVAGE",
      primaryDamage: "REAR END",
      secondaryDamage: "NONE",
      damageNotes: "Compuerta trasera y fascia posterior con impacto leve.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 33500,
      repairCostEstimate: 4100,
      currentBidUsd: 13400,
      buyItNowPriceUsd: null,
      sellerType: "Insurance Company",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — SUV Familiar",
          url: "/media/authorized/suv-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 3. VEHÍCULOS ELÉCTRICOS
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410203",
      auctionHouse: "COPART",
      yardName: "CA - LOS ANGELES",
      yardState: "CA",
      yardCity: "LOS ANGELES",
      yardZip: "90001",
      vin: "5YJ3E1EA5PF10203",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "TESLA",
      model: "MODEL 3",
      trim: "LONG RANGE AWD",
      year: 2023,
      bodyStyle: "Vehículos eléctricos",
      engineSpec: "Dual Motor Electric AWD",
      cylinders: 0,
      transmission: "SINGLE-SPEED DIRECT",
      drivetrain: "AWD",
      fuelType: "ELECTRIC",
      exteriorColor: "DEEP BLUE METALLIC",
      manufacturedIn: "Fremont, California, USA",
      odometerValue: 19400,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "CA - CLEAN TITLE",
      titleCategory: "CLEAN",
      primaryDamage: "SIDE",
      secondaryDamage: "UNDERCARRIAGE",
      damageNotes: "Puerta lateral izquierda reemplazable; paquete de batería intacto y verificado.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 35900,
      repairCostEstimate: 4800,
      currentBidUsd: 18900,
      buyItNowPriceUsd: 22500,
      sellerType: "Insurance Company",
      requiresBrokerLicense: false,
      auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Vehículos Eléctricos",
          url: "/media/authorized/electric-car-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 4. LOTE DE CONTROL INCOMPLETO (Para pruebas de completitud y seguridad)
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410204",
      auctionHouse: "COPART",
      yardName: "GA - SAVANNAH",
      yardState: "GA",
      yardCity: "SAVANNAH",
      vin: null,
      make: "CHEVROLET",
      model: "TAHOE RST",
      year: 2021,
      bodyStyle: "SUV FULL-SIZE",
      engineSpec: "5.3L V8 EcoTec3",
      odometerValue: null,
      titleCategory: "PENDING",
      primaryDamage: "UNKNOWN",
      runAndDriveStatus: "UNKNOWN",
      hasKeys: null,
      currentBidUsd: 16500,
      auctionDate: null,
    },

    // 4B. CAMIONETAS (FULL-SIZE VERIFICADA)
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410208",
      auctionHouse: "COPART",
      yardName: "GA - SAVANNAH",
      yardState: "GA",
      yardCity: "SAVANNAH",
      yardZip: "31405",
      vin: "1GNSKCKD4NR10208",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "CHEVROLET",
      model: "TAHOE",
      trim: "RST 4WD V8",
      year: 2022,
      bodyStyle: "Camionetas",
      engineSpec: "5.3L V8 EcoTec3",
      cylinders: 8,
      transmission: "AUTOMATIC 10-SPEED",
      drivetrain: "4WD",
      fuelType: "GASOLINE",
      exteriorColor: "SHADOW GRAY METALLIC",
      manufacturedIn: "Arlington, Texas, USA",
      odometerValue: 31200,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "GA - CERT OF TITLE-CLEAN",
      titleCategory: "CLEAN",
      primaryDamage: "MINOR DENTS/SCRATCHES",
      secondaryDamage: "NONE",
      damageNotes: "Vehículo en excelente estado operativo, recuperado de financiera.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 54000,
      repairCostEstimate: 1800,
      currentBidUsd: 26500,
      buyItNowPriceUsd: 31000,
      sellerType: "Financial Fleet",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Camionetas Full-Size",
          url: "/media/authorized/truck-heavy-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 5. AUTOMÓVILES (SEDÁN)
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410205",
      auctionHouse: "COPART",
      yardName: "FL - ORLANDO NORTH",
      yardState: "FL",
      yardCity: "ORLANDO",
      yardZip: "32750",
      vin: "4T1B11HK5NU10205",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "TOYOTA",
      model: "CAMRY",
      trim: "SE SEDAN",
      year: 2022,
      bodyStyle: "Automóviles",
      engineSpec: "2.5L 4-Cylinder DOHC",
      cylinders: 4,
      transmission: "AUTOMATIC 8-SPEED",
      drivetrain: "FWD",
      fuelType: "GASOLINE",
      exteriorColor: "CELESTIAL SILVER METALLIC",
      manufacturedIn: "Georgetown, Kentucky, USA",
      odometerValue: 24100,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "FL - CERT OF TITLE-CLEAN",
      titleCategory: "CLEAN",
      primaryDamage: "FRONT END",
      secondaryDamage: "NONE",
      damageNotes: "Impacto cosmético en rejilla y capó delantero. Radiador y motor operativos.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 25800,
      repairCostEstimate: 2900,
      currentBidUsd: 9800,
      buyItNowPriceUsd: 13200,
      sellerType: "Insurance Company",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Automóviles Sedán",
          url: "/media/authorized/sedan-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 6. VEHÍCULOS DE LUJO
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410206",
      auctionHouse: "COPART",
      yardName: "NJ - TRENTON",
      yardState: "NJ",
      yardCity: "TRENTON",
      yardZip: "08619",
      vin: "WBA5R7C55NF10206",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "BMW",
      model: "330I",
      trim: "XDRIVE M SPORT",
      year: 2023,
      bodyStyle: "Vehículos de lujo",
      engineSpec: "2.0L TwinPower Turbo I4",
      cylinders: 4,
      transmission: "STEPTRONIC 8-SPEED",
      drivetrain: "AWD",
      fuelType: "GASOLINE",
      exteriorColor: "PORTIMAO BLUE METALLIC",
      manufacturedIn: "San Luis Potosí, México",
      odometerValue: 18300,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "NJ - CERT OF TITLE-CLEAN",
      titleCategory: "CLEAN",
      primaryDamage: "SIDE",
      secondaryDamage: "MINOR DENTS/SCRATCHES",
      damageNotes: "Raspón en puerta trasera derecha; suspensión M Sport y tren motriz impecables.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 46200,
      repairCostEstimate: 3600,
      currentBidUsd: 21400,
      buyItNowPriceUsd: 26800,
      sellerType: "Insurance Company",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Vehículos de Lujo",
          url: "/media/authorized/luxury-sedan-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },

    // 7. VEHÍCULOS COMERCIALES
    {
      sourceCode: "DEMO_SANDBOX_GENERATOR",
      dataEnvironment: "DEMO_SANDBOX" as const,
      lotNumber: "DEMO-78410207",
      auctionHouse: "COPART",
      yardName: "IL - CHICAGO NORTH",
      yardState: "IL",
      yardCity: "CHICAGO",
      yardZip: "60090",
      vin: "1FTNE3Y89NKB10207",
      isVinMasked: false,
      vinDecodedByNhtsa: true,
      make: "FORD",
      model: "TRANSIT 250",
      trim: "HIGH ROOF CARGO VAN",
      year: 2022,
      bodyStyle: "Vehículos comerciales",
      engineSpec: "3.5L PFDi V6",
      cylinders: 6,
      transmission: "AUTOMATIC 10-SPEED",
      drivetrain: "RWD",
      fuelType: "GASOLINE",
      exteriorColor: "OXFORD WHITE",
      manufacturedIn: "Claycomo, Missouri, USA",
      odometerValue: 34500,
      odometerUnit: "MILES",
      odometerBrand: "ACTUAL",
      titleCode: "IL - CERT OF TITLE-CLEAN",
      titleCategory: "CLEAN",
      primaryDamage: "REAR END",
      secondaryDamage: "MINOR SCRATCHES",
      damageNotes: "Puerta posterior abollada; mampara divisoria y compartimento de carga en orden.",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      estimatedRetailValue: 38500,
      repairCostEstimate: 2400,
      currentBidUsd: 17200,
      buyItNowPriceUsd: 21500,
      sellerType: "Commercial Fleet",
      requiresBrokerLicense: true,
      auctionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      saleStatus: "UPCOMING",
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR" as const,
          title: "Ficha Técnica Homologada — Vehículos Comerciales",
          url: "/media/authorized/van-commercial-inspection.svg",
          originReference: "Activo técnico PUJAMOTOR USA",
          isAuthorizedCopy: true,
          isPrimary: true,
        },
      ],
    },
  ];

  for (const lotData of showcaseLots) {
    await vehicleEngineService.upsertVehicleAndLot(lotData, {
      actorUserId: adminUser.id,
      actorRole: "SUPER_ADMIN",
      changeSourceLabel: "DEMO_SANDBOX_SEED",
    });
  }

  await auditService.record({
    actorUserId: adminUser.id,
    actorRole: "SUPER_ADMIN",
    action: "PLATFORM_INITIALIZED",
    module: "ADMIN_SECURITY",
    targetType: "SystemConfig",
    targetId: "BOOTSTRAP",
    details: {
      message: "Catálogo PUJAMOTOR USA inicializado con las 7 categorías vehiculares homologadas.",
    },
  });

  isBootstrapped = true;
}
