import { prisma } from "@/shared/db/prisma";
import { auditService } from "@/modules/admin/audit.service";
import { UserRole } from "@/modules/admin/auth.service";
import { calculatorService } from "@/modules/calculator/calculator.service";
import {
  decryptPii,
  encryptPii,
  maskEmail,
  maskPhone,
} from "@/shared/security/crypto-pii";
import { COMMERCIAL_TEMPLATES } from "./communication-templates";
import { ALL_METHODOLOGIES } from "./methodologies.data";

export const COMMERCIAL_STAGES = [
  { code: "CONTACTO_INICIAL", label: "1. Contacto Inicial", order: 1 },
  { code: "CRITERIOS_DEFINIDOS", label: "2. Criterios Definidos", order: 2 },
  { code: "BUSQUEDA_DE_VEHICULOS", label: "3. Búsqueda de Vehículos", order: 3 },
  { code: "ALTERNATIVAS_ENVIADAS", label: "4. Alternativas Enviadas (4 a 7)", order: 4 },
  { code: "VEHICULO_SELECCIONADO", label: "5. Vehículo Seleccionado", order: 5 },
  { code: "ASESORIA_Y_CONTRATO", label: "6. Asesoría y Contrato", order: 6 },
  { code: "OFERTA_AUTORIZADA", label: "7. Oferta Máxima Autorizada", order: 7 },
  { code: "SUBASTA_EN_SEGUIMIENTO", label: "8. Subasta en Seguimiento", order: 8 },
  { code: "RESULTADO_DE_SUBASTA", label: "9. Resultado de Subasta", order: 9 },
  { code: "TRANSPORTE_Y_ENTREGA", label: "10. Transporte y Entrega", order: 10 },
  { code: "OPERACION_CERRADA", label: "11. Operación Cerrada", order: 11 },
  { code: "CLIENTE_PENSANDO", label: "★ En Seguimiento (Pensando)", order: 99 },
] as const;

export type CommercialStageCode = (typeof COMMERCIAL_STAGES)[number]["code"];

export interface CreateQuoteInquiryInput {
  fullName: string;
  email: string;
  phoneWhatsapp: string;
  country: string;
  city?: string;
  companyName?: string;
  customerType?: "INDIVIDUAL_BUYER" | "DEALER" | "IMPORTER" | "WORKSHOP";
  lotNumber?: string;
  requestedServices:
    | "FULL_IMPORT_ADVISORY"
    | "AUCTION_BIDDING_ONLY"
    | "INLAND_AND_OCEAN_LOGISTICS"
    | "VEHICLE_INSPECTION";
  maxBudgetUsd?: number;
  customerMessage?: string;
  targetVehicle?: string;
  minYear?: number;
  leadSource?: string;
}

export interface CreatePresentationInput {
  customerLeadId: string;
  advisoryCaseId?: string;
  lotNumbers: string[]; // Entre 4 y 7 lotes
  title?: string;
  notes?: string;
  targetBidMinPercent?: number; // default 40
  targetBidMaxPercent?: number; // default 60
  advisorName?: string;
  advisorPhone?: string;
  baseUrl?: string;
  actorUserId?: string | null;
  actorRole: UserRole;
}

export class CrmService {
  /**
   * Busca un prospecto existente comparando el correo electrónico descifrado en memoria.
   */
  private async findLeadByNormalizedEmail(normalizedEmail: string) {
    const allLeads = await prisma.customerLead.findMany();
    return (
      allLeads.find(
        (item) => decryptPii(item.email).trim().toLowerCase() === normalizedEmail
      ) ?? null
    );
  }

