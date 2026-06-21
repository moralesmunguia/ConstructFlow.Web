
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-06 FINANZAS Y COSTOS
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
--   BDD-05-02 Clientes y Comercial
--   BDD-05-03 Proyectos
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Factura
(
    FacturaID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,
    ClienteID BIGINT NOT NULL,

    UUID VARCHAR(50),
    Serie VARCHAR(20),
    Folio VARCHAR(50),

    FechaFactura DATE NOT NULL,
    FechaVencimiento DATE,

    Subtotal DECIMAL(18,2) DEFAULT 0,
    IVA DECIMAL(18,2) DEFAULT 0,
    Total DECIMAL(18,2) DEFAULT 0,
    Saldo DECIMAL(18,2) DEFAULT 0,

    Estado VARCHAR(30) NOT NULL,

    XMLURL VARCHAR(1000),
    PDFURL VARCHAR(1000),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (FacturaID),
    UNIQUE KEY UX_CF_Factura_UUID (UUID),

    CONSTRAINT FK_CF_Factura_Proyecto FOREIGN KEY (ProyectoID) REFERENCES CF_Proyecto(ProyectoID),
    CONSTRAINT FK_CF_Factura_Cliente FOREIGN KEY (ClienteID) REFERENCES CF_Cliente(ClienteID)
) ENGINE=InnoDB;

CREATE TABLE CF_Pago
(
    PagoID BIGINT NOT NULL AUTO_INCREMENT,
    FacturaID BIGINT NOT NULL,

    FechaPago DATE NOT NULL,
    Importe DECIMAL(18,2) NOT NULL,

    MetodoPago VARCHAR(50),
    Referencia VARCHAR(200),
    Banco VARCHAR(150),
    Observaciones VARCHAR(500),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (PagoID),

    CONSTRAINT FK_CF_Pago_Factura
        FOREIGN KEY (FacturaID)
        REFERENCES CF_Factura(FacturaID)
) ENGINE=InnoDB;

CREATE TABLE CF_Estimacion
(
    EstimacionID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,

    Periodo VARCHAR(20),
    FechaEstimacion DATE,

    PorcentajeAvance DECIMAL(5,2),
    ImporteEstimado DECIMAL(18,2),

    Estado VARCHAR(30),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (EstimacionID),

    CONSTRAINT FK_CF_Estimacion_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_CuentaCobrar
(
    CuentaCobrarID BIGINT NOT NULL AUTO_INCREMENT,
    FacturaID BIGINT NOT NULL,
    ProyectoID BIGINT NOT NULL,

    SaldoActual DECIMAL(18,2),
    FechaVencimiento DATE,
    DiasVencidos INT,
    Estado VARCHAR(30),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (CuentaCobrarID),

    CONSTRAINT FK_CF_CxC_Factura
        FOREIGN KEY (FacturaID)
        REFERENCES CF_Factura(FacturaID),

    CONSTRAINT FK_CF_CxC_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_CategoriaCosto
(
    CategoriaCostoID BIGINT NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,

    PRIMARY KEY (CategoriaCostoID),
    UNIQUE KEY UX_CF_CategoriaCosto_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_Proveedor
(
    ProveedorID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,

    RFC VARCHAR(20),
    NombreProveedor VARCHAR(250) NOT NULL,
    Contacto VARCHAR(150),
    Telefono VARCHAR(50),
    Correo VARCHAR(150),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ProveedorID),

    CONSTRAINT FK_CF_Proveedor_Empresa
        FOREIGN KEY (EmpresaID)
        REFERENCES CF_Empresa(EmpresaID)
) ENGINE=InnoDB;

CREATE TABLE CF_Presupuesto
(
    PresupuestoID BIGINT NOT NULL AUTO_INCREMENT,
    ProyectoID BIGINT NOT NULL,

    NombrePresupuesto VARCHAR(200),
    Version VARCHAR(20),
    TotalPresupuesto DECIMAL(18,2),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (PresupuestoID),

    CONSTRAINT FK_CF_Presupuesto_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID)
) ENGINE=InnoDB;

CREATE TABLE CF_PresupuestoDetalle
(
    PresupuestoDetalleID BIGINT NOT NULL AUTO_INCREMENT,
    PresupuestoID BIGINT NOT NULL,

    Concepto VARCHAR(250),
    Cantidad DECIMAL(18,4),
    PrecioUnitario DECIMAL(18,4),
    Importe DECIMAL(18,2),

    PRIMARY KEY (PresupuestoDetalleID),

    CONSTRAINT FK_CF_PresupuestoDetalle_Presupuesto
        FOREIGN KEY (PresupuestoID)
        REFERENCES CF_Presupuesto(PresupuestoID)
) ENGINE=InnoDB;

CREATE TABLE CF_Costo
(
    CostoID BIGINT NOT NULL AUTO_INCREMENT,

    ProyectoID BIGINT NOT NULL,
    ActividadID BIGINT NULL,
    CategoriaCostoID BIGINT NOT NULL,
    ProveedorID BIGINT NULL,

    FechaCosto DATE,
    Concepto VARCHAR(250),

    Importe DECIMAL(18,2) NOT NULL,

    Observaciones TEXT,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (CostoID),

    CONSTRAINT FK_CF_Costo_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_Costo_Actividad
        FOREIGN KEY (ActividadID)
        REFERENCES CF_Actividad(ActividadID),

    CONSTRAINT FK_CF_Costo_Categoria
        FOREIGN KEY (CategoriaCostoID)
        REFERENCES CF_CategoriaCosto(CategoriaCostoID),

    CONSTRAINT FK_CF_Costo_Proveedor
        FOREIGN KEY (ProveedorID)
        REFERENCES CF_Proveedor(ProveedorID)
) ENGINE=InnoDB;

INSERT INTO CF_CategoriaCosto (Codigo,Nombre) VALUES
('MAT','Materiales'),
('MO','Mano de Obra'),
('EQ','Equipo'),
('SUB','Subcontrato'),
('ADM','Administración'),
('LOG','Logística');

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('FAC_PEND','Factura Pendiente','PENDIENTE','FACTURACION'),
('FAC_PAG','Factura Pagada','PAGADA','FACTURACION'),
('FAC_VENC','Factura Vencida','VENCIDA','FACTURACION');
