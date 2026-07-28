# DEF-WEB-002 -- Cotizaciones y Conversión a Proyecto

**Proyecto:** ConstructFlow.Web / ConstructFlow.Api
**Documento:** DEF-WEB-002
**Módulo:** Gestión Cotizaciones
**Versión:** 2.4
**Estado:** Definición funcional/técnica consolidada

# 1. Objetivo

Definir integralmente Cotizaciones: consulta, alta, modificación,
encabezado, partidas, actividades planeadas, JSON Maestro, cálculos,
estados, historial, versiones, vista previa, impresión/PDF, correo,
eliminación y conversión de una cotización aprobada a Proyecto.

# 2. Modelo modular

``` text
CLIENTE
  -> COTIZACIÓN
       -> Encabezado
       -> Partidas
       -> Actividades planeadas
       -> Totales / Descuento / IVA
       -> Estados / Historial / Versiones
       -> PDF / Impresión / Correo
       -> APROBADA
            -> CONVERTIR A PROYECTO
                 -> Fecha inicio
                 -> Responsable
                 -> Proyecto
                 -> Actividades recalculadas
```

# 3. Estado de implementación

**Implementado visible:** grid, nueva/modificar, encabezado, partidas,
actividades, vista previa, impresión, PDF, correo, acciones por estado,
pantalla Convertir a Proyecto, consulta de convertidas, No. Proyecto,
confirmación, Fecha Inicio, Responsable, transferencia y recálculo de
actividades y documento del Proyecto.

**Implementado tras revisión:** reglas de eliminar por estado en Web/API;
versiones y snapshots; historial de estado/persistencia en API;
validación JSON Maestro; descuentos/totales; conversión transaccional;
idempotencia por relación Cotización-Proyecto; Fecha Fin Estimada;
responsable en proyecto/actividades; No. Proyecto visible y alerta para
inconsistencias; Proyecto sin Presupuesto en PDF.

**Confirmado por revisión de código (v2.1):** la conversión
(`CotizacionService::convertirAProyecto()`) pasa `FaseID` explícito a
cada actividad creada (fase única "Planeación") -- **no** hereda el bug
de `FaseID NULL` identificado en DEF-WEB-004 (ese bug es exclusivo del
alta rápida de Actividades desde la Web, que usa un camino de código
distinto, `ActividadService::crear()`). También se confirmó que
`ResponsableID` sí se transfiere a cada actividad.

**Pendiente / fuera de este cierre:** Historial visible en Web; duplicar
cotización; matriz formal de transiciones comerciales completa;
corrección de datos históricos con Estado=Proyecto sin ProyectoID;
pruebas E2E automatizadas; transferencia avanzada de dependencias entre
actividades; transferencia de `EsHito` en la conversión (ver COT-031).

# 4. Grid Cotizaciones

Columnas actuales: 1. Folio. 2. Cliente. 3. Atención. 4. Descripción del
Trabajo. 5. Fecha. 6. Vigencia. 7. Descuento. 8. Total Venta. 9. Estado.
10. Acciones.

Mantener búsqueda, ordenamiento y paginación.

Se distinguen folio corto de presentación (`COT-26`) y folio
interno/documental (`ROM01-COT-000026`). No cambiar almacenamiento sin
revisar API/BD/documentos.

# 5. Estados

Identificados en definición/implementación:

``` text
BORRADOR
EN REVISIÓN
ENVIADA
APROBADA
RECHAZADA
CANCELADA
PROYECTO
```

La UI actual evidencia al menos Borrador, En Revisión, Aprobada y
Proyecto. Confrontar catálogo real y transiciones.

Regla central: sólo una cotización **APROBADA** puede convertirse a
Proyecto.

# 6. Nueva / Modificar Cotización

## Encabezado

  Campo                             Regla
  --------------------------------- ------------------------------------
  Cliente \*                        Obligatorio
  Atención                          Contacto del cliente
  Estado                            Nueva inicia Borrador
  Nombre / Descripción trabajo \*   Obligatorio
  Forma de Pago                     Condición comercial
  Fecha \*                          Obligatoria
  Vigencia \*                       Interfaz indica un mes por defecto
  Tiempo Entrega (días)             Plazo comercial
  IVA                               Incluye IVA, UI actual 16%
  Probabilidad Cierre (%)           Indicador comercial
  Origen Prospecto                  Origen comercial
  Observaciones                     Texto libre

