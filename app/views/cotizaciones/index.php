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

<div class="cf-card cf-card-table">
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

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/cotizaciones.js"></script>
