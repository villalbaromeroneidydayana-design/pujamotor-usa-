// ============================================================================
// PUJAMOTOR USA — PLANTILLAS Y GUIONES COMERCIALES OFICIALES (PDF 1)
// Fuente de verdad literal: "Generar dinero haciendo caso — Proceso comercial y guion de ventas" (PDF 1)
// Marca exclusiva: PUJAMOTOR USA · Compra Inteligente. Puja con Confianza.
// ============================================================================

export interface TemplateContext {
  clientName?: string;
  advisorName?: string;
  advisorPhone?: string;
  targetVehicle?: string;
  minYear?: number | string;
  budgetUsd?: number | string;
  presentationUrl?: string;
  lotNumber?: string;
  vehicleDescription?: string;
  maxAuthorizedBidUsd?: number | string;
  auctionDate?: string;
  estimatedTotalUsd?: number | string;
  winningBidUsd?: number | string;
  subUser?: string;
  subPassword?: string;
  copartLotUrl?: string;
  copartLiveUrl?: string;
}

export interface CommercialTemplate {
  id: string;
  stepNumber: number | string;
  stageCode?: string;
  title: string;
  channel: "WHATSAPP" | "EMAIL" | "CALL_SCRIPT";
  description: string;
  generateText: (ctx: TemplateContext) => string;
}

