# AUTOS USA — Plataforma Automotriz Integral de Vehículos de Subasta (EE. UU.)

Plataforma profesional, completa y escalable diseñada bajo una **Arquitectura Monolítica Modular (Clean Architecture)** desde el inicio para la gestión de lotes de subasta de Estados Unidos, estimación paramétrica de costos logísticos/aduanales y seguimiento comercial auditado.

---

## Estructura de Módulos y Carpetas

- [01-arquitectura-integral.md](file:///d:/AUTOS%20USA/docs/01-arquitectura-integral.md) — Especificación arquitectónica completa, diagramas de módulos, ERD, estrategia de integración con Copart y análisis de limitaciones/costos externos.
- [schema.prisma](file:///d:/AUTOS%20USA/prisma/schema.prisma) — Esquema relacional completo con trazabilidad de fuente, lotes, historial de cambios, fotografías autorizadas, reglas tarifarias, simulaciones, CRM comercial y auditoría RBAC.
- `src/modules/ingestion/` — Conectores desacoplados:
  - [copart-csv.provider.ts](file:///d:/AUTOS%20USA/src/modules/ingestion/providers/copart-csv.provider.ts): Importador oficial de archivos *Sales Data CSV* para miembros de Copart con hash `SHA-256` y sanitización contra CSV Injection.
  - [copart-b2b-api.provider.ts](file:///d:/AUTOS%20USA/src/modules/ingestion/providers/copart-b2b-api.provider.ts): Conector preparado para convenio B2B / API autorizada de Copart mediante credenciales OAuth2.
  - [nhtsa-vin.provider.ts](file:///d:/AUTOS%20USA/src/modules/ingestion/providers/nhtsa-vin.provider.ts): Integración en tiempo real con la API pública y oficial del Departamento de Transporte de EE. UU. (`vpic.nhtsa.dot.gov`) para decodificación de VIN.
  - [lot-completeness.validator.ts](file:///d:/AUTOS%20USA/src/modules/ingestion/validators/lot-completeness.validator.ts): Clasificador automático de integridad (`CONFIRMED`, `PENDING_VERIFICATION`, `INCOMPLETE`).
- `src/modules/vehicles/` — [vehicle-engine.service.ts](file:///d:/AUTOS%20USA/src/modules/vehicles/vehicle-engine.service.ts): Motor central de vehículos con detección automática de cambios (`LotChangeHistory`), control de disponibilidad y separación estricta entre datos reales (`PRODUCTION_REAL`) y datos de demostración (`DEMO_SANDBOX`).
- `src/modules/catalog/` — [catalog.service.ts](file:///d:/AUTOS%20USA/src/modules/catalog/catalog.service.ts): Buscador avanzado multifiltro, fichas técnicas integrales y comparador lado a lado.
- `src/modules/calculator/` — [calculator.service.ts](file:///d:/AUTOS%20USA/src/modules/calculator/calculator.service.ts): Motor determinista de estimación de costos (subasta, broker, grúa terrestre en EE. UU., flete marítimo, documentación, arancel e IVA según destino) con aviso legal obligatorio de estimación no vinculante.
- `src/modules/crm/` — [crm.service.ts](file:///d:/AUTOS%20USA/src/modules/crm/crm.service.ts): Sistema comercial de recepción de consultas, registro de interesados, solicitudes de cotización (`COT-2026-XXXXX`) y expedientes de asesoría (`EXP-2026-XXXXX`) sin cobros automáticos ficticios.
- `src/modules/admin/` — [auth.service.ts](file:///d:/AUTOS%20USA/src/modules/admin/auth.service.ts) y [audit.service.ts](file:///d:/AUTOS%20USA/src/modules/admin/audit.service.ts): Control de acceso basado en roles (`SUPER_ADMIN`, `INVENTORY_MANAGER`, `COMMERCIAL_ADVISOR`, `AUDITOR_READONLY`) y bitácora inmutable de auditoría (`AuditLog`).

---

## Comandos de Ejecución

```bash
# 1. Ejecutar suite de pruebas funcionales, de integración y seguridad
npm test

# 2. Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev

# 3. Compilar versión optimizada de producción
npm run build
```

