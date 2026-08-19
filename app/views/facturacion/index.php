<?php
/**
 * Vista: facturacion/index.php
 * Ref: DEF-WEB-016 / DEF-N2-06 Facturacion y Cobranza.
 *
 * Consume:
 *   GET    /api/v1/facturas
 *   POST   /api/v1/facturas
 *   PUT    /api/v1/facturas/{id}
 *   POST   /api/v1/facturas/{id}/cancelar
 *   POST   /api/v1/facturas/{id}/cfdi
 *   GET    /api/v1/facturas/{id}/xml
 *   GET    /api/v1/facturas/{id}/pdf
 *   GET    /api/v1/facturas/{id}/pagos
 *   POST   /api/v1/facturas/{id}/pagos
 *   GET    /api/v1/pagos/{id}
 *   PUT    /api/v1/pagos/{id}
 *   DELETE /api/v1/pagos/{id}
 *   POST   /api/v1/pagos/{id}/conciliar
 *   GET    /api/v1/clientes
 *   GET    /api/v1/proyectos
 */
?>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
    <div class="cf-listado-header">
        <div>
            <h1 class="cf-listado-title">Facturacion</h1>
            <p class="cf-listado-subtitle">Registro de facturas, CFDI, cancelaciones y aplicacion de pagos.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button type="button" class="cf-btn-secondary" id="btnRefrescarFacturas" title="Actualizar">
                <i class="bi bi-arrow-repeat"></i> Actualizar
            </button>
            <button type="button" class="cf-btn-secondary" id="btnCartaCobranza" title="Genera un PDF con las facturas vencidas del cliente seleccionado en el filtro">
                <i class="bi bi-file-earmark-text"></i> Carta de cobranza
            </button>
            <button type="button" class="cf-btn-primary" id="btnNuevaFactura">
                <i class="bi bi-plus-lg"></i> Nueva factura
            </button>
        </div>
    </div>

    <div class="cf-resumen-grid">
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#DBEAFE;color:#0B69D4;"><i class="bi bi-receipt"></i></div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="facTotalFacturado">--</span>
                <span class="cf-resumen-label">Total facturado</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#FEF3C7;color:#B45309;"><i class="bi bi-hourglass-split"></i></div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="facSaldoPendiente">--</span>
                <span class="cf-resumen-label">Saldo pendiente</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#D1FAE5;color:#047857;"><i class="bi bi-check-circle"></i></div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="facTotalPagado">--</span>
                <span class="cf-resumen-label">Cobrado</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#FEE2E2;color:#B91C1C;"><i class="bi bi-exclamation-triangle"></i></div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="facTotalVencido">--</span>
                <span class="cf-resumen-label">Vencido</span>
            </div>
        </div>
    </div>

    <div class="cf-card" style="margin-bottom:16px">
        <div class="cf-card-body">
            <div class="cf-field-row-3">
                <div class="cf-field-group">
                    <label class="cf-label" for="facFiltroCliente">Cliente</label>
                    <select id="facFiltroCliente" class="cf-input">
                        <option value="">Todos</option>
                    </select>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label" for="facFiltroProyecto">Proyecto</label>
                    <select id="facFiltroProyecto" class="cf-input">
                        <option value="">Todos</option>
                    </select>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label" for="facFiltroEstado">Estado</label>
                    <select id="facFiltroEstado" class="cf-input">
                        <option value="">Todos</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Parcialmente Pagada">Parcialmente Pagada</option>
                        <option value="Pagada">Pagada</option>
                        <option value="Vencida">Vencida</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
            </div>
            <div class="cf-field-row-3" style="margin-top:12px;margin-bottom:0">
                <div class="cf-field-group">
                    <label class="cf-label" for="facFiltroDesde">Desde</label>
                    <input type="date" id="facFiltroDesde" class="cf-input">
                </div>
                <div class="cf-field-group">
                    <label class="cf-label" for="facFiltroHasta">Hasta</label>
                    <input type="date" id="facFiltroHasta" class="cf-input">
                </div>
                <div class="cf-field-group" style="justify-content:flex-end">
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button type="button" class="cf-btn-primary" id="btnFiltrarFacturas"><i class="bi bi-search"></i> Buscar</button>
                        <button type="button" class="cf-btn-secondary" id="btnLimpiarFacturas" title="Limpiar"><i class="bi bi-x-lg"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="cf-card cf-card-table">
        <div class="cf-table-toolbar">
            <div class="cf-table-search">
                <i class="bi bi-search"></i>
                <input type="text" id="facBuscar" placeholder="Buscar folio, cliente, proyecto, UUID...">
            </div>
        </div>
        <div class="cf-table-wrap">
            <table class="cf-table" id="tblFacturas" style="width:100%">
                <thead>
                    <tr>
                        <th>Factura</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Proyecto</th>
                        <th>Subtotal</th>
                        <th>IVA</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Vencimiento</th>
                        <th>Estado</th>
                        <th>CFDI</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>

