import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { prisma } from "@/shared/db/prisma";
import { calculatorService } from "@/modules/calculator/calculator.service";
import { crmService, COMMERCIAL_STAGES } from "@/modules/crm/crm.service";
import { COMMERCIAL_TEMPLATES } from "@/modules/crm/communication-templates";
import { decryptPii } from "@/shared/security/crypto-pii";

describe("AUTOS USA — FASE 3: Flujo Comercial Integral, Presentaciones y CRM", () => {
  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toBe("file:./test_autos_usa.db");
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: "file:./test_autos_usa.db" },
      stdio: "pipe",
    });

    // Limpiar datos de CRM de pruebas previas
    await prisma.clientPresentation.deleteMany();
    await prisma.crmInteraction.deleteMany();
    await prisma.advisoryCase.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.customerLead.deleteMany();
  }, 30000);

  // 1. Regla de Compra Inteligente (40% - 60% Retail y 60% - 75% Buy It Now)
  it("1. Calculadora Comercial: Calcula rangos de compra inteligente al 40%-60% minorista y 60%-75% Buy It Now", async () => {
    const simulation = await calculatorService.calculateEstimate({
      vehicleSummary: "2023 Toyota RAV4 XLE (Simulación Comercial)",
      bidAmountUsd: 12000,
      estimatedRetailValue: 28000,
      buyItNowPriceUsd: 16000,
      originState: "FL",
      destinationCountryCode: "MX",
    });

    expect(simulation.targetBidRange).toBeDefined();
    expect(simulation.targetBidRange?.minPercent).toBe(40);
    expect(simulation.targetBidRange?.maxPercent).toBe(60);
    // 28,000 * 0.40 = 11,200
    expect(simulation.targetBidRange?.minBidUsd).toBe(11200);
    // 28,000 * 0.60 = 16,800
    expect(simulation.targetBidRange?.maxBidUsd).toBe(16800);
    expect(simulation.targetBidRange?.disclaimer).toContain("40% al 60%");

    expect(simulation.buyItNowGuideline).toBeDefined();
    // 16,000 * 0.60 = 9,600
    expect(simulation.buyItNowGuideline?.minBidUsd).toBe(9600);
    // 16,000 * 0.75 = 12,000
    expect(simulation.buyItNowGuideline?.maxBidUsd).toBe(12000);
    expect(simulation.buyItNowGuideline?.disclaimer).toContain("60% al 75%");
  });

  // 2. Registro de Lead con Criterios Comerciales y Protección PII
  it("2. CRM: Registra prospecto con criterios comerciales (vehículo, año mínimo, presupuesto) y cifra PII", async () => {
    const inquiry = await crmService.createInquiryAndQuoteRequest({
      fullName: "Carlos Eduardo Mendoza",
      email: "carlos.mendoza@comercializadora.com",
      phoneWhatsapp: "+52 81 1234 5678",
      country: "MX",
      city: "Monterrey",
      customerType: "INDIVIDUAL_BUYER",
      requestedServices: "FULL_IMPORT_ADVISORY",
      targetVehicle: "Toyota RAV4 o Honda CR-V",
      minYear: 2020,
      maxBudgetUsd: 18500,
      customerMessage: "Interesado en vehículo para importación definitiva a México.",
    });

    expect(inquiry.id).toBeDefined();
    expect(inquiry.customerLead.fullName).toBe("Carlos Eduardo Mendoza");
    // Comprobar que en memoria del retorno PII viene enmascarado
    expect(inquiry.customerLead.email).toContain("***");
    expect(inquiry.customerLead.phoneWhatsapp).toContain("***");

    // Verificar en la base de datos que está cifrado con AES-256-GCM
    const rawLead = await prisma.customerLead.findUniqueOrThrow({
      where: { id: inquiry.customerLeadId },
    });
    expect(rawLead.email.startsWith("enc:gcm:v1:")).toBe(true);
    expect(rawLead.phoneWhatsapp.startsWith("enc:gcm:v1:")).toBe(true);
    expect(rawLead.targetVehicle).toBe("Toyota RAV4 o Honda CR-V");
    expect(rawLead.minYear).toBe(2020);
    expect(rawLead.maxBudgetUsd).toBe(18500);

    // Verificar descifrado
    expect(decryptPii(rawLead.email)).toBe("carlos.mendoza@comercializadora.com");
  });

  // 3. Regla Estricta: Presentación Personalizada Requiere Entre 4 y 7 Vehículos
  it("3. Presentación Personalizada: Valida rango de 4 a 7 alternativas, genera código y enlace exclusivo", async () => {
    // Crear 5 lotes de prueba para la selección
    const runId = Date.now();
    const createdLots = [];
    for (let i = 1; i <= 5; i++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          internalCode: `TEST-COMM-${runId}-${i}`,
          make: i % 2 === 0 ? "Toyota" : "Honda",
          model: i % 2 === 0 ? "RAV4" : "CR-V",
          year: 2020 + i,
          dataEnvironment: "DEMO_SANDBOX",
        },
      });

      const dataSource = await prisma.dataSource.upsert({
        where: { code: "DEMO_SANDBOX_GENERATOR" },
        update: {},
        create: {
          code: "DEMO_SANDBOX_GENERATOR",
          name: "Generador de Demostración",
          integrationType: "SANDBOX",
        },
      });

      const lot = await prisma.auctionLot.create({
        data: {
          vehicleId: vehicle.id,
          dataSourceId: dataSource.id,
          lotNumber: `COMM-${runId}-${i}`,
          yardName: "TX - HOUSTON",
          yardState: "TX",
          yardCity: "Houston",
          titleCategory: i === 1 ? "CLEAN" : "SALVAGE",
          primaryDamage: "Rear End",
          runAndDriveStatus: "RUNS_AND_DRIVES",
          estimatedRetailValue: 24000 + i * 1000,
          currentBidUsd: 8000 + i * 500,
          dataEnvironment: "DEMO_SANDBOX",
          completenessStatus: "CONFIRMED",
        },
      });
      createdLots.push(lot);
    }

    const lead = await prisma.customerLead.findFirstOrThrow();

    // 3A. Intentar crear con solo 2 lotes -> DEBE FALLAR
    await expect(
      crmService.createClientPresentation({
        customerLeadId: lead.id,
        lotNumbers: [createdLots[0].lotNumber, createdLots[1].lotNumber],
        actorRole: "COMMERCIAL_ADVISOR",
      })
    ).rejects.toThrow("requiere entre 4 y 7 vehículos");

    // 3B. Crear con 4 lotes válidos -> DEBE TENER ÉXITO
    const validSelection = createdLots.slice(0, 4).map((l) => l.lotNumber);
    const presResult = await crmService.createClientPresentation({
      customerLeadId: lead.id,
      lotNumbers: validSelection,
      title: "Selección de 4 SUVs para Carlos Mendoza",
      notes: "Vehículos con historial comprobable y encendido verificado.",
      advisorName: "Ricardo Asesor",
      baseUrl: "https://autosusa.com",
      actorRole: "COMMERCIAL_ADVISOR",
    });

    expect(presResult.presentation.presentationCode).toMatch(/^PRES-2026-\d{5}$/);
    expect(presResult.publicUrl).toContain(`/presentacion/${presResult.presentation.presentationCode}`);
    expect(presResult.whatsappMessage).toContain("Tu Selección Personalizada");
    expect(presResult.whatsappMessage).toContain(presResult.presentation.presentationCode);

    // 3C. Consulta pública de la presentación
    const publicView = await crmService.getPublicPresentation(
      presResult.presentation.presentationCode
    );
    expect(publicView).toBeDefined();
    expect(publicView?.presentationCode).toBe(presResult.presentation.presentationCode);
    expect(publicView?.vehicles.length).toBe(4);
    // No debe exponer nombre completo sin enmascarar
    expect(publicView?.client.maskedName).toContain("***");
    // Debe incluir rangos orientativos de 40%-60%
    expect(publicView?.vehicles[0].targetBidRange?.minPercent).toBe(40);
    expect(publicView?.vehicles[0].targetBidRange?.maxPercent).toBe(60);
  });

  // 4. Ciclo Comercial de 11 Etapas y Alerta de Cliente Pensando
  it("4. Flujo Comercial: Recorre las 11 etapas y activa alerta de 2-4 días para CLIENTE_PENSANDO", async () => {
    const lead = await prisma.customerLead.findFirstOrThrow();

    const advisoryCase = await prisma.advisoryCase.create({
      data: {
        caseNumber: "EXP-2026-TEST01",
        customerLeadId: lead.id,
        serviceScope: "LLAVE_EN_MANO",
        stage: "CONTACTO_INICIAL",
        destinationCountry: "MX",
      },
    });

    // Validar las 11 etapas definidas
    expect(COMMERCIAL_STAGES.length).toBe(12); // 11 etapas + CLIENTE_PENSANDO
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("CONTACTO_INICIAL");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("CRITERIOS_DEFINIDOS");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("BUSQUEDA_DE_VEHICULOS");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("ALTERNATIVAS_ENVIADAS");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("VEHICULO_SELECCIONADO");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("ASESORIA_Y_CONTRATO");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("OFERTA_AUTORIZADA");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("SUBASTA_EN_SEGUIMIENTO");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("RESULTADO_DE_SUBASTA");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("TRANSPORTE_Y_ENTREGA");
    expect(COMMERCIAL_STAGES.map((s) => s.code)).toContain("OPERACION_CERRADA");

    // Avanzar a CLIENTE_PENSANDO con alerta a los 3 días
    const updated = await crmService.updateCommercialStage({
      caseId: advisoryCase.id,
      stage: "CLIENTE_PENSANDO",
      isThinking: true,
      followUpDays: 3,
      operationalNotes: "El cliente revisará las 4 alternativas con su socio.",
      actorRole: "COMMERCIAL_ADVISOR",
    });

    expect(updated.isThinking).toBe(true);
    expect(updated.nextFollowUpAt).toBeDefined();

    // Comprobar que la fecha de recontacto está programada aproximadamente a 3 días
    const diffDays = Math.round(
      (updated.nextFollowUpAt!.getTime() - updated.lastContactAt!.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(3);

    // Avanzar a OFERTA_AUTORIZADA con tope de puja
    const authorized = await crmService.updateCommercialStage({
      caseId: advisoryCase.id,
      stage: "OFERTA_AUTORIZADA",
      isThinking: false,
      maxAuthorizedBidUsd: 13500,
      operationalNotes: "Tope de puja formalmente autorizado por escrito.",
      actorRole: "COMMERCIAL_ADVISOR",
    });

    expect(authorized.stage).toBe("OFERTA_AUTORIZADA");
    expect(authorized.isThinking).toBe(false);
    expect(authorized.maxAuthorizedBidUsd).toBe(13500);
  });

  // 5. Hitos Comerciales: Evidencia de Subasta y Comisión Broker Configurable
  it("5. Hitos Comerciales: Exige comprobante oficial verificable para resultado de subasta y comisión flexible", async () => {
    const advisoryCase = await prisma.advisoryCase.findFirstOrThrow();

    // 5A. Intento de registrar resultado de subasta sin evidencia verificable -> DEBE FALLAR
    await expect(
      crmService.recordCommercialMilestone({
        caseId: advisoryCase.id,
        milestone: "AUCTION_RESULT",
        data: {
          auctionWonPriceUsd: 12800,
          // Falta auctionEvidenceRef
        },
        actorRole: "COMMERCIAL_ADVISOR",
      })
    ).rejects.toThrow("Se requiere un número de comprobante");

    // 5B. Registro exitoso con número de factura oficial de Copart
    const recordedResult = await crmService.recordCommercialMilestone({
      caseId: advisoryCase.id,
      milestone: "AUCTION_RESULT",
      data: {
        auctionWonPriceUsd: 12800,
        auctionEvidenceRef: "COPART-INV-OFFICIAL-2026-9901",
        operationalNotes: "Lote adjudicado por debajo del tope autorizado ($12,800 vs $13,500).",
      },
      actorRole: "COMMERCIAL_ADVISOR",
    });

    expect(recordedResult.auctionEvidenceRef).toBe("COPART-INV-OFFICIAL-2026-9901");
    expect(recordedResult.auctionWonPriceUsd).toBe(12800);

    // 5C. Comisión de broker configurable por acuerdo
    const recordedFee = await crmService.recordCommercialMilestone({
      caseId: advisoryCase.id,
      milestone: "BROKER_FEE_SET",
      data: {
        brokerFeeAgreedUsd: 450, // Tarifa pactada libremente
      },
      actorRole: "COMMERCIAL_ADVISOR",
    });

    expect(recordedFee.brokerFeeAgreedUsd).toBe(450);
  });

  // 6. Catálogo de Guiones y Plantillas Comerciales
  it("6. Comunicaciones: Cuenta con las 10 plantillas comerciales de los procedimientos de referencia", () => {
    expect(COMMERCIAL_TEMPLATES.length).toBeGreaterThanOrEqual(10);

    const templateIds = COMMERCIAL_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain("TPL_01_SALUDO_INICIAL");
    expect(templateIds).toContain("TPL_02_CALIFICACION_NECESIDAD");
    expect(templateIds).toContain("TPL_03_ENVIO_ALTERNATIVAS");
    expect(templateIds).toContain("TPL_04_INVITACION_LLAMADA");
    expect(templateIds).toContain("TPL_05_EXPLICACION_PROCESO_CONTRATO");
    expect(templateIds).toContain("TPL_06_SOLICITUD_DOCUMENTOS");
    expect(templateIds).toContain("TPL_07_CONFIRMACION_OFERTA_MAXIMA");
    expect(templateIds).toContain("TPL_08_ACTUALIZACION_EN_VIVO");
    expect(templateIds).toContain("TPL_09_RESULTADO_ADJUDICADO");
    expect(templateIds).toContain("TPL_10_SEGUIMIENTO_CLIENTE_PENSANDO");

    // Verificar interpolación
    const saludo = COMMERCIAL_TEMPLATES[0].generateText({
      clientName: "Alejandro",
      advisorName: "Carlos R.",
    });
    expect(saludo).toContain("¡Hola Alejandro!");
    expect(saludo).toContain("Carlos R.");
    expect(saludo).toContain("PUJAMOTOR USA");
  });
});
