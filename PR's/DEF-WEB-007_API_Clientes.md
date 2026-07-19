# DEF-WEB-007 -- API Clientes

## Proyecto

ConstructFlow.Api

## Objetivo

Documentar la API REST del módulo de Clientes.

## Alcance

Administración del catálogo de clientes.

## Endpoints

``` text
GET    /api/v1/clientes
POST   /api/v1/clientes
GET    /api/v1/clientes/{id}
PUT    /api/v1/clientes/{id}
DELETE /api/v1/clientes/{id}
GET    /api/v1/clientes/activos
GET    /api/v1/clientes/buscar
```

## Flujo Funcional

``` text
Registrar Cliente
      ↓
Validar Información
      ↓
Guardar
      ↓
Asociar Contactos
      ↓
Utilizar en Cotizaciones
      ↓
Convertir a Proyecto
```

## Arquitectura

Cliente → ClienteController → ClienteService → ClienteRepository → Base
de Datos

## Reglas de Negocio

-   Cliente asociado a una Empresa.
-   Validación de RFC.
-   Eliminación lógica.
-   Integración con Contactos.
-   Solo clientes activos participan en nuevos procesos.

## Integraciones

-   Contactos
-   Cotizaciones
-   Proyectos
-   Facturación
-   Cartera

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta.
-   Modificación.
-   Consulta.
-   Eliminación lógica.
-   Búsqueda.

## Historial

Versión 1.0.
