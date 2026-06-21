
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-04 ACTIVIDADES Y GANTT
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
--   BDD-05-03 Proyectos
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Actividad
(
    ActividadID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    FaseID BIGINT NULL,

    CodigoWBS VARCHAR(50) NOT NULL,
    NombreActividad VARCHAR(250) NOT NULL,
    Descripcion TEXT,

    InicioPlan DATE,
    FinPlan DATE,

    InicioReal DATE,
    FinReal DATE,

    DuracionPlan INT DEFAULT 0,
    DuracionReal INT DEFAULT 0,

    Avance DECIMAL(5,2) DEFAULT 0,
    Estado VARCHAR(30) NOT NULL,
    Prioridad VARCHAR(20) DEFAULT 'MEDIA',

    RutaCritica BIT(1) DEFAULT b'0',

    HorasPlaneadas DECIMAL(10,2) DEFAULT 0,
    HorasReales DECIMAL(10,2) DEFAULT 0,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ActividadID),

    UNIQUE KEY UX_CF_Actividad_WBS (ProyectoID,CodigoWBS),

    KEY IX_CF_Actividad_Proyecto (ProyectoID),
    KEY IX_CF_Actividad_Fase (FaseID),
    KEY IX_CF_Actividad_Estado (Estado),

    CONSTRAINT FK_CF_Actividad_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_Actividad_Fase
        FOREIGN KEY (FaseID)
        REFERENCES CF_ProyectoFase(FaseID)
) ENGINE=InnoDB;

CREATE TABLE CF_ActividadDependencia
(
    DependenciaID BIGINT NOT NULL AUTO_INCREMENT,

    ActividadOrigenID BIGINT NOT NULL,
    ActividadDestinoID BIGINT NOT NULL,

    TipoDependencia VARCHAR(10) NOT NULL DEFAULT 'FS',
    DiasDesfase INT DEFAULT 0,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (DependenciaID),

    CONSTRAINT FK_CF_ActividadDep_Origen
        FOREIGN KEY (ActividadOrigenID)
        REFERENCES CF_Actividad(ActividadID),

    CONSTRAINT FK_CF_ActividadDep_Destino
        FOREIGN KEY (ActividadDestinoID)
        REFERENCES CF_Actividad(ActividadID)
) ENGINE=InnoDB;

CREATE TABLE CF_ActividadAsignacion
(
    ActividadAsignacionID BIGINT NOT NULL AUTO_INCREMENT,

    ActividadID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,

    RolActividad VARCHAR(100),

    HorasPlaneadas DECIMAL(10,2) DEFAULT 0,
    HorasReales DECIMAL(10,2) DEFAULT 0,

    Principal BIT(1) DEFAULT b'0',

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ActividadAsignacionID),

    KEY IX_CF_ActividadAsignacion_Actividad (ActividadID),
    KEY IX_CF_ActividadAsignacion_Usuario (UsuarioID),

    CONSTRAINT FK_CF_ActividadAsignacion_Actividad
        FOREIGN KEY (ActividadID)
        REFERENCES CF_Actividad(ActividadID),

    CONSTRAINT FK_CF_ActividadAsignacion_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_ActividadComentario
(
    ActividadComentarioID BIGINT NOT NULL AUTO_INCREMENT,

    ActividadID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,

    Comentario TEXT NOT NULL,
    FechaComentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ActividadComentarioID),

    KEY IX_CF_ActividadComentario_Actividad (ActividadID),

    CONSTRAINT FK_CF_ActividadComentario_Actividad
        FOREIGN KEY (ActividadID)
        REFERENCES CF_Actividad(ActividadID),

    CONSTRAINT FK_CF_ActividadComentario_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('ACT_PENDIENTE','Pendiente','PENDIENTE','ACTIVIDAD'),
('ACT_ASIGNADA','Asignada','ASIGNADA','ACTIVIDAD'),
('ACT_PROCESO','En Proceso','EN_PROCESO','ACTIVIDAD'),
('ACT_TERMINADA','Terminada','TERMINADA','ACTIVIDAD'),
('ACT_CANCELADA','Cancelada','CANCELADA','ACTIVIDAD');

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('DEP_FS','Finish Start','FS','DEPENDENCIA'),
('DEP_SS','Start Start','SS','DEPENDENCIA'),
('DEP_FF','Finish Finish','FF','DEPENDENCIA'),
('DEP_SF','Start Finish','SF','DEPENDENCIA');
