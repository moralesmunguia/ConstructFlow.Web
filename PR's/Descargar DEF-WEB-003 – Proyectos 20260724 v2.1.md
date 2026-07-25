# DEF-WEB-003 -- Proyectos

**Proyecto:** ConstructFlow.Web\
**Documento:** DEF-WEB-003\
**Módulo:** Gestión de Proyectos\
**Versión:** 2.1\
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

## 7. PRO-002/003/004/020 -- OC / Contrato

`NumeroContrato` representa la OC, OS o contrato del cliente.

La captura y modificación de la OC/Contrato debe ser una **operación
independiente de Editar Proyecto**. El usuario no debe entrar al
formulario general del proyecto únicamente para registrar o cambiar este
dato.

### 7.1 Presentación en el grid

La columna **OC / CONTRATO** debe mostrar:

``` text
NumeroContrato vacío
        |
        +--> EN ESPERA DE OC

NumeroContrato informado
        |
        +--> Mostrar el número de OC / Contrato
```

Ejemplos:

``` text
EN ESPERA DE OC
OC-45001236
45001236
CONTRATO-2026-015
```

`EN ESPERA DE OC` se considera inicialmente una **condición
operativa/visual calculada** a partir de `NumeroContrato`; no crear un
nuevo estado persistido en BD sin revisar previamente el catálogo y las
transiciones existentes.

### 7.2 Acción independiente OC / Contrato

En la columna **ACCIONES** del grid debe existir una acción específica:

``` text
OC / Contrato
```

La misma acción sirve para:

-   Capturar la OC cuando `NumeroContrato` está vacío.
-   Consultar el valor actualmente registrado.
-   Modificar la OC/Contrato cuando ya existe.

Esta acción es independiente de:

``` text
Ver Proyecto
Imprimir
Editar Proyecto
Actualizar / otras acciones
Eliminar
```

Debe mostrarse conforme a permisos del usuario.

### 7.3 Popup de captura / modificación

Al seleccionar la acción **OC / Contrato**, la Web abrirá un popup/modal
sin abandonar el grid.

Contenido mínimo:

``` text
+--------------------------------------------------+
|             OC / CONTRATO DEL PROYECTO           |
+--------------------------------------------------+
| Proyecto: 000006                                 |
| Construcción de nave industrial de 2,500 m2      |
|                                                  |
| OC / Contrato *                                  |
| [____________________________________________]   |
|                                                  |
|                 [Cancelar] [Guardar OC]          |
+--------------------------------------------------+
```

El popup debe mostrar como contexto:

-   Folio visible del Proyecto.
-   Nombre / Descripción del Proyecto.
-   Campo `NumeroContrato`.
-   Botón Cancelar.
-   Botón Guardar OC / Guardar cambios.

Si ya existe `NumeroContrato`, el campo se abre precargado con el valor
actual para permitir su modificación.

### 7.4 Flujo funcional

``` text
Proyecto
   |
   +--> NumeroContrato vacío
   |        |
   |        +--> Grid: EN ESPERA DE OC
   |        |
   |        +--> Acción OC / Contrato
   |                 |
   |                 +--> Popup
   |                 +--> Capturar NumeroContrato
   |                 +--> Guardar
   |                 +--> API
   |                 +--> Actualizar grid
   |                 +--> Mostrar NumeroContrato
   |
   +--> NumeroContrato existente
            |
            +--> Grid: mostrar NumeroContrato
            |
            +--> Acción OC / Contrato
                     |
                     +--> Popup con valor actual
                     +--> Modificar
                     +--> Guardar cambios
                     +--> API
                     +--> Actualizar grid
```

### 7.5 API

Utilizar/revisar el endpoint ya identificado:

``` text
PUT /api/v1/proyectos/{id}/contrato
```

Payload conceptual:

``` json
{
  "NumeroContrato": "OC-45001236"
}
```

La API debe obtener `EmpresaID` y `UsuarioID` del contexto seguro
correspondiente y validar que el Proyecto pertenece a la empresa activa.

No confiar únicamente en `ProyectoID` enviado desde la Web.

### 7.6 Validaciones

Antes de guardar:

``` text
Proyecto existe
AND pertenece a EmpresaID
AND usuario tiene permiso
AND NumeroContrato no está vacío
AND TRIM(NumeroContrato) <> ''
```

Revisar en API/BD la longitud máxima y caracteres admitidos de
`NumeroContrato`; esta definición no debe inventar un límite distinto al
modelo existente.

Al guardar correctamente:

1.  Persistir `NumeroContrato`.
2.  Registrar campos de auditoría conforme al estándar vigente.
3.  Cerrar el popup.
4.  Refrescar únicamente los datos necesarios del grid.
5.  Sustituir `EN ESPERA DE OC` por el valor capturado.
6.  Mostrar confirmación de operación exitosa.

