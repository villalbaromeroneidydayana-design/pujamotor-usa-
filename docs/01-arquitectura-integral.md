# AUTOS USA — Etapa 1: Arquitectura Integral y Especificación Técnica

> [!IMPORTANT]
> Este documento constituye el entregable formal de la **Primera Etapa Obligatoria** antes de escribir código de interfaz o construir módulos aislados. Define los cimientos arquitectónicos, contratos entre módulos, modelo de datos, estrategia de integración legítima con Copart, seguridad y costos operativos reales.

---

## 1. Arquitectura General de la Plataforma

### 1.1 Principios Rectores de Diseño
1. **Arquitectura Monolítica Modular (Clean / Hexagonal Architecture)**: Todos los dominios de negocio viven en un único repositorio fuertemente tipado, con fronteras de módulo explícitas y comunicación mediante interfaces y eventos de dominio. Esto evita tanto el caos de un código espagueti como la sobrecarga operativa prematura de microservicios distribuidos, permitiendo extraer cualquier módulo (ej. el *Worker de Sincronización*) a un servicio independiente en el futuro sin reescribir la lógica de negocio.
2. **Separación Estricta de Veracidad y Entorno (`Real` vs. `Pendiente` vs. `Demo`)**: Ningún registro entra a la base de datos sin metadatos de trazabilidad (`dataOrigin`, `verificationStatus`, `isDemoData`). El catálogo público y los reportes filtran por defecto cualquier registro marcado como demostración, o lo etiquetan con advertencias visuales inconfundibles en entornos de prueba.
3. **Desacoplamiento de Fuentes de Subasta (Patrón Adapter/Strategy)**: El Motor Central de Vehículos no depende de un formato único de Copart. Consume un contrato estandarizado (`AuctionDataSourceAdapter`), lo que permite alternar o combinar importaciones oficiales CSV de miembros de Copart, feeds B2B autorizados bajo contrato y decodificación oficial de VIN (NHTSA vPIC API).
4. **Transparencia Comercial y Legal**: La plataforma incluye por diseño avisos legales explícitos indicando que **AUTOS USA es un servicio independiente de asesoría, logística e intermediación y no es representante oficial ni propiedad de Copart Inc. ni de IAA (Insurance Auto Auctions)**. Asimismo, todas las salidas de la calculadora se almacenan y presentan como **estimaciones referenciales parametrizadas**, nunca como cotizaciones contractuales cerradas ni cobros automáticos ficticios.

### 1.2 Stack Tecnológico Propuesto
| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Aplicación & API** | **Next.js (App Router) + TypeScript (Strict Mode)** | Renderizado híbrido (SSR para SEO en fichas de vehículos del catálogo público; CSR/Server Actions seguros para panel administrativo y calculadora interactiva). |
| **Base de Datos Principal** | **PostgreSQL 16 + Prisma ORM** | Integridad referencial estricta, transacciones ACID para historial de cambios de lotes, índices compuestos para búsqueda avanzada y soporte JSONB para atributos específicos por tipo de vehículo. |
| **Validación y Contratos** | **Zod** | Validación estricta en tiempo de ejecución para payloads de ingesta, archivos CSV, formularios comerciales y respuestas de API. |
| **Procesamiento Asíncrono** | **BullMQ + Redis** (con fallback en proceso local para desarrollo) | Ejecución en segundo plano de ingesta de catálogos, verificación de integridad de lotes, descarga autorizada de imágenes y alertas de cambio de estado. |
| **Almacenamiento de Medios** | **Almacenamiento Compatible con S3 (AWS S3 / Cloudflare R2)** + Storage Local Abstraído | Almacenamiento de fotografías autorizadas e informes documentales (PDFs de condición, manifiestos, cotizaciones) con control de permisos. |
| **Autenticación y Seguridad** | **Auth.js (NextAuth) + RBAC + Argon2id** | Control de acceso basado en roles, sesiones firmadas y registro inmutable de auditoría (`AuditLog`) para cada acción administrativa. |
| **Estilos e Identidad Visual** | **Tailwind CSS + Sistema de Diseño Propio ("Precision Automotive")** | Estética industrial automotriz de alto contraste, tipografía técnica tabular para precios/VIN/lotes, adaptable 100% a móvil y escritorio. |

### 1.3 Estructura de Carpetas y Módulos (`d:\AUTOS USA`)

