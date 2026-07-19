# DEF-WEB-029 -- API Menú Dinámico / Autorización de Menús

## Objetivo

Construir el menú dinámico para el usuario autenticado.

## Tablas

-   cf_usuario
-   cf_roles
-   cf_menu
-   cf_permiso
-   cf_permisosmatriz

## Endpoints

``` text
GET    /api/v1/menu
GET    /api/v1/menu/dinamico
GET    /api/v1/menu/permisos
GET    /api/v1/menu/favoritos
POST   /api/v1/menu/favoritos
```

## Arquitectura

LoginController → MenuController → MenuService → PermisoRepository +
MenuRepository → Base de Datos

## Historial

Versión 1.0.
