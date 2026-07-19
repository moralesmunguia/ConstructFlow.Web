/*******************************************************************************************
 SQL-001-Parte06.sql
 ConstructFlow ERP
 Procedimientos almacenados - Motor de Seguridad
********************************************************************************************/

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_GenerarPermisosRol $$
CREATE PROCEDURE sp_GenerarPermisosRol(IN pRolID INT)
BEGIN
    INSERT INTO CF_RolPermiso(RolID,PermisoID,IsActive)
    SELECT pRolID,p.PermisoID,1
    FROM CF_PermisosMatriz p
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM CF_RolPermiso rp
        WHERE rp.RolID=pRolID
          AND rp.PermisoID=p.PermisoID
    );
END $$

DROP PROCEDURE IF EXISTS sp_SincronizarMenus $$
CREATE PROCEDURE sp_SincronizarMenus()
BEGIN
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
END $$

DROP PROCEDURE IF EXISTS sp_SincronizarPermisos $$
CREATE PROCEDURE sp_SincronizarPermisos()
BEGIN
    CALL sp_SincronizarMenus();

    INSERT INTO CF_RolPermiso(RolID,PermisoID,IsActive)
    SELECT r.RolID,p.PermisoID,1
    FROM CF_Rol r
    CROSS JOIN CF_PermisosMatriz p
    WHERE r.EsAdministrador=1
      AND NOT EXISTS
      (
          SELECT 1
          FROM CF_RolPermiso rp
          WHERE rp.RolID=r.RolID
            AND rp.PermisoID=p.PermisoID
      );
END $$

DROP PROCEDURE IF EXISTS sp_GenerarMenuUsuario $$
CREATE PROCEDURE sp_GenerarMenuUsuario
(
    IN pEmpresaID INT,
    IN pUsuarioID BIGINT
)
BEGIN
    SELECT DISTINCT
           m.MenuID,
           m.MenuPadreID,
           m.Codigo,
           m.Nombre,
           m.Icono,
           m.Ruta,
           m.Orden
    FROM CF_Menu m
    INNER JOIN CF_MenuPermiso mp
        ON mp.MenuID=m.MenuID
    INNER JOIN CF_RolPermiso rp
        ON rp.PermisoID=mp.PermisoID
    INNER JOIN CF_UsuarioRol ur
        ON ur.RolID=rp.RolID
    WHERE ur.UsuarioID=pUsuarioID
      AND ur.EmpresaID=pEmpresaID
      AND m.EsVisible=1
      AND mp.IsActive=1
      AND rp.IsActive=1
    ORDER BY m.MenuPadreID,m.Orden,m.Nombre;
END $$

DELIMITER ;

-- Ejemplos
-- CALL sp_GenerarPermisosRol(1);
-- CALL sp_SincronizarMenus();
-- CALL sp_SincronizarPermisos();
-- CALL sp_GenerarMenuUsuario(1,1);
