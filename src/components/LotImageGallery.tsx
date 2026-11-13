"use client";

import React, { useState } from "react";
import { FileCheck2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  url: string;
  originReference: string;
  isAuthorizedCopy: boolean;
}

interface LotImageGalleryProps {
  media: MediaItem[];
  lotNumber: string;
}

export function LotImageGallery({ media, lotNumber }: LotImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-10 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
          <ImageIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Sin fotografías de distribución pública vinculadas
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Por estricto cumplimiento de derechos de autor y propiedad intelectual, PUJAMOTOR USA no copia imágenes de terceros sin licencia explícita. Puede solicitar el dossier de inspección presencial o vincular fotos autorizadas desde el Panel Administrativo.
        </p>
      </div>
    );
  }

  const current = media[selectedIndex] || media[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg space-y-2">
      {/* Contenedor principal de imagen con selector si hay más de una */}
      <div className="relative h-80 sm:h-96 w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
        <img
          src={current.url}
          alt={current.title}
          className="h-full w-full object-contain"
        />

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Fotografía anterior"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-800 border border-slate-700 opacity-80 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Fotografía siguiente"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-800 border border-slate-700 opacity-80 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2.5 right-3 rounded-md bg-slate-950/80 px-2.5 py-1 font-mono text-[11px] text-slate-300 border border-slate-800">
              {selectedIndex + 1} / {media.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas navegables */}
      {media.length > 1 && (
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 bg-slate-950/40">
          {media.map((img, idx) => (
            <button
              type="button"
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border transition-all ${
                selectedIndex === idx
                  ? "border-cyan-400 ring-2 ring-cyan-400/40"
                  : "border-zinc-800 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={img.title}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Barra inferior de trazabilidad y licencia documental */}
      <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-200">{current.title}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
          <FileCheck2 className="h-3.5 w-3.5" />
          Origen Autorizado: {current.originReference}
        </span>
      </div>
    </div>
  );
}

