# DEF-WEB-002 -- API Cotización

  Campo       Valor
  ----------- --------------------------
  Proyecto    ConstructFlow.Api
  Documento   DEF-WEB-002
  Versión     1.0
  Estado      Aprobado para Desarrollo

# 1. Objetivo

Documentar la API REST del módulo de Cotizaciones.

# 2. Endpoints

``` text
GET    /api/v1/cotizaciones
POST   /api/v1/cotizaciones
POST   /api/v1/cotizaciones/persist
GET    /api/v1/cotizaciones/persist/{id}
PUT    /api/v1/cotizaciones/persist/{id}
GET    /api/v1/cotizaciones/{id}
PUT    /api/v1/cotizaciones/{id}
DELETE /api/v1/cotizaciones/{id}
PUT    /api/v1/cotizaciones/{id}/estado
PATCH  /api/v1/cotizaciones/{id}/estado
GET    /api/v1/cotizaciones/{id}/historial
GET    /api/v1/cotizaciones/{id}/json
```

# 3. Flujo Funcional

``` text
Crear Cotización
      ↓
Capturar Encabezado
      ↓
Agregar Detalles
      ↓
Agregar Actividades
      ↓
Persistir JSON Maestro
      ↓
Calcular Totales
      ↓
Cambiar Estado
      ↓
Convertir a Proyecto
```

# 4. Arquitectura

Cliente → CotizacionController → CotizacionService →
CotizacionPersistenciaService → Repository → Base de Datos

# 5. Reglas de Negocio

-   Persistencia mediante JSON Maestro.
-   Historial de cambios de estado.
-   Recalcular importes antes de guardar.
-   Conversión a Proyecto únicamente para cotizaciones autorizadas.

# 6. Integraciones

-   Clientes
-   Contactos
-   Cotización Detalle
-   Versiones
-   Proyectos

# 7. Seguridad

JWT obligatorio.

# 8. Casos de Prueba

-   Crear.
-   Actualizar.
-   Persistir.
-   Cambiar estado.
-   Obtener JSON Maestro.

# Historial

  Versión   Descripción
  --------- -------------------
  1.0       Documento inicial
