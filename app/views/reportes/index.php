<?php
/**
 * Vista: reportes/index.php
 * Ref: DEF-WEB-021 (API Reportes) -- consulta y exportación (PDF/Excel)
 * de reportes de Proyectos, Costos, Facturación, Rentabilidad y KPI.
 * El API (ReporteController/Service) es de solo lectura y siempre
 * calcula en tiempo real -- esta vista solo consulta y exporta.
 *
 * Consume:
 *   GET  /api/v1/reportes/proyectos|costos|facturacion|rentabilidad|kpi
 *   POST /api/v1/reportes/exportar/pdf   (blob)
 *   POST /api/v1/reportes/exportar/excel (blob)
 *   GET  /api/v1/reportes                (bitácora, historial)
 *   GET  /api/v1/clientes                (para el filtro de Proyectos)
 */
?>
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Reportes</h1>
        <p class="cf-listado-subtitle">Reportes operativos, financieros y ejecutivos, en tiempo real.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnVerHistorialReportes"><i class="bi bi-clock-history"></i> Historial</button>
        <button type="button" class="cf-btn-secondary" id="btnExportarPdf"><i class="bi bi-file-earmark-pdf"></i> Exportar PDF</button>
        <button type="button" class="cf-btn-secondary" id="btnExportarExcel"><i class="bi bi-file-earmark-excel"></i> Exportar Excel</button>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-form-row" style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">

            <div class="cf-form-group">
                <label for="cfSelectTipoReporte">Tipo de reporte</label>
                <select id="cfSelectTipoReporte" class="form-select">
                    <option value="proyectos">Proyectos</option>
                    <option value="costos">Costos</option>
                    <option value="facturacion">Facturación</option>
                    <option value="rentabilidad">Rentabilidad</option>
                    <option value="kpi">KPI Ejecutivo</option>
                </select>
            </div>

            <!-- Filtros: solo aplican al reporte de Proyectos -->
            <div class="cf-form-group cf-filtro-proyectos">
                <label for="cfFiltroCliente">Cliente</label>
                <select id="cfFiltroCliente" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="cf-form-group cf-filtro-proyectos">
                <label for="cfFiltroEstado">Estado</label>
                <select id="cfFiltroEstado" class="form-select">
                    <option value="">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>
            </div>

            <div class="cf-form-group cf-filtro-proyectos">
                <label for="cfFiltroFechaDesde">Fecha inicio desde</label>
                <input type="date" id="cfFiltroFechaDesde" class="form-control">
            </div>

            <div class="cf-form-group cf-filtro-proyectos">
                <label for="cfFiltroFechaHasta">Fecha inicio hasta</label>
                <input type="date" id="cfFiltroFechaHasta" class="form-control">
            </div>

            <div class="cf-form-group">
                <button type="button" class="cf-btn-primary" id="btnGenerarReporte"><i class="bi bi-search"></i> Generar</button>
            </div>

        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-card-header">
        <h2 class="cf-card-title" id="cfTituloResultado" style="margin:0">Resultado</h2>
    </div>
    <div id="cfReporteContenido">
        <p class="text-muted" style="padding:16px">Selecciona un tipo de reporte y presiona "Generar".</p>
    </div>
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/reportes.js"></script>