```text
d:\AUTOS USA\
├── docs/                                # Documentación arquitectónica, contratos y manuales operativos
├── prisma/
│   ├── schema.prisma                    # Esquema relacional completo y auditable
│   ├── migrations/                      # Historial versionado de base de datos
│   └── seed-demo.ts                     # Semilla aislada y etiquetada explícitamente como DEMO_SANDBOX
├── src/
│   ├── config/                          # Validación de variables de entorno (Zod) y constantes globales
│   ├── shared/                          # Utilidades transversales, errores tipados, logger, tipos base
│   │   ├── errors/
│   │   ├── logging/
│   │   ├── storage/                     # Interfaz StorageProvider (Local / S3 / R2)
│   │   └── event-bus/                   # Bus de eventos interno para desacoplar módulos
│   ├── modules/                         # MÓDULOS DE DOMINIO (Comunicación exclusiva por interfaces/servicios)
│   │   ├── ingestion/                   # 1. Integración Copart y Fuentes Externas
│   │   │   ├── contracts/               # Interfaces de proveedores (IAuctionDataProvider)
│   │   │   ├── providers/
│   │   │   │   ├── copart-csv.provider.ts       # Ingesta oficial CSV de Miembro Copart
│   │   │   │   ├── copart-b2b-api.provider.ts   # Adaptador preparado para convenio B2B / API autorizada
│   │   │   │   └── nhtsa-vin.provider.ts        # Enriquecimiento técnico oficial vía NHTSA vPIC (EE. UU.)
│   │   │   ├── validators/              # Reglas de normalización y detección de datos incompletos
│   │   │   └── ingestion.service.ts     # Orquestador de lotes de importación y trazabilidad
│   │   ├── vehicles/                    # 2. Motor Central de Vehículos
│   │   │   ├── domain/                  # Entidades, máquina de estados del lote, reglas de completitud
│   │   │   ├── repositories/            # Persistencia transaccional y registro de historial de cambios
│   │   │   └── vehicle-engine.service.ts# API interna para consulta, actualización y versionado
│   │   ├── catalog/                     # 3. Catálogo Público y Comparador
│   │   │   ├── search.service.ts        # Búsqueda facetada, filtros dinámicos y ordenamiento
│   │   │   └── comparison.service.ts    # Comparador técnico lado a lado de lotes seleccionados
│   │   ├── calculator/                  # 4. Calculadora Paramétrica de Costos de Importación
│   │   │   ├── engine/                  # Motor determinista de cálculo (subasta, flete, aduana, broker)
│   │   │   ├── rules/                   # Tablas tarifarias versionadas y editables desde el admin
│   │   │   └── calculator.service.ts    # Generación de simulaciones no vinculantes con desglose completo
│   │   ├── crm/                         # 6. Sistema Comercial y Seguimiento de Clientes
│   │   │   ├── leads.service.ts         # Gestión de prospectos, consultas por lote y trazabilidad
│   │   │   ├── quotes.service.ts        # Solicitudes de cotización vinculadas a simulaciones de costos
│   │   │   └── advisory.service.ts      # Expedientes de asesoría de compra, logística y exportación
│   │   └── admin/                       # 5. Gobernanza, RBAC y Auditoría
│   │       ├── auth.service.ts          # Autenticación, permisos por rol y políticas de acceso
│   │       └── audit.service.ts         # Registro inmutable de operaciones de usuarios y sistema
│   ├── app/                             # Capa de Presentación y Rutas Next.js
│   │   ├── (public)/                    # Catálogo público, ficha de lote, comparador, calculadora, contacto
│   │   ├── (admin)/admin/               # Panel administrativo protegido por RBAC
│   │   └── api/                         # Endpoints REST internos con validación y rate-limiting
└── tests/                               # Suite de pruebas unitarias, de integración y seguridad
```

---

## 2. Diagrama de Módulos y Conexiones

### 2.1 Arquitectura de Comunicación entre Módulos