Atención sólo puede contener contactos del Cliente seleccionado. Backend
debe imponer el estado inicial.

# 7. Partidas

Campos actuales:

``` text
DESCRIPCIÓN | UNIDAD | CANTIDAD | P.UNITARIO | COSTO ESTIMADO
DESC.TIPO | DESCUENTO | COMENTARIOS
```

Reglas: número de partida controlado, unidad/cantidad/precio válidos,
TipoDescuento normalizado, AplicaIVA, cálculo backend de
importe/subtotal/descuento/IVA/total y persistencia consistente.

**Hallazgo:** las pantallas aportadas muestran casos donde el descuento
puede producir subtotal negativo. Debe revisarse y bloquearse si la
regla comercial no lo permite.

# 8. Actividades de Cotización

Campos actuales:

``` text
NOMBRE | DESCRIPCIÓN | INICIO | FIN | DURACIÓN (DÍAS) | HORAS
```

Son planeación previa, no actividades ejecutables:

``` text
CF_CotizacionActividad -> CONVERTIR_PROYECTO -> CF_Actividad
```

# 9. JSON Maestro

Arquitectura trabajada:

``` text
Web -> CotizacionController -> CotizacionService
    -> CotizacionPersistenciaService -> Repository -> BD
```

Operaciones identificadas:
`INSERT | UPDATE | DELETE | CAMBIAR_ESTADO | CONSULTAR | CONVERTIR_PROYECTO`.

Normalizaciones trabajadas: `ContactoID -> ClienteContactoID`,
`NombreProyecto -> DescripcionTrabajo`, `CondicionesPago -> FormaPago`,
`AplicaIVA -> IncluyeIVA`, `EstatusID -> EstadoCotizacionID`,
`MonedaID -> Moneda`.

Responsabilidades identificadas: `persist`, `validarMetadata`,
`sincronizarDetalle`, `sincronizarActividades`, `recalcularTotales`,
`generarVersion`, `beginTransaction`, `commit`, `rollback`.

# 10. Modificación y Versiones

La modificación carga encabezado, partidas y actividades y debe
persistir el maestro de forma transaccional.

Restricción a cerrar: - Borrador: editable. - En Revisión: conforme a
permisos/reglas. - Aprobada: no modificación libre. - Proyecto: proteger
trazabilidad. - Cancelada: no editable salvo regla administrativa.

Existe requerimiento previo de versiones. Confrontar tablas/servicios y
`generarVersion()` para determinar cuándo se genera versión y cuál
versión aprobada origina Proyecto.

# 11. Vista previa / PDF / Impresión

La vista implementada contiene datos corporativos, Cliente, Atención,
Fecha, Vigencia, Forma de Pago, Tiempo Entrega, Folio, Estado,
Descripción, Partidas, Unidad, Cantidad, P.U., Importe, Comentarios,
Descuento, totales/notas y, cuando corresponde, actividades.

PDF, vista previa e impresión deben representar la misma versión y usar
importes persistidos/calculados por backend.

# 12. Correo

Modal implementado: destinatario + Enviar/Cancelar.

Validar correo; precargar contacto cuando sea posible; enviar PDF de
versión vigente; registrar resultado si existe auditoría; mostrar
respuesta real de backend. Revisar si enviar provoca transición a
`ENVIADA`.

# 13. Eliminar

No debe ser `DELETE` irrestricto.

  Estado        Regla
  ------------- ---------------------------------
  BORRADOR      Permitido con permiso
  EN REVISIÓN   Revisar
  ENVIADA       Conservar; usar flujo de estado
  APROBADA      NO eliminar
  RECHAZADA     Revisar conservación
  CANCELADA     Conservar para auditoría
  PROYECTO      NO eliminar

Antes: permiso -\> EmpresaID -\> estado -\> Proyecto relacionado -\>
relaciones -\> confirmación -\> baja conforme al estándar
`IsActive`/auditoría.

# 14. Convertir a Proyecto

Pantalla implementada: `index.php?modulo=convertir_proyectos`

Objetivo visible: cotizaciones aprobadas listas para convertir y las ya
convertidas.

Grid:
`FOLIO | CLIENTE | ATENCIÓN | DESCRIPCIÓN | FECHA | VIGENCIA | TOTAL VENTA | ESTADO | NO. PROYECTO | ACCIONES`.

# 15. Elegibilidad

Mostrar/habilitar Convertir únicamente cuando:

