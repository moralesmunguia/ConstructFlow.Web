# DEF-WEB-004 -- API Actividades

## Objetivo

Documentar la API REST del módulo de Actividades.

## Alcance

CRUD, dependencias, avance, reprogramación y Gantt.

## Endpoints

``` text
GET    /api/v1/proyectos/{id}/actividades
POST   /api/v1/proyectos/{id}/actividades
GET    /api/v1/actividades/{id}
PUT    /api/v1/actividades/{id}
DELETE /api/v1/actividades/{id}
POST   /api/v1/actividades/{id}/avance
PUT    /api/v1/actividades/{id}/reprogramar
PATCH  /api/v1/actividades/{id}/reprogramar
POST   /api/v1/actividades/dependencia
PUT    /api/v1/actividades/dependencia/{id}
DELETE /api/v1/actividades/dependencia/{id}
GET    /api/v1/proyectos/{id}/dependencias
GET    /api/v1/proyectos/{id}/gantt
```

## Arquitectura

Cliente → Controller → Service → Repository → Base de Datos.

## Reglas de Negocio

-   Actividad ligada a un proyecto.
-   Registro de avance actualiza indicadores.
-   Dependencias controlan la secuencia.
-   Reprogramación mantiene historial.

## Historial

Versión 1.0.
