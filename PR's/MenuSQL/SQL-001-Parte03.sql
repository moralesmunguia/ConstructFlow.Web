/*******************************************************************************************
 SQL-001-Parte03.sql
 ConstructFlow ERP
 Sección: Control Financiero, Dirección, Seguridad y Configuración
********************************************************************************************/

SET @Usuario='SYSTEM';

/*************** MENUS RAIZ ***************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'FINANZAS','Control Financiero',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='FINANZAS'),
NULL,4,'fa-dollar-sign','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='FINANZAS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'DIRECCION','Dirección',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='REPORTES'),
NULL,5,'fa-chart-line','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='DIRECCION');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'SEGURIDAD','Seguridad',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='SEGURIDAD'),
NULL,6,'fa-user-shield','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='SEGURIDAD');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'CONFIGURACION','Configuración',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='CONFIG'),
NULL,7,'fa-gears','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='CONFIGURACION');

/*************** CONTROL FINANCIERO *******************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'FACTURACION','Facturación',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='FACTURACION'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='FINANZAS'),
1,'fa-file-invoice-dollar','/facturacion',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='FACTURACION');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'COBRANZA','Cobranza',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='COBRANZA'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='FINANZAS'),
2,'fa-money-check-dollar','/cobranza',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='COBRANZA');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'COSTOS','Costos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='COSTOS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='FINANZAS'),
3,'fa-coins','/costos',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='COSTOS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'RENTABILIDAD','Rentabilidad',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='RENTABILIDAD'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='FINANZAS'),
4,'fa-chart-pie','/rentabilidad',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='RENTABILIDAD');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'FLUJO_EFECTIVO','Flujo de Efectivo',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='FINANZAS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='FINANZAS'),
5,'fa-cash-register','/finanzas/flujo',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='FLUJO_EFECTIVO');

/*************** DIRECCION ****************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'DASHBOARD_EJECUTIVO','Dashboard Ejecutivo',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='REPORTES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DIRECCION'),
1,'fa-gauge-high','/direccion/dashboard',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='DASHBOARD_EJECUTIVO');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'KPIS','KPI''s',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='KPI'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DIRECCION'),
2,'fa-chart-column','/direccion/kpis',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='KPIS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'REPORTES','Reportes',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='REPORTES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DIRECCION'),
3,'fa-print','/reportes',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='REPORTES');

/*************** SEGURIDAD ****************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT x.Codigo,x.Nombre,
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='SEGURIDAD'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='SEGURIDAD'),
x.Orden,x.Icono,x.Ruta,1
FROM (
SELECT 'USUARIOS' Codigo,'Usuarios' Nombre,1 Orden,'fa-users' Icono,'/seguridad/usuarios' Ruta
UNION ALL SELECT 'ROLES','Roles',2,'fa-user-tag','/seguridad/roles'
UNION ALL SELECT 'PERMISOS','Permisos',3,'fa-key','/seguridad/permisos'
UNION ALL SELECT 'MENUS','Menús',4,'fa-bars','/seguridad/menus'
UNION ALL SELECT 'AUDITORIA','Auditoría',5,'fa-clipboard-list','/seguridad/auditoria'
UNION ALL SELECT 'FAVORITOS','Favoritos',6,'fa-star','/seguridad/favoritos'
UNION ALL SELECT 'WIDGETS','Widgets',7,'fa-table-cells','/seguridad/widgets'
) x
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu m WHERE m.Codigo=x.Codigo);

/*************** CONFIGURACION ************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT x.Codigo,x.Nombre,
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='CONFIG'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='CONFIGURACION'),
x.Orden,x.Icono,x.Ruta,1
FROM(
SELECT 'EMPRESAS' Codigo,'Empresas' Nombre,1 Orden,'fa-building' Icono,'/config/empresas' Ruta
UNION ALL SELECT 'PARAMETROS','Parámetros',2,'fa-sliders','/config/parametros'
UNION ALL SELECT 'CATALOGOS','Catálogos',3,'fa-book','/config/catalogos'
UNION ALL SELECT 'MONEDAS','Monedas',4,'fa-coins','/config/monedas'
UNION ALL SELECT 'IMPUESTOS','Impuestos',5,'fa-percent','/config/impuestos'
UNION ALL SELECT 'FOLIOS','Folios',6,'fa-hashtag','/config/folios'
UNION ALL SELECT 'SMTP','Correo SMTP',7,'fa-envelope','/config/smtp'
UNION ALL SELECT 'TIPO_DOCUMENTO','Tipos Documento',8,'fa-folder-open','/config/documentos'
UNION ALL SELECT 'TIPO_ACTIVIDAD','Tipos Actividad',9,'fa-list','/config/actividades'
) x
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu m WHERE m.Codigo=x.Codigo);
