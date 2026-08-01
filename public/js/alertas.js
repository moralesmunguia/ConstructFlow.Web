/**
 * alertas.js
 * Ref: DEF-WEB-005 (API Alertas) -- el API ya estaba 100% implementado
 * (AlertaController/AlertaService/AlertaRepository, DEF-N2-08 seccion 13);
 * este archivo es la parte Web que faltaba: listado + alta manual + cambio de estado.
 *
 * GET   {CF_API_BASE_URL}/alertas?estado=&prioridad=&proyectoID=&tipoAlerta= -> AlertaController::getAll()
 * GET   {CF_API_BASE_URL}/alertas/{id}            -> AlertaController::getById()
 * POST  {CF_API_BASE_URL}/alertas                 -> AlertaController::create()  Body: { TipoAlerta, Titulo, Mensaje, Prioridad, ProyectoID }
 * PATCH {CF_API_BASE_URL}/alertas/{id}/estado     -> AlertaController::cambiarEstado()  Body: { Estado }
 * GET   {CF_API_BASE_URL}/dashboard/alertas       -> AlertaController::dashboardAlertas() (resumen abiertas x prioridad)
 * GET   {CF_API_BASE_URL}/proyectos               -> ProyectoController::index() (catalogo para filtro/alta)
 *
 * Formato estandar de respuesta: { success: bool, message: string, data: {} }
 */

