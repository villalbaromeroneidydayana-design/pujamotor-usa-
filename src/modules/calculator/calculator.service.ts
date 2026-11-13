import { prisma } from "@/shared/db/prisma";
import { auditService } from "@/modules/admin/audit.service";
import { UserRole } from "@/modules/admin/auth.service";

export interface AuctionFeeTier {
  minBid: number;
  maxBid: number | null;
  fixedFeeUsd?: number;
  percentageOfBid?: number;
  virtualBidFeeUsd: number;
}

export interface BrokerFeeRules {
  percentage: number;
  minFeeUsd: number;
  fixedDocumentationFeeUsd: number;
}

export interface InlandTransportStateRoute {
  stateCode: string;
  stateName: string;
  recommendedPort: string;
  towingCostUsd: number;
  estimatedTransitDays: number;
}

export interface OceanFreightRoute {
  departurePort: string;
  destinationCountryCode: string;
  destinationPort: string;
  roroSedanUsd: number;
  roroSuvPickupUsd: number;
  containerSharedUsd: number;
}

export interface DestinationCountryCustomsRule {
  countryCode: string;
  countryName: string;
  defaultPort: string;
  importDutyPercent: number; // Arancel sobre CIF
  vatPercent: number;        // IVA / ITBIS / IGV sobre (CIF + Arancel)
  customsBrokerAndPortFeesUsd: number;
  notes: string;
}

export interface TariffRulesStructure {
  auctionFeeTiers: AuctionFeeTier[];
  gateFeeUsd: number;
  environmentalFeeUsd: number;
  titleMailingFeeUsd: number;
  brokerFeeRules: BrokerFeeRules;
  inlandTransportMatrix: InlandTransportStateRoute[];
  oceanFreightRates: OceanFreightRoute[];
  destinationCustomsRules: DestinationCountryCustomsRule[];
}

export interface CostSimulationInput {
  auctionLotId?: string;
  vehicleSummary?: string;
  vehicleCategory?: "SEDAN_COMPACT" | "SUV_PICKUP";
  bidAmountUsd: number;
  originState: string;
  departurePort?: string;
  destinationCountryCode: string;
  shippingModality?: "RORO" | "CONTAINER_SHARED";
  includeBrokerFee?: boolean;
  includeMarineInsurance?: boolean;
  additionalCostsUsd?: number;
  additionalCostsNote?: string;
  estimatedRetailValue?: number;
  buyItNowPriceUsd?: number;
  maxAuthorizedBidUsd?: number;
  saveSimulation?: boolean;
}

