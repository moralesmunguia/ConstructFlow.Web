# DEF-WEB-018 -- API Pagos

## Objetivo

Documentar la API REST del módulo de Pagos.

## Alcance

Administración de pagos, aplicación a facturas, conciliación y
actualización de cartera.

## Endpoints

``` text
GET    /api/v1/pagos
POST   /api/v1/pagos
GET    /api/v1/pagos/{id}
PUT    /api/v1/pagos/{id}
DELETE /api/v1/pagos/{id}
POST   /api/v1/pagos/{id}/aplicar
POST   /api/v1/pagos/{id}/conciliar
GET    /api/v1/facturas/{id}/pagos
GET    /api/v1/clientes/{id}/pagos
GET    /api/v1/proyectos/{id}/pagos
```

## Flujo Funcional

``` text
Registrar Pago
      ↓
Validar Factura
      ↓
Aplicar Pago
      ↓
Actualizar Saldo
      ↓
Conciliar
      ↓
Actualizar Cartera
      ↓
Actualizar KPI
```

## Arquitectura

Cliente → PagoController → PagoService → PagoRepository →
FacturaRepository → CarteraRepository → Base de Datos

## Reglas de Negocio

-   Registro y aplicación de pagos.
-   Pagos parciales y totales.
-   Actualización automática de saldos.
-   Conciliación de movimientos.
-   Registro en auditoría.

## Integraciones

-   Facturación
-   Cartera
-   Clientes
-   Proyectos
-   KPI
-   Dashboard
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Registrar pago
-   Aplicar pago
-   Conciliar
-   Consultar pagos
-   Validar saldos

## Historial

Versión 1.0.
