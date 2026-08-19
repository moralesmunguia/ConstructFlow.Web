/**
 * versiones.js
 * Ref: DEF-WEB-011 (API Versiones).
 *
 * GET  {CF_API_BASE_URL}/versiones                -> CotizacionVersionController::indexAll()
 * GET  {CF_API_BASE_URL}/versiones/{id}/json       -> CotizacionVersionController::json()
 * POST {CF_API_BASE_URL}/versiones/{id}/restaurar  -> CotizacionVersionController::restaurar()
 * GET  {CF_API_BASE_URL}/cotizaciones              -> CotizacionController::index()
 *
 * Formato estandar de respuesta: { success: bool, message: string, data: {} }
 */

document.addEventListener('DOMContentLoaded', () => {

    let dataTable = null;
    let versionesCargadas = [];

    cargarCatalogoCotizaciones().then(cargarVersiones);

    document.getElementById('btnRefrescarVersiones')?.addEventListener('click', cargarVersiones);
    document.getElementById('cfFiltroCotizacionVersiones')?.addEventListener('change', cargarVersiones);
    document.getElementById('cfBuscarVersiones')?.addEventListener('input', (e) => {
        dataTable?.search(e.target.value).draw();
    });

    async function cargarCatalogoCotizaciones() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/cotizaciones`);
            if (!resp.data.success) return;

            const select = document.getElementById('cfFiltroCotizacionVersiones');
            (resp.data.data || []).forEach((c) => {
                select.insertAdjacentHTML('beforeend',
                    `<option value="${c.CotizacionID}">${escapeHtml(c.Folio || ('#' + c.CotizacionID))} - ${escapeHtml(c.DescripcionTrabajo || '')}</option>`
                );
            });
        } catch (error) {
            console.error('Error al cargar catálogo de cotizaciones:', error);
        }
    }

    async function cargarVersiones() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#tblVersiones', { order: [[0, 'desc']] });
        }

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/versiones`);

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudieron cargar las versiones',
                    text: resp.data.message || ''
                });
            }

            versionesCargadas = resp.data.data || [];

            const cotizacionID = document.getElementById('cfFiltroCotizacionVersiones').value;
            const filtradas = cotizacionID
                ? versionesCargadas.filter((v) => String(v.CotizacionID) === String(cotizacionID))
                : versionesCargadas;

            pintarFilas(filtradas);

        } catch (error) {
            console.error('Error al cargar versiones:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar versiones',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((v) => dataTable.row.add(construirFila(v)));
        dataTable.draw();
    }

    function construirFila(v) {
        return [
            escapeHtml(v.CotizacionFolio || `#${v.CotizacionID}`),
            escapeHtml(v.CotizacionDescripcion || '—'),
            `<span class="cf-badge" style="background:#EEF2FF;color:#0B1F47">${escapeHtml(v.Version || '—')}</span>`,
            formatearFecha(v.FechaVersion),
            formatearMoneda(v.TotalVentaVersion),
            escapeHtml(v.Comentarios || '—'),
            construirAcciones(v)
        ];
    }

    function construirAcciones(v) {
        return `
            <div style="display:flex;gap:6px;justify-content:flex-end">
                <button type="button" class="cf-btn-icon btn-ver-version" data-id="${v.CotizacionVersionID}" title="Ver detalle"><i class="bi bi-eye"></i></button>
                <button type="button" class="cf-btn-icon btn-restaurar-version" data-id="${v.CotizacionVersionID}" data-version="${escapeAtributo(v.Version)}" title="Restaurar esta versión"><i class="bi bi-arrow-counterclockwise"></i></button>
            </div>
        `;
    }

    document.querySelector('#tblVersiones tbody')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('.btn-ver-version');
        if (btnVer) return verDetalle(btnVer.dataset.id);

        const btnRestaurar = e.target.closest('.btn-restaurar-version');
        if (btnRestaurar) return restaurarVersion(btnRestaurar.dataset.id, btnRestaurar.dataset.version);
    });

    // Delegación también sobre la tabla ya inicializada por DataTables
    // (los nodos se reconstruyen en cada draw()).
    document.getElementById('tblVersiones')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('.btn-ver-version');
        if (btnVer) return verDetalle(btnVer.dataset.id);

        const btnRestaurar = e.target.closest('.btn-restaurar-version');
        if (btnRestaurar) return restaurarVersion(btnRestaurar.dataset.id, btnRestaurar.dataset.version);
    });

    async function verDetalle(cotizacionVersionID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/versiones/${cotizacionVersionID}/json`);

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar la versión',
                    text: resp.data.message || ''
                });
            }

            const v = resp.data.data;

            const filasDetalle = (v.Detalles || []).map((d) => `
                <tr>
                    <td>${escapeHtml(d.Descripcion || '—')}</td>
                    <td>${escapeHtml(d.Unidad || '—')}</td>
                    <td class="text-end">${Number(d.Cantidad || 0)}</td>
                    <td class="text-end">${formatearMoneda(d.PrecioUnitario)}</td>
                    <td class="text-end">${formatearMoneda(d.TotalVenta)}</td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin partidas.</td></tr>';

            const filasActividades = (v.Actividades || []).map((a) => `
                <tr>
                    <td>${escapeHtml(a.CodigoWBS || '—')}</td>
                    <td>${escapeHtml(a.NombreActividad || '—')}</td>
                    <td style="white-space:nowrap">${formatearFecha(a.InicioPlan)}</td>
                    <td style="white-space:nowrap">${formatearFecha(a.FinPlan)}</td>
                    <td class="text-end">${Number(a.DuracionPlan || 0)}</td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin actividades.</td></tr>';

            Swal.fire({
                title: `Versión ${v.Version || ''}`,
                width: 900,
                customClass: { popup: 'cf-swal-cobros' },
                html: `
                    <div style="text-align:left">
                        <p style="margin-bottom:4px"><b>Comentarios:</b> ${escapeHtml(v.Comentarios || '—')}</p>
                        <p style="margin-bottom:12px"><b>Total Venta:</b> ${formatearMoneda(v.TotalVentaVersion)}</p>

                        <h6>Partidas</h6>
                        <div class="cf-table-wrap" style="margin-bottom:16px">
                            <table class="cf-table" style="width:100%;font-size:0.9rem">
                                <thead><tr><th>Descripción</th><th>Unidad</th><th class="text-end">Cant.</th><th class="text-end">P. Unit.</th><th class="text-end">Total</th></tr></thead>
                                <tbody>${filasDetalle}</tbody>
                            </table>
                        </div>

                        <h6>Actividades</h6>
                        <div class="cf-table-wrap">
                            <table class="cf-table" style="width:100%;font-size:0.9rem">
                                <thead><tr><th>WBS</th><th>Nombre</th><th>Inicio</th><th>Fin</th><th class="text-end">Días</th></tr></thead>
                                <tbody>${filasActividades}</tbody>
                            </table>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Cerrar'
            });

        } catch (error) {
            console.error('Error al cargar el detalle de la versión:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar la versión',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    async function restaurarVersion(cotizacionVersionID, version) {
        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: `¿Restaurar la versión ${version}?`,
            text: 'Se reemplazarán las partidas y actividades actuales de la cotización por las de esta versión. Se creará una versión nueva para dejar constancia (no se pierde el historial).',
            showCancelButton: true,
            confirmButtonText: 'Sí, restaurar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/versiones/${cotizacionVersionID}/restaurar`);

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudo restaurar la versión',
                    text: resp.data.message || ''
                });
            }

            await Swal.fire({
                icon: 'success',
                title: 'Versión restaurada',
                text: 'Se creó una nueva versión con el contenido restaurado.',
                timer: 2000,
                showConfirmButton: false
            });

            cargarVersiones();

        } catch (error) {
            console.error('Error al restaurar la versión:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al restaurar',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    // ---- Helpers (copia local, mismo patrón que cartera.js/proyectos.js) ----
    function formatearMoneda(valor) {
        const numero = Number(valor || 0);
        return numero.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
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
