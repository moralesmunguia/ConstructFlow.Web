INSERT INTO CF_Empresa (NombreEmpresa,RFC,Correo)
SELECT 'ROM Constructora','XAXX010101000','admin@constructflow.mx'
WHERE NOT EXISTS (SELECT 1 FROM CF_Empresa WHERE RFC='XAXX010101000');
