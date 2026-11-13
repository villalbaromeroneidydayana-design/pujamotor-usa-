"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GitCompare, ArrowLeft, Calculator, ExternalLink, PlusCircle } from "lucide-react";
import { CompletenessBadge, EnvironmentBadge } from "@/components/DataBadges";

interface CompareLot {
  id: string;
  lotNumber: string;
  yardName: string;
  yardState: string;
  yardCity: string;
  odometerValue: number | null;
  odometerBrand: string;
  titleCategory: string;
  primaryDamage: string;
  secondaryDamage: string | null;
  runAndDriveStatus: string;
  hasKeys: boolean | null;
  estimatedRetailValue: number | null;
  currentBidUsd: number;
  buyItNowPriceUsd: number | null;
  completenessStatus: string;
  missingFields: string[];
  dataEnvironment: string;
  vehicle: {
    internalCode: string;
    vin: string | null;
    make: string;
    model: string;
    trim: string | null;
    year: number;
    engineSpec: string | null;
    transmission: string | null;
    drivetrain: string | null;
    fuelType: string | null;
  };
  media: Array<{ url: string; title: string }>;
}

function ComparatorContent() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get("lots") || "";
  const [lots, setLots] = useState<CompareLot[]>([]);
  const [allCatalogLots, setAllCatalogLots] = useState<CompareLot[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>(
    initialParam
      ? initialParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        const available: CompareLot[] = data.lots ?? [];
        setAllCatalogLots(available);

        if (selectedNumbers.length === 0 && available.length >= 2) {
          const defaults = available.slice(0, 3).map((l) => l.lotNumber);
          setSelectedNumbers(defaults);
        }
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    const filtered = allCatalogLots.filter((l) => selectedNumbers.includes(l.lotNumber));
    setLots(filtered);
  }, [selectedNumbers, allCatalogLots]);

  const toggleSelect = (lotNumber: string) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(lotNumber)) {
        return prev.filter((n) => n !== lotNumber);
      }
      if (prev.length >= 4) return prev;
      return [...prev, lotNumber];
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al Catálogo
          </Link>
          <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold text-white">
            <GitCompare className="h-7 w-7 text-amber-400" />
            Comparador Técnico y Financiero de Lotes
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Compare hasta 4 vehículos lado a lado evaluando precio de puja, condición mecánica, tipo de título, kilometraje e integridad de datos.
          </p>
        </div>
      </div>

      {/* Selector rápido de lotes a comparar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4 text-amber-400" />
            Seleccione los lotes a comparar ({selectedNumbers.length}/4):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCatalogLots.map((item) => {
            const active = selectedNumbers.includes(item.lotNumber);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleSelect(item.lotNumber)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
                  active
                    ? "border-amber-500 bg-amber-500/20 text-amber-300 font-bold"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                #{item.lotNumber} · {item.vehicle.year} {item.vehicle.make} {item.vehicle.model} ($
                {item.currentBidUsd.toLocaleString()})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400 font-mono">
          Cargando matriz comparativa de vehículos...
        </div>
      ) : lots.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
          Seleccione al menos un lote en la barra superior para iniciar la comparación.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="w-48 p-4 font-mono uppercase text-slate-400">Atributo / Lote</th>
                {lots.map((lot) => (
                  <th key={lot.id} className="p-4 align-top border-l border-slate-800">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <EnvironmentBadge environment={lot.dataEnvironment} compact />
                        <CompletenessBadge status={lot.completenessStatus} />
                      </div>
                      {lot.media[0] && (
                        <img
                          src={lot.media[0].url}
                          alt={lot.vehicle.model}
                          className="h-32 w-full rounded border border-slate-800 object-cover bg-slate-950"
                        />
                      )}
                      <div className="font-mono text-amber-400 font-bold">
                        LOTE #{lot.lotNumber}
                      </div>
                      <div className="text-sm font-extrabold text-white">
                        {lot.vehicle.year} {lot.vehicle.make} {lot.vehicle.model}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Puja Actual (USD)</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 font-mono text-lg font-extrabold text-amber-400">
                    ${lot.currentBidUsd.toLocaleString("en-US")} USD
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Opción Buy It Now</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 font-mono font-semibold text-emerald-300">
                    {lot.buyItNowPriceUsd
                      ? `$${lot.buyItNowPriceUsd.toLocaleString("en-US")} USD`
                      : "No disponible"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Valor Comercial EE. UU. (ACV)</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 font-mono text-white">
                    {lot.estimatedRetailValue
                      ? `$${lot.estimatedRetailValue.toLocaleString("en-US")} USD`
                      : "N/D"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Kilometraje / Odómetro</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 font-mono text-slate-200">
                    {lot.odometerValue !== null
                      ? `${lot.odometerValue.toLocaleString()} mi (${lot.odometerBrand})`
                      : "Pendiente"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Tipo de Título</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 font-mono font-semibold text-sky-300">
                    {lot.titleCategory}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Daño Primario / Secundario</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 text-rose-300 font-semibold">
                    {lot.primaryDamage}{" "}
                    {lot.secondaryDamage ? ` / ${lot.secondaryDamage}` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Condición y Llaves</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 text-slate-200">
                    <span className="font-mono text-emerald-300">{lot.runAndDriveStatus}</span> ·
                    Llaves: {lot.hasKeys === true ? "Sí" : lot.hasKeys === false ? "No" : "Pendiente"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Motor y Tracción</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 text-slate-200">
                    {lot.vehicle.engineSpec || "Estándar"} ({lot.vehicle.drivetrain || "N/A"})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Ubicación (Yarda)</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 text-slate-200">
                    {lot.yardName} ({lot.yardCity}, {lot.yardState})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-slate-400 bg-slate-950/50">Acciones Directas</td>
                {lots.map((lot) => (
                  <td key={lot.id} className="p-3.5 border-l border-slate-800 space-y-2">
                    <Link
                      href={`/lotes/${encodeURIComponent(lot.lotNumber)}`}
                      className="flex items-center justify-center gap-1.5 rounded bg-amber-500 px-3 py-1.5 font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Ver Ficha Completa
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/calculadora?lotNumber=${encodeURIComponent(
                        lot.lotNumber
                      )}&bid=${lot.currentBidUsd}&state=${lot.yardState}`}
                      className="flex items-center justify-center gap-1.5 rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 hover:border-sky-500"
                    >
                      <Calculator className="h-3.5 w-3.5 text-sky-400" />
                      Calcular Importación
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparatorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-sm text-slate-400">
          Cargando comparador de vehículos...
        </div>
      }
    >
      <ComparatorContent />
    </Suspense>
  );
}

