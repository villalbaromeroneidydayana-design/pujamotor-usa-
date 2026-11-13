import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { getEnv } from "@/config/env";

export interface CatalogFilterInput {
  query?: string;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  yardState?: string;
  runAndDriveStatus?: string;
  titleCategory?: string;
  primaryDamage?: string;
  completenessStatus?: string;
  dataEnvironmentFilter?: "ALL_ALLOWED" | "PRODUCTION_ONLY" | "DEMO_ONLY";
  sortBy?: "PRICE_ASC" | "PRICE_DESC" | "YEAR_DESC" | "AUCTION_DATE_ASC" | "RECENTLY_UPDATED";
  includeUnpublishedForAdmin?: boolean;
}

export class CatalogService {
  async searchLots(filters: CatalogFilterInput = {}) {
    const env = getEnv();
    const where: Prisma.AuctionLotWhereInput = {};

    if (!filters.includeUnpublishedForAdmin) {
      where.isPublished = true;
      if (filters.dataEnvironmentFilter === "PRODUCTION_ONLY") {
        // En vista estricta de inventario real disponible, solo lotes CONFIRMED
        where.completenessStatus = "CONFIRMED";
      }
    }

    // Regla estricta de separación entre datos reales y datos de demostración
    if (filters.dataEnvironmentFilter === "DEMO_ONLY") {
      if (!env.ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG && !filters.includeUnpublishedForAdmin) {
        where.dataEnvironment = "DEMO_SANDBOX";
        where.id = "__BLOCKED_DEMO__";
      } else {
        where.dataEnvironment = "DEMO_SANDBOX";
      }
    } else if (filters.dataEnvironmentFilter === "PRODUCTION_ONLY" || !env.ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG) {
      where.dataEnvironment = "PRODUCTION_REAL";
    }

    if (filters.yardState && filters.yardState !== "ALL") {
      where.yardState = filters.yardState;
    }

    if (filters.runAndDriveStatus && filters.runAndDriveStatus !== "ALL") {
      where.runAndDriveStatus = filters.runAndDriveStatus;
    }

    if (filters.titleCategory && filters.titleCategory !== "ALL") {
      where.titleCategory = filters.titleCategory;
    }

    if (filters.primaryDamage && filters.primaryDamage !== "ALL") {
      where.primaryDamage = { contains: filters.primaryDamage };
    }

    if (filters.completenessStatus && filters.completenessStatus !== "ALL") {
      where.completenessStatus = filters.completenessStatus;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.currentBidUsd = {};
      if (filters.minPrice !== undefined && !Number.isNaN(filters.minPrice)) {
        where.currentBidUsd.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined && !Number.isNaN(filters.maxPrice)) {
        where.currentBidUsd.lte = filters.maxPrice;
      }
    }

    const vehicleWhere: Prisma.VehicleWhereInput = {};
    if (filters.make && filters.make !== "ALL") {
      vehicleWhere.make = filters.make.toUpperCase();
    }
    if (filters.model && filters.model !== "ALL") {
      vehicleWhere.model = { contains: filters.model.toUpperCase() };
    }
    if (filters.minYear !== undefined || filters.maxYear !== undefined) {
      vehicleWhere.year = {};
      if (filters.minYear !== undefined && !Number.isNaN(filters.minYear)) {
        vehicleWhere.year.gte = filters.minYear;
      }
      if (filters.maxYear !== undefined && !Number.isNaN(filters.maxYear)) {
        vehicleWhere.year.lte = filters.maxYear;
      }
    }

    if (Object.keys(vehicleWhere).length > 0) {
      where.vehicle = vehicleWhere;
    }

    if (filters.query && filters.query.trim().length > 0) {
      const q = filters.query.trim();
      where.OR = [
        { lotNumber: { contains: q } },
        { yardName: { contains: q } },
        { primaryDamage: { contains: q } },
        { vehicle: { make: { contains: q.toUpperCase() } } },
        { vehicle: { model: { contains: q.toUpperCase() } } },
        { vehicle: { vin: { contains: q.toUpperCase() } } },
        { vehicle: { internalCode: { contains: q.toUpperCase() } } },
      ];
    }

    let orderBy: Prisma.AuctionLotOrderByWithRelationInput = { updatedAt: "desc" };
    switch (filters.sortBy) {
      case "PRICE_ASC":
        orderBy = { currentBidUsd: "asc" };
        break;
      case "PRICE_DESC":
        orderBy = { currentBidUsd: "desc" };
        break;
      case "YEAR_DESC":
        orderBy = { vehicle: { year: "desc" } };
        break;
      case "AUCTION_DATE_ASC":
        orderBy = { auctionDate: "asc" };
        break;
      default:
        orderBy = { updatedAt: "desc" };
    }

    const lots = await prisma.auctionLot.findMany({
      where,
      include: {
        vehicle: true,
        dataSource: true,
        media: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy,
    });

    return lots.map((lot) => ({
      ...lot,
      missingFields: safeParseStringArray(lot.missingFieldsJson),
    }));
  }

  async getFacetOptions() {
    const vehicles = await prisma.vehicle.findMany({
      select: { make: true, model: true, year: true },
    });
    const lots = await prisma.auctionLot.findMany({
      select: { yardState: true, primaryDamage: true, titleCategory: true, runAndDriveStatus: true },
    });

    const makes = Array.from(new Set(vehicles.map((v) => v.make))).sort();
    const models = Array.from(new Set(vehicles.map((v) => v.model))).sort();
    const states = Array.from(new Set(lots.map((l) => l.yardState))).sort();
    const damages = Array.from(new Set(lots.map((l) => l.primaryDamage))).sort();
    const titles = Array.from(new Set(lots.map((l) => l.titleCategory))).sort();

    return {
      makes,
      models,
      states,
      damages,
      titles,
    };
  }

  async getLotDetailByNumber(lotNumber: string, options?: { allowUnpublished?: boolean }) {
    const env = getEnv();
    const lot = await prisma.auctionLot.findUnique({
      where: { lotNumber },
      include: {
        vehicle: true,
        dataSource: true,
        lastBatch: true,
        media: { orderBy: { sortOrder: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
        changeHistory: {
          include: {
            changedByUser: {
              select: { fullName: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lot) return null;

    if (!options?.allowUnpublished) {
      if (!lot.isPublished) return null;
      if (lot.completenessStatus === "INCOMPLETE") return null;
      if (!env.ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG && lot.dataEnvironment === "DEMO_SANDBOX") {
        return null;
      }
    }

    return {
      ...lot,
      missingFields: safeParseStringArray(lot.missingFieldsJson),
      changeHistory: lot.changeHistory.map((h) => ({
        ...h,
        changedFields: safeParseStringArray(h.changedFieldsJson),
        previousValues: safeParseObject(h.previousValuesJson),
        newValues: safeParseObject(h.newValuesJson),
      })),
    };
  }

  async compareLotsByNumbers(lotNumbers: string[]) {
    if (!lotNumbers || lotNumbers.length === 0) return [];
    const lots = await prisma.auctionLot.findMany({
      where: {
        lotNumber: { in: lotNumbers },
        isPublished: true,
        completenessStatus: { not: "INCOMPLETE" },
        NOT: {
          AND: [
            { dataEnvironment: "PRODUCTION_REAL" },
            { completenessStatus: { not: "CONFIRMED" } },
          ],
        },
      },
      include: {
        vehicle: true,
        dataSource: true,
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    return lots.map((lot) => ({
      ...lot,
      missingFields: safeParseStringArray(lot.missingFieldsJson),
    }));
  }
}

function safeParseStringArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const catalogService = new CatalogService();

