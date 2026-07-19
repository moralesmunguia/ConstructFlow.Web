# DEF-WEB-000 – Estándares de Desarrollo Frontend

| Proyecto | ConstructFlow.Web |
|-----------|-------------------|
| Documento | DEF-WEB-000 |
| Nombre | Estándares de Desarrollo Frontend |
| Versión | 1.0 |
| Fecha | Julio 2026 |
| Autor | ConstructFlow Development Team |
| Estado | Aprobado |

## 1. Objetivo

Establecer los lineamientos técnicos, funcionales, visuales y de desarrollo que deberán seguir todos los módulos del proyecto ConstructFlow.Web.

Este documento será la referencia oficial para desarrolladores, diseñadores UX/UI y responsables de mantenimiento del sistema.

Todos los desarrollos deberán cumplir obligatoriamente con los estándares aquí definidos.

## 2. Alcance

Aplica para todas las pantallas, componentes reutilizables, formularios, tablas, dashboard, reportes, catálogos, configuración y módulos futuros.

## 3. Arquitectura General

```text
ConstructFlow.Web/
├── app/
│   ├── Controllers/
│   ├── Views/
│   ├── Layouts/
│   ├── Components/
│   └── Helpers/
├── config/
├── public/
│   └── assets/
│       ├── css/
│       ├── js/
│       ├── img/
│       └── fonts/
├── routes/
├── storage/
├── vendor/
└── PR's/
```

## 4. Filosofía de Desarrollo

- Modular
- Escalable
- Reutilizable
- Responsive
- Seguro
- Fácil de mantener

No se permitirá código duplicado.

## 5. Tecnologías

- PHP 8.2+
- HTML5
- CSS3
- JavaScript ES6
- Bootstrap 5.3
- Bootstrap Icons
- SweetAlert2
- DataTables
- Chart.js
- Select2
- Axios

## 6. Organización de Archivos

### CSS

- constructflow.css
- login.css
- layout.css
- forms.css
- datatable.css
- responsive.css

### JavaScript

- app.js
- login.js
- menu.js
- dashboard.js
- helpers.js
- datatable.js

### Imágenes

- logos
- backgrounds
- icons
- avatars
- illustrations

## 7. Convenciones

- CSS: kebab-case
- JavaScript: camelCase
- PHP: PascalCase

## 8. Diseño Visual

Inspiración:

- Microsoft Dynamics 365
- Oracle NetSuite
- Odoo
- Monday.com

## 9. Paleta Corporativa

| Elemento | Color |
|----------|--------|
| Azul | #0B1F47 |
| Naranja | #F97316 |
| Verde | #10B981 |
| Amarillo | #F59E0B |
| Rojo | #EF4444 |
| Gris | #F5F7FA |

## 10. Tipografía

- Inter
- Poppins

## 11. Iconografía

Bootstrap Icons.

## 12. Layout

Header → Menú → Breadcrumb → Barra de acciones → Contenido → Footer.

## 13. Responsive

- Smartphone <768 px
- Tablet 768–991 px
- Laptop 992–1399 px
- Desktop ≥1400 px

## 14. Componentes

Botones, inputs, selects, cards, tablas, modales, alertas, toast, loader, breadcrumb y paginación.

## 15. Formularios

- Etiqueta superior
- Dos columnas en escritorio
- Una columna en móvil
- Validación inmediata

## 16. Tablas

DataTables con búsqueda, ordenamiento, paginación y exportación.

## 17. Botones

Nuevo (Azul), Guardar (Verde), Editar (Azul), Eliminar (Rojo), Cancelar (Gris).

## 18. Modales

Tamaño Large por defecto.

## 19. Mensajes

SweetAlert2 como estándar.

## 20. Seguridad

JWT administrado por el frontend. Nunca almacenar contraseñas.

## 21. Integración API

Formato estándar:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

## 22. Rendimiento

Lazy Loading, WebP, minificación y caché.

## 23. Accesibilidad

WCAG 2.1 AA.

## 24. UX

Reducir clics, consistencia visual y mensajes claros.

## 25. Convenciones

Documentar, reutilizar componentes y evitar duplicidad.

## 26. Código

PHP PSR-12, JavaScript ES6+, variables CSS y sin estilos inline.

## 27. Versiones

Todo cambio deberá documentarse mediante un DEF-WEB.

## 28. Calidad

Validar funcionalidad, responsive, API, accesibilidad y rendimiento.

## 29. Documentación

Cada módulo contará con un documento DEF-WEB-XXX.

## 30. Roadmap

Portal de Acceso, Layout Maestro, Menú Dinámico, Dashboard, Clientes, Contactos, Cotizaciones, Proyectos, Planeación, Actividades, Evidencias, Presupuestos, Costos, Compras, Inventario, Facturación, Cobranza, Reportes y Configuración.

## 31. Historial

| Versión | Fecha | Descripción |
|---------|--------|-------------|
| 1.0 | Julio 2026 | Creación del documento |

## Aprobación

Este documento constituye el estándar oficial para el desarrollo del Frontend de ConstructFlow.Web.



## 32. Independencia del Entorno y Enrutamiento

### Principios

- El FrontEnd y las APIs deberán ser independientes del ambiente de ejecución (desarrollo, pruebas o producción).
- Ninguna API devolverá rutas físicas, URLs absolutas, nombres de servidor, direcciones IP o rutas dependientes del entorno.
- La resolución de rutas corresponde exclusivamente al FrontEnd mediante su mecanismo de enrutamiento.

### Respuesta esperada de las APIs

Las APIs devolverán únicamente identificadores lógicos, por ejemplo:

```json
{
  "Codigo": "CLIENTES",
  "Componente": "clientes",
  "Icono": "people"
}
```

### Enrutamiento del FrontEnd

El FrontEnd resolverá internamente el componente o vista correspondiente mediante un router o mapa de rutas. Esto permite desplegar ConstructFlow sin cambios en Windows, Linux, Apache, Nginx, Docker o servicios en la nube.

### Configuración por Ambiente

Las diferencias entre Desarrollo, QA y Producción deberán administrarse mediante archivos de configuración o variables de entorno, nunca mediante código fuente.

### Beneficios

- Portabilidad entre ambientes.
- Despliegue en servidores Linux o Windows.
- Compatibilidad con infraestructura en la nube.
- Eliminación de dependencias a localhost o rutas físicas.
- Mayor mantenibilidad y escalabilidad.

## 33. Historial de Cambios

| Versión | Fecha | Descripción |
|---------|--------|-------------|
| 1.1 | Julio 2026 | Se incorpora el estándar de independencia del entorno, resolución de rutas mediante FrontEnd y prohibición de rutas físicas o URLs absolutas en las APIs. |
