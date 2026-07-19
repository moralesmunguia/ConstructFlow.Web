# DEF-WEB-016 -- API Facturación

## Objetivo

Documentar la API REST del módulo de Facturación.

## Alcance

Administración del ciclo completo de facturación electrónica (CFDI).

## Endpoints

``` text
GET    /api/v1/facturas
POST   /api/v1/facturas
GET    /api/v1/facturas/{id}
PUT    /api/v1/facturas/{id}
DELETE /api/v1/facturas/{id}
POST   /api/v1/facturas/{id}/timbrar
POST   /api/v1/facturas/{id}/cancelar
GET    /api/v1/facturas/{id}/pdf
GET    /api/v1/facturas/{id}/xml
POST   /api/v1/facturas/{id}/portal-cliente
GET    /api/v1/proyectos/{id}/facturas
```

## Flujo Funcional

``` text
Generar Factura
      ↓
Validar Información Fiscal
      ↓
Timbrar CFDI
      ↓
Generar PDF y XML
      ↓
Registrar Factura
      ↓
Publicar en Portal del Cliente
      ↓
Seguimiento de Cobranza
```

## Arquitectura

Cliente → FacturaController → FacturaService → FacturaRepository →
Servicio CFDI → Base de Datos

## Reglas de Negocio

-   Emisión de CFDI.
-   Generación de PDF y XML.
-   Cancelación con trazabilidad.
-   Publicación en portal del cliente.
-   Integración con Cartera y Cobranza.

## Integraciones

-   Clientes
-   Proyectos
-   Documentos
-   Cartera
-   Pagos
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Emitir factura
-   Timbrar CFDI
-   Descargar PDF/XML
-   Cancelar factura
-   Publicar en portal

## Historial

Versión 1.0.
