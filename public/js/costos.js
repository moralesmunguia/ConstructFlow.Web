/**
 * costos.js
 * Ref: DEF-WEB-009 - Costos reales y presupuesto.
 */

document.addEventListener('DOMContentLoaded', () => {
    const permisos = CF_PERMISOS?.costos || {
        PuedeCrear: true,
        PuedeActualizar: true,
        PuedeEliminar: true
    };

    let tablaCostos = null;
    let proyectoID = null;
    let categorias = [];
    let actividades = [];
    let proveedores = [];
    let proyectosList = [];
    let proyectosFiltrados = [];
    let indiceActivoAutocomplete = -1;
    let costos = [];
    let resumenCategorias = [];
    let presupuesto = null;
    let detallePresupuesto = [];
    let modalCosto = null;
    let modalPresupuesto = null;
    let modalCostoEstimado = null;

    iniciar();

    async function iniciar() {
        modalCosto = new bootstrap.Modal(document.getElementById('modalCosto'));
        modalPresupuesto = new bootstrap.Modal(document.getElementById('modalPresupuesto'));
        modalCostoEstimado = new bootstrap.Modal(document.getElementById('modalCostoEstimado'));

        tablaCostos = cfInitDataTable('#cfTablaCostos', { order: [[0, 'desc']] });

        document.getElementById('btnRefrescarCostos')?.addEventListener('click', cargarProyectoActual);
        document.getElementById('btnRefrescarCaptura')?.addEventListener('click', cargarProyectoActual);
        document.getElementById('btnNuevoCosto')?.addEventListener('click', abrirNuevoCosto);
        document.getElementById('btnPresupuestoCostos')?.addEventListener('click', abrirPresupuesto);
        document.getElementById('btnEditarPresupuestoInline')?.addEventListener('click', abrirPresupuesto);
        document.getElementById('formCosto')?.addEventListener('submit', guardarCosto);
        document.getElementById('formPresupuesto')?.addEventListener('submit', guardarPresupuesto);
        document.getElementById('cfBuscarCostos')?.addEventListener('input', (e) => {
            tablaCostos?.search(e.target.value).draw();
        });
        document.getElementById('btnNuevoProveedor')?.addEventListener('click', abrirNuevoProveedor);
        document.getElementById('cardCostoEstimado')?.addEventListener('click', abrirDetalleCostoEstimado);
        inicializarAutocompleteProyectos();

        document.querySelector('#cfTablaCostos tbody')?.addEventListener('click', (e) => {
            const editar = e.target.closest('.btn-editar-costo');
            if (editar) return abrirEditarCosto(editar.dataset.id);

            const eliminar = e.target.closest('.btn-eliminar-costo');
            if (eliminar) return eliminarCosto(eliminar.dataset.id);
        });

        document.querySelector('#cfTablaPresupuesto tbody')?.addEventListener('input', calcularTotalPresupuesto);

        aplicarPermisos();
        await cargarProveedores();
        await cargarProyectos();
    }

    function aplicarPermisos() {
        const btnNuevoCosto = document.getElementById('btnNuevoCosto');
        const btnPresupuestoCostos = document.getElementById('btnPresupuestoCostos');
        const btnEditarPresupuestoInline = document.getElementById('btnEditarPresupuestoInline');

        if (btnNuevoCosto) btnNuevoCosto.style.display = permisos.PuedeCrear ? '' : 'none';
        if (btnPresupuestoCostos) btnPresupuestoCostos.style.display = permisos.PuedeActualizar ? '' : 'none';
        if (btnEditarPresupuestoInline) btnEditarPresupuestoInline.style.display = permisos.PuedeActualizar ? '' : 'none';
    }

    async function cargarProveedores() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proveedores`);
            if (resp.data.success) {
                proveedores = Array.isArray(resp.data.data) ? resp.data.data : [];
                llenarProveedoresCosto();
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        }
    }

    async function cargarProyectos() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos`);
            console.debug('cargarProyectos response:', resp?.data);
            if (!resp.data.success) {
                return notificarError('No se pudieron cargar los proyectos', resp.data.message || 'Respuesta inválida.');
            }

            proyectosList = extraerListaProyectos(resp.data)
                .slice()
                .sort((a, b) => Number(b.ProyectoID) - Number(a.ProyectoID));

            if (!proyectosList.length) {
                console.warn('No projects returned from API', proyectosList);
                const tbodyCaptura = document.querySelector('#cfTablaCapturaPorCategoria tbody');
                if (tbodyCaptura) {
                    tbodyCaptura.innerHTML = '<tr><td colspan="4" class="cf-empty-state">No hay proyectos disponibles.</td></tr>';
                }
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const inicial = params.get('proyecto_id') || params.get('proyectoID');
            const proyectoInicial = (inicial && proyectosList.find((p) => String(p.ProyectoID) === String(inicial)))
                || proyectosList[0];

            seleccionarProyecto(proyectoInicial);

            // Trigger carga del proyecto seleccionado
            await cambiarProyecto();
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            notificarError('Error al cargar proyectos', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function etiquetaProyecto(p) {
        const codigo = p.CodigoProyecto ?? p.Codigo ?? '';
        const nombre = p.NombreProyecto ?? p.Nombre ?? ('Proyecto #' + (p.ProyectoID || ''));
        return { codigo, nombre };
    }

    function seleccionarProyecto(p) {
        const input = document.getElementById('cfProyectoCostosInput');
        const hidden = document.getElementById('cfProyectoCostos');
        if (!input || !hidden) return;

        if (!p) {
            input.value = '';
            hidden.value = '';
            return;
        }

        const { codigo, nombre } = etiquetaProyecto(p);
        input.value = `${codigo} - ${nombre}`;
        hidden.value = p.ProyectoID;
    }

    function inicializarAutocompleteProyectos() {
        const input = document.getElementById('cfProyectoCostosInput');
        const lista = document.getElementById('cfProyectoCostosList');
        if (!input || !lista) return;

        input.addEventListener('focus', () => {
            input.select();
            renderAutocompleteProyectos(input.value);
        });

        input.addEventListener('input', () => {
            renderAutocompleteProyectos(input.value);
        });

        input.addEventListener('keydown', (e) => {
            if (!lista.classList.contains('show')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                indiceActivoAutocomplete = Math.min(indiceActivoAutocomplete + 1, proyectosFiltrados.length - 1);
                marcarActivoAutocomplete();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                indiceActivoAutocomplete = Math.max(indiceActivoAutocomplete - 1, 0);
                marcarActivoAutocomplete();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const elegido = proyectosFiltrados[indiceActivoAutocomplete] || proyectosFiltrados[0];
                if (elegido) confirmarSeleccionProyecto(elegido);
            } else if (e.key === 'Escape') {
                cerrarAutocompleteProyectos();
            }
        });

        document.addEventListener('click', (e) => {
            if (!document.getElementById('cfProyectoCostosWrap').contains(e.target)) {
                cerrarAutocompleteProyectos();
            }
        });
    }

    function renderAutocompleteProyectos(filtro) {
        const lista = document.getElementById('cfProyectoCostosList');
        if (!lista) return;

        const termino = (filtro || '').trim().toLowerCase();

        proyectosFiltrados = !termino
            ? proyectosList
            : proyectosList.filter((p) => {
                const { codigo, nombre } = etiquetaProyecto(p);
                return `${codigo} ${nombre}`.toLowerCase().includes(termino);
            });

        indiceActivoAutocomplete = -1;

        if (!proyectosFiltrados.length) {
            lista.innerHTML = '<div class="cf-autocomplete-empty">Sin resultados.</div>';
            lista.classList.add('show');
            return;
        }

        lista.innerHTML = proyectosFiltrados.slice(0, 50).map((p, idx) => {
            const { codigo, nombre } = etiquetaProyecto(p);
            return `<div class="cf-autocomplete-item" data-idx="${idx}"><span class="cf-autocomplete-codigo">${escapeHtml(codigo)}</span>${escapeHtml(nombre)}</div>`;
        }).join('');

        lista.querySelectorAll('.cf-autocomplete-item').forEach((item) => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = Number(item.dataset.idx);
                confirmarSeleccionProyecto(proyectosFiltrados[idx]);
            });
        });

        lista.classList.add('show');
    }

    function marcarActivoAutocomplete() {
        const lista = document.getElementById('cfProyectoCostosList');
        if (!lista) return;

        lista.querySelectorAll('.cf-autocomplete-item').forEach((item, idx) => {
            item.classList.toggle('active', idx === indiceActivoAutocomplete);
            if (idx === indiceActivoAutocomplete) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function cerrarAutocompleteProyectos() {
        document.getElementById('cfProyectoCostosList')?.classList.remove('show');
    }

    async function confirmarSeleccionProyecto(p) {
        cerrarAutocompleteProyectos();
        seleccionarProyecto(p);
        await cambiarProyecto();
    }

    async function cambiarProyecto() {
        proyectoID = document.getElementById('cfProyectoCostos')?.value || null;
        limpiarPantalla();

        if (!proyectoID) {
            return;
        }

        await cargarProyectoActual();
    }

    async function cargarProyectoActual() {
        if (!asegurarProyecto()) return;

        try {
            const [respCostos, respCategorias, respRentabilidad, respActividades] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/costos`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/costos/categorias`),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/rentabilidad/resumen`).catch(() => ({ data: { success: false } })),
                axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/actividades`).catch(() => ({ data: { success: false } }))
            ]);

            if (!respCostos.data.success) return notificarError('No se pudieron cargar los costos', respCostos.data.message);
            if (!respCategorias.data.success) return notificarError('No se pudieron cargar las categorias', respCategorias.data.message);

            const dataCostos = respCostos.data.data || {};
            costos = dataCostos.Costos || [];
            resumenCategorias = dataCostos.ResumenPorCategoria || [];
            const subtotalVenta = Number(dataCostos.SubtotalVenta ?? dataCostos.TotalVenta ?? 0);
            categorias = respCategorias.data.data?.Categorias || respCategorias.data.data || [];
            actividades = respActividades.data?.success ? extraerListaActividades(respActividades.data) : [];

            pintarCostos();
            pintarResumen(respRentabilidad.data?.data || {}, subtotalVenta, dataCostos);
            pintarCapturaPorCategoria();
            llenarCategoriasCosto();
            llenarActividadesCosto();
        } catch (error) {
            console.error('Error al cargar costos:', error);
            notificarError('Error al cargar costos', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function limpiarPantalla() {
        costos = [];
        resumenCategorias = [];
        presupuesto = null;
        detallePresupuesto = [];

        setText('cfCostoPresupuesto', '--');
        setText('cfCostoReal', '--');
        setText('cfCostoUtilidad', '--');
        setText('cfCostoRentabilidad', '--');
        setText('cfCostoRentabilidadMonto', '--');
        setText('cfCostoMovimientos', '--');
        setText('cfCostoDesviacion', '--');
        setText('cfCostoDesviacionPorcentaje', '--');
        setText('cfCostoEstimado', '--');
        setText('cfCostoConsumo', '--');

        tablaCostos?.clear().draw();
        const listaPresupuesto = document.getElementById('cfListaPresupuesto');
        if (listaPresupuesto) {
            listaPresupuesto.innerHTML = '<div class="cf-empty-state">Selecciona un proyecto.</div>';
        }
    }

    function extraerListaActividades(responseData) {
        const data = responseData?.data ?? responseData;

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.Actividades)) return data.Actividades;
        if (Array.isArray(data?.actividades)) return data.actividades;
        if (Array.isArray(data?.Items)) return data.Items;
        if (Array.isArray(data?.items)) return data.items;

        return [];
    }

    function extraerListaProyectos(responseData) {
        const data = responseData?.data ?? responseData;

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.Proyectos)) return data.Proyectos;
        if (Array.isArray(data?.proyectos)) return data.proyectos;
        if (Array.isArray(data?.Items)) return data.Items;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.rows)) return data.rows;

        return [];
    }

    function pintarResumen(rentabilidad, subtotalVenta = 0, dataCostos = {}) {
        const totalCosto = costos.reduce((sum, c) => sum + Number(c.Importe || 0), 0);

        const costoEstimado = Number(dataCostos.CostoEstimado ?? dataCostos.CostoEstimadoCotizacion ?? 0);
        const precioVenta = Number(dataCostos.PrecioVenta ?? dataCostos.TotalVenta ?? subtotalVenta ?? 0);

        const rentabilidadMontoFallback = precioVenta - totalCosto;
        const rentabilidadPorcentajeFallback = precioVenta > 0 ? ((rentabilidadMontoFallback / precioVenta) * 100) : 0;
        const desviacionMontoFallback = costoEstimado - totalCosto;
        const desviacionPorcentajeFallback = costoEstimado > 0 ? ((desviacionMontoFallback / costoEstimado) * 100) : 0;

        const rentabilidadPorcentaje = Number(
            rentabilidad?.RentabilidadPorcentaje
            ?? rentabilidad?.RentabilidadReal
            ?? dataCostos.RentabilidadPorcentaje
            ?? rentabilidad?.Rentabilidad
            ?? rentabilidadPorcentajeFallback
        );
        const rentabilidadMonto = Number(
            rentabilidad?.RentabilidadMonto
            ?? rentabilidad?.UtilidadReal
            ?? dataCostos.RentabilidadMonto
            ?? rentabilidadMontoFallback
        );
        const desviacionMonto = Number(
            rentabilidad?.DesviacionMonto
            ?? rentabilidad?.Desviacion
            ?? dataCostos.DesviacionMonto
            ?? desviacionMontoFallback
        );
        const desviacionPorcentaje = Number(
            rentabilidad?.DesviacionPorcentaje
            ?? dataCostos.DesviacionPorcentaje
            ?? desviacionPorcentajeFallback
        );

        setText('cfCostoPresupuesto', formatearMoneda(precioVenta));
        setText('cfCostoReal', formatearMoneda(totalCosto));
        setText('cfCostoUtilidad', `${Number(rentabilidadPorcentaje).toFixed(2)}%`);
        setText('cfCostoRentabilidadMonto', formatearMoneda(rentabilidadMonto));
        setText('cfCostoRentabilidad', formatearMoneda(rentabilidadMonto));
        setText('cfCostoMovimientos', costos.length);
        setText('cfCostoDesviacion', formatearMoneda(totalCosto));
        setText('cfCostoDesviacionPorcentaje', `${Number(desviacionPorcentaje).toFixed(2)}%`);
        setText('cfCostoEstimado', formatearMoneda(costoEstimado));
    }

    function pintarCostos() {
        tablaCostos.clear();
        costos.forEach((c) => tablaCostos.row.add([
            formatearFecha(c.FechaCosto),
            `<span class="cf-badge" style="background:#EEF2FF;color:#0B1F47">${escapeHtml(c.CodigoCategoria || '')}</span> ${escapeHtml(c.Categoria || '')}`,
            escapeHtml(c.Concepto || ''),
            escapeHtml(c.NombreActividad || c.CodigoWBS || '--'),
            escapeHtml(c.NombreProveedor || '--'),
            formatearMoneda(c.Importe),
            construirAcciones(c)
        ]));
        tablaCostos.draw();
    }

    function construirAcciones(costo) {
        const botones = [];
        if (permisos.PuedeActualizar) {
            botones.push(`<button type="button" class="cf-btn-icon btn-editar-costo" data-id="${costo.CostoID}" title="Editar"><i class="bi bi-pencil"></i></button>`);
        }
        if (permisos.PuedeEliminar) {
            botones.push(`<button type="button" class="cf-btn-icon btn-eliminar-costo" data-id="${costo.CostoID}" title="Eliminar"><i class="bi bi-trash"></i></button>`);
        }
        return `<div style="display:flex;gap:6px;justify-content:flex-end">${botones.join('') || '--'}</div>`;
    }

    function pintarCapturaPorCategoria() {
        const tbody = document.querySelector('#cfTablaCapturaPorCategoria tbody');
        tbody.innerHTML = '';

        if (!categorias.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="cf-empty-state">Sin categorias configuradas.</td></tr>';
            return;
        }

        categorias.forEach((cat) => {
            const real = resumenCategorias.find((r) => Number(r.CategoriaCostoID) === Number(cat.CategoriaCostoID));
            const importeReal = Number(real?.Importe || 0);

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><strong>${escapeHtml(cat.Codigo)}</strong></td>
                    <td>${escapeHtml(cat.Nombre)}</td>
                    <td>${formatearMoneda(importeReal)}</td>
                    <td class="text-end"><button type="button" class="cf-btn-icon btn-agregar-costo" data-cat-id="${cat.CategoriaCostoID}" title="Agregar costo"><i class="bi bi-plus-lg"></i></button></td>
                </tr>
            `);
        });

        // Attach handlers for add buttons
        document.querySelectorAll('.btn-agregar-costo').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const catId = e.currentTarget.dataset.catId;
                // prefill modal with category and open
                document.getElementById('formCosto').reset();
                document.getElementById('cfCostoID').value = '';
                document.getElementById('modalCostoTitulo').textContent = 'Nuevo costo';
                document.getElementById('cfCostoFecha').value = new Date().toISOString().slice(0, 10);
                llenarCategoriasCosto();
                llenarActividadesCosto();
                const select = document.getElementById('cfCostoCategoria');
                if (select) select.value = catId;
                // Prefill concepto with category name for convenience
                const cat = categorias.find((c) => String(c.CategoriaCostoID) === String(catId));
                if (cat) {
                    const conceptoEl = document.getElementById('cfCostoConcepto');
                    if (conceptoEl) conceptoEl.value = cat.Nombre || '';
                }
                if (modalCosto) {
                    modalCosto.show();
                } else {
                    console.error('modalCosto no inicializado');
                }
                // Focus importe after modal opens
                setTimeout(() => {
                    const importeEl = document.getElementById('cfCostoImporte');
                    if (importeEl) {
                        importeEl.value = '';
                        importeEl.focus();
                    }
                }, 250);
            });
        });
    }

    function pintarPresupuesto() {
        const contenedor = document.getElementById('cfListaPresupuesto');
        contenedor.innerHTML = '';

        if (!detallePresupuesto.length) {
            contenedor.innerHTML = '<div class="cf-empty-state">Sin presupuesto capturado.</div>';
            return;
        }

        detallePresupuesto.forEach((d) => {
            contenedor.insertAdjacentHTML('beforeend', `
                <div class="cf-presupuesto-item">
                    <div class="cf-presupuesto-code">${escapeHtml(d.CodigoCategoria || '')}</div>
                    <div>
                        <div class="cf-presupuesto-name">${escapeHtml(d.Categoria || d.Concepto || '')}</div>
                    </div>
                    <div class="cf-presupuesto-value">${formatearMoneda(d.Importe)}</div>
                </div>
            `);
        });
    }

    function abrirNuevoCosto() {
        if (!asegurarProyecto()) return;
        if (!permisos.PuedeCrear) return avisoPermiso();

        document.getElementById('modalCostoTitulo').textContent = 'Nuevo costo';
        document.getElementById('formCosto').reset();
        document.getElementById('cfCostoID').value = '';
        document.getElementById('cfCostoFecha').value = new Date().toISOString().slice(0, 10);
        llenarCategoriasCosto();
        llenarActividadesCosto();
        modalCosto.show();
    }

    function abrirEditarCosto(costoID) {
        if (!permisos.PuedeActualizar) return avisoPermiso();
        const costo = costos.find((c) => Number(c.CostoID) === Number(costoID));
        if (!costo) return;

        document.getElementById('modalCostoTitulo').textContent = 'Editar costo';
        document.getElementById('cfCostoID').value = costo.CostoID;
        document.getElementById('cfCostoCategoria').value = costo.CategoriaCostoID;
        document.getElementById('cfCostoFecha').value = costo.FechaCosto || new Date().toISOString().slice(0, 10);
        document.getElementById('cfCostoConcepto').value = costo.Concepto || '';
        document.getElementById('cfCostoImporte').value = Number(costo.Importe || 0).toFixed(2);
        llenarCategoriasCosto();
        llenarActividadesCosto();
        document.getElementById('cfCostoActividad').value = costo.ActividadID || '';
        document.getElementById('cfCostoProveedor').value = costo.ProveedorID || '';
        document.getElementById('cfCostoObservaciones').value = costo.Observaciones || '';
        modalCosto.show();
    }

    async function guardarCosto(e) {
        e.preventDefault();
        if (!asegurarProyecto()) return;

        const costoID = document.getElementById('cfCostoID').value;
        const payload = {
            CategoriaCostoID: Number(document.getElementById('cfCostoCategoria').value),
            FechaCosto: document.getElementById('cfCostoFecha').value,
            Concepto: document.getElementById('cfCostoConcepto').value.trim(),
            Importe: Number(document.getElementById('cfCostoImporte').value || 0),
            ActividadID: valorOpcionalNumero('cfCostoActividad'),
            ProveedorID: valorOpcionalNumero('cfCostoProveedor'),
            Observaciones: document.getElementById('cfCostoObservaciones').value.trim()
        };

        if (!payload.CategoriaCostoID || !payload.Concepto || payload.Importe <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Revisa el costo', text: 'Categoria, concepto e importe son obligatorios.' });
        }

        try {
            const resp = costoID
                ? await axios.put(`${CF_API_BASE_URL}/costos/${costoID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/proyectos/${proyectoID}/costos`, payload);

            if (!resp.data.success) {
                return notificarError('No se pudo guardar el costo', resp.data.message);
            }

            modalCosto.hide();
            await cargarProyectoActual();
            Swal.fire({ icon: 'success', title: 'Costo guardado', timer: 1200, showConfirmButton: false });
        } catch (error) {
            console.error('Error al guardar costo:', error);
            notificarError('Error al guardar costo', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    async function eliminarCosto(costoID) {
        if (!permisos.PuedeEliminar) return avisoPermiso();

        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: 'Eliminar costo',
            text: 'El costo se dara de baja del proyecto.',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/costos/${costoID}`);
            if (!resp.data.success) {
                return notificarError('No se pudo eliminar', resp.data.message);
            }

            await cargarProyectoActual();
            Swal.fire({ icon: 'success', title: 'Costo eliminado', timer: 1200, showConfirmButton: false });
        } catch (error) {
            console.error('Error al eliminar costo:', error);
            notificarError('Error al eliminar costo', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function abrirPresupuesto() {
        if (!asegurarProyecto()) return;
        if (!permisos.PuedeActualizar) return avisoPermiso();

        document.getElementById('cfPresupuestoNombre').value = presupuesto?.NombrePresupuesto || 'Presupuesto del proyecto';
        document.getElementById('cfPresupuestoVersion').value = presupuesto?.Version || '1.0';
        document.getElementById('cfPresupuestoEstado').value = presupuesto?.Estado || 'ACTIVO';

        const tbody = document.querySelector('#cfTablaPresupuesto tbody');
        tbody.innerHTML = '';

        categorias.forEach((cat) => {
            const actual = detallePresupuesto.find((d) => Number(d.CategoriaCostoID) === Number(cat.CategoriaCostoID));
            tbody.insertAdjacentHTML('beforeend', `
                <tr data-categoria-id="${cat.CategoriaCostoID}" data-codigo="${escapeAtributo(cat.Codigo)}">
                    <td><strong>${escapeHtml(cat.Codigo)}</strong></td>
                    <td>${escapeHtml(cat.Nombre)}</td>
                    <td><input type="text" class="cf-input cf-presupuesto-concepto" value="${escapeAtributo(actual?.Concepto || cat.Nombre)}"></td>
                    <td>
                        <div class="cf-input-prefix">
                            <span class="cf-prefix">$</span>
                            <input type="number" class="cf-input cf-presupuesto-importe" min="0" step="0.01" value="${Number(actual?.Importe || 0).toFixed(2)}">
                        </div>
                    </td>
                </tr>
            `);
        });

        calcularTotalPresupuesto();
        modalPresupuesto.show();
    }

    async function guardarPresupuesto(e) {
        e.preventDefault();
        if (!asegurarProyecto()) return;

        const detalle = Array.from(document.querySelectorAll('#cfTablaPresupuesto tbody tr')).map((tr) => ({
            CategoriaCostoID: Number(tr.dataset.categoriaId),
            CodigoCategoria: tr.dataset.codigo,
            Concepto: tr.querySelector('.cf-presupuesto-concepto').value.trim(),
            Importe: Number(tr.querySelector('.cf-presupuesto-importe').value || 0)
        }));

        const payload = {
            NombrePresupuesto: document.getElementById('cfPresupuestoNombre').value.trim() || 'Presupuesto del proyecto',
            Version: document.getElementById('cfPresupuestoVersion').value.trim() || '1.0',
            Estado: document.getElementById('cfPresupuestoEstado').value,
            Detalle: detalle
        };

        try {
            const resp = presupuesto
                ? await axios.put(`${CF_API_BASE_URL}/proyectos/${proyectoID}/presupuesto`, payload)
                : await axios.post(`${CF_API_BASE_URL}/proyectos/${proyectoID}/presupuesto`, payload);

            if (!resp.data.success) {
                return notificarError('No se pudo guardar el presupuesto', resp.data.message);
            }

            modalPresupuesto.hide();
            await cargarProyectoActual();
            Swal.fire({ icon: 'success', title: 'Presupuesto guardado', timer: 1200, showConfirmButton: false });
        } catch (error) {
            console.error('Error al guardar presupuesto:', error);
            notificarError('Error al guardar presupuesto', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    async function abrirDetalleCostoEstimado() {
        if (!asegurarProyecto()) return;

        const tbody = document.querySelector('#cfTablaCostoEstimado tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="cf-empty-state">Cargando...</td></tr>';
        setText('cfCostoEstimadoModalTotal', formatearMoneda(0));
        modalCostoEstimado.show();

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/costos/estimado-detalle`);
            if (!resp.data.success) {
                tbody.innerHTML = '<tr><td colspan="5" class="cf-empty-state">No se pudo cargar el desglose.</td></tr>';
                return;
            }

            const data = resp.data.data || {};
            const detalle = data.Detalle || [];

            if (!detalle.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="cf-empty-state">Este proyecto no tiene partidas de cotizacion con costo estimado.</td></tr>';
                setText('cfCostoEstimadoModalTotal', formatearMoneda(data.CostoEstimado || 0));
                return;
            }

            tbody.innerHTML = '';
            detalle.forEach((d, idx) => {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${d.NumeroPartida || (idx + 1)}</td>
                        <td>${escapeHtml(d.Descripcion || '')}</td>
                        <td class="text-end">${d.Cantidad != null ? Number(d.Cantidad).toLocaleString('es-MX') : '--'} ${escapeHtml(d.Unidad || '')}</td>
                        <td class="text-end">${formatearMoneda(d.PrecioUnitario)}</td>
                        <td class="text-end">${formatearMoneda(d.CostoEstimado)}</td>
                    </tr>
                `);
            });

            setText('cfCostoEstimadoModalTotal', formatearMoneda(data.CostoEstimado || 0));
        } catch (error) {
            console.error('Error al cargar desglose de costo estimado:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="cf-empty-state">No fue posible conectar con la API.</td></tr>';
        }
    }

    function llenarProveedoresCosto() {
        const select = document.getElementById('cfCostoProveedor');
        if (!select) return;

        const valorActual = select.value;
        select.innerHTML = '<option value="">Sin proveedor</option>';

        proveedores.forEach((p) => {
            select.insertAdjacentHTML('beforeend', `<option value="${p.ProveedorID}">${escapeHtml(p.NombreProveedor)}</option>`);
        });

        if (valorActual) select.value = valorActual;
    }

    async function abrirNuevoProveedor() {
        const { value: nombre } = await Swal.fire({
            title: 'Nuevo proveedor',
            input: 'text',
            inputLabel: 'Nombre del proveedor',
            inputPlaceholder: 'Ej. Materiales del Norte S.A. de C.V.',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValidator: (valor) => (!valor || !valor.trim()) ? 'El nombre es obligatorio.' : undefined,
            // El modal de costo (Bootstrap) atrapa el foco del documento; si
            // SweetAlert2 se monta en <body> (fuera del modal), Bootstrap le
            // regresa el foco al modal en cada tecla y no deja escribir.
            // Montarlo dentro del propio modal evita el conflicto.
            target: document.getElementById('modalCosto'),
            heightAuto: false
        });

        if (!nombre) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/proveedores`, { NombreProveedor: nombre.trim() });
            if (!resp.data.success) {
                return notificarError('No se pudo guardar el proveedor', resp.data.message);
            }

            await cargarProveedores();
            const nuevoID = resp.data.data?.ProveedorID;
            if (nuevoID) {
                document.getElementById('cfCostoProveedor').value = nuevoID;
            }
            Swal.fire({ icon: 'success', title: 'Proveedor guardado', timer: 1200, showConfirmButton: false });
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            notificarError('Error al guardar proveedor', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function llenarCategoriasCosto() {
        const select = document.getElementById('cfCostoCategoria');
        const valorActual = select.value;
        select.innerHTML = '<option value="">Selecciona categoria</option>';

        categorias.forEach((cat) => {
            select.insertAdjacentHTML('beforeend', `<option value="${cat.CategoriaCostoID}">${escapeHtml(cat.Codigo)} - ${escapeHtml(cat.Nombre)}</option>`);
        });

        if (valorActual) select.value = valorActual;
    }

    function llenarActividadesCosto() {
        const select = document.getElementById('cfCostoActividad');
        if (!select) return;

        const valorActual = select.value;
        select.innerHTML = '<option value="">Sin actividad</option>';

        actividades.forEach((act) => {
            const codigo = act.CodigoWBS ? `${act.CodigoWBS} - ` : '';
            select.insertAdjacentHTML('beforeend', `<option value="${act.ActividadID}">${escapeHtml(codigo)}${escapeHtml(act.NombreActividad || '')}</option>`);
        });

        if (valorActual) select.value = valorActual;
    }

    function calcularTotalPresupuesto() {
        const total = Array.from(document.querySelectorAll('.cf-presupuesto-importe'))
            .reduce((sum, input) => sum + Number(input.value || 0), 0);
        setText('cfPresupuestoTotal', formatearMoneda(total));
    }

    function totalDetallePresupuesto() {
        if (presupuesto?.TotalPresupuesto !== undefined && presupuesto?.TotalPresupuesto !== null) {
            return Number(presupuesto.TotalPresupuesto || 0);
        }
        return detallePresupuesto.reduce((sum, d) => sum + Number(d.Importe || 0), 0);
    }

    function asegurarProyecto() {
        if (proyectoID) return true;
        Swal.fire({ icon: 'info', title: 'Selecciona un proyecto', text: 'Elige un proyecto para consultar costos y presupuesto.' });
        return false;
    }

    function avisoPermiso() {
        Swal.fire({ icon: 'warning', title: 'Sin permiso', text: 'No tienes permiso para esta accion.' });
    }

    function notificarError(titulo, mensaje) {
        Swal.fire({ icon: 'error', title: titulo, text: mensaje || 'Ocurrio un error.' });
    }

    function valorOpcionalNumero(id) {
        const valor = document.getElementById(id).value;
        return valor ? Number(valor) : null;
    }

    function setText(id, valor) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }

    function formatearFecha(valor) {
        if (!valor) return '--';
        const fecha = new Date(`${valor}T00:00:00`);
        if (Number.isNaN(fecha.getTime())) return escapeHtml(valor);
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
