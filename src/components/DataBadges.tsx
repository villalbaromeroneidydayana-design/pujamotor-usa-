import React from "react";
import { CheckCircle2, AlertTriangle, XOctagon, FlaskConical, ShieldCheck } from "lucide-react";

export function EnvironmentBadge({
  environment,
  compact = false,
}: {
  environment: string;
  compact?: boolean;
}) {
  if (environment === "DEMO_SANDBOX") {
    return (
      <span
        title="Este registro pertenece al entorno de demostración y se mantiene estrictamente separado de los lotes reales."
        className="inline-flex items-center gap-1.5 rounded border border-purple-500/40 bg-purple-950/70 px-2.5 py-0.5 text-xs font-mono font-semibold text-purple-200"
      >
        <FlaskConical className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        {compact ? "DATO DEMO" : "DATO DE DEMOSTRACIÓN (SANDBOX)"}
      </span>
    );
  }

  return (
    <span
      title="Registro proveniente de fuente autorizada (CSV Miembro Copart / NHTSA / Registro Verificado)."
      className="inline-flex items-center gap-1.5 rounded border border-sky-500/40 bg-sky-950/70 px-2.5 py-0.5 text-xs font-mono font-semibold text-sky-200"
    >
      <ShieldCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
      {compact ? "DATO REAL" : "FUENTE AUTORIZADA VERIFICADA"}
    </span>
  );
}

export function CompletenessBadge({
  status,
  missingCount = 0,
}: {
  status: string;
  missingCount?: number;
}) {
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        DATOS CONFIRMADOS
      </span>
    );
  }

  if (status === "PENDING_VERIFICATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-950/70 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        PENDIENTE DE VERIFICACIÓN {missingCount > 0 ? `(${missingCount})` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/50 bg-rose-950/80 px-2.5 py-0.5 text-xs font-mono font-medium text-rose-300">
      <XOctagon className="h-3.5 w-3.5 text-rose-400 shrink-0" />
      INFORMACIÓN INCOMPLETA {missingCount > 0 ? `(${missingCount})` : ""}
    </span>
  );
}