```mermaid
flowchart TD
    subgraph External["Fuentes Externas Legítimas"]
        COPART_CSV["Exportación Oficial CSV Miembro Copart"]
        COPART_B2B["API / Feed B2B Copart (Con Credenciales)"]
        NHTSA["API Oficial NHTSA vPIC (Decodificación VIN)"]
        STORAGE["Almacenamiento S3 / R2 (Fotos Autorizadas y Docs)"]
    end

    subgraph CorePlatform["AUTOS USA — Núcleo Modular"]
        INGEST["Módulo 1: Ingesta y Conectores (IngestionService)"]
        ENGINE["Módulo 2: Motor Central de Vehículos (VehicleEngineService)"]
        CALC["Módulo 4: Motor Calculadora de Costos (CalculatorService)"]
        CATALOG["Módulo 3: Servicio de Catálogo y Comparador (CatalogService)"]
        CRM["Módulo 6: Sistema Comercial y Cotizaciones (CrmService)"]
        ADMIN["Módulo 5: Administración, RBAC y Auditoría (Admin & AuditService)"]
        EVENT_BUS(("Bus de Eventos de Dominio"))
    end

    subgraph Presentation["Interfaces de Usuario"]
        PUB_UI["Portal Público Web & Móvil (Catálogo, Ficha, Comparador, Simulador)"]
        ADM_UI["Panel Administrativo (Operaciones, Tarifas, Lotes, CRM, Auditoría)"]
    end

    COPART_CSV --> INGEST
    COPART_B2B --> INGEST
    NHTSA --> INGEST

    INGEST -->|"1. Normaliza, valida y envía DTO"| ENGINE
    ENGINE <-->|"2. Gestiona activos vinculados"| STORAGE
    ENGINE -->|"3. Emite LotUpdated / PriceChanged"| EVENT_BUS

    CATALOG -->|"Consulta lotes verificados"| ENGINE
    CALC -->|"Lee precio base / ubicación del lote"| ENGINE
    CRM -->|"Vincula lote + simulación de costos"| ENGINE
    CRM -->|"Solicita desglose estimado"| CALC

    ADMIN -->|"Configura tarifas, aprueba lotes, audita"| ENGINE
    ADMIN -->|"Actualiza matrices de costos y aduanas"| CALC
    ADMIN -->|"Gestiona leads y asesorías"| CRM
    EVENT_BUS -->|"Registra trazabilidad"| ADMIN

    PUB_UI --> CATALOG
    PUB_UI --> CALC
    PUB_UI --> CRM
    ADM_UI --> ADMIN
    ADM_UI --> INGEST
```

### 2.2 Flujo Secuencial: Desde la Ingesta del Lote hasta la Solicitud de Asesoría Comercial

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operador / Proceso Sincronización
    participant Ing as Módulo Ingesta (Copart Adapter)
    participant Eng as Motor Central de Vehículos
    participant Aud as Módulo Auditoría
    actor Cli as Cliente / Comprador
    participant Cat as Catálogo Público
    participant Cal as Calculadora de Costos
    participant Crm as Sistema Comercial (CRM)

    Op->>Ing: Carga feed autorizado (CSV Miembro Copart / API B2B)
    Ing->>Ing: Valida estructura, calcula hash SHA-256 y detecta campos faltantes
    Ing->>Eng: upsertVehicleAndLot(NormalizedLotDTO, sourceMeta)
    Eng->>Eng: Compara con versión previa (detecta cambio de puja, fecha o estado)
    Eng->>Eng: Evalúa completitud (CONFIRMED vs INCOMPLETE) y guarda VehicleSnapshot
    Eng->>Aud: Registra evento LOT_INGESTED / LOT_UPDATED
    
    Cli->>Cat: Busca y filtra vehículos (Marca, Año, Daño, Ubicación, Precio)
    Cat->>Eng: Consulta lotes activos (excluyendo DEMO si entorno es Producción)
    Eng-->>Cat: Lotes validados con indicador de estado de datos
    Cat-->>Cli: Muestra ficha técnica, fotos autorizadas y estado de subasta

    Cli->>Cal: Simula importación (Precio puja + Estado origen + Puerto destino)
    Cal->>Cal: Calcula tarifas subasta, grúa interna, flete marítimo, aduana y broker
    Cal-->>Cli: Entrega desglose estimado con aviso legal "No constituye cotización final"

    Cli->>Crm: Envía "Solicitar Información / Asesoría sobre este Lote"
    Crm->>Cal: Congela copia de la simulación (`CostEstimateSnapshot`)
    Crm->>Aud: Registra creación de Lead y Solicitud de Asesoría
    Crm-->>Cli: Confirmación con código de seguimiento comercial
