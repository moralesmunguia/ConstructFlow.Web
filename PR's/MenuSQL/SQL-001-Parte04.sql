/*******************************************************************************************
 SQL-001-Parte04.sql
 ConstructFlow ERP
 Sección: CF_PermisosMatriz
 Generación de permisos base CRUD + especiales
********************************************************************************************/

SET @Usuario='SYSTEM';

/* Permisos estándar */
INSERT INTO CF_PermisosMatriz(Codigo,Nombre)
SELECT 'CONSULTAR','Consultar'
WHERE NOT EXISTS(SELECT 1 FROM CF_PermisosMatriz WHERE Codigo='CONSULTAR');

INSERT INTO CF_PermisosMatriz(Codigo,Nombre)
SELECT 'INSERTAR','Insertar'
WHERE NOT EXISTS(SELECT 1 FROM CF_PermisosMatriz WHERE Codigo='INSERTAR');

INSERT INTO CF_PermisosMatriz(Codigo,Nombre)
SELECT 'ACTUALIZAR','Actualizar'
WHERE NOT EXISTS(SELECT 1 FROM CF_PermisosMatriz WHERE Codigo='ACTUALIZAR');

INSERT INTO CF_PermisosMatriz(Codigo,Nombre)
SELECT 'ELIMINAR','Eliminar'
WHERE NOT EXISTS(SELECT 1 FROM CF_PermisosMatriz WHERE Codigo='ELIMINAR');

/* Permisos de negocio */
INSERT INTO CF_PermisosMatriz(Codigo,Nombre)
SELECT x.Codigo,x.Nombre
FROM (
SELECT 'CAMBIAR_ESTADO' Codigo,'Cambiar Estado' Nombre
UNION ALL SELECT 'APROBAR','Aprobar'
UNION ALL SELECT 'RECHAZAR','Rechazar'
UNION ALL SELECT 'CANCELAR','Cancelar'
UNION ALL SELECT 'RESTAURAR','Restaurar'
UNION ALL SELECT 'EXPORTAR','Exportar'
UNION ALL SELECT 'IMPORTAR','Importar'
UNION ALL SELECT 'IMPRIMIR','Imprimir'
UNION ALL SELECT 'DESCARGAR','Descargar'
UNION ALL SELECT 'SUBIR_ARCHIVO','Subir Archivo'
UNION ALL SELECT 'GENERAR_PDF','Generar PDF'
UNION ALL SELECT 'GENERAR_XML','Generar XML'
UNION ALL SELECT 'ENVIAR_CORREO','Enviar Correo'
UNION ALL SELECT 'CONVERTIR_PROYECTO','Convertir a Proyecto'
UNION ALL SELECT 'ASIGNAR_RESPONSABLE','Asignar Responsable'
UNION ALL SELECT 'REGISTRAR_AVANCE','Registrar Avance'
UNION ALL SELECT 'CERRAR_PROYECTO','Cerrar Proyecto'
UNION ALL SELECT 'REABRIR_PROYECTO','Reabrir Proyecto'
UNION ALL SELECT 'VER_COSTOS','Ver Costos'
UNION ALL SELECT 'VER_RENTABILIDAD','Ver Rentabilidad'
UNION ALL SELECT 'ADMINISTRAR_SEGURIDAD','Administrar Seguridad'
UNION ALL SELECT 'CONFIGURAR_EMPRESA','Configurar Empresa'
) x
WHERE NOT EXISTS(
SELECT 1 FROM CF_PermisosMatriz p
WHERE p.Codigo=x.Codigo
);

/*******************************************************************************************
 Consultas de validación
********************************************************************************************/

SELECT * FROM CF_PermisosMatriz ORDER BY Codigo;

/*******************************************************************************************
 Pendiente Parte 05:
 - Relación Menú ↔ Permiso
 - Rol ↔ Permiso
 - sp_GenerarPermisosRol
 - sp_SincronizarPermisos
********************************************************************************************/
