
-- =====================================================
-- CONSTRUCTFLOW V1.0
-- BDD-05-05 EVIDENCIAS Y DOCUMENTOS
-- MySQL 8.0
-- Dependencias:
--   BDD-05-01 Core Foundation
--   BDD-05-03 Proyectos
--   BDD-05-04 Actividades y Gantt
-- =====================================================

USE ConstructFlow;

CREATE TABLE CF_Archivo
(
    ArchivoID BIGINT NOT NULL AUTO_INCREMENT,

    NombreOriginal VARCHAR(500) NOT NULL,
    NombreFisico VARCHAR(500) NOT NULL,
    Extension VARCHAR(20),
    MimeType VARCHAR(150),

    RutaArchivo VARCHAR(1000),
    StorageProvider VARCHAR(30) DEFAULT 'LOCAL',
    BucketName VARCHAR(200),

    TamanoBytes BIGINT DEFAULT 0,
    HashSHA256 VARCHAR(100),

    UsuarioID BIGINT NULL,
    FechaCarga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (ArchivoID),

    KEY IX_CF_Archivo_FechaCarga (FechaCarga),
    KEY IX_CF_Archivo_Hash (HashSHA256),

    CONSTRAINT FK_CF_Archivo_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_TipoDocumento
(
    TipoDocumentoID BIGINT NOT NULL AUTO_INCREMENT,

    Codigo VARCHAR(50) NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    Descripcion VARCHAR(500),

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (TipoDocumentoID),

    UNIQUE KEY UX_CF_TipoDocumento_Codigo (Codigo)
) ENGINE=InnoDB;

CREATE TABLE CF_Documento
(
    DocumentoID BIGINT NOT NULL AUTO_INCREMENT,

    ProyectoID BIGINT NOT NULL,
    TipoDocumentoID BIGINT NOT NULL,

    CodigoDocumento VARCHAR(100),
    NombreDocumento VARCHAR(250) NOT NULL,

    VersionActual VARCHAR(20) DEFAULT '1.0',
    Estado VARCHAR(30) DEFAULT 'BORRADOR',

    Descripcion TEXT,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (DocumentoID),

    KEY IX_CF_Documento_Proyecto (ProyectoID),
    KEY IX_CF_Documento_Tipo (TipoDocumentoID),

    CONSTRAINT FK_CF_Documento_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_Documento_Tipo
        FOREIGN KEY (TipoDocumentoID)
        REFERENCES CF_TipoDocumento(TipoDocumentoID)
) ENGINE=InnoDB;

CREATE TABLE CF_DocumentoVersion
(
    DocumentoVersionID BIGINT NOT NULL AUTO_INCREMENT,

    DocumentoID BIGINT NOT NULL,
    ArchivoID BIGINT NOT NULL,

    Version VARCHAR(20) NOT NULL,
    Comentarios TEXT,

    UsuarioID BIGINT NULL,
    FechaVersion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (DocumentoVersionID),

    KEY IX_CF_DocumentoVersion_Documento (DocumentoID),

    CONSTRAINT FK_CF_DocumentoVersion_Documento
        FOREIGN KEY (DocumentoID)
        REFERENCES CF_Documento(DocumentoID),

    CONSTRAINT FK_CF_DocumentoVersion_Archivo
        FOREIGN KEY (ArchivoID)
        REFERENCES CF_Archivo(ArchivoID),

    CONSTRAINT FK_CF_DocumentoVersion_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_Evidencia
(
    EvidenciaID BIGINT NOT NULL AUTO_INCREMENT,

    ProyectoID BIGINT NOT NULL,
    ActividadID BIGINT NULL,
    ArchivoID BIGINT NOT NULL,

    TipoEvidencia VARCHAR(30),
    Titulo VARCHAR(250),
    Descripcion TEXT,

    Latitud DECIMAL(12,8) NULL,
    Longitud DECIMAL(12,8) NULL,

    FechaCaptura DATETIME,
    UsuarioID BIGINT NOT NULL,

    CreatedUserID INT(11) NOT NULL DEFAULT 0,
    ModifiedUserID INT(11) DEFAULT 0,
    CreatedBy VARCHAR(100) NOT NULL DEFAULT '',
    ModifiedBy VARCHAR(100) NOT NULL DEFAULT '',
    CreateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT NULL,
    IsActive BIT(1) NOT NULL DEFAULT b'1',
    RowVersion BIGINT NOT NULL DEFAULT 1,

    PRIMARY KEY (EvidenciaID),

    KEY IX_CF_Evidencia_Proyecto (ProyectoID),
    KEY IX_CF_Evidencia_Actividad (ActividadID),

    CONSTRAINT FK_CF_Evidencia_Proyecto
        FOREIGN KEY (ProyectoID)
        REFERENCES CF_Proyecto(ProyectoID),

    CONSTRAINT FK_CF_Evidencia_Actividad
        FOREIGN KEY (ActividadID)
        REFERENCES CF_Actividad(ActividadID),

    CONSTRAINT FK_CF_Evidencia_Archivo
        FOREIGN KEY (ArchivoID)
        REFERENCES CF_Archivo(ArchivoID),

    CONSTRAINT FK_CF_Evidencia_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

CREATE TABLE CF_EvidenciaComentario
(
    EvidenciaComentarioID BIGINT NOT NULL AUTO_INCREMENT,

    EvidenciaID BIGINT NOT NULL,
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

    PRIMARY KEY (EvidenciaComentarioID),

    KEY IX_CF_EvidenciaComentario_Evidencia (EvidenciaID),

    CONSTRAINT FK_CF_EvidenciaComentario_Evidencia
        FOREIGN KEY (EvidenciaID)
        REFERENCES CF_Evidencia(EvidenciaID),

    CONSTRAINT FK_CF_EvidenciaComentario_Usuario
        FOREIGN KEY (UsuarioID)
        REFERENCES CF_Usuario(UsuarioID)
) ENGINE=InnoDB;

INSERT INTO CF_TipoDocumento (Codigo, Nombre, Descripcion) VALUES
('CONTRATO','Contrato','Contratos del proyecto'),
('PLANO','Plano','Planos constructivos'),
('ESTIMACION','Estimación','Estimaciones de avance'),
('ACTA','Acta','Actas de reunión'),
('MANUAL','Manual','Manuales y procedimientos'),
('ANEXO','Anexo','Documentación complementaria'),
('PERMISO','Permiso','Permisos y licencias'),
('MEMORIA','Memoria','Memorias técnicas');
