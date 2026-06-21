
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-02 CLIENTES Y COMERCIAL
-- MySQL 8.0
-- Dependencia: BDD-05-01 Core Foundation
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Cliente (
    ClienteID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    RFC VARCHAR(20) NOT NULL,
    NombreCliente VARCHAR(250) NOT NULL,
    ContactoPrincipal VARCHAR(200),
    Telefono VARCHAR(50),
    Correo VARCHAR(150),
    Direccion VARCHAR(500),
    LimiteCredito DECIMAL(18,2) DEFAULT 0,
    DiasCredito INT DEFAULT 30,
    Observaciones TEXT,
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (ClienteID),
    UNIQUE KEY UX_CF_Cliente_RFC (EmpresaID,RFC),
    KEY IX_CF_Cliente_Nombre (NombreCliente),
    CONSTRAINT FK_CF_Cliente_Empresa
        FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID)
) ENGINE=InnoDB;

CREATE TABLE CF_ClienteContacto (
    ClienteContactoID BIGINT NOT NULL AUTO_INCREMENT,
    ClienteID BIGINT NOT NULL,
    Nombre VARCHAR(200) NOT NULL,
    Puesto VARCHAR(100),
    Correo VARCHAR(150),
    Telefono VARCHAR(50),
    Celular VARCHAR(50),
    Principal BIT(1) DEFAULT b'0',
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (ClienteContactoID),
    KEY IX_CF_ClienteContacto_Cliente (ClienteID),
    CONSTRAINT FK_CF_ClienteContacto_Cliente
        FOREIGN KEY (ClienteID) REFERENCES CF_Cliente(ClienteID)
) ENGINE=InnoDB;

CREATE TABLE CF_ClienteDireccion (
    ClienteDireccionID BIGINT NOT NULL AUTO_INCREMENT,
    ClienteID BIGINT NOT NULL,
    TipoDireccion VARCHAR(50),
    Calle VARCHAR(250),
    NumeroExterior VARCHAR(20),
    NumeroInterior VARCHAR(20),
    Colonia VARCHAR(150),
    Municipio VARCHAR(150),
    Estado VARCHAR(150),
    CodigoPostal VARCHAR(10),
    Pais VARCHAR(100),
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (ClienteDireccionID),
    KEY IX_CF_ClienteDireccion_Cliente (ClienteID),
    CONSTRAINT FK_CF_ClienteDireccion_Cliente
        FOREIGN KEY (ClienteID) REFERENCES CF_Cliente(ClienteID)
) ENGINE=InnoDB;

CREATE TABLE CF_Concepto (
    ConceptoID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    Codigo VARCHAR(50) NOT NULL,
    NombreConcepto VARCHAR(250) NOT NULL,
    Descripcion TEXT,
    UnidadMedida VARCHAR(50),
    PrecioBase DECIMAL(18,4) DEFAULT 0,
    Categoria VARCHAR(100),
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (ConceptoID),
    UNIQUE KEY UX_CF_Concepto (EmpresaID,Codigo),
    CONSTRAINT FK_CF_Concepto_Empresa
        FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID)
) ENGINE=InnoDB;

CREATE TABLE CF_Cotizacion (
    CotizacionID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    ClienteID BIGINT NOT NULL,
    Folio VARCHAR(50) NOT NULL,
    Fecha DATE NOT NULL,
    Vigencia DATE,
    Moneda VARCHAR(10) DEFAULT 'MXN',
    TipoCambio DECIMAL(18,6) DEFAULT 1,
    Subtotal DECIMAL(18,2) DEFAULT 0,
    IVA DECIMAL(18,2) DEFAULT 0,
    Total DECIMAL(18,2) DEFAULT 0,
    Estado VARCHAR(30) NOT NULL,
    VersionActual VARCHAR(20) DEFAULT 'V1.0',
    ProbabilidadCierre DECIMAL(5,2) DEFAULT 0,
    OrigenProspecto VARCHAR(100),
    Observaciones TEXT,
    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (CotizacionID),
    UNIQUE KEY UX_CF_Cotizacion_Folio (EmpresaID,Folio),
    KEY IX_CF_Cotizacion_Cliente (ClienteID),
    KEY IX_CF_Cotizacion_Estado (Estado),
    CONSTRAINT FK_CF_Cotizacion_Empresa
        FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID),
    CONSTRAINT FK_CF_Cotizacion_Cliente
        FOREIGN KEY (ClienteID) REFERENCES CF_Cliente(ClienteID)
) ENGINE=InnoDB;

CREATE TABLE CF_CotizacionDetalle (
    CotizacionDetalleID BIGINT NOT NULL AUTO_INCREMENT,
    CotizacionID BIGINT NOT NULL,
    ConceptoID BIGINT NULL,
    Descripcion VARCHAR(500),
    Unidad VARCHAR(50),
    Cantidad DECIMAL(18,4),
    PrecioUnitario DECIMAL(18,4),
    Descuento DECIMAL(18,2),
    Importe DECIMAL(18,2),
    OrdenVisual INT DEFAULT 0,
    PRIMARY KEY (CotizacionDetalleID),
    KEY IX_CF_CotizacionDetalle_Cotizacion (CotizacionID),
    CONSTRAINT FK_CF_CotizacionDetalle_Cotizacion
        FOREIGN KEY (CotizacionID) REFERENCES CF_Cotizacion(CotizacionID),
    CONSTRAINT FK_CF_CotizacionDetalle_Concepto
        FOREIGN KEY (ConceptoID) REFERENCES CF_Concepto(ConceptoID)
) ENGINE=InnoDB;

CREATE TABLE CF_CotizacionVersion (
    CotizacionVersionID BIGINT NOT NULL AUTO_INCREMENT,
    CotizacionID BIGINT NOT NULL,
    Version VARCHAR(20) NOT NULL,
    Comentarios TEXT,
    UsuarioID BIGINT,
    FechaVersion DATETIME NOT NULL,
    TotalVersion DECIMAL(18,2),
    PRIMARY KEY (CotizacionVersionID),
    KEY IX_CF_CotizacionVersion_Cotizacion (CotizacionID),
    CONSTRAINT FK_CF_CotizacionVersion_Cotizacion
        FOREIGN KEY (CotizacionID) REFERENCES CF_Cotizacion(CotizacionID),
    CONSTRAINT FK_CF_CotizacionVersion_Usuario
        FOREIGN KEY (UsuarioID) REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('DIR_FISCAL','Dirección Fiscal','FISCAL','CLIENTES'),
('DIR_OBRA','Dirección Obra','OBRA','CLIENTES'),
('DIR_COBRO','Dirección Cobranza','COBRANZA','CLIENTES');
