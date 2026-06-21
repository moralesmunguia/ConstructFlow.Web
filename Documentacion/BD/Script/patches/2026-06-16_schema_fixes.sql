USE ConstructFlow;
-- SAFER PATCH IMPLEMENTACIÓN

-- Control: habilitar manualmente para aplicar ON DELETE CASCADE en tablas detalle.
-- Por defecto está en 0 (deshabilitado). Cambia a 1 sólo después de revisar impacto de negocio.
SET @apply_detalle_cascade := 0;

-- 1) Añadir `EmpresaID` como NULL si aún no existe (no forzamos valores por defecto inválidos)
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND COLUMN_NAME = 'EmpresaID'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE CF_Factura ADD COLUMN EmpresaID BIGINT NULL AFTER ClienteID',
  'SELECT "CF_Factura.EmpresaID already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Poblar `EmpresaID` intentando inferir desde Cliente o Proyecto
SET @sql := 'UPDATE CF_Factura f LEFT JOIN CF_Cliente c ON f.ClienteID = c.ClienteID LEFT JOIN CF_Proyecto p ON f.ProyectoID = p.ProyectoID SET f.EmpresaID = COALESCE(c.EmpresaID, p.EmpresaID) WHERE f.EmpresaID IS NULL OR f.EmpresaID = 0';
PREPARE stmt2 FROM @sql; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- 3) Contar filas huérfanas (sin Empresa válida)
SET @orphans := (
  SELECT COUNT(*) FROM CF_Factura f
  LEFT JOIN CF_Empresa e ON f.EmpresaID = e.EmpresaID
  WHERE f.EmpresaID IS NULL OR e.EmpresaID IS NULL
);
SELECT @orphans AS CF_Factura_Orphans;

-- 4) Si no hay huérfanos, hacer NOT NULL (sino, se salta y deja columna NULL para revisión)
SET @sql := IF(@orphans = 0,
  'ALTER TABLE CF_Factura MODIFY EmpresaID BIGINT NOT NULL',
  'SELECT CONCAT("SKIP: CF_Factura has orphan rows=",@orphans)'
);
PREPARE stmt3 FROM @sql; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- 5) Añadir FK a CF_Empresa si no existe y sólo si no hay huérfanos
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND CONSTRAINT_NAME = 'FK_CF_Factura_Empresa'
);
SET @sql := IF(@fk_exists = 0 AND @orphans = 0,
  'ALTER TABLE CF_Factura ADD CONSTRAINT FK_CF_Factura_Empresa FOREIGN KEY (EmpresaID) REFERENCES CF_Empresa(EmpresaID) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT "SKIP_ADD_FK_CF_Factura_Empresa"'
);
PREPARE stmt4 FROM @sql; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

-- 6) Crear índices útiles en CF_Factura si faltan (idempotente)
SET @ix := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND INDEX_NAME = 'IX_CF_Factura_Proyecto');
SET @sql := IF(@ix = 0, 'CREATE INDEX IX_CF_Factura_Proyecto ON CF_Factura(ProyectoID)', 'SELECT "IX_CF_Factura_Proyecto exists"'); PREPARE stmt5 FROM @sql; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

SET @ix := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND INDEX_NAME = 'IX_CF_Factura_Cliente');
SET @sql := IF(@ix = 0, 'CREATE INDEX IX_CF_Factura_Cliente ON CF_Factura(ClienteID)', 'SELECT "IX_CF_Factura_Cliente exists"'); PREPARE stmt6 FROM @sql; EXECUTE stmt6; DEALLOCATE PREPARE stmt6;

SET @ix := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND INDEX_NAME = 'IX_CF_Factura_Estado');
SET @sql := IF(@ix = 0, 'CREATE INDEX IX_CF_Factura_Estado ON CF_Factura(Estado)', 'SELECT "IX_CF_Factura_Estado exists"'); PREPARE stmt7 FROM @sql; EXECUTE stmt7; DEALLOCATE PREPARE stmt7;

