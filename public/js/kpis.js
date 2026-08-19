/**
 * kpis.js
 * Ref: DEF-WEB-017 (API KPI) -- el API (KpiConsolidadoController/Service)
 * ya está implementado y es de solo lectura; este archivo es la parte Web.
 *
 * GET {CF_API_BASE_URL}/kpi/dashboard      -> resumen consolidado (tarjetas)
 * GET {CF_API_BASE_URL}/proyectos          -> listado de proyectos (tabla)
 * GET {CF_API_BASE_URL}/kpi/proyectos/{id} -> detalle KPI de un proyecto (modal)
 * GET {CF_API_BASE_URL}/kpi/cartera?vencidas=1 -> cartera vencida (tabla)
 *
 * Formato estandar de respuesta: { success: bool, message: string, data: {} }
 */

document.addEventListener('DOMContentLoaded', () => {

    let tablaProyectos = null;
    let tablaCartera = null;

    iniciar();

    document.getElementById('btnRefrescarKpis')?.addEventListener('click', cargarTodo);
    document.getElementById('cfBuscarKpiProyectos')?.addEventListener('input', (e) => {
        tablaProyectos?.search(e.target.value).draw();
    });

    document.querySelector('#cfTablaKpiProyectos tbody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ver-kpi-proyecto]');
        if (btn) return abrirDetalleProyecto(btn.dataset.verKpiProyecto);
    });

    function iniciar() {
        tablaProyectos = cfInitDataTable('#cfTablaKpiProyectos', { order: [[0, 'asc']] });
        tablaCartera = cfInitDataTable('#cfTablaKpiCartera', { order: [[3, 'asc']], paging: false, searching: false, info: false });
        cargarTodo();
    }

    function cargarTodo() {
        cargarDashboard();
        cargarProyectos();
        cargarCartera();
    }

    // ---- Tarjetas consolidadas ----
    async function cargarDashboard() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/kpi/dashboard`);
            if (!resp.data.success) {
                return notificarError('No se pudo cargar el dashboard de KPI\'s', resp.data.message);
            }

            const data = resp.data.data || {};
            const proyectos = data.Proyectos || {};
            const costos = data.Costos || {};
            const rentabilidad = data.Rentabilidad || {};
            const facturacion = data.Facturacion || {};
            const actividades = data.Actividades || {};

            setText('cfKpiProyectosActivos', proyectos.ProyectosActivos ?? 0);
            setText('cfKpiMargenReal', formatearPorcentaje(rentabilidad.MargenReal));
            setText('cfKpiSaldoPendiente', formatearMoneda(facturacion.SaldoPendiente));
            setText('cfKpiCarteraVencida', formatearMoneda(facturacion.CarteraVencida));

            setText('cfKpiCostoReal', formatearMoneda(costos.CostoRealTotal));
            setText('cfKpiActividadesCompletadas', actividades.ActividadesCompletadas ?? 0);
            setText('cfKpiActividadesVencidas', actividades.ActividadesVencidas ?? 0);
            setText('cfKpiAvancePromedio', formatearPorcentaje(actividades.AvancePromedio));

        } catch (error) {
            console.error('Error al cargar dashboard de KPI\'s:', error);
            notificarError('Error al cargar el dashboard', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    // ---- Tabla de proyectos (listado real, con acceso al detalle KPI) ----
    async function cargarProyectos() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos`);
            if (!resp.data.success) {
                return notificarError('No se pudo cargar el listado de proyectos', resp.data.message);
            }

            const filas = extraerLista(resp.data);
            tablaProyectos.clear();
            filas.forEach((p) => tablaProyectos.row.add(construirFilaProyecto(p)));
            tablaProyectos.draw();

        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            notificarError('Error al cargar proyectos', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function construirFilaProyecto(p) {
        return [
            `<strong>${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</strong><br><span class="text-muted" style="font-size:0.78rem">${escapeHtml(p.CodigoProyecto || '')}</span>`,
            escapeHtml(p.NombreCliente || '—'),
            `<span class="cf-badge" style="background:#EEF2FF;color:#0B1F47">${escapeHtml(p.Estado || '—')}</span>`,
            formatearMoneda(p.PresupuestoActual),
            formatearMoneda(p.CostoReal),
            formatearPorcentaje(p.Rentabilidad),
            formatearPorcentaje(p.PorcentajeAvance),
            `<div class="text-end"><button type="button" class="cf-btn-icon" title="Ver KPI's" data-ver-kpi-proyecto="${p.ProyectoID}"><i class="bi bi-bar-chart-line"></i></button></div>`
        ];
    }

    // ---- Detalle KPI de un proyecto (modal) ----
    async function abrirDetalleProyecto(proyectoID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/kpi/proyectos/${proyectoID}`);
            if (!resp.data.success) {
                return notificarError('No se pudo cargar el detalle', resp.data.message);
            }

            const data = resp.data.data || {};

            Swal.fire({
                title: data.NombreProyecto || `Proyecto #${proyectoID}`,
                width: 560,
                html: construirHtmlDetalle(data),
                confirmButtonText: 'Cerrar'
            });

        } catch (error) {
            console.error('Error al cargar detalle KPI del proyecto:', error);
            notificarError('Error al cargar el detalle', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    // Renderiza el payload de forma genérica (clave: valor), dando formato
    // de moneda/porcentaje según el nombre del campo, sin asumir un shape
    // fijo -- así no se rompe si el dashboard del proyecto agrega/renombra campos.
    function construirHtmlDetalle(data) {
        const omitir = ['ProyectoID', 'NombreProyecto', 'CodigoProyecto'];
        const filas = Object.entries(data)
            .filter(([clave, valor]) => !omitir.includes(clave) && valor !== null && typeof valor !== 'object')
            .map(([clave, valor]) => {
                const etiqueta = separarPalabras(clave);
                return `<tr>
                    <td class="text-muted" style="padding:4px 8px 4px 0">${escapeHtml(etiqueta)}</td>
                    <td style="padding:4px 0;text-align:right"><strong>${formatearValorDetalle(clave, valor)}</strong></td>
                </tr>`;
            })
            .join('');

        return `<div class="text-start"><table style="width:100%;font-size:0.9rem">${filas}</table></div>`;
    }

    function formatearValorDetalle(clave, valor) {
        const claveLower = clave.toLowerCase();

        if (/porcentaje|avance|margen|rentabilidad/.test(claveLower) && !isNaN(valor)) {
            return formatearPorcentaje(valor);
        }

        if (/costo|venta|monto|total|saldo|presupuesto|facturacion|cobranza|utilidad/.test(claveLower) && !isNaN(valor)) {
            return formatearMoneda(valor);
        }

        return escapeHtml(String(valor));
    }

    function separarPalabras(clave) {
        return clave.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    // ---- Cartera vencida ----
    async function cargarCartera() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/kpi/cartera`, { params: { vencidas: 1 } });
            if (!resp.data.success) {
                return notificarError('No se pudo cargar la cartera', resp.data.message);
            }

            const filas = resp.data.data || [];
            tablaCartera.clear();
            filas.forEach((c) => tablaCartera.row.add([
                escapeHtml(c.Cliente || '—'),
                escapeHtml(c.Proyecto || '—'),
                escapeHtml(`${c.Serie || ''}${c.Folio || ''}` || '—'),
                formatearFecha(c.FechaVencimiento),
                formatearMoneda(c.Saldo)
            ]));
            tablaCartera.draw();

        } catch (error) {
            console.error('Error al cargar cartera vencida:', error);
            notificarError('Error al cargar la cartera', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    // ---- Helpers ----
    function extraerLista(responseData) {
        const data = responseData?.data ?? responseData;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.Items)) return data.Items;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.rows)) return data.rows;
        return [];
    }

    function notificarError(titulo, mensaje) {
        Swal.fire({ icon: 'error', title: titulo, text: mensaje || 'Ocurrió un error.' });
    }

    function setText(id, valor) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }

    function formatearPorcentaje(valor) {
        return `${Number(valor || 0).toFixed(2)}%`;
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
});
