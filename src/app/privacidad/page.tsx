import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft, FileText } from "lucide-react";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

export const metadata = {
  title: "Política de Privacidad | PUJAMOTOR USA",
  description:
    "Políticas de tratamiento de datos personales, cifrado en reposo AES-256-GCM y confidencialidad comercial en PUJAMOTOR USA.",
};

export default function PrivacyPage() {
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
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
          PROTECCIÓN INTEGRAL DE DATOS (PII)
        </div>
        <h1 className="mt-3 text-3xl font-black text-white tracking-tight uppercase">
          Política de Privacidad y Tratamiento de Información Personal
        </h1>
        <p className="mt-2 text-xs text-zinc-400 font-mono">
          Última actualización: Noviembre de 2026 · Versión 1.0 Institucional
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 space-y-6 text-xs text-zinc-300 leading-relaxed shadow-xl">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-zinc-400" />
            1. Compromiso de Confidencialidad y Responsable del Tratamiento
          </h2>
          <p>
            {company.legalName} (en adelante, &ldquo;<strong>PUJAMOTOR USA</strong>&rdquo;), con sede de operaciones en {company.headquarters.displaySummary}, asume el compromiso ético y legal de proteger la privacidad de los usuarios que consultan nuestro catálogo de vehículos, utilizan la calculadora de importación o solicitan asesoría comercial.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Datos Recabados y Finalidad Operativa</h2>
          <p>
            Para la prestación de servicios de brokerage y asesoría en subastas de Copart e IAA, recabamos exclusivamente los datos necesarios para formalizar ofertas y cotizaciones:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo, número de WhatsApp/teléfono, país de residencia y correo electrónico.</li>
            <li><strong>Criterios de Interés Automotriz:</strong> Marca, modelo, año mínimo y rango presupuestario en USD.</li>
            <li><strong>Documentación Formal de Compra:</strong> Licencia de conducir o pasaporte vigente, requeridos única y exclusivamente al momento de formalizar el contrato de mandato para subasta.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Cifrado Criptográfico y Seguridad en Servidor</h2>
          <p>
            La información sensible de los clientes (PII) es protegida mediante algoritmos criptográficos robustos de grado bancario (<strong>AES-256-GCM</strong>) tanto en reposo como en tránsito. Las bitácoras internas de auditoría registran eventos sin exponer datos personales no autorizados, aplicando enmascaramiento selectivo conforme a las mejores prácticas de seguridad de la industria.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. No Comercialización de Datos a Terceros</h2>
          <p>
            PUJAMOTOR USA <strong>no vende, no alquila, no cede ni transfiere</strong> sus listas de prospectos o clientes a agencias publicitarias, redes sociales ni intermediarios externos. Los datos se comparten únicamente con los operadores autorizados de la transacción (yardas de subasta Copart/IAA, transportistas de flete y agentes aduanales designados) estrictamente para completar la adquisición y entrega de su vehículo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Derechos del Titular y Canales de Atención</h2>
          <p>
            Usted tiene el derecho inalienable de acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales. Para ejercer cualquiera de estos derechos, puede comunicarse directamente a través de nuestro <Link href="/contacto" className="text-white underline hover:text-zinc-300">formulario de contacto oficial</Link> o dirigirse al buzón institucional de cumplimiento legal.
          </p>
        </section>
      </div>
    </div>
  );
}

