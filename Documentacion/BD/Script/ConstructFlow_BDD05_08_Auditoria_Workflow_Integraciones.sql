
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-08 AUDITORIA, WORKFLOW E INTEGRACIONES
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Auditoria
(
    AuditoriaID BIGINT NOT NULL AUTO_INCREMENT,
    EmpresaID BIGINT NOT NULL,
    UsuarioID BIGINT NULL,

    Modulo VARCHAR(100) NOT NULL,
    Entidad VARCHAR(100) NOT NULL,
    EntidadID BIGINT NULL,

    Accion VARCHAR(50) NOT NULL,

    IP VARCHAR(50),
    UserAgent VARCHAR(500),

    FechaHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (AuditoriaID),

    KEY IX_CF_Auditoria_Empresa (EmpresaID),
    KEY IX_CF_Auditoria_Usuario (UsuarioID),
    KEY IX_CF_Auditoria_Fecha (FechaHora),

    CONSTRAINT FK_CF_Auditoria_Empresa
        FOREIGN KEY (EmpresaID)
        REFERENCES CF_Empresa(EmpresaID),

    CONSTRAINT FK_CF_Auditoria_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_AuditoriaDetalle
(
    AuditoriaDetalleID BIGINT NOT NULL AUTO_INCREMENT,

    AuditoriaID BIGINT NOT NULL,

    Campo VARCHAR(100) NOT NULL,
    ValorAnterior TEXT,
    ValorNuevo TEXT,

    PRIMARY KEY (AuditoriaDetalleID),

    KEY IX_CF_AuditoriaDetalle_Auditoria (AuditoriaID),

    CONSTRAINT FK_CF_AuditoriaDetalle_Auditoria
        FOREIGN KEY (AuditoriaID)
        REFERENCES CF_Auditoria(AuditoriaID)
) ENGINE=InnoDB;

CREATE TABLE CF_FlujoAprobacion
(
    FlujoAprobacionID BIGINT NOT NULL AUTO_INCREMENT,

    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Modulo VARCHAR(100) NOT NULL,

    Activo BIT(1) NOT NULL DEFAULT b'1',

    PRIMARY KEY (FlujoAprobacionID),

    UNIQUE KEY UX_CF_FlujoAprobacion_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_FlujoPaso
(
    FlujoPasoID BIGINT NOT NULL AUTO_INCREMENT,

    FlujoAprobacionID BIGINT NOT NULL,

    NumeroPaso INT NOT NULL,
    NombrePaso VARCHAR(150) NOT NULL,

    RolID BIGINT NOT NULL,

    Obligatorio BIT(1) DEFAULT b'1',

    PRIMARY KEY (FlujoPasoID),

    CONSTRAINT FK_CF_FlujoPaso_Flujo
        FOREIGN KEY (FlujoAprobacionID)
        REFERENCES CF_FlujoAprobacion(FlujoAprobacionID),

    CONSTRAINT FK_CF_FlujoPaso_Rol
        FOREIGN KEY (RolID)
        REFERENCES CF_Rol(RolID)
) ENGINE=InnoDB;

CREATE TABLE CF_FlujoHistorial
(
    FlujoHistorialID BIGINT NOT NULL AUTO_INCREMENT,

    FlujoAprobacionID BIGINT NOT NULL,

    Entidad VARCHAR(100) NOT NULL,
    EntidadID BIGINT NOT NULL,

    UsuarioID BIGINT NOT NULL,

    Resultado VARCHAR(30),
    Comentarios TEXT,

    FechaAccion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (FlujoHistorialID),

    CONSTRAINT FK_CF_FlujoHistorial_Flujo
        FOREIGN KEY (FlujoAprobacionID)
        REFERENCES CF_FlujoAprobacion(FlujoAprobacionID),

    CONSTRAINT FK_CF_FlujoHistorial_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_Integracion
(
    IntegracionID BIGINT NOT NULL AUTO_INCREMENT,

    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,

    TipoIntegracion VARCHAR(50),
    URLBase VARCHAR(500),

    Activa BIT(1) DEFAULT b'1',

    PRIMARY KEY (IntegracionID),

    UNIQUE KEY UX_CF_Integracion_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_IntegracionLog
(
    IntegracionLogID BIGINT NOT NULL AUTO_INCREMENT,

    IntegracionID BIGINT NOT NULL,

    FechaProceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    Resultado VARCHAR(30),

    RequestJSON LONGTEXT,
    ResponseJSON LONGTEXT,

    PRIMARY KEY (IntegracionLogID),

    CONSTRAINT FK_CF_IntegracionLog_Integracion
        FOREIGN KEY (IntegracionID)
        REFERENCES CF_Integracion(IntegracionID)
) ENGINE=InnoDB;

CREATE TABLE CF_Webhook
(
    WebhookID BIGINT NOT NULL AUTO_INCREMENT,

    Evento VARCHAR(100) NOT NULL,
    URLDestino VARCHAR(500) NOT NULL,
    MetodoHTTP VARCHAR(20) DEFAULT 'POST',

    Activo BIT(1) DEFAULT b'1',

    PRIMARY KEY (WebhookID)
) ENGINE=InnoDB;

CREATE TABLE CF_BitacoraSistema
(
    BitacoraSistemaID BIGINT NOT NULL AUTO_INCREMENT,

    TipoEvento VARCHAR(100),
    Severidad VARCHAR(20),

    Descripcion TEXT,

    FechaEvento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (BitacoraSistemaID)
) ENGINE=InnoDB;

CREATE TABLE CF_JobProgramado
(
    JobProgramadoID BIGINT NOT NULL AUTO_INCREMENT,

    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,

    ExpresionCron VARCHAR(100),

    Activo BIT(1) DEFAULT b'1',

    UltimaEjecucion DATETIME NULL,

    PRIMARY KEY (JobProgramadoID),

    UNIQUE KEY UX_CF_JobProgramado_Codigo (Codigo)
) ENGINE=InnoDB;

INSERT INTO CF_FlujoAprobacion (Codigo,Nombre,Modulo) VALUES
('COTIZACION','Aprobación de Cotizaciones','COTIZACIONES'),
('PRESUPUESTO','Aprobación de Presupuestos','PRESUPUESTOS'),
('FACTURA','Aprobación de Facturas','FACTURACION'),
('DOCUMENTO','Aprobación de Documentos','DOCUMENTOS');

INSERT INTO CF_Integracion (Codigo,Nombre,TipoIntegracion) VALUES
('SAT','Servicio SAT','REST'),
('POWERBI','Power BI','REST'),
('SMTP','Correo SMTP','SMTP'),
('WHATSAPP','WhatsApp Business','REST');

INSERT INTO CF_Parametro (Codigo,Nombre,Valor,Categoria) VALUES
('AUD_INSERT','Insert','INSERT','AUDITORIA'),
('AUD_UPDATE','Update','UPDATE','AUDITORIA'),
('AUD_DELETE','Delete','DELETE','AUDITORIA'),
('AUD_LOGIN','Login','LOGIN','AUDITORIA');
