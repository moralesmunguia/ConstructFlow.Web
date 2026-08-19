/**
 * empresas.js v1.0
 * Ref: DEF-WEB-014 (API Empresas) -- el API ya estaba 100% implementado;
 * este script cubre la parte Web (listado, alta/edición, eliminación
 * lógica y configuración por empresa).
 */

const API_EMPRESAS_MOD = `${CF_API_BASE_URL}/empresas`;

const $tblEmpresas = $('#tblEmpresas');

let dtEmpresas = null;
let empresasModData = [];

/* ================================================================
   PERMISOS
   ================================================================ */
const permisosEmpresas = CF_PERMISOS?.['empresas'] || {
    PuedeCrear: false,
    PuedeConsultar: false,
    PuedeActualizar: false,
    PuedeEliminar: false
};

/* ================================================================
   INICIALIZACIÓN
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initDataTableEmpresas();
    cargarEmpresasModulo();

    const btnNuevo = document.getElementById('btnNuevaEmpresa');
    if (btnNuevo) {
        if (!permisosEmpresas.PuedeCrear) {
            btnNuevo.style.display = 'none';
        } else {
            btnNuevo.addEventListener('click', nuevaEmpresa);
        }
    }

    document.getElementById('btnGuardarEmpresa')?.addEventListener('click', guardarEmpresa);
    document.getElementById('btnGuardarConfigEmpresa')?.addEventListener('click', guardarConfiguracionEmpresa);

    document.getElementById('cfEmpresaRFC')?.addEventListener('blur', function () {
        this.value = this.value.toUpperCase().trim();
    });

    document.getElementById('cfBuscarEmpresas')?.addEventListener('input', (e) => {
        dtEmpresas.search(e.target.value).draw();
    });
});

/* ================================================================
   DATATABLE
   ================================================================ */
function initDataTableEmpresas() {
    if ($tblEmpresas.length === 0) {
        console.error('[ERROR] No se encontró la tabla #tblEmpresas en el DOM.');
        return;
    }

    const baseConfig = (typeof window.DT_CONFIG === 'object' && window.DT_CONFIG !== null)
        ? window.DT_CONFIG
        : {
            responsive: true,
            language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-MX.json' }
          };

    dtEmpresas = $tblEmpresas.DataTable({
        ...baseConfig,
        columns: [
            {
                data: 'EmpresaID',
                width: '50px',
                className: 'text-center',
                render: (d) => `<span class="font-monospace text-muted" style="font-size:.8rem">#${d}</span>`
            },
            {
                data: 'CodigoEmpresa',
                render: (d) => `<span class="font-monospace" style="font-size:.82rem">${escapeHtmlEmp(d || '-')}</span>`
            },
            {
                data: null,
                render: (d, t, row) => `
                    <div class="cf-table-cliente">
                        <div class="cf-table-avatar">${row.NombreEmpresa ? row.NombreEmpresa.charAt(0).toUpperCase() : '?'}</div>
                        <div class="cf-table-cliente-info">
                            <div class="cf-table-cliente-nombre">${escapeHtmlEmp(row.NombreEmpresa)}</div>
                        </div>
                    </div>`
            },
            {
                data: 'RFC',
                render: (d) => `<span class="font-monospace" style="color:#64748B;font-size:.82rem">${escapeHtmlEmp(d || '-')}</span>`
            },
            {
                data: 'Contacto',
                render: (d) => d ? `<span style="font-size:.85rem">${escapeHtmlEmp(d)}</span>` : '<span class="text-muted" style="font-size:.82rem">—</span>'
            },
            {
                data: 'Telefono',
                render: (d) => d ? `<span style="font-size:.82rem">${escapeHtmlEmp(d)}</span>` : '<span class="text-muted" style="font-size:.82rem">—</span>'
            },
            {
                data: 'IsActive',
                className: 'text-center',
                render: (d) => {
                    const activo = (d == 1 || d === true);
                    return `<span class="cf-badge-estado ${activo ? 'activo' : 'inactivo'}">
                        <span class="cf-badge-estado-dot"></span>
                        ${activo ? 'Activa' : 'Inactiva'}
                    </span>`;
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-end',
                width: '60px',
                render: (d, t, row) => construirAccionesEmpresa(row)
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
            zeroRecords: 'No se encontraron empresas',
            emptyTable: 'No hay empresas registradas'
        }
    });
}

function construirAccionesEmpresa(row) {
    const items = [];

    if (permisosEmpresas.PuedeActualizar) {
        items.push(`<li><a class="dropdown-item" href="#" onclick="editarEmpresa(${row.EmpresaID});return false;">
            <i class="bi bi-pencil-square me-2" style="color:#3B82F6"></i>Editar
        </a></li>`);
        items.push(`<li><a class="dropdown-item" href="#" onclick="abrirConfiguracionEmpresa(${row.EmpresaID},'${escapeJsStringEmp(row.NombreEmpresa || '')}');return false;">
            <i class="bi bi-gear me-2" style="color:#D97706"></i>Configuración
        </a></li>`);
    }

    if (permisosEmpresas.PuedeEliminar) {
        if (items.length > 0) items.push(`<li><hr class="dropdown-divider"></li>`);
        items.push(`<li><a class="dropdown-item text-danger" href="#" onclick="eliminarEmpresa(${row.EmpresaID},'${escapeJsStringEmp(row.NombreEmpresa || '')}');return false;">
            <i class="bi bi-trash me-2"></i>Eliminar
        </a></li>`);
    }

    if (items.length === 0) {
        return `<span class="text-muted" style="font-size:.8rem"><i class="bi bi-lock"></i></span>`;
    }

    return `
        <div class="dropdown">
            <button class="btn btn-sm" data-bs-toggle="dropdown" style="background:transparent;border:none;color:#94A3B8;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" style="border-radius:12px;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,.1);padding:8px;min-width:190px;font-size:.85rem">
                ${items.join('')}
            </ul>
        </div>`;
}

/* ================================================================
   CARGA
   ================================================================ */
async function cargarEmpresasModulo() {
    try {
        const res = await axios.get(API_EMPRESAS_MOD);
        const json = res.data;
        const data = json.success !== undefined ? (json.data || []) : json;

        empresasModData = data;

        if (!dtEmpresas) return;

        dtEmpresas.clear().rows.add(data).draw();
        actualizarResumenEmpresas(data);
    } catch (err) {
        console.error('[DEBUG] Error axios /empresas:', err);
        let msg = err.response?.data?.message || err.message || 'Error desconocido';
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar empresas',
            text: msg,
            confirmButtonColor: '#0B1F47'
        });
    }
}