  /**
   * Registra un interesado cifrando sus datos personales con AES-256-GCM.
   * Si el correo ya existe, vincula la nueva solicitud sin sobrescribir los datos originales del cliente.
   */
  async createInquiryAndQuoteRequest(input: CreateQuoteInquiryInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phoneWhatsapp.trim();
    const cleanName = input.fullName.trim();
    const cleanCountry = input.country.trim().toUpperCase();

    let lead = await this.findLeadByNormalizedEmail(normalizedEmail);
    let wasExistingLead = false;

    if (!lead) {
      lead = await prisma.customerLead.create({
        data: {
          fullName: cleanName,
          email: encryptPii(normalizedEmail),
          phoneWhatsapp: encryptPii(cleanPhone),
          country: cleanCountry,
          city: input.city?.trim() || null,
          companyName: input.companyName?.trim() || null,
          customerType: input.customerType ?? "INDIVIDUAL_BUYER",
          leadSource: input.leadSource || (input.lotNumber ? "CATALOG_INQUIRY" : "DIRECT_ADVISORY"),
          status: "NEW",
          targetVehicle: input.targetVehicle?.trim() || null,
          minYear: input.minYear ? Number(input.minYear) : null,
          maxBudgetUsd: input.maxBudgetUsd ? Number(input.maxBudgetUsd) : null,
          consentPrivacy: true,
        },
      });
    } else {
      wasExistingLead = true;
      // Regla de integridad: NO sobrescribir fullName, phoneWhatsapp ni country originales
      // Actualizar criterios comerciales si no estaban definidos
      if (input.targetVehicle || input.minYear || input.maxBudgetUsd) {
        await prisma.customerLead.update({
          where: { id: lead.id },
          data: {
            targetVehicle: input.targetVehicle?.trim() || lead.targetVehicle,
            minYear: input.minYear ? Number(input.minYear) : lead.minYear,
            maxBudgetUsd: input.maxBudgetUsd ? Number(input.maxBudgetUsd) : lead.maxBudgetUsd,
          },
        });
      }
    }

    let linkedLot = null;
    let savedEstimateId: string | null = null;

    if (input.lotNumber) {
      linkedLot = await prisma.auctionLot.findUnique({
        where: { lotNumber: input.lotNumber.trim() },
        include: { vehicle: true },
      });

      if (linkedLot) {
        const estimate = await calculatorService.calculateEstimate({
          auctionLotId: linkedLot.id,
          vehicleSummary: `${linkedLot.vehicle.year} ${linkedLot.vehicle.make} ${linkedLot.vehicle.model} (Lote #${linkedLot.lotNumber})`,
          bidAmountUsd:
            linkedLot.currentBidUsd > 0
              ? linkedLot.currentBidUsd
              : linkedLot.buyItNowPriceUsd ?? 5500,
          originState: linkedLot.yardState,
          destinationCountryCode: cleanCountry,
          saveSimulation: true,
        });
        savedEstimateId = estimate.id;
      }
    }

    const referenceCode = `COT-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        referenceCode,
        customerLeadId: lead.id,
        auctionLotId: linkedLot?.id ?? null,
        costEstimateId: savedEstimateId,
        requestedServices: input.requestedServices,
        destinationCountry: cleanCountry,
        maxBudgetUsd: input.maxBudgetUsd ?? null,
        customerMessage: input.customerMessage?.trim() || null,
        status: "PENDING_REVIEW",
      },
      include: {
        customerLead: true,
        auctionLot: { include: { vehicle: true } },
        costEstimate: true,
      },
    });

    await prisma.crmInteraction.create({
      data: {
        customerLeadId: lead.id,
        channel: "WEB_FORM",
        direction: "INBOUND",
        subject: `Solicitud comercial ${referenceCode} (${input.requestedServices})`,
        content:
          input.customerMessage?.trim() ||
          `Solicitud de información recibida para ${
            linkedLot
              ? `Lote #${linkedLot.lotNumber} (${linkedLot.vehicle.year} ${linkedLot.vehicle.make} ${linkedLot.vehicle.model})`
              : "asesoría general de importación"
          }.${
            wasExistingLead
              ? ` [Cliente recurrente verificado; datos originales preservados]`
              : ""
          }`,
      },
    });

    // El servicio de auditoría enmascara automáticamente email y teléfono
    await auditService.record({
      actorRole: "PUBLIC_VISITOR",
      action: "QUOTE_REQUEST_SUBMITTED",
      module: "CRM",
      targetType: "QuoteRequest",
      targetId: quoteRequest.id,
      details: {
        referenceCode,
        customerEmail: maskEmail(normalizedEmail),
        customerPhone: maskPhone(cleanPhone),
        lotNumber: linkedLot?.lotNumber ?? null,
        requestedServices: input.requestedServices,
        wasExistingLead,
      },
    });

    return {
      ...quoteRequest,
      customerLead: {
        ...quoteRequest.customerLead,
        email: maskEmail(normalizedEmail),
        phoneWhatsapp: maskPhone(cleanPhone),
      },
    };
  }

  /**
   * Consulta pública de seguimiento de una solicitud por su código de referencia (COT-2026-XXXXX).
   * Minimización estricta de datos: jamás expone correo electrónico, teléfono ni nombre completo sin enmascarar.
   */
  async getQuoteRequestByReference(referenceCode: string) {
    const record = await prisma.quoteRequest.findUnique({
      where: { referenceCode: referenceCode.trim().toUpperCase() },
      include: {
        customerLead: {
          select: {
            fullName: true,
            country: true,
            customerType: true,
            status: true,
            targetVehicle: true,
            minYear: true,
            maxBudgetUsd: true,
          },
        },
        auctionLot: {
          select: {
            lotNumber: true,
            yardName: true,
            currentBidUsd: true,
            vehicle: {
              select: {
                year: true,
                make: true,
                model: true,
              },
            },
          },
        },
        costEstimate: {
          select: {
            simulationCode: true,
            totalEstimatedUsd: true,
          },
        },
      },
    });

    if (!record) return null;

    // Enmascarar el nombre en la vista pública para mostrar solo iniciales + país
    const maskedName = record.customerLead.fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0]?.toUpperCase() ?? ""}***`)
      .join(" ");

