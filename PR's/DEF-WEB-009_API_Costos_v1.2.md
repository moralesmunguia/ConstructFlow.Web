# DEF-WEB-009 — API Costos

Proyecto: ConstructFlow.Api

Documento: DEF-WEB-009

Versión: 1.2

Estado: Aprobado para Desarrollo

Fecha: 2026-08-07

1. Objetivo

Documentar la API REST del módulo de Costos, encargada de administrar los costos reales por proyecto, categorías de costo y su interacción con presupuestos operativos.

2. Alcance

Incluye consulta de costos, captura de costos, presupuesto (lectura/ajuste), resumen por categoría y cálculo del costo total del proyecto, así como la sincronización automática con un presupuesto activo cuando exista.

3. Endpoints

- GET   /api/v1/proyectos/{id}/costos
- POST  /api/v1/proyectos/{id}/costos
- PUT   /api/v1/costos/{id}
- DELETE /api/v1/costos/{id}
- GET   /api/v1/proyectos/{id}/presupuesto
- POST  /api/v1/proyectos/{id}/presupuesto
- GET   /api/v1/proyectos/{id}/costos/resumen
- GET   /api/v1/proyectos/{id}/costos/categorias

4. Flujo funcional (actualizado)

1. Cliente solicita registrar/actualizar/eliminar un costo para un proyecto.
2. Se valida categoría y restricciones del proyecto (estado, actividad, permisos).
3. Se persiste la operación (`cf_costo`).
4. Si existe un `cf_presupuesto` activo para el proyecto, el sistema ajusta automáticamente el `cf_presupuestodetalle` correspondiente a la `CategoriaCostoID` y actualiza `cf_presupuesto.TotalPresupuesto` y `CF_Proyecto.PresupuestoActual`.
   - La operación de ajuste ocurre dentro de la misma transacción que la operación sobre costos para garantizar consistencia (commit o rollback conjunto).
5. Se recalculan agregados del proyecto (`CostoReal`, `Rentabilidad`) y se actualiza el dashboard.

Nota: Si no existe un presupuesto activo, NO se crea uno automáticamente; el ajuste solo ocurre cuando hay un presupuesto activo previamente creado.

5. Arquitectura

Cliente Web/Móvil → `CostoController` → `CostoService` → `CostoRepository` (+ `PresupuestoRepository`) → Base de Datos.

6. Reglas de negocio (clarificadas)

- Todo costo pertenece a un proyecto.
- Cada costo debe clasificarse por categoría (MAT, MO, EQ, SUB, ADM, LOG, etc.).
- Los costos afectan el `CostoReal` del proyecto y, por tanto, la `Rentabilidad`.
- Si existe un `cf_presupuesto` activo para el proyecto, los cambios en costos (crear/editar/eliminar) ajustan automáticamente el detalle y el total del presupuesto.
- Si el `Importe` en un detalle de presupuesto queda <= 0 tras un ajuste, el detalle se desactiva (marcado inactivo) para mantener integridad histórica.
- Solo usuarios autorizados pueden registrar o modificar costos. JWT obligatorio; `EmpresaID` y `UsuarioID` desde token.

7. Consideraciones técnicas y caveats

- La sincronización automática se implementó en `CostoService`: al crear se suma el importe; al actualizar se aplica la diferencia (`delta`); al eliminar se resta el importe antiguo.
- Cambio de categoría en una actualización: el comportamiento correcto es restar el `Importe` anterior de la categoría antigua y sumar el `Importe` nuevo a la categoría nueva. La implementación actual aplica el `delta` sobre la `CategoriaCostoID` enviada; por tanto, si se cambia la categoría al mismo tiempo que el importe, es necesario validar que el servicio reste el antiguo importe de la categoría anterior y agregue el nuevo importe a la categoría nueva. Recomendación: revisar y cubrir este caso en tests/ajustes futuros.
- Todas las modificaciones relevantes al presupuesto se ejecutan usando `PresupuestoRepository::ajustarDetalleImporte(presupuestoID, categoriaCostoID, delta, usuarioID, usuario)` para centralizar la lógica de insertar/ajustar/desactivar detalle y evitar duplicidad.
- Las operaciones críticas se realizan dentro de transacciones en el servicio para mantener atomicidad entre `cf_costo`, `cf_presupuestodetalle` y `cf_presupuesto`.

8. Integraciones

Proyectos, Rentabilidad, Dashboard Ejecutivo, KPI, Facturación y Órdenes.

9. Seguridad

JWT obligatorio. `EmpresaID` y `UsuarioID` se obtienen del token. El servicio valida permisos de operación según roles/propiedades del token.

10. Casos de prueba recomendados

- Registrar costo con presupuesto activo: verificar `cf_costo`, `cf_presupuestodetalle` (insert/ajuste), `cf_presupuesto.TotalPresupuesto` y `CF_Proyecto.PresupuestoActual`.
- Actualizar costo (solo importe): verificar delta correcto aplicado al detalle y total.
- Actualizar costo (cambio de categoría): verificar que se reste de la categoría antigua y se sume en la nueva.
- Eliminar costo: verificar resta del importe y no permitir `TotalPresupuesto` negativo.
- Registrar costo sin presupuesto activo: verificar que solo se crea `cf_costo` y se recalculan agregados del proyecto.

Ejemplos rápidos (curl)

Crear costo (ejemplo):

```bash
curl -X POST "http://localhost/api/v1/proyectos/13/costos" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"CategoriaCostoID": 2, "Importe": 1000.00, "Concepto": "Compra material", "CreatedUserID":1, "CreatedBy":"admin", "ModifiedUserID":1, "ModifiedBy":"admin"}'
```

