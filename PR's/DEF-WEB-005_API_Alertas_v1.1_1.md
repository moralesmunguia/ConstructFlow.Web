# DEF-WEB-005 -- Alertas

**Proyecto:** ConstructFlow.Web / ConstructFlow.Api
**Documento:** DEF-WEB-005
**Módulo:** Centro de Alertas
**Versión:** 1.1
**Estado:** Definición funcional y técnica -- construido directamente contra código real (no existía versión previa del documento)

> Nota: este documento no tenía una versión anterior en archivo -- se
> redactó reconstruyendo la definición a partir del código ya
> implementado (API + Web), siguiendo el mismo formato que
> DEF-WEB-002/003/004.

## 1. Objetivo

Documentar el módulo de **Alertas**: el catálogo de eventos que requieren
atención (actividades vencidas, facturas por vencer/vencidas,
cotizaciones por vencer o aprobadas sin proyecto, alertas manuales),
su ciclo de vida (Abierta → En revisión → Resuelta/Descartada), y los
dos mecanismos que las generan: manual (desde la Web) y automático
(reglas de negocio programadas).

## 2. Alcance

Consulta, alta manual, cambio de estado, resumen por prioridad
(dashboard), generación automática por reglas de negocio, y
notificación por correo del resumen de alertas nuevas por corrida.

**Fuera de alcance de este documento:** notificación por WhatsApp
(decisión de negocio: por ahora solo Email); regla "factura no subida
al portal del cliente" (requiere columna nueva en `cf_factura` y una
acción manual en el módulo Web de Facturas, no construida todavía).

## 3. Modelo

```text
CF_Alerta
 +-- EmpresaID          -- DEF-WEB-006: antes se inferia via JOIN a Proyecto/KPI
 +-- KPIID / ProyectoID  -- origen opcional (alerta de KPI o de Proyecto)
 +-- TipoAlerta          -- ver catálogo sección 6
 +-- ReferenciaTipo/ID   -- DEF-WEB-006: referencia generica al registro
 |                          disparador (Actividad/Factura/Cotizacion),
 |                          necesaria para deduplicar cuando no hay
 |                          Proyecto/KPI asociado
 +-- Prioridad           -- Alta / Media / Baja
 +-- Estado              -- ABIERTA / EN_REVISION / RESUELTA / DESCARTADA
 +-- FechaGeneracion / FechaAtencion
```

## 4. Origen: API ya implementado (DEF-N2-08, sección 13)

Al momento de revisar este módulo para construir la Web, se confirmó
que el API ya estaba **100% implementado** desde antes:
`AlertaController` / `AlertaService` / `AlertaRepository`, con los 5
endpoints documentados en DEF-N2-08 (sección 13), incluyendo
`generarSiNoExiste()` para evitar duplicados y el catálogo
`ESTADOS_VALIDOS` (`ABIERTA`, `EN_REVISION`, `RESUELTA`,
`DESCARTADA`). Lo que faltaba por completo era el lado Web.

## 5. Web (Centro de Alertas)

`app/Views/alertas/index.php` + `public/js/alertas.js`:

- **Tarjetas resumen** por prioridad (Alta / Media / Baja / Total
  abiertas), vía `GET /api/v1/dashboard/alertas`.
- **Filtros**: Estado, Prioridad, Proyecto.
- **Listado** (DataTable): Prioridad, Tipo, Título, Proyecto/KPI,
  Generada, Atendida, Estado, Acciones.
- **Alta manual** ("+ Nueva Alerta") vía `POST /api/v1/alertas` --
  agregado también para poder probar el flujo completo, ya que la
  tabla estaba vacía al no existir todavía el generador automático.
- **Cambio de estado** (atender / resolver / descartar) vía modal,
  `PATCH /api/v1/alertas/{id}/estado`.
- **Botón "Revisar alertas ahora"** -- dispara la generación
  automática bajo demanda (ver sección 6).

El ítem de menú `alertas` ya existía en `cf_menu` de una alta previa;
la pantalla cargó sin necesitar ajuste de permisos.

