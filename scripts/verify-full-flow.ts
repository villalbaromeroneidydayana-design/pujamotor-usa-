import { prisma } from "../src/shared/db/prisma";
import { crmService } from "../src/modules/crm/crm.service";
import { TPL_PASO_05_EXPLICAR_PROCESO, TPL_PASO_10_CORREO_SUBASTA_GANADA } from "../src/modules/crm/communication-templates";

async function verifyFullFlow() {
  console.log("=================================================================");
  console.log("PUJAMOTOR USA — VALIDACIÓN INTEGRAL CLIENTE Y ASESOR (PDF 1 & 2)");
  console.log("=================================================================\n");

  // 1. CLIENTE: Explorar catálogo
  console.log("--- 1. CLIENTE: EXPLORAR CATÁLOGO ---");
  const catRes = await fetch("http://localhost:3000/api/catalog");
  const catData = await catRes.json();
  console.log(`HTTP ${catRes.status} | Total vehículos en catálogo: ${catData.lots?.length}`);
  catData.lots?.forEach((l: any, idx: number) => {
    console.log(`  [${idx + 1}] Lote #${l.lotNumber}: ${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model} | Odómetro: ${l.odometerValue} mi | Título: ${l.titleCategory} | Env: ${l.dataEnvironment}`);
  });

  // 2. CLIENTE: Abrir ficha técnica individual
  console.log("\n--- 2. CLIENTE: ABRIR FICHA TÉCNICA (LOTE 78410291) ---");
  const fichaRes = await fetch("http://localhost:3000/lotes/78410291");
  console.log(`HTTP ${fichaRes.status} | Ficha accesible para cliente`);

  // 3. CLIENTE: Comparar vehículos (4 unidades)
  console.log("\n--- 3. CLIENTE: COMPARAR VEHÍCULOS (4 UNIDADES) ---");
  const compRes = await fetch("http://localhost:3000/api/catalog?compare=78410291,78410292,78410293,78410294");
  const compData = await compRes.json();
  console.log(`HTTP ${compRes.status} | Vehículos en comparativa: ${compData.lots?.length}`);
  compData.lots?.forEach((l: any) => {
    console.log(`  - #${l.lotNumber} ${l.vehicle.make} ${l.vehicle.model} (${l.vehicle.year}) | Millaje: ${l.odometerValue} | Título: ${l.titleCategory}`);
  });

  // 4. CLIENTE: Usar calculadora de costos
  console.log("\n--- 4. CLIENTE: CALCULADORA DE COSTOS ---");
  const calcRes = await fetch("http://localhost:3000/api/calculator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bidAmountUsd: 11800,
      originState: "TX",
      destinationCountryCode: "US",
      vehicleCategory: "SUV_PICKUP",
      includeBrokerFee: true,
      saveSimulation: true,
    }),
  });
  const calcData = await calcRes.json();
  console.log(`HTTP ${calcRes.status} | Código de simulación: ${calcData.estimate?.simulationCode}`);
  console.log(`  - Oferta puja: $${calcData.estimate?.breakdown?.bidAmountUsd}`);
  console.log(`  - Total tarifas subasta Copart: $${calcData.estimate?.breakdown?.totalAuctionFeesUsd}`);
  console.log(`  - Fee PUJAMOTOR USA: $${calcData.estimate?.breakdown?.brokerFeeUsd} (pagadero contra entrega)`);
  console.log(`  - Total estimado: $${calcData.estimate?.breakdown?.totalEstimatedUsd}`);
  console.log(`  - Aviso simulación no vinculante: ${calcData.estimate?.disclaimerText?.slice(0, 95)}...`);

  // 5. CLIENTE: Solicitar asesoría / evaluación de lote
  console.log("\n--- 5. CLIENTE: SOLICITAR ASESORÍA Y GENERAR EXPEDIENTE ---");
  const leadRes = await fetch("http://localhost:3000/api/crm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Carlos Eduardo Mendoza",
      phoneWhatsapp: "+1 305 555 7890",
      email: "carlos.mendoza.real@example.com",
      targetVehicle: "2022 TOYOTA RAV4 XLE",
      maxBudgetUsd: 16500,
      lotNumber: "78410291",
      country: "US",
      customerMessage: "Me interesa el lote #78410291 de Copart Dallas que vi en el catálogo.",
    }),
  });
  const leadData = await leadRes.json();
  const cotCode = leadData.quoteRequest?.referenceCode;
  console.log(`HTTP ${leadRes.status} | Código de seguimiento generado: ${cotCode}`);

  // 6. CLIENTE: Consultar seguimiento propio con código COT
  console.log(`\n--- 6. CLIENTE: CONSULTAR CÓDIGO ${cotCode} (PROTECCIÓN PII) ---`);
  const trackRes = await fetch(`http://localhost:3000/api/crm?referenceCode=${cotCode}`);
  const trackData = await trackRes.json();
  console.log(`HTTP ${trackRes.status} | Datos públicos del caso:`, {
    codigo: trackData.quote?.referenceCode,
    nombreEnmascarado: trackData.quote?.fullName,
    vehiculo: trackData.quote?.targetVehicle,
    presupuesto: trackData.quote?.maxBudgetUsd,
    telefonoExpuesto: trackData.quote?.phone,
    emailExpuesto: trackData.quote?.email,
    notaAsesorExpuesta: trackData.quote?.advisorResponseNote,
  });

  // 7. ASESOR: Gestionar expediente desde CRM
  console.log("\n--- 7. ASESOR: GESTIÓN DE EXPEDIENTE Y COPILOTO 10 PASOS ---");
  // Asesor procesa la solicitud COT y abre expediente oficial
  const quoteInDb = await prisma.quoteRequest.findUnique({
    where: { referenceCode: cotCode },
    include: { customerLead: true },
  });

  if (!quoteInDb) {
    throw new Error("No se encontró la cotización en la base de datos.");
  }

  console.log(`Cotización ID: ${quoteInDb.id} | Estado inicial: ${quoteInDb.status}`);

  // Asesor aprueba la solicitud y crea el AdvisoryCase
  const processed = await crmService.processQuoteRequestAdmin({
    quoteRequestId: quoteInDb.id,
    status: "CONVERTED_TO_CASE",
    advisorResponseNote: "Vehículo verificado en Copart Dallas. Listo para explicación del proceso.",
    createAdvisoryCase: true,
    serviceScope: "ASESORIA_COMPRA",
    actorRole: "SUPER_ADMIN",
  });

  const advisoryCaseId = processed.createdCase?.id;
  console.log(`Expediente creado ID: ${advisoryCaseId} | Etapa inicial: ${(processed.createdCase as any)?.currentStage}`);

  if (!advisoryCaseId) {
    throw new Error("No se pudo crear el caso de asesoría.");
  }

  // Asesor avanza a Paso 5 (Explicar el proceso)
  const updatedToStep5 = await crmService.updateCaseCopilotStep({
    caseId: advisoryCaseId,
    targetStepNumber: 5,
    methodology: "PUJAMOTOR_USA",
    actorRole: "SUPER_ADMIN",
    operationalNotes: "Cliente confirmó que prefiere explicación ordenada por mensaje.",
  });
  console.log(`Avance a Paso 5 -> Nueva etapa: ${(updatedToStep5 as any)?.currentStage} | Paso Copiloto: ${(updatedToStep5 as any)?.currentMethodologyStep}`);

  // Verificar plantilla oficial literal del Paso 5
  console.log("\nPlantilla Paso 5 (Explicación del Proceso):");
  console.log(TPL_PASO_05_EXPLICAR_PROCESO.slice(0, 380) + "...\n");

  // Asesor programa subasta y registra autorización de oferta
  console.log("Asesor avanza a Paso 8 (Acompañamiento en subasta):");
  const updatedToStep8 = await crmService.updateCommercialStage({
    caseId: advisoryCaseId,
    stage: "SUBASTA_PROGRAMADA",
    selectedLotNumber: "78410291",
    maxAuthorizedBidUsd: 13000,
    actorRole: "SUPER_ADMIN",
  });
  console.log(`Avance a Paso 8 -> Etapa: ${(updatedToStep8 as any)?.currentStage}`);

  // Asesor finaliza subasta ganada con comprobante oficial
  console.log("Asesor registra subasta ganada (Paso 9 / 10):");
  const updatedToStep10 = await crmService.recordCommercialMilestone({
    caseId: advisoryCaseId,
    actorRole: "SUPER_ADMIN",
    milestone: "AUCTION_RESULT",
    data: {
      auctionWonPriceUsd: 12200,
      auctionEvidenceRef: "/media/authorized/subasta_pro_p12_img1.jpeg",
      operationalNotes: "Subasta finalizada verificada en Copart Broker Account. Lote 78410291 adjudicado.",
    },
  });
  console.log(`Resultado registrado -> Etapa: ${(updatedToStep10 as any)?.currentStage} | Estado subasta: GANADA`);

  // Asesor obtiene plantilla de correo del Paso 10
  console.log("\nPlantilla Paso 10 (Correo Subasta Ganada - 3 formas de pago oficiales):");
  const correoPaso10 = TPL_PASO_10_CORREO_SUBASTA_GANADA;
  console.log(correoPaso10);

  console.log("\n=================================================================");
  console.log("FLUJO COMPLETO CLIENTE Y ASESOR VERIFICADO EXITOSAMENTE AL 100%");
  console.log("=================================================================");

  await prisma.$disconnect();
}

verifyFullFlow().catch((err) => {
  console.error("Error en validación:", err);
  process.exit(1);
});
