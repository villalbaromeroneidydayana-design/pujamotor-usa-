import {
  CompletenessStatusType,
  NormalizedAuctionLotDTO,
} from "../contracts/auction-provider.interface";

export interface CompletenessValidationResult {
  status: CompletenessStatusType;
  missingFields: string[];
  canBePublishedInCatalog: boolean;
  verificationSummary: string;
}

/**
 * Neutraliza vectores de CSV Injection (Fórmulas de Excel/LibreOffice que inician con =, +, -, @)
 */
export function sanitizeCsvCell(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return trimmed.replace(/^[=+\-@]+/, "").trim();
  }
  return trimmed;
}

/**
 * Evalúa qué tan completa y verificada está la información de un lote.
 * Distingue entre:
 * - CONFIRMED: Todos los campos esenciales y de condición verificados.
 * - PENDING_VERIFICATION: Datos principales presentes pero faltan detalles secundarios (ej. VIN completo, llaves, fecha exacta o fotos autorizadas).
 * - INCOMPLETE: Faltan atributos críticos obligatorios (ej. número de lote, marca, modelo, año válido, daño primario o ubicación).
 */
export function evaluateLotCompleteness(
  dto: NormalizedAuctionLotDTO
): CompletenessValidationResult {
  const criticalMissing: string[] = [];
  const pendingVerification: string[] = [];

  if (!dto.lotNumber || dto.lotNumber.trim().length < 4) {
    criticalMissing.push("lotNumber (Número de lote)");
  }
  if (!dto.make || dto.make.trim().length < 2) {
    criticalMissing.push("make (Marca)");
  }
  if (!dto.model || dto.model.trim().length < 1) {
    criticalMissing.push("model (Modelo)");
  }
  if (!dto.year || dto.year < 1950 || dto.year > new Date().getFullYear() + 2) {
    criticalMissing.push("year (Año válido)");
  }
  if (!dto.yardState || !dto.yardName) {
    criticalMissing.push("yardLocation (Ubicación de yarda en EE. UU.)");
  }
  if (!dto.primaryDamage || dto.primaryDamage === "UNKNOWN") {
    criticalMissing.push("primaryDamage (Descripción de daño primario)");
  }

  // Verificaciones de segundo nivel (generan estado PENDING_VERIFICATION si faltan)
  if (!dto.vin || dto.vin.trim().length < 11) {
    pendingVerification.push("vin (VIN no publicado por la fuente)");
  } else if (dto.isVinMasked || dto.vin.includes("*")) {
    pendingVerification.push("vinCompleto (VIN parcialmente enmascarado por subasta)");
  }

  if (dto.odometerValue === null || dto.odometerValue === undefined) {
    pendingVerification.push("odometerValue (Lectura de kilometraje/millaje)");
  }

  if (!dto.titleCode && dto.titleCategory === "PENDING") {
    pendingVerification.push("titleCategory (Tipo de título pendiente de confirmación)");
  }

  if (!dto.auctionDate) {
    pendingVerification.push("auctionDate (Fecha de subasta por asignar / Future Lot)");
  }

  if (dto.hasKeys === null || dto.hasKeys === undefined) {
    pendingVerification.push("hasKeys (Confirmación de llaves)");
  }

  const hasAuthorizedPhotos = (dto.authorizedMedia ?? []).some(
    (m) => m.isAuthorizedCopy && Boolean(m.url)
  );
  if (!hasAuthorizedPhotos) {
    pendingVerification.push("authorizedPhotos (Fotografías autorizadas pendientes de vinculación)");
  }

  if (dto.dataEnvironment === "PRODUCTION_REAL") {
    const isAuthorizedSource =
      dto.sourceCode === "COPART_CSV_MEMBER" ||
      dto.sourceCode === "COPART_B2B_API" ||
      dto.sourceCode === "MANUAL_VERIFIED";

    if (!isAuthorizedSource) {
      criticalMissing.push("sourceProvenance (Fuente de procedencia autorizada no verificable)");
    }

    if (!dto.yardState || !dto.yardName) {
      criticalMissing.push("yardLocation (Ubicación de yarda oficial en EE. UU.)");
    }
  }

  if (criticalMissing.length > 0) {
    return {
      status: "INCOMPLETE",
      missingFields: [...criticalMissing, ...pendingVerification],
      canBePublishedInCatalog: false,
      verificationSummary: `Información crítica incompleta (${criticalMissing.length} campos obligatorios faltantes). Bloqueado para publicación hasta completar.`,
    };
  }

  if (pendingVerification.length > 0) {
    return {
      status: "PENDING_VERIFICATION",
      missingFields: pendingVerification,
      canBePublishedInCatalog: true,
      verificationSummary:
        dto.dataEnvironment === "PRODUCTION_REAL"
          ? `Lote operativo real con ${pendingVerification.length} atributo(s) secundarios sujetos a verificación previa antes de la puja.`
          : `Lote de demostración con ${pendingVerification.length} atributo(s) secundarios sujetos a verificación previa.`,
    };
  }

  return {
    status: "CONFIRMED",
    missingFields: [],
    canBePublishedInCatalog: true,
    verificationSummary: "Todos los atributos técnicos, documentales y de subasta están verificados.",
  };
}

