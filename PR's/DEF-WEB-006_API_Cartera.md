# DEF-WEB-006 -- API Cartera

## Objetivo

Documentar la API REST del módulo de Cartera.

## Endpoints

``` text
GET /api/v1/cartera
GET /api/v1/cartera/antiguedad
GET /api/v1/dashboard/facturacion
```

## Arquitectura

Cliente → CarteraController → CarteraService → CarteraRepository → Base
de Datos

## Reglas de Negocio

-   Consulta de cuentas por cobrar.
-   Antigüedad de saldos.
-   Integración con facturación y pagos.
-   Dashboard financiero.

## Integraciones

-   Facturas
-   Pagos
-   Proyectos
-   KPI

## Historial

Versión 1.0.
