# DEF-WEB-006 — Matriz de Implementación — API Cartera

**Fecha de auditoría original:** 2026-08-06
**Última actualización:** 2026-08-07
**Alcance auditado:** `ConstructFlow.Api` + `ConstructFlow.Web` (código real, vía MCP filesystem)
**Nota:** este módulo corresponde al mismo backend ya registrado como DEF-N2-06 (Facturación/Cobranza). El endpoint de Cartera es la pieza de consulta de ese módulo. Hay una colisión de numeración pendiente de resolver con el otro DEF-WEB-006 (Alertas automáticas + email) — ver sección "Pendientes" al final.

## Endpoints

| Endpoint | Método | Estado | Evidencia |
|---|---|---|---|
| `/api/v1/cartera` | GET | ✅ Implementado | `CarteraController::index()` → `CarteraService::getCartera()` → `CuentaCobrarRepository::listarCartera()` |
| `/api/v1/cartera/antiguedad` | GET | ✅ Implementado | `CarteraController::antiguedad()` → `getAntiguedad()` → `antiguedad()` |
| `/api/v1/dashboard/facturacion` | GET | ✅ Implementado | `CarteraController::dashboardFacturacion()` → `getDashboard()` → `dashboard()` |
| `/api/v1/facturas/{id}/pagos` | GET | ✅ Implementado (ya existía) | `PagoController::index()` → `PagoService::listarPorFactura()` |
| `/api/v1/facturas/{id}/xml` | GET | ✅ Implementado (nuevo) | `FacturaController::descargaXML()` — stream binario, mismo patrón `readfile()` que `EvidenciaController::descarga()` |
| `/api/v1/facturas/{id}/pdf` | GET | ✅ Implementado (nuevo) | `FacturaController::descargaPDF()` — ídem |
| `/api/v1/alertas/generar` | POST | ✅ Implementado (ya existía, reutilizado) | `AlertaController::generar()` → `AlertaGeneradorService::generarTodas()` |

Todas las rutas están registradas en `public/index.php`.

## Arquitectura

| Capa | Esperado (doc) | Real (código) | Estado |
|---|---|---|---|
| Controller | `CarteraController` | `CarteraController.php` | ✅ |
| Service | `CarteraService` | `CarteraService.php` | ✅ |
| Repository | `CarteraRepository` | `CuentaCobrarRepository.php` (nombre distinto, misma función) | ✅ funcional / ⚠️ naming no coincide literal con el doc |
| Base de Datos | — | tabla `cf_cuentacobrar` (ya existe en BD real, confirmada en `DEF-N2-06_facturacion_cobranza.sql`) | ✅ |
| **Vista Web (COB-001)** | Pantalla de Cartera | `ConstructFlow.Web/app/Views/cartera/index.php` + `public/js/cartera.js` | ✅ construida esta sesión |

## Reglas de negocio

| Regla | Estado | Evidencia |
|---|---|---|
| Consulta de cuentas por cobrar | ✅ | `listarCartera()`: join factura/cliente/proyecto, semáforo Rojo/Amarillo/Verde por vencimiento, incluye `NumeroContrato`, `FechaFactura`, `XMLURL`, `PDFURL` |
| Antigüedad de saldos | ✅ | `antiguedad()`: rangos 0-30 / 31-60 / 61-90 / +90 |
| Integración con facturación y pagos (recalculo automático de cartera) | ✅ | `FacturaService::registrar/actualizar/cancelar()` y `PagoService::registrar()` llaman `CuentaCobrarRepository::upsert()` en cada cambio (RN-FAC-007) |
| Dashboard financiero | ✅ | `dashboard()`: facturación del mes, cobranza del mes, saldo pendiente, cartera vencida, acumulados, días promedio de cobro, índice de recuperación |
| Alertas de facturas vencidas/por vencer | ✅ | Reutiliza `AlertaGeneradorService` (reglas `FACTURA_VENCIDA` / `FACTURA_POR_VENCER`, ya existentes del módulo de Alertas); botón "Generar alertas" agregado en la pantalla de Cartera |

## Integraciones

| Integración | Estado | Evidencia |
|---|---|---|
| Facturas | ✅ | `cf_factura` referenciada en las consultas; upsert disparado desde `FacturaService`; descarga XML/PDF vía `FacturaController` |
| Pagos | ✅ | `cf_pago` usado en dashboard y en modal "Ver cobros" (`GET /facturas/{id}/pagos`) |
| Proyectos | ✅ | `cf_proyecto`/`CF_Proyecto` join en listado de cartera, incluye `NumeroContrato` |
| KPI | ✅ | `IndiceRecuperacion` calculado en el propio dashboard (cobrado/facturado) |
| Alertas | ✅ | Botón "Generar alertas" en Cartera dispara `POST /alertas/generar` (mismas 5 reglas del módulo de Alertas, sin duplicar) |

## Pantalla Web (COB-001) — construida esta sesión

| Elemento | Estado | Detalle |
|---|---|---|
| Dashboard financiero (6 tarjetas) | ✅ | Facturación del mes, Cobranza del mes, Saldo pendiente, Cartera vencida, Índice de recuperación, Días promedio de cobro |
| Tabla de antigüedad de saldos | ✅ | Rango / Facturas / Saldo |
| Filtros | ✅ | Cliente, Proyecto, Estado, Solo vencidas |
| Listado de cartera | ✅ | Columnas: Factura, Fecha, Cliente, Proyecto, No. Contrato, Importe, Saldo, Vencimiento, Días vencidos, Estado, Acciones — semáforo por color, búsqueda libre, DataTable |
| Acción "Ver cobros" | ✅ | Modal con historial de pagos de la factura (Fecha/Importe/Método/Referencia/Banco) |
| Acción "Descargar XML/PDF" | ✅ | Botones condicionales (solo se pintan si la factura tiene `XMLURL`/`PDFURL`); descarga vía blob+JWT (mismo patrón que Evidencias) |
| Botón "Generar alertas" | ✅ | Dispara la generación de alertas automáticas (incluye facturas vencidas/por vencer) sin salir de la pantalla |
| Alta de menú/permisos | ✅ | `DEF-WEB-006_menu_cartera.sql` — item de menú `cartera`, permiso de solo Consultar para roles activos |

## Datos y archivos de prueba generados

- `DEF-WEB-006_datos_prueba_cartera.sql` — cliente + proyecto + 3 facturas (vencida/por vencer/parcial) + 1 pago de prueba.
- `DEF-WEB-006_cfdi_prueba_pc000003.sql` + archivos en `storage/facturas/` — XML/PDF de prueba (no fiscales) asociados a `PC000003`, para validar la descarga.

## Pendientes / hallazgos abiertos

- **Colisión de numeración DEF-WEB-006:** este documento (API Cartera) y el módulo de "Alertas automáticas + email" comparten el mismo número de spec en mi bitácora. Falta que Salvador confirme cuál es el número correcto vigente para no seguir arrastrando la ambigüedad.
- El repositorio se llama `CuentaCobrarRepository`, no `CarteraRepository` como sugiere el doc original — solo diferencia de nombre, no requiere cambio funcional.
- Regla NO implementada (heredada del módulo de Alertas, no específica de Cartera): "factura no subida al portal del cliente" — no existe columna para eso en `cf_factura`.

## Conclusión

**API + Web: completo.** Los endpoints, las reglas de negocio, las integraciones y la pantalla COB-001 de Cartera están implementados y verificados contra código real corriendo en el servidor de Salvador.