```

---

## 3. Modelo de Base de Datos Relacional

### 3.1 Decisiones Clave del Modelo de Datos
- **Separación entre `Vehicle` (identidad física del automóvil) y `AuctionLot` (evento de subasta)**: Un mismo vehículo (identificado por su VIN o huella única) puede pasar por más de una subasta (ej. no alcanzó reserva y se reprograma con otro número de lote o nueva fecha). Separar ambas entidades evita duplicar información técnica y permite conservar el historial completo.
- **Control de Calidad y Demostración (`dataEnvironment` y `completenessStatus`)**:
  - `dataEnvironment`: `PRODUCTION_REAL` (datos legítimos de fuentes autorizadas) vs. `DEMO_SANDBOX` (datos sintéticos claramente etiquetados para pruebas de interfaz).
  - `completenessStatus`: `CONFIRMED` (todos los campos críticos verificados), `PENDING_VERIFICATION` (requiere revisión de operador, ej. VIN parcial o fotos pendientes), `INCOMPLETE` (faltan datos obligatorios para publicar en el catálogo público).
- **Inmutabilidad del Historial (`LotChangeHistory`)**: Cada vez que una sincronización modifica el precio de puja (`currentBid`), el precio *Buy It Now*, la fecha de subasta o el estado del lote, se inserta un registro histórico con el valor anterior, el valor nuevo, la fuente y la marca de tiempo.

### 3.2 Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    DATA_SOURCE ||--o{ INGESTION_BATCH : "ejecuta"
    INGESTION_BATCH ||--o{ AUCTION_LOT : "actualiza_o_crea"
    VEHICLE ||--o{ AUCTION_LOT : "se_subasta_en"
    AUCTION_LOT ||--o{ LOT_CHANGE_HISTORY : "registra_cambios"
    AUCTION_LOT ||--o{ VEHICLE_MEDIA : "contiene_fotos"
    AUCTION_LOT ||--o{ VEHICLE_DOCUMENT : "adjunta_docs"
    AUCTION_LOT ||--o{ COST_ESTIMATE : "simula_costos"
    AUCTION_LOT ||--o{ QUOTE_REQUEST : "motiva_consulta"
    CUSTOMER_LEAD ||--o{ QUOTE_REQUEST : "solicita"
    CUSTOMER_LEAD ||--o{ ADVISORY_CASE : "contrata_asesoria"
    CUSTOMER_LEAD ||--o{ CRM_INTERACTION : "historial_contacto"
    TARIFF_RULE_SET ||--o{ COST_ESTIMATE : "parametriza"
    USER ||--o{ AUDIT_LOG : "ejecuta_accion"
    USER ||--o{ ADVISORY_CASE : "asignado_a"

    DATA_SOURCE {
        string id PK
        string code UK "COPART_CSV, COPART_B2B_API, MANUAL_VERIFIED"
        string name
        string integrationType "CSV_FEED, REST_API, SFTP, MANUAL"
        boolean isActive
        datetime lastSyncAt
    }

    INGESTION_BATCH {
        string id PK
        string dataSourceId FK
        string fileHashSha256 "Trazabilidad de archivo importado"
        int totalRecords
        int processedRecords
        int incompleteRecords
        int failedRecords
        string status "RUNNING, COMPLETED, FAILED, PARTIAL"
        datetime startedAt
        datetime completedAt
    }

    VEHICLE {
        string id PK
        string internalCode UK "Identificador unico interno AUTOS-XXXX"
        string vin "Nullable si la fuente no lo publica completo"
        boolean isVinMasked "Indica si el VIN esta parcialmente oculto"
        string make "Marca (ej. Ford, Toyota)"
        string model "Modelo (ej. F-150, Camry)"
        string trim "Version (ej. Lariat, SE)"
        int year "Anio modelo"
        string bodyStyle "SUV, Sedan, Pickup, Coupe"
        string engineSpec "Cilindrada y configuracion"
        string transmission "Automatic, Manual, CVT"
        string drivetrain "AWD, 4WD, FWD, RWD"
        string fuelType "Gasoline, Hybrid, Electric, Diesel"
        string exteriorColor
        string dataEnvironment "PRODUCTION_REAL | DEMO_SANDBOX"
    }

    AUCTION_LOT {
        string id PK
        string vehicleId FK
        string dataSourceId FK
        string lastBatchId FK
        string lotNumber UK "Numero de lote de subasta"
        string yardName "Sede Copart (ej. TX - HOUSTON)"
        string yardState "Estado de EE. UU. (ej. TX, FL, CA)"
        string yardCity
        string yardZip
        int odometerValue "Lectura de odometro"
        string odometerUnit "MILES | KM"
        string odometerBrand "ACTUAL, EXEMPT, NOT_ACTUAL, INOPERABLE"
        string titleCode "Codigo original del titulo"
        string titleCategory "CLEAN, SALVAGE, REBUILT, NON_REPAIRABLE, BILL_OF_SALE"
        string primaryDamage "Front End, Rear End, Side, Hail, Water/Flood"
        string secondaryDamage
        string runAndDriveStatus "RUNS_AND_DRIVES, ENGINE_START_PROGRAM, ENHANCED, STATIONARY"
        boolean hasKeys
        decimal estimatedRetailValue "ACV / Valor comercial estimado en EE. UU."
        decimal currentBidUsd "Puja actual en USD"
        decimal buyItNowPriceUsd "Precio compra inmediata (Nullable)"
        string currency "USD"
        datetime auctionDate "Fecha y hora programada de subasta"
        string saleStatus "UPCOMING, LIVE, ON_APPROVAL, SOLD, NO_SALE, ARCHIVED"
        string completenessStatus "CONFIRMED, PENDING_VERIFICATION, INCOMPLETE"
        jsonb missingFields "Lista de campos pendientes para control de calidad"
        boolean isPublished "Visible en catalogo publico"
        datetime sourceQueriedAt "Fecha exacta de consulta en la fuente"
        datetime updatedAt
    }

    LOT_CHANGE_HISTORY {
        string id PK
        string auctionLotId FK
        string changedByUserId FK "Null si fue sincronizacion automatica"
        string changeSource "SYNC_BATCH | ADMIN_OVERRIDE"
        jsonb previousValues "Snapshot de campos antes del cambio"
        jsonb newValues "Snapshot de campos nuevos"
        datetime createdAt
    }

    VEHICLE_MEDIA {
        string id PK
        string auctionLotId FK
        string mediaType "PHOTO_EXTERIOR, PHOTO_INTERIOR, PHOTO_ENGINE, PHOTO_DAMAGE, VIDEO"
        string storageKey "Ruta en S3/Storage autorizado"
        string originReference "Referencia de autorizacion de la imagen"
        boolean isAuthorizedCopy "Confirmacion de licencia/autorizacion de uso"
        int sortOrder
        boolean isPrimary
    }

    TARIFF_RULE_SET {
        string id PK
        string versionName "Vigencia tarifaria (ej. Q4-2026)"
        boolean isActive
        jsonb auctionFeeSchedule "Escala de tarifas de subasta y virtual bid fee"
        jsonb brokerFeeRules "Comision de intermediario/broker autorizado"
        jsonb inlandTransportMatrix "Tarifas de grua desde yardas de EE. UU. a puertos de salida"
        jsonb oceanFreightRates "Fletes maritimos RORO / Contenedor por puerto destino"
        jsonb destinationCustomsRules "Arancel, IVA, tasas portuarias y documentacion por pais"
        datetime effectiveFrom
    }

    COST_ESTIMATE {
        string id PK
        string auctionLotId FK
        string tariffRuleSetId FK
        string destinationCountry "Pais destino de importacion"
        string departurePort "Puerto EE. UU. (ej. Miami, Houston, Savannah, Newark)"
        string arrivalPort "Puerto de destino"
        decimal bidAmountUsd "Precio de compra base simulado"
        decimal auctionFeesUsd "Tarifas de subasta estimadas"
        decimal brokerFeeUsd "Tarifa de intermediario/licencia"
        decimal inlandTransportUsd "Grua terrestre en EE. UU."
        decimal oceanFreightUsd "Transporte maritimo + seguro sugerido"
        decimal documentationFeesUsd "Gastos de exportacion, Shipper Export Declaration, BL"
        decimal customsAndTaxesUsd "Aranceles e impuestos de nacionalizacion estimados"
        decimal additionalCostsUsd "Otros costos parametrizables"
        decimal totalEstimatedUsd "Total general estimado"
        string disclaimerText "Texto legal de estimacion no vinculante"
        datetime createdAt
    }

    CUSTOMER_LEAD {
        string id PK
        string fullName
        string email
        string phoneWhatsapp
        string country
        string city
        string customerType "INDIVIDUAL_BUYER, DEALER, IMPORTER, WORKSHOP"
        string status "NEW, CONTACTED, QUALIFIED, IN_ADVISORY, CLOSED_LOST"
        datetime createdAt
    }

    QUOTE_REQUEST {
        string id PK
        string referenceCode UK "COT-2026-XXXX"
        string customerLeadId FK
        string auctionLotId FK
        string costEstimateId FK
        decimal maxBudgetUsd
        string requestedServices "ADVISORY_ONLY, FULL_TURNKEY_IMPORT, INLAND_TRANSPORT, EXPORT_ONLY"
        string customerNotes
        string status "PENDING_REVIEW, RESPONDED, EXPIRED"
        datetime createdAt
    }
```