<div class="modal fade" id="modalFactura" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <form class="modal-content cf-modal" id="formFactura">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#DBEAFE;color:#0B69D4"><i class="bi bi-receipt"></i></div>
                    <div>
                        <h2 class="cf-modal-title" id="modalFacturaTitulo">Nueva factura</h2>
                        <span class="cf-modal-subtitle">Datos fiscales y vencimiento</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="cf-modal-body">
                <input type="hidden" id="FacturaID">
                <div class="cf-field-row">
                    <div class="cf-field-group">
                        <label class="cf-label" for="ClienteID">Cliente <span class="cf-required">*</span></label>
                        <select id="ClienteID" class="cf-input" required></select>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="ProyectoID">Proyecto <span class="cf-required">*</span></label>
                        <select id="ProyectoID" class="cf-input" required></select>
                    </div>
                </div>
                <div class="cf-field-row-3">
                    <div class="cf-field-group">
                        <label class="cf-label" for="Serie">Serie</label>
                        <input type="text" id="Serie" class="cf-input" maxlength="20" placeholder="A">
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="Folio">Folio</label>
                        <input type="text" id="Folio" class="cf-input" maxlength="50" placeholder="000123">
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="UUID">UUID</label>
                        <input type="text" id="UUID" class="cf-input" maxlength="80" placeholder="UUID CFDI">
                    </div>
                </div>
                <div class="cf-field-row-3" style="margin-top:16px">
                    <div class="cf-field-group">
                        <label class="cf-label" for="FechaFactura">Fecha factura <span class="cf-required">*</span></label>
                        <input type="date" id="FechaFactura" class="cf-input" required>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="FechaVencimiento">Fecha vencimiento <span class="cf-required">*</span></label>
                        <input type="date" id="FechaVencimiento" class="cf-input" required>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="Total">Total <span class="cf-required">*</span></label>
                        <div class="cf-input-prefix">
                            <span class="cf-prefix">$</span>
                            <input type="number" id="Total" class="cf-input" step="0.01" min="0.01" required>
                        </div>
                    </div>
                </div>
                <div class="cf-field-row" style="margin-top:16px;margin-bottom:0">
                    <div class="cf-field-group">
                        <label class="cf-label" for="Subtotal">Subtotal <span class="cf-required">*</span></label>
                        <div class="cf-input-prefix">
                            <span class="cf-prefix">$</span>
                            <input type="number" id="Subtotal" class="cf-input" step="0.01" min="0" required>
                        </div>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="IVA">IVA</label>
                        <div class="cf-input-prefix">
                            <span class="cf-prefix">$</span>
                            <input type="number" id="IVA" class="cf-input" step="0.01" min="0">
                        </div>
                    </div>
                </div>
            </div>
            <div class="cf-modal-footer">
                <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="cf-btn-primary"><i class="bi bi-check-lg"></i> Guardar</button>
            </div>
        </form>
    </div>
