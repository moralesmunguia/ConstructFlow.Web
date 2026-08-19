<?php
/**
 * Vista: costos/index.php
 * Ref: DEF-WEB-009 - API Costos.
 *
 * Consume:
 *   GET    /api/v1/proyectos
 *   GET    /api/v1/proyectos/{id}/costos
 *   POST   /api/v1/proyectos/{id}/costos
 *   PUT    /api/v1/costos/{id}
 *   DELETE /api/v1/costos/{id}
 *   GET    /api/v1/proyectos/{id}/presupuesto
 *   POST   /api/v1/proyectos/{id}/presupuesto
 *   PUT    /api/v1/proyectos/{id}/presupuesto
 *   GET    /api/v1/proyectos/{id}/costos/resumen
 *   GET    /api/v1/proyectos/{id}/costos/categorias
 */
?>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<style>
    .cf-costos-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }
    .cf-costos-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .cf-presupuesto-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .cf-presupuesto-item {
        display: grid;
        grid-template-columns: 54px 1fr auto;
        gap: 10px;
        align-items: center;
        padding: 10px 12px;
        border: 1px solid #F1F5F9;
        border-radius: 8px;
        background: #FAFBFC;
    }
    .cf-presupuesto-code {
        font-weight: 800;
        color: #0B1F47;
        font-size: 0.78rem;
    }
    .cf-presupuesto-name {
        color: #475569;
        font-size: 0.82rem;
    }
    .cf-presupuesto-value {
        font-weight: 800;
        color: #0B1F47;
        white-space: nowrap;
    }
    .cf-progress-track {
        height: 8px;
        border-radius: 999px;
        background: #E2E8F0;
        overflow: hidden;
        margin-top: 5px;
    }
    .cf-progress-bar {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: #10B981;
    }
    .cf-empty-state {
        color: #94A3B8;
        text-align: center;
        padding: 24px 12px;
        font-size: 0.9rem;
    }
    @media (max-width: 992px) {
        .cf-costos-grid { grid-template-columns: 1fr; }
    }
    .cf-autocomplete {
        position: relative;
    }
    .cf-autocomplete-list {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        max-height: 280px;
        overflow-y: auto;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
        z-index: 1050;
    }
    .cf-autocomplete-list.show {
        display: block;
    }
    .cf-autocomplete-item {
        padding: 9px 14px;
        cursor: pointer;
        font-size: 0.88rem;
        color: #0B1F47;
    }
    .cf-autocomplete-item:hover,
    .cf-autocomplete-item.active {
        background: #EEF2FF;
    }
    .cf-autocomplete-item .cf-autocomplete-codigo {
        font-weight: 700;
        margin-right: 6px;
    }
    .cf-autocomplete-empty {
        padding: 12px 14px;
        color: #94A3B8;
        font-size: 0.85rem;
        text-align: center;
    }
    #cfCardBuscadorProyecto {
        /* .cf-card trae overflow:hidden globalmente, lo que recorta
           el listado desplegable del autocompletado. Se sobreescribe
           solo en esta tarjeta. */
        overflow: visible;
    }
</style>