export const DEFAULT_TARIFF_RULES: TariffRulesStructure = {
  auctionFeeTiers: [
    { minBid: 0, maxBid: 499.99, fixedFeeUsd: 130, virtualBidFeeUsd: 0 },
    { minBid: 500, maxBid: 999.99, fixedFeeUsd: 215, virtualBidFeeUsd: 50 },
    { minBid: 1000, maxBid: 1999.99, fixedFeeUsd: 340, virtualBidFeeUsd: 70 },
    { minBid: 2000, maxBid: 3999.99, fixedFeeUsd: 525, virtualBidFeeUsd: 85 },
    { minBid: 4000, maxBid: 5999.99, fixedFeeUsd: 675, virtualBidFeeUsd: 100 },
    { minBid: 6000, maxBid: 7999.99, fixedFeeUsd: 775, virtualBidFeeUsd: 115 },
    { minBid: 8000, maxBid: 9999.99, fixedFeeUsd: 850, virtualBidFeeUsd: 125 },
    { minBid: 10000, maxBid: 14999.99, fixedFeeUsd: 950, virtualBidFeeUsd: 140 },
    { minBid: 15000, maxBid: null, percentageOfBid: 7.0, virtualBidFeeUsd: 160 },
  ],
  gateFeeUsd: 79,
  environmentalFeeUsd: 15,
  titleMailingFeeUsd: 20,
  brokerFeeRules: {
    percentage: 0,
    minFeeUsd: 300,
    fixedDocumentationFeeUsd: 0,
  },
  inlandTransportMatrix: [
    { stateCode: "TX", stateName: "Texas", recommendedPort: "Houston, TX", towingCostUsd: 320, estimatedTransitDays: 2 },
    { stateCode: "FL", stateName: "Florida", recommendedPort: "Miami / Port Everglades, FL", towingCostUsd: 290, estimatedTransitDays: 2 },
    { stateCode: "GA", stateName: "Georgia", recommendedPort: "Savannah, GA", towingCostUsd: 340, estimatedTransitDays: 2 },
    { stateCode: "CA", stateName: "California", recommendedPort: "Los Angeles / Long Beach, CA", towingCostUsd: 360, estimatedTransitDays: 3 },
    { stateCode: "NJ", stateName: "New Jersey", recommendedPort: "Newark, NJ", towingCostUsd: 280, estimatedTransitDays: 2 },
    { stateCode: "NY", stateName: "New York", recommendedPort: "Newark, NJ", towingCostUsd: 390, estimatedTransitDays: 3 },
    { stateCode: "NC", stateName: "North Carolina", recommendedPort: "Savannah, GA", towingCostUsd: 450, estimatedTransitDays: 3 },
    { stateCode: "IL", stateName: "Illinois", recommendedPort: "Houston, TX", towingCostUsd: 780, estimatedTransitDays: 5 },
    { stateCode: "AZ", stateName: "Arizona", recommendedPort: "Los Angeles / Long Beach, CA", towingCostUsd: 520, estimatedTransitDays: 4 },
    { stateCode: "PA", stateName: "Pennsylvania", recommendedPort: "Newark, NJ", towingCostUsd: 380, estimatedTransitDays: 3 },
  ],
  oceanFreightRates: [
    { departurePort: "Houston, TX", destinationCountryCode: "MX", destinationPort: "Veracruz / Frontera Norte", roroSedanUsd: 890, roroSuvPickupUsd: 1050, containerSharedUsd: 1150 },
    { departurePort: "Miami / Port Everglades, FL", destinationCountryCode: "DO", destinationPort: "Haina / Caucedo", roroSedanUsd: 920, roroSuvPickupUsd: 1120, containerSharedUsd: 1200 },
    { departurePort: "Miami / Port Everglades, FL", destinationCountryCode: "GT", destinationPort: "Puerto Barrios / Santo Tomás", roroSedanUsd: 950, roroSuvPickupUsd: 1150, containerSharedUsd: 1250 },
    { departurePort: "Miami / Port Everglades, FL", destinationCountryCode: "HN", destinationPort: "Puerto Cortés", roroSedanUsd: 940, roroSuvPickupUsd: 1140, containerSharedUsd: 1240 },
    { departurePort: "Miami / Port Everglades, FL", destinationCountryCode: "CR", destinationPort: "Puerto Limón", roroSedanUsd: 1080, roroSuvPickupUsd: 1290, containerSharedUsd: 1380 },
    { departurePort: "Miami / Port Everglades, FL", destinationCountryCode: "CO", destinationPort: "Cartagena / Santa Marta", roroSedanUsd: 1190, roroSuvPickupUsd: 1420, containerSharedUsd: 1520 },
    { departurePort: "Savannah, GA", destinationCountryCode: "CL", destinationPort: "Iquique / San Antonio", roroSedanUsd: 1580, roroSuvPickupUsd: 1850, containerSharedUsd: 1950 },
    { departurePort: "Los Angeles / Long Beach, CA", destinationCountryCode: "SV", destinationPort: "Acajutla", roroSedanUsd: 1250, roroSuvPickupUsd: 1450, containerSharedUsd: 1550 },
    { departurePort: "Houston, TX", destinationCountryCode: "PE", destinationPort: "Callao", roroSedanUsd: 1490, roroSuvPickupUsd: 1750, containerSharedUsd: 1890 },
  ],
  destinationCustomsRules: [
    {
      countryCode: "MX",
      countryName: "México",
      defaultPort: "Veracruz / Aduana Fronteriza",
      importDutyPercent: 10,
      vatPercent: 16,
      customsBrokerAndPortFeesUsd: 480,
      notes: "Sujeto a reglas de origen T-MEC / decreto de importación definitiva según año modelo y primer dígito de serie (1, 4, 5).",
    },
    {
      countryCode: "GT",
      countryName: "Guatemala",
      defaultPort: "Puerto Barrios / Santo Tomás de Castilla",
      importDutyPercent: 15,
      vatPercent: 12,
      customsBrokerAndPortFeesUsd: 390,
      notes: "Cálculo estimado de DAI + IVA de importación e IPRIMA referencial ante SAT.",
    },
    {
      countryCode: "DO",
      countryName: "República Dominicana",
      defaultPort: "Puerto de Haina Oriental / Caucedo",
      importDutyPercent: 20,
      vatPercent: 18,
      customsBrokerAndPortFeesUsd: 450,
      notes: "Sujeto a elegibilidad DR-CAFTA para vehículos fabricados en EE. UU. y antigüedad permitida por DGA.",
    },
    {
      countryCode: "HN",
      countryName: "Honduras",
      defaultPort: "Puerto Cortés",
      importDutyPercent: 15,
      vatPercent: 15,
      customsBrokerAndPortFeesUsd: 380,
      notes: "Estimación referencial de DAI, ISV y ecotasa según cilindraje ante Aduanas Honduras.",
    },
    {
      countryCode: "SV",
      countryName: "El Salvador",
      defaultPort: "Puerto de Acajutla",
      importDutyPercent: 15,
      vatPercent: 13,
      customsBrokerAndPortFeesUsd: 410,
      notes: "Incluye estimación de DAI, IVA de importación y primera matrícula referencial.",
    },
    {
      countryCode: "CR",
      countryName: "Costa Rica",
      defaultPort: "Puerto Limón (Moín)",
      importDutyPercent: 30,
      vatPercent: 13,
      customsBrokerAndPortFeesUsd: 520,
      notes: "El valor fiscal en Costa Rica se rige por tabla de Hacienda (Selectivo de Consumo + Ley 6946 + IVA).",
    },
    {
      countryCode: "CO",
      countryName: "Colombia",
      defaultPort: "Puerto de Cartagena / Buenaventura",
      importDutyPercent: 35,
      vatPercent: 19,
      customsBrokerAndPortFeesUsd: 590,
      notes: "En Colombia la importación ordinaria aplica únicamente a vehículos nuevos o regímenes especiales/diplomáticos/clásicos.",
    },
    {
      countryCode: "CL",
      countryName: "Chile",
      defaultPort: "Zona Franca Iquique (ZOFRI) / San Antonio",
      importDutyPercent: 6,
      vatPercent: 19,
      customsBrokerAndPortFeesUsd: 470,
      notes: "Régimen general exige vehículo sin uso salvo excepciones de Zona Franca (Iquique / Punta Arenas) o retorno.",
    },
    {
      countryCode: "PE",
      countryName: "Perú",
      defaultPort: "Puerto del Callao",
      importDutyPercent: 6,
      vatPercent: 18,
      customsBrokerAndPortFeesUsd: 490,
      notes: "Sujeto a límites de antigüedad y kilometraje del Ministerio de Transportes y Comunicaciones (MTC) e ISC.",
    },
  ],
};