</div>

<div class="modal fade" id="modalPago" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <form class="modal-content cf-modal" id="formPago">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#D1FAE5;color:#047857"><i class="bi bi-cash-stack"></i></div>
                    <div>
                        <h2 class="cf-modal-title" id="modalPagoTitulo">Registrar pago</h2>
                        <span class="cf-modal-subtitle" id="modalPagoSaldo">Saldo pendiente</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="cf-modal-body">
                <input type="hidden" id="PagoFacturaID">
                <input type="hidden" id="PagoID">
                <div class="cf-field-row">
                    <div class="cf-field-group">
                        <label class="cf-label" for="FechaPago">Fecha pago <span class="cf-required">*</span></label>
                        <input type="date" id="FechaPago" class="cf-input" required>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="ImportePago">Importe <span class="cf-required">*</span></label>
                        <div class="cf-input-prefix">
                            <span class="cf-prefix">$</span>
                            <input type="number" id="ImportePago" class="cf-input" step="0.01" min="0.01" required>
                        </div>
                    </div>
                </div>
                <div class="cf-field-row">
                    <div class="cf-field-group">
                        <label class="cf-label" for="MetodoPago">Metodo <span class="cf-required">*</span></label>
                        <select id="MetodoPago" class="cf-input" required>
                            <option value="">Seleccionar</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Compensacion">Compensacion</option>
                        </select>
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="Banco">Banco</label>
                        <input type="text" id="Banco" class="cf-input" maxlength="80">
                    </div>
                </div>
                <div class="cf-field-group">
                    <label class="cf-label" for="Referencia">Referencia</label>
                    <input type="text" id="Referencia" class="cf-input" maxlength="120">
                </div>
                <div class="cf-field-group" style="margin-top:16px">
                    <label class="cf-label" for="ObservacionesPago">Observaciones</label>
                    <textarea id="ObservacionesPago" class="cf-textarea" rows="3"></textarea>
                </div>
            </div>
            <div class="cf-modal-footer">
                <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="cf-btn-primary"><i class="bi bi-check-lg"></i> Aplicar pago</button>
            </div>
        </form>
    </div>
</div>

<div class="modal fade" id="modalCfdi" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <form class="modal-content cf-modal" id="formCfdi">
            <div class="cf-modal-header">
                <div class="cf-modal-title-wrap">
                    <div class="cf-modal-icon" style="background:#EEF2FF;color:#0B1F47"><i class="bi bi-file-earmark-arrow-up"></i></div>
                    <div>
                        <h2 class="cf-modal-title" id="modalCfdiTitulo">Cargar CFDI</h2>
                        <span class="cf-modal-subtitle">UUID, XML y PDF timbrados externamente</span>
                    </div>
                </div>
                <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="cf-modal-body">
                <input type="hidden" id="CfdiFacturaID">
                <div class="cf-field-group">
                    <label class="cf-label" for="CfdiUUID">UUID</label>
                    <input type="text" id="CfdiUUID" class="cf-input" maxlength="80">
                </div>
                <div class="cf-field-row" style="margin-top:16px;margin-bottom:0">
                    <div class="cf-field-group">
                        <label class="cf-label" for="CfdiXML">XML</label>
                        <input type="file" id="CfdiXML" class="cf-input" accept=".xml,application/xml,text/xml">
                    </div>
                    <div class="cf-field-group">
                        <label class="cf-label" for="CfdiPDF">PDF</label>
                        <input type="file" id="CfdiPDF" class="cf-input" accept=".pdf,application/pdf">
                    </div>
                </div>
            </div>
            <div class="cf-modal-footer">
                <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="cf-btn-primary"><i class="bi bi-upload"></i> Guardar CFDI</button>
            </div>
        </form>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/facturacion.js"></script>
