# DEF-WEB-017 -- API KPI

## Objetivo

Documentar la API REST del módulo KPI.

## Alcance

Indicadores ejecutivos y operativos del Dashboard.

## Endpoints

``` text
GET /api/v1/kpi
GET /api/v1/kpi/dashboard
GET /api/v1/kpi/proyectos
GET /api/v1/kpi/costos
GET /api/v1/kpi/rentabilidad
GET /api/v1/kpi/facturacion
GET /api/v1/kpi/cartera
GET /api/v1/kpi/actividades
GET /api/v1/kpi/proyectos/{id}
```

## Flujo Funcional

``` text
Solicitar KPI
    ↓
Validar JWT
    ↓
Consolidar Información
    ↓
Calcular Indicadores
    ↓
Responder JSON
```

## Arquitectura

Dashboard → KPIController → KPIService → KPIRepository → Base de Datos

## Reglas de Negocio

-   KPI filtrados por EmpresaID.
-   Cálculo en tiempo real.
-   Información consolidada.
-   Solo lectura.

## Integraciones

-   Proyectos
-   Actividades
-   Costos
-   Rentabilidad
-   Facturación
-   Cartera
-   Dashboard

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Dashboard
-   KPI por proyecto
-   KPI financieros
-   Validar filtros

## Estado de Implementación

**Fecha de auditoría:** 2026-08-15
**Alcance auditado:** `ConstructFlow.Api` + `ConstructFlow.Web` (código real, vía MCP filesystem)
**Nota:** ya existía un `KpiController`/`KpiService`/`KpiRepository` (DEF-N2-08), pero ese módulo es un catálogo CRUD de KPI's manuales (`CF_KPI`, rutas `/api/v1/kpis`) -- otra cosa distinta a la API de agregación que pide este documento. Se dejó intacto y se construyó un módulo nuevo y paralelo (`KpiConsolidadoController`/`KpiConsolidadoService`) que no duplica cálculos: compone datos ya existentes en Proyectos, Costos, Rentabilidad, Facturación, Cartera y Actividades.

### Endpoints

| Endpoint | Estado | Evidencia |
|---|---|---|
| `GET /api/v1/kpi` | ✅ Implementado | `KpiConsolidadoController::index()` -- alias de `dashboard()`, punto de entrada único |
| `GET /api/v1/kpi/dashboard` | ✅ Implementado | Compone Proyectos + Costos + Rentabilidad + Facturación + Actividades en un solo payload |
| `GET /api/v1/kpi/proyectos` | ✅ Implementado | Reusa `ProyectoRepository::getKpisGenerales()` -- devuelve agregados de empresa, no una fila por proyecto |
| `GET /api/v1/kpi/costos` | ✅ Implementado | Totales vía `RentabilidadRepository::getDashboardRentabilidad()` + desglose por categoría vía `CostoRepository::getDashboardCategorias()` |
| `GET /api/v1/kpi/rentabilidad` | ✅ Implementado | Reusa `RentabilidadRepository::getDashboardRentabilidad()` + `getDashboardCategorias()` |
| `GET /api/v1/kpi/facturacion` | ✅ Implementado | Reusa `CuentaCobrarRepository::dashboard()` |
| `GET /api/v1/kpi/cartera` | ✅ Implementado | Reusa `CuentaCobrarRepository::listarCartera()`, filtros `cliente_id/proyecto_id/estado/vencidas` |
| `GET /api/v1/kpi/actividades` | ✅ Implementado | **Nuevo** `ActividadRepository::getResumenEmpresa()` -- no existía agregado de actividades a nivel empresa (solo por proyecto) |
| `GET /api/v1/kpi/proyectos/{id}` | ✅ Implementado | Reusa `ProyectoService::getDashboard()` |

Todos `GET`, sin body, envelope estándar `{"success":true,"data":{...}}`.

### Arquitectura

| Capa | Esperado (doc) | Real (código) | Estado |
|---|---|---|---|
| Controller | `KPIController` | `KpiConsolidadoController.php` (nuevo, paralelo al `KpiController` de catálogo) | ✅ |
| Service | `KPIService` | `KpiConsolidadoService.php` | ✅ |
| Repository | `KPIRepository` | Sin repository propio -- compone `ProyectoRepository`, `CostoRepository`, `RentabilidadRepository`, `CuentaCobrarRepository`, `ActividadRepository` | ✅ funcional / ⚠️ naming no coincide literal con el doc |

### Reglas de negocio

| Regla | Estado | Evidencia |
|---|---|---|
| KPI filtrados por EmpresaID | ✅ | Todos los métodos reciben `EmpresaID` vía `EmpresaMiddleware::getEmpresaID()` |
| Cálculo en tiempo real | ✅ | Sin caché ni jobs; recalcula contra BD en cada request |
| Información consolidada | ✅ | `GET /kpi/dashboard` (y `GET /kpi`) agrupan las 5 fuentes en un solo payload |
| Solo lectura | ✅ | Sin ningún método `POST/PUT/DELETE` |

### Integraciones

| Integración | Estado | Evidencia |
|---|---|---|
| Proyectos | ✅ | `ProyectoRepository::getKpisGenerales()` / `ProyectoService::getDashboard()` |
| Actividades | ✅ | `ActividadRepository::getResumenEmpresa()` (nuevo) |
| Costos | ✅ | `CostoRepository::getDashboardCategorias()` |
| Rentabilidad | ✅ | `RentabilidadRepository::getDashboardRentabilidad()` / `getDashboardCategorias()` |
| Facturación | ✅ | `CuentaCobrarRepository::dashboard()` |
| Cartera | ✅ | `CuentaCobrarRepository::listarCartera()` |
| Dashboard | ✅ | `GET /kpi/dashboard` |

### Parte Web

| Elemento | Estado | Evidencia |
|---|---|---|
| Vista `?modulo=kpis` | ✅ Implementado | `app/Views/kpis/index.php` -- tarjetas (Proyectos activos, Margen real, Saldo por cobrar, Cartera vencida, Costo real, Actividades completadas/vencidas, Avance promedio), tabla de proyectos, tabla de Cartera vencida |
| Lógica JS | ✅ Implementado | `public/js/kpis.js` -- consume `/kpi/dashboard`, `/proyectos` (listado real), `/kpi/proyectos/{id}` (detalle en modal), `/kpi/cartera?vencidas=1` |
| Alta de menú/permisos | ✅ Implementado | `ConstructFlow.Api/public/DEF-WEB-017_menu_kpis.sql` -- idempotente, copia permisos del módulo `proyectos`. Requiere correr el script y volver a iniciar sesión |

### Hallazgos

- El repositorio dedicado que sugiere el doc (`KPIRepository`) no existe como tal -- se optó por componer repositorios ya certificados de cada módulo fuente en vez de duplicar consultas. Funcionalmente equivalente; solo difiere el naming.
- `GET /api/v1/kpi` y `GET /api/v1/kpi/dashboard` devuelven hoy el mismo payload (alias). Si se requiere un resumen más ligero para `/kpi`, es un cambio acotado a `KpiConsolidadoService::getResumenGeneral()`.
- No se generó Swagger para estos endpoints todavía.

### Conclusión

**API: completo.** Los 9 endpoints, las reglas de negocio y las integraciones del DEF-WEB-017 están implementados y verificados contra código real.
**Web: completo.** Vista, JS y alta de menú construidos; pendiente correr el SQL de menú y reiniciar sesión para que `?modulo=kpis` deje de dar 404.

## Historial

Versión 1.0.
Versión 1.1 (2026-08-15): agregado estado de implementación (API + Web) tras auditoría de código real.
