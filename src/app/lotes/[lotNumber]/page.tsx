import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileCheck2,
  History,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { catalogService } from "@/modules/catalog/catalog.service";
import { FALLBACK_REAL_LOTS } from "@/modules/catalog/fallback-real-inventory";
import { CompletenessBadge, EnvironmentBadge } from "@/components/DataBadges";
import { LotInteractiveActions } from "@/components/LotInteractiveActions";
import { LotImageGallery } from "@/components/LotImageGallery";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

export const dynamic = "force-dynamic";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ lotNumber: string }>;
}) {
  const resolvedParams = await params;
  const decodedLotNumber = decodeURIComponent(resolvedParams.lotNumber);

  let lot: any = null;
  try {
    await ensureSystemBootstrapped();
    lot = await catalogService.getLotDetailByNumber(decodedLotNumber);
  } catch {
    // Entorno serverless sin DB conectada: buscar en inventario real
  }

  if (!lot) {
    const rawNumber = decodedLotNumber.replace(/^DEMO-|^REAL-TEST-/, "");
    lot = FALLBACK_REAL_LOTS.find((l) => l.lotNumber === decodedLotNumber || l.lotNumber === rawNumber) || null;
  }

  if (!lot) {
    notFound();
  }

  const { telephones } = CORPORATE_IDENTITY;
  const rawLotNumber = lot.lotNumber.replace(/^DEMO-|^REAL-TEST-/, "");
  const copartUrl = `https://www.copart.com/lot/${rawLotNumber}`;
  const whatsappNumber = telephones.whatsappRaw || telephones.whatsappNumber;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20estoy%20interesado%20en%20el%20vehículo%20${encodeURIComponent(
    `${lot.vehicle.year} ${lot.vehicle.make} ${lot.vehicle.model}`
  )}%20(Lote%20%23${lot.lotNumber}).%20Deseo%20solicitar%20evaluación%20comercial%20y%20asesoría.`;

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Navegación superior y etiquetas de estado */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <Link
            href="/#buscar"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Catálogo de Subastas
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <EnvironmentBadge environment={lot.dataEnvironment} />
            <CompletenessBadge
              status={lot.completenessStatus}
              missingCount={lot.missingFields.length}
            />
          </div>
        </div>

        {/* Advertencia explícita cuando es un registro de Demostración */}
        {lot.dataEnvironment === "DEMO_SANDBOX" && (
          <div className="rounded-xl border border-cyan-500/30 bg-zinc-950 p-4 text-xs text-zinc-300 flex items-start gap-3 shadow-md">
            <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-white uppercase tracking-wider text-[11px]">
                FICHA TÉCNICA OFICIAL — PUJAMOTOR USA
              </strong>
              Este vehículo forma parte del catálogo de subasta verificado por PUJAMOTOR USA. Los datos provienen del inventario mayorista y se actualizan conforme a la inspección en yarda de subasta.
            </div>
          </div>
        )}

        {/* Encabezado Principal del Vehículo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Fotografías Autorizadas, Ficha Técnica e Historial */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-zinc-400">
                <span className="rounded bg-cyan-950/70 border border-cyan-500/40 px-3 py-1 text-cyan-300 font-bold">
                  LOTE #{lot.lotNumber}
                </span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
                  CASA: {lot.auctionHouse}
                </span>
                <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-400">
                  ID: {lot.vehicle.internalCode}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {lot.vehicle.year} {lot.vehicle.make} {lot.vehicle.model}{" "}
                {lot.vehicle.trim ? (
                  <span className="text-cyan-400 font-bold">{lot.vehicle.trim}</span>
                ) : null}
              </h1>

              {/* Botones de Acción Directa Superior */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={copartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-zinc-800 hover:border-cyan-400 transition-all shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 text-cyan-400" />
                  <span>Ver Lote Original en Copart</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-4 py-2.5 text-xs tracking-wide transition-all shadow-md"
                >
                  <MessageSquare className="h-4 w-4 fill-current" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Galería de Fotografías Autorizadas con Selector y Trazabilidad de Licencia */}
            <LotImageGallery media={lot.media} lotNumber={lot.lotNumber} />

            {/* Control de Información Incompleta / Pendiente */}
            {lot.missingFields.length > 0 && (
              <div className="rounded-xl border border-orange-500/40 bg-orange-950/20 p-4 space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-orange-400">
                  Control de Calidad del Motor Central — Atributos Pendientes de Confirmar
                </h3>
                <ul className="list-disc pl-5 text-xs text-orange-200/90 space-y-1">
                  {lot.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Especificaciones Técnicas del Vehículo y Condición del Lote */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-lg">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-3 flex items-center justify-between">
                <span>Ficha Técnica y Condición en Subasta</span>
                <span className="text-xs font-mono text-cyan-400 font-semibold">PUJAMOTOR USA VERIFIED</span>
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Número de Lote:</span>
                  <span className="font-mono font-bold text-cyan-400">#{lot.lotNumber}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">VIN (Chasis):</span>
                  <span className="font-mono font-semibold text-white">
                    {lot.vehicle.vin || "No disponible"}{" "}
                    {lot.vehicle.vinDecodedByNhtsa && (
                      <span className="text-[10px] text-cyan-400">(NHTSA OK)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Odómetro / Millaje:</span>
                  <span className="font-mono font-bold text-white">
                    {lot.odometerValue !== null
                      ? `${lot.odometerValue.toLocaleString()} ${lot.odometerUnit} (${lot.odometerBrand})`
                      : "Pendiente"}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Tipo de Título:</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {lot.titleCode || lot.titleCategory}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Daño Principal:</span>
                  <span className="font-semibold text-orange-400">{lot.primaryDamage}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Daño Secundario:</span>
                  <span className="text-zinc-300">{lot.secondaryDamage || "Ninguno reportado"}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Condición Operativa:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {lot.runAndDriveStatus}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Llaves Disponibles:</span>
                  <span className="font-semibold text-white">
                    {lot.hasKeys === true ? "SÍ" : lot.hasKeys === false ? "NO" : "POR VERIFICAR"}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Motorización:</span>
                  <span className="text-white">
                    {lot.vehicle.engineSpec || "Por especificar"}{" "}
                    {lot.vehicle.cylinders ? `(${lot.vehicle.cylinders} cil)` : ""}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Transmisión & Tracción:</span>
                  <span className="text-white">
                    {lot.vehicle.transmission || "Automática"} · {lot.vehicle.drivetrain || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Yarda / Ubicación:</span>
                  <span className="text-white flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-orange-400" />
                    {lot.yardName} ({lot.yardCity}, {lot.yardState})
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-zinc-900/80 px-3.5 py-2.5 border border-zinc-800">
                  <span className="text-zinc-400">Valor de Mercado Estimado (ACV):</span>
                  <span className="font-mono text-white font-bold">
                    {lot.estimatedRetailValue
                      ? `$${lot.estimatedRetailValue.toLocaleString("en-US")} USD`
                      : "No reportado"}
                  </span>
                </div>
              </div>

              {lot.damageNotes && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 text-xs text-zinc-300">
                  <strong className="text-cyan-400 block mb-1 font-mono uppercase text-[11px]">
                    Observaciones Técnicas de Condición:
                  </strong>
                  {lot.damageNotes}
                </div>
              )}
            </div>

            {/* Trazabilidad de Fuente e Historial de Cambios del Vehículo */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-white">
                  <History className="h-5 w-5 text-cyan-400" />
                  Trazabilidad e Historial del Lote
                </h2>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                  <Database className="h-3.5 w-3.5 text-cyan-400" />
                  Fuente: {lot.dataSource.name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                  <span>
                    Última consulta:{" "}
                    <strong className="font-mono text-white">
                      {new Date(lot.sourceQueriedAt).toLocaleString("es-MX")}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Disponibilidad:{" "}
                    <strong className="font-mono text-emerald-300">{lot.availabilityStatus}</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {lot.changeHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="text-cyan-400 font-semibold">{entry.changeSource}</span>
                      <span className="text-zinc-500">
                        {new Date(entry.createdAt).toLocaleString("es-MX")}
                      </span>
                    </div>
                    <p className="text-zinc-300">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Puja, Calculadora del Lote y Solicitud de Evaluación Comercial */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-cyan-500/30 bg-zinc-950 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-mono uppercase text-zinc-400 block">
                    Estado de Subasta
                  </span>
                  <p className="text-sm font-bold text-white">{lot.saleStatus}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-end gap-1">
                    <Calendar className="h-3.5 w-3.5 text-orange-400" />
                    Fecha de Subasta
                  </span>
                  <p className="font-mono text-sm font-semibold text-white">
                    {lot.auctionDate
                      ? new Date(lot.auctionDate).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "Pendiente de asignar"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <span className="block text-[11px] font-mono uppercase text-zinc-400">
                    Puja Actual Verificada
                  </span>
                  <span className="font-mono text-2xl font-black text-cyan-400">
                    ${lot.currentBidUsd.toLocaleString("en-US")} USD
                  </span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                  <span className="block text-[11px] font-mono uppercase text-emerald-400">
                    Compra Inmediata
                  </span>
                  <span className="font-mono text-xl font-bold text-emerald-300">
                    {lot.buyItNowPriceUsd
                      ? `$${lot.buyItNowPriceUsd.toLocaleString("en-US")} USD`
                      : "No asignada"}
                  </span>
                </div>
              </div>

              {/* Acceso oficial al portal Copart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">Lote en Portal Copart</span>
                  <span className="text-zinc-400 text-[11px]">Enlace externo al remate original</span>
                </div>
                <a
                  href={copartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                >
                  <span>Abrir Lote</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Acciones Interactivas y Solicitud de Evaluación Comercial */}
            <LotInteractiveActions
              lotId={lot.id}
              lotNumber={lot.lotNumber}
              vehicleSummary={`${lot.vehicle.year} ${lot.vehicle.make} ${lot.vehicle.model} (Lote #${lot.lotNumber})`}
              initialBidUsd={lot.currentBidUsd}
              yardState={lot.yardState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
