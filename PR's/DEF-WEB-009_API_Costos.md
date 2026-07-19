# DEF-WEB-009 -- API Costos

## Objetivo

Documentar la API REST del módulo de Costos.

## Alcance

Administración de costos reales, presupuesto y categorías.

## Endpoints

``` text
GET    /api/v1/proyectos/{id}/costos
POST   /api/v1/proyectos/{id}/costos
PUT    /api/v1/costos/{id}
DELETE /api/v1/costos/{id}
GET    /api/v1/proyectos/{id}/presupuesto
POST   /api/v1/proyectos/{id}/presupuesto
GET    /api/v1/proyectos/{id}/costos/resumen
GET    /api/v1/proyectos/{id}/costos/categorias
```

## Flujo Funcional

``` text
Proyecto
   ↓
Registrar Costo
   ↓
Validar Categoría
   ↓
Actualizar Presupuesto
   ↓
Recalcular Totales
   ↓
Actualizar Rentabilidad
```

## Arquitectura

Cliente → CostoController → CostoService → CostoRepository → Base de
Datos

## Reglas de Negocio

-   Costos asociados a un proyecto.
-   Clasificación por categoría.
-   Actualización automática del presupuesto.
-   Impacto directo en rentabilidad.

## Categorías

-   MAT - Materiales
-   MO - Mano de Obra
-   EQ - Equipo
-   SUB - Subcontrato
-   ADM - Administración
-   LOG - Logística

## Integraciones

-   Proyectos
-   Rentabilidad
-   Presupuesto
-   Dashboard
-   KPI

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Consulta
-   Actualización
-   Presupuesto
-   Resumen por categoría

## Historial

Versión 1.0.
