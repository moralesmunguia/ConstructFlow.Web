# DEF-WEB-003 -- API Proyectos

## Proyecto

ConstructFlow.Api

## Documento

DEF-WEB-003

## Objetivo

Documentar la API REST del módulo de Proyectos.

## Alcance

Creación, actualización, consulta, dashboard, indicadores, contrato,
estados, fases, encargados y conversión desde cotización.

## Endpoints

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

## Arquitectura

Web → Controller → Service → Repository → Base de Datos

## Reglas de Negocio

-   Proyecto asociado a una Empresa.
-   Puede convertirse desde una Cotización.
-   Cambio de estado con historial.
-   Dashboard e indicadores en tiempo real.
-   Seguridad mediante JWT.

## Integraciones

Cotizaciones, Actividades, Evidencias, Costos, Facturación, Rentabilidad
y KPI.

## Historial

Versión 1.0.
