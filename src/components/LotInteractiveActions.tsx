"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calculator, Send, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface LotInteractiveProps {
  lotId: string;
  lotNumber: string;
  vehicleSummary: string;
  initialBidUsd: number;
  yardState: string;
}

interface EstimateResult {
  simulationCode: string;
  departurePort: string;
  destinationCountryName: string;
  destinationPort: string;
  destinationNotes: string;
  breakdown: {
    bidAmountUsd: number;
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
    additionalCostsUsd: number;
    totalEstimatedUsd: number;
  };
  disclaimerText: string;
}

export function LotInteractiveActions({
  lotId,
  lotNumber,
  vehicleSummary,
  initialBidUsd,
  yardState,
}: LotInteractiveProps) {
  // Estado para calculadora integrada en la ficha
  const [bidUsd, setBidUsd] = useState(initialBidUsd || 10000);
  const [destinationCountryCode, setDestinationCountryCode] = useState("MX");
  const [shippingModality, setShippingModality] = useState<"RORO" | "CONTAINER_SHARED">("RORO");
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Estado para formulario comercial de evaluación y cotización
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [requestedServices, setRequestedServices] = useState("FULL_IMPORT_ADVISORY");
  const [customerMessage, setCustomerMessage] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteReference, setQuoteReference] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const runCalculation = useCallback(async () => {
    setCalcLoading(true);
    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionLotId: lotId,
          vehicleSummary,
          bidAmountUsd: bidUsd,
          originState: yardState,
          destinationCountryCode,
          shippingModality,
          includeBrokerFee: true,
          includeMarineInsurance: true,
        }),
      });
      const data = await res.json();
      if (data.estimate) {
        setEstimate(data.estimate);
      }
    } catch (err) {
      console.error("Error simulando costos del lote:", err);
    } finally {
      setCalcLoading(false);
    }
  }, [lotId, vehicleSummary, bidUsd, yardState, destinationCountryCode, shippingModality]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQuote(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLIC_CREATE_INQUIRY",
          fullName,
          email,
          phoneWhatsapp,
          country: destinationCountryCode,
          targetVehicle: `${vehicleSummary} (Lote #${lotNumber})`,
          requestedServices,
          maxBudgetUsd: estimate?.breakdown.totalEstimatedUsd ?? bidUsd,
          customerMessage: `[Solicitud de Evaluación Comercial Lote #${lotNumber}]: ${customerMessage || "Deseo evaluación comercial detallada de este vehículo, costo puesto en destino y confirmación de condición mecánica."}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data.error || "No se pudo registrar la consulta.");
      } else {
        setQuoteReference(data.quoteRequest?.referenceCode || "OK");
      }
    } catch {
      setQuoteError("Error de red al enviar la solicitud.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Calculadora rápida para este Lote */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Calculator className="h-4 w-4 text-cyan-400" />
            Simulador de Costos de Importación
          </h3>
          <span className="rounded bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300 font-semibold">
            ESTIMACIÓN TRANSPARENTE
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              Puja Estimada (USD)
            </label>
            <input
              type="number"
              value={bidUsd}
              onChange={(e) => setBidUsd(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              País de Destino
            </label>
            <select
              value={destinationCountryCode}
              onChange={(e) => setDestinationCountryCode(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              Modalidad Marítima
            </label>
            <select
              value={shippingModality}
              onChange={(e) => setShippingModality(e.target.value as "RORO" | "CONTAINER_SHARED")}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="RORO">Ro-Ro (Roll-on/Roll-off)</option>
              <option value="CONTAINER_SHARED">Contenedor Consolidado</option>
            </select>
          </div>
        </div>

        {calcLoading ? (
          <div className="py-6 text-center text-xs text-zinc-400 font-mono">
            Calculando tarifas de subasta, grúa desde {yardState}, flete marítimo e impuestos...
          </div>
        ) : estimate ? (
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-xs">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">1. Precio Puja:</span>
                <span className="text-white font-semibold">
                  ${estimate.breakdown.bidAmountUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">2. Tarifas Subasta:</span>
                <span className="text-white">
                  ${estimate.breakdown.totalAuctionFeesUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">3. Honorario Broker:</span>
                <span className="text-white">
                  ${estimate.breakdown.brokerFeeUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">
                  4. Grúa ({yardState} → {estimate.departurePort}):
                </span>
                <span className="text-white">
                  ${estimate.breakdown.inlandTransportUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">
                  5. Flete + Seguro:
                </span>
                <span className="text-white">
                  $
                  {(
                    estimate.breakdown.oceanFreightUsd + estimate.breakdown.marineInsuranceUsd
                  ).toLocaleString("en-US")}{" "}
                  USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">6. Gastos BL / Trámite:</span>
                <span className="text-white">
                  ${estimate.breakdown.documentationFeesUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">
                  7. Arancel ({estimate.breakdown.importDutyPercent}%):
                </span>
                <span className="text-white">
                  ${estimate.breakdown.customsDutyUsd.toLocaleString("en-US")} USD
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-400">
                  8. IVA/Impuesto ({estimate.breakdown.vatPercent}%):
                </span>
                <span className="text-white">
                  ${estimate.breakdown.importVatAndTaxesUsd.toLocaleString("en-US")} USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-cyan-950/40 border border-cyan-500/40 px-4 py-3">
              <div>
                <span className="block text-[11px] font-mono uppercase text-cyan-300 font-bold">
                  Total Estimado Puesto en {estimate.destinationCountryName}
                </span>
                <span className="text-[11px] text-zinc-400">{estimate.destinationNotes}</span>
              </div>
              <span className="font-mono text-2xl font-black text-cyan-400">
                ${estimate.breakdown.totalEstimatedUsd.toLocaleString("en-US")} USD
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed flex items-start gap-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <span>{estimate.disclaimerText}</span>
            </p>
          </div>
        ) : null}
      </div>

      {/* 2. Formulario para Solicitar Evaluación Comercial de este Lote */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-xl">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Send className="h-4 w-4 text-cyan-400" />
            Solicitar Evaluación Comercial de este Lote
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Un especialista de PUJAMOTOR USA analizará el reporte de historial, estado operativo en yarda y flete óptimo sin costo por consulta.
          </p>
        </div>

        {quoteReference ? (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              Solicitud de Evaluación Registrada Exitosamente
            </div>
            <p className="text-xs text-zinc-200">
              Su expediente para el <strong>Lote #{lotNumber}</strong> ha sido generado con el código de seguimiento:
            </p>
            <div className="inline-block rounded-lg bg-zinc-900 border border-cyan-500/50 px-4 py-2 font-mono text-lg font-black text-cyan-400">
              #{quoteReference}
            </div>
            <p className="text-xs text-zinc-400 pt-1">
              Un asesor de subastas se comunicará vía WhatsApp o correo para entregarle el dictamen técnico y la estimación final.
            </p>
          </div>
        ) : (
          <form onSubmit={handleInquirySubmit} className="space-y-3.5">
            {quoteError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200">
                {quoteError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">WhatsApp / Teléfono *</label>
                <input
                  type="text"
                  required
                  value={phoneWhatsapp}
                  onChange={(e) => setPhoneWhatsapp(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1 font-medium">Servicio Requerido *</label>
                <select
                  value={requestedServices}
                  onChange={(e) => setRequestedServices(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="FULL_IMPORT_ADVISORY">
                    Asesoría Integral (Subasta + Grúa + Exportación)
                  </option>
                  <option value="AUCTION_BIDDING_ONLY">
                    Representación de Puja con Broker Autorizado
                  </option>
                  <option value="INLAND_AND_OCEAN_LOGISTICS">
                    Transporte Interno USA y Flete Marítimo
                  </option>
                  <option value="VEHICLE_INSPECTION">
                    Inspección Pre-Compra y Verificación VIN
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1 font-medium">
                Detalles o requerimientos de entrega
              </label>
              <textarea
                rows={3}
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Indique su presupuesto máximo o preguntas sobre el estado de este lote..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingQuote}
              className="w-full rounded-xl bg-white hover:bg-cyan-50 text-zinc-950 font-bold px-4 py-3 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submittingQuote
                ? "Registrando evaluación..."
                : `Solicitar Evaluación Comercial para Lote #${lotNumber}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
