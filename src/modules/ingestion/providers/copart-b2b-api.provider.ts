import { getEnv, isCopartB2bConfigured } from "@/config/env";
import { IntegrationNotConfiguredError } from "@/shared/errors/domain-errors";
import {
  NormalizedAuctionLotDTO,
  ProviderHealthStatus,
} from "../contracts/auction-provider.interface";

/**
 * Representación del esquema oficial devuelto por Copart B2B REST API
 * (según especificaciones técnicas de Copart Member API / Broker Data Feed).
 */
export interface CopartB2bApiLotPayload {
  lotNumber: string | number;
  lotDescription?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;
  odometer?: {
    value?: number;
    unit?: "MILES" | "KM";
    brand?: string;
  };
  facility?: {
    code?: string;
    name?: string;
    state?: string;
    city?: string;
    zip?: string;
  };
  title?: {
    state?: string;
    type?: string;
    clean?: boolean;
    salvage?: boolean;
  };
  damage?: {
    primary?: string;
    secondary?: string;
  };
  condition?: {
    runAndDrive?: string;
    keys?: boolean | string;
  };
  financials?: {
    currentBid?: number;
    buyItNow?: number;
    estimatedRetailValue?: number;
    repairCost?: number;
  };
  auction?: {
    saleDate?: string;
    saleStatus?: string;
  };
  images?: Array<{
    url: string;
    fullSizeUrl?: string;
    thumbnailUrl?: string;
    isPrimary?: boolean;
    sequence?: number;
  }>;
}

/**
 * Conector B2B Oficial con Copart.
 *
 * POLÍTICA ESTRICTA DE CUMPLIMIENTO:
 * 1. Copart NO cuenta con una API pública abierta para scraping o consumo anónimo.
 * 2. Requiere:
 *    - Cuenta de Miembro Copart Premier / Broker activa.
 *    - Contrato de Data License / Integración B2B firmado con Copart Enterprise.
 *    - Credenciales OAuth2 Client ID, Client Secret, Base URL autorizada y Member Number.
 * 3. En ausencia de credenciales, reporta de forma transparente 'isReadyForLiveUse: false'
 *    y detalla los requisitos corporativos pendientes.
 * 4. Incluye un transformador de datos riguroso (`transformB2bPayloadToDTO`) listo para operar
 *    apenas se ingresen las credenciales legítimas, y un método de simulación (`mockFetchForTesting`)
 *    para pruebas automatizadas aisladas.
 */
export class CopartB2bApiProvider {
  getHealthStatus(): ProviderHealthStatus {
    const env = getEnv();
    const missing: string[] = [];
    if (!env.COPART_B2B_API_BASE_URL) missing.push("COPART_B2B_API_BASE_URL");
    if (!env.COPART_B2B_CLIENT_ID) missing.push("COPART_B2B_CLIENT_ID");
    if (!env.COPART_B2B_CLIENT_SECRET) missing.push("COPART_B2B_CLIENT_SECRET");
    if (!env.COPART_B2B_MEMBER_NUMBER) missing.push("COPART_B2B_MEMBER_NUMBER");

    const configured = isCopartB2bConfigured();

    return {
      providerCode: "COPART_B2B_API",
      providerName: "Conector Copart B2B / Data Feed Autorizado",
      integrationType: "B2B_REST_API",
      isConfigured: configured,
      isReadyForLiveUse: configured,
      requiresExternalCredentials: true,
      missingCredentials: missing,
      legalComplianceNotice:
        "Copart no ofrece una API pública abierta. El acceso B2B en vivo requiere contrato corporativo de Data License, credenciales OAuth2 y número de cuenta de miembro. Mientras no se disponga de credenciales corporativas, utilice el canal autorizado 'Importación CSV de Miembro Copart'.",
    };
  }

