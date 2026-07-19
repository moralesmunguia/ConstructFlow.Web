# DEF-WEB-025 -- API Roles

## Objetivo

Documentar la API REST del módulo Roles.

## Tabla principal

`cf_roles`

## Endpoints

``` text
GET /api/v1/roles
POST /api/v1/roles
GET /api/v1/roles/{id}
PUT /api/v1/roles/{id}
DELETE /api/v1/roles/{id}
POST /api/v1/roles/{id}/copiar
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
