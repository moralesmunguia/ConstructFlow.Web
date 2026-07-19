/*******************************************************************************************
 SQL-001-Parte02.sql
 ConstructFlow ERP
 Sección: CF_Menu (Dashboard, Comercial y Proyectos)
********************************************************************************************/

SET @Usuario='SYSTEM';

/*******************************************************************************************
 MENUS RAIZ
********************************************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'DASHBOARD','Dashboard Personal',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='DASHBOARD'),
NULL,1,'fa-home','/dashboard',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='DASHBOARD');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'COMERCIAL','Comercial',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='COMERCIAL'),
NULL,2,'fa-briefcase','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='COMERCIAL');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'PROYECTOS','Gestión de Proyectos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='PROYECTOS'),
NULL,3,'fa-diagram-project','',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='PROYECTOS');

/*******************************************************************************************
 DASHBOARD
********************************************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'MIS_PENDIENTES','Mis Pendientes',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='DASHBOARD'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DASHBOARD'),
1,'fa-list','/dashboard/pendientes',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='MIS_PENDIENTES');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'MIS_FAVORITOS','Favoritos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='DASHBOARD'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DASHBOARD'),
2,'fa-star','/dashboard/favoritos',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='MIS_FAVORITOS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'MIS_WIDGETS','Widgets',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='DASHBOARD'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='DASHBOARD'),
3,'fa-table-cells','/dashboard/widgets',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='MIS_WIDGETS');

/*******************************************************************************************
 COMERCIAL
********************************************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'CLIENTES','Clientes',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='CLIENTES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='COMERCIAL'),
1,'fa-users','/clientes',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='CLIENTES');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'CONTACTOS','Contactos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='CONTACTOS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='COMERCIAL'),
2,'fa-address-book','/contactos',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='CONTACTOS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'COTIZACIONES','Cotizaciones',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='COTIZACIONES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='COMERCIAL'),
3,'fa-file-invoice','/cotizaciones',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='COTIZACIONES');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'CONVERTIR_PROYECTO','Convertir a Proyecto',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='COTIZACIONES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='COMERCIAL'),
4,'fa-arrow-right','/cotizaciones/convertir',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='CONVERTIR_PROYECTO');

/*******************************************************************************************
 PROYECTOS
********************************************************************************************/

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'PROYECTO','Proyectos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='PROYECTO'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='PROYECTOS'),
1,'fa-folder-open','/proyectos',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='PROYECTO');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'ACTIVIDADES','Actividades',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='ACTIVIDADES'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='PROYECTOS'),
2,'fa-list-check','/actividades',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='ACTIVIDADES');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'DOCUMENTOS','Documentos',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='DOCUMENTOS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='PROYECTOS'),
3,'fa-folder','/documentos',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='DOCUMENTOS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'EVIDENCIAS','Evidencias',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='EVIDENCIAS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='PROYECTOS'),
4,'fa-camera','/evidencias',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='EVIDENCIAS');

INSERT INTO CF_Menu(Codigo,Nombre,ModuloID,MenuPadreID,Orden,Icono,Ruta,EsVisible)
SELECT 'GANTT','Diagrama de Gantt',
(SELECT ModuloID FROM CF_Modulos WHERE Codigo='PROYECTOS'),
(SELECT MenuID FROM CF_Menu WHERE Codigo='PROYECTOS'),
5,'fa-chart-gantt','/proyectos/gantt',1
WHERE NOT EXISTS (SELECT 1 FROM CF_Menu WHERE Codigo='GANTT');

