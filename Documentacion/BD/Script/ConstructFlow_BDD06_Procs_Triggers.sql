-- CONSTRUCTFLOW V1.0
-- Procedimientos y triggers (ejecutar como DBA)
-- Requisitos: ejecutar como usuario con SUPER o establecer:
--   SET GLOBAL log_bin_trust_function_creators = 1;
-- Después de ejecutar, revertir a su valor anterior si es necesario.

-- PROCEDIMIENTOS
DROP PROCEDURE IF EXISTS SP_Proyecto_Avance;
DELIMITER $$
CREATE PROCEDURE SP_Proyecto_Avance(IN pProyectoID BIGINT)
BEGIN
    SELECT
        ProyectoID,
        NombreProyecto,
        PorcentajeAvance
    FROM CF_Proyecto
    WHERE ProyectoID = pProyectoID;
END$$

DROP PROCEDURE IF EXISTS SP_Proyecto_Rentabilidad;
DELIMITER $$
CREATE PROCEDURE SP_Proyecto_Rentabilidad(IN pProyectoID BIGINT)
BEGIN
    SELECT
        ProyectoID,
        NombreProyecto,
        PresupuestoActual,
        CostoReal,
        (PresupuestoActual - CostoReal) AS Utilidad
    FROM CF_Proyecto
    WHERE ProyectoID = pProyectoID;
END$$

DROP PROCEDURE IF EXISTS SP_KPI_Rentabilidad;
DELIMITER $$
CREATE PROCEDURE SP_KPI_Rentabilidad()
BEGIN
    SELECT
        ProyectoID,
        NombreProyecto,
        PresupuestoActual,
        CostoReal,
        (PresupuestoActual - CostoReal) AS Utilidad
    FROM CF_Proyecto;
END$$

DROP PROCEDURE IF EXISTS SP_Cobranza_Vencida;
DELIMITER $$
CREATE PROCEDURE SP_Cobranza_Vencida()
BEGIN
    SELECT *
    FROM CF_Factura
    WHERE Saldo > 0
      AND FechaVencimiento < CURDATE();
END$$

DROP PROCEDURE IF EXISTS SP_KPI_Operativos;
DELIMITER $$
CREATE PROCEDURE SP_KPI_Operativos()
BEGIN
    SELECT
        COUNT(*) AS TotalProyectos,
        AVG(PorcentajeAvance) AS AvancePromedio
    FROM CF_Proyecto;
END$$

DELIMITER ;

-- TRIGGERS
DROP TRIGGER IF EXISTS TR_CF_Proyecto_AI;
DELIMITER $$
CREATE TRIGGER TR_CF_Proyecto_AI
AFTER INSERT ON CF_Proyecto
FOR EACH ROW
BEGIN
    INSERT INTO CF_Auditoria
    (
        EmpresaID,
        UsuarioID,
        Modulo,
        Entidad,
        EntidadID,
        Accion
    )
    VALUES
    (
        NEW.EmpresaID,
        NEW.CreatedUserID,
        'PROYECTOS',
        'CF_Proyecto',
        NEW.ProyectoID,
        'INSERT'
    );
END$$

DROP TRIGGER IF EXISTS TR_CF_Proyecto_AU;
DELIMITER $$
CREATE TRIGGER TR_CF_Proyecto_AU
AFTER UPDATE ON CF_Proyecto
FOR EACH ROW
BEGIN
    INSERT INTO CF_Auditoria
    (
        EmpresaID,
        UsuarioID,
        Modulo,
        Entidad,
        EntidadID,
        Accion
    )
    VALUES
    (
        NEW.EmpresaID,
        NEW.ModifiedUserID,
        'PROYECTOS',
        'CF_Proyecto',
        NEW.ProyectoID,
        'UPDATE'
    );
END$$

DELIMITER ;
