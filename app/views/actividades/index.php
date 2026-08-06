<?php
/**
 * Vista: actividades/index.php
 * Ref: DEF-WEB-004 (Actividades) -- pantalla independiente, listado de
 * TODAS las actividades de todos los proyectos de la empresa. Antes
 * Actividades solo vivia embebida dentro del formulario de Proyecto
 * (tabla WBS/Nombre/Fase/Responsable/...); esta vista no la reemplaza,
 * es un complemento para ver/filtrar/actuar sobre actividades sin tener
 * que abrir cada proyecto uno por uno.
 *
 * Consume:
 *   GET   /api/v1/actividades            (listado global con filtros)
 *   GET   /api/v1/proyectos              (catalogo para filtro)
 *   GET   /api/v1/usuarios               (catalogo para filtro/responsable)
 *   PUT   /api/v1/actividades/{id}       (editar)
 *   DELETE /api/v1/actividades/{id}
 *   PUT   /api/v1/actividades/{id}/avance
 *   PUT   /api/v1/actividades/{id}/reprogramar
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Actividades</span>
</nav>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Actividades</h1>
        <p class="cf-listado-subtitle">Listado de actividades de todos tus proyectos, con filtros y acciones rápidas.</p>
    </div>
</div>

<ul class="nav nav-tabs cf-proy-tabs mb-3" id="cfActTabs">
    <li class="nav-item">
        <button type="button" class="nav-link active" id="cfActTabBtnListado" data-acttab="listado">
            <i class="bi bi-list-task"></i> Listado
        </button>
    </li>
    <li class="nav-item">
        <button type="button" class="nav-link" id="cfActTabBtnGantt" data-acttab="gantt">
            <i class="bi bi-bar-chart-steps"></i> Gantt General
        </button>
    </li>
    <li class="nav-item">
        <button type="button" class="nav-link" id="cfActTabBtnDashboard" data-acttab="dashboard">
            <i class="bi bi-pie-chart"></i> Dashboard
        </button>
    </li>
</ul>

<div id="cfActTabPaneListado">

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-field-row-3">
            <div class="cf-field-group">
                <label class="cf-label">Proyecto</label>
                <select id="cfFiltroProyecto" class="cf-input" style="cursor:pointer"></select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Responsable</label>
                <select id="cfFiltroResponsable" class="cf-input" style="cursor:pointer"></select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Estado</label>
                <select id="cfFiltroEstado" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="COMPLETADA">Completada</option>
                    <option value="CANCELADA">Cancelada</option>
                </select>
            </div>
        </div>
        <div class="cf-field-row" style="margin-top:12px;margin-bottom:0;align-items:center">
            <div class="cf-field-group">
                <label class="cf-checkbox-card">
                    <input type="checkbox" id="cfFiltroVencidas">
                    <span class="cf-checkbox-indicator"></span>
                    <span class="cf-checkbox-text">Solo vencidas</span>
                </label>
            </div>
            <div class="cf-field-group" style="flex-direction:row;gap:8px;align-items:flex-end;justify-content:flex-end">
                <button type="button" class="cf-btn-primary" id="btnFiltrarActividades"><i class="bi bi-search"></i> Buscar</button>
                <button type="button" class="cf-btn-secondary" id="btnLimpiarFiltrosActividades" title="Limpiar"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarActividades" placeholder="Buscar actividad, proyecto, WBS...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaActividades" style="width:100%">
            <thead>
                <tr>
                    <th>Proyecto</th>
                    <th>WBS</th>
                    <th>Nombre</th>
                    <th>Fase</th>
                    <th>Responsable</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Avance</th>
                    <th>Estado</th>
                    <th class="text-center">Hito</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

</div>
</div>

<!-- ============================================================ -->
<!-- GANTT GENERAL (solo lectura, todas las actividades de proyectos activos) -->
<!-- ============================================================ -->
<div class="cf-card" id="cfActTabPaneGantt" style="display:none">
    <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
        <div class="cf-gantt-leyenda">
            <span class="form-text mb-0">Cada color representa un proyecto distinto. Solo se incluyen proyectos activos (no Cerrados ni Cancelados).</span>
            <span class="cf-gantt-chip" style="background:#B91C1C"></span> Vencida
            <span class="cf-gantt-chip" style="background:#B45309"></span> Terminada fuera de tiempo
        </div>
        <select id="cfActGanttModoVista" class="form-select form-select-sm" style="width:auto">
            <option value="Day">Día</option>
            <option value="Week" selected>Semana</option>
            <option value="Month">Mes</option>
        </select>
    </div>
    <div id="cfActGanttLeyendaProyectos" class="mb-2"></div>
    <div id="cfActGanttContenedor"></div>
</div>

<!-- ============================================================ -->
<!-- DASHBOARD GENERAL (proyectos activos) -->
<!-- ============================================================ -->
<div id="cfActTabPaneDashboard" style="display:none">
    <div class="row g-3">
        <div class="col-md-4">
            <div class="cf-dash-box text-center cf-dash-box-donut">
                <div class="cf-dash-box-titulo">% AVANCE PROMEDIO (PROYECTOS ACTIVOS)</div>
                <div class="cf-dash-donut-centro">
                    <div class="cf-dash-donut-wrap">
                        <canvas id="cfActChartAvancePromedio"></canvas>
                    </div>
                    <div id="cfActChartAvancePromedioLabel" class="cf-dash-donut-label"></div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="cf-dash-box">
                <div class="cf-dash-box-titulo text-center">PROYECTOS ACTIVOS</div>
                <div class="cf-dash-kpi cf-dash-kpi-oscuro" id="cfActDashTotalProyectos">—</div>
                <div class="text-center mt-3 mb-1" style="font-size:0.8rem">Actividades vencidas</div>
                <div class="cf-dash-kpi" style="background:#EF4444;color:#fff" id="cfActDashVencidas">—</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="cf-dash-box">
                <div class="cf-dash-box-titulo text-center">TAREAS POR ESTADO (TODOS LOS PROYECTOS ACTIVOS)</div>
                <canvas id="cfActChartTareasEstado" height="220"></canvas>
            </div>
        </div>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frappe-gantt@1/dist/frappe-gantt.css">
<style>
    #cfActGanttContenedor .gantt-container { max-height: 70vh; overflow-y: auto; }
    #cfActGanttContenedor .bar-vencida-general .bar { fill: #B91C1C !important; stroke: #7F1D1D !important; stroke-width: 2px; }
    #cfActGanttContenedor .bar-vencida-general .bar-label { fill: #fff !important; font-weight: 700; }
    #cfActGanttContenedor .bar-terminada-vencida-general .bar { fill: #B45309 !important; stroke: #78350F !important; stroke-width: 2px; }
    #cfActGanttContenedor .bar-terminada-vencida-general .bar-label { fill: #fff !important; font-weight: 700; }

    /* Tabs Listado/Gantt/Dashboard -- mismo estilo que proyectos/index.php */
    .cf-proy-tabs .nav-link { border: 1px solid transparent; border-bottom: none; color: #6B7280; font-weight: 600; font-size: 0.85rem; background: transparent; padding: 8px 16px; }
    .cf-proy-tabs .nav-link.active { color: #0B1F47; border-color: #DEE2E6; border-bottom: 2px solid #fff; background: #fff; }

    .cf-gantt-leyenda { font-size: 0.78rem; color: #6B7280; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .cf-gantt-chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-left: 10px; }
    .cf-gantt-chip:first-child { margin-left: 0; }

    /* Cajas del Dashboard general -- mismo estilo que proyectos/index.php */
    .cf-dash-box { background: #F5F7FA; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; height: 100%; }
    .cf-dash-box-titulo { font-size: 0.72rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 8px; }
    .cf-dash-box-donut { display: flex; flex-direction: column; height: 100%; }
    .cf-dash-donut-centro { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .cf-dash-donut-wrap { width: 220px; height: 220px; margin: 0 auto; position: relative; }
    .cf-dash-donut-label { margin-top: -136px; margin-bottom: 108px; font-size: 2rem; font-weight: 800; color: #1A2332; }
    .cf-dash-kpi { border-radius: 8px; padding: 14px; text-align: center; font-size: 1.8rem; font-weight: 800; margin-top: 8px; }
    .cf-dash-kpi-oscuro { background: #0B1F47; color: #fff; }
</style>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/frappe-gantt@1/dist/frappe-gantt.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/actividades.js"></script>
