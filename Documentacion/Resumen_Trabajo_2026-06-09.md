# Resumen de trabajo — ConstructFlow (hasta 2026-06-09)

**Fecha:** 2026-06-09

## Objetivo
Breve scaffold MVC en PHP + MySQL para gestión de cotizaciones (multiempresa, multiusuario), generación de PDFs y gestión de proyectos.

## Trabajo realizado (principales entregables)
- **Scaffold MVC mínimo:** [constructflow-mvc/index.php](constructflow-mvc/index.php)
- **Núcleo MVC:** [constructflow-mvc/app/core/Router.php](constructflow-mvc/app/core/Router.php), [constructflow-mvc/app/core/Controller.php](constructflow-mvc/app/core/Controller.php), [constructflow-mvc/app/core/Model.php](constructflow-mvc/app/core/Model.php), [constructflow-mvc/app/core/Container.php](constructflow-mvc/app/core/Container.php)
- **Controlador / Modelo de ejemplo:** [constructflow-mvc/app/controllers/CotizacionController.php](constructflow-mvc/app/controllers/CotizacionController.php), [constructflow-mvc/app/models/Cotizacion.php](constructflow-mvc/app/models/Cotizacion.php)
- **Vistas:** [constructflow-mvc/app/views/home.php](constructflow-mvc/app/views/home.php)
- **API (fallbacks):** [constructflow-mvc/api/cotizaciones/index.php](constructflow-mvc/api/cotizaciones/index.php) (dinámico, PDO), [constructflow-mvc/api/cotizaciones/index.html](constructflow-mvc/api/cotizaciones/index.html) (ejemplo estático)
- **Reescritura / front controller:** [constructflow-mvc/.htaccess](constructflow-mvc/.htaccess)
- **Esquema de base de datos (MySQL):** [constructflow-mvc/sql/schema.sql](constructflow-mvc/sql/schema.sql)
- **Documentación / README:** [constructflow-mvc/README.md](constructflow-mvc/README.md)
- **Logs y depuración:** `constructflow-mvc/tmp/` (peticiones y errores: `cotizaciones.request.log`, `cotizaciones.error.log`)
- **Laravel scaffold (referencia):** `laravel-scaffold/` contiene migraciones, modelos y controladores previos (no ejecutados aquí).

## Estado actual
- La página principal carga correctamente en: `http://localhost:8081/SiCon/constructflow-mvc/`.
- Endpoint dinámico `/api/cotizaciones/index.php` responde JSON pero falla conexión a BD por credenciales. Error registrado en `constructflow-mvc/tmp/cotizaciones.error.log`.
- Se añadió un fallback estático: `/api/cotizaciones/index.html` muestra ejemplo JSON.
- Apache está sirviendo el sitio en `/SiCon/`; el front controller y `.htaccess` fueron añadidos, pero puede requerir `mod_rewrite` y `AllowOverride All` para comportamiento completo.
- En este entorno no se ejecutaron `artisan` ni `composer` (Laravel scaffold requiere Composer y vendor). El servidor embebido de PHP no pudo iniciarse desde el terminal actual porque `php` no está en el PATH de esa sesión.

## Cómo probar localmente (rápido)
1. Importar esquema MySQL (ajusta credenciales):

```bash
mysql -u root -p constructflow < constructflow-mvc/sql/schema.sql
```

2. Editar credenciales en `constructflow-mvc/config/config.php` (host, db_name, db_user, db_pass).
3. Abrir en navegador: `http://localhost:8081/SiCon/constructflow-mvc/`.
4. Probar API: `http://localhost:8081/SiCon/constructflow-mvc/api/cotizaciones/index.php`.

## Logs relevantes
- `constructflow-mvc/tmp/cotizaciones.error.log` — errores DB/ejecución
- `constructflow-mvc/tmp/cotizaciones.request.log` — peticiones recibidas
- `laravel-scaffold/php-server.log` — intentos previos del servidor embebido (si existe)

## Próximos pasos recomendados
- Proveer credenciales BD y ejecutar el import de `sql/schema.sql` para obtener datos reales.
- Habilitar `mod_rewrite` / `AllowOverride All` en Apache si se desea usar front controller sin archivos `index.php` directos.
- Implementar autenticación (JWT o sesiones) y middleware multiempresa.
- Añadir generación de PDF (DOMPDF vía Composer) — instalar Composer en el servidor o usar alternativa.
- Portar la lógica de versionado de cotizaciones desde `laravel-scaffold/` a `constructflow-mvc/` si se desea mantener la implementación previa.

---

Documento generado automáticamente por el asistente. Si quieres, mañana continúo con: configurar BD, auth o PDF.