``` text
Estado = APROBADA
AND no existe Proyecto relacionado
```

# 16. Recálculo de cronograma (confirmado en código)

`CotizacionService::calcularCronogramaActividades()` encadena las
actividades secuencialmente a partir de la Fecha Inicio del proyecto,
respetando `DuracionPlan` en días hábiles y saltando fines de semana
(según `SabadoLaboral`/`DomingoLaboral` de la Empresa) y días festivos
de `CF_CalendarioFestivo`. Esto es consistente con el ejemplo de la
sección 19.

# 17. Fase creada en conversión (confirmado en código)

`convertirAProyecto()` crea una única fase fija:

``` text
CodigoFase: 'PLAN'
NombreFase: 'Planeacion'
OrdenVisual: 1
```

Todas las actividades convertidas quedan asociadas a esta fase
(`FaseID` explícito en el `INSERT`). No hay transferencia de múltiples
fases desde la Cotización -- coincide con COT-032 "TERMINADO básico".

# 18. Actividades transferidas (confirmado en código)

El payload de cada actividad insertada por conversión incluye:
`ProyectoID, FaseID, CodigoWBS, NombreActividad, Descripcion,
InicioPlan, FinPlan, DuracionPlan, HorasPlaneadas, ResponsableID,
CreatedUserID, CreatedBy`.

**No incluye `EsHito`.** Aunque `CF_CotizacionActividad` pueda tener
`EsHito = 1`, la actividad resultante en `CF_Actividad` siempre nace sin
ese valor (ver COT-031). Este `INSERT` se hace vía
`ProyectoRepository::insertActividad()` directo -- el mismo bypass ya
documentado en DEF-WEB-003 (PRO-010) que evita la validación de
`CodigoWBS` duplicado, ya que no pasa por `ActividadService::crear()`.

# 19. Recálculo de fechas (ejemplo documentado)

La pantalla demuestra recálculo desde la nueva Fecha Inicio.

Ejemplo observado:

``` text
Origen:
Pega de vitropiso 20/07 -> 21/07
Juntear           22/07 -> 23/07
Limpieza          24/07 -> 24/07

Proyecto inicia 03/08:
Pega de vitropiso 03/08 -> 04/08
Juntear           05/08 -> 05/08
Limpieza          06/08 -> 06/08
```

La conversión debe conservar secuencia/offset y duración, no copiar
ciegamente fechas calendario. Conservar horas planeadas cuando
corresponda.

Responsable seleccionado se asigna al Proyecto y actividades según la
regla implementada.

# 20. Fecha Fin Estimada

Debe derivarse de la planeación transferida y aparecer posteriormente en
el grid de Proyectos. Revisar lógica exacta para días naturales/hábiles,
paralelismo y dependencias.

# 21. WBS, Hitos, Fases y Dependencias

El Proyecto requiere estas estructuras, pero la UI actual de Cotización
muestra actividades simples.

Confirmado en código (v2.1):
- **CodigoWBS**: se copia tal cual desde `CF_CotizacionActividad`, sin
  validación de duplicados dentro del proyecto (bypass de
  `existeCodigoWBSProyecto`, ver DEF-WEB-003 PRO-010).
- **FaseID**: se asigna explícito a una fase única "Planeación" (ver
  sección 17). No hereda el bug de `FaseID NULL` de DEF-WEB-004.
- **EsHito**: **no se transfiere en absoluto** -- confirmado ausente del
  payload de inserción (ver sección 18).
- **Dependencias**: no existe código de transferencia en
  `convertirAProyecto()`.
- **Horas**: `HorasPlaneadas` sí se transfiere.
- **Trazabilidad CotizacionActividadID -> ActividadID**: no se
  encontró ningún campo que la conserve en el `INSERT` de
  `CF_Actividad`; pendiente de confirmar si existe en otra tabla.

No inventar información durante la conversión.

# 22. Cotización convertida

Después de convertir: - Estado `Proyecto`. - Mostrar No. Proyecto. -
Ocultar Convertir. - Mostrar acción Proyecto. - Impedir segunda
conversión. - Mantener consulta/PDF. - Mantener trazabilidad.

Ejemplo observado: `COT-24 -> ROM01-PRO-000005`.

Confirmado en código: `convertirAProyecto()` primero busca si ya existe
un Proyecto relacionado (`getByCotizacion()`); si existe, no vuelve a
crear ni duplica -- ver también sección 27 (Idempotencia).

