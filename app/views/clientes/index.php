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
     ESTILOS CSS COMPLETOS
     ═══════════════════════════════════════════════════════════════ -->
<style>
/* ================================================================
   LISTADO - ESTILOS PROFESIONALES
   ================================================================ */
.cf-listado-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Header */
.cf-listado-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.cf-listado-title {
  margin: 0;
  color: #0B1F47;
  font-size: 1.5rem;
  font-weight: 700;
}
.cf-listado-subtitle {
  margin: 4px 0 0 0;
  color: #64748B;
  font-size: 0.88rem;
}

/* Resumen cards */
.cf-resumen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
@media (max-width: 992px) {
  .cf-resumen-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 576px) {
  .cf-resumen-grid { grid-template-columns: 1fr; }
}
.cf-resumen-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.2s;
}
.cf-resumen-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.cf-resumen-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.cf-resumen-info {
  display: flex;
  flex-direction: column;
}
.cf-resumen-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0B1F47;
  line-height: 1.2;
}
.cf-resumen-label {
  font-size: 0.78rem;
  color: #64748B;
  font-weight: 500;
  margin-top: 2px;
}

/* Card tabla */
.cf-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.cf-card-table { overflow: hidden; }

/* Toolbar */
.cf-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #F1F5F9;
  gap: 16px;
  flex-wrap: wrap;
}
.cf-table-search {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 360px;
}
.cf-table-search i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 0.95rem;
}
.cf-table-search input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.88rem;
  color: #1E293B;
  outline: none;
  transition: all 0.2s;
  background: #FAFBFC;
  box-sizing: border-box;
}
.cf-table-search input:focus {
  border-color: #0B1F47;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(11,31,71,0.08);
}
.cf-table-search input::placeholder { color: #CBD5E1; }

.cf-table-filters {
  display: flex;
  gap: 6px;
}
.cf-filter-btn {
  padding: 8px 16px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  color: #64748B;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cf-filter-btn:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
}
.cf-filter-btn.active {
  background: #0B1F47;
  color: #fff;
  border-color: #0B1F47;
}

/* Tabla */
.cf-table-wrap { overflow-x: auto; }
.cf-table {
  width: 100% !important;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.85rem;
}
.cf-table thead th {
  background: #FAFBFC;
  color: #475569;
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
  white-space: nowrap;
}
.cf-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #F1F5F9;
  color: #1E293B;
  vertical-align: middle;
}
.cf-table tbody tr:hover td { background: #F8FAFC; }
.cf-table tbody tr:last-child td { border-bottom: none; }

/* Avatar y cliente */
.cf-table-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #EEF2FF;
  color: #0B1F47;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cf-table-cliente {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cf-table-cliente-info {
  display: flex;
  flex-direction: column;
}
.cf-table-cliente-nombre {
  font-weight: 600;
  color: #0B1F47;
  font-size: 0.88rem;
}

