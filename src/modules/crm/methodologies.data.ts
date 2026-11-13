// ============================================================================
// PUJAMOTOR USA — METODOLOGÍA COMERCIAL OFICIAL (PDF 1)
// Fuente de verdad literal: "Generar dinero haciendo caso — Proceso comercial y guion de ventas"
// Marca exclusiva: PUJAMOTOR USA · Compra Inteligente. Puja con Confianza.
// ============================================================================

export interface MethodologyStep {
  stepNumber: number;
  name: string;
  objective: string;
  triggerIn: string;
  triggerOut: string;
  whatAdvisorDoes: string[];
  howAdvisorDoesIt: string[];
  whatToSayToClient: string;
  questionsToAsk: string[];
  infoToRegister: string[];
  preflightChecks: string[];
  readyMessageTemplate: string;
  expectedResult: string;
  errorsToAvoid: string[];
  objectionHandling: Array<{
    objection: string;
    script: string;
    explanation: string;
  }>;
  referenceImages?: Array<{
    title: string;
    url: string;
    description: string;
    isAdvisorOnlyGuide?: boolean;
  }>;
  nonNegotiables: string[];
}

export interface MethodologyDefinition {
  id: "SUBASTA_PRO_USA" | "PUJAMOTOR_USA" | "MAPA_BROKERS" | "PUJAMOTOR_USA_OFICIAL";
  title: string;
  subtitle: string;
  tagline?: string;
  totalSteps: number;
  brokerFeeRange: string;
  brokerFeePaymentTiming: string;
  subUserPolicy?: string;
  invoicePolicy?: string;
  shippingPolicy?: string;
  paymentMethods?: string[];
  steps: MethodologyStep[];
  deviationThinking: {
    title: string;
    trigger: string;
    script: string;
    followUpDays: string;
    explanation: string;
    followUpScript: string;
    nonNegotiables: string[];
  };
  generalObjections: Array<{
    question: string;
    answerScript: string;
    keyRule: string;
  }>;
  prohibitedActions: string[];
  evaluationRubric?: any;
  teamRoutine?: any;
}

