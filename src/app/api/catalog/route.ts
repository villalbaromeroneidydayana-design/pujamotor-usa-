import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { catalogService } from "@/modules/catalog/catalog.service";

export async function GET(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const { searchParams } = new URL(req.url);

    const compareParam = searchParams.get("compare");
    if (compareParam) {
      const lotNumbers = compareParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const comparedLots = await catalogService.compareLotsByNumbers(lotNumbers);
      return NextResponse.json({ lots: comparedLots });
    }

    const query = searchParams.get("query") ?? undefined;
    const make = searchParams.get("make") ?? undefined;
    const model = searchParams.get("model") ?? undefined;
    const minYear = searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined;
    const maxYear = searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const yardState = searchParams.get("yardState") ?? undefined;
    const runAndDriveStatus = searchParams.get("runAndDriveStatus") ?? undefined;
    const titleCategory = searchParams.get("titleCategory") ?? undefined;
    const primaryDamage = searchParams.get("primaryDamage") ?? undefined;
    const completenessStatus = searchParams.get("completenessStatus") ?? undefined;
    const dataEnvironmentFilter = (searchParams.get("dataEnvironmentFilter") as
      | "ALL_ALLOWED"
      | "PRODUCTION_ONLY"
      | "DEMO_ONLY"
      | null) ?? "ALL_ALLOWED";
    const sortBy = (searchParams.get("sortBy") as
      | "PRICE_ASC"
      | "PRICE_DESC"
      | "YEAR_DESC"
      | "AUCTION_DATE_ASC"
      | "RECENTLY_UPDATED"
      | null) ?? "RECENTLY_UPDATED";

    const [lots, facets] = await Promise.all([
      catalogService.searchLots({
        query,
        make,
        model,
        minYear,
        maxYear,
        minPrice,
        maxPrice,
        yardState,
        runAndDriveStatus,
        titleCategory,
        primaryDamage,
        completenessStatus,
        dataEnvironmentFilter,
        sortBy,
      }),
      catalogService.getFacetOptions(),
    ]);

    return NextResponse.json({ lots, facets });
  } catch (error) {
    console.error("[API /api/catalog] Error:", error);
    return NextResponse.json(
      { error: "Error al consultar el catálogo de vehículos." },
      { status: 500 }
    );
  }
}