Actualizar costo (ejemplo delta):

```bash
curl -X PUT "http://localhost/api/v1/costos/123" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"CategoriaCostoID": 2, "Importe": 1500.00, "ModifiedUserID":1, "ModifiedBy":"admin"}'
```

Eliminar costo (ejemplo):

```bash
curl -X DELETE "http://localhost/api/v1/costos/123" \
  -H "Authorization: Bearer <TOKEN>"
```

12. Definiciones y fórmulas

- **CostoEstimado:** valor capturado en la cotización (`CF_Cotizacion.CostoEstimado`). Representa el costo presupuestado o estimado para el proyecto antes de ejecución.
- **Costos Reales:** importes registrados en `cf_costo` por categoría. El `CostoReal` del proyecto es la suma de los `Importe` activos de `cf_costo` para ese proyecto.
- **Precio de Venta:** proviene de la cotización (`CF_Cotizacion.TotalVenta` o `TotalCotizacion`) y representa el ingreso esperado por venta.
- **Desviación (absoluta):**

  $$\text{Desviación} = \text{CostoEstimado} - \text{CostoReal}$$

  - Si Desviación > 0 significa que el costo estimado es mayor que el costo real (ahorro).
  - Si Desviación < 0 significa que el costo real excede el estimado (sobre-costo).

- **Desviación (%)** (opcional):

  $$\text{Desviación\%} = \frac{\text{Desviación}}{\text{CostoEstimado}} \times 100$$

- **Rentabilidad (%)**:

  $$\text{Rentabilidad} = \frac{\text{PrecioVenta} - \text{CostoReal}}{\text{PrecioVenta}} \times 100$$

Notas:
- Las fórmulas usan `CostoEstimado` desde la cotización asociada al proyecto y `CostoReal` calculado desde los costos reales registrados por categoría.
- Para desviaciones por categoría, si la cotización registra estimados por categoría se puede calcular la desviación categoría a categoría; en ausencia de estimados por categoría, la desviación se calcula a nivel proyecto.

12. Matriz 009 — Mapeo de campos y ejemplos

Objetivo: dejar explícito el mapeo entre la Matriz 009 (definición de estimados y reales) y los campos existentes en la base de datos, además de un ejemplo práctico de cálculo.

Campos relevantes y mapeo:

- `CF_Cotizacion.CostoEstimado` — Costo estimado general registrado en la cotización (matriz 009: estimado total).
- `CF_Cotizacion.TotalVenta` / `TotalCotizacion` — Precio de venta / ingreso esperado (matriz 009: Precio de Venta).
- `cf_costo`:
  - `Importe` — costo real registrado (por categoría).
  - `CategoriaCostoID` — categoría del costo (MAT, MO, EQ, etc.).
  - `ProyectoID` — referencia al proyecto asociado.
- `cf_presupuesto`:
  - `PresupuestoID` — identificador de presupuesto operativo activo para el proyecto.
  - `TotalPresupuesto` — suma de importes en `cf_presupuestodetalle`.
- `cf_presupuestodetalle`:
  - `CategoriaCostoID` — categoría presupuestaria.
  - `Importe` — importe presupuestado por categoría (ajustable por la sincronización de costos reales).
- `CF_Proyecto` campos usados:
  - `CostoReal` — agregado calculado desde `cf_costo` (suma de `Importe`).
  - `PresupuestoActual` — reflejo del `cf_presupuesto.TotalPresupuesto` cuando existe presupuesto activo.

Ejemplo práctico (números ficticios):

- `CF_Cotizacion.CostoEstimado` = 100,000.00
- `CF_Cotizacion.TotalVenta` = 150,000.00
- Costos reales registrados en `cf_costo`:
  - MAT: 40,000.00
  - MO: 30,000.00
  - EQ: 10,000.00
  - Total `CostoReal` = 80,000.00

- Desviación (absoluta) = 100,000.00 − 80,000.00 = 20,000.00
- Desviación (%) = (20,000.00 / 100,000.00) * 100 = 20%
- Rentabilidad (%) = ((150,000.00 − 80,000.00) / 150,000.00) * 100 = 46.67%

Notas operativas:
- Si hay un `cf_presupuesto` activo, los ajustes de `cf_costo` actualizan `cf_presupuestodetalle` por `CategoriaCostoID` y el `TotalPresupuesto`.
- Si la Matriz 009 se extiende para incluir estimados por categoría, se puede mapear `cf_presupuestodetalle.Importe` a los estimados por categoría y calcular desviaciones por categoría.

11. Historial

Versión 1.0 — Julio 2026

Versión 1.1 — Agosto 2026: Actualización para documentar sincronización automática de costos con `cf_presupuesto` cuando existe un presupuesto activo; incluidas consideraciones sobre cambio de categoría y transaccionalidad.

Versión 1.2 — 2026-08-07: Copia para control de versión; sin cambios funcionales respecto a 1.1.

---
Nota: si quieres, puedo crear un archivo separado `MATRIZ-009.md` con tablas CSV/Markdown y más ejemplos por categoría para adjuntar al PR.
---
Nota: si quieres, puedo añadir un ejemplo de test de integración (PHPUnit) que cubra crear/actualizar/eliminar costos y verifique las modificaciones en `cf_presupuesto` y `cf_presupuestodetalle`.
---
Nota: si quieres, puedo añadir un ejemplo de test de integración (PHPUnit) que cubra crear/actualizar/eliminar costos y verifique las modificaciones en `cf_presupuesto` y `cf_presupuestodetalle`.
