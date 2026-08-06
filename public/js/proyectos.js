/**
 * proyectos.js
 * Ref: DEF-WEB-003 (API Proyectos).
 *
 * GET    {CF_API_BASE_URL}/proyectos                       -> ProyectoController::index()
 * POST   {CF_API_BASE_URL}/proyectos                       -> ProyectoController::store()
 * GET    {CF_API_BASE_URL}/proyectos/{id}                  -> ProyectoController::show()
 * PUT    {CF_API_BASE_URL}/proyectos/{id}                  -> ProyectoController::update()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/dashboard         -> ProyectoController::getDashboard()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/indicadores       -> ProyectoController::getIndicadores()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/fases             -> ProyectoController::getFases()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/encargados        -> ProyectoController::getEncargados()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/facturacion       -> ProyectoController::getFacturacion()
 * GET    {CF_API_BASE_URL}/proyectos/{id}/pdf               -> ProyectoController::pdf()
 * PUT    {CF_API_BASE_URL}/proyectos/{id}/estado            -> ProyectoController::cambiarEstado()
 * PUT    {CF_API_BASE_URL}/proyectos/{id}/contrato          -> ProyectoController::registrarContrato()
 * DELETE {CF_API_BASE_URL}/proyectos/{id}                   -> ProyectoController::delete()
 * GET    {CF_API_BASE_URL}/clientes                         -> ClienteController::index()
 * GET    {CF_API_BASE_URL}/usuarios                         -> UsuarioController::index()
 *
 * Formato estándar de respuesta (DEF-WEB-000 sección 21):
 *   { success: bool, message: string, data: {} }
 *
 * Nota sobre Nuevo/Editar: el formulario general solo captura los datos
 * "cabecera" del proyecto (Cliente, Responsable, Nombre, Tipo, Presupuesto,
 * fechas, ubicación, descripción, observaciones). No edita Fases ni
 * Encargados como arreglo: si no se envían, ProyectoService::create()
 * genera automáticamente una fase inicial "Planeación" y asigna al
 * Responsable como encargado principal; en edición, al no enviar esas
 * llaves, ProyectoService::update() las deja intactas.
 */