<div class="cf-listado-container">
    <div class="cf-listado-header">
        <div>
            <h1 class="cf-listado-title">Costos</h1>
            <p class="cf-listado-subtitle">Costos reales, presupuesto por categoria y resumen financiero del proyecto.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button type="button" class="cf-btn-secondary" id="btnRefrescarCostos"><i class="bi bi-arrow-repeat"></i> Actualizar</button>
        </div>
    </div>

    <div class="cf-card" id="cfCardBuscadorProyecto" style="margin-bottom:16px">
        <div class="cf-card-body">
            <div class="cf-field-row" style="margin-bottom:0;align-items:end">
                <div class="cf-field-group cf-field-full">
                    <label class="cf-label">Proyecto</label>
                    <div class="cf-autocomplete" id="cfProyectoCostosWrap">
                        <input type="text" id="cfProyectoCostosInput" class="cf-input" placeholder="Busca por codigo o nombre de proyecto..." autocomplete="off">
                        <input type="hidden" id="cfProyectoCostos">
                        <div class="cf-autocomplete-list" id="cfProyectoCostosList"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="cf-resumen-grid">
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#DBEAFE;color:#0B69D4;">
                <i class="bi bi-wallet2"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoPresupuesto">--</span>
                <span class="cf-resumen-label">Precio de venta</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#FEE2E2;color:#EF4444;">
                <i class="bi bi-cash-stack"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoReal">--</span>
                <span class="cf-resumen-label">Costo real</span>
            </div>
        </div>
            <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#D1FAE5;color:#10B981;">
                <i class="bi bi-graph-up-arrow"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoUtilidad">--</span>
                <span class="cf-resumen-label">Rentabilidad (%)</span>
                <span class="cf-resumen-label" id="cfCostoRentabilidadMonto">--</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#FFF7ED;color:#FB923C;">
                <i class="bi bi-arrow-left-right"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoDesviacion">--</span>
                <span class="cf-resumen-label">Costo real</span>
            </div>
        </div>
        <div class="cf-resumen-card" id="cardCostoEstimado" style="cursor:pointer" title="Ver desglose del costo estimado">
            <div class="cf-resumen-icon" style="background:#F8FAFC;color:#0B1F47;">
                <i class="bi bi-calculator"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoEstimado">--</span>
                <span class="cf-resumen-label">Costo estimado</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#F8FAFC;color:#0B1F47;">
                <i class="bi bi-sliders"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfCostoDesviacionPorcentaje">--</span>
                <span class="cf-resumen-label">Desviacion (%)</span>
            </div>
        </div>
    </div>

    <div class="cf-costos-grid">
        <div class="cf-card">
            <div class="cf-card-header" style="justify-content:space-between">
                <div style="display:flex;align-items:center;gap:10px">
                    <div class="cf-card-icon" style="background:#F8FAFC;color:#0B1F47;">
                        <i class="bi bi-journal-plus"></i>
                    </div>
                    <span class="cf-card-title">Costo real por categoria</span>
                </div>
                <div>
                    <button type="button" class="cf-btn-secondary" id="btnRefrescarCaptura">Actualizar</button>
                </div>
            </div>
            <div class="cf-card-body">
                <div class="cf-table-wrap">
                    <table class="cf-table" id="cfTablaCapturaPorCategoria" style="width:100%">
                        <thead>
                            <tr>
                                <th>Codigo</th>
                                <th>Categoria</th>
                                <th>Costo real</th>
                                <th class="text-end" style="width:140px">Accion</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Presupuesto panel removed because budgets are not managed -->
    </div>

    <div class="cf-card cf-card-table">
        <div class="cf-table-toolbar">
            <div class="cf-table-search">
                <i class="bi bi-search"></i>
                <input type="text" id="cfBuscarCostos" placeholder="Buscar concepto, categoria, actividad...">
            </div>
        </div>
        <div class="cf-table-wrap">
            <table class="cf-table" id="cfTablaCostos" style="width:100%">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Categoria</th>
                        <th>Concepto</th>
                        <th>Actividad</th>
                        <th>Proveedor</th>
                        <th>Importe</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="modalCosto" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content cf-modal">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#EEF2FF;color:#0B1F47;">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div>
                        <h5 class="cf-modal-title" id="modalCostoTitulo">Nuevo costo</h5>
                        <span class="cf-modal-subtitle">Costo real asociado al proyecto seleccionado</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <form id="formCosto">
                <div class="cf-modal-body">
                    <input type="hidden" id="cfCostoID">
                    <div class="cf-field-row">
                        <div class="cf-field-group">
                            <label class="cf-label">Categoria <span class="cf-required">*</span></label>
                            <select class="cf-input" id="cfCostoCategoria" required></select>
                        </div>
                        <div class="cf-field-group">
                            <label class="cf-label">Fecha <span class="cf-required">*</span></label>
                            <input type="date" class="cf-input" id="cfCostoFecha" required>
                        </div>
                    </div>
                    <div class="cf-field-row">
                        <div class="cf-field-group cf-field-full">
                            <label class="cf-label">Concepto <span class="cf-required">*</span></label>
                            <input type="text" class="cf-input" id="cfCostoConcepto" maxlength="250" required>
                        </div>
                    </div>
                    <div class="cf-field-row">
                        <div class="cf-field-group">
                            <label class="cf-label">Importe <span class="cf-required">*</span></label>
                            <div class="cf-input-prefix">
                                <span class="cf-prefix">$</span>
                                <input type="number" class="cf-input" id="cfCostoImporte" min="0.01" step="0.01" required>
                            </div>
                        </div>
                        <div class="cf-field-group">
                            <label class="cf-label">Actividad</label>
                            <select class="cf-input" id="cfCostoActividad">
                                <option value="">Sin actividad</option>
                            </select>
                        </div>
                    </div>
                    <div class="cf-field-row">
                        <div class="cf-field-group">
                            <label class="cf-label">Proveedor</label>
                            <div style="display:flex;gap:6px">
                                <select class="cf-input" id="cfCostoProveedor" style="flex:1">
                                    <option value="">Sin proveedor</option>
                                </select>
                                <button type="button" class="cf-btn-secondary" id="btnNuevoProveedor" title="Nuevo proveedor"><i class="bi bi-plus-lg"></i></button>
                            </div>
                        </div>
                        <div class="cf-field-group">
                            <label class="cf-label">Observaciones</label>
                            <input type="text" class="cf-input" id="cfCostoObservaciones" maxlength="500">
                        </div>
                    </div>
                </div>
                <div class="cf-modal-footer">
                    <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="cf-btn-primary"><i class="bi bi-save"></i> Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="modalPresupuesto" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content cf-modal">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#FEF3C7;color:#D97706;">
                        <i class="bi bi-calculator"></i>
                    </div>
                    <div>
                        <h5 class="cf-modal-title">Presupuesto por categoria</h5>
                        <span class="cf-modal-subtitle">Importes base para medir variaciones contra costo real</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <form id="formPresupuesto">
                <div class="cf-modal-body">
                    <div class="cf-field-row-3" style="margin-bottom:16px">
                        <div class="cf-field-group">
                            <label class="cf-label">Nombre</label>
                            <input type="text" class="cf-input" id="cfPresupuestoNombre" maxlength="200" value="Presupuesto del proyecto">
                        </div>
                        <div class="cf-field-group">
                            <label class="cf-label">Version</label>
                            <input type="text" class="cf-input" id="cfPresupuestoVersion" maxlength="20" value="1.0">
                        </div>
                        <div class="cf-field-group">
                            <label class="cf-label">Estado</label>
                            <select class="cf-input" id="cfPresupuestoEstado">
                                <option value="ACTIVO">Activo</option>
                                <option value="BORRADOR">Borrador</option>
                                <option value="APROBADO">Aprobado</option>
                            </select>
                        </div>
                    </div>
                    <div class="cf-table-wrap">
                        <table class="cf-table" id="cfTablaPresupuesto" style="width:100%">
                            <thead>
                                <tr>
                                    <th>Codigo</th>
                                    <th>Categoria</th>
                                    <th>Concepto</th>
                                    <th>Importe</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                            <tfoot>
                                <tr>
                                    <th colspan="3" class="text-end">Total</th>
                                    <th id="cfPresupuestoTotal">$0.00</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="cf-modal-footer">
                    <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="cf-btn-primary"><i class="bi bi-save"></i> Guardar presupuesto</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="modalCostoEstimado" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content cf-modal">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#F8FAFC;color:#0B1F47;">
                        <i class="bi bi-calculator"></i>
                    </div>
                    <div>
                        <h5 class="cf-modal-title">Desglose del costo estimado</h5>
                        <span class="cf-modal-subtitle">Partidas de la cotizacion del proyecto</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="cf-modal-body">
                <div class="cf-table-wrap">
                    <table class="cf-table" id="cfTablaCostoEstimado" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Descripcion</th>
                                <th class="text-end">Cantidad</th>
                                <th class="text-end">Costo unitario</th>
                                <th class="text-end">Costo estimado</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                        <tfoot>
                            <tr>
                                <th colspan="4" class="text-end">Total</th>
                                <th class="text-end" id="cfCostoEstimadoModalTotal">$0.00</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div class="cf-modal-footer">
                <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/costos.js"></script>
