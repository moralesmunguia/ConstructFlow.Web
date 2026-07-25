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

    const permisos = CF_PERMISOS['proyectos'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    if (!permisos.PuedeCrear) {
        document.getElementById('btnNuevoProyecto')?.remove();
    }

    poblarFiltroEstados();
    cargarCatalogos().then(cargarProyectos);

    document.getElementById('btnFiltrar')?.addEventListener('click', cargarProyectos);
    document.getElementById('btnNuevoProyecto')?.addEventListener('click', () => mostrarFormulario(null));
    document.getElementById('btnCancelarFormularioProyecto')?.addEventListener('click', ocultarFormulario);
    document.getElementById('btnGuardarProyecto')?.addEventListener('click', guardarProyecto);
    document.getElementById('btnAgregarActividadProyecto')?.addEventListener('click', () => agregarFilaActividadProyecto());

    document.getElementById('cfTablaActividadesProyecto')?.addEventListener('click', (e) => {
        const btnGuardarFila = e.target.closest('[data-guardar-actividad]');
        if (btnGuardarFila) return guardarActividadFila(btnGuardarFila.closest('tr'));

        const btnEliminarFila = e.target.closest('[data-eliminar-actividad]');
        if (btnEliminarFila) return eliminarActividadFila(btnEliminarFila.closest('tr'));
    });

    document.getElementById('tblProyectos')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('[data-ver]');
        if (btnVer) return verProyecto(btnVer.dataset.ver);

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

        const errores = [];

        if (!clienteID) {
            marcarInvalido('cfClienteID');
            errores.push('Selecciona un Cliente.');
        }
        if (!nombreProyecto) {
            marcarInvalido('cfNombreProyecto');
            errores.push('Captura el Nombre del Proyecto.');
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

            await Swal.fire({ icon: 'success', title: 'Proyecto guardado', timer: 1300, showConfirmButton: false });
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

        const opcionesEstado = CF_ESTADOS_ACTIVIDAD.map((codigo) => `
            <option value="${codigo}" ${(a.Estado || 'PENDIENTE') === codigo ? 'selected' : ''}>${escapeHtml(codigo)}</option>
        `).join('');

        const tr = document.createElement('tr');
        tr.dataset.actividadId = a.ActividadID || 0;
        tr.innerHTML = `
            <td><input type="text" class="form-control form-control-sm" data-campo="CodigoWBS" value="${escapeAtributo(a.CodigoWBS)}" placeholder="Auto" title="Se genera automáticamente si se deja vacío"></td>
            <td><input type="text" class="form-control form-control-sm" data-campo="NombreActividad" value="${escapeAtributo(a.NombreActividad)}"></td>
            <td><input type="text" class="form-control form-control-sm" data-campo="Descripcion" value="${escapeAtributo(a.Descripcion)}"></td>
            <td><select class="form-select form-select-sm" data-campo="ResponsableID"><option value="">--</option>${opcionesResponsable}</select></td>
            <td><input type="date" class="form-control form-control-sm" data-campo="InicioPlan" value="${(a.InicioPlan || '').substring(0, 10)}"></td>
            <td><input type="date" class="form-control form-control-sm" data-campo="FinPlan" value="${(a.FinPlan || '').substring(0, 10)}"></td>
            <td><select class="form-select form-select-sm" data-campo="Estado">${opcionesEstado}</select></td>
            <td class="text-end">
                <button type="button" class="btn btn-cf-secondary btn-sm" title="Guardar actividad" data-guardar-actividad><i class="bi bi-check-lg"></i></button>
                <button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar-actividad><i class="bi bi-trash"></i></button>
            </td>
        `;

        tbody.appendChild(tr);
        return tr;
    }

    async function guardarActividadFila(tr) {
        if (!proyectoEnEdicionID) return;

        const leer = (campo) => tr.querySelector(`[data-campo="${campo}"]`)?.value || '';

        const nombreActividad = leer('NombreActividad').trim();
        const responsableID = leer('ResponsableID');

        if (!nombreActividad || !responsableID) {
            return Swal.fire({
                icon: 'warning',
                title: 'Revisa la actividad',
                text: 'Nombre y Responsable son obligatorios para guardar la actividad.'
            });
        }

        const payload = {
            CodigoWBS: leer('CodigoWBS').trim() || null,
            NombreActividad: nombreActividad,
            Descripcion: leer('Descripcion').trim() || null,
            ResponsableID: Number(responsableID),
            InicioPlan: leer('InicioPlan') || null,
            FinPlan: leer('FinPlan') || null,
            Estado: leer('Estado') || 'PENDIENTE'
        };

        const actividadID = Number(tr.dataset.actividadId) || 0;

        try {
            const resp = actividadID
                ? await axios.put(`${CF_API_BASE_URL}/actividades/${actividadID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/proyectos/${proyectoEnEdicionID}/actividades`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar la actividad', text: resp.data.message || '' });
            }

            if (!actividadID && resp.data.data?.ActividadID) {
                tr.dataset.actividadId = resp.data.data.ActividadID;
            }

            Swal.fire({ icon: 'success', title: 'Actividad guardada', timer: 1000, showConfirmButton: false });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible guardar la actividad.' });
        }
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
