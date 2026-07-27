# DEF-WEB-003 -- Proyectos

**Proyecto:** ConstructFlow.Web\
**Documento:** DEF-WEB-003\
**Módulo:** Gestión de Proyectos\
**Versión:** 2.0\
**Estado:** Definición funcional y técnica detallada

## 1. Objetivo

Definir el módulo Web de **Proyectos** como contenedor central de la
ejecución operativa de ConstructFlow. Esta definición sustituye la
versión general anterior y sirve para confrontar Web, API, Service,
Repository, BD, Swagger y QA.

## 2. Modelo modular

``` text
Cotización aprobada / Alta manual
              |
           PROYECTO
              |
   +----------+-----------+
   |          |           |
 Fases    Encargados   Datos generales
   |
 WBS / EDT
   |
 +----------------+
 |                |
Actividades      Hitos
 |
 +-- Planeación
 +-- Responsables
 +-- Dependencias
 +-- Avance / Horas
 +-- Evidencias
 +-- Reprogramación
 +-- Gantt
 |
Avance Fase -> Avance Proyecto -> Indicadores / Dashboard
```

Proyecto y Actividades constituyen el núcleo modular de ejecución.

## 3. Alcance

Incluye consulta, alta, modificación, conversión desde cotización,
folio, cliente, OC/Contrato (`NumeroContrato`), responsable, encargados,
tipo, ubicación, descripción, observaciones, fecha inicio, fecha fin
estimada, estado, avance físico, fases, WBS/EDT, actividades, hitos,
dependencias, Gantt, seguimiento, indicadores, dashboard y seguridad
multiempresa.

**Fuera de alcance:** Presupuesto. El módulo Proyecto no debe mostrar ni
capturar `Presupuesto Original`.

## 4. Grid de Proyectos

  -----------------------------------------------------------------------
  Orden                   Columna                 Regla
  ----------------------- ----------------------- -----------------------
  1                       Folio                   Mostrar `000005`; no
                                                  `ROM01-PRO-000005`.

  2                       Nombre / Descripción    Nombre del proyecto.

  3                       Cliente                 Cliente asociado.

  4                       OC / Contrato           `NumeroContrato`; si no
                                                  existe mostrar
                                                  `Pendiente`.

  5                       Responsable             Responsable principal.

  6                       Estado                  Estado/condición
                                                  operativa.

  7                       Avance                  Avance físico.

  8                       Fecha Inicio            Inicio planeado.

  9                       Fecha Fin Estimada      Terminación planeada.

  10                      Acciones                Según permisos.
  -----------------------------------------------------------------------

Eliminar la columna **PRESUPUESTO**. Mantener filtros de Cliente,
Responsable, Estado y búsqueda general.

## 5. PRO-001 -- Folio

El código interno puede conservar `ROM01-PRO-000005`, pero la
presentación del grid será `000005`. No modificar
generación/almacenamiento hasta revisar dependencias API/BD.

## 6. Alta / Modificación

Campos: - Cliente: requerido. - Responsable: conforme a regla vigente. -
Nombre del Proyecto: requerido. - Tipo de Proyecto: conforme al
modelo/catálogo vigente. - Fecha Inicio. - Fecha Fin Estimada. - OC /
Contrato (`NumeroContrato`): no obligatorio para crear. - Ubicación. -
Descripción. - Observaciones.

**Eliminar:** `Presupuesto Original`.

La edición del proyecto es la entrada a Datos Generales, OC/Contrato,
Encargados, Fases, WBS, Actividades, Hitos, Dependencias, Gantt,
Avances/Horas, Evidencias/Documentos e Indicadores/Dashboard.

## 7. PRO-002/003/004 -- OC / Contrato

`NumeroContrato` representa la OC, OS o contrato del cliente.

Sin `NumeroContrato`, el proyecto se identifica operacionalmente como:

``` text
EN ESPERA DE OC
```

Debe revisarse si será estado persistido o condición calculada.

Sin OC se permite consultar, editar, crear fases, WBS, actividades,
hitos, responsables, fechas y dependencias. **No se permite iniciar
ejecución de actividades.**

Validación backend conceptual:

``` text
NumeroContrato IS NOT NULL
AND TRIM(NumeroContrato) <> ''
```

Mensaje esperado:

``` text
No es posible iniciar la actividad.
El proyecto se encuentra en espera de la OC/Contrato del cliente.
```

La regla debe existir en API; deshabilitar un botón Web no es
suficiente.

## 8. Responsable y Encargados

Diferenciar Responsable principal de los encargados asociados mediante
el modelo vigente (`CF_ProyectoEncargado`). Los responsables de
actividades deben respetar empresa, permisos y asignaciones.

## 9. Fases

Las fases estructuran el proyecto:

