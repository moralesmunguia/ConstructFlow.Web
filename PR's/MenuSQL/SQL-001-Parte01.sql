/*******************************************************************************************
 Proyecto   : ConstructFlow ERP
 Archivo    : SQL-001-Parte01.sql
 Autor      : OpenAI + Salvador Morales
 Versión    : 1.0
 Fecha      : Julio 2026

 Descripción

 Datos Maestros del Sistema.

 • CF_Modulos
 • CF_Menu
 • CF_PermisosMatriz

 Este script puede ejecutarse múltiples veces.
********************************************************************************************/

SET @Usuario='SYSTEM';

/*******************************************************************************************
CF_Modulos
********************************************************************************************/

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'DASHBOARD','Dashboard'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='DASHBOARD'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'COMERCIAL','Comercial'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='COMERCIAL'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'PROYECTOS','Gestión de Proyectos'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='PROYECTOS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'FINANZAS','Control Financiero'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='FINANZAS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'REPORTES','Reportes'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='REPORTES'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'SEGURIDAD','Seguridad'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='SEGURIDAD'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'CONFIG','Configuración'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='CONFIG'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'SISTEMA','Sistema'
WHERE NOT EXISTS
(
SELECT 1
FROM CF_Modulos
WHERE Codigo='SISTEMA'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'CLIENTES','Clientes'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='CLIENTES'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'CONTACTOS','Contactos'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='CONTACTOS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'COTIZACIONES','Cotizaciones'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='COTIZACIONES'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'PROYECTO','Proyecto'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='PROYECTO'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'ACTIVIDADES','Actividades'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='ACTIVIDADES'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'DOCUMENTOS','Documentos'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='DOCUMENTOS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'EVIDENCIAS','Evidencias'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='EVIDENCIAS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'FACTURACION','Facturación'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='FACTURACION'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'COBRANZA','Cobranza'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='COBRANZA'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'COSTOS','Costos'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='COSTOS'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'RENTABILIDAD','Rentabilidad'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='RENTABILIDAD'
);

INSERT INTO CF_Modulos(Codigo,Nombre)
SELECT 'KPI','Indicadores KPI'
WHERE NOT EXISTS
(
SELECT 1 FROM CF_Modulos
WHERE Codigo='KPI'
);
