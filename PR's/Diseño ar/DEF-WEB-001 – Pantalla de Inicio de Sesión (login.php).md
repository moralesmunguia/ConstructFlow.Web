# DEF-WEB-001 – Pantalla de Inicio de Sesión (login.php)

| Proyecto | ConstructFlow.Web |
|-----------|-------------------|
| Documento | DEF-WEB-001 |
| Nombre | Pantalla de Inicio de Sesión |
| Versión | 1.0 |
| Fecha | Julio 2026 |
| Autor | ConstructFlow Development Team |
| Estado | En desarrollo |

---

# 1. Objetivo

Diseñar e implementar la pantalla de autenticación principal de ConstructFlow.Web.

Esta pantalla será el punto de entrada para todos los usuarios del ERP y deberá transmitir una imagen moderna, profesional y corporativa, manteniendo consistencia con la identidad visual de ConstructFlow.

La autenticación será mediante JWT consumiendo los servicios REST de ConstructFlow.Api.

---

# 2. Alcance

Incluye:

- Inicio de sesión.
- Validación de credenciales.
- Recordar usuario.
- Recuperación de contraseña.
- Acceso al Centro de ayuda.
- Acceso a Soporte.
- Preparación para múltiples idiomas.

No incluye:

- Registro de usuarios.
- Cambio de contraseña.
- MFA.
- SSO.

---

# 3. Objetivos UX

La pantalla deberá comunicar:

- Profesionalismo.
- Seguridad.
- Tecnología.
- Organización.
- Facilidad de uso.

El usuario deberá poder autenticarse en menos de 15 segundos.

---

# 4. Diseño General

La pantalla estará dividida en dos secciones.

## Panel izquierdo

- Logotipo ConstructFlow.
- Nombre del producto.
- Slogan.
- Imagen principal.
- Beneficios del ERP.

## Panel derecho

- Icono de seguridad.
- Título "Iniciar sesión".
- Bienvenida.
- Usuario o correo electrónico.
- Contraseña.
- Recordarme.
- ¿Olvidaste tu contraseña?
- Botón "Iniciar sesión".
- Centro de ayuda.
- Soporte.

---

# 5. Distribución

## Desktop

Dos paneles (Corporativo + Login).

## Tablet

Panel corporativo reducido y formulario.

## Smartphone

Solo formulario de autenticación.

---

# 6. Imagen de Fondo

Fotografía de una obra con grúa, edificio en construcción y ciudad al amanecer, con overlay azul oscuro.

---

# 7. Identidad Visual

| Elemento | Color |
|----------|--------|
| Azul principal | #0B1F47 |
| Azul oscuro | #08162F |
| Naranja | #F97316 |
| Gris claro | #F5F7FA |
| Blanco | #FFFFFF |

---

# 8. Tipografía

- Inter
- Poppins

---

# 9. Beneficios

- Control total de tus proyectos.
- Información en tiempo real.
- Equipos más productivos.

---

# 10. Formulario

Campos:

- Usuario o correo electrónico.
- Contraseña.
- Recordarme.
- Recuperación de contraseña.

---

# 11. Flujo

Usuario → Validación → API Login → JWT → Dashboard.

---

# 12. API

POST /api/v1/auth/login

Respuesta estándar:

```json
{
  "success": true,
  "message": "",
  "data": {
    "token": "JWT"
  }
}
```

---

# 13. Responsive

- Desktop ≥1400 px
- Laptop 992–1399 px
- Tablet 768–991 px
- Smartphone <768 px

---

# 14. Tecnologías

- PHP 8.2
- Bootstrap 5.3
- Bootstrap Icons
- Axios
- SweetAlert2
- JavaScript ES6
- CSS3

---

# 15. Archivos

```
app/
 └── Views/
      login.php

public/
 └── assets/
      css/login.css
      js/login.js
      img/logo.svg
      img/login-bg.webp
```

---

# 16. Criterios de aceptación

- Diseño responsive.
- Compatible con Chrome, Edge, Firefox y Safari.
- Tiempo de carga menor a 2 segundos.
- Validación cliente y servidor.
- Integración con JWT.
- Cumplimiento de DEF-WEB-000.

---

# 17. Historial

| Versión | Fecha | Descripción |
|---------|--------|-------------|
| 1.0 | Julio 2026 | Creación inicial del documento. |

---

# Aprobación

Este documento define oficialmente el diseño funcional y visual de la pantalla **login.php** para ConstructFlow.Web.