``` text
Proyecto
 +-- Fase 1
 |    +-- WBS / Actividades / Hitos
 +-- Fase 2
      +-- WBS / Actividades / Hitos
```

El avance de fase deriva de sus actividades conforme a la lógica
backend. Revisar filtros por ProyectoID, EmpresaID y activos.

## 10. WBS / EDT

Organiza jerárquicamente el trabajo:

``` text
1    PRELIMINARES
1.1  Trazo y nivelación
1.2  Excavación
2    CIMENTACIÓN
2.1  Armado
2.2  Colado
```

Debe evitarse duplicidad de `CodigoWBS` dentro del proyecto. Está
pendiente cerrar si el código lo genera API o se captura de forma
controlada desde Web; no debe quedar como texto libre sin validación.

## 11. Actividades e Hitos

Proyecto proporciona el contexto de ProyectoID, EmpresaID, Fase, WBS,
encargados, OC y fechas. La definición detallada está en
`DEF-WEB-004 – Actividades`.

## 12. Avance

``` text
Avance actividad -> Recalcular Fase -> Recalcular Proyecto -> Indicadores/Dashboard
```

La lógica debe residir en backend, no duplicarse en JavaScript.

## 13. Gantt

Vista integral con Fases, WBS, Actividades, Hitos, fechas plan/reales,
avance, dependencias y ruta crítica cuando esté implementada. Consultas
obligatoriamente contextualizadas por ProyectoID y EmpresaID.

## 14. Conversión Cotización → Proyecto

El proyecto puede originarse manualmente o desde cotización aprobada:

``` text
Cotización aprobada
 -> CONVERTIR_PROYECTO
 -> Proyecto
 -> Fases / WBS / Actividades / Hitos según información aplicable
```

Validar exactamente qué campos y relaciones transfiere la implementación
actual antes de marcarlos terminados.

## 15. Estados

Diferenciar estado persistido de condición operativa
(`EN ESPERA DE OC`). No crear un estado nuevo en BD sin revisar
catálogo/transiciones existentes.

## 16. Integraciones

Proyecto integra Actividades, Evidencias/Documentos, Costos,
Facturación, Rentabilidad, Indicadores y Dashboard. **Presupuesto no
pertenece al módulo Proyecto.**

## 17. Seguridad

Toda operación debe validar autenticación, EmpresaID, permisos,
ProyectoID dentro de empresa y UsuarioID de contexto. Evitar acceso
cruzado modificando IDs desde Web.

## 18. API identificada

``` text
GET    /api/v1/proyectos
POST   /api/v1/proyectos
GET    /api/v1/proyectos/{id}
PUT    /api/v1/proyectos/{id}
DELETE /api/v1/proyectos/{id}
POST   /api/v1/proyectos/convertir-cotizacion/{id}
PUT    /api/v1/proyectos/{id}/contrato
GET    /api/v1/proyectos/{id}/dashboard
GET    /api/v1/proyectos/{id}/encargados
PUT    /api/v1/proyectos/{id}/estado
PATCH  /api/v1/proyectos/{id}/estado
GET    /api/v1/proyectos/{id}/facturacion
GET    /api/v1/proyectos/{id}/fases
GET    /api/v1/proyectos/{id}/indicadores
GET    /api/v1/proyectos/{id}/persistencia
```

La existencia documental del endpoint no certifica funcionalidad
terminada: confrontar Controller → Service → Repository → BD → Swagger →
Web.