## 6. Generación automática (DEF-WEB-006)

Implementada en `AlertaGeneradorService::generarTodas()`, con 5 reglas:

  Tipo                                    Condición
  ---------------------------------------- ------------------------------------------------------------------
  `ACTIVIDAD_VENCIDA`                      `CF_Actividad.FinPlan` ya pasó, no `COMPLETADA`/`CANCELADA`, Avance < 100
  `FACTURA_POR_VENCER`                     `cf_factura` vence en los próximos 5 días, con saldo > 0
  `FACTURA_VENCIDA`                        `cf_factura` ya vencida, con saldo > 0
  `COTIZACION_POR_VENCER`                  `FechaVigencia` vence en los próximos 3 días, Estado `ENVIADA`
  `COTIZACION_SIN_PROYECTO`                Estado `APROBADA`, `ProyectoID` sigue `NULL`

Cada regla usa `AlertaService::generarSiNoExiste()` para no duplicar
una alerta ya abierta del mismo tipo/referencia. De paso se aprovechó
la misma corrida para ejecutar `FacturaRepository::actualizarVencidas()`
(job diario que ya existía en el código pero nunca se disparaba desde
ningún lado).

**Se dispara desde dos lugares:**
1. Botón "Revisar alertas ahora" (Web) → `POST /api/v1/alertas/generar`
   → una empresa a la vez (la de la sesión).
2. `cron_alertas.php` (script CLI en la raíz de `ConstructFlow.Api`,
   pensado para el Programador de Tareas de Windows) → recorre todas
   las empresas activas, sin exponer ningún endpoint sin autenticación.

## 7. Notificación por correo

Un solo correo resumen por corrida/empresa (no uno por alerta) al
`CF_Empresa.Correo` configurado, listando los títulos de las alertas
nuevas. `EmailService::enviar()` es **stub-seguro**: si no hay
`MAIL_HOST`/`MAIL_USER`/`MAIL_PASS` en `.env`, regresa
`success:false` con mensaje claro en vez de tronar -- la alerta ya
quedó guardada en BD independientemente de si el correo se pudo
enviar. El envío real (PHPMailer) queda como `TODO` documentado en el
propio archivo, para activarse el día que haya dominio/SMTP real.

## 8. Migración de base de datos

`CF_Alerta` no tenía `EmpresaID` propio (se inferío por `JOIN` a
Proyecto/KPI) ni una referencia genérica al registro disparador. Esto
rompía la deduplicación en cuanto había más de una alerta del mismo
tipo sin Proyecto/KPI asociado (ej. dos cotizaciones distintas
"aprobadas sin proyecto" se hubieran tratado como la misma alerta).

Script `docs/DEF-WEB-006_alertas_automaticas.sql` (ejecutado
correctamente por Salvador):
- Agrega `EmpresaID`, `ReferenciaTipo`, `ReferenciaID` a `CF_Alerta`.
- Backfill de `EmpresaID` para alertas ya existentes, vía Proyecto/KPI.
- Índice de deduplicación `(EmpresaID, TipoAlerta, ReferenciaTipo,
  ReferenciaID, Estado)`.

## 9. Incidente resuelto: incompatibilidad de sintaxis PHP

Al probar "Revisar alertas ahora" por primera vez, falló con:

```text
Parse error: syntax error, unexpected '=>' (T_DOUBLE_ARROW), expecting ')'
in AlertaGeneradorService.php on line 331
```

Causa: `AlertaGeneradorService::notificarPorCorreo()` usaba una
**arrow function** (`fn($a) => ...`, sintaxis de PHP 7.4+). El
ambiente real de AppServ de Salvador corre una versión de PHP más
antigua que no la reconoce -- a pesar de que DEF-WEB-000 documenta
"PHP 8.2+" como stack objetivo. Corregido reemplazándola por una
closure clásica (`function ($a) { return ...; }`), compatible con
cualquier versión de PHP.

