# DEF-WEB-001 -- API Autenticación

  Campo       Valor
  ----------- --------------------------
  Proyecto    ConstructFlow.Api
  Documento   DEF-WEB-001
  Versión     1.0
  Estado      Aprobado para Desarrollo

------------------------------------------------------------------------

# 1. Objetivo

Documentar la API responsable de autenticar usuarios y emitir el token
JWT utilizado por ConstructFlow.

# 2. Alcance

Aplica al endpoint de autenticación y al proceso de inicio de sesión del
ERP.

# 3. Endpoint

``` text
POST /api/v1/auth/login
```

# 4. Flujo Funcional

``` text
Usuario
   │
   ▼
Captura Credenciales
   │
   ▼
POST /api/v1/auth/login
   │
   ▼
Validar Usuario
   │
   ▼
Validar Contraseña
   │
   ▼
Generar JWT
   │
   ▼
Regresar Token
```

# 5. Request

``` json
{
  "usuario":"admin",
  "password":"********"
}
```

# 6. Response

``` json
{
  "success": true,
  "message": "",
  "data": {
    "token": "JWT",
    "usuario": {},
    "empresa": {},
    "permisos": []
  }
}
```

# 7. Reglas de Negocio

-   Validar usuario activo.
-   Validar empresa activa.
-   Generar JWT.
-   Registrar sesión.

# 8. Seguridad

-   JWT Bearer.
-   EmpresaID y UsuarioID obtenidos del token.

# 9. Casos de Prueba

-   Login correcto.
-   Contraseña incorrecta.
-   Usuario inexistente.
-   Usuario inactivo.

# Historial

  Versión   Descripción
  --------- -------------------
  1.0       Documento inicial
