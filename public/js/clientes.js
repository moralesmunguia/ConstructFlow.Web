/**
 * clientes.js v4.0 - Diseño profesional + permisos + columna Dirección separada
 * Ref: DEF-WEB-007 (API Clientes) + DEF-WEB-000 (Estándares Frontend).
 */

const API_CLIENTES      = `${CF_API_BASE_URL}/clientes`;
const API_CONTACTOS     = `${CF_API_BASE_URL}/contactos`;
const API_EMPRESAS      = `${CF_API_BASE_URL}/empresas`;
const API_DIRECCIONES   = `${CF_API_BASE_URL}/cliente-direcciones`;

const $cardListado      = document.getElementById('cfCardListado');
const $cardFormulario   = document.getElementById('cfCardFormulario');
const $formTitulo       = document.getElementById('cfFormTitulo');
const $tblClientes      = $('#tblClientes');

let dtClientes = null;
let empresasCache = [];
let clientesData = [];

/* ================================================================
   PERMISOS
   ================================================================ */
const permisosClientes = CF_PERMISOS?.['clientes'] || {
    PuedeCrear: false,
    PuedeConsultar: false,
    PuedeActualizar: false,
    PuedeEliminar: false
};

/* ================================================================
   INICIALIZACIÓN
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initDataTable();
    cargarClientes();
    cargarEmpresas();

    // Botón Nuevo Cliente (solo si tiene permiso)
    const btnNuevo = document.getElementById('btnNuevoCliente');
    if (btnNuevo) {
        if (!permisosClientes.PuedeCrear) {
            btnNuevo.style.display = 'none';
        } else {
            btnNuevo.addEventListener('click', nuevoCliente);
        }
    }

    document.getElementById('btnCancelarFormulario')?.addEventListener('click', mostrarListado);
    document.getElementById('btnGuardarCliente')?.addEventListener('click', guardarCliente);
    document.getElementById('btnGuardarContacto')?.addEventListener('click', guardarContacto);
    document.getElementById('btnGuardarDireccion')?.addEventListener('click', guardarDireccion);

    document.getElementById('cfRFC')?.addEventListener('blur', function() {
        this.value = this.value.toUpperCase().trim();
    });

    // Búsqueda custom
    document.getElementById('cfBuscarClientes')?.addEventListener('input', (e) => {
        dtClientes.search(e.target.value).draw();
    });

    // Filtros rápidos
    document.querySelectorAll('.cf-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cf-filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const filtro = btn.dataset.filtro;
            if (filtro === 'todos') {
                dtClientes.column(8).search('').draw();
            } else if (filtro === 'activos') {
                dtClientes.column(8).search('Activo').draw();
            } else if (filtro === 'inactivos') {
                dtClientes.column(8).search('Inactivo').draw();
            }
        });
    });
});

/* ================================================================
   NAVEGACIÓN LISTADO ↔ FORMULARIO
   ================================================================ */
