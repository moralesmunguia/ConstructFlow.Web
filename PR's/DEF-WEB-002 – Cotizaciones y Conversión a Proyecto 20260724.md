# DEF-WEB-002 -- Cotizaciones y Conversión a Proyecto

**Proyecto:** ConstructFlow.Web / ConstructFlow.Api\
**Documento:** DEF-WEB-002\
**Módulo:** Gestión Cotizaciones\
**Versión:** 2.0\
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
pantalla Convertir a Proyecto, consulta de convertidas, No. Proyecto,
confirmación, Fecha Inicio, Responsable, transferencia y recálculo de
actividades y documento del Proyecto.

**Revisar/completar:** reglas de eliminar; versiones; historial visible;
duplicar; matriz exacta de estados/transiciones; restricciones de
edición; validación JSON Maestro; descuentos/totales; transferencia
WBS/Hitos/Fases/Dependencias; idempotencia; registros Estado=Proyecto
sin No. Proyecto; auditoría y pruebas E2E.

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
AND usuario tiene permiso
AND pertenece a EmpresaID
```

La API debe repetir todas las validaciones.

# 16. Confirmación

UI actual solicita: - Fecha de inicio del proyecto. - Responsable del
proyecto. - Sí, convertir / Cancelar.

La interfaz establece que el responsable queda asignado al Proyecto y a
todas sus actividades.

Datos de operación: CotizacionID, EmpresaID seguro, FechaInicio,
ResponsableID, UsuarioID ejecutor.

# 17. Transacción de conversión

``` text
Validar APROBADA y no convertida
 -> validar Fecha Inicio
 -> validar Responsable
 -> BEGIN
 -> crear Proyecto
 -> relacionar Cotización
 -> convertir actividades
 -> recalcular fechas
 -> asignar Responsable
 -> actualizar estado Cotización
 -> historial/auditoría
 -> COMMIT
```

Cualquier error: `ROLLBACK`. No debe quedar Proyecto parcial.

# 18. Datos transferidos

Confrontar implementación exacta. Funcionalmente: \| Cotización \|
Proyecto \| \|---\|---\| \| CotizacionID \| referencia origen \| \|
EmpresaID \| EmpresaID \| \| ClienteID \| ClienteID \| \|
DescripcionTrabajo \| Nombre/Descripción \| \| Fecha solicitada \|
FechaInicio \| \| Planeación actividades \| FechaFinEstimada calculada
\| \| Responsable seleccionado \| Responsable \| \| Observaciones
aplicables \| Observaciones \|

**Proyecto queda SIN Presupuesto.** El Total Venta pertenece a
Cotización. La salida actual de Proyecto convertido que muestra
`PRESUPUESTO` debe modificarse conforme a DEF-WEB-003.

# 19. Conversión de actividades

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
muestra actividades simples. Revisar qué existe realmente en
`CF_CotizacionActividad`.

Pendientes: - EsHito. - CodigoWBS. - FaseID/regla de fase inicial. -
Dependencias. - Horas/duración. - trazabilidad CotizacionActividadID -\>
ActividadID.

No inventar información durante la conversión.

# 22. Cotización convertida

Después de convertir: - Estado `Proyecto`. - Mostrar No. Proyecto. -
Ocultar Convertir. - Mostrar acción Proyecto. - Impedir segunda
conversión. - Mantener consulta/PDF. - Mantener trazabilidad.

Ejemplo observado: `COT-24 -> ROM01-PRO-000005`.

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
fijar una ruta nueva hasta verificarla.

# 27. Idempotencia

Dos solicitudes de conversión no deben crear dos Proyectos:

``` text
¿ya existe ProyectoID?
SÍ -> rechazar/devolver relación existente
NO -> continuar
```

Agregar protección de BD cuando el modelo lo permita.

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
  COT-007   Totales                        IMPLEMENTADO / REVISAR
  COT-008   Descuentos                     IMPLEMENTADO / REVISAR
  COT-009   IVA                            IMPLEMENTADO / VALIDAR
  COT-010   Actividades cotización         IMPLEMENTADO
  COT-011   JSON Maestro                   IMPLEMENTADO / E2E
  COT-012   Vista previa                   IMPLEMENTADO
  COT-013   Impresión                      IMPLEMENTADO
  COT-014   PDF                            IMPLEMENTADO
  COT-015   Correo                         UI IMPLEMENTADA / VALIDAR BACKEND
  COT-016   Estados                        PARCIAL / REVISAR MATRIZ
  COT-017   Historial                      API IDENTIFICADA / REVISAR WEB
  COT-018   Versiones                      REVISAR
  COT-019   Eliminar                       DEFINIR/VALIDAR REGLAS
  COT-020   Aprobada no eliminable         REQUERIDO
  COT-021   Convertir Proyecto             IMPLEMENTADO
  COT-022   Fecha Inicio conversión        IMPLEMENTADO
  COT-023   Responsable conversión         IMPLEMENTADO
  COT-024   Responsable actividades        IMPLEMENTADO / VALIDAR
  COT-025   Recalcular fechas              IMPLEMENTADO / VALIDAR
  COT-026   Fecha Fin Estimada             IMPLEMENTADO / VALIDAR
  COT-027   No. Proyecto                   PARCIAL
  COT-028   Impedir doble conversión       VALIDAR
  COT-029   Relación Cotización-Proyecto   PARCIAL / REVISAR
  COT-030   WBS                            REVISAR
  COT-031   Hitos                          REVISAR
  COT-032   Fases                          REVISAR
  COT-033   Dependencias                   REVISAR
  COT-034   Horas                          IMPLEMENTADO / VALIDAR
  COT-035   Proyecto sin Presupuesto       MODIFICAR SALIDA
  COT-036   NumeroContrato                 NO GENERAR EN CONVERSIÓN
  COT-037   EmpresaID                      OBLIGATORIO
  COT-038   Auditoría                      REVISAR
  COT-039   Duplicar                       REQUERIMIENTO PREVIO / REVISAR
  COT-040   Folio corto/interno            DOCUMENTAR

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
17. Grid muestra No. Proyecto.
18. Fallo intermedio hace rollback.
19. IDs de otra Empresa son rechazados.
20. Proyecto puede crearse sin OC, pero actividades no inician hasta
    capturarla.

# 31. Pendientes prioritarios

**Integridad:** validar descuentos; cerrar eliminar; idempotencia;
corregir Estado Proyecto sin No. Proyecto; transacción completa; Fecha
Fin Estimada; quitar Presupuesto del Proyecto.

**Planeación:** WBS, Hitos, Fases, Dependencias, horas y trazabilidad de
actividades.

**Ciclo comercial:** matriz de estados, Versiones, Historial Web,
Duplicar y transición al enviar correo.

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
  -----------------------------------------------------------------------
