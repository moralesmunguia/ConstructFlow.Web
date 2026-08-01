<?php
/**
 * Vista: proyectos/index.php
 * Ref: DEF-WEB-003 (API Proyectos) + DEF-WEB-000 (Estándares Frontend).
 *
 * Gestión de Proyectos: listado, alta/edición general, detalle (dashboard/
 * indicadores/fases/encargados/facturación), cambio de estado, registro de
 * contrato, impresión y eliminación.
 *
 * Consume:
 *   GET    {API_BASE_URL}/proyectos
 *   POST   {API_BASE_URL}/proyectos
 *   GET    {API_BASE_URL}/proyectos/{id}
 *   PUT    {API_BASE_URL}/proyectos/{id}
 *   GET    {API_BASE_URL}/proyectos/{id}/dashboard
 *   GET    {API_BASE_URL}/proyectos/{id}/indicadores
 *   GET    {API_BASE_URL}/proyectos/{id}/fases
 *   GET    {API_BASE_URL}/proyectos/{id}/encargados
 *   GET    {API_BASE_URL}/proyectos/{id}/facturacion
 *   GET    {API_BASE_URL}/proyectos/{id}/pdf
 *   PUT    {API_BASE_URL}/proyectos/{id}/estado
 *   PUT    {API_BASE_URL}/proyectos/{id}/contrato
 *   DELETE {API_BASE_URL}/proyectos/{id}
 *
 * El token JWT se adjunta automáticamente vía interceptor de Axios (app.js).
 */
?>
<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Proyectos</h1>
        <p class="cf-page-subtitle">Listado de proyectos en ejecución y su seguimiento.</p>
    </div>
    <div>
        <button type="button" class="btn btn-cf-primary" id="btnNuevoProyecto">
            <i class="bi bi-plus-lg"></i> Nuevo Proyecto
        </button>
    </div>
</div>

<!-- ============================================================ -->
<!-- LISTADO -->
<!-- ============================================================ -->
<div id="cfCardListado">

    <!-- ============ FILTROS ============ -->
    <div class="cf-card mb-3">
        <div class="row g-3 align-items-end">
            <div class="col-md-3">
                <label class="form-label">Cliente</label>
                <select id="fClienteID" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Responsable</label>
                <select id="fResponsableID" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Estado</label>
                <select id="fEstado" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="col-md-3">
                <button type="button" class="btn btn-cf-primary w-100" id="btnFiltrar">
                    <i class="bi bi-funnel"></i> Filtrar
                </button>
            </div>
        </div>
    </div>

    <div class="cf-card cf-card-table">
        <div class="table-responsive">
            <table id="tblProyectos" class="table cf-table w-100">
                <thead>
                    <tr>
                    <th>Folio</th>
                    <th>Nombre / Descripción</th>
                    <th>Cliente</th>
                    <th>OC / Contrato</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Avance</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin Estimada</th>
                        <th class="text-end">Acciones</th>
                </tr>
                </thead>
                <tbody>
                    <!-- Filas cargadas dinámicamente por proyectos.js -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- ============================================================ -->
<!-- FORMULARIO (Nuevo / Editar) -->
<!-- ============================================================ -->
<div class="cf-card" id="cfCardFormulario" style="display:none">
    <div class="cf-page-header">
        <h2 class="cf-form-titulo" id="cfFormTitulo">Nuevo Proyecto</h2>
        <div class="cf-page-actions">
            <button type="button" class="btn btn-cf-secondary" id="btnCancelarFormularioProyecto">Cancelar</button>
            <button type="button" class="btn btn-cf-primary" id="btnGuardarProyecto">
                <i class="bi bi-save"></i> Guardar
            </button>
        </div>
    </div>

    <div class="row g-3 mt-1">
        <div class="col-md-6">
            <label class="form-label">Cliente *</label>
            <select id="cfClienteID" class="form-select">
                <option value="">Selecciona un cliente</option>
            </select>
        </div>
        <div class="col-md-6">
            <label class="form-label">Responsable</label>
            <select id="cfResponsableID" class="form-select">
                <option value="">Selecciona un responsable</option>
            </select>
        </div>

        <div class="col-md-8">
            <label class="form-label">Nombre del Proyecto *</label>
            <input type="text" id="cfNombreProyecto" class="form-control" placeholder="Ej. Remodelación planta baja">
        </div>
        <div class="col-md-4">
            <label class="form-label">Tipo de Proyecto</label>
            <input type="text" id="cfTipoProyecto" class="form-control" value="Construccion">
        </div>

        <div class="col-md-4">
            <label class="form-label">OC / Contrato</label>
            <input type="text" id="cfNumeroContrato" class="form-control" placeholder="Opcional al crear">
        </div>
        <div class="col-md-4">
            <label class="form-label">Fecha de Inicio</label>
            <input type="date" id="cfFechaInicio" class="form-control">
        </div>
        <div class="col-md-4">
            <label class="form-label">Fecha de Fin (estimada)</label>
            <input type="date" id="cfFechaFin" class="form-control">
        </div>

        <div class="col-md-12">
            <label class="form-label">Ubicación</label>
            <input type="text" id="cfUbicacionProyecto" class="form-control" placeholder="Dirección / ubicación de la obra">
        </div>

        <div class="col-md-6">
            <label class="form-label">Descripción</label>
            <textarea id="cfDescripcion" class="form-control" rows="3"></textarea>
        </div>
        <div class="col-md-6">
            <label class="form-label">Observaciones</label>
            <textarea id="cfObservacionesProyecto" class="form-control" rows="3"></textarea>
        </div>
    </div>

    <div class="cf-form-seccion-header d-flex justify-content-between align-items-center mt-4 mb-2">
        <h3 class="cf-form-seccion mb-0">Actividades</h3>
        <button type="button" class="btn btn-cf-secondary btn-sm" id="btnAgregarActividadProyecto">
            <i class="bi bi-plus-lg"></i> Agregar actividad
        </button>
    </div>
    <div class="form-text mb-2" id="cfActividadesNota" style="display:none">
        Guarda el proyecto primero para poder agregar actividades.
    </div>
    <div class="table-responsive">
        <table class="table cf-table" id="cfTablaActividadesProyecto">
            <thead>
                <tr>
                    <th style="width:8%">WBS</th>
                    <th style="width:14%">Nombre *</th>
                    <th style="width:12%">Descripción</th>
                    <th style="width:12%">Fase</th>
                    <th style="width:11%">Responsable</th>
                    <th style="width:8%">Inicio</th>
                    <th style="width:8%">Fin</th>
                    <th style="width:9%">Estado</th>
                    <th style="width:5%" class="text-center">Hito</th>
                    <th style="width:13%" class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody><!-- filas dinámicas --></tbody>
        </table>
    </div>