function mostrarListado() {
    $cardFormulario.style.display = 'none';
    $cardListado.style.display   = 'block';
    cargarClientes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarFormulario(titulo) {
    $cardListado.style.display   = 'none';
    $cardFormulario.style.display = 'block';
    $formTitulo.textContent = titulo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   DATATABLE (sin ajax nativo; se alimenta manualmente desde axios)
   ================================================================ */
function initDataTable() {
    // Verificar que la tabla exista
    if ($tblClientes.length === 0) {
        console.error('[ERROR] No se encontró la tabla #tblClientes en el DOM.');
        console.error('[ERROR] Asegúrate de pegar el HTML completo de listado_clientes.html en tu vista PHP.');
        Swal.fire({
            icon: 'error',
            title: 'Error de inicialización',
            html: 'No se encontró la tabla de clientes.<br><br>Asegúrate de que el HTML de <code>listado_clientes.html</code> esté completo en tu vista.',
            confirmButtonColor: '#0B1F47'
        });
        return;
    }

    // Configuración base (no depende de window.DT_CONFIG)
    const baseConfig = (typeof window.DT_CONFIG === 'object' && window.DT_CONFIG !== null)
        ? window.DT_CONFIG
        : {
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-MX.json'
            }
          };

    dtClientes = $tblClientes.DataTable({
        ...baseConfig,
        columns: [
            {
                data: 'ClienteID',
                width: '50px',
                className: 'text-center',
                render: (d) => `<span class="font-monospace text-muted" style="font-size:.8rem">#${d}</span>`
            },
            {
                data: null,
                render: (d, t, row) => `
                    <div class="cf-table-cliente">
                        <div class="cf-table-avatar">${row.NombreCliente ? row.NombreCliente.charAt(0).toUpperCase() : '?'}</div>
                        <div class="cf-table-cliente-info">
                            <div class="cf-table-cliente-nombre">${escapeHtml(row.NombreCliente)}</div>
                        </div>
                    </div>`
            },
            {
                data: 'RFC',
                render: (d) => `<span class="font-monospace" style="color:#64748B;font-size:.82rem">${escapeHtml(d || '-')}</span>`
            },
            {
                data: 'Direccion',
                render: (d) => {
                    if (!d) return '<span class="text-muted" style="font-size:.82rem">—</span>';
                    const corta = d.length > 40 ? d.substring(0, 40) + '...' : d;
                    return `<span style="font-size:.82rem;color:#475569" title="${escapeHtml(d)}">${escapeHtml(corta)}</span>`;
                }
            },
            {
                data: 'ContactoPrincipal',
                render: (d) => d ? `<span style="font-size:.85rem">${escapeHtml(d)}</span>` : '<span class="text-muted" style="font-size:.82rem">—</span>'
            },
            {
                data: 'Correo',
                render: (d) => d
                    ? `<a href="mailto:${escapeHtml(d)}" style="color:#2563EB;text-decoration:none;font-size:.82rem">${escapeHtml(d)}</a>`
                    : '<span class="text-muted" style="font-size:.82rem">—</span>'
            },
            {
                data: 'Telefono',
                render: (d) => d ? `<span style="font-size:.82rem">${escapeHtml(d)}</span>` : '<span class="text-muted" style="font-size:.82rem">—</span>'
            },
            {
                data: 'LimiteCredito',
                className: 'text-end',
                render: (d) => `<span style="font-size:.85rem;font-weight:600;color:#0B1F47">${d ? '$' + parseFloat(d).toLocaleString('es-MX',{minimumFractionDigits:2}) : '$0.00'}</span>`
            },
            {
                data: 'DiasCredito',
                className: 'text-center',
                render: (d) => `<span style="font-size:.82rem">${d || '30'}</span>`
            },
            {
                data: 'IsActive',
                className: 'text-center',
                render: (d) => {
                    const activo = (d == 1 || d === true);
                    return `<span class="cf-badge-estado ${activo ? 'activo' : 'inactivo'}">
                        <span class="cf-badge-estado-dot"></span>
                        ${activo ? 'Activo' : 'Inactivo'}
                    </span>`;
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-end',
                width: '50px',
                render: (d, t, row) => construirAcciones(row)
            }
        ],
        order: [[0, 'desc']],
        pageLength: 10,
        language: {
            info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
            infoEmpty: 'Mostrando 0 a 0 de 0 registros',
            infoFiltered: '(filtrado de _MAX_ registros)',
            paginate: { previous: '← Anterior', next: 'Siguiente →' },
            lengthMenu: 'Mostrar _MENU_ registros',
            zeroRecords: 'No se encontraron clientes',
            emptyTable: 'No hay clientes registrados'
        }
    });
}

/* ---- Construir dropdown de acciones con validación de permisos ---- */
function construirAcciones(row) {
    const items = [];

    // Editar: requiere PuedeActualizar
    if (permisosClientes.PuedeActualizar) {
        items.push(`<li><a class="dropdown-item" href="#" onclick="editarCliente(${row.ClienteID});return false;">
            <i class="bi bi-pencil-square me-2" style="color:#3B82F6"></i>Editar
        </a></li>`);
    }

    // Dirección: requiere PuedeActualizar (o PuedeConsultar si solo es ver)
    if (permisosClientes.PuedeActualizar) {
        items.push(`<li><a class="dropdown-item" href="#" onclick="editarDireccionCliente(${row.ClienteID});return false;">
            <i class="bi bi-geo-alt me-2" style="color:#F59E0B"></i>Dirección
        </a></li>`);
    }

    // Contactos: requiere PuedeConsultar
    if (permisosClientes.PuedeConsultar) {
        items.push(`<li><a class="dropdown-item" href="#" onclick="verContactos(${row.ClienteID},'${escapeJsString(row.NombreCliente||'')}');return false;">
            <i class="bi bi-people me-2" style="color:#06B6D4"></i>Contactos
        </a></li>`);
    }

    // Eliminar: requiere PuedeEliminar
    if (permisosClientes.PuedeEliminar) {
        if (items.length > 0) {
            items.push(`<li><hr class="dropdown-divider"></li>`);
        }
        items.push(`<li><a class="dropdown-item text-danger" href="#" onclick="eliminarCliente(${row.ClienteID},'${escapeJsString(row.NombreCliente||'')}');return false;">
            <i class="bi bi-trash me-2"></i>Eliminar
        </a></li>`);
    }

    // Si no tiene ningún permiso de acción, mostrar indicador
    if (items.length === 0) {
        return `<span class="text-muted" style="font-size:.8rem"><i class="bi bi-lock"></i></span>`;
    }

    return `
        <div class="dropdown">
            <button class="btn btn-sm" data-bs-toggle="dropdown" style="background:transparent;border:none;color:#94A3B8;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;transition:all .2s" onmouseover="this.style.background='#F1F5F9';this.style.color='#0B1F47'" onmouseout="this.style.background='transparent';this.style.color='#94A3B8'">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" style="border-radius:12px;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,.1);padding:8px;min-width:180px;font-size:.85rem">
                ${items.join('')}
            </ul>
        </div>`;
}

/* ---- Carga con axios (respeta el token JWT global) ---- */
async function cargarClientes() {
    try {
        const res = await axios.get(API_CLIENTES);
        const json = res.data;

        let data = [];
        if (json.success !== undefined) {
            data = json.data || [];
        } else {
            data = json;
        }

        clientesData = data;

        if (!dtClientes) {
            console.error('[ERROR] DataTable no inicializado. Revisa que jQuery y DataTables estén cargados.');
            return;
        }

        dtClientes.clear().rows.add(data).draw();
        actualizarResumen(data);

    } catch (err) {
        console.error('[DEBUG] Error axios /clientes:', err);

        let msg = 'Error desconocido';
        let detail = '';

        if (err.response) {
            const xhr = err.response;
            if (xhr.status === 404) {
                msg = 'Endpoint no encontrado (404)';
                detail = 'Verifica que la API tenga implementado GET /api/v1/clientes\nURL: ' + API_CLIENTES;
            } else if (xhr.status === 401) {
                msg = 'Sesión expirada (401)';
                detail = 'El token JWT puede haber expirado.';
            } else if (xhr.status === 403) {
                msg = 'Sin permisos (403)';
            } else if (xhr.status === 500) {
                msg = 'Error interno del servidor (500)';
                detail = xhr.data ? JSON.stringify(xhr.data).substring(0, 200) : '';
            } else {
                msg = `Error ${xhr.status}`;
                detail = xhr.data ? JSON.stringify(xhr.data).substring(0, 200) : '';
            }
        } else {
            msg = 'Error de conexión';
            detail = err.message;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error al cargar clientes',
            html: `<strong>${msg}</strong><br><br><pre style="text-align:left;font-size:11px;background:#f8f9fa;padding:8px;border-radius:4px;max-height:150px;overflow:auto">${detail}</pre>`,
            confirmButtonColor: '#0B1F47',
            width: '600px'
        });
    }
}

/* ---- Actualizar cards de resumen ---- */
function actualizarResumen(data) {
    const total = data.length;
    const activos = data.filter((c) => c.IsActive == 1 || c.IsActive === true).length;
    const inactivos = total - activos;
    const creditoTotal = data.reduce((sum, c) => sum + (parseFloat(c.LimiteCredito) || 0), 0);

    document.getElementById('cfTotalClientes').textContent = total.toLocaleString('es-MX');
    document.getElementById('cfClientesActivos').textContent = activos.toLocaleString('es-MX');
    document.getElementById('cfClientesInactivos').textContent = inactivos.toLocaleString('es-MX');
    document.getElementById('cfCreditoTotal').textContent = '$' + creditoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

/* ================================================================
   CRUD CLIENTES
   ================================================================ */
function nuevoCliente() {
    if (!permisosClientes.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear clientes.', confirmButtonColor: '#0B1F47' });
    }
    limpiarFormulario();
    document.getElementById('cfIsActive').checked = true;
    document.getElementById('cfLimiteCredito').value = '0.00';
    document.getElementById('cfDiasCredito').value = '30';
    document.getElementById('cfRowVersion').value = '1';

    // Empresa desde sesión (readonly)
    const empresaID = CF_EMPRESA_ID || 1;
    const empresaNombre = CF_EMPRESA_NOMBRE || `Empresa #${empresaID}`;
    document.getElementById('cfEmpresaID').value = empresaID;
    const display = document.getElementById('cfEmpresaNombreDisplay');
    if (display) display.textContent = empresaNombre;

    // Estado visual
    actualizarEstadoVisual(true, null);

    mostrarFormulario('Nuevo Cliente');
}

function editarCliente(id) {
    if (!permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar clientes.', confirmButtonColor: '#0B1F47' });
    }
    axios.get(`${API_CLIENTES}/${id}`)
        .then(res => {
            const c = res.data.success !== undefined ? res.data.data : res.data;
            poblarFormulario(c);
            mostrarFormulario('Editar Cliente');
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el cliente', confirmButtonColor: '#0B1F47' });
        });
}

/* ---- Nueva: editar solo dirección (shortcut desde el listado) ---- */
function editarDireccionCliente(id) {
    if (!permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para modificar la dirección.', confirmButtonColor: '#0B1F47' });
    }
    axios.get(`${API_CLIENTES}/${id}`)
        .then(res => {
            const c = res.data.success !== undefined ? res.data.data : res.data;
            poblarFormulario(c);
            // Enfocar el campo de dirección
            mostrarFormulario('Editar Dirección');
            setTimeout(() => {
                document.getElementById('cfDireccion')?.focus();
            }, 300);
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el cliente', confirmButtonColor: '#0B1F47' });
        });
}

function poblarFormulario(c) {
    document.getElementById('cfClienteID').value      = c.ClienteID || '';
    document.getElementById('cfRowVersion').value      = c.RowVersion || '1';
    document.getElementById('cfNombreCliente').value   = c.NombreCliente || '';
    document.getElementById('cfRFC').value             = c.RFC || '';
    document.getElementById('cfContactoPrincipal').value = c.ContactoPrincipal || '';
    document.getElementById('cfCorreo').value          = c.Correo || '';
    document.getElementById('cfTelefono').value        = c.Telefono || '';
    document.getElementById('cfDireccion').value       = c.Direccion || '';
    document.getElementById('cfLimiteCredito').value  = c.LimiteCredito || '0.00';
    document.getElementById('cfDiasCredito').value   = c.DiasCredito || '30';
    document.getElementById('cfObservaciones').value = c.Observaciones || '';

    // Empresa (readonly desde sesión o del cliente si ya tiene)
    const empresaID = c.EmpresaID || CF_EMPRESA_ID || 1;
    const empresaNombre = CF_EMPRESA_NOMBRE || `Empresa #${empresaID}`;
    document.getElementById('cfEmpresaID').value = empresaID;
    const display = document.getElementById('cfEmpresaNombreDisplay');
    if (display) display.textContent = empresaNombre;

    document.getElementById('cfIsActive').checked = (c.IsActive == 1 || c.IsActive === true);

    // Estado visual sidebar
    actualizarEstadoVisual(c.IsActive == 1 || c.IsActive === true, c.ClienteID);
}

function actualizarEstadoVisual(activo, clienteID) {
    const badge = document.getElementById('cfStatusBadge');
    const idDisplay = document.getElementById('cfClienteIDDisplay');
    if (idDisplay) idDisplay.textContent = clienteID ? `#${clienteID}` : '—';

    if (badge) {
        if (activo) {
            badge.className = 'cf-status-badge';
            badge.innerHTML = `<span class="cf-status-dot" style="background:#059669;box-shadow:0 0 0 4px rgba(5,150,105,0.2)"></span><span class="cf-status-text" style="color:#059669">Activo</span>`;
        } else {
            badge.className = 'cf-status-badge';
            badge.style.background = '#FEF2F2';
            badge.style.borderColor = '#FECACA';
            badge.innerHTML = `<span class="cf-status-dot" style="background:#DC2626;box-shadow:0 0 0 4px rgba(220,38,38,0.2)"></span><span class="cf-status-text" style="color:#DC2626">Inactivo</span>`;
        }
    }
}

function guardarCliente() {
    const id = document.getElementById('cfClienteID').value;
    const esNuevo = !id;

    if (esNuevo && !permisosClientes.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear clientes.', confirmButtonColor: '#0B1F47' });
    }
    if (!esNuevo && !permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar clientes.', confirmButtonColor: '#0B1F47' });
    }

    limpiarErroresFormulario();

    const payload = {
        EmpresaID:          parseInt(document.getElementById('cfEmpresaID').value) || null,
        NombreCliente:      document.getElementById('cfNombreCliente').value.trim(),
        RFC:                document.getElementById('cfRFC').value.trim().toUpperCase(),
        ContactoPrincipal:  document.getElementById('cfContactoPrincipal').value.trim() || null,
        Telefono:           document.getElementById('cfTelefono').value.trim() || null,
        Correo:             document.getElementById('cfCorreo').value.trim() || null,
        Direccion:          document.getElementById('cfDireccion').value.trim() || null,
        LimiteCredito:      parseFloat(document.getElementById('cfLimiteCredito').value) || 0,
        DiasCredito:        parseInt(document.getElementById('cfDiasCredito').value) || 30,
        Observaciones:      document.getElementById('cfObservaciones').value.trim() || null,
        IsActive:           document.getElementById('cfIsActive').checked ? 1 : 0,
        RowVersion:         parseInt(document.getElementById('cfRowVersion').value) || 1
    };

    const errores = [];
    if (!payload.NombreCliente) {
        marcarInvalido('cfNombreCliente');
        errores.push('El nombre del cliente es obligatorio.');
    }
    if (!payload.RFC) {
        marcarInvalido('cfRFC');
        errores.push('El RFC es obligatorio.');
    }
    if (!payload.EmpresaID) {
        marcarInvalido('cfEmpresaID');
        errores.push('La empresa es obligatoria.');
    }

    if (errores.length) {
        return Swal.fire({
            icon: 'warning',
            title: 'Revisa el formulario',
            html: `<ul style="text-align:left;margin:0;padding-left:18px">${errores.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`,
            confirmButtonColor: '#0B1F47'
        });
    }

    const url    = id ? `${API_CLIENTES}/${id}` : API_CLIENTES;
    const method = id ? 'put' : 'post';

    axios[method](url, payload)
        .then(() => {
            Swal.fire({
                icon: 'success', title: id ? 'Cliente actualizado' : 'Cliente creado',
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true
            });
            mostrarListado();
        })
        .catch(err => {
            let msg = err.response?.data?.message || 'Error al guardar';
            if (err.response?.status === 422 && err.response.data?.errors) {
                msg = Object.values(err.response.data.errors).flat().join('\n');
            }
            Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#0B1F47' });
        });
}

function eliminarCliente(id, nombre) {
    if (!permisosClientes.PuedeEliminar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para eliminar clientes.', confirmButtonColor: '#0B1F47' });
    }
    Swal.fire({
        title: '¿Eliminar cliente?',
        html: `<strong>${escapeHtml(nombre)}</strong><br><small class="text-muted">Eliminación lógica (IsActive = 0)</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: '<i class="bi bi-trash me-1"></i> Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(r => {
        if (r.isConfirmed) {
            axios.delete(`${API_CLIENTES}/${id}`)
                .then(() => {
                    Swal.fire({ icon:'success', title:'Eliminado', toast:true, position:'top-end', showConfirmButton:false, timer:2000 });
                    cargarClientes();
                })
                .catch(err => {
                    Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || 'No se pudo eliminar', confirmButtonColor:'#0B1F47' });
                });
        }
    });
}

function limpiarFormulario() {
    document.getElementById('cfClienteID').value = '';
    document.getElementById('cfNombreCliente').value = '';
    document.getElementById('cfRFC').value = '';
    document.getElementById('cfContactoPrincipal').value = '';
    document.getElementById('cfCorreo').value = '';
    document.getElementById('cfTelefono').value = '';
    document.getElementById('cfDireccion').value = '';
    document.getElementById('cfLimiteCredito').value = '0.00';
    document.getElementById('cfDiasCredito').value = '30';
    document.getElementById('cfObservaciones').value = '';
    document.getElementById('cfIsActive').checked = true;
    document.getElementById('cfRowVersion').value = '1';
}

function marcarInvalido(id) {
    document.getElementById(id)?.classList.add('is-invalid');
}

function limpiarErroresFormulario() {
    document.querySelectorAll('#cfCardFormulario .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
}

/* ================================================================
   CONTACTOS
   ================================================================ */
function verContactos(clienteId, nombreCliente) {
    if (!permisosClientes.PuedeConsultar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para ver contactos.', confirmButtonColor: '#0B1F47' });
    }
    document.getElementById('tituloContactos').textContent = `Contactos de ${nombreCliente}`;
    const container = document.getElementById('contactosContainer');
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem"></div>
            <p class="text-muted mt-3">Cargando contactos...</p>
        </div>`;
    new bootstrap.Modal(document.getElementById('modalContactos')).show();

    axios.get(`${API_CLIENTES}/${clienteId}/contactos`)
        .then(res => {
            const contactos = res.data.success !== undefined ? (res.data.data || []) : res.data;
            if (!contactos.length) {
                container.innerHTML = `
                    <div class="cf-contactos-empty">
                        <i class="bi bi-person-x"></i>
                        <p>No hay contactos registrados para este cliente.</p>
                        ${permisosClientes.PuedeActualizar ? `
                        <button class="cf-btn-primary" style="padding:8px 18px;font-size:.85rem" onclick="abrirModalContacto(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar Contacto
                        </button>` : ''}
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="cf-contactos-header">
                        <span class="cf-contactos-count">${contactos.length} contacto(s) registrado(s)</span>
                        ${permisosClientes.PuedeActualizar ? `
                        <button class="cf-btn-primary" style="padding:8px 16px;font-size:.82rem" onclick="abrirModalContacto(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar
                        </button>` : ''}
                    </div>
                    <div>
                        ${contactos.map(c => `
                            <div class="cf-contacto-item">
                                <div style="display:flex;align-items:center;gap:12px">
                                    <div class="cf-contacto-avatar ${c.Principal==1||c.Principal===true?'principal':'normal'}">
                                        ${c.Nombre ? c.Nombre.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div class="cf-contacto-info">
                                        <div class="cf-contacto-nombre">
                                            ${escapeHtml(c.Nombre)}
                                            ${c.Principal==1||c.Principal===true ? '<span class="cf-contacto-badge">PRINCIPAL</span>' : ''}
                                        </div>
                                        <div class="cf-contacto-meta">${escapeHtml(c.Puesto||'Sin puesto')} • ${escapeHtml(c.Correo||'Sin correo')} • ${escapeHtml(c.Telefono||'Sin teléfono')}</div>
                                    </div>
                                </div>
                                <div class="cf-contacto-actions">
                                    ${permisosClientes.PuedeActualizar ? `
                                    <button onclick="editarContacto(${c.ClienteContactoID})" title="Editar"><i class="bi bi-pencil" style="color:#3B82F6"></i></button>
                                    ` : ''}
                                    ${permisosClientes.PuedeEliminar ? `
                                    <button onclick="eliminarContacto(${c.ClienteContactoID},'${escapeJsString(c.Nombre||'')}')" title="Eliminar"><i class="bi bi-trash" style="color:#EF4444"></i></button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>`;
            }
        })
        .catch(err => {
            container.innerHTML = `<div class="alert alert-danger m-3">${err.response?.data?.message || 'Error al cargar contactos'}</div>`;
        });
}

function abrirModalContacto(clienteId) {
    if (!permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para agregar contactos.', confirmButtonColor: '#0B1F47' });
    }
    document.getElementById('cfContactoID').value = '';
    document.getElementById('cfContactoClienteID').value = clienteId;
    document.getElementById('cfContactoRowVersion').value = '1';
    document.getElementById('cfContactoNombre').value = '';
    document.getElementById('cfContactoPuesto').value = '';
    document.getElementById('cfContactoCorreo').value = '';
    document.getElementById('cfContactoTelefono').value = '';
    document.getElementById('cfContactoCelular').value = '';
    document.getElementById('cfContactoPrincipal').checked = false;
    document.getElementById('tituloContactoForm').textContent = 'Nuevo Contacto';
    new bootstrap.Modal(document.getElementById('modalContacto')).show();
}

function editarContacto(contactoId) {
    if (!permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar contactos.', confirmButtonColor: '#0B1F47' });
    }
    axios.get(`${API_CONTACTOS}/${contactoId}`)
        .then(res => {
            const c = res.data.success !== undefined ? res.data.data : res.data;
            document.getElementById('cfContactoID').value         = c.ClienteContactoID || '';
            document.getElementById('cfContactoClienteID').value  = c.ClienteID || '';
            document.getElementById('cfContactoRowVersion').value = c.RowVersion || '1';
            document.getElementById('cfContactoNombre').value     = c.Nombre || '';
            document.getElementById('cfContactoPuesto').value     = c.Puesto || '';
            document.getElementById('cfContactoCorreo').value     = c.Correo || '';
            document.getElementById('cfContactoTelefono').value    = c.Telefono || '';
            document.getElementById('cfContactoCelular').value     = c.Celular || '';
            document.getElementById('cfContactoPrincipal').checked = (c.Principal == 1 || c.Principal === true);
            document.getElementById('tituloContactoForm').textContent = 'Editar Contacto';
            new bootstrap.Modal(document.getElementById('modalContacto')).show();
        })
        .catch(err => {
            Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || 'No se pudo cargar el contacto', confirmButtonColor:'#0B1F47' });
        });
}

function guardarContacto() {
    const id = document.getElementById('cfContactoID').value;
    const esNuevo = !id;

    if (esNuevo && !permisosClientes.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear contactos.', confirmButtonColor: '#0B1F47' });
    }
    if (!esNuevo && !permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar contactos.', confirmButtonColor: '#0B1F47' });
    }

    const payload = {
        ClienteID:  parseInt(document.getElementById('cfContactoClienteID').value),
        Nombre:     document.getElementById('cfContactoNombre').value.trim(),
        Puesto:     document.getElementById('cfContactoPuesto').value.trim() || null,
        Correo:     document.getElementById('cfContactoCorreo').value.trim() || null,
        Telefono:   document.getElementById('cfContactoTelefono').value.trim() || null,
        Celular:    document.getElementById('cfContactoCelular').value.trim() || null,
        Principal:  document.getElementById('cfContactoPrincipal').checked ? 1 : 0,
        RowVersion: parseInt(document.getElementById('cfContactoRowVersion').value) || 1
    };

    if (!payload.Nombre) {
        return Swal.fire({icon:'warning',title:'Validación',text:'El nombre del contacto es obligatorio.',confirmButtonColor:'#0B1F47'});
    }

    const url    = id ? `${API_CONTACTOS}/${id}` : API_CONTACTOS;
    const method = id ? 'put' : 'post';

    axios[method](url, payload)
        .then(() => {
            bootstrap.Modal.getInstance(document.getElementById('modalContacto')).hide();
            Swal.fire({ icon:'success', title: id ? 'Contacto actualizado' : 'Contacto creado', toast:true, position:'top-end', showConfirmButton:false, timer:2000 });
            const clienteId = document.getElementById('cfContactoClienteID').value;
            const titulo = document.getElementById('tituloContactos').textContent.replace('Contactos de ','');
            verContactos(parseInt(clienteId), titulo);
        })
        .catch(err => {
            let msg = err.response?.data?.message || 'Error al guardar';
            if (err.response?.status === 422 && err.response.data?.errors) {
                msg = Object.values(err.response.data.errors).flat().join('\n');
            }
            Swal.fire({ icon:'error', title:'Error', text: msg, confirmButtonColor:'#0B1F47' });
        });
}

function eliminarContacto(id, nombre) {
    if (!permisosClientes.PuedeEliminar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para eliminar contactos.', confirmButtonColor: '#0B1F47' });
    }
    Swal.fire({
        title: '¿Eliminar contacto?',
        text: nombre,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(r => {
        if (r.isConfirmed) {
            axios.delete(`${API_CONTACTOS}/${id}`)
                .then(() => {
                    Swal.fire({ icon:'success', title:'Eliminado', toast:true, position:'top-end', showConfirmButton:false, timer:2000 });
                    const clienteId = document.getElementById('cfContactoClienteID').value;
                    const titulo = document.getElementById('tituloContactos').textContent.replace('Contactos de ','');
                    verContactos(parseInt(clienteId), titulo);
                })
                .catch(err => {
                    Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || 'No se pudo eliminar', confirmButtonColor:'#0B1F47' });
                });
        }
    });
}

/* ================================================================
   DIRECCIONES (Múltiples por cliente - Solo una principal)
   ================================================================ */
function verDirecciones(clienteId, nombreCliente) {
    if (!permisosClientes.PuedeConsultar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para ver direcciones.', confirmButtonColor: '#0B1F47' });
    }
    document.getElementById('tituloDirecciones').textContent = `Direcciones de ${nombreCliente}`;
    const container = document.getElementById('direccionesContainer');
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem"></div>
            <p class="text-muted mt-3">Cargando direcciones...</p>
        </div>`;
    new bootstrap.Modal(document.getElementById('modalDirecciones')).show();

    axios.get(`${API_CLIENTES}/${clienteId}/direcciones`)
        .then(res => {
            const direcciones = res.data.success !== undefined ? (res.data.data || []) : res.data;
            if (!direcciones.length) {
                container.innerHTML = `
                    <div class="cf-contactos-empty">
                        <i class="bi bi-geo-alt" style="font-size:52px;color:#CBD5E1"></i>
                        <p>No hay direcciones registradas para este cliente.</p>
                        ${permisosClientes.PuedeCrear ? `
                        <button class="cf-btn-primary" style="padding:8px 18px;font-size:.85rem" onclick="abrirModalDireccion(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar Dirección
                        </button>` : ''}
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="cf-contactos-header">
                        <span class="cf-contactos-count">${direcciones.length} dirección(es) registrada(s)</span>
                        ${permisosClientes.PuedeCrear ? `
                        <button class="cf-btn-primary" style="padding:8px 16px;font-size:.82rem" onclick="abrirModalDireccion(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar
                        </button>` : ''}
                    </div>
                    <div>
                        ${direcciones.map(d => `
                            <div class="cf-contacto-item" style="align-items:flex-start">
                                <div style="display:flex;align-items:flex-start;gap:12px">
                                    <div class="cf-contacto-avatar ${d.Principal==1||d.Principal===true?'principal':'normal'}" style="margin-top:2px">
                                        <i class="bi bi-geo-alt" style="font-size:.9rem"></i>
                                    </div>
                                    <div class="cf-contacto-info">
                                        <div class="cf-contacto-nombre">
                                            ${escapeHtml(d.TipoDireccion || 'Dirección')}
                                            ${d.Principal==1||d.Principal===true ? '<span class="cf-contacto-badge">PRINCIPAL</span>' : ''}
                                        </div>
                                        <div class="cf-contacto-meta" style="line-height:1.6;margin-top:4px">
                                            ${escapeHtml(d.Calle || '')} ${escapeHtml(d.NumeroExterior || '')}${d.NumeroInterior ? ' Int. ' + escapeHtml(d.NumeroInterior) : ''}<br>
                                            ${escapeHtml(d.Colonia || '')}${d.Colonia && d.CodigoPostal ? ', ' + escapeHtml(d.CodigoPostal) : ''}<br>
                                            ${escapeHtml(d.Municipio || '')}${d.Municipio && d.Estado ? ', ' + escapeHtml(d.Estado) : ''}${d.Pais ? ', ' + escapeHtml(d.Pais) : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="cf-contacto-actions" style="flex-shrink:0">
                                    ${permisosClientes.PuedeActualizar ? `
                                    <button onclick="editarDireccion(${d.ClienteDireccionID})" title="Editar"><i class="bi bi-pencil" style="color:#3B82F6"></i></button>
                                    ` : ''}
                                    ${permisosClientes.PuedeEliminar ? `
                                    <button onclick="eliminarDireccion(${d.ClienteDireccionID},'${escapeJsString(d.TipoDireccion||'Dirección')}')" title="Eliminar"><i class="bi bi-trash" style="color:#EF4444"></i></button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>`;
            }
        })
        .catch(err => {
            container.innerHTML = `<div class="alert alert-danger m-3">${err.response?.data?.message || 'Error al cargar direcciones'}</div>`;
        });
}

function abrirModalDireccion(clienteId) {
    if (!permisosClientes.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para agregar direcciones.', confirmButtonColor: '#0B1F47' });
    }
    document.getElementById('cfDireccionID').value = '';
    document.getElementById('cfDireccionClienteID').value = clienteId;
    document.getElementById('cfDireccionRowVersion').value = '1';
    document.getElementById('cfDireccionTipo').value = 'FISCAL';
    document.getElementById('cfDireccionCalle').value = '';
    document.getElementById('cfDireccionNumeroExt').value = '';
    document.getElementById('cfDireccionNumeroInt').value = '';
    document.getElementById('cfDireccionColonia').value = '';
    document.getElementById('cfDireccionMunicipio').value = '';
    document.getElementById('cfDireccionEstado').value = '';
    document.getElementById('cfDireccionCP').value = '';
    document.getElementById('cfDireccionPais').value = 'México';
    document.getElementById('cfDireccionPrincipal').checked = false;
    document.getElementById('tituloDireccionForm').textContent = 'Nueva Dirección';
    new bootstrap.Modal(document.getElementById('modalDireccion')).show();
}

function editarDireccion(direccionId) {
    if (!permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar direcciones.', confirmButtonColor: '#0B1F47' });
    }
    axios.get(`${API_DIRECCIONES}/${direccionId}`)
        .then(res => {
            const d = res.data.success !== undefined ? res.data.data : res.data;
            document.getElementById('cfDireccionID').value         = d.ClienteDireccionID || '';
            document.getElementById('cfDireccionClienteID').value  = d.ClienteID || '';
            document.getElementById('cfDireccionRowVersion').value = d.RowVersion || '1';
            document.getElementById('cfDireccionTipo').value       = d.TipoDireccion || 'FISCAL';
            document.getElementById('cfDireccionCalle').value      = d.Calle || '';
            document.getElementById('cfDireccionNumeroExt').value  = d.NumeroExterior || '';
            document.getElementById('cfDireccionNumeroInt').value  = d.NumeroInterior || '';
            document.getElementById('cfDireccionColonia').value    = d.Colonia || '';
            document.getElementById('cfDireccionMunicipio').value     = d.Municipio || '';
            document.getElementById('cfDireccionEstado').value     = d.Estado || '';
            document.getElementById('cfDireccionCP').value         = d.CodigoPostal || '';
            document.getElementById('cfDireccionPais').value       = d.Pais || 'México';
            document.getElementById('cfDireccionPrincipal').checked = (d.Principal == 1 || d.Principal === true);
            document.getElementById('tituloDireccionForm').textContent = 'Editar Dirección';
            new bootstrap.Modal(document.getElementById('modalDireccion')).show();
        })
        .catch(err => {
            Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || 'No se pudo cargar la dirección', confirmButtonColor:'#0B1F47' });
        });
}

async function guardarDireccion() {
    const id = document.getElementById('cfDireccionID').value;
    const esNuevo = !id;
    const clienteId = parseInt(document.getElementById('cfDireccionClienteID').value);

    if (esNuevo && !permisosClientes.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear direcciones.', confirmButtonColor: '#0B1F47' });
    }
    if (!esNuevo && !permisosClientes.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar direcciones.', confirmButtonColor: '#0B1F47' });
    }

    const marcarPrincipal = document.getElementById('cfDireccionPrincipal').checked;

    // ---- Si se marca como principal, desmarcar las demás primero ----
    if (marcarPrincipal) {
        try {
            const resp = await axios.get(`${API_CLIENTES}/${clienteId}/direcciones`);
            const direcciones = resp.data.success !== undefined ? (resp.data.data || []) : resp.data;
            const otrasPrincipales = direcciones.filter(
                (d) => (d.Principal == 1 || d.Principal === true) && String(d.ClienteDireccionID) !== String(id)
            );

            for (const otra of otrasPrincipales) {
                await axios.put(`${API_DIRECCIONES}/${otra.ClienteDireccionID}`, {
                    ClienteID:       otra.ClienteID,
                    TipoDireccion:   otra.TipoDireccion,
                    Calle:           otra.Calle,
                    NumeroExterior:  otra.NumeroExterior,
                    NumeroInterior:  otra.NumeroInterior,
                    Colonia:         otra.Colonia,
                    Municipio:       otra.Municipio,
                    Estado:          otra.Estado,
                    CodigoPostal:    otra.CodigoPostal,
                    Pais:            otra.Pais,
                    Principal:       0,
                    IsActive:        otra.IsActive,
                    RowVersion:      otra.RowVersion || 1
                });
            }
        } catch (e) {
            console.warn('No se pudieron desmarcar otras direcciones principales:', e);
        }
    }

    const payload = {
        ClienteID:       clienteId,
        TipoDireccion:   document.getElementById('cfDireccionTipo').value,
        Calle:           document.getElementById('cfDireccionCalle').value.trim(),
        NumeroExterior:  document.getElementById('cfDireccionNumeroExt').value.trim(),
        NumeroInterior:  document.getElementById('cfDireccionNumeroInt').value.trim() || null,
        Colonia:         document.getElementById('cfDireccionColonia').value.trim(),
        Municipio:       document.getElementById('cfDireccionMunicipio').value.trim(),
        Estado:          document.getElementById('cfDireccionEstado').value.trim(),
        CodigoPostal:    document.getElementById('cfDireccionCP').value.trim(),
        Pais:            document.getElementById('cfDireccionPais').value.trim() || 'México',
        Principal:       marcarPrincipal ? 1 : 0,
        RowVersion:      parseInt(document.getElementById('cfDireccionRowVersion').value) || 1
    };

    const errores = [];
    if (!payload.TipoDireccion) { errores.push('El tipo de dirección es obligatorio.'); }
    if (!payload.Calle)           { errores.push('La calle es obligatoria.'); }
    if (!payload.NumeroExterior)  { errores.push('El número exterior es obligatorio.'); }
    if (!payload.Colonia)         { errores.push('La colonia es obligatoria.'); }
    if (!payload.Municipio)       { errores.push('El municipio es obligatorio.'); }
    if (!payload.Estado)          { errores.push('El estado es obligatorio.'); }
    if (!payload.CodigoPostal)    { errores.push('El código postal es obligatorio.'); }

    if (errores.length) {
        return Swal.fire({
            icon: 'warning',
            title: 'Revisa el formulario',
            html: `<ul style="text-align:left;margin:0;padding-left:18px">${errores.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`,
            confirmButtonColor: '#0B1F47'
        });
    }

    const url    = id ? `${API_DIRECCIONES}/${id}` : API_DIRECCIONES;
    const method = id ? 'put' : 'post';

    try {
        await axios[method](url, payload);
        bootstrap.Modal.getInstance(document.getElementById('modalDireccion')).hide();
        Swal.fire({ icon:'success', title: id ? 'Dirección actualizada' : 'Dirección creada', toast:true, position:'top-end', showConfirmButton:false, timer:2000 });
        const titulo = document.getElementById('tituloDirecciones').textContent.replace('Direcciones de ','');
        verDirecciones(clienteId, titulo);
    } catch (err) {
        let msg = err.response?.data?.message || 'Error al guardar';
        if (err.response?.status === 422 && err.response.data?.errors) {
            msg = Object.values(err.response.data.errors).flat().join('\\n');
        }
        Swal.fire({ icon:'error', title:'Error', text: msg, confirmButtonColor:'#0B1F47' });
    }
}

function eliminarDireccion(id, nombre) {
    if (!permisosClientes.PuedeEliminar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para eliminar direcciones.', confirmButtonColor: '#0B1F47' });
    }
    Swal.fire({
        title: '¿Eliminar dirección?',
        html: `<strong>${escapeHtml(nombre)}</strong><br><small class="text-muted">Esta acción no se puede deshacer</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(r => {
        if (r.isConfirmed) {
            axios.delete(`${API_DIRECCIONES}/${id}`)
                .then(() => {
                    Swal.fire({ icon:'success', title:'Eliminada', toast:true, position:'top-end', showConfirmButton:false, timer:2000 });
                    const clienteId = document.getElementById('cfDireccionClienteID').value;
                    const titulo = document.getElementById('tituloDirecciones').textContent.replace('Direcciones de ','');
                    verDirecciones(parseInt(clienteId), titulo);
                })
                .catch(err => {
                    Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || 'No se pudo eliminar', confirmButtonColor:'#0B1F47' });
                });
        }
    });
}

/* ================================================================
   EMPRESAS (Catálogo)
   ================================================================ */
/* ================================================================
   EMPRESAS (Catálogo)
   ================================================================ */
function cargarEmpresas() {
    axios.get(API_EMPRESAS)
        .then(res => {
            empresasCache = res.data.success !== undefined ? (res.data.data || []) : res.data;
            // Ya no se usa el select de empresa en el form (es readonly desde sesión)
            // pero se deja por si se necesita en otra parte
        })
        .catch(err => console.error('Error cargando empresas:', err));
}

/* ================================================================
   UTILIDADES
   ================================================================ */
function escapeHtml(texto) {
    if (texto == null) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function escapeJsString(texto) {
    return escapeHtml(texto).replace(/'/g, "\'").replace(/"/g, '\"');
}