function actualizarResumenEmpresas(data) {
    const total = data.length;
    const activas = data.filter((e) => e.IsActive == 1 || e.IsActive === true).length;
    document.getElementById('cfTotalEmpresas').textContent = total.toLocaleString('es-MX');
    document.getElementById('cfEmpresasActivas').textContent = activas.toLocaleString('es-MX');
}

/* ================================================================
   CRUD EMPRESA
   ================================================================ */
function nuevaEmpresa() {
    if (!permisosEmpresas.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear empresas.', confirmButtonColor: '#0B1F47' });
    }
    limpiarFormularioEmpresa();
    document.getElementById('tituloEmpresaForm').textContent = 'Nueva Empresa';
    new bootstrap.Modal(document.getElementById('modalEmpresa')).show();
}

function editarEmpresa(id) {
    if (!permisosEmpresas.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar empresas.', confirmButtonColor: '#0B1F47' });
    }
    axios.get(`${API_EMPRESAS_MOD}/${id}`)
        .then(res => {
            const e = res.data.success !== undefined ? res.data.data : res.data;
            poblarFormularioEmpresa(e);
            document.getElementById('tituloEmpresaForm').textContent = 'Editar Empresa';
            new bootstrap.Modal(document.getElementById('modalEmpresa')).show();
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar la empresa', confirmButtonColor: '#0B1F47' });
        });
}

function poblarFormularioEmpresa(e) {
    document.getElementById('cfEmpresaFormID').value = e.EmpresaID || '';
    document.getElementById('cfEmpresaFormRowVersion').value = e.RowVersion || '1';
    document.getElementById('cfCodigoEmpresa').value = e.CodigoEmpresa || '';
    document.getElementById('cfEmpresaRFC').value = e.RFC || '';
    document.getElementById('cfNombreEmpresa').value = e.NombreEmpresa || '';
    document.getElementById('cfEmpresaDireccion').value = e.Direccion || '';
    document.getElementById('cfEmpresaContacto').value = e.Contacto || '';
    document.getElementById('cfEmpresaCorreo').value = e.Correo || '';
    document.getElementById('cfEmpresaTelefono').value = e.Telefono || '';
    document.getElementById('cfEmpresaSitioWeb').value = e.SitioWeb || '';
    document.getElementById('cfEmpresaLogoURL').value = e.LogoURL || '';
}

