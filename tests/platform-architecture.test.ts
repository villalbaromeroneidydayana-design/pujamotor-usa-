import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import {
  evaluateLotCompleteness,
  sanitizeCsvCell,
} from "@/modules/ingestion/validators/lot-completeness.validator";
import { copartCsvProvider } from "@/modules/ingestion/providers/copart-csv.provider";
import { copartB2bApiProvider } from "@/modules/ingestion/providers/copart-b2b-api.provider";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";
import { catalogService } from "@/modules/catalog/catalog.service";
import { calculatorService } from "@/modules/calculator/calculator.service";
import { crmService } from "@/modules/crm/crm.service";
import {
  authenticateUserCredentials,
  changeUserPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/modules/admin/auth.service";
import {
  decryptPii,
  encryptPii,
  hashPassword,
  isEncryptedPii,
  maskEmail,
  maskPhone,
  sanitizeAuditDetails,
  verifyPassword,
} from "@/shared/security/crypto-pii";
import { clearAllLoginRateLimits } from "@/shared/security/login-rate-limiter";
import { getEnv } from "@/config/env";
import { GET as getAdminAuth, POST as postAdminAuth } from "@/app/api/admin/auth/route";
import { GET as getAdminOverview } from "@/app/api/admin/overview/route";
import { POST as postAdminIngestion } from "@/app/api/admin/ingestion/route";
import { POST as postAdminVehicles } from "@/app/api/admin/vehicles/route";
import { GET as getCrmRoute, POST as postCrmRoute } from "@/app/api/crm/route";

let testInitialAdminPassword = "";

describe("AUTOS USA — Suite de Pruebas Aisladas de Seguridad, Integridad y Módulos", () => {
  beforeAll(async () => {
    // Garantizar que las pruebas corran exclusivamente sobre test_autos_usa.db
    expect(process.env.DATABASE_URL).toBe("file:./test_autos_usa.db");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: "file:./test_autos_usa.db" },
      stdio: "pipe",
    });
    await prisma.crmInteraction.deleteMany();
    await prisma.advisoryCase.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.customerLead.deleteMany();
    await ensureSystemBootstrapped();

    // Configurar credencial temporal aleatoria de prueba para verificar flujo de primer acceso
    testInitialAdminPassword = `TmpTest#${Date.now()}!Aa9`;
    await prisma.user.update({
      where: { email: "admin@autos-usa.internal" },
      data: {
        passwordHash: hashPassword(testInitialAdminPassword),
        mustChangePassword: true,
      },
    });
    clearAllLoginRateLimits();
  }, 30000);

  it("1. Seguridad CSV: Neutraliza fórmulas de inyección CSV (=, +, -, @)", () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe("CMD|' /C calc'!A0");
    expect(sanitizeCsvCell("+SUM(A1:A2)")).toBe("SUM(A1:A2)");
    expect(sanitizeCsvCell("-100+200")).toBe("100+200");
    expect(sanitizeCsvCell("@IMPORTXML()")).toBe("IMPORTXML()");
    expect(sanitizeCsvCell("FORD F-150")).toBe("FORD F-150");
  });

  it("2. Validador del Motor Central: Distingue CONFIRMED, PENDING_VERIFICATION e INCOMPLETE", () => {
    const incompleteResult = evaluateLotCompleteness({
      sourceCode: "MANUAL_VERIFIED",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber: "90001",
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      make: "FORD",
      model: "EXPLORER",
      year: 1900,
      titleCategory: "SALVAGE",
      primaryDamage: "UNKNOWN",
      runAndDriveStatus: "UNKNOWN",
      currentBidUsd: 4000,
    });
    expect(incompleteResult.status).toBe("INCOMPLETE");
    expect(incompleteResult.canBePublishedInCatalog).toBe(false);

    const pendingResult = evaluateLotCompleteness({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber: "90002",
      yardName: "FL - MIAMI",
      yardState: "FL",
      yardCity: "MIAMI",
      vin: "1FA6P8CF*H*******",
      isVinMasked: true,
      make: "FORD",
      model: "MUSTANG",
      year: 2022,
      odometerValue: 25000,
      titleCode: "FL - SALVAGE",
      titleCategory: "SALVAGE",
      primaryDamage: "FRONT END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      currentBidUsd: 11200,
      auctionDate: new Date("2026-12-20"),
    });
    expect(pendingResult.status).toBe("PENDING_VERIFICATION");
    expect(pendingResult.canBePublishedInCatalog).toBe(true);

    const confirmedResult = evaluateLotCompleteness({
      sourceCode: "MANUAL_VERIFIED",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber: "90003",
      yardName: "TX - DALLAS",
      yardState: "TX",
      yardCity: "DALLAS",
      vin: "1FTFW1E85NFA00009",
      isVinMasked: false,
      make: "FORD",
      model: "F-150",
      year: 2023,
      odometerValue: 14500,
      titleCode: "TX - SALVAGE TITLE",
      titleCategory: "SALVAGE",
      primaryDamage: "REAR END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      currentBidUsd: 18500,
      auctionDate: new Date("2026-12-22"),
      authorizedMedia: [
        {
          mediaType: "PHOTO_EXTERIOR",
          title: "Foto autorizada",
          url: "/media/authorized/pickup-inspection.svg",
          originReference: "Inspección autorizada",
          isAuthorizedCopy: true,
        },
      ],
    });
    expect(confirmedResult.status).toBe("CONFIRMED");
    expect(confirmedResult.missingFields.length).toBe(0);
  });

  it("3. Integración Copart: Parser CSV normaliza lotes y B2B API reporta estado real sin conexiones ficticias", () => {
    const csvSample = `Lot number,Year,Make,Model Detail,Damage Description,Sale Title State,Sale Title Type,Has Keys-Yes or No,Odometer,High Bid =non-vix,Buy-It-Now Price,Location state,Location city,Runs/Drives,VIN
88776655,2022,TOYOTA,TACOMA SR5,FRONT END,TX,CERT OF TITLE-SALVAGE,YES,41200,16400,21000,TX,HOUSTON,RUNS AND DRIVES,3TMCZ5AN8NM000123`;

    const parsed = copartCsvProvider.parseCsvContent(csvSample, "PRODUCTION_REAL");
    expect(parsed.totalRows).toBe(1);
    expect(parsed.validLots.length).toBe(1);
    expect(parsed.validLots[0].lotNumber).toBe("88776655");
    expect(parsed.validLots[0].currentBidUsd).toBe(16400);
    expect(parsed.validLots[0].buyItNowPriceUsd).toBe(21000);

    const b2bHealth = copartB2bApiProvider.getHealthStatus();
    expect(b2bHealth.providerCode).toBe("COPART_B2B_API");
    expect(b2bHealth.requiresExternalCredentials).toBe(true);
  });

  it("4. Transacciones ACID en Motor Central: Crea, actualiza con LotChangeHistory e impide vehículos huérfanos", async () => {
    const lotNumber = `REAL-TX-${Date.now()}`;

    const firstUpsert = await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      vin: "1FTFW1E85NFA99901",
      make: "FORD",
      model: "BRONCO SPORT",
      year: 2023,
      odometerValue: 12300,
      titleCode: "TX - SALVAGE",
      titleCategory: "SALVAGE",
      primaryDamage: "FRONT END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      currentBidUsd: 13500,
      buyItNowPriceUsd: 17500,
      auctionDate: new Date("2026-12-25"),
    });
    expect(firstUpsert.action).toBe("CREATED");

    // Actualización del mismo lote
    const secondUpsert = await vehicleEngineService.upsertVehicleAndLot({
      sourceCode: "COPART_CSV_MEMBER",
      dataEnvironment: "PRODUCTION_REAL",
      lotNumber,
      yardName: "TX - HOUSTON",
      yardState: "TX",
      yardCity: "HOUSTON",
      vin: "1FTFW1E85NFA99901",
      make: "FORD",
      model: "BRONCO SPORT",
      year: 2023,
      odometerValue: 12300,
      titleCode: "TX - SALVAGE",
      titleCategory: "SALVAGE",
      primaryDamage: "FRONT END",
      runAndDriveStatus: "RUNS_AND_DRIVES",
      hasKeys: true,
      currentBidUsd: 14900,
      buyItNowPriceUsd: 17500,
      auctionDate: new Date("2026-12-25"),
    });
    expect(secondUpsert.action).toBe("UPDATED");

    const detail = await catalogService.getLotDetailByNumber(lotNumber);
    expect(detail?.currentBidUsd).toBe(14900);
    expect(detail?.changeHistory.length).toBeGreaterThanOrEqual(2);

    // Comprobar que no existen vehículos huérfanos sin lote en la base de datos
    const orphanVehicles = await prisma.vehicle.findMany({
      where: { auctionLots: { none: {} } },
    });
    expect(orphanVehicles.length).toBe(0);
  });

  it("5. Separación de entornos y bloqueo de acceso público a lotes INCOMPLETE", async () => {
    const prodOnly = await catalogService.searchLots({
      dataEnvironmentFilter: "PRODUCTION_ONLY",
    });
    expect(prodOnly.every((l) => l.dataEnvironment === "PRODUCTION_REAL")).toBe(true);

    // El lote incompleto DEMO-78410204 no debe ser accesible en la vista pública
    const incompleteDetailPublic = await catalogService.getLotDetailByNumber("DEMO-78410204");
    expect(incompleteDetailPublic).toBeNull();

    // Pero sí es accesible cuando se solicita desde contexto administrativo (allowUnpublished: true)
    const incompleteDetailAdmin = await catalogService.getLotDetailByNumber("DEMO-78410204", {
      allowUnpublished: true,
    });
    expect(incompleteDetailAdmin).not.toBeNull();
    expect(incompleteDetailAdmin?.completenessStatus).toBe("INCOMPLETE");
  });

  it("6. Calculadora de Costos: Desglose exacto e inclusión obligatoria de aviso legal no vinculante", async () => {
    const sim = await calculatorService.calculateEstimate({
      bidAmountUsd: 10000,
      originState: "TX",
      destinationCountryCode: "MX",
      shippingModality: "RORO",
      includeBrokerFee: true,
      includeMarineInsurance: true,
      additionalCostsUsd: 150,
    });

    expect(sim.isBindingQuote).toBe(false);
    expect(sim.disclaimerText).toContain("ESTIMACIÓN REFERENCIAL NO VINCULANTE");
    expect(sim.breakdown.totalEstimatedUsd).toBeGreaterThan(13000);
  });

  it("7. Autenticación Real, Cambio Obligatorio en Primer Acceso, Expiración, Logout y Rate Limit", async () => {
    clearAllLoginRateLimits();
    const adminRecord = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@autos-usa.internal" },
    });
    expect(adminRecord.passwordHash.startsWith("scrypt$v1$")).toBe(true);
    expect(adminRecord.mustChangePassword).toBe(true);
    expect(verifyPassword(testInitialAdminPassword, adminRecord.passwordHash)).toBe(true);
    expect(verifyPassword("ClaveIncorrecta123", adminRecord.passwordHash)).toBe(false);

    // 1. Login con credencial temporal devuelve mustChangePassword = true
    const authResult = await authenticateUserCredentials(
      "admin@autos-usa.internal",
      testInitialAdminPassword,
      "10.0.0.1"
    );
    expect(authResult.user.role).toBe("SUPER_ADMIN");
    expect(authResult.user.mustChangePassword).toBe(true);

    // 2. Mientras mustChangePassword sea true, el acceso a endpoints operativos está bloqueado con HTTP 403
    const blockedOverviewReq = new NextRequest("http://localhost:3000/api/admin/overview", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${authResult.sessionToken}`,
      },
    });
    const blockedOverviewRes = await getAdminOverview(blockedOverviewReq);
    expect(blockedOverviewRes.status).toBe(403);
    const blockedBody = await blockedOverviewRes.json();
    expect(blockedBody.code).toBe("PASSWORD_CHANGE_REQUIRED");

    // 3. Cambio obligatorio de contraseña mediante POST /api/admin/auth (action: CHANGE_PASSWORD)
    const rotatedStrongPassword = `Rotada#${Date.now()}!Zz88`;
    const changePwdReq = new NextRequest("http://localhost:3000/api/admin/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${authResult.sessionToken}`,
      },
      body: JSON.stringify({
        action: "CHANGE_PASSWORD",
        currentPassword: testInitialAdminPassword,
        newPassword: rotatedStrongPassword,
      }),
    });
    const changePwdRes = await postAdminAuth(changePwdReq);
    expect(changePwdRes.status).toBe(200);
    const changePwdJson = await changePwdRes.json();
    expect(changePwdJson.user.mustChangePassword).toBe(false);

    // Verificar que ahora el nuevo token de sesión sí permite consultar /api/admin/overview
    const refreshedAuth = await authenticateUserCredentials(
      "admin@autos-usa.internal",
      rotatedStrongPassword,
      "10.0.0.1"
    );
    expect(refreshedAuth.user.mustChangePassword).toBe(false);
    const allowedOverviewReq = new NextRequest("http://localhost:3000/api/admin/overview", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${refreshedAuth.sessionToken}`,
      },
    });
    const allowedOverviewRes = await getAdminOverview(allowedOverviewReq);
    expect(allowedOverviewRes.status).toBe(200);

    // 4. Expiración de sesión y rechazo de token adulterado
    expect(verifySessionToken(`${refreshedAuth.sessionToken}tampered`)).toBeNull();
    const expiredToken = createSessionToken(refreshedAuth.user, -5000);
    expect(verifySessionToken(expiredToken)).toBeNull();
    const expiredReq = new NextRequest("http://localhost:3000/api/admin/overview", {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${expiredToken}`,
      },
    });
    const expiredRes = await getAdminOverview(expiredReq);
    expect(expiredRes.status).toBe(401);

    // 5. Cierre de sesión (LOGOUT) invalida la cookie con Max-Age=0
    const logoutReq = new NextRequest("http://localhost:3000/api/admin/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${refreshedAuth.sessionToken}`,
      },
      body: JSON.stringify({ action: "LOGOUT" }),
    });
    const logoutRes = await postAdminAuth(logoutReq);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers.get("set-cookie")).toContain("Max-Age=0");

    // 6. Protección contra intentos repetidos de inicio de sesión (Rate Limit / Lockout HTTP 429)
    for (let i = 0; i < 5; i++) {
      const failReq = new NextRequest("http://localhost:3000/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.77",
        },
        body: JSON.stringify({
          action: "LOGIN",
          email: "comercial@autos-usa.internal",
          password: `ClaveFallida#${i}`,
        }),
      });
      const failRes = await postAdminAuth(failReq);
      expect(failRes.status).toBe(401);
    }

    // El 6to intento debe ser bloqueado con HTTP 429 y cabecera Retry-After
    const lockedReq = new NextRequest("http://localhost:3000/api/admin/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "198.51.100.77",
      },
      body: JSON.stringify({
        action: "LOGIN",
        email: "comercial@autos-usa.internal",
        password: "OtraClaveFallida",
      }),
    });
    const lockedRes = await postAdminAuth(lockedReq);
    expect(lockedRes.status).toBe(429);
    expect(Number(lockedRes.headers.get("Retry-After"))).toBeGreaterThan(0);
    const lockedBody = await lockedRes.json();
    expect(lockedBody.code).toBe("TOO_MANY_LOGIN_ATTEMPTS");
    clearAllLoginRateLimits();
  });

  it("8. Protección de Endpoints: Usuario NO autenticado recibe HTTP 401 en rutas administrativas y listado CRM", async () => {
    const unauthOverviewReq = new NextRequest("http://localhost:3000/api/admin/overview");
    const overviewRes = await getAdminOverview(unauthOverviewReq);
    expect(overviewRes.status).toBe(401);

    const unauthCrmListReq = new NextRequest("http://localhost:3000/api/crm");
    const crmListRes = await getCrmRoute(unauthCrmListReq);
    expect(crmListRes.status).toBe(401);

    const unauthVehiclesReq = new NextRequest("http://localhost:3000/api/admin/vehicles", {
      method: "POST",
      body: JSON.stringify({
        action: "UPDATE_TARIFF_RULES",
        actorRole: "SUPER_ADMIN", // Intento de suplantar rol sin sesión
        gateFeeUsd: 99,
      }),
    });
    const vehiclesRes = await postAdminVehicles(unauthVehiclesReq);
    expect(vehiclesRes.status).toBe(401);
  });

  it("9. Control RBAC en Servidor: Impide que un usuario autenticado sin permisos ejecute acciones o suplante otro rol", async () => {
    const auditorUser = await prisma.user.findUniqueOrThrow({
      where: { email: "auditoria@autos-usa.internal" },
    });
    const auditorToken = createSessionToken({
      id: auditorUser.id,
      email: auditorUser.email,
      fullName: auditorUser.fullName,
      role: "AUDITOR_READONLY",
      mustChangePassword: false,
    });

    // El auditor intenta importar un CSV enviando actorRole: "SUPER_ADMIN" en el body
    const spoofedIngestionReq = new NextRequest("http://localhost:3000/api/admin/ingestion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${auditorToken}`,
      },
      body: JSON.stringify({
        action: "IMPORT_COPART_CSV",
        actorRole: "SUPER_ADMIN",
        csvContent: "Lot number,Year,Make,Model Detail\n123456,2022,FORD,F-150",
      }),
    });

    const ingestionRes = await postAdminIngestion(spoofedIngestionReq);
    expect(ingestionRes.status).toBe(403);

    // El auditor intenta procesar una cotización en el CRM
    const spoofedCrmReq = new NextRequest("http://localhost:3000/api/crm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${auditorToken}`,
      },
      body: JSON.stringify({
        action: "ADMIN_PROCESS_QUOTE",
        actorRole: "SUPER_ADMIN",
        quoteRequestId: "qualquiera",
        status: "CLOSED",
        advisorResponseNote: "Intento no autorizado",
      }),
    });

    const crmRes = await postCrmRoute(spoofedCrmReq);
    expect(crmRes.status).toBe(403);
  });

  it("10. Protección PII (AES-256-GCM), No Sobrescritura de Clientes y Enmascaramiento en Auditoría", async () => {
    // 1. Verificar cifrado y descifrado AES-256-GCM directo
    const cipherEmail = encryptPii("privado@cliente-vip.mx");
    expect(isEncryptedPii(cipherEmail)).toBe(true);
    expect(cipherEmail).not.toContain("privado@cliente-vip.mx");
    expect(decryptPii(cipherEmail)).toBe("privado@cliente-vip.mx");

    // 2. Verificar sanitización de detalles de auditoría
    const sanitized = sanitizeAuditDetails({
      email: "carlos@empresa.com",
      phoneWhatsapp: "+52 55 1234 5678",
      password: "SuperSecretPassword!",
      sessionToken: "jwt-secret-token",
    });
    expect(sanitized.email).toBe(maskEmail("carlos@empresa.com"));
    expect(sanitized.phoneWhatsapp).toBe("***-***-5678");
    expect(sanitized.password).toBe("[REDACTED_SECRET]");
    expect(sanitized.sessionToken).toBe("[REDACTED_SECRET]");

    // 3. Crear solicitud comercial y verificar que en SQLite el email y teléfono están cifrados con AES-256-GCM
    const uniqueEmail = `cliente.${Date.now()}@importaciones.mx`;
    const firstQuote = await crmService.createInquiryAndQuoteRequest({
      fullName: "Nombre Original Verificado",
      email: uniqueEmail,
      phoneWhatsapp: "+52 81 9988 7766",
      country: "MX",
      requestedServices: "FULL_IMPORT_ADVISORY",
      customerMessage: "Primera consulta legítima",
    });

    const rawDbLead = await prisma.customerLead.findUniqueOrThrow({
      where: { id: firstQuote.customerLeadId },
    });
    expect(isEncryptedPii(rawDbLead.email)).toBe(true);
    expect(isEncryptedPii(rawDbLead.phoneWhatsapp)).toBe(true);
    expect(rawDbLead.email).not.toContain(uniqueEmail);
    expect(rawDbLead.phoneWhatsapp).not.toContain("7766");
    expect(decryptPii(rawDbLead.email)).toBe(uniqueEmail);
    expect(decryptPii(rawDbLead.phoneWhatsapp)).toBe("+52 81 9988 7766");

    // 4. Enviar segunda solicitud con el mismo correo e intentar cambiar el nombre/teléfono:
    // Los datos originales del cliente NO deben sobrescribirse
    await crmService.createInquiryAndQuoteRequest({
      fullName: "Nombre Intruso No Verificado",
      email: uniqueEmail,
      phoneWhatsapp: "+1 000 000 0000",
      country: "CO",
      requestedServices: "VEHICLE_INSPECTION",
      customerMessage: "Segunda consulta con mismo correo",
    });

    const leadAfterSecondInquiry = await prisma.customerLead.findUniqueOrThrow({
      where: { id: firstQuote.customerLeadId },
    });
    expect(leadAfterSecondInquiry.fullName).toBe("Nombre Original Verificado");
    expect(decryptPii(leadAfterSecondInquiry.phoneWhatsapp)).toBe("+52 81 9988 7766");
    expect(leadAfterSecondInquiry.country).toBe("MX");

    // 5. Consulta pública por código de referencia minimiza datos personales
    const publicTracked = await crmService.getQuoteRequestByReference(
      firstQuote.referenceCode
    );
    expect(publicTracked).not.toBeNull();
    expect(publicTracked?.customerLead.fullName).toBe("N*** O*** V***");
    expect("email" in (publicTracked?.customerLead ?? {})).toBe(false);
    expect("phoneWhatsapp" in (publicTracked?.customerLead ?? {})).toBe(false);

    // 6. Verificar independencia y robustez de AUTH_SECRET y ENCRYPTION_KEY_PII
    const env = getEnv();
    expect(env.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.ENCRYPTION_KEY_PII.length).toBeGreaterThanOrEqual(32);
    expect(env.AUTH_SECRET).not.toBe(env.ENCRYPTION_KEY_PII);
  });
});
