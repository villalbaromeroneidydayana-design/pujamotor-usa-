"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Car,
  DollarSign,
  Users,
  ShieldCheck,
  Upload,
  Cpu,
  History,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  ExternalLink,
  LogOut,
  KeyRound,
  BookOpen,
  Compass,
  HelpCircle,
  CheckSquare,
  Copy,
  FileText,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { CompletenessBadge, EnvironmentBadge } from "@/components/DataBadges";
import { ROLE_LABELS, UserRole, hasPermission } from "@/modules/admin/auth.service";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { DocumentCenterModal } from "@/components/documents/DocumentCenterModal";
import {
  METHODOLOGY_SUBASTA_PRO_USA,
  NON_NEGOTIABLE_RULES,
  OBJECTIONS_HANDBOOK,
  TEN_QUESTIONS_RUBRIC,
  TEAM_ROUTINE,
  MethodologyDefinition,
  MethodologyStep,
} from "@/modules/crm/methodologies.data";

const SAMPLE_COPART_CSV = `Lot number,Year,Make,Model Detail,Body Style,Color,Damage Description,Secondary Damage,Sale Title State,Sale Title Type,Has Keys-Yes or No,Odometer,Odometer Brand,High Bid =non-vix,Buy-It-Now Price,Yard name,Location state,Location city,Sale Date M/D/CY,Runs/Drives,VIN,Est. Retail Value,Repair cost
89011201,2022,FORD,F-150 XLT,CREW PICKUP,OXFORD WHITE,FRONT END,MINOR DENTS/SCRATCHES,TX,CERT OF TITLE-SALVAGE,YES,34210,ACTUAL,14800,19500,TX - HOUSTON,TX,HOUSTON,2026-12-05,RUNS AND DRIVES,1FTFW1E85NFA00001,38400,6200
89011202,2023,TOYOTA,RAV4 XLE,4DR SPORT UTILITY,MAGNETIC GRAY,REAR END,UNDERCARRIAGE,FL,CERT OF TITLE-SALVAGE,YES,19850,ACTUAL,12400,16900,FL - MIAMI CENTRAL,FL,MIAMI,2026-12-08,RUNS AND DRIVES,2T3P1RFV8PW000002,31900,4800`;

type AdminTab =
  | "OVERVIEW"
  | "COPILOT_METHODOLOGIES"
  | "INGESTION_COPART"
  | "VEHICLES_LOTS"
  | "TARIFFS_COSTS"
  | "CRM_COMMERCIAL"
  | "AUDIT_SECURITY";