# 23. Inconsistencia detectada

La pantalla contiene registros con Estado `Proyecto` y `NO. PROYECTO`
vacío.

Regla requerida:

``` text
Estado = PROYECTO
=> ProyectoID relacionado
=> Folio Proyecto visible
```

Revisar datos históricos y `CONVERTIR_PROYECTO`.

# 24. Proyecto resultante

Documento actual muestra Cliente, Inicio, Fin Estimado, Estado, Folio,
Descripción, actividades recalculadas, duración, horas y actualmente
**PRESUPUESTO**. Eliminar Presupuesto de este documento.

# 25. OC / NumeroContrato

La conversión puede crear Proyecto sin OC. No inventar NumeroContrato:

``` text
Proyecto sin NumeroContrato -> EN ESPERA DE OC
                              -> permite planeación
                              -> NO permite iniciar actividades
```

La restricción de ejecución corresponde a Proyecto/Actividades y API.

# 26. API identificada

``` text
GET    /api/v1/cotizaciones
POST   /api/v1/cotizaciones
POST   /api/v1/cotizaciones/persist
GET    /api/v1/cotizaciones/persist/{id}
PUT    /api/v1/cotizaciones/persist/{id}
GET    /api/v1/cotizaciones/{id}
PUT    /api/v1/cotizaciones/{id}
DELETE /api/v1/cotizaciones/{id}
PUT    /api/v1/cotizaciones/{id}/estado
PATCH  /api/v1/cotizaciones/{id}/estado
GET    /api/v1/cotizaciones/{id}/historial
GET    /api/v1/cotizaciones/{id}/json
```

Confrontar ruta real de conversión en Router/Controller/Swagger; no
fijar una ruta nueva hasta verificarla. Confirmado en código: la
conversión real vive en `CotizacionService::cambiarEstado()` (transición
a `EstadoCotizacionID = 7`), que delega a `convertirAProyecto()`; también
existe `ProyectoService::convertirCotizacion()` como wrapper que llama al
mismo flujo.

# 27. Idempotencia

Dos solicitudes de conversión no deben crear dos Proyectos:

``` text
¿ya existe ProyectoID?
SÍ -> rechazar/devolver relación existente
NO -> continuar
```

Agregar protección de BD cuando el modelo lo permita.

Confirmado en código: `convertirAProyecto()` consulta
`proyectoRepository->getByCotizacion()` antes de crear, y reutiliza el
`ProyectoID` existente en vez de duplicar. La protección es a nivel
aplicación (consulta previa dentro de la misma transacción); no se
confirmó un `UNIQUE` a nivel BD sobre `CF_Proyecto.CotizacionID` como
segunda barrera ante condiciones de carrera.

# 28. Seguridad/Auditoría

Validar JWT/sesión, EmpresaID, UsuarioID, permisos, pertenencia de
Cotización, Cliente/Contacto y Responsable. Nunca confiar en IDs del
navegador.

Auditar crear/modificar, partidas, actividades, estado, versión, correo,
eliminar y convertir.

