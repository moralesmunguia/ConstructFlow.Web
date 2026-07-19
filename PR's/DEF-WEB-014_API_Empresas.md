# DEF-WEB-014 -- API Empresas

## Objetivo

Documentar la API REST del módulo Empresas.

## Alcance

Administración multiempresa de ConstructFlow.

## Endpoints

``` text
GET    /api/v1/empresas
POST   /api/v1/empresas
GET    /api/v1/empresas/{id}
PUT    /api/v1/empresas/{id}
DELETE /api/v1/empresas/{id}
GET    /api/v1/empresas/{id}/configuracion
PUT    /api/v1/empresas/{id}/configuracion
GET    /api/v1/empresas/activas
```

## Flujo Funcional

``` text
Registrar Empresa
      ↓
Configurar Parámetros
      ↓
Crear Usuarios
      ↓
Asignar Permisos
      ↓
Operación del ERP
```

## Arquitectura

Cliente → EmpresaController → EmpresaService → EmpresaRepository → Base
de Datos

## Reglas de Negocio

-   Arquitectura multiempresa.
-   EmpresaID obtenido del JWT.
-   Eliminación lógica.
-   Configuración independiente.
-   Aislamiento total de información.

## Integraciones

-   Usuarios
-   Clientes
-   Cotizaciones
-   Proyectos
-   Costos
-   Facturación
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Configuración
-   Consulta
-   Empresas activas
-   Validación multiempresa

## Historial

Versión 1.0.
