/**
 * reportes.js
 * Ref: DEF-WEB-021 (API Reportes) -- el API (ReporteController/Service)
 * es de solo lectura y siempre calcula en tiempo real; este archivo solo
 * consulta y exporta. Renderiza el resultado de forma GENÉRICA (sin
 * columnas fijas por tipo de reporte) para no romperse si el API agrega
 * o renombra campos -- mismo criterio que kpis.js::construirHtmlDetalle().
 *
 * GET  {CF_API_BASE_URL}/reportes/{tipo}       -> proyectos|costos|facturacion|rentabilidad|kpi
 * POST {CF_API_BASE_URL}/reportes/exportar/pdf   { TipoReporte, Filtros } -> blob
 * POST {CF_API_BASE_URL}/reportes/exportar/excel { TipoReporte, Filtros } -> blob
 * GET  {CF_API_BASE_URL}/reportes              -> bitácora/historial
 * GET  {CF_API_BASE_URL}/clientes              -> combo de filtro (solo Proyectos)
 */

document.addEventListener('DOMContentLoaded', () => {

    let ultimoTipoReporte = null;
    let ultimosFiltros = {};

    iniciar();

    document.getElementById('cfSelectTipoReporte')?.addEventListener('change', actualizarVisibilidadFiltros);
    document.getElementById('btnGenerarReporte')?.addEventListener('click', generarReporte);
    document.getElementById('btnExportarPdf')?.addEventListener('click', () => exportar('pdf'));
    document.getElementById('btnExportarExcel')?.addEventListener('click', () => exportar('excel'));
    document.getElementById('btnVerHistorialReportes')?.addEventListener('click', verHistorial);

    function iniciar() {
        actualizarVisibilidadFiltros();
        cargarClientes();
    }

    // ---- Filtros dependientes del tipo de reporte ----
    function actualizarVisibilidadFiltros() {
        const tipo = document.getElementById('cfSelectTipoReporte').value;
        const mostrar = tipo === 'proyectos';
        document.querySelectorAll('.cf-filtro-proyectos').forEach((el) => {
            el.style.display = mostrar ? '' : 'none';
        });
    }

    async function cargarClientes() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/clientes`);
            if (!resp.data.success) return;

            const select = document.getElementById('cfFiltroCliente');
            const filas = extraerLista(resp.data);
            filas.forEach((c) => {
                const opt = document.createElement('option');
                opt.value = c.ClienteID;
                opt.textContent = c.NombreComercial || c.RazonSocial || `Cliente #${c.ClienteID}`;
                select.appendChild(opt);
            });
        } catch (error) {
            console.error('Error al cargar clientes para el filtro:', error);
        }
    }

    // ---- Generar (consulta) ----
    function leerFiltros(tipo) {
        if (tipo !== 'proyectos') {
            return {};
        }

        const filtros = {
            cliente_id: valorOVacio('cfFiltroCliente'),
            estado: valorOVacio('cfFiltroEstado'),
            fecha_inicio_desde: valorOVacio('cfFiltroFechaDesde'),
            fecha_inicio_hasta: valorOVacio('cfFiltroFechaHasta'),
        };

        // Solo mandar lo que realmente se capturó.
        Object.keys(filtros).forEach((k) => { if (!filtros[k]) delete filtros[k]; });

        return filtros;
    }

    function valorOVacio(id) {
        return document.getElementById(id)?.value?.trim() || '';
    }

    async function generarReporte() {
        const tipo = document.getElementById('cfSelectTipoReporte').value;
        const filtros = leerFiltros(tipo);
        const contenedor = document.getElementById('cfReporteContenido');
        const titulo = document.getElementById('cfTituloResultado');

        titulo.textContent = etiquetaTipo(tipo);
        contenedor.innerHTML = '<p class="text-muted" style="padding:16px"><i class="bi bi-hourglass-split"></i> Generando...</p>';

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/reportes/${tipo}`, { params: filtros });
            if (!resp.data.success) {
                contenedor.innerHTML = '<p class="text-muted" style="padding:16px">No se pudo generar el reporte.</p>';
                return notificarError('No se pudo generar el reporte', resp.data.message);
            }

            ultimoTipoReporte = tipo;
            ultimosFiltros = filtros;

            contenedor.innerHTML = renderizarResultado(resp.data.data);

        } catch (error) {
            console.error('Error al generar el reporte:', error);
            contenedor.innerHTML = '<p class="text-muted" style="padding:16px">Ocurrió un error al generar el reporte.</p>';
            notificarError('Error al generar el reporte', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function etiquetaTipo(tipo) {
        const etiquetas = {
            proyectos: 'Reporte de Proyectos',
            costos: 'Reporte de Costos por Categoría',
            facturacion: 'Reporte de Facturación',
            rentabilidad: 'Reporte de Rentabilidad',
            kpi: 'Reporte Ejecutivo (KPI)',
        };
        return etiquetas[tipo] || 'Resultado';
    }

    // ---- Render genérico ----
    // Si es una lista de filas (array de objetos) pinta una sola tabla.
    // Si es un dashboard (objeto, posiblemente con sub-arrays) pinta un
    // bloque por sección -- mismo criterio que ReportePdfService en el API.
    function renderizarResultado(resultado) {
        if (!resultado || (Array.isArray(resultado) && resultado.length === 0)) {
            return '<p class="text-muted" style="padding:16px">Sin datos para los filtros aplicados.</p>';
        }

        if (esListaDeFilas(resultado)) {
            return tablaHtml(resultado);
        }

        let html = '';
        for (const [clave, valor] of Object.entries(resultado)) {
            if (Array.isArray(valor) && esListaDeFilas(valor)) {
                html += `<h3 class="cf-card-title" style="font-size:0.95rem;margin:16px 16px 8px">${escapeHtml(separarPalabras(clave))}</h3>`;
                html += tablaHtml(valor);
            } else if (valor && typeof valor === 'object') {
                html += `<h3 class="cf-card-title" style="font-size:0.95rem;margin:16px 16px 8px">${escapeHtml(separarPalabras(clave))}</h3>`;
                html += tablaClaveValorHtml(valor);
            }
        }

        return html || tablaClaveValorHtml(resultado);
    }

    function esListaDeFilas(valor) {
        return Array.isArray(valor) && valor.length > 0 && valor.every((f) => f && typeof f === 'object' && !Array.isArray(f));
    }

    function tablaHtml(filas) {
        if (filas.length === 0) {
            return '<p class="text-muted" style="padding:0 16px 16px">Sin registros.</p>';
        }

        const columnas = Object.keys(filas[0]);
        const thead = columnas.map((c) => `<th>${escapeHtml(separarPalabras(c))}</th>`).join('');
        const tbody = filas.map((fila) => {
            const celdas = columnas.map((c) => `<td>${formatearCelda(c, fila[c])}</td>`).join('');
            return `<tr>${celdas}</tr>`;
        }).join('');

        return `<div class="cf-table-wrap"><table class="cf-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
    }

    function tablaClaveValorHtml(datos) {
        const filas = Object.entries(datos)
            .filter(([, valor]) => valor === null || typeof valor !== 'object')
            .map(([clave, valor]) => `<tr>
                <td class="text-muted" style="padding:6px 8px;width:260px">${escapeHtml(separarPalabras(clave))}</td>
                <td style="padding:6px 8px"><strong>${formatearCelda(clave, valor)}</strong></td>
            </tr>`).join('');

        return `<div class="cf-table-wrap"><table class="cf-table"><tbody>${filas}</tbody></table></div>`;
    }

    function formatearCelda(clave, valor) {
        if (valor === null || valor === undefined || valor === '') return '—';

        const claveLower = String(clave).toLowerCase();

        if (/porcentaje|avance|margen|rentabilidad/.test(claveLower) && !isNaN(valor)) {
            return `${Number(valor).toFixed(2)}%`;
        }

        if (/costo|venta|monto|total|saldo|presupuesto|facturacion|cobranza|utilidad|importe/.test(claveLower) && !isNaN(valor)) {
            return Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
        }

        if (/fecha/.test(claveLower) && !isNaN(Date.parse(valor))) {
            const fecha = new Date(valor);
            return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
        }

        if (typeof valor === 'object') {
            return escapeHtml(JSON.stringify(valor));
        }

        return escapeHtml(String(valor));
    }

    function separarPalabras(clave) {
        return String(clave).replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    // ---- Exportar (PDF / Excel) ----
    async function exportar(formato) {
        const tipo = document.getElementById('cfSelectTipoReporte').value;
        const filtros = leerFiltros(tipo);

        try {
            const resp = await axios.post(
                `${CF_API_BASE_URL}/reportes/exportar/${formato}`,
                { TipoReporte: tipo, Filtros: filtros },
                { responseType: 'blob' }
            );

            const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
            const nombreArchivo = `Reporte_${tipo}.${extension}`;

            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;

            if (formato === 'pdf') {
                window.open(url, '_blank');
            } else {
                link.setAttribute('download', nombreArchivo);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

        } catch (error) {
            console.error(`Error al exportar a ${formato}:`, error);

            // El error puede venir como Blob (json) por responseType 'blob'.
            let mensaje = 'No fue posible generar el archivo.';
            if (error.response?.data instanceof Blob) {
                try {
                    const texto = await error.response.data.text();
                    mensaje = JSON.parse(texto)?.message || mensaje;
                } catch (e) { /* deja el mensaje por defecto */ }
            } else {
                mensaje = error.response?.data?.message || mensaje;
            }

            notificarError(`Error al exportar a ${formato.toUpperCase()}`, mensaje);
        }
    }

    // ---- Historial (bitácora) ----
    async function verHistorial() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/reportes`);
            if (!resp.data.success) {
                return notificarError('No se pudo cargar el historial', resp.data.message);
            }

            const filas = extraerLista(resp.data);

            if (filas.length === 0) {
                Swal.fire({ icon: 'info', title: 'Historial de reportes', text: 'Aún no se han generado reportes.' });
                return;
            }

            const filasHtml = filas.map((r) => `<tr>
                <td>${escapeHtml(etiquetaTipo(r.TipoReporte))}</td>
                <td>${escapeHtml(r.FormatoExportado || 'PANTALLA')}</td>
                <td>${formatearFechaHora(r.CreatedDate)}</td>
            </tr>`).join('');

            Swal.fire({
                title: 'Historial de reportes',
                width: 640,
                html: `<div class="text-start cf-table-wrap"><table class="cf-table">
                    <thead><tr><th>Tipo</th><th>Formato</th><th>Fecha</th></tr></thead>
                    <tbody>${filasHtml}</tbody>
                </table></div>`,
                confirmButtonText: 'Cerrar'
            });

        } catch (error) {
            console.error('Error al cargar el historial de reportes:', error);
            notificarError('Error al cargar el historial', error.response?.data?.message || 'No fue posible conectar con la API.');
        }
    }

    function formatearFechaHora(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
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

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }
});
