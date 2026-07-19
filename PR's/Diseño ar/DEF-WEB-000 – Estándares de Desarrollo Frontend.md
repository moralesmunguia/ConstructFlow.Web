# DEF-WEB-000 -- Estándares de Desarrollo Frontend

  Proyecto    ConstructFlow.Web
  ----------- -----------------------------------
  Documento   DEF-WEB-000
  Nombre      Estándares de Desarrollo Frontend
  Versión     1.1
  Fecha       Julio 2026
  Autor       ConstructFlow Development Team
  Estado      Aprobado

## 1. Objetivo

Definir los estándares oficiales de arquitectura, organización de
carpetas, desarrollo, diseño visual y buenas prácticas para
ConstructFlow.Web.

Este documento sustituye la estructura inicial propuesta y se adecua a
la arquitectura MVC real implementada en el proyecto.

## 2. Alcance

Aplica a todos los módulos presentes y futuros del sistema.

## 3. Arquitectura General

``` text
ConstructFlow.Web/
├── app/
│   ├── controllers/
│   ├── Core/
│   ├── Helpers/
│   ├── middleware/
│   ├── models/
│   ├── Repositories/
│   ├── Services/
│   ├── Validators/
│   └── views/
│       ├── auth/
│       ├── dashboard/
│       ├── layouts/
│       ├── components/
│       ├── clientes/
│       ├── cotizaciones/
│       ├── proyectos/
│       └── ...
├── config/
├── public/
│   ├── css/
│   ├── js/
│   ├── img/
│   ├── fonts/
│   └── index.php
├── routes/
├── storage/
├── vendor/
└── PR's/
```

## 4. Filosofía de Desarrollo

-   Arquitectura MVC.
-   Modular.
-   Escalable.
-   Reutilizable.
-   Responsive.
-   Seguridad por capas.
-   Separación de responsabilidades.

No se permitirá lógica de negocio dentro de las vistas.

## 5. Capas

-   Controllers: reciben solicitudes HTTP y coordinan la ejecución.
-   Services: implementan reglas de negocio.
-   Repositories: acceso a datos.
-   Models: entidades del dominio.
-   Validators: validaciones de entrada.
-   Helpers: funciones reutilizables.
-   Middleware: autenticación, autorización y filtros.
-   Views: presentación.

## 6. Organización de Vistas

``` text
views/
├── layouts/
│   ├── app.php
│   └── auth.php
├── components/
│   ├── navbar.php
│   ├── sidebar.php
│   ├── footer.php
│   └── breadcrumb.php
├── auth/
├── dashboard/
├── clientes/
├── cotizaciones/
├── proyectos/
└── ...
```

## 7. Recursos Públicos

``` text
public/
├── css/
│   ├── variables.css
│   ├── constructflow.css
│   ├── layout.css
│   ├── login.css
│   ├── forms.css
│   ├── datatable.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── login.js
│   ├── menu.js
│   ├── dashboard.js
│   ├── helpers.js
│   └── datatable.js
├── img/
└── fonts/
```

## 8. Tecnologías

-   PHP 8.2+
-   HTML5
-   CSS3
-   JavaScript ES6
-   Bootstrap 5.3
-   Bootstrap Icons
-   Axios
-   SweetAlert2
-   DataTables
-   Chart.js
-   Select2

## 9. Convenciones

-   PHP: PascalCase para clases.
-   Métodos: camelCase.
-   Variables CSS: prefijo `--cf-`.
-   CSS: kebab-case.
-   JavaScript: camelCase.

## 10. Diseño Visual

Inspiración: Microsoft Dynamics 365, Oracle NetSuite, Odoo y Monday.com.

Paleta:

-   Azul: #0B1F47
-   Naranja: #F97316
-   Verde: #10B981
-   Amarillo: #F59E0B
-   Rojo: #EF4444
-   Gris: #F5F7FA

Tipografía: Inter y Poppins.

## 11. Layout

Todas las pantallas privadas utilizarán `views/layouts/app.php`.

Las pantallas públicas (login, recuperación de contraseña, activación de
cuenta) utilizarán `views/layouts/auth.php`.

Los elementos comunes deberán implementarse como componentes
reutilizables.

## 12. Seguridad

-   JWT administrado por el frontend.
-   Nunca almacenar contraseñas.
-   Sanitización de entradas.
-   Protección CSRF cuando aplique.

## 13. Integración API

Respuesta estándar:

``` json
{
  "success": true,
  "message": "",
  "data": {}
}
```

## 14. Calidad

-   Responsive.
-   Accesibilidad WCAG 2.1 AA.
-   Sin estilos inline.
-   Código documentado.
-   PSR-12 para PHP.
-   JavaScript ES6+.

## 15. Versionamiento

Todo cambio funcional o visual deberá documentarse mediante un documento
DEF-WEB.

## 16. Roadmap

Portal de Acceso, Layout Maestro, Dashboard, Clientes, Contactos,
Cotizaciones, Proyectos, Planeación, Actividades, Evidencias,
Presupuestos, Costos, Compras, Inventario, Facturación, Cobranza,
Reportes y Configuración.

## Historial

  -----------------------------------------------------------------------
  Versión               Fecha              Descripción
  --------------------- ------------------ ------------------------------
  1.0                   Julio 2026         Primera versión

  1.1                   Julio 2026         Adecuación a la arquitectura
                                           MVC real de ConstructFlow.Web
  -----------------------------------------------------------------------