// ----------------------------------------------------------------------------
// PLANTILLAS OFICIALES LITERALES PUJAMOTOR USA (10 PASOS DEL PDF 1)
// ----------------------------------------------------------------------------
export const COMMERCIAL_TEMPLATES: CommercialTemplate[] = [
  {
    id: "TPL_01_SALUDO_INICIAL",
    stepNumber: 1,
    stageCode: "LEAD_NUEVO",
    title: "Paso 1. Saludo Inicial (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Apertura obligatoria para todo contacto nuevo en WhatsApp. Se dice tal cual, sustituyendo únicamente [Nombre].",
    generateText: (ctx) =>
      `¡Hola ${ctx.clientName ? `${ctx.clientName}! ` : ""}Mucho gusto, habla con ${
        ctx.advisorName || "[Nombre]"
      }, broker especialista de PUJAMOTOR USA en las subastas de Copart, una de las compañías más grandes del mundo en venta de vehículos de subasta de manera online. ¿Cómo le puedo ayudar el día de hoy?`,
  },
  {
    id: "TPL_02_CALIFICACION_NECESIDAD",
    stepNumber: 2,
    stageCode: "CALIFICACION_EN_CURSO",
    title: "Paso 2. Datos de Búsqueda (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Tres preguntas indispensables: vehículo, año y presupuesto. Texto íntegro del PDF 1 Pág. 6.",
    generateText: () =>
      `Claro que sí, nosotros le podemos ayudar a comprar su vehículo en las subastas de Copart. Por favor, indíqueme qué vehículo está buscando, desde qué año y qué presupuesto tiene. Esto con el fin de ayudarle a encontrar la mejor opción que se ajuste a sus necesidades. Quedo atento.`,
  },
  {
    id: "TPL_03_ENVIO_ALTERNATIVAS",
    stepNumber: 3,
    stageCode: "BUSQUEDA_ACTIVA",
    title: "Paso 3. Búsqueda y Envío de Vehículos (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Mensaje antes de buscar y enviar entre 4 y 7 opciones de Copart (Clean Title, Run & Drive).",
    generateText: (ctx) =>
      `Claro que sí. Inmediatamente le voy a buscar unos vehículos de acuerdo a lo que me dice y le voy a enviar los links. Recuerde que esos links son directamente de la página de Copart, ahí puede ver toda la información del vehículo. Nosotros somos su broker: le damos acceso a la subasta con nuestra licencia y le gestionamos toda la compra.${
        ctx.presentationUrl ? `\n\nTu Selección Personalizada de alternativas verificadas está lista en: ${ctx.presentationUrl}` : ""
      }`,
  },
  {
    id: "TPL_04_INVITACION_LLAMADA",
    stepNumber: 4,
    stageCode: "VEHICULO_SELECCIONADO",
    title: "Paso 4. Validar la Elección y Ofrecer Llamada (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Validación tras inspeccionar lote en Copart (prende y anda, buen interior, título limpio) y ofrecimiento de llamada.",
    generateText: () =>
      `Ha elegido una muy buena opción. Dentro de lo que le envié, para mí era la mejor. Verifiqué: prende y anda, buen interior, título limpio. Realmente es una muy buena opción. Ahora le voy a explicar cómo es todo el proceso para comprarlo en la subasta. ¿Quiere que le llame o prefiere que se lo explique por mensaje?`,
  },
  {
    id: "TPL_05_EXPLICACION_PROCESO_CONTRATO",
    stepNumber: 5,
    stageCode: "EXPLICACION_PROCESO",
    title: "Paso 5. Explicar el Proceso (Monólogo Íntegro Literal PDF 1)",
    channel: "CALL_SCRIPT",
    description: "Explicación completa en orden estricto de 6 temas: contrato, sub-usuario, subasta en vivo, factura Copart, 3 formas de pago y entrega.",
    generateText: () =>
      `Le voy a indicar cómo es todo el proceso. Es muy sencillo. Nosotros le gestionamos todo ante Copart; usted no se tiene que preocupar por nada.\n\nLo primero es elegir el vehículo, y eso ya lo hicimos juntos. El segundo paso es firmar un contrato donde van sus datos, los datos del vehículo y nuestro fee de servicio. Ese fee lo paga únicamente cuando tenga el carro en sus manos.\n\nEn el contrato también va el monto máximo que nos autoriza a ofertar por el vehículo. Ese contrato es lo que Copart nos exige para entrar a la subasta a su nombre.\n\nLuego le creamos un sub-usuario dentro de nuestra cuenta de broker en Copart. Con ese acceso usted entra con nosotros a la subasta en vivo y ve las pujas en tiempo real. Nosotros ofertamos desde nuestra cuenta sin pasar del monto que usted autorizó.\n\nAl final, la subasta la gana quien haga la oferta más alta. Nadie le puede garantizar que se gana. Si ganamos, Copart le envía directamente a su correo la factura del vehículo. En esa factura ya están incluidos todos los impuestos y lo que cobra Copart hasta entregar el título en su casa.\n\nEsa factura la puede pagar de tres formas: directo a la yard de Copart, a la cuenta oficial de PUJAMOTOR USA, o por un link de pago a Copart o a nosotros. Usted elige la que le quede más cómoda.\n\nDespués del pago, en uno o dos días recibe la factura cancelada. Y en unos días más Copart Delivery le contacta para coordinar la entrega hasta donde usted quiera. El envío cuesta aproximadamente entre $400 y $850.\n\nBásicamente es eso. Somos sus asesores: le damos acceso con nuestra licencia, entramos con usted a la subasta y le gestionamos toda la compra. La factura le llega de Copart y el carro se lo envía Copart directamente a usted.`,
  },
  {
    id: "TPL_06_SOLICITUD_DOCUMENTOS",
    stepNumber: 6,
    stageCode: "CONTRATO_ENVIADO",
    title: "Paso 6. Resolver Dudas y Pedir Documento para Contrato (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Primero se pregunta si tiene dudas. Cuando no quedan dudas, se pide la licencia o pasaporte para el contrato de 4 puntos.",
    generateText: () =>
      `¿Tiene alguna otra duda?\n\nBueno, como le dije, lo primero era elegir el vehículo, y ya se hizo. Ahora debemos firmar el contrato. Por favor envíeme su licencia de conducir o pasaporte para hacer el contrato y enviárselo. El contrato es muy sencillo y lo exige Copart: van sus datos, los nuestros, cuánto se va a ofertar, la descripción del vehículo y nuestro fee. Nada más. Con eso también le creamos su sub-usuario para que entre a la subasta en vivo.`,
  },
  {
    id: "TPL_07_CONFIRMACION_OFERTA_MAXIMA",
    stepNumber: 7,
    stageCode: "CONTRATO_FIRMADO",
    title: "Paso 7. Montar la Oferta y Enviar el Acceso (Aviso 1 - Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Al recibir el contrato: informa el tiempo de 2 a 3 horas y entrega los datos de sub-usuario antes de la subasta.",
    generateText: (ctx) =>
      `Listo, ya voy a cargar el contrato y a crear su sub-usuario. Montar la oferta en el sistema de Copart toma unas 2 o 3 horas. En el momento en que quede todo listo le envío su acceso y le aviso. Estaré muy pendiente de la subasta.${
        ctx.subUser
          ? `\n\n🔑 Datos de acceso para la subasta en vivo:\nUsuario: ${ctx.subUser}\nClave: ${
              ctx.subPassword || "••••••••"
            }\nEnlace Copart: ${ctx.copartLiveUrl || "https://www.copart.com"}`
          : ""
      }`,
  },
  {
    id: "TPL_08_ACTUALIZACION_EN_VIVO",
    stepNumber: 8,
    stageCode: "SUBASTA_PROGRAMADA",
    title: "Paso 8. Acompañamiento en la Subasta en Vivo (Aviso 2 - Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Aviso 2: Pantallazo auténtico de 'Próximos lotes' con los minutos que faltan y recordatorio de sub-usuario. Cero añadidos comerciales.",
    generateText: (ctx) =>
      `[Se adjunta pantallazo de imagen 2: vehículo en 'Próximos lotes' con los minutos que faltan]\n\nSu vehículo ya está en la subasta. Recuerde entrar con su sub-usuario a la subasta en vivo con este link: ${
        ctx.copartLotUrl || ctx.presentationUrl || "[link_del_vehiculo]"
      } para que vea en directo si la gana o no.`,
  },
  {
    id: "TPL_09_RESULTADO_ADJUDICADO",
    stepNumber: 9,
    stageCode: "SUBASTA_GANADA",
    title: "Paso 9. Cierre de la Subasta — 'Venta Finalizada' (Aviso 3 - Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Aviso 3: Pantallazo auténtico de 'Venta finalizada'. Si se ganó pasa al Paso 10; si se perdió, costo cero y vuelta al Paso 3.",
    generateText: (ctx) =>
      ctx.winningBidUsd
        ? `[Se adjunta pantallazo auténtico de 'Venta finalizada' confirmando adjudicación]\n\n¡Ganamos la subasta por $${ctx.winningBidUsd} USD! En unos minutos le enviaré el correo oficial con los detalles y Copart le enviará la factura directamente a su correo.`
        : `[Se adjunta pantallazo auténtico de 'Venta finalizada']\n\nNo pasa nada. Si no ganamos, usted no paga nada y seguimos buscando otra opción que se ajuste a su presupuesto. Cada semana salen miles de vehículos a subasta en Copart.`,
  },
  {
    id: "TPL_10_SEGUIMIENTO_CLIENTE_PENSANDO",
    stepNumber: 10,
    stageCode: "OPERACION_CERRADA",
    title: "Paso 10. Correo de Subasta Ganada y Acompañamiento de Factura (Aviso 4 - Literal PDF 1)",
    channel: "EMAIL",
    description: "Aviso 4: Se envía a los 30 minutos desde la cuenta oficial de PUJAMOTOR USA con nombre y firma. 3 formas de pago y verificación de factura.",
    generateText: (ctx) =>
      `Asunto: Confirmación de Lote Ganado #${ctx.lotNumber || ""} — PUJAMOTOR USA\n\nEstimado/a ${
        ctx.clientName || "Cliente"
      },\n\nLe confirmamos que acabamos de ganar el lote #${
        ctx.lotNumber || ""
      } en la subasta en vivo de Copart.\n\nAdjuntamos a este correo el pantallazo oficial de 'Venta finalizada' y la confirmación de adjudicación.\n\nEn breve Copart le enviará la factura oficial del vehículo directamente a su correo. En esa factura ya están incluidos todos los impuestos y lo que cobra Copart hasta entregar el título en su casa.\n\nEsa factura la puede pagar de tres formas:\n1. Directo a la yard de Copart.\n2. A la cuenta oficial de PUJAMOTOR USA.\n3. Por un link de pago (a Copart o a PUJAMOTOR USA).\n\nUna vez realizado el pago, en uno o dos días recibirá la factura cancelada y Copart Delivery coordinará el envío directamente hasta su domicilio (aproximadamente entre $400 y $850 USD).\n\nLe recordamos que nuestro fee de servicio ($300 a $500 USD) lo cancela únicamente cuando tenga el carro en sus manos.\n\nPor favor, confírmenos apenas reciba el correo de Copart con la factura para apoyarle con cualquier detalle.\n\nAtentamente,\n${
        ctx.advisorName || "[Nombre del Asesor]"
      }\nBroker Especialista — PUJAMOTOR USA\nCompra Inteligente. Puja con Confianza.`,
  },
  {
    id: "TPL_DESVIO_DEJEME_PENSARLO",
    stepNumber: "Desvío",
    stageCode: "CLIENTE_PENSANDO",
    title: "Desvío: 'Déjeme pensarlo' / 'Le aviso' (Literal PDF 1)",
    channel: "WHATSAPP",
    description: "Respuesta obligatoria e inmediata cuando el cliente dice 'déjeme pensarlo'. Sin presionar; seguimiento a los 2 a 4 días.",
    generateText: () =>
      `Claro que sí, estaré muy pendiente de usted. Para lo que necesite, simplemente me escribe. Recuerde que todos los vehículos de subasta tienen un tiempo, entonces el vehículo que le gustó hoy, de pronto ya no lo vemos mañana. Pero no hay ningún problema, quedo muy atento.`,
  },
  {
    id: "TPL_SEGUIMIENTO_2_A_4_DIAS",
    stepNumber: "Desvío - Seguimiento",
    stageCode: "CLIENTE_PENSANDO",
    title: "Seguimiento a los 2 a 4 Días (Literal PDF 1 Pág. 14/27)",
    channel: "WHATSAPP",
    description: "Contacto cordial a los 2 a 4 días con vehículos frescos parecidos al de la búsqueda.",
    generateText: (ctx) =>
      `Hola ${ctx.clientName || "[Nombre]"}, ¿cómo está? Le cuento que hoy salieron unos vehículos muy parecidos a los que estábamos viendo, con muy buen precio. Si quiere, me avisa y se los comparto para que los revise.`,
  },
];

