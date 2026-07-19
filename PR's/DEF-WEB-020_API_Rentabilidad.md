# DEF-WEB-020 -- API Rentabilidad

## Objetivo

Documentar la API REST del módulo de Rentabilidad.

## Alcance

Consulta de indicadores financieros y rentabilidad por proyecto.

## Endpoints

``` text
GET    /api/v1/rentabilidad
GET    /api/v1/rentabilidad/proyectos
GET    /api/v1/rentabilidad/proyectos/{id}
GET    /api/v1/rentabilidad/proyectos/{id}/costos
GET    /api/v1/rentabilidad/proyectos/{id}/ingresos
GET    /api/v1/rentabilidad/proyectos/{id}/margen
GET    /api/v1/rentabilidad/dashboard
GET    /api/v1/rentabilidad/resumen
```

## Flujo Funcional

``` text
Obtener Proyecto
      ↓
Consolidar Ingresos
      ↓
Consolidar Costos
      ↓
Calcular Utilidad
      ↓
Calcular Margen
      ↓
Actualizar KPI
      ↓
Mostrar Dashboard
```

## Arquitectura

Cliente → RentabilidadController → RentabilidadService →
RentabilidadRepository → CostosRepository → FacturaRepository → Base de
Datos

## Reglas de Negocio

-   Filtrado por EmpresaID.
-   Costos agrupados por categoría.
-   Comparación entre costos reales y estimados.
-   Cálculo en tiempo real.
-   Módulo de solo consulta.

## Integraciones

-   Costos
-   Facturación
-   Proyectos
-   KPI
-   Dashboard Ejecutivo
-   Reportes
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Rentabilidad general
-   Rentabilidad por proyecto
-   Validación de márgenes
-   Comparativo de costos
-   Dashboard Ejecutivo

## Historial

Versión 1.0.
