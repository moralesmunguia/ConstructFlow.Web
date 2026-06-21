
-- ================================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-09 MASTER SCRIPT
-- INSTALACION COMPLETA BASE DE DATOS
-- MySQL 8.0
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS ConstructFlow
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ConstructFlow;

-- ================================================================
-- ORDEN DE EJECUCION
-- ================================================================
-- 01 Core Foundation
-- 02 Clientes y Comercial
-- 03 Proyectos
-- 04 Actividades y Gantt
-- 05 Evidencias y Documentos
-- 06 Finanzas y Costos
-- 07 Dashboard KPI Alertas Notificaciones
-- 08 Auditoria Workflow Integraciones
-- ================================================================

/*
IMPORTANTE

Este archivo es el instalador maestro de ConstructFlow.

Incluir aquí el contenido completo de:

ConstructFlow_BDD05_01_CoreFoundation.sql
ConstructFlow_BDD05_02_Clientes_Comercial.sql
ConstructFlow_BDD05_03_Proyectos.sql
ConstructFlow_BDD05_04_Actividades_Gantt.sql
ConstructFlow_BDD05_05_Evidencias_Documentos.sql
ConstructFlow_BDD05_06_Finanzas_Costos.sql
ConstructFlow_BDD05_07_Dashboard_KPI_Alertas_Notificaciones.sql
ConstructFlow_BDD05_08_Auditoria_Workflow_Integraciones.sql
*/

-- ================================================================
-- DATOS INICIALES EMPRESA DEMO
-- ================================================================

INSERT INTO CF_Empresa
(
    NombreEmpresa,
    RFC,
    Correo
)
SELECT
    'ROM Constructora',
    'XAXX010101000',
    'admin@constructflow.mx'
WHERE NOT EXISTS
(
    SELECT 1
    FROM CF_Empresa
    WHERE RFC='XAXX010101000'
);

-- ================================================================
-- USUARIO ADMINISTRADOR
-- ================================================================

INSERT INTO CF_Usuario
(
    EmpresaID,
    RolID,
    Nombre,
    Correo,
    PasswordHash
)
SELECT
    1,
    1,
    'Administrador',
    'admin@constructflow.mx',
    'CAMBIAR_PASSWORD_HASH'
WHERE NOT EXISTS
(
    SELECT 1
    FROM CF_Usuario
    WHERE Correo='admin@constructflow.mx'
);

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
    p.CostoReal
FROM CF_Proyecto p
INNER JOIN CF_Cliente c
    ON c.ClienteID = p.ClienteID;

CREATE OR REPLACE VIEW VW_CobranzaPendiente AS
SELECT
    f.FacturaID,
    f.UUID,
    f.Total,
    f.Saldo,
    f.FechaVencimiento
FROM CF_Factura f
WHERE f.Saldo > 0;

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

DELIMITER $$

CREATE PROCEDURE SP_Proyecto_Avance
(
    IN pProyectoID BIGINT
)
BEGIN

    SELECT
        ProyectoID,
        NombreProyecto,
        PorcentajeAvance
    FROM CF_Proyecto
    WHERE ProyectoID = pProyectoID;

END$$

CREATE PROCEDURE SP_KPI_Rentabilidad
()
BEGIN

    SELECT
        ProyectoID,
        NombreProyecto,
        PresupuestoActual,
        CostoReal,
        (PresupuestoActual - CostoReal) AS Utilidad
    FROM CF_Proyecto;

END$$

DELIMITER ;

-- ================================================================
-- TRIGGER AUDITORIA EJEMPLO
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

DELIMITER ;

-- ================================================================
-- INDICES CORPORATIVOS ADICIONALES
-- ================================================================

CREATE INDEX IX_CF_Proyecto_CreateDate
ON CF_Proyecto(CreateDate);

CREATE INDEX IX_CF_Actividad_CreateDate
ON CF_Actividad(CreateDate);

CREATE INDEX IX_CF_Factura_CreateDate
ON CF_Factura(CreateDate);

-- ================================================================
-- VALIDACION FINAL
-- ================================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'ConstructFlow V1.0 instalado correctamente' AS Resultado;
