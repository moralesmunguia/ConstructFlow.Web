DELIMITER $$

CREATE TRIGGER TR_CF_Proyecto_AI
AFTER INSERT ON CF_Proyecto
FOR EACH ROW
BEGIN
    INSERT INTO CF_Auditoria
    (
        EmpresaID,
        UsuarioID,
        Modulo,
        Entidad,
        EntidadID,
        Accion
    )
    VALUES
    (
        NEW.EmpresaID,
        NEW.CreatedUserID,
        'PROYECTOS',
        'CF_Proyecto',
        NEW.ProyectoID,
        'INSERT'
    );
END$$

CREATE TRIGGER TR_CF_Proyecto_AU
AFTER UPDATE ON CF_Proyecto
FOR EACH ROW
BEGIN
    INSERT INTO CF_Auditoria
    (
        EmpresaID,
        UsuarioID,
        Modulo,
        Entidad,
        EntidadID,
        Accion
    )
    VALUES
    (
        NEW.EmpresaID,
        NEW.ModifiedUserID,
        'PROYECTOS',
        'CF_Proyecto',
        NEW.ProyectoID,
        'UPDATE'
    );
END$$

DELIMITER ;
