# DEF-WEB-004 -- Actividades

**Proyecto:** ConstructFlow.Web
**Documento:** DEF-WEB-004
**Módulo:** Gestión de Proyectos / Actividades
**Versión:** 2.1
**Estado:** Definición funcional y técnica detallada

## 1. Objetivo

Definir **Actividades** como componente operativo central de Proyecto.
No es un CRUD aislado: administra Fases, WBS/EDT, Actividades, Hitos,
Responsables, Dependencias, Avance, Horas, Reprogramación, Evidencias y
Gantt.

## 2. Relación modular

``` text
PROYECTO
 +-- FASES
 |    +-- WBS / EDT
 |         +-- ACTIVIDADES
 |         +-- HITOS
 +-- ENCARGADOS
 +-- OC / CONTRATO -> habilita ejecución
```

## 3. Alcance

Consulta, alta, modificación, eliminación conforme a reglas, fase, WBS,
actividades, hitos, responsable, fechas plan/reales, duración,
prioridad, estado, avance, horas, dependencias, reprogramación,
evidencias, historial, Gantt, recalculo de fase/proyecto y seguridad
multiempresa.

## 4. Baseline Web actual

La pantalla dentro de Modificar Proyecto presenta:

``` text
WBS | NOMBRE | DESCRIPCIÓN | RESPONSABLE | INICIO | FIN | ESTADO | HITO | ACCIONES
```

El guardado de cada fila ya no depende exclusivamente del botón check
individual: el botón "Guardar" del proyecto persiste también todas las
filas de la tabla en una sola operación (ver DEF-WEB-003, PRO-023).

**Pendiente identificado en v2.1:** la tabla no tiene selector de Fase.
Toda actividad creada desde este formulario queda sin `FaseID` explícito
capturado por el usuario (ver ACT-002/ACT-011 más abajo).

## 5. Datos funcionales

**Identificación:** ActividadID, ProyectoID, FaseID, CodigoWBS, Nombre,
Descripción.
**Planeación:** Inicio/Fin plan, duración plan cuando exista, horas
planeadas, responsable, prioridad, dependencias.
**Ejecución:** Inicio/Fin real cuando exista, avance, horas
reales/acumuladas, estado, evidencias e historial.

## 6. ACT-001 -- Bloqueo de inicio sin OC

Ninguna actividad puede iniciar si `Proyecto.NumeroContrato` está vacío.

``` text
PENDIENTE -> solicitar inicio -> ¿NumeroContrato?
                              NO -> RECHAZAR
                              SÍ -> CONTINUAR
```

Sin OC sí se permite crear/editar actividades, asignar
fase/WBS/responsable, planear fechas, crear hitos y dependencias. La
validación debe residir en API/Service.

## 7. Fases

Cada actividad debe asociarse a una fase cuando el modelo lo requiera.
El avance de actividades alimenta el avance de fase. Revisar que el
cálculo no mezcle proyectos y considere correctamente
ProyectoID/EmpresaID.

**Hallazgo v2.1:** el formulario Web de alta rápida de actividades
(dentro de Modificar Proyecto) nunca enviaba `FaseID` al crear, y
`ActividadService::crear()` tampoco tenía un valor de respaldo, por lo
que toda actividad nueva quedaba con `FaseID = NULL`. Esto afecta
directamente el cálculo de avance de Fase (ver ACT-012) y la generación
de `CodigoWBS` por fase (ver ACT-002), ya que ambos dependen de que la
actividad esté correctamente asociada a una Fase.

## 8. ACT-002 -- WBS / EDT

`CodigoWBS` representa la posición jerárquica:

``` text
1
1.1
1.2
2
2.1
```

Evitar duplicidad dentro del proyecto. Existe antecedente de
`existeCodigoWBSProyecto(proyectoID, codigoWBS)`.

**Pendiente:** cerrar si API genera WBS o Web lo captura de manera
controlada. No dejar texto libre sin validación.

**Actualizado v2.1:** se agregó `ActividadService::obtenerFaseIDPorDefecto()`
-- si `FaseID` no llega en la petición de creación, la API asigna
automáticamente la primera Fase del proyecto (menor `OrdenVisual`) en
lugar de dejar `NULL`. Si el proyecto no tiene ninguna Fase registrada,
el comportamiento previo se conserva (`FaseID = NULL`). Esto corrige el
síntoma para actividades nuevas hacia adelante; **actividades ya
existentes con `FaseID = NULL` no se corrigen automáticamente** y
requieren un `UPDATE` puntual si se detectan en producción.

