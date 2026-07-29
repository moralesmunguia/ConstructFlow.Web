/**
 * actividades.js
 * Ref: DEF-WEB-004 (Actividades) -- pantalla independiente.
 *
 * GET    {CF_API_BASE_URL}/actividades                     -> ActividadController::indexEmpresa()
 * GET    {CF_API_BASE_URL}/proyectos                        -> ProyectoController::index()  (catalogo filtro)
 * GET    {CF_API_BASE_URL}/usuarios                          -> UsuarioController::index()   (catalogo filtro)
 * PUT    {CF_API_BASE_URL}/actividades/{id}                 -> ActividadController::update()
 * DELETE {CF_API_BASE_URL}/actividades/{id}                 -> ActividadController::delete()
 * PUT    {CF_API_BASE_URL}/actividades/{id}/avance          -> ActividadController::registrarAvance()
 * PUT    {CF_API_BASE_URL}/actividades/{id}/reprogramar     -> ActividadController::reprogramar()
 *
 * Formato estandar de respuesta (DEF-WEB-000 seccion 21):
 *   { success: bool, message: string, data: {} }
 *
 * Complementa (no reemplaza) la tabla de Actividades embebida en el
 * formulario de Editar Proyecto (proyectos.js) -- esta vista es el
 * listado global de TODAS las actividades de TODOS los proyectos, con
 * filtros, para no tener que entrar proyecto por proyecto.
 */