---

## 4. Estrategia de Integración Autorizada con Copart

### 4.1 Diagnóstico Técnico y Legal Real sobre Copart
1. **Inexistencia de una API pública abierta**: Copart **no ofrece una API REST pública y abierta al público general**. El acceso programático directo a sus servidores requiere acuerdos comerciales corporativos (B2B Partner / Broker / Affiliate Data Feed).
2. **Prohibición de Scraping y Copia No Autorizada de Imágenes**: El uso de bots de raspado web (*web scraping*), la evasión de protecciones anti-bot (Cloudflare/Imperva) o la descarga/hotlinking masivo no autorizado de fotografías desde los servidores de Copart infringe los Términos de Servicio de Copart (`copart.com/termsOfService`) y las leyes de propiedad intelectual. **AUTOS USA no implementará scrapers ni conectores piratas.**
3. **Mecanismos Técnicamente Viables y Autorizados**:
   Para que la plataforma funcione desde el primer día de forma 100% legítima y esté lista para escalar a un convenio directo cuando el negocio lo suscriba, diseñamos una **Arquitectura de Ingesta Multi-Conector (`IAuctionDataProvider`)** con tres canales autorizados:

| Canal de Integración | Nivel de Acceso Requerido | Funcionamiento Técnico en AUTOS USA | Estado en la Arquitectura |
| :--- | :--- | :--- | :--- |
| **A. Importador Oficial Copart Sales Data (CSV de Miembro)** | Cuenta de Miembro Registrado de Copart (Basic / Premier / Master) con acceso a *Download Sales Data* | El miembro autorizado descarga el archivo CSV oficial desde su portal de Copart y lo sube al Panel Administrativo (o carpeta SFTP local). El módulo `CopartCsvProvider` valida cabeceras, normaliza códigos de daño/título, calcula hash `SHA-256` para no duplicar cargas y actualiza precios/estados creando historial. | **Implementado y Operativo al 100% desde Fase 1** |
| **B. Conector B2B API / SFTP Feed Autorizado** | Contrato B2B directo con Copart o proveedor mayorista licenciado de datos de subasta | El módulo `CopartB2bApiProvider` implementa autenticación OAuth2 / API Key, paginación incremental por lotes modificados (`updatedSince`), circuit-breaker, reintentos exponenciales y sincronización de imágenes autorizadas hacia el bucket S3 propio. | **Arquitectura, Interfaces y Cliente HTTP listos (activable mediante variables de entorno al contar con credenciales)** |
| **C. Enriquecimiento Oficial NHTSA vPIC API + Carga Asistida de Lotes** | **Público y Oficial** (Departamento de Transporte de EE. UU. — NHTSA) | Cuando un asesor comercial o miembro ingresa un lote o VIN legítimo, el módulo `NhtsaVinProvider` consulta la API oficial del gobierno de EE. UU. (`vpic.nhtsa.dot.gov`) para autocompletar y verificar marca, modelo, año, motorización, transmisión, planta de fabricación y carrocería sin errores manuales. | **Implementado y Operativo al 100% desde Fase 1** |