**Pendiente real:** esto es un remedio de backend, no resuelve la causa
de UX -- la tabla de Actividades en Web sigue sin selector de Fase, por
lo que en proyectos con más de una Fase el usuario no puede elegir a
cuál pertenece la actividad (siempre cae en la primera).

## 9. Actividades

Una actividad normal representa trabajo con duración y puede manejar
Nombre, Descripción, Fase, WBS, Responsable, Inicio/Fin plan, Inicio/Fin
real, Estado, Avance, Horas, Prioridad, Dependencias y Evidencias según
el modelo disponible.

## 10. ACT-003 -- Hitos

Un hito es un punto relevante, no una actividad normal con duración:

``` text
Actividad: Inicio ============== Fin
Hito:                 ◆ fecha objetivo
```

Participa en Fase/WBS, Gantt, dependencias y seguimiento. `EsHito` existe
en `CF_Actividad`, está conectado en API y Web (checkbox en la tabla de
actividades) y se refleja visualmente en el Gantt (barra amarilla,
`custom_class: 'bar-hito'`).

## 11. Responsable

Seleccionar únicamente responsables/encargados permitidos dentro del
Proyecto/Empresa. Evitar asignación cruzada entre empresas.

## 12. Estados

La implementación maneja `PENDIENTE`, `EN_PROCESO`, `COMPLETADA` y
`CANCELADA`; el inicio exige OC.

Regla trabajada:

``` text
Avance >= 100 -> COMPLETADA
```

## 13. ACT-004 -- Historial de Avance

No limitarse a actualizar `CF_Actividad.Avance`. Utilizar el historial
`CF_ActividadAvance`.

``` text
Registrar avance
 -> CF_ActividadAvance
 -> actualizar CF_Actividad
 -> recalcular Fase
 -> recalcular Proyecto
 -> Indicadores/Dashboard
```

Conceptos identificados: FechaAvance, AvanceAnterior/Nuevo,
HorasTrabajadas/Acumuladas, EstadoAnterior/Nuevo, Observaciones,
UsuarioID, EvidenciaRequerida, CantidadEvidencias, TipoRegistro y
auditoría.

Validación:

``` text
0 <= Avance <= 100
```

Caso `90 -> 80`: **PENDIENTE DE DEFINICIÓN FUNCIONAL**.

## 14. ACT-005 -- Horas

Permitir registrar horas sin modificar necesariamente avance:

``` text
AvanceAnterior = 60
AvanceNuevo    = 60
Horas          = +8
```

Horas > 0 no implica incremento de porcentaje.

## 15. Recalculo de Fase y Proyecto

Después del avance, backend recalcula Fase y Proyecto conforme a reglas
aprobadas. La lógica no se duplica en JavaScript. Revisar filtros por
ProyectoID/EmpresaID y actividades activas.

Este recálculo depende de que la actividad tenga `FaseID` asignado (ver
sección 7). Actividades huérfanas (`FaseID = NULL`) no se contabilizan
en el avance de ninguna Fase, aunque sí aparecen correctamente en el
Gantt y en el avance general del Proyecto.

## 16. ACT-006 -- Dependencias

Tipos funcionalmente contemplados:

``` text
FS – Finish to Start
SS – Start to Start
FF – Finish to Finish
SF – Start to Finish
```

CRUD completo con detección de ciclos ya existía en API
(`CF_ActividadDependencia`); conectado al Gantt en Web.

Endpoints identificados:

``` text
POST   /api/v1/actividades/dependencia
PUT    /api/v1/actividades/dependencia/{id}
DELETE /api/v1/actividades/dependencia/{id}
GET    /api/v1/proyectos/{id}/dependencias
```

## 17. ACT-007 -- Reprogramación

Endpoints:

``` text
PUT   /api/v1/actividades/{id}/reprogramar
PATCH /api/v1/actividades/{id}/reprogramar
```

