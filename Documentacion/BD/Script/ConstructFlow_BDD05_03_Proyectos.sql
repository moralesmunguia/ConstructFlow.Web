
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-03 PROYECTOS
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
--   BDD-05-02 Clientes y Comercial
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Proyecto
(
    ProyectoID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    ClienteID BIGINT NOT NULL,
    CotizacionID BIGINT NULL,
    CodigoProyecto VARCHAR(50) NOT NULL,
    NombreProyecto VARCHAR(250) NOT NULL,
    TipoProyecto VARCHAR(50),
    NumeroContrato VARCHAR(100),
    UbicacionProyecto VARCHAR(500),
    Descripcion TEXT,
    FechaInicio DATE,
    FechaFin DATE,
    Estado VARCHAR(30) NOT NULL,
    PresupuestoOriginal DECIMAL(18,2) DEFAULT 0,
    PresupuestoActual DECIMAL(18,2) DEFAULT 0,
    FacturacionAcumulada DECIMAL(18,2) DEFAULT 0,
    CobranzaAcumulada DECIMAL(18,2) DEFAULT 0,
    CostoReal DECIMAL(18,2) DEFAULT 0,
    Rentabilidad DECIMAL(18,2) DEFAULT 0,
    PorcentajeAvance DECIMAL(5,2) DEFAULT 0,
    Observaciones TEXT,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ProyectoID),

    UNIQUE KEY UX_CF_Proyecto_Codigo (EmpresaID,CodigoProyecto),

    KEY IX_CF_Proyecto_Cliente (ClienteID),
    KEY IX_CF_Proyecto_Estado (Estado),
    KEY IX_CF_Proyecto_FechaInicio (FechaInicio),

    CONSTRAINT FK_CF_Proyecto_Empresa
        FOREIGN KEY (EmpresaID)
        REFERENCES CF_Empresa(EmpresaID),

    CONSTRAINT FK_CF_Proyecto_Cliente
        FOREIGN KEY (ClienteID)
        REFERENCES CF_Cliente(ClienteID),

    CONSTRAINT FK_CF_Proyecto_Cotizacion
        FOREIGN KEY (CotizacionID)
        REFERENCES CF_Cotizacion(CotizacionID)
) ENGINE=InnoDB;

CREATE TABLE CF_ProyectoFase
(
    FaseID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    CodigoFase VARCHAR(30),
    NombreFase VARCHAR(150) NOT NULL,
    FechaInicio DATE,
    FechaFin DATE,
    Estado VARCHAR(30),
    OrdenVisual INT DEFAULT 0,
    PorcentajeAvance DECIMAL(5,2) DEFAULT 0,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (FaseID),

    KEY IX_CF_ProyectoFase_Proyecto (ProyectoID),

    CONSTRAINT FK_CF_ProyectoFase_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_TipoEncargado
(
    TipoEncargadoID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(30) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(250),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (TipoEncargadoID),
    UNIQUE KEY UX_CF_TipoEncargado_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_ProyectoEncargado
(
    ProyectoEncargadoID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,
    TipoEncargadoID BIGINT NOT NULL,
    FechaInicio DATE,
    FechaFin DATE,
    Principal BIT(1) DEFAULT b'0',
    Observaciones VARCHAR(500),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ProyectoEncargadoID),

    KEY IX_CF_ProyectoEncargado_Proyecto (ProyectoID),
    KEY IX_CF_ProyectoEncargado_Usuario (UsuarioID),

    CONSTRAINT FK_CF_ProyectoEncargado_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_ProyectoEncargado_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID),

    CONSTRAINT FK_CF_ProyectoEncargado_Tipo
        FOREIGN KEY (TipoEncargadoID)
        REFERENCES CF_TipoEncargado(TipoEncargadoID)
) ENGINE=InnoDB;

CREATE TABLE CF_Hito
(
    HitoID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    Codigo VARCHAR(50),
    Nombre VARCHAR(250),
    FechaPlan DATE,
    FechaReal DATE,
    Estado VARCHAR(30),
    Observaciones VARCHAR(500),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (HitoID),

    KEY IX_CF_Hito_Proyecto (ProyectoID),

    CONSTRAINT FK_CF_Hito_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_Incidencia
(
    IncidenciaID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    TipoIncidencia VARCHAR(50),
    Prioridad VARCHAR(20),
    Descripcion TEXT,
    Estado VARCHAR(30),
    FechaIncidencia DATETIME,
    FechaCierre DATETIME NULL,
    ResponsableID BIGINT NULL,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (IncidenciaID),

    KEY IX_CF_Incidencia_Proyecto (ProyectoID),

    CONSTRAINT FK_CF_Incidencia_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_Incidencia_Usuario
        FOREIGN KEY (ResponsableID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_BitacoraProyecto
(
    BitacoraProyectoID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,
    FechaEvento DATETIME NOT NULL,
    TipoEvento VARCHAR(50),
    Descripcion TEXT,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (BitacoraProyectoID),

    KEY IX_CF_BitacoraProyecto_Proyecto (ProyectoID),
    KEY IX_CF_BitacoraProyecto_Usuario (UsuarioID),

    CONSTRAINT FK_CF_BitacoraProyecto_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_BitacoraProyecto_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

INSERT INTO CF_TipoEncargado (Codigo,Nombre) VALUES
('DIRECTOR','Director Proyecto'),
('GERENTE','Gerente Proyecto'),
('RESIDENTE','Residente Obra'),
('SUPERVISOR','Supervisor'),
('ADMIN','Administrador Proyecto'),
('CLIENTE','Representante Cliente'),
('CALIDAD','Responsable Calidad'),
('SEGURIDAD','Responsable Seguridad');

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('PROY_PLANEACION','Planeación','PLANEACION','PROYECTO'),
('PROY_ACTIVO','Activo','ACTIVO','PROYECTO'),
('PROY_SUSPENDIDO','Suspendido','SUSPENDIDO','PROYECTO'),
('PROY_CERRADO','Cerrado','CERRADO','PROYECTO');