</div>

<!-- ============================================================ -->
<!-- GANTT (solo lectura) -->
<!-- ============================================================ -->
<div class="cf-card" id="cfCardGantt" style="display:none">
    <div class="cf-page-header">
        <h2 class="cf-form-titulo" id="cfGanttTitulo">Gantt</h2>
        <div class="cf-page-actions">
            <select id="cfGanttModoVista" class="form-select form-select-sm" style="width:auto">
                <option value="Day" selected>Día</option>
                <option value="Week">Semana</option>
                <option value="Month">Mes</option>
            </select>
            <button type="button" class="btn btn-cf-secondary" id="btnGestionarDependencias">
                <i class="bi bi-diagram-3"></i> Dependencias
            </button>
            <button type="button" class="btn btn-cf-secondary" id="btnCerrarGantt">Cerrar</button>
        </div>
    </div>

    <ul class="nav nav-tabs cf-proy-tabs mb-3" id="cfGanttTabs">
        <li class="nav-item">
            <button type="button" class="nav-link active" id="cfTabBtnGantt" data-tab="gantt">
                <i class="bi bi-bar-chart-steps"></i> Gantt
            </button>
        </li>
        <li class="nav-item">
            <button type="button" class="nav-link" id="cfTabBtnDashboard" data-tab="dashboard">
                <i class="bi bi-pie-chart"></i> Dashboard
            </button>
        </li>
    </ul>

    <div id="cfGanttTabPane">
        <div class="cf-gantt-leyenda mb-2">
            <span class="cf-gantt-chip" style="background:#0B1F47"></span> Planeado
            <span class="cf-gantt-chip" style="background:#10B981"></span> Avance
            <span class="cf-gantt-chip" style="background:#EF4444"></span> Ruta crítica
            <span class="cf-gantt-chip" style="background:#F59E0B"></span> Hito
            <span class="cf-gantt-chip" style="background:#B91C1C"></span> Vencida
        <span class="cf-gantt-chip" style="background:#B45309"></span> Terminada fuera de tiempo
        </div>
        <!-- Antes vivia despues de #cfGanttContenedor, hasta abajo de la
             pagina, escondida tras la barra de scroll horizontal del Gantt.
             Se movio junto a la leyenda para que siempre sea visible. -->
        <div id="cfGanttFestivosLista" class="mb-2"></div>
        <div id="cfGanttContenedor"></div>
    </div>

    <!-- Pestaña Dashboard: mismo estilo del reporte tipo Excel del cliente
         (% finalización total, días completos vs total, tareas por estado),
         pero por proyecto individual dentro del Gantt. -->
    <div id="cfProyDashboardTabPane" style="display:none">
        <div class="row g-3">
            <div class="col-md-4">
                <div class="cf-dash-box text-center cf-dash-box-donut">
                    <div class="cf-dash-box-titulo">% FINALIZACIÓN TOTAL DEL PROYECTO</div>
                    <div class="cf-dash-donut-centro">
                        <div class="cf-dash-donut-wrap">
                            <canvas id="cfChartAvanceProyecto"></canvas>
                        </div>
                        <div id="cfChartAvanceProyectoLabel" class="cf-dash-donut-label"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="cf-dash-box">
                    <div class="cf-dash-box-titulo text-center">DÍAS COMPLETOS VS TOTAL</div>
                    <div class="text-center mt-2 mb-1" style="font-size:0.8rem">Días concluidos</div>
                    <div class="cf-dash-kpi cf-dash-kpi-verde" id="cfDashDiasConcluidos">—</div>
                    <div class="text-center mt-3 mb-1" style="font-size:0.8rem">Total número días programados</div>
                    <div class="cf-dash-kpi cf-dash-kpi-oscuro" id="cfDashDiasTotal">—</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="cf-dash-box">
                    <div class="cf-dash-box-titulo text-center">TAREAS POR ESTADO</div>
                    <canvas id="cfChartTareasEstado" height="220"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frappe-gantt@1/dist/frappe-gantt.css">
