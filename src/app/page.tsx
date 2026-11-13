"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Gauge,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Mail,
  ArrowRight,
  Car,
  Truck,
  Sparkles,
  Award,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  HelpCircle,
  Building2,
  Eye,
  Send,
  Zap,
  X,
  RotateCcw,
  FileCheck2,
  Users,
  UserCheck,
  Layers,
  Printer,
  FileText,
  FileCheck,
} from "lucide-react";
import { CORPORATE_IDENTITY } from "@/config/corporate-identity";
import { DocumentCenterModal } from "@/components/documents/DocumentCenterModal";
import { OFFICIAL_DOCUMENT_TEMPLATES } from "@/modules/documents/document-templates";

interface CatalogLotItem {
  id: string;
  lotNumber: string;
  yardName: string;
  yardState: string;
  yardCity: string;
  odometerValue: number | null;
  odometerUnit: string;
  odometerBrand: string;
  titleCode: string | null;
  titleCategory: string;
  primaryDamage: string;
  secondaryDamage: string | null;
  damageNotes?: string | null;
  runAndDriveStatus: string;
  hasKeys: boolean | null;
  estimatedRetailValue: number | null;
  currentBidUsd: number;
  buyItNowPriceUsd: number | null;
  auctionDate: string | null;
  saleStatus: string;
  completenessStatus: string;
  missingFields: string[];
  dataEnvironment: string;
  sourceQueriedAt: string;
  vehicle: {
    id: string;
    internalCode: string;
    vin: string | null;
    isVinMasked: boolean;
    vinDecodedByNhtsa: boolean;
    make: string;
    model: string;
    trim: string | null;
    year: number;
    bodyStyle: string | null;
    engineSpec: string | null;
    drivetrain: string | null;
    fuelType: string | null;
  };
  dataSource: {
    code: string;
    name: string;
  };
  media: Array<{
    id: string;
    title: string;
    url: string;
    originReference: string;
    isAuthorizedCopy: boolean;
  }>;
}

const CATEGORIES = [
  { id: "ALL", label: "Todos los Vehículos", icon: Car },
  { id: "AUTOMOVILES", label: "Automóviles", icon: Car },
  { id: "SUV", label: "SUV", icon: ShieldCheck },
  { id: "CAMIONETAS", label: "Camionetas", icon: Truck },
  { id: "PICKUPS", label: "Pickups", icon: Truck },
  { id: "LUJO", label: "Vehículos de Lujo", icon: Sparkles },
  { id: "ELECTRICOS", label: "Vehículos Eléctricos", icon: Zap },
  { id: "COMERCIALES", label: "Vehículos Comerciales", icon: Building2 },
];