export const METHODOLOGY_PUJAMOTOR_USA: MethodologyDefinition = {
  id: "SUBASTA_PRO_USA",
  title: "Proceso Comercial y Guion de Ventas PUJAMOTOR USA",
  subtitle: "Metodología oficial de 10 Pasos basada en conversaciones reales que sí terminaron en venta (PDF 1)",
  tagline: "Compra Inteligente. Puja con Confianza.",
  totalSteps: 10,
  brokerFeeRange: "$300 a $500 USD (según el valor del vehículo)",
  brokerFeePaymentTiming: "Solo cuando el cliente ya tiene el carro en sus manos",
  subUserPolicy: "El cliente entra a la subasta en vivo con un sub-usuario que le creamos dentro de nuestra cuenta de broker en Copart",
  invoicePolicy: "Si se gana, Copart le envía la factura directamente a su correo, porque la compra se hace con la licencia de PUJAMOTOR USA",
  shippingPolicy: "Copart le envía directamente al cliente. Copart Delivery: aproximadamente entre $400 y $850",
  paymentMethods: [
    "1. Directo a la yard de Copart (anfitrión de la yard).",
    "2. Directo al broker, a la cuenta oficial de PUJAMOTOR USA.",
    "3. Link de pago al broker o a Copart."
  ],
  steps: [
    {
      stepNumber: 1,
      name: "Paso 1. Saludo",
      objective: "Abrir la conversación presentándote como broker especialista y dejar que el cliente hable primero.",
      triggerIn: "Recibes un contacto nuevo en WhatsApp.",
      triggerOut: "La persona dice que quiere buscar un vehículo o que necesita uno.",
      whatAdvisorDoes: [
        "Envía el saludo formal establecido inmediatamente sin cambiar palabras.",
        "Aguarda la respuesta del interesado sin presionar ni insistir."
      ],
      howAdvisorDoesIt: [
        "Copia el guion exacto sustituyendo únicamente [Nombre] por su nombre real.",
        "No envía audios ni archivos PDF en el primer contacto."
      ],
      whatToSayToClient:
        "“Hola, mucho gusto, habla con [Nombre], broker especialista en compra de vehículos en las subastas de Copart, una de las compañías más grandes del mundo en venta de vehículos de subasta de manera online. ¿Cómo le puedo ayudar el día de hoy?”",
      questionsToAsk: ["¿Cómo le puedo ayudar el día de hoy?"],
      infoToRegister: ["Nombre del prospecto", "Canal de contacto", "Hora de recepción"],
      preflightChecks: [
        "Comprobar que no se haya respondido con información de precios antes del saludo.",
        "Asegurar que el saludo contenga la mención a Copart y el rol de broker especialista."
      ],
      readyMessageTemplate:
        "Hola, mucho gusto, habla con {{advisorName}}, broker especialista en compra de vehículos en las subastas de Copart, una de las compañías más grandes del mundo en venta de vehículos de subasta de manera online. ¿Cómo le puedo ayudar el día de hoy?",
      expectedResult: "El cliente responde indicando qué vehículo busca o qué necesidad tiene.",
      errorsToAvoid: [
        "Responder con precios antes de saludar.",
        "Enviar audios en el primer mensaje.",
        "Cambiar las palabras del guion."
      ],
      objectionHandling: [],
      referenceImages: [
        {
          title: "Encabezado y Guía del Proceso Comercial Oficial",
          url: "/reference_images/subasta_pro_p1_img1.png",
          description: "Regla de oro del asesor: seguir el orden estricto de los pasos, usar las palabras exactas y no inventar nada.",
          isAdvisorOnlyGuide: true
        }
      ],
      nonNegotiables: [
        "Siempre saludas primero, sin importar qué te diga la persona.",
        "No respondes ninguna pregunta antes del saludo: ni precio, ni carro, ni proceso.",
        "El saludo se envía tal cual, sin cambiar palabras."
      ]
    },
    {
      stepNumber: 2,
      name: "Paso 2. Datos de búsqueda",
      objective: "Saber exactamente qué vehículo busca la persona: vehículo, año y presupuesto.",
      triggerIn: "La persona dice que quiere o necesita un vehículo.",
      triggerOut: "Tienes los tres datos: vehículo, año y presupuesto.",
      whatAdvisorDoes: [
        "Pide amablemente los 3 datos fundamentales sin interrogar.",
        "Registra los datos en el expediente del cliente."
      ],
      howAdvisorDoesIt: [
        "Envía el mensaje establecido explicando por qué se piden los datos.",
        "Si el cliente solo dice 'quiero información', le formula las mismas tres preguntas sin adelantar el proceso."
      ],
      whatToSayToClient:
        "“Claro que sí, nosotros le podemos ayudar a comprar su vehículo en las subastas de Copart. Por favor, indíqueme qué vehículo está buscando, desde qué año y qué presupuesto tiene. Esto con el fin de ayudarle a encontrar la mejor opción que se ajuste a sus necesidades. Quedo atento.”",
      questionsToAsk: [
        "¿Qué vehículo está buscando?",
        "¿Desde qué año?",
        "¿Qué presupuesto tiene?"
      ],
      infoToRegister: [
        "Marca y Modelo de interés",
        "Año mínimo aceptable",
        "Presupuesto máximo total con envío"
      ],
      preflightChecks: [
        "Verificar que se hayan recibido los 3 datos antes de buscar lotes en Copart."
      ],
      readyMessageTemplate:
        "Claro que sí, nosotros le podemos ayudar a comprar su vehículo en las subastas de Copart. Por favor, indíqueme qué vehículo está buscando, desde qué año y qué presupuesto tiene. Esto con el fin de ayudarle a encontrar la mejor opción que se ajuste a sus necesidades. Quedo atento.",
      expectedResult: "El cliente entrega el modelo, año y presupuesto disponible.",
      errorsToAvoid: [
        "Enviar vehículos antes de tener los 3 datos.",
        "Explicar el proceso completo en este paso."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "No envías vehículos hasta tener los tres datos: vehículo, año y presupuesto.",
        "No explicas el proceso en este paso."
      ]
    },
    {
      stepNumber: 3,
      name: "Paso 3. Búsqueda y envío de vehículos",
      objective: "Enviarle entre 4 y 7 opciones reales de Copart con enlace oficial y rango de oferta ideal.",
      triggerIn: "Tienes vehículo, año y presupuesto (o se acaba de perder una subasta).",
      triggerOut: "La persona escoge uno de los vehículos que le envías.",
      whatAdvisorDoes: [
        "Envía primero el mensaje obligatorio antes de buscar: 'Claro que sí. Inmediatamente le voy a buscar unos vehículos...'",
        "Busca en Copart filtrando: 1. Referencia, 2. Run and Drive, 3. Clean Title, 4. Año, 5. Ordenar por fecha de subasta (10 horas a 2 días).",
        "Millaje: Preferible menos de 100,000 millas. Si no hay, igual se envían opciones; nunca se deja a la persona sin alternativas.",
        "Calcula la oferta ideal usando las tablas: 40%-60% del valor minorista estimado o 60%-75% de compra inmediata.",
        "Envía entre 4 y 7 opciones con enlaces directos de Copart y debajo de cada enlace: 'valor por el que podemos ofertar'."
      ],
      howAdvisorDoesIt: [
        "Asegura que el valor a ofertar nunca supere el presupuesto del cliente.",
        "No explica el proceso completo en este paso."
      ],
      whatToSayToClient:
        "“Claro que sí. Inmediatamente le voy a buscar unos vehículos de acuerdo a lo que me dice y le voy a enviar los links. Recuerde que esos links son directamente de la página de Copart, ahí puede ver toda la información del vehículo. Nosotros somos su broker: le damos acceso a la subasta con nuestra licencia y le gestionamos toda la compra.”",
      questionsToAsk: [
        "¿Cuál o cuáles de estas opciones le llaman más la atención para revisarlas en detalle?"
      ],
      infoToRegister: [
        "Lotes de Copart enviados (entre 4 y 7)",
        "Valor minorista / Compra inmediata de cada uno",
        "Tope de oferta calculado para cada opción"
      ],
      preflightChecks: [
        "Confirmar que todos sean Clean Title y Run & Drive.",
        "Confirmar que los enlaces sean directos de copart.com.",
        "Confirmar que sean mínimo 4 y máximo 7 opciones."
      ],
      readyMessageTemplate:
        "Claro que sí. Inmediatamente le voy a buscar unos vehículos de acuerdo a lo que me dice y le voy a enviar los links. Recuerde que esos links son directamente de la página de Copart, ahí puede ver toda la información del vehículo. Nosotros somos su broker: le damos acceso a la subasta con nuestra licencia y le gestionamos toda la compra.",
      expectedResult: "El cliente responde eligiendo uno de los vehículos: 'me gusta este'.",
      errorsToAvoid: [
        "Enviar menos de 4 o más de 7 vehículos.",
        "Enviar vehículos sin título limpio o sin Run and Drive.",
        "Enviar opciones por encima del presupuesto del cliente.",
        "Explicar el proceso antes de que elija un carro."
      ],
      objectionHandling: [],
      referenceImages: [
        {
          title: "Filtros Obligatorios de Búsqueda en Copart",
          url: "/reference_images/subasta_pro_p5_img1.jpeg",
          description: "Filtros en Copart: Run and Drive, Clean Title, año, ordenar por fecha de la subasta. Regla de selección del PDF 1.",
          isAdvisorOnlyGuide: true
        }
      ],
      nonNegotiables: [
        "Nunca menos de 4 ni más de 7 vehículos.",
        "Siempre título limpio y Run and Drive.",
        "Siempre enlaces directos de Copart.",
        "El valor a ofertar nunca supera el presupuesto del cliente.",
        "Millaje: Preferible menos de 100,000 millas. Si no hay, igual se envían opciones; nunca se deja a la persona sin alternativas.",
        "En este paso todavía no se explica el proceso completo."
      ]
    },
    {
      stepNumber: 4,
      name: "Paso 4. Validar la elección y ofrecer llamada",
      objective: "Hacer que el cliente sienta que eligió bien, escuchar una voz real y ofrecer llamada.",
      triggerIn: "La persona dice 'me gusta este' o elige un vehículo específico.",
      triggerOut: "La persona elige si prefiere llamada o mensaje.",
      whatAdvisorDoes: [
        "Abre el lote en Copart y valida personalmente: arranca, buen interior, título limpio.",
        "Valida la elección con el texto textual y ofrece la llamada para explicar el proceso."
      ],
      howAdvisorDoesIt: [
        "Si el carro está bien, envía el guion con entusiasmo genuino.",
        "Si el carro tiene un detalle oculto, se lo dice con honestidad y le recomienda otra de las opciones enviadas."
      ],
      whatToSayToClient:
        "“Ha elegido una muy buena opción. Dentro de lo que le envié, para mí era la mejor. Verifiqué: prende y anda, buen interior, título limpio. Realmente es una muy buena opción. Ahora le voy a explicar cómo es todo el proceso para comprarlo en la subasta. ¿Quiere que le llame o prefiere que se lo explique por mensaje?”",
      questionsToAsk: [
        "¿Quiere que le llame o prefiere que se lo explique por mensaje?"
      ],
      infoToRegister: [
        "Lote elegido por el cliente",
        "Preferencia de contacto: Llamada telefónica o Mensaje"
      ],
      preflightChecks: [
        "Haber ingresado a Copart a verificar fotos y condición del lote antes de validar."
      ],
      readyMessageTemplate:
        "Ha elegido una muy buena opción. Dentro de lo que le envié, para mí era la mejor. Verifiqué: prende y anda, buen interior, título limpio. Realmente es una muy buena opción. Ahora le voy a explicar cómo es todo el proceso para comprarlo en la subasta. ¿Quiere que le llame o prefiere que se lo explique por mensaje?",
      expectedResult: "El cliente indica si prefiere llamada o mensaje.",
      errorsToAvoid: [
        "Describir el carro sin haber entrado a Copart a revisarlo primero.",
        "Olvidar ofrecer la llamada."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "Nunca describes un carro sin haber entrado a revisarlo primero en Copart.",
        "Siempre ofreces la llamada."
      ]
    },
    {
      stepNumber: 5,
      name: "Paso 5. Explicar el proceso",
      objective: "Explicar el proceso completo en orden estricto dejando claro que es una oferta en subasta y gana la puja más alta.",
      triggerIn: "La persona eligió llamada o mensaje.",
      triggerOut: "Terminaste la explicación completa en este orden exacto.",
      whatAdvisorDoes: [
        "Explica el proceso completo respetando el orden estricto: contrato → sub-usuario → subasta en vivo → factura → formas de pago → envío.",
        "Menciona que el fee es de $300 a $500 y se paga únicamente cuando tenga el carro en sus manos."
      ],
      howAdvisorDoesIt: [
        "Por llamada o mensaje, recita el monólogo completo sin omitir párrafos ni alterar el orden.",
        "Subraya que la subasta la gana quien haga la oferta más alta y nadie puede garantizar que se gana."
      ],
      whatToSayToClient:
        "“Le voy a indicar cómo es todo el proceso. Es muy sencillo. Nosotros le gestionamos todo ante Copart; usted no se tiene que preocupar por nada.\n\nLo primero es elegir el vehículo, y eso ya lo hicimos juntos. El segundo paso es firmar un contrato donde van sus datos, los datos del vehículo y nuestro fee de servicio. Ese fee lo paga únicamente cuando tenga el carro en sus manos.\n\nEn el contrato también va el monto máximo que nos autoriza a ofertar por el vehículo. Ese contrato es lo que Copart nos exige para entrar a la subasta a su nombre.\n\nLuego le creamos un sub-usuario dentro de nuestra cuenta de broker en Copart. Con ese acceso usted entra con nosotros a la subasta en vivo y ve las pujas en tiempo real. Nosotros ofertamos desde nuestra cuenta sin pasar del monto que usted autorizó.\n\nAl final, la subasta la gana quien haga la oferta más alta. Nadie le puede garantizar que se gana. Si ganamos, Copart le envía directamente a su correo la factura del vehículo. En esa factura ya están incluidos todos los impuestos y lo que cobra Copart hasta entregar el título en su casa.\n\nEsa factura la puede pagar de tres formas: directo a la yard de Copart, a la cuenta oficial de PUJAMOTOR USA, o por un link de pago a Copart o a nosotros. Usted elige la que le quede más cómoda.\n\nDespués del pago, en uno o dos días recibe la factura cancelada. Y en unos días más Copart Delivery le contacta para coordinar la entrega hasta donde usted quiera. El envío cuesta aproximadamente entre $400 y $850.\n\nBásicamente es eso. Somos sus asesores: le damos acceso con nuestra licencia, entramos con usted a la subasta y le gestionamos toda la compra. La factura le llega de Copart y el carro se lo envía Copart directamente a usted.”",
      questionsToAsk: [
        "¿Tiene alguna otra duda?"
      ],
      infoToRegister: [
        "Confirmación de explicación completa",
        "Canal utilizado (llamada o mensaje)"
      ],
      preflightChecks: [
        "Verificar que se hayan cubierto los 6 puntos en el orden estricto."
      ],
      readyMessageTemplate:
        "Le voy a indicar cómo es todo el proceso. Es muy sencillo. Nosotros le gestionamos todo ante Copart; usted no se tiene que preocupar por nada.\n\nLo primero es elegir el vehículo, y eso ya lo hicimos juntos. El segundo paso es firmar un contrato donde van sus datos, los datos del vehículo y nuestro fee de servicio. Ese fee lo paga únicamente cuando tenga el carro en sus manos.\n\nEn el contrato también va el monto máximo que nos autoriza a ofertar por el vehículo. Ese contrato es lo que Copart nos exige para entrar a la subasta a su nombre.\n\nLuego le creamos un sub-usuario dentro de nuestra cuenta de broker en Copart. Con ese acceso usted entra con nosotros a la subasta en vivo y ve las pujas en tiempo real. Nosotros ofertamos desde nuestra cuenta sin pasar del monto que usted autorizó.\n\nAl final, la subasta la gana quien haga la oferta más alta. Nadie le puede garantizar que se gana. Si ganamos, Copart le envía directamente a su correo la factura del vehículo. En esa factura ya están incluidos todos los impuestos y lo que cobra Copart hasta entregar el título en su casa.\n\nEsa factura la puede pagar de tres formas: directo a la yard de Copart, a la cuenta oficial de PUJAMOTOR USA, o por un link de pago a Copart o a nosotros. Usted elige la que le quede más cómoda.\n\nDespués del pago, en uno o dos días recibe la factura cancelada. Y en unos días más Copart Delivery le contacta para coordinar la entrega hasta donde usted quiera. El envío cuesta aproximadamente entre $400 y $850.\n\nBásicamente es eso. Somos sus asesores: le damos acceso con nuestra licencia, entramos con usted a la subasta y le gestionamos toda la compra. La factura le llega de Copart y el carro se lo envía Copart directamente a usted.",
      expectedResult: "El cliente comprende el orden y pasa a resolver dudas y contrato.",
      errorsToAvoid: [
        "Alterar el orden de los temas.",
        "Prometer o garantizar que la subasta se gana.",
        "Omitir que el fee se paga solo al recibir el carro."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "Se explica SIEMPRE en este orden: contrato → sub-usuario → subasta en vivo → factura → formas de pago → envío.",
        "Siempre se dice que es una oferta y que gana la puja más alta.",
        "Siempre se dice que el fee se paga solo al recibir el carro."
      ]
    },
    {
      stepNumber: 6,
      name: "Paso 6. Resolver dudas y contrato",
      objective: "Asegurar que entregue su documento sin miedos pendientes y entienda lo que firma.",
      triggerIn: "Terminaste de explicar el proceso.",
      triggerOut: "El contrato está firmado.",
      whatAdvisorDoes: [
        "Pregunta primero: '¿Tiene alguna otra duda?'.",
        "Si hay dudas, las responde con las respuestas de objeciones. No pide documentos mientras tenga dudas.",
        "Cuando ya no hay dudas, pide la licencia de conducir o pasaporte con el guion exacto.",
        "Arma el contrato con los 4 puntos: comprador, vehículo, fee ($300-$500) y monto máximo a ofertar.",
        "Explica los 4 puntos antes de enviarlo y recuerda que se carga en Copart para crear su sub-usuario."
      ],
      howAdvisorDoesIt: [
        "Recibe el documento de identidad.",
        "Arma el contrato y lo envía.",
        "Recuerda que el fee solo se paga al recibir el vehículo."
      ],
      whatToSayToClient:
        "“¿Tiene alguna otra duda?”\n\n[Cuando ya no hay dudas]:\n“Bueno, como le dije, lo primero era elegir el vehículo, y ya se hizo. Ahora debemos firmar el contrato. Por favor envíeme su licencia de conducir o pasaporte para hacer el contrato y enviárselo. El contrato es muy sencillo y lo exige Copart: van sus datos, los nuestros, cuánto se va a ofertar, la descripción del vehículo y nuestro fee. Nada más. Con eso también le creamos su sub-usuario para que entre a la subasta en vivo.”",
      questionsToAsk: [
        "¿Tiene alguna otra duda?"
      ],
      infoToRegister: [
        "Documento de identidad (licencia o pasaporte)",
        "Monto máximo autorizado a ofertar",
        "Fee fijado en contrato ($300 a $500)"
      ],
      preflightChecks: [
        "Verificar que no queden dudas antes de pedir la identificación.",
        "Verificar que el contrato contenga los 4 puntos exigidos."
      ],
      readyMessageTemplate:
        "¿Tiene alguna otra duda?\n\nBueno, como le dije, lo primero era elegir el vehículo, y ya se hizo. Ahora debemos firmar el contrato. Por favor envíeme su licencia de conducir o pasaporte para hacer el contrato y enviárselo. El contrato es muy sencillo y lo exige Copart: van sus datos, los nuestros, cuánto se va a ofertar, la descripción del vehículo y nuestro fee. Nada más. Con eso también le creamos su sub-usuario para que entre a la subasta en vivo.",
      expectedResult: "El cliente envía su identificación y firma el contrato.",
      errorsToAvoid: [
        "Pedir documento de identidad teniendo dudas abiertas.",
        "Armar contrato sin documento de identidad.",
        "Fijar un fee superior a $500."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "NUNCA pides el documento mientras tenga dudas pendientes.",
        "Sin documento de identidad no se arma el contrato.",
        "Siempre explicas los 4 puntos antes de enviarlo.",
        "Siempre mencionas que se carga en el sistema de Copart.",
        "Siempre dices que tendrá su sub-usuario.",
        "El fee siempre entre $300 y $500."
      ]
    },
    {
      stepNumber: 7,
      name: "Paso 7. Montar la oferta y enviar el acceso",
      objective: "Montar la oferta en Copart con el contrato firmado y entregar el acceso de sub-usuario.",
      triggerIn: "El contrato está firmado.",
      triggerOut: "Le avisas que la oferta está montada y le envías sus datos de acceso.",
      whatAdvisorDoes: [
        "Al recibir el contrato firmado, le avisa: 'Listo, ya voy a cargar el contrato y a crear su sub-usuario. Montar la oferta en el sistema de Copart toma unas 2 o 3 horas...'",
        "Monta la oferta en Copart con el contrato firmado.",
        "Crea el sub-usuario del cliente dentro de la cuenta de broker de PUJAMOTOR USA.",
        "Le avisa al cliente que la oferta ya quedó montada y le envía sus datos de acceso antes de la subasta."
      ],
      howAdvisorDoesIt: [
        "No deja al cliente sin noticias después de entregar su documento.",
        "Asegura que el cliente tenga sus credenciales antes del día del remate."
      ],
      whatToSayToClient:
        "“Listo, ya voy a cargar el contrato y a crear su sub-usuario. Montar la oferta en el sistema de Copart toma unas 2 o 3 horas. En el momento en que quede todo listo le envío su acceso y le aviso. Estaré muy pendiente de la subasta.”",
      questionsToAsk: [
        "¿Pudo acceder con sus credenciales de sub-usuario a la plataforma de Copart?"
      ],
      infoToRegister: [
        "Sub-usuario generado en Copart",
        "Oferta registrada en el sistema de Copart",
        "Aviso 1 registrado y enviado"
      ],
      preflightChecks: [
        "Avisar el tiempo de 2 a 3 horas.",
        "Verificar que las credenciales de sub-usuario estén activas."
      ],
      readyMessageTemplate:
        "Listo, ya voy a cargar el contrato y a crear su sub-usuario. Montar la oferta en el sistema de Copart toma unas 2 o 3 horas. En el momento en que quede todo listo le envío su acceso y le aviso. Estaré muy pendiente de la subasta.\n\n[Al finalizar la carga]:\nSu oferta ya quedó debidamente montada en Copart. Aquí tiene su acceso de sub-usuario para acompañar la subasta en vivo: Usuario: {{subUser}} | Clave: {{subPassword}} | Enlace: {{copartLiveUrl}}",
      expectedResult: "El cliente recibe el aviso de tiempo y sus credenciales de sub-usuario.",
      errorsToAvoid: [
        "Dejar al cliente sin noticias después de entregar su documento.",
        "No avisar cuando la oferta está montada.",
        "No enviar el sub-usuario antes de la subasta."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "Siempre se le dice al cliente el tiempo de 2 a 3 horas antes de empezar.",
        "Siempre se le avisa cuando la oferta ya está montada.",
        "Nunca se deja al cliente sin ese aviso.",
        "Siempre se le envía su acceso de sub-usuario antes de la subasta."
      ]
    },
    {
      stepNumber: 8,
      name: "Paso 8. Acompañamiento en la subasta en vivo",
      objective: "Que el cliente vea que su vehículo está en la subasta y pueda seguirla él mismo con su sub-usuario.",
      triggerIn: "Ya le avisaste que la oferta está montada y le enviaste su acceso.",
      triggerOut: "Termina la subasta.",
      whatAdvisorDoes: [
        "1. Unas 2 horas antes de la subasta entras a Copart con tu usuario.",
        "2. Abres el enlace del vehículo.",
        "3. Das clic en 'Sumarse a subasta en vivo' (imagen 1).",
        "4. Ubicas el vehículo del cliente en 'Próximos lotes', donde se ven los minutos que faltan (imagen 2).",
        "5. Revisas la puja actual: nunca puede estar por encima de la oferta que vamos a hacer.",
        "6. Tomas el pantallazo y se lo envías al cliente avisándole que su vehículo ya está en la subasta.",
        "7. En el mismo mensaje le recuerdas que entre con su sub-usuario a la subasta en vivo, con el enlace del vehículo, para que vea en directo si la gana o no."
      ],
      howAdvisorDoesIt: [
        "No llama al cliente durante la subasta: solo envía el pantallazo auténtico y el mensaje operativo.",
        "No agrega discursos comerciales inventados."
      ],
      whatToSayToClient:
        "[Se adjunta pantallazo de imagen 2: vehículo en 'Próximos lotes' con los minutos que faltan]\n\n“Su vehículo ya está en la subasta. Recuerde entrar con su sub-usuario a la subasta en vivo con este link: {{lotUrl}} para que vea en directo si la gana o no.”",
      questionsToAsk: [
        "¿Pudo ingresar a la subasta en vivo con su sub-usuario y el link del vehículo?"
      ],
      infoToRegister: [
        "Pantallazo de 'Próximos lotes' capturado y enviado (Aviso 2)",
        "Puja previa revisada antes del inicio de subasta"
      ],
      preflightChecks: [
        "Comprobar que el pantallazo sea el de adentro de la subasta con los minutos restantes.",
        "Revisar que la puja actual no supere la oferta máxima autorizada."
      ],
      readyMessageTemplate:
        "[Se adjunta pantallazo de imagen 2: vehículo en 'Próximos lotes' con los minutos que faltan]\n\nSu vehículo ya está en la subasta. Recuerde entrar con su sub-usuario a la subasta en vivo con este link: {{lotUrl}} para que vea en directo si la gana o no.",
      expectedResult: "El cliente ingresa con su sub-usuario y ve la subasta en directo.",
      errorsToAvoid: [
        "No revisar la puja actual antes de enviar el pantallazo.",
        "No enviar el pantallazo de 'Próximos lotes'.",
        "No recordar el acceso con sub-usuario."
      ],
      objectionHandling: [],
      referenceImages: [
        {
          title: "Imagen 1: Botón «Sumarse a subasta en vivo»",
          url: "/reference_images/subasta_pro_p11_img1.jpeg",
          description: "Referencia visual para que el asesor sepa dónde hacer clic antes de la subasta (exclusivo guía interna).",
          isAdvisorOnlyGuide: true
        },
        {
          title: "Imagen 2: Vehículo en «Próximos lotes» y minutos restantes",
          url: "/reference_images/subasta_pro_p11_img2.jpeg",
          description: "Pantalla de subasta en vivo con el vehículo bajo 'Próximos lotes' y contador de minutos. Es el pantallazo obligatorio a enviar al cliente.",
          isAdvisorOnlyGuide: false
        }
      ],
      nonNegotiables: [
        "Siempre se envía el pantallazo con el vehículo en 'Próximos lotes'.",
        "Siempre se revisa la puja actual antes de la subasta.",
        "Siempre se le recuerda entrar con su propio acceso."
      ]
    },
    {
      stepNumber: 9,
      name: "Paso 9. Cierre de la subasta",
      objective: "Que el cliente vea el resultado con evidencia visual mediante el pantallazo auténtico de 'Venta finalizada'.",
      triggerIn: "El vehículo pasa por la subasta en vivo.",
      triggerOut: "Tienes el pantallazo de 'Venta finalizada' y confirmas si se ganó o se perdió.",
      whatAdvisorDoes: [
        "1. Esperas a que el vehículo pase por la subasta.",
        "2. Tomas el pantallazo donde aparece 'Venta finalizada' (imagen 3).",
        "3. Confirmas en la cuenta de broker si el lote quedó a nuestro nombre.",
        "4. Le envías el pantallazo al cliente con el resultado.",
        "5. Si se ganó: pasas al Paso 10.",
        "6. Si se perdió: se lo dices con las palabras exactas y vuelves al Paso 3 para buscar otro vehículo."
      ],
      howAdvisorDoesIt: [
        "Nunca da el resultado solo por mensaje sin el pantallazo auténtico.",
        "Antes de decir que se ganó, confirma formalmente en la cuenta de broker."
      ],
      whatToSayToClient:
        "[Si se perdió]:\n“No pasa nada. Si no ganamos, usted no paga nada y seguimos buscando otra opción que se ajuste a su presupuesto. Cada semana salen miles de vehículos a subasta en Copart.”",
      questionsToAsk: [
        "¿Desea que busquemos otras alternativas de inmediato para la subasta de mañana?"
      ],
      infoToRegister: [
        "Pantallazo de 'Venta finalizada' (Aviso 3)",
        "Resultado confirmado en cuenta de broker: GANADA o PERDIDA"
      ],
      preflightChecks: [
        "Tener guardado el pantallazo oficial de 'Venta finalizada'.",
        "Confirmar adjudicación en la cuenta de broker antes de cantar victoria."
      ],
      readyMessageTemplate:
        "[Se adjunta pantallazo auténtico de 'Venta finalizada']\n\nNo pasa nada. Si no ganamos, usted no paga nada y seguimos buscando otra opción que se ajuste a su presupuesto. Cada semana salen miles de vehículos a subasta en Copart.",
      expectedResult: "Si se ganó, pasa al correo del Paso 10. Si se perdió, vuelve al Paso 3 inmediatamente.",
      errorsToAvoid: [
        "Dar el resultado solo por mensaje sin el pantallazo.",
        "Avisar como ganada sin confirmar en la cuenta de broker.",
        "Dejar al cliente sin nuevas opciones si se perdió."
      ],
      objectionHandling: [],
      referenceImages: [
        {
          title: "Imagen 3: Pantalla «Venta finalizada»",
          url: "/reference_images/subasta_pro_p12_img1.jpeg",
          description: "Ficha del vehículo en Copart con la etiqueta 'Venta finalizada' visible. Evidencia obligatoria requerida para comunicar el resultado.",
          isAdvisorOnlyGuide: false
        }
      ],
      nonNegotiables: [
        "Siempre se envía el pantallazo de 'Venta finalizada'.",
        "Nunca se da el resultado solo por mensaje sin el pantallazo.",
        "Antes de decir que se ganó, confirmas en la cuenta de broker.",
        "Sin pantallazo y sin confirmar que se ganó, NO se avisa como ganada.",
        "Si se perdió, nunca se deja sin nuevas opciones."
      ]
    },
    {
      stepNumber: 10,
      name: "Paso 10. Correo de subasta ganada",
      objective: "Notificarle formalmente que ganó y acompañarle hasta que pague y reciba el carro.",
      triggerIn: "Tienes el pantallazo de 'Venta finalizada' y confirmaste que el lote se ganó.",
      triggerOut: "El cliente recibe el vehículo en sus manos y liquida el fee de $300 a $500.",
      whatAdvisorDoes: [
        "1. Unos 30 minutos después de terminar la subasta, envías el correo notificando que ganó.",
        "2. En el correo le recuerdas que la factura le llega de Copart a su correo y las 3 formas de pago.",
        "3. Le escribes para confirmar que recibió el correo de Copart con la factura.",
        "Verifica que el cliente reciba los 4 avisos oficiales del proceso."
      ],
      howAdvisorDoesIt: [
        "El correo sale de la cuenta oficial de PUJAMOTOR USA con nombre y firma.",
        "Nunca imita el diseño ni el remitente de un correo de Copart.",
        "Supervisa los pagos exclusivamente por las 3 formas oficiales."
      ],
      whatToSayToClient:
        "“¡Felicitaciones! Acabamos de ganar su vehículo en la subasta en vivo de Copart. En este momento le acabo de enviar a su correo la confirmación oficial junto con el pantallazo de 'Venta finalizada'. En breve Copart le enviará directamente a su correo la factura oficial con los taxes e impuestos incluidos.\n\nRecuerde que esa factura la puede pagar de 3 formas: directo a la yard de Copart, a la cuenta oficial de PUJAMOTOR USA, o por link de pago. Una vez cancelada, Copart Delivery coordinará la entrega hasta donde usted quiera. Nuestro fee lo paga solo cuando tenga el carro en sus manos. Por favor avíseme apenas reciba la factura de Copart.”",
      questionsToAsk: [
        "¿Recibió ya el correo de Copart con la factura oficial?",
        "¿Cuál de las 3 formas de pago le resulta más conveniente?"
      ],
      infoToRegister: [
        "Correo oficial de subasta ganada enviado (Aviso 4)",
        "Confirmación de recepción de factura oficial de Copart",
        "Forma de pago seleccionada",
        "Coordinación de Copart Delivery",
        "Cobro del fee contra entrega efectiva del vehículo"
      ],
      preflightChecks: [
        "Verificar que exista el pantallazo de 'Venta finalizada'.",
        "Comprobar que el correo salga de cuenta oficial con nombre y firma de PUJAMOTOR USA."
      ],
      readyMessageTemplate:
        "Asunto: Confirmación de Lote Ganado #{{lotNumber}} — PUJAMOTOR USA\n\nEstimado/a {{clientName}},\n\nLe confirmamos que acabamos de ganar el lote #{{lotNumber}} en la subasta en vivo de Copart.\n\nAdjuntamos a este correo el pantallazo oficial de 'Venta finalizada' y la confirmación de adjudicación.\n\nEn breve Copart le enviará la factura oficial del vehículo directamente a su correo. En esa factura ya están incluidos todos los impuestos y lo que cobra Copart hasta entregar el título en su casa.\n\nEsa factura la puede pagar de tres formas:\n1. Directo a la yard de Copart.\n2. A la cuenta oficial de PUJAMOTOR USA.\n3. Por un link de pago (a Copart o a PUJAMOTOR USA).\n\nUna vez realizado el pago, en uno o dos días recibirá la factura cancelada y Copart Delivery coordinará el envío directamente hasta su domicilio (aproximadamente entre $400 y $850 USD).\n\nLe recordamos que nuestro fee de servicio ($300 a $500 USD) lo cancela únicamente cuando tenga el carro en sus manos.\n\nPor favor, confírmenos apenas reciba el correo de Copart con la factura para apoyarle con cualquier detalle.\n\nAtentamente,\n{{advisorName}}\nBroker Especialista — PUJAMOTOR USA\nCompra Inteligente. Puja con Confianza.",
      expectedResult: "El cliente confirma recepción de factura de Copart, realiza el pago oficial, recibe el carro y liquida el fee.",
      errorsToAvoid: [
        "Enviar el correo sin pantallazo de 'Venta finalizada'.",
        "Imitar el diseño de los correos de Copart.",
        "Recibir pagos en cuentas personales de asesores.",
        "Cobrar el fee antes de que el cliente tenga el carro en sus manos."
      ],
      objectionHandling: [],
      nonNegotiables: [
        "El correo solo se envía si existe el pantallazo de 'Venta finalizada' y se confirmó que se ganó.",
        "El correo sale de la cuenta oficial de PUJAMOTOR USA con nombre y firma.",
        "Nunca se imita el diseño ni el remitente de un correo de Copart.",
        "Los pagos solo por las 3 formas oficiales.",
        "Nunca en cuentas personales de asesores."
      ]
    }
  ],
  deviationThinking: {
    title: "Desvío: 'Déjeme pensarlo' / 'Le aviso'",
    trigger: "En cualquier paso la persona dice 'déjeme pensarlo' o 'le aviso'.",
    script:
      "“Claro que sí, estaré muy pendiente de usted. Para lo que necesite, simplemente me escribe. Recuerde que todos los vehículos de subasta tienen un tiempo, entonces el vehículo que le gustó hoy, de pronto ya no lo vemos mañana. Pero no hay ningún problema, quedo muy atento.”",
    followUpDays: "2 a 4 días",
    explanation:
      "No se presiona ni se insiste varias veces seguidas. La urgencia es la de la subasta, no la del asesor. Se marca al cliente en lista de seguimiento y si no escribe, se le vuelve a contactar a los 2 a 4 días.",
    followUpScript:
      "“Hola [Nombre], ¿cómo está? Le cuento que hoy salieron unos vehículos muy parecidos a los que estábamos viendo, con muy buen precio. Si quiere, me avisa y se los comparto para que los revise.”",
    nonNegotiables: [
      "Nunca se presiona ni se insiste varias veces seguidas.",
      "La urgencia es la de la subasta, no la del asesor.",
      "Siempre se hace el seguimiento a los 2 a 4 días."
    ]
  },
  generalObjections: [
    {
      question: "¿Y si es una estafa?",
      answerScript:
        "“Lo entiendo perfectamente. Por eso trabajamos así: usted entra a la subasta en vivo con su propio sub-usuario y ve todo lo que pasa. Si ganamos, la factura le llega directamente del correo oficial de Copart. El vehículo se lo envía Copart directamente a usted. Y nuestro fee lo paga solo cuando tenga el carro en sus manos. Esa es la tranquilidad que le puedo dar, y está comprando con una de las empresas de subasta más reconocidas del mundo.”",
      keyRule: "Reconocer primero el sentimiento y dar las pruebas verificables: sub-usuario, factura de Copart, entrega directa de Copart y fee al tener el carro en mano."
    },
    {
      question: "¿A quién le pago?",
      answerScript:
        "“Usted elige: directo a la yard de Copart, a nuestra cuenta oficial de PUJAMOTOR USA o por un link de pago, ya sea a Copart o a PUJAMOTOR USA. Nunca a la cuenta personal de un asesor.”",
      keyRule: "Tres formas oficiales autorizadas. Jamás recibir dinero en cuentas personales."
    },
    {
      question: "¿Y si el carro no está bueno?",
      answerScript:
        "“Todos los vehículos que le busco en Copart están en muy buen estado, verificados por Copart y revisados por nosotros, y van con título limpio. Pero lo más importante es que en el momento en que usted firme el contrato, vamos a sacar el reporte de Carfax del vehículo, y ahí vamos a saber cómo ha estado, qué mantenimientos tiene y toda la información que da Carfax. Esa es la tranquilidad que le va a dar a usted.”",
      keyRule: "Destacar título limpio, Run and Drive y el reporte Carfax estipulado en el contrato."
    },
    {
      question: "¿Y si no ganamos la subasta?",
      answerScript:
        "“No pasa nada. Si no ganamos, usted no paga nada y seguimos buscando otra opción que se ajuste a su presupuesto. Cada semana salen miles de vehículos a subasta en Copart.”",
      keyRule: "Costo cero para el cliente si no se gana y vuelta inmediata al Paso 3."
    }
  ],
  prohibitedActions: [
    "Inventar cosas para vender: cifras, testimonios, garantías o tiempos de entrega que no estén en este documento.",
    "Prometer que el cliente se gana la subasta — es una oferta y gana la puja más alta.",
    "Pedir o recibir dinero del vehículo antes de que llegue el correo de Copart con la factura.",
    "Dar formas de pago distintas a las tres oficiales.",
    "Recibir pagos en cuentas personales de asesores.",
    "Cobrar el fee antes de que el cliente tenga el carro en sus manos.",
    "Explicar todo el proceso antes de que el cliente elija un carro.",
    "Pedir el documento de identidad mientras tenga dudas.",
    "Describir un carro sin haberlo revisado primero en Copart.",
    "Presionar, insistir repetidamente o atacar al cliente.",
    "Imitar el diseño o remitente de correos de Copart."
  ],
  evaluationRubric: [
    { stepNumber: 1, question: "¿Saludó primero con nombre, rol y mencionó Copart?", passRule: "Uso del saludo oficial sin audios ni PDFs." },
    { stepNumber: 2, question: "¿Preguntó vehículo, año y presupuesto?", passRule: "Las 3 preguntas exactas antes de enviar lotes." },
    { stepNumber: 3, question: "¿Dijo que los links son de Copart y que somos su broker?", passRule: "Mención expresa de licencia y enlaces de Copart." },
    { stepNumber: 3, question: "¿Envió de 4 a 7 opciones que cumplen los criterios con su rango de oferta?", passRule: "Solo Clean Title, Run & Drive, rango de oferta y millaje preferente." },
    { stepNumber: 4, question: "¿Validó la elección tras revisar el carro?", passRule: "Verificación en Copart (prende y anda, buen interior, título limpio) antes de responder." },
    { stepNumber: 4, question: "¿Ofreció llamada para explicar el proceso?", passRule: "Ofrecer si quiere llamada o mensaje." },
    { stepNumber: 5, question: "¿Explicó todo en orden: contrato → sub-usuario → subasta → factura → pago → fee al recibir?", passRule: "Los 6 temas en el orden exacto del PDF 1." },
    { stepNumber: 6, question: "¿Preguntó si había otra duda antes de pedir la licencia?", passRule: "Cero dudas pendientes antes de pedir identificación." },
    { stepNumber: "7 a 10", question: "¿Dio los 4 avisos tras firmar el contrato?", passRule: "Aviso 1 (Acceso), Aviso 2 (Próximos lotes), Aviso 3 (Venta finalizada), Aviso 4 (Confirmación + Factura Copart)." },
    { stepNumber: "Desvío", question: "Si dijo 'déjeme pensarlo', ¿hizo seguimiento a los 2 a 4 días?", passRule: "Respetar tiempo y contactar a los 2 a 4 días con vehículos parecidos." }
  ],
  teamRoutine: [
    { frequency: "Diario", action: "Cada asesor reporta números y se publica el ranking de contratos firmados.", purpose: "Métrica principal del equipo." },
    { frequency: "Diario", action: "Cada asesor envía 2 chats para revisión con la rúbrica de 10 puntos.", purpose: "Asegurar que se sigan los pasos sin inventar nada." },
    { frequency: "Semanal", action: "Práctica de objeciones en parejas.", purpose: "Dominio natural de las respuestas del PDF." },
    { frequency: "Antes de atender leads", action: "Cada asesor practica el Paso 5 completo con el coordinador.", purpose: "Verificación de la explicación ordenada del proceso." },
    { frequency: "Cada 2 semanas", action: "Revisión individual de desempeño.", purpose: "Alineación de resultados y contratos firmados." }
  ]
};

