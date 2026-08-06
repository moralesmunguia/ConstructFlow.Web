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
    let ultimasActividades = [];
    let ganttGeneralInstancia = null;
    let chartActAvancePromedio = null;
    let chartActTareasEstado = null;
    let ultimoClicTareaGeneralID = null;
    let ultimoClicTimestampGeneral = 0;
    let reprogramacionPendienteGeneral = null;

    // Paleta fija para distinguir proyectos en el Gantt General (se repite
    // ciclicamente si hay mas proyectos que colores).
    const CF_PALETA_PROYECTOS = ['#0B69D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#84CC16', '#F97316', '#6366F1', '#14B8A6'];

    const permisos = CF_PERMISOS['actividades'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    cargarCatalogos().then(cargarActividades);

    document.getElementById('btnFiltrarActividades')?.addEventListener('click', cargarActividades);
    document.getElementById('cfBuscarActividades')?.addEventListener('input', (e) => {
        dataTable?.search(e.target.value).draw();
    });
    document.getElementById('btnLimpiarFiltrosActividades')?.addEventListener('click', () => {
        document.getElementById('cfFiltroProyecto').value = '';
        document.getElementById('cfFiltroResponsable').value = '';
        document.getElementById('cfFiltroEstado').value = '';
        document.getElementById('cfFiltroVencidas').checked = false;
        cargarActividades();
    });

    document.getElementById('cfActTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-acttab]');
        if (btn) cambiarTabActividades(btn.dataset.acttab);
    });

    document.getElementById('cfActGanttModoVista')?.addEventListener('change', (e) => {
        if (ganttGeneralInstancia) {
            ganttGeneralInstancia.change_view_mode(e.target.value);
        }
    });

    // Igual que en proyectos.js: Frappe Gantt dispara on_date_change en cada
    // dia que se cruza mientras se arrastra, no solo al soltar. Se escucha
    // en fase de CAPTURA para garantizar que corra antes de que la libreria
    // detenga la propagacion en su propio mouseup interno.
    ['mouseup', 'touchend'].forEach((evento) => {
        document.addEventListener(evento, () => {
            if (!reprogramacionPendienteGeneral) return;
            const { task, start, end } = reprogramacionPendienteGeneral;
            reprogramacionPendienteGeneral = null;
            confirmarYGuardarReprogramacionGeneral(task, start, end);
        }, true);
    });

    document.getElementById('cfTablaActividades')?.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) return editarActividad(btnEditar.dataset.editar);

        const btnAvance = e.target.closest('[data-avance]');
        if (btnAvance) return registrarAvance(btnAvance.dataset.avance);

        const btnReprogramar = e.target.closest('[data-reprogramar]');
        if (btnReprogramar) return reprogramarActividad(btnReprogramar.dataset.reprogramar);

        const btnEvidencias = e.target.closest('[data-evidencias]');
        if (btnEvidencias) return verEvidencias(btnEvidencias.dataset.evidencias, btnEvidencias.dataset.proyecto);

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
        ultimasActividades = filas;
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
        return finPlan < hoy && !['COMPLETADA', 'CANCELADA'].includes(String(a.Estado || '').toUpperCase()) && Number(a.Avance || 0) < 100;
    }

    // Terminada Vencida: se completo (Avance 100/COMPLETADA) pero FinReal
    // (fecha real de termino, la llena el Api al llegar a 100%) quedo
    // despues de FinPlan -- se cumplio, pero fuera de tiempo. Antes esto no
    // se distinguia de una actividad completada a tiempo.
    function esTerminadaVencida(a) {
        if (!a || !a.FinPlan || !a.FinReal) return false;
        const estado = String(a.Estado || '').toUpperCase();
        const completada = estado === 'COMPLETADA' || Number(a.Avance || 0) >= 100;
        if (!completada) return false;
        return String(a.FinReal).substring(0, 10) > String(a.FinPlan).substring(0, 10);
    }

    function construirAcciones(a) {
        const botones = [];

        if (permisos.PuedeActualizar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Editar" data-editar="${a.ActividadID}"><i class="bi bi-pencil"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Registrar avance" data-avance="${a.ActividadID}"><i class="bi bi-graph-up-arrow"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Reprogramar" data-reprogramar="${a.ActividadID}"><i class="bi bi-calendar-event"></i></button>`);
        }

        botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Evidencias" data-evidencias="${a.ActividadID}" data-proyecto="${a.ProyectoID}"><i class="bi bi-camera"></i></button>`);

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

    // ---- Evidencias (ACT-014) ----
    // GET    {CF_API_BASE_URL}/evidencias?actividad_id=      -> EvidenciaController::index()
    // POST   {CF_API_BASE_URL}/evidencias                    -> EvidenciaController::store()   (multipart, campo 'archivo')
    // DELETE {CF_API_BASE_URL}/evidencias/{id}                -> EvidenciaController::delete()
    // GET    {CF_API_BASE_URL}/evidencias/{id}/descarga       -> EvidenciaController::descarga() (stream binario, requiere JWT por header)

    const CF_TIPOS_EVIDENCIA = ['FOTO', 'VIDEO', 'DOCUMENTO', 'OTRO'];
    const CF_MOMENTOS_EVIDENCIA = ['ANTES', 'DURANTE', 'DESPUES'];

    async function verEvidencias(actividadID, proyectoID) {
        const contenedorId = 'cfEvidenciasLista';

        await Swal.fire({
            title: 'Evidencias de la actividad',
            width: 620,
            html: `
                <div class="text-start">
                    <div class="row g-2 mb-3">
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Archivo *</label>
                            <input id="swalArchivoEvidencia" type="file" class="form-control" accept="image/*,video/*,application/pdf,.docx,.xlsx">
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Tipo</label>
                            <select id="swalTipoEvidencia" class="form-select">
                                ${CF_TIPOS_EVIDENCIA.map((t) => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Momento</label>
                            <select id="swalMomentoEvidencia" class="form-select">
                                ${CF_MOMENTOS_EVIDENCIA.map((m) => `<option value="${m}" ${m === 'DURANTE' ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Descripción *</label>
                            <input id="swalDescripcionEvidencia" type="text" class="form-control" placeholder="Ej. Vaciado de losa, avance visible">
                        </div>
                        <div class="col-12 text-end">
                            <button type="button" id="btnSubirEvidencia" class="btn btn-cf-primary btn-sm mt-1"><i class="bi bi-upload"></i> Subir evidencia</button>
                        </div>
                    </div>
                    <hr>
                    <div id="${contenedorId}" style="max-height:320px;overflow-y:auto">
                        <p class="text-muted text-center mb-0">Cargando...</p>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                cargarGaleriaEvidencias(actividadID, contenedorId);

                document.getElementById('btnSubirEvidencia').addEventListener('click', () => {
                    subirEvidencia(actividadID, proyectoID, contenedorId);
                });
            }
        });
    }

    async function cargarGaleriaEvidencias(actividadID, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/evidencias`, { params: { actividad_id: actividadID } });

            if (!resp.data.success) {
                contenedor.innerHTML = `<p class="text-danger text-center mb-0">${escapeHtml(resp.data.message || 'No se pudo cargar el listado.')}</p>`;
                return;
            }

            const evidencias = resp.data.data || [];

            if (evidencias.length === 0) {
                contenedor.innerHTML = '<p class="text-muted text-center mb-0">Sin evidencias registradas.</p>';
                return;
            }

            contenedor.innerHTML = evidencias.map((ev) => construirTarjetaEvidencia(ev)).join('');

            contenedor.querySelectorAll('[data-ver-evidencia]').forEach((btn) => {
                btn.addEventListener('click', () => verArchivoEvidencia(btn.dataset.verEvidencia, btn.dataset.mime, btn.dataset.nombre));
            });

            contenedor.querySelectorAll('[data-eliminar-evidencia]').forEach((btn) => {
                btn.addEventListener('click', () => eliminarEvidencia(btn.dataset.eliminarEvidencia, actividadID, contenedorId));
            });

        } catch (error) {
            contenedor.innerHTML = `<p class="text-danger text-center mb-0">${escapeHtml(error.response?.data?.message || 'Error al conectar con el servidor.')}</p>`;
        }
    }

    function construirTarjetaEvidencia(ev) {
        const esImagen = /^image\//.test(ev.MimeType || '');
        const icono = esImagen ? 'bi-image' : (/^video\//.test(ev.MimeType || '') ? 'bi-camera-video' : 'bi-file-earmark-text');

        return `
            <div class="d-flex align-items-center justify-content-between border-bottom py-2">
                <div class="d-flex align-items-center gap-2" style="min-width:0">
                    <i class="bi ${icono} fs-4 text-secondary"></i>
                    <div style="min-width:0">
                        <div class="text-truncate" style="max-width:340px" title="${escapeAtributo(ev.NombreOriginal || '')}">${escapeHtml(ev.NombreOriginal || 'Sin nombre')}</div>
                        <div class="text-muted" style="font-size:0.75rem">${escapeHtml(ev.TipoEvidencia || '')} · ${escapeHtml(ev.Momento || '')} · ${escapeHtml(ev.Usuario || '')} · ${formatearFecha(ev.FechaCaptura)}</div>
                        ${ev.Descripcion ? `<div style="font-size:0.8rem">${escapeHtml(ev.Descripcion)}</div>` : ''}
                    </div>
                </div>
                <div class="d-flex gap-1 flex-shrink-0">
                    <button type="button" class="btn btn-cf-secondary btn-sm" title="Ver" data-ver-evidencia="${ev.EvidenciaID}" data-mime="${escapeAtributo(ev.MimeType || '')}" data-nombre="${escapeAtributo(ev.NombreOriginal || '')}"><i class="bi bi-eye"></i></button>
                    <button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar-evidencia="${ev.EvidenciaID}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
    }

    async function subirEvidencia(actividadID, proyectoID, contenedorId) {
        const archivo = document.getElementById('swalArchivoEvidencia').files[0];
        const descripcion = document.getElementById('swalDescripcionEvidencia').value.trim();
        const tipoEvidencia = document.getElementById('swalTipoEvidencia').value;
        const momento = document.getElementById('swalMomentoEvidencia').value;

        if (!archivo) {
            return Swal.fire({ icon: 'warning', title: 'Falta el archivo', text: 'Selecciona un archivo para subir.' });
        }

        if (!descripcion) {
            return Swal.fire({ icon: 'warning', title: 'Falta la descripción', text: 'La descripción es obligatoria.' });
        }

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('ProyectoID', proyectoID);
        formData.append('ActividadID', actividadID);
        formData.append('Descripcion', descripcion);
        formData.append('TipoEvidencia', tipoEvidencia);
        formData.append('Momento', momento);

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/evidencias`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo subir la evidencia', text: resp.data.message || '' });
            }

            document.getElementById('swalArchivoEvidencia').value = '';
            document.getElementById('swalDescripcionEvidencia').value = '';

            cargarGaleriaEvidencias(actividadID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible subir la evidencia.' });
        }
    }

    async function verArchivoEvidencia(evidenciaID, mimeType, nombreOriginal) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/evidencias/${evidenciaID}/descarga`, {
                responseType: 'blob'
            });

            const blob = new Blob([resp.data], { type: mimeType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            const ventana = window.open(url, '_blank');

            if (!ventana) {
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = nombreOriginal || 'evidencia';
                enlace.click();
            }

            setTimeout(() => URL.revokeObjectURL(url), 60000);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo abrir el archivo', text: 'Verifica tu conexión e intenta de nuevo.' });
        }
    }

    async function eliminarEvidencia(evidenciaID, actividadID, contenedorId) {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar evidencia?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/evidencias/${evidenciaID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: resp.data.message || '' });
            }

            cargarGaleriaEvidencias(actividadID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la evidencia.' });
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

    // ---- Tabs Listado / Gantt General / Dashboard ----
    function cambiarTabActividades(tab) {
        document.getElementById('cfActTabBtnListado')?.classList.toggle('active', tab === 'listado');
        document.getElementById('cfActTabBtnGantt')?.classList.toggle('active', tab === 'gantt');
        document.getElementById('cfActTabBtnDashboard')?.classList.toggle('active', tab === 'dashboard');

        document.getElementById('cfActTabPaneListado').style.display = tab === 'listado' ? '' : 'none';
        document.getElementById('cfActTabPaneGantt').style.display = tab === 'gantt' ? '' : 'none';
        document.getElementById('cfActTabPaneDashboard').style.display = tab === 'dashboard' ? '' : 'none';

        if (tab === 'gantt') verGanttGeneral();
        if (tab === 'dashboard') verDashboardGeneral();
    }

    // Proyectos activos = cualquier Estado distinto de CERRADO/CANCELADO
    // (mismos estados finales que ProyectoService::validarEstado en el Api).
    function proyectosActivosPorID() {
        const activos = {};
        Object.values(proyectosPorID).forEach((p) => {
            if (!['CERRADO', 'CANCELADO'].includes(String(p.Estado || '').toUpperCase())) {
                activos[p.ProyectoID] = p;
            }
        });
        return activos;
    }

    // Actividades a considerar en Gantt/Dashboard general: las ya cargadas
    // por el listado (respeta los filtros de Proyecto/Responsable/Estado que
    // el usuario haya aplicado), restringidas a proyectos activos.
    function actividadesActivasActuales() {
        const activos = proyectosActivosPorID();
        return ultimasActividades.filter((a) => activos[a.ProyectoID]);
    }

    function colorPorProyecto(proyectoID) {
        const ids = Object.keys(proyectosActivosPorID()).map(Number).sort((a, b) => a - b);
        const indice = ids.indexOf(Number(proyectoID));
        return CF_PALETA_PROYECTOS[(indice < 0 ? 0 : indice) % CF_PALETA_PROYECTOS.length];
    }

    // ---- Gantt General (todas las actividades de proyectos activos) ----
    // Solo lectura: agrupa por proyecto (color) para dar una vista de
    // conjunto. No dibuja dependencias entre actividades de proyectos
    // distintos (no tendria sentido) -- para dependencias y edicion detallada
    // se sigue usando el Gantt por proyecto (ver proyectos.js).
    function verGanttGeneral() {
        const contenedor = document.getElementById('cfActGanttContenedor');
        const leyenda = document.getElementById('cfActGanttLeyendaProyectos');
        contenedor.innerHTML = '';
        leyenda.innerHTML = '';

        const actividades = actividadesActivasActuales();
        const conFechas = actividades.filter((a) => a.InicioPlan && a.FinPlan);

        if (conFechas.length === 0) {
            contenedor.innerHTML = '<p class="text-muted">No hay actividades con fechas planeadas en proyectos activos.</p>';
            return;
        }

        const hoy = new Date().toISOString().substring(0, 10);

        const tareas = conFechas.map((a) => {
            const esHito = Number(a.EsHito) === 1;
            const vencida = esVencida(a, hoy);
            const terminadaVencida = !vencida && esTerminadaVencida(a);
            const nombreProyecto = proyectosPorID[a.ProyectoID]?.NombreProyecto || `Proyecto #${a.ProyectoID}`;
            const nombreTarea = `[${nombreProyecto}] ${a.CodigoWBS ? a.CodigoWBS + ' - ' : ''}${a.NombreActividad || ''}`;

            return {
                id: String(a.ActividadID),
                name: vencida ? ('⚠ ' + nombreTarea) : (terminadaVencida ? ('⏱ ' + nombreTarea) : nombreTarea),
                start: String(a.InicioPlan).substring(0, 10),
                end: esHito ? String(a.InicioPlan).substring(0, 10) : String(a.FinPlan).substring(0, 10),
                progress: Number(a.Avance || 0),
                dependencies: '',
                custom_class: vencida ? 'bar-vencida-general' : (terminadaVencida ? 'bar-terminada-vencida-general' : `cf-proy-${a.ProyectoID}`)
            };
        });

        // Pinta un estilo por proyecto (color de barra) via CSS inyectado --
        // Frappe Gantt no acepta color directo por tarea, solo custom_class.
        const estilosProyectos = Object.keys(proyectosActivosPorID())
            .filter((id) => tareas.some((t) => t.id && actividades.find((a) => String(a.ActividadID) === t.id && String(a.ProyectoID) === id)))
            .map((id) => `#cfActGanttContenedor .cf-proy-${id} .bar { fill: ${colorPorProyecto(id)} !important; }`)
            .join('\n');

        let estiloTag = document.getElementById('cfActGanttEstilosProyectos');
        if (!estiloTag) {
            estiloTag = document.createElement('style');
            estiloTag.id = 'cfActGanttEstilosProyectos';
            document.head.appendChild(estiloTag);
        }
        estiloTag.textContent = estilosProyectos;

        ganttGeneralInstancia = new Gantt('#cfActGanttContenedor', tareas, {
            view_mode: document.getElementById('cfActGanttModoVista')?.value || 'Week',
            language: 'es',
            bar_height: 16,
            padding: 6,
            header_height: 45,
            // Requerimiento: mismo comportamiento interactivo que el Gantt por
            // proyecto (proyectos.js) -- doble clic reporta avance, arrastrar
            // reprograma con confirmacion.
            on_click: (task) => {
                const ahora = Date.now();
                if (ultimoClicTareaGeneralID === task.id && (ahora - ultimoClicTimestampGeneral) < 450) {
                    ultimoClicTareaGeneralID = null;
                    reportarAvanceDesdeGanttGeneral(task);
                } else {
                    ultimoClicTareaGeneralID = task.id;
                    ultimoClicTimestampGeneral = ahora;
                }
            },
            on_date_change: (task, start, end) => {
                const original = actividades.find((a) => String(a.ActividadID) === task.id);
                const terminada = original && (String(original.Estado || '').toUpperCase() === 'COMPLETADA' || Number(original.Avance || 0) >= 100);

                if (terminada) {
                    reprogramacionPendienteGeneral = null;
                    Swal.fire({
                        icon: 'warning',
                        title: 'Actividad ya terminada',
                        text: 'No se puede mover una actividad terminada. Si en realidad no está terminada, repórtalo desde "Reportar avance" (doble clic) bajando el avance por debajo de 100% para reabrirla.'
                    });
                    verGanttGeneral();
                    return;
                }

                reprogramacionPendienteGeneral = { task, start, end };
            },
            custom_popup_html: (task) => {
                const original = actividades.find((a) => String(a.ActividadID) === task.id);
                const nombreProyecto = original ? (proyectosPorID[original.ProyectoID]?.NombreProyecto || '') : '';
                let extra = '';
                if (original) {
                    const vencida = esVencida(original, hoy);
                    const terminadaVencida = !vencida && esTerminadaVencida(original);
                    if (vencida) extra += '<br><strong style="color:#B91C1C">⚠ VENCIDA</strong>';
                    if (terminadaVencida) extra += '<br><strong style="color:#B45309">⏱ Terminada fuera de tiempo (planeada: ' + String(original.FinPlan).substring(0, 10) + ', real: ' + String(original.FinReal).substring(0, 10) + ')</strong>';
                }
                return `<div class="details-container" style="padding:6px 4px"><strong>${escapeHtml(task.name)}</strong><br>${escapeHtml(nombreProyecto)}<br>${task.start} → ${task.end}<br>Avance: ${task.progress}%${extra}</div>`;
            }
        });

        // Leyenda de colores por proyecto (solo los que efectivamente
        // aparecen en el Gantt, para no listar proyectos activos sin
        // actividades con fechas).
        const proyectosEnGantt = [...new Set(conFechas.map((a) => a.ProyectoID))];
        leyenda.innerHTML = proyectosEnGantt.map((id) => {
            const nombre = proyectosPorID[id]?.NombreProyecto || `Proyecto #${id}`;
            return `<span class="cf-badge" style="background:${colorPorProyecto(id)}22;color:${colorPorProyecto(id)};margin:2px"><span class="cf-gantt-chip" style="background:${colorPorProyecto(id)};margin-left:0;margin-right:4px"></span>${escapeHtml(nombre)}</span>`;
        }).join(' ');
    }

    // ---- Interactividad del Gantt General (avance y reprogramacion) ----
    async function reportarAvanceDesdeGanttGeneral(task) {
        const { value: formValues } = await Swal.fire({
            title: 'Reportar avance',
            html: `
                <div class="text-start">
                    <div class="mb-2" style="font-size:0.85rem"><strong>${escapeHtml(task.name)}</strong></div>
                    <label class="form-label mb-1" style="font-size:0.85rem">Avance (%)</label>
                    <input id="swalAvanceGeneral" type="number" min="0" max="100" class="form-control mb-2" value="${task.progress}">
                    <label class="form-label mb-1" style="font-size:0.85rem">Horas trabajadas</label>
                    <input id="swalHorasTrabajadasGeneral" type="number" min="0" step="0.5" class="form-control mb-2" value="0">
                    <label class="form-label mb-1" style="font-size:0.85rem">Observaciones</label>
                    <textarea id="swalObservacionesGeneral" class="form-control" rows="2"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar avance',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const avance = Number(document.getElementById('swalAvanceGeneral').value);
                if (isNaN(avance) || avance < 0 || avance > 100) {
                    Swal.showValidationMessage('El avance debe ser un número entre 0 y 100.');
                    return false;
                }
                return {
                    Avance: avance,
                    HorasTrabajadas: Number(document.getElementById('swalHorasTrabajadasGeneral').value) || 0,
                    Observaciones: document.getElementById('swalObservacionesGeneral').value.trim() || null
                };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${task.id}/avance`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo registrar el avance', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Avance registrado', timer: 1200, showConfirmButton: false });

            // Recarga el listado (fuente de datos del Gantt General) y vuelve
            // a pintar para reflejar el nuevo avance/estado.
            await cargarActividades();
            verGanttGeneral();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible registrar el avance.' });
        }
    }

    async function confirmarYGuardarReprogramacionGeneral(task, start, end) {
        const nuevoInicio = formatearFechaISO(start);
        const nuevoFin = formatearFechaISO(end);

        const confirmacion = await Swal.fire({
            icon: 'question',
            title: 'Confirmar reprogramación',
            html: `Mover <strong>${escapeHtml(task.name)}</strong> a<br>${nuevoInicio} → ${nuevoFin}?`,
            showCancelButton: true,
            confirmButtonText: 'Guardar cambio',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            // Revertir el arrastre visual (Frappe Gantt ya movio la barra).
            return verGanttGeneral();
        }

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${task.id}/reprogramar`, {
                InicioPlan: nuevoInicio,
                FinPlan: nuevoFin
            });

            if (!resp.data.success) {
                await Swal.fire({ icon: 'error', title: 'No se pudo reprogramar', text: resp.data.message || '' });
                return verGanttGeneral();
            }

            await Swal.fire({ icon: 'success', title: 'Fecha actualizada', timer: 1200, showConfirmButton: false });
            await cargarActividades();
            verGanttGeneral();

        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible reprogramar la actividad.' });
            verGanttGeneral();
        }
    }

    function formatearFechaISO(fecha) {
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        const anio = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    // ---- Dashboard General (proyectos activos) ----
    function verDashboardGeneral() {
        const activos = Object.values(proyectosActivosPorID());
        const actividades = actividadesActivasActuales();

        const avancePromedio = activos.length
            ? activos.reduce((suma, p) => suma + Number(p.PorcentajeAvance || 0), 0) / activos.length
            : 0;

        pintarDonutAvancePromedio(avancePromedio);

        document.getElementById('cfActDashTotalProyectos').textContent = activos.length;

        const hoy = new Date().toISOString().substring(0, 10);
        const vencidas = actividades.filter((a) => esVencida(a, hoy)).length;
        document.getElementById('cfActDashVencidas').textContent = vencidas;

        pintarTareasPorEstadoGeneral(actividades, hoy);
    }

    function pintarDonutAvancePromedio(avance) {
        const ctx = document.getElementById('cfActChartAvancePromedio');
        if (!ctx) return;

        if (chartActAvancePromedio) chartActAvancePromedio.destroy();

        chartActAvancePromedio = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [avance, Math.max(0, 100 - avance)],
                    backgroundColor: ['#10B981', '#E5E7EB'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });

        document.getElementById('cfActChartAvancePromedioLabel').textContent = `${avance.toFixed(1)}%`;
    }

    function pintarTareasPorEstadoGeneral(actividades, hoy) {
        const ctx = document.getElementById('cfActChartTareasEstado');
        if (!ctx) return;

        if (chartActTareasEstado) chartActTareasEstado.destroy();

        const conteos = { 'Planificado': 0, 'Vencida': 0, 'En proceso': 0, 'Completo': 0, 'Terminada Vencida': 0 };

        actividades.forEach((a) => {
            const estado = String(a.Estado || '').toUpperCase();

            if (estado === 'COMPLETADA') {
                if (esTerminadaVencida(a)) {
                    conteos['Terminada Vencida']++;
                } else {
                    conteos['Completo']++;
                }
            } else if (esVencida(a, hoy)) {
                conteos['Vencida']++;
            } else if (estado === 'EN_PROCESO') {
                conteos['En proceso']++;
            } else if (estado === 'PENDIENTE') {
                conteos['Planificado']++;
            }
        });

        chartActTareasEstado = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(conteos),
                datasets: [{
                    data: Object.values(conteos),
                    backgroundColor: '#3DDC97',
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                layout: { padding: { top: 24 } },
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#E5E7EB' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            },
            plugins: [{
                id: 'cfActEtiquetasBarra',
                afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    chart.getDatasetMeta(0).data.forEach((bar, i) => {
                        const valor = chart.data.datasets[0].data[i];
                        ctx.save();
                        ctx.fillStyle = '#1A2332';
                        ctx.font = '600 11px Inter, Arial, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(valor, bar.x, bar.y - 6);
                        ctx.restore();
                    });
                }
            }]
        });
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
