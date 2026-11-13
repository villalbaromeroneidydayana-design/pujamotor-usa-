import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";

const { company, domain, meta } = CORPORATE_IDENTITY;

export const metadata: Metadata = {
  metadataBase: new URL(domain.siteUrl),
  title: {
    default: "PUJAMOTOR USA | Compra Inteligente. Puja con Confianza.",
    template: "%s | PUJAMOTOR USA",
  },
  description:
    "PUJAMOTOR USA — Broker automotriz, búsqueda de vehículos y asesoría en subastas de Estados Unidos. Compra inteligente. Puja con confianza. Te acompañamos de principio a fin.",
  keywords: meta.keywords,
  authors: [{ name: company.brandName, url: domain.siteUrl }],
  creator: company.brandName,
  publisher: company.legalName,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "PUJAMOTOR USA | Compra Inteligente. Puja con Confianza.",
    description:
      "Broker automotriz, búsqueda de vehículos y asesoría en subastas de Estados Unidos. Te acompañamos en el proceso de principio a fin.",
    url: domain.siteUrl,
    siteName: company.brandName,
    locale: "es_US",
    type: "website",
    images: [
      {
        url: "/images/pujamotor-hero.jpg",
        width: 1200,
        height: 675,
        alt: "PUJAMOTOR USA — Compra Inteligente. Puja con Confianza.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PUJAMOTOR USA | Compra Inteligente. Puja con Confianza.",
    description:
      "Broker automotriz, búsqueda de vehículos y asesoría en subastas de Estados Unidos. Te acompañamos en el proceso de principio a fin.",
    images: ["/images/pujamotor-hero.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var origSet = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (name === 'bis_skin_checked') return;
                    return origSet.apply(this, arguments);
                  };
                  if (typeof document !== 'undefined') {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked' && m.target) {
                          m.target.removeAttribute('bis_skin_checked');
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-cyan-400 selection:text-zinc-950"
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
