export interface DocumentField {
  key: string;
  label: string;
  defaultValue: string;
  type: "text" | "number" | "date" | "textarea";
}

export interface OfficialDocumentTemplate {
  id: string;
  code: string;
  title: string;
  category: "INSTITUCIONAL" | "COMERCIAL" | "LEGAL_OPERATIVO" | "LOGISTICA";
  badge: string;
  summary: string;
  fields: DocumentField[];
  renderContent: (values: Record<string, string>) => {
    headerSubtitle: string;
    sections: Array<{
      title: string;
      content: string | string[];
      isHighlight?: boolean;
    }>;
    signers?: Array<{
      role: string;
      nameField: string;
      idField?: string;
    }>;
    footerNote: string;
  };
}

export const OFFICIAL_DOCUMENT_TEMPLATES: OfficialDocumentTemplate[] = [
  {
    id: "DOC-01-PRES",
    code: "PM-DOC-01",
    title: "Presentación Institucional de PUJAMOTOR USA",
    category: "INSTITUCIONAL",
    badge: "Gobierno Corporativo",
    summary:
      "Documento marco que presenta el modelo de intermediación broker en subastas mayoristas Copart, garantías operativas y tarifa única de $300 a $500 USD contra entrega.",
    fields: [
      { key: "prospectName", label: "Nombre del Interesado / Cliente", defaultValue: "Cliente Preferencial", type: "text" },
      { key: "date", label: "Fecha de Emisión", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
      { key: "advisorName", label: "Asesor Asignado", defaultValue: "Equipo de Operaciones PUJAMOTOR USA", type: "text" },
    ],
    renderContent: (v) => ({
      headerSubtitle: "DOSSIER CORPORATIVO DE INTERMEDIACIÓN AUTOMOTRIZ EN SUBASTAS EE. UU.",
      sections: [
        {
          title: "1. Quiénes Somos y Modelo de Negocio",
          content: [
            "PUJAMOTOR USA es un broker automotriz especializado en la localización, evaluación técnica y gestión de compra de vehículos en las subastas mayoristas de Copart en Estados Unidos.",
            "Operamos con licencias mayoristas que permiten a compradores particulares e importadores acceder a inventarios cerrados a precios de liquidación, con total transparencia y control de riesgos.",
            "Nuestra filosofía rectora: «Compra Inteligente. Puja con Confianza». No somos vendedores de patio ni concesionarios tradicionales: somos sus representantes técnicos y legales ante la casa de subastas.",
          ],
        },
        {
          title: "2. Nuestros No Negociables de Confianza",
          content: [
            "• Filtro estricto de unidades: Exclusivamente vehículos con Título Limpio (Clean Title) y condición verificada de encendido y marcha (Run and Drive).",
            "• Preferencia de odómetro: Selección prioritaria de unidades con menos de 100,000 millas reales.",
            "• Transparencia de costos: Facturación oficial emitida directamente por Copart a nombre del cliente con desglose de impuestos y aranceles hasta el puerto o domicilio.",
            "• Fee de broker transparente: De $300 a $500 USD (según el valor del vehículo), pagadero ÚNICAMENTE cuando el comprador tiene el vehículo en sus manos.",
          ],
          isHighlight: true,
        },
        {
          title: "3. Acceso en Vivo y Control Total",
          content: [
            "Asignamos a cada cliente un sub-usuario oficial dentro de nuestra cuenta de broker en Copart para que pueda sumarse a la subasta en vivo y seguir cada incremento de puja en tiempo real con absoluta visibilidad.",
          ],
        },
      ],
      footerNote:
        "PUJAMOTOR USA · Broker de Subastas Automotrices · Miami, FL, EE. UU. · Documento informativo oficial.",
    }),
  },
  {
    id: "DOC-02-GUIA",
    code: "PM-DOC-02",
    title: "Guía del Proceso de Compra",
    category: "COMERCIAL",
    badge: "Instructivo Oficial",
    summary:
      "Guía paso a paso para el comprador que detalla las etapas de búsqueda, validación de lote, contrato, subasta en vivo y los 4 avisos oficiales.",
    fields: [
      { key: "clientName", label: "Nombre del Cliente", defaultValue: "Comprador Autorizado", type: "text" },
      { key: "targetVehicle", label: "Vehículo en Búsqueda", defaultValue: "SUV / Pickup / Sedán 2021-2024", type: "text" },
      { key: "date", label: "Fecha", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
    ],
    renderContent: (v) => ({
      headerSubtitle: "PROCEDIMIENTO ESTANDARIZADO DE ADQUISICIÓN EN SUBASTAS COPART",
      sections: [
        {
          title: "Etapas del Proceso de Adquisición",
          content: [
            "Paso 1: Solicitud inicial y definición de criterios de búsqueda (modelo, año y presupuesto total).",
            "Paso 2: Búsqueda y envío de 4 a 7 alternativas reales de Copart con cálculo de rangos de oferta (40%-60% Retail Value / 60%-75% Buy It Now).",
            "Paso 3: Validación técnica en Copart (prende y anda, títulos limpios, kilometraje e historial Carfax).",
            "Paso 4: Explicación ordenada del proceso y firma del contrato de broker de 4 puntos.",
            "Paso 5: Carga del contrato en el sistema de Copart y creación de credenciales de sub-usuario.",
            "Paso 6: Acompañamiento en la subasta en vivo con captura auténtica de «Próximos lotes».",
            "Paso 7: Cierre de la subasta con comprobante oficial de «Venta finalizada» en cuenta de broker.",
            "Paso 8: Emisión de factura Copart, liquidación por canales oficiales, despacho con Copart Delivery y pago del fee de $300-$500 contra entrega.",
          ],
        },
        {
          title: "Los 4 Avisos Obligatorios al Cliente",
          content: [
            "1. Aviso de Contrato cargado y credenciales de sub-usuario (2 a 3 horas antes de la subasta).",
            "2. Aviso de Acompañamiento en vivo con pantalla de 'Próximos lotes' y minutos restantes.",
            "3. Aviso de Resultado oficial con pantallazo de 'Venta finalizada' y adjudicación.",
            "4. Aviso de Factura emitida por Copart con confirmación de las 3 vías de pago autorizadas.",
          ],
          isHighlight: true,
        },
      ],
      footerNote:
        "Guía oficial de PUJAMOTOR USA conforme a los manuales metodológicos PDF 1 y PDF 2.",
    }),
  },
  {
    id: "DOC-03-COT",
    code: "PM-DOC-03",
    title: "Cotización Individual de Vehículo",
    category: "COMERCIAL",
    badge: "Estimación Detallada",
    summary:
      "Desglose técnico y financiero para un lote específico, incluyendo oferta proyectada, tarifas oficiales de Copart, flete terrestre, seguro y fee de broker.",
    fields: [
      { key: "quoteCode", label: "Código COT / Simulación", defaultValue: "COT-2026-88403", type: "text" },
      { key: "clientName", label: "Cliente", defaultValue: "Carlos Eduardo Mendoza", type: "text" },
      { key: "lotNumber", label: "Número de Lote Copart", defaultValue: "78410291", type: "text" },
      { key: "vehicleDetails", label: "Vehículo (Año/Marca/Modelo)", defaultValue: "2022 TOYOTA RAV4 XLE", type: "text" },
      { key: "vinNumber", label: "VIN (Número de Serie)", defaultValue: "2T3P1RFV8NW123456", type: "text" },
      { key: "yardLocation", label: "Yarda de Ubicación", defaultValue: "TX - DALLAS", type: "text" },
      { key: "targetBid", label: "Oferta Proyectada (USD)", defaultValue: "11,800", type: "text" },
      { key: "copartFees", label: "Tarifas Copart (Buyer, Virtual, Gate)", defaultValue: "1,204", type: "text" },
      { key: "inlandFreight", label: "Flete Terrestre Estimado (USD)", defaultValue: "320", type: "text" },
      { key: "brokerFee", label: "Fee Broker PUJAMOTOR USA (USD)", defaultValue: "400", type: "text" },
      { key: "totalEstimated", label: "Costo Total Estimado (USD)", defaultValue: "13,724", type: "text" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `ESTIMACIÓN FINANCIERA REFERENCIAL — EXPEDIENTE #${v.quoteCode}`,
      sections: [
        {
          title: "1. Datos del Vehículo Analizado",
          content: [
            `• Lote Copart: #${v.lotNumber} | VIN: ${v.vinNumber}`,
            `• Unidad: ${v.vehicleDetails} | Ubicación: ${v.yardLocation}`,
            `• Título: Clean Title | Condición: Run & Drive | Odómetro verificado`,
          ],
        },
        {
          title: "2. Desglose Financiero Estimado (Valores en USD)",
          content: [
            `• Oferta Máxima Proyectada en Subasta: $${v.targetBid} USD`,
            `• Tarifas Oficiales Copart (Buyer Fee + Virtual + Gate): $${v.copartFees} USD`,
            `• Flete Terrestre desde Yarda (${v.yardLocation}): $${v.inlandFreight} USD`,
            `• Fee de Broker PUJAMOTOR USA: $${v.brokerFee} USD (Pagadero contra entrega)`,
            `• TOTAL ESTIMADO DE ADQUISICIÓN: $${v.totalEstimated} USD`,
          ],
          isHighlight: true,
        },
        {
          title: "3. Cláusula de Transparencia Tarifaria",
          content: [
            "Este documento es una cotización técnica referencial previa. Las tarifas de Copart se rigen por el tabulador oficial vigente de la subastadora según el monto final de adjudicación. El fee de broker de $300 a $500 USD es inamovible y se cancela exclusivamente una vez recibido el vehículo.",
          ],
        },
      ],
      footerNote:
        "PUJAMOTOR USA · Cotización generada mediante el motor de costos oficial · Válida por 5 días hábiles.",
    }),
  },
  {
    id: "DOC-04-CONTRATO",
    code: "PM-DOC-04",
    title: "Contrato de Prestación de Servicios de Broker",
    category: "LEGAL_OPERATIVO",
    badge: "Contrato Vinculante",
    summary:
      "Contrato legal formal de 4 puntos que autoriza a PUJAMOTOR USA a pujar en Copart a nombre del comprador, fijando la oferta tope y el fee pagadero al recibir el auto.",
    fields: [
      { key: "contractNumber", label: "Número de Contrato", defaultValue: "CTR-2026-9041", type: "text" },
      { key: "date", label: "Fecha de Firma", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
      { key: "clientName", label: "Nombre Completo del Cliente", defaultValue: "Carlos Eduardo Mendoza", type: "text" },
      { key: "clientId", label: "Doc. Identidad / Pasaporte / Licencia", defaultValue: "DL-TX-98745210", type: "text" },
      { key: "vehicleSummary", label: "Vehículo Objeto del Mandato", defaultValue: "2022 TOYOTA RAV4 XLE (Lote #78410291)", type: "text" },
      { key: "maxBidUsd", label: "Puja Máxima Autorizada (USD)", defaultValue: "12,500", type: "text" },
      { key: "brokerFeeUsd", label: "Honorario de Broker (USD)", defaultValue: "400", type: "text" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `CONTRATO DE MANDATO Y SERVICIOS DE BROKER AUTOMOTRIZ — #${v.contractNumber}`,
      sections: [
        {
          title: "Cláusula Primera — Identificación de las Partes",
          content: [
            `Entre PUJAMOTOR USA (en adelante, EL BROKER), con personería para operar en subastas mayoristas de Copart, y ${v.clientName}, titular del documento ${v.clientId} (en adelante, EL MANDANTE / COMPRADOR), se celebra el presente contrato de mandato comercial.`,
          ],
        },
        {
          title: "Cláusula Segunda — Objeto y Vehículo Seleccionado",
          content: [
            `EL COMPRADOR confiere mandato especial a EL BROKER para ingresar su oferta en la subasta en vivo de Copart para el lote: ${v.vehicleSummary}.`,
          ],
        },
        {
          title: "Cláusula Tercera — Límite de Oferta Autorizada (Inviolable)",
          content: [
            `La oferta máxima autorizada para pujar en la subasta en vivo es de hasta $${v.maxBidUsd} USD. EL BROKER tiene expresamente prohibido sobrepasar este monto bajo ninguna circunstancia. Quien resulte vencedor será quien haga la puja más alta en el evento.`,
          ],
          isHighlight: true,
        },
        {
          title: "Cláusula Cuarta — Honorarios y Condición de Pago",
          content: [
            `Los honorarios pactados por la gestión ascienden a la suma de $${v.brokerFeeUsd} USD. Se estipula de forma expresa que dicho honorario será pagadero ÚNICAMENTE cuando EL MANDANTE tenga el vehículo en sus manos. En caso de no adjudicarse el lote, EL COMPRADOR no pagará honorario alguno al BROKER.`,
          ],
          isHighlight: true,
        },
      ],
      signers: [
        { role: "EL COMPRADOR / MANDANTE", nameField: "clientName", idField: "clientId" },
        { role: "POR PUJAMOTOR USA (BROKER)", nameField: "Representante Autorizado", idField: "Licencia de Broker Copart" },
      ],
      footerNote:
        "Contrato estándar de 4 puntos conforme a la metodología oficial rectora PDF 1 de PUJAMOTOR USA.",
    }),
  },
  {
    id: "DOC-05-AUT-PUJA",
    code: "PM-DOC-05",
    title: "Autorización de Oferta Máxima (Max Bid Authorization)",
    category: "LEGAL_OPERATIVO",
    badge: "Límite Operativo",
    summary:
      "Documento de control operativo que blinda el límite superior de puja para el operador de subasta, impidiendo ofertas desmedidas durante el evento en vivo.",
    fields: [
      { key: "authCode", label: "Código de Autorización", defaultValue: "AUT-BID-2026-7841", type: "text" },
      { key: "date", label: "Fecha de Subasta", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
      { key: "clientName", label: "Comprador", defaultValue: "Carlos Eduardo Mendoza", type: "text" },
      { key: "lotNumber", label: "Lote Copart", defaultValue: "78410291", type: "text" },
      { key: "vehicleDescription", label: "Vehículo", defaultValue: "2022 TOYOTA RAV4 XLE (VIN: 2T3P1RFV8NW123456)", type: "text" },
      { key: "maxAllowedBid", label: "Monto Máximo de Puja (USD)", defaultValue: "12,500", type: "text" },
      { key: "copartSubUser", label: "Sub-Usuario Copart del Cliente", defaultValue: "pujamotor_sub_88403", type: "text" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `AUTORIZACIÓN FORMAL DE PUJA EN SUBASTA EN VIVO — #${v.authCode}`,
      sections: [
        {
          title: "1. Mandato Operativo de Puja",
          content: [
            `Por medio del presente documento, yo, ${v.clientName}, autorizo expresamente a PUJAMOTOR USA para presentar ofertas en mi representación en la subasta de Copart sobre el lote #${v.lotNumber} (${v.vehicleDescription}).`,
            `Se me ha asignado el sub-usuario Copart [${v.copartSubUser}] para acceder a la subasta en vivo y visualizar las pujas en tiempo real.`,
          ],
        },
        {
          title: "2. Parámetro Límite de Oferta",
          content: [
            `MONTO MÁXIMO AUTORIZADO: $${v.maxAllowedBid} USD.`,
            "El operador de subasta de PUJAMOTOR USA no podrá exceder este límite ni por un solo incremento. Si la puja contraria supera este valor, el lote se declarará perdido sin costo ni penalización alguna para el comprador.",
          ],
          isHighlight: true,
        },
      ],
      signers: [
        { role: "COMPRADOR AUTORIZANTE", nameField: "clientName" },
        { role: "OPERADOR DE SUBASTA RESPONSABLE", nameField: "Operaciones PUJAMOTOR USA" },
      ],
      footerNote:
        "Documento de blindaje operativo vinculado a la orden de subasta de PUJAMOTOR USA.",
    }),
  },
  {
    id: "DOC-06-CHECKLIST",
    code: "PM-DOC-06",
    title: "Lista de Verificación Operativa (Pre-Auction Checklist)",
    category: "LEGAL_OPERATIVO",
    badge: "Control de Calidad",
    summary:
      "Checklist técnico obligatorio que el asesor y el operador deben completar antes de ingresar a la subasta en vivo, certificando título, condición y Carfax.",
    fields: [
      { key: "checklistCode", label: "Código de Verificación", defaultValue: "CHK-2026-7841", type: "text" },
      { key: "lotNumber", label: "Lote Copart", defaultValue: "78410291", type: "text" },
      { key: "vehicle", label: "Vehículo", defaultValue: "2022 TOYOTA RAV4 XLE", type: "text" },
      { key: "inspectorName", label: "Especialista Revisor", defaultValue: "Área de Análisis de Vehículos", type: "text" },
      { key: "date", label: "Fecha de Revisión", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `CERTIFICACIÓN PREVIA DE LOTE — EXPEDIENTE #${v.checklistCode}`,
      sections: [
        {
          title: "Puntos de Control Técnico y Documental Obligatorios",
          content: [
            "✔ 1. Verificación de Título: Confirmado Título Limpio (Clean Title) libre de gravámenes no subsanables.",
            "✔ 2. Condición Operativa: Certificado 'Run and Drive' (enciende, engrana y avanza bajo su propia fuerza).",
            "✔ 3. Odómetro: Kilometraje verificado con lectura real menor a 100,000 millas (Lectura: 28,400 mi).",
            "✔ 4. Llaves del Vehículo: Confirmada presencia física de llave maestra en yarda de Copart (Has Keys: YES).",
            "✔ 5. Reporte Carfax: Historial analizado sin despliegue de bolsas de aire estructurales ni reportes de inundación.",
            "✔ 6. Ubicación y Yarda: Confirmada yarda de origen para cálculo exacto de flete terrestre.",
            "✔ 7. Oferta Máxima Blindada: Límite registrado en sistema sin superar el presupuesto del cliente.",
          ],
          isHighlight: true,
        },
        {
          title: "Dictamen Técnico",
          content: [
            `El lote #${v.lotNumber} (${v.vehicle}) CUMPLE la totalidad de los criterios no negociables de PUJAMOTOR USA y está AUTORIZADO para participar en la subasta en vivo.`,
          ],
        },
      ],
      signers: [
        { role: "ANALISTA DE VEHÍCULOS", nameField: "inspectorName" },
        { role: "RESPONSABLE DE OPERACIONES", nameField: "Control Operativo PUJAMOTOR USA" },
      ],
      footerNote:
        "Lista de control de calidad previa a subasta requerida por el estándar operativo de PUJAMOTOR USA.",
    }),
  },
  {
    id: "DOC-07-RES-SUBASTA",
    code: "PM-DOC-07",
    title: "Registro Oficial de Resultados de Subasta",
    category: "LEGAL_OPERATIVO",
    badge: "Resultado Oficial",
    summary:
      "Acta de cierre de subasta con verificación del pantallazo de «Venta finalizada» y confirmación de adjudicación en la cuenta oficial de broker.",
    fields: [
      { key: "resultCode", label: "Código de Cierre", defaultValue: "RES-2026-7841", type: "text" },
      { key: "lotNumber", label: "Lote Copart", defaultValue: "78410291", type: "text" },
      { key: "clientName", label: "Cliente Adjudicatario", defaultValue: "Carlos Eduardo Mendoza", type: "text" },
      { key: "winningBid", label: "Monto de Adjudicación (USD)", defaultValue: "12,200", type: "text" },
      { key: "evidenceUrl", label: "Referencia Pantallazo Venta Finalizada", defaultValue: "subasta_pro_p12_img1.jpeg (Confirmado)", type: "text" },
      { key: "date", label: "Fecha y Hora del Cierre", defaultValue: new Date().toISOString().replace("T", " ").slice(0, 16), type: "text" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `ACTA DE CIERRE Y ADJUDICACIÓN DE SUBASTA EN VIVO — #${v.resultCode}`,
      sections: [
        {
          title: "1. Resultado de la Subasta en Vivo",
          content: [
            `• Lote Adjudicado: #${v.lotNumber} ante la casa de subastas Copart.`,
            `• Cliente Ganador: ${v.clientName}.`,
            `• Valor de Cierre Ganador: $${v.winningBid} USD (dentro del límite contractual autorizado).`,
            `• Evidencia Gráfica Oficial: Pantallazo de 'Venta finalizada' archivado (${v.evidenceUrl}).`,
            `• Confirmación en Cuenta de Broker: Lote registrado a nombre de PUJAMOTOR USA para cesión al comprador.`,
          ],
          isHighlight: true,
        },
        {
          title: "2. Instrucciones de Facturación y Pago Oficial",
          content: [
            "Conforme a los no negociables de PUJAMOTOR USA, Copart emitirá la factura oficial directamente al correo del comprador.",
            "Las tres formas oficiales autorizadas de pago son:",
            "  1. Directo en la yarda de Copart correspondiente.",
            "  2. A la cuenta bancaria oficial de PUJAMOTOR USA.",
            "  3. Mediante link seguro de pago (a Copart o a PUJAMOTOR USA).",
            "NUNCA realizar transferencias a cuentas personales de asesores.",
          ],
        },
      ],
      signers: [
        { role: "OPERADOR DE SUBASTAS PUJAMOTOR USA", nameField: "Operaciones Subastas" },
        { role: "COORDINADOR DE DOCUMENTACIÓN", nameField: "Gestión Documental" },
      ],
      footerNote:
        "Registro oficial de resultado de subasta conforme al Paso 9 y Paso 10 del manual rector.",
    }),
  },
  {
    id: "DOC-08-ENTREGA",
    code: "PM-DOC-08",
    title: "Registro de Entrega del Vehículo y Liquidación de Fee",
    category: "LOGISTICA",
    badge: "Acta Final",
    summary:
      "Acta formal de entrega y conformidad donde el cliente recibe el vehículo, el título de propiedad y procede a la liquidación del fee de broker de $300 a $500 USD.",
    fields: [
      { key: "deliveryCode", label: "Acta de Entrega #", defaultValue: "ENT-2026-9921", type: "text" },
      { key: "clientName", label: "Cliente Receptor", defaultValue: "Carlos Eduardo Mendoza", type: "text" },
      { key: "lotNumber", label: "Lote Copart", defaultValue: "78410291", type: "text" },
      { key: "vehicle", label: "Vehículo Entregado", defaultValue: "2022 TOYOTA RAV4 XLE (VIN: 2T3P1RFV8NW123456)", type: "text" },
      { key: "deliveryAddress", label: "Lugar de Entrega", defaultValue: "Domicilio del Cliente / Patio Autorizado", type: "text" },
      { key: "brokerFeePaid", label: "Fee de Broker Liquidado (USD)", defaultValue: "400", type: "text" },
      { key: "date", label: "Fecha de Entrega", defaultValue: new Date().toISOString().split("T")[0], type: "date" },
    ],
    renderContent: (v) => ({
      headerSubtitle: `ACTA DE CONFORMIDAD DE ENTREGA Y LIQUIDACIÓN DE SERVICIO — #${v.deliveryCode}`,
      sections: [
        {
          title: "1. Declaración de Entrega y Recepción Física",
          content: [
            `En la fecha indicada, el cliente ${v.clientName} recibe a entera satisfacción el vehículo ${v.vehicle}, correspondiente al lote de subasta #${v.lotNumber}, transportado mediante el servicio coordinado de logística hasta ${v.deliveryAddress}.`,
            "Se hace entrega simultánea del Título de Propiedad original (Clean Title) y juego de llaves.",
          ],
        },
        {
          title: "2. Liquidación del Fee de Broker PUJAMOTOR USA",
          content: [
            `En cumplimiento de la regla de oro de PUJAMOTOR USA («El fee de servicio se paga únicamente cuando el cliente tiene el vehículo en sus manos»), se procede a la liquidación del honorario de broker pactado por valor de $${v.brokerFeePaid} USD.`,
            "Ambas partes declaran la operación comercial exitosa, cerrada y sin saldos pendientes.",
          ],
          isHighlight: true,
        },
      ],
      signers: [
        { role: "EL COMPRADOR (CLIENTE SATISFECHO)", nameField: "clientName" },
        { role: "COORDINADOR LOGÍSTICO Y DOCUMENTAL", nameField: "PUJAMOTOR USA Delivery Ops" },
      ],
      footerNote:
        "Acta final de cierre y conformidad comercial de PUJAMOTOR USA.",
    }),
  },
];

