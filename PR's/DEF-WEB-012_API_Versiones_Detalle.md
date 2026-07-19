# DEF-WEB-012 -- API Versiones Detalle

## Objetivo

Documentar la API REST del detalle de versiones de cotización.

## Alcance

Administración de conceptos pertenecientes a cada versión.

## Endpoints

``` text
GET    /api/v1/versiones-detalle
POST   /api/v1/versiones-detalle
GET    /api/v1/versiones-detalle/{id}
PUT    /api/v1/versiones-detalle/{id}
DELETE /api/v1/versiones-detalle/{id}
POST   /api/v1/versiones-detalle/recalcular
GET    /api/v1/versiones/{id}/detalle
GET    /api/v1/versiones-detalle/{id}/json
```

## Flujo Funcional

``` text
Versión
    ↓
Copiar Conceptos
    ↓
Recalcular Importes
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

Cliente → VersionDetalleController → VersionDetalleService →
VersionDetalleRepository → Base de Datos

## Reglas de Negocio

-   Cada detalle pertenece a una versión.
-   Recalcular automáticamente importes.
-   Sincronización con JSON Maestro.
-   Historial inalterable tras liberar la versión.

## Integraciones

-   Versiones
-   Cotización Detalle
-   Cotizaciones
-   Actividades
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Actualización
-   Recalcular
-   Consulta
-   Validar JSON Maestro

## Historial

Versión 1.0.
