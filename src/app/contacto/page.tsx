"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Globe,
  Car,
} from "lucide-react";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";
import { CorporateLogo } from "@/components/CorporateLogo";

export default function ContactPage() {
  const { company, telephones, emails, businessHours } = CORPORATE_IDENTITY;
  const hasPhone = Boolean(telephones.mainPhone);
  const hasWhatsapp = Boolean(telephones.whatsappRaw || telephones.whatsappNumber);
  const hasEmail = Boolean(emails.generalInfo || emails.sales || emails.support);
  const primaryEmail = emails.sales || emails.generalInfo || emails.support;

  // Estado del formulario de contacto
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [country, setCountry] = useState("Estados Unidos");
  const [subject, setSubject] = useState("ASESORIA_GENERAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLIC_CREATE_INQUIRY",
          fullName,
          email,
          phoneWhatsapp,
          country,
          customerType: "INDIVIDUAL_BUYER",
          requestedServices: subject === "COMPRA_SUBASTA" ? "FULL_IMPORT_ADVISORY" : "AUCTION_BIDDING_ONLY",
          customerMessage: `[Formulario de Contacto Web - Asunto: ${subject}] ${message}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "No fue posible procesar su consulta.");
      } else {
        setSubmittedCode(data.quoteRequest?.referenceCode || "REC-OK");
        setFullName("");
        setEmail("");
        setPhoneWhatsapp("");
        setMessage("");
      }
    } catch {
      setSubmitError("Error de comunicación. Intente nuevamente o use el canal de WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
      {/* Cabecera Corporativa de la Sección */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3.5 py-1 text-xs font-mono font-medium text-zinc-300">
          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
          ATENCIÓN CORPORATIVA & CENTRO DE ASESORÍA
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          Contáctenos — Estamos para Orientarle en Su Próxima Adquisición
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Comuníquese con nuestro equipo de brokers especialistas en subastas automotrices de Copart e IAA.
          Sin compromisos ni cobros anticipados.
        </p>
      </div>

      {/* Cuadrícula de Canales de Contacto Centralizados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Canal 1: WhatsApp Oficial */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 font-mono text-[10px] font-bold">
              TIEMPO REAL
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">WhatsApp de Asesoría</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Atención directa con un asesor comercial para búsqueda de lotes, cálculo de oferta y seguimiento de subasta en vivo.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            {hasWhatsapp ? (
              <a
                href={`https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20AUTOS%20USA,%20deseo%20asesoría%20sobre%20vehículos%20de%20subasta.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{telephones.whatsappNumber || "Abrir Chat de WhatsApp"}</span>
              </a>
            ) : (
              <Link
                href="/asesoria?source=contact_wa"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Solicitar Contacto por WhatsApp</span>
              </Link>
            )}
          </div>
        </div>

        {/* Canal 2: Línea Telefónica Directa */}
        <div id="telefono" className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <Phone className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 font-mono text-[10px] font-bold">
              ESTADOS UNIDOS
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Línea Telefónica Central</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Llamada directa para consultas técnicas sobre contratos de brokerage, trámites aduanales y coordinación logística.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            {hasPhone ? (
              <a
                href={`tel:${telephones.mainPhone}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 py-3 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{telephones.mainPhoneFormatted || telephones.mainPhone}</span>
              </a>
            ) : (
              <a
                href="#formulario"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/80 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>Solicitar Llamada de un Asesor</span>
              </a>
            )}
          </div>
        </div>

        {/* Canal 3: Correo Electrónico Institucional */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Mail className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 font-mono text-[10px] font-bold">
              DOCUMENTAL
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Buzón Corporativo Oficial</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Envío formal de identificaciones, contratos firmados, facturas de subasta y solicitudes de cotización empresarial.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            {hasEmail ? (
              <a
                href={`mailto:${primaryEmail}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="truncate">{primaryEmail}</span>
              </a>
            ) : (
              <a
                href="#formulario"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/80 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>Escribir vía Formulario Seguro</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sección Doble: Formulario de Contacto y Datos Institucionales */}
      <div id="formulario" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Formulario */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Envíenos un Mensaje Directo
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Un asesor comercial responderá en un plazo máximo de 2 a 4 horas dentro del horario laboral.
            </p>
          </div>

          {submittedCode ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-zinc-200 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">¡Mensaje Recibido Correctamente!</h3>
                <p className="text-xs text-zinc-400">
                  Su solicitud ha sido registrada en nuestro CRM con el código de seguimiento:
                </p>
                <div className="font-mono text-xl font-black text-white py-2">
                  #{submittedCode}
                </div>
                <p className="text-xs text-zinc-400">
                  Un broker especialista se comunicará con usted por el canal seleccionado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittedCode(null)}
                className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {submitError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 p-3 text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan.perez@example.com"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="+1 (305) 000-0000"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">País de Destino / Residencia</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej. México, Guatemala, Rep. Dominicana..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Motivo de su Contacto</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-white font-mono"
                >
                  <option value="ASESORIA_GENERAL">Asesoría General sobre Cómo Funciona el Servicio</option>
                  <option value="COMPRA_SUBASTA">Búsqueda y Compra de un Vehículo Específico en Copart</option>
                  <option value="LOGISTICA_FLETE">Consultar Tarifas de Envío y Despacho Portuario</option>
                  <option value="DUDAS_TITULOS">Preguntas sobre Títulos Clean vs Salvage y Reconstrucción</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Mensaje o Detalle del Vehículo que Busca</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Indique marca, modelo, año aproximado, presupuesto en USD o cualquier duda que tenga sobre el proceso..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>Sus datos personales son cifrados en reposo (AES-256-GCM) y nunca se comparten con terceros.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? "Enviando mensaje..." : "Enviar Consulta al Equipo Comercial"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Columna Información Institucional */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta de Sede y Despacho */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <MapPin className="h-4 w-4 text-zinc-400" />
              Sede Operativa y Puntos de Despacho
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-zinc-200">Centro de Operaciones y Logística:</span>
                <p className="text-zinc-400 font-mono">
                  {company.headquarters.displaySummary}
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Cercanía estratégica con los principales puertos de exportación (PortMiami, Port Everglades, Houston y Jacksonville).
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <span className="font-semibold text-zinc-200">Cobertura Nacional de Patios:</span>
                <p className="text-zinc-400">
                  Acceso a más de 200 instalaciones de subasta autorizadas de Copart e IAA en los 50 estados de la Unión Americana.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Horarios */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-3 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Clock className="h-4 w-4 text-zinc-400" />
              Horario de Atención y Monitoreo
            </h3>
            <div className="space-y-2 text-zinc-300">
              <div className="flex justify-between">
                <span>{businessHours.scheduleWeekdays}</span>
                <span className="font-mono text-zinc-200">Abierto</span>
              </div>
              <div className="flex justify-between">
                <span>{businessHours.scheduleSaturday}</span>
                <span className="font-mono text-zinc-400">Atención Parcial</span>
              </div>
              <div className="flex justify-between">
                <span>{businessHours.scheduleSunday}</span>
                <span className="font-mono text-zinc-500">Guardia Subastas</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800 leading-snug">
              {businessHours.auctionOperatingNote}
            </p>
          </div>

          {/* Tarjeta de Garantías de Transparencia */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-3 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-300" />
              Nuestras Reglas de Transparencia
            </h3>
            <ul className="space-y-2 text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-zinc-200 font-bold">✓</span>
                <span>Usted ve la subasta en vivo con acceso propio o monitoreo continuo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-200 font-bold">✓</span>
                <span>Factura directa enviada por Copart a su nombre.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-200 font-bold">✓</span>
                <span>Fee de corretaje cancelado únicamente contra recepción del vehículo.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