// ----------------------------------------------------------------------------
// EXPORTS OFICIALES Y CONSTANTES
// ----------------------------------------------------------------------------
export const METHODOLOGY_SUBASTA_PRO_USA = METHODOLOGY_PUJAMOTOR_USA;

export const ALL_METHODOLOGIES = {
  SUBASTA_PRO_USA: METHODOLOGY_SUBASTA_PRO_USA,
  PUJAMOTOR_USA: METHODOLOGY_PUJAMOTOR_USA,
};

export const NON_NEGOTIABLE_RULES = [
  {
    rule: "Nunca cobrar la comisión/fee antes de que el cliente tenga el auto en sus manos.",
    explanation: "El fee establecido es de $300 a $500 USD (según el valor del vehículo) y se cobra exclusivamente cuando el cliente tiene el vehículo en sus manos.",
  },
  {
    rule: "Nunca recibir dinero en cuentas personales de asesores.",
    explanation: "Los pagos se realizan únicamente por las 3 vías oficiales autorizadas: directo a la yard de Copart, a la cuenta oficial de PUJAMOTOR USA, o por link de pago seguro.",
  },
  {
    rule: "Nunca enviar menos de 4 ni más de 7 opciones, ni vehículos que no sean Clean Title y Run and Drive.",
    explanation: "El cliente debe recibir entre 4 y 7 alternativas auténticas de Copart con Run and Drive y título limpio. Millaje preferible menos de 100,000 millas (si no hay, igual se envían opciones; nunca se deja a la persona sin alternativas).",
  },
  {
    rule: "Nunca dar por ganada una subasta sin el pantallazo oficial de 'Venta finalizada'.",
    explanation: "Toda victoria debe ser respaldada con el pantallazo oficial de 'Venta finalizada' y la confirmación de adjudicación en la cuenta de broker.",
  },
  {
    rule: "Respetar el desvío 'Déjeme pensarlo' sin presionar jamás.",
    explanation: "Cuando un prospecto dice 'déjeme pensarlo' o 'le aviso', no se insiste repetidamente; se programa un seguimiento respetuoso a los 2 a 4 días con vehículos frescos.",
  },
];