El endpoint de backend ya validaba correctamente dependencias FS/SS/FF/SF
y recalculaba duración en días hábiles. **Bug de UI corregido en v2.1:**
al arrastrar una barra en el Gantt, la librería (Frappe Gantt) dispara el
evento `on_date_change` en cada día que se cruza durante el arrastre, no
solo cuando se suelta el mouse -- esto generaba una confirmación por cada
día recorrido en vez de una sola al soltar. Además, el manejador interno
de la librería detenía la propagación del evento `mouseup`, por lo que
un listener normal en `document` no detectaba el soltar real.

Se corrigió: (1) `on_date_change` ahora solo guarda la posición más
reciente sin mostrar nada; (2) se agregó un listener de `mouseup`/
`touchend` a nivel `document` **en fase de captura** (para no depender de
que la librería propague el evento), que dispara la confirmación única
con la posición final al soltar.

Debe permitir comparar planeación original, reprogramación vigente y
fechas reales. Revisar cómo se conserva historial antes de definir
sobrescritura de fechas -- **sigue pendiente**, el fix de v2.1 fue
exclusivamente de UX del arrastre, no de modelo de datos histórico.

## 18. ACT-008 -- Gantt

Vista integral:

``` text
Proyecto
 +-- Fase
      +-- WBS
           +-- Actividad
           +-- Hito
```

`ActividadService::obtenerGantt()` ya calcula ruta crítica real (CPM /
orden topológico) en backend. Web consume el endpoint y agrega: días
festivos (sombreado + lista de chips), marcado de actividades vencidas,
reportar avance por doble clic o clic derecho, reprogramar por arrastre
(con confirmación única, ver ACT-007), y una pestaña Dashboard por
proyecto (% avance, días concluidos/total, tareas por estado).

Toda consulta respeta ProyectoID + EmpresaID.

## 19. Ruta Crítica

Ya implementada en backend (`ActividadService::calcularRutaCritica()`).
Web únicamente la pinta (`custom_class: 'bar-critica'`), no la recalcula.

## 20. Evidencias

Actividades se integra con Evidencias/Documentos. Los avances pueden
relacionarse con evidencias conforme a reglas del módulo documental.

## 21. Acciones Web

Según estado, OC, permisos, empresa y rol: Crear, Editar, Consultar,
Eliminar conforme a reglas, Iniciar, Registrar avance, Registrar horas,
Reprogramar, Dependencias, Historial, Evidencias, Gantt.

No todas son botones dentro del mismo grid -- reportar avance y
reprogramar viven en el Gantt (doble clic / arrastre), no en la tabla de
edición del proyecto.

## 22. Seguridad

Validar autenticación, EmpresaID, ProyectoID, ActividadID, permisos y
auditoría. Impedir operar una actividad de otra empresa cambiando IDs en
el navegador.

## 23. API identificada

``` text
GET    /api/v1/proyectos/{id}/actividades
POST   /api/v1/proyectos/{id}/actividades
GET    /api/v1/actividades/{id}
PUT    /api/v1/actividades/{id}
DELETE /api/v1/actividades/{id}
POST   /api/v1/actividades/{id}/avance
PUT    /api/v1/actividades/{id}/reprogramar
PATCH  /api/v1/actividades/{id}/reprogramar
POST   /api/v1/actividades/dependencia
PUT    /api/v1/actividades/dependencia/{id}
DELETE /api/v1/actividades/dependencia/{id}
GET    /api/v1/proyectos/{id}/dependencias
GET    /api/v1/proyectos/{id}/gantt
GET    /api/v1/dias-festivos
GET    /api/v1/calendario-laboral
```

Validar Controller → Service → Repository → BD → Swagger → Web.