export const LEGAL_ESTIMATE_DISCLAIMER =
  "AVISO LEGAL IMPORTANTE: Este cálculo constituye únicamente una ESTIMACIÓN REFERENCIAL NO VINCULANTE basada en las tablas tarifarias vigentes parametrizadas en el sistema. NO representa una cotización definitiva, factura ni compromiso contractual. Las tarifas finales de subasta (Copart), cargos por almacenamiento, fletes terrestres/marítimos y la liquidación exacta de impuestos aduaneros dependen del valor de adjudicación final, peso/dimensiones reales y valoración oficial de la autoridad aduanera del país de destino.";

export class CalculatorService {
  async ensureActiveTariffRuleSet() {
    try {
      const existing = await prisma.tariffRuleSet.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
      });

      if (existing) {
        return {
          record: existing,
          rules: this.parseTariffRecord(existing),
        };
      }

      const created = await prisma.tariffRuleSet.create({
        data: {
          versionCode: "TARIFARIO-2026-OFICIAL-V1",
          name: "Matriz Tarifaria Estándar Subastas EE. UU. y Logística Internacional 2026",
          description: "Escalas parametrizables de Buyer Fees, Broker, Grúa Interna, Flete Marítimo y Aduanas por destino.",
          isActive: true,
          auctionFeeScheduleJson: JSON.stringify({
            tiers: DEFAULT_TARIFF_RULES.auctionFeeTiers,
            gateFeeUsd: DEFAULT_TARIFF_RULES.gateFeeUsd,
            environmentalFeeUsd: DEFAULT_TARIFF_RULES.environmentalFeeUsd,
            titleMailingFeeUsd: DEFAULT_TARIFF_RULES.titleMailingFeeUsd,
          }),
          brokerFeeRulesJson: JSON.stringify(DEFAULT_TARIFF_RULES.brokerFeeRules),
          inlandTransportMatrixJson: JSON.stringify(DEFAULT_TARIFF_RULES.inlandTransportMatrix),
          oceanFreightRatesJson: JSON.stringify(DEFAULT_TARIFF_RULES.oceanFreightRates),
          destinationCustomsRulesJson: JSON.stringify(DEFAULT_TARIFF_RULES.destinationCustomsRules),
        },
      });

