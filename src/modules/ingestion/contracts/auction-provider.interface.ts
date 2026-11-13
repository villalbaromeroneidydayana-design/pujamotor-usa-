export type DataEnvironmentType = "PRODUCTION_REAL" | "DEMO_SANDBOX";
export type CompletenessStatusType = "CONFIRMED" | "PENDING_VERIFICATION" | "INCOMPLETE";

export interface AuthorizedMediaInput {
  mediaType: "PHOTO_EXTERIOR" | "PHOTO_INTERIOR" | "PHOTO_ENGINE" | "PHOTO_DAMAGE" | "PHOTO_VIN";
  title: string;
  url: string;
  originReference: string;
  isAuthorizedCopy: boolean;
  isPrimary?: boolean;
}

export interface NormalizedAuctionLotDTO {
  // Identidad de fuente
  sourceCode: "COPART_CSV_MEMBER" | "COPART_B2B_API" | "MANUAL_VERIFIED" | "DEMO_SANDBOX_GENERATOR";
  dataEnvironment: DataEnvironmentType;
  sourceQueriedAt?: Date;

  // Datos de lote de subasta
  lotNumber: string;
  auctionHouse?: "COPART" | "OTHER_AUTHORIZED";
  yardName: string;
  yardState: string;
  yardCity: string;
  yardZip?: string | null;

  // Datos técnicos del vehículo
  vin?: string | null;
  isVinMasked?: boolean;
  vinDecodedByNhtsa?: boolean;
  make: string;
  model: string;
  trim?: string | null;
  year: number;
  bodyStyle?: string | null;
  engineSpec?: string | null;
  cylinders?: number | null;
  transmission?: string | null;
  drivetrain?: string | null;
  fuelType?: string | null;
  exteriorColor?: string | null;
  manufacturedIn?: string | null;

  // Condición, kilometraje y título
  odometerValue?: number | null;
  odometerUnit?: "MILES" | "KM";
  odometerBrand?: "ACTUAL" | "EXEMPT" | "NOT_ACTUAL" | "INOPERABLE";
  titleCode?: string | null;
  titleCategory: "CLEAN" | "SALVAGE" | "REBUILT" | "EXPORT_ONLY" | "NON_REPAIRABLE" | "PENDING";
  primaryDamage: string;
  secondaryDamage?: string | null;
  damageNotes?: string | null;
  runAndDriveStatus: "RUNS_AND_DRIVES" | "ENGINE_START_PROGRAM" | "ENHANCED" | "STATIONARY" | "UNKNOWN";
  hasKeys?: boolean | null;

  // Precios, fechas y disponibilidad
  estimatedRetailValue?: number | null;
  repairCostEstimate?: number | null;
  currentBidUsd: number;
  buyItNowPriceUsd?: number | null;
  sellerType?: string | null;
  requiresBrokerLicense?: boolean;
  auctionDate?: Date | null;
  saleStatus?: "UPCOMING" | "LIVE_AUCTION" | "ON_APPROVAL" | "BUY_IT_NOW_AVAILABLE" | "SOLD" | "ARCHIVED";

  // Medios autorizados
  authorizedMedia?: AuthorizedMediaInput[];
}

export interface ProviderHealthStatus {
  providerCode: string;
  providerName: string;
  integrationType: "CSV_MEMBER_EXPORT" | "B2B_REST_API" | "OFFICIAL_GOV_API";
  isConfigured: boolean;
  isReadyForLiveUse: boolean;
  requiresExternalCredentials: boolean;
  missingCredentials: string[];
  legalComplianceNotice: string;
}