function limpiarFormularioEmpresa() {
    document.getElementById('cfEmpresaFormID').value = '';
    document.getElementById('cfEmpresaFormRowVersion').value = '1';
    document.getElementById('cfCodigoEmpresa').value = '';
    document.getElementById('cfEmpresaRFC').value = '';
    document.getElementById('cfNombreEmpresa').value = '';
    document.getElementById('cfEmpresaDireccion').value = '';
    document.getElementById('cfEmpresaContacto').value = '';
    document.getElementById('cfEmpresaCorreo').value = '';
    document.getElementById('cfEmpresaTelefono').value = '';
    document.getElementById('cfEmpresaSitioWeb').value = '';
    document.getElementById('cfEmpresaLogoURL').value = '';
    limpiarErroresFormularioEmpresa();
}

function marcarInvalidoEmp(id) {
    document.getElementById(id)?.classList.add('is-invalid');
}

function limpiarErroresFormularioEmpresa() {
    document.querySelectorAll('#cfFormEmpresa .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
}

function guardarEmpresa() {
    const id = document.getElementById('cfEmpresaFormID').value;
    const esNuevo = !id;

    if (esNuevo && !permisosEmpresas.PuedeCrear) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para crear empresas.', confirmButtonColor: '#0B1F47' });
    }
    if (!esNuevo && !permisosEmpresas.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para editar empresas.', confirmButtonColor: '#0B1F47' });
    }

    limpiarErroresFormularioEmpresa();

    const payload = {
        CodigoEmpresa: document.getElementById('cfCodigoEmpresa').value.trim(),
        NombreEmpresa: document.getElementById('cfNombreEmpresa').value.trim(),
        RFC: document.getElementById('cfEmpresaRFC').value.trim().toUpperCase(),
        Direccion: document.getElementById('cfEmpresaDireccion').value.trim() || null,
        Telefono: document.getElementById('cfEmpresaTelefono').value.trim() || null,
        Correo: document.getElementById('cfEmpresaCorreo').value.trim() || null,
        Contacto: document.getElementById('cfEmpresaContacto').value.trim() || null,
        SitioWeb: document.getElementById('cfEmpresaSitioWeb').value.trim() || null,
        LogoURL: document.getElementById('cfEmpresaLogoURL').value.trim() || null,
        RowVersion: parseInt(document.getElementById('cfEmpresaFormRowVersion').value) || 1
    };

    const errores = [];
    if (!payload.CodigoEmpresa) { marcarInvalidoEmp('cfCodigoEmpresa'); errores.push('El código de empresa es obligatorio.'); }
    if (!payload.NombreEmpresa) { marcarInvalidoEmp('cfNombreEmpresa'); errores.push('El nombre de empresa es obligatorio.'); }
    if (!payload.RFC) { marcarInvalidoEmp('cfEmpresaRFC'); errores.push('El RFC es obligatorio.'); }

    if (errores.length) {
        return Swal.fire({
            icon: 'warning',
            title: 'Revisa el formulario',
            html: `<ul style="text-align:left;margin:0;padding-left:18px">${errores.map((e) => `<li>${escapeHtmlEmp(e)}</li>`).join('')}</ul>`,
            confirmButtonColor: '#0B1F47'
        });
    }

    const url = id ? `${API_EMPRESAS_MOD}/${id}` : API_EMPRESAS_MOD;
    const method = id ? 'put' : 'post';

    axios[method](url, payload)
        .then((res) => {
            const json = res.data;
            if (json && json.success === false) {
                return Swal.fire({ icon: 'error', title: 'Error', text: json.message || 'No fue posible guardar la empresa.', confirmButtonColor: '#0B1F47' });
            }
            bootstrap.Modal.getInstance(document.getElementById('modalEmpresa'))?.hide();
            Swal.fire({
                icon: 'success', title: id ? 'Empresa actualizada' : 'Empresa creada',
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true
            });
            cargarEmpresasModulo();
        })
        .catch(err => {
            let msg = err.response?.data?.message || 'Error al guardar';
            if (err.response?.status === 422 && err.response.data?.errors) {
                msg = Object.values(err.response.data.errors).flat().join('\n');
            }
            Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#0B1F47' });
        });
}

