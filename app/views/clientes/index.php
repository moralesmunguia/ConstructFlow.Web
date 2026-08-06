<?php
/**
 * Vista: Clientes
 * Ubicación: app/views/clientes/index.php
 * 
 * Incluye:
 *   - Listado de clientes (DataTable)
 *   - Formulario de captura/edición
 *   - Modales: Contactos, Direcciones
 */
?>

<!-- ═══════════════════════════════════════════════════════════════
     LISTADO DE CLIENTES
     ═══════════════════════════════════════════════════════════════ -->
<div id="cfCardListado">
  <div class="cf-listado-container">

    <!-- Header -->
    <div class="cf-listado-header">
      <div>
        <h2 class="cf-listado-title">Clientes</h2>
        <p class="cf-listado-subtitle">Gestiona tus clientes, contactos y condiciones comerciales</p>
      </div>
      <button type="button" class="cf-btn-primary" id="btnNuevoCliente">
        <i class="bi bi-plus-lg"></i> Nuevo Cliente
      </button>
    </div>

    <!-- Cards de resumen -->
    <div class="cf-resumen-grid">
      <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
          <i class="bi bi-people"></i>
        </div>
        <div class="cf-resumen-info">
          <span class="cf-resumen-value" id="cfTotalClientes">—</span>
          <span class="cf-resumen-label">Total Clientes</span>
        </div>
      </div>
      <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#ECFDF5;color:#059669;">
          <i class="bi bi-check-circle"></i>
        </div>
        <div class="cf-resumen-info">
          <span class="cf-resumen-value" id="cfClientesActivos">—</span>
          <span class="cf-resumen-label">Activos</span>
        </div>
      </div>
      <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FEF2F2;color:#DC2626;">
          <i class="bi bi-x-circle"></i>
        </div>
        <div class="cf-resumen-info">
          <span class="cf-resumen-value" id="cfClientesInactivos">—</span>
          <span class="cf-resumen-label">Inactivos</span>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="cf-card cf-card-table">
      <div class="cf-card-body" style="padding:0;">
        <div class="cf-table-toolbar">
          <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarClientes" placeholder="Buscar cliente, RFC, correo...">
          </div>
          <div class="cf-table-filters">
            <button class="cf-filter-btn active" data-filtro="todos">Todos</button>
            <button class="cf-filter-btn" data-filtro="activos">Activos</button>
            <button class="cf-filter-btn" data-filtro="inactivos">Inactivos</button>
          </div>
        </div>
        <div class="cf-table-wrap">
          <table id="tblClientes" class="cf-table" style="width:100%">
            <thead>
              <tr>
                <th style="width:50px">ID</th>
                <th>Cliente</th>
                <th style="width:130px">RFC</th>
                <th>Dirección</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th style="width:110px">Teléfono</th>
                <th style="width:110px">Límite Crédito</th>
                <th style="width:70px">Días</th>
                <th style="width:90px">Estado</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Contactos del Cliente
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalContactos" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-people"></i>
          </div>
          <div>
            <h5 class="cf-modal-title" id="tituloContactos">Contactos</h5>
            <span class="cf-modal-subtitle">Administra los contactos asociados a este cliente</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body" id="contactosContainer"></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Formulario de Contacto (Nuevo / Editar)
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalContacto" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#ECFDF5;color:#059669;">
            <i class="bi bi-person-plus"></i>
          </div>
          <div>
            <h5 class="cf-modal-title" id="tituloContactoForm">Nuevo Contacto</h5>
            <span class="cf-modal-subtitle">Datos de contacto del cliente</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body">
        <form id="cfFormContacto" onsubmit="return false;">
          <input type="hidden" id="cfContactoID">
          <input type="hidden" id="cfContactoClienteID">
          <input type="hidden" id="cfContactoRowVersion" value="1">

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-label">Nombre <span class="cf-required">*</span></label>
              <input type="text" id="cfContactoNombre" class="cf-input" placeholder="Nombre completo">
            </div>
          </div>
          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Puesto</label>
              <input type="text" id="cfContactoPuesto" class="cf-input" placeholder="Ej. Gerente de Compras">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Correo</label>
              <input type="email" id="cfContactoCorreo" class="cf-input" placeholder="correo@empresa.com">
            </div>
          </div>
          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Teléfono</label>
              <input type="tel" id="cfContactoTelefono" class="cf-input" placeholder="(55) 1234-5678">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Celular</label>
              <input type="tel" id="cfContactoCelular" class="cf-input" placeholder="(55) 9876-5432">
            </div>
          </div>
          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-checkbox-card" style="margin-top:4px;">
                <input type="checkbox" id="cfContactoEsPrincipal">
                <span class="cf-checkbox-indicator"></span>
                <span class="cf-checkbox-text">Marcar como contacto principal</span>
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="cf-modal-footer">
        <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="cf-btn-primary" id="btnGuardarContacto">
          <i class="bi bi-check-lg"></i> Guardar Contacto
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     FORMULARIO DE CLIENTES (Nuevo / Editar)
     ═══════════════════════════════════════════════════════════════ -->
