# DEF-WEB-022 -- API Auditoría

## Objetivo

Documentar la API REST del módulo Auditoría.

## Alcance

Registro y consulta de eventos del sistema.

## Endpoints

``` text
GET    /api/v1/auditoria
GET    /api/v1/auditoria/{id}
GET    /api/v1/auditoria/usuarios/{id}
GET    /api/v1/auditoria/proyectos/{id}
GET    /api/v1/auditoria/modulos/{modulo}
GET    /api/v1/auditoria/eventos
POST   /api/v1/auditoria/exportar
```

## Flujo Funcional

``` text
Ejecutar Operación
      ↓
Registrar Evento
      ↓
Guardar Bitácora
      ↓
Consultar Historial
      ↓
Exportar
```

## Arquitectura

Cliente → AuditoriaController → AuditoriaService → AuditoriaRepository →
Base de Datos

## Reglas de Negocio

-   Registro automático de eventos.
-   Bitácora inmutable.
-   Filtros por usuario, módulo y proyecto.
-   Registro de IP y fecha.
-   Acceso restringido.

## Integraciones

-   Todos los módulos
-   Seguridad
-   Usuarios
-   Reportes
-   Dashboard

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Registro
-   Consulta
-   Filtros
-   Exportación
-   Validación de inmutabilidad

## Historial

Versión 1.0.
