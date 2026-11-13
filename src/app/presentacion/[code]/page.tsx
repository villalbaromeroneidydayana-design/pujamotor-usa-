"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Phone,
} from "lucide-react";

interface PresentationData {
  presentationCode: string;
  title: string;
  notes: string | null;
  advisorName: string;
  advisorPhone: string | null;
  targetBidMinPercent: number;
  targetBidMaxPercent: number;
  client: {
    maskedName: string;
    country: string;
    targetVehicle: string | null;
    minYear: number | null;
    maxBudgetUsd: number | null;
  };
  vehicles: Array<{
    lotNumber: string;
    auctionHouse: string;
    yardName: string;
    yardState: string;
    vehicle: {
      year: number;
      make: string;
      model: string;
      trim: string | null;
      bodyStyle: string | null;
      engineSpec: string | null;
      transmission: string | null;
      drivetrain: string | null;
      exteriorColor: string | null;
      vin: string | null;
      isVinMasked: boolean;
    };
    titleCategory: string;
    titleCode: string | null;
    runAndDriveStatus: string;
    hasKeys: boolean | null;
    odometerValue: number | null;
    odometerUnit: string;
    odometerBrand: string;
    primaryDamage: string;
    secondaryDamage: string | null;
    currentBidUsd: number;
    buyItNowPriceUsd: number | null;
    estimatedRetailValue: number | null;
    targetBidRange: {
      minPercent: number;
      maxPercent: number;
      minBidUsd: number;
      maxBidUsd: number;
      disclaimer: string;
    } | null;
    buyItNowGuideline: {
      minPercent: number;
      maxPercent: number;
      minBidUsd: number;
      maxBidUsd: number;
      disclaimer: string;
    } | null;
    media: Array<{
      id: string;
      url: string;
      title: string;
      isPrimary: boolean;
    }>;
    auctionDate: string | null;
    saleStatus: string;
  }>;
  createdAt: string;
}

