"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileCheck,
  Scale,
  Car,
  Truck,
  Edit3,
  ExternalLink,
} from "lucide-react";
import {
  OFFICIAL_DOCUMENT_TEMPLATES,
  OfficialDocumentTemplate,
} from "@/modules/documents/document-templates";

interface DocumentCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocId?: string;
  initialValues?: Record<string, string>;
}

export function DocumentCenterModal({
  isOpen,
  onClose,
  initialDocId = "DOC-01-PRES",
  initialValues = {},
}: DocumentCenterModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTemplate =
    OFFICIAL_DOCUMENT_TEMPLATES.find((d) => d.id === selectedDocId) ||
    OFFICIAL_DOCUMENT_TEMPLATES[0];

  // Obtener valores actuales combinando defaults, props y cambios del usuario
  const currentValues: Record<string, string> = {
    ...currentTemplate.fields.reduce((acc, f) => {
      acc[f.key] = f.defaultValue;
      return acc;
    }, {} as Record<string, string>),
    ...initialValues,
    ...(fieldValues[currentTemplate.id] || {}),
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [currentTemplate.id]: {
        ...(prev[currentTemplate.id] || {}),
        [key]: value,
      },
    }));
  };

  const docContent = currentTemplate.renderContent(currentValues);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Barra superior modal */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Centro Documental Oficial
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PUJAMOTOR USA
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {currentTemplate.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
                isEditing
                  ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-semibold"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? "Ver Vista Previa" : "Editar Datos"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del visor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navegador lateral de documentos */}
          <div className="no-print w-full md:w-72 bg-zinc-900/60 border-b md:border-b-0 md:border-r border-zinc-800 p-3 overflow-y-auto">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2">
              8 Documentos Corporativos
            </p>
            <div className="space-y-1">
              {OFFICIAL_DOCUMENT_TEMPLATES.map((doc) => {
                const isSelected = doc.id === currentTemplate.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 ${
                      isSelected
                        ? "bg-cyan-500/15 border border-cyan-500/40 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                    }`}
                  >
                    <div
                      className={`mt-0.5 p-1 rounded-md ${
                        isSelected
                          ? "bg-cyan-500 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          {doc.code}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {doc.badge}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-200 truncate mt-0.5">
                        {doc.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área principal: Formulario de edición o Hoja de documento */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-zinc-900/30 flex justify-center">
            {isEditing ? (
              <div className="no-print w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Edit3 className="h-4 w-4 text-cyan-400" />
                    <span>Personalizar Campos: {currentTemplate.title}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Modifique los valores para adaptarlos al expediente, cliente o lote específico.
                  </p>
                </div>

                <div className="space-y-3">
                  {currentTemplate.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs font-medium text-zinc-300">
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={currentValues[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={currentValues[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-750 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition-all"
                  >
                    Guardar y Ver Documento
                  </button>
                </div>
              </div>
            ) : (
              /* Hoja de documento imprimible (Estilo corporativo blanco/grafito con membrete) */
              <div className="printable-document w-full max-w-3xl bg-white text-zinc-900 rounded-xl shadow-2xl p-8 md:p-12 border border-zinc-200 font-sans">
                {/* Encabezado membretado */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-zinc-900 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-44 h-12">
                      <Image
                        src="/images/pujamotor-logo-horizontal.png"
                        alt="PUJAMOTOR USA"
                        fill
                        className="object-contain object-left"
                        priority
                      />
                    </div>
                  </div>

                  <div className="text-right sm:text-right space-y-0.5 text-xs text-zinc-600">
                    <p className="font-bold text-zinc-900 font-mono tracking-wider">
                      {currentTemplate.code}
                    </p>
                    <p className="font-semibold text-cyan-700">PUJAMOTOR USA LLC</p>
                    <p>Broker de Subastas Mayoristas Copart</p>
                    <p>Miami, Florida · EE. UU.</p>
                  </div>
                </div>

                {/* Título de documento y subtítulo */}
                <div className="my-6">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 block mb-1">
                    {docContent.headerSubtitle}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-950 leading-tight">
                    {currentTemplate.title}
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1 italic">
                    {currentTemplate.summary}
                  </p>
                </div>

                {/* Secciones del documento */}
                <div className="space-y-6 text-xs leading-relaxed text-zinc-800">
                  {docContent.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        sec.isHighlight
                          ? "bg-cyan-50/70 border-l-4 border-cyan-600 text-zinc-900 font-medium"
                          : "bg-zinc-50 border border-zinc-200"
                      }`}
                    >
                      <h4 className="font-bold text-zinc-950 text-sm mb-2">
                        {sec.title}
                      </h4>
                      {Array.isArray(sec.content) ? (
                        <div className="space-y-1.5">
                          {sec.content.map((p, pIdx) => (
                            <p key={pIdx}>{p}</p>
                          ))}
                        </div>
                      ) : (
                        <p>{sec.content}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Firmas oficiales si aplica */}
                {docContent.signers && docContent.signers.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
                    {docContent.signers.map((signer, sIdx) => (
                      <div key={sIdx} className="space-y-2">
                        <div className="h-14 border-b border-dashed border-zinc-400 mx-auto w-4/5 flex items-end justify-center pb-1">
                          <span className="text-[10px] text-zinc-400 font-mono italic">
                            [Firma Autorizada / Sello]
                          </span>
                        </div>
                        <p className="font-bold text-zinc-950 uppercase">
                          {currentValues[signer.nameField] || signer.nameField}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                          {signer.role}
                        </p>
                        {signer.idField && (
                          <p className="text-[10px] font-mono text-zinc-500">
                            {currentValues[signer.idField] || signer.idField}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pie de página membretado */}
                <div className="mt-10 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 gap-2">
                  <p>{docContent.footerNote}</p>
                  <p className="font-mono">
                    Emitido: {new Date().toLocaleDateString("es-ES")} · PUJAMOTOR USA
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

