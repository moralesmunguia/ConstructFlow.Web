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

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Centro de Alertas</h1>
        <p class="cf-listado-subtitle">Alertas generadas por el sistema (KPIs, proyectos) y manuales, con su seguimiento.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnRevisarAlertas"><i class="bi bi-arrow-repeat"></i> Revisar alertas ahora</button>
        <button type="button" class="cf-btn-primary" id="btnNuevaAlerta"><i class="bi bi-plus-lg"></i> Nueva Alerta</button>
    </div>
</div>

<div class="cf-resumen-grid">
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF2F2;color:#EF4444;">
            <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenAlta">—</span>
            <span class="cf-resumen-label">Alta</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF3C7;color:#F59E0B;">
            <i class="bi bi-exclamation-circle-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenMedia">—</span>
            <span class="cf-resumen-label">Media</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#DBEAFE;color:#0B69D4;">
            <i class="bi bi-info-circle-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenBaja">—</span>
            <span class="cf-resumen-label">Baja</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-bell-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenTotal">—</span>
            <span class="cf-resumen-label">Total abiertas</span>
        </div>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-field-row-3">
            <div class="cf-field-group">
                <label class="cf-label">Estado</label>
                <select id="cfFiltroEstadoAlerta" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                    <option value="ABIERTA">Abierta</option>
                    <option value="EN_REVISION">En revisión</option>
                    <option value="RESUELTA">Resuelta</option>
                    <option value="DESCARTADA">Descartada</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Prioridad</label>
                <select id="cfFiltroPrioridadAlerta" class="cf-input" style="cursor:pointer">
                    <option value="">Todas</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Proyecto</label>
                <select id="cfFiltroProyectoAlerta" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                </select>
            </div>
        </div>
        <div class="cf-field-row" style="margin-top:12px;margin-bottom:0">
            <div class="cf-field-group cf-field-full" style="flex-direction:row;gap:8px;justify-content:flex-end">
                <button type="button" class="cf-btn-primary" id="btnFiltrarAlertas"><i class="bi bi-search"></i> Buscar</button>
                <button type="button" class="cf-btn-secondary" id="btnLimpiarFiltrosAlertas" title="Limpiar"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarAlertas" placeholder="Buscar título, tipo, proyecto...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaAlertas" style="width:100%">
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
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/alertas.js"></script>
