<?php
/**
 * Vista: alertas/index.php
 * Ref: DEF-WEB-005 (API Alertas) -- Centro de Alertas. El API (AlertaController
 * /Service/Repository, ver DEF-N2-08 seccion 13) ya estaba 100% implementado;
 * esta vista es la parte Web que faltaba.
 *
 * Consume:
 *   GET   /api/v1/alertas?estado=&prioridad=&proyectoID=&tipoAlerta=
 *   GET   /api/v1/alertas/{id}
 *   POST  /api/v1/alertas               { TipoAlerta, Titulo, Mensaje, Prioridad, ProyectoID }
 *   PATCH /api/v1/alertas/{id}/estado   { "Estado": "EN_REVISION" }
 *   GET   /api/v1/dashboard/alertas     (resumen abiertas por prioridad)
 *   GET   /api/v1/proyectos             (catalogo para filtro/alta)
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Alertas</span>
</nav>

<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Centro de Alertas</h1>
        <p class="cf-page-subtitle">Alertas generadas por el sistema (KPIs, proyectos) y manuales, con su seguimiento.</p>
    </div>
    <div class="d-flex gap-2">
        <button type="button" class="btn btn-cf-secondary" id="btnRevisarAlertas"><i class="bi bi-arrow-repeat"></i> Revisar alertas ahora</button>
        <button type="button" class="btn btn-cf-primary" id="btnNuevaAlerta"><i class="bi bi-plus-lg"></i> Nueva Alerta</button>
    </div>
</div>

<div class="row g-2 mb-3" id="cfAlertasResumen">
    <div class="col-6 col-md-3">
        <div class="cf-alerta-resumen-box" style="border-left-color:#EF4444">
            <div class="cf-alerta-resumen-label">Alta</div>
            <div class="cf-alerta-resumen-valor" id="cfResumenAlta">—</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="cf-alerta-resumen-box" style="border-left-color:#F59E0B">
            <div class="cf-alerta-resumen-label">Media</div>
            <div class="cf-alerta-resumen-valor" id="cfResumenMedia">—</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="cf-alerta-resumen-box" style="border-left-color:#0B69D4">
            <div class="cf-alerta-resumen-label">Baja</div>
            <div class="cf-alerta-resumen-valor" id="cfResumenBaja">—</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="cf-alerta-resumen-box" style="border-left-color:#0B1F47">
            <div class="cf-alerta-resumen-label">Total abiertas</div>
            <div class="cf-alerta-resumen-valor" id="cfResumenTotal">—</div>
        </div>
    </div>
</div>

<div class="cf-card mb-3">
    <div class="row g-2 align-items-end">
        <div class="col-md-3">
            <label class="form-label">Estado</label>
            <select id="cfFiltroEstadoAlerta" class="form-select form-select-sm">
                <option value="">Todos</option>
                <option value="ABIERTA">Abierta</option>
                <option value="EN_REVISION">En revisión</option>
                <option value="RESUELTA">Resuelta</option>
                <option value="DESCARTADA">Descartada</option>
            </select>
        </div>
        <div class="col-md-3">
            <label class="form-label">Prioridad</label>
            <select id="cfFiltroPrioridadAlerta" class="form-select form-select-sm">
                <option value="">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
            </select>
        </div>
        <div class="col-md-3">
            <label class="form-label">Proyecto</label>
            <select id="cfFiltroProyectoAlerta" class="form-select form-select-sm">
                <option value="">Todos</option>
            </select>
        </div>
        <div class="col-md-3 d-flex gap-2">
            <button type="button" class="btn btn-cf-primary btn-sm w-100" id="btnFiltrarAlertas"><i class="bi bi-search"></i> Buscar</button>
            <button type="button" class="btn btn-cf-secondary btn-sm" id="btnLimpiarFiltrosAlertas" title="Limpiar"><i class="bi bi-x-lg"></i></button>
        </div>
    </div>
</div>

<div class="cf-card">
    <table class="table cf-table" id="cfTablaAlertas" style="width:100%">
        <thead>
            <tr>
                <th>Prioridad</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Proyecto / KPI</th>
                <th>Generada</th>
                <th>Atendida</th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>

<style>
    .cf-alerta-resumen-box { background: #F5F7FA; border: 1px solid #E5E7EB; border-left: 4px solid #6B7280; border-radius: 8px; padding: 10px 14px; }
    .cf-alerta-resumen-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #6B7280; }
    .cf-alerta-resumen-valor { font-size: 1.6rem; font-weight: 800; color: #1A2332; }
</style>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/alertas.js"></script>
