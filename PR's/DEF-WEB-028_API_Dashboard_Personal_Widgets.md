# DEF-WEB-028 -- API Dashboard Personal (Widgets)

## Objetivo

Documentar la API REST del módulo Dashboard Personal (Widgets).

## Tabla principal

`cf_widgetusuario`

## Endpoints

``` text
GET /api/v1/widgets
POST /api/v1/widgets
PUT /api/v1/widgets/{id}
DELETE /api/v1/widgets/{id}
GET /api/v1/dashboard
```

## Arquitectura

Controller → Service → Repository → Base de Datos

## Reglas de Negocio

-   JWT obligatorio.
-   EmpresaID obtenido del token.
-   Validación por permisos.
-   Registro en auditoría.

## Casos de Prueba

-   CRUD
-   Seguridad
-   Auditoría

## Historial

Versión 1.0.
