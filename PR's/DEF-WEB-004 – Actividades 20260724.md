# DEF-WEB-004 -- Actividades

**Proyecto:** ConstructFlow.Web\
**Documento:** DEF-WEB-004\
**Módulo:** Gestión de Proyectos / Actividades\
**Versión:** 2.0\
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

La pantalla actual dentro de Modificar Proyecto presenta:

``` text
WBS | NOMBRE | DESCRIPCIÓN | RESPONSABLE | INICIO | FIN | ESTADO | ACCIONES
```

Se considera implementación inicial y debe evolucionar conservando su
integración con Proyecto.

## 5. Datos funcionales

**Identificación:** ActividadID, ProyectoID, FaseID, CodigoWBS, Nombre,
Descripción.\
**Planeación:** Inicio/Fin plan, duración plan cuando exista, horas
planeadas, responsable, prioridad, dependencias.\
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

Participa en Fase/WBS, Gantt, dependencias y seguimiento. Existe
antecedente de `EsHito` en actividades de Cotización; revisar si
`CF_Actividad` conserva equivalente y si la conversión lo preserva.

## 11. Responsable

Seleccionar únicamente responsables/encargados permitidos dentro del
Proyecto/Empresa. Evitar asignación cruzada entre empresas.

## 12. Estados

La implementación ha manejado `PENDIENTE`, `EN_PROCESO` y `TERMINADA`;
validar catálogo/transiciones reales. El inicio exige OC.

Regla trabajada:

``` text
Avance >= 100 -> TERMINADA
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

Horas \> 0 no implica incremento de porcentaje.

## 15. Recalculo de Fase y Proyecto

Después del avance, backend recalcula Fase y Proyecto conforme a reglas
aprobadas. La lógica no se duplica en JavaScript. Revisar filtros por
ProyectoID/EmpresaID y actividades activas.

## 16. ACT-006 -- Dependencias

Tipos funcionalmente contemplados:

``` text
FS – Finish to Start
SS – Start to Start
FF – Finish to Finish
SF – Start to Finish
```

Validar contra `CF_ActividadDependencia` antes de marcarlos todos
implementados.

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

Debe permitir comparar planeación original, reprogramación vigente y
fechas reales. Revisar cómo se conserva historial antes de definir
sobrescritura de fechas.

## 18. ACT-008 -- Gantt

Vista integral:

``` text
Proyecto
 +-- Fase
      +-- WBS
           +-- Actividad
           +-- Hito
```

Debe representar según disponibilidad: fase, WBS, actividad/hito, fechas
plan/reales, avance, dependencias y ruta crítica. Toda consulta debe
respetar ProyectoID + EmpresaID.

## 19. Ruta Crítica

Objetivo del módulo de programación/Gantt. **REVISAR IMPLEMENTACIÓN**
antes de definir algoritmo o campos. Web no debe calcular una ruta
crítica independiente de backend.

## 20. Evidencias

Actividades se integra con Evidencias/Documentos. Los avances pueden
relacionarse con evidencias conforme a reglas del módulo documental.

## 21. Acciones Web

Según estado, OC, permisos, empresa y rol: - Crear. - Editar. -
Consultar. - Eliminar conforme a reglas. - Iniciar. - Registrar
avance. - Registrar horas. - Reprogramar. - Dependencias. - Historial. -
Evidencias. - Gantt.

No todas deben ser botones dentro del mismo grid.

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
```

Validar Controller → Service → Repository → BD → Swagger → Web.

## 24. Matriz de requerimientos

  ID        Requerimiento                 Estado
  --------- ----------------------------- ----------------------
  ACT-001   Bloqueo inicio sin OC         NUEVO / REVISAR API
  ACT-002   WBS/EDT                       PARCIAL / REVISAR
  ACT-003   Hitos                         REVISAR MODELO/API
  ACT-004   Historial avance              VALIDAR
  ACT-005   Horas                         VALIDAR
  ACT-006   Dependencias                  REVISAR
  ACT-007   Reprogramación                REVISAR
  ACT-008   Gantt                         REVISAR
  ACT-009   CRUD actividad                IMPLEMENTADO PARCIAL
  ACT-010   Responsable                   REVISAR REGLAS
  ACT-011   Fases                         REVISAR
  ACT-012   Recalcular fase               VALIDAR
  ACT-013   Recalcular proyecto           REVISAR CÁLCULO
  ACT-014   Evidencias                    INTEGRACIÓN
  ACT-015   Ruta crítica                  REVISAR
  ACT-016   Retroceso de avance           PENDIENTE DEFINICIÓN
  ACT-017   Seguridad EmpresaID           OBLIGATORIO
  ACT-018   Conversión desde Cotización   REVISAR

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

## 26. Responsive

Debe operar en laptop, tablet y smartphone. En móvil, no forzar todas
las propiedades en un grid horizontal; priorizar información esencial y
usar detalle/panel/modal según diseño.

## 27. Historial

**v2.0:** redefinición de Actividades como núcleo operativo de Proyecto,
incorporando Fases, WBS, Hitos, OC, avance histórico, horas,
dependencias, reprogramación, Gantt, recalculo y seguridad multiempresa.
