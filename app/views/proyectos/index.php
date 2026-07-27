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
                    <th style="width:16%">Nombre *</th>
                    <th style="width:15%">Descripción</th>
                    <th style="width:12%">Responsable</th>
                    <th style="width:9%">Inicio</th>
                    <th style="width:9%">Fin</th>
                    <th style="width:10%">Estado</th>
                    <th style="width:6%" class="text-center">Hito</th>
                    <th style="width:15%" class="text-end">Acciones</th>
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
            <button type="button" class="btn btn-cf-secondary" id="btnCerrarGantt">Cerrar</button>
        </div>
    </div>
    <div class="cf-gantt-leyenda mb-2">
        <span class="cf-gantt-chip" style="background:#0B1F47"></span> Planeado
        <span class="cf-gantt-chip" style="background:#10B981"></span> Avance
        <span class="cf-gantt-chip" style="background:#EF4444"></span> Ruta crítica
        <span class="cf-gantt-chip" style="background:#F59E0B"></span> Hito
        <span class="cf-gantt-chip" style="background:#B91C1C"></span> Vencida
    </div>
    <div id="cfGanttContenedor"></div>
    <div id="cfGanttFestivosLista" class="mt-3"></div>
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
    #cfGanttContenedor .bar-progress { fill: #10B981 !important; }
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
</style>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/frappe-gantt@1/dist/frappe-gantt.umd.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/proyectos.js"></script>
