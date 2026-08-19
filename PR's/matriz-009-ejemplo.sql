-- MATRIZ-009 ejemplo de datos para pruebas
-- Ajusta nombres/columnas según tu esquema si es necesario

-- Crear proyecto y cotización de ejemplo
INSERT INTO CF_Proyecto (ProyectoID, EmpresaID, Nombre, CostoReal, PresupuestoActual)
VALUES (9001, 1, 'Proyecto Prueba MATRIZ009', 0, 0);

INSERT INTO CF_Cotizacion (CotizacionID, ProyectoID, EmpresaID, CostoEstimado, TotalVenta, EstadoCotizacionID)
VALUES (9001, 9001, 1, 200000.00, 300000.00, 1);

-- Crear presupuesto operativo activo
INSERT INTO cf_presupuesto (PresupuestoID, ProyectoID, EmpresaID, TotalPresupuesto, Activo)
VALUES (9001, 9001, 1, 0.00, 1);

-- Insertar detalles presupuestarios iniciales (estimados por categoría opcional)
INSERT INTO cf_presupuestodetalle (PresupuestoDetalleID, PresupuestoID, CategoriaCostoID, Importe, Activo)
VALUES (90011, 9001, 1, 100000.00, 1), -- MAT
       (90012, 9001, 2, 60000.00, 1),  -- MO
       (90013, 9001, 3, 40000.00, 1);  -- EQ

-- Insertar costos reales de ejemplo (podrías también usar las APIs)
INSERT INTO cf_costo (CostoID, ProyectoID, CategoriaCostoID, Importe, FechaCosto, CreatedUserID, CreatedBy, Activo)
VALUES (900101, 9001, 1, 80000.00, NOW(), 1, 'qa', 1),
       (900102, 9001, 2, 60000.00, NOW(), 1, 'qa', 1),
       (900103, 9001, 3, 20000.00, NOW(), 1, 'qa', 1);

-- Actualizar agregados del proyecto para pruebas
UPDATE CF_Proyecto SET CostoReal = 160000.00 WHERE ProyectoID = 9001;
UPDATE cf_presupuesto SET TotalPresupuesto = 200000.00 WHERE PresupuestoID = 9001;

-- Consultas de verificación
SELECT * FROM CF_Cotizacion WHERE CotizacionID = 9001;
SELECT * FROM cf_costo WHERE ProyectoID = 9001;
SELECT * FROM cf_presupuestodetalle WHERE PresupuestoID = 9001;
SELECT * FROM cf_presupuesto WHERE PresupuestoID = 9001;
SELECT CostoReal, PresupuestoActual FROM CF_Proyecto WHERE ProyectoID = 9001;
