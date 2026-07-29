-- =========================================================================
-- Alta de módulo y menú "Calendario Laboral" (DEF-WEB-003, PRO-020)
-- ConstructFlow.Web
-- =========================================================================
-- Script aditivo e idempotente. Antes no existía pantalla Web para
-- prender/apagar si Sábado/Domingo cuentan como días laborables de la
-- Empresa (CF_Empresa.SabadoLaboral / DomingoLaboral) -- se cambiaba por
-- UPDATE directo a BD. Este script da de alta el módulo, lo cuelga como
-- hijo de "Configuración" (Codigo = 'configuracion') si existe, y otorga
-- permiso de Consultar/Actualizar a todos los roles activos (es una
-- pantalla de settings simple: no aplica Crear/Eliminar).
--
-- Confirmado contra la BD real: el menú padre "Configuración" tiene
-- Codigo = 'CONFIG' (MenuID 8), y cf_roles usa la columna Activo (no
-- IsActive). Ambos ya reflejados en este script.
-- =========================================================================

SET NAMES utf8mb4;

-- 1) Módulo (cf_modulos) --------------------------------------------------
INSERT INTO cf_modulos (
    Codigo, Nombre,
    CreatedUserID, ModifiedUserID, CreatedBy, ModifiedBy, CreatedDate, ModifiedDate
)
SELECT
    'calendario-laboral', 'Calendario Laboral',
    0, 0, 'Sistema', 'Sistema', NOW(), NULL
WHERE NOT EXISTS (
    SELECT 1 FROM cf_modulos WHERE Codigo = 'calendario-laboral'
);

-- 2) Menú (cf_menu) --------------------------------------------------------
-- Cuelga del menú "Configuración" (MenuID 8, Codigo = 'CONFIG',
-- confirmado contra la BD real -- NO es 'configuracion' como texto largo).
INSERT INTO cf_menu (
    Codigo, Nombre, Ruta, Icono, OrdenMenu, MenuPadreID, ModuloID,
    CreatedUserID, ModifiedUserID, CreatedBy, ModifiedBy, CreatedDate, ModifiedDate
)
SELECT
    'calendario-laboral',
    'Calendario Laboral',
    '?modulo=calendario-laboral',
    'bi bi-calendar-week',
    1,
    (SELECT MenuID FROM cf_menu WHERE Codigo = 'CONFIG' LIMIT 1),
    (SELECT ModuloID FROM cf_modulos WHERE Codigo = 'calendario-laboral'),
    0, 0, 'Sistema', 'Sistema', NOW(), NULL
WHERE NOT EXISTS (
    SELECT 1 FROM cf_menu WHERE Codigo = 'calendario-laboral'
);

-- 3) Permisos (cf_permisosmatriz) ------------------------------------------
-- Otorga Consultar + Actualizar a todos los roles activos (no requiere
-- Crear/Eliminar por ser una pantalla de configuración de un solo registro).
INSERT INTO cf_permisosmatriz (
    RolID, ModuloID, PuedeCrear, PuedeConsultar, PuedeActualizar, PuedeEliminar, IsActive,
    CreatedUserID, ModifiedUserID, CreatedBy, ModifiedBy, CreatedDate, ModifiedDate
)
SELECT
    r.RolID,
    (SELECT ModuloID FROM cf_modulos WHERE Codigo = 'calendario-laboral'),
    0, 1, 1, 0, 1,
    0, 0, 'Sistema', 'Sistema', NOW(), NULL
FROM cf_roles r
WHERE r.Activo = 1
  AND NOT EXISTS (
      SELECT 1
      FROM cf_permisosmatriz pm
      INNER JOIN cf_modulos mo ON mo.ModuloID = pm.ModuloID AND mo.Codigo = 'calendario-laboral'
      WHERE pm.RolID = r.RolID
  );
