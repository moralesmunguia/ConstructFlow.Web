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
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Cotizaciones</h1>
        <p class="cf-listado-subtitle">Listado de cotizaciones registradas.</p>
    </div>
    <div class="cf-page-actions">
        <button type="button" class="cf-btn-primary" id="btnNuevaCotizacion">
            <i class="bi bi-plus-lg"></i> Nueva Cotización
        </button>
    </div>
</div>

<div class="cf-card cf-card-table" id="cfCardListado">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarCotizaciones" placeholder="Buscar folio, cliente, descripción...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table id="tblCotizaciones" class="cf-table w-100">
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
</div>

<!-- ============ FORMULARIO (Nueva / Modificar) ============ -->
<div class="cf-form-container" id="cfCardFormulario" style="display:none">
    <div class="cf-form-header">
        <div>
            <h2 class="cf-form-title" id="cfFormTitulo">Nueva Cotización</h2>
            <p class="cf-form-subtitle">Encabezado, partidas y actividades de la cotización</p>
        </div>
        <div class="cf-form-actions">
            <button type="button" class="cf-btn-secondary" id="btnCancelarFormulario">
                <i class="bi bi-x-lg"></i> Cancelar
            </button>
            <button type="button" class="cf-btn-primary" id="btnGuardarCotizacion">
                <i class="bi bi-check-lg"></i> Guardar
            </button>
        </div>
    </div>

    <!-- Card: Encabezado -->
    <div class="cf-card" style="margin-bottom:16px">
        <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#EEF2FF;color:#0B1F47;">
                <i class="bi bi-file-earmark-text"></i>
            </div>
            <span class="cf-card-title">Encabezado</span>
        </div>
        <div class="cf-card-body">
            <div class="cf-field-row-3">
                <div class="cf-field-group">
                    <label class="cf-label">Cliente <span class="cf-required">*</span></label>
                    <select id="cfClienteID" class="cf-input" style="cursor:pointer"></select>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Atención</label>
                    <input id="cfAtencion" class="cf-input" list="cfListaContactos" placeholder="Selecciona el cliente primero...">
                    <datalist id="cfListaContactos"></datalist>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Estado</label>
                    <select id="cfEstadoCotizacionID" class="cf-input" style="cursor:pointer"></select>
                    <span class="cf-hint" id="cfEstadoNota" style="display:none">Toda cotización nueva inicia en Borrador.</span>
                </div>
            </div>

            <div class="cf-field-row">
                <div class="cf-field-group cf-field-full">
                    <label class="cf-label">Nombre / Descripción del trabajo <span class="cf-required">*</span></label>
                    <input id="cfNombreProyecto" class="cf-input">
                </div>
            </div>

            <div class="cf-field-row">
                <div class="cf-field-group">
                    <label class="cf-label">Forma de Pago</label>
                    <input id="cfFormaPago" class="cf-input" value="Crédito 30 días">
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Tiempo de Entrega (días)</label>
                    <input id="cfTiempoEntrega" type="number" min="0" class="cf-input">
                </div>
            </div>

            <div class="cf-field-row-3">
                <div class="cf-field-group">
                    <label class="cf-label">Fecha <span class="cf-required">*</span></label>
                    <input id="cfFecha" type="date" class="cf-input">
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Vigencia <span class="cf-required">*</span></label>
                    <input id="cfFechaVigencia" type="date" class="cf-input">
                    <span class="cf-hint">1 mes por defecto</span>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">IVA</label>
                    <label class="cf-checkbox-card">
                        <input type="checkbox" id="cfIncluyeIVA" checked>
                        <span class="cf-checkbox-indicator"></span>
                        <span class="cf-checkbox-text">Incluye IVA (16%)</span>
                    </label>
                </div>
            </div>

            <div class="cf-field-row-3">
                <div class="cf-field-group">
                    <label class="cf-label">Probabilidad de Cierre (%)</label>
                    <input id="cfProbabilidadCierre" type="number" min="0" max="100" class="cf-input" value="50">
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Origen del Prospecto</label>
                    <input id="cfOrigenProspecto" class="cf-input">
                </div>
                <div class="cf-field-group">
                    <label class="cf-label">Observaciones</label>
                    <input id="cfObservaciones" class="cf-input">
                </div>
            </div>
        </div>
    </div>

    <!-- Card: Partidas -->
    <div class="cf-card" style="margin-bottom:16px">
        <div class="cf-card-header" style="justify-content:space-between">
            <div style="display:flex;align-items:center;gap:10px">
                <div class="cf-card-icon" style="background:#ECFDF5;color:#059669;">
                    <i class="bi bi-list-ul"></i>
                </div>
                <span class="cf-card-title">Partidas</span>
            </div>
            <button type="button" class="cf-btn-secondary" id="btnAgregarPartida">
                <i class="bi bi-plus-lg"></i> Agregar partida
            </button>
        </div>
        <div class="cf-card-body" style="padding:0">
            <div class="cf-table-wrap">
                <table class="cf-table" id="cfTablaDetalle">
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
        </div>
    </div>

    <!-- Card: Actividades -->
    <div class="cf-card">
        <div class="cf-card-header" style="justify-content:space-between">
            <div style="display:flex;align-items:center;gap:10px">
                <div class="cf-card-icon" style="background:#FEF3C7;color:#D97706;">
                    <i class="bi bi-list-check"></i>
                </div>
                <span class="cf-card-title">Actividades</span>
            </div>
            <button type="button" class="cf-btn-secondary" id="btnAgregarActividad">
                <i class="bi bi-plus-lg"></i> Agregar actividad
            </button>
        </div>
        <div class="cf-card-body" style="padding:0">
            <div class="cf-table-wrap">
                <table class="cf-table" id="cfTablaActividades">
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
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/cotizaciones.js"></script>
