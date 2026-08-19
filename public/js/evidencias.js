/**
 * evidencias.js
 * Ref: DEF-WEB-015 (API Evidencias) -- pantalla independiente. El API ya
 * existia (usado desde el modal embebido en Actividades, ver ACT-014 en
 * actividades.js) pero no habia listado global; este archivo cubre eso:
 * listado con filtros, alta (subida de archivo), edicion de metadatos,
 * ver/descargar, eliminar y asociar un Documento existente.
 *
 * GET    {CF_API_BASE_URL}/evidencias?proyecto_id=&actividad_id=&tipo=&momento=&fecha_desde=&fecha_hasta=
 *   -> EvidenciaController::index()
 * GET    {CF_API_BASE_URL}/evidencias/kpis                -> EvidenciaController::kpis()
 * POST   {CF_API_BASE_URL}/evidencias                      -> EvidenciaController::store()   (multipart, campo 'archivo')
 * PUT    {CF_API_BASE_URL}/evidencias/{id}                 -> EvidenciaController::update()
 * DELETE {CF_API_BASE_URL}/evidencias/{id}                 -> EvidenciaController::delete()
 * GET    {CF_API_BASE_URL}/evidencias/{id}/descarga        -> EvidenciaController::descarga() (stream binario, requiere JWT por header)
 * POST   {CF_API_BASE_URL}/evidencias/{id}/documento       -> EvidenciaController::asociarDocumento()  Body: { DocumentoID }
 * GET    {CF_API_BASE_URL}/proyectos/{id}/evidencias/reporte -> EvidenciaController::reportePdf()  (PDF generado en servidor con dompdf, agrupado por Momento)
 * GET    {CF_API_BASE_URL}/proyectos                        -> ProyectoController::index() (catalogo filtro/alta)
 * GET    {CF_API_BASE_URL}/proyectos/{id}/actividades       -> ActividadController::index() (catalogo dependiente)
 * GET    {CF_API_BASE_URL}/documentos?proyecto_id=          -> DocumentoController::index() (catalogo para asociar)
 *
 * Formato estandar de respuesta (DEF-WEB-000 seccion 21):
 *   { success: bool, message: string, data: {} }
 */

