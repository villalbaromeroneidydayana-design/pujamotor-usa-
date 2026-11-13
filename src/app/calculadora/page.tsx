"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calculator,
  AlertTriangle,
  Ship,
  Truck,
  Landmark,
  DollarSign,
  Send,
  FileText,
} from "lucide-react";

interface SimulationOutput {
  simulationCode: string;
  tariffVersionCode: string;
  vehicleSummary: string;
  originState: string;
  originStateName: string;
  departurePort: string;
  destinationCountryCode: string;
  destinationCountryName: string;
  destinationPort: string;
  destinationNotes: string;
  shippingModality: string;
  breakdown: {
    bidAmountUsd: number;
    auctionBuyerFeeUsd: number;
    auctionVirtualBidFeeUsd: number;
    auctionGateAndEnvFeeUsd: number;
    totalAuctionFeesUsd: number;
    brokerFeeUsd: number;
    inlandTransportUsd: number;
    oceanFreightUsd: number;
    marineInsuranceUsd: number;
    documentationFeesUsd: number;
    customsDutyUsd: number;
    importDutyPercent: number;
    importVatAndTaxesUsd: number;
    vatPercent: number;
    totalCustomsAndTaxesUsd: number;
    additionalCostsUsd: number;
    totalEstimatedUsd: number;
  };
  disclaimerText: string;
}

