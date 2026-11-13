"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  Search,
  Send,
  ShieldCheck,
  Truck,
  Ship,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import { DocumentCenterModal } from "@/components/documents/DocumentCenterModal";

interface TrackedQuote {
  id: string;
  referenceCode: string;
  requestedServices: string;
  destinationCountry: string;
  maxBudgetUsd: number | null;
  customerMessage: string | null;
  status: string;
  advisorResponseNote: string | null;
  createdAt: string;
  customerLead: {
    fullName: string;
    country: string;
    customerType: string;
    status: string;
  };
  auctionLot: {
    lotNumber: string;
    yardName: string;
    currentBidUsd: number;
    vehicle: {
      year: number;
      make: string;
      model: string;
    };
  } | null;
  costEstimate: {
    simulationCode: string;
    totalEstimatedUsd: number;
  } | null;
}

function AdvisoryContent() {
  const searchParams = useSearchParams();
  const initialLot = searchParams.get("lotNumber") || "";
  const initialCountry = searchParams.get("country") || "MX";
  const initialBudget = searchParams.get("budget") || "";

  // Rastreo de solicitud por código
  const [trackingCode, setTrackingCode] = useState("");
  const [trackedQuote, setTrackedQuote] = useState<TrackedQuote | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Estado del Centro Documental Oficial
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docInitialId, setDocInitialId] = useState<string>("DOC-01-PRES");
  const [docInitialValues, setDocInitialValues] = useState<Record<string, string>>({});

  // Formulario de nueva solicitud comercial
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customerType, setCustomerType] = useState("INDIVIDUAL_BUYER");
  const [lotNumber, setLotNumber] = useState(initialLot);
  const [targetVehicle, setTargetVehicle] = useState("");
  const [minYear, setMinYear] = useState("");
  const [requestedServices, setRequestedServices] = useState("FULL_IMPORT_ADVISORY");
  const [maxBudgetUsd, setMaxBudgetUsd] = useState(initialBudget);
  const [customerMessage, setCustomerMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleTrackLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedQuote(null);
    try {
      const res = await fetch(
        `/api/crm?referenceCode=${encodeURIComponent(trackingCode.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setTrackingError(data.error || "Código de solicitud no encontrado.");
      } else {
        setTrackedQuote(data.quote);
      }
    } catch {
      setTrackingError("Error al consultar el código de seguimiento.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phoneWhatsapp,
          country,
          city,
          companyName,
          customerType,
          lotNumber: lotNumber.trim() || undefined,
          requestedServices,
          maxBudgetUsd: maxBudgetUsd ? Number(maxBudgetUsd) : undefined,
          targetVehicle: targetVehicle.trim() || undefined,
          minYear: minYear ? Number(minYear) : undefined,
          customerMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Error al registrar solicitud.");
      } else {
        setCreatedCode(data.quoteRequest.referenceCode);
        setTrackingCode(data.quoteRequest.referenceCode);
      }
    } catch {
      setSubmitError("Error de conexión al enviar la solicitud.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-mono text-sky-300 mb-2">
          <BriefcaseBusiness className="h-3.5 w-3.5 text-sky-400" />
          SISTEMA COMERCIAL Y LOGÍSTICO · SIN COBROS AUTOMÁTICOS FICTICIOS
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Asesoría de Compra, Transporte Terrestre y Exportación Marítima
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Gestione la evaluación técnica de un lote en Estados Unidos, solicite representación mediante Broker licenciado o coordine el traslado terrestre y marítimo hacia su país. Toda contratación se formaliza únicamente tras verificar disponibilidad, contrato y proveedor real.
        </p>
      </div>

      {/* Pilares de Servicio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <FileCheck className="h-6 w-6 text-amber-400" />
          <h3 className="text-sm font-bold text-white">1. Evaluación Pre-Subasta</h3>
          <p className="text-xs text-slate-400">
            Revisión de condición declarada, elegibilidad de título para exportación y verificación técnica por número de serie (VIN).
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">2. Asesoría de Puja Autorizada</h3>
          <p className="text-xs text-slate-400">
            Definición de puja máxima disciplinada y operación a través de miembros/brokers autorizados según la regulación de cada estado.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <Truck className="h-6 w-6 text-sky-400" />
          <h3 className="text-sm font-bold text-white">3. Transporte Interno EE. UU.</h3>
          <p className="text-xs text-slate-400">
            Retiro programado desde yardas de subasta hacia puertos de salida (Houston, Miami, Savannah, Newark, Los Ángeles).
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
          <Ship className="h-6 w-6 text-purple-400" />
          <h3 className="text-sm font-bold text-white">4. Exportación y Documentación</h3>
          <p className="text-xs text-slate-400">
            Validación aduanal CBP (SED/AES), embarque Ro-Ro o Contenedor y entrega de Bill of Lading original para nacionalización.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Formulario de Registro de Interesado y Solicitud de Cotización */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-amber-400" />
              Registrar Consulta o Solicitud de Cotización Formal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Al enviar su consulta se genera automáticamente un expediente en el CRM Comercial y un código único de seguimiento.
            </p>
          </div>

          {createdCode ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-emerald-300">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                Solicitud Comercial Creada Exitosamente
              </div>
              <p className="text-xs text-slate-200">
                Su consulta ha sido registrada en el sistema comercial de PUJAMOTOR USA. Conserve su código de seguimiento:
              </p>
              <div className="inline-block rounded-lg border border-emerald-500 bg-slate-950 px-4 py-2 font-mono text-xl font-extrabold text-emerald-400">
                {createdCode}
              </div>
              <p className="text-xs text-slate-400">
                Puede utilizar el buscador de rastreo a la derecha para verificar el estado de su solicitud y las respuestas del especialista asignado.
              </p>
              <button
                type="button"
                onClick={() => setCreatedCode(null)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-200 hover:text-white"
              >
                Registrar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-3 text-xs text-rose-200">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Roberto Gómez"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="roberto@importadora.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="+52 81 0000 0000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Perfil de Comprador
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="INDIVIDUAL_BUYER">Comprador Particular</option>
                    <option value="DEALER">Lote de Autos / Concesionario</option>
                    <option value="IMPORTER">Importador Mayorista</option>
                    <option value="WORKSHOP">Taller de Carrocería / Reconstrucción</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    País de Destino *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                  <label className="block text-xs text-slate-300 mb-1">
                    Ciudad / Puerto de Entrega
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Monterrey / Veracruz"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Vehículo que buscas (Marca / Modelo)
                  </label>
                  <input
                    type="text"
                    value={targetVehicle}
                    onChange={(e) => setTargetVehicle(e.target.value)}
                    placeholder="Ej. Toyota RAV4, Ford F-150, Honda Civic"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Año mínimo aceptable
                  </label>
                  <input
                    type="number"
                    value={minYear}
                    onChange={(e) => setMinYear(e.target.value)}
                    placeholder="Ej. 2018"
                    min="1990"
                    max="2027"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Número de Lote de Interés (Opcional)
                  </label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="Ej. DEMO-78410201"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Presupuesto Total Estimado (USD)
                  </label>
                  <input
                    type="number"
                    value={maxBudgetUsd}
                    onChange={(e) => setMaxBudgetUsd(e.target.value)}
                    placeholder="Ej. 18000"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Modalidad de Servicio Solicitado *
                </label>
                <select
                  value={requestedServices}
                  onChange={(e) => setRequestedServices(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="FULL_IMPORT_ADVISORY">
                    Asesoría Llave en Mano (Subasta + Grúa EE. UU. + Flete Marítimo + Exportación)
                  </option>
                  <option value="AUCTION_BIDDING_ONLY">
                    Solo Representación de Puja en Subasta con Broker Autorizado
                  </option>
                  <option value="INLAND_AND_OCEAN_LOGISTICS">
                    Solo Transporte Terrestre en EE. UU. y Exportación Marítima
                  </option>
                  <option value="VEHICLE_INSPECTION">
                    Inspección Pre-Compra y Verificación Documental de Lote
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Especificaciones adicionales o requerimientos logísticos
                </label>
                <textarea
                  rows={3}
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="Detalle el tipo de vehículo buscado, dudas sobre el título o requisitos de transporte..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {submitLoading
                  ? "Registrando consulta en el Sistema Comercial..."
                  : "Enviar Solicitud Comercial y Generar Código de Seguimiento"}
              </button>
            </form>
          )}
        </div>

        {/* Columna Derecha: Rastreo de Solicitudes por Código (COT-2026-XXXXX) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-sky-400" />
              Consultar Estado de Solicitud / Cotización
            </h2>
            <p className="text-xs text-slate-400">
              Ingrese su código de referencia (ej. <code className="text-amber-300">COT-2026-XXXXX</code>) para revisar el avance comercial y las notas del especialista.
            </p>

            <form onSubmit={handleTrackLookup} className="flex gap-2">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ej. COT-2026-12345"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white uppercase"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                {trackingLoading ? "Buscando..." : "Consultar"}
              </button>
            </form>

            {trackingError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {trackedQuote && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {trackedQuote.referenceCode}
                  </span>
                  <span className="rounded bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 font-mono text-[11px] text-sky-300">
                    ESTADO: {trackedQuote.status}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p>
                    <strong>Solicitante:</strong> {trackedQuote.customerLead.fullName} (
                    {trackedQuote.destinationCountry})
                  </p>
                  <p>
                    <strong>Servicio:</strong> {trackedQuote.requestedServices}
                  </p>
                  {trackedQuote.auctionLot && (
                    <p>
                      <strong>Lote Vinculado:</strong> #{trackedQuote.auctionLot.lotNumber} —{" "}
                      {trackedQuote.auctionLot.vehicle.year}{" "}
                      {trackedQuote.auctionLot.vehicle.make}{" "}
                      {trackedQuote.auctionLot.vehicle.model}
                    </p>
                  )}
                  {trackedQuote.costEstimate && (
                    <p>
                      <strong>Simulación Asociada:</strong>{" "}
                      {trackedQuote.costEstimate.simulationCode} ($
                      {trackedQuote.costEstimate.totalEstimatedUsd.toLocaleString("en-US")} USD)
                    </p>
                  )}
                </div>
                {trackedQuote.advisorResponseNote ? (
                  <div className="rounded border border-emerald-500/30 bg-emerald-950/30 p-3 text-emerald-200">
                    <strong className="block text-emerald-300 mb-1">
                      Respuesta del Especialista Comercial:
                    </strong>
                    {trackedQuote.advisorResponseNote}
                  </div>
                ) : (
                  <div className="rounded border border-slate-800 bg-slate-900 p-2.5 text-slate-400">
                    Su solicitud se encuentra en cola de revisión por el equipo de asesoría comercial.
                  </div>
                )}

                {/* Botón de Acceso al Centro Documental del Expediente */}
                <button
                  type="button"
                  onClick={() => {
                    setDocInitialValues({
                      clientName: trackedQuote.customerLead?.fullName || "Cliente",
                      quoteCode: trackedQuote.referenceCode,
                      lotNumber: trackedQuote.auctionLot?.lotNumber || "",
                      vehicleDetails: trackedQuote.auctionLot
                        ? `${trackedQuote.auctionLot.vehicle?.year ?? ""} ${trackedQuote.auctionLot.vehicle?.make ?? ""} ${trackedQuote.auctionLot.vehicle?.model ?? ""}`
                        : "Vehículo en trámite de asesoría",
                      brokerFee: "400",
                    });
                    setDocInitialId("DOC-04-CONTRATO");
                    setDocModalOpen(true);
                  }}
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-zinc-950 transition-all shadow-md active:scale-95"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Ver Documentos Oficiales del Expediente</span>
                </button>
              </div>
            )}
          </div>

          {/* Política de Seguridad Comercial */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3 text-xs text-slate-300">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Política de Contratación Verificada (Sin Cobros Ficticios)
            </h3>
            <p className="leading-relaxed text-slate-400">
              Por seguridad operativa y cumplimiento normativo, <strong>PUJAMOTOR USA no realiza cargos con tarjeta ni retenciones automáticas en este portal web</strong>. Todo depósito de garantía para puja o contratación de flete se realiza únicamente tras validar la disponibilidad del lote, firmar el contrato de mandato/intermediación y verificar las cuentas fiduciarias del proveedor autorizado.
            </p>
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDocInitialId("DOC-01-PRES");
                  setDocModalOpen(true);
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Explorar los 8 Documentos Oficiales de PUJAMOTOR USA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Interactivo de Documentación */}
      <DocumentCenterModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        initialDocId={docInitialId}
        initialValues={docInitialValues}
      />
    </div>
  );
}

export default function AdvisoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-sm text-slate-400">
          Cargando módulo comercial...
        </div>
      }
    >
      <AdvisoryContent />
    </Suspense>
  );
}