function eliminarEmpresa(id, nombre) {
    if (!permisosEmpresas.PuedeEliminar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para eliminar empresas.', confirmButtonColor: '#0B1F47' });
    }
    Swal.fire({
        title: '¿Eliminar empresa?',
        html: `<strong>${escapeHtmlEmp(nombre)}</strong><br><small class="text-muted">Eliminación lógica (IsActive = 0)</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: '<i class="bi bi-trash me-1"></i> Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(r => {
        if (r.isConfirmed) {
            axios.delete(`${API_EMPRESAS_MOD}/${id}`)
                .then((res) => {
                    const json = res.data;
                    if (json && json.success === false) {
                        return Swal.fire({ icon: 'error', title: 'Error', text: json.message || 'No se pudo eliminar', confirmButtonColor: '#0B1F47' });
                    }
                    Swal.fire({ icon: 'success', title: 'Eliminada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                    cargarEmpresasModulo();
                })
                .catch(err => {
                    Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo eliminar', confirmButtonColor: '#0B1F47' });
                });
        }
    });
}

/* ================================================================
   CONFIGURACIÓN DE EMPRESA (IVA / Moneda / Días Venc. / Calendario)
   ================================================================ */
function abrirConfiguracionEmpresa(empresaId, nombreEmpresa) {
    if (!permisosEmpresas.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para configurar empresas.', confirmButtonColor: '#0B1F47' });
    }
    document.getElementById('cfConfigEmpresaID').value = empresaId;
    document.getElementById('cfConfigEmpresaNombre').textContent = nombreEmpresa || `Empresa #${empresaId}`;

    axios.get(`${API_EMPRESAS_MOD}/${empresaId}/configuracion`)
        .then(res => {
            const json = res.data;
            const cfg = json.success !== undefined ? json.data : json;
            document.getElementById('cfConfigIVA').value = cfg?.IVA ?? 0.16;
            document.getElementById('cfConfigMoneda').value = cfg?.Moneda || 'MXN';
            document.getElementById('cfConfigDiasVencimiento').value = cfg?.DiasVencimiento ?? 30;
            document.getElementById('cfConfigLogoURL').value = cfg?.LogoURL || '';
            document.getElementById('cfConfigSabadoLaboral').checked = !!cfg?.SabadoLaboral;
            document.getElementById('cfConfigDomingoLaboral').checked = !!cfg?.DomingoLaboral;
            new bootstrap.Modal(document.getElementById('modalConfigEmpresa')).show();
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar la configuración', confirmButtonColor: '#0B1F47' });
        });
}

function guardarConfiguracionEmpresa() {
    if (!permisosEmpresas.PuedeActualizar) {
        return Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para configurar empresas.', confirmButtonColor: '#0B1F47' });
    }
    const empresaId = document.getElementById('cfConfigEmpresaID').value;

    const payload = {
        IVA: parseFloat(document.getElementById('cfConfigIVA').value),
        Moneda: document.getElementById('cfConfigMoneda').value.trim() || 'MXN',
        DiasVencimiento: parseInt(document.getElementById('cfConfigDiasVencimiento').value) || 0,
        LogoURL: document.getElementById('cfConfigLogoURL').value.trim() || '',
        SabadoLaboral: document.getElementById('cfConfigSabadoLaboral').checked,
        DomingoLaboral: document.getElementById('cfConfigDomingoLaboral').checked
    };

    if (isNaN(payload.IVA) || payload.IVA < 0 || payload.IVA > 1) {
        return Swal.fire({ icon: 'warning', title: 'Validación', text: 'El IVA debe estar entre 0 y 1.', confirmButtonColor: '#0B1F47' });
    }
    if (!payload.Moneda) {
        return Swal.fire({ icon: 'warning', title: 'Validación', text: 'La moneda es obligatoria.', confirmButtonColor: '#0B1F47' });
    }

    axios.put(`${API_EMPRESAS_MOD}/${empresaId}/configuracion`, payload)
        .then((res) => {
            const json = res.data;
            if (json && json.success === false) {
                return Swal.fire({ icon: 'error', title: 'Error', text: json.message || 'No fue posible guardar la configuración.', confirmButtonColor: '#0B1F47' });
            }
            bootstrap.Modal.getInstance(document.getElementById('modalConfigEmpresa'))?.hide();
            Swal.fire({ icon: 'success', title: 'Configuración actualizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al guardar la configuración', confirmButtonColor: '#0B1F47' });
        });
}

/* ================================================================
   UTILIDADES
   ================================================================ */
function escapeHtmlEmp(texto) {
    if (texto == null) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function escapeJsStringEmp(texto) {
    return escapeHtmlEmp(texto).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