# 29. Matriz funcional

  ID        Requerimiento                  Estado
  --------- ------------------------------ -----------------------------------
  COT-001   Grid                           IMPLEMENTADO
  COT-002   Alta                           IMPLEMENTADO
  COT-003   Modificar                      IMPLEMENTADO
  COT-004   Encabezado                     IMPLEMENTADO
  COT-005   Cliente/Atención               IMPLEMENTADO / VALIDAR
  COT-006   Partidas                       IMPLEMENTADO
  COT-007   Totales                        TERMINADO
  COT-008   Descuentos                     TERMINADO
  COT-009   IVA                            TERMINADO
  COT-010   Actividades cotización         IMPLEMENTADO
  COT-011   JSON Maestro                   TERMINADO
  COT-012   Vista previa                   IMPLEMENTADO
  COT-013   Impresión                      IMPLEMENTADO
  COT-014   PDF                            IMPLEMENTADO
  COT-015   Correo                         UI IMPLEMENTADA / VALIDAR BACKEND
  COT-016   Estados                        PARCIAL - matriz formal pendiente
  COT-017   Historial                      API TERMINADA / WEB PENDIENTE
  COT-018   Versiones                      TERMINADO
  COT-019   Eliminar                       TERMINADO
  COT-020   Aprobada no eliminable         TERMINADO
  COT-021   Convertir Proyecto             IMPLEMENTADO -- confirmado en código: `CotizacionService::convertirAProyecto()`, transaccional, con verificación previa de Proyecto existente (ver COT-028)
  COT-022   Fecha Inicio conversión        IMPLEMENTADO
  COT-023   Responsable conversión         IMPLEMENTADO
  COT-024   Responsable actividades        TERMINADO -- confirmado: `ResponsableID` se pasa explícito en cada `INSERT` de actividad
  COT-025   Recalcular fechas              TERMINADO -- confirmado: `calcularCronogramaActividades()` encadena secuencialmente respetando duración en días hábiles, festivos y calendario laboral de la Empresa
  COT-026   Fecha Fin Estimada             TERMINADO
  COT-027   No. Proyecto                   TERMINADO / datos históricos a corregir
  COT-028   Impedir doble conversión       TERMINADO -- confirmado: `getByCotizacion()` se consulta antes de crear; protección a nivel aplicación, sin confirmar `UNIQUE` en BD como segunda barrera (ver sección 27)
  COT-029   Relación Cotización-Proyecto   TERMINADO
  COT-030   WBS                            RESUELTO (2026-07-27) -- se agregó `CotizacionService::validarCodigoWBSDuplicado()`, invocada antes de insertar actividades en `convertirAProyecto()`. Si el lote de la cotización trae `CodigoWBS` repetido, la conversión completa se rechaza (rollback) con mensaje claro. Sigue siendo un `INSERT` directo vía `ProyectoRepository::insertActividad()`, no pasa por `ActividadService::crear()` -- se optó por validar en el punto de la conversión en vez de reencaminar todo el flujo
  COT-031   Hitos                          RESUELTO (2026-07-27) -- se agregó `EsHito` al `INSERT` de `ProyectoRepository::insertActividad()` (no existía la columna en el statement) y al payload que arma `CotizacionService::convertirAProyecto()`. Corrige el flujo hacia adelante; actividades ya convertidas antes de este fix no se corrigen automáticamente
  COT-032   Fases                          TERMINADO básico -- confirmado: se crea una única fase fija "Planeación" (`CodigoFase: 'PLAN'`), sin transferir múltiples fases
  COT-033   Dependencias                   RESUELTO (2026-07-27) -- `CF_CotizacionActividad` no tiene modelo de dependencias FS/SS/FF/SF (solo `ActividadPadreID`, jerarquía simple padre-hijo). Se agregó transferencia: durante `convertirAProyecto()` se construye un mapa `CotizacionActividadID -> ActividadID` nuevo, y por cada actividad con `ActividadPadreID` se crea una Dependencia `FS` (sin desfase) en `CF_ActividadDependencia` vía `ActividadRepository::insertDependencia()`. No es transferencia 1:1 de tipos de dependencia -- es la mejor equivalencia posible dado que Cotización no maneja SS/FF/SF
  COT-034   Horas                          TERMINADO -- confirmado: `HorasPlaneadas` se transfiere
  COT-035   Proyecto sin Presupuesto       TERMINADO
  COT-036   NumeroContrato                 NO GENERAR EN CONVERSIÓN
  COT-037   EmpresaID                      OBLIGATORIO
  COT-038   Auditoría                      TERMINADO API
  COT-039   Duplicar                       PENDIENTE
  COT-040   Folio corto/interno            TERMINADO
  COT-041   Trazabilidad CotizacionActividadID -> ActividadID   NUEVO -- REVISAR: no se encontró campo que conserve esta relación en el `INSERT` de `CF_Actividad` durante la conversión

# 30. Casos de aceptación

1.  Nueva válida inicia Borrador.
2.  Atención sólo pertenece al Cliente.
3.  Backend recalcula totales.
4.  Descuento inválido se rechaza.
5.  Modificación respeta estado.
6.  PDF/vista previa corresponden a misma versión.
7.  Correo muestra resultado backend.
8.  Borrador eliminable con permiso.
9.  Aprobada no eliminable.
10. Proyecto no eliminable.
11. No aprobada no convertible.
12. Aprobada + Fecha Inicio + Responsable crea Proyecto.
13. Actividades se transfieren/recalculan.
14. Responsable queda en Proyecto/actividades.
15. Fecha Fin Estimada se persiste.
16. Segunda conversión no crea otro Proyecto.
17. Grid muestra No. Proyecto.
18. Fallo intermedio hace rollback.
19. IDs de otra Empresa son rechazados.
20. Proyecto puede crearse sin OC, pero actividades no inician hasta
    capturarla.
