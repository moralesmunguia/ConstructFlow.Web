# DEF-WEB-008 -- API Contactos

## Objetivo

Documentar la API REST del módulo de Contactos.

## Alcance

Administración de contactos asociados a clientes.

## Endpoints

``` text
GET    /api/v1/contactos
POST   /api/v1/contactos
GET    /api/v1/contactos/{id}
PUT    /api/v1/contactos/{id}
DELETE /api/v1/contactos/{id}
GET    /api/v1/clientes/{id}/contactos
GET    /api/v1/contactos/buscar
```

## Flujo Funcional

``` text
Cliente
   ↓
Registrar Contacto
   ↓
Validar Datos
   ↓
Guardar
   ↓
Asociar a Cotización
```

## Arquitectura

Cliente → ContactoController → ContactoService → ContactoRepository →
Base de Datos

## Reglas de Negocio

-   Todo contacto pertenece a un cliente.
-   Un cliente puede tener múltiples contactos.
-   Eliminación lógica.
-   Solo contactos activos pueden utilizarse.

## Integraciones

-   Clientes
-   Cotizaciones
-   Proyectos
-   Facturación

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Consulta
-   Actualización
-   Eliminación lógica
-   Búsqueda por cliente

## Historial

Versión 1.0.