### 4.2 Gestión Autorizada de Fotografías y Documentos
- El modelo de datos exige en cada registro de `VehicleMedia` los atributos `originReference` (fuente documental de la imagen) e `isAuthorizedCopy: boolean`.
- Las fotografías asociadas a un lote solo se publican en el catálogo público si:
  1. Provienen de un feed B2B con licencia de distribución de imágenes activa, o
  2. Fueron tomadas o adquiridas legítimamente por el equipo de inspección/intermediario autorizado (ej. reportes de inspección pre-compra pagados o fotos propias en patio/puerto), almacenadas en el almacenamiento propio de AUTOS USA (`StorageProvider`).
- Si un lote importado vía CSV de miembro aún no cuenta con fotografías con licencia de republicación pública, el Motor Central de Vehículos marca el lote con un estado visual claro **"Fotografías sujetas a verificación de cuenta / Solicitar dossier de inspección"** en lugar de incrustar enlaces no autorizados.

---

## 5. Requisitos de Acceso, Credenciales y Seguridad

### 5.1 Matriz de Variables de Entorno y Credenciales (`.env.example`)
Toda configuración sensible se valida al arranque del servidor mediante un esquema estricto de Zod (`src/config/env.ts`). Ninguna clave se escribe jamás en el código fuente:

