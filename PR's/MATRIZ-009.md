# MATRIZ 009 — Mapeo y ejemplos

Este archivo complementa `DEF-WEB-009_API_Costos.md` con el mapeo explícito entre la Matriz 009 y los campos de la base de datos, más ejemplos por categoría.

1) Mapeo de campos (resumen)

- Matriz 009: `CostoEstimado` (estimado total)
  - BD: `CF_Cotizacion.CostoEstimado`

- Matriz 009: `PrecioVenta` (precio de venta total)
  - BD: `CF_Cotizacion.TotalVenta` / `CF_Cotizacion.TotalCotizacion`

- Matriz 009: `Costos Reales` (por categoría)
  - BD: `cf_costo.Importe`, `cf_costo.CategoriaCostoID`, `cf_costo.ProyectoID`

- Matriz 009: `Presupuesto Operativo`
  - BD: `cf_presupuesto.PresupuestoID`, `cf_presupuesto.TotalPresupuesto`
  - Detalles: `cf_presupuestodetalle.CategoriaCostoID`, `cf_presupuestodetalle.Importe`

- Proyección en proyecto
  - `CF_Proyecto.CostoReal` = SUM(`cf_costo.Importe`) para el `ProyectoID`
  - `CF_Proyecto.PresupuestoActual` = `cf_presupuesto.TotalPresupuesto` (si existe presupuesto activo)

2) Ejemplo por categoría y cálculo paso a paso

Supongamos la siguiente entrada en la cotización:

- `CF_Cotizacion.CostoEstimado` = 200,000.00
- `CF_Cotizacion.TotalVenta` = 300,000.00

Costos reales registrados (por `cf_costo`):

- MAT: 80,000.00
- MO: 60,000.00
- EQ: 20,000.00
- Total `CostoReal` = 160,000.00

Cálculos:

- Desviación = 200,000.00 − 160,000.00 = 40,000.00
- Desviación% = (40,000.00 / 200,000.00) * 100 = 20%
- Rentabilidad% = ((300,000.00 − 160,000.00) / 300,000.00) * 100 = 46.67%

3) Cómo mapear estimados por categoría (opcional)

Si la Matriz 009 incluye estimados por categoría, crear filas en `cf_presupuestodetalle` con `CategoriaCostoID` y `Importe` igual al estimado por categoría. Luego:

- Desviación por categoría = `Presupuestodetalle.Importe` − SUM(`cf_costo.Importe` por categoría)

4) Recomendaciones para el PR

- Añadir en el README del PR un extracto de `MATRIZ-009.md` como referencia para QA.
- Incluir scripts SQL de ejemplo para poblar una cotización con `CostoEstimado` y un presupuesto activo para pruebas de integración.

5) Scripts SQL y pasos de verificación (ejemplo)

A continuación hay un script SQL de ejemplo (no destructivo) que crea una cotización, proyecto, presupuesto y algunos costos de prueba. Ajusta IDs y campos según tu esquema real.

Archivo: `PR's/matriz-009-ejemplo.sql`

```sql
-- Crear proyecto y cotización de ejemplo
INSERT INTO CF_Proyecto (ProyectoID, EmpresaID, Nombre, CostoReal, PresupuestoActual)
VALUES (9001, 1, 'Proyecto Prueba MATRIZ009', 0, 0);

INSERT INTO CF_Cotizacion (CotizacionID, ProyectoID, EmpresaID, CostoEstimado, TotalVenta, EstadoCotizacionID)
VALUES (9001, 9001, 1, 200000.00, 300000.00, 1);

-- Crear presupuesto operativo activo
INSERT INTO cf_presupuesto (PresupuestoID, ProyectoID, EmpresaID, TotalPresupuesto, Activo)
VALUES (9001, 9001, 1, 0.00, 1);

-- Insertar detalles presupuestarios iniciales (estimados por categoría opcional)
INSERT INTO cf_presupuestodetalle (PresupuestoDetalleID, PresupuestoID, CategoriaCostoID, Importe, Activo)
VALUES (90011, 9001, 1, 100000.00, 1), -- MAT
       (90012, 9001, 2, 60000.00, 1),  -- MO
       (90013, 9001, 3, 40000.00, 1);  -- EQ

-- Insertar costos reales de ejemplo (podrías también usar las APIs)
INSERT INTO cf_costo (CostoID, ProyectoID, CategoriaCostoID, Importe, FechaCosto, CreatedUserID, CreatedBy, Activo)
VALUES (900101, 9001, 1, 80000.00, NOW(), 1, 'qa', 1),
       (900102, 9001, 2, 60000.00, NOW(), 1, 'qa', 1),
       (900103, 9001, 3, 20000.00, NOW(), 1, 'qa', 1);

-- Actualizar agregados del proyecto manualmente para el entorno de pruebas
UPDATE CF_Proyecto SET CostoReal = 160000.00 WHERE ProyectoID = 9001;
UPDATE cf_presupuesto SET TotalPresupuesto = 200000.00 WHERE PresupuestoID = 9001;

-- Consultas para verificar
SELECT * FROM CF_Cotizacion WHERE CotizacionID = 9001;
SELECT * FROM cf_costo WHERE ProyectoID = 9001;
SELECT * FROM cf_presupuestodetalle WHERE PresupuestoID = 9001;
SELECT * FROM cf_presupuesto WHERE PresupuestoID = 9001;
SELECT CostoReal, PresupuestoActual FROM CF_Proyecto WHERE ProyectoID = 9001;
```

Pasos curl para probar la API (asumiendo servidor local y token válido):

1) Crear un costo vía API (esto debe ajustar el presupuesto activo si existe):

```bash
curl -X POST "http://localhost/api/v1/proyectos/9001/costos" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"CategoriaCostoID": 1, "Importe": 5000.00, "Concepto": "Compra material QA", "CreatedUserID":1, "CreatedBy":"qa", "ModifiedUserID":1, "ModifiedBy":"qa"}'
```

2) Verificar en BD que `cf_costo` tiene la fila y que `cf_presupuestodetalle` y `cf_presupuesto` se ajustaron:

```sql
SELECT * FROM cf_costo WHERE ProyectoID = 9001 ORDER BY CostoID DESC LIMIT 5;
SELECT * FROM cf_presupuestodetalle WHERE PresupuestoID = 9001;
SELECT * FROM cf_presupuesto WHERE PresupuestoID = 9001;
```

3) Modificar un costo (ejemplo delta) y verificar ajuste de presupuesto:

```bash
curl -X PUT "http://localhost/api/v1/costos/900101" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"CategoriaCostoID": 1, "Importe": 90000.00, "ModifiedUserID":1, "ModifiedBy":"qa"}'
```

4) Eliminar costo y verificar resta en presupuesto:

```bash
curl -X DELETE "http://localhost/api/v1/costos/900103" \
  -H "Authorization: Bearer <TOKEN>"
```

6) Notas sobre uso

- Ajusta los IDs del script SQL a un entorno de pruebas; no ejecutes directamente en producción.
- Los `INSERT` asumen columnas mínimas; si tu esquema tiene columnas NOT NULL adicionales, añade valores pertinentes.
- Para pruebas automatizadas, crea una transacción de test y realiza rollback al final, o usa una DB de pruebas dedicada.

