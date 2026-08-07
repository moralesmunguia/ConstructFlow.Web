# DEF-WEB-006 — Matriz de Implementación — API Cartera

**Fecha de auditoría:** 2026-08-06
**Alcance auditado:** `ConstructFlow.Api` (código real, vía MCP filesystem)
**Nota:** este módulo corresponde al mismo backend ya registrado como DEF-N2-06 (Facturación/Cobranza). El endpoint de Cartera es la pieza de consulta de ese módulo.

## Endpoints

| Endpoint | Método | Estado | Evidencia |
|---|---|---|---|
| `/api/v1/cartera` | GET | ✅ Implementado | `CarteraController::index()` → `CarteraService::getCartera()` → `CuentaCobrarRepository::listarCartera()` |
| `/api/v1/cartera/antiguedad` | GET | ✅ Implementado | `CarteraController::antiguedad()` → `getAntiguedad()` → `antiguedad()` |
| `/api/v1/dashboard/facturacion` | GET | ✅ Implementado | `CarteraController::dashboardFacturacion()` → `getDashboard()` → `dashboard()` |

Las tres rutas están registradas en `public/index.php`.

## Arquitectura

| Capa | Esperado (doc) | Real (código) | Estado |
|---|---|---|---|
| Controller | `CarteraController` | `CarteraController.php` | ✅ |
| Service | `CarteraService` | `CarteraService.php` | ✅ |
| Repository | `CarteraRepository` | `CuentaCobrarRepository.php` (nombre distinto, misma función) | ✅ funcional / ⚠️ naming no coincide literal con el doc |
| Base de Datos | — | tabla `cf_cuentacobrar` (ya existe en BD real, confirmada en `DEF-N2-06_facturacion_cobranza.sql`) | ✅ |

## Reglas de negocio

| Regla | Estado | Evidencia |
|---|---|---|
| Consulta de cuentas por cobrar | ✅ | `listarCartera()`: join factura/cliente/proyecto, semáforo Rojo/Amarillo/Verde por vencimiento |
| Antigüedad de saldos | ✅ | `antiguedad()`: rangos 0-30 / 31-60 / 61-90 / +90 |
| Integración con facturación y pagos (recalculo automático de cartera) | ✅ | `FacturaService::registrar/actualizar/cancelar()` y `PagoService::registrar()` llaman `CuentaCobrarRepository::upsert()` en cada cambio (RN-FAC-007) |
| Dashboard financiero | ✅ | `dashboard()`: facturación del mes, cobranza del mes, saldo pendiente, cartera vencida, acumulados, días promedio de cobro, índice de recuperación |

## Integraciones

| Integración | Estado | Evidencia |
|---|---|---|
| Facturas | ✅ | `cf_factura` referenciada en las 3 consultas; upsert disparado desde `FacturaService` |
| Pagos | ✅ | `cf_pago` usado en dashboard (cobranza del mes/acumulada, días promedio); upsert disparado desde `PagoService` |
| Proyectos | ✅ | `cf_proyecto`/`CF_Proyecto` join en listado de cartera |
| KPI | ✅ | `IndiceRecuperacion` calculado en el propio dashboard (cobrado/facturado); no depende del módulo KPI genérico (`cf_kpi`), es cálculo propio del dashboard financiero |

## Hallazgos

- **Ninguna vista en ConstructFlow.Web.** Busqué `*cartera*`, `*cobranza*`, `*factura*` en el repo Web y no hay coincidencias — el módulo de Cobranza/Cartera no tiene pantalla (COB-001) del lado frontend. El API está listo para consumirse pero no hay UI construida todavía.
- El repositorio se llama `CuentaCobrarRepository`, no `CarteraRepository` como sugiere el doc — es solo diferencia de nombre, la función es la correcta. No requiere cambio salvo que se quiera alinear nomenclatura por consistencia.

## Conclusión

**API: completo.** Los tres endpoints, las reglas de negocio y las integraciones del DEF-WEB-006 están implementados y verificados contra código real.
**Pendiente real:** construir la pantalla Web COB-001 de Cartera — es lo único que falta para cerrar el módulo end-to-end.
