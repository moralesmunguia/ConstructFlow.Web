-- SQL-001 – Datos Maestros del Menú
INSERT INTO cf_modulos(Codigo,Nombre,CreatedUserID,CreatedBy)
SELECT 'seguridad','Seguridad',0,'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM cf_modulos WHERE Codigo='seguridad');

-- Crear menú Seguridad (ajustar MenuPadreID de hijos después de obtener MenuID)
