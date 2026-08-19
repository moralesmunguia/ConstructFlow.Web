<?php
/**
 * Vista: versiones/index.php
 * Ref: DEF-WEB-011 (API Versiones).
 *
 * Listado global de versiones de cotización (encabezado + snapshot de
 * detalle/actividades), con detalle en modal y restauración con
 * trazabilidad (restaurar genera una versión nueva, no borra historial).
 *
 * Consume:
 *   GET  {API_BASE_URL}/versiones                -> CotizacionVersionController::indexAll()
 *   GET  {API_BASE_URL}/versiones/{id}/json       -> CotizacionVersionController::json()
 *   POST {API_BASE_URL}/versiones/{id}/restaurar  -> CotizacionVersionController::restaurar()
 *   GET  {API_BASE_URL}/cotizaciones              -> CotizacionController::index() (filtro)
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Versiones</span>
</nav>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Versiones</h1>
        <p class="cf-listado-subtitle">Historial de revisiones de cotizaciones: encabezado, partidas y actividades.</p>
    </div>
    <div class="cf-page-actions">
        <button type="button" class="cf-btn-secondary" id="btnRefrescarVersiones">
            <i class="bi bi-arrow-repeat"></i> Actualizar
        </button>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-field-row">
            <div class="cf-field-group">
                <label class="cf-label">Cotización</label>
                <select id="cfFiltroCotizacionVersiones" class="cf-input" style="cursor:pointer">
                    <option value="">Todas</option>
                </select>
            </div>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table" id="cfCardListadoVersiones">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarVersiones" placeholder="Buscar folio, versión, comentarios...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table id="tblVersiones" class="cf-table w-100">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Descripción</th>
                    <th>Versión</th>
                    <th>Fecha</th>
                    <th class="text-end">Total Venta</th>
                    <th>Comentarios</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Filas cargadas dinámicamente por versiones.js -->
            </tbody>
        </table>
    </div>
</div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/versiones.js"></script>
