// ============================================================================
// PUJAMOTOR USA — CONFIGURACIÓN CENTRALIZADA DE IDENTIDAD Y DATOS CORPORATIVOS
// Modifique este archivo para configurar los datos oficiales de contacto,
// teléfonos, WhatsApp, correo institucional y dominio del sitio web.
// ============================================================================

export interface CorporateIdentityConfig {
  company: {
    brandName: string;
    legalName: string;
    tagline: string;
    establishedYear: number;
    headquarters: {
      addressLine1: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      displaySummary: string;
    };
    description: string;
  };

  domain: {
    hostname: string;
    siteUrl: string;
  };

  telephones: {
    // IMPORTANTE: Deje en null o cadena vacía si no está configurado aún.
    // El sistema desplegará botones de contacto inteligente sin mostrar números inventados.
    mainPhone: string | null;
    mainPhoneFormatted: string | null;
    whatsappNumber: string | null;
    whatsappRaw: string | null;
    secondaryPhone: string | null;
    secondaryPhoneFormatted: string | null;
  };

  emails: {
    // Deje en null si el buzón oficial no ha sido creado todavía.
    generalInfo: string | null;
    sales: string | null;
    support: string | null;
    legal: string | null;
  };

  businessHours: {
    scheduleWeekdays: string;
    scheduleSaturday: string;
    scheduleSunday: string;
    timezone: string;
    auctionOperatingNote: string;
  };

  socialMedia: {
    facebookUrl: string | null;
    instagramUrl: string | null;
    youtubeUrl: string | null;
  };

  meta: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    keywords: string[];
    ogImageUrl: string;
  };
}

export const CORPORATE_IDENTITY: CorporateIdentityConfig = {
  company: {
    brandName: "PUJAMOTOR USA",
    legalName: "PUJAMOTOR USA LLC",
    tagline: "Compra Inteligente. Puja con Confianza.",
    establishedYear: 2024,
    headquarters: {
      addressLine1: "Miami Logistics & Port Hub",
      city: "Miami",
      state: "Florida",
      zipCode: "33126",
      country: "Estados Unidos",
      displaySummary: "Miami, Florida · Cobertura y Despacho Nacional en EE. UU.",
    },
    description:
      "Broker automotriz especializado en búsqueda asistida de vehículos y asesoría en subastas de Estados Unidos (Copart e IAA). Acompañamos al cliente de principio a fin con inspección documental, decodificación vPIC y logística portuaria.",
  },

  domain: {
    hostname: process.env.NEXT_PUBLIC_SITE_HOSTNAME || "pujamotorusa.com",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://pujamotorusa.com",
  },

  telephones: {
    // PREPARADO: Ingrese aquí los teléfonos corporativos oficiales al contratarlos.
    // Dejar en null para no mostrar números ficticios al público.
    mainPhone: process.env.NEXT_PUBLIC_PHONE_MAIN || null,
    mainPhoneFormatted: process.env.NEXT_PUBLIC_PHONE_MAIN_FORMATTED || null,
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null,
    whatsappRaw: process.env.NEXT_PUBLIC_WHATSAPP_RAW || null,
    secondaryPhone: process.env.NEXT_PUBLIC_PHONE_SECONDARY || null,
    secondaryPhoneFormatted: process.env.NEXT_PUBLIC_PHONE_SECONDARY_FORMATTED || null,
  },

  emails: {
    // PREPARADO: Ingrese aquí los correos corporativos asociados a su dominio.
    generalInfo: process.env.NEXT_PUBLIC_EMAIL_INFO || null,
    sales: process.env.NEXT_PUBLIC_EMAIL_SALES || null,
    support: process.env.NEXT_PUBLIC_EMAIL_SUPPORT || null,
    legal: process.env.NEXT_PUBLIC_EMAIL_LEGAL || null,
  },

  businessHours: {
    scheduleWeekdays: "Lunes a Viernes: 8:30 AM – 6:30 PM",
    scheduleSaturday: "Sábados: 9:00 AM – 2:00 PM",
    scheduleSunday: "Domingos: Cerrado (Monitoreo de Subastas Activo)",
    timezone: "Hora del Este (EST / Miami)",
    auctionOperatingNote:
      "Las subastas en vivo de Copart operan según los husos horarios de cada patio en EE. UU. Los asesores coordinan la puja en tiempo real.",
  },

  socialMedia: {
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || null,
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || null,
    youtubeUrl: process.env.NEXT_PUBLIC_YOUTUBE_URL || null,
  },

  meta: {
    defaultTitle: "PUJAMOTOR USA | Compra Inteligente. Puja con Confianza.",
    titleTemplate: "%s | PUJAMOTOR USA",
    defaultDescription:
      "PUJAMOTOR USA — Compra Inteligente. Puja con Confianza. Broker automotriz y asesoría en subastas de Estados Unidos (Copart). Fee de $300 a $500 pagadero únicamente al tener el vehículo en sus manos.",
    keywords: [
      "pujamotor usa",
      "pujamotor",
      "compra inteligente puja con confianza",
      "broker automotriz",
      "busqueda de vehiculos",
      "asesoria en subastas usa",
      "copart broker",
      "subasta en vivo copart",
      "sub-usuario copart",
      "factura directa copart",
      "copart delivery",
      "fee contra entrega",
    ],
    ogImageUrl: "/images/pujamotor-hero.jpg",
  },
};

/**
 * Retorna la configuración corporativa activa.
 */
export function getCorporateConfig(): CorporateIdentityConfig {
  return CORPORATE_IDENTITY;
}

/**
 * Determina si los canales de contacto directo tienen números configurados.
 */
export function getContactAvailability() {
  const { telephones, emails } = CORPORATE_IDENTITY;
  return {
    hasPhone: Boolean(telephones.mainPhone),
    hasWhatsapp: Boolean(telephones.whatsappRaw || telephones.whatsappNumber),
    hasEmail: Boolean(emails.generalInfo || emails.sales || emails.support),
    primaryEmail: emails.sales || emails.generalInfo || emails.support || null,
  };
}

