<?php
/**
 * Vista: kpis/index.php
 * Ref: DEF-WEB-017 (API KPI) -- Dashboard ejecutivo consolidado. El API
 * (KpiConsolidadoController/Service, DEF-WEB-017) ya está implementado
 * y es de solo lectura; esta vista es la parte Web que faltaba.
 *
 * Consume:
 *   GET /api/v1/kpi/dashboard      (todo consolidado, tarjetas superiores)
 *   GET /api/v1/proyectos          (tabla de proyectos)
 *   GET /api/v1/kpi/cartera        (tabla de cartera vencida)
 *   GET /api/v1/kpi/proyectos/{id} (detalle al hacer clic en un proyecto)
 */
?>
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Dashboard de KPI's</h1>
        <p class="cf-listado-subtitle">Indicadores ejecutivos y operativos consolidados, en tiempo real.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnRefrescarKpis"><i class="bi bi-arrow-repeat"></i> Refrescar</button>
    </div>
</div>

<!-- Proyectos / Rentabilidad / Facturación / Cartera -->
<div class="cf-resumen-grid">
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-building"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiProyectosActivos">—</span>
            <span class="cf-resumen-label">Proyectos activos</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#ECFDF5;color:#10B981;">
            <i class="bi bi-graph-up-arrow"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiMargenReal">—</span>
            <span class="cf-resumen-label">Margen real</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF3C7;color:#F59E0B;">
            <i class="bi bi-cash-coin"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiSaldoPendiente">—</span>
            <span class="cf-resumen-label">Saldo por cobrar</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF2F2;color:#EF4444;">
            <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiCarteraVencida">—</span>
            <span class="cf-resumen-label">Cartera vencida</span>
        </div>
    </div>
</div>

<!-- Costos / Actividades -->
<div class="cf-resumen-grid">
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-receipt"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiCostoReal">—</span>
            <span class="cf-resumen-label">Costo real total</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#ECFDF5;color:#10B981;">
            <i class="bi bi-check2-circle"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiActividadesCompletadas">—</span>
            <span class="cf-resumen-label">Actividades completadas</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF2F2;color:#EF4444;">
            <i class="bi bi-alarm-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiActividadesVencidas">—</span>
            <span class="cf-resumen-label">Actividades vencidas</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#DBEAFE;color:#0B69D4;">
            <i class="bi bi-speedometer2"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfKpiAvancePromedio">—</span>
            <span class="cf-resumen-label">Avance promedio</span>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table" style="margin-bottom:16px">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarKpiProyectos" placeholder="Buscar proyecto...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaKpiProyectos" style="width:100%">
            <thead>
                <tr>
                    <th>Proyecto</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th class="text-end">Presupuesto</th>
                    <th class="text-end">Costo real</th>
                    <th class="text-end">Rentabilidad</th>
                    <th class="text-end">Avance</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-card-header">
        <h2 class="cf-card-title" style="margin:0">Cartera vencida</h2>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaKpiCartera" style="width:100%">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Proyecto</th>
                    <th>Factura</th>
                    <th>Vencimiento</th>
                    <th class="text-end">Saldo</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/kpis.js"></script>