    return {
      id: record.id,
      referenceCode: record.referenceCode,
      requestedServices: record.requestedServices,
      destinationCountry: record.destinationCountry,
      maxBudgetUsd: record.maxBudgetUsd,
      status: record.status,
      advisorResponseNote: record.advisorResponseNote,
      createdAt: record.createdAt,
      customerLead: {
        fullName: maskedName,
        country: record.customerLead.country,
        customerType: record.customerLead.customerType,
        status: record.customerLead.status,
        targetVehicle: record.customerLead.targetVehicle,
        minYear: record.customerLead.minYear,
        maxBudgetUsd: record.customerLead.maxBudgetUsd,
      },
      auctionLot: record.auctionLot,
      costEstimate: record.costEstimate,
    };
  }

  /**
   * Genera una presentación comercial personalizada para el cliente con entre 4 y 7 alternativas de vehículos.
   * Produce un enlace exclusivo y un resumen formateado para WhatsApp.
   */
  async createClientPresentation(input: CreatePresentationInput) {
    const uniqueLotNumbers = Array.from(
      new Set(input.lotNumbers.map((l) => l.trim()).filter(Boolean))
    );

    if (uniqueLotNumbers.length < 4 || uniqueLotNumbers.length > 7) {
      throw new Error(
        `La presentación personalizada requiere entre 4 y 7 vehículos seleccionados (recibidos: ${uniqueLotNumbers.length}).`
      );
    }

    const lead = await prisma.customerLead.findUnique({
      where: { id: input.customerLeadId },
    });
    if (!lead) {
      throw new Error("Cliente prospecto no encontrado.");
    }

    // Validar que los lotes existan en la base de datos
    const foundLots = await prisma.auctionLot.findMany({
      where: { lotNumber: { in: uniqueLotNumbers } },
      include: { vehicle: true },
    });

    if (foundLots.length !== uniqueLotNumbers.length) {
      const foundNumbers = new Set(foundLots.map((l) => l.lotNumber));
      const missing = uniqueLotNumbers.filter((l) => !foundNumbers.has(l));
      throw new Error(`Los siguientes lotes no fueron encontrados: ${missing.join(", ")}`);
    }

    const minPct = input.targetBidMinPercent ?? 40;
    const maxPct = input.targetBidMaxPercent ?? 60;

    // Regla no negociable de Presupuesto (PDF 1): El valor a ofertar nunca puede superar el presupuesto del cliente
    if (lead.maxBudgetUsd) {
      for (const lot of foundLots) {
        if (lot.estimatedRetailValue) {
          const maxCalculatedBid = Math.round(lot.estimatedRetailValue * (maxPct / 100));
          if (maxCalculatedBid > lead.maxBudgetUsd) {
            throw new Error(
              `Operación bloqueada: El rango de oferta calculado para el lote ${lot.lotNumber} ($${maxCalculatedBid.toLocaleString()} USD) supera el presupuesto máximo autorizado del cliente ($${lead.maxBudgetUsd.toLocaleString()} USD). En PUJAMOTOR USA, el valor a ofertar nunca supera el presupuesto.`
            );
          }
        }
        if (lot.currentBidUsd && lot.currentBidUsd > lead.maxBudgetUsd) {
          throw new Error(
            `Operación bloqueada: La puja actual del lote ${lot.lotNumber} ($${lot.currentBidUsd.toLocaleString()} USD) ya supera el presupuesto del cliente ($${lead.maxBudgetUsd.toLocaleString()} USD).`
          );
        }
      }
    }

    const presentationCode = `PRES-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;

    const presentation = await prisma.clientPresentation.create({
      data: {
        presentationCode,
        customerLeadId: lead.id,
        advisoryCaseId: input.advisoryCaseId || null,
        title:
          input.title?.trim() ||
          `Selección de Alternativas de Subasta para ${lead.fullName}`,
        notes:
          input.notes?.trim() ||
          "Selección personalizada de vehículos con potencial de compra evaluados según tu perfil de búsqueda.",
        selectedLotNumbersJson: JSON.stringify(uniqueLotNumbers),
        targetBidMinPercent: minPct,
        targetBidMaxPercent: maxPct,
        advisorName: input.advisorName?.trim() || "Asesor Especialista PUJAMOTOR USA",
        advisorPhone: input.advisorPhone?.trim() || null,
        status: "ACTIVE",
      },
    });

    // Si está vinculado a un expediente, avanzar etapa a ALTERNATIVAS_ENVIADAS
    if (input.advisoryCaseId) {
      await prisma.advisoryCase.update({
        where: { id: input.advisoryCaseId },
        data: {
          stage: "ALTERNATIVAS_ENVIADAS",
          lastContactAt: new Date(),
        },
      });
    }

    // Actualizar estado del lead a IN_ADVISORY
    await prisma.customerLead.update({
      where: { id: lead.id },
      data: { status: "IN_ADVISORY" },
    });

    const publicUrl = `${input.baseUrl || ""}/presentacion/${presentationCode}`;

    // Construir texto formateado para WhatsApp
    const sendTemplate = COMMERCIAL_TEMPLATES.find((t) => t.id === "TPL_03_ENVIO_ALTERNATIVAS");
    const whatsappMessage = sendTemplate
      ? sendTemplate.generateText({
          clientName: lead.fullName.split(" ")[0],
          advisorName: input.advisorName,
          presentationUrl: publicUrl,
          targetVehicle: lead.targetVehicle || undefined,
        })
      : `Hola ${lead.fullName.split(" ")[0]}! Te comparto tu selección de vehículos: ${publicUrl}`;

    // Registrar interacción CRM
    await prisma.crmInteraction.create({
      data: {
        customerLeadId: lead.id,
        advisoryCaseId: input.advisoryCaseId || null,
        authorUserId: input.actorUserId || null,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        subject: `Presentación enviada ${presentationCode} (${uniqueLotNumbers.length} vehículos)`,
        content: `Enlace público: ${publicUrl}\nLotes: ${uniqueLotNumbers.join(", ")}`,
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId || null,
      actorRole: input.actorRole,
      action: "CLIENT_PRESENTATION_CREATED",
      module: "CRM",
      targetType: "ClientPresentation",
      targetId: presentation.id,
      details: {
        presentationCode,
        customerLeadId: lead.id,
        lotCount: uniqueLotNumbers.length,
        lotNumbers: uniqueLotNumbers,
      },
    });

    return {
      presentation,
      publicUrl,
      whatsappMessage,
      lots: foundLots,
    };
  }

  /**
   * Consulta pública de una presentación personalizada.
   * El cliente visualiza EXCLUSIVAMENTE sus vehículos asignados sin acceso a datos ajenos ni al panel administrativo.
   */
  async getPublicPresentation(presentationCode: string) {
    const pres = await prisma.clientPresentation.findUnique({
      where: { presentationCode: presentationCode.trim().toUpperCase() },
      include: {
        customerLead: {
          select: {
            fullName: true,
            country: true,
            targetVehicle: true,
            minYear: true,
            maxBudgetUsd: true,
          },
        },
      },
    });

    if (!pres) return null;

    // Registrar visualización
    await prisma.clientPresentation.update({
      where: { id: pres.id },
      data: {
        viewsCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    const lotNumbers: string[] = JSON.parse(pres.selectedLotNumbersJson);

    const lots = await prisma.auctionLot.findMany({
      where: { lotNumber: { in: lotNumbers } },
      include: {
        vehicle: true,
        media: {
          where: { isAuthorizedCopy: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const minPct = pres.targetBidMinPercent ?? 40;
    const maxPct = pres.targetBidMaxPercent ?? 60;

    const vehicles = lots.map((lot) => {
      const retail = lot.estimatedRetailValue;
      const bin = lot.buyItNowPriceUsd;

      const targetBidRange = retail
        ? {
            minPercent: minPct,
            maxPercent: maxPct,
            minBidUsd: Math.round(retail * (minPct / 100)),
            maxBidUsd: Math.round(retail * (maxPct / 100)),
            disclaimer: `Rango orientativo de compra inteligente (${minPct}% al ${maxPct}% del valor minorista estimado). No garantiza adjudicación final ni precio cerrado.`,
          }
        : null;

      const buyItNowGuideline = bin
        ? {
            minPercent: 60,
            maxPercent: 75,
            minBidUsd: Math.round(bin * 0.6),
            maxBidUsd: Math.round(bin * 0.75),
            disclaimer: "Guía de referencia frente al precio de compra inmediata (60% al 75% del Buy It Now).",
          }
        : null;

      return {
        lotNumber: lot.lotNumber,
        auctionHouse: lot.auctionHouse,
        yardName: lot.yardName,
        yardState: lot.yardState,
        vehicle: {
          year: lot.vehicle.year,
          make: lot.vehicle.make,
          model: lot.vehicle.model,
          trim: lot.vehicle.trim,
          bodyStyle: lot.vehicle.bodyStyle,
          engineSpec: lot.vehicle.engineSpec,
          transmission: lot.vehicle.transmission,
          drivetrain: lot.vehicle.drivetrain,
          exteriorColor: lot.vehicle.exteriorColor,
          isVinMasked: lot.vehicle.isVinMasked,
          vin: lot.vehicle.isVinMasked && lot.vehicle.vin
            ? `${lot.vehicle.vin.slice(0, 8)}********`
            : lot.vehicle.vin,
        },
        titleCategory: lot.titleCategory,
        titleCode: lot.titleCode,
        runAndDriveStatus: lot.runAndDriveStatus,
        hasKeys: lot.hasKeys,
        odometerValue: lot.odometerValue,
        odometerUnit: lot.odometerUnit,
        odometerBrand: lot.odometerBrand,
        primaryDamage: lot.primaryDamage,
        secondaryDamage: lot.secondaryDamage,
        currentBidUsd: lot.currentBidUsd,
        buyItNowPriceUsd: lot.buyItNowPriceUsd,
        estimatedRetailValue: lot.estimatedRetailValue,
        targetBidRange,
        buyItNowGuideline,
        media: lot.media.map((m) => ({
          id: m.id,
          url: m.url,
          title: m.title,
          isPrimary: m.isPrimary,
        })),
        auctionDate: lot.auctionDate,
        saleStatus: lot.saleStatus,
      };
    });

    const maskedName = pres.customerLead.fullName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0]?.toUpperCase() ?? ""}***`)
      .join(" ");

    return {
      presentationCode: pres.presentationCode,
      title: pres.title,
      notes: pres.notes,
      advisorName: pres.advisorName || "Asesor Especialista PUJAMOTOR USA",
      advisorPhone: pres.advisorPhone || null,
      targetBidMinPercent: minPct,
      targetBidMaxPercent: maxPct,
      client: {
        maskedName,
        country: pres.customerLead.country,
        targetVehicle: pres.customerLead.targetVehicle,
        minYear: pres.customerLead.minYear,
        maxBudgetUsd: pres.customerLead.maxBudgetUsd,
      },
      vehicles,
      createdAt: pres.createdAt,
    };
  }

  /**
   * Actualiza la etapa comercial de un expediente en el flujo de 11 pasos o estado CLIENTE_PENSANDO.
   * Programa la alerta de recontacto a los 2-4 días si el cliente queda pensando.
   */
  async updateCommercialStage(input: {
    caseId: string;
    stage: string;
    isThinking?: boolean;
    followUpDays?: number; // 2 a 4 días
    operationalNotes?: string;
    selectedLotNumber?: string;
    maxAuthorizedBidUsd?: number;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const existing = await prisma.advisoryCase.findUnique({
      where: { id: input.caseId },
      include: { customerLead: true },
    });
    if (!existing) {
      throw new Error("Expediente de asesoría no encontrado.");
    }

    const isThinking =
      input.isThinking === true || input.stage === "CLIENTE_PENSANDO";

    const days = Math.min(4, Math.max(2, Number(input.followUpDays) || 3));
    const now = new Date();
    const nextFollowUp = isThinking
      ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      : null;

    const updated = await prisma.advisoryCase.update({
      where: { id: existing.id },
      data: {
        stage: input.stage,
        isThinking,
        lastContactAt: now,
        nextFollowUpAt: nextFollowUp,
        operationalNotes: input.operationalNotes ?? existing.operationalNotes,
        selectedLotNumber: input.selectedLotNumber ?? existing.selectedLotNumber,
        maxAuthorizedBidUsd:
          input.maxAuthorizedBidUsd !== undefined
            ? input.maxAuthorizedBidUsd
            : existing.maxAuthorizedBidUsd,
      },
    });

    await prisma.crmInteraction.create({
      data: {
        customerLeadId: existing.customerLeadId,
        advisoryCaseId: existing.id,
        authorUserId: input.actorUserId ?? null,
        channel: "INTERNAL_NOTE",
        direction: "INTERNAL",
        subject: `Avance a etapa ${input.stage}${isThinking ? ` [Cliente Pensando: Alerta en ${days} días]` : ""}`,
        content:
          input.operationalNotes ||
          `Actualización de etapa a ${input.stage}. Último contacto registrado: ${now.toLocaleDateString()}`,
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? "COMMERCIAL_ADVISOR",
      action: "ADVISORY_CASE_STAGE_UPDATED",
      module: "CRM",
      targetType: "AdvisoryCase",
      targetId: existing.id,
      details: {
        caseNumber: existing.caseNumber,
        previousStage: existing.stage,
        newStage: input.stage,
        isThinking,
        followUpDays: isThinking ? days : null,
      },
    });

    return updated;
  }

  /**
   * Registra hitos formales del proceso comercial (documentos, contrato, verificación Carfax, resultado de subasta)
   */
  async recordCommercialMilestone(input: {
    caseId: string;
    milestone:
      | "DOCUMENTS_RECEIVED"
      | "CARFAX_VERIFIED"
      | "BID_AUTHORIZED"
      | "AUCTION_RESULT"
      | "BROKER_FEE_SET";
    data: {
      idDocumentUrl?: string;
      contractSignedUrl?: string;
      hasCarfaxReport?: boolean;
      carfaxReportUrl?: string;
      maxAuthorizedBidUsd?: number;
      auctionWonPriceUsd?: number;
      auctionEvidenceRef?: string;
      brokerFeeAgreedUsd?: number;
      operationalNotes?: string;
    };
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const existing = await prisma.advisoryCase.findUnique({
      where: { id: input.caseId },
      include: { customerLead: true },
    });
    if (!existing) {
      throw new Error("Expediente de asesoría no encontrado.");
    }

    // Regla estricta de Presupuesto (PDF 1): La puja máxima autorizada nunca puede superar el presupuesto del cliente
    if (
      input.data.maxAuthorizedBidUsd !== undefined &&
      existing.customerLead?.maxBudgetUsd &&
      input.data.maxAuthorizedBidUsd > existing.customerLead.maxBudgetUsd
    ) {
      throw new Error(
        `Operación bloqueada: La puja máxima autorizada ($${input.data.maxAuthorizedBidUsd.toLocaleString()} USD) supera el presupuesto máximo del cliente ($${existing.customerLead.maxBudgetUsd.toLocaleString()} USD). En PUJAMOTOR USA, el valor a ofertar nunca supera el presupuesto.`
      );
    }

    // Regla de integridad: Si es resultado de subasta, exigir referencia verificable de comprobante/factura
    if (input.milestone === "AUCTION_RESULT" && !input.data.auctionEvidenceRef) {
      throw new Error(
        "Se requiere un número de comprobante, factura o referencia verificable para registrar el resultado oficial de la subasta."
      );
    }

    const updated = await prisma.advisoryCase.update({
      where: { id: existing.id },
      data: {
        idDocumentUrl: input.data.idDocumentUrl ?? existing.idDocumentUrl,
        contractSignedUrl: input.data.contractSignedUrl ?? existing.contractSignedUrl,
        verifiedContractReady:
          Boolean(input.data.contractSignedUrl) || existing.verifiedContractReady,
        hasCarfaxReport:
          input.data.hasCarfaxReport !== undefined
            ? input.data.hasCarfaxReport
            : existing.hasCarfaxReport,
        carfaxReportUrl: input.data.carfaxReportUrl ?? existing.carfaxReportUrl,
        maxAuthorizedBidUsd:
          input.data.maxAuthorizedBidUsd !== undefined
            ? input.data.maxAuthorizedBidUsd
            : existing.maxAuthorizedBidUsd,
        auctionWonPriceUsd:
          input.data.auctionWonPriceUsd !== undefined
            ? input.data.auctionWonPriceUsd
            : existing.auctionWonPriceUsd,
        auctionEvidenceRef: input.data.auctionEvidenceRef ?? existing.auctionEvidenceRef,
        brokerFeeAgreedUsd:
          input.data.brokerFeeAgreedUsd !== undefined
            ? input.data.brokerFeeAgreedUsd
            : existing.brokerFeeAgreedUsd,
        operationalNotes: input.data.operationalNotes ?? existing.operationalNotes,
        lastContactAt: new Date(),
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: `COMMERCIAL_MILESTONE_${input.milestone}`,
      module: "CRM",
      targetType: "AdvisoryCase",
      targetId: existing.id,
      details: {
        caseNumber: existing.caseNumber,
        milestone: input.milestone,
        ...input.data,
      },
    });

    return updated;
  }

  /**
   * Retrocompatibilidad para tests existentes que invocan updateAdvisoryCaseStage
   */
  async updateAdvisoryCaseStage(input: {
    caseId: string;
    stage: string;
    operationalNotes: string;
    maxAuthorizedBidUsd?: number;
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    return this.updateCommercialStage(input);
  }

  /**
   * Convierte una solicitud de cotización en un Expediente de Asesoría Comercial / Logística o actualiza su respuesta
   */
  async processQuoteRequestAdmin(input: {
    quoteRequestId: string;
    status: "IN_ANALYSIS" | "ESTIMATE_SENT" | "CONVERTED_TO_CASE" | "CLOSED";
    advisorResponseNote: string;
    createAdvisoryCase?: boolean;
    serviceScope?:
      | "ASESORIA_COMPRA"
      | "TRANSPORTE_INTERNO"
      | "EXPORTACION_MARITIMA"
      | "LLAVE_EN_MANO";
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: input.quoteRequestId },
      include: { customerLead: true, auctionLot: true },
    });

    if (!quote) {
      throw new Error("Solicitud de cotización no encontrada.");
    }

    const updatedQuote = await prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        status: input.status,
        advisorResponseNote: input.advisorResponseNote,
        respondedAt: new Date(),
      },
    });

    await prisma.customerLead.update({
      where: { id: quote.customerLeadId },
      data: {
        status:
          input.status === "CONVERTED_TO_CASE"
            ? "IN_ADVISORY"
            : input.status === "ESTIMATE_SENT"
            ? "QUALIFIED"
            : "CONTACTED",
      },
    });

    let createdCase = null;
    if (input.createAdvisoryCase || input.status === "CONVERTED_TO_CASE") {
      const caseNumber = `EXP-${new Date().getFullYear()}-${Math.floor(
        10000 + Math.random() * 90000
      )}`;
      createdCase = await prisma.advisoryCase.create({
        data: {
          caseNumber,
          customerLeadId: quote.customerLeadId,
          auctionLotId: quote.auctionLotId,
          assignedAdvisorId: input.actorUserId ?? null,
          serviceScope: input.serviceScope ?? "LLAVE_EN_MANO",
          stage: "CRITERIOS_DEFINIDOS",
          maxAuthorizedBidUsd: quote.maxBudgetUsd ?? null,
          verifiedContractReady: false,
          operationalNotes: input.advisorResponseNote,
          destinationCountry: quote.destinationCountry,
        },
      });
    }

    await prisma.crmInteraction.create({
      data: {
        customerLeadId: quote.customerLeadId,
        advisoryCaseId: createdCase?.id ?? null,
        authorUserId: input.actorUserId ?? null,
        channel: "INTERNAL_NOTE",
        direction: "OUTBOUND",
        subject: `Seguimiento de solicitud ${quote.referenceCode} -> ${input.status}`,
        content: input.advisorResponseNote,
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "QUOTE_REQUEST_PROCESSED",
      module: "CRM",
      targetType: "QuoteRequest",
      targetId: quote.id,
      details: {
        referenceCode: quote.referenceCode,
        newStatus: input.status,
        advisoryCaseCreated: createdCase?.caseNumber ?? null,
      },
    });

    return { updatedQuote, createdCase };
  }

  /**
   * Actualiza el paso del Copiloto Comercial según el proceso oficial de PUJAMOTOR USA (PDF 1).
   * Almacena checklist completado y sincroniza la etapa correspondiente.
   */
  async updateCaseCopilotStep(input: {
    caseId: string;
    methodology?: "SUBASTA_PRO_USA" | "PUJAMOTOR_USA" | "MAPA_BROKERS";
    currentStepNumber?: number;
    targetStepNumber?: number;
    stepChecklistJson?: string;
    checklist?: Record<string, boolean>;
    operationalNotes?: string;
    actorUserId?: string | null;
    actorRole?: UserRole;
  }) {
    const existing = await prisma.advisoryCase.findUnique({
      where: { id: input.caseId },
      include: { customerLead: true },
    });
    if (!existing) {
      throw new Error("Expediente de asesoría no encontrado.");
    }

    const methodology = input.methodology ?? existing.methodology ?? "SUBASTA_PRO_USA";
    const maxSteps = 10;
    const rawStep = input.currentStepNumber ?? input.targetStepNumber ?? 1;
    const stepNumber = Math.max(1, Math.min(maxSteps, Number(rawStep) || 1));

    const stepToStageMap: Record<number, string> = {
      1: "CONTACTO_INICIAL",
      2: "CRITERIOS_DEFINIDOS",
      3: "BUSQUEDA_DE_VEHICULOS",
      4: "VEHICULO_SELECCIONADO",
      5: "ASESORIA_Y_CONTRATO",
      6: "ASESORIA_Y_CONTRATO",
      7: "OFERTA_AUTORIZADA",
      8: "SUBASTA_EN_SEGUIMIENTO",
      9: "RESULTADO_DE_SUBASTA",
      10: "OPERACION_CERRADA",
    };
    const stage = stepToStageMap[stepNumber] ?? existing.stage;

    const updated = await prisma.advisoryCase.update({
      where: { id: existing.id },
      data: {
        methodology,
        currentStepNumber: stepNumber,
        stage,
        stepChecklistJson:
          input.stepChecklistJson ??
          (input.checklist ? JSON.stringify(input.checklist) : existing.stepChecklistJson),
        operationalNotes: input.operationalNotes ?? existing.operationalNotes,
        lastContactAt: new Date(),
      },
    });

    await prisma.crmInteraction.create({
      data: {
        customerLeadId: existing.customerLeadId,
        advisoryCaseId: existing.id,
        authorUserId: input.actorUserId ?? null,
        channel: "INTERNAL_NOTE",
        direction: "INTERNAL",
        subject: `Avance Copiloto: ${methodology} - Paso ${stepNumber}`,
        content:
          input.operationalNotes ||
          `Asesor avanzó al Paso ${stepNumber} en la metodología ${methodology}.`,
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? "COMMERCIAL_ADVISOR",
      action: "COPILOT_STEP_UPDATED",
      module: "CRM",
      targetType: "AdvisoryCase",
      targetId: existing.id,
      details: {
        caseNumber: existing.caseNumber,
        methodology,
        stepNumber,
        stage,
      },
    });

    return updated;
  }

  /**
   * Lista prospectos, solicitudes de cotización, presentaciones y expedientes de asesoría para el Panel Administrativo.
   * Descifra correo y teléfono únicamente para roles autorizados; para roles de solo lectura devuelve valores enmascarados.
   */
  async getCommercialDashboardData(options?: { canViewUnmaskedPii?: boolean }) {
    const canUnmask = options?.canViewUnmaskedPii ?? false;
    const now = new Date();

    const [leads, quoteRequests, advisoryCases, presentations] = await Promise.all([
      prisma.customerLead.findMany({
        include: {
          quoteRequests: { orderBy: { createdAt: "desc" } },
          presentations: { orderBy: { createdAt: "desc" } },
          interactions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quoteRequest.findMany({
        include: {
          customerLead: true,
          auctionLot: { include: { vehicle: true } },
          costEstimate: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.advisoryCase.findMany({
        include: {
          customerLead: true,
          auctionLot: { include: { vehicle: true } },
          assignedAdvisor: { select: { fullName: true, email: true } },
          presentations: { orderBy: { createdAt: "desc" } },
          interactions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.clientPresentation.findMany({
        include: {
          customerLead: {
            select: { fullName: true, country: true, targetVehicle: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const formatLead = <T extends { email: string; phoneWhatsapp: string }>(l: T): T => ({
      ...l,
      email: canUnmask ? decryptPii(l.email) : maskEmail(l.email),
      phoneWhatsapp: canUnmask ? decryptPii(l.phoneWhatsapp) : maskPhone(l.phoneWhatsapp),
    });

    const enrichedCases = advisoryCases.map((c) => {
      const isFollowUpDue = Boolean(c.nextFollowUpAt && now >= c.nextFollowUpAt);
      return {
        ...c,
        customerLead: c.customerLead ? formatLead(c.customerLead) : c.customerLead,
        isFollowUpDue,
      };
    });

    const thinkingCasesCount = enrichedCases.filter((c) => c.isThinking).length;
    const followUpDueCount = enrichedCases.filter((c) => c.isFollowUpDue).length;

    return {
      leads: leads.map((l) => formatLead(l)),
      quoteRequests: quoteRequests.map((q) => ({
        ...q,
        customerLead: q.customerLead ? formatLead(q.customerLead) : q.customerLead,
      })),
      advisoryCases: enrichedCases,
      presentations,
      kpis: {
        totalLeads: leads.length,
        newLeadsCount: leads.filter((l) => l.status === "NEW").length,
        activeCasesCount: advisoryCases.filter((c) => c.stage !== "OPERACION_CERRADA").length,
        thinkingCasesCount,
        followUpDueCount,
      },
      templates: COMMERCIAL_TEMPLATES.map((t) => ({
        id: t.id,
        stageCode: t.stageCode,
        title: t.title,
        channel: t.channel,
        description: t.description,
      })),
      methodologies: ALL_METHODOLOGIES,
    };
  }
}

export const crmService = new CrmService();