/* Badges estado */
.cf-badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.cf-badge-estado.activo {
  background: #ECFDF5;
  color: #059669;
}
.cf-badge-estado.inactivo {
  background: #FEF2F2;
  color: #DC2626;
}
.cf-badge-estado-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.cf-badge-estado.activo .cf-badge-estado-dot { background: #059669; }
.cf-badge-estado.inactivo .cf-badge-estado-dot { background: #DC2626; }

/* Dropdown acciones */
.cf-table .dropdown-toggle {
  background: transparent;
  border: none;
  color: #94A3B8;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}
.cf-table .dropdown-toggle:hover {
  background: #F1F5F9;
  color: #0B1F47;
}
.cf-table .dropdown-menu {
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  padding: 8px;
  min-width: 180px;
}
.cf-table .dropdown-item {
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s;
}
.cf-table .dropdown-item:hover { background: #F8FAFC; }
.cf-table .dropdown-item i { font-size: 0.95rem; }
.cf-table .dropdown-divider {
  margin: 6px 8px;
  border-color: #F1F5F9;
}

/* DataTable overrides */
.dataTables_wrapper .dataTables_length,
.dataTables_wrapper .dataTables_filter { display: none; }
.dataTables_wrapper .dataTables_info {
  padding: 14px 20px;
  font-size: 0.8rem;
  color: #64748B;
}
.dataTables_wrapper .dataTables_paginate {
  padding: 10px 20px;
}
.dataTables_wrapper .dataTables_paginate .paginate_button {
  border: 1px solid #E2E8F0 !important;
  background: #fff !important;
  color: #475569 !important;
  border-radius: 8px !important;
  margin: 0 3px !important;
  padding: 6px 12px !important;
  font-size: 0.82rem !important;
  transition: all 0.2s !important;
}
.dataTables_wrapper .dataTables_paginate .paginate_button:hover {
  background: #F8FAFC !important;
  border-color: #CBD5E1 !important;
}
.dataTables_wrapper .dataTables_paginate .paginate_button.current {
  background: #0B1F47 !important;
  color: #fff !important;
  border-color: #0B1F47 !important;
}
.dataTables_wrapper .dataTables_paginate .paginate_button.disabled { opacity: 0.4; }

/* ================================================================
   MODALES
   ================================================================ */
.cf-modal {
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden;
}
.cf-modal-header {
  padding: 18px 24px;
  background: #FAFBFC;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cf-modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cf-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.cf-modal-title {
  margin: 0;
  color: #0B1F47;
  font-size: 1.05rem;
  font-weight: 700;
}
.cf-modal-subtitle {
  font-size: 0.78rem;
  color: #94A3B8;
  display: block;
  margin-top: 2px;
}
.cf-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}
.cf-modal-close:hover {
  background: #E2E8F0;
  color: #0B1F47;
}
.cf-modal-body { padding: 24px; }
.cf-modal-footer {
  padding: 16px 24px;
  background: #FAFBFC;
  border-top: 1px solid #F1F5F9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Contactos en modal */
.cf-contactos-empty {
  text-align: center;
  padding: 40px 20px;
}
.cf-contactos-empty i {
  font-size: 52px;
  color: #CBD5E1;
  margin-bottom: 16px;
  display: block;
}
.cf-contactos-empty p {
  color: #94A3B8;
  margin-bottom: 20px;
}
.cf-contactos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.cf-contactos-count {
  font-size: 0.85rem;
  color: #64748B;
}
.cf-contacto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  margin-bottom: 10px;
  transition: all 0.2s;
  background: #fff;
}
.cf-contacto-item:hover {
  border-color: #E2E8F0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.cf-contacto-item:last-child { margin-bottom: 0; }
.cf-contacto-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.cf-contacto-avatar.principal {
  background: #ECFDF5;
  color: #059669;
}
.cf-contacto-avatar.normal {
  background: #F8FAFC;
  color: #64748B;
}
.cf-contacto-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.cf-contacto-nombre {
  font-weight: 600;
  color: #0B1F47;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cf-contacto-badge {
  background: #ECFDF5;
  color: #059669;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.cf-contacto-meta {
  font-size: 0.78rem;
  color: #94A3B8;
  margin-top: 3px;
}
.cf-contacto-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.cf-contacto-actions button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748B;
}
.cf-contacto-actions button:hover {
  background: #EEF2FF;
  color: #0B1F47;
}

/* ================================================================
   COMPONENTES COMPARTIDOS
   ================================================================ */
.cf-btn-primary,
.cf-btn-secondary {
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border: none;
}
.cf-btn-primary {
  background: #0B1F47;
  color: #fff;
  box-shadow: 0 4px 12px rgba(11,31,71,0.25);
}
.cf-btn-primary:hover {
  background: #1a3a7a;
  transform: translateY(-1px);
}
.cf-btn-secondary {
  background: #fff;
  color: #64748B;
  border: 1px solid #E2E8F0;
}
.cf-btn-secondary:hover { background: #F1F5F9; }

.cf-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.cf-field-row:last-child { margin-bottom: 0; }
.cf-field-group { display: flex; flex-direction: column; }
.cf-field-full { grid-column: 1 / -1; }

.cf-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.cf-required { color: #EF4444; }

.cf-input,
.cf-textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #1E293B;
  outline: none;
  transition: all 0.2s ease;
  background: #FAFBFC;
  font-family: inherit;
  box-sizing: border-box;
}
.cf-input:focus,
.cf-textarea:focus {
  border-color: #0B1F47;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(11,31,71,0.08);
}
.cf-input::placeholder,
.cf-textarea::placeholder { color: #CBD5E1; }
.cf-textarea { resize: vertical; }

.cf-checkbox-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 16px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.cf-checkbox-card:hover { border-color: #0B1F47; }
.cf-checkbox-card input {
  width: 20px;
  height: 20px;
  accent-color: #0B1F47;
  cursor: pointer;
  flex-shrink: 0;
}
.cf-checkbox-text {
  font-size: 0.9rem;
  color: #1E293B;
  font-weight: 500;
}

/* ================================================================
   RESPONSIVE - TABLET (768px - 991px)
   ================================================================ */
@media (max-width: 991px) {
  .cf-listado-container {
    padding: 16px;
  }
  .cf-listado-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .cf-resumen-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .cf-table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .cf-table-search {
    max-width: none;
  }
  .cf-table-filters {
    justify-content: center;
  }
}

/* ================================================================
   RESPONSIVE - SMARTPHONE (< 768px)
   ================================================================ */
@media (max-width: 767px) {
  .cf-listado-container {
    padding: 12px;
  }
  .cf-listado-title {
    font-size: 1.25rem;
  }
  .cf-listado-subtitle {
    font-size: 0.8rem;
  }
  .cf-resumen-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .cf-resumen-card {
    padding: 14px 16px;
  }
  .cf-resumen-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  .cf-resumen-value {
    font-size: 1.15rem;
  }

  /* Tabla scrollable horizontal */
  .cf-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .cf-table {
    min-width: 900px;
  }

  /* Toolbar */
  .cf-table-toolbar {
    padding: 12px;
    gap: 12px;
  }
  .cf-table-search input {
    padding: 12px 14px 12px 38px;
    font-size: 16px; /* Previene zoom en iOS */
  }
  .cf-filter-btn {
    padding: 10px 14px;
    font-size: 0.8rem;
  }

  /* Paginación */
  .dataTables_wrapper .dataTables_paginate {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
  .dataTables_wrapper .dataTables_paginate .paginate_button {
    padding: 8px 12px !important;
    margin: 0 !important;
  }

  /* Botones táctiles */
  .cf-btn-primary,
  .cf-btn-secondary {
    padding: 12px 20px;
    font-size: 0.95rem;
    min-height: 44px;
  }

  /* Dropdowns */
  .cf-table .dropdown-toggle {
    width: 44px;
    height: 44px;
  }

  /* Modales */
  .modal-dialog {
    margin: 10px;
  }
  .cf-modal {
    border-radius: 12px;
  }
  .cf-modal-header {
    padding: 14px 16px;
  }
  .cf-modal-body {
    padding: 16px;
  }
  .cf-modal-footer {
    padding: 14px 16px;
    flex-direction: column;
  }
  .cf-modal-footer .cf-btn-primary,
  .cf-modal-footer .cf-btn-secondary {
    width: 100%;
    justify-content: center;
  }

  /* Contactos en modal */
  .cf-contacto-item {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  .cf-contacto-actions {
    align-self: flex-end;
  }
  .cf-contacto-actions button {
    width: 44px;
    height: 44px;
  }

  /* Form fields */
  .cf-field-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .cf-input,
  .cf-textarea,
  .cf-input-readonly {
    padding: 14px;
    font-size: 16px; /* Previene zoom en iOS */
  }
  .cf-checkbox-card {
    padding: 14px;
  }
}

/* ================================================================
   RESPONSIVE - SMARTPHONE PEQUEÑO (< 480px)
   ================================================================ */
@media (max-width: 479px) {
  .cf-listado-header {
    gap: 12px;
  }
  .cf-listado-header .cf-btn-primary {
    width: 100%;
    justify-content: center;
  }
  .cf-resumen-card {
    padding: 12px;
  }
  .cf-resumen-icon {
    width: 36px;
    height: 36px;
  }
  .cf-resumen-value {
    font-size: 1.1rem;
  }
}

/* ===== ESTILOS DEL FORMULARIO ===== */

/* ================================================================
   FORMULARIO - ESTILOS PROFESIONALES
   ================================================================ */
.cf-form-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Header */
.cf-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.cf-form-title {
  margin: 0;
  color: #0B1F47;
  font-size: 1.5rem;
  font-weight: 700;
}
.cf-form-subtitle {
  margin: 4px 0 0 0;
  color: #64748B;
  font-size: 0.88rem;
}
.cf-form-actions {
  display: flex;
  gap: 10px;
}

/* Grid */
.cf-form-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}
@media (max-width: 992px) {
  .cf-form-grid { grid-template-columns: 1fr; }
}

.cf-form-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cf-form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Cards */
.cf-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.cf-card-compact .cf-card-body { padding: 18px; }
.cf-card-gradient {
  background: linear-gradient(135deg, #0B1F47 0%, #1a3a7a 100%);
  border: none;
  color: #fff;
}
.cf-card-header {
  padding: 14px 20px;
  background: #FAFBFC;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cf-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}
.cf-card-title {
  font-weight: 700;
  color: #0B1F47;
  font-size: 0.92rem;
}
.cf-card-body {
  padding: 20px;
}

/* Fields */
.cf-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.cf-field-row:last-child { margin-bottom: 0; }
.cf-field-row-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 768px) {
  .cf-field-row,
  .cf-field-row-3 { grid-template-columns: 1fr; }
}

.cf-field-group { display: flex; flex-direction: column; }
.cf-field-full { grid-column: 1 / -1; }

.cf-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.cf-required { color: #EF4444; }
.cf-hint {
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 4px;
}

/* Inputs */
.cf-input,
.cf-textarea,
.cf-input-readonly {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #1E293B;
  outline: none;
  transition: all 0.2s ease;
  background: #FAFBFC;
  font-family: inherit;
  box-sizing: border-box;
}
.cf-input:focus,
.cf-textarea:focus {
  border-color: #0B1F47;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(11,31,71,0.08);
}
.cf-input::placeholder,
.cf-textarea::placeholder { color: #CBD5E1; }
.cf-textarea { resize: vertical; }

/* Readonly empresa */
.cf-input-readonly {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748B;
  font-weight: 500;
  background: #F1F5F9;
  border-style: dashed;
}
.cf-input-readonly i { color: #0B1F47; }

/* Prefix / Suffix */
.cf-input-prefix,
.cf-input-suffix {
  position: relative;
  display: flex;
  align-items: center;
}
.cf-prefix {
  position: absolute;
  left: 14px;
  color: #64748B;
  font-weight: 600;
  font-size: 0.9rem;
  pointer-events: none;
}
.cf-input-prefix .cf-input { padding-left: 28px; }
.cf-suffix {
  position: absolute;
  right: 14px;
  color: #94A3B8;
  font-size: 0.8rem;
  pointer-events: none;
}
.cf-input-suffix .cf-input { padding-right: 42px; }

/* Checkbox card */
.cf-field-checkbox-wrap {
  justify-content: flex-end;
  padding-bottom: 2px;
}
.cf-checkbox-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 16px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.cf-checkbox-card:hover { border-color: #0B1F47; }
.cf-checkbox-card input {
  width: 20px;
  height: 20px;
  accent-color: #0B1F47;
  cursor: pointer;
  flex-shrink: 0;
}
.cf-checkbox-text {
  font-size: 0.9rem;
  color: #1E293B;
  font-weight: 500;
}

/* Sidebar */
.cf-sidebar-title {
  margin: 0 0 14px 0;
  color: #0B1F47;
  font-size: 0.9rem;
  font-weight: 700;
}
.cf-status-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #ECFDF5;
  border-radius: 10px;
  border: 1px solid #A7F3D0;
}
.cf-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.cf-status-text {
  font-weight: 600;
  font-size: 0.85rem;
}
.cf-meta-list {
  border-top: 1px solid #F1F5F9;
  padding-top: 14px;
}
.cf-meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cf-meta-item:last-child { margin-bottom: 0; }
.cf-meta-label {
  font-size: 0.78rem;
  color: #64748B;
}
.cf-meta-value {
  font-size: 0.78rem;
  color: #0B1F47;
  font-weight: 600;
}

/* Tips */
.cf-tips-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.8rem;
  line-height: 1.8;
  color: #CBD5E1;
}
.cf-tips-list li { margin-bottom: 4px; }

/* Sidebar buttons */
.cf-sidebar-btn {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #E2E8F0;
  background: #fff;
  color: #475569;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}
.cf-sidebar-btn:last-child { margin-bottom: 0; }
.cf-sidebar-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}
.cf-sidebar-btn i { color: #0B1F47; font-size: 1rem; }

/* Buttons */
.cf-btn-primary,
.cf-btn-secondary {
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  border: none;
}
.cf-btn-primary {
  background: #0B1F47;
  color: #fff;
  box-shadow: 0 4px 12px rgba(11,31,71,0.25);
}
.cf-btn-primary:hover {
  background: #1a3a7a;
  transform: translateY(-1px);
}
.cf-btn-secondary {
  background: #fff;
  color: #64748B;
  border: 1px solid #E2E8F0;
}
.cf-btn-secondary:hover { background: #F1F5F9; }

/* Footer */
.cf-form-footer {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  display: none;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 992px) {
  .cf-form-footer { display: flex; }
  .cf-form-actions { display: none; }
}

/* Invalid state */
.cf-input.is-invalid,
.cf-textarea.is-invalid {
  border-color: #EF4444 !important;
  background: #FEF2F2 !important;
}

/* ================================================================
   RESPONSIVE - TABLET (768px - 991px)
   ================================================================ */
@media (max-width: 991px) {
  .cf-listado-container, .cf-form-container { padding: 16px; }
  .cf-listado-header, .cf-form-header { flex-direction: column; align-items: flex-start; }
  .cf-resumen-grid { grid-template-columns: repeat(2, 1fr); }
  .cf-table-toolbar { flex-direction: column; align-items: stretch; }
  .cf-table-search { max-width: none; }
  .cf-table-filters { justify-content: center; }
  .cf-form-grid { grid-template-columns: 1fr; }
  .cf-form-sidebar { order: -1; }
}

/* ================================================================
   RESPONSIVE - SMARTPHONE (< 768px)
   ================================================================ */
@media (max-width: 767px) {
  .cf-listado-container, .cf-form-container { padding: 12px; }
  .cf-listado-title, .cf-form-title { font-size: 1.25rem; }
  .cf-listado-subtitle, .cf-form-subtitle { font-size: 0.8rem; }
  .cf-resumen-grid { grid-template-columns: 1fr; gap: 12px; }
  .cf-resumen-card { padding: 14px 16px; }
  .cf-resumen-icon { width: 40px; height: 40px; font-size: 1rem; }
  .cf-resumen-value { font-size: 1.15rem; }
  .cf-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cf-table { min-width: 900px; }
  .cf-table-toolbar { padding: 12px; gap: 12px; }
  .cf-table-search input { padding: 12px 14px 12px 38px; font-size: 16px; }
  .cf-filter-btn { padding: 10px 14px; font-size: 0.8rem; }
  .dataTables_wrapper .dataTables_paginate { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .dataTables_wrapper .dataTables_paginate .paginate_button { padding: 8px 12px !important; margin: 0 !important; }
  .cf-btn-primary, .cf-btn-secondary { padding: 12px 20px; font-size: 0.95rem; min-height: 44px; }
  .cf-table .dropdown-toggle { width: 44px; height: 44px; }
  .modal-dialog { margin: 10px; }
  .cf-modal { border-radius: 12px; }
  .cf-modal-header { padding: 14px 16px; }
  .cf-modal-body { padding: 16px; }
  .cf-modal-footer { padding: 14px 16px; flex-direction: column; }
  .cf-modal-footer .cf-btn-primary, .cf-modal-footer .cf-btn-secondary { width: 100%; justify-content: center; }
  .cf-contacto-item { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .cf-contacto-actions { align-self: flex-end; }
  .cf-contacto-actions button { width: 44px; height: 44px; }
  .cf-field-row, .cf-field-row-3 { grid-template-columns: 1fr; gap: 12px; }
  .cf-input, .cf-textarea, .cf-input-readonly { padding: 14px; font-size: 16px; }
  .cf-checkbox-card { padding: 14px; }
  .cf-form-footer { display: flex; flex-direction: column; gap: 10px; }
  .cf-form-footer .cf-btn-primary, .cf-form-footer .cf-btn-secondary { width: 100%; justify-content: center; }
  .cf-form-actions { display: none; }
}

/* ================================================================
   RESPONSIVE - SMARTPHONE PEQUEÑO (< 480px)
   ================================================================ */
@media (max-width: 479px) {
  .cf-listado-header, .cf-form-header { gap: 12px; }
  .cf-listado-header .cf-btn-primary, .cf-form-header .cf-btn-primary { width: 100%; justify-content: center; }
  .cf-resumen-card { padding: 12px; }
  .cf-resumen-icon { width: 36px; height: 36px; }
  .cf-resumen-value { font-size: 1.1rem; }
}
</style>

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