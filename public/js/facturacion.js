/**
 * facturacion.js
 * Pantalla FAC-001: listado, registro, modificacion, CFDI y pagos.
 */

document.addEventListener('DOMContentLoaded', () => {
    const permisosFacturacion = CF_PERMISOS['facturacion'] || {
        PuedeCrear: true,
        PuedeConsultar: true,
        PuedeActualizar: true,
        PuedeEliminar: true
    };

    let dataTable = null;
    let facturas = [];
    let clientesPorID = {};
    let proyectosPorID = {};

    const modalFactura = new bootstrap.Modal(document.getElementById('modalFactura'));
    const modalPago = new bootstrap.Modal(document.getElementById('modalPago'));
    const modalCfdi = new bootstrap.Modal(document.getElementById('modalCfdi'));

    if (!permisosFacturacion.PuedeCrear) {
        document.getElementById('btnNuevaFactura')?.remove();
    }

    cargarCatalogos().then(cargarFacturas);

    document.getElementById('btnNuevaFactura')?.addEventListener('click', () => abrirFactura());
    document.getElementById('btnRefrescarFacturas')?.addEventListener('click', cargarFacturas);
    document.getElementById('btnCartaCobranza')?.addEventListener('click', generarCartaCobranza);
    document.getElementById('btnFiltrarFacturas')?.addEventListener('click', cargarFacturas);
    document.getElementById('btnLimpiarFacturas')?.addEventListener('click', limpiarFiltros);
    document.getElementById('facBuscar')?.addEventListener('input', (e) => dataTable?.search(e.target.value).draw());
    document.getElementById('facFiltroCliente')?.addEventListener('change', () => {
        poblarSelectProyectos('facFiltroProyecto', document.getElementById('facFiltroCliente').value, true);
    });
    document.getElementById('formFactura')?.addEventListener('submit', guardarFactura);
    document.getElementById('formPago')?.addEventListener('submit', guardarPago);
    document.getElementById('formCfdi')?.addEventListener('submit', guardarCfdi);
    document.getElementById('Subtotal')?.addEventListener('input', recalcularTotal);
    document.getElementById('IVA')?.addEventListener('input', recalcularTotal);
    document.getElementById('ClienteID')?.addEventListener('change', () => poblarSelectProyectos('ProyectoID', document.getElementById('ClienteID').value));

    document.querySelector('#tblFacturas tbody')?.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-item')) e.preventDefault();

        const btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) return abrirFactura(btnEditar.dataset.editar);

        const btnCancelar = e.target.closest('[data-cancelar]');
        if (btnCancelar) return cancelarFactura(btnCancelar.dataset.cancelar);

        const btnPago = e.target.closest('[data-pago]');
        if (btnPago) return abrirPago(btnPago.dataset.pago);

        const btnPagos = e.target.closest('[data-pagos]');
        if (btnPagos) return verPagos(btnPagos.dataset.pagos);

        const btnCfdi = e.target.closest('[data-cfdi]');
        if (btnCfdi) return abrirCfdi(btnCfdi.dataset.cfdi);

        const btnDescarga = e.target.closest('[data-descargar]');
        if (btnDescarga) return descargarCfdi(btnDescarga.dataset.descargar, btnDescarga.dataset.tipo);
    });

    async function cargarCatalogos() {
        try {
            const [respClientes, respProyectos] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/clientes`),
                axios.get(`${CF_API_BASE_URL}/proyectos`)
            ]);

            clientesPorID = indexarPorID(respClientes.data.data || [], 'ClienteID');
            proyectosPorID = indexarPorID(respProyectos.data.data || [], 'ProyectoID');

            poblarSelectClientes('facFiltroCliente', true);
            poblarSelectClientes('ClienteID', false);
            poblarSelectProyectos('facFiltroProyecto', null, true);
            poblarSelectProyectos('ProyectoID', null, false);
        } catch (error) {
            console.error('Error al cargar catalogos de facturacion:', error);
            Swal.fire({ icon: 'error', title: 'No se cargaron los catalogos', text: 'Revisa la conexion con el API.' });
        }
    }

    async function cargarFacturas() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#tblFacturas', { order: [[1, 'desc']] });
        }

        const params = {};
        const clienteID = valor('facFiltroCliente');
        const proyectoID = valor('facFiltroProyecto');
        const estado = valor('facFiltroEstado');
        const fechaDesde = valor('facFiltroDesde');
        const fechaHasta = valor('facFiltroHasta');

        if (clienteID) params.cliente_id = clienteID;
        if (proyectoID) params.proyecto_id = proyectoID;
        if (estado) params.estado = estado;
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/facturas`, { params });
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar facturacion', text: resp.data.message || '' });
            }

            facturas = resp.data.data || [];
            pintarFilas(facturas);
            pintarResumen(facturas);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
            Swal.fire({ icon: 'error', title: 'Error al cargar facturas', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((factura) => dataTable.row.add(construirFila(factura)));
        dataTable.draw();
    }

    function construirFila(f) {
        const cliente = clientesPorID[f.ClienteID];
        const proyecto = proyectosPorID[f.ProyectoID];
        const facturaNombre = nombreFactura(f);

        return [
            `<strong>${escapeHtml(facturaNombre)}</strong>`,
            formatearFecha(f.FechaFactura),
            escapeHtml(cliente?.NombreCliente || `Cliente #${f.ClienteID}`),
            escapeHtml(proyecto?.NombreProyecto || `Proyecto #${f.ProyectoID}`),
            formatearMoneda(f.Subtotal),
            formatearMoneda(f.IVA),
            `<strong>${formatearMoneda(f.Total)}</strong>`,
            formatearMoneda(f.Saldo),
            formatearFecha(f.FechaVencimiento),
            badgeEstado(f.Estado),
            construirCfdi(f),
            construirAcciones(f)
        ];
    }

    function construirAcciones(f) {
        const deshabilitada = ['Pagada', 'Cancelada'].includes(f.Estado);
        const items = [];

        if (permisosFacturacion.PuedeActualizar && !deshabilitada) {
            items.push(`<li><a class="dropdown-item" href="#" data-editar="${f.FacturaID}"><i class="bi bi-pencil me-2" style="color:#3B82F6"></i>Editar</a></li>`);
        }

        if (permisosFacturacion.PuedeCrear && !deshabilitada) {
            items.push(`<li><a class="dropdown-item" href="#" data-pago="${f.FacturaID}"><i class="bi bi-cash-stack me-2" style="color:#047857"></i>Registrar pago</a></li>`);
        }

        items.push(`<li><a class="dropdown-item" href="#" data-pagos="${f.FacturaID}"><i class="bi bi-list-ul me-2" style="color:#0B69D4"></i>Ver pagos</a></li>`);
        items.push(`<li><a class="dropdown-item" href="#" data-cfdi="${f.FacturaID}"><i class="bi bi-file-earmark-arrow-up me-2" style="color:#B45309"></i>Cargar CFDI</a></li>`);

        if (permisosFacturacion.PuedeEliminar && !deshabilitada) {
            items.push(`<li><hr class="dropdown-divider"></li>`);
            items.push(`<li><a class="dropdown-item text-danger" href="#" data-cancelar="${f.FacturaID}"><i class="bi bi-ban me-2"></i>Cancelar</a></li>`);
        }

        if (!items.length) {
            return `<span class="text-muted" style="font-size:.8rem"><i class="bi bi-lock"></i></span>`;
        }

        return `
            <div class="dropdown">
                <button class="btn btn-sm" type="button" data-bs-toggle="dropdown" style="width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;color:#94A3B8">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    ${items.join('')}
                </ul>
            </div>`;
    }

    function construirCfdi(f) {
        const botones = [];
        if (f.XMLURL) botones.push(`<button type="button" class="cf-btn-icon" data-descargar="${f.FacturaID}" data-tipo="xml" title="Descargar XML"><i class="bi bi-filetype-xml"></i></button>`);
        if (f.PDFURL) botones.push(`<button type="button" class="cf-btn-icon" data-descargar="${f.FacturaID}" data-tipo="pdf" title="Descargar PDF"><i class="bi bi-filetype-pdf"></i></button>`);

        if (!botones.length && !f.UUID) return '<span class="text-muted">--</span>';

        const uuid = f.UUID ? `<span class="cf-badge" style="background:#EEF2FF;color:#0B1F47" title="${escapeAtributo(f.UUID)}">UUID</span>` : '';
        return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${uuid}${botones.join('')}</div>`;
    }

    function abrirFactura(facturaID) {
        document.getElementById('formFactura').reset();
        document.getElementById('FacturaID').value = facturaID || '';
        document.getElementById('modalFacturaTitulo').textContent = facturaID ? 'Editar factura' : 'Nueva factura';

        poblarSelectClientes('ClienteID', false);
        poblarSelectProyectos('ProyectoID', null, false);
        setBloqueoFacturaExistente(Boolean(facturaID));

        if (!facturaID) {
            document.getElementById('FechaFactura').value = fechaHoy();
            document.getElementById('FechaVencimiento').value = fechaHoy();
            modalFactura.show();
            return;
        }

        const factura = buscarFactura(facturaID);
        if (!factura) return;

        setValor('ClienteID', factura.ClienteID);
        poblarSelectProyectos('ProyectoID', factura.ClienteID, false);
        setValor('ProyectoID', factura.ProyectoID);
        setValor('Serie', factura.Serie);
        setValor('Folio', factura.Folio);
        setValor('UUID', factura.UUID);
        setValor('FechaFactura', factura.FechaFactura);
        setValor('FechaVencimiento', factura.FechaVencimiento);
        setValor('Subtotal', factura.Subtotal);
        setValor('IVA', factura.IVA);
        setValor('Total', factura.Total);

        document.getElementById('FechaFactura').disabled = true;
        modalFactura.show();
    }

    document.getElementById('modalFactura')?.addEventListener('hidden.bs.modal', () => {
        setBloqueoFacturaExistente(false);
    });

    function setBloqueoFacturaExistente(bloqueado) {
        ['ClienteID', 'ProyectoID', 'UUID', 'FechaFactura'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.disabled = bloqueado;
        });
    }

    async function guardarFactura(e) {
        e.preventDefault();

        const facturaID = valor('FacturaID');
        const payload = {
            ClienteID: Number(valor('ClienteID')),
            ProyectoID: Number(valor('ProyectoID')),
            Serie: valor('Serie') || null,
            Folio: valor('Folio') || null,
            UUID: valor('UUID') || null,
            FechaFactura: valor('FechaFactura') || fechaHoy(),
            FechaVencimiento: valor('FechaVencimiento') || valor('FechaFactura') || fechaHoy(),
            Subtotal: Number(valor('Subtotal') || 0),
            IVA: Number(valor('IVA') || 0),
            Total: Number(valor('Total') || 0)
        };

        try {
            const resp = facturaID
                ? await axios.put(`${CF_API_BASE_URL}/facturas/${facturaID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/facturas`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: resp.data.message || '' });
            }

            modalFactura.hide();
            await Swal.fire({ icon: 'success', title: resp.data.message || 'Factura guardada', timer: 1400, showConfirmButton: false });
            cargarFacturas();
        } catch (error) {
            console.error('Error al guardar factura:', error);
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    async function cancelarFactura(facturaID) {
        const factura = buscarFactura(facturaID);
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: `Cancelar ${nombreFactura(factura)}`,
            text: 'La factura conservara historial y dejara de considerarse en cartera.',
            showCancelButton: true,
            confirmButtonText: 'Cancelar factura',
            cancelButtonText: 'Volver'
        });

        if (!confirmado.isConfirmed) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/facturas/${facturaID}/cancelar`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cancelar', text: resp.data.message || '' });
            }
            await Swal.fire({ icon: 'success', title: resp.data.message || 'Factura cancelada', timer: 1400, showConfirmButton: false });
            cargarFacturas();
        } catch (error) {
            console.error('Error al cancelar factura:', error);
            Swal.fire({ icon: 'error', title: 'Error al cancelar', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    function abrirPago(facturaID) {
        const factura = buscarFactura(facturaID);
        if (!factura) return;

        document.getElementById('formPago').reset();
        setValor('PagoID', '');
        setValor('PagoFacturaID', facturaID);
        setValor('FechaPago', fechaHoy());
        setValor('ImportePago', factura.Saldo);
        document.getElementById('ImportePago').max = factura.Saldo;
        document.getElementById('modalPagoTitulo').textContent = `Registrar pago ${nombreFactura(factura)}`;
        document.getElementById('modalPagoSaldo').textContent = `Saldo pendiente: ${formatearMoneda(factura.Saldo)}`;
        document.querySelector('#formPago button[type="submit"]').innerHTML = '<i class="bi bi-check-lg"></i> Aplicar pago';
        modalPago.show();
    }

    async function abrirEditarPago(pagoID, facturaID) {
        const factura = buscarFactura(facturaID);

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/pagos/${pagoID}`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el pago', text: resp.data.message || '' });
            }

            const pago = resp.data.data;

            Swal.close();

            document.getElementById('formPago').reset();
            setValor('PagoID', pagoID);
            setValor('PagoFacturaID', facturaID);
            setValor('FechaPago', String(pago.FechaPago || '').slice(0, 10));
            setValor('ImportePago', pago.Importe);
            setValor('MetodoPago', pago.MetodoPago || '');
            setValor('Banco', pago.Banco || '');
            setValor('Referencia', pago.Referencia || '');
            setValor('ObservacionesPago', pago.Observaciones || '');

            document.getElementById('modalPagoTitulo').textContent = `Editar pago ${nombreFactura(factura)}`;
            document.getElementById('modalPagoSaldo').textContent = `Saldo actual de la factura: ${formatearMoneda(factura?.Saldo)}`;
            document.querySelector('#formPago button[type="submit"]').innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
            modalPago.show();
        } catch (error) {
            console.error('Error al cargar pago:', error);
            Swal.fire({ icon: 'error', title: 'Error al cargar el pago', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    async function eliminarPago(pagoID, facturaID) {
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: 'Eliminar pago',
            text: 'Se revertira el saldo de la factura. Esta accion no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Volver'
        });

        if (!confirmado.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/pagos/${pagoID}`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar el pago', text: resp.data.message || '' });
            }

            await cargarFacturas();
            await Swal.fire({ icon: 'success', title: resp.data.message || 'Pago eliminado', timer: 1400, showConfirmButton: false });
            verPagos(facturaID);
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            Swal.fire({ icon: 'error', title: 'Error al eliminar pago', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    async function conciliarPago(pagoID, facturaID) {
        const confirmado = await Swal.fire({
            icon: 'question',
            title: 'Conciliar pago',
            text: 'Un pago conciliado ya no podra editarse ni eliminarse.',
            showCancelButton: true,
            confirmButtonText: 'Conciliar',
            cancelButtonText: 'Volver'
        });

        if (!confirmado.isConfirmed) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/pagos/${pagoID}/conciliar`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo conciliar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: resp.data.message || 'Pago conciliado', timer: 1400, showConfirmButton: false });
            verPagos(facturaID);
        } catch (error) {
            console.error('Error al conciliar pago:', error);
            Swal.fire({ icon: 'error', title: 'Error al conciliar pago', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    function construirAccionesPago(p, facturaID) {
        const conciliado = p.Estado === 'Conciliado' || Number(p.Conciliado) === 1;

        if (conciliado) {
            return `<span class="text-muted" style="font-size:.8rem"><i class="bi bi-lock"></i> Conciliado</span>`;
        }

        const botones = [];
        if (permisosFacturacion.PuedeActualizar) {
            botones.push(`<button type="button" class="cf-btn-icon" data-pago-editar="${p.PagoID}" data-factura="${facturaID}" title="Editar pago"><i class="bi bi-pencil"></i></button>`);
            botones.push(`<button type="button" class="cf-btn-icon" data-pago-conciliar="${p.PagoID}" data-factura="${facturaID}" title="Conciliar pago"><i class="bi bi-bank"></i></button>`);
        }
        if (permisosFacturacion.PuedeEliminar) {
            botones.push(`<button type="button" class="cf-btn-icon" data-pago-eliminar="${p.PagoID}" data-factura="${facturaID}" title="Eliminar pago"><i class="bi bi-trash" style="color:#B91C1C"></i></button>`);
        }

        return botones.join('') || '<span class="text-muted">--</span>';
    }

    function badgeEstadoPago(estado) {
        const conciliado = estado === 'Conciliado';
        const bg = conciliado ? '#EEF2FF' : '#D1FAE5';
        const color = conciliado ? '#0B1F47' : '#047857';
        return `<span class="cf-badge" style="background:${bg};color:${color}">${escapeHtml(estado || 'Aplicado')}</span>`;
    }

    async function guardarPago(e) {
        e.preventDefault();

        const pagoID = valor('PagoID');
        const facturaID = valor('PagoFacturaID');
        const payload = {
            FechaPago: valor('FechaPago') || fechaHoy(),
            Importe: Number(valor('ImportePago') || 0),
            MetodoPago: valor('MetodoPago'),
            Referencia: valor('Referencia') || null,
            Banco: valor('Banco') || null,
            Observaciones: valor('ObservacionesPago') || null
        };

        try {
            const resp = pagoID
                ? await axios.put(`${CF_API_BASE_URL}/pagos/${pagoID}`, payload)
                : await axios.post(`${CF_API_BASE_URL}/facturas/${facturaID}/pagos`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: pagoID ? 'No se pudo actualizar el pago' : 'No se pudo registrar el pago', text: resp.data.message || '' });
            }

            modalPago.hide();
            await Swal.fire({ icon: 'success', title: resp.data.message || (pagoID ? 'Pago actualizado' : 'Pago registrado'), timer: 1500, showConfirmButton: false });
            cargarFacturas();
        } catch (error) {
            console.error('Error al guardar pago:', error);
            Swal.fire({ icon: 'error', title: 'Error al guardar pago', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    // El popup de "Ver pagos" lo renderiza SweetAlert2 fuera de #tblFacturas,
    // por eso sus acciones (editar/eliminar/conciliar) se atienden con un
    // listener aparte a nivel de documento.
    document.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-pago-editar]');
        if (btnEditar) return abrirEditarPago(btnEditar.dataset.pagoEditar, btnEditar.dataset.factura);

        const btnEliminar = e.target.closest('[data-pago-eliminar]');
        if (btnEliminar) return eliminarPago(btnEliminar.dataset.pagoEliminar, btnEliminar.dataset.factura);

        const btnConciliar = e.target.closest('[data-pago-conciliar]');
        if (btnConciliar) return conciliarPago(btnConciliar.dataset.pagoConciliar, btnConciliar.dataset.factura);
    });

    async function verPagos(facturaID) {
        const factura = buscarFactura(facturaID);

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/facturas/${facturaID}/pagos`);
            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudieron cargar los pagos', text: resp.data.message || '' });
            }

            const pagos = resp.data.data || [];
            const filas = pagos.length
                ? pagos.map((p) => `
                    <tr>
                        <td>${formatearFecha(p.FechaPago)}</td>
                        <td>${formatearMoneda(p.Importe)}</td>
                        <td>${escapeHtml(p.MetodoPago || '--')}</td>
                        <td>${escapeHtml(p.Referencia || '--')}</td>
                        <td>${escapeHtml(p.Banco || '--')}</td>
                        <td>${badgeEstadoPago(p.Estado)}</td>
                        <td style="white-space:nowrap">${construirAccionesPago(p, facturaID)}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="7" class="text-center text-muted">Sin pagos registrados.</td></tr>';

            Swal.fire({
                title: `Pagos de ${nombreFactura(factura)}`,
                width: 1000,
                html: `
                    <div class="cf-table-wrap" style="text-align:left">
                        <table class="cf-table" style="width:100%;font-size:1rem">
                            <thead><tr><th>Fecha</th><th>Importe</th><th>Metodo</th><th>Referencia</th><th>Banco</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                `,
                confirmButtonText: 'Cerrar'
            });
        } catch (error) {
            console.error('Error al ver pagos:', error);
            Swal.fire({ icon: 'error', title: 'Error al cargar pagos', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    function abrirCfdi(facturaID) {
        const factura = buscarFactura(facturaID);
        if (!factura) return;

        document.getElementById('formCfdi').reset();
        setValor('CfdiFacturaID', facturaID);
        setValor('CfdiUUID', factura.UUID || '');
        document.getElementById('modalCfdiTitulo').textContent = `Cargar CFDI ${nombreFactura(factura)}`;
        modalCfdi.show();
    }

    async function guardarCfdi(e) {
        e.preventDefault();

        const facturaID = valor('CfdiFacturaID');
        const formData = new FormData();
        const uuid = valor('CfdiUUID');
        const xml = document.getElementById('CfdiXML').files[0];
        const pdf = document.getElementById('CfdiPDF').files[0];

        if (uuid) formData.append('UUID', uuid);
        if (xml) formData.append('xml', xml);
        if (pdf) formData.append('pdf', pdf);

        if (!uuid && !xml && !pdf) {
            return Swal.fire({ icon: 'info', title: 'Agrega al menos UUID, XML o PDF' });
        }

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/facturas/${facturaID}/cfdi`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar el CFDI', text: resp.data.message || '' });
            }

            modalCfdi.hide();
            await Swal.fire({ icon: 'success', title: resp.data.message || 'CFDI guardado', timer: 1400, showConfirmButton: false });
            cargarFacturas();
        } catch (error) {
            console.error('Error al guardar CFDI:', error);
            Swal.fire({ icon: 'error', title: 'Error al guardar CFDI', text: error.response?.data?.message || 'Ocurrio un error al conectar con el servidor.' });
        }
    }

    async function descargarCfdi(facturaID, tipo) {
        const factura = buscarFactura(facturaID);
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/facturas/${facturaID}/${tipo}`, { responseType: 'blob' });
            const blob = new Blob([resp.data], { type: tipo === 'xml' ? 'application/xml' : 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `${nombreFactura(factura)}.${tipo}`;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error(`Error al descargar ${tipo}:`, error);
            Swal.fire({ icon: 'error', title: `No se pudo descargar el ${tipo.toUpperCase()}`, text: error.response?.data?.message || 'Verifica que el archivo exista.' });
        }
    }

    async function generarCartaCobranza() {
        const clienteID = valor('facFiltroCliente');

        if (!clienteID) {
            return Swal.fire({ icon: 'info', title: 'Selecciona un cliente', text: 'Elige un cliente en el filtro para generar su carta de cobranza.' });
        }

        const cliente = clientesPorID[clienteID];

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/clientes/${clienteID}/carta-cobranza`, { responseType: 'blob' });

            const blob = new Blob([resp.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('Error al generar carta de cobranza:', error);

            // El endpoint regresa JSON (no PDF) cuando falla; axios lo entrega
            // como Blob por el responseType, hay que leerlo para el mensaje real.
            let mensaje = 'No se pudo generar la carta de cobranza.';
            if (error.response?.data instanceof Blob) {
                try {
                    const texto = await error.response.data.text();
                    const json = JSON.parse(texto);
                    mensaje = json.message || mensaje;
                } catch (_) { /* deja el mensaje generico */ }
            }

            Swal.fire({
                icon: 'warning',
                title: `Sin carta para ${cliente?.NombreCliente || 'este cliente'}`,
                text: mensaje
            });
        }
    }

    function limpiarFiltros() {
        ['facFiltroCliente', 'facFiltroProyecto', 'facFiltroEstado', 'facFiltroDesde', 'facFiltroHasta'].forEach((id) => setValor(id, ''));
        cargarFacturas();
    }

    function pintarResumen(lista) {
        const activas = lista.filter((f) => f.Estado !== 'Cancelada');
        const total = activas.reduce((s, f) => s + Number(f.Total || 0), 0);
        const saldo = activas.reduce((s, f) => s + Number(f.Saldo || 0), 0);
        const vencido = activas
            .filter((f) => f.Estado === 'Vencida')
            .reduce((s, f) => s + Number(f.Saldo || 0), 0);

        // Si ya no hay nada pendiente/vencido, no se muestra "$0.00": se
        // deja en blanco para que la ficha no aparente que sigue debiendo.
        document.getElementById('facTotalFacturado').textContent = formatearMonedaOMontoVacio(total);
        document.getElementById('facSaldoPendiente').textContent = formatearMonedaOMontoVacio(saldo);
        document.getElementById('facTotalPagado').textContent = formatearMonedaOMontoVacio(total - saldo);
        document.getElementById('facTotalVencido').textContent = formatearMonedaOMontoVacio(vencido);
    }

    function poblarSelectClientes(id, incluirTodos) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = incluirTodos ? '<option value="">Todos</option>' : '<option value="">Seleccionar cliente</option>';
        Object.values(clientesPorID).forEach((c) => {
            select.insertAdjacentHTML('beforeend', `<option value="${c.ClienteID}">${escapeHtml(c.NombreCliente || `Cliente #${c.ClienteID}`)}</option>`);
        });
    }

    function poblarSelectProyectos(id, clienteID, incluirTodos) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = incluirTodos ? '<option value="">Todos</option>' : '<option value="">Seleccionar proyecto</option>';

        Object.values(proyectosPorID)
            .filter((p) => !clienteID || String(p.ClienteID) === String(clienteID))
            .forEach((p) => {
                const codigo = p.CodigoProyecto ? `${p.CodigoProyecto} - ` : '';
                select.insertAdjacentHTML('beforeend', `<option value="${p.ProyectoID}">${escapeHtml(codigo + (p.NombreProyecto || `Proyecto #${p.ProyectoID}`))}</option>`);
            });
    }

    function recalcularTotal() {
        const subtotal = Number(valor('Subtotal') || 0);
        const iva = Number(valor('IVA') || 0);
        setValor('Total', (subtotal + iva).toFixed(2));
    }

    function badgeEstado(estado) {
        const colores = {
            Pendiente: ['#FEF3C7', '#B45309'],
            'Parcialmente Pagada': ['#DBEAFE', '#0B69D4'],
            Pagada: ['#D1FAE5', '#047857'],
            Vencida: ['#FEE2E2', '#B91C1C'],
            Cancelada: ['#F1F5F9', '#475569']
        };
        const [bg, color] = colores[estado] || ['#F1F5F9', '#475569'];
        return `<span class="cf-badge" style="background:${bg};color:${color}">${escapeHtml(estado || '--')}</span>`;
    }

    function buscarFactura(id) {
        return facturas.find((f) => String(f.FacturaID) === String(id));
    }

    function nombreFactura(f) {
        if (!f) return 'Factura';
        return `${f.Serie || ''}${f.Folio || ('#' + f.FacturaID)}`;
    }

    function indexarPorID(lista, campo) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campo]] = item; });
        return mapa;
    }

    function valor(id) {
        return (document.getElementById(id)?.value || '').trim();
    }

    function setValor(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    }

    function fechaHoy() {
        return new Date().toISOString().slice(0, 10);
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }

    function formatearMonedaOMontoVacio(valor) {
        const numero = Number(valor || 0);
        return numero > 0 ? formatearMoneda(numero) : '—';
    }

    function formatearFecha(valor) {
        if (!valor) return '--';
        const partes = String(valor).slice(0, 10).split('-');
        const fecha = partes.length === 3
            ? new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
            : new Date(valor);
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