<style>
    .cf-gantt-leyenda { font-size: 0.78rem; color: #6B7280; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .cf-gantt-chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-left: 10px; }
    .cf-gantt-chip:first-child { margin-left: 0; }
    #cfGanttContenedor .bar-critica .bar { fill: #EF4444 !important; }
    #cfGanttContenedor .bar-hito .bar { fill: #F59E0B !important; }
    #cfGanttContenedor .bar-vencida .bar { fill: #B91C1C !important; stroke: #7F1D1D !important; stroke-width: 2px; }
    #cfGanttContenedor .bar-vencida .bar-label { fill: #fff !important; font-weight: 700; }
    #cfGanttContenedor .bar-terminada-vencida .bar { fill: #B45309 !important; stroke: #78350F !important; stroke-width: 2px; }
    #cfGanttContenedor .bar-terminada-vencida .bar-label { fill: #fff !important; font-weight: 700; }
    #cfGanttContenedor .bar-progress { fill: #10B981 !important; }
    /* Filas mas compactas (bar_height/padding reducidos en JS) -- se achica
       tambien el texto de las barras para que siga viendose limpio con
       renglones mas angostos. */
    #cfGanttContenedor .bar-label, #cfGanttContenedor .bar-label.big { font-size: 10px; }
    /* La libreria trae su propio contenedor con scroll interno
       (.gantt-container). Antes solo se limitaba con max-height, por lo
       que con pocas actividades el Gantt se veia chico y dejaba una zona
       enorme de la pagina sin usar debajo. Ahora tambien se le da un
       min-height calculado por JS (verGantt) segun el espacio disponible
       del viewport, para que siempre ocupe el area visible aunque tenga
       pocas filas -- max-height sigue like tope con scroll propio cuando
       si hay muchas actividades. */
    #cfGanttContenedor .gantt-container { max-height: 78vh; overflow-y: auto; }
    #cfCardGantt { padding: 1rem 1.25rem; display: flex; flex-direction: column; }
    #cfCardGantt .cf-page-subtitle { display: none; }
    #cfGanttContenedor { flex: 1; }
    /* Tabs Gantt/Dashboard dentro de la tarjeta */
    .cf-proy-tabs .nav-link { border: 1px solid transparent; border-bottom: none; color: #6B7280; font-weight: 600; font-size: 0.85rem; background: transparent; padding: 8px 16px; }
    .cf-proy-tabs .nav-link.active { color: #0B1F47; border-color: #DEE2E6; border-bottom: 2px solid #fff; background: #fff; }
    /* Cajas del Dashboard por proyecto (mismo estilo del reporte Excel del cliente) */
    .cf-dash-box { background: #F5F7FA; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; height: 100%; }
    .cf-dash-box-titulo { font-size: 0.72rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 8px; }
    /* La caja de la dona centra su contenido vertical y horizontalmente
       para llenar el alto de la fila (antes quedaba pegado arriba con un
       area vacia grande abajo). La dona tambien se agrando. */
    /* La caja de la dona: titulo fijo arriba, y el bloque de la dona
       (cf-dash-donut-centro) se centra vertical y horizontalmente en el
       espacio restante de la caja (antes quedaba pegado arriba con una
       zona vacia grande abajo). La dona tambien se agrando. */
    .cf-dash-box-donut { display: flex; flex-direction: column; height: 100%; }
    .cf-dash-donut-centro { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .cf-dash-donut-wrap { width: 260px; height: 260px; margin: 0 auto; position: relative; }
    .cf-dash-donut-label { margin-top: -161px; margin-bottom: 128px; font-size: 2.2rem; font-weight: 800; color: #1A2332; }
    .cf-dash-kpi { border-radius: 8px; padding: 14px; text-align: center; font-size: 1.8rem; font-weight: 800; }
    .cf-dash-kpi-verde { background: #10B981; color: #fff; }
    .cf-dash-kpi-oscuro { background: #0B1F47; color: #fff; }
</style>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/frappe-gantt@1/dist/frappe-gantt.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/proyectos.js"></script>