export default function HomePage() {
  const { company, telephones, emails, businessHours } = CORPORATE_IDENTITY;
  const hasPhone = Boolean(telephones.mainPhone);
  const hasWhatsapp = Boolean(telephones.whatsappRaw || telephones.whatsappNumber);
  const whatsappNumber = telephones.whatsappRaw || telephones.whatsappNumber;
  const hasEmail = Boolean(emails.generalInfo || emails.sales || emails.support);
  const primaryEmail = emails.sales || emails.generalInfo || emails.support;

  // Catálogo de vehículos desde el backend
  const [lots, setLots] = useState<CatalogLotItem[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);

  // Filtros del Catálogo
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMake, setSelectedMake] = useState("ALL");
  const [selectedMinYear, setSelectedMinYear] = useState("ALL");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState("ALL");
  const [selectedMileage, setSelectedMileage] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedTitleCategory, setSelectedTitleCategory] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");

  // Estado del Modal de Cotización Rápida
  const [quoteModalLot, setQuoteModalLot] = useState<CatalogLotItem | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalCountry, setModalCountry] = useState("México");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccessCode, setModalSuccessCode] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado del Formulario de Búsqueda Personalizada (#asesoria)
  const [leadName, setLeadName] = useState("");
  const [leadCountry, setLeadCountry] = useState("México");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCategory, setLeadCategory] = useState("SUV");
  const [leadMake, setLeadMake] = useState("");
  const [leadModel, setLeadModel] = useState("");
  const [leadMinYear, setLeadMinYear] = useState("2021");
  const [leadMaxYear, setLeadMaxYear] = useState("2024");
  const [leadBudget, setLeadBudget] = useState("");
  const [leadCondition, setLeadCondition] = useState("RUNS_AND_DRIVES");
  const [leadTitle, setLeadTitle] = useState("CLEAN_ONLY");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccessCode, setLeadSuccessCode] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  // Acordeón de FAQ
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estado del Centro Documental Oficial
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>("DOC-01-PRES");

  // Cargar inventario desde la API
  const loadPublicCatalog = useCallback(async () => {
    setLoadingLots(true);
    try {
      const res = await fetch("/api/catalog?sortBy=AUCTION_DATE_SOONEST");
      const data = await res.json();
      setLots(data.lots ?? []);
    } catch (err) {
      console.error("Error al cargar inventario:", err);
    } finally {
      setLoadingLots(false);
    }
  }, []);

  useEffect(() => {
    loadPublicCatalog();
  }, [loadPublicCatalog]);

  // Lista única de marcas presentes en los lotes
  const availableMakes = useMemo(() => {
    const set = new Set<string>();
    lots.forEach((l) => {
      if (l.vehicle?.make) set.add(l.vehicle.make);
    });
    return Array.from(set).sort();
  }, [lots]);

  // Lista única de estados presentes en las yardas
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    lots.forEach((l) => {
      if (l.yardState) set.add(l.yardState);
    });
    return Array.from(set).sort();
  }, [lots]);

  // Filtrado de lotes en memoria en tiempo real
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (!lot) return false;
      const vehicle = lot.vehicle || ({} as Partial<typeof lot.vehicle>);
      const q = searchQuery.toLowerCase().trim();
      const lotNum = (lot.lotNumber || "").toLowerCase();
      const make = (vehicle.make || "").toLowerCase();
      const model = (vehicle.model || "").toLowerCase();
      const year = vehicle.year ? String(vehicle.year) : "";
      const matchQuery =
        !q ||
        lotNum.includes(q) ||
        make.includes(q) ||
        model.includes(q) ||
        `${year} ${make} ${model}`.includes(q);

      // Filtro por Categoría
      let matchCat = true;
      if (selectedCategory !== "ALL") {
        const body = (vehicle.bodyStyle || "").toUpperCase();
        const upperMake = (vehicle.make || "").toUpperCase();
        const fuel = (vehicle.fuelType || "").toUpperCase();

        if (selectedCategory === "AUTOMOVILES") {
          matchCat =
            body.includes("AUTOMÓVILES") ||
            body.includes("AUTOMOVILES") ||
            body.includes("SEDAN") ||
            body.includes("SEDÁN") ||
            body.includes("COUPE");
        } else if (selectedCategory === "SUV") {
          matchCat =
            (body.includes("SUV") || body.includes("CROSSOVER")) &&
            !body.includes("FULL-SIZE") &&
            !body.includes("CAMIONETAS");
        } else if (selectedCategory === "CAMIONETAS") {
          matchCat = body.includes("CAMIONETAS") || body.includes("FULL-SIZE");
        } else if (selectedCategory === "PICKUPS") {
          matchCat = body.includes("PICKUP");
        } else if (selectedCategory === "LUJO") {
          matchCat =
            body.includes("LUJO") ||
            ["BMW", "MERCEDES-BENZ", "AUDI", "PORSCHE", "LEXUS"].includes(upperMake);
        } else if (selectedCategory === "ELECTRICOS") {
          matchCat =
            body.includes("ELÉCTRICO") ||
            body.includes("ELECTRICO") ||
            fuel === "ELECTRIC" ||
            upperMake === "TESLA";
        } else if (selectedCategory === "COMERCIALES") {
          matchCat =
            body.includes("COMERCIAL") || body.includes("VAN") || body.includes("CARGO");
        }
      }

      // Filtro por Marca
      const matchMake =
        selectedMake === "ALL" ||
        (vehicle.make || "").toUpperCase() === selectedMake.toUpperCase();

      // Filtro por Año Mínimo
      const matchYear =
        selectedMinYear === "ALL" ||
        (vehicle.year ? vehicle.year >= Number(selectedMinYear) : true);

      // Filtro por Presupuesto / Puja Máxima
      let matchPrice = true;
      const price = lot.currentBidUsd || 0;
      if (selectedMaxPrice !== "ALL") {
        matchPrice = price <= Number(selectedMaxPrice);
      }

      // Filtro por Millaje
      let matchMileage = true;
      if (selectedMileage !== "ALL" && lot.odometerValue !== null && lot.odometerValue !== undefined) {
        matchMileage = lot.odometerValue <= Number(selectedMileage);
      }

      // Filtro por Estado / Yarda
      const matchState =
        selectedState === "ALL" ||
        (lot.yardState || "").toUpperCase() === selectedState.toUpperCase();

      // Filtro por Tipo de Título
      const matchTitle =
        selectedTitleCategory === "ALL" ||
        (lot.titleCategory || "").toUpperCase() === selectedTitleCategory.toUpperCase();

      // Filtro por Condición
      const matchCondition =
        selectedCondition === "ALL" ||
        (selectedCondition === "RUNS_AND_DRIVES" &&
          lot.runAndDriveStatus === "RUNS_AND_DRIVES");

      return (
        matchQuery &&
        matchCat &&
        matchMake &&
        matchYear &&
        matchPrice &&
        matchMileage &&
        matchState &&
        matchTitle &&
        matchCondition
      );
    });
  }, [
    lots,
    searchQuery,
    selectedCategory,
    selectedMake,
    selectedMinYear,
    selectedMaxPrice,
    selectedMileage,
    selectedState,
    selectedTitleCategory,
    selectedCondition,
  ]);

  // Función para restablecer todos los filtros
  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSearchQuery("");
    setSelectedMake("ALL");
    setSelectedMinYear("ALL");
    setSelectedMaxPrice("ALL");
    setSelectedMileage("ALL");
    setSelectedState("ALL");
    setSelectedTitleCategory("ALL");
    setSelectedCondition("ALL");
  };

  // Enviar formulario del Modal de Cotización Rápida
  const handleModalQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalLot) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLIC_CREATE_INQUIRY",
          fullName: modalName,
          email: modalEmail,
          phoneWhatsapp: modalPhone,
          country: modalCountry,
          customerType: "INDIVIDUAL_BUYER",
          targetVehicle: `${quoteModalLot.vehicle.year} ${quoteModalLot.vehicle.make} ${quoteModalLot.vehicle.model} (Lote #${quoteModalLot.lotNumber})`,
          maxBudgetUsd: quoteModalLot.currentBidUsd,
          requestedServices: "FULL_IMPORT_ADVISORY",
          customerMessage: `[Solicitud Cotización Directa Lote #${quoteModalLot.lotNumber}]: ${quoteModalLot.vehicle.year} ${quoteModalLot.vehicle.make} ${quoteModalLot.vehicle.model}. Puja: $${quoteModalLot.currentBidUsd} USD. Destino: ${modalCountry}. Notas: ${modalNotes || "Sin observaciones adicionales"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "No fue posible procesar la solicitud.");
      } else {
        setModalSuccessCode(data.quoteRequest?.referenceCode || "OK");
      }
    } catch {
      setModalError("Error de conexión al enviar. Intente vía WhatsApp directo.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Enviar Solicitud de Búsqueda Personalizada en el CRM
  const handlePersonalizedSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLIC_CREATE_INQUIRY",
          fullName: leadName,
          email: leadEmail,
          phoneWhatsapp: leadPhone,
          country: leadCountry,
          customerType: "INDIVIDUAL_BUYER",
          targetVehicle: `${leadMake} ${leadModel} (${leadMinYear}-${leadMaxYear}) [${leadCategory}]`,
          minYear: Number(leadMinYear) || undefined,
          maxBudgetUsd: leadBudget ? Number(leadBudget) : undefined,
          requestedServices: "FULL_IMPORT_ADVISORY",
          customerMessage: `[Búsqueda Personalizada]: Categoría: ${leadCategory}. Marca/Modelo: ${leadMake} ${leadModel}. Años: ${leadMinYear}-${leadMaxYear}. Presupuesto máx: $${leadBudget || "Por definir"} USD. Preferencia condición: ${leadCondition}. Título: ${leadTitle}. País de entrega: ${leadCountry}. Mensaje: ${leadMessage || "Deseo recibir opciones filtradas en Copart."}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeadError(data.error || "No fue posible procesar su solicitud.");
      } else {
        setLeadSuccessCode(data.quoteRequest?.referenceCode || "OK");
        setLeadName("");
        setLeadPhone("");
        setLeadEmail("");
        setLeadMake("");
        setLeadModel("");
        setLeadBudget("");
        setLeadMessage("");
      }
    } catch {
      setLeadError("Error de conexión al registrar. Intente vía WhatsApp directo.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const whatsappDirectUrl = hasWhatsapp
    ? `https://wa.me/${whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20estoy%20interesado%20en%20adquirir%20un%20vehículo%20en%20subasta.`
    : "#asesoria";

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black"
    >
      {/* ==================================================================== */}
      {/* 1. SECCIÓN INICIO — HERO PORTADA OFICIAL PUJAMOTOR USA */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden bg-black border-b border-zinc-800">
        {/* Resplandor ambiental de identidad */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[130px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-600/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pt-10 md:pb-16 space-y-8">
          {/* Contenedor del Banner Oficial Portada */}
          <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl shadow-cyan-950/20 group">
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] md:aspect-[21/9] lg:aspect-[2.35/1] overflow-hidden bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/pujamotor-hero.jpg"
                alt="PUJAMOTOR USA — Compra Inteligente. Puja con Confianza."
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Barra de Acciones de Cabecera con Botón de Copart Destacado */}
            <div className="bg-zinc-950/95 border-t border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-zinc-300">
                  <span className="font-bold text-white uppercase tracking-wider">PUJAMOTOR USA:</span> Compra inteligente. Puja con confianza. Te acompañamos en el proceso de principio a fin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center">
                {/* BOTÓN EXPLORAR VEHÍCULOS EN COPART */}
                <a
                  href="https://www.copart.com/vehicleFinder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all shadow-md active:scale-95"
                >
                  <span>EXPLORAR VEHÍCULOS EN COPART</span>
                  <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                </a>

                <a
                  href="#catalogo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all shadow-md active:scale-95"
                >
                  <Search className="h-3.5 w-3.5 text-zinc-900 stroke-[2.5]" />
                  <span>VER CATÁLOGO</span>
                </a>

                <a
                  href="#asesoria"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 hover:border-orange-500/50 transition-all shadow-md active:scale-95"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-orange-400" />
                  <span>ASESORÍA</span>
                </a>
              </div>
            </div>
          </div>

          {/* Las 3 Líneas de Negocio Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. BROKER AUTOMOTRIZ */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 flex items-center gap-4 hover:border-cyan-500/40 transition-colors shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  Servicio 01
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Broker Automotriz
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Licencia oficial de subasta en EE. UU. Factura directa a su nombre sin intermediarios informales.
                </p>
              </div>
            </div>

            {/* 2. BÚSQUEDA DE VEHÍCULOS */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 flex items-center gap-4 hover:border-cyan-500/40 transition-colors shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0">
                <Search className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                  Servicio 02
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Búsqueda de Vehículos
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Filtro exhaustivo semanal entre más de 50,000 unidades. Comprobación de llaves, Carfax y odómetro.
                </p>
              </div>
            </div>

            {/* 3. ASESORÍA EN SUBASTAS USA */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 flex items-center gap-4 hover:border-orange-500/40 transition-colors shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold block">
                  Servicio 03
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Asesoría en Subastas USA
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Tope de puja calculado para optimizar su inversión. Monitoreo en vivo y logística portuaria.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. SECCIÓN PRINCIPAL: ENCUENTRA TU PRÓXIMO VEHÍCULO */}
      {/* ==================================================================== */}
      <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] text-zinc-900 border-b border-zinc-300">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Encabezado Principal del Catálogo */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3.5 py-1 text-xs font-mono font-semibold text-zinc-800 shadow-sm">
                <Car className="h-3.5 w-3.5 text-cyan-600" />
                CATÁLOGO AUTOMOTRIZ PUJAMOTOR USA
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                ENCUENTRA TU PRÓXIMO VEHÍCULO
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl">
                Unidades reales seleccionadas en subastas de Estados Unidos con verificación de lote, condición mecánica e informe pericial.
              </p>
            </div>

            {/* Acceso a Copart Destacado */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <a
                href="https://www.copart.com/vehicleFinder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-md group"
              >
                <span>EXPLORAR VEHÍCULOS EN COPART</span>
                <ExternalLink className="h-4 w-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                {loadingLots
                  ? "Sincronizando subastas..."
                  : lots.length === 0
                  ? "Inventario en actualización oficial"
                  : `${filteredLots.length} unidades disponibles`}
              </span>
            </div>
          </div>

          {/* Banner de Aviso de Independencia con Copart */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-cyan-600 shrink-0" />
              <p>
                <strong className="text-zinc-900">Intermediación Profesional:</strong> PUJAMOTOR USA brinda asesoría, corretaje e intermediación para adquirir vehículos listados en Copart. No somos filial ni representante oficial de Copart Inc., operando como broker autorizado e independiente.
              </p>
            </div>
            <a
              href="https://www.copart.com/vehicleFinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 whitespace-nowrap underline inline-flex items-center gap-1"
            >
              Ir al buscador oficial de Copart <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* BARRA DE 7 CATEGORÍAS AUTOMOTRICES OBLIGATORIAS */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider">
              Categorías de Vehículos:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-zinc-950 text-white shadow-md scale-[1.02]"
                        : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${isSelected ? "text-cyan-400" : "text-zinc-500"}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL DE FILTROS MULTIFACTOR FUNCIONALES */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
                Filtros de Búsqueda Avanzada
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restablecer Filtros</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {/* 1. Búsqueda por Lote o Modelo */}
              <div className="sm:col-span-2">
                <label className="block text-zinc-700 font-semibold mb-1">
                  Búsqueda por Lote, Marca o Modelo
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. F-150, RAV4, Tesla, 78410201..."
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 pl-10 pr-3.5 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 2. Marca */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Marca</label>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Todas las marcas</option>
                  {availableMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Año Mínimo */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Año Mínimo</label>
                <select
                  value={selectedMinYear}
                  onChange={(e) => setSelectedMinYear(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Todos los años</option>
                  <option value="2020">2020 o más reciente</option>
                  <option value="2021">2021 o más reciente</option>
                  <option value="2022">2022 o más reciente</option>
                  <option value="2023">2023 o más reciente</option>
                </select>
              </div>

              {/* 4. Presupuesto Máximo */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Presupuesto Máximo de Puja</label>
                <select
                  value={selectedMaxPrice}
                  onChange={(e) => setSelectedMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Sin límite</option>
                  <option value="12000">Hasta $12,000 USD</option>
                  <option value="18000">Hasta $18,000 USD</option>
                  <option value="25000">Hasta $25,000 USD</option>
                  <option value="35000">Hasta $35,000 USD</option>
                </select>
              </div>

              {/* 5. Millaje */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Millaje Máximo</label>
                <select
                  value={selectedMileage}
                  onChange={(e) => setSelectedMileage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Cualquier millaje</option>
                  <option value="20000">Menos de 20,000 millas</option>
                  <option value="35000">Menos de 35,000 millas</option>
                  <option value="50000">Menos de 50,000 millas</option>
                </select>
              </div>

              {/* 6. Estado / Ubicación */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Ubicación / Estado USA</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Todos los Estados</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Tipo de Título */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Tipo de Título</label>
                <select
                  value={selectedTitleCategory}
                  onChange={(e) => setSelectedTitleCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Todos los títulos</option>
                  <option value="CLEAN">Clean Title (Título Limpio)</option>
                  <option value="SALVAGE">Salvage (Recuperado / Aseguradora)</option>
                </select>
              </div>

              {/* 8. Condición */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Condición Operativa</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">Cualquier condición</option>
                  <option value="RUNS_AND_DRIVES">Solo Run & Drive (Enciende y Rueda)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CUADRÍCULA DE TARJETAS DE VEHÍCULOS / ESTADO DE ACTUALIZACIÓN OFICIAL */}
          {loadingLots ? (
            <div className="py-20 text-center font-mono text-sm text-zinc-500">
              Sincronizando inventario de subastas oficial...
            </div>
          ) : lots.length === 0 ? (
            <div className="rounded-2xl border border-zinc-300 bg-white p-12 text-center space-y-6 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 border border-zinc-200">
                <Car className="h-8 w-8 text-cyan-600" />
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                <span className="inline-block rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 font-mono text-xs font-bold text-cyan-800 uppercase tracking-wider">
                  Sincronización de Subastas en Proceso
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950">
                  Inventario Comercial en Proceso de Actualización Oficial
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  PUJAMOTOR USA opera exclusivamente con unidades reales verificadas. Estamos procesando los lotes auténticos disponibles en subasta. Puede explorar directamente las más de 50,000 unidades en Copart o solicitar una búsqueda técnica personalizada adaptada a su presupuesto.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="https://www.copart.com/vehicleFinder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all shadow-md active:scale-95"
                >
                  <span>Explorar Vehículos en Copart</span>
                  <ExternalLink className="h-4 w-4 stroke-[2.5]" />
                </a>
                <a
                  href="#asesoria"
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow"
                >
                  <Search className="h-4 w-4 text-cyan-400" />
                  <span>Solicitar Búsqueda Personalizada</span>
                </a>
              </div>
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="rounded-2xl border border-zinc-300 bg-white p-12 text-center space-y-4 shadow-sm">
              <Car className="h-12 w-12 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">
                  No se encontraron unidades con los filtros seleccionados
                </h3>
                <p className="text-xs text-zinc-600 max-w-lg mx-auto">
                  En Copart salen a remate más de 50,000 unidades cada semana. Solicite a nuestro equipo una búsqueda personalizada adaptada a su presupuesto.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-100 px-5 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-200 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
                <a
                  href="#asesoria"
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Solicitar Búsqueda Personalizada</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLots.map((lot) => {
                const photo = lot.media?.[0]?.url || "/images/vehicles/toyota-rav4-2022.jpg";
                const isClean = lot.titleCategory === "CLEAN";
                const rawLot = lot.lotNumber.replace(/^DEMO-|^REAL-TEST-/, "");
                const copartLotUrl = `https://www.copart.com/lot/${rawLot}`;
                const lotSummary = `${lot.vehicle.year} ${lot.vehicle.make} ${lot.vehicle.model}`;

                const waCardUrl = hasWhatsapp
                  ? `https://wa.me/${whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20deseo%20consultar%20por%20el%20vehículo%20${encodeURIComponent(
                      lotSummary
                    )}%20(Lote%20%23${lot.lotNumber})%20visto%20en%20su%20catálogo.`
                  : "#asesoria";

                return (
                  <div
                    key={lot.id}
                    className="rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-400 hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Imagen / Ficha Gráfica del Lote */}
                    <div className="relative h-56 w-full bg-zinc-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={lotSummary}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Insignias Superiores */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span
                          className={`rounded px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                            isClean
                              ? "bg-white text-zinc-950"
                              : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                          }`}
                        >
                          {isClean ? "CLEAN TITLE" : "SALVAGE"}
                        </span>
                        {lot.runAndDriveStatus === "RUNS_AND_DRIVES" && (
                          <span className="rounded bg-zinc-900/90 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold px-2 py-0.5 backdrop-blur">
                            RUN & DRIVE
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="rounded bg-black/85 border border-zinc-700 text-zinc-200 font-mono text-[10px] px-2.5 py-0.5 backdrop-blur font-bold">
                          #{lot.lotNumber}
                        </span>
                      </div>
                    </div>

                    {/* Información y Especificaciones del Lote */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-cyan-600" />
                            {lot.yardName || "Subasta EE. UU."} {lot.yardState ? `(${lot.yardState})` : ""}
                          </span>
                          <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-bold">
                            {lot.vehicle?.bodyStyle || "Automotriz"}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-zinc-950 group-hover:text-cyan-700 transition-colors mt-1 leading-snug">
                          {lot.vehicle?.year || ""} {lot.vehicle?.make || ""} {lot.vehicle?.model || ""}
                        </h3>

                        {lot.vehicle?.trim && (
                          <p className="text-xs text-zinc-500 font-medium">{lot.vehicle.trim}</p>
                        )}
                      </div>

                      {/* Métricas Técnicas */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-zinc-700">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-zinc-400" />
                          <span>
                            {lot.odometerValue
                              ? `${lot.odometerValue.toLocaleString()} mi`
                              : "Millas N/D"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span>
                            {lot.auctionDate
                              ? new Date(lot.auctionDate).toLocaleDateString("es-MX", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Fecha asignada"}
                          </span>
                        </div>
                        <div className="col-span-2 text-[11px] text-zinc-600 truncate pt-1 border-t border-zinc-200/60">
                          Daño: <strong className="text-zinc-800">{lot.primaryDamage || "N/D"}</strong>
                        </div>
                      </div>

                      {/* Puja Verificada y Enlace a Copart */}
                      <div className="pt-2 border-t border-zinc-150 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                              Puja Actual Verificada
                            </span>
                            <span className="text-xl font-mono font-black text-zinc-950">
                              ${lot.currentBidUsd.toLocaleString()} USD
                            </span>
                          </div>

                          {lot.buyItNowPriceUsd && (
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                                Buy It Now
                              </span>
                              <span className="text-xs font-mono text-emerald-600 font-bold">
                                ${lot.buyItNowPriceUsd.toLocaleString()} USD
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Enlace Discreto al Lote en Copart */}
                        <div className="pt-1">
                          <a
                            href={copartLotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-cyan-700 transition-colors"
                          >
                            <span>Ver Lote en Copart</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* TRES BOTONES FUNCIONALES */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {/* 1. VER DETALLES */}
                        <Link
                          href={`/lotes/${encodeURIComponent(lot.lotNumber)}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white px-2 py-2 text-[11px] font-bold text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400 transition-colors shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-600" />
                          <span>DETALLES</span>
                        </Link>

                        {/* 2. SOLICITAR COTIZACIÓN */}
                        <button
                          type="button"
                          onClick={() => {
                            setQuoteModalLot(lot);
                            setModalSuccessCode(null);
                            setModalError(null);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-600/30 bg-cyan-50 px-2 py-2 text-[11px] font-bold text-cyan-900 hover:bg-cyan-100 transition-colors shadow-sm"
                        >
                          <DollarSign className="h-3.5 w-3.5 text-cyan-700" />
                          <span>COTIZAR</span>
                        </button>

                        {/* 3. CONSULTAR POR WHATSAPP */}
                        <a
                          href={waCardUrl}
                          target={hasWhatsapp ? "_blank" : undefined}
                          rel={hasWhatsapp ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-950 px-2 py-2 text-[11px] font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                        >
                          <MessageSquare className="h-3.5 w-3.5 fill-current text-cyan-400" />
                          <span>WHATSAPP</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. MODAL DE COTIZACIÓN RÁPIDA (INTERACTIVO AL DAR CLIC EN COTIZAR) */}
      {/* ==================================================================== */}
      {quoteModalLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setQuoteModalLot(null)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                Solicitud de Cotización Oficial
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {quoteModalLot.vehicle.year} {quoteModalLot.vehicle.make} {quoteModalLot.vehicle.model}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Lote #{quoteModalLot.lotNumber} · Yarda {quoteModalLot.yardName} ({quoteModalLot.yardState}) · Puja: ${quoteModalLot.currentBidUsd.toLocaleString()} USD
              </p>
            </div>

            {modalSuccessCode ? (
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-6 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-cyan-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">¡Cotización Registrada con Éxito!</h4>
                  <p className="text-xs text-zinc-300">
                    Expediente asignado en el sistema comercial:
                  </p>
                  <div className="font-mono text-2xl font-black text-cyan-400 py-1">
                    #{modalSuccessCode}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Un asesor revisará el lote y le enviará el desglose detallado de grúa y flete marítimo.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  {hasWhatsapp && (
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20acabo%20de%20generar%20la%20cotización%20%23${modalSuccessCode}%20para%20el%20lote%20%23${quoteModalLot.lotNumber}.%20Deseo%20conocer%20los%20siguientes%20pasos.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-4 py-3 text-xs tracking-wider uppercase transition-all shadow"
                    >
                      <MessageSquare className="h-4 w-4 fill-current" />
                      <span>Continuar por WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setQuoteModalLot(null)}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleModalQuoteSubmit} className="space-y-3.5 text-xs">
                {modalError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-rose-200">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Ej. Andrés Ramírez"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">WhatsApp / Teléfono *</label>
                    <input
                      type="text"
                      required
                      value={modalPhone}
                      onChange={(e) => setModalPhone(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">País de Destino *</label>
                    <select
                      value={modalCountry}
                      onChange={(e) => setModalCountry(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="México">México</option>
                      <option value="Guatemala">Guatemala</option>
                      <option value="República Dominicana">República Dominicana</option>
                      <option value="Honduras">Honduras</option>
                      <option value="El Salvador">El Salvador</option>
                      <option value="Costa Rica">Costa Rica</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Chile">Chile</option>
                      <option value="Perú">Perú</option>
                      <option value="Estados Unidos">Estados Unidos (Local)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="andres@ejemplo.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Notas o Preguntas</label>
                  <textarea
                    rows={2}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="¿Desea cotizar con flete marítimo o consultar reporte Carfax?"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-4 py-3 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {modalSubmitting ? "Enviando cotización..." : "SOLICITAR COTIZACIÓN FORMAL"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. SECCIÓN CÓMO FUNCIONA — METODOLOGÍA TRANSPARENTE */}
      {/* ==================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              EL PROCESO PASO A PASO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Cómo Funciona el Proceso con PUJAMOTOR USA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Un sistema ordenado, transparente y seguro. Le gestionamos todo ante Copart: usted no se tiene que preocupar por nada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. ELEGIR VEHÍCULO */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 text-cyan-400 font-mono font-black text-base flex items-center justify-center border border-zinc-700">
                01
              </div>
              <h3 className="text-base font-bold text-white">Elegir el Vehículo</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Le enviamos entre 4 y 7 opciones con enlaces directos de Copart (Clean Title y Run & Drive). Calculamos la oferta ideal por debajo de su presupuesto.
              </p>
            </div>

            {/* 2. CONTRATO Y FEE AL RECIBIR */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 text-cyan-400 font-mono font-black text-base flex items-center justify-center border border-zinc-700">
                02
              </div>
              <h3 className="text-base font-bold text-white">Contrato y Fee al Recibir</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Firmamos el contrato exigido por Copart con el tope de puja y nuestro fee ($300 a $500). El fee lo paga ÚNICAMENTE cuando tenga el carro en sus manos.
              </p>
            </div>

            {/* 3. SUB-USUARIO Y SUBASTA EN VIVO */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 text-cyan-400 font-mono font-black text-base flex items-center justify-center border border-zinc-700">
                03
              </div>
              <h3 className="text-base font-bold text-white">Sub-usuario y Subasta en Vivo</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Le creamos un sub-usuario dentro de nuestra cuenta de broker en Copart. Entra con nosotros a la subasta en vivo y ve las pujas en tiempo real.
              </p>
            </div>

            {/* 4. FACTURA DIRECTA DE COPART */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 text-cyan-400 font-mono font-black text-base flex items-center justify-center border border-zinc-700">
                04
              </div>
              <h3 className="text-base font-bold text-white">Factura Directa de Copart</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si ganamos, Copart le envía la factura directamente a su correo con taxes y título incluidos. La paga directo a la yard, a nuestra cuenta o por link de pago.
              </p>
            </div>

            {/* 5. COPART DELIVERY A DOMICILIO */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 text-cyan-400 font-mono font-black text-base flex items-center justify-center border border-zinc-700">
                05
              </div>
              <h3 className="text-base font-bold text-white">Copart Delivery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copart le contacta para coordinar la entrega directa a domicilio con Copart Delivery (aprox. entre $400 y $850 USD). Recibe el auto y el título en su casa.
              </p>
            </div>

            {/* 6. CERO COSTO SI SE PIERDE */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-white text-zinc-950 font-mono font-black text-base flex items-center justify-center">
                06
              </div>
              <h3 className="text-base font-bold text-white">Cero Costo si no Ganamos</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nadie puede garantizar ganar: gana la puja más alta. Si no ganamos, usted no paga nada y le buscamos de inmediato otra opción en Copart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. SECCIÓN SERVICIOS COMERCIALES OFICIALES */}
      {/* ==================================================================== */}
      <section id="servicios" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              LÍNEAS DE NEGOCIO Y SERVICIOS OFICIALES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Servicios Comerciales PUJAMOTOR USA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Te acompañamos en el proceso de búsqueda y compra de principio a fin con absoluta transparencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* SERVICIO 1: BROKER AUTOMOTRIZ */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 space-y-4 hover:border-cyan-500/50 transition-colors shadow-lg">
              <div className="h-14 w-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                  Servicio 01
                </span>
                <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                  Broker Automotriz
                </h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acceso formal con licencia de broker para participar en subastas mayoristas de Copart e IAA sin requerir que usted tramite licencias en Estados Unidos. Factura oficial emitida directamente por la subasta a su nombre.
              </p>
              <div className="pt-2 border-t border-zinc-900 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Licencia autorizada · Factura directa</span>
              </div>
            </div>

            {/* SERVICIO 2: BÚSQUEDA DE VEHÍCULOS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 space-y-4 hover:border-cyan-500/50 transition-colors shadow-lg">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                <Search className="h-7 w-7 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                  Servicio 02
                </span>
                <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                  Búsqueda de Vehículos
                </h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Localización minuciosa entre miles de lotes semanales. Filtramos rigurosamente unidades Clean Title, Run & Drive, revisamos odómetro, llaves, fotografías de alta definición y tramitamos el reporte Carfax oficial.
              </p>
              <div className="pt-2 border-t border-zinc-900 flex items-center gap-2 text-[11px] font-mono text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Filtro Clean Title / R&D · Carfax verificado</span>
              </div>
            </div>

            {/* SERVICIO 3: ASESORÍA EN SUBASTAS USA */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 space-y-4 hover:border-orange-500/50 transition-colors shadow-lg">
              <div className="h-14 w-14 rounded-2xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block">
                  Servicio 03
                </span>
                <h3 className="text-xl font-black text-white mt-1 uppercase tracking-tight">
                  Asesoría en Subastas USA
                </h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acompañamiento personalizado de principio a fin. Definición analítica del tope de puja para optimizar su inversión, monitoreo en vivo durante el remate y coordinación de flete terrestre hasta el puerto de exportación.
              </p>
              <div className="pt-2 border-t border-zinc-900 flex items-center gap-2 text-[11px] font-mono text-orange-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
                <span>Puja en tiempo real · Despacho portuario</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. SECCIÓN DIFERENCIADORES Y SEGURIDAD FINANCIERA */}
      {/* ==================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-zinc-900 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-50 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-700">
              <Award className="h-3.5 w-3.5 text-zinc-500" />
              SEGURIDAD Y TRANSPARENCIA
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              ¿Por Qué Gestionar su Compra con PUJAMOTOR USA?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Políticas operativas basadas en transparencia, seguridad bancaria y protección al comprador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">01. SEGURIDAD FINANCIERA</div>
              <h3 className="text-base font-bold text-zinc-950">Fee de $300 a $500 Solo al Recibir</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                El fee de PUJAMOTOR USA está fijado entre $300 y $500 según el valor del vehículo. Se cancela ÚNICAMENTE cuando usted ya tiene el carro en sus manos.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">02. TRANSPARENCIA EN PAGOS</div>
              <h3 className="text-base font-bold text-zinc-950">Las Tres Vías Oficiales de Pago</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                El vehículo se abona solo por 3 vías: 1. Directo a la yard de Copart. 2. A la cuenta oficial de PUJAMOTOR USA. 3. Por link de pago a Copart o a nosotros. Jamás a cuentas personales.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">03. COMPRA INTELIGENTE</div>
              <h3 className="text-base font-bold text-zinc-950">Oferta Ideal entre 60% y 75%</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Calculamos la oferta ideal por debajo de su presupuesto (40%-60% de valor minorista o 60%-75% de compra inmediata) para asegurar rentabilidad real.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">04. FACTURA OFICIAL</div>
              <h3 className="text-base font-bold text-zinc-950">Factura Directa de Copart</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Si ganamos, Copart le envía la factura directamente a su correo con taxes y título a su nombre, porque la compra se gestiona con nuestra licencia de broker.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">05. CERO RIESGO DE PUJA</div>
              <h3 className="text-base font-bold text-zinc-950">Costo Cero si no Ganamos</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Nadie puede garantizar ganar una subasta. Si otro postor supera el tope autorizado, usted no paga nada y le buscamos otra opción en Copart.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-2">
              <div className="text-zinc-500 font-mono font-bold text-xs uppercase">06. MONITOREO EN DIRECTO</div>
              <h3 className="text-base font-bold text-zinc-950">Sub-usuario para Subasta en Vivo</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Le creamos un sub-usuario en Copart para que entre a la subasta en vivo y vea las pujas en tiempo real. Le enviamos capturas de Próximos lotes y Venta finalizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. SECCIÓN: NUESTRO EQUIPO DE OPERACIONES Y ÁREAS DE TRABAJO */}
      {/* ==================================================================== */}
      <section id="equipo" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              SALA DE OPERACIONES Y EQUIPO HUMANO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Nuestro Equipo de Operaciones
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Especialistas dedicados a la búsqueda técnica, análisis de lotes, seguimiento de subastas en vivo y formalización documental.
            </p>
          </div>

          {/* Fotografía Principal del Equipo — 100% visible, sin superposiciones sobre las personas */}
          <div className="w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 group">
            <div className="relative w-full aspect-[1024/571]">
              <Image
                src="/images/pujamotor-team-operations.jpg"
                alt="Nuestro Equipo de Operaciones PUJAMOTOR USA"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
            </div>

            {/* Pie informativo técnico de la fotografía (debajo de la imagen, sin tapar a las personas) */}
            <div className="px-5 py-3.5 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                    SALA DE CONTROL Y OPERACIONES · MIAMI, FLORIDA
                  </span>
                  <p className="text-xs text-zinc-300 font-medium leading-normal mt-0.5">
                    Equipo de análisis, operadores de subastas en vivo y seguimiento documental de PUJAMOTOR USA.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 font-mono text-[11px] font-bold text-cyan-300 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>PUJAMOTOR USA TEAM</span>
              </div>
            </div>
          </div>

          {/* Texto Institucional Rector Obligatorio */}
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950 shadow-inner">
              <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed italic border-l-4 border-cyan-400 pl-4 sm:pl-6 text-left">
                «En PUJAMOTOR USA desarrollamos un modelo de trabajo orientado a la búsqueda, análisis y gestión de oportunidades de compra en subastas automotrices. Nuestro enfoque integra asesoría al comprador, análisis de vehículos, gestión de operaciones y seguimiento documental durante el proceso de adquisición».
              </p>
            </div>
          </div>

          {/* Las Cinco Áreas de Trabajo */}
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Áreas de Trabajo Especializadas
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Estructura operativa integral para garantizar transparencia, control de límites y seguridad en cada compra.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* A. ANÁLISIS DE VEHÍCULOS */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 hover:border-cyan-500/50 transition-all shadow-md group">
                <div className="h-12 w-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Search className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  ÁREA A
                </span>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Análisis de Vehículos
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Búsqueda de oportunidades, revisión de información disponible, títulos, condición, millaje y evaluación de alternativas.
                </p>
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  <span>Clean Title & Run/Drive</span>
                </div>
              </div>

              {/* B. OPERACIONES DE SUBASTA */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 hover:border-cyan-500/50 transition-all shadow-md group">
                <div className="h-12 w-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  ÁREA B
                </span>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Operaciones de Subasta
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Preparación de operaciones, control de límites autorizados, seguimiento de pujas y registro de resultados.
                </p>
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  <span>Puja en vivo y tope inviolable</span>
                </div>
              </div>

              {/* C. ASESORÍA AL COMPRADOR */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 hover:border-cyan-500/50 transition-all shadow-md group">
                <div className="h-12 w-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  ÁREA C
                </span>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Asesoría al Comprador
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Acompañamiento personalizado, explicación del procedimiento, resolución de dudas y orientación durante la selección.
                </p>
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  <span>Sin presiones · Pasos PDF 1</span>
                </div>
              </div>

              {/* D. GESTIÓN DOCUMENTAL */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3 hover:border-cyan-500/50 transition-all shadow-md group">
                <div className="h-12 w-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                  ÁREA D
                </span>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Gestión Documental
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Organización de contratos, cotizaciones, facturas, comprobantes de pago y archivo formal del expediente.
                </p>
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  <span>Contrato formal y archivo</span>
                </div>
              </div>
            </div>

            {/* E. TRANSPORTE Y ENTREGA DE VEHÍCULOS (ÁREA E DESTACADA) */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-zinc-900/90 p-6 sm:p-8 shadow-2xl hover:border-cyan-500/40 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Fotografía de Transporte */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-950">
                    <Image
                      src="/images/pujamotor-transport-hauler.jpg"
                      alt="Área E — Transporte y Entrega de Vehículos PUJAMOTOR USA"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 450px"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-zinc-400">
                    <Truck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Referencia ilustrativa de logística y transporte en EE. UU.</span>
                  </div>
                </div>

                {/* Contenido Institucional de Área E */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                      ÁREA E · LOGÍSTICA DE TRASLADO
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Subasta &rarr; Yarda &rarr; Destino Final
                    </span>
                  </div>

                  <h4 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                    Transporte y Entrega de Vehículos
                  </h4>

                  <div className="border-l-4 border-cyan-400 pl-4 py-1 bg-zinc-900/40 rounded-r-lg">
                    <p className="text-xs sm:text-sm text-zinc-200 italic leading-relaxed">
                      «Coordinamos el seguimiento logístico de los vehículos adquiridos en subastas, desde su salida de las instalaciones correspondientes hasta la entrega al comprador. Orientamos al cliente sobre las alternativas de transporte, costos estimados y coordinación de entrega».
                    </p>
                  </div>

                  {/* Cuatro Elementos Requeridos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="h-6 w-6 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Transporte especializado de vehículos
                        </span>
                        <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                          Plataformas y portavehículos comerciales autorizados.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="h-6 w-6 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Coordinación de recogida en la yarda
                        </span>
                        <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                          Gestión de Gate Pass y retiro dentro de días libres.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="h-6 w-6 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Seguimiento del traslado
                        </span>
                        <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                          Monitoreo de ruta y estatus en tránsito interestatal.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div className="h-6 w-6 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Coordinación de entrega al comprador
                        </span>
                        <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                          Recepción física, inspección y liquidación final.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nota de Transparencia Operativa */}
                  <p className="text-[11px] text-zinc-400 font-mono pt-1">
                    * PUJAMOTOR USA actúa como coordinador logístico facilitando la vinculación con transportistas comerciales con licencia DOT/MC. No operamos flota propia ni cobramos recargos ocultos sobre el flete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. SECCIÓN: PERSONAL Y RESPONSABILIDADES AUDITABLES */}
      {/* ==================================================================== */}
      <section id="personal" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-300">
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
              ESTRUCTURA DE ROLES AUDITABLES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Personal y Responsabilidades
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Cada etapa de la adquisición está asignada a roles definidos con autorizaciones y credenciales previamente comprobadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Responsable de Operaciones */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-3 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  OPERACIONES
                </span>
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-base font-bold text-white">
                Responsable de Operaciones
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Supervisión global de las licencias de broker, validación de expedientes de compra, asignación de sub-usuarios y control de cumplimiento normativo ante las subastadoras.
              </p>
              <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-500">
                Credencial: Cuenta Broker Copart
              </div>
            </div>

            {/* 2. Operadores de Subastas */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-3 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SUBASTAS EN VIVO
                </span>
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-base font-bold text-white">
                Operadores de Subastas
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conexión en directo a las salas de subasta en tiempo real, gestión de pujas con control estricto de la oferta máxima autorizada y captura del pantallazo de «Venta finalizada».
              </p>
              <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-500">
                Límite: Oferta tope fijada en contrato
              </div>
            </div>

            {/* 3. Asesores Comerciales */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-3 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  ATENCIÓN AL CLIENTE
                </span>
                <MessageSquare className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-base font-bold text-white">
                Asesores Comerciales
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acompañamiento individual, aplicación rigurosa de los 10 pasos comerciales de PDF 1, elaboración de presentaciones de 4 a 7 lotes y resolución de dudas sin presiones.
              </p>
              <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-500">
                Estándar: 10 Pasos Rectores PDF 1
              </div>
            </div>

            {/* 4. Coordinación Documental y Logística */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-3 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  LOGÍSTICA
                </span>
                <Truck className="h-4 w-4 text-cyan-400" />
              </div>
              <h4 className="text-base font-bold text-white">
                Coordinación Documental y Logística
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Redacción y resguardo de contratos de mandato, verificación de documentos de identidad, comprobación de facturación oficial de Copart y despacho con Copart Delivery.
              </p>
              <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-500">
                Garantía: Fee liquidado contra entrega
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 9. SECCIÓN: CÓMO FUNCIONA PUJAMOTOR USA (8 ETAPAS RECTORAS) */}
      {/* ==================================================================== */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              PROCESO ESTANDARIZADO DE 8 ETAPAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Cómo Funciona PUJAMOTOR USA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Un flujo ordenado, transparente y paso por paso basado en las conversaciones y procedimientos reales de PDF 1 y PDF 2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Etapa 1 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-cyan-500 text-zinc-950 font-black text-xs font-mono flex items-center justify-center">
                  01
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 1-2</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                1. Solicitud y Presupuesto
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                El cliente indica qué vehículo busca (modelo y año) y cuál es su presupuesto total en mano para la compra.
              </p>
            </div>

            {/* Etapa 2 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  02
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 3</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                2. Opciones de 4 a 7 Lotes
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Buscamos y enviamos entre 4 y 7 alternativas reales de Copart (Clean Title, Run & Drive) con rango de oferta proyectada.
              </p>
            </div>

            {/* Etapa 3 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  03
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 4</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                3. Revisión y Cotización
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Revisamos a fondo el lote en Copart (llaves, millaje, daño, yarda) y preparamos la cotización con desglose oficial de tarifas.
              </p>
            </div>

            {/* Etapa 4 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  04
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 5</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                4. Elección y Explicación
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                El cliente elige su vehículo preferido y le explicamos todo el proceso en orden estricto (por llamada o por mensaje).
              </p>
            </div>

            {/* Etapa 5 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  05
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 6</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                5. Contrato y Límite de Oferta
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Se formaliza el contrato de 4 puntos con documento de identidad, fijando la oferta máxima inviolable y el fee de $300 a $500.
              </p>
            </div>

            {/* Etapa 6 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  06
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 7-8</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                6. Sub-usuario y Subasta en Vivo
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Montamos la oferta en Copart, creamos el sub-usuario para que el cliente entre en vivo y enviamos aviso con 'Próximos lotes'.
              </p>
            </div>

            {/* Etapa 7 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-black text-xs font-mono flex items-center justify-center">
                  07
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 9</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                7. Cierre con Evidencia
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Acompañamos el evento y enviamos el pantallazo auténtico de 'Venta finalizada'. Si se gana, confirmamos en cuenta broker.
              </p>
            </div>

            {/* Etapa 8 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-cyan-500 text-zinc-950 font-black text-xs font-mono flex items-center justify-center">
                  08
                </span>
                <span className="text-[10px] font-mono text-zinc-500">PASO 10</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                8. Factura, Pago y Entrega
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copart factura directamente al comprador. Se paga por las 3 vías oficiales, Copart Delivery entrega el auto y se abona el fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 10. SECCIÓN: CENTRO DOCUMENTAL OFICIAL */}
      {/* ==================================================================== */}
      <section id="documentos" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400">
                <FileCheck2 className="h-3.5 w-3.5 text-cyan-400" />
                ESTÁNDAR DOCUMENTAL Y DE CUMPLIMIENTO
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                Centro Documental Corporativo
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Acceda a los formatos, contratos, autorizaciones y actas oficiales que respaldan cada etapa del proceso de compra con PUJAMOTOR USA. Todos los documentos están membretados y preparados para exportación en PDF.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId("DOC-01-PRES");
                  setDocModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <FileText className="h-4 w-4" />
                <span>ABRIR CENTRO DOCUMENTAL</span>
              </button>
            </div>
          </div>

          {/* Parrilla de los 8 documentos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {OFFICIAL_DOCUMENT_TEMPLATES.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {doc.code}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {doc.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {doc.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setDocModalOpen(true);
                    }}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Ver y Descargar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <Printer className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. SECCIÓN SOLICITUD DE BÚSQUEDA PERSONALIZADA (#asesoria) */}
      {/* ==================================================================== */}
      <section id="asesoria" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Texto y Beneficios */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-300">
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                SOLICITUD DE BÚSQUEDA PERSONALIZADA
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Cuéntenos Qué Vehículo Busca y Le Preparamos Alternativas Reales
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Sin registros obligatorios ni cargos adelantados. Indíquenos sus requerimientos de marca, presupuesto y país de destino. Un broker revisará las subastas activas en Copart y le enviará opciones verificadas.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-zinc-300">Asesoría comercial sin costo de consulta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-zinc-300">Revisión de Carfax antes de formalizar la puja</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-zinc-300">Estimación de flete terrestre y despacho portuario</span>
                </div>
              </div>

              {hasWhatsapp && (
                <div className="pt-4 border-t border-zinc-800">
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition-colors shadow"
                  >
                    <MessageSquare className="h-4 w-4 fill-current text-zinc-900" />
                    <span>Escribir Directamente por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* FORMULARIO COMPLETO DE BÚSQUEDA PERSONALIZADA */}
            <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-black p-6 sm:p-8 shadow-2xl">
              <div className="border-b border-zinc-800 pb-4 mb-6">
                <h3 className="text-lg font-bold text-white">Formulario de Búsqueda Personalizada</h3>
                <p className="text-xs text-zinc-400">
                  Complete los criterios exactos del vehículo que desea comprar en subasta.
                </p>
              </div>

              {leadSuccessCode ? (
                <div className="rounded-2xl border border-cyan-500/40 bg-zinc-900/90 p-8 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-cyan-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white">¡Solicitud Registrada con Éxito!</h4>
                    <p className="text-xs text-zinc-400">
                      Su expediente ha sido creado con el código de seguimiento:
                    </p>
                    <div className="font-mono text-2xl font-black text-cyan-400 py-1">
                      #{leadSuccessCode}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Un asesor de PUJAMOTOR USA se comunicará vía WhatsApp con la lista de lotes candidatos.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    {hasWhatsapp && (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=Hola%20PUJAMOTOR%20USA,%20acabo%20de%20enviar%20mi%20solicitud%20de%20búsqueda%20%23${leadSuccessCode}.%20Deseo%20confirmar%20recepción.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-zinc-950 uppercase tracking-wider transition-colors shadow"
                      >
                        <MessageSquare className="h-4 w-4 fill-current" />
                        <span>Avisar por WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setLeadSuccessCode(null)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePersonalizedSearchSubmit} className="space-y-4 text-xs">
                  {leadError && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-rose-300">
                      {leadError}
                    </div>
                  )}

                  {/* Datos del Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Ej. Roberto Martínez"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">País de Residencia / Destino *</label>
                      <input
                        type="text"
                        required
                        value={leadCountry}
                        onChange={(e) => setLeadCountry(e.target.value)}
                        placeholder="Ej. México, Guatemala, Rep. Dominicana..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">WhatsApp / Teléfono *</label>
                      <input
                        type="tel"
                        required
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Correo Electrónico (Opcional)</label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="roberto@example.com"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Criterios del Vehículo */}
                  <div className="pt-2 border-t border-zinc-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Tipo de Vehículo *</label>
                        <select
                          value={leadCategory}
                          onChange={(e) => setLeadCategory(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="Automóviles">Automóviles</option>
                          <option value="SUV">SUV</option>
                          <option value="Camionetas">Camionetas</option>
                          <option value="Pickups">Pickups</option>
                          <option value="Vehículos de lujo">Vehículos de lujo</option>
                          <option value="Vehículos eléctricos">Vehículos eléctricos</option>
                          <option value="Vehículos comerciales">Vehículos comerciales</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Marca Deseada *</label>
                        <input
                          type="text"
                          required
                          value={leadMake}
                          onChange={(e) => setLeadMake(e.target.value)}
                          placeholder="Ej. Toyota, Ford, Tesla..."
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Modelo Deseado</label>
                        <input
                          type="text"
                          value={leadModel}
                          onChange={(e) => setLeadModel(e.target.value)}
                          placeholder="Ej. RAV4, F-150, Model 3..."
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Año Mínimo *</label>
                        <select
                          value={leadMinYear}
                          onChange={(e) => setLeadMinYear(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="2018">2018</option>
                          <option value="2019">2019</option>
                          <option value="2020">2020</option>
                          <option value="2021">2021</option>
                          <option value="2022">2022</option>
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Año Máximo</label>
                        <select
                          value={leadMaxYear}
                          onChange={(e) => setLeadMaxYear(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="2022">2022</option>
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Presupuesto Máximo (USD) *</label>
                        <input
                          type="number"
                          required
                          value={leadBudget}
                          onChange={(e) => setLeadBudget(e.target.value)}
                          placeholder="Ej. 15000"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 font-mono text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Preferencia de Condición</label>
                        <select
                          value={leadCondition}
                          onChange={(e) => setLeadCondition(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="RUNS_AND_DRIVES">Solo Run & Drive (Enciende y Rueda)</option>
                          <option value="MINOR_DAMAGE">Golpes menores o cosméticos aceptables</option>
                          <option value="ANY_CONDITION">Cualquier condición</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-medium mb-1">Preferencia de Título</label>
                        <select
                          value={leadTitle}
                          onChange={(e) => setLeadTitle(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="CLEAN_ONLY">Solo Clean Title (Título Limpio)</option>
                          <option value="SALVAGE_ALLOWED">Salvage Permitido (Aseguradora)</option>
                          <option value="INDIFFERENT">Indiferente</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Requerimientos Adicionales</label>
                      <textarea
                        rows={2}
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                        placeholder="Ej. Color exterior preferido, tracción 4x4 o techo panorámico..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-950 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                    <span>{leadSubmitting ? "Registrando solicitud..." : "REGISTRAR SOLICITUD DE BÚSQUEDA"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. SECCIÓN PREGUNTAS FRECUENTES (FAQ) */}
      {/* ==================================================================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 bg-black">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-300">
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              PREGUNTAS FRECUENTES
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Dudas Habituales sobre Subastas en Estados Unidos
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Información clara sobre procesos, requisitos y pagos.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "¿Y si es una estafa o qué garantías de seguridad tengo?",
                a: "Lo entendemos perfectamente. Por eso trabajamos con absoluta transparencia: usted entra a la subasta en vivo con su propio sub-usuario y ve todo lo que pasa en tiempo real. Si ganamos, la factura le llega directamente desde el correo oficial de Copart a su nombre. El vehículo se lo envía Copart Delivery directamente a usted. Y nuestro fee de asesoría lo paga únicamente cuando tenga el carro en sus manos. Esa es la mayor tranquilidad que le podemos dar, respaldado por una de las empresas de subasta más grandes y reconocidas del mundo.",
              },
              {
                q: "¿A quién y cómo se le paga el vehículo adjudicado?",
                a: "Usted elige con total libertad entre las tres formas oficiales: 1) Pago directo en la yarda oficial de Copart donde está el vehículo; 2) Transferencia bancaria directa a nuestra cuenta corporativa oficial de PUJAMOTOR USA; o 3) Mediante link oficial de pago seguro (ya sea a Copart o a PUJAMOTOR USA). Jamás se solicitan ni aceptan transferencias a cuentas personales de asesores.",
              },
              {
                q: "¿Y si el carro no está bueno o tiene fallas ocultas?",
                a: "Todos los vehículos que buscamos en Copart están en excelente estado, verificados en condición Run & Drive (enciende y camina) y con Título Limpio (Clean Title). Pero lo más importante: en el momento en que usted firma el contrato, sacamos el reporte oficial de Carfax del vehículo para comprobar su historial completo, registros de mantenimiento, kilometraje certificado y siniestros previos antes de ofertar.",
              },
              {
                q: "¿Cuánto cuesta el fee de PUJAMOTOR USA y cuándo se cancela?",
                a: "Nuestro fee de broker es únicamente de $300 a $500 USD (según el valor final del vehículo). No cobramos anticipos por este concepto: se paga única y exclusivamente cuando usted ya tiene el carro en sus manos.",
              },
              {
                q: "¿Y si no ganamos la subasta de mi vehículo favorito?",
                a: "No pasa absolutamente nada. Si no ganamos, usted no paga nada y seguimos buscando de inmediato otra opción que se ajuste a sus gustos y presupuesto. Cada semana salen miles de vehículos a subasta en Copart.",
              },
              {
                q: "¿Cómo se organiza el flete y entrega del vehículo?",
                a: "El transporte se gestiona directamente con Copart Delivery desde la yarda de subasta hasta la puerta de su casa o taller de preferencia. El costo promedio suele oscilar entre $400 y $850 USD dependiendo de la distancia y ubicación exacta.",
              },
              {
                q: "¿Cómo participo en la subasta en vivo el día del remate?",
                a: "Una vez formalizado el contrato de intermediación, le generamos su propio sub-usuario dentro de nuestra cuenta de broker autorizada en Copart. Con ese acceso usted entra a la plataforma de Copart, observa la sala de subasta en tiempo real y acompaña cada puja de forma 100% transparente.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-cyan-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 9. SECCIÓN CONTACTO — CANALES DIRECTOS */}
      {/* ==================================================================== */}
      <section id="contacto" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-300">
              <Phone className="h-3.5 w-3.5 text-cyan-400" />
              ATENCIÓN DIRECTA
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Contacto Corporativo PUJAMOTOR USA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Comuníquese con un asesor para consultas de inventario, trámites aduanales y logística.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* WhatsApp */}
            <div className="rounded-2xl border border-zinc-800 bg-black p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
                <MessageSquare className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">WhatsApp Comercial</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Atención en tiempo real para cotizaciones y seguimiento de subastas.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <a
                  href={whatsappDirectUrl}
                  target={hasWhatsapp ? "_blank" : undefined}
                  rel={hasWhatsapp ? "noopener noreferrer" : undefined}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-xs font-bold text-zinc-950 transition-colors shadow"
                >
                  <MessageSquare className="h-4 w-4 fill-current" />
                  <span>{telephones.whatsappNumber || "Chatear por WhatsApp"}</span>
                </a>
              </div>
            </div>

            {/* Teléfono */}
            <div className="rounded-2xl border border-zinc-800 bg-black p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Línea Telefónica Directa</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Llamada institucional para trámites portuarios y contratos de mandato.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                {hasPhone ? (
                  <a
                    href={`tel:${telephones.mainPhone}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold text-zinc-950 transition-colors shadow"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{telephones.mainPhoneFormatted || telephones.mainPhone}</span>
                  </a>
                ) : (
                  <Link
                    href="/contacto"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <span>Solicitar Llamada</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Correo */}
            <div className="rounded-2xl border border-zinc-800 bg-black p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Correo Institucional</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Recepción de documentación formal, identificaciones y contratos firmados.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <Link
                  href="/contacto"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="truncate">{primaryEmail || "Contactar por Correo"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Interactivo del Centro Documental Oficial */}
      <DocumentCenterModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        initialDocId={selectedDocId}
      />
    </div>
  );
}