      return {
        record: created,
        rules: DEFAULT_TARIFF_RULES,
      };
    } catch {
      return {
        record: {
          id: "default-rule-set",
          versionCode: "TARIFARIO-2026-OFICIAL-V1",
          name: "Matriz Tarifaria Estándar Subastas EE. UU. y Logística Internacional 2026",
          description: "Escalas parametrizables oficiales",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        rules: DEFAULT_TARIFF_RULES,
      };
    }
  }

  private parseTariffRecord(record: {
    auctionFeeScheduleJson: string;
    brokerFeeRulesJson: string;
    inlandTransportMatrixJson: string;
    oceanFreightRatesJson: string;
    destinationCustomsRulesJson: string;
  }): TariffRulesStructure {
    try {
      const auctionSched = JSON.parse(record.auctionFeeScheduleJson);
      return {
        auctionFeeTiers: auctionSched.tiers ?? DEFAULT_TARIFF_RULES.auctionFeeTiers,
        gateFeeUsd: auctionSched.gateFeeUsd ?? DEFAULT_TARIFF_RULES.gateFeeUsd,
        environmentalFeeUsd: auctionSched.environmentalFeeUsd ?? DEFAULT_TARIFF_RULES.environmentalFeeUsd,
        titleMailingFeeUsd: auctionSched.titleMailingFeeUsd ?? DEFAULT_TARIFF_RULES.titleMailingFeeUsd,
        brokerFeeRules: JSON.parse(record.brokerFeeRulesJson),
        inlandTransportMatrix: JSON.parse(record.inlandTransportMatrixJson),
        oceanFreightRates: JSON.parse(record.oceanFreightRatesJson),
        destinationCustomsRules: JSON.parse(record.destinationCustomsRulesJson),
      };
    } catch {
      return DEFAULT_TARIFF_RULES;
    }
  }

  /**
   * Ejecuta el cálculo determinista de todos los componentes de costo y devuelve el desglose completo
   */
  async calculateEstimate(input: CostSimulationInput) {
    const { record: tariffRecord, rules } = await this.ensureActiveTariffRuleSet();
    const bidAmountUsd = Math.max(0, Number(input.bidAmountUsd) || 0);

    // 1. Tarifas de Subasta (Buyer Fee + Virtual Bid Fee + Gate/Env/Mailing Fee)
    const matchedTier =
      rules.auctionFeeTiers.find(
        (t) =>
          bidAmountUsd >= t.minBid &&
          (t.maxBid === null || bidAmountUsd <= t.maxBid)
      ) ?? rules.auctionFeeTiers[rules.auctionFeeTiers.length - 1];

    // Cálculos de rango comercial orientativo (40%-60% del minorista estimado y 60%-75% de Buy It Now)
    let retailValue = input.estimatedRetailValue ?? null;
    let binPrice = input.buyItNowPriceUsd ?? null;

    if (input.auctionLotId && (retailValue === null || binPrice === null)) {
      const lot = await prisma.auctionLot.findUnique({
        where: { id: input.auctionLotId },
        select: { estimatedRetailValue: true, buyItNowPriceUsd: true },
      });
      if (lot) {
        if (retailValue === null && lot.estimatedRetailValue) retailValue = lot.estimatedRetailValue;
        if (binPrice === null && lot.buyItNowPriceUsd) binPrice = lot.buyItNowPriceUsd;
      }
    }

    const targetBidRange = retailValue
      ? {
          minPercent: 40,
          maxPercent: 60,
          minBidUsd: Math.round(retailValue * 0.4),
          maxBidUsd: Math.round(retailValue * 0.6),
          disclaimer:
            "Rango de referencia orientativo para compra inteligente en subasta (40% al 60% del valor minorista estimado). No garantiza adjudicación ni precio final cerrado.",
        }
      : null;

    const buyItNowGuideline = binPrice
      ? {
          minPercent: 60,
          maxPercent: 75,
          minBidUsd: Math.round(binPrice * 0.6),
          maxBidUsd: Math.round(binPrice * 0.75),
          disclaimer:
            "Guía de referencia frente al precio de compra inmediata (60% al 75% del Buy It Now).",
        }
      : null;

    const auctionBuyerFeeUsd = matchedTier.percentageOfBid
      ? Math.round(bidAmountUsd * (matchedTier.percentageOfBid / 100))
      : matchedTier.fixedFeeUsd ?? 500;

    const auctionVirtualBidFeeUsd = matchedTier.virtualBidFeeUsd;
    const auctionGateAndEnvFeeUsd =
      rules.gateFeeUsd + rules.environmentalFeeUsd + rules.titleMailingFeeUsd;

    // 2. Tarifa de Intermediación / Fee de PUJAMOTOR USA (PDF 1)
    // El fee oficial está entre $300 y $500, según el valor del vehículo, y se cancela
    // ÚNICAMENTE cuando el cliente tiene el vehículo en sus manos.
    const includeBroker = input.includeBrokerFee ?? true;
    let brokerFeeUsd = 0;
    if (includeBroker) {
      if (bidAmountUsd <= 5000) {
        brokerFeeUsd = 300;
      } else if (bidAmountUsd <= 15000) {
        brokerFeeUsd = 400;
      } else {
        brokerFeeUsd = 500;
      }
    }

    // 3. Transporte Terrestre Interno en EE. UU. (Grúa de Yarda a Puerto)
    const stateRoute =
      rules.inlandTransportMatrix.find(
        (s) => s.stateCode.toUpperCase() === input.originState.toUpperCase()
      ) ?? {
        stateCode: input.originState.toUpperCase(),
        stateName: input.originState.toUpperCase(),
        recommendedPort: "Houston, TX",
        towingCostUsd: 495,
        estimatedTransitDays: 4,
      };

    const departurePort = input.departurePort || stateRoute.recommendedPort;
    const inlandTransportUsd = stateRoute.towingCostUsd;

    // 4. Destino y Flete Marítimo Internacional
    const destRule =
      rules.destinationCustomsRules.find(
        (d) => d.countryCode.toUpperCase() === input.destinationCountryCode.toUpperCase()
      ) ?? rules.destinationCustomsRules[0];

    const matchedOceanRoute = rules.oceanFreightRates.find(
      (r) =>
        r.destinationCountryCode.toUpperCase() === destRule.countryCode.toUpperCase()
    );

    const modality = input.shippingModality ?? "RORO";
    const vehicleCategory = input.vehicleCategory ?? "SUV_PICKUP";

    let oceanFreightUsd = 1150;
    if (matchedOceanRoute) {
      if (modality === "CONTAINER_SHARED") {
        oceanFreightUsd = matchedOceanRoute.containerSharedUsd;
      } else {
        oceanFreightUsd =
          vehicleCategory === "SEDAN_COMPACT"
            ? matchedOceanRoute.roroSedanUsd
            : matchedOceanRoute.roroSuvPickupUsd;
      }
    }

    const includeInsurance = input.includeMarineInsurance ?? true;
    const marineInsuranceUsd = includeInsurance
      ? Math.max(95, Math.round((bidAmountUsd + oceanFreightUsd) * 0.015))
      : 0;

    // 5. Gastos de Documentación y Despacho Aduanal
    const documentationFeesUsd =
      rules.brokerFeeRules.fixedDocumentationFeeUsd + destRule.customsBrokerAndPortFeesUsd;

    // 6. Impuestos y Aduanas según País de Destino (sobre base CIF estimada)
    const cifBaseUsd =
      bidAmountUsd + auctionBuyerFeeUsd + inlandTransportUsd + oceanFreightUsd + marineInsuranceUsd;

    const customsDutyUsd = Math.round(cifBaseUsd * (destRule.importDutyPercent / 100));
    const importVatAndTaxesUsd = Math.round(
      (cifBaseUsd + customsDutyUsd) * (destRule.vatPercent / 100)
    );

    const additionalCostsUsd = Math.max(0, Number(input.additionalCostsUsd) || 0);

    const totalAuctionAndPurchaseUsd =
      bidAmountUsd +
      auctionBuyerFeeUsd +
      auctionVirtualBidFeeUsd +
      auctionGateAndEnvFeeUsd +
      brokerFeeUsd;

    const totalLogisticsUsd =
      inlandTransportUsd + oceanFreightUsd + marineInsuranceUsd + documentationFeesUsd;

    const totalCustomsAndTaxesUsd = customsDutyUsd + importVatAndTaxesUsd;

    const totalEstimatedUsd =
      totalAuctionAndPurchaseUsd +
      totalLogisticsUsd +
      totalCustomsAndTaxesUsd +
      additionalCostsUsd;

    const simulationCode = `SIM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    let savedRecordId: string | null = null;
    if (input.saveSimulation) {
      const saved = await prisma.costEstimate.create({
        data: {
          simulationCode,
          auctionLotId: input.auctionLotId ?? null,
          tariffRuleSetId: tariffRecord.id,
          vehicleSummary: input.vehicleSummary ?? "Simulación personalizada de vehículo en subasta",
          originState: stateRoute.stateCode,
          departurePort,
          destinationCountryCode: destRule.countryCode,
          destinationCountryName: destRule.countryName,
          destinationPort: destRule.defaultPort,
          shippingModality: modality,
          bidAmountUsd,
          auctionBuyerFeeUsd,
          auctionVirtualBidFeeUsd,
          auctionGateAndEnvFeeUsd,
          brokerFeeUsd,
          inlandTransportUsd,
          oceanFreightUsd,
          marineInsuranceUsd,
          documentationFeesUsd,
          customsDutyUsd,
          importVatAndTaxesUsd,
          additionalCostsUsd,
          additionalCostsNote: input.additionalCostsNote ?? null,
          totalEstimatedUsd,
          isBindingQuote: false,
          disclaimerText: LEGAL_ESTIMATE_DISCLAIMER,
        },
      });
      savedRecordId = saved.id;
    }

    return {
      id: savedRecordId,
      simulationCode,
      tariffVersionCode: tariffRecord.versionCode,
      vehicleSummary: input.vehicleSummary ?? "Simulación personalizada",
      originState: stateRoute.stateCode,
      originStateName: stateRoute.stateName,
      departurePort,
      destinationCountryCode: destRule.countryCode,
      destinationCountryName: destRule.countryName,
      destinationPort: destRule.defaultPort,
      destinationNotes: destRule.notes,
      shippingModality: modality,
      breakdown: {
        bidAmountUsd,
        estimatedRetailValue: retailValue,
        buyItNowPriceUsd: binPrice,
        targetBidRange,
        buyItNowGuideline,
        auctionBuyerFeeUsd,
        auctionVirtualBidFeeUsd,
        auctionGateAndEnvFeeUsd,
        totalAuctionFeesUsd:
          auctionBuyerFeeUsd + auctionVirtualBidFeeUsd + auctionGateAndEnvFeeUsd,
        brokerFeeUsd,
        inlandTransportUsd,
        oceanFreightUsd,
        marineInsuranceUsd,
        documentationFeesUsd,
        customsDutyUsd,
        importDutyPercent: destRule.importDutyPercent,
        importVatAndTaxesUsd,
        vatPercent: destRule.vatPercent,
         totalCustomsAndTaxesUsd,
        additionalCostsUsd,
        totalEstimatedUsd,
      },
      targetBidRange,
      buyItNowGuideline,
      isBindingQuote: false,
      disclaimerText: LEGAL_ESTIMATE_DISCLAIMER,
    };
  }

  /**
   * Permite actualizar los parámetros de tarifas y aduanas desde el Panel Administrativo
   */
  async updateTariffParameters(input: {
    gateFeeUsd?: number;
    environmentalFeeUsd?: number;
    brokerPercentage?: number;
    brokerMinFeeUsd?: number;
    fixedDocumentationFeeUsd?: number;
    inlandTransportMatrix?: InlandTransportStateRoute[];
    destinationCustomsRules?: DestinationCountryCustomsRule[];
    actorUserId?: string | null;
    actorRole: UserRole;
  }) {
    const { record, rules } = await this.ensureActiveTariffRuleSet();

    const updatedGateFee = input.gateFeeUsd ?? rules.gateFeeUsd;
    const updatedEnvFee = input.environmentalFeeUsd ?? rules.environmentalFeeUsd;
    const updatedBrokerRules: BrokerFeeRules = {
      percentage: input.brokerPercentage ?? rules.brokerFeeRules.percentage,
      minFeeUsd: input.brokerMinFeeUsd ?? rules.brokerFeeRules.minFeeUsd,
      fixedDocumentationFeeUsd:
        input.fixedDocumentationFeeUsd ?? rules.brokerFeeRules.fixedDocumentationFeeUsd,
    };
    const updatedInland = input.inlandTransportMatrix ?? rules.inlandTransportMatrix;
    const updatedCustoms = input.destinationCustomsRules ?? rules.destinationCustomsRules;

    const updated = await prisma.tariffRuleSet.update({
      where: { id: record.id },
      data: {
        auctionFeeScheduleJson: JSON.stringify({
          tiers: rules.auctionFeeTiers,
          gateFeeUsd: updatedGateFee,
          environmentalFeeUsd: updatedEnvFee,
          titleMailingFeeUsd: rules.titleMailingFeeUsd,
        }),
        brokerFeeRulesJson: JSON.stringify(updatedBrokerRules),
        inlandTransportMatrixJson: JSON.stringify(updatedInland),
        destinationCustomsRulesJson: JSON.stringify(updatedCustoms),
        updatedByUserId: input.actorUserId ?? null,
      },
    });

    await auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      action: "TARIFF_RULES_UPDATED",
      module: "CALCULATOR",
      targetType: "TariffRuleSet",
      targetId: updated.id,
      details: {
        versionCode: updated.versionCode,
        updatedBrokerRules,
        gateFeeUsd: updatedGateFee,
      },
    });

    return {
      record: updated,
      rules: this.parseTariffRecord(updated),
    };
  }
}

export const calculatorService = new CalculatorService();