<div id="cfCardFormulario" style="display:none;">
  <div class="cf-form-container">

    <!-- Header -->
    <div class="cf-form-header">
      <div>
        <h2 class="cf-form-title" id="cfFormTitulo">Nuevo Cliente</h2>
        <p class="cf-form-subtitle">Complete la información general y de contacto del cliente</p>
      </div>
      <div class="cf-form-actions">
        <button type="button" class="cf-btn-secondary" id="btnCancelarFormulario">
          <i class="bi bi-x-lg"></i> Cancelar
        </button>
        <button type="button" class="cf-btn-primary" id="btnGuardarCliente">
          <i class="bi bi-check-lg"></i> Guardar Cliente
        </button>
      </div>
    </div>

    <div class="cf-form-grid">

      <!-- ===== COLUMNA PRINCIPAL ===== -->
      <div class="cf-form-main">

        <!-- Card: Información General -->
        <div class="cf-card">
          <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#EEF2FF;color:#0B1F47;">
              <i class="bi bi-building"></i>
            </div>
            <span class="cf-card-title">Información General</span>
          </div>
          <div class="cf-card-body">
            <div class="cf-field-row">
              <div class="cf-field-group cf-field-full">
                <label class="cf-label">Nombre del Cliente / Empresa <span class="cf-required">*</span></label>
                <input type="text" id="cfNombreCliente" class="cf-input" placeholder="Ej. Construcciones del Norte S.A. de C.V.">
              </div>
            </div>
            <div class="cf-field-row">
              <div class="cf-field-group">
                <label class="cf-label">RFC <span class="cf-required">*</span></label>
                <input type="text" id="cfRFC" class="cf-input" placeholder="XAXX010101000" maxlength="13">
                <span class="cf-hint">13 caracteres para persona moral, 12 para física</span>
              </div>
              <div class="cf-field-group">
                <label class="cf-label">Empresa Asignada</label>
                <div class="cf-input-readonly">
                  <i class="bi bi-shield-lock"></i>
                  <span id="cfEmpresaNombreDisplay"><?php echo CF_EMPRESA_NOMBRE ?? 'Empresa #' . (CF_EMPRESA_ID ?? 1); ?></span>
                </div>
                <input type="hidden" id="cfEmpresaID" value="<?php echo CF_EMPRESA_ID ?? 1; ?>">
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Dirección (destacada) -->
        <div class="cf-card">
          <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#DBEAFE;color:#2563EB;">
              <i class="bi bi-geo-alt"></i>
            </div>
            <span class="cf-card-title">Dirección Fiscal</span>
          </div>
          <div class="cf-card-body">
            <div class="cf-field-group cf-field-full">
              <textarea id="cfDireccion" class="cf-textarea" rows="3" placeholder="Calle, número exterior e interior, colonia, ciudad, estado, código postal, país..."></textarea>
            </div>
          </div>
        </div>

        <!-- Card: Contacto Principal -->
        <div class="cf-card">
          <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#ECFDF5;color:#059669;">
              <i class="bi bi-person"></i>
            </div>
            <span class="cf-card-title">Contacto Principal</span>
          </div>
          <div class="cf-card-body">
            <div class="cf-field-row">
              <div class="cf-field-group">
                <label class="cf-label">Nombre del Contacto</label>
                <input type="text" id="cfContactoPrincipal" class="cf-input" placeholder="Ej. Ing. Juan Pérez">
              </div>
              <div class="cf-field-group">
                <label class="cf-label">Correo Electrónico</label>
                <input type="email" id="cfCorreo" class="cf-input" placeholder="contacto@empresa.com">
              </div>
            </div>
            <div class="cf-field-row">
              <div class="cf-field-group">
                <label class="cf-label">Teléfono</label>
                <input type="tel" id="cfTelefono" class="cf-input" placeholder="(55) 1234-5678">
              </div>
              <div class="cf-field-group">
                <label class="cf-label">Celular</label>
                <input type="tel" id="cfCelular" class="cf-input" placeholder="(55) 9876-5432">
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Condiciones Comerciales -->
        <div class="cf-card">
          <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#FEF3C7;color:#D97706;">
              <i class="bi bi-currency-dollar"></i>
            </div>
            <span class="cf-card-title">Condiciones Comerciales</span>
          </div>
          <div class="cf-card-body">
            <div class="cf-field-row cf-field-row-3">
              <div class="cf-field-group">
                <label class="cf-label">Límite de Crédito</label>
                <div class="cf-input-prefix">
                  <span class="cf-prefix">$</span>
                  <input type="number" id="cfLimiteCredito" class="cf-input" placeholder="0.00" value="0.00" step="0.01" min="0">
                </div>
              </div>
              <div class="cf-field-group">
                <label class="cf-label">Días de Crédito</label>
                <div class="cf-input-suffix">
                  <input type="number" id="cfDiasCredito" class="cf-input" value="30" min="0">
                  <span class="cf-suffix">días</span>
                </div>
              </div>
              <div class="cf-field-group cf-field-checkbox-wrap">
                <label class="cf-checkbox-card">
                  <input type="checkbox" id="cfIsActive" checked>
                  <span class="cf-checkbox-indicator"></span>
                  <span class="cf-checkbox-text">Cliente Activo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Observaciones -->
        <div class="cf-card">
          <div class="cf-card-header">
            <div class="cf-card-icon" style="background:#F3E8FF;color:#7C3AED;">
              <i class="bi bi-sticky"></i>
            </div>
            <span class="cf-card-title">Observaciones</span>
          </div>
          <div class="cf-card-body">
            <div class="cf-field-group cf-field-full">
              <textarea id="cfObservaciones" class="cf-textarea" rows="3" placeholder="Notas internas sobre el cliente, preferencias, historial..."></textarea>
            </div>
          </div>
        </div>

      </div>

      <!-- ===== COLUMNA LATERAL ===== -->
      <div class="cf-form-sidebar">

        <!-- Card: Estado -->
        <div class="cf-card cf-card-compact">
          <div class="cf-card-body">
            <h4 class="cf-sidebar-title">Estado del Registro</h4>
            <div class="cf-status-badge" id="cfStatusBadge">
              <span class="cf-status-dot" style="background:#059669;box-shadow:0 0 0 4px rgba(5,150,105,0.2)"></span>
              <span class="cf-status-text" style="color:#059669">Activo</span>
            </div>
            <div class="cf-meta-list">
              <div class="cf-meta-item">
                <span class="cf-meta-label">ID Cliente</span>
                <span class="cf-meta-value" id="cfClienteIDDisplay">—</span>
              </div>
              <div class="cf-meta-item">
                <span class="cf-meta-label">Fecha de alta</span>
                <span class="cf-meta-value"><?php echo date('d/m/Y'); ?></span>
              </div>
              <div class="cf-meta-item">
                <span class="cf-meta-label">Versión</span>
                <span class="cf-meta-value" id="cfRowVersionDisplay">1</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Tips -->
        <div class="cf-card cf-card-gradient">
          <div class="cf-card-body">
            <h4 class="cf-sidebar-title" style="color:#fff;"><i class="bi bi-lightbulb"></i> Tips</h4>
            <ul class="cf-tips-list">
              <li>El RFC es obligatorio para facturación electrónica</li>
              <li>El contacto principal aparecerá automáticamente en cotizaciones</li>
              <li>Agrega más contactos desde el listado después de guardar</li>
              <li>El límite de crédito afecta las aprobaciones de venta</li>
            </ul>
          </div>
        </div>

        <!-- Card: Acciones -->
        <div class="cf-card cf-card-compact">
          <div class="cf-card-body">
            <h4 class="cf-sidebar-title">Acciones Rápidas</h4>
            <button type="button" class="cf-sidebar-btn" onclick="alert('Función próximamente')">
              <i class="bi bi-files"></i> Duplicar desde existente
            </button>
            <button type="button" class="cf-sidebar-btn" onclick="alert('Función próximamente')">
              <i class="bi bi-paperclip"></i> Adjuntar documentos
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer móvil -->
    <div class="cf-form-footer">
      <button type="button" class="cf-btn-secondary" id="btnCancelarFormularioMobile">
        <i class="bi bi-x-lg"></i> Cancelar
      </button>
      <button type="button" class="cf-btn-primary" id="btnGuardarClienteMobile">
        <i class="bi bi-check-lg"></i> Guardar Cliente
      </button>
    </div>

  </div>