## 19. Matriz de requerimientos

  ID        Requerimiento                Estado
  --------- ---------------------------- -------------------------
  PRO-001   Folio `000005`               RESUELTO (Web: folio corto en grid, código interno intacto)
  PRO-002   `NumeroContrato`             RESUELTO (campo en alta/edición, no obligatorio al crear, acción "Registrar Contrato")
  PRO-003   `EN ESPERA DE OC`            RESUELTO (condición calculada, NO estado nuevo en BD -- `ProyectoService::aplicarCondicionOperativa()`, campo `CondicionOperativa`)
  PRO-004   Bloqueo inicio sin OC        RESUELTO EN API (`ActividadService::validarProyectoConOrdenCompra()`, en `registrarAvance()` y `actualizar()`, mensaje exacto del doc)
  PRO-005   Eliminar Presupuesto         RESUELTO (grid y formulario ya no lo muestran ni lo capturan)
  PRO-006   Fecha Fin Estimada en grid   RESUELTO
  PRO-007   Responsable                  RESUELTO (bug corregido: editar cabecera ya no reasignaba el responsable al creador original ni borraba/reinsertaba el encargado principal en cada edición)
  PRO-008   Encargados                   PARCIAL -- solo se gestiona el encargado principal; no existe endpoint para encargados secundarios (Director/Gerente/Residente/etc. adicionales). Pendiente confirmar que `TipoEncargadoID=2` (GERENTE) sea el default correcto
  PRO-009   Fases                        RESUELTO (creación automática al convertir, filtros por ProyectoID/EmpresaID/activos ya existían)
  PRO-010   WBS/EDT                      RESUELTO (API genera `CodigoWBS` automático por Fase si se deja vacío; valida formato numérico jerárquico si se captura manual; ya no es texto libre). Pendiente menor: la conversión Cotización->Proyecto inserta actividades sin pasar por esta validación (bypass vía `ProyectoRepository::insertActividad()` directo)
  PRO-011   Actividades                  IMPLEMENTADO (alta/edición de actividades agregada al formulario de Proyecto)
  PRO-012   Hitos                        RESUELTO (`EsHito` en `CF_Actividad`, ya conectado en API y Web -- checkbox "Hito" en la tabla de actividades, se refleja en el Gantt)
  PRO-013   Dependencias                 RESUELTO (CRUD completo con detección de ciclos ya existía en API; conectado al Gantt en Web)
  PRO-014   Gantt                        RESUELTO (`ActividadService::obtenerGantt()` con ruta crítica real -- CPM/orden topológico -- ya existía en API; Web agrega vista con Frappe Gantt, días festivos, y marcado de actividades vencidas)
  PRO-015   Avance Proyecto              RESUELTO (cálculo vive en backend: `recalcularAvanceFase()`/`recalcularAvanceProyecto()` en `ActividadService`, Web solo lo pinta)
  PRO-016   Dashboard                    RESUELTO (ya no expone Presupuesto; ahora TotalVenta/CostoEstimado/CostoReal/Margen)
  PRO-017   Indicadores                  RESUELTO (fórmula real: Margen = TotalVenta - CostoEstimado - CostoReal por categoría, usando `CostoRepository` existente)
  PRO-018   Conversión Cotización        VALIDADO -- confirma que NumeroContrato correctamente NO se transfiere (nace "EN ESPERA DE OC"); corregido `EstadoProyectoID` que quedaba NULL; pendiente sin resolver: bypass de validaciones WBS (ver PRO-010) y herencia de PresupuestoOriginal/Actual desde TotalVenta de la cotización (decisión de negocio pendiente)
  PRO-019   Seguridad EmpresaID          OBLIGATORIO (sin cambios, ya se validaba en todos los endpoints revisados)
  PRO-020   Calendario laboral           NUEVO, RESUELTO -- Sábado/Domingo laborables configurables por Empresa (`CF_Empresa.SabadoLaboral`/`DomingoLaboral`), reemplaza el `>=6` hardcodeado que existía en dos lugares distintos (`CalendarioLaboralService` y `CotizacionService`). Pendiente: no hay pantalla Web de Configuración para prender/apagar estos flags (se cambian por UPDATE directo a BD)
  PRO-021   Días festivos en Gantt       NUEVO, RESUELTO -- endpoint `GET /dias-festivos` (no existía) + sombreado best-effort en el diagrama + lista de chips como respaldo
  PRO-022   Actividades vencidas         NUEVO, RESUELTO -- el Gantt marca en rojo oscuro (`bar-vencida`) cualquier actividad cuya FinPlan ya pasó sin estar completada/cancelada

## 20. Criterios de aceptación

-   Grid sin Presupuesto.
-   Grid con Fecha Fin Estimada y OC/Contrato.
-   Folio visible `000005`.
-   Alta/edición sin Presupuesto Original.
-   Proyecto puede planearse sin OC.
-   Sin OC ninguna actividad puede iniciar.
-   Restricción implementada también en API.
-   Actividades aisladas por proyecto/empresa.
-   Avance calculado por backend.
-   Web responsive en laptop, tablet y smartphone.

## 21. Historial

**v2.0:** redefinición detallada de Proyecto como contenedor modular. Se
elimina Presupuesto y se incorporan Fecha Fin Estimada,
OC/NumeroContrato, bloqueo de ejecución sin OC e integración formal con
Fases, WBS, Actividades, Hitos y Gantt.

**v2.1 (2026-07-26):** confrontación completa Web -> API -> Service ->
Repository -> BD de toda la matriz de la v2.0. Resueltos: PRO-001 a
PRO-007, PRO-009, PRO-010, PRO-012 a PRO-018. PRO-008 queda parcial
(solo encargado principal). Se agregan tres requerimientos nuevos no
contemplados en v2.0: PRO-020 (calendario laboral configurable por
empresa), PRO-021 (días festivos visibles en el Gantt) y PRO-022
(marcado visual de actividades vencidas en el Gantt). Pendientes
abiertos documentados en cada renglon de la matriz (sección 19).