## 24. Matriz de requerimientos

  ID        Requerimiento                 Estado
  --------- ----------------------------- ----------------------
  ACT-001   Bloqueo inicio sin OC          RESUELTO (`ActividadService::validarProyectoConOrdenCompra()`)
  ACT-002   WBS/EDT                        PARCIAL -- generación automática de `CodigoWBS` resuelta; hallazgo v2.1: `FaseID` quedaba NULL en toda alta desde Web, corregido con valor por defecto en backend (`obtenerFaseIDPorDefecto()`); falta selector de Fase en la UI para proyectos con más de una fase
  ACT-003   Hitos                          RESUELTO (`EsHito` conectado en API, Web y Gantt)
  ACT-004   Historial avance                VALIDAR (pendiente confirmar uso real de `CF_ActividadAvance` vs. solo actualizar `CF_Actividad.Avance`)
  ACT-005   Horas                           VALIDAR
  ACT-006   Dependencias                    RESUELTO (CRUD + detección de ciclos, conectado al Gantt)
  ACT-007   Reprogramación                  RESUELTO EN WEB v2.1 -- endpoint de backend ya validaba correctamente; se corrigió bug de UX en el arrastre del Gantt (confirmación por cada día cruzado en vez de al soltar). Pendiente: conservación de historial de reprogramaciones (planeación original vs. vigente vs. real)
  ACT-008   Gantt                           RESUELTO (ruta crítica real en backend, Web agrega festivos/vencidas/avance/reprogramar/Dashboard)
  ACT-009   CRUD actividad                  IMPLEMENTADO (alta/edición/eliminación en formulario de Proyecto; guardado masivo agregado en DEF-WEB-003 PRO-023)
  ACT-010   Responsable                     REVISAR REGLAS (sin cambios en esta sesión)
  ACT-011   Fases                           PARCIAL -- ver ACT-002. Corregido el `NULL` por defecto; falta selector manual de Fase en la Web
  ACT-012   Recalcular fase                 VALIDAR -- depende de ACT-002/ACT-011 (actividades sin Fase no se contaban); con el fix de FaseID por defecto debería reflejar correctamente hacia adelante, falta validar con datos reales
  ACT-013   Recalcular proyecto             REVISAR CÁLCULO (sin cambios en esta sesión)
  ACT-014   Evidencias                      INTEGRACIÓN (sin cambios en esta sesión)
  ACT-015   Ruta crítica                    RESUELTO EN BACKEND (CPM/orden topológico), Web solo la pinta
  ACT-016   Retroceso de avance             PENDIENTE DEFINICIÓN
  ACT-017   Seguridad EmpresaID             OBLIGATORIO
  ACT-018   Conversión desde Cotización     REVISAR (bypass de validación WBS documentado en DEF-WEB-003 PRO-010/PRO-018)

## 25. Casos de aceptación

1.  Crear actividad sin OC: **permitido**.
2.  Planear fechas/responsable sin OC: **permitido**.
3.  Iniciar sin OC: **rechazado por API**.
4.  Capturar OC e iniciar: permitido si cumple demás reglas.
5.  Registrar avance: crear historial y recalcular.
6.  Avance 100%: terminar conforme a regla vigente.
7.  Registrar horas sin cambiar avance: permitido.
8.  WBS duplicado: rechazar.
9.  Actividad de otra Empresa: rechazar.
10. Retroceso 90→80: pendiente de definición.
11. Crear actividad sin capturar Fase: la API asigna automáticamente la
    primera Fase del proyecto (nuevo, v2.1).
12. Arrastrar una actividad en el Gantt y soltarla: se pide **una sola**
    confirmación con la posición final, sin importar cuántos días se
    haya cruzado durante el arrastre (nuevo, v2.1).

## 26. Responsive

Debe operar en laptop, tablet y smartphone. En móvil, no forzar todas
las propiedades en un grid horizontal; priorizar información esencial y
usar detalle/panel/modal según diseño.

## 27. Historial

**v2.0:** redefinición de Actividades como núcleo operativo de Proyecto,
incorporando Fases, WBS, Hitos, OC, avance histórico, horas,
dependencias, reprogramación, Gantt, recalculo y seguridad multiempresa.

**v2.1 (2026-07-27):** hallazgo y corrección de causa raíz en ACT-002/
ACT-011 (`FaseID` quedaba `NULL` en toda alta de actividad desde Web,
por falta de selector en la UI y de valor por defecto en backend --
se agregó `obtenerFaseIDPorDefecto()` en `ActividadService`). Se resuelve
ACT-007 en su componente Web (confirmación única de reprogramación al
soltar en el Gantt, en vez de una por cada día cruzado durante el
arrastre). Se documenta que ACT-009 ahora incluye guardado masivo de
actividades (ver DEF-WEB-003, PRO-023). Pendiente abierto y explícito:
selector de Fase en la tabla de Actividades del formulario Web para
proyectos con más de una Fase.
