import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { catalogService } from "@/modules/catalog/catalog.service";
import { ingestionService } from "@/modules/ingestion/ingestion.service";
import { calculatorService } from "@/modules/calculator/calculator.service";
import { crmService } from "@/modules/crm/crm.service";
import { auditService } from "@/modules/admin/audit.service";
import {
  getPermissionsForRole,
  hasPermission,
  requireServerPermission,
} from "@/modules/admin/auth.service";
import { prisma } from "@/shared/db/prisma";
import { AppDomainError } from "@/shared/errors/domain-errors";

export async function GET(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const session = await requireServerPermission(req, "VIEW_ADMIN_OVERVIEW");

    const canManageCrm = hasPermission(session.role, "MANAGE_CRM_LEADS_AND_CASES");

    const [
      allLots,
      integrations,
      tariffData,
      crmData,
      auditLogs,
      recentLotChanges,
      users,
    ] = await Promise.all([
      catalogService.searchLots({ includeUnpublishedForAdmin: true }),
      ingestionService.getIntegrationsOverview(),
      calculatorService.ensureActiveTariffRuleSet(),
      crmService.getCommercialDashboardData({ canViewUnmaskedPii: canManageCrm }),
      auditService.listRecent(40),
      prisma.lotChangeHistory.findMany({
        include: {
          auctionLot: {
            select: {
              lotNumber: true,
              vehicle: { select: { year: true, make: true, model: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      sessionUser: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        permissions: getPermissionsForRole(session.role),
      },
      allLots,
      integrations,
      tariffs: {
        versionCode: tariffData.record.versionCode,
        updatedAt: tariffData.record.updatedAt,
        rules: tariffData.rules,
      },
      crm: crmData,
      auditLogs,
      recentLotChanges,
      users,
    });
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/admin/overview GET] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar el resumen del Panel Administrativo." },
      { status: 500 }
    );
  }
}
