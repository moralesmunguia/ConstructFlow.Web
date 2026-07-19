# DEF-WEB-005 -- API Alertas

## Objetivo

Documentar la API del módulo de Alertas.

## Endpoints

``` text
GET /api/v1/alertas
POST /api/v1/alertas
GET /api/v1/alertas/{id}
PATCH /api/v1/alertas/{id}/estado
GET /api/v1/dashboard/alertas
```

## Arquitectura

Controller → Service → Repository.

## Reglas de Negocio

-   Alertas por empresa.
-   Cambio de estado.
-   Dashboard consolidado.

## Historial

Versión 1.0.
