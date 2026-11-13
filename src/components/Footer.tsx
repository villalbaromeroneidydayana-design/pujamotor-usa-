import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  Database,
  Lock,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";
import { CorporateLogo } from "@/components/CorporateLogo";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

export function Footer() {
  const { company, telephones, emails, businessHours } = CORPORATE_IDENTITY;
  const hasPhone = Boolean(telephones.mainPhone);
  const hasWhatsapp = Boolean(telephones.whatsappRaw || telephones.whatsappNumber);
  const hasEmail = Boolean(emails.generalInfo || emails.sales || emails.support);
  const primaryEmail = emails.sales || emails.generalInfo || emails.support;

  return (
    <footer
      suppressHydrationWarning
      className="border-t border-zinc-800 bg-black text-zinc-400"
    >
      {/* Franja Superior: Banner Minimalista de Confianza */}
      <div className="border-b border-zinc-850 bg-zinc-950 py-6 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
              <ShieldCheck className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">
                Intermediación de Subastas Automotrices en Estados Unidos
              </div>
              <p className="text-xs text-zinc-400">
                Pujas transparentes con acceso oficial, factura directa de subasta y fee condicionado a la recepción del vehículo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasWhatsapp ? (
              <a
                href={`https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20deseo%20asesoría%20sobre%20vehículos%20de%20subasta.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-50 transition-colors shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 fill-current text-cyan-600" />
                <span>{telephones.whatsappNumber || "WhatsApp Asesor"}</span>
              </a>
            ) : (
              <Link
                href="/asesoria"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-50 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 fill-current text-cyan-600" />
                <span>Atención por WhatsApp</span>
              </Link>
            )}

            <Link
              href="/contacto"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-orange-400" />
              <span>{hasPhone ? telephones.mainPhoneFormatted : "Contacto Oficial"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cuerpo Principal del Footer */}
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Columna 1: Identidad Corporativa y Sede */}
          <div className="space-y-4">
            <CorporateLogo variant="full" size="md" />
            <p className="text-xs leading-relaxed text-zinc-400">
              {company.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-zinc-900 text-xs">
              <div className="flex items-start gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>{company.headquarters.displaySummary}</span>
              </div>
              <div className="flex items-start gap-2 text-zinc-300">
                <Clock className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  {businessHours.scheduleWeekdays} ({businessHours.timezone})
                </span>
              </div>
            </div>
          </div>

          {/* Columna 2: Navegación de la Plataforma */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Plataforma & Herramientas
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center justify-between text-zinc-400">
                  <span>Catálogo de Vehículos</span>
                  <span className="text-[10px] font-mono text-zinc-600">Copart & IAA</span>
                </Link>
              </li>
              <li>
                <Link href="/calculadora" className="hover:text-white transition-colors flex items-center justify-between text-zinc-400">
                  <span>Calculadora de Importación</span>
                  <span className="text-[10px] font-mono text-zinc-400">Estimación</span>
                </Link>
              </li>
              <li>
                <Link href="/comparador" className="hover:text-white transition-colors flex items-center justify-between text-zinc-400">
                  <span>Comparador Técnico de Lotes</span>
                  <span className="text-[10px] font-mono text-zinc-600">Multifiltro</span>
                </Link>
              </li>
              <li>
                <Link href="/asesoria" className="hover:text-white transition-colors flex items-center justify-between text-zinc-400">
                  <span>Solicitar Asesoría</span>
                  <span className="text-[10px] font-mono text-emerald-400">Sin Registro</span>
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors flex items-center justify-between text-zinc-400">
                  <span>Oficinas y Canales Directos</span>
                  <span className="text-[10px] font-mono text-zinc-600">Miami, FL</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Canales de Contacto Centralizados */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2">
              Canales Directos
            </h3>
            <div className="space-y-3 text-xs">
              {/* Teléfono */}
              <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-850 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">Línea Telefónica Directa</span>
                {hasPhone ? (
                  <div>
                    <a
                      href={`tel:${telephones.mainPhone}`}
                      className="text-white hover:text-zinc-200 font-bold font-mono block text-sm"
                    >
                      {telephones.mainPhoneFormatted || telephones.mainPhone}
                    </a>
                  </div>
                ) : (
                  <Link href="/contacto#telefono" className="text-zinc-300 hover:underline block font-semibold">
                    Disponible vía Solicitud Directa
                  </Link>
                )}
              </div>

              {/* WhatsApp */}
              <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-850 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">WhatsApp de Asesoría</span>
                {hasWhatsapp ? (
                  <div>
                    <a
                      href={`https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20deseo%20asesoría%20sobre%20vehículos%20de%20subasta.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-cyan-300 font-bold font-mono block text-sm"
                    >
                      {telephones.whatsappNumber}
                    </a>
                  </div>
                ) : (
                  <Link href="/asesoria?source=footer_wa" className="text-zinc-200 hover:text-cyan-300 block font-semibold">
                    Atención Inmediata por WhatsApp
                  </Link>
                )}
              </div>

              {/* Correo Electrónico */}
              <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-850 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">Buzón Institucional</span>
                {hasEmail ? (
                  <div>
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-white hover:text-zinc-200 font-mono block text-xs truncate"
                    >
                      {primaryEmail}
                    </a>
                  </div>
                ) : (
                  <Link href="/contacto#formulario" className="text-zinc-300 hover:underline block font-semibold">
                    Buzón de Atención y Documentos
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Columna 4: Cumplimiento y Marco Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-2 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-zinc-400" />
              Marco Legal & Cumplimiento
            </h3>
            <p className="text-xs leading-relaxed text-zinc-400">
              PUJAMOTOR USA es una firma independiente de corretaje automotriz y gestión logística. Las marcas registradas Copart e IAA pertenecen a sus respectivos titulares. No se exigen pagos de comisiones por adelantado: la tarifa de intermediación se cancela únicamente al recibir el vehículo adjudicado.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <Link
                href="/privacidad"
                className="hover:text-white transition-colors flex items-center gap-1.5 text-zinc-300"
              >
                <FileText className="h-3.5 w-3.5 text-zinc-500" />
                <span>Política de Privacidad y Cifrado PII</span>
              </Link>
              <Link
                href="/terminos"
                className="hover:text-white transition-colors flex items-center gap-1.5 text-zinc-300"
              >
                <Scale className="h-3.5 w-3.5 text-zinc-500" />
                <span>Términos y Condiciones del Corretaje</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Copyright y Portal Asesores */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-850 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {company.legalName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-zinc-400">
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              <span>RBAC Activo</span>
            </span>
            <span>·</span>
            <span className="text-zinc-400">Auditoría Criptográfica Inmutable</span>
            <span>·</span>
            <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Portal Asesores
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
