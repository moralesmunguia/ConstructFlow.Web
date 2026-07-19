# DEF-WEB-024 -- API Usuarios

## Objetivo

Documentar la API REST del módulo Usuarios.

## Tabla principal

`cf_usuario`

## Endpoints

``` text
GET /api/v1/usuarios
POST /api/v1/usuarios
GET /api/v1/usuarios/{id}
PUT /api/v1/usuarios/{id}
DELETE /api/v1/usuarios/{id}
POST /api/v1/usuarios/{id}/activar
POST /api/v1/usuarios/{id}/desactivar
POST /api/v1/usuarios/{id}/reset-password
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