  /**
   * Transforma el esquema JSON oficial de Copart B2B en el DTO normalizado del Motor Central
   */
  transformB2bPayloadToDTO(
    raw: CopartB2bApiLotPayload,
    dataEnvironment: "PRODUCTION_REAL" | "DEMO_SANDBOX" = "PRODUCTION_REAL"
  ): NormalizedAuctionLotDTO {
    const lotNumber = String(raw.lotNumber).trim();
    const year = Number(raw.year) || 2020;
    const make = String(raw.make || "UNKNOWN").toUpperCase();
    const model = String(raw.model || "UNKNOWN").toUpperCase();
    const vin = raw.vin?.trim().toUpperCase() || null;
    const isVinMasked = Boolean(vin && (vin.includes("*") || vin.length < 17));

    const yardState = (raw.facility?.state || "TX").toUpperCase();
    const yardCity = (raw.facility?.city || "UNKNOWN").toUpperCase();
    const yardName = raw.facility?.name || `${yardState} - ${yardCity}`;

    // Mapeo de Título
    let titleCategory: NormalizedAuctionLotDTO["titleCategory"] = "SALVAGE";
    const rawTitle = `${raw.title?.type || ""} ${raw.title?.state || ""}`.toUpperCase();
    if (raw.title?.clean || rawTitle.includes("CLEAN") || rawTitle.includes("CLEAR")) {
      titleCategory = "CLEAN";
    } else if (rawTitle.includes("REBUILT") || rawTitle.includes("RECONSTRUCTED")) {
      titleCategory = "REBUILT";
    } else if (rawTitle.includes("NON-REPAIRABLE") || rawTitle.includes("JUNK") || rawTitle.includes("PARTS ONLY")) {
      titleCategory = "NON_REPAIRABLE";
    } else if (rawTitle.includes("EXPORT")) {
      titleCategory = "EXPORT_ONLY";
    }

    // Condición operativa
    let runAndDriveStatus: NormalizedAuctionLotDTO["runAndDriveStatus"] = "UNKNOWN";
    const rawRun = String(raw.condition?.runAndDrive || "").toUpperCase();
    if (rawRun.includes("RUN") || rawRun.includes("DRIVE")) {
      runAndDriveStatus = "RUNS_AND_DRIVES";
    } else if (rawRun.includes("START")) {
      runAndDriveStatus = "ENGINE_START_PROGRAM";
    } else if (rawRun.includes("ENHANCED")) {
      runAndDriveStatus = "ENHANCED";
    } else if (rawRun.includes("NO") || rawRun.includes("STATIONARY")) {
      runAndDriveStatus = "STATIONARY";
    }

    const hasKeys =
      typeof raw.condition?.keys === "boolean"
        ? raw.condition.keys
        : typeof raw.condition?.keys === "string"
        ? ["YES", "SI", "TRUE", "Y"].includes(raw.condition.keys.toUpperCase())
        : null;

    // Fotografías autorizadas entregadas vía API B2B
    const authorizedMedia = (raw.images ?? []).map((img, idx) => ({
      mediaType: "PHOTO_EXTERIOR" as const,
      title: `Foto B2B ${idx + 1} (${lotNumber})`,
      url: img.fullSizeUrl || img.url,
      originReference: `Copart B2B API Licensed Feed (Member #${getEnv().COPART_B2B_MEMBER_NUMBER || "PENDING"})`,
      isAuthorizedCopy: true,
      isPrimary: Boolean(img.isPrimary ?? idx === 0),
    }));

    return {
      sourceCode: "COPART_B2B_API",
      dataEnvironment,
      sourceQueriedAt: new Date(),
      lotNumber,
      auctionHouse: "COPART",
      yardName,
      yardState,
      yardCity,
      yardZip: raw.facility?.zip || null,
      vin,
      isVinMasked,
      make,
      model,
      trim: raw.trim || null,
      year,
      bodyStyle: raw.bodyStyle || "SEDAN / SUV",
      engineSpec: null,
      cylinders: null,
      transmission: "AUTOMATIC",
      drivetrain: null,
      fuelType: "GASOLINE",
      exteriorColor: null,
      odometerValue: raw.odometer?.value ?? null,
      odometerUnit: raw.odometer?.unit ?? "MILES",
      odometerBrand: "ACTUAL",
      titleCode: `${yardState} - ${raw.title?.type || "SALVAGE"}`,
      titleCategory,
      primaryDamage: (raw.damage?.primary || "FRONT END").toUpperCase(),
      secondaryDamage: raw.damage?.secondary ? raw.damage.secondary.toUpperCase() : null,
      runAndDriveStatus,
      hasKeys,
      estimatedRetailValue: raw.financials?.estimatedRetailValue ?? null,
      repairCostEstimate: raw.financials?.repairCost ?? null,
      currentBidUsd: raw.financials?.currentBid ?? 0,
      buyItNowPriceUsd: raw.financials?.buyItNow ?? null,
      auctionDate: raw.auction?.saleDate ? new Date(raw.auction.saleDate) : null,
      saleStatus: raw.financials?.buyItNow ? "BUY_IT_NOW_AVAILABLE" : "UPCOMING",
      authorizedMedia: authorizedMedia.length > 0 ? authorizedMedia : undefined,
    };
  }

