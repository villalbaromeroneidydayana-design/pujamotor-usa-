"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  Calculator,
  GitCompare,
  BriefcaseBusiness,
  ShieldCheck,
  LayoutDashboard,
  Menu,
  X,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Lock,
  Users,
  FileText,
} from "lucide-react";
import { CorporateLogo } from "@/components/CorporateLogo";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

const NAV_LINKS = [
  { href: "/", label: "Catálogo", icon: CarFront },
  { href: "/#como-funciona", label: "Cómo Funciona", icon: ShieldCheck },
  { href: "/#equipo", label: "Equipo", icon: Users },
  { href: "/#documentos", label: "Documentos", icon: FileText },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/comparador", label: "Comparador", icon: GitCompare },
  { href: "/asesoria", label: "Asesoría", icon: BriefcaseBusiness },
  { href: "/contacto", label: "Contacto", icon: Mail },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { telephones, emails, businessHours } = CORPORATE_IDENTITY;
  const hasPhone = Boolean(telephones.mainPhone);
  const hasWhatsapp = Boolean(telephones.whatsappRaw || telephones.whatsappNumber);
  const hasEmail = Boolean(emails.generalInfo || emails.sales || emails.support);

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md"
    >
      {/* TopBar Minimalista en Grafito y Plata */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/90 px-4 py-1.5 text-xs text-zinc-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Horario y Estado Operativo */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              {businessHours.scheduleWeekdays} ({businessHours.timezone}) · Monitoreo de Subastas en Vivo
            </span>
          </div>

          {/* Canales Oficiales Centralizados */}
          <div className="flex items-center gap-5 text-xs font-mono">
            {/* Teléfono */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Phone className="h-3 w-3 text-orange-400 shrink-0" />
              {hasPhone ? (
                <a
                  href={`tel:${telephones.mainPhone}`}
                  className="hover:text-white transition-colors font-medium text-zinc-200"
                >
                  {telephones.mainPhoneFormatted || telephones.mainPhone}
                </a>
              ) : (
                <Link href="/contacto#telefono" className="text-zinc-400 hover:text-white transition-colors">
                  Línea Telefónica
                </Link>
              )}
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <MessageSquare className="h-3 w-3 shrink-0 text-cyan-400 fill-cyan-400/20" />
              {hasWhatsapp ? (
                <a
                  href={`https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20deseo%20asesoría%20sobre%20vehículos%20de%20subasta.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 font-medium transition-colors"
                >
                  {telephones.whatsappNumber || "WhatsApp Asesor"}
                </a>
              ) : (
                <Link href="/asesoria?source=navbar_wa" className="hover:text-cyan-300 transition-colors">
                  WhatsApp
                </Link>
              )}
            </div>

            {/* Correo */}
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
              <Mail className="h-3 w-3 shrink-0" />
              {hasEmail ? (
                <a
                  href={`mailto:${emails.sales || emails.generalInfo || emails.support}`}
                  className="hover:text-white transition-colors"
                >
                  {emails.sales || emails.generalInfo || emails.support}
                </a>
              ) : (
                <Link href="/contacto#formulario" className="hover:text-white transition-colors">
                  Correo Oficial
                </Link>
              )}
            </div>

            {/* Acceso Asesores */}
            <div className="hidden lg:flex items-center border-l border-zinc-800 pl-3">
              <Link
                href="/admin"
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                title="Acceso exclusivo para asesores autorizados"
              >
                <Lock className="h-3 w-3" />
                <span>Asesores</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        {/* Logotipo Oficial PUJAMOTOR USA */}
        <CorporateLogo variant="full" size="md" />

        {/* Navegación Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/lotes")
                : item.href.startsWith("/#")
                ? false
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-cyan-300"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-600" : "text-zinc-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Botón de Acción Principal Moderno */}
        <div className="hidden sm:flex items-center gap-2.5">
          {hasWhatsapp ? (
            <a
              href={`https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20deseo%20asesoría%20sobre%20vehículos%20de%20subasta.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-50 transition-all shadow-sm active:scale-95 border border-transparent hover:border-cyan-400/40"
            >
              <MessageSquare className="h-3.5 w-3.5 text-cyan-600 fill-current" />
              <span>Chatear por WhatsApp</span>
            </a>
          ) : (
            <Link
              href="/asesoria"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-50 transition-all shadow-sm active:scale-95 border border-transparent hover:border-cyan-400/40"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5 text-orange-600" />
              <span>Solicitar Asesoría</span>
            </Link>
          )}
        </div>

        {/* Botón Menú Móvil */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:text-white lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden space-y-3">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/lotes")
                  : item.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium ${
                    isActive
                      ? "bg-white text-zinc-950 font-bold"
                      : "text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-400" />
              <span>Portal Asesores</span>
            </Link>

            <Link
              href="/contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Contactar a un Asesor</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
