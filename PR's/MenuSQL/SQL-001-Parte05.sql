/*******************************************************************************************
 SQL-001-Parte05.sql
 ConstructFlow ERP
 Sección: Motor de Seguridad
 Relaciones Menú <-> Permiso y Rol <-> Permiso
********************************************************************************************/

SET @Usuario='SYSTEM';

/*******************************************************************************************
 TABLAS ESPERADAS

 CF_RolPermiso
   RolPermisoID
   RolID
   PermisoID
   IsActive

 CF_MenuPermiso
   MenuPermisoID
   MenuID
   PermisoID
   IsActive
********************************************************************************************/

/*******************************************************************************************
 SINCRONIZAR MENU -> CRUD
 Crea automáticamente CONSULTAR/INSERTAR/ACTUALIZAR/ELIMINAR
 para cada menú registrado.
********************************************************************************************/

INSERT INTO CF_MenuPermiso(MenuID,PermisoID,IsActive)
SELECT m.MenuID,p.PermisoID,1
FROM CF_Menu m
CROSS JOIN CF_PermisosMatriz p
WHERE p.Codigo IN ('CONSULTAR','INSERTAR','ACTUALIZAR','ELIMINAR')
AND NOT EXISTS
(
    SELECT 1
    FROM CF_MenuPermiso mp
    WHERE mp.MenuID=m.MenuID
      AND mp.PermisoID=p.PermisoID
);

/*******************************************************************************************
 EJEMPLOS DE PERMISOS ESPECIALES
********************************************************************************************/

INSERT INTO CF_MenuPermiso(MenuID,PermisoID,IsActive)
SELECT
m.MenuID,
p.PermisoID,
1
FROM CF_Menu m
JOIN CF_PermisosMatriz p
ON p.Codigo='CONVERTIR_PROYECTO'
WHERE m.Codigo='CONVERTIR_PROYECTO'
AND NOT EXISTS
(
SELECT 1
FROM CF_MenuPermiso x
WHERE x.MenuID=m.MenuID
AND x.PermisoID=p.PermisoID
);

INSERT INTO CF_MenuPermiso(MenuID,PermisoID,IsActive)
SELECT
m.MenuID,
p.PermisoID,
1
FROM CF_Menu m
JOIN CF_PermisosMatriz p
ON p.Codigo='REGISTRAR_AVANCE'
WHERE m.Codigo='ACTIVIDADES'
AND NOT EXISTS
(
SELECT 1
FROM CF_MenuPermiso x
WHERE x.MenuID=m.MenuID
AND x.PermisoID=p.PermisoID
);

/*******************************************************************************************
 ROL ADMINISTRADOR
 Asigna todos los permisos existentes al RolID=1
 (ajustar según catálogo de roles)
********************************************************************************************/

INSERT INTO CF_RolPermiso(RolID,PermisoID,IsActive)
SELECT
1,
PermisoID,
1
FROM CF_PermisosMatriz p
WHERE NOT EXISTS
(
SELECT 1
FROM CF_RolPermiso rp
WHERE rp.RolID=1
AND rp.PermisoID=p.PermisoID
);

/*******************************************************************************************
 VALIDACIONES
********************************************************************************************/

SELECT m.Codigo Menu,p.Codigo Permiso
FROM CF_MenuPermiso mp
JOIN CF_Menu m ON m.MenuID=mp.MenuID
JOIN CF_PermisosMatriz p ON p.PermisoID=mp.PermisoID
ORDER BY m.Codigo,p.Codigo;

SELECT *
FROM CF_RolPermiso
WHERE RolID=1
ORDER BY PermisoID;

/*******************************************************************************************
 PARTE 06
 - sp_GenerarPermisosRol
 - sp_GenerarMenuUsuario
 - sp_SincronizarMenus
 - Consultas de menú dinámico
********************************************************************************************/