export const OBJECTIONS_HANDBOOK = [
  {
    objection: "¿Y si es una estafa?",
    script: "Lo entiendo perfectamente. Por eso trabajamos así: usted entra a la subasta en vivo con su propio sub-usuario y ve todo lo que pasa. Si ganamos, la factura le llega directamente del correo oficial de Copart. El vehículo se lo envía Copart directamente a usted. Y nuestro fee lo paga solo cuando tenga el carro en sus manos. Esa es la tranquilidad que le puedo dar, y está comprando con una de las empresas de subasta más reconocidas del mundo.",
    explanation: "Reconocer primero el temor del comprador y desarticularlo con las 4 pruebas de transparencia absoluta.",
  },
  {
    objection: "¿A quién le pago?",
    script: "Usted elige: directo a la yard de Copart, a nuestra cuenta oficial de PUJAMOTOR USA o por un link de pago, ya sea a Copart o a PUJAMOTOR USA. Nunca a la cuenta personal de un asesor.",
    explanation: "Garantizar seguridad bancaria institucional y eliminar sospechas de intermediarios informales.",
  },
  {
    objection: "¿Y si el carro no está bueno?",
    script: "Todos los vehículos que le busco en Copart están en muy buen estado, verificados por Copart y revisados por nosotros, y van con título limpio. Pero lo más importante es que en el momento en que usted firme el contrato, vamos a sacar el reporte de Carfax del vehículo, y ahí vamos a saber cómo ha estado, qué mantenimientos tiene y toda la información que da Carfax. Esa es la tranquilidad que le va a dar a usted.",
    explanation: "Destacar condición Run & Drive, título limpio y el reporte Carfax oficial estipulado en el contrato.",
  },
  {
    objection: "¿Y si no ganamos la subasta?",
    script: "No pasa nada. Si no ganamos, usted no paga nada y seguimos buscando otra opción que se ajuste a su presupuesto. Cada semana salen miles de vehículos a subasta en Copart.",
    explanation: "Costo cero para el cliente si la subasta se pierde y reanudación inmediata de búsqueda en Paso 3.",
  },
];

