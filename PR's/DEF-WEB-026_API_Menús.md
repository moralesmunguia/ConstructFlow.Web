# DEF-WEB-026 -- API Menús

## Objetivo

Documentar la API REST del módulo Menús.

## Tabla principal

`cf_menu`

## Endpoints

``` text
GET /api/v1/menus
POST /api/v1/menus
GET /api/v1/menus/arbol
PUT /api/v1/menus/{id}
DELETE /api/v1/menus/{id}
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