export default function PublicPresentationPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PresentationData | null>(null);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    async function fetchPresentation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm?presentationCode=${encodeURIComponent(code)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "No se pudo cargar la presentación solicitada.");
        } else {
          setData(json.presentation);
          if (json.presentation.vehicles.length > 0) {
            setSelectedLot(json.presentation.vehicles[0].lotNumber);
          }
        }
      } catch {
        setError("Error de conexión al cargar la propuesta de vehículos.");
      } finally {
        setLoading(false);
      }
    }
    fetchPresentation();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 font-mono text-sm">Cargando tu selección personalizada de vehículos...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900 p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Presentación no disponible</h1>
          <p className="text-sm text-slate-300">{error || "El enlace de presentación no es válido o ha expirado."}</p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-lg bg-amber-500 px-6 py-2.5 font-bold text-slate-950 hover:bg-amber-400"
          >
            Ir al Catálogo Público
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Cabecera Exclusiva */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
              PUJAMOTOR USA
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-zinc-400 border-l border-zinc-700 pl-3">
              Selección Personalizada ({data.presentationCode})
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Preparado por</div>
            <div className="text-sm font-bold text-amber-300">{data.advisorName}</div>
          </div>
        </div>
      </header>

      {/* Hero Banner Personalizado */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Propuesta Comercial Exclusiva
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {data.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl">
            {data.notes ||
              "Hemos analizado el inventario de subastas autorizadas en EE. UU. y filtrado entre 4 y 7 alternativas con óptima relación costo-beneficio según tus criterios."}
          </p>

          {/* Criterios del Cliente */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400 block mb-0.5">Cliente:</span>
              <span className="font-bold text-white font-mono">{data.client.maskedName}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400 block mb-0.5">País Destino:</span>
              <span className="font-bold text-white">{data.client.country}</span>
            </div>
            {data.client.targetVehicle && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block mb-0.5">Vehículo Buscado:</span>
                <span className="font-bold text-amber-300">{data.client.targetVehicle}</span>
              </div>
            )}
            {data.client.maxBudgetUsd && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block mb-0.5">Presupuesto Objetivo:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  ${data.client.maxBudgetUsd.toLocaleString()} USD
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid de Vehículos Seleccionados */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="h-5 w-5 text-amber-400" />
            Vehículos Seleccionados ({data.vehicles.length} Opciones)
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Regla de Compra: 40% - 60% Retail
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.vehicles.map((lot) => {
            const isCleanTitle =
              lot.titleCategory === "CLEAN" ||
              (lot.titleCode && lot.titleCode.toUpperCase().includes("CLEAN"));

            const isRunsDrives =
              lot.runAndDriveStatus === "RUNS_AND_DRIVES" ||
              lot.runAndDriveStatus === "RUNS AND DRIVES";

            return (
              <div
                key={lot.lotNumber}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col hover:border-slate-700 transition"
              >
                {/* Imagen del Vehículo */}
                <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                  {lot.media.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lot.media[0].url}
                      alt={`${lot.vehicle.year} ${lot.vehicle.make} ${lot.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Car className="h-10 w-10 mb-1" />
                      <span className="text-xs">Foto autorizada en proceso</span>
                    </div>
                  )}

                  {/* Badges Flotantes */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        isCleanTitle
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-amber-500 text-slate-950"
                      }`}
                    >
                      {isCleanTitle ? "Clean Title" : "Salvage Title"}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isRunsDrives
                          ? "bg-sky-500/90 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {isRunsDrives ? "Runs & Drives" : "Verificar Motor"}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur rounded px-2 py-0.5 font-mono text-[11px] text-amber-300">
                    Lote #{lot.lotNumber}
                  </div>
                </div>

                {/* Contenido de la Ficha */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {lot.vehicle.year} {lot.vehicle.make} {lot.vehicle.model}{" "}
                      {lot.vehicle.trim && (
                        <span className="text-slate-400 font-normal">{lot.vehicle.trim}</span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Yarda: {lot.yardName} ({lot.yardState})
                    </p>
                  </div>

                  {/* Métricas clave */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-800/80 py-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kilometraje / Odómetro:</span>
                      <span className="font-bold text-white font-mono">
                        {lot.odometerValue !== null
                          ? `${lot.odometerValue.toLocaleString()} ${lot.odometerUnit}`
                          : "Exento / No reportado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Daño Principal:</span>
                      <span className="font-bold text-amber-300">{lot.primaryDamage}</span>
                    </div>
                  </div>

                  {/* Rango de Puja Orientativa para Compra Inteligente */}
                  {lot.targetBidRange ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-sans font-semibold">
                          Rango de Compra Sugerido:
                        </span>
                        <span className="font-bold text-amber-300 text-sm">
                          ${lot.targetBidRange.minBidUsd.toLocaleString()} - $
                          {lot.targetBidRange.maxBidUsd.toLocaleString()} USD
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Minorista Estimado (ACV):</span>
                        <span className="font-mono text-white">
                          ${lot.estimatedRetailValue?.toLocaleString()} USD
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 italic pt-1">
                        * Referencia orientativa calculada al 40%-60% del valor de mercado para maximizar tu ahorro.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs flex justify-between">
                      <span className="text-slate-400">Puja Actual:</span>
                      <span className="font-bold text-white font-mono">
                        ${lot.currentBidUsd.toLocaleString()} USD
                      </span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      href={`/lotes/${encodeURIComponent(lot.lotNumber)}`}
                      className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                    >
                      Ver Ficha Completa
                    </Link>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Hola ${data.advisorName}, me interesa analizar en detalle el lote #${lot.lotNumber} (${lot.vehicle.year} ${lot.vehicle.make} ${lot.vehicle.model}) que me enviaste en la presentación.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-emerald-500 p-2 text-slate-950 hover:bg-emerald-400 transition"
                      title="Consultar por WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección Informativa: Próximos Pasos */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ¿Cómo procedemos una vez que elijas tus opciones favoritas?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm block">01. Selección</span>
              <p className="text-slate-300">
                Eliges 2 o 3 opciones prioritarias de esta lista para enfocar el análisis.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm block">02. Asesoría</span>
              <p className="text-slate-300">
                Revisamos título, historial de siniestros, costos de grúa a puerto y gastos de aduana.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm block">03. Mandato</span>
              <p className="text-slate-300">
                Definimos juntos tu tope máximo autorizado y formalizamos el contrato de representación.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="text-amber-400 font-mono font-bold text-sm block">04. Puja en Vivo</span>
              <p className="text-slate-300">
                Pujamos estratégicamente en cabina de subasta sin sobrepasar jamás tu presupuesto.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 mb-3">
              ¿Listo para avanzar o tienes dudas sobre alguna de estas alternativas?
            </p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hola ${data.advisorName}, estuve revisando la selección de vehículos en el enlace ${data.presentationCode} y me gustaría coordinar una breve llamada para resolver unas dudas.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <MessageCircle className="h-5 w-5" />
              Conversar con {data.advisorName} por WhatsApp
            </a>
          </div>
        </section>

        {/* Aviso de Transparencia Legal */}
        <footer className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
          <p>
            AVISO LEGAL: Esta presentación personalizada contiene datos referenciales extraídos de fuentes autorizadas de subastas.
            Los rangos sugeridos representan una guía orientativa de compra inteligente y no constituyen una garantía de adjudicación ni precio de cierre.
            PUJAMOTOR USA opera como asesor independiente de compra y gestor de logística internacional.
          </p>
        </footer>
      </main>
    </div>
  );
}

