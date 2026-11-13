import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { ingestionService } from "@/modules/ingestion/ingestion.service";
import { requireServerPermission } from "@/modules/admin/auth.service";
import { AppDomainError } from "@/shared/errors/domain-errors";

export async function GET(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    await requireServerPermission(req, "VIEW_ADMIN_OVERVIEW");
    const overview = await ingestionService.getIntegrationsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: "Error al obtener estado de integraciones." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    // El rol y usuario provienen EXCLUSIVAMENTE de la sesión verificada en el servidor
    const session = await requireServerPermission(req, "INGEST_LOT_DATA");
    const body = await req.json();

    if (body.action === "IMPORT_COPART_CSV") {
      if (!body.csvContent || typeof body.csvContent !== "string") {
        return NextResponse.json(
          { error: "Debe proporcionar el contenido del archivo CSV de Copart." },
          { status: 400 }
        );
      }

      const result = await ingestionService.importCopartCsvBatch({
        fileName: body.fileName || "copart_member_export.csv",
        csvContent: body.csvContent,
        dataEnvironment: body.dataEnvironment || "PRODUCTION_REAL",
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json(result);
    }

    if (body.action === "DECODE_VIN_NHTSA") {
      if (!body.vin || typeof body.vin !== "string") {
        return NextResponse.json(
          { error: "Debe indicar un número de serie (VIN) para consultar en NHTSA." },
          { status: 400 }
        );
      }

      const decoded = await ingestionService.decodeVinAndEnrichLot({
        vin: body.vin,
        lotId: body.lotId || undefined,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ decoded });
    }

    return NextResponse.json({ error: "Acción de ingesta no reconocida." }, { status: 400 });
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Error en módulo de ingesta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