```ini
# 1. Base de Datos y Persistencia
DATABASE_URL="postgresql://autos_user:password@localhost:5432/autos_usa?schema=public"

# 2. Seguridad, Sesiones y Cifrado
AUTH_SECRET="<secreto-criptografico-minimo-32-bytes>"
ENCRYPTION_KEY_PII="<llave-aes-256-para-datos-sensibles-clientes>"

# 3. Modo de Operación de Datos
# Si es "false", bloquea de forma absoluta cualquier lote con dataEnvironment = DEMO_SANDBOX en el catálogo público
ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG="false"

# 4. Integración Copart B2B (Opcional hasta disponer de credenciales corporativas)
COPART_INTEGRATION_MODE="CSV_MEMBER_EXPORT" # Valores: CSV_MEMBER_EXPORT | B2B_API_AUTHORIZED
COPART_B2B_API_BASE_URL=""
COPART_B2B_CLIENT_ID=""
COPART_B2B_CLIENT_SECRET=""
COPART_B2B_MEMBER_NUMBER=""

# 5. API Oficial NHTSA (Gobierno EE. UU. - Pública y Autorizada)
NHTSA_VPIC_API_URL="https://vpic.nhtsa.dot.gov/api/vehicles"

# 6. Almacenamiento de Fotografías Autorizadas y Documentos
STORAGE_DRIVER="LOCAL" # Valores: LOCAL | S3_COMPATIBLE
S3_BUCKET_NAME=""
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_ENDPOINT_URL=""
```

### 5.2 Control de Acceso Basado en Roles (RBAC)
| Rol | Permisos en la Plataforma |
| :--- | :--- |
| **`SUPER_ADMIN`** | Gestión total de usuarios, roles, credenciales de fuentes de información, reglas tarifarias de la calculadora y auditoría de seguridad. |
| **`INVENTORY_MANAGER`** | Ejecución de lotes de ingesta CSV/API, validación de lotes con información incompleta, carga de fotografías autorizadas, gestión de estados de disponibilidad. |
| **`COMMERCIAL_ADVISOR`** | Acceso al CRM: gestión de prospectos, respuesta a solicitudes de cotización, seguimiento de expedientes de asesoría, transporte y exportación. |
| **`AUDITOR_READONLY`** | Consulta exclusiva de registros de actividad (`AuditLog`), historial de cambios de lotes (`LotChangeHistory`) y trazabilidad de fuentes de información. |
| **`PUBLIC_VISITOR`** | Navegación en catálogo público de lotes confirmados, comparador de vehículos, simulador de costos de importación y envío de solicitudes de información/cotización. |

---

## 6. Plan de Pruebas Funcionales, de Integración y de Seguridad

Antes de dar por concluida cualquier fase de implementación, el sistema debe superar la siguiente batería de pruebas automatizadas:

### 6.1 Pruebas Unitarias (Lógica de Dominio)
1. **Motor de Completitud de Vehículos (`VehicleCompletenessValidator`)**:
   - Verificar que un lote sin `lotNumber`, `make`, `model`, `year`, `titleCategory` o `primaryDamage` sea clasificado automáticamente como `INCOMPLETE` y tenga `isPublished = false`.
   - Verificar que un lote con VIN enmascarado (ej. `1FA6P8CF*H*******`) sea aceptado con `isVinMasked = true` y `completenessStatus = PENDING_VERIFICATION` o `CONFIRMED` según las reglas del negocio.
2. **Motor de la Calculadora de Costos (`CostCalculatorEngine`)**:
   - Verificar exactitud matemática centavo a centavo en escalas por tramos (tarifa de subasta según monto de puja, comisión de broker con mínimo fijo, flete terrestre según estado de EE. UU. al puerto más cercano, flete marítimo y cálculo en cascada de CIF + Arancel + IVA según destino).
   - Verificar que toda simulación generada incluya obligatoriamente el metadato `isBindingQuote: false` y el texto legal de estimación.
3. **Aislamiento de Datos Demo (`DataEnvironmentGuard`)**:
   - Comprobar que cuando `ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG="false"`, el repositorio del catálogo público jamás devuelva registros con `dataEnvironment = DEMO_SANDBOX`.

### 6.2 Pruebas de Integración entre Módulos
1. **Flujo Ingesta CSV -> Motor Central -> Historial de Cambios**:
   - Importar un lote por primera vez y comprobar que se crean `Vehicle`, `AuctionLot` e `IngestionBatch`.
   - Re-importar el mismo lote con un nuevo `currentBidUsd` y distinta `auctionDate`; comprobar que **no se duplica** el vehículo ni el lote, sino que se actualiza el registro existente y se inserta automáticamente una fila en `LotChangeHistory` con los valores previos y nuevos.
