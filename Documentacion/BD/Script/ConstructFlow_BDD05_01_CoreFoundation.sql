-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-01 CORE FOUNDATION
-- MySQL 8.0
-- =====================================================

CREATE DATABASE IF NOT EXISTS ConstructFlow
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ConstructFlow;

CREATE TABLE CF_Empresa (
    EmpresaID BIGINT NOT NULL AUTO_INCREMENT,
    NombreEmpresa VARCHAR(200) NOT NULL,
    RFC VARCHAR(20) NOT NULL,
    Direccion VARCHAR(500),
    Telefono VARCHAR(50),
    Correo VARCHAR(150),
    LogoURL VARCHAR(500),
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (EmpresaID),
    UNIQUE KEY UX_CF_Empresa_RFC (RFC)
) ENGINE=InnoDB;

CREATE TABLE CF_Configuracion (
    ConfiguracionID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    IVA DECIMAL(8,4) NOT NULL DEFAULT 0.1600,
    Moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
    DiasVencimiento INT NOT NULL DEFAULT 30,
    LogoURL VARCHAR(500),
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (ConfiguracionID),
    KEY IX_CF_Configuracion_Empresa (EmpresaID),
    CONSTRAINT FK_CF_Configuracion_CF_Empresa
      FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID)
) ENGINE=InnoDB;

CREATE TABLE CF_Parametro (
    ParametroID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Valor VARCHAR(1000),
    Categoria VARCHAR(100),
    PRIMARY KEY (ParametroID),
    UNIQUE KEY UX_CF_Parametro_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_Rol (
    RolID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(30) NOT NULL,
    NombreRol VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(500),
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (RolID),
    UNIQUE KEY UX_CF_Rol_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_Permiso (
    PermisoID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Modulo VARCHAR(100),
    PuedeCrear BIT(1) DEFAULT b'0',
    PuedeConsultar BIT(1) DEFAULT b'0',
    PuedeModificar BIT(1) DEFAULT b'0',
    PuedeEliminar BIT(1) DEFAULT b'0',
    PRIMARY KEY (PermisoID),
    UNIQUE KEY UX_CF_Permiso_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_RolPermiso (
    RolPermisoID BIGINT NOT NULL AUTO_INCREMENT,
    RolID BIGINT NOT NULL,
    PermisoID BIGINT NOT NULL,
    PRIMARY KEY (RolPermisoID),
    UNIQUE KEY UX_CF_RolPermiso (RolID, PermisoID),
    CONSTRAINT FK_CF_RolPermiso_Rol FOREIGN KEY (RolID) REFERENCES CF_Rol(RolID),
    CONSTRAINT FK_CF_RolPermiso_Permiso FOREIGN KEY (PermisoID) REFERENCES CF_Permiso(PermisoID)
) ENGINE=InnoDB;

CREATE TABLE CF_Usuario (
    UsuarioID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    RolID BIGINT NOT NULL,
    Nombre VARCHAR(200) NOT NULL,
    Correo VARCHAR(200) NOT NULL,
    PasswordHash VARCHAR(500) NOT NULL,
    Telefono VARCHAR(50),
    UltimoAcceso DATETIME NULL,
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (UsuarioID),
    UNIQUE KEY UX_CF_Usuario_Correo (Correo),
    KEY IX_CF_Usuario_Empresa (EmpresaID),
    KEY IX_CF_Usuario_Rol (RolID),
    CONSTRAINT FK_CF_Usuario_Empresa FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID),
    CONSTRAINT FK_CF_Usuario_Rol FOREIGN KEY (RolID) REFERENCES CF_Rol(RolID)
) ENGINE=InnoDB;

CREATE TABLE CF_Sesion (
    SesionID BIGINT NOT NULL AUTO_INCREMENT,
    UsuarioID BIGINT NOT NULL,
    TokenJWT VARCHAR(2000),
    FechaInicio DATETIME,
    FechaExpiracion DATETIME,
    IP VARCHAR(50),
    Navegador VARCHAR(500),
    PRIMARY KEY (SesionID),
    KEY IX_CF_Sesion_Usuario (UsuarioID),
    CONSTRAINT FK_CF_Sesion_Usuario FOREIGN KEY (UsuarioID) REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_Menu (
    MenuID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Ruta VARCHAR(250),
    Icono VARCHAR(100),
    OrdenMenu INT,
    MenuPadreID BIGINT NULL,
    PRIMARY KEY (MenuID),
    UNIQUE KEY UX_CF_Menu_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_Widget (
    WidgetID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    TipoWidget VARCHAR(50),
    ConfiguracionJSON JSON,
    PRIMARY KEY (WidgetID),
    UNIQUE KEY UX_CF_Widget_Codigo (Codigo)
) ENGINE=InnoDB;

INSERT INTO CF_Rol (Codigo,NombreRol) VALUES
('ADMIN','Administrador'),
('DIRECCION','Dirección'),
('GERENTE','Gerente Proyecto'),
('SUPERVISOR','Supervisor'),
('CONSULTA','Consulta');

INSERT INTO CF_Menu (Codigo,Nombre,Ruta,OrdenMenu) VALUES
('DASHBOARD','Dashboard','/dashboard',1),
('COTIZACIONES','Cotizaciones','/cotizaciones',2),
('PROYECTOS','Proyectos','/proyectos',3),
('ACTIVIDADES','Actividades','/actividades',4),
('DOCUMENTOS','Documentos','/documentos',5),
('FACTURACION','Facturación','/facturacion',6),
('COSTOS','Costos','/costos',7),
('CONFIG','Configuración','/configuracion',8);
