import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { crmService } from "@/modules/crm/crm.service";
import { requireServerPermission } from "@/modules/admin/auth.service";
import { AppDomainError } from "@/shared/errors/domain-errors";

export async function GET(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const { searchParams } = new URL(req.url);
    const referenceCode = searchParams.get("referenceCode");
    const presentationCode = searchParams.get("presentationCode");

    // 1. Consulta pública de presentación de vehículos seleccionados (4 a 7 lotes)
    if (presentationCode) {
      const presentation = await crmService.getPublicPresentation(presentationCode);
      if (!presentation) {
        return NextResponse.json(
          { error: `No se encontró ninguna presentación con código ${presentationCode}.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ presentation });
    }

    // 2. Consulta pública permitida ÚNICAMENTE por código de referencia con datos minimizados
    if (referenceCode) {
      const quote = await crmService.getQuoteRequestByReference(referenceCode);
      if (!quote) {
        return NextResponse.json(
          { error: `No se encontró ninguna solicitud con código ${referenceCode}.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ quote });
    }

    // 3. El listado general del CRM requiere sesión administrativa verificada y permiso RBAC
    await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");
    const data = await crmService.getCommercialDashboardData({
      canViewUnmaskedPii: true,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API /api/crm GET] Error:", error);
    return NextResponse.json(
      { error: "Error al consultar el sistema comercial." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const body = await req.json();

    if (body.action === "ADMIN_PROCESS_QUOTE") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");

      const result = await crmService.processQuoteRequestAdmin({
        quoteRequestId: body.quoteRequestId,
        status: body.status,
        advisorResponseNote: body.advisorResponseNote,
        createAdvisoryCase: Boolean(body.createAdvisoryCase),
        serviceScope: body.serviceScope,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json(result);
    }

    if (body.action === "ADMIN_CREATE_PRESENTATION") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");
      const url = new URL(req.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      const result = await crmService.createClientPresentation({
        customerLeadId: body.customerLeadId,
        advisoryCaseId: body.advisoryCaseId,
        lotNumbers: body.lotNumbers || [],
        title: body.title,
        notes: body.notes,
        targetBidMinPercent: body.targetBidMinPercent ? Number(body.targetBidMinPercent) : 40,
        targetBidMaxPercent: body.targetBidMaxPercent ? Number(body.targetBidMaxPercent) : 60,
        advisorName: session.fullName,
        baseUrl,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json(result, { status: 201 });
    }

    if (body.action === "ADMIN_UPDATE_COPILOT_STEP") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");

      const updated = await crmService.updateCaseCopilotStep({
        caseId: body.caseId,
        methodology: body.methodology,
        currentStepNumber: body.currentStepNumber,
        stepChecklistJson: body.stepChecklistJson,
        operationalNotes: body.operationalNotes,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ updatedCase: updated });
    }

    if (body.action === "ADMIN_UPDATE_COMMERCIAL_STAGE") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");

      const updated = await crmService.updateCommercialStage({
        caseId: body.caseId,
        stage: body.stage,
        isThinking: body.isThinking,
        followUpDays: body.followUpDays ? Number(body.followUpDays) : 3,
        operationalNotes: body.operationalNotes,
        selectedLotNumber: body.selectedLotNumber,
        maxAuthorizedBidUsd:
          body.maxAuthorizedBidUsd !== undefined
            ? Number(body.maxAuthorizedBidUsd)
            : undefined,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ updatedCase: updated });
    }

    if (body.action === "ADMIN_RECORD_MILESTONE") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");

      const updated = await crmService.recordCommercialMilestone({
        caseId: body.caseId,
        milestone: body.milestone,
        data: {
          idDocumentUrl: body.idDocumentUrl,
          contractSignedUrl: body.contractSignedUrl,
          hasCarfaxReport: body.hasCarfaxReport,
          carfaxReportUrl: body.carfaxReportUrl,
          maxAuthorizedBidUsd:
            body.maxAuthorizedBidUsd !== undefined
              ? Number(body.maxAuthorizedBidUsd)
              : undefined,
          auctionWonPriceUsd:
            body.auctionWonPriceUsd !== undefined
              ? Number(body.auctionWonPriceUsd)
              : undefined,
          auctionEvidenceRef: body.auctionEvidenceRef,
          brokerFeeAgreedUsd:
            body.brokerFeeAgreedUsd !== undefined
              ? Number(body.brokerFeeAgreedUsd)
              : undefined,
          operationalNotes: body.operationalNotes,
        },
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ updatedCase: updated });
    }

    if (body.action === "ADMIN_UPDATE_CASE_STAGE") {
      const session = await requireServerPermission(req, "MANAGE_CRM_LEADS_AND_CASES");

      const updated = await crmService.updateAdvisoryCaseStage({
        caseId: body.caseId,
        stage: body.stage,
        operationalNotes: body.operationalNotes,
        maxAuthorizedBidUsd:
          body.maxAuthorizedBidUsd !== undefined
            ? Number(body.maxAuthorizedBidUsd)
            : undefined,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ updatedCase: updated });
    }

    // Solicitud pública de información / cotización / asesoría
    if (!body.fullName || !body.email || !body.phoneWhatsapp || !body.country) {
      return NextResponse.json(
        {
          error:
            "Nombre completo, correo electrónico, teléfono/WhatsApp y país de destino son obligatorios.",
        },
        { status: 400 }
      );
    }

    const createdQuote = await crmService.createInquiryAndQuoteRequest({
      fullName: body.fullName,
      email: body.email,
      phoneWhatsapp: body.phoneWhatsapp,
      country: body.country,
      city: body.city,
      companyName: body.companyName,
      customerType: body.customerType,
      lotNumber: body.lotNumber,
      requestedServices: body.requestedServices || "FULL_IMPORT_ADVISORY",
      maxBudgetUsd: body.maxBudgetUsd ? Number(body.maxBudgetUsd) : undefined,
      customerMessage: body.customerMessage,
      targetVehicle: body.targetVehicle,
      minYear: body.minYear ? Number(body.minYear) : undefined,
      leadSource: body.leadSource,
    });

    return NextResponse.json({ quoteRequest: createdQuote }, { status: 201 });
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message =
      error instanceof Error ? error.message : "Error al procesar la operación comercial.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