2. **Flujo Catálogo -> Calculadora -> Solicitud Comercial (CRM)**:
   - Generar una simulación de costos para un lote específico y enviar una solicitud de cotización (`QuoteRequest`); verificar que la solicitud queda vinculada al lote exacto y a una instantánea inmutable (`CostEstimate`) de los parámetros vigentes en ese momento.

### 6.3 Pruebas de Seguridad y Protección de Datos
1. **Autorización de Rutas (RBAC)**: Verificar que un usuario no autenticado o con rol `COMMERCIAL_ADVISOR` reciba `403 Forbidden` al intentar modificar las tablas tarifarias o ejecutar una importación de catálogo.
2. **Sanitización de Archivos CSV y Prevención de CSV Injection**: Validar que fórmulas maliciosas en celdas CSV (`=CMD|...`, `+`, `-`, `@`) sean neutralizadas durante la ingesta.
3. **Inmutabilidad del Registro de Auditoría**: Verificar que toda acción de creación, edición o cambio de estado en el panel administrativo genere un registro en `AuditLog` con usuario, IP, entidad afectada y marca de tiempo.

---

## 7. Identificación de Limitaciones Técnicas y Costos Externos Reales

Para planificar con total realismo comercial y técnico, se documentan las limitaciones y costos externos inherentes al mercado de subastas de Estados Unidos:

### 7.1 Limitaciones Regulatorias y Operativas de Subastas en EE. UU.
1. **Restricciones de Licencia por Estado (Licensing Laws)**: En muchos estados de EE. UU. (ej. Texas, Florida, California, Georgia), un comprador particular o internacional **no puede pujar directamente** en la mayoría de los lotes de Copart sin una licencia de concesionario/deshuesadero (*Dealer / Dismantler / Exporter License*), debiendo operar a través de un **Broker / Master Member autorizado**. La calculadora de costos y el módulo comercial de AUTOS USA contemplan por ello el rubro específico de **Tarifa de Intermediario / Broker** cuando aplique.
2. **Disponibilidad de VIN Completo y Fotografías**:
   - Sin un acuerdo B2B corporativo con Copart, las exportaciones estándar o vistas públicas pueden omitir o enmascarar dígitos del VIN por políticas de privacidad del vendedor/aseguradora, y las fotografías en los servidores de Copart están sujetas a derechos de uso.
   - Nuestra arquitectura resuelve esto marcando explícitamente qué datos están confirmados y permitiendo adjuntar fotografías e informes de inspección propios o autorizados por lote.
3. **Variabilidad de Tarifas de Subasta y Fletes**:
   - Copart actualiza periódicamente sus tablas de *Buyer Fees*, *Virtual Bid Fees*, *Gate Fees*, *Environmental Fees* y cargos por almacenamiento (*Storage*).
   - Los fletes terrestres en EE. UU. (*Inland Towing*) fluctúan según el precio del diésel y la disponibilidad de transportistas (*Central Dispatch*), y los fletes marítimos varían según naviera y temporada.
   - Por esta razón, el módulo de Calculadora se diseña con **Matrices Tarifarias Versionadas y Editables desde el Panel Administrativo**, evitando valores fijos codificados en el programa (*hardcoded*).

### 7.2 Costos Externos Estimados para Operación en Producción Real
| Rubro Externo | Proveedor / Entidad | Naturaleza del Costo | Propósito en AUTOS USA |
| :--- | :--- | :--- | :--- |
| **Membresía / Cuenta Copart** | Copart Inc. | Anual (Membresía Premier + depósito de garantía reembolsable) | Acceso autorizado al portal de miembro, descarga oficial de *Sales Data CSV* y participación en subastas. |
| **Licencia de Datos B2B / API (Opcional para automatización total)** | Copart B2B / Proveedor Mayorista Autorizado de Datos de Subastas | Mensual por volumen / contrato corporativo | Sincronización automática en tiempo real de lotes e imágenes con licencia comercial de redistribución. |
| **Reportes de Historial Vehicular (Opcional bajo demanda)** | NMVTIS / Carfax / AutoCheck | Pago por reporte consultado | Verificación histórica de siniestros previos, lecturas de odómetro y gravámenes antes de pujar por un cliente. |
| **Infraestructura Cloud y Base de Datos** | VPS / Cloud (Vercel/AWS/Railway + PostgreSQL gestionado) | Mensual según tráfico | Alojamiento de la aplicación web, base de datos relacional y respaldos automáticos. |
| **Almacenamiento de Fotografías y Documentos** | Cloudflare R2 / AWS S3 | Pago por GB almacenado | Custodia segura de fotografías autorizadas, títulos escaneados, Bill of Lading (BL) y expedientes de clientes. |
