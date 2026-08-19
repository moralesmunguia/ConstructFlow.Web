<?php
/**
 * Vista: auditoria/index.php
 * Ref: DEF-WEB-022 (API Auditoría) -- bitácora de eventos del sistema,
 * solo lectura (la bitácora es inmutable, no hay editar/eliminar).
 *
 * Consume:
 *   GET /api/v1/auditoria                     (listado general)
 *   GET /api/v1/auditoria/usuarios/{id}
 *   GET /api/v1/auditoria/proyectos/{id}
 *   GET /api/v1/auditoria/modulos/{modulo}
 *   GET /api/v1/auditoria/eventos              (catálogo de acciones, combo)
 *   GET /api/v1/auditoria/{id}                 (detalle, modal)
 *   POST /api/v1/auditoria/exportar            (CSV, blob)
 *   GET /api/v1/usuarios                       (combo de filtro)
 *   GET /api/v1/proyectos                      (combo de filtro)
 */
?>
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Auditoría</h1>
        <p class="cf-listado-subtitle">Bitácora de eventos del sistema. Registro inmutable: solo consulta y exportación.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnExportarAuditoriaCsv"><i class="bi bi-file-earmark-spreadsheet"></i> Exportar CSV</button>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-form-row" style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">

            <div class="cf-form-group">
                <label for="cfFiltroUsuario">Usuario</label>
                <select id="cfFiltroUsuario" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="cf-form-group">
                <label for="cfFiltroModulo">Módulo</label>
                <select id="cfFiltroModulo" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="cf-form-group">
                <label for="cfFiltroProyecto">Proyecto</label>
                <select id="cfFiltroProyecto" class="form-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="cf-form-group">
                <label for="cfFiltroFechaDesde">Fecha desde</label>
                <input type="date" id="cfFiltroFechaDesde" class="form-control">
            </div>

            <div class="cf-form-group">
                <label for="cfFiltroFechaHasta">Fecha hasta</label>
                <input type="date" id="cfFiltroFechaHasta" class="form-control">
            </div>

            <div class="cf-form-group">
                <button type="button" class="cf-btn-primary" id="btnBuscarAuditoria"><i class="bi bi-search"></i> Buscar</button>
            </div>

        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-card-header">
        <h2 class="cf-card-title" style="margin:0">Bitácora</h2>
    </div>
    <table id="cfTablaAuditoria" class="cf-table" style="width:100%">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Entidad</th>
                <th>Acción</th>
                <th>Nivel</th>
                <th>IP</th>
                <th style="width:60px"></th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/auditoria.js"></script>