21. Actividad de cotización marcada como Hito: **actualmente NO se
    conserva** al convertir a Proyecto (nuevo, v2.1 -- ver COT-031).

# 31. Pendientes prioritarios

**Integridad:** TERMINADO validar descuentos, cerrar eliminar,
idempotencia, transacción completa, Fecha Fin Estimada y quitar
Presupuesto del Proyecto. PENDIENTE corregir datos históricos con Estado
Proyecto sin No. Proyecto.

**Planeación:** TERMINADO WBS básico, fase inicial, horas y trazabilidad
CotizacionActividadID -> ActividadID (**revertido a REVISAR en v2.1** --
no se encontró en código, ver COT-041). PARCIAL Hitos (**confirmado
como NO transferido en absoluto, ver COT-031**). PENDIENTE transferencia
de dependencias.

**Ciclo comercial:** TERMINADO Versiones e Historial API. PENDIENTE
Historial Web, Duplicar, matriz formal de transiciones y transición
ENVIADA al enviar correo.

# 32. Dependencias

Mantener alineado con: - DEF-WEB-000 -- Estándares de Desarrollo
Frontend. - DEF-WEB-003 -- Proyectos. - DEF-WEB-004 -- Actividades. -
ARQ-004 -- Arquitectura API REST. - ARQ-005 -- Arquitectura FrontEnd.

# 33. Historial

  -----------------------------------------------------------------------
  Versión                             Descripción
  ----------------------------------- -----------------------------------
  1.0                                 Documento inicial API Cotización.

  2.0                                 Consolidación detallada de
                                      implementación Web, reglas
                                      trabajadas, eliminación y
                                      conversión Cotización → Proyecto
                                      con fecha inicio, responsable,
                                      trazabilidad y recálculo de
                                      actividades.

  2.1 (2026-07-27)                    Confrontación de código real de
                                      `CotizacionService::
                                      convertirAProyecto()` contra la
                                      matriz. Se confirma que el bug de
                                      `FaseID NULL` de DEF-WEB-004 NO
                                      aplica a la conversión (usa fase
                                      fija explícita). Se degrada
                                      COT-031 (Hitos) de "PARCIAL" a
                                      confirmado ausente: `EsHito` no
                                      se incluye en el payload de
                                      inserción de actividades durante
                                      la conversión. Se revierte
                                      COT-041 (trazabilidad
                                      CotizacionActividadID ->
                                      ActividadID) de "TERMINADO" a
                                      "REVISAR" -- no se encontró en
                                      código. Se confirma COT-030
                                      (bypass de validación WBS) y
                                      COT-033 (sin transferencia de
                                      dependencias) tal como estaban
                                      documentados.

  2.2 (2026-07-27)                    Implementado el fix de COT-031:
                                      se agregó la columna `EsHito`
                                      al `INSERT` de
                                      `ProyectoRepository::
                                      insertActividad()` (no existía
                                      en el statement) y se agregó
                                      `EsHito` al payload armado por
                                      `CotizacionService::
                                      convertirAProyecto()`. El fix
                                      corrige el flujo hacia
                                      adelante; actividades ya
                                      convertidas antes de este
                                      cambio no se corrigen
                                      automáticamente.

  2.3 (2026-07-27)                    Implementado el fix de COT-030:
                                      se agregó
                                      `CotizacionService::
                                      validarCodigoWBSDuplicado()`,
                                      que rechaza la conversión
                                      completa (con rollback) si el
                                      lote de actividades de la
                                      cotización trae `CodigoWBS`
                                      repetido. Sigue siendo un
                                      `INSERT` directo que no pasa
                                      por `ActividadService::crear()`.

  2.4 (2026-07-27)                    Implementado el fix de COT-033:
                                      se agregó transferencia de la
                                      jerarquía `ActividadPadreID` de
                                      `CF_CotizacionActividad` como
                                      Dependencias `FS` reales en
                                      `CF_ActividadDependencia`
                                      (`convertirAProyecto()` ahora
                                      construye un mapa
                                      `CotizacionActividadID ->
                                      ActividadID` nuevo y llama
                                      `ActividadRepository::
                                      insertDependencia()`). No es
                                      transferencia 1:1 de tipos de
                                      dependencia (Cotización no
                                      maneja SS/FF/SF, solo jerarquía
                                      simple padre-hijo).
  -----------------------------------------------------------------------
