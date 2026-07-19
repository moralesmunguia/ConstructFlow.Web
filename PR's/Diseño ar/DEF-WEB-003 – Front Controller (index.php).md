# DEF-WEB-003 -- Front Controller (index.php)

  Proyecto     ConstructFlow
  ------------ --------------------------
  Módulo       Arquitectura Base
  Componente   Front Controller
  Archivo      index.php
  Tipo         Definición Funcional
  Prioridad    Alta
  Versión      1.0
  Estatus      Aprobado para Desarrollo

------------------------------------------------------------------------

# 1. Objetivo

Definir el funcionamiento del archivo **index.php**, el cual será el
único punto de entrada de ConstructFlow.Web.

Su responsabilidad será inicializar la aplicación, validar la
autenticación del usuario y controlar el acceso al sistema mediante la
generación dinámica del menú de acuerdo con los permisos asignados al
usuario.

# 2. Alcance

Aplica a todos los accesos mediante:

`http://localhost:8081/ConstructFlow.web/`

Todo usuario deberá ingresar por esta dirección.

# 3. Objetivos Funcionales

-   Inicializar la sesión.
-   Validar autenticación.
-   Redireccionar al Login cuando no exista sesión.
-   Obtener información del usuario.
-   Consultar roles y permisos.
-   Generar el menú dinámico.
-   Cargar el Dashboard.

# 4. Flujo General

``` text
Usuario
   │
   ▼
http://localhost:8081/ConstructFlow.web/
   │
   ▼
index.php
   │
   ▼
Inicializar Sesión
   │
   ▼
¿Existe Usuario?
   │
 ┌─┴──────────────┐
 │                │
NO               SI
 │                │
 ▼                ▼
Login      Obtener Usuario
                 │
                 ▼
       Consultar Roles
                 │
                 ▼
     Consultar Permisos
                 │
                 ▼
     Generar Menú Dinámico
                 │
                 ▼
        Cargar Dashboard
                 │
                 ▼
       Ingreso al Sistema
```

# 5. Reglas de Negocio

-   Todo acceso inicia desde **index.php**.
-   Sin sesión activa se redirecciona al Login.
-   El menú se construye con los permisos del usuario.
-   El usuario únicamente visualizará las opciones autorizadas.
-   La información de sesión permanecerá disponible durante toda la
    navegación.

# 6. Información Recuperada

-   UsuarioID
-   EmpresaID
-   Nombre
-   Perfil
-   Roles
-   Permisos
-   Menú
-   Token
-   Fecha de Inicio de Sesión

# 7. Flujo Funcional

``` text
Inicio
↓
Inicializar Sesión
↓
¿Existe Usuario?
↓
NO
↓
Redireccionar Login
↓
Fin
↓
SI
↓
Obtener Información del Usuario
↓
Consultar Roles
↓
Consultar Permisos
↓
Generar Menú Dinámico
↓
Guardar Información en Sesión
↓
Cargar Dashboard
↓
Ingreso al Sistema
```

# 8. Criterios de Aceptación

-   El acceso siempre inicia desde **index.php**.
-   Sin autenticación se redirecciona al Login.
-   Se recuperan roles y permisos.
-   El menú se genera dinámicamente.
-   El Dashboard se muestra únicamente a usuarios autenticados.