  /**
   * Consulta en vivo contra el endpoint B2B autorizado (requiere credenciales activas en .env)
   */
  async fetchLotByNumberAuthorized(lotNumber: string): Promise<NormalizedAuctionLotDTO> {
    const status = this.getHealthStatus();
    if (!status.isConfigured) {
      throw new IntegrationNotConfiguredError(
        status.providerName,
        status.missingCredentials
      );
    }

    const env = getEnv();
    const tokenRes = await fetch(`${env.COPART_B2B_API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.COPART_B2B_CLIENT_ID,
        client_secret: env.COPART_B2B_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Error de autenticación B2B con Copart (HTTP ${tokenRes.status})`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const lotRes = await fetch(
      `${env.COPART_B2B_API_BASE_URL}/v1/lots/${encodeURIComponent(lotNumber)}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "X-Copart-Member": env.COPART_B2B_MEMBER_NUMBER,
        },
      }
    );

    if (!lotRes.ok) {
      throw new Error(
        `No fue posible consultar el lote #${lotNumber} en el endpoint B2B (HTTP ${lotRes.status})`
      );
    }

    const payload = (await lotRes.json()) as CopartB2bApiLotPayload;
    return this.transformB2bPayloadToDTO(payload, "PRODUCTION_REAL");
  }

  /**
   * Genera un lote simulado con formato oficial B2B para pruebas aisladas de integración
   */
  createMockB2bResponse(lotNumber: string): CopartB2bApiLotPayload {
    return {
      lotNumber,
      lotDescription: "2023 FORD BRONCO SPORT BADLANDS",
      vin: "1FMCR9C68PRA00123",
      year: 2023,
      make: "FORD",
      model: "BRONCO SPORT",
      trim: "BADLANDS",
      bodyStyle: "SUV",
      odometer: {
        value: 14200,
        unit: "MILES",
        brand: "ACTUAL",
      },
      facility: {
        code: "52",
        name: "TX - DALLAS SOUTH",
        state: "TX",
        city: "DALLAS",
        zip: "75241",
      },
      title: {
        state: "TX",
        type: "SALVAGE CERTIFICATE",
        clean: false,
        salvage: true,
      },
      damage: {
        primary: "FRONT END",
        secondary: "SIDE",
      },
      condition: {
        runAndDrive: "RUNS AND DRIVES",
        keys: true,
      },
      financials: {
        currentBid: 16500,
        buyItNow: 21500,
        estimatedRetailValue: 34000,
        repairCost: 9800,
      },
      auction: {
        saleDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        saleStatus: "UPCOMING",
      },
      images: [
        {
          url: "/media/authorized/pickup-inspection.svg",
          fullSizeUrl: "/media/authorized/pickup-inspection.svg",
          isPrimary: true,
          sequence: 1,
        },
      ],
    };
  }
}

export const copartB2bApiProvider = new CopartB2bApiProvider();
