/**
 * cartera.js
 * Ref: DEF-WEB-006 (API Cartera) -- el API ya estaba 100% implementado
 * (CarteraController/CarteraService/CuentaCobrarRepository); este archivo
 * es la parte Web que faltaba: dashboard financiero + antiguedad + listado.
 *
 * GET {CF_API_BASE_URL}/cartera?cliente_id=&proyecto_id=&estado=&vencidas=  -> CarteraController::index()
 * GET {CF_API_BASE_URL}/cartera/antiguedad?cliente_id=&proyecto_id=         -> CarteraController::antiguedad()
 * GET {CF_API_BASE_URL}/dashboard/facturacion                              -> CarteraController::dashboardFacturacion()
 * GET {CF_API_BASE_URL}/clientes                                          -> ClienteController::index()
 * GET {CF_API_BASE_URL}/proyectos                                         -> ProyectoController::index()
 *
 * Formato estandar de respuesta: { success: bool, message: string, data: {} }
 *
 * Modulo de solo consulta (no hay alta/edicion/borrado de cartera en si
 * misma -- se recalcula automaticamente desde Facturas/Pagos, ver
 * CuentaCobrarRepository::upsert() en el Api).
 */

document.addEventListener('DOMContentLoaded', () => {

    const CF_COLOR_SEMAFORO = {
        Rojo:     '#EF4444',
        Amarillo: '#F59E0B',
        Verde:    '#10B981'
    };

    let dataTable = null;
    let clientesPorID = {};
    let proyectosPorID = {};

    cargarCatalogos().then(() => {
        cargarResumen();
        cargarAntiguedad();
        cargarCartera();
    });

    document.getElementById('btnRefrescarCartera')?.addEventListener('click', () => {
        cargarResumen();
        cargarAntiguedad();
        cargarCartera();
    });
    document.getElementById('btnGenerarAlertasCartera')?.addEventListener('click', generarAlertas);
    document.getElementById('btnFiltrarCartera')?.addEventListener('click', cargarCartera);
    document.getElementById('cfBuscarCartera')?.addEventListener('input', (e) => {
        dataTable?.search(e.target.value).draw();
    });
    document.getElementById('btnLimpiarFiltrosCartera')?.addEventListener('click', () => {
        document.getElementById('cfFiltroClienteCartera').value = '';
        document.getElementById('cfFiltroProyectoCartera').value = '';
        document.getElementById('cfFiltroEstadoCartera').value = '';
        document.getElementById('cfFiltroVencidasCartera').checked = false;
        cargarCartera();
    });

    // ---- Generar alertas automaticas (DEF-WEB-006, Alertas) ----
    // POST {CF_API_BASE_URL}/alertas/generar -> AlertaController::generar()
    // Corre las 5 reglas automaticas (incluye FACTURA_VENCIDA/FACTURA_POR_VENCER,
    // que son justo lo que se ve en esta pantalla); no crea duplicados si la
    // alerta ya existe (AlertaService::generarSiNoExiste).
    async function generarAlertas() {
        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/alertas/generar`);

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudieron generar las alertas',
                    text: resp.data.message || ''
                });
            }

            const total = resp.data.data?.TotalNuevas ?? 0;

            await Swal.fire({
                icon: 'success',
                title: total > 0 ? `${total} alerta(s) nueva(s) generada(s)` : 'Sin alertas nuevas',
                text: total > 0 ? 'Revísalas en el Centro de Alertas.' : 'No hay condiciones nuevas que generen alerta por ahora.',
                timer: total > 0 ? undefined : 1500,
                showConfirmButton: total > 0
            });

        } catch (error) {
            console.error('Error al generar alertas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al generar alertas',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    async function cargarCatalogos() {
        try {
            const [respClientes, respProyectos] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/clientes`),
                axios.get(`${CF_API_BASE_URL}/proyectos`)
            ]);

            clientesPorID = {};
            (respClientes.data.data || []).forEach((c) => { clientesPorID[c.ClienteID] = c; });
            const selectCliente = document.getElementById('cfFiltroClienteCartera');
            Object.values(clientesPorID).forEach((c) => {
                selectCliente.insertAdjacentHTML('beforeend', `<option value="${c.ClienteID}">${escapeHtml(c.NombreCliente || `Cliente #${c.ClienteID}`)}</option>`);
            });

            proyectosPorID = {};
            (respProyectos.data.data || []).forEach((p) => { proyectosPorID[p.ProyectoID] = p; });
            const selectProyecto = document.getElementById('cfFiltroProyectoCartera');
            Object.values(proyectosPorID).forEach((p) => {
                selectProyecto.insertAdjacentHTML('beforeend', `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`);
            });
        } catch (error) {
            console.error('Error al cargar catálogos de cartera:', error);
        }
    }

    // ---- Dashboard financiero (tarjetas de resumen) ----
    async function cargarResumen() {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/dashboard/facturacion`);
            if (!resp.data.success) return;

            const d = resp.data.data || {};

            document.getElementById('cfResumenFacturacionMes').textContent = formatearMoneda(d.FacturacionDelMes);
            document.getElementById('cfResumenCobranzaMes').textContent = formatearMoneda(d.CobranzaDelMes);
            document.getElementById('cfResumenSaldoPendiente').textContent = formatearMoneda(d.SaldoPendiente);
            document.getElementById('cfResumenCarteraVencida').textContent = formatearMoneda(d.CarteraVencida);
            document.getElementById('cfResumenIndiceRecuperacion').textContent = `${Number(d.IndiceRecuperacion || 0).toFixed(2)}%`;
            document.getElementById('cfResumenDiasPromedioCobro').textContent = Math.round(Number(d.DiasPromedioCobro || 0));

        } catch (error) {
            console.error('Error al cargar el dashboard de facturación:', error);
        }
    }

    // ---- Antiguedad de saldos ----
    async function cargarAntiguedad() {
        try {
            const params = {};
            const clienteID = document.getElementById('cfFiltroClienteCartera').value;
            const proyectoID = document.getElementById('cfFiltroProyectoCartera').value;
            if (clienteID) params.cliente_id = clienteID;
            if (proyectoID) params.proyecto_id = proyectoID;

            const resp = await axios.get(`${CF_API_BASE_URL}/cartera/antiguedad`, { params });
            if (!resp.data.success) return;

            const tbody = document.querySelector('#cfTablaAntiguedad tbody');
            tbody.innerHTML = '';

            const filas = resp.data.data || [];
            if (!filas.length) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Sin saldos vencidos.</td></tr>';
                return;
            }

            filas.forEach((f) => {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${escapeHtml(f.Rango || '—')}</td>
                        <td>${Number(f.Facturas || 0)}</td>
                        <td>${formatearMoneda(f.Saldo)}</td>
                    </tr>
                `);
            });

        } catch (error) {
            console.error('Error al cargar antigüedad de saldos:', error);
        }
    }

    // ---- Listado de cartera ----
    async function cargarCartera() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#cfTablaCartera', { order: [[8, 'asc']] });
        }

        const params = {};
        const clienteID = document.getElementById('cfFiltroClienteCartera').value;
        const proyectoID = document.getElementById('cfFiltroProyectoCartera').value;
        const estado = document.getElementById('cfFiltroEstadoCartera').value;
        const vencidas = document.getElementById('cfFiltroVencidasCartera').checked;

        if (clienteID) params.cliente_id = clienteID;
        if (proyectoID) params.proyecto_id = proyectoID;
        if (estado) params.estado = estado;
        if (vencidas) params.vencidas = 1;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/cartera`, { params });

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar la cartera',
                    text: resp.data.message || 'Ocurrió un error al consultar la cartera.'
                });
            }

            pintarFilas(resp.data.data || []);
            cargarAntiguedad();

        } catch (error) {
            console.error('Error al cargar cartera:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar cartera',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((f) => dataTable.row.add(construirFila(f)));
        dataTable.draw();
    }

    // ---- Ver cobros (pagos) de una factura ----
    document.querySelector('#cfTablaCartera tbody')?.addEventListener('click', (e) => {
        const btnCobros = e.target.closest('.btn-ver-cobros');
        if (btnCobros) return verCobros(btnCobros.dataset.facturaId, btnCobros.dataset.facturaNombre);

        const btnCfdi = e.target.closest('.btn-descarga-cfdi');
        if (btnCfdi) return descargarCFDI(btnCfdi.dataset.facturaId, btnCfdi.dataset.facturaNombre, btnCfdi.dataset.tipo);
    });

    // ---- Descargar XML/PDF (CFDI) de una factura ----
    // GET {CF_API_BASE_URL}/facturas/{id}/xml  -> FacturaController::descargaXML() (stream binario, requiere JWT por header)
    // GET {CF_API_BASE_URL}/facturas/{id}/pdf  -> FacturaController::descargaPDF() (idem)
    async function descargarCFDI(facturaID, facturaNombre, tipo) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/facturas/${facturaID}/${tipo}`, {
                responseType: 'blob'
            });

            const mime = tipo === 'xml' ? 'application/xml' : 'application/pdf';
            const blob = new Blob([resp.data], { type: mime });
            const url = URL.createObjectURL(blob);

            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `${facturaNombre}.${tipo}`;
            enlace.click();

            setTimeout(() => URL.revokeObjectURL(url), 60000);

        } catch (error) {
            console.error(`Error al descargar ${tipo.toUpperCase()}:`, error);
            Swal.fire({
                icon: 'error',
                title: `No se pudo descargar el ${tipo.toUpperCase()}`,
                text: 'Verifica tu conexión e intenta de nuevo.'
            });
        }
    }

    async function verCobros(facturaID, facturaNombre) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/facturas/${facturaID}/pagos`);

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'error',
                    title: 'No se pudieron cargar los cobros',
                    text: resp.data.message || 'Ocurrió un error al consultar los pagos de esta factura.'
                });
            }

            const pagos = resp.data.data || [];

            const filas = pagos.length
                ? pagos.map((p) => `
                    <tr>
                        <td style="white-space:nowrap">${formatearFecha(p.FechaPago)}</td>
                        <td style="white-space:nowrap">${formatearMoneda(p.Importe)}</td>
                        <td style="white-space:nowrap">${escapeHtml(p.MetodoPago || '—')}</td>
                        <td>${escapeHtml(p.Referencia || '—')}</td>
                        <td style="white-space:nowrap">${escapeHtml(p.Banco || '—')}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="text-center text-muted">Sin cobros registrados.</td></tr>';

            Swal.fire({
                title: `Cobros de la factura ${facturaNombre}`,
                width: 900,
                customClass: { popup: 'cf-swal-cobros' },
                html: `
                    <div class="cf-table-wrap" style="text-align:left">
                        <table class="cf-table" style="width:100%;font-size:1rem">
                            <thead>
                                <tr>
                                    <th style="white-space:nowrap">Fecha</th>
                                    <th style="white-space:nowrap">Importe</th>
                                    <th style="white-space:nowrap">Método</th>
                                    <th style="white-space:nowrap">Referencia</th>
                                    <th style="white-space:nowrap">Banco</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `,
                confirmButtonText: 'Cerrar'
            });

        } catch (error) {
            console.error('Error al cargar cobros:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar cobros',
                text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.'
            });
        }
    }

    function construirFila(f) {
        const colorSemaforo = CF_COLOR_SEMAFORO[f.Semaforo] || '#6B7280';
        const nombreFactura = `${f.Serie || ''}${f.Folio || ('#' + f.FacturaID)}`;

        return [
            `<span class="cf-badge-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorSemaforo}"></span>`,
            escapeHtml(nombreFactura),
            formatearFecha(f.FechaFactura),
            escapeHtml(f.Cliente || '—'),
            escapeHtml(f.Proyecto || '—'),
            escapeHtml(f.NumeroContrato || '—'),
            formatearMoneda(f.Importe),
            formatearMoneda(f.Saldo),
            formatearFecha(f.FechaVencimiento),
            Number(f.DiasVencidos || 0),
            `<span class="cf-badge" style="background:${colorSemaforo}22;color:${colorSemaforo}">${escapeHtml(f.Estado || '—')}</span>`,
            construirAcciones(f, nombreFactura)
        ];
    }

    function construirAcciones(f, nombreFactura) {
        const botones = [
            `<button type="button" class="cf-btn-icon btn-ver-cobros" data-factura-id="${f.FacturaID}" data-factura-nombre="${escapeAtributo(nombreFactura)}" title="Ver cobros"><i class="bi bi-cash-stack"></i></button>`
        ];

        if (f.XMLURL) {
            botones.push(`<button type="button" class="cf-btn-icon btn-descarga-cfdi" data-factura-id="${f.FacturaID}" data-factura-nombre="${escapeAtributo(nombreFactura)}" data-tipo="xml" title="Descargar XML"><i class="bi bi-filetype-xml"></i></button>`);
        }
        if (f.PDFURL) {
            botones.push(`<button type="button" class="cf-btn-icon btn-descarga-cfdi" data-factura-id="${f.FacturaID}" data-factura-nombre="${escapeAtributo(nombreFactura)}" data-tipo="pdf" title="Descargar PDF"><i class="bi bi-filetype-pdf"></i></button>`);
        }

        return `<div style="display:flex;gap:6px">${botones.join('')}</div>`;
    }

    // ---- Helpers (copia local, mismo patron que alertas.js/proyectos.js) ----
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
