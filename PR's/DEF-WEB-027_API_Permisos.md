# DEF-WEB-027 -- API Permisos

## Objetivo

Documentar la API REST del módulo Permisos.

## Tabla principal

`cf_permiso, cf_permisosmatriz`

## Endpoints

``` text
GET /api/v1/permisos
POST /api/v1/permisos/asignar
POST /api/v1/permisos/revocar
GET /api/v1/permisos/usuario/{id}
GET /api/v1/permisos/rol/{id}
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