document.addEventListener('DOMContentLoaded', () => {

    const CF_TIPOS_EVIDENCIA = ['FOTO', 'VIDEO', 'DOCUMENTO', 'OTRO'];
    const CF_MOMENTOS_EVIDENCIA = ['ANTES', 'DURANTE', 'DESPUES'];

    let dataTable = null;
    let proyectosPorID = {};
    let actividadesDelProyectoFiltro = {};

    const permisos = CF_PERMISOS['evidencias'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    if (!permisos.PuedeCrear) {
        document.getElementById('btnNuevaEvidencia')?.remove();
    }

    cargarCatalogoProyectos().then(() => {
        cargarResumen();
        cargarEvidencias();
    });

    document.getElementById('btnNuevaEvidencia')?.addEventListener('click', () => abrirFormularioEvidencia());
    document.getElementById('btnReporteEvidencias')?.addEventListener('click', generarReportePdf);
    document.getElementById('btnFiltrarEvidencias')?.addEventListener('click', cargarEvidencias);
    document.getElementById('cfBuscarEvidencias')?.addEventListener('input', (e) => {
        dataTable?.search(e.target.value).draw();
    });
    document.getElementById('btnLimpiarFiltrosEvidencias')?.addEventListener('click', () => {
        document.getElementById('cfFiltroProyectoEvidencia').value = '';
        document.getElementById('cfFiltroActividadEvidencia').innerHTML = '<option value="">Todas</option>';
        document.getElementById('cfFiltroTipoEvidencia').value = '';
        document.getElementById('cfFiltroMomentoEvidencia').value = '';
        document.getElementById('cfFiltroFechaDesdeEvidencia').value = '';
        document.getElementById('cfFiltroFechaHastaEvidencia').value = '';
        cargarEvidencias();
    });

    document.getElementById('cfFiltroProyectoEvidencia')?.addEventListener('change', async (e) => {
        await cargarActividadesDelProyecto(e.target.value, 'cfFiltroActividadEvidencia');
    });

    document.getElementById('cfTablaEvidencias')?.addEventListener('click', (e) => {
        const accion = e.target.closest('[data-ver-evidencia],[data-editar-evidencia],[data-asociar-documento],[data-reporte-proyecto],[data-eliminar-evidencia]');
        if (accion) e.preventDefault();

        const btnVer = e.target.closest('[data-ver-evidencia]');
        if (btnVer) return verArchivoEvidencia(btnVer.dataset.verEvidencia, btnVer.dataset.mime, btnVer.dataset.nombre);

        const btnEditar = e.target.closest('[data-editar-evidencia]');
        if (btnEditar) return abrirFormularioEvidencia(btnEditar.dataset.editarEvidencia);

        const btnAsociar = e.target.closest('[data-asociar-documento]');
        if (btnAsociar) return asociarDocumento(btnAsociar.dataset.asociarDocumento, btnAsociar.dataset.proyecto);

        const btnReporte = e.target.closest('[data-reporte-proyecto]');
        if (btnReporte) return generarReportePdf(btnReporte.dataset.reporteProyecto);

        const btnEliminar = e.target.closest('[data-eliminar-evidencia]');
        if (btnEliminar) return eliminarEvidencia(btnEliminar.dataset.eliminarEvidencia);
    });

    async function generarReportePdf(proyectoIDDirecto) {
        const proyectoID = proyectoIDDirecto || document.getElementById('cfFiltroProyectoEvidencia').value;

        if (!proyectoID) {
            return Swal.fire({
                icon: 'info',
                title: 'Selecciona un proyecto',
                text: 'El reporte fotografico se genera por proyecto. Elige uno en el filtro Proyecto y vuelve a intentar.'
            });
        }

        try {
            const resp = await axios.get(CF_API_BASE_URL + '/proyectos/' + proyectoID + '/evidencias/reporte', { responseType: 'blob' });
            const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');
            setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 60000);
        } catch (error) {
            var mensaje = 'No fue posible generar el reporte.';
            if (error.response && error.response.data instanceof Blob) {
                try {
                    var texto = await error.response.data.text();
                    mensaje = JSON.parse(texto).message || mensaje;
                } catch (_) { /* ignorar */ }
            }
            Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
    }

    async function cargarCatalogoProyectos() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos`);
            proyectosPorID = indexarPorID(resp.data.data, 'ProyectoID');

            const select = document.getElementById('cfFiltroProyectoEvidencia');
            Object.values(proyectosPorID).forEach((p) => {
                select.insertAdjacentHTML('beforeend', `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`);
            });
        } catch (error) {
            console.error('Error al cargar catálogo de proyectos:', error);
        }
    }

    async function cargarActividadesDelProyecto(proyectoID, selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Todas</option>';
        actividadesDelProyectoFiltro = {};

        if (!proyectoID) return;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/actividades`);
            actividadesDelProyectoFiltro = indexarPorID(resp.data.data, 'ActividadID');

            Object.values(actividadesDelProyectoFiltro).forEach((a) => {
                select.insertAdjacentHTML('beforeend', `<option value="${a.ActividadID}">${escapeHtml(a.CodigoWBS ? `${a.CodigoWBS} - ${a.NombreActividad}` : a.NombreActividad)}</option>`);
            });
        } catch (error) {
            console.error('Error al cargar actividades del proyecto:', error);
        }
    }

    async function cargarResumen() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/evidencias/kpis`);
            if (!resp.data.success) return;

            const kpis = resp.data.data || {};
            document.getElementById('cfResumenEvidenciasTotal').textContent = kpis.EvidenciasRegistradas ?? 0;
            document.getElementById('cfResumenActividadesConEvidencia').textContent = kpis.ActividadesConEvidencia ?? 0;
            document.getElementById('cfResumenProyectosConEvidencia').textContent = kpis.ProyectosConEvidencia ?? 0;
        } catch (error) {
            console.error('Error al cargar el resumen de evidencias:', error);
        }
    }

    async function cargarEvidencias() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#cfTablaEvidencias', { order: [[7, 'desc']] });
        }

        const params = {};
        const proyectoID = document.getElementById('cfFiltroProyectoEvidencia').value;
        const actividadID = document.getElementById('cfFiltroActividadEvidencia').value;
        const tipo = document.getElementById('cfFiltroTipoEvidencia').value;
        const momento = document.getElementById('cfFiltroMomentoEvidencia').value;
        const fechaDesde = document.getElementById('cfFiltroFechaDesdeEvidencia').value;
        const fechaHasta = document.getElementById('cfFiltroFechaHastaEvidencia').value;

        if (proyectoID) params.proyecto_id = proyectoID;
        if (actividadID) params.actividad_id = actividadID;
        if (tipo) params.tipo = tipo;
        if (momento) params.momento = momento;
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/evidencias`, { params });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el listado', text: resp.data.message || '' });
            }

            pintarFilas(resp.data.data || []);

        } catch (error) {
            console.error('Error al cargar evidencias:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.' });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((ev) => dataTable.row.add(construirFila(ev)));
        dataTable.draw();
    }

    function construirFila(ev) {
        const esImagen = /^image\//.test(ev.MimeType || '');
        const icono = esImagen ? 'bi-image' : (/^video\//.test(ev.MimeType || '') ? 'bi-camera-video' : 'bi-file-earmark-text');

        return [
            `<button type="button" class="btn btn-link p-0" title="Ver archivo" data-ver-evidencia="${ev.EvidenciaID}" data-mime="${escapeAtributo(ev.MimeType || '')}" data-nombre="${escapeAtributo(ev.NombreOriginal || '')}"><i class="bi ${icono} fs-5"></i> ${escapeHtml(ev.NombreOriginal || 'Ver')}</button>`,
            escapeHtml(ev.NombreProyecto || '—'),
            escapeHtml(ev.NombreActividad || '—'),
            `<span class="cf-badge" style="background:#EEF2FF;color:#0B1F47">${escapeHtml(ev.TipoEvidencia || '—')}</span>`,
            escapeHtml(ev.Momento || '—'),
            `<span title="${escapeAtributo(ev.Descripcion || '')}">${escapeHtml(truncar(ev.Descripcion, 60))}</span>`,
            ev.NombreDocumento
                ? `<span class="cf-badge" style="background:#ECFDF5;color:#10B981" title="${escapeAtributo(ev.CodigoDocumento || '')}"><i class="bi bi-link-45deg"></i> ${escapeHtml(ev.NombreDocumento)}</span>`
                : '<span class="text-muted">—</span>',
            formatearFecha(ev.FechaCaptura),
            escapeHtml(ev.Usuario || '—'),
            construirAcciones(ev)
        ];
    }

    function construirAcciones(ev) {
        const items = [];

        items.push(`<li><a class="dropdown-item" href="#" data-reporte-proyecto="${ev.ProyectoID}"><i class="bi bi-file-earmark-pdf me-2" style="color:#EF4444"></i>Generar reporte</a></li>`);

        if (permisos.PuedeActualizar) {
            items.push(`<li><a class="dropdown-item" href="#" data-editar-evidencia="${ev.EvidenciaID}"><i class="bi bi-pencil-square me-2" style="color:#3B82F6"></i>Editar metadatos</a></li>`);
            items.push(`<li><a class="dropdown-item" href="#" data-asociar-documento="${ev.EvidenciaID}" data-proyecto="${ev.ProyectoID}"><i class="bi bi-link-45deg me-2" style="color:#06B6D4"></i>Asociar documento</a></li>`);
        }

        if (permisos.PuedeEliminar) {
            items.push('<li><hr class="dropdown-divider"></li>');
            items.push(`<li><a class="dropdown-item text-danger" href="#" data-eliminar-evidencia="${ev.EvidenciaID}"><i class="bi bi-trash me-2"></i>Eliminar</a></li>`);
        }

        return `
            <div class="dropdown">
                <button class="btn btn-sm" type="button" data-bs-toggle="dropdown" style="background:transparent;border:none;color:#94A3B8;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" style="border-radius:12px;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(0,0,0,.1);padding:8px;min-width:200px;font-size:.85rem">
                    ${items.join('')}
                </ul>
            </div>
        `;
    }

    // ---- Alta / edición (metadatos + subida cuando es alta) ----
    async function abrirFormularioEvidencia(evidenciaID) {
        const esEdicion = !!evidenciaID;
        let evidencia = null;

        if (esEdicion) {
            try {
                const resp = await axios.get(`${CF_API_BASE_URL}/evidencias/${evidenciaID}`);
                if (!resp.data.success) {
                    return Swal.fire({ icon: 'error', title: 'No encontrada', text: resp.data.message || '' });
                }
                evidencia = resp.data.data;
            } catch (error) {
                return Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar la evidencia.' });
            }
        }

        const opcionesProyecto = Object.values(proyectosPorID)
            .map((p) => `<option value="${p.ProyectoID}" ${evidencia && Number(evidencia.ProyectoID) === Number(p.ProyectoID) ? 'selected' : ''}>${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: esEdicion ? 'Editar Evidencia' : 'Subir Evidencia',
            width: 560,
            html: `
                <div class="text-start">
                    ${esEdicion ? '' : `
                    <div class="row g-2 mb-2">
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Proyecto *</label>
                            <select id="swalProyectoEvidencia" class="form-select">
                                <option value="">Selecciona un proyecto</option>
                                ${opcionesProyecto}
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Actividad (opcional)</label>
                            <select id="swalActividadEvidencia" class="form-select">
                                <option value="">Sin actividad específica</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Archivo *</label>
                            <input id="swalArchivoEvidencia" type="file" class="form-control" accept="image/*,video/*,application/pdf,.docx,.xlsx">
                        </div>
                    </div>
                    `}
                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Tipo</label>
                            <select id="swalTipoEvidencia" class="form-select">
                                ${CF_TIPOS_EVIDENCIA.map((t) => `<option value="${t}" ${evidencia && evidencia.TipoEvidencia === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Momento</label>
                            <select id="swalMomentoEvidencia" class="form-select">
                                ${CF_MOMENTOS_EVIDENCIA.map((m) => `<option value="${m}" ${(evidencia ? evidencia.Momento === m : m === 'DURANTE') ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <label class="form-label mb-1" style="font-size:0.85rem">Título</label>
                    <input id="swalTituloEvidencia" type="text" class="form-control mb-2" value="${escapeAtributo(evidencia?.Titulo || '')}">
                    <label class="form-label mb-1" style="font-size:0.85rem">Descripción *</label>
                    <input id="swalDescripcionEvidencia" type="text" class="form-control mb-2" placeholder="Ej. Vaciado de losa, avance visible" value="${escapeAtributo(evidencia?.Descripcion || '')}">
                    <label class="form-label mb-1" style="font-size:0.85rem">Observaciones</label>
                    <textarea id="swalObservacionesEvidencia" class="form-control" rows="2">${escapeHtml(evidencia?.Observaciones || '')}</textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Guardar cambios' : 'Subir',
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                if (!esEdicion) {
                    const selProyecto = document.getElementById('swalProyectoEvidencia');
                    selProyecto.addEventListener('change', async () => {
                        const selActividad = document.getElementById('swalActividadEvidencia');
                        selActividad.innerHTML = '<option value="">Sin actividad específica</option>';
                        if (!selProyecto.value) return;
                        try {
                            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${selProyecto.value}/actividades`);
                            (resp.data.data || []).forEach((a) => {
                                selActividad.insertAdjacentHTML('beforeend', `<option value="${a.ActividadID}">${escapeHtml(a.CodigoWBS ? `${a.CodigoWBS} - ${a.NombreActividad}` : a.NombreActividad)}</option>`);
                            });
                        } catch (error) {
                            console.error('Error al cargar actividades:', error);
                        }
                    });
                }
            },
            preConfirm: () => {
                const descripcion = document.getElementById('swalDescripcionEvidencia').value.trim();

                if (!descripcion) {
                    Swal.showValidationMessage('La descripción es obligatoria.');
                    return false;
                }

                const datos = {
                    TipoEvidencia: document.getElementById('swalTipoEvidencia').value,
                    Momento: document.getElementById('swalMomentoEvidencia').value,
                    Titulo: document.getElementById('swalTituloEvidencia').value.trim() || null,
                    Descripcion: descripcion,
                    Observaciones: document.getElementById('swalObservacionesEvidencia').value.trim() || null
                };

                if (!esEdicion) {
                    const proyectoID = document.getElementById('swalProyectoEvidencia').value;
                    const archivo = document.getElementById('swalArchivoEvidencia').files[0];

                    if (!proyectoID) {
                        Swal.showValidationMessage('Selecciona un proyecto.');
                        return false;
                    }
                    if (!archivo) {
                        Swal.showValidationMessage('Selecciona un archivo para subir.');
                        return false;
                    }

                    datos.ProyectoID = proyectoID;
                    datos.ActividadID = document.getElementById('swalActividadEvidencia').value || null;
                    datos.archivo = archivo;
                }

                return datos;
            }
        });

        if (!formValues) return;

        try {
            let resp;

            if (esEdicion) {
                resp = await axios.put(`${CF_API_BASE_URL}/evidencias/${evidenciaID}`, formValues);
            } else {
                const formData = new FormData();
                formData.append('archivo', formValues.archivo);
                formData.append('ProyectoID', formValues.ProyectoID);
                if (formValues.ActividadID) formData.append('ActividadID', formValues.ActividadID);
                formData.append('TipoEvidencia', formValues.TipoEvidencia);
                formData.append('Momento', formValues.Momento);
                formData.append('Descripcion', formValues.Descripcion);
                if (formValues.Titulo) formData.append('Titulo', formValues.Titulo);
                if (formValues.Observaciones) formData.append('Observaciones', formValues.Observaciones);

                resp = await axios.post(`${CF_API_BASE_URL}/evidencias`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: esEdicion ? 'Evidencia actualizada' : 'Evidencia registrada', timer: 1200, showConfirmButton: false });
            cargarEvidencias();
            cargarResumen();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible guardar la evidencia.' });
        }
    }

    // ---- Ver / descargar archivo ----
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

    // ---- Asociar documento existente (Flujo Funcional: Asociar Documento) ----
    async function asociarDocumento(evidenciaID, proyectoID) {
        let documentos = [];

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/documentos`, { params: { proyecto_id: proyectoID } });
            documentos = resp.data.success ? (resp.data.data || []) : [];
        } catch (error) {
            console.error('Error al cargar documentos del proyecto:', error);
        }

        if (documentos.length === 0) {
            return Swal.fire({
                icon: 'info',
                title: 'Sin documentos disponibles',
                text: 'Este proyecto no tiene documentos registrados para asociar. Da de alta el documento primero desde el módulo Documentos.'
            });
        }

        const opciones = documentos
            .map((d) => `<option value="${d.DocumentoID}">${escapeHtml(d.CodigoDocumento ? `${d.CodigoDocumento} - ${d.NombreDocumento}` : d.NombreDocumento)}</option>`)
            .join('');

        const { value: documentoID } = await Swal.fire({
            title: 'Asociar documento',
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Documento del proyecto</label>
                    <select id="swalDocumentoAsociar" class="form-select">
                        <option value="">Selecciona un documento</option>
                        ${opciones}
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Asociar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const valor = document.getElementById('swalDocumentoAsociar').value;
                if (!valor) {
                    Swal.showValidationMessage('Selecciona un documento.');
                    return false;
                }
                return valor;
            }
        });

        if (!documentoID) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/evidencias/${evidenciaID}/documento`, {
                DocumentoID: documentoID
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo asociar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Documento asociado', timer: 1200, showConfirmButton: false });
            cargarEvidencias();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible asociar el documento.' });
        }
    }

    // ---- Eliminar ----
    async function eliminarEvidencia(evidenciaID) {
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

            await Swal.fire({ icon: 'success', title: 'Evidencia eliminada', timer: 1200, showConfirmButton: false });
            cargarEvidencias();
            cargarResumen();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la evidencia.' });
        }
    }

    // ---- Helpers ----
    function indexarPorID(lista, campoID) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campoID]] = item; });
        return mapa;
    }

    function truncar(texto, longitud) {
        const valor = texto || '';
        return valor.length > longitud ? valor.substring(0, longitud) + '…' : valor;
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
