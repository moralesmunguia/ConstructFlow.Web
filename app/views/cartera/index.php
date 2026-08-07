<?php
/**
 * Vista: cartera/index.php
 * Ref: DEF-WEB-006 (API Cartera) -- el API ya estaba 100% implementado
 * (CarteraController/CarteraService/CuentaCobrarRepository); esta vista es
 * la parte Web que faltaba: dashboard financiero + antiguedad + listado.
 *
 * Consume:
 *   GET /api/v1/cartera?cliente_id=&proyecto_id=&estado=&vencidas=  -> CarteraController::index()
 *   GET /api/v1/cartera/antiguedad?cliente_id=&proyecto_id=          -> CarteraController::antiguedad()
 *   GET /api/v1/dashboard/facturacion                                -> CarteraController::dashboardFacturacion()
 *   GET /api/v1/clientes                                             -> ClienteController::index() (catalogo filtro)
 *   GET /api/v1/proyectos                                            -> ProyectoController::index() (catalogo filtro)
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Cartera</span>
</nav>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Cartera</h1>
        <p class="cf-listado-subtitle">Cuentas por cobrar, antigüedad de saldos y dashboard financiero.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnGenerarAlertasCartera"><i class="bi bi-bell"></i> Generar alertas</button>
        <button type="button" class="cf-btn-secondary" id="btnRefrescarCartera"><i class="bi bi-arrow-repeat"></i> Actualizar</button>
    </div>
</div>

<div class="cf-resumen-grid">
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#DBEAFE;color:#0B69D4;">
            <i class="bi bi-receipt"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenFacturacionMes">—</span>
            <span class="cf-resumen-label">Facturación del mes</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#D1FAE5;color:#10B981;">
            <i class="bi bi-cash-coin"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenCobranzaMes">—</span>
            <span class="cf-resumen-label">Cobranza del mes</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF3C7;color:#F59E0B;">
            <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenSaldoPendiente">—</span>
            <span class="cf-resumen-label">Saldo pendiente</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEE2E2;color:#EF4444;">
            <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenCarteraVencida">—</span>
            <span class="cf-resumen-label">Cartera vencida</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-graph-up-arrow"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenIndiceRecuperacion">—</span>
            <span class="cf-resumen-label">Índice de recuperación</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#F5F7FA;color:#0B1F47;">
            <i class="bi bi-calendar-check"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenDiasPromedioCobro">—</span>
            <span class="cf-resumen-label">Días promedio de cobro</span>
        </div>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <h2 class="cf-card-title" style="margin-bottom:12px">Antigüedad de saldos</h2>
        <div class="cf-table-wrap">
            <table class="cf-table" id="cfTablaAntiguedad" style="width:100%">
                <thead>
                    <tr>
                        <th>Rango</th>
                        <th>Facturas</th>
                        <th>Saldo</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-field-row-3">
            <div class="cf-field-group">
                <label class="cf-label">Cliente</label>
                <select id="cfFiltroClienteCartera" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Proyecto</label>
                <select id="cfFiltroProyectoCartera" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Estado</label>
                <select id="cfFiltroEstadoCartera" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Parcialmente Pagada">Parcialmente Pagada</option>
                </select>
            </div>
        </div>
        <div class="cf-field-row" style="margin-top:12px;margin-bottom:0">
            <div class="cf-field-group">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="cfFiltroVencidasCartera">
                    <label class="form-check-label" for="cfFiltroVencidasCartera">Solo vencidas</label>
                </div>
            </div>
            <div class="cf-field-group cf-field-full" style="flex-direction:row;gap:8px;justify-content:flex-end">
                <button type="button" class="cf-btn-primary" id="btnFiltrarCartera"><i class="bi bi-search"></i> Buscar</button>
                <button type="button" class="cf-btn-secondary" id="btnLimpiarFiltrosCartera" title="Limpiar"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarCartera" placeholder="Buscar cliente, proyecto, folio...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaCartera" style="width:100%">
            <thead>
                <tr>
                    <th></th>
                    <th>Factura</th>
                    <th>Fecha</th>
                    <th style="min-width:170px">Cliente</th>
                    <th style="min-width:170px">Proyecto</th>
                    <th>No. Contrato</th>
                    <th>Importe</th>
                    <th>Saldo</th>
                    <th>Vencimiento</th>
                    <th>Días vencidos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
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
<script src="<?= BASE_URL ?>/public/js/cartera.js"></script>
