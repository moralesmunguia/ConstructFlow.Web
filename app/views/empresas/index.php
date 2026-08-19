<?php
/**
 * Vista: empresas/index.php
 * Ref: DEF-WEB-014 (API Empresas) -- el API ya estaba 100% implementado
 * (EmpresaController/EmpresaService/EmpresaRepository, incluye endpoint de
 * configuracion); esta vista es la parte Web que faltaba para administrar
 * la arquitectura multiempresa.
 *
 * Consume:
 *   GET    /api/v1/empresas                     -> EmpresaController::index()
 *   GET    /api/v1/empresas/activas              -> EmpresaController::activas()
 *   GET    /api/v1/empresas/{id}                 -> EmpresaController::show()
 *   POST   /api/v1/empresas                      -> EmpresaController::store()
 *   PUT    /api/v1/empresas/{id}                 -> EmpresaController::update()
 *   DELETE /api/v1/empresas/{id}                 -> EmpresaController::delete()
 *   GET    /api/v1/empresas/{id}/configuracion    -> EmpresaController::configuracion()
 *   PUT    /api/v1/empresas/{id}/configuracion    -> EmpresaController::actualizarConfiguracion()
 *
 * Nota de negocio (RN-EMP-002 / DEF-WEB-014): EmpresaID se obtiene del JWT
 * y hay aislamiento total de informacion entre empresas; solo ADMIN
 * (RolID=1) puede ver/crear/editar todas las empresas -- el resto de
 * roles solo consulta su propia empresa (ya resuelto por el API en
 * EmpresaController::validarAccesoEmpresa()/index()).
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Empresas</span>
</nav>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div id="cfEmpresasListado" class="cf-listado-container">

    <div class="cf-listado-header">
        <div>
            <h1 class="cf-listado-title">Empresas</h1>
            <p class="cf-listado-subtitle">Administración multiempresa de ConstructFlow: alta, configuración y aislamiento de información por empresa.</p>
        </div>
        <button type="button" class="cf-btn-primary" id="btnNuevaEmpresa">
            <i class="bi bi-plus-lg"></i> Nueva Empresa
        </button>
    </div>

    <div class="cf-resumen-grid">
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
                <i class="bi bi-buildings"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfTotalEmpresas">—</span>
                <span class="cf-resumen-label">Total Empresas</span>
            </div>
        </div>
        <div class="cf-resumen-card">
            <div class="cf-resumen-icon" style="background:#ECFDF5;color:#059669;">
                <i class="bi bi-check-circle"></i>
            </div>
            <div class="cf-resumen-info">
                <span class="cf-resumen-value" id="cfEmpresasActivas">—</span>
                <span class="cf-resumen-label">Activas</span>
            </div>
        </div>
    </div>

    <div class="cf-card cf-card-table">
        <div class="cf-card-body" style="padding:0;">
            <div class="cf-table-toolbar">
                <div class="cf-table-search">
                    <i class="bi bi-search"></i>
                    <input type="text" id="cfBuscarEmpresas" placeholder="Buscar por nombre, código o RFC...">
                </div>
            </div>
            <div class="cf-table-wrap">
                <table id="tblEmpresas" class="cf-table" style="width:100%">
                    <thead>
                        <tr>
                            <th style="width:50px">ID</th>
                            <th style="width:110px">Código</th>
                            <th>Empresa</th>
                            <th style="width:140px">RFC</th>
                            <th>Contacto</th>
                            <th style="width:110px">Teléfono</th>
                            <th style="width:90px">Estado</th>
                            <th style="width:60px"></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

</div>

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Formulario Empresa (Nueva / Editar)
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalEmpresa" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-buildings"></i>
          </div>
          <div>
            <h5 class="cf-modal-title" id="tituloEmpresaForm">Nueva Empresa</h5>
            <span class="cf-modal-subtitle">Datos generales de la empresa</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body">
        <form id="cfFormEmpresa" onsubmit="return false;">
          <input type="hidden" id="cfEmpresaFormID">
          <input type="hidden" id="cfEmpresaFormRowVersion" value="1">

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Código de Empresa <span class="cf-required">*</span></label>
              <input type="text" id="cfCodigoEmpresa" class="cf-input" placeholder="EMP01" maxlength="20">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">RFC <span class="cf-required">*</span></label>
              <input type="text" id="cfEmpresaRFC" class="cf-input" placeholder="XAXX010101000" maxlength="13">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-label">Nombre / Razón Social <span class="cf-required">*</span></label>
              <input type="text" id="cfNombreEmpresa" class="cf-input" placeholder="Ej. ROM Constructora S.A. de C.V.">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-label">Dirección</label>
              <textarea id="cfEmpresaDireccion" class="cf-textarea" rows="2" placeholder="Calle, número, colonia, ciudad, estado, C.P."></textarea>
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Contacto</label>
              <input type="text" id="cfEmpresaContacto" class="cf-input" placeholder="Nombre del contacto">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Correo</label>
              <input type="email" id="cfEmpresaCorreo" class="cf-input" placeholder="contacto@empresa.com">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Teléfono</label>
              <input type="tel" id="cfEmpresaTelefono" class="cf-input" placeholder="(55) 1234-5678">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Sitio Web</label>
              <input type="text" id="cfEmpresaSitioWeb" class="cf-input" placeholder="https://empresa.com">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group cf-field-full">
              <label class="cf-label">Logo (URL)</label>
              <input type="text" id="cfEmpresaLogoURL" class="cf-input" placeholder="https://.../logo.png">
            </div>
          </div>
        </form>
      </div>
      <div class="cf-modal-footer">
        <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="cf-btn-primary" id="btnGuardarEmpresa">
          <i class="bi bi-check-lg"></i> Guardar Empresa
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     MODAL: Configuración de Empresa
     ═══════════════════════════════════════════════════════════════ -->
<div class="modal fade" id="modalConfigEmpresa" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content cf-modal">
      <div class="cf-modal-header">
        <div class="cf-modal-title-wrap">
          <div class="cf-modal-icon" style="background:#FEF3C7;color:#D97706;">
            <i class="bi bi-gear"></i>
          </div>
          <div>
            <h5 class="cf-modal-title">Configuración de Empresa</h5>
            <span class="cf-modal-subtitle" id="cfConfigEmpresaNombre">—</span>
          </div>
        </div>
        <button type="button" class="cf-modal-close" data-bs-dismiss="modal" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="cf-modal-body">
        <form id="cfFormConfigEmpresa" onsubmit="return false;">
          <input type="hidden" id="cfConfigEmpresaID">

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">IVA</label>
              <input type="number" id="cfConfigIVA" class="cf-input" step="0.0001" min="0" max="1" placeholder="0.16">
              <span class="cf-hint">Valor entre 0 y 1 (Ej. 0.16 = 16%)</span>
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Moneda</label>
              <input type="text" id="cfConfigMoneda" class="cf-input" placeholder="MXN" maxlength="10">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-label">Días de Vencimiento</label>
              <input type="number" id="cfConfigDiasVencimiento" class="cf-input" min="0" placeholder="30">
            </div>
            <div class="cf-field-group">
              <label class="cf-label">Logo (URL)</label>
              <input type="text" id="cfConfigLogoURL" class="cf-input" placeholder="https://.../logo.png">
            </div>
          </div>

          <div class="cf-field-row">
            <div class="cf-field-group">
              <label class="cf-checkbox-card">
                <input type="checkbox" id="cfConfigSabadoLaboral">
                <span class="cf-checkbox-indicator"></span>
                <span class="cf-checkbox-text">Sábado laborable</span>
              </label>
            </div>
            <div class="cf-field-group">
              <label class="cf-checkbox-card">
                <input type="checkbox" id="cfConfigDomingoLaboral">
                <span class="cf-checkbox-indicator"></span>
                <span class="cf-checkbox-text">Domingo laborable</span>
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="cf-modal-footer">
        <button type="button" class="cf-btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="cf-btn-primary" id="btnGuardarConfigEmpresa">
          <i class="bi bi-check-lg"></i> Guardar Configuración
        </button>
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
<script src="<?= BASE_URL ?>/public/js/empresas.js"></script>
