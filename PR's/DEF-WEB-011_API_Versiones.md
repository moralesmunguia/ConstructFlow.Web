# DEF-WEB-011 -- API Versiones

## Objetivo

Documentar la API REST del módulo de Versiones de Cotización.

## Alcance

Administración del historial de revisiones y versiones.

## Endpoints

``` text
GET    /api/v1/versiones
POST   /api/v1/versiones
GET    /api/v1/versiones/{id}
PUT    /api/v1/versiones/{id}
DELETE /api/v1/versiones/{id}
POST   /api/v1/versiones/{id}/restaurar
GET    /api/v1/cotizaciones/{id}/versiones
GET    /api/v1/versiones/{id}/json
```

## Flujo Funcional

``` text
Cotización
    ↓
Generar Nueva Versión
    ↓
Copiar Encabezado
    ↓
Copiar Detalle
    ↓
Copiar Actividades
    ↓
Actualizar JSON Maestro
    ↓
Registrar Historial
```

## Arquitectura

Cliente → VersionController → VersionService →
CotizacionPersistenciaService → VersionRepository → Base de Datos

## Reglas de Negocio

-   Consecutivo automático de versiones.
-   Copia completa de encabezado, detalle y actividades.
-   Restauración con trazabilidad.
-   Sincronización mediante JSON Maestro.

## Integraciones

-   Cotizaciones
-   Cotización Detalle
-   Actividades
-   Proyectos
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Crear versión.
-   Consultar historial.
-   Restaurar versión.
-   Validar JSON Maestro.

## Historial

Versión 1.0.
