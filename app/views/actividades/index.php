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

<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Actividades</h1>
        <p class="cf-page-subtitle">Listado de actividades de todos tus proyectos, con filtros y acciones rápidas.</p>
    </div>
</div>

<div class="cf-card mb-3">
    <div class="row g-2 align-items-end">
        <div class="col-md-3">
            <label class="form-label">Proyecto</label>
            <select id="cfFiltroProyecto" class="form-select form-select-sm"></select>
        </div>
        <div class="col-md-3">
            <label class="form-label">Responsable</label>
            <select id="cfFiltroResponsable" class="form-select form-select-sm"></select>
        </div>
        <div class="col-md-2">
            <label class="form-label">Estado</label>
            <select id="cfFiltroEstado" class="form-select form-select-sm">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
            </select>
        </div>
        <div class="col-md-2 form-check mt-4">
            <input type="checkbox" class="form-check-input" id="cfFiltroVencidas">
            <label class="form-check-label" for="cfFiltroVencidas">Solo vencidas</label>
        </div>
        <div class="col-md-2 d-flex gap-2">
            <button type="button" class="btn btn-cf-primary btn-sm w-100" id="btnFiltrarActividades"><i class="bi bi-search"></i> Buscar</button>
            <button type="button" class="btn btn-cf-secondary btn-sm" id="btnLimpiarFiltrosActividades" title="Limpiar"><i class="bi bi-x-lg"></i></button>
        </div>
    </div>
</div>

<div class="cf-card">
    <table class="table cf-table" id="cfTablaActividades" style="width:100%">
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

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/actividades.js"></script>
