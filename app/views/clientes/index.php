<?php
/**
 * Vista: clientes/index.php
 * Ref: DEF-WEB-007 (API Clientes) + DEF-WEB-000 (Estándares Frontend).
 *
 * Alcance: LISTADO (tabla) + botón "Nuevo Cliente" + Modal CRUD + Contactos
 * Consume: GET {API_BASE_URL}/api/v1/clientes
 * El token JWT se adjunta automáticamente vía interceptor de Axios (app.js).
 */
?>
<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Clientes</h1>
        <p class="cf-page-subtitle">Catálogo de clientes registrados.</p>
    </div>
    <div class="cf-page-actions">
        <button type="button" class="btn btn-cf-primary" id="btnNuevoCliente">
            <i class="bi bi-plus-lg"></i> Nuevo Cliente
        </button>
    </div>
</div>

<div class="cf-card cf-card-table" id="cfCardListado">
    <div class="table-responsive">
        <table id="tblClientes" class="table cf-table w-100">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>RFC</th>
                    <th>Contacto Principal</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Límite Crédito</th>
                    <th>Días Crédito</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Filas cargadas dinámicamente por clientes.js -->
            </tbody>
        </table>
    </div>
</div>

<!-- ============ FORMULARIO CLIENTE (Nuevo / Modificar) ============ -->
<div class="cf-card" id="cfCardFormulario" style="display:none">
    <div class="cf-page-header">
        <h2 class="cf-form-titulo" id="cfFormTitulo">Nuevo Cliente</h2>
        <div class="cf-page-actions">
            <button type="button" class="btn btn-cf-secondary" id="btnCancelarFormulario">Cancelar</button>
            <button type="button" class="btn btn-cf-primary" id="btnGuardarCliente">
                <i class="bi bi-save"></i> Guardar
            </button>
        </div>
    </div>

    <input type="hidden" id="cfClienteID">
    <input type="hidden" id="cfRowVersion" value="1">

    <h3 class="cf-form-seccion">Información General</h3>
    <div class="row g-3 mb-4">
        <div class="col-md-8">
            <label class="form-label">Nombre / Razón Social <span class="text-danger">*</span></label>
            <input id="cfNombreCliente" class="form-control" maxlength="250" required>
            <div class="invalid-feedback">El nombre es obligatorio.</div>
        </div>
        <div class="col-md-4">
            <label class="form-label">RFC <span class="text-danger">*</span></label>
            <input id="cfRFC" class="form-control text-uppercase" maxlength="20" 
                   pattern="^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$" placeholder="ABCD010101XXX" required>
            <div class="invalid-feedback">RFC con formato incorrecto.</div>
        </div>

        <div class="col-md-6">
            <label class="form-label">Contacto Principal</label>
            <input id="cfContactoPrincipal" class="form-control" maxlength="200" placeholder="Nombre del contacto principal">
        </div>
        <div class="col-md-6">
            <label class="form-label">Empresa <span class="text-danger">*</span></label>
            <select id="cfEmpresaID" class="form-select" required>
                <option value="">Seleccione empresa...</option>
            </select>
            <div class="invalid-feedback">Seleccione una empresa.</div>
        </div>
    </div>

    <h3 class="cf-form-seccion">Información de Contacto</h3>
    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <label class="form-label">Correo Electrónico</label>
            <input id="cfCorreo" type="email" class="form-control" maxlength="150" placeholder="cliente@empresa.com">
        </div>
        <div class="col-md-6">
            <label class="form-label">Teléfono</label>
            <input id="cfTelefono" type="tel" class="form-control" maxlength="50" placeholder="+52 55 1234 5678">
        </div>

        <div class="col-12">
            <label class="form-label">Dirección</label>
            <textarea id="cfDireccion" class="form-control" rows="2" maxlength="500"></textarea>
        </div>
    </div>

    <h3 class="cf-form-seccion">Configuración de Crédito</h3>
    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <label class="form-label">Límite de Crédito</label>
            <div class="input-group">
                <span class="input-group-text">$</span>
                <input id="cfLimiteCredito" type="number" class="form-control" value="0.00" step="0.01" min="0">
            </div>
        </div>
        <div class="col-md-6">
            <label class="form-label">Días de Crédito</label>
            <input id="cfDiasCredito" type="number" class="form-control" value="30" min="0" max="365">
        </div>
    </div>

    <h3 class="cf-form-seccion">Observaciones</h3>
    <div class="row g-3 mb-4">
        <div class="col-12">
            <textarea id="cfObservaciones" class="form-control" rows="2"></textarea>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-md-6">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="cfIsActive" checked>
                <label class="form-check-label fw-semibold" for="cfIsActive">Cliente Activo</label>
            </div>
        </div>
    </div>
</div>

<!-- ============ MODAL CONTACTOS ============ -->
<div class="modal fade" id="modalContactos" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" style="border-radius:14px;border:none">
            <div class="modal-header" style="background:#0B1F47;color:#fff;border-radius:14px 14px 0 0">
                <h5 class="modal-title fw-bold"><i class="bi bi-people me-2"></i><span id="tituloContactos">Contactos</span></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="contactosContainer" style="padding:20px">
                <p class="text-muted text-center">Cargando contactos...</p>
            </div>
        </div>
    </div>
</div>

<!-- ============ MODAL CONTACTO (CRUD) ============ -->
<div class="modal fade" id="modalContacto" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content" style="border-radius:14px;border:none">
            <div class="modal-header" style="background:#0B1F47;color:#fff;border-radius:14px 14px 0 0">
                <h5 class="modal-title fw-bold"><i class="bi bi-person-plus me-2"></i><span id="tituloContactoForm">Nuevo Contacto</span></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" style="padding:20px">
                <input type="hidden" id="cfContactoID">
                <input type="hidden" id="cfContactoClienteID">
                <input type="hidden" id="cfContactoRowVersion" value="1">

                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
                        <input id="cfContactoNombre" class="form-control" maxlength="200" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Puesto</label>
                        <input id="cfContactoPuesto" class="form-control" maxlength="100">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Correo</label>
                        <input id="cfContactoCorreo" type="email" class="form-control" maxlength="150">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Teléfono</label>
                        <input id="cfContactoTelefono" type="tel" class="form-control" maxlength="50">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Celular</label>
                        <input id="cfContactoCelular" type="tel" class="form-control" maxlength="50">
                    </div>
                    <div class="col-12">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="cfContactoPrincipal" style="width:44px;height:22px">
                            <label class="form-check-label fw-semibold ms-2" for="cfContactoPrincipal">Contacto Principal</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid #F1F5F9">
                <button type="button" class="btn btn-cf-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-cf-primary" id="btnGuardarContacto"><i class="bi bi-save me-1"></i>Guardar</button>
            </div>
        </div>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/clientes.js"></script>
