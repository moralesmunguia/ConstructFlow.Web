ConstructFlow - Lightweight MVC scaffold

Estructura:
- /app/controllers
- /app/models
- /app/views
- /app/services
- /app/middleware
- /config
- /public (assets)
- /sql (schema.sql)

Uso rápido:
1. Importa `sql/schema.sql` en MySQL para crear la base de datos `constructflow`.
2. Ajusta `config/config.php` con credenciales.
3. Sirve la carpeta `constructflow-mvc` en un servidor PHP (por ejemplo desde `C:\AppServ\www\SiCon`): `php -S localhost:8000 -t constructflow-mvc`.

End points:
- `GET /api/cotizaciones`
- `POST /api/cotizaciones`
- `GET /api/cotizaciones/{id}`
- `PUT /api/cotizaciones/{id}`
- `DELETE /api/cotizaciones/{id}`

Notas:
- Scaffold minimal para pruebas locales. Producción requiere mayor seguridad, validación, autenticación y sanitización.