// Alias para retrocompatibilidad
export const TPL_PASO_01_SALUDO = COMMERCIAL_TEMPLATES[0].generateText({});
export const TPL_PASO_02_DATOS_BUSQUEDA = COMMERCIAL_TEMPLATES[1].generateText({});
export const TPL_PASO_03_BUSQUEDA_Y_ENVIO = COMMERCIAL_TEMPLATES[2].generateText({});
export const TPL_PASO_04_VALIDAR_ELECCION = COMMERCIAL_TEMPLATES[3].generateText({});
export const TPL_PASO_05_EXPLICAR_PROCESO = COMMERCIAL_TEMPLATES[4].generateText({});
export const TPL_PASO_06_CONTRATO_Y_DOCUMENTOS = COMMERCIAL_TEMPLATES[5].generateText({});
export const TPL_PASO_07_MONTAR_OFERTA_ACCESO = COMMERCIAL_TEMPLATES[6].generateText({});
export const TPL_PASO_08_PROXIMOS_LOTES_VIVO = COMMERCIAL_TEMPLATES[7].generateText({});
export const TPL_PASO_09_CIERRE_SUBASTA_VENTA_FINALIZADA = COMMERCIAL_TEMPLATES[8].generateText({});
export const TPL_PASO_10_CORREO_SUBASTA_GANADA = COMMERCIAL_TEMPLATES[9].generateText({});

