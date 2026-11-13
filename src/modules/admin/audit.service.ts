import { prisma } from "@/shared/db/prisma";
import { sanitizeAuditDetails } from "@/shared/security/crypto-pii";
import { UserRole } from "./auth.service";

export interface CreateAuditLogInput {
  actorUserId?: string | null;
  actorRole: UserRole | "SYSTEM_AUTOMATION";
  action: string;
  module: "INGESTION" | "VEHICLES" | "CALCULATOR" | "CRM" | "ADMIN_SECURITY";
  targetType: string;
  targetId?: string | null;
  details: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditService {
  async record(input: CreateAuditLogInput) {
    const sanitizedDetails = sanitizeAuditDetails(input.details);

    return prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole,
        action: input.action,
        module: input.module,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        detailsJson: JSON.stringify(sanitizedDetails),
        ipAddress: input.ipAddress ?? "127.0.0.1",
      },
    });
  }

  async listRecent(limit = 50, moduleFilter?: string) {
    const logs = await prisma.auditLog.findMany({
      where: moduleFilter && moduleFilter !== "ALL" ? { module: moduleFilter } : undefined,
      include: {
        actorUser: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      ...log,
      details: sanitizeAuditDetails(safeParseJson(log.detailsJson)),
    }));
  }
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export const auditService = new AuditService();
