import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { calculatorService } from "@/modules/calculator/calculator.service";

export async function GET() {
  try {
    await ensureSystemBootstrapped();
    const { record, rules } = await calculatorService.ensureActiveTariffRuleSet();
    return NextResponse.json({
      versionCode: record.versionCode,
      name: record.name,
      updatedAt: record.updatedAt,
      rules,
    });
  } catch (error) {
    console.error("[API /api/calculator GET] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener las reglas tarifarias de la calculadora." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const body = await req.json();

    const estimate = await calculatorService.calculateEstimate({
      auctionLotId: body.auctionLotId,
      vehicleSummary: body.vehicleSummary,
      vehicleCategory: body.vehicleCategory ?? "SUV_PICKUP",
      bidAmountUsd: Number(body.bidAmountUsd) || 0,
      originState: body.originState || "TX",
      departurePort: body.departurePort,
      destinationCountryCode: body.destinationCountryCode || "MX",
      shippingModality: body.shippingModality ?? "RORO",
      includeBrokerFee: body.includeBrokerFee ?? true,
      includeMarineInsurance: body.includeMarineInsurance ?? true,
      additionalCostsUsd: Number(body.additionalCostsUsd) || 0,
      additionalCostsNote: body.additionalCostsNote,
      saveSimulation: Boolean(body.saveSimulation),
    });

    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("[API /api/calculator POST] Error:", error);
    return NextResponse.json(
      { error: "Error al calcular la estimación de costos." },
      { status: 400 }
    );
  }
}

