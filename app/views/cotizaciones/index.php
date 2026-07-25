<?php
/**
 * Vista: cotizaciones/index.php
 * Ref: DEF-WEB-002 (API Cotización) + DEF-WEB-000 (Estándares Frontend).
 *
 * Alcance de esta entrega: solo LISTADO (tabla) + botón "Nueva Cotización"
 * (placeholder, la captura se implementa en una siguiente iteración).
 *
 * Consume: GET {API_BASE_URL}/cotizaciones  (CotizacionController::index)
 * El token JWT se adjunta automáticamente vía interceptor de Axios (app.js).
 */
?>
<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Cotizaciones</h1>
        <p class="cf-page-subtitle">Listado de cotizaciones registradas.</p>
    </div>
    <div class="cf-page-actions">
        <button type="button" class="btn btn-cf-primary" id="btnNuevaCotizacion">
            <i class="bi bi-plus-lg"></i> Nueva Cotización
        </button>
    </div>
</div>

<div class="cf-card cf-card-table" id="cfCardListado">
    <div class="table-responsive">
        <table id="tblCotizaciones" class="table cf-table w-100">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Atención</th>
                    <th>Descripción del Trabajo</th>
                    <th>Fecha</th>
                    <th>Vigencia</th>
                    <th class="text-end">Descuento</th>
                    <th class="text-end">Total Venta</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Filas cargadas dinámicamente por cotizaciones.js -->
            </tbody>
        </table>
    </div>
</div>

<!-- ============ FORMULARIO (Nueva / Modificar) ============ -->
<div class="cf-card" id="cfCardFormulario" style="display:none">
    <div class="cf-page-header">
        <h2 class="cf-form-titulo" id="cfFormTitulo">Nueva Cotización</h2>
        <div class="cf-page-actions">
            <button type="button" class="btn btn-cf-secondary" id="btnCancelarFormulario">Cancelar</button>
            <button type="button" class="btn btn-cf-primary" id="btnGuardarCotizacion">
                <i class="bi bi-save"></i> Guardar
            </button>
        </div>
    </div>

    <h3 class="cf-form-seccion">Encabezado</h3>
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <label class="form-label">Cliente *</label>
            <select id="cfClienteID" class="form-select"></select>
        </div>
        <div class="col-md-4">
            <label class="form-label">Atención</label>
            <input id="cfAtencion" class="form-control" list="cfListaContactos" placeholder="Selecciona el cliente primero...">
            <datalist id="cfListaContactos"></datalist>
        </div>
        <div class="col-md-4">
            <label class="form-label">Estado</label>
            <select id="cfEstadoCotizacionID" class="form-select"></select>
            <div class="form-text" id="cfEstadoNota" style="display:none">Toda cotización nueva inicia en Borrador.</div>
        </div>

        <div class="col-md-8">
            <label class="form-label">Nombre / Descripción del trabajo *</label>
            <input id="cfNombreProyecto" class="form-control">
        </div>
        <div class="col-md-4">
            <label class="form-label">Forma de Pago</label>
            <input id="cfFormaPago" class="form-control" value="Crédito 30 días">
        </div>

        <div class="col-md-3">
            <label class="form-label">Fecha *</label>
            <input id="cfFecha" type="date" class="form-control">
        </div>
        <div class="col-md-3">
            <label class="form-label">Vigencia * <span class="form-text">(1 mes por defecto)</span></label>
            <input id="cfFechaVigencia" type="date" class="form-control">
        </div>
        <div class="col-md-3">
            <label class="form-label">Tiempo de Entrega (días)</label>
            <input id="cfTiempoEntrega" type="number" min="0" class="form-control">
        </div>
        <div class="col-md-3">
            <label class="form-label d-block">IVA</label>
            <div class="form-check form-switch mt-2">
                <input class="form-check-input" type="checkbox" id="cfIncluyeIVA" checked>
                <label class="form-check-label" for="cfIncluyeIVA">Incluye IVA (16%)</label>
            </div>
        </div>

        <div class="col-md-3">
            <label class="form-label">Probabilidad de Cierre (%)</label>
            <input id="cfProbabilidadCierre" type="number" min="0" max="100" class="form-control" value="50">
        </div>
        <div class="col-md-4">
            <label class="form-label">Origen del Prospecto</label>
            <input id="cfOrigenProspecto" class="form-control">
        </div>
        <div class="col-md-5">
            <label class="form-label">Observaciones</label>
            <input id="cfObservaciones" class="form-control">
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="cf-form-seccion mb-0">Partidas</h3>
        <button type="button" class="btn btn-cf-secondary btn-sm" id="btnAgregarPartida">
            <i class="bi bi-plus-lg"></i> Agregar partida
        </button>
    </div>
    <div class="table-responsive mb-4">
        <table class="table cf-table" id="cfTablaDetalle">
            <thead>
                <tr>
                    <th style="width:22%">Descripción</th>
                    <th style="width:10%">Unidad</th>
                    <th style="width:9%">Cantidad</th>
                    <th style="width:12%">P. Unitario</th>
                    <th style="width:12%">Costo Estimado</th>
                    <th style="width:9%">Desc. Tipo</th>
                    <th style="width:9%">Descuento</th>
                    <th style="width:13%">Comentarios</th>
                    <th style="width:4%"></th>
                </tr>
            </thead>
            <tbody><!-- filas dinámicas --></tbody>
        </table>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="cf-form-seccion mb-0">Actividades</h3>
        <button type="button" class="btn btn-cf-secondary btn-sm" id="btnAgregarActividad">
            <i class="bi bi-plus-lg"></i> Agregar actividad
        </button>
    </div>
    <div class="table-responsive">
        <table class="table cf-table" id="cfTablaActividades">
            <thead>
                <tr>
                    <th style="width:20%">Nombre</th>
                    <th style="width:28%">Descripción</th>
                    <th style="width:13%">Inicio</th>
                    <th style="width:13%">Fin</th>
                    <th style="width:9%">Duración (días)</th>
                    <th style="width:9%">Horas</th>
                    <th style="width:4%"></th>
                </tr>
            </thead>
            <tbody><!-- filas dinámicas --></tbody>
        </table>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/cotizaciones.js"></script>