**Riesgo abierto:** no se ha confirmado la versión real de PHP del
servidor (pendiente que Salvador corra `php -v` o un `phpinfo()`). Es
posible que exista sintaxis moderna similar (`fn()`, tipos de unión
`int|string`, `match`, etc.) en otras partes del código que aún no se
haya ejercitado y falle de la misma manera al llegar a esa ruta.

## 10. Estado actual (2026-08-01)

**Cerrado temporalmente por decisión de Salvador**, en espera de
confirmar con el cliente qué tipos de alerta realmente necesita antes
de seguir ajustando las 5 reglas automáticas (agregar, quitar o
modificar umbrales como los 5/3 días de anticipación). El Centro de
Alertas (manual) y el fix de PHP siguen aplicados y funcionales
independientemente de esta pausa.

## 11. API identificada

```text
GET   /api/v1/alertas
GET   /api/v1/alertas/{id}
POST  /api/v1/alertas
PATCH /api/v1/alertas/{id}/estado
GET   /api/v1/dashboard/alertas
POST  /api/v1/alertas/generar
```

## 12. Matriz de requerimientos

  ID        Requerimiento                                  Estado
  --------- ---------------------------------------------- ---------------------------------------------------------------------------------------------------------------
  ALT-001   API Centro de Alertas                          RESUELTO -- ya estaba 100% implementado (`AlertaController`/`Service`/`Repository`, DEF-N2-08 sección 13) antes de este documento
  ALT-002   Web Centro de Alertas                          RESUELTO -- grid, filtros (Estado/Prioridad/Proyecto), tarjetas resumen por prioridad, alta manual, cambio de estado
  ALT-003   Generación automática (5 reglas)                IMPLEMENTADO -- ver sección 6. **TEMPORALMENTE CERRADO** (2026-08-01): en pausa hasta confirmar con el cliente qué alertas necesita realmente
  ALT-004   Notificación por correo                         PARCIAL -- código completo y stub-seguro (`EmailService`); envío real pendiente de credenciales SMTP en `.env` (no hay dominio/correo todavía)
  ALT-005   Notificación WhatsApp                            FUERA DE ALCANCE -- decisión de negocio: solo Email por ahora
  ALT-006   Job automático (cron)                            RESUELTO -- `cron_alertas.php` listo; requiere que Salvador lo programe manualmente en el Programador de Tareas de Windows (no se puede hacer desde aquí)
  ALT-007   Migración BD (EmpresaID/ReferenciaTipo/ID)        RESUELTO -- `DEF-WEB-006_alertas_automaticas.sql` ejecutado correctamente
  ALT-008   Incompatibilidad de sintaxis PHP (`fn()`)         RESUELTO -- ver sección 9. Riesgo abierto: no confirmada la versión real de PHP del servidor
  ALT-009   Regla "factura no subida al portal del cliente"   NO IMPLEMENTADA -- requiere columna nueva (`SubidoPortalCliente`) en `cf_factura` + acción manual en el módulo Web de Facturas (no revisado todavía)

## 13. Pendientes prioritarios

1. Confirmar con el cliente qué tipos de alerta necesita (bloqueante
   para reactivar ALT-003).
2. Confirmar versión real de PHP del servidor (ALT-008, riesgo abierto).
3. Credenciales SMTP cuando haya dominio (ALT-004).
4. Confirmar que `cron_alertas.php` quedó programado en el servidor
   (ALT-006) -- sin esto, la generación automática solo corre cuando
   alguien presiona el botón manual.

## 14. Historial

**v1.0 (reconstruido):** primera versión documentada del módulo de
Alertas, consolidando lo ya implementado en API (preexistente) y Web
(construido en esa sesión): Centro de Alertas completo con filtros,
resumen por prioridad, alta manual y cambio de estado.

**v1.1 (2026-08-01):** se agrega la generación automática (5 reglas de
negocio + notificación por correo + job cron), la migración de BD que
requirió, el bug de compatibilidad de PHP encontrado y corregido
(`fn()` arrow function), y se documenta el cierre temporal de ALT-003
en espera de la definición de requerimientos del cliente.
