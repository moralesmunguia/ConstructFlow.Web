# DEF-WEB-013 -- API Documentos

## Objetivo

Documentar la API REST del módulo de Documentos.

## Alcance

Administración de archivos electrónicos y su versionado.

## Endpoints

``` text
GET    /api/v1/documentos
POST   /api/v1/documentos
GET    /api/v1/documentos/{id}
PUT    /api/v1/documentos/{id}
DELETE /api/v1/documentos/{id}
GET    /api/v1/documentos/{id}/download
POST   /api/v1/documentos/{id}/version
GET    /api/v1/documentos/tipos
GET    /api/v1/proyectos/{id}/documentos
GET    /api/v1/cotizaciones/{id}/documentos
```

## Flujo Funcional

``` text
Seleccionar Archivo
      ↓
Validar Tipo
      ↓
Cargar Documento
      ↓
Registrar Metadatos
      ↓
Generar Versión
      ↓
Asociar al Proyecto/Cotización
      ↓
Consultar o Descargar
```

## Arquitectura

Cliente → DocumentoController → DocumentoService → DocumentoRepository →
Base de Datos → Almacenamiento

## Reglas de Negocio

-   Asociación a Empresa.
-   Versionado de documentos.
-   Eliminación lógica.
-   Registro de auditoría.
-   Asociación con proyectos, cotizaciones y evidencias.

## Integraciones

-   Proyectos
-   Cotizaciones
-   Actividades
-   Evidencias
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Carga
-   Descarga
-   Versionado
-   Consulta
-   Eliminación lógica

## Historial

Versión 1.0.
