# DEF-WEB-015 -- API Evidencias

## Objetivo

Documentar la API REST del módulo Evidencias.

## Alcance

Administración de fotografías, videos y documentos asociados a proyectos
y actividades.

## Endpoints

``` text
GET    /api/v1/evidencias
POST   /api/v1/evidencias
GET    /api/v1/evidencias/{id}
PUT    /api/v1/evidencias/{id}
DELETE /api/v1/evidencias/{id}
GET    /api/v1/actividades/{id}/evidencias
GET    /api/v1/proyectos/{id}/evidencias
POST   /api/v1/evidencias/{id}/documento
```

## Flujo Funcional

``` text
Actividad
   ↓
Capturar Evidencia
   ↓
Validar Archivo
   ↓
Registrar Metadatos
   ↓
Asociar Documento
```

## Arquitectura

Cliente → EvidenciaController → EvidenciaService → EvidenciaRepository →
DocumentoRepository → Base de Datos

## Reglas de Negocio

-   Evidencia asociada a proyecto y/o actividad.
-   Registro de metadatos.
-   Integración con documentos.
-   Eliminación lógica.
-   Trazabilidad del avance.

## Integraciones

-   Actividades
-   Proyectos
-   Documentos
-   Dashboard
-   Auditoría

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Alta
-   Consulta
-   Asociación de documento
-   Eliminación lógica

## Historial

Versión 1.0.
