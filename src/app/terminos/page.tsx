import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

export const metadata = {
  title: "Términos y Condiciones de Servicio | PUJAMOTOR USA",
  description:
    "Términos generales del servicio de corretaje automotriz, participación en subastas de Copart e IAA y logística en PUJAMOTOR USA.",
};

export default function TermsPage() {
  const { company } = CORPORATE_IDENTITY;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al Catálogo</span>
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-mono text-zinc-300">
          <Scale className="h-3.5 w-3.5 text-zinc-400" />
          MARCO LEGAL DE INTERMEDIACIÓN COMERCIAL
        </div>
        <h1 className="mt-3 text-3xl font-black text-white tracking-tight uppercase">
          Términos y Condiciones del Servicio de Brokerage y Gestión de Subastas
        </h1>
        <p className="mt-2 text-xs text-zinc-400 font-mono">
          Vigente para el ejercicio 2026 · {company.legalName}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 space-y-6 text-xs text-zinc-300 leading-relaxed shadow-xl">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Objeto y Naturaleza del Servicio</h2>
          <p>
            {company.legalName} (&ldquo;<strong>PUJAMOTOR USA</strong>&rdquo;) actúa como mandatario y broker autorizado para facilitar a compradores calificados el acceso a subastas automotrices al por mayor en Estados Unidos (incluyendo Copart Inc. e Insurance Auto Auctions - IAA), mediante el uso de licencias de concesionario/exportador y plataformas tecnológicas propias.
          </p>
          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-300">
            <strong className="text-white">Aviso de Independencia:</strong> PUJAMOTOR USA no es filial, socia corporativa ni representante exclusiva de Copart Inc. ni de IAA. Todas las marcas registradas pertenecen a sus titulares respectivos.
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Política de Transparencia de Pujas y Facturación</h2>
          <p>
            El comprador tiene derecho a conocer en todo momento el avance de su puja:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>La oferta máxima autorizada por el cliente constituye un límite estricto que el asesor no puede superar sin consentimiento expreso por escrito.</li>
            <li>En caso de adjudicación exitosa, la factura del vehículo es emitida directamente por la casa de subastas (Copart/IAA) a nombre del comprador o del titular de la licencia conforme a la legislación aplicable.</li>
            <li>Los pagos del valor del lote se realizan exclusivamente mediante canales bancarios oficiales y autorizados, prohibiéndose transferencias a cuentas personales de asesores.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Honorarios de Intermediación (Broker Fee)</h2>
          <p>
            Conforme a nuestras políticas de transparencia, los honorarios profesionales de intermediación:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Se pactan previamente en el contrato de mandato de brokerage.</li>
            <li><strong>Se cancelan únicamente contra recepción del vehículo en destino acordado</strong>, salvo estipulación particular formalizada en el expediente comercial.</li>
            <li>Si una subasta no es adjudicada a la puja autorizada, el cliente no adeuda honorarios por la gestión de dicha puja.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Estado de los Vehículos e Inspección Previa</h2>
          <p>
            Los vehículos listados en subastas de salvamento o recuperación provienen de aseguradoras, bancos y arrendadoras:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Se comercializan bajo la modalidad legal &ldquo;<strong>AS IS - WHERE IS</strong>&rdquo; (tal como está y donde está), sin garantías de fábrica residuales no especificadas.</li>
            <li>PUJAMOTOR USA promueve activamente la selección de unidades clasificadas como <strong>Run & Drive</strong> y <strong>Clean Title</strong>, y facilita la consulta de reportes de historial Carfax y decodificación oficial NHTSA vPIC antes de formalizar la puja definitiva.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Legislación Aplicable y Jurisdicción</h2>
          <p>
            El presente acuerdo se rige por las leyes mercantiles del Estado de Florida, Estados Unidos. Cualquier controversia técnica o comercial será dirimida prioritariamente mediante concertación amistosa entre las partes o arbitraje comercial en el Condado de Miami-Dade, Florida.
          </p>
        </section>
      </div>
    </div>
  );
}

