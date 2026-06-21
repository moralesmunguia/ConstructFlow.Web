
-- ================================================================
-- CONSTRUCTFLOW V1.0
-- BDD-06
-- VISTAS, STORED PROCEDURES, TRIGGERS Y JOBS CORPORATIVOS
-- MySQL 8.0
-- ================================================================

USE ConstructFlow;

-- ================================================================
-- VISTAS CORPORATIVAS
-- ================================================================

CREATE OR REPLACE VIEW VW_ProyectoResumen AS
SELECT
    p.ProyectoID,
    p.CodigoProyecto,
    p.NombreProyecto,
    c.NombreCliente,
    p.Estado,
    p.PorcentajeAvance,
    p.PresupuestoActual,
    p.CostoReal,
    (p.PresupuestoActual - p.CostoReal) AS UtilidadEstimada
FROM CF_Proyecto p
INNER JOIN CF_Cliente c ON c.ClienteID = p.ClienteID;

CREATE OR REPLACE VIEW VW_CobranzaPendiente AS
SELECT
    f.FacturaID,
    f.UUID,
    f.Total,
    f.Saldo,
    f.FechaVencimiento
FROM CF_Factura f
WHERE f.Saldo > 0;

CREATE OR REPLACE VIEW VW_ActividadAvance AS
SELECT
    a.ActividadID,
    a.CodigoWBS,
    a.NombreActividad,
    a.Avance,
    a.Estado,
    p.NombreProyecto
FROM CF_Actividad a
INNER JOIN CF_Proyecto p ON p.ProyectoID = a.ProyectoID;

CREATE OR REPLACE VIEW VW_CostosProyecto AS
SELECT
    p.ProyectoID,
    p.NombreProyecto,
    SUM(c.Importe) AS TotalCostos
FROM CF_Proyecto p
LEFT JOIN CF_Costo c ON c.ProyectoID = p.ProyectoID
GROUP BY p.ProyectoID, p.NombreProyecto;

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

DELIMITER $$

CREATE PROCEDURE SP_Proyecto_Avance(IN pProyectoID BIGINT)
BEGIN
    SELECT *
    FROM VW_ProyectoResumen
    WHERE ProyectoID = pProyectoID;
END$$

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

CREATE PROCEDURE SP_Cobranza_Vencida()
BEGIN
    SELECT *
    FROM CF_Factura
    WHERE Saldo > 0
      AND FechaVencimiento < CURDATE();
END$$

CREATE PROCEDURE SP_KPI_Operativos()
BEGIN
    SELECT
        COUNT(*) AS TotalProyectos,
        AVG(PorcentajeAvance) AS AvancePromedio
    FROM CF_Proyecto;
END$$

DELIMITER ;

-- ================================================================
-- TRIGGERS DE AUDITORIA
-- ================================================================

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

-- ================================================================
-- JOBS CORPORATIVOS (CATALOGO)
-- ================================================================

INSERT INTO CF_JobProgramado
(Codigo,Nombre,ExpresionCron,Activo)
VALUES
('JOB_KPI_DIARIO','Actualizacion KPI Diario','0 0 * * *',1),
('JOB_COBRANZA','Revision Cobranza','0 */2 * * *',1),
('JOB_ALERTAS','Generacion Alertas','*/30 * * * *',1),
('JOB_AUDITORIA','Depuracion Auditoria','0 2 * * 0',1);

-- ================================================================
-- KPI Y ALERTAS AUTOMATICAS
-- ================================================================

INSERT INTO CF_Parametro
(Codigo,Nombre,Valor,Categoria)
VALUES
('KPI_AVANCE_MIN','Avance Minimo Proyecto','70','KPI'),
('KPI_RENT_MIN','Rentabilidad Minima','15','KPI'),
('ALERTA_VENCIMIENTO','Alerta Factura Vencida','SI','ALERTA');

-- ================================================================
-- FIN SCRIPT BDD-06
-- ================================================================
