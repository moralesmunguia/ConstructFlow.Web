# DEF-WEB-019 -- API Orden de Trabajo

## Objetivo

Documentar la API REST del módulo Orden de Trabajo.

## Alcance

Administración del ciclo operativo de las órdenes de trabajo.

## Endpoints

``` text
GET    /api/v1/ordenes-trabajo
POST   /api/v1/ordenes-trabajo
GET    /api/v1/ordenes-trabajo/{id}
PUT    /api/v1/ordenes-trabajo/{id}
DELETE /api/v1/ordenes-trabajo/{id}
POST   /api/v1/ordenes-trabajo/{id}/asignar
POST   /api/v1/ordenes-trabajo/{id}/iniciar
POST   /api/v1/ordenes-trabajo/{id}/finalizar
GET    /api/v1/proyectos/{id}/ordenes-trabajo
GET    /api/v1/actividades/{id}/ordenes-trabajo
```

## Flujo Funcional

``` text
Crear Orden
    ↓
Asignar Responsable
    ↓
Asignar Recursos
    ↓
Ejecutar Trabajo
    ↓
Registrar Evidencias
    ↓
Actualizar Avance
    ↓
Finalizar Orden
```

## Arquitectura

Cliente → OrdenTrabajoController → OrdenTrabajoService →
OrdenTrabajoRepository → Base de Datos

## Reglas de Negocio

-   Asociación a proyecto y empresa.
-   Responsable obligatorio.
-   Integración con actividades.
-   Registro de evidencias.
-   Cierre con actualización de avance.
-   Bloqueo de modificaciones tras el cierre.

## Integraciones

-   Proyectos
-   Actividades
-   Evidencias
-   Costos
-   Documentos
-   Dashboard
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Asignación
-   Inicio
-   Evidencias
-   Cierre
-   Consulta

## Historial

Versión 1.0.
