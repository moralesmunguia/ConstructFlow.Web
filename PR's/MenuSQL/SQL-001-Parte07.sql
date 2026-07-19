/*******************************************************************************************
 SQL-001-Parte07.sql
 ConstructFlow ERP
 Sección: Consultas de Seguridad y Menú Dinámico
********************************************************************************************/

/*******************************************************************************************
 VISTA SUGERIDA : VW_MenuUsuario
 Ajustar nombres de tablas si el modelo definitivo cambia.
********************************************************************************************/

DROP VIEW IF EXISTS VW_MenuUsuario;

CREATE VIEW VW_MenuUsuario AS
SELECT
    ur.UsuarioID,
    ur.EmpresaID,
    r.RolID,
    m.MenuID,
    m.MenuPadreID,
    m.Codigo,
    m.Nombre,
    m.Icono,
    m.Ruta,
    m.Orden,
    p.Codigo AS Permiso
FROM CF_UsuarioRol ur
INNER JOIN CF_RolPermiso rp
        ON rp.RolID = ur.RolID
INNER JOIN CF_MenuPermiso mp
        ON mp.PermisoID = rp.PermisoID
INNER JOIN CF_Menu m
        ON m.MenuID = mp.MenuID
INNER JOIN CF_PermisosMatriz p
        ON p.PermisoID = mp.PermisoID
INNER JOIN CF_Rol r
        ON r.RolID = ur.RolID
WHERE ur.IsActive = 1
  AND rp.IsActive = 1
  AND mp.IsActive = 1
  AND m.EsVisible = 1;

/*******************************************************************************************
 CONSULTA MENU DINAMICO
********************************************************************************************/

-- SET @EmpresaID=1;
-- SET @UsuarioID=1;

SELECT DISTINCT
       MenuID,
       MenuPadreID,
       Codigo,
       Nombre,
       Icono,
       Ruta,
       Orden
FROM VW_MenuUsuario
WHERE EmpresaID=@EmpresaID
  AND UsuarioID=@UsuarioID
  AND Permiso='CONSULTAR'
ORDER BY MenuPadreID,Orden,Nombre;

/*******************************************************************************************
 CONSULTA PERMISOS EFECTIVOS
********************************************************************************************/

SELECT
    Codigo,
    Nombre,
    GROUP_CONCAT(DISTINCT Permiso ORDER BY Permiso) AS Permisos
FROM VW_MenuUsuario
WHERE EmpresaID=@EmpresaID
  AND UsuarioID=@UsuarioID
GROUP BY Codigo,Nombre
ORDER BY Nombre;

/*******************************************************************************************
 VALIDACIÓN DE MENÚS SIN PERMISOS
********************************************************************************************/

SELECT m.MenuID,m.Codigo,m.Nombre
FROM CF_Menu m
LEFT JOIN CF_MenuPermiso mp
       ON mp.MenuID=m.MenuID
WHERE mp.MenuID IS NULL;

/*******************************************************************************************
 VALIDACIÓN DE PERMISOS HUÉRFANOS
********************************************************************************************/

SELECT p.PermisoID,p.Codigo
FROM CF_PermisosMatriz p
LEFT JOIN CF_MenuPermiso mp
       ON mp.PermisoID=p.PermisoID
WHERE mp.PermisoID IS NULL;

/*******************************************************************************************
 PARTE 08
 - Roles por Empresa
 - Favoritos
 - Widgets
 - Auditoría de Seguridad
 - Consolidación SQL-001.sql
********************************************************************************************/
