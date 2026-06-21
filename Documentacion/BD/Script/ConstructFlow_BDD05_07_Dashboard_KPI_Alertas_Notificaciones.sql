
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-07 DASHBOARD, KPI'S, ALERTAS Y NOTIFICACIONES
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_KPI
(
    KPIID BIGINT NOT NULL AUTO_INCREMENT,

    EmpresaID BIGINT NOT NULL,

    Codigo VARCHAR(50) NOT NULL,
    NombreKPI VARCHAR(150) NOT NULL,
    Categoria VARCHAR(100),

    FormulaSQL TEXT,
    ValorObjetivo DECIMAL(18,4),
    ValorActual DECIMAL(18,4),

    UnidadMedida VARCHAR(50),
    Frecuencia VARCHAR(30),

    Activo BIT(1) NOT NULL DEFAULT b'1',

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (KPIID),

    UNIQUE KEY UX_CF_KPI_Codigo (EmpresaID,Codigo),

    CONSTRAINT FK_CF_KPI_Empresa
        FOREIGN KEY (EmpresaID)
        REFERENCES CF_Empresa(EmpresaID)
) ENGINE=InnoDB;

CREATE TABLE CF_Alerta
(
    AlertaID BIGINT NOT NULL AUTO_INCREMENT,

    KPIID BIGINT NULL,
    ProyectoID BIGINT NULL,

    TipoAlerta VARCHAR(50),
    Prioridad VARCHAR(20),

    Titulo VARCHAR(250),
    Mensaje TEXT,

    FechaGeneracion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaAtencion DATETIME NULL,

    Estado VARCHAR(30) DEFAULT 'ABIERTA',

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (AlertaID),

    KEY IX_CF_Alerta_KPI (KPIID),
    KEY IX_CF_Alerta_Proyecto (ProyectoID),

    CONSTRAINT FK_CF_Alerta_KPI
        FOREIGN KEY (KPIID)
        REFERENCES CF_KPI(KPIID),

    CONSTRAINT FK_CF_Alerta_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_Notificacion
(
    NotificacionID BIGINT NOT NULL AUTO_INCREMENT,

    TipoNotificacion VARCHAR(50),
    Prioridad VARCHAR(20),

    Titulo VARCHAR(250) NOT NULL,
    Mensaje TEXT,

    FechaEnvio DATETIME DEFAULT CURRENT_TIMESTAMP,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (NotificacionID)
) ENGINE=InnoDB;

CREATE TABLE CF_NotificacionUsuario
(
    NotificacionUsuarioID BIGINT NOT NULL AUTO_INCREMENT,

    NotificacionID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,

    Leida BIT(1) DEFAULT b'0',
    FechaLectura DATETIME NULL,

    PRIMARY KEY (NotificacionUsuarioID),

    KEY IX_CF_NotifUsuario_Usuario (UsuarioID),

    CONSTRAINT FK_CF_NotifUsuario_Notificacion
        FOREIGN KEY (NotificacionID)
        REFERENCES CF_Notificacion(NotificacionID),

    CONSTRAINT FK_CF_NotifUsuario_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_DashboardFavorito
(
    DashboardFavoritoID BIGINT NOT NULL AUTO_INCREMENT,

    UsuarioID BIGINT NOT NULL,

    NombreDashboard VARCHAR(150) NOT NULL,

    ConfiguracionJSON JSON,

    Predeterminado BIT(1) DEFAULT b'0',

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (DashboardFavoritoID),

    CONSTRAINT FK_CF_DashboardFavorito_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_WidgetUsuario
(
    WidgetUsuarioID BIGINT NOT NULL AUTO_INCREMENT,

    UsuarioID BIGINT NOT NULL,
    WidgetID BIGINT NOT NULL,

    DashboardFavoritoID BIGINT NULL,

    PosicionX INT DEFAULT 0,
    PosicionY INT DEFAULT 0,
    Alto INT DEFAULT 1,
    Ancho INT DEFAULT 1,
    OrdenVisual INT DEFAULT 0,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (WidgetUsuarioID),

    CONSTRAINT FK_CF_WidgetUsuario_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID),

    CONSTRAINT FK_CF_WidgetUsuario_Widget
        FOREIGN KEY (WidgetID)
        REFERENCES CF_Widget(WidgetID),

    CONSTRAINT FK_CF_WidgetUsuario_Dashboard
        FOREIGN KEY (DashboardFavoritoID)
        REFERENCES CF_DashboardFavorito(DashboardFavoritoID)
) ENGINE=InnoDB;

INSERT INTO CF_KPI
(EmpresaID,Codigo,NombreKPI,Categoria,UnidadMedida,Frecuencia)
VALUES
(1,'KPI_AVANCE','Avance Promedio Proyectos','OPERACION','%','DIARIA'),
(1,'KPI_RENTAB','Rentabilidad Proyectos','FINANZAS','%','MENSUAL'),
(1,'KPI_COBRANZA','Cobranza Pendiente','FINANZAS','MXN','DIARIA'),
(1,'KPI_VENTAS','Pipeline Comercial','COMERCIAL','MXN','SEMANAL');

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('ALTA','Prioridad Alta','ALTA','ALERTA'),
('MEDIA','Prioridad Media','MEDIA','ALERTA'),
('BAJA','Prioridad Baja','BAJA','ALERTA'),
('CRITICA','Prioridad Crítica','CRITICA','ALERTA');
