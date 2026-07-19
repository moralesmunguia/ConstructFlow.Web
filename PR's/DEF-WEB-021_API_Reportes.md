# DEF-WEB-021 -- API Reportes

## Objetivo

Documentar la API REST del módulo Reportes.

## Alcance

Generación y exportación de reportes operativos, financieros y
ejecutivos.

## Endpoints

``` text
GET    /api/v1/reportes
POST   /api/v1/reportes/generar
GET    /api/v1/reportes/{id}
GET    /api/v1/reportes/proyectos
GET    /api/v1/reportes/costos
GET    /api/v1/reportes/facturacion
GET    /api/v1/reportes/rentabilidad
GET    /api/v1/reportes/kpi
POST   /api/v1/reportes/exportar/pdf
POST   /api/v1/reportes/exportar/excel
```

## Flujo Funcional

``` text
Seleccionar Reporte
      ↓
Aplicar Filtros
      ↓
Validar Permisos
      ↓
Consultar Información
      ↓
Generar Resultado
      ↓
Exportar PDF / Excel
```

## Arquitectura

Cliente → ReporteController → ReporteService → ReporteRepository → Base
de Datos → Exportador PDF/Excel

## Reglas de Negocio

-   Filtrado por EmpresaID.
-   Respeto de permisos del usuario.
-   Exportación PDF y Excel.
-   Solo lectura.
-   Auditoría de exportaciones.

## Integraciones

-   Proyectos
-   Clientes
-   Cotizaciones
-   Costos
-   Facturación
-   Cartera
-   Pagos
-   KPI
-   Rentabilidad
-   Dashboard

## Seguridad

JWT obligatorio.

## Casos de Prueba

-   Generación
-   Exportación PDF
-   Exportación Excel
-   Validación de permisos
-   Auditoría

## Historial

Versión 1.0.