</div>

<!-- Campos ocultos -->
<input type="hidden" id="cfClienteID" value="">
<input type="hidden" id="cfRowVersion" value="1">

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Direcciones del Cliente
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalDirecciones" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#DBEAFE;color:#2563EB;">
            <i class="bi bi-geo-alt"></i>
          </div>
          <div>
            <h5 class="cf-modal-title" id="tituloDirecciones">Direcciones</h5>
            <span class="cf-modal-subtitle">Administra las direcciones asociadas a este cliente</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body" id="direccionesContainer"></div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Formulario de Dirección (Nuevo / Editar)
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalDireccion" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#DBEAFE;color:#2563EB;">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div>
            <h5 class="cf-modal-title" id="tituloDireccionForm">Nueva Dirección</h5>
            <span class="cf-modal-subtitle">Datos de la dirección del cliente</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body">
        <form id="cfFormDireccion" onsubmit="return false;">
          <input type="hidden" id="cfDireccionID">
          <input type="hidden" id="cfDireccionClienteID">
          <input type="hidden" id="cfDireccionRowVersion" value="1">

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Tipo de Dirección <span class="cf-required">*</span></label>
              <select id="cfDireccionTipo" class="cf-input" style="cursor:pointer">
                <option value="FISCAL">Fiscal</option>
                <option value="ENTREGA">Entrega</option>
                <option value="OBRA">Obra</option>
                <option value="FACTURACION">Facturación</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div class="cf-field-group">
              <label class="cf-label">País</label>
              <input type="text" id="cfDireccionPais" class="cf-input" value="México">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-label">Calle <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionCalle" class="cf-input" placeholder="Nombre de la calle">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Número Exterior <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionNumeroExt" class="cf-input" placeholder="123">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Número Interior</label>
              <input type="text" id="cfDireccionNumeroInt" class="cf-input" placeholder="A, 101, etc.">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Colonia <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionColonia" class="cf-input" placeholder="Colonia">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Código Postal <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionCP" class="cf-input" placeholder="44100" maxlength="10">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Municipio <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionMunicipio" class="cf-input" placeholder="Municipio / Delegación">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Estado <span class="cf-required">*</span></label>
              <input type="text" id="cfDireccionEstado" class="cf-input" placeholder="Estado">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-checkbox-card" style="margin-top:4px;">
                <input type="checkbox" id="cfDireccionPrincipal">
                <span class="cf-checkbox-indicator"></span>
                <span class="cf-checkbox-text">Marcar como dirección principal</span>
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="cf-modal-footer">
        <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="cf-btn-primary" id="btnGuardarDireccion">
          <i class="bi bi-check-lg"></i> Guardar Dirección
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     ESTILOS COMPARTIDOS (public/css/cf-components.css)
     ═══════════════════════════════════════════════════════════════ -->
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<!-- ═══════════════════════════════════════════════════════════════
     SCRIPTS
     ═══════════════════════════════════════════════════════════════ -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/clientes.js"></script>