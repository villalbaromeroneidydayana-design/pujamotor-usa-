"use client";

import React from "react";
import Link from "next/link";
import { Phone, MessageSquare, Mail, HelpCircle, ArrowRight } from "lucide-react";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

interface ContactButtonProps {
  channel: "phone" | "whatsapp" | "email" | "all";
  variant?: "solid" | "outline" | "compact" | "badge";
  className?: string;
}

export function ContactButtons({
  channel = "all",
  variant = "solid",
  className = "",
}: ContactButtonProps) {
  const { telephones, emails } = CORPORATE_IDENTITY;

  // Canal Telefónico
  const hasPhone = Boolean(telephones.mainPhone);
  const phoneHref = hasPhone ? `tel:${telephones.mainPhone}` : "/contacto#telefono";
  const phoneText = hasPhone ? telephones.mainPhoneFormatted || telephones.mainPhone : "Línea Directa";

  // Canal WhatsApp
  const hasWhatsapp = Boolean(telephones.whatsappRaw || telephones.whatsappNumber);
  const whatsappHref = hasWhatsapp
    ? `https://wa.me/${telephones.whatsappRaw || telephones.whatsappNumber}?text=Hola%20AUTOS%20USA,%20deseo%20asesor%C3%ADa%20sobre%20veh%C3%ADculos%20de%20subasta.`
    : "/asesoria?source=whatsapp_cta";
  const whatsappText = hasWhatsapp
    ? telephones.whatsappNumber || "WhatsApp Asesor"
    : "Chat con Asesor";

  // Canal Correo
  const hasEmail = Boolean(emails.sales || emails.generalInfo || emails.support);
  const primaryEmail = emails.sales || emails.generalInfo || emails.support;
  const emailHref = hasEmail ? `mailto:${primaryEmail}` : "/contacto#formulario";
  const emailText = hasEmail ? primaryEmail : "Correo Oficial";

  if (channel === "phone") {
    return (
      <Link
        href={phoneHref}
        className={`inline-flex items-center gap-2 rounded-lg font-semibold text-xs transition-all ${
          variant === "solid"
            ? "bg-slate-800 text-white hover:bg-slate-700 px-3.5 py-2 border border-slate-700"
            : "border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5"
        } ${className}`}
      >
        <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>{phoneText}</span>
      </Link>
    );
  }

  if (channel === "whatsapp") {
    return (
      <Link
        href={whatsappHref}
        target={hasWhatsapp ? "_blank" : undefined}
        rel={hasWhatsapp ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center gap-2 rounded-lg font-bold text-xs transition-all ${
          variant === "solid"
            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-4 py-2 shadow-md shadow-emerald-500/20"
            : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 px-3 py-1.5"
        } ${className}`}
      >
        <MessageSquare className="h-4 w-4 shrink-0 fill-current" />
        <span>{whatsappText}</span>
      </Link>
    );
  }

  if (channel === "email") {
    return (
      <Link
        href={emailHref}
        className={`inline-flex items-center gap-2 rounded-lg font-semibold text-xs transition-all ${
          variant === "solid"
            ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 px-3.5 py-2"
            : "border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5"
        } ${className}`}
      >
        <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        <span>{emailText}</span>
      </Link>
    );
  }

  // Despliegue conjunto
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link
        href={whatsappHref}
        target={hasWhatsapp ? "_blank" : undefined}
        rel={hasWhatsapp ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
      >
        <MessageSquare className="h-3.5 w-3.5 fill-current" />
        <span>{hasWhatsapp ? telephones.whatsappNumber : "Atención por WhatsApp"}</span>
      </Link>

      <Link
        href={phoneHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Phone className="h-3.5 w-3.5 text-amber-400" />
        <span>{hasPhone ? telephones.mainPhoneFormatted : "Línea Telefónica"}</span>
      </Link>

      <Link
        href={emailHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Mail className="h-3.5 w-3.5 text-sky-400" />
        <span>{hasEmail ? primaryEmail : "Contacto Oficial"}</span>
      </Link>
    </div>
  );
}

