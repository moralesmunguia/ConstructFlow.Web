# DEF-WEB-010 -- API Cotización Detalle

## Objetivo

Documentar la API REST del detalle de cotización.

## Alcance

Administración de partidas y conceptos de la cotización.

## Endpoints

``` text
GET    /api/v1/cotizacion-detalle
POST   /api/v1/cotizacion-detalle
GET    /api/v1/cotizacion-detalle/{id}
PUT    /api/v1/cotizacion-detalle/{id}
DELETE /api/v1/cotizacion-detalle/{id}
POST   /api/v1/cotizacion-detalle/recalcular
GET    /api/v1/cotizacion-detalle/{id}/json
```

## Flujo Funcional

``` text
Cotización
     ↓
Agregar Concepto
     ↓
Calcular Importe
     ↓
Aplicar Descuento
     ↓
Calcular IVA
     ↓
Actualizar Totales
     ↓
Persistir JSON Maestro
```

## Arquitectura

Cliente → CotizacionDetalleController → CotizacionDetalleService →
CotizacionDetalleRepository → Base de Datos

## Reglas de Negocio

-   Número de partida automático.
-   SubTotalEstimado obligatorio.
-   Recalcular importes automáticamente.
-   Sincronización con JSON Maestro.

## Cálculos

-   Cantidad × Precio Unitario
-   Descuento
-   Subtotal
-   IVA
-   Total

## Integraciones

-   Cotizaciones
-   Actividades
-   Versiones
-   Costos
-   Proyectos

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Actualización
-   Eliminación
-   Recalcular
-   Validar IVA
-   Validar JSON Maestro

## Historial

Versión 1.0.
