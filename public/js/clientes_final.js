/**
 * clientes.js v3 - Usa CF_API_BASE_URL del layout app.php
 * Ref: DEF-WEB-007 (API Clientes) + DEF-WEB-000 (Estándares Frontend).
 */

// Usar la URL base inyectada desde PHP (app.php)
const API_CLIENTES      = `${CF_API_BASE_URL}/clientes`;
const API_CONTACTOS     = `${CF_API_BASE_URL}/contactos`;
const API_EMPRESAS      = `${CF_API_BASE_URL}/empresas`;

const $cardListado      = document.getElementById('cfCardListado');
const $cardFormulario   = document.getElementById('cfCardFormulario');
const $formTitulo       = document.getElementById('cfFormTitulo');
const $tblClientes      = $('#tblClientes');

let dtClientes = null;
let empresasCache = [];

/* ================================================================
   INICIALIZACIÓN
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initDataTable();
    cargarEmpresas();

    document.getElementById('btnNuevoCliente').addEventListener('click', nuevoCliente);
    document.getElementById('btnCancelarFormulario').addEventListener('click', mostrarListado);
    document.getElementById('btnGuardarCliente').addEventListener('click', guardarCliente);
    document.getElementById('btnGuardarContacto').addEventListener('click', guardarContacto);

    document.getElementById('cfRFC').addEventListener('blur', function() {
        this.value = this.value.toUpperCase().trim();
    });
});

/* ================================================================
   NAVEGACIÓN LISTADO ↔ FORMULARIO
   ================================================================ */
function mostrarListado() {
    $cardFormulario.style.display = 'none';
    $cardListado.style.display   = 'block';
    dtClientes.ajax.reload(null, false);
}

function mostrarFormulario(titulo) {
    $cardListado.style.display   = 'none';
    $cardFormulario.style.display = 'block';
    $formTitulo.textContent = titulo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   DATATABLE
   ================================================================ */
function initDataTable() {
    dtClientes = $tblClientes.DataTable({
        ...window.DT_CONFIG,
        ajax: {
            url: API_CLIENTES,
            dataSrc: function(json) {
                console.log('[DEBUG] Respuesta API /clientes:', json);
                if (json.success !== undefined) {
                    return json.data || [];
                }
                return json;
            },
            error: function(xhr, textStatus, errorThrown) {
                console.error('[DEBUG] Error AJAX:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    url: this.url
                });

                let msg = 'Error desconocido';
                let detail = '';

                if (xhr.status === 404) {
                    msg = 'Endpoint no encontrado (404)';
                    detail = 'Verifica que la API tenga implementado GET /api/v1/clientes\nURL: ' + this.url;
                } else if (xhr.status === 401) {
                    msg = 'Sesión expirada (401)';
                    detail = 'El token JWT puede haber expirado.';
                } else if (xhr.status === 403) {
                    msg = 'Sin permisos (403)';
                } else if (xhr.status === 500) {
                    msg = 'Error interno del servidor (500)';
                    detail = xhr.responseText ? xhr.responseText.substring(0, 200) : '';
                } else {
                    msg = `Error ${xhr.status}: ${xhr.statusText}`;
                    detail = xhr.responseText ? xhr.responseText.substring(0, 200) : '';
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar clientes',
                    html: `<strong>${msg}</strong><br><br><pre style="text-align:left;font-size:11px;background:#f8f9fa;padding:8px;border-radius:4px;max-height:150px;overflow:auto">${detail}</pre>`,
                    confirmButtonColor: '#0B1F47',
                    width: '600px'
                });
            }
        },
        columns: [
            { data: 'ClienteID', width: '50px', className: 'text-center',
              render: d => `<span class="font-monospace text-muted">#${d}</span>` },
            { data: null, render: (d, t, row) => `
                <div class="d-flex align-items-center">
                    <div class="rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                         style="width:34px;height:34px;background:#EEF2FF;color:#0B1F47;font-weight:700;font-size:.9rem">
                        ${row.NombreCliente ? row.NombreCliente.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <div class="fw-semibold" style="color:#0B1F47;font-size:.88rem">${row.NombreCliente}</div>
                        <small class="text-muted">${row.Direccion ? row.Direccion.substring(0,35)+'...' : 'Sin dirección'}</small>
                    </div>
                </div>`
            },
            { data: 'RFC', render: d => `<span class="font-monospace" style="color:#64748B;font-size:.82rem">${d || '-'}</span>` },
            { data: 'ContactoPrincipal', render: d => d || '<span class="text-muted">-</span>' },
            { data: 'Correo', render: d => d ? `<a href="mailto:${d}" style="color:#2563EB;text-decoration:none;font-size:.85rem">${d}</a>` : '<span class="text-muted">-</span>' },
            { data: 'Telefono', render: d => d || '<span class="text-muted">-</span>' },
            { data: 'LimiteCredito', className: 'text-end',
              render: d => d ? `$${parseFloat(d).toLocaleString('es-MX',{minimumFractionDigits:2})}` : '$0.00' },
            { data: 'DiasCredito', className: 'text-center', render: d => d || '30' },
            { data: 'IsActive', className: 'text-center',
              render: d => `<span class="badge rounded-pill" style="background:${d==1||d===true?'#ECFDF5':'#FEF2F2'};color:${d==1||d===true?'#059669':'#DC2626'};font-weight:600;font-size:.72rem;padding:5px 10px">
                    ${d==1||d===true?'Activo':'Inactivo'}
                </span>`
            },
            { data: null, orderable: false, className: 'text-end',
              render: (d, t, row) => `
                <div class="dropdown">
                    <button class="btn btn-sm" data-bs-toggle="dropdown" style="background:transparent;border:none;color:#64748B">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" style="border-radius:10px;border:1px solid #E2E8F0;box-shadow:0 4px 16px rgba(0,0,0,.08);font-size:.85rem">
                        <li><a class="dropdown-item" href="#" onclick="editarCliente(${row.ClienteID});return false;">
                            <i class="bi bi-pencil-square me-2" style="color:#3B82F6"></i>Editar
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="verContactos(${row.ClienteID},'${(row.NombreCliente||'').replace(/'/g,"\'")}');return false;">
                            <i class="bi bi-people me-2" style="color:#06B6D4"></i>Contactos
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="eliminarCliente(${row.ClienteID},'${(row.NombreCliente||'').replace(/'/g,"\'")}');return false;">
                            <i class="bi bi-trash me-2"></i>Eliminar
                        </a></li>
                    </ul>
                </div>`
            }
        ],
        order: [[0, 'desc']],
        pageLength: 10
    });
}