document.addEventListener('DOMContentLoaded', () => {

    const CF_ESTADOS_ACTIVIDAD = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];

    const CF_COLOR_ESTADO = {
        PENDIENTE: '#6C757D',
        EN_PROCESO: '#0EA5E9',
        COMPLETADA: '#10B981',
        CANCELADA: '#EF4444'
    };

    let proyectosPorID = {};
    let usuariosPorID = {};
    let dataTable = null;

    const permisos = CF_PERMISOS['actividades'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    cargarCatalogos().then(cargarActividades);

    document.getElementById('btnFiltrarActividades')?.addEventListener('click', cargarActividades);
    document.getElementById('btnLimpiarFiltrosActividades')?.addEventListener('click', () => {
        document.getElementById('cfFiltroProyecto').value = '';
        document.getElementById('cfFiltroResponsable').value = '';
        document.getElementById('cfFiltroEstado').value = '';
        document.getElementById('cfFiltroVencidas').checked = false;
        cargarActividades();
    });

    document.getElementById('cfTablaActividades')?.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) return editarActividad(btnEditar.dataset.editar);

        const btnAvance = e.target.closest('[data-avance]');
        if (btnAvance) return registrarAvance(btnAvance.dataset.avance);

        const btnReprogramar = e.target.closest('[data-reprogramar]');
        if (btnReprogramar) return reprogramarActividad(btnReprogramar.dataset.reprogramar);

        const btnEliminar = e.target.closest('[data-eliminar]');
        if (btnEliminar) return eliminarActividad(btnEliminar.dataset.eliminar);
    });

    async function cargarCatalogos() {
        try {
            const [respProyectos, respUsuarios] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/proyectos`),
                axios.get(`${CF_API_BASE_URL}/usuarios`)
            ]);

            proyectosPorID = indexarPorID(respProyectos.data.data, 'ProyectoID');
            usuariosPorID = indexarPorID(respUsuarios.data.data, 'UsuarioID');

            const selProyecto = document.getElementById('cfFiltroProyecto');
            selProyecto.innerHTML = '<option value="">Todos los proyectos</option>';
            Object.values(proyectosPorID).forEach((p) => {
                selProyecto.insertAdjacentHTML('beforeend', `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`);
            });

            const selResponsable = document.getElementById('cfFiltroResponsable');
            selResponsable.innerHTML = '<option value="">Todos los responsables</option>';
            Object.values(usuariosPorID).forEach((u) => {
                selResponsable.insertAdjacentHTML('beforeend', `<option value="${u.UsuarioID}">${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`);
            });

        } catch (error) {
            console.error('Error al cargar catalogos de actividades:', error);
        }
    }

    async function cargarActividades() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#cfTablaActividades', { order: [] });
        }

        const params = {};
        const proyectoID = document.getElementById('cfFiltroProyecto').value;
        const responsableID = document.getElementById('cfFiltroResponsable').value;
        const estado = document.getElementById('cfFiltroEstado').value;
        const soloVencidas = document.getElementById('cfFiltroVencidas').checked;

        if (proyectoID) params.ProyectoID = proyectoID;
        if (responsableID) params.ResponsableID = responsableID;
        if (estado) params.Estado = estado;
        if (soloVencidas) params.SoloVencidas = 1;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/actividades`, { params });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el listado', text: resp.data.message || '' });
            }

            pintarFilas(resp.data.data || []);

        } catch (error) {
            console.error('Error al cargar actividades:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.' });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((a) => dataTable.row.add(construirFila(a)));
        dataTable.draw();
    }

    function construirFila(a) {
        const proyecto = proyectosPorID[a.ProyectoID];
        const colorEstado = CF_COLOR_ESTADO[a.Estado] || '#6C757D';
        const vencida = esVencida(a);

        return [
            `${escapeHtml(proyecto?.NombreProyecto || `Proyecto #${a.ProyectoID}`)}`,
            `<strong>${escapeHtml(a.CodigoWBS || '')}</strong>`,
            `${vencida ? '<i class="bi bi-exclamation-triangle-fill text-danger" title="Vencida"></i> ' : ''}${escapeHtml(a.NombreActividad || '')}`,
            escapeHtml(a.NombreFase || '—'),
            escapeHtml(a.NombreResponsable || '—'),
            formatearFecha(a.InicioPlan),
            formatearFecha(a.FinPlan),
            barraAvance(a.Avance),
            badgeEstado(a.Estado, colorEstado),
            Number(a.EsHito) === 1 ? '<i class="bi bi-flag-fill text-warning"></i>' : '',
            construirAcciones(a)
        ];
    }

    function esVencida(a) {
        if (!a.FinPlan) return false;
        const hoy = new Date().toISOString().substring(0, 10);
        const finPlan = String(a.FinPlan).substring(0, 10);
        return finPlan < hoy && !['COMPLETADA', 'CANCELADA'].includes(String(a.Estado || '').toUpperCase());
    }

    function construirAcciones(a) {
        const botones = [];

        if (permisos.PuedeActualizar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Editar" data-editar="${a.ActividadID}"><i class="bi bi-pencil"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Registrar avance" data-avance="${a.ActividadID}"><i class="bi bi-graph-up-arrow"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Reprogramar" data-reprogramar="${a.ActividadID}"><i class="bi bi-calendar-event"></i></button>`);
        }

        if (permisos.PuedeEliminar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar="${a.ActividadID}"><i class="bi bi-trash"></i></button>`);
        }

        return `<div class="cf-row-actions text-end">${botones.join('')}</div>`;
    }

    // ---- Editar (formulario completo via Swal) ----
    async function editarActividad(actividadID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/actividades/${actividadID}`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No encontrada', text: resp.data.message || '' });
            }

            const a = resp.data.data;

            const opcionesResponsable = Object.values(usuariosPorID)
                .map((u) => `<option value="${u.UsuarioID}" ${Number(a.ResponsableID) === Number(u.UsuarioID) ? 'selected' : ''}>${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`)
                .join('');

            const opcionesEstado = CF_ESTADOS_ACTIVIDAD
                .map((codigo) => `<option value="${codigo}" ${a.Estado === codigo ? 'selected' : ''}>${escapeHtml(codigo)}</option>`)
                .join('');

            const { value: formValues } = await Swal.fire({
                title: `Editar: ${a.CodigoWBS || ''}`,
                width: 560,
                html: `
                    <div class="text-start">
                        <label class="form-label mb-1" style="font-size:0.85rem">Nombre *</label>
                        <input id="swalNombre" type="text" class="form-control mb-2" value="${escapeAtributo(a.NombreActividad)}">

                        <label class="form-label mb-1" style="font-size:0.85rem">Descripción</label>
                        <textarea id="swalDescripcion" class="form-control mb-2" rows="2">${escapeHtml(a.Descripcion || '')}</textarea>

                        <div class="row g-2 mb-2">
                            <div class="col-6">
                                <label class="form-label mb-1" style="font-size:0.85rem">Responsable *</label>
                                <select id="swalResponsable" class="form-select">${opcionesResponsable}</select>
                            </div>
                            <div class="col-6">
                                <label class="form-label mb-1" style="font-size:0.85rem">Estado</label>
                                <select id="swalEstado" class="form-select">${opcionesEstado}</select>
                            </div>
                        </div>

                        <div class="row g-2 mb-2">
                            <div class="col-6">
                                <label class="form-label mb-1" style="font-size:0.85rem">Inicio</label>
                                <input id="swalInicioPlan" type="date" class="form-control" value="${(a.InicioPlan || '').substring(0, 10)}">
                            </div>
                            <div class="col-6">
                                <label class="form-label mb-1" style="font-size:0.85rem">Fin</label>
                                <input id="swalFinPlan" type="date" class="form-control" value="${(a.FinPlan || '').substring(0, 10)}">
                            </div>
                        </div>

                        <div class="form-check">
                            <input id="swalEsHito" type="checkbox" class="form-check-input" ${Number(a.EsHito) === 1 ? 'checked' : ''}>
                            <label class="form-check-label" for="swalEsHito" style="font-size:0.85rem">Es un Hito (fecha única)</label>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const nombre = document.getElementById('swalNombre').value.trim();
                    const responsableID = document.getElementById('swalResponsable').value;

                    if (!nombre || !responsableID) {
                        Swal.showValidationMessage('Nombre y Responsable son obligatorios.');
                        return false;
                    }

                    return {
                        NombreActividad: nombre,
                        Descripcion: document.getElementById('swalDescripcion').value.trim() || null,
                        ResponsableID: Number(responsableID),
                        Estado: document.getElementById('swalEstado').value,
                        InicioPlan: document.getElementById('swalInicioPlan').value || null,
                        FinPlan: document.getElementById('swalFinPlan').value || null,
                        EsHito: document.getElementById('swalEsHito').checked ? 1 : 0
                    };
                }
            });

            if (!formValues) return;

            const respGuardar = await axios.put(`${CF_API_BASE_URL}/actividades/${actividadID}`, formValues);

            if (!respGuardar.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: respGuardar.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Actividad actualizada', timer: 1200, showConfirmButton: false });
            cargarActividades();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible editar la actividad.' });
        }
    }

    // ---- Registrar avance (ACT-016: se permite corregir hacia abajo) ----
    async function registrarAvance(actividadID) {
        const { value: formValues } = await Swal.fire({
            title: 'Reportar avance',
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Avance (%)</label>
                    <input id="swalAvance" type="number" min="0" max="100" class="form-control mb-2">
                    <label class="form-label mb-1" style="font-size:0.85rem">Horas trabajadas</label>
                    <input id="swalHorasTrabajadas" type="number" min="0" step="0.5" class="form-control mb-2" value="0">
                    <label class="form-label mb-1" style="font-size:0.85rem">Observaciones</label>
                    <textarea id="swalObservaciones" class="form-control" rows="2"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar avance',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const avance = Number(document.getElementById('swalAvance').value);
                if (isNaN(avance) || avance < 0 || avance > 100) {
                    Swal.showValidationMessage('El avance debe ser un número entre 0 y 100.');
                    return false;
                }
                return {
                    Avance: avance,
                    HorasTrabajadas: Number(document.getElementById('swalHorasTrabajadas').value) || 0,
                    Observaciones: document.getElementById('swalObservaciones').value.trim() || null
                };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${actividadID}/avance`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo registrar el avance', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Avance registrado', timer: 1200, showConfirmButton: false });
            cargarActividades();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible registrar el avance.' });
        }
    }

    // ---- Reprogramar ----
    async function reprogramarActividad(actividadID) {
        const { value: formValues } = await Swal.fire({
            title: 'Reprogramar actividad',
            html: `
                <div class="text-start">
                    <div class="row g-2">
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Nuevo inicio</label>
                            <input id="swalNuevoInicio" type="date" class="form-control">
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Nuevo fin</label>
                            <input id="swalNuevoFin" type="date" class="form-control">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Reprogramar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const inicio = document.getElementById('swalNuevoInicio').value;
                const fin = document.getElementById('swalNuevoFin').value;
                if (!inicio || !fin) {
                    Swal.showValidationMessage('Captura ambas fechas.');
                    return false;
                }
                return { InicioPlan: inicio, FinPlan: fin };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${actividadID}/reprogramar`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo reprogramar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Actividad reprogramada', timer: 1200, showConfirmButton: false });
            cargarActividades();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible reprogramar la actividad.' });
        }
    }

    // ---- Eliminar ----
    async function eliminarActividad(actividadID) {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar actividad?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/actividades/${actividadID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Actividad eliminada', timer: 1200, showConfirmButton: false });
            cargarActividades();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la actividad.' });
        }
    }

    // ---- Helpers ----
    function indexarPorID(lista, campoID) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campoID]] = item; });
        return mapa;
    }

    function badgeEstado(nombre, colorHex) {
        return `<span class="cf-badge" style="background:${colorHex}22;color:${colorHex}">${escapeHtml(nombre || '')}</span>`;
    }

    function barraAvance(valor) {
        const porcentaje = Math.max(0, Math.min(100, Number(valor || 0)));
        const color = porcentaje >= 80 ? '#10B981' : (porcentaje >= 50 ? '#F59E0B' : '#EF4444');
        return `
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:#E5E7EB;border-radius:4px;overflow:hidden;min-width:60px">
                    <div style="width:${porcentaje}%;height:100%;background:${color}"></div>
                </div>
                <span style="font-size:0.75rem;color:#6B7280">${porcentaje.toFixed(0)}%</span>
            </div>
        `;
    }

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

    function escapeAtributo(texto) {
        return (texto ?? '').toString()
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