function CalculatorContent() {
  const searchParams = useSearchParams();
  const initialLotNumber = searchParams.get("lotNumber") || "";
  const initialBid = Number(searchParams.get("bid")) || 12500;
  const initialState = searchParams.get("state") || "TX";

  const [lotNumber, setLotNumber] = useState(initialLotNumber);
  const [vehicleCategory, setVehicleCategory] = useState<"SEDAN_COMPACT" | "SUV_PICKUP">(
    "SUV_PICKUP"
  );
  const [bidAmountUsd, setBidAmountUsd] = useState(initialBid);
  const [originState, setOriginState] = useState(initialState);
  const [destinationCountryCode, setDestinationCountryCode] = useState("MX");
  const [shippingModality, setShippingModality] = useState<"RORO" | "CONTAINER_SHARED">("RORO");
  const [includeBrokerFee, setIncludeBrokerFee] = useState(true);
  const [includeMarineInsurance, setIncludeMarineInsurance] = useState(true);
  const [additionalCostsUsd, setAdditionalCostsUsd] = useState(0);
  const [additionalCostsNote, setAdditionalCostsNote] = useState("");

  const [estimate, setEstimate] = useState<SimulationOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = useCallback(
    async (saveToDb = false) => {
      setLoading(true);
      try {
        const res = await fetch("/api/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleSummary: lotNumber
              ? `Simulación Lote #${lotNumber}`
              : `Simulación ${vehicleCategory === "SUV_PICKUP" ? "SUV / Pickup" : "Sedán / Compacto"}`,
            vehicleCategory,
            bidAmountUsd,
            originState,
            destinationCountryCode,
            shippingModality,
            includeBrokerFee,
            includeMarineInsurance,
            additionalCostsUsd,
            additionalCostsNote,
            saveSimulation: saveToDb,
          }),
        });
        const data = await res.json();
        if (data.estimate) {
          setEstimate(data.estimate);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      lotNumber,
      vehicleCategory,
      bidAmountUsd,
      originState,
      destinationCountryCode,
      shippingModality,
      includeBrokerFee,
      includeMarineInsurance,
      additionalCostsUsd,
      additionalCostsNote,
    ]
  );

  useEffect(() => {
    runSimulation(false);
  }, [runSimulation]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 mb-2">
          <Calculator className="h-3.5 w-3.5 text-amber-400" />
          MOTOR PARAMÉTRICO DE ESTIMACIÓN LOGÍSTICA Y ADUANAL
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Calculadora de Costos de Subasta, Transporte e Importación
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-300">
          Estime el costo total de adquisición considerando precio de puja, escalas de subasta de Copart, comisión de intermediario, grúa terrestre en EE. UU., flete marítimo, documentación y aranceles según el país de destino.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Panel de Parámetros de Entrada */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-5 h-fit">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Parámetros de Simulación (Modificables en Tiempo Real)
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Precio de Compra / Puja (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={bidAmountUsd}
                  onChange={(e) => setBidAmountUsd(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-amber-500/50 bg-slate-950 px-3 py-2 font-mono text-base font-bold text-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Número de Lote (Opcional)
                </label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Ej. DEMO-78410201"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Tipo / Dimensiones de Vehículo
                </label>
                <select
                  value={vehicleCategory}
                  onChange={(e) =>
                    setVehicleCategory(e.target.value as "SEDAN_COMPACT" | "SUV_PICKUP")
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="SUV_PICKUP">SUV / Pickup / Camioneta</option>
                  <option value="SEDAN_COMPACT">Sedán / Compacto / Coupé</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Ubicación Yarda EE. UU. (Estado)
                </label>
                <select
                  value={originState}
                  onChange={(e) => setOriginState(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="TX">Texas (TX - Houston/Dallas)</option>
                  <option value="FL">Florida (FL - Miami/Orlando)</option>
                  <option value="GA">Georgia (GA - Savannah/Atlanta)</option>
                  <option value="CA">California (CA - Los Angeles)</option>
                  <option value="NJ">New Jersey (NJ - Newark)</option>
                  <option value="NY">New York (NY - Long Island)</option>
                  <option value="NC">North Carolina (NC - Raleigh)</option>
                  <option value="IL">Illinois (IL - Chicago)</option>
                  <option value="AZ">Arizona (AZ - Phoenix)</option>
                  <option value="PA">Pennsylvania (PA - Philadelphia)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  País de Destino (Aduana)
                </label>
                <select
                  value={destinationCountryCode}
                  onChange={(e) => setDestinationCountryCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="MX">México</option>
                  <option value="GT">Guatemala</option>
                  <option value="DO">República Dominicana</option>
                  <option value="HN">Honduras</option>
                  <option value="SV">El Salvador</option>
                  <option value="CR">Costa Rica</option>
                  <option value="CO">Colombia</option>
                  <option value="CL">Chile</option>
                  <option value="PE">Perú</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Modalidad Transporte Marítimo
                </label>
                <select
                  value={shippingModality}
                  onChange={(e) =>
                    setShippingModality(e.target.value as "RORO" | "CONTAINER_SHARED")
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="RORO">Buque Ro-Ro (Roll-on/Roll-off)</option>
                  <option value="CONTAINER_SHARED">Contenedor Compartido</option>
                </select>
              </div>
            </div>

            {/* Opciones de Intermediario y Seguro */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Incluir Tarifa de Intermediario / Broker Autorizado
                </span>
                <input
                  type="checkbox"
                  checked={includeBrokerFee}
                  onChange={(e) => setIncludeBrokerFee(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Incluir Seguro Marítimo de Tránsito Internacional (1.5%)
                </span>
                <input
                  type="checkbox"
                  checked={includeMarineInsurance}
                  onChange={(e) => setIncludeMarineInsurance(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                />
              </label>
            </div>

            {/* Costos adicionales editables */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Costos Adicionales (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={additionalCostsUsd}
                  onChange={(e) => setAdditionalCostsUsd(Number(e.target.value) || 0)}
                  placeholder="Ej. Inspección / Almacenaje"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Concepto Costo Adicional
                </label>
                <input
                  type="text"
                  value={additionalCostsNote}
                  onChange={(e) => setAdditionalCostsNote(e.target.value)}
                  placeholder="Ej. Reporte inspección patio"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Resultados Desglosados */}
        <div className="lg:col-span-7 space-y-6">
          {estimate ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    CÓDIGO DE SIMULACIÓN: {estimate.simulationCode}
                  </span>
                  <h2 className="text-xl font-extrabold text-white">
                    Hoja de Desglose de Costos Estimados
                  </h2>
                </div>
                <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300">
                  Tarifario: {estimate.tariffVersionCode}
                </span>
              </div>

              {/* Bloques de Desglose */}
              <div className="space-y-4">
                {/* Bloque A: Compra y Subasta */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4 space-y-2.5">
                  <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400">
                    <DollarSign className="h-4 w-4" />
                    A. Adquisición en Subasta e Intermediación (EE. UU.)
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Precio de compra (Puja base):</span>
                      <span className="text-white font-bold">
                        ${estimate.breakdown.bidAmountUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tarifa de comprador subasta (Buyer Fee):</span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.auctionBuyerFeeUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tarifa de puja virtual (Virtual Bid Fee):</span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.auctionVirtualBidFeeUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Gate Fee + Environmental Fee + Envío de Título:
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.auctionGateAndEnvFeeUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
                      <span className="text-slate-300">
                        Tarifa del intermediario / Broker autorizado:
                      </span>
                      <span className="text-sky-300 font-semibold">
                        ${estimate.breakdown.brokerFeeUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque B: Transporte Interno, Marítimo y Documentación */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4 space-y-2.5">
                  <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-sky-400">
                    <Ship className="h-4 w-4" />
                    B. Transporte Interno, Flete Marítimo y Documentación
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-slate-500" />
                        Transporte terrestre interno ({estimate.originState} → Puerto{" "}
                        {estimate.departurePort}):
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.inlandTransportUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Transporte marítimo ({estimate.shippingModality} → {estimate.destinationPort}):
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.oceanFreightUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seguro marítimo estimado:</span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.marineInsuranceUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        Gastos de documentación (BL, SED/AES y despacho portuario):
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.documentationFeesUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque C: Impuestos, Aduanas y Costos Adicionales */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4 space-y-2.5">
                  <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                    <Landmark className="h-4 w-4" />
                    C. Impuestos, Aduanas ({estimate.destinationCountryName}) y Costos Adicionales
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Arancel de importación estimado ({estimate.breakdown.importDutyPercent}%):
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.customsDutyUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        IVA e impuestos en aduana ({estimate.breakdown.vatPercent}%):
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.importVatAndTaxesUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Costos adicionales personalizados{" "}
                        {additionalCostsNote ? `(${additionalCostsNote})` : ""}:
                      </span>
                      <span className="text-slate-200">
                        ${estimate.breakdown.additionalCostsUsd.toLocaleString("en-US")} USD
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <strong>Nota regulatoria destino:</strong> {estimate.destinationNotes}
                  </p>
                </div>
              </div>

              {/* Total General Estimado */}
              <div className="rounded-xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-amber-300">
                    TOTAL GENERAL ESTIMADO (NO CONSTITUYE COTIZACIÓN DEFINITIVA)
                  </span>
                  <span className="text-xs text-slate-300">
                    Incluye compra en subasta, tarifas, grúa en EE. UU., flete marítimo e impuestos estimados en {estimate.destinationCountryName}
                  </span>
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-400">
                  ${estimate.breakdown.totalEstimatedUsd.toLocaleString("en-US")}{" "}
                  <span className="text-sm font-normal text-slate-300">USD</span>
                </div>
              </div>

              {/* Aviso Legal Obligatorio */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{estimate.disclaimerText}</p>
              </div>

              {/* Acciones de Conversión a Solicitud Comercial */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400">
                  ¿Desea que un especialista valide este cálculo con tarifas navieras y aduanales del día?
                </span>
                <Link
                  href={`/asesoria?lotNumber=${encodeURIComponent(
                    lotNumber
                  )}&country=${destinationCountryCode}&budget=${
                    estimate.breakdown.totalEstimatedUsd
                  }`}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Solicitar Revisión Formal por un Asesor
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center font-mono text-sm text-slate-400">
              {loading ? "Calculando estimación..." : "Configure los parámetros para simular."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-sm text-slate-400">
          Cargando calculadora de costos...
        </div>
      }
    >
      <CalculatorContent />
    </Suspense>
  );
}