export const TEN_QUESTIONS_RUBRIC = [
  { number: 1, question: "¿Saludó primero con nombre, rol y mencionó Copart?", step: "Paso 1" },
  { number: 2, question: "¿Preguntó vehículo, año y presupuesto?", step: "Paso 2" },
  { number: 3, question: "¿Dijo que los links son de Copart y que somos su broker?", step: "Paso 3" },
  { number: 4, question: "¿Envió de 4 a 7 opciones que cumplen los criterios con su rango de oferta?", step: "Paso 3" },
  { number: 5, question: "¿Validó la elección tras revisar el carro?", step: "Paso 4" },
  { number: 6, question: "¿Ofreció llamada para explicar el proceso?", step: "Paso 4" },
  { number: 7, question: "¿Explicó todo en orden: contrato → sub-usuario → subasta → factura → pago → fee al recibir?", step: "Paso 5" },
  { number: 8, question: "¿Preguntó si había otra duda antes de pedir la licencia?", step: "Paso 6" },
  { number: 9, question: "¿Dio los 4 avisos tras firmar el contrato?", step: "Pasos 7 a 10" },
  { number: 10, question: "Si dijo 'déjeme pensarlo', ¿hizo seguimiento a los 2 a 4 días?", step: "Desvío" },
];

export const TEAM_ROUTINE = {
  morning: "Reporte diario de números y publicación del ranking de contratos firmados (meta: 5 a 6 contratos por semana).",
  midday: "Práctica de objeciones en parejas y simulación previa del Paso 5 con el coordinador antes de atender leads.",
  afternoon: "Acompañamiento en subasta en vivo: pantallazo de 'Próximos lotes' 2 horas antes y recordatorio de sub-usuario.",
  evening: "Envío diario de 2 chats por asesor para auditoría contra la rúbrica de 10 puntos (meta requerida: 9 o 10 puntos).",
};