SET @ix := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND INDEX_NAME = 'IX_CF_Factura_FechaFactura');
SET @sql := IF(@ix = 0, 'CREATE INDEX IX_CF_Factura_FechaFactura ON CF_Factura(FechaFactura)', 'SELECT "IX_CF_Factura_FechaFactura exists"'); PREPARE stmt8 FROM @sql; EXECUTE stmt8; DEALLOCATE PREPARE stmt8;

SET @ix := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_Factura' AND INDEX_NAME = 'IX_CF_Factura_Saldo');
SET @sql := IF(@ix = 0, 'CREATE INDEX IX_CF_Factura_Saldo ON CF_Factura(Saldo)', 'SELECT "IX_CF_Factura_Saldo exists"'); PREPARE stmt9 FROM @sql; EXECUTE stmt9; DEALLOCATE PREPARE stmt9;

-- 7) Cambios opcionales: activar cascada en tablas detalle (controlado por @apply_detalle_cascade)
--    Riesgo: ON DELETE CASCADE borrará datos hijos al eliminar padres; validar con procesos de negocio.

-- CF_CotizacionDetalle: reemplazar FK por ON DELETE CASCADE si se solicita
SET @fk_cd_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_CotizacionDetalle' AND CONSTRAINT_NAME = 'FK_CF_CotizacionDetalle_Cotizacion'
);
SET @sql := IF(@apply_detalle_cascade = 1 AND @fk_cd_exists > 0,
  'ALTER TABLE CF_CotizacionDetalle DROP FOREIGN KEY FK_CF_CotizacionDetalle_Cotizacion',
  'SELECT "SKIP_DROP_FK_CF_CotizacionDetalle_Cotizacion"'
);
PREPARE stmt10 FROM @sql; EXECUTE stmt10; DEALLOCATE PREPARE stmt10;

SET @fk_cd_exists2 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_CotizacionDetalle' AND CONSTRAINT_NAME = 'FK_CF_CotizacionDetalle_Cotizacion'
);
SET @sql := IF(@apply_detalle_cascade = 1 AND @fk_cd_exists2 = 0,
  'ALTER TABLE CF_CotizacionDetalle ADD CONSTRAINT FK_CF_CotizacionDetalle_Cotizacion FOREIGN KEY (CotizacionID) REFERENCES CF_Cotizacion(CotizacionID) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "SKIP_ADD_FK_CF_CotizacionDetalle_Cotizacion"'
);
PREPARE stmt11 FROM @sql; EXECUTE stmt11; DEALLOCATE PREPARE stmt11;

-- CF_PresupuestoDetalle: reemplazar FK por ON DELETE CASCADE si se solicita
SET @fk_pd_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_PresupuestoDetalle' AND CONSTRAINT_NAME = 'FK_CF_PresupuestoDetalle_Presupuesto'
);
SET @sql := IF(@apply_detalle_cascade = 1 AND @fk_pd_exists > 0,
  'ALTER TABLE CF_PresupuestoDetalle DROP FOREIGN KEY FK_CF_PresupuestoDetalle_Presupuesto',
  'SELECT "SKIP_DROP_FK_CF_PresupuestoDetalle_Presupuesto"'
);
PREPARE stmt12 FROM @sql; EXECUTE stmt12; DEALLOCATE PREPARE stmt12;

SET @fk_pd_exists2 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CF_PresupuestoDetalle' AND CONSTRAINT_NAME = 'FK_CF_PresupuestoDetalle_Presupuesto'
);
SET @sql := IF(@apply_detalle_cascade = 1 AND @fk_pd_exists2 = 0,
  'ALTER TABLE CF_PresupuestoDetalle ADD CONSTRAINT FK_CF_PresupuestoDetalle_Presupuesto FOREIGN KEY (PresupuestoID) REFERENCES CF_Presupuesto(PresupuestoID) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "SKIP_ADD_FK_CF_PresupuestoDetalle_Presupuesto"'
);
PREPARE stmt13 FROM @sql; EXECUTE stmt13; DEALLOCATE PREPARE stmt13;

-- Fin del parche seguro
SELECT 'Patch finished (check CF_Factura_Orphans and cascade flag)' AS PatchStatus;
