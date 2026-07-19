# DEF-WEB-017 -- API KPI

## Objetivo

Documentar la API REST del módulo KPI.

## Alcance

Indicadores ejecutivos y operativos del Dashboard.

## Endpoints

``` text
GET /api/v1/kpi
GET /api/v1/kpi/dashboard
GET /api/v1/kpi/proyectos
GET /api/v1/kpi/costos
GET /api/v1/kpi/rentabilidad
GET /api/v1/kpi/facturacion
GET /api/v1/kpi/cartera
GET /api/v1/kpi/actividades
GET /api/v1/kpi/proyectos/{id}
```

## Flujo Funcional

``` text
Solicitar KPI
    ↓
Validar JWT
    ↓
Consolidar Información
    ↓
Calcular Indicadores
    ↓
Responder JSON
```

## Arquitectura

Dashboard → KPIController → KPIService → KPIRepository → Base de Datos

## Reglas de Negocio

-   KPI filtrados por EmpresaID.
-   Cálculo en tiempo real.
-   Información consolidada.
-   Solo lectura.

## Integraciones

-   Proyectos
-   Actividades
-   Costos
-   Rentabilidad
-   Facturación
-   Cartera
-   Dashboard

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Dashboard
-   KPI por proyecto
-   KPI financieros
-   Validar filtros

## Historial

Versión 1.0.