/* ================================================================
   CRUD CLIENTES
   ================================================================ */
function nuevoCliente() {
    limpiarFormulario();
    document.getElementById('cfIsActive').checked = true;
    document.getElementById('cfLimiteCredito').value = '0.00';
    document.getElementById('cfDiasCredito').value = '30';
    document.getElementById('cfRowVersion').value = '1';
    const sel = document.getElementById('cfEmpresaID');
    if (sel.querySelector('option[value="1"]')) sel.value = '1';
    mostrarFormulario('Nuevo Cliente');
}

function editarCliente(id) {
    axios.get(`${API_CLIENTES}/${id}`)
        .then(res => {
            const c = res.data.success !== undefined ? res.data.data : res.data;
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
            document.getElementById('cfEmpresaID').value      = c.EmpresaID || '';
            document.getElementById('cfIsActive').checked    = (c.IsActive == 1 || c.IsActive === true);
            mostrarFormulario('Editar Cliente');
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el cliente', confirmButtonColor: '#0B1F47' });
        });
}

function guardarCliente() {
    const id = document.getElementById('cfClienteID').value;
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

    if (!payload.NombreCliente) { Swal.fire({icon:'warning',title:'Validación',text:'El nombre es obligatorio.',confirmButtonColor:'#0B1F47'}); return; }
    if (!payload.EmpresaID)     { Swal.fire({icon:'warning',title:'Validación',text:'Seleccione una empresa.',confirmButtonColor:'#0B1F47'}); return; }
    if (!payload.RFC)           { Swal.fire({icon:'warning',title:'Validación',text:'El RFC es obligatorio.',confirmButtonColor:'#0B1F47'}); return; }

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
    Swal.fire({
        title: '¿Eliminar cliente?',
        html: `<strong>${nombre}</strong><br><small class="text-muted">Eliminación lógica (IsActive = 0)</small>`,
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
                    dtClientes.ajax.reload(null, false);
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
    document.getElementById('cfEmpresaID').value = '';
    document.getElementById('cfIsActive').checked = true;
    document.getElementById('cfRowVersion').value = '1';
}

/* ================================================================
   CONTACTOS
   ================================================================ */
function verContactos(clienteId, nombreCliente) {
    document.getElementById('tituloContactos').textContent = `Contactos de ${nombreCliente}`;
    const container = document.getElementById('contactosContainer');
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="text-muted mt-2">Cargando...</p></div>';
    new bootstrap.Modal(document.getElementById('modalContactos')).show();

    axios.get(`${API_CLIENTES}/${clienteId}/contactos`)
        .then(res => {
            const contactos = res.data.success !== undefined ? (res.data.data || []) : res.data;
            if (!contactos.length) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-person-x" style="font-size:48px;color:#CBD5E1"></i>
                        <p class="text-muted mt-3 mb-3">No hay contactos registrados.</p>
                        <button class="btn btn-sm btn-cf-primary" onclick="abrirModalContacto(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar Contacto
                        </button>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="text-muted" style="font-size:.85rem">${contactos.length} contacto(s)</span>
                        <button class="btn btn-sm btn-cf-primary" onclick="abrirModalContacto(${clienteId})">
                            <i class="bi bi-plus-lg"></i> Agregar
                        </button>
                    </div>
                    <div class="list-group" style="border-radius:10px">
                        ${contactos.map(c => `
                            <div class="list-group-item d-flex justify-content-between align-items-center" style="border-color:#F1F5F9;padding:12px 16px">
                                <div class="d-flex align-items-center">
                                    <div class="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                         style="width:32px;height:32px;border-radius:8px;background:${c.Principal==1||c.Principal===true?'#ECFDF5':'#F8FAFC'};color:${c.Principal==1||c.Principal===true?'#059669':'#64748B'};font-weight:700;font-size:.85rem">
                                        ${c.Nombre ? c.Nombre.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div class="fw-semibold" style="color:#0B1F47;font-size:.88rem">
                                            ${c.Nombre}
                                            ${c.Principal==1||c.Principal===true ? '<span class="badge ms-1" style="background:#ECFDF5;color:#059669;font-size:.6rem">PRINCIPAL</span>' : ''}
                                        </div>
                                        <small style="color:#64748B;font-size:.78rem">${c.Puesto||'Sin puesto'} • ${c.Correo||'Sin correo'} • ${c.Telefono||'Sin teléfono'}</small>
                                    </div>
                                </div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-sm btn-light" onclick="editarContacto(${c.ClienteContactoID})" style="border-radius:6px"><i class="bi bi-pencil" style="color:#3B82F6;font-size:.8rem"></i></button>
                                    <button class="btn btn-sm btn-light" onclick="eliminarContacto(${c.ClienteContactoID},'${(c.Nombre||'').replace(/'/g,"\'")}')" style="border-radius:6px"><i class="bi bi-trash" style="color:#EF4444;font-size:.8rem"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>`;
            }
        })
        .catch(err => {
            container.innerHTML = `<div class="alert alert-danger">${err.response?.data?.message || 'Error al cargar contactos'}</div>`;
        });
}

function abrirModalContacto(clienteId) {
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

    if (!payload.Nombre) { Swal.fire({icon:'warning',title:'Validación',text:'El nombre es obligatorio.',confirmButtonColor:'#0B1F47'}); return; }

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
   EMPRESAS (Catálogo)
   ================================================================ */
function cargarEmpresas() {
    axios.get(API_EMPRESAS)
        .then(res => {
            empresasCache = res.data.success !== undefined ? (res.data.data || []) : res.data;
            const sel = document.getElementById('cfEmpresaID');
            sel.innerHTML = '<option value="">Seleccione empresa...</option>' +
                empresasCache.map(e => {
                    const nombre = e.NombreEmpresa || e.nombre || e.Nombre || 'Empresa #' + e.EmpresaID;
                    const codigo = e.CodigoEmpresa || '';
                    return `<option value="${e.EmpresaID}">${codigo ? '['+codigo+'] ' : ''}${nombre}</option>`;
                }).join('');
        })
        .catch(err => console.error('Error cargando empresas:', err));
}