document.addEventListener('DOMContentLoaded', () => {

    // Ref: ProyectoService::validarEstado() (Api) — mismas transiciones permitidas.
    const CF_ESTADOS_PROYECTO = {
        NO_INICIADO: { label: 'No Iniciado', color: '#6C757D', siguientes: ['PLANEACION', 'ACTIVO', 'EN_PROCESO', 'CANCELADO'] },
        PLANEACION: { label: 'Planeación', color: '#0B69D4', siguientes: ['ACTIVO', 'EN_PROCESO', 'CANCELADO', 'EN_PAUSA'] },
        ACTIVO: { label: 'Activo', color: '#10B981', siguientes: ['EN_PROCESO', 'EN_PAUSA', 'CERRADO', 'CANCELADO'] },
        EN_PROCESO: { label: 'En Proceso', color: '#0EA5E9', siguientes: ['ACTIVO', 'EN_PAUSA', 'CERRADO', 'CANCELADO'] },
        EN_PAUSA: { label: 'En Pausa', color: '#F59E0B', siguientes: ['ACTIVO', 'EN_PROCESO', 'CANCELADO'] },
        CERRADO: { label: 'Cerrado', color: '#0B1F47', siguientes: [] },
        CANCELADO: { label: 'Cancelado', color: '#EF4444', siguientes: [] }
    };

    // Ref: ActividadService (Api) -- estados propios de CF_Actividad (no confundir con Estado del Proyecto).
    const CF_ESTADOS_ACTIVIDAD = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];

    let clientesPorID = {};
    let usuariosPorID = {};
    let dataTable = null;
    let ultimosProyectos = [];
    let proyectoEnEdicionID = null;
    let ganttInstancia = null;
    let proyectoGanttActualID = null;
    let modoBotonPrincipal = 'proyecto';
    let tareasGanttActuales = [];
    let ultimoClicTareaID = null;
    let ultimoClicTimestamp = 0;
    let guardandoProyecto = false;
    let reprogramacionPendiente = null;
    let actividadesGanttActuales = [];
    let chartAvanceProyecto = null;
    let chartTareasEstado = null;
    let fasesProyectoActual = [];

    function esActividadVencida(a, hoyISO = new Date().toISOString().substring(0, 10)) {
        if (!a || !a.FinPlan) return false;

        const estadoActividad = String(a.Estado || '').toUpperCase();
        const finPlan = String(a.FinPlan).substring(0, 10);

        return (
            finPlan < hoyISO &&
            !['COMPLETADA', 'CANCELADA'].includes(estadoActividad) &&
            Number(a.Avance || 0) < 100
        );
    }

    // Nuevo criterio: actividad que SI se completo (Avance 100 / COMPLETADA)
    // pero se termino DESPUES de su fecha planeada -- antes esto se perdia
    // por completo: en cuanto Avance llegaba a 100 la actividad dejaba de
    // evaluarse contra la fecha, sin importar si se cumplio a tiempo o no.
    // Usa FinReal (fecha real de termino, la llena el Api en
    // ActividadService::registrarAvance() cuando Avance>=100) contra
    // FinPlan -- no "hoy", para que quede fijo aunque pasen los dias.
    function esActividadTerminadaVencida(a) {
        if (!a || !a.FinPlan || !a.FinReal) return false;

        const estadoActividad = String(a.Estado || '').toUpperCase();
        const completada = estadoActividad === 'COMPLETADA' || Number(a.Avance || 0) >= 100;

        if (!completada) return false;

        const finPlan = String(a.FinPlan).substring(0, 10);
        const finReal = String(a.FinReal).substring(0, 10);

        return finReal > finPlan;
    }

    const permisos = CF_PERMISOS['proyectos'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    if (!permisos.PuedeCrear) {
        document.getElementById('btnNuevoProyecto')?.remove();
    }

    poblarFiltroEstados();
    cargarCatalogos().then(cargarProyectos);

    document.getElementById('cfBuscarProyectos')?.addEventListener('input', (e) => {
        dataTable?.search(e.target.value).draw();
    });

    document.getElementById('btnFiltrar')?.addEventListener('click', cargarProyectos);
    document.getElementById('btnNuevoProyecto')?.addEventListener('click', () => {
        if (modoBotonPrincipal === 'actividad') return abrirNuevaActividadDesdeGantt();
        mostrarFormulario(null);
    });
    document.getElementById('btnCancelarFormularioProyecto')?.addEventListener('click', ocultarFormulario);
    document.getElementById('btnGuardarProyecto')?.addEventListener('click', () => {
        if (guardandoProyecto) return;
        guardarProyecto();
    });
    document.getElementById('btnAgregarActividadProyecto')?.addEventListener('click', () => agregarFilaActividadProyecto());
    document.getElementById('btnCerrarGantt')?.addEventListener('click', ocultarGantt);
    document.getElementById('btnGestionarDependencias')?.addEventListener('click', () => {
        if (proyectoGanttActualID) gestionarDependencias(proyectoGanttActualID);
    });
    document.getElementById('cfGanttModoVista')?.addEventListener('change', (e) => {
        if (ganttInstancia) ganttInstancia.change_view_mode(e.target.value);
    });

    // Tabs Gantt / Dashboard dentro de la vista del Gantt del proyecto.
    document.getElementById('cfGanttTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        cambiarTabGantt(btn.dataset.tab);
    });

    // Reportar avance con clic derecho sobre la barra (best-effort: depende
    // de que Frappe Gantt siga usando ".bar-wrapper" con "data-id" en su SVG
    // interno; si la libreria cambia esa estructura, dejaria de funcionar
    // solo este atajo -- el doble clic no depende de esto).
    document.getElementById('cfGanttContenedor')?.addEventListener('contextmenu', (e) => {
        const wrapper = e.target.closest('.bar-wrapper');
        if (!wrapper || !proyectoGanttActualID) return;

        e.preventDefault();

        const taskID = wrapper.dataset.id || wrapper.getAttribute('data-id');
        const task = tareasGanttActuales.find((t) => String(t.id) === String(taskID));
        if (task) reportarAvanceDesdeGantt(task, proyectoGanttActualID);
    });

    document.getElementById('cfTablaActividadesProyecto')?.addEventListener('click', (e) => {
        const btnGuardarFila = e.target.closest('[data-guardar-actividad]');
        if (btnGuardarFila) {
            if (btnGuardarFila.disabled) return;
            return guardarActividadFila(btnGuardarFila.closest('tr'), btnGuardarFila);
        }

        const btnEliminarFila = e.target.closest('[data-eliminar-actividad]');
        if (btnEliminarFila) return eliminarActividadFila(btnEliminarFila.closest('tr'));

        const btnEvidenciasFila = e.target.closest('[data-evidencias-actividad]');
        if (btnEvidenciasFila) return verEvidenciasActividadProyecto(btnEvidenciasFila.dataset.evidenciasActividad);
    });

    document.getElementById('tblProyectos')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('[data-ver]');
        if (btnVer) return verProyecto(btnVer.dataset.ver);

        const btnGantt = e.target.closest('[data-gantt]');
        if (btnGantt) return verGantt(btnGantt.dataset.gantt);

        const btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) return mostrarFormulario(btnEditar.dataset.editar);

        const btnImprimir = e.target.closest('[data-imprimir]');
        if (btnImprimir) return imprimirProyecto(btnImprimir.dataset.imprimir);

        const btnEstado = e.target.closest('[data-cambiar-estado]');
        if (btnEstado) return cambiarEstadoProyecto(btnEstado.dataset.cambiarEstado);

        const btnContrato = e.target.closest('[data-contrato]');
        if (btnContrato) return registrarContrato(btnContrato.dataset.contrato);

        const btnEliminar = e.target.closest('[data-eliminar]');
        if (btnEliminar) return eliminarProyecto(btnEliminar.dataset.eliminar);
    });

    // Escucha el soltar real del mouse/touch en TODO el documento, en fase
    // de CAPTURA (tercer argumento `true`). Frappe Gantt dispara on_date_change
    // en cada dia que se cruza mientras se arrastra (no solo al soltar) y su
    // propio manejador interno de mouseup puede detener la propagacion del
    // evento -- escuchar en captura garantiza que este listener se ejecute
    // ANTES que cualquier stopPropagation() interno de la libreria, por lo
    // que siempre detecta el soltar real del mouse/dedo, sin importar cuanto
    // tiempo se haya quedado pausado a medio arrastre (con bubbling normal
    // se disparaba tarde o de forma indirecta).
    ['mouseup', 'touchend'].forEach((evento) => {
        document.addEventListener(evento, () => {
            if (!reprogramacionPendiente) return;
            const { task, start, end, proyectoID } = reprogramacionPendiente;
            reprogramacionPendiente = null;
            confirmarYGuardarReprogramacion(task, start, end, proyectoID);
        }, true);
    });

    function poblarFiltroEstados() {
        const select = document.getElementById('fEstado');
        Object.entries(CF_ESTADOS_PROYECTO).forEach(([codigo, info]) => {
            const option = document.createElement('option');
            option.value = codigo;
            option.textContent = info.label;
            select.appendChild(option);
        });
    }

    async function cargarCatalogos() {
        try {
            const [respClientes, respUsuarios] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/clientes`),
                axios.get(`${CF_API_BASE_URL}/usuarios`)
            ]);

            clientesPorID = indexarPorID(respClientes.data.data, 'ClienteID');
            usuariosPorID = indexarPorID(respUsuarios.data.data, 'UsuarioID');

            const selCliente = document.getElementById('fClienteID');
            Object.values(clientesPorID).forEach((c) => {
                selCliente.insertAdjacentHTML('beforeend', `<option value="${c.ClienteID}">${escapeHtml(c.NombreCliente)}</option>`);
            });

            const selResponsable = document.getElementById('fResponsableID');
            Object.values(usuariosPorID).forEach((u) => {
                selResponsable.insertAdjacentHTML('beforeend', `<option value="${u.UsuarioID}">${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`);
            });

            // Selects del formulario Nuevo/Editar
            const selClienteForm = document.getElementById('cfClienteID');
            if (selClienteForm) {
                Object.values(clientesPorID).forEach((c) => {
                    selClienteForm.insertAdjacentHTML('beforeend', `<option value="${c.ClienteID}">${escapeHtml(c.NombreCliente)}</option>`);
                });
            }

            const selResponsableForm = document.getElementById('cfResponsableID');
            if (selResponsableForm) {
                Object.values(usuariosPorID).forEach((u) => {
                    selResponsableForm.insertAdjacentHTML('beforeend', `<option value="${u.UsuarioID}">${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`);
                });
            }

        } catch (error) {
            console.error('Error al cargar catálogos de proyectos:', error);
        }
    }

    async function cargarProyectos() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#tblProyectos', { order: [] });
        }

        const params = {};
        const clienteID = document.getElementById('fClienteID').value;
        const responsableID = document.getElementById('fResponsableID').value;
        const estado = document.getElementById('fEstado').value;

        if (clienteID) params.cliente_id = clienteID;
        if (responsableID) params.responsable_id = responsableID;
        if (estado) params.estado = estado;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos`, { params });

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar el listado',
                    text: resp.data.message || 'Ocurrió un error al consultar los proyectos.'
                });
            }

            pintarFilas(resp.data.data || []);

        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar proyectos',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    function pintarFilas(filas) {
        ultimosProyectos = filas;
        dataTable.clear();
        filas.forEach((p) => dataTable.row.add(construirFila(p)));
        dataTable.draw();
    }

    function indexarPorID(lista, campoID) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campoID]] = item; });
        return mapa;
    }

    function construirFila(p) {
        const estadoInfo = CF_ESTADOS_PROYECTO[p.Estado] || { label: p.Estado, color: '#6C757D' };
        const responsable = p.ResponsablePrincipal || '—';

        return [
            `<strong>${escapeHtml(folioCorto(p.CodigoProyecto) || `#${p.ProyectoID}`)}</strong>`,
            `${escapeHtml(p.NombreProyecto || '—')}`,
            escapeHtml(p.NombreCliente || `Cliente #${p.ClienteID}`),
            badgeOC(p),
            escapeHtml(responsable),
            badgeEstado(estadoInfo.label, estadoInfo.color),
            barraAvance(p.PorcentajeAvance),
            formatearFecha(p.FechaInicio),
            formatearFecha(p.FechaFin),
            construirAcciones(p)
        ];
    }

    // PRO-001: el código interno se conserva (ROM01-PRO-000005) pero el grid
    // solo muestra el consecutivo final (000005).
    function folioCorto(codigoProyecto) {
        if (!codigoProyecto) return '';
        const partes = String(codigoProyecto).split('-');
        return partes[partes.length - 1];
    }

    // PRO-003: "EN ESPERA DE OC" ahora la calcula la API (`CondicionOperativa`)
    // a partir de NumeroContrato -- Web solo la pinta, no la recalcula.
    function badgeOC(p) {
        if (p.CondicionOperativa === 'EN ESPERA DE OC' || (!p.CondicionOperativa && !String(p.NumeroContrato || '').trim())) {
            return `<span class="cf-badge" style="background:#F59E0B22;color:#F59E0B">EN ESPERA DE OC</span>`;
        }
        return escapeHtml(p.NumeroContrato);
    }

    function construirAcciones(p) {
        const botones = [];
        const esFinal = p.Estado === 'CERRADO' || p.Estado === 'CANCELADO';

        if (permisos.PuedeConsultar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Ver detalle" data-ver="${p.ProyectoID}"><i class="bi bi-eye"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Gantt" data-gantt="${p.ProyectoID}"><i class="bi bi-bar-chart-steps"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Imprimir" data-imprimir="${p.ProyectoID}"><i class="bi bi-printer"></i></button>`);
        }

        if (permisos.PuedeActualizar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Editar" data-editar="${p.ProyectoID}"><i class="bi bi-pencil"></i></button>`);

            if (!esFinal) {
                botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Cambiar estado" data-cambiar-estado="${p.ProyectoID}"><i class="bi bi-arrow-repeat"></i></button>`);
            }
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Registrar contrato" data-contrato="${p.ProyectoID}"><i class="bi bi-file-earmark-text"></i></button>`);
        }

        if (permisos.PuedeEliminar && Number(p.FacturacionAcumulada || 0) === 0) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar="${p.ProyectoID}"><i class="bi bi-trash"></i></button>`);
        }

        return `<div class="cf-row-actions text-end">${botones.join('')}</div>`;
    }

    // ---- Nuevo / Editar (formulario general de cabecera) ----
    async function mostrarFormulario(proyectoID) {
        document.getElementById('cfCardListado').style.display = 'none';
        document.getElementById('cfCardFormulario').style.display = '';
        limpiarErroresFormularioProyecto();

        if (!proyectoID) {
            proyectoEnEdicionID = null;
            document.getElementById('cfFormTitulo').textContent = 'Nuevo Proyecto';

            document.getElementById('cfClienteID').value = '';
            document.getElementById('cfResponsableID').value = '';
            document.getElementById('cfNombreProyecto').value = '';
            document.getElementById('cfTipoProyecto').value = 'Construccion';
            document.getElementById('cfNumeroContrato').value = '';
            document.getElementById('cfFechaInicio').value = '';
            document.getElementById('cfFechaFin').value = '';
            document.getElementById('cfUbicacionProyecto').value = '';
            document.getElementById('cfDescripcion').value = '';
            document.getElementById('cfObservacionesProyecto').value = '';

            configurarSeccionActividades(false);
            return;
        }

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}`);

            if (!resp.data.success) {
                ocultarFormulario();
                return Swal.fire({ icon: 'error', title: 'No encontrado', text: resp.data.message || '' });
            }

            const p = resp.data.data;
            proyectoEnEdicionID = p.ProyectoID;
            document.getElementById('cfFormTitulo').textContent = `Editar ${p.CodigoProyecto || ''}`;

            document.getElementById('cfClienteID').value = p.ClienteID || '';
            document.getElementById('cfResponsableID').value = p.ResponsableID || '';
            document.getElementById('cfNombreProyecto').value = p.NombreProyecto || '';
            document.getElementById('cfTipoProyecto').value = p.TipoProyecto || 'Construccion';
            document.getElementById('cfNumeroContrato').value = p.NumeroContrato || '';
            document.getElementById('cfFechaInicio').value = (p.FechaInicio || '').substring(0, 10);
            document.getElementById('cfFechaFin').value = (p.FechaFin || '').substring(0, 10);
            document.getElementById('cfUbicacionProyecto').value = p.UbicacionProyecto || '';
            document.getElementById('cfDescripcion').value = p.Descripcion || '';
            document.getElementById('cfObservacionesProyecto').value = p.Observaciones || '';

            configurarSeccionActividades(true);
            await cargarFasesProyecto(proyectoEnEdicionID);
            await cargarActividadesProyecto(proyectoEnEdicionID);

        } catch (error) {
            ocultarFormulario();
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar el proyecto.' });
        }
    }

    function ocultarFormulario() {
        document.getElementById('cfCardFormulario').style.display = 'none';
        document.getElementById('cfCardListado').style.display = '';
    }

    async function guardarProyecto() {
        limpiarErroresFormularioProyecto();

        const clienteID = document.getElementById('cfClienteID').value;
        const nombreProyecto = document.getElementById('cfNombreProyecto').value.trim();
        const responsableIDValidacion = document.getElementById('cfResponsableID').value;

        const errores = [];

        if (!clienteID) {
            marcarInvalido('cfClienteID');
            errores.push('Selecciona un Cliente.');
        }
        if (!nombreProyecto) {
            marcarInvalido('cfNombreProyecto');
            errores.push('Captura el Nombre del Proyecto.');
        }
        if (!responsableIDValidacion) {
            marcarInvalido('cfResponsableID');
            errores.push('Selecciona un Responsable.');
        }

        if (errores.length) {
            return Swal.fire({
                icon: 'warning',
                title: 'Revisa el formulario',
                html: `<ul style="text-align:left">${errores.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
            });
        }

        const responsableID = document.getElementById('cfResponsableID').value;

        const payload = {
            ClienteID: Number(clienteID),
            ResponsableID: responsableID ? Number(responsableID) : null,
            NombreProyecto: nombreProyecto,
            TipoProyecto: document.getElementById('cfTipoProyecto').value.trim() || 'Construccion',
            NumeroContrato: document.getElementById('cfNumeroContrato').value.trim() || null,
            FechaInicio: document.getElementById('cfFechaInicio').value || null,
            FechaFin: document.getElementById('cfFechaFin').value || null,
            UbicacionProyecto: document.getElementById('cfUbicacionProyecto').value.trim() || null,
            Descripcion: document.getElementById('cfDescripcion').value.trim() || null,
            Observaciones: document.getElementById('cfObservacionesProyecto').value.trim() || null
        };

        try {
            const esNuevo = !proyectoEnEdicionID;

            const resp = proyectoEnEdicionID
                ? await axios.put(`${CF_API_BASE_URL}/proyectos/${proyectoEnEdicionID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/proyectos`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: resp.data.message || '' });
            }

            if (esNuevo) {
                // Deja el formulario abierto, ahora en modo edición, para poder
                // agregar actividades de inmediato (requieren un ProyectoID real).
                proyectoEnEdicionID = resp.data.data?.ProyectoID || null;
                document.getElementById('cfFormTitulo').textContent = `Editar ${resp.data.data?.CodigoProyecto || ''}`;
                configurarSeccionActividades(true);
                await cargarFasesProyecto(proyectoEnEdicionID);
                await cargarActividadesProyecto(proyectoEnEdicionID);
                cargarProyectos();

                await Swal.fire({
                    icon: 'success',
                    title: 'Proyecto creado',
                    text: 'Ahora puedes agregar sus actividades.',
                    timer: 1800,
                    showConfirmButton: false
                });
                return;
            }

            // Guarda tambien todas las filas de Actividades -- antes el
            // boton "Guardar" solo mandaba la cabecera y los cambios hechos
            // directo en la tabla se perdian si no se presionaba el check
            // de cada fila por separado.
            const erroresActividades = await guardarTodasLasActividadesProyecto();

            if (erroresActividades.length) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Proyecto guardado, revisa las actividades',
                    html: `El proyecto se guardó, pero estas actividades no se pudieron guardar:<ul style="text-align:left">${erroresActividades.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
                });
            } else {
                await Swal.fire({ icon: 'success', title: 'Proyecto y actividades guardados', timer: 1300, showConfirmButton: false });
            }

            ocultarFormulario();
            cargarProyectos();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible guardar el proyecto.' });
        }
    }

    function marcarInvalido(id) {
        document.getElementById(id)?.classList.add('is-invalid');
    }

    function limpiarErroresFormularioProyecto() {
        document.querySelectorAll('#cfCardFormulario .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    }

    // ---- Actividades del proyecto (alta/edición dentro del formulario) ----
    function configurarSeccionActividades(habilitada) {
        const nota = document.getElementById('cfActividadesNota');
        const btnAgregar = document.getElementById('btnAgregarActividadProyecto');
        const tabla = document.getElementById('cfTablaActividadesProyecto');

        if (nota) nota.style.display = habilitada ? 'none' : '';
        if (btnAgregar) btnAgregar.disabled = !habilitada;
        if (!habilitada && tabla) {
            tabla.querySelector('tbody').innerHTML = '';
        }
    }

    // ACT-002/ACT-011: la tabla de Actividades no tenia selector de Fase --
    // toda actividad nueva creada desde este formulario quedaba con FaseID
    // NULL (o caia en la primera fase por defecto que asigna el backend, ver
    // ActividadService::obtenerFaseIDPorDefecto()). Se carga el catalogo de
    // Fases del proyecto para poblar el select de cada fila.
    async function cargarFasesProyecto(proyectoID) {
        fasesProyectoActual = [];

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/fases`);
            if (resp.data.success) fasesProyectoActual = resp.data.data || [];
        } catch (error) {
            console.error('Error al cargar fases del proyecto:', error);
        }
    }

    async function cargarActividadesProyecto(proyectoID) {
        const tbody = document.querySelector('#cfTablaActividadesProyecto tbody');
        tbody.innerHTML = '';

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/actividades`);
            if (!resp.data.success) return;

            (resp.data.data || []).forEach((a) => agregarFilaActividadProyecto(a));

        } catch (error) {
            console.error('Error al cargar actividades del proyecto:', error);
        }
    }

    function agregarFilaActividadProyecto(a) {
        a = a || {};
        const tbody = document.querySelector('#cfTablaActividadesProyecto tbody');

        const opcionesResponsable = Object.values(usuariosPorID).map((u) => `
            <option value="${u.UsuarioID}" ${Number(a.ResponsableID) === Number(u.UsuarioID) ? 'selected' : ''}>
                ${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}
            </option>
        `).join('');

        const opcionesFase = fasesProyectoActual.map((f) => `
            <option value="${f.FaseID}" ${Number(a.FaseID) === Number(f.FaseID) ? 'selected' : ''}>
                ${escapeHtml(f.NombreFase || `Fase #${f.FaseID}`)}
            </option>
        `).join('');

        const opcionesEstado = CF_ESTADOS_ACTIVIDAD.map((codigo) => `
            <option value="${codigo}" ${(a.Estado || 'PENDIENTE') === codigo ? 'selected' : ''}>${escapeHtml(codigo)}</option>
        `).join('');

        const tr = document.createElement('tr');
        tr.dataset.actividadId = a.ActividadID || 0;
        tr.innerHTML = `
            <td><input type="text" class="form-control form-control-sm" data-campo="CodigoWBS" value="${escapeAtributo(a.CodigoWBS)}" placeholder="Auto" title="Se genera automáticamente si se deja vacío"></td>
            <td><input type="text" class="form-control form-control-sm" data-campo="NombreActividad" value="${escapeAtributo(a.NombreActividad)}"></td>
            <td><input type="text" class="form-control form-control-sm" data-campo="Descripcion" value="${escapeAtributo(a.Descripcion)}"></td>
            <td><select class="form-select form-select-sm" data-campo="FaseID"><option value="">Sin fase</option>${opcionesFase}</select></td>
            <td><select class="form-select form-select-sm" data-campo="ResponsableID"><option value="">--</option>${opcionesResponsable}</select></td>
            <td><input type="date" class="form-control form-control-sm" data-campo="InicioPlan" value="${(a.InicioPlan || '').substring(0, 10)}"></td>
            <td><input type="date" class="form-control form-control-sm" data-campo="FinPlan" value="${(a.FinPlan || '').substring(0, 10)}"></td>
            <td><select class="form-select form-select-sm" data-campo="Estado">${opcionesEstado}</select></td>
            <td class="text-center"><input type="checkbox" class="form-check-input" data-campo="EsHito" ${Number(a.EsHito) === 1 ? 'checked' : ''} title="Marcar como hito (fecha única, sin duración)"></td>
            <td class="text-end">
                <button type="button" class="btn btn-cf-secondary btn-sm" title="Guardar actividad" data-guardar-actividad><i class="bi bi-check-lg"></i></button>
                ${a.ActividadID ? `<button type="button" class="btn btn-cf-secondary btn-sm" title="Evidencias" data-evidencias-actividad="${a.ActividadID}"><i class="bi bi-camera"></i></button>` : ''}
                <button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar-actividad><i class="bi bi-trash"></i></button>
            </td>
        `;

        tbody.appendChild(tr);
        return tr;
    }

    async function guardarActividadFila(tr) {
        if (!proyectoEnEdicionID) return;

        const resultado = await guardarFilaActividadCore(tr);

        if (!resultado.ok) {
            return Swal.fire({ icon: 'warning', title: 'Revisa la actividad', text: resultado.error });
        }

        Swal.fire({ icon: 'success', title: 'Actividad guardada', timer: 1000, showConfirmButton: false });
    }

    // Logica compartida de guardado de una fila de actividad, sin Swal propio,
    // para poder reutilizarla tanto en el boton individual (check) como en el
    // guardado masivo que dispara el boton principal "Guardar" del proyecto.
    async function guardarFilaActividadCore(tr) {
        const leer = (campo) => tr.querySelector(`[data-campo="${campo}"]`)?.value || '';
        const leerChecked = (campo) => tr.querySelector(`[data-campo="${campo}"]`)?.checked || false;

        const nombreActividad = leer('NombreActividad').trim();
        const responsableID = leer('ResponsableID');

        if (!nombreActividad || !responsableID) {
            return { ok: false, error: 'Nombre y Responsable son obligatorios para guardar la actividad.' };
        }

        const payload = {
            CodigoWBS: leer('CodigoWBS').trim() || null,
            NombreActividad: nombreActividad,
            Descripcion: leer('Descripcion').trim() || null,
            FaseID: leer('FaseID') ? Number(leer('FaseID')) : null,
            ResponsableID: Number(responsableID),
            InicioPlan: leer('InicioPlan') || null,
            FinPlan: leer('FinPlan') || null,
            Estado: leer('Estado') || 'PENDIENTE',
            EsHito: leerChecked('EsHito') ? 1 : 0
        };

        const actividadID = Number(tr.dataset.actividadId) || 0;

        try {
            const resp = actividadID
                ? await axios.put(`${CF_API_BASE_URL}/actividades/${actividadID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/proyectos/${proyectoEnEdicionID}/actividades`, payload);

            if (!resp.data.success) {
                return { ok: false, error: resp.data.message || 'No se pudo guardar la actividad.' };
            }

            if (!actividadID && resp.data.data?.ActividadID) {
                tr.dataset.actividadId = resp.data.data.ActividadID;

                const celdaAcciones = tr.querySelector('td:last-child');
                if (celdaAcciones && !celdaAcciones.querySelector('[data-evidencias-actividad]')) {
                    celdaAcciones.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-cf-secondary btn-sm" title="Evidencias" data-evidencias-actividad="${resp.data.data.ActividadID}"><i class="bi bi-camera"></i></button>`);
                }
            }

            return { ok: true };

        } catch (error) {
            return { ok: false, error: error.response?.data?.message || 'No fue posible guardar la actividad.' };
        }
    }

    // Guarda todas las filas de Actividades de una sola vez (llamado por el
    // boton principal "Guardar" del proyecto). Antes solo el boton check por
    // fila guardaba actividades -- guardar la cabecera no las tocaba, por lo
    // que los cambios en la tabla se perdian si el usuario solo usaba el
    // boton "Guardar" de arriba.
    async function guardarTodasLasActividadesProyecto() {
        const filas = Array.from(document.querySelectorAll('#cfTablaActividadesProyecto tbody tr'));
        const errores = [];

        for (const tr of filas) {
            const resultado = await guardarFilaActividadCore(tr);
            if (!resultado.ok) {
                const nombre = tr.querySelector('[data-campo="NombreActividad"]')?.value || `fila ${filas.indexOf(tr) + 1}`;
                errores.push(`${nombre}: ${resultado.error}`);
            }
        }

        return errores;
    }

    async function eliminarActividadFila(tr) {
        const actividadID = Number(tr.dataset.actividadId) || 0;

        if (!actividadID) {
            tr.remove();
            return;
        }

        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar actividad?',
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

            tr.remove();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la actividad.' });
        }
    }

    // ---- Ver detalle (dashboard + indicadores + fases + encargados + facturación) ----
    async function verProyecto(proyectoID) {
        try {
            const [respDashboard, respIndicadores, respFases, respEncargados, respFacturacion] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/dashboard`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/indicadores`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/fases`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/encargados`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/facturacion`)
            ]);

            if (!respDashboard.data.success) {
                return Swal.fire({ icon: 'error', title: 'No encontrado', text: respDashboard.data.message || '' });
            }

            const dash = respDashboard.data.data;
            const indicadores = respIndicadores.data.success ? respIndicadores.data.data : {};
            const fases = respFases.data.success ? (respFases.data.data || []) : [];
            const encargados = respEncargados.data.success ? (respEncargados.data.data || []) : [];
            const facturacion = respFacturacion.data.success ? respFacturacion.data.data : {};

            Swal.fire({
                title: false,
                width: 900,
                showCloseButton: true,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                html: `<style>${CF_PROY_ESTILOS}</style>${construirHtmlDetalle(dash, indicadores, fases, encargados, facturacion)}`
            });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar el proyecto.' });
        }
    }

    function construirHtmlDetalle(dash, indicadores, fases, encargados, facturacion) {
        const estadoInfo = CF_ESTADOS_PROYECTO[dash.Estado] || { label: dash.Estado, color: '#6C757D' };

        const semaforoColor = {
            VERDE: '#10B981',
            AMARILLO: '#F59E0B',
            ROJO: '#EF4444'
        }[indicadores.Semaforo] || '#6C757D';

        const filasFases = fases.map((f) => `
            <tr>
                <td>${escapeHtml(f.CodigoFase || '')}</td>
                <td>${escapeHtml(f.NombreFase || '')}</td>
                <td class="text-center">${badgeEstado(f.Estado, '#0B1F47')}</td>
                <td class="text-end">${Number(f.PorcentajeAvance ?? 0).toFixed(0)}%</td>
                <td class="text-center">${formatearFecha(f.FechaInicio)}</td>
                <td class="text-center">${formatearFecha(f.FechaFin)}</td>
            </tr>
        `).join('') || '<tr><td colspan="6">Sin fases registradas.</td></tr>';

        const filasEncargados = encargados.map((e) => `
            <tr>
                <td>${escapeHtml(e.Nombre || '')}</td>
                <td>${escapeHtml(e.NombreTipoEncargado || '')}</td>
                <td class="text-center">${Number(e.Principal) === 1 ? '<i class="bi bi-star-fill text-warning"></i> Principal' : '—'}</td>
                <td class="text-center">${formatearFecha(e.FechaInicio)}</td>
            </tr>
        `).join('') || '<tr><td colspan="4">Sin encargados registrados.</td></tr>';

        return `
            <div class="cf-proy-doc">
                <div class="cf-proy-header">
                    <div class="cf-proy-titulo">${escapeHtml(dash.CodigoProyecto || '')} &mdash; ${escapeHtml(dash.NombreProyecto || '')}</div>
                    <div class="cf-proy-badge" style="color:${estadoInfo.color}">${escapeHtml(estadoInfo.label)}</div>
                </div>
                <div class="cf-proy-info">
                    <div><strong>Cliente:</strong> ${escapeHtml(dash.NombreCliente || '')}</div>
                    <div><strong>Responsable:</strong> ${escapeHtml(dash.ResponsablePrincipal || '—')}</div>
                    <div><strong>Inicio:</strong> ${formatearFecha(dash.FechaInicio)} &nbsp;&nbsp; <strong>Fin:</strong> ${formatearFecha(dash.FechaFin)}</div>
                </div>

                <div class="cf-proy-kpis">
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Avance</div><div class="cf-proy-kpi-valor">${Number(indicadores.PorcentajeAvance ?? dash.PorcentajeAvance ?? 0).toFixed(0)}%</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Semáforo</div><div class="cf-proy-kpi-valor" style="color:${semaforoColor}">${escapeHtml(indicadores.Semaforo || '—')}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Total Venta</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(indicadores.TotalVenta ?? dash.TotalVenta))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Costo Estimado</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(indicadores.CostoEstimado ?? dash.CostoEstimado))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Costo Real</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(dash.CostoReal))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Margen</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(indicadores.Margen ?? dash.Margen))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Rentabilidad</div><div class="cf-proy-kpi-valor">${Number(indicadores.Rentabilidad ?? dash.Rentabilidad ?? 0).toFixed(1)}%</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Facturado</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(facturacion.FacturacionAcumulada ?? dash.FacturacionAcumulada))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Cobrado</div><div class="cf-proy-kpi-valor">${quitarHtml(formatearMoneda(facturacion.CobranzaAcumulada ?? dash.CobranzaAcumulada))}</div></div>
                    <div class="cf-proy-kpi"><div class="cf-proy-kpi-label">Actividades Vencidas</div><div class="cf-proy-kpi-valor">${indicadores.ActividadesVencidas ?? 0}</div></div>
                </div>

                <div class="cf-proy-subtitulo">FASES</div>
                <table class="cf-proy-tabla">
                    <thead><tr><th>Código</th><th>Nombre</th><th class="text-center">Estado</th><th class="text-end">Avance</th><th class="text-center">Inicio</th><th class="text-center">Fin</th></tr></thead>
                    <tbody>${filasFases}</tbody>
                </table>

                <div class="cf-proy-subtitulo">ENCARGADOS</div>
                <table class="cf-proy-tabla">
                    <thead><tr><th>Nombre</th><th>Tipo</th><th class="text-center">Principal</th><th class="text-center">Desde</th></tr></thead>
                    <tbody>${filasEncargados}</tbody>
                </table>
            </div>
        `;
    }

    const CF_PROY_ESTILOS = `
        .cf-proy-doc { font-family: Arial, sans-serif; color: #1A2332; font-size: 0.85rem; text-align: left; }
        .cf-proy-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B1F47; padding-bottom: 8px; margin-bottom: 10px; }
        .cf-proy-titulo { font-size: 1.1rem; font-weight: 800; color: #0B1F47; }
        .cf-proy-badge { font-weight: 700; font-size: 0.85rem; }
        .cf-proy-info div { font-size: 0.82rem; margin-bottom: 3px; }
        .cf-proy-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
        .cf-proy-kpi { background: #F5F7FA; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 10px; }
        .cf-proy-kpi-label { font-size: 0.68rem; text-transform: uppercase; color: #6B7280; }
        .cf-proy-kpi-valor { font-size: 1rem; font-weight: 800; color: #0B1F47; }
        .cf-proy-subtitulo { font-weight: 800; color: #0B1F47; font-size: 0.78rem; margin: 16px 0 6px; text-transform: uppercase; }
        .cf-proy-tabla { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-bottom: 4px; }
        .cf-proy-tabla th, .cf-proy-tabla td { border: 1px solid #E5E7EB; padding: 5px 8px; text-align: left; }
        .cf-proy-tabla th { background: #0B1F47; color: #fff; font-size: 0.68rem; text-transform: uppercase; }
        .text-end { text-align: right; }
        .text-center { text-align: center; }
    `;

    // ---- Imprimir (PDF real generado en servidor con dompdf) ----
    async function imprimirProyecto(proyectoID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/pdf`, { responseType: 'blob' });
            const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            let mensaje = 'No fue posible generar el PDF.';
            if (error.response?.data instanceof Blob) {
                try {
                    const texto = await error.response.data.text();
                    mensaje = JSON.parse(texto)?.message || mensaje;
                } catch (_) { /* ignorar */ }
            }
            Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
    }

    // ---- Gantt (PRO-012/013/014: Hitos, Dependencias, ruta critica) ----
    // Consume GET /proyectos/{id}/gantt, que ya regresa Actividades con
    // InicioPlan/FinPlan/Avance/EsHito/RutaCriticaCalculada y Dependencias
    // (ActividadOrigenID -> ActividadDestinoID) -- el calculo de ruta
    // critica vive en ActividadService::calcularRutaCritica(), Web solo
    // lo pinta.
    async function verGantt(proyectoID) {
        document.getElementById('cfCardListado').style.display = 'none';
        document.getElementById('cfCardGantt').style.display = '';
        document.getElementById('cfGanttContenedor').innerHTML = '';
        document.getElementById('cfGanttFestivosLista').innerHTML = '';
        cambiarTabGantt('gantt');

        const proyecto = ultimosProyectos.find((p) => String(p.ProyectoID) === String(proyectoID));
        document.getElementById('cfGanttTitulo').textContent = 'Gantt' + (proyecto ? ' — ' + escapeHtml(proyecto.NombreProyecto || '') : '');
        proyectoGanttActualID = proyectoID;

        modoBotonPrincipal = 'actividad';
        const btnPrincipal = document.getElementById('btnNuevoProyecto');
        if (btnPrincipal) btnPrincipal.innerHTML = '<i class="bi bi-plus-lg"></i> Nueva Actividad';

        try {
            const resp = await axios.get(CF_API_BASE_URL + '/proyectos/' + proyectoID + '/gantt');

            if (!resp.data.success) {
                ocultarGantt();
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el Gantt', text: resp.data.message || '' });
            }

            const actividades = resp.data.data.Actividades || [];
            const dependencias = resp.data.data.Dependencias || [];
            actividadesGanttActuales = actividades;

            if (!actividades.length) {
                document.getElementById('cfGanttContenedor').innerHTML = '<p class="text-muted">Este proyecto todavia no tiene actividades con fechas para graficar.</p>';
                return;
            }

            const hoy = new Date().toISOString().substring(0, 10);

            const tareas = actividades
                .filter((a) => a.InicioPlan && a.FinPlan)
                .map((a) => {
                    const esHito = Number(a.EsHito) === 1;
                    const esCritica = Number(a.RutaCriticaCalculada) === 1;
                    const finPlan = String(a.FinPlan).substring(0, 10);

                    // Vencida: la fecha fin planeada ya paso y la actividad no
                    // esta terminada (ni cancelada). No aplica a hitos con
                    // fecha futura obviamente, pero un hito tambien puede vencer.
                    const esVencida = esActividadVencida(a, hoy);

                    // Terminada Vencida: se completo pero fuera de tiempo
                    // (FinReal > FinPlan). Distinto de "Vencida" -- esta ya
                    // no esta pendiente, solo se entrego tarde.
                    const esTerminadaVencida = !esVencida && esActividadTerminadaVencida(a);

                    const clase = esVencida
                        ? 'bar-vencida'
                        : (esTerminadaVencida
                            ? 'bar-terminada-vencida'
                            : (esHito ? 'bar-hito' : (esCritica ? 'bar-critica' : '')));

                    const dependenciasTarea = dependencias
                        .filter((d) => String(d.ActividadDestinoID) === String(a.ActividadID))
                        .map((d) => String(d.ActividadOrigenID))
                        .join(',');

                    const nombreTarea = (a.CodigoWBS ? a.CodigoWBS + ' - ' : '') + (a.NombreActividad || '');

                    return {
                        id: String(a.ActividadID),
                        name: esVencida ? ('⚠ ' + nombreTarea) : (esTerminadaVencida ? ('⏱ ' + nombreTarea) : nombreTarea),
                        start: String(a.InicioPlan).substring(0, 10),
                        // Frappe Gantt no soporta duracion 0 (hito): se fuerza el mismo dia visual.
                        end: esHito ? String(a.InicioPlan).substring(0, 10) : finPlan,
                        progress: Number(a.Avance || 0),
                        dependencies: dependenciasTarea,
                        custom_class: clase
                    };
                });

            if (!tareas.length) {
                document.getElementById('cfGanttContenedor').innerHTML = '<p class="text-muted">Las actividades de este proyecto todavia no tienen Inicio/Fin planeados.</p>';
                return;
            }

            tareasGanttActuales = tareas;

            const modoVista = document.getElementById('cfGanttModoVista').value || 'Week';

            // Dias festivos en el rango cubierto por las tareas (Configuracion
            // del cliente ya los tiene capturados en CF_CalendarioFestivo;
            // aqui solo se consultan para el rango visible del Gantt).
            const fechasInicio = tareas.map((t) => t.start).sort();
            const fechasFin = tareas.map((t) => t.end).sort();
            const desde = fechasInicio[0];
            const hasta = fechasFin[fechasFin.length - 1];

            let festivos = [];
            try {
                const respFestivos = await axios.get(`${CF_API_BASE_URL}/dias-festivos`, { params: { desde, hasta } });
                if (respFestivos.data.success) festivos = respFestivos.data.data || [];
            } catch (errorFestivos) {
                console.warn('No fue posible cargar dias festivos para el Gantt:', errorFestivos);
            }

            // Configuracion real de calendario laboral (Sabado/Domingo
            // laborables) capturada en CF_Empresa -- ya no se asume que
            // sabado/domingo siempre sean no laborables.
            let configCalendario = { SabadoLaboral: false, DomingoLaboral: false };
            try {
                const respConfig = await axios.get(`${CF_API_BASE_URL}/calendario-laboral`);
                if (respConfig.data.success) configCalendario = respConfig.data.data;
            } catch (errorConfig) {
                console.warn('No fue posible cargar la configuracion de calendario laboral:', errorConfig);
            }

            const esFinDeSemanaNoLaborable = (fecha) => {
                const dia = fecha.getDay(); // 0=Domingo, 6=Sabado
                if (dia === 6 && configCalendario.SabadoLaboral) return false;
                if (dia === 0 && configCalendario.DomingoLaboral) return false;
                return dia === 0 || dia === 6;
            };

            ganttInstancia = new Gantt('#cfGanttContenedor', tareas, {
                view_mode: modoVista,
                language: 'es',
                // Requerimiento: mostrar mas renglones de actividades sin
                // scrollear tanto -- barras y separacion mas compactas
                // (reducido de 22/12 a 16/6 para caber mas filas por pantalla).
                bar_height: 16,
                padding: 6,
                header_height: 45,
                // Requerimiento: reportar avance con DOBLE CLIC (no un solo clic,
                // que ya lo usa la libreria para abrir su popup nativo de info).
                // Se detecta comparando el ultimo clic sobre la misma tarea
                // dentro de una ventana corta de tiempo, usando el evento oficial
                // on_click de Frappe Gantt (no depende de estructura interna).
                on_click: (task) => {
                    const ahora = Date.now();
                    if (ultimoClicTareaID === task.id && (ahora - ultimoClicTimestamp) < 450) {
                        ultimoClicTareaID = null;
                        reportarAvanceDesdeGantt(task, proyectoID);
                    } else {
                        ultimoClicTareaID = task.id;
                        ultimoClicTimestamp = ahora;
                    }
                },
                // Requerimiento: al arrastrar una actividad a otra fecha, pedir
                // confirmacion antes de guardar el cambio (si cancela o falla,
                // se recarga el Gantt para revertir el arrastre visual).
                on_date_change: (task, start, end) => reprogramarActividadDesdeGantt(task, start, end, proyectoID),
                // Requerimiento: sabado/domingo solo se pintan como no laborables
                // si la Configuracion de la empresa asi lo indica -- antes la
                // libreria los marcaba siempre, sin importar la config real.
                is_weekend: esFinDeSemanaNoLaborable,
                holidays: {
                    '#9CA3AF33': 'weekend',
                    '#F59E0B33': festivos.map((f) => f.Fecha)
                },
                custom_popup_html: (task) => {
                    const original = actividades.find((a) => String(a.ActividadID) === task.id);
                    let extra = '';
                    const finPlan = original ? String(original.FinPlan).substring(0, 10) : null;
                    const esVencida = esActividadVencida(original, hoy);
                    const esTerminadaVencida = !esVencida && esActividadTerminadaVencida(original);

                    if (esVencida) extra += '<br><strong style="color:#B91C1C">⚠ VENCIDA — debía terminar el ' + finPlan + '</strong>';
                    if (esTerminadaVencida) extra += '<br><strong style="color:#B45309">⏱ Terminada fuera de tiempo — planeada para el ' + finPlan + ', terminó el ' + String(original.FinReal).substring(0, 10) + '</strong>';
                    if (original && Number(original.RutaCriticaCalculada) === 1) extra += '<br><span style="color:#EF4444">Ruta critica</span>';
                    if (original && Number(original.EsHito) === 1) extra += '<br><span style="color:#F59E0B">Hito</span>';
                    return '<div class="details-container" style="padding:6px 4px"><strong>' + escapeHtml(task.name) + '</strong><br>' + task.start + ' → ' + task.end + '<br>Avance: ' + task.progress + '%' + extra + '</div>';
                }
            });

            pintarListaFestivos(festivos);
            ajustarAlturaGantt();

        } catch (error) {
            ocultarGantt();
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar el Gantt.' });
        }
    }

    // Antes el contenedor del Gantt (".gantt-container" de Frappe) solo
    // tenia un max-height fijo (78vh), asi que con pocas actividades se veia
    // chico y dejaba una franja enorme de la pagina sin usar debajo. Ahora se
    // calcula el alto disponible real del viewport (desde donde empieza el
    // contenedor hasta el fondo de la pantalla, con un margen para el pie de
    // pagina) y se aplica como min-height Y max-height: siempre ocupa el
    // espacio visible, y solo hace scroll interno si de verdad hay demasiadas
    // filas para caber.
    function ajustarAlturaGantt() {
        const contenedor = document.querySelector('#cfGanttContenedor .gantt-container');
        if (!contenedor) return;

        const calcular = () => {
            const top = contenedor.getBoundingClientRect().top;
            const margenInferior = 90; // deja lugar para la lista de dias festivos + footer
            const alturaDisponible = Math.max(300, window.innerHeight - top - margenInferior);
            contenedor.style.minHeight = `${alturaDisponible}px`;
            contenedor.style.maxHeight = `${alturaDisponible}px`;
        };

        calcular();

        if (!window.__cfGanttResizeListener) {
            window.__cfGanttResizeListener = true;
            window.addEventListener('resize', () => {
                if (document.getElementById('cfCardGantt').style.display !== 'none') calcular();
            });
        }
    }

    // ---- Tabs Gantt / Dashboard ----
    function cambiarTabGantt(tab) {
        const esDashboard = tab === 'dashboard';

        document.getElementById('cfTabBtnGantt')?.classList.toggle('active', !esDashboard);
        document.getElementById('cfTabBtnDashboard')?.classList.toggle('active', esDashboard);
        document.getElementById('cfGanttTabPane').style.display = esDashboard ? 'none' : '';
        document.getElementById('cfProyDashboardTabPane').style.display = esDashboard ? '' : 'none';

        if (esDashboard) verDashboardProyecto(proyectoGanttActualID);
    }

    // Dashboard por proyecto (dentro del Gantt): mismo formato del reporte
    // Excel del cliente -- % finalizacion total (dona), dias completos vs
    // total (KPIs) y tareas por estado (barras). Reutiliza GET
    // /proyectos/{id}/dashboard (ya consumido en verProyecto()) para
    // PorcentajeAvance/FechaInicio/FechaFin, y las Actividades ya cargadas
    // por el Gantt (actividadesGanttActuales) para contar por Estado.
    async function verDashboardProyecto(proyectoID) {
        if (!proyectoID) return;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/dashboard`);
            if (!resp.data.success) return;

            const dash = resp.data.data;
            const avance = Number(dash.PorcentajeAvance ?? 0);

            pintarDonutAvanceProyecto(avance);
            pintarDiasProyecto(dash.FechaInicio, dash.FechaFin);
            pintarTareasPorEstado(actividadesGanttActuales);

        } catch (error) {
            console.error('Error al cargar el dashboard del proyecto:', error);
        }
    }

    function pintarDonutAvanceProyecto(avance) {
        const ctx = document.getElementById('cfChartAvanceProyecto');
        if (!ctx) return;

        if (chartAvanceProyecto) chartAvanceProyecto.destroy();

        chartAvanceProyecto = new Chart(ctx, {
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

        document.getElementById('cfChartAvanceProyectoLabel').textContent = `${avance.toFixed(2)}%`;
    }

    // "Dias completos vs total": dias transcurridos desde FechaInicio hasta
    // hoy (topado a FechaFin) vs total de dias programados del proyecto
    // (FechaFin - FechaInicio). Mismo criterio que el reporte Excel del
    // cliente ("Dias concluidos" / "Total numero dias programados").
    function pintarDiasProyecto(fechaInicio, fechaFin) {
        const elConcluidos = document.getElementById('cfDashDiasConcluidos');
        const elTotal = document.getElementById('cfDashDiasTotal');
        if (!elConcluidos || !elTotal) return;

        if (!fechaInicio || !fechaFin) {
            elConcluidos.textContent = '—';
            elTotal.textContent = '—';
            return;
        }

        const msPorDia = 1000 * 60 * 60 * 24;
        const inicio = new Date(String(fechaInicio).substring(0, 10));
        const fin = new Date(String(fechaFin).substring(0, 10));
        const hoy = new Date(new Date().toISOString().substring(0, 10));

        const totalDias = Math.max(0, Math.round((fin - inicio) / msPorDia));
        const diasConcluidos = Math.min(totalDias, Math.max(0, Math.round((hoy - inicio) / msPorDia)));

        elConcluidos.textContent = diasConcluidos;
        elTotal.textContent = totalDias;
    }

    function pintarTareasPorEstado(actividades) {
        const ctx = document.getElementById('cfChartTareasEstado');
        if (!ctx) return;

        if (chartTareasEstado) chartTareasEstado.destroy();

        const hoy = new Date().toISOString().substring(0, 10);

        // Mismas 5 categorias del reporte Excel del cliente, mas una nueva
        // "Terminada Vencida" (se completo pero fuera de tiempo, FinReal >
        // FinPlan) -- antes esas actividades se contaban igual que cualquier
        // otra en "Completo", sin distinguir si se cumplieron a tiempo.
        const conteos = { 'Planificado': 0, 'No iniciada - Vencida': 0, 'Comenzó - En proceso': 0, 'En proceso': 0, 'Completo': 0, 'Terminada Vencida': 0 };

        (actividades || []).forEach((a) => {
            const estado = String(a.Estado || '').toUpperCase();

            if (estado === 'COMPLETADA') {
                if (esActividadTerminadaVencida(a)) {
                    conteos['Terminada Vencida']++;
                } else {
                    conteos['Completo']++;
                }
            } else if (esActividadVencida(a, hoy)) {
                conteos['No iniciada - Vencida']++;
            } else if (estado === 'EN_PROCESO') {
                conteos['En proceso']++;
            } else if (estado === 'PENDIENTE') {
                conteos['Planificado']++;
            }
        });

        chartTareasEstado = new Chart(ctx, {
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
                // Espacio arriba para que el numero de la barra mas alta
                // (dibujado por el plugin cfEtiquetasBarra, encima de la
                // barra) no se recorte contra el borde del canvas.
                layout: { padding: { top: 24 } },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    datalabels: false
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#E5E7EB' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            },
            plugins: [{
                id: 'cfEtiquetasBarra',
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

    // ---- Reprogramar (arrastrar barra) con confirmacion ----
    // PUT /api/v1/actividades/{id}/reprogramar -> ActividadController::reprogramar()
    // (valida en backend que la nueva fecha no rompa dependencias FS/SS/FF/SF).
    // No se manda DuracionPlan: ActividadService::reprogramar() la recalcula
    // sola en dias habiles a partir de InicioPlan/FinPlan.
    //
    // Frappe Gantt dispara on_date_change en CADA dia que se cruza mientras
    // se arrastra la barra, no solo cuando se suelta. Aqui solo se guarda la
    // posicion mas reciente (reprogramacionPendiente); la confirmacion real
    // se dispara desde el listener global de mouseup/touchend de arriba,
    // que es el momento real en que se suelta la actividad.
    function reprogramarActividadDesdeGantt(task, start, end, proyectoID) {
        const original = actividadesGanttActuales.find((a) => String(a.ActividadID) === task.id);
        const terminada = original && (String(original.Estado || '').toUpperCase() === 'COMPLETADA' || Number(original.Avance || 0) >= 100);

        if (terminada) {
            reprogramacionPendiente = null;
            Swal.fire({
                icon: 'warning',
                title: 'Actividad ya terminada',
                text: 'No se puede mover una actividad terminada. Si en realidad no está terminada, repórtalo desde "Reportar avance" (doble clic) bajando el avance por debajo de 100% para reabrirla.'
            });
            verGantt(proyectoID);
            return;
        }

        reprogramacionPendiente = { task, start, end, proyectoID };
    }

    async function confirmarYGuardarReprogramacion(task, start, end, proyectoID) {
        const nuevoInicio = formatearFechaISO(start);
        const nuevoFin = formatearFechaISO(end);

        const confirmacion = await Swal.fire({
            icon: 'question',
            title: 'Confirmar reprogramacion',
            html: `Mover <strong>${escapeHtml(task.name)}</strong> a<br>${nuevoInicio} → ${nuevoFin}?`,
            showCancelButton: true,
            confirmButtonText: 'Guardar cambio',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) {
            // Revertir el arrastre visual (Frappe Gantt ya movio la barra).
            return verGantt(proyectoID);
        }

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${task.id}/reprogramar`, {
                InicioPlan: nuevoInicio,
                FinPlan: nuevoFin
            });

            if (!resp.data.success) {
                await Swal.fire({ icon: 'error', title: 'No se pudo reprogramar', text: resp.data.message || '' });
                return verGantt(proyectoID);
            }

            await Swal.fire({ icon: 'success', title: 'Fecha actualizada', timer: 1200, showConfirmButton: false });
            verGantt(proyectoID);

        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible reprogramar la actividad.' });
            verGantt(proyectoID);
        }
    }

    function formatearFechaISO(fecha) {
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        const anio = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    // ---- Reportar avance desde la barra del Gantt ----
    // PUT /api/v1/actividades/{id}/avance -> ActividadController::registrarAvance()
    // (mismo endpoint que ya aplica el bloqueo PRO-004 si el proyecto no tiene
    // OC/Contrato y recalcula Avance de Fase/Proyecto en backend).
    async function reportarAvanceDesdeGantt(task, proyectoID) {
        const { value: formValues } = await Swal.fire({
            title: 'Reportar avance',
            html: `
                <div class="text-start">
                    <div class="mb-2" style="font-size:0.85rem"><strong>${escapeHtml(task.name)}</strong></div>
                    <label class="form-label mb-1" style="font-size:0.85rem">Avance (%)</label>
                    <input id="swalAvance" type="number" min="0" max="100" class="form-control mb-2" value="${task.progress}">
                    <label class="form-label mb-1" style="font-size:0.85rem">Horas trabajadas</label>
                    <input id="swalHorasTrabajadas" type="number" min="0" step="0.5" class="form-control mb-2" value="0">
                    <label class="form-label mb-1" style="font-size:0.85rem">Comentario</label>
                    <textarea id="swalComentarioAvance" class="form-control" rows="2"></textarea>
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
                    Comentario: document.getElementById('swalComentarioAvance').value.trim() || null
                };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/actividades/${task.id}/avance`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo reportar el avance', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Avance registrado', timer: 1200, showConfirmButton: false });

            // Recarga el Gantt para reflejar el nuevo avance/estado (y que ya no
            // se marque como vencida si llego al 100%).
            verGantt(proyectoID);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible reportar el avance.' });
        }
    }

    // Respaldo en texto ademas del sombreado nativo del Gantt -- por si la
    // libreria cambia de version en el futuro, el dato de Configuracion >
    // Dias Festivos nunca se pierde visualmente. Usa un slot fijo del HTML
    // (no se inserta junto al contenedor del Gantt) para que nunca se mezcle
    // ni reemplace visualmente el titulo del Gantt.
    function pintarListaFestivos(festivos) {
        const slot = document.getElementById('cfGanttFestivosLista');
        if (!festivos.length) {
            slot.innerHTML = '';
            return;
        }

        const chips = festivos
            .map((f) => `<span class="cf-badge" style="background:#F59E0B22;color:#F59E0B;margin:2px">${escapeHtml(formatearFecha(f.Fecha))} — ${escapeHtml(f.Nombre || 'Festivo')}</span>`)
            .join(' ');

        slot.innerHTML = `<div class="form-text mb-1">Días festivos en este rango:</div>${chips}`;
    }

    function ocultarGantt() {
        document.getElementById('cfCardGantt').style.display = 'none';
        document.getElementById('cfCardListado').style.display = '';
        ganttInstancia = null;

        if (chartAvanceProyecto) { chartAvanceProyecto.destroy(); chartAvanceProyecto = null; }
        if (chartTareasEstado) { chartTareasEstado.destroy(); chartTareasEstado = null; }

        modoBotonPrincipal = 'proyecto';
        const btnPrincipal = document.getElementById('btnNuevoProyecto');
        if (btnPrincipal) btnPrincipal.innerHTML = '<i class="bi bi-plus-lg"></i> Nuevo Proyecto';
    }

    // ---- Nueva Actividad directo desde el Gantt (para el proyecto abierto) ----
    async function abrirNuevaActividadDesdeGantt() {
        if (!proyectoGanttActualID) return;

        const opcionesResponsable = Object.values(usuariosPorID)
            .map((u) => `<option value="${u.UsuarioID}">${escapeHtml(u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Nueva Actividad',
            width: 500,
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Nombre *</label>
                    <input id="swalNombreActividad" type="text" class="form-control mb-2">

                    <label class="form-label mb-1" style="font-size:0.85rem">Responsable *</label>
                    <select id="swalResponsableActividad" class="form-select mb-2">
                        <option value="">Selecciona un responsable</option>
                        ${opcionesResponsable}
                    </select>

                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Inicio</label>
                            <input id="swalInicioPlanActividad" type="date" class="form-control">
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Fin</label>
                            <input id="swalFinPlanActividad" type="date" class="form-control">
                        </div>
                    </div>

                    <label class="form-label mb-1" style="font-size:0.85rem">Descripción</label>
                    <textarea id="swalDescripcionActividad" class="form-control mb-2" rows="2"></textarea>

                    <div class="form-check">
                        <input id="swalEsHitoActividad" type="checkbox" class="form-check-input">
                        <label class="form-check-label" for="swalEsHitoActividad" style="font-size:0.85rem">Es un Hito (fecha única)</label>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear actividad',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nombre = document.getElementById('swalNombreActividad').value.trim();
                const responsableID = document.getElementById('swalResponsableActividad').value;

                if (!nombre || !responsableID) {
                    Swal.showValidationMessage('Nombre y Responsable son obligatorios.');
                    return false;
                }

                return {
                    NombreActividad: nombre,
                    ResponsableID: Number(responsableID),
                    InicioPlan: document.getElementById('swalInicioPlanActividad').value || null,
                    FinPlan: document.getElementById('swalFinPlanActividad').value || null,
                    Descripcion: document.getElementById('swalDescripcionActividad').value.trim() || null,
                    EsHito: document.getElementById('swalEsHitoActividad').checked ? 1 : 0,
                    Estado: 'PENDIENTE'
                };
            }
        });

        if (!formValues) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/proyectos/${proyectoGanttActualID}/actividades`, formValues);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo crear la actividad', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Actividad creada', timer: 1200, showConfirmButton: false });
            verGantt(proyectoGanttActualID);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible crear la actividad.' });
        }
    }

    // ---- Cambiar estado (respeta las transiciones válidas de ProyectoService::validarEstado) ----
    async function cambiarEstadoProyecto(proyectoID) {
        const proyecto = ultimosProyectos.find((p) => String(p.ProyectoID) === String(proyectoID));
        const estadoActual = proyecto?.Estado || 'NO_INICIADO';
        const siguientes = CF_ESTADOS_PROYECTO[estadoActual]?.siguientes || [];

        if (!siguientes.length) {
            return Swal.fire({ icon: 'info', title: 'Sin transiciones disponibles', text: 'Este proyecto ya está en un estado final.' });
        }

        const opciones = siguientes
            .map((codigo) => `<option value="${codigo}">${escapeHtml(CF_ESTADOS_PROYECTO[codigo].label)}</option>`)
            .join('');

        const { value: nuevoEstado } = await Swal.fire({
            title: 'Cambiar estado del proyecto',
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Estado actual: <strong>${escapeHtml(CF_ESTADOS_PROYECTO[estadoActual]?.label || estadoActual)}</strong></label>
                    <select id="swalEstadoProyecto" class="form-select">
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
                const valor = document.getElementById('swalEstadoProyecto').value;
                if (!valor) {
                    Swal.showValidationMessage('Selecciona un estado.');
                    return false;
                }
                return valor;
            }
        });

        if (!nuevoEstado) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/proyectos/${proyectoID}/estado`, {
                Estado: nuevoEstado
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cambiar el estado', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1200, showConfirmButton: false });
            cargarProyectos();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cambiar el estado.' });
        }
    }

    // ---- Registrar contrato ----
    async function registrarContrato(proyectoID) {
        const proyecto = ultimosProyectos.find((p) => String(p.ProyectoID) === String(proyectoID));

        const { value: numeroContrato } = await Swal.fire({
            title: 'Registrar Contrato',
            input: 'text',
            inputLabel: 'Número de contrato',
            inputValue: proyecto?.NumeroContrato || '',
            inputPlaceholder: 'Ej. CTO-2026-001',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValidator: (valor) => {
                if (!valor || !valor.trim()) return 'Captura el número de contrato.';
            }
        });

        if (!numeroContrato) return;

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/proyectos/${proyectoID}/contrato`, {
                NumeroContrato: numeroContrato.trim()
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo registrar el contrato', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Contrato registrado', timer: 1200, showConfirmButton: false });
            cargarProyectos();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible registrar el contrato.' });
        }
    }

    // ---- Dependencias (ACT-006), gestion desde el Gantt ----
    // GET    {CF_API_BASE_URL}/proyectos/{id}/dependencias   -> ActividadController::dependencias()
    // POST   {CF_API_BASE_URL}/actividades/dependencia       -> ActividadController::storeDependencia()
    // PUT    {CF_API_BASE_URL}/actividades/dependencia/{id}  -> ActividadController::updateDependencia()
    // DELETE {CF_API_BASE_URL}/actividades/dependencia/{id}  -> ActividadController::deleteDependencia()
    // El backend (ActividadService::crearDependencia/generaCicloDependencias)
    // ya valida mismo proyecto, ciclos y duplicados -- Web solo captura y
    // refresca el Gantt despues de cada cambio para que las flechas se
    // repinten con los datos reales.

    const CF_TIPOS_DEPENDENCIA = { FS: 'Fin a Inicio (FS)', SS: 'Inicio a Inicio (SS)', FF: 'Fin a Fin (FF)', SF: 'Inicio a Fin (SF)' };

    async function gestionarDependencias(proyectoID) {
        const contenedorId = 'cfDependenciasLista';

        const opcionesActividad = actividadesGanttActuales
            .slice()
            .sort((a, b) => String(a.CodigoWBS || '').localeCompare(String(b.CodigoWBS || ''), undefined, { numeric: true }))
            .map((a) => `<option value="${a.ActividadID}">${escapeHtml((a.CodigoWBS ? a.CodigoWBS + ' - ' : '') + (a.NombreActividad || ''))}</option>`)
            .join('');

        await Swal.fire({
            title: 'Dependencias entre actividades',
            width: 680,
            html: `
                <div class="text-start">
                    <div class="row g-2 mb-3">
                        <div class="col-md-4">
                            <label class="form-label mb-1" style="font-size:0.85rem">Origen (predecesora) *</label>
                            <select id="swalDependenciaOrigen" class="form-select form-select-sm">
                                <option value="">Selecciona...</option>
                                ${opcionesActividad}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label mb-1" style="font-size:0.85rem">Destino (sucesora) *</label>
                            <select id="swalDependenciaDestino" class="form-select form-select-sm">
                                <option value="">Selecciona...</option>
                                ${opcionesActividad}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label mb-1" style="font-size:0.85rem">Tipo</label>
                            <select id="swalDependenciaTipo" class="form-select form-select-sm">
                                ${Object.entries(CF_TIPOS_DEPENDENCIA).map(([codigo, label]) => `<option value="${codigo}">${escapeHtml(label)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label mb-1" style="font-size:0.85rem">Desfase (días)</label>
                            <input id="swalDependenciaDesfase" type="number" step="1" class="form-control form-control-sm" value="0">
                        </div>
                        <div class="col-12 text-end">
                            <button type="button" id="btnAgregarDependencia" class="btn btn-cf-primary btn-sm mt-1"><i class="bi bi-plus-lg"></i> Agregar dependencia</button>
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
                cargarListaDependencias(proyectoID, contenedorId);

                document.getElementById('btnAgregarDependencia').addEventListener('click', () => {
                    agregarDependencia(proyectoID, contenedorId);
                });
            },
            willClose: () => {
                // Si se creo/elimino alguna dependencia, refresca el Gantt para
                // que las flechas reflejen el estado real al cerrar el modal.
                if (proyectoGanttActualID) verGantt(proyectoGanttActualID);
            }
        });
    }

    function nombreActividadPorID(actividadID) {
        const actividad = actividadesGanttActuales.find((a) => String(a.ActividadID) === String(actividadID));
        if (!actividad) return `Actividad #${actividadID}`;
        return (actividad.CodigoWBS ? actividad.CodigoWBS + ' - ' : '') + (actividad.NombreActividad || `Actividad #${actividadID}`);
    }

    async function cargarListaDependencias(proyectoID, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/dependencias`);

            if (!resp.data.success) {
                contenedor.innerHTML = `<p class="text-danger text-center mb-0">${escapeHtml(resp.data.message || 'No se pudo cargar el listado.')}</p>`;
                return;
            }

            const dependencias = resp.data.data || [];

            if (dependencias.length === 0) {
                contenedor.innerHTML = '<p class="text-muted text-center mb-0">Sin dependencias registradas.</p>';
                return;
            }

            contenedor.innerHTML = dependencias.map((d) => `
                <div class="d-flex align-items-center justify-content-between border-bottom py-2">
                    <div style="min-width:0">
                        <div class="text-truncate" style="max-width:480px">
                            <strong>${escapeHtml(nombreActividadPorID(d.ActividadOrigenID))}</strong>
                            <i class="bi bi-arrow-right mx-1"></i>
                            <strong>${escapeHtml(nombreActividadPorID(d.ActividadDestinoID))}</strong>
                        </div>
                        <div class="text-muted" style="font-size:0.75rem">${escapeHtml(CF_TIPOS_DEPENDENCIA[d.TipoDependencia] || d.TipoDependencia)} · Desfase: ${Number(d.DiasDesfase || 0)} día(s)</div>
                    </div>
                    <button type="button" class="btn btn-cf-secondary btn-sm text-danger flex-shrink-0" title="Eliminar" data-eliminar-dependencia="${d.DependenciaID}"><i class="bi bi-trash"></i></button>
                </div>
            `).join('');

            contenedor.querySelectorAll('[data-eliminar-dependencia]').forEach((btn) => {
                btn.addEventListener('click', () => eliminarDependencia(btn.dataset.eliminarDependencia, proyectoID, contenedorId));
            });

        } catch (error) {
            contenedor.innerHTML = `<p class="text-danger text-center mb-0">${escapeHtml(error.response?.data?.message || 'Error al conectar con el servidor.')}</p>`;
        }
    }

    async function agregarDependencia(proyectoID, contenedorId) {
        const origenID = document.getElementById('swalDependenciaOrigen').value;
        const destinoID = document.getElementById('swalDependenciaDestino').value;
        const tipo = document.getElementById('swalDependenciaTipo').value;
        const desfase = Number(document.getElementById('swalDependenciaDesfase').value) || 0;

        if (!origenID || !destinoID) {
            return Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Selecciona la actividad Origen y Destino.' });
        }

        if (origenID === destinoID) {
            return Swal.fire({ icon: 'warning', title: 'Dependencia invalida', text: 'Una actividad no puede depender de si misma.' });
        }

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/actividades/dependencia`, {
                ActividadOrigenID: Number(origenID),
                ActividadDestinoID: Number(destinoID),
                TipoDependencia: tipo,
                DiasDesfase: desfase
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo crear la dependencia', text: resp.data.message || '' });
            }

            document.getElementById('swalDependenciaOrigen').value = '';
            document.getElementById('swalDependenciaDestino').value = '';
            document.getElementById('swalDependenciaDesfase').value = '0';

            cargarListaDependencias(proyectoID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible crear la dependencia.' });
        }
    }

    async function eliminarDependencia(dependenciaID, proyectoID, contenedorId) {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar dependencia?',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/actividades/dependencia/${dependenciaID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: resp.data.message || '' });
            }

            cargarListaDependencias(proyectoID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la dependencia.' });
        }
    }

    // ---- Evidencias por actividad (ACT-014), reutilizado desde la tabla
    // embebida de Actividades del formulario de Proyecto ----
    const CF_TIPOS_EVIDENCIA_PROY = ['FOTO', 'VIDEO', 'DOCUMENTO', 'OTRO'];
    const CF_MOMENTOS_EVIDENCIA_PROY = ['ANTES', 'DURANTE', 'DESPUES'];

    async function verEvidenciasActividadProyecto(actividadID) {
        const contenedorId = 'cfEvidenciasListaProy';

        await Swal.fire({
            title: 'Evidencias de la actividad',
            width: 620,
            html: `
                <div class="text-start">
                    <div class="row g-2 mb-3">
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Archivo *</label>
                            <input id="swalArchivoEvidenciaProy" type="file" class="form-control" accept="image/*,video/*,application/pdf,.docx,.xlsx">
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Tipo</label>
                            <select id="swalTipoEvidenciaProy" class="form-select">
                                ${CF_TIPOS_EVIDENCIA_PROY.map((t) => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-6">
                            <label class="form-label mb-1" style="font-size:0.85rem">Momento</label>
                            <select id="swalMomentoEvidenciaProy" class="form-select">
                                ${CF_MOMENTOS_EVIDENCIA_PROY.map((m) => `<option value="${m}" ${m === 'DURANTE' ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label mb-1" style="font-size:0.85rem">Descripción *</label>
                            <input id="swalDescripcionEvidenciaProy" type="text" class="form-control" placeholder="Ej. Vaciado de losa, avance visible">
                        </div>
                        <div class="col-12 text-end">
                            <button type="button" id="btnSubirEvidenciaProy" class="btn btn-cf-primary btn-sm mt-1"><i class="bi bi-upload"></i> Subir evidencia</button>
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
                cargarGaleriaEvidenciasProyecto(actividadID, contenedorId);

                document.getElementById('btnSubirEvidenciaProy').addEventListener('click', () => {
                    subirEvidenciaProyecto(actividadID, contenedorId);
                });
            }
        });
    }

    // ---- Eliminar ----
    async function eliminarProyecto(proyectoID) {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar proyecto?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/proyectos/${proyectoID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Proyecto eliminado', timer: 1200, showConfirmButton: false });
            cargarProyectos();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar el proyecto.' });
        }
    }

    async function cargarGaleriaEvidenciasProyecto(actividadID, contenedorId) {
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

            contenedor.innerHTML = evidencias.map((ev) => construirTarjetaEvidenciaProyecto(ev)).join('');

            contenedor.querySelectorAll('[data-ver-evidencia-proy]').forEach((btn) => {
                btn.addEventListener('click', () => verArchivoEvidenciaProyecto(btn.dataset.verEvidenciaProy, btn.dataset.mime, btn.dataset.nombre));
            });

            contenedor.querySelectorAll('[data-eliminar-evidencia-proy]').forEach((btn) => {
                btn.addEventListener('click', () => eliminarEvidenciaProyecto(btn.dataset.eliminarEvidenciaProy, actividadID, contenedorId));
            });

        } catch (error) {
            contenedor.innerHTML = `<p class="text-danger text-center mb-0">${escapeHtml(error.response?.data?.message || 'Error al conectar con el servidor.')}</p>`;
        }
    }

    function construirTarjetaEvidenciaProyecto(ev) {
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
                    <button type="button" class="btn btn-cf-secondary btn-sm" title="Ver" data-ver-evidencia-proy="${ev.EvidenciaID}" data-mime="${escapeAtributo(ev.MimeType || '')}" data-nombre="${escapeAtributo(ev.NombreOriginal || '')}"><i class="bi bi-eye"></i></button>
                    <button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar-evidencia-proy="${ev.EvidenciaID}"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
    }

    async function subirEvidenciaProyecto(actividadID, contenedorId) {
        const archivo = document.getElementById('swalArchivoEvidenciaProy').files[0];
        const descripcion = document.getElementById('swalDescripcionEvidenciaProy').value.trim();
        const tipoEvidencia = document.getElementById('swalTipoEvidenciaProy').value;
        const momento = document.getElementById('swalMomentoEvidenciaProy').value;

        if (!archivo) {
            return Swal.fire({ icon: 'warning', title: 'Falta el archivo', text: 'Selecciona un archivo para subir.' });
        }

        if (!descripcion) {
            return Swal.fire({ icon: 'warning', title: 'Falta la descripción', text: 'La descripción es obligatoria.' });
        }

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('ProyectoID', proyectoEnEdicionID);
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

            document.getElementById('swalArchivoEvidenciaProy').value = '';
            document.getElementById('swalDescripcionEvidenciaProy').value = '';

            cargarGaleriaEvidenciasProyecto(actividadID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible subir la evidencia.' });
        }
    }

    async function verArchivoEvidenciaProyecto(evidenciaID, mimeType, nombreOriginal) {
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

    async function eliminarEvidenciaProyecto(evidenciaID, actividadID, contenedorId) {
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

            cargarGaleriaEvidenciasProyecto(actividadID, contenedorId);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la evidencia.' });
        }
    }

    // ---- Helpers ----
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

    function quitarHtml(html) {
        return (html || '').replace(/<[^>]+>/g, '');
    }

    function formatearFecha(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function formatearMoneda(valor) {
        const numero = Number(valor || 0);
        return `<span class="cf-total-venta">${numero.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>`;
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