interface AuthenticatedSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword?: boolean;
  permissions: string[];
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const [sessionUser, setSessionUser] = useState<AuthenticatedSessionUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Estado de inicio de sesión (sin credenciales predeterminadas)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Estado de cambio obligatorio de contraseña en primer inicio de sesión
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdChangeError, setPwdChangeError] = useState<string | null>(null);
  const [pwdChangeSubmitting, setPwdChangeSubmitting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [overviewData, setOverviewData] = useState<any>(null);

  // Estado Pestaña Ingesta Copart CSV + NHTSA
  const [csvContent, setCsvContent] = useState(SAMPLE_COPART_CSV);
  const [csvFileName, setCsvFileName] = useState("copart_member_sales_data.csv");
  const [csvEnv, setCsvEnv] = useState<"PRODUCTION_REAL" | "DEMO_SANDBOX">("PRODUCTION_REAL");
  const [vinInput, setVinInput] = useState("1FTFW1E85NFA00001");
  const [vinLotId, setVinLotId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decodedVinResult, setDecodedVinResult] = useState<any>(null);

  // Estado Edición de Lote
  const [selectedLotId, setSelectedLotId] = useState("");
  const [editBidUsd, setEditBidUsd] = useState("");
  const [editBuyNowUsd, setEditBuyNowUsd] = useState("");
  const [editOdometer, setEditOdometer] = useState("");
  const [editDamage, setEditDamage] = useState("");
  const [editSaleStatus, setEditSaleStatus] = useState("UPCOMING");
  const [editAvailability, setEditAvailability] = useState("AVAILABLE");

  // Estado Adjuntar Fotografía Autorizada
  const [mediaLotId, setMediaLotId] = useState("");
  const [mediaTitle, setMediaTitle] = useState("Inspección Exterior Verificada");
  const [mediaUrl, setMediaUrl] = useState("/media/authorized/pickup-inspection.svg");
  const [mediaOriginRef, setMediaOriginRef] = useState(
    "Reporte fotográfico propio autorizado por miembro en yarda"
  );

  // Estado Edición de Tarifas Calculadora
  const [gateFeeUsd, setGateFeeUsd] = useState(79);
  const [envFeeUsd, setEnvFeeUsd] = useState(15);
  const [brokerPercent, setBrokerPercent] = useState(4.0);
  const [brokerMinFee, setBrokerMinFee] = useState(295);
  const [docFeeUsd, setDocFeeUsd] = useState(185);

  // Estado Respuesta CRM
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("ESTIMATE_SENT");
  const [advisorNote, setAdvisorNote] = useState(
    "Lote verificado en yarda. Disponible para representación de puja bajo contrato."
  );
  const [convertCase, setConvertCase] = useState(true);

  // Estado CRM Comercial Extendido (Fase 3: 11 Etapas, 4-7 Alternativas y Alertas)
  const [selectedLeadIdForPres, setSelectedLeadIdForPres] = useState("");
  const [selectedLotsForPres, setSelectedLotsForPres] = useState<string[]>([]);
  const [presTitle, setPresTitle] = useState("");
  const [presNotes, setPresNotes] = useState("");
  const [createdPresResult, setCreatedPresResult] = useState<{
    publicUrl: string;
    whatsappMessage: string;
  } | null>(null);
  const [presSubmitting, setPresSubmitting] = useState(false);

  // Estado Actualización de Etapa Comercial
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseStage, setCaseStage] = useState("CONTACTO_INICIAL");
  const [isThinkingCase, setIsThinkingCase] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [caseNotes, setCaseNotes] = useState("");
  const [caseMaxBid, setCaseMaxBid] = useState("");
  const [caseSelectedLot, setCaseSelectedLot] = useState("");
  const [caseSubmitting, setCaseSubmitting] = useState(false);

  // Estado Registro de Hitos
  const [milestoneType, setMilestoneType] = useState<
    "DOCUMENTS_RECEIVED" | "CARFAX_VERIFIED" | "BID_AUTHORIZED" | "AUCTION_RESULT" | "BROKER_FEE_SET"
  >("AUCTION_RESULT");
  const [milestoneEvidenceRef, setMilestoneEvidenceRef] = useState("");
  const [milestoneWonPrice, setMilestoneWonPrice] = useState("");
  const [milestoneBrokerFee, setMilestoneBrokerFee] = useState("350");
  const [milestoneDocUrl, setMilestoneDocUrl] = useState("");
  const [milestoneCarfaxUrl, setMilestoneCarfaxUrl] = useState("");
  const [milestoneHasCarfax, setMilestoneHasCarfax] = useState(false);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  // Estado Selector de Plantillas de Guion
  const [selectedTemplateId, setSelectedTemplateId] = useState("TPL_01_SALUDO_INICIAL");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Estado Copiloto de Metodología Oficial PUJAMOTOR USA (PDF 1)
  const [copilotCaseId, setCopilotCaseId] = useState("");
  const [copilotMethodology, setCopilotMethodology] = useState<
    "SUBASTA_PRO_USA" | "PUJAMOTOR_USA"
  >("SUBASTA_PRO_USA");
  const [copilotActiveStep, setCopilotActiveStep] = useState(1);
  const [copilotChecklist, setCopilotChecklist] = useState<Record<string, boolean>>({});
  const [copilotNotes, setCopilotNotes] = useState("");
  const [copilotSubmitting, setCopilotSubmitting] = useState(false);
  const [copilotActiveSubTab, setCopilotActiveSubTab] = useState<
    "COPILOT" | "FULL_MANUAL" | "RUBRIC"
  >("COPILOT");

  // Estado del Centro Documental Oficial
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docInitialId, setDocInitialId] = useState<string>("DOC-04-CONTRATO");
  const [docInitialValues, setDocInitialValues] = useState<Record<string, string>>({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/admin/auth");
      if (!authRes.ok) {
        setSessionUser(null);
        setOverviewData(null);
        return;
      }

      const authData = await authRes.json();
      if (!authData.authenticated || !authData.user) {
        setSessionUser(null);
        setOverviewData(null);
        return;
      }

      setSessionUser(authData.user);

      // Si el usuario requiere cambio obligatorio de contraseña, no cargar overview aún
      if (authData.user.mustChangePassword) {
        setOverviewData(null);
        return;
      }

      const res = await fetch("/api/admin/overview");
      if (res.status === 401) {
        setSessionUser(null);
        setOverviewData(null);
        return;
      }
      const data = await res.json();
      if (res.ok && data.sessionUser) {
        setSessionUser(data.sessionUser);
        setOverviewData(data);

        if (data.tariffs?.rules) {
          setGateFeeUsd(data.tariffs.rules.gateFeeUsd ?? 79);
          setEnvFeeUsd(data.tariffs.rules.environmentalFeeUsd ?? 15);
          setBrokerPercent(data.tariffs.rules.brokerFeeRules?.percentage ?? 4.0);
          setBrokerMinFee(data.tariffs.rules.brokerFeeRules?.minFeeUsd ?? 295);
          setDocFeeUsd(data.tariffs.rules.brokerFeeRules?.fixedDocumentationFeeUsd ?? 185);
        }

        if (data.allLots?.length > 0 && !selectedLotId) {
          const first = data.allLots[0];
          setSelectedLotId(first.id);
          setMediaLotId(first.id);
          setEditBidUsd(String(first.currentBidUsd));
          setEditBuyNowUsd(first.buyItNowPriceUsd ? String(first.buyItNowPriceUsd) : "");
          setEditOdometer(first.odometerValue ? String(first.odometerValue) : "");
          setEditDamage(first.primaryDamage);
          setEditSaleStatus(first.saleStatus);
          setEditAvailability(first.availabilityStatus);
        }
      }
    } catch (err) {
      console.error("Error cargando panel admin:", err);
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  }, [selectedLotId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOGIN",
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Credenciales inválidas.");
      } else {
        setCurrentPassword(loginPassword);
        setLoginPassword("");
        await loadDashboard();
      }
    } catch {
      setLoginError("Error de red al iniciar sesión.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleMandatoryPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeError(null);

    if (newPassword !== confirmNewPassword) {
      setPwdChangeError("La confirmación de la nueva contraseña no coincide.");
      return;
    }

    setPwdChangeSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_PASSWORD",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdChangeError(data.error || "No fue posible actualizar la contraseña.");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setStatusMessage({
          type: "success",
          text: "Contraseña actualizada exitosamente. Acceso administrativo habilitado.",
        });
        await loadDashboard();
      }
    } catch {
      setPwdChangeError("Error de red al actualizar la contraseña.");
    } finally {
      setPwdChangeSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LOGOUT" }),
    });
    setSessionUser(null);
    setOverviewData(null);
    setStatusMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setCsvContent(ev.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "IMPORT_COPART_CSV",
          fileName: csvFileName,
          csvContent,
          dataEnvironment: csvEnv,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Lote CSV procesado: ${data.batch.processedRecords} vehículos sincronizados (${data.batch.createdRecords} nuevos, ${data.batch.updatedRecords} actualizados). Hash SHA-256 registrado.`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al procesar la ingesta CSV." });
    }
  };

  const handleDecodeVin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECODE_VIN_NHTSA",
          vin: vinInput,
          lotId: vinLotId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setDecodedVinResult(data.decoded);
        setStatusMessage({
          type: "success",
          text: `Consulta oficial NHTSA completada para VIN ${data.decoded.vin}.`,
        });
        if (vinLotId) await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al consultar la API NHTSA." });
    }
  };

  const handleUpdateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_LOT_CONDITIONS",
          lotId: selectedLotId,
          currentBidUsd: Number(editBidUsd),
          buyItNowPriceUsd: editBuyNowUsd === "" ? null : Number(editBuyNowUsd),
          odometerValue: editOdometer === "" ? undefined : Number(editOdometer),
          primaryDamage: editDamage,
          saleStatus: editSaleStatus,
          availabilityStatus: editAvailability,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Lote #${data.lot.lotNumber} actualizado en el Motor Central y registrado en el Historial de Cambios.`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al actualizar lote." });
    }
  };

  const handleAttachMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ATTACH_AUTHORIZED_MEDIA",
          lotId: mediaLotId,
          mediaType: "PHOTO_EXTERIOR",
          title: mediaTitle,
          url: mediaUrl,
          originReference: mediaOriginRef,
          isAuthorizedCopy: true,
          isPrimary: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: "Fotografía autorizada vinculada exitosamente al lote y estado de completitud recalculado.",
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al vincular fotografía autorizada." });
    }
  };

  const handleSetPrimaryMedia = async (mediaId: string) => {
    if (!mediaLotId) return;
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_PRIMARY_MEDIA",
          lotId: mediaLotId,
          mediaId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({ type: "success", text: "Fotografía principal actualizada correctamente." });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al actualizar fotografía principal." });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!mediaLotId) return;
    if (!confirm("¿Desea eliminar esta fotografía vinculada al lote?")) return;
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_MEDIA",
          lotId: mediaLotId,
          mediaId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({ type: "success", text: "Fotografía eliminada correctamente." });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al eliminar fotografía." });
    }
  };

  const handleMoveMedia = async (mediaId: string, direction: "UP" | "DOWN") => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const currentLot = allLots.find((l: any) => l.id === mediaLotId);
    if (!currentLot?.media) return;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const list = [...currentLot.media].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    const idx = list.findIndex((m: any) => m.id === mediaId);
    if (idx === -1) return;
    const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const swapped = [...list];
    const temp = swapped[idx];
    swapped[idx] = swapped[targetIdx];
    swapped[targetIdx] = temp;

    const mediaIdsInOrder = swapped.map((m: any) => m.id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REORDER_MEDIA",
          lotId: mediaLotId,
          mediaIdsInOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({ type: "success", text: "Orden de fotografías actualizado." });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al reordenar fotografías." });
    }
  };

  const handleSaveTariffs = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TARIFF_RULES",
          gateFeeUsd,
          environmentalFeeUsd: envFeeUsd,
          brokerPercentage: brokerPercent,
          brokerMinFeeUsd: brokerMinFee,
          fixedDocumentationFeeUsd: docFeeUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: "Matriz tarifaria de la calculadora actualizada y registrada en Auditoría.",
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al guardar tarifas." });
    }
  };

  const handleProcessQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteId) return;
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_PROCESS_QUOTE",
          quoteRequestId: selectedQuoteId,
          status: quoteStatus,
          advisorResponseNote: advisorNote,
          createAdvisoryCase: convertCase,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Solicitud procesada exitosamente.${
            data.createdCase ? ` Expediente creado: ${data.createdCase.caseNumber}` : ""
          }`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al procesar la solicitud comercial." });
    }
  };

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadIdForPres) {
      setStatusMessage({ type: "error", text: "Debe seleccionar un cliente prospecto." });
      return;
    }
    if (selectedLotsForPres.length < 4 || selectedLotsForPres.length > 7) {
      setStatusMessage({
        type: "error",
        text: `Debe seleccionar entre 4 y 7 vehículos (seleccionados actualmente: ${selectedLotsForPres.length}).`,
      });
      return;
    }
    setPresSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_CREATE_PRESENTATION",
          customerLeadId: selectedLeadIdForPres,
          lotNumbers: selectedLotsForPres,
          title: presTitle.trim() || undefined,
          notes: presNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Error al crear presentación." });
      } else {
        setCreatedPresResult({
          publicUrl: data.publicUrl,
          whatsappMessage: data.whatsappMessage,
        });
        setStatusMessage({
          type: "success",
          text: `¡Presentación creada exitosamente (${data.presentation.presentationCode})! Enlace y mensaje generados.`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error de conexión al crear presentación." });
    } finally {
      setPresSubmitting(false);
    }
  };

  const handleUpdateCommercialStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setStatusMessage({ type: "error", text: "Debe seleccionar un expediente de asesoría." });
      return;
    }
    setCaseSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_UPDATE_COMMERCIAL_STAGE",
          caseId: selectedCaseId,
          stage: caseStage,
          isThinking: isThinkingCase || caseStage === "CLIENTE_PENSANDO",
          followUpDays: Number(followUpDays) || 3,
          operationalNotes: caseNotes,
          selectedLotNumber: caseSelectedLot.trim() || undefined,
          maxAuthorizedBidUsd: caseMaxBid ? Number(caseMaxBid) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Etapa comercial actualizada a "${caseStage}"${
            isThinkingCase ? ` [Alerta de seguimiento fijada a ${followUpDays} días]` : ""
          }.`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al actualizar etapa comercial." });
    } finally {
      setCaseSubmitting(false);
    }
  };

  const handleRecordMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setStatusMessage({ type: "error", text: "Debe seleccionar un expediente de asesoría." });
      return;
    }
    if (milestoneType === "AUCTION_RESULT" && !milestoneEvidenceRef.trim()) {
      setStatusMessage({
        type: "error",
        text: "Debe ingresar el número de comprobante, factura o evidencia verificable de adjudicación.",
      });
      return;
    }
    setMilestoneSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_RECORD_MILESTONE",
          caseId: selectedCaseId,
          milestone: milestoneType,
          idDocumentUrl: milestoneDocUrl.trim() || undefined,
          carfaxReportUrl: milestoneCarfaxUrl.trim() || undefined,
          hasCarfaxReport: milestoneHasCarfax,
          auctionEvidenceRef: milestoneEvidenceRef.trim() || undefined,
          auctionWonPriceUsd: milestoneWonPrice ? Number(milestoneWonPrice) : undefined,
          brokerFeeAgreedUsd: milestoneBrokerFee ? Number(milestoneBrokerFee) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: "Hito comercial registrado exitosamente en el expediente y auditado.",
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al registrar hito comercial." });
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const toggleLotSelectionForPres = (lotNumber: string) => {
    setSelectedLotsForPres((prev) => {
      if (prev.includes(lotNumber)) {
        return prev.filter((l) => l !== lotNumber);
      } else {
        if (prev.length >= 7) {
          setStatusMessage({
            type: "error",
            text: "El límite máximo para una presentación es de 7 vehículos.",
          });
          return prev;
        }
        return [...prev, lotNumber];
      }
    });
  };

  const handleAdvanceCopilotStep = async (targetStepNumber: number) => {
    if (!copilotCaseId) {
      setStatusMessage({ type: "error", text: "Debe seleccionar un expediente de asesoría primero." });
      return;
    }
    setCopilotSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_UPDATE_COPILOT_STEP",
          caseId: copilotCaseId,
          methodology: copilotMethodology,
          currentStepNumber: targetStepNumber,
          stepChecklistJson: JSON.stringify(copilotChecklist),
          operationalNotes: copilotNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setCopilotActiveStep(targetStepNumber);
        setStatusMessage({
          type: "success",
          text: `Avanzado a Paso ${targetStepNumber} en ${copilotMethodology}. Checklist e historial guardados.`,
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al actualizar paso del copiloto." });
    } finally {
      setCopilotSubmitting(false);
    }
  };

  const handleCopilotThinkingDeviation = async () => {
    if (!copilotCaseId) {
      setStatusMessage({ type: "error", text: "Debe seleccionar un expediente de asesoría primero." });
      return;
    }
    setCopilotSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_UPDATE_COMMERCIAL_STAGE",
          caseId: copilotCaseId,
          stage: "CLIENTE_PENSANDO",
          isThinking: true,
          followUpDays: 3,
          operationalNotes: copilotNotes || "Cliente solicita tiempo para pensar / evaluar opciones.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error });
      } else {
        setStatusMessage({
          type: "success",
          text: "Desvío registrado: Cliente marcado en 'Pensando' y alerta de seguimiento programada a los 3 días.",
        });
        await loadDashboard();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error al registrar desvío de seguimiento." });
    } finally {
      setCopilotSubmitting(false);
    }
  };

  const handleSelectCopilotCase = (caseId: string) => {
    setCopilotCaseId(caseId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundCase = overviewData?.crm?.advisoryCases?.find((c: any) => c.id === caseId);
    if (foundCase) {
      if (foundCase.methodology) {
        setCopilotMethodology("SUBASTA_PRO_USA");
      }
      setCopilotActiveStep(foundCase.currentStepNumber || 1);
      try {
        const parsedChecklist = foundCase.stepChecklistJson
          ? JSON.parse(foundCase.stepChecklistJson)
          : {};
        setCopilotChecklist(parsedChecklist);
      } catch {
        setCopilotChecklist({});
      }
      setCopilotNotes(foundCase.operationalNotes || "");
    }
  };

  const toggleCopilotCheckItem = (checkKey: string) => {
    setCopilotChecklist((prev) => ({
      ...prev,
      [checkKey]: !prev[checkKey],
    }));
  };

  if (authChecking) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center font-mono text-sm text-slate-400">
        Verificando sesión administrativa firmada...
      </div>
    );
  }

  // 1. Pantalla de Inicio de Sesión Real (sin credenciales pre-cargadas ni pistas)
  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5">
          <div className="space-y-1.5 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400">
              <Lock className="h-4 w-4" />
              ACCESO PROTEGIDO · SESIÓN FIRMADA HTTPONLY
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Iniciar Sesión — Panel Administrativo
            </h1>
            <p className="text-xs text-slate-400">
              Ingrese sus credenciales institucionales asignadas. El sistema aplica control de intentos fallidos y bloqueo temporal automático.
            </p>
          </div>

          {loginError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="usuario@dominio"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              {loginSubmitting ? "Verificando credenciales..." : "Autenticar e Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Pantalla de Cambio Obligatorio de Contraseña en el Primer Inicio de Sesión
  if (sessionUser.mustChangePassword) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-amber-500/50 bg-slate-900/95 p-6 shadow-2xl space-y-5">
          <div className="space-y-1.5 border-b border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400">
              <ShieldCheck className="h-4 w-4" />
              POLÍTICA DE SEGURIDAD · PRIMER INICIO DE SESIÓN
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Cambio Obligatorio de Contraseña Temporal
            </h1>
            <p className="text-xs text-slate-300">
              Bienvenido, <strong>{sessionUser.fullName}</strong>. Por seguridad, todas las operaciones administrativas están bloqueadas hasta que reemplace su contraseña temporal por una clave personal definitiva.
            </p>
          </div>

          {pwdChangeError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{pwdChangeError}</span>
            </div>
          )}

          <form onSubmit={handleMandatoryPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Contraseña Temporal Actual
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Nueva Contraseña Definitiva (Mín. 12 caracteres, Mayús, Minús, Núm y Símbolo)
              </label>
              <input
                type="password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={12}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pwdChangeSubmitting}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {pwdChangeSubmitting
                  ? "Actualizando clave..."
                  : "Actualizar Contraseña y Continuar"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 hover:text-white"
              >
                Salir
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeRole = sessionUser.role;
  const allLots = overviewData?.allLots ?? [];
  const confirmedCount = allLots.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.completenessStatus === "CONFIRMED"
  ).length;
  const pendingCount = allLots.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.completenessStatus === "PENDING_VERIFICATION"
  ).length;
  const incompleteCount = allLots.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.completenessStatus === "INCOMPLETE"
  ).length;
  const realCount = allLots.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.dataEnvironment === "PRODUCTION_REAL"
  ).length;
  const demoCount = allLots.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => l.dataEnvironment === "DEMO_SANDBOX"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 relative">
      <WatermarkOverlay email={sessionUser.email} role={sessionUser.role} />
      {/* Cabecera de Gobernanza con Sesión Verificada en Servidor */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Lock className="h-3.5 w-3.5" />
              SESIÓN ADMINISTRATIVA VERIFICADA EN SERVIDOR · RBAC ESTRICTO ACTIVO
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-white">
              Panel Administrativo Central — PUJAMOTOR USA
            </h1>
            <p className="text-xs text-slate-400">
              Usuario autenticado:{" "}
              <strong className="text-white">{sessionUser.fullName}</strong> (
              <code>{sessionUser.email}</code>) · Rol:{" "}
              <strong className="text-amber-300">
                {ROLE_LABELS[activeRole]?.name ?? activeRole}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDocInitialId("DOC-04-CONTRATO");
                setDocModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors shadow"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Centro Documental (8 Docs)</span>
            </button>
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/60 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/60"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas del Panel Administrativo */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          {[
            { id: "OVERVIEW", label: "1. Resumen y Fuentes", icon: LayoutDashboard },
            {
              id: "COPILOT_METHODOLOGIES",
              label: "★ Copiloto Asesor (Manuales en Vivo)",
              icon: Compass,
            },
            {
              id: "INGESTION_COPART",
              label: "2. Ingesta Copart CSV / NHTSA",
              icon: FileSpreadsheet,
            },
            { id: "VEHICLES_LOTS", label: "3. Vehículos, Lotes y Fotos", icon: Car },
            { id: "TARIFFS_COSTS", label: "4. Tarifas y Costos", icon: DollarSign },
            {
              id: "CRM_COMMERCIAL",
              label: "5. Clientes, Consultas y Asesorías",
              icon: Users,
            },
            { id: "AUDIT_SECURITY", label: "6. Historial y Auditoría", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setStatusMessage(null);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notificación de estado de operación */}
      {statusMessage && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
              : "border-rose-500/40 bg-rose-950/50 text-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {loading && !overviewData ? (
        <div className="p-12 text-center font-mono text-sm text-slate-400">
          Cargando módulos del Panel Administrativo...
        </div>
      ) : (
        <>
          {/* PESTAÑA 1: RESUMEN Y ESTADO DE FUENTES DE INFORMACIÓN */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <span className="text-[11px] font-mono uppercase text-slate-400">
                    Total Lotes en Motor Central
                  </span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                    {allLots.length}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Reales: <strong className="text-sky-400">{realCount}</strong> · Demo:{" "}
                    <strong className="text-purple-400">{demoCount}</strong>
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-4">
                  <span className="text-[11px] font-mono uppercase text-emerald-400">
                    Datos Confirmados
                  </span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-300">
                    {confirmedCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Publicados y verificados</p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-4">
                  <span className="text-[11px] font-mono uppercase text-amber-400">
                    Pendientes de Verificación
                  </span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-amber-300">
                    {pendingCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">VIN parcial o foto pendiente</p>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-slate-900/80 p-4">
                  <span className="text-[11px] font-mono uppercase text-rose-400">
                    Retenidos por Incompletos
                  </span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-rose-300">
                    {incompleteCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Ocultos del catálogo público</p>
                </div>

                <div className="rounded-xl border border-sky-500/30 bg-slate-900/80 p-4">
                  <span className="text-[11px] font-mono uppercase text-sky-400">
                    Consultas y Cotizaciones
                  </span>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-sky-300">
                    {overviewData?.crm?.quoteRequests?.length ?? 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Expedientes activos: {overviewData?.crm?.advisoryCases?.length ?? 0}
                  </p>
                </div>
              </div>

              {/* Estado de Conectores y Fuentes de Información */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                  Estado de Conectores Autorizados e Integración Copart
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {overviewData?.integrations?.providers?.map((prov: any) => (
                    <div
                      key={prov.providerCode}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400">
                          {prov.providerCode}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                            prov.isReadyForLiveUse
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {prov.isReadyForLiveUse
                            ? "ACTIVO Y AUTORIZADO"
                            : "LISTO PARA CREDENCIALES"}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{prov.providerName}</h3>
                      <p className="text-slate-400 leading-relaxed">
                        {prov.legalComplianceNotice}
                      </p>
                      {prov.missingCredentials?.length > 0 && (
                        <div className="rounded border border-slate-800 bg-slate-900 p-2 font-mono text-[10px] text-slate-300">
                          Variables requeridas para activar B2B:{" "}
                          <span className="text-amber-300">
                            {prov.missingCredentials.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: INGESTA COPART CSV & DECODIFICADOR OFICIAL NHTSA */}
          {activeTab === "INGESTION_COPART" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Upload className="h-5 w-5 text-amber-400" />
                      Importador Oficial de Archivos CSV (Miembro Copart)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Valida cabeceras estándar de Copart Sales Data, neutraliza fórmulas inseguras, calcula hash SHA-256 y actualiza el Motor Central de Vehículos.
                    </p>
                  </div>
                </div>

                {!hasPermission(activeRole, "INGEST_LOT_DATA") && (
                  <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200">
                    Su rol autenticado ({activeRole}) no posee el permiso{" "}
                    <code>INGEST_LOT_DATA</code>.
                  </div>
                )}

                <form onSubmit={handleImportCsv} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Seleccionar archivo .CSV desde su equipo
                      </label>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Clasificación de Entorno de los Datos Importados
                      </label>
                      <select
                        value={csvEnv}
                        onChange={(e) =>
                          setCsvEnv(e.target.value as "PRODUCTION_REAL" | "DEMO_SANDBOX")
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                      >
                        <option value="PRODUCTION_REAL">
                          PRODUCTION_REAL (Lotes Reales Verificados)
                        </option>
                        <option value="DEMO_SANDBOX">
                          DEMO_SANDBOX (Lotes de Prueba / Demostración)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono text-slate-300">
                        Contenido CSV a sincronizar ({csvFileName})
                      </label>
                      <a
                        href="/samples/copart_sales_data_template.csv"
                        download
                        className="text-xs text-amber-400 hover:underline font-mono"
                      >
                        Descargar plantilla CSV oficial
                      </a>
                    </div>
                    <textarea
                      rows={7}
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                  >
                    Ejecutar Sincronización CSV hacia el Motor Central de Vehículos
                  </button>
                </form>
              </div>

              {/* Decodificador Oficial NHTSA vPIC */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 h-fit">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-sky-400" />
                    Decodificador Oficial de VIN — NHTSA (Gobierno EE. UU.)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Consulta en tiempo real la base de datos oficial del Departamento de Transporte de EE. UU. (<code>vpic.nhtsa.dot.gov</code>) para verificar especificaciones de fábrica.
                  </p>
                </div>

                <form onSubmit={handleDecodeVin} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Número de Serie (VIN de 17 caracteres)
                    </label>
                    <input
                      type="text"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value)}
                      placeholder="Ej. 1FTFW1E85NFA00001"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Vincular y enriquecer un lote existente (Opcional)
                    </label>
                    <select
                      value={vinLotId}
                      onChange={(e) => setVinLotId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="">Solo decodificar y mostrar en pantalla</option>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {allLots.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          Lote #{l.lotNumber} — {l.vehicle.year} {l.vehicle.make}{" "}
                          {l.vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-sky-400 transition-colors"
                  >
                    Consultar VIN en API Oficial NHTSA
                  </button>
                </form>

                {decodedVinResult && (
                  <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-sky-400 font-bold">RESULTADO NHTSA vPIC</span>
                      <span
                        className={
                          decodedVinResult.isValidVin ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {decodedVinResult.isValidVin ? "VIN VÁLIDO" : "REQUIERE REVISIÓN"}
                      </span>
                    </div>
                    <p>Marca: {decodedVinResult.make || "N/D"}</p>
                    <p>Modelo: {decodedVinResult.model || "N/D"}</p>
                    <p>Año Modelo: {decodedVinResult.year || "N/D"}</p>
                    <p>Carrocería: {decodedVinResult.bodyStyle || "N/D"}</p>
                    <p>Motor: {decodedVinResult.engineSpec || "N/D"}</p>
                    <p>Tracción: {decodedVinResult.drivetrain || "N/D"}</p>
                    <p>Planta: {decodedVinResult.manufacturedIn || "N/D"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: GESTIÓN DE VEHÍCULOS, LOTES Y FOTOGRAFÍAS AUTORIZADAS */}
          {activeTab === "VEHICLES_LOTS" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Editor de Condiciones y Precios con Historial */}
                <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                    Actualizar Precio, Estado o Condición de Lote (Genera Historial)
                  </h2>
                  <form onSubmit={handleUpdateLot} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Seleccionar Lote</label>
                      <select
                        value={selectedLotId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedLotId(id);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const found = allLots.find((x: any) => x.id === id);
                          if (found) {
                            setEditBidUsd(String(found.currentBidUsd));
                            setEditBuyNowUsd(
                              found.buyItNowPriceUsd ? String(found.buyItNowPriceUsd) : ""
                            );
                            setEditOdometer(
                              found.odometerValue ? String(found.odometerValue) : ""
                            );
                            setEditDamage(found.primaryDamage);
                            setEditSaleStatus(found.saleStatus);
                            setEditAvailability(found.availabilityStatus);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {allLots.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            #{l.lotNumber} · {l.vehicle.year} {l.vehicle.make}{" "}
                            {l.vehicle.model} ({l.completenessStatus})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Puja Actual (USD)</label>
                        <input
                          type="number"
                          value={editBidUsd}
                          onChange={(e) => setEditBidUsd(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Buy It Now (USD)</label>
                        <input
                          type="number"
                          value={editBuyNowUsd}
                          onChange={(e) => setEditBuyNowUsd(e.target.value)}
                          placeholder="Vacío si no aplica"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Odómetro (Millas)</label>
                        <input
                          type="number"
                          value={editOdometer}
                          onChange={(e) => setEditOdometer(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Daño Primario</label>
                        <input
                          type="text"
                          value={editDamage}
                          onChange={(e) => setEditDamage(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Estado Subasta</label>
                        <select
                          value={editSaleStatus}
                          onChange={(e) => setEditSaleStatus(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="LIVE_AUCTION">LIVE_AUCTION</option>
                          <option value="BUY_IT_NOW_AVAILABLE">BUY_IT_NOW_AVAILABLE</option>
                          <option value="ON_APPROVAL">ON_APPROVAL</option>
                          <option value="SOLD">SOLD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Disponibilidad</label>
                        <select
                          value={editAvailability}
                          onChange={(e) => setEditAvailability(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="RESERVED_IN_ADVISORY">RESERVED_IN_ADVISORY</option>
                          <option value="SOLD_EXTERNAL">SOLD_EXTERNAL</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Guardar Cambios y Auditar en Historial del Vehículo
                    </button>
                  </form>
                </div>

                {/* Gestor de Fotografías Autorizadas */}
                <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-emerald-400" />
                    Vincular Fotografía Autorizada al Lote
                  </h2>
                  <p className="text-xs text-slate-400">
                    Por política estricta del proyecto, no se copian imágenes sin permiso. Cada imagen requiere referencia documental de origen autorizado.
                  </p>
                  <form onSubmit={handleAttachMedia} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Lote Destino</label>
                      <select
                        value={mediaLotId}
                        onChange={(e) => setMediaLotId(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {allLots.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            #{l.lotNumber} — {l.vehicle.year} {l.vehicle.make}{" "}
                            {l.vehicle.model} (Fotos actuales: {l.media?.length ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Título de la Fotografía
                      </label>
                      <input
                        type="text"
                        required
                        value={mediaTitle}
                        onChange={(e) => setMediaTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Ruta de Almacenamiento / URL de Fotografía Autorizada
                      </label>
                      <input
                        type="text"
                        required
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="ej. /images/pujamotor-hero.jpg o URL de CDN autorizada"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400">Plantillas rápidas:</span>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/images/pujamotor-hero.jpg")}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Hero Portada
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/media/authorized/suv-inspection.svg")}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          SVG SUV
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/media/authorized/pickup-inspection.svg")}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          SVG Pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/media/authorized/sedan-inspection.svg")}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          SVG Sedán
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/media/authorized/van-commercial-inspection.svg")}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          SVG Van
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Referencia de Autorización / Licencia de Origen *
                      </label>
                      <input
                        type="text"
                        required
                        value={mediaOriginRef}
                        onChange={(e) => setMediaOriginRef(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      + Agregar Fotografía Autorizada al Lote
                    </button>
                  </form>

                  {/* Galería y Orden de Fotografías del Lote Seleccionado */}
                  {(() => {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    const selectedMediaLot = allLots.find((l: any) => l.id === mediaLotId);
                    if (!selectedMediaLot) return null;
                    return (
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">
                            Fotografías en Lote #{selectedMediaLot.lotNumber} ({selectedMediaLot.media?.length ?? 0})
                          </span>
                          <a
                            href={`/lotes/${selectedMediaLot.lotNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> Ver Ficha Pública
                          </a>
                        </div>

                        {!selectedMediaLot.media || selectedMediaLot.media.length === 0 ? (
                          <p className="text-slate-500 italic text-[11px]">Este lote no tiene fotografías vinculadas aún.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedMediaLot.media
                              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                              .slice()
                              .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                              .map((img: any, idx: number) => (
                                <div
                                  key={img.id}
                                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${
                                    img.isPrimary
                                      ? "border-cyan-500/50 bg-cyan-950/20"
                                      : "border-slate-800 bg-slate-950"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-12 w-16 rounded overflow-hidden bg-black border border-slate-800 shrink-0">
                                      <img
                                        src={img.url}
                                        alt={img.title}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-xs truncate">{img.title}</span>
                                        {img.isPrimary ? (
                                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0">
                                            ★ PRINCIPAL
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleSetPrimaryMedia(img.id)}
                                            className="text-[10px] text-slate-400 hover:text-cyan-400 underline shrink-0"
                                          >
                                            Hacer Principal
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                                        {img.originReference}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveMedia(img.id, "UP")}
                                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                                      title="Subir posición"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === selectedMediaLot.media.length - 1}
                                      onClick={() => handleMoveMedia(img.id, "DOWN")}
                                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                                      title="Bajar posición"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMedia(img.id)}
                                      className="p-1 rounded bg-red-950/60 hover:bg-red-800 text-red-300 border border-red-800/40 ml-1"
                                      title="Eliminar fotografía"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Tabla Completa del Motor Central de Vehículos */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h2 className="text-base font-bold text-white">
                  Inventario Completo del Motor Central (Incluye Lotes Retenidos por Datos Incompletos)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 font-mono text-slate-400">
                        <th className="p-3">Lote / ID Interno</th>
                        <th className="p-3">Vehículo / VIN</th>
                        <th className="p-3">Entorno</th>
                        <th className="p-3">Estado de Completitud</th>
                        <th className="p-3">Puja / Buy Now</th>
                        <th className="p-3">Catálogo Público</th>
                        <th className="p-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {allLots.map((lot: any) => (
                        <tr key={lot.id} className="hover:bg-slate-950/60">
                          <td className="p-3 font-mono">
                            <div className="font-bold text-amber-400">#{lot.lotNumber}</div>
                            <div className="text-[10px] text-slate-500">
                              {lot.vehicle.internalCode}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">
                              {lot.vehicle.year} {lot.vehicle.make} {lot.vehicle.model}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              VIN: {lot.vehicle.vin || "FALTANTE"} · {lot.yardName}
                            </div>
                          </td>
                          <td className="p-3">
                            <EnvironmentBadge environment={lot.dataEnvironment} compact />
                          </td>
                          <td className="p-3">
                            <CompletenessBadge
                              status={lot.completenessStatus}
                              missingCount={lot.missingFields?.length ?? 0}
                            />
                            {lot.missingFields?.length > 0 && (
                              <div className="mt-1 text-[10px] text-amber-300/90">
                                Faltan: {lot.missingFields.join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-white">
                              ${lot.currentBidUsd.toLocaleString()} USD
                            </div>
                            {lot.buyItNowPriceUsd && (
                              <div className="text-[11px] text-emerald-400">
                                BIN: ${lot.buyItNowPriceUsd.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            {lot.isPublished ? (
                              <span className="text-emerald-400 font-semibold">PUBLICADO</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">
                                BLOQUEADO (INCOMPLETO)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {lot.isPublished ? (
                              <Link
                                href={`/lotes/${encodeURIComponent(lot.lotNumber)}`}
                                className="inline-flex items-center gap-1 text-sky-400 hover:underline font-mono"
                              >
                                Ver Ficha
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="font-mono text-[11px] text-slate-500">
                                Retenido en Admin
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: COPILOTO ASESOR Y BASE DE CONOCIMIENTO OPERATIVO */}
          {activeTab === "COPILOT_METHODOLOGIES" && (
            <div className="space-y-6">
              {/* Encabezado y sub-pestañas de navegación */}
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-amber-300">
                      <Lock className="h-3.5 w-3.5" />
                      CONFIDENCIAL · HERRAMIENTA INTERNA EXCLUSIVA PARA ASESORES AUTORIZADOS
                    </div>
                    <h1 className="mt-2 text-xl font-black text-white flex items-center gap-2.5">
                      <Compass className="h-6 w-6 text-amber-400" />
                      Copiloto Operativo y Metodologías de Venta en Vivo
                    </h1>
                    <p className="mt-1 text-xs text-slate-300">
                      Guía en tiempo real para asesores según el manual oficial de <strong>PUJAMOTOR USA</strong> (PDF 1).
                    </p>
                  </div>

                  {/* Sub-pestañas */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCopilotActiveSubTab("COPILOT")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        copilotActiveSubTab === "COPILOT"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                      }`}
                    >
                      <Compass className="h-4 w-4" />
                      Copiloto en Vivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopilotActiveSubTab("FULL_MANUAL")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        copilotActiveSubTab === "FULL_MANUAL"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Manuales y No Negociables
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopilotActiveSubTab("RUBRIC")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        copilotActiveSubTab === "RUBRIC"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
                      }`}
                    >
                      <CheckSquare className="h-4 w-4" />
                      Rúbrica de Chats (10 Pts) y Rutina
                    </button>
                  </div>
                </div>

                {/* SUB-PESTAÑA 1: COPILOTO INTERACTIVO EN VIVO */}
                {copilotActiveSubTab === "COPILOT" && (
                  <div className="mt-5 space-y-6">
                    {/* Barra de Selección de Expediente y Metodología */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                      <div className="lg:col-span-6 space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                          1. Seleccionar Expediente de Asesoría Activo
                        </label>
                        <select
                          value={copilotCaseId}
                          onChange={(e) => handleSelectCopilotCase(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                        >
                          <option value="">-- Seleccionar cliente / expediente --</option>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {overviewData?.crm?.advisoryCases?.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.customerLead?.fullName} ({c.destinationCountry}) · Etapa: {c.stage} · {c.methodology || "SUBASTA_PRO_USA"} (Paso {c.currentStepNumber || 1})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400">
                          {copilotCaseId
                            ? "Expediente vinculado. El copiloto sincronizará automáticamente el paso y la etapa comercial."
                            : "Seleccione un expediente para registrar avances y checklist del cliente."}
                        </p>
                      </div>

                      <div className="lg:col-span-6 space-y-1">
                        <label className="block text-xs font-mono uppercase text-slate-300 font-bold">
                          2. Proceso Comercial Vigente
                        </label>
                        <div className="pt-0.5">
                          <div className="rounded-lg p-2.5 border border-amber-500/50 bg-amber-500/10 text-amber-200">
                            <div className="font-bold text-xs flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-amber-400" />
                                PUJAMOTOR USA — Proceso Oficial (PDF 1)
                              </span>
                              <span className="rounded bg-amber-500/30 px-2 py-0.5 font-mono text-[10px] text-amber-100">
                                10 PASOS · FUENTE ÚNICA
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                              Fee: $300-$500 USD contra entrega del vehículo · Sub-usuario Copart creado por asesor · 3 Formas oficiales de pago · Copart Delivery ($400-$850).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline / Stepper horizontal */}
                    {(() => {
                      const methData: MethodologyDefinition = METHODOLOGY_SUBASTA_PRO_USA;
                      const activeStepData: MethodologyStep =
                        methData.steps.find((s) => s.stepNumber === copilotActiveStep) ||
                        methData.steps[0];
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const activeCaseObj = overviewData?.crm?.advisoryCases?.find(
                        (c: any) => c.id === copilotCaseId
                      );

                      const advisorName = sessionUser?.fullName || "Asesor PUJAMOTOR USA";
                      const customerName = activeCaseObj?.customerLead?.fullName || "Estimado cliente";
                      const lotNumber = activeCaseObj?.lotNumber || "78410201";
                      const lotUrl = `https://www.copart.com/lot/${lotNumber}`;
                      const subUser = `sub_${customerName.toLowerCase().replace(/[^a-z0-9]/g, "") || "cliente"}_pujamotor`;
                      const subPassword = `Pujamotor${new Date().getFullYear()}!`;
                      const copartLiveUrl = "https://www.copart.com/auctionDashboard";

                      const preparedMessage = (activeStepData.readyMessageTemplate || "")
                        .replace(/\{\{advisorName\}\}/g, advisorName)
                        .replace(/\{\{customerName\}\}/g, customerName)
                        .replace(/\{\{lotNumber\}\}/g, lotNumber)
                        .replace(/\{\{lotUrl\}\}/g, lotUrl)
                        .replace(/\{\{subUser\}\}/g, subUser)
                        .replace(/\{\{subPassword\}\}/g, subPassword)
                        .replace(/\{\{copartLiveUrl\}\}/g, copartLiveUrl)
                        .replace(/\{\{vehiclesListWithBidGuideline\}\}/g, "(Aquí inserte los 4 a 7 enlaces de Copart con el rango de oferta debajo)")
                        .replace(/\{\{linkContrato\}\}/g, "https://pujamotorusa.com/contrato-broker")
                        .replace(/\{\{nombreCliente\}\}/g, customerName)
                        .replace(/\{\{presupuesto\}\}/g, activeCaseObj?.maxAuthorizedBidUsd ? `$${activeCaseObj.maxAuthorizedBidUsd.toLocaleString()} USD` : "$15,000 USD");

                      return (
                        <div className="space-y-6">
                          {/* Barra de progreso de pasos */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="font-mono text-slate-400">
                                PROGRESO DE LA METODOLOGÍA: <strong>{methData.title}</strong>
                              </span>
                              <span className="font-mono font-bold text-amber-400">
                                Paso {copilotActiveStep} de {methData.totalSteps}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
                              {methData.steps.map((st) => {
                                const isCurrent = st.stepNumber === copilotActiveStep;
                                const isPast = st.stepNumber < copilotActiveStep;
                                return (
                                  <button
                                    key={st.stepNumber}
                                    type="button"
                                    onClick={() => setCopilotActiveStep(st.stepNumber)}
                                    className={`rounded-lg p-2 text-center text-xs font-mono transition-all border ${
                                      isCurrent
                                        ? "border-amber-400 bg-amber-500 text-slate-950 font-bold shadow-md scale-105"
                                        : isPast
                                        ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    <div className="text-[10px] opacity-80">
                                      {isPast ? "✓ PASO" : "PASO"} {st.stepNumber}
                                    </div>
                                    <div className="truncate text-[11px] font-semibold mt-0.5">
                                      {st.name}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Ficha Principal del Paso Activo (Estructura de 12 Puntos) */}
                          <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-6 space-y-6">
                            {/* 1. Encabezado del Paso y 2. Objetivo */}
                            <div className="border-b border-slate-800 pb-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-mono font-bold text-amber-300">
                                  PASO {activeStepData.stepNumber} DE {methData.totalSteps}
                                </div>
                                <div className="text-xs font-mono text-slate-400">
                                  Entrada: <span className="text-slate-200">{activeStepData.triggerIn}</span> · Salida: <span className="text-emerald-300 font-semibold">{activeStepData.triggerOut}</span>
                                </div>
                              </div>
                              <h2 className="mt-2 text-2xl font-black text-white">
                                {activeStepData.name}
                              </h2>
                              <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-amber-200/90 font-medium">
                                🎯 <strong>Objetivo del Asesor:</strong> {activeStepData.objective}
                              </div>
                            </div>

                            {/* 3 & 4. Qué hace el asesor / Cómo lo hace VS 5 & 6. Qué le dice / Preguntas */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              {/* Columna Izquierda: Acciones Operativas */}
                              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                                  <FileText className="h-4 w-4" />
                                  3 y 4. ¿Qué hace el asesor y cómo lo ejecuta?
                                </h3>

                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-slate-200">Acciones del Asesor:</div>
                                  <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                                    {activeStepData.whatAdvisorDoes.map((item, idx) => (
                                      <li key={idx} className="leading-relaxed">{item}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                  <div className="text-xs font-semibold text-slate-200">¿Cómo lo hace paso a paso?</div>
                                  <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                                    {activeStepData.howAdvisorDoesIt.map((item, idx) => (
                                      <li key={idx} className="leading-relaxed font-mono text-[11px] text-slate-300">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Columna Derecha: Comunicación y Guiones */}
                              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                                  <Users className="h-4 w-4" />
                                  5 y 6. ¿Qué le dice al cliente y qué preguntas realiza?
                                </h3>

                                <div className="space-y-2">
                                  <div className="text-xs font-semibold text-slate-200">Guion Sugerido para la Conversación:</div>
                                  <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 italic leading-relaxed">
                                    {activeStepData.whatToSayToClient}
                                  </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                  <div className="text-xs font-semibold text-slate-200">Preguntas Obligatorias a Realizar:</div>
                                  <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                                    {activeStepData.questionsToAsk.map((q, idx) => (
                                      <li key={idx} className="leading-relaxed text-amber-200 font-medium">
                                        &ldquo;{q}&rdquo;
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* 9. Mensaje Listo para Enviar (Copiar con 1 clic con variables) */}
                            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5">
                                    MENSAJE LISTO
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    9. Mensaje Estructurado para Copiar y Enviar al Cliente
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(preparedMessage);
                                    setCopiedNotification(`step-${activeStepData.stepNumber}`);
                                    setTimeout(() => setCopiedNotification(null), 2500);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  {copiedNotification === `step-${activeStepData.stepNumber}`
                                    ? "¡Copiado al Portapapeles!"
                                    : "Copiar Mensaje"}
                                </button>
                              </div>

                              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 whitespace-pre-wrap select-all">
                                {preparedMessage}
                              </div>
                            </div>

                            {/* Galería de Capturas Oficiales de Referencia (si aplica a este paso) */}
                            {activeStepData.referenceImages && activeStepData.referenceImages.length > 0 && (
                              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <ImagePlus className="h-4 w-4 text-sky-400" />
                                  <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
                                    Capturas de Pantalla Oficiales de Referencia para este Paso
                                  </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {activeStepData.referenceImages.map((img, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-white">{img.title}</span>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                          img.isAdvisorOnlyGuide
                                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                        }`}>
                                          {img.isAdvisorOnlyGuide ? "GUÍA INTERNA ASESOR" : "ENVIAR AL CLIENTE"}
                                        </span>
                                      </div>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url}
                                        alt={img.title}
                                        className="w-full h-auto rounded border border-slate-800 object-contain max-h-72 bg-slate-950"
                                      />
                                      <p className="text-[11px] text-slate-400 leading-snug">{img.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 8. Preflight Checklist (Qué revisar antes de continuar) */}
                            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                                <CheckSquare className="h-4 w-4" />
                                8. Preflight Checklist — Qué revisar obligatoriamente antes de avanzar
                              </h3>
                              <div className="space-y-2">
                                {activeStepData.preflightChecks.map((chk, idx) => {
                                  const chkKey = `step_${activeStepData.stepNumber}_check_${idx}`;
                                  const isChecked = !!copilotChecklist[chkKey];
                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                        isChecked
                                          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleCopilotCheckItem(chkKey)}
                                        className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                                      />
                                      <span className="text-xs leading-relaxed">{chk}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 7. Qué información registra & 11. Errores a evitar */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              {/* 7. Información a registrar */}
                              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                                  7. Información a Registrar en el Expediente:
                                </h3>
                                <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                                  {activeStepData.infoToRegister.map((info, idx) => (
                                    <li key={idx} className="leading-relaxed">{info}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* 11. Errores a evitar */}
                              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-2">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4" />
                                  11. Errores Críticos a Evitar (Prohibiciones):
                                </h3>
                                <ul className="space-y-1 text-xs text-rose-200/90 pl-4 list-disc">
                                  {activeStepData.errorsToAvoid.map((err, idx) => (
                                    <li key={idx} className="leading-relaxed">{err}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* 12. Manejo de Objeciones del Paso */}
                            {activeStepData.objectionHandling && activeStepData.objectionHandling.length > 0 && (
                              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                                  <HelpCircle className="h-4 w-4" />
                                  12. Manejo de Objeciones y Dudas Comunes de este Paso
                                </h3>
                                <div className="space-y-2.5">
                                  {activeStepData.objectionHandling.map((obj, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1.5">
                                      <div className="text-xs font-bold text-amber-300">
                                        ❓ {obj.objection}
                                      </div>
                                      <div className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 italic">
                                        💬 {obj.script}
                                      </div>
                                      <p className="text-[11px] text-slate-400">💡 <strong>Explicación:</strong> {obj.explanation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 10. Resultado Esperado */}
                            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1.5">
                              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4" />
                                10. Resultado Esperado para Dar por Concluido este Paso
                              </h3>
                              <p className="text-xs text-emerald-200 leading-relaxed">
                                {activeStepData.expectedResult}
                              </p>
                            </div>

                            {/* Notas operativas y Controles de Avance */}
                            <div className="border-t border-slate-800 pt-5 space-y-4">
                              <div>
                                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                                  Notas Operativas del Expediente para este Paso
                                </label>
                                <textarea
                                  rows={2}
                                  value={copilotNotes}
                                  onChange={(e) => setCopilotNotes(e.target.value)}
                                  placeholder="Detalle de la conversación, links seleccionados o acuerdos alcanzados con el cliente..."
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                  type="button"
                                  disabled={copilotSubmitting || !copilotCaseId}
                                  onClick={() => {
                                    const nextStep = Math.min(copilotActiveStep + 1, methData.totalSteps);
                                    handleAdvanceCopilotStep(nextStep);
                                  }}
                                  className="flex-1 rounded-lg bg-amber-500 px-4 py-3 font-bold text-xs text-slate-950 hover:bg-amber-400 transition-colors shadow disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  {copilotSubmitting
                                    ? "Guardando..."
                                    : copilotActiveStep === methData.totalSteps
                                    ? "Completar Último Paso y Finalizar Expediente"
                                    : `Guardar y Avanzar al Paso ${copilotActiveStep + 1} (${methData.steps[copilotActiveStep]?.name || "Siguiente"})`}
                                </button>

                                <button
                                  type="button"
                                  disabled={copilotSubmitting || !copilotCaseId}
                                  onClick={handleCopilotThinkingDeviation}
                                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-semibold text-xs text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                  Desvío: Cliente dice &ldquo;Déjeme pensarlo&rdquo; (Alerta 2-4 días)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SUB-PESTAÑA 2: MANUALES COMPLETOS Y REGLAS NO NEGOCIABLES */}
                {copilotActiveSubTab === "FULL_MANUAL" && (
                  <div className="mt-5 space-y-6">
                    {/* Banner de Confidencialidad y Propiedad Intelectual */}
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 space-y-1">
                      <div className="text-xs font-mono font-bold text-rose-300 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-rose-400" />
                        ADVERTENCIA DE PROPIEDAD INTELECTUAL Y CONFIDENCIALIDAD
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Este compendio metodológico es propiedad exclusiva de <strong>PUJAMOTOR USA</strong>. Está terminantemente prohibida su descarga, copia, exportación o transmisión a terceros no autorizados. Cualquier distribución constituye causal de rescisión contractual inmediata y acciones legales pertinentes.
                      </p>
                    </div>

                    {/* Las 5 Reglas Inviolables No Negociables */}
                    <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-5 space-y-4">
                      <h2 className="text-base font-black text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        Políticas No Negociables del Broker (Comunes a Ambos Métodos)
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {NON_NEGOTIABLE_RULES.map((rule, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-3.5 space-y-1.5">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="text-rose-400 font-mono font-black">NO NEGOCIABLE #{idx + 1}:</span>
                            </div>
                            <div className="text-xs font-semibold text-amber-300">{rule.rule}</div>
                            <p className="text-[11px] text-slate-400 leading-snug">{rule.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Manual Comercial Oficial PUJAMOTOR USA */}
                    <div className="rounded-xl border border-amber-500/30 bg-slate-950 p-5 space-y-4">
                      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                        <div>
                          <span className="rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5">
                            PROCESO OFICIAL · 10 PASOS
                          </span>
                          <h3 className="mt-1 text-lg font-bold text-white">PUJAMOTOR USA — Generar dinero haciendo caso</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Fee $300-$500 USD al recibir el auto · Sub-usuario Copart creado por asesor · 3 Formas oficiales de pago · Copart Delivery ($400-$850).
                          </p>
                        </div>
                        <span className="text-xs font-mono text-amber-400 border border-amber-500/30 rounded px-2.5 py-1 bg-amber-500/10">
                          Fuente de Verdad: PDF 1
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                        {METHODOLOGY_SUBASTA_PRO_USA.steps.map((st) => (
                          <div key={st.stepNumber} className="rounded-lg border border-slate-800 bg-slate-900 p-3.5 space-y-2 text-xs">
                            <div className="font-bold text-amber-300 flex items-center justify-between">
                              <span>Paso {st.stepNumber}: {st.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">Entra: {st.triggerIn}</span>
                            </div>
                            <p className="text-slate-300 text-[11px]">{st.objective}</p>
                            <div className="rounded bg-slate-950 p-2 text-[11px] font-mono text-slate-200 border border-slate-800/80 whitespace-pre-line">
                              💬 {st.whatToSayToClient}
                            </div>
                            {st.nonNegotiables?.length > 0 && (
                              <div className="text-[10px] text-amber-300/80 space-y-0.5">
                                <strong>No negociable:</strong> {st.nonNegotiables[0]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compendio de Objeciones Generales */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-amber-400" />
                        Compendio Oficial de Objeciones Generales y Respuestas Validadas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {OBJECTIONS_HANDBOOK.map((obj, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-3.5 space-y-2 text-xs">
                            <div className="font-bold text-amber-300">❓ {obj.objection}</div>
                            <div className="rounded bg-slate-950 p-2 text-slate-200 italic border border-slate-800">
                              💬 &ldquo;{obj.script}&rdquo;
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">💡 {obj.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-PESTAÑA 3: RÚBRICA DE CHATS (10 PUNTOS) Y RUTINA */}
                {copilotActiveSubTab === "RUBRIC" && (
                  <div className="mt-5 space-y-6">
                    {/* Rúbrica de 10 Puntos de Subasta Pro USA */}
                    <div className="rounded-xl border border-amber-500/30 bg-slate-950 p-5 space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <span className="rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5">
                          EVALUACIÓN DE CALIDAD · PUJAMOTOR USA
                        </span>
                        <h2 className="mt-1 text-lg font-black text-white flex items-center gap-2">
                          <CheckSquare className="h-5 w-5 text-amber-400" />
                          Rúbrica de Auditoría de Chats — 10 Preguntas Clave
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                          Cada conversación con prospecto se audita contra estas 10 preguntas. Cada &ldquo;SÍ&rdquo; suma 1 punto. Meta requerida: <strong>9 o 10 puntos</strong>.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {TEN_QUESTIONS_RUBRIC.map((item) => (
                          <div key={item.number} className="rounded-lg border border-slate-800 bg-slate-900 p-3 flex items-start gap-3 text-xs">
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold h-6 w-6 flex items-center justify-center shrink-0">
                              {item.number}
                            </span>
                            <div className="space-y-0.5">
                              <div className="font-bold text-white">{item.question}</div>
                              <p className="text-slate-400 text-[11px] font-mono">{item.step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rutina Diaria del Equipo Comercial */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                      <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                        Rutina Diaria Recomendada para el Equipo Comercial de Asesores
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1">
                          <div className="font-mono font-bold text-amber-400">🌅 MAÑANA</div>
                          <p className="text-slate-300 leading-snug">{TEAM_ROUTINE.morning}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1">
                          <div className="font-mono font-bold text-sky-400">☀️ MEDIODÍA</div>
                          <p className="text-slate-300 leading-snug">{TEAM_ROUTINE.midday}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1">
                          <div className="font-mono font-bold text-indigo-400">🌆 TARDE</div>
                          <p className="text-slate-300 leading-snug">{TEAM_ROUTINE.afternoon}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-1">
                          <div className="font-mono font-bold text-purple-400">🌙 NOCHE</div>
                          <p className="text-slate-300 leading-snug">{TEAM_ROUTINE.evening}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: CONFIGURACIÓN DE TARIFAS Y COSTOS DE LA CALCULADORA */}
          {activeTab === "TARIFFS_COSTS" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                  Actualizar Parámetros Tarifarios de Subasta e Intermediación
                </h2>
                <form onSubmit={handleSaveTariffs} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Gate Fee Copart (USD)
                      </label>
                      <input
                        type="number"
                        value={gateFeeUsd}
                        onChange={(e) => setGateFeeUsd(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Environmental Fee (USD)
                      </label>
                      <input
                        type="number"
                        value={envFeeUsd}
                        onChange={(e) => setEnvFeeUsd(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Comisión Intermediario / Broker (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={brokerPercent}
                        onChange={(e) => setBrokerPercent(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Tarifa Mínima Broker (USD)
                      </label>
                      <input
                        type="number"
                        value={brokerMinFee}
                        onChange={(e) => setBrokerMinFee(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-300 mb-1">
                        Gasto Fijo Documentación Exportación EE. UU. — SED/AES y BL (USD)
                      </label>
                      <input
                        type="number"
                        value={docFeeUsd}
                        onChange={(e) => setDocFeeUsd(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Guardar y Publicar Nueva Vigencia Tarifaria
                  </button>
                </form>
              </div>

              <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                  Reglas Aduanales e Impuestos por País de Destino Activas
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {overviewData?.tariffs?.rules?.destinationCustomsRules?.map((rule: any) => (
                    <div
                      key={rule.countryCode}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">
                          {rule.countryName} ({rule.countryCode}) — {rule.defaultPort}
                        </span>
                        <span className="text-amber-400">
                          Arancel: {rule.importDutyPercent}% · IVA: {rule.vatPercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{rule.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 5: CRM COMERCIAL, CONSULTAS Y EXPEDIENTES DE ASESORÍA */}
          {activeTab === "CRM_COMMERCIAL" && (
            <div className="space-y-6">
              {/* KPIs de Control Comercial */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="text-slate-400 block mb-1">Clientes Registrados:</span>
                  <div className="text-2xl font-black text-white font-mono">
                    {overviewData?.crm?.leads?.length ?? 0}
                  </div>
                  <span className="text-[11px] text-amber-400">
                    {overviewData?.crm?.kpis?.newLeadsCount ?? 0} nuevos por atender
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="text-slate-400 block mb-1">Expedientes en Asesoría:</span>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {overviewData?.crm?.advisoryCases?.length ?? 0}
                  </div>
                  <span className="text-[11px] text-slate-400">11 etapas del flujo</span>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <span className="text-amber-300 block mb-1">Clientes en Seguimiento (Pensando):</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {overviewData?.crm?.kpis?.thinkingCasesCount ?? 0}
                  </div>
                  <span className="text-[11px] text-amber-300 font-semibold">
                    {overviewData?.crm?.kpis?.followUpDueCount ?? 0} requieren recontacto hoy (2-4 días)
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="text-slate-400 block mb-1">Propuestas Personalizadas:</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {overviewData?.crm?.presentations?.length ?? 0}
                  </div>
                  <span className="text-[11px] text-slate-400">4 a 7 alternativas por cliente</span>
                </div>
              </div>

              {/* Mensaje de notificación temporal de copiado */}
              {copiedNotification && (
                <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/70 p-3 text-xs text-emerald-200 text-center font-mono">
                  {copiedNotification}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Columna Izquierda: Herramientas Operativas */}
                <div className="lg:col-span-6 space-y-6">
                  {/* 1. Creador de Presentación Personalizada (4 a 7 Vehículos) */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                    <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5 flex items-center justify-between">
                      <span>Crear Presentación Personalizada (4 a 7 Vehículos)</span>
                      <span className="text-xs font-mono font-normal text-amber-400">
                        Seleccionados: {selectedLotsForPres.length} / 7 (mín. 4)
                      </span>
                    </h2>

                    <form onSubmit={handleCreatePresentation} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Cliente Prospecto *
                        </label>
                        <select
                          required
                          value={selectedLeadIdForPres}
                          onChange={(e) => setSelectedLeadIdForPres(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                        >
                          <option value="">Seleccione el cliente...</option>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {overviewData?.crm?.leads?.map((lead: any) => (
                            <option key={lead.id} value={lead.id}>
                              {lead.fullName} ({lead.country}) — {lead.phoneWhatsapp}
                              {lead.targetVehicle ? ` [Busca: ${lead.targetVehicle}]` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">
                          Título de la Presentación
                        </label>
                        <input
                          type="text"
                          value={presTitle}
                          onChange={(e) => setPresTitle(e.target.value)}
                          placeholder="Ej. Selección de SUVs Recomendadas — Juan Pérez"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">
                          Notas y Recomendaciones Personalizadas
                        </label>
                        <textarea
                          rows={2}
                          value={presNotes}
                          onChange={(e) => setPresNotes(e.target.value)}
                          placeholder="Explicación breve del porqué se seleccionaron estas opciones según su presupuesto..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                        />
                      </div>

                      {/* Selector de Lotes con Checkboxes */}
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Seleccione entre 4 y 7 vehículos del catálogo:
                        </label>
                        <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                          {allLots.map((lot: any) => {
                            const isSelected = selectedLotsForPres.includes(lot.lotNumber);
                            return (
                              <label
                                key={lot.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer border text-xs transition ${
                                  isSelected
                                    ? "border-amber-500 bg-amber-500/10 text-white"
                                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleLotSelectionForPres(lot.lotNumber)}
                                    className="rounded border-slate-700 text-amber-500"
                                  />
                                  <div>
                                    <span className="font-mono font-bold text-amber-400">
                                      #{lot.lotNumber}
                                    </span>{" "}
                                    — {lot.vehicle.year} {lot.vehicle.make} {lot.vehicle.model}
                                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                      ({lot.titleCategory} · {lot.yardState})
                                    </span>
                                  </div>
                                </div>
                                <div className="font-mono text-right text-[11px]">
                                  ${lot.currentBidUsd.toLocaleString()} USD
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={presSubmitting || selectedLotsForPres.length < 4 || selectedLotsForPres.length > 7}
                        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                      >
                        {presSubmitting
                          ? "Generando Propuesta..."
                          : `Generar Presentación y Enlace (${selectedLotsForPres.length} de 4-7)`}
                      </button>

                      {/* Resultado de Presentación Generada */}
                      {createdPresResult && (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 space-y-2 mt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-300">
                              ✓ Enlace de Presentación Activo
                            </span>
                            <a
                              href={createdPresResult.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              Ver en navegador
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <input
                            type="text"
                            readOnly
                            value={createdPresResult.publicUrl}
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(createdPresResult.whatsappMessage);
                              setCopiedNotification("¡Mensaje formateado para WhatsApp copiado al portapapeles!");
                              setTimeout(() => setCopiedNotification(null), 4000);
                            }}
                            className="w-full rounded bg-emerald-500 px-3 py-1.5 font-bold text-slate-950 hover:bg-emerald-400 text-xs"
                          >
                            Copiar Mensaje Formateado para WhatsApp
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* 2. Control de Flujo Comercial (11 Etapas + CLIENTE_PENSANDO) */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                    <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                      Avanzar Etapa Comercial del Expediente
                    </h2>
                    <form onSubmit={handleUpdateCommercialStage} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Seleccionar Expediente Activo *
                        </label>
                        <select
                          required
                          value={selectedCaseId}
                          onChange={(e) => {
                            setSelectedCaseId(e.target.value);
                            const found = overviewData?.crm?.advisoryCases?.find(
                              (c: any) => c.id === e.target.value
                            );
                            if (found) {
                              setCaseStage(found.stage);
                              setIsThinkingCase(found.isThinking);
                              setCaseNotes(found.operationalNotes || "");
                              setCaseMaxBid(found.maxAuthorizedBidUsd ? String(found.maxAuthorizedBidUsd) : "");
                              setCaseSelectedLot(found.selectedLotNumber || (found.auctionLot?.lotNumber ?? ""));
                            }
                          }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                        >
                          <option value="">Seleccione un expediente...</option>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {overviewData?.crm?.advisoryCases?.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.caseNumber} — {c.customerLead?.fullName} [{c.stage}]
                              {c.isFollowUpDue ? " ⚠️ ALERTA SEGUIMIENTO" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 mb-1">
                            Etapa del Proceso Comercial *
                          </label>
                          <select
                            value={caseStage}
                            onChange={(e) => {
                              setCaseStage(e.target.value);
                              if (e.target.value === "CLIENTE_PENSANDO") {
                                setIsThinkingCase(true);
                              }
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                          >
                            <option value="CONTACTO_INICIAL">1. CONTACTO_INICIAL</option>
                            <option value="CRITERIOS_DEFINIDOS">2. CRITERIOS_DEFINIDOS</option>
                            <option value="BUSQUEDA_DE_VEHICULOS">3. BUSQUEDA_DE_VEHICULOS</option>
                            <option value="ALTERNATIVAS_ENVIADAS">4. ALTERNATIVAS_ENVIADAS (4-7)</option>
                            <option value="VEHICULO_SELECCIONADO">5. VEHICULO_SELECCIONADO</option>
                            <option value="ASESORIA_Y_CONTRATO">6. ASESORIA_Y_CONTRATO</option>
                            <option value="OFERTA_AUTORIZADA">7. OFERTA_AUTORIZADA</option>
                            <option value="SUBASTA_EN_SEGUIMIENTO">8. SUBASTA_EN_SEGUIMIENTO</option>
                            <option value="RESULTADO_DE_SUBASTA">9. RESULTADO_DE_SUBASTA</option>
                            <option value="TRANSPORTE_Y_ENTREGA">10. TRANSPORTE_Y_ENTREGA</option>
                            <option value="OPERACION_CERRADA">11. OPERACION_CERRADA</option>
                            <option value="CLIENTE_PENSANDO">★ CLIENTE_PENSANDO (Seguimiento)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1">
                            Lote Elegido / En Seguimiento
                          </label>
                          <input
                            type="text"
                            value={caseSelectedLot}
                            onChange={(e) => setCaseSelectedLot(e.target.value)}
                            placeholder="Ej. 89011201"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white text-amber-300"
                          />
                        </div>
                      </div>

                      {/* Configuración de Alerta para Cliente Pensando */}
                      {(isThinkingCase || caseStage === "CLIENTE_PENSANDO") && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-300">
                            <input
                              type="checkbox"
                              checked={isThinkingCase}
                              onChange={(e) => setIsThinkingCase(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500"
                            />
                            Activar alerta de recontacto programado
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-300">Días para recontactar:</span>
                            <select
                              value={followUpDays}
                              onChange={(e) => setFollowUpDays(Number(e.target.value))}
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white font-mono"
                            >
                              <option value="2">2 días (Prioritario)</option>
                              <option value="3">3 días (Estándar recomendado)</option>
                              <option value="4">4 días (Límite prudencial)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 mb-1">
                          Puja Máxima Autorizada por el Cliente (USD)
                        </label>
                        <input
                          type="number"
                          value={caseMaxBid}
                          onChange={(e) => setCaseMaxBid(e.target.value)}
                          placeholder="Ej. 14500"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">
                          Notas Operativas y Acuerdos de la Conversación
                        </label>
                        <textarea
                          rows={2}
                          value={caseNotes}
                          onChange={(e) => setCaseNotes(e.target.value)}
                          placeholder="Detalle de acuerdos, dudas sobre título o instrucciones del comprador..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={caseSubmitting || !selectedCaseId}
                        className="w-full rounded-lg bg-sky-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
                      >
                        {caseSubmitting ? "Guardando..." : "Actualizar Etapa del Expediente"}
                      </button>
                    </form>
                  </div>

                  {/* 3. Registro de Hitos Formales con Evidencia Verificable */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                    <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5">
                      Registrar Hitos Formales y Evidencia Verificable
                    </h2>
                    <form onSubmit={handleRecordMilestone} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">Tipo de Hito a Registrar</label>
                        <select
                          value={milestoneType}
                          onChange={(e) => setMilestoneType(e.target.value as any)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                        >
                          <option value="AUCTION_RESULT">
                            9. RESULTADO_DE_SUBASTA (Requiere comprobante verificable)
                          </option>
                          <option value="DOCUMENTS_RECEIVED">
                            6A. DOCUMENTOS_RECIBIDOS (Identificación / Pasaporte)
                          </option>
                          <option value="CARFAX_VERIFIED">
                            6B. CARFAX_VERIFICADO (Historial vía legítima)
                          </option>
                          <option value="BROKER_FEE_SET">
                            6C. COMISION_BROKER (Tarifa pactada configurable)
                          </option>
                        </select>
                      </div>

                      {milestoneType === "AUCTION_RESULT" && (
                        <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                          <div>
                            <label className="block text-slate-300 mb-1">
                              Número de Comprobante / Factura Oficial de Subasta *
                            </label>
                            <input
                              type="text"
                              required
                              value={milestoneEvidenceRef}
                              onChange={(e) => setMilestoneEvidenceRef(e.target.value)}
                              placeholder="Ej. COPART-INV-99218204 / Factura Lote #89011201"
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                            />
                            <p className="text-[10px] text-amber-200 mt-1">
                              * Requisito estricto: no se permite avanzar a transporte sin comprobante oficial verificable.
                            </p>
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1">
                              Monto de Adjudicación Final (USD)
                            </label>
                            <input
                              type="number"
                              value={milestoneWonPrice}
                              onChange={(e) => setMilestoneWonPrice(e.target.value)}
                              placeholder="Ej. 13800"
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                            />
                          </div>
                        </div>
                      )}

                      {milestoneType === "BROKER_FEE_SET" && (
                        <div>
                          <label className="block text-slate-300 mb-1">
                            Comisión o Tarifa de Broker Pactada (USD)
                          </label>
                          <input
                            type="number"
                            value={milestoneBrokerFee}
                            onChange={(e) => setMilestoneBrokerFee(e.target.value)}
                            placeholder="Ej. 350 (Configurable según acuerdo)"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            * Tarifa configurable por cliente sin forzar montos fijos arbitrarios.
                          </p>
                        </div>
                      )}

                      {milestoneType === "DOCUMENTS_RECEIVED" && (
                        <div>
                          <label className="block text-slate-300 mb-1">
                            Referencia de Almacenamiento Seguro del Documento
                          </label>
                          <input
                            type="text"
                            value={milestoneDocUrl}
                            onChange={(e) => setMilestoneDocUrl(e.target.value)}
                            placeholder="Ej. /secure-docs/lead-8901/id-card.pdf"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                          />
                        </div>
                      )}

                      {milestoneType === "CARFAX_VERIFIED" && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                            <input
                              type="checkbox"
                              checked={milestoneHasCarfax}
                              onChange={(e) => setMilestoneHasCarfax(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500"
                            />
                            Reporte Carfax verificado por vía oficial y autorizada
                          </label>
                          <input
                            type="text"
                            value={milestoneCarfaxUrl}
                            onChange={(e) => setMilestoneCarfaxUrl(e.target.value)}
                            placeholder="Ej. /secure-docs/carfax/report-vin-9901.pdf"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={milestoneSubmitting || !selectedCaseId}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {milestoneSubmitting ? "Registrando..." : "Guardar Hito Comercial"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Columna Derecha: Guiones Comerciales y Listado de Expedientes */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Centro de Guiones Comerciales para WhatsApp */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                    <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2.5 flex items-center justify-between">
                      <span>Centro de Guiones Comerciales (WhatsApp / Correo)</span>
                      <span className="text-[11px] font-mono text-emerald-400">10 Plantillas Oficiales</span>
                    </h2>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">
                          Seleccionar Momento de la Venta
                        </label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {overviewData?.crm?.templates?.map((tpl: any) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Vista previa del guion generado con botón de copiado */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Canal: WhatsApp / Mensajería Directa</span>
                          <span className="text-amber-300 font-mono">Sin envíos automáticos invasivos</span>
                        </div>
                        <p className="text-slate-200 text-xs whitespace-pre-wrap font-sans bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                          {selectedTemplateId === "TPL_01_SALUDO_INICIAL" &&
                            `¡Hola [Nombre]! 👋 Te saluda [Asesor] de PUJAMOTOR USA.\n\nEs un gusto saludarte. Vi tu interés en adquirir un vehículo a través de subastas autorizadas en EE. UU. (Copart).\n\nEstamos listos para acompañarte en todo el proceso de búsqueda, verificación técnica, cálculo transparente de costos y logística de exportación hasta tu país. ¿Cómo te encuentras hoy?`}
                          {selectedTemplateId === "TPL_02_CALIFICACION_NECESIDAD" &&
                            `Excelente. Para ubicar las mejores oportunidades que se ajusten a lo que buscas, permíteme hacerte tres preguntas breves:\n\n1️⃣ ¿Qué tipo de vehículo buscas? (Marca, modelo o estilo)\n2️⃣ ¿A partir de qué año te gustaría?\n3️⃣ ¿Cuál es tu presupuesto total aproximado disponible para la compra e importación?\n\nCon estos 3 datos filtraré los patios autorizados de subasta para presentarte las mejores opciones disponibles.`}
                          {selectedTemplateId === "TPL_03_ENVIO_ALTERNATIVAS" &&
                            `¡Hola! 🚗 Ya revisé el inventario de subasta según tus criterios y seleccioné para ti una lista exclusiva de vehículos con excelente potencial de compra.\n\nPuedes ver las fotos en alta definición, reporte de daños, kilometraje y los rangos orientativos de compra en tu enlace privado:\n\n🔗 Tu Selección Personalizada: [ENLACE_PRESENTACION]\n\n💡 Consejo de compra inteligente: En cada ficha verás el rango orientativo de puja sugerido (entre el 40% y 60% del valor comercial en EE. UU.). Échales un vistazo y cuéntame cuáles 2 o 3 te llaman más la atención para analizarlos a fondo.`}
                          {selectedTemplateId === "TPL_04_INVITACION_LLAMADA" &&
                            `Excelente elección con el vehículo seleccionado. Para resolver cualquier duda técnica sobre el título (Clean Title vs Salvage), estado de encendido (Runs and Drives), estimación de flete y despacho aduanero, me gustaría invitarte a una llamada breve de 10 a 15 minutos.\n\n¿Te vendría bien hoy en la tarde o mañana en la mañana? Dime tu horario de preferencia y te marco.`}
                          {selectedTemplateId === "TPL_05_EXPLICACION_PROCESO_CONTRATO" &&
                            `Con mucho gusto te explico los siguientes pasos para formalizar la participación en la subasta de forma 100% segura:\n\n1. Contrato de Asesoría y Mandato: Firmamos un acuerdo simple que protege tu dinero y fija nuestro servicio de representación y gestión.\n2. Depósito de Garantía: Se constituye la garantía requerida por la casa de subasta para habilitar la puja oficial.\n3. Revisión Documental: Verificamos título, historial de siniestros y antecedentes del vehículo.\n4. Pujamos hasta tu límite acordado: Nunca sobrepasamos el tope que tú autorices.\n\n¿Te comparto el borrador de contrato para tu revisión?`}
                          {selectedTemplateId === "TPL_07_CONFIRMACION_OFERTA_MAXIMA" &&
                            `🚨 CONFIRMACIÓN DE PUJA MÁXIMA — PUJAMOTOR USA\n\nConfirmamos los parámetros para la subasta:\n• Vehículo: [VEHICULO]\n• Lote: #[LOTE]\n• Fecha de Subasta: [FECHA]\n• Puja Máxima Autorizada: $[MONTO] USD\n• Total Estimado Llave en Mano: $[TOTAL] USD\n\n🔒 Compromiso PUJAMOTOR USA: Pujaremos estratégicamente en vivo y bajo ninguna circunstancia superaremos tu límite autorizado. Por favor responde "CONFIRMADO" para proceder.`}
                          {selectedTemplateId === "TPL_09_RESULTADO_ADJUDICADO" &&
                            `🎉 ¡EXCELENTES NOTICIAS! 🎉\n\nEl lote ha sido ADJUDICADO A TU FAVOR dentro de tu tope autorizado. Adjuntamos la factura/comprobante oficial de adjudicación emitida por la subasta. El siguiente paso es la liquidación y la coordinación inmediata de la grúa a puerto para evitar cargos por almacenamiento.`}
                          {selectedTemplateId === "TPL_10_SEGUIMIENTO_CLIENTE_PENSANDO" &&
                            `¡Hola! 👋 Quería saludarte y saber cómo vas con la revisión de las opciones de vehículos que te preparé.\n\nSi te surgió alguna duda sobre los costos de importación, el estado del título o los tiempos de entrega, con toda confianza dime y lo revisamos juntos. ¿Pudiste ver las opciones?`}
                          {selectedTemplateId !== "TPL_01_SALUDO_INICIAL" &&
                            selectedTemplateId !== "TPL_02_CALIFICACION_NECESIDAD" &&
                            selectedTemplateId !== "TPL_03_ENVIO_ALTERNATIVAS" &&
                            selectedTemplateId !== "TPL_04_INVITACION_LLAMADA" &&
                            selectedTemplateId !== "TPL_05_EXPLICACION_PROCESO_CONTRATO" &&
                            selectedTemplateId !== "TPL_07_CONFIRMACION_OFERTA_MAXIMA" &&
                            selectedTemplateId !== "TPL_09_RESULTADO_ADJUDICADO" &&
                            selectedTemplateId !== "TPL_10_SEGUIMIENTO_CLIENTE_PENSANDO" &&
                            `Guion oficial preparado para este momento de la venta según el procedimiento operativo de PUJAMOTOR USA (PDF 1).`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const foundLead = overviewData?.crm?.leads?.find(
                              (l: any) => l.id === selectedLeadIdForPres
                            );
                            const text = `¡Hola ${foundLead?.fullName ? foundLead.fullName.split(" ")[0] : ""}! Saludos desde PUJAMOTOR USA.`;
                            navigator.clipboard.writeText(text);
                            setCopiedNotification("¡Guion comercial copiado al portapapeles!");
                            setTimeout(() => setCopiedNotification(null), 4000);
                          }}
                          className="w-full rounded bg-emerald-500 px-3 py-2 font-bold text-slate-950 hover:bg-emerald-400 text-xs"
                        >
                          Copiar Guion al Portapapeles
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bandeja de Expedientes de Asesoría Activos */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
                    <h2 className="text-base font-bold text-white flex items-center justify-between">
                      <span>Expedientes en Flujo Comercial ({overviewData?.crm?.advisoryCases?.length ?? 0})</span>
                      <span className="text-xs font-mono text-slate-400">Seguimiento en Vivo</span>
                    </h2>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {overviewData?.crm?.advisoryCases?.map((c: any) => (
                        <div
                          key={c.id}
                          className={`rounded-lg border p-3.5 text-xs space-y-2 transition ${
                            c.isFollowUpDue
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-slate-800 bg-slate-950"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-amber-400">{c.caseNumber}</span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                c.stage === "OPERACION_CERRADA"
                                  ? "bg-emerald-500 text-slate-950"
                                  : c.isThinking
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-sky-500/20 text-sky-300"
                              }`}
                            >
                              {c.stage}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-200">
                            <div>
                              <span className="font-bold text-white">
                                {c.customerLead?.fullName}
                              </span>{" "}
                              ({c.destinationCountry}) · {c.customerLead?.phoneWhatsapp}
                            </div>
                            {c.maxAuthorizedBidUsd && (
                              <div className="font-mono text-emerald-400 font-bold">
                                Tope: ${c.maxAuthorizedBidUsd.toLocaleString()} USD
                              </div>
                            )}
                          </div>

                          {c.isFollowUpDue && (
                            <div className="rounded bg-rose-500/20 border border-rose-500/40 p-1.5 text-[11px] text-rose-200 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                              ¡Alerta de Seguimiento Hoy! Venció el plazo de recontacto de 2-4 días.
                            </div>
                          )}

                          {c.auctionEvidenceRef && (
                            <div className="text-[11px] font-mono text-emerald-300">
                              ✓ Comprobante Subasta: {c.auctionEvidenceRef}
                            </div>
                          )}

                          {c.operationalNotes && (
                            <p className="text-[11px] text-slate-400 italic">
                              &ldquo;{c.operationalNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 6: HISTORIAL DE CAMBIOS DE LOTES Y AUDITORÍA DE SEGURIDAD */}
          {activeTab === "AUDIT_SECURITY" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <History className="h-5 w-5 text-amber-400" />
                  Historial de Cambios de Vehículos y Lotes (LotChangeHistory)
                </h2>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {overviewData?.recentLotChanges?.map((ch: any) => (
                    <div
                      key={ch.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">
                          Lote #{ch.auctionLot?.lotNumber} ({ch.changeSource})
                        </span>
                        <span className="text-slate-500">
                          {new Date(ch.createdAt).toLocaleString("es-MX")}
                        </span>
                      </div>
                      <p className="text-slate-200">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Bitácora Inmutable de Auditoría y Seguridad (AuditLog — PII Enmascarado)
                </h2>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {overviewData?.auditLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">
                          [{log.module}] {log.action}
                        </span>
                        <span className="text-slate-500">
                          Rol: {log.actorRole} ·{" "}
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 break-all">
                        {JSON.stringify(log.details)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Interactivo del Centro Documental */}
      <DocumentCenterModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        initialDocId={docInitialId}
        initialValues={docInitialValues}
      />
    </div>
  );
}