document.addEventListener('DOMContentLoaded', () => {

    // Mismos 4 estados de CF_Alerta que valida AlertaService::ESTADOS_VALIDOS.
    const CF_ESTADOS_ALERTA = {
        ABIERTA:     { label: 'Abierta',      color: '#EF4444' },
        EN_REVISION: { label: 'En revisión',  color: '#F59E0B' },
        RESUELTA:    { label: 'Resuelta',     color: '#10B981' },
        DESCARTADA:  { label: 'Descartada',   color: '#6B7280' }
    };

    const CF_COLOR_PRIORIDAD = {
        Alta:  '#EF4444',
        Media: '#F59E0B',
        Baja:  '#0B69D4'
    };

    let dataTable = null;
    let proyectosPorID = {};

    const permisos = CF_PERMISOS['alertas'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    if (!permisos.PuedeCrear) {
        document.getElementById('btnNuevaAlerta')?.remove();
    }

    cargarCatalogos().then(() => {
        cargarResumen();
        cargarAlertas();
    });

    document.getElementById('btnNuevaAlerta')?.addEventListener('click', abrirNuevaAlerta);
    document.getElementById('btnRevisarAlertas')?.addEventListener('click', revisarAlertasAhora);
    document.getElementById('btnFiltrarAlertas')?.addEventListener('click', cargarAlertas);
    document.getElementById('btnLimpiarFiltrosAlertas')?.addEventListener('click', () => {
        document.getElementById('cfFiltroEstadoAlerta').value = '';
        document.getElementById('cfFiltroPrioridadAlerta').value = '';
        document.getElementById('cfFiltroProyectoAlerta').value = '';
        cargarAlertas();
    });

    document.getElementById('cfTablaAlertas')?.addEventListener('click', (e) => {
        const btnEstado = e.target.closest('[data-cambiar-estado-alerta]');
        if (btnEstado) return cambiarEstadoAlerta(btnEstado.dataset.cambiarEstadoAlerta);
    });

    async function cargarCatalogos() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos`);
            proyectosPorID = {};
            (resp.data.data || []).forEach((p) => { proyectosPorID[p.ProyectoID] = p; });

            const select = document.getElementById('cfFiltroProyectoAlerta');
            Object.values(proyectosPorID).forEach((p) => {
                select.insertAdjacentHTML('beforeend', `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`);
            });
        } catch (error) {
            console.error('Error al cargar catálogos de alertas:', error);
        }
    }

    // Resumen de alertas ABIERTAS por prioridad, para las tarjetas de arriba.
    async function cargarResumen() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/dashboard/alertas`);
            if (!resp.data.success) return;

            const filas = resp.data.data || [];
            const conteos = { Alta: 0, Media: 0, Baja: 0 };
            let total = 0;

            filas.forEach((f) => {
                const prioridad = f.Prioridad || 'Media';
                if (conteos[prioridad] === undefined) conteos[prioridad] = 0;
                conteos[prioridad] += Number(f.Total || 0);
                total += Number(f.Total || 0);
            });

            document.getElementById('cfResumenAlta').textContent = conteos.Alta || 0;
            document.getElementById('cfResumenMedia').textContent = conteos.Media || 0;
            document.getElementById('cfResumenBaja').textContent = conteos.Baja || 0;
            document.getElementById('cfResumenTotal').textContent = total;

        } catch (error) {
            console.error('Error al cargar el resumen de alertas:', error);
        }
    }

    async function cargarAlertas() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#cfTablaAlertas', { order: [[4, 'desc']] });
        }

        const params = {};
        const estado = document.getElementById('cfFiltroEstadoAlerta').value;
        const prioridad = document.getElementById('cfFiltroPrioridadAlerta').value;
        const proyectoID = document.getElementById('cfFiltroProyectoAlerta').value;

        if (estado) params.estado = estado;
        if (prioridad) params.prioridad = prioridad;
        if (proyectoID) params.proyectoID = proyectoID;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/alertas`, { params });

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar el listado',
                    text: resp.data.message || 'Ocurrió un error al consultar las alertas.'
                });
            }

            pintarFilas(resp.data.data || []);

        } catch (error) {
            console.error('Error al cargar alertas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar alertas',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((a) => dataTable.row.add(construirFila(a)));
        dataTable.draw();
    }

    function construirFila(a) {
        const colorPrioridad = CF_COLOR_PRIORIDAD[a.Prioridad] || '#6B7280';
        const estadoInfo = CF_ESTADOS_ALERTA[a.Estado] || { label: a.Estado, color: '#6C757D' };
        const referencia = a.NombreProyecto || (a.KpiCodigo ? `${a.KpiCodigo} - ${a.NombreKPI || ''}` : '—');

        return [
            `<span class="cf-badge" style="background:${colorPrioridad}22;color:${colorPrioridad}">${escapeHtml(a.Prioridad || '—')}</span>`,
            escapeHtml(a.TipoAlerta || '—'),
            `<strong>${escapeHtml(a.Titulo || '—')}</strong>${a.Mensaje ? `<br><span class="text-muted" style="font-size:0.78rem">${escapeHtml(a.Mensaje)}</span>` : ''}`,
            escapeHtml(referencia),
            formatearFecha(a.FechaGeneracion),
            formatearFecha(a.FechaAtencion),
            `<span class="cf-badge" style="background:${estadoInfo.color}22;color:${estadoInfo.color}">${escapeHtml(estadoInfo.label)}</span>`,
            construirAcciones(a)
        ];
    }

    function construirAcciones(a) {
        if (!permisos.PuedeActualizar) return '';

        return `<div class="cf-row-actions text-end">
            <button type="button" class="btn btn-cf-secondary btn-sm" title="Cambiar estado" data-cambiar-estado-alerta="${a.AlertaID}"><i class="bi bi-arrow-repeat"></i></button>
        </div>`;
    }

    // ---- Revisar alertas ahora (dispara AlertaGeneradorService, DEF-WEB-006) ----
    async function revisarAlertasAhora() {
        const boton = document.getElementById('btnRevisarAlertas');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Revisando...';

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/alertas/generar`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo revisar', text: resp.data.message || '' });
            }

            const total = resp.data.data?.TotalNuevas || 0;
            const correo = resp.data.data?.Correo;

            let textoCorreo = '';
            if (total > 0 && correo && !correo.success) {
                textoCorreo = `<br><span class="text-muted" style="font-size:0.8rem">Nota: ${escapeHtml(correo.message)}</span>`;
            }

            await Swal.fire({
                icon: total > 0 ? 'info' : 'success',
                title: total > 0 ? `${total} alerta(s) nueva(s)` : 'Sin novedades',
                html: (total > 0 ? 'Se generaron nuevas alertas a partir de actividades vencidas, facturas y cotizaciones.' : 'No hay nada nuevo que reportar por ahora.') + textoCorreo
            });

            cargarAlertas();
            cargarResumen();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible revisar las alertas.' });
        } finally {
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-arrow-repeat"></i> Revisar alertas ahora';
        }
    }

    // ---- Nueva Alerta (alta manual) ----
    async function abrirNuevaAlerta() {
        const opcionesProyecto = Object.values(proyectosPorID)
            .map((p) => `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Nueva Alerta',
            width: 500,
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Título *</label>
                    <input id="swalTituloAlerta" type="text" class="form-control mb-2">

                    <label class="form-label mb-1" style="font-size:0.85rem">Tipo de alerta *</label>
                    <input id="swalTipoAlerta" type="text" class="form-control mb-2" placeholder="Ej. PRUEBA, KPI_FUERA_RANGO, ACTIVIDAD_VENCIDA">

                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Prioridad</label>
                            <select id="swalPrioridadAlerta" class="form-select">
                                <option value="Alta">Alta</option>
                                <option value="Media" selected>Media</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Proyecto (opcional)</label>
                            <select id="swalProyectoAlerta" class="form-select">
                                <option value="">Sin proyecto</option>
                                ${opcionesProyecto}
                            </select>
                        </div>
                    </div>

                    <label class="form-label mb-1" style="font-size:0.85rem">Mensaje</label>
                    <textarea id="swalMensajeAlerta" class="form-control" rows="3"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear alerta',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const titulo = document.getElementById('swalTituloAlerta').value.trim();
                const tipoAlerta = document.getElementById('swalTipoAlerta').value.trim();

                if (!titulo || !tipoAlerta) {
                    Swal.showValidationMessage('Título y Tipo de alerta son obligatorios.');
                    return false;
                }

                return {
                    Titulo: titulo,
                    TipoAlerta: tipoAlerta,
                    Prioridad: document.getElementById('swalPrioridadAlerta').value,
                    ProyectoID: document.getElementById('swalProyectoAlerta').value || null,
                    Mensaje: document.getElementById('swalMensajeAlerta').value.trim() || null
                };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/alertas`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo crear la alerta', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Alerta creada', timer: 1200, showConfirmButton: false });
            cargarAlertas();
            cargarResumen();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible crear la alerta.' });
        }
    }

    // ---- Cambiar estado (ABIERTA -> EN_REVISION/RESUELTA/DESCARTADA, etc.) ----
    async function cambiarEstadoAlerta(alertaID) {
        const opciones = Object.entries(CF_ESTADOS_ALERTA)
            .map(([codigo, info]) => `<option value="${codigo}">${escapeHtml(info.label)}</option>`)
            .join('');

        const { value: nuevoEstado } = await Swal.fire({
            title: 'Cambiar estado de la alerta',
            html: `
                <div class="text-start">
                    <select id="swalEstadoAlerta" class="form-select">
                        <option value="">Selecciona un estado</option>
                        ${opciones}
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const valor = document.getElementById('swalEstadoAlerta').value;
                if (!valor) {
                    Swal.showValidationMessage('Selecciona un estado.');
                    return false;
                }
                return valor;
            }
        });

        if (!nuevoEstado) return;

        try {
            const resp = await axios.patch(`${CF_API_BASE_URL}/alertas/${alertaID}/estado`, {
                Estado: nuevoEstado
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cambiar el estado', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1200, showConfirmButton: false });
            cargarAlertas();
            cargarResumen();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cambiar el estado.' });
        }
    }

    // ---- Helpers (copia local, mismo patron que actividades.js/proyectos.js) ----
    function formatearFecha(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }
});