Si falla la API, conservar abierto el popup y mostrar el mensaje
real/controlado sin modificar visualmente el grid como si la operación
hubiera sido exitosa.

### 7.7 Modificación de una OC existente

La modificación debe pasar por la misma API y controles de seguridad.

Como una OC/Contrato puede ser un dato relevante para la ejecución y
trazabilidad del Proyecto, debe quedar auditado quién realizó el cambio
y cuándo, conforme a los campos/estándar de auditoría existentes.

Esta definición no establece historial de versiones de OC porque el
documento actual no confirma que exista una tabla específica para ello.
Si se requiere conservar valor anterior/nuevo como historial funcional,
deberá definirse posteriormente contra el modelo de BD.

### 7.8 Regla de ejecución

Sin `NumeroContrato` se permite:

-   Consultar Proyecto.
-   Modificar datos generales.
-   Crear/modificar planeación.
-   Crear fases.
-   Crear WBS.
-   Crear actividades.
-   Crear hitos.
-   Asignar responsables.
-   Definir fechas.
-   Definir dependencias.
-   Consultar Gantt.

Pero **no se permite iniciar ejecución de ninguna actividad**.

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

### 7.9 Efecto operativo inmediato

Después de registrar una OC válida, el Proyecto deja de presentar la
condición:

``` text
EN ESPERA DE OC
```

y queda habilitado para iniciar actividades siempre que las demás reglas
de negocio de la actividad también se cumplan.

Registrar una OC **no debe iniciar automáticamente el Proyecto ni
ninguna actividad**, ni modificar avances o fechas por sí mismo.

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
  PRO-001   Folio `000005`               MODIFICAR WEB
  PRO-002   `NumeroContrato`             MODIFICAR / REVISAR API
  PRO-003   `EN ESPERA DE OC`            NUEVO / REVISAR ESTADOS
  PRO-004   Bloqueo inicio sin OC        NUEVO / REVISAR API
  PRO-005   Eliminar Presupuesto         MODIFICAR WEB
  PRO-006   Fecha Fin Estimada en grid   MODIFICAR WEB
  PRO-007   Responsable                  IMPLEMENTADO / REVISAR
  PRO-008   Encargados                   REVISAR
  PRO-009   Fases                        REVISAR
  PRO-010   WBS/EDT                      PARCIAL / REVISAR
  PRO-011   Actividades                  IMPLEMENTADO PARCIAL
  PRO-012   Hitos                        REVISAR MODELO/API
  PRO-013   Dependencias                 REVISAR
  PRO-014   Gantt                        REVISAR
  PRO-015   Avance Proyecto              REVISAR CÁLCULO
  PRO-016   Dashboard                    REVISAR
  PRO-017   Indicadores                  REVISAR
  PRO-018   Conversión Cotización        VALIDAR
  PRO-019   Seguridad EmpresaID          OBLIGATORIO
  PRO-020   Popup independiente OC       NUEVO / IMPLEMENTAR
  PRO-021   Capturar OC desde grid       NUEVO / IMPLEMENTAR
  PRO-022   Modificar OC desde grid      NUEVO / IMPLEMENTAR
  PRO-023   Refrescar condición OC       NUEVO / IMPLEMENTAR
  PRO-024   Auditar cambio de OC         REVISAR / IMPLEMENTAR

## 20. Criterios de aceptación

-   Grid sin Presupuesto.
-   Grid con Fecha Fin Estimada y OC/Contrato.
-   Sin `NumeroContrato`, la columna muestra `EN ESPERA DE OC`.
-   Con `NumeroContrato`, la columna muestra el valor registrado.
-   Existe acción independiente **OC / Contrato** en el grid.
-   La acción abre popup sin entrar a Editar Proyecto.
-   Popup nuevo permite capturar `NumeroContrato`.
-   Popup existente precarga y permite modificar `NumeroContrato`.
-   Guardar utiliza la API de contrato y valida EmpresaID/permisos.
-   Al guardar, el grid se actualiza y deja de mostrar
    `EN ESPERA DE OC`.
-   Un error de API no debe reflejar falsamente la OC como guardada.
-   Registrar la OC no inicia automáticamente actividades.
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

**v2.1:** se independiza la administración de `NumeroContrato` del
formulario general de Proyecto. Se define acción **OC / Contrato** desde
el grid, popup de captura/modificación, uso del endpoint de contrato,
actualización inmediata de la condición `EN ESPERA DE OC`, seguridad,
auditoría, validaciones y criterios de aceptación específicos.
