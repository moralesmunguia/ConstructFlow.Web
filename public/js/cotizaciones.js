/**
 * cotizaciones.js
 * Ref: DEF-WEB-002 (API Cotización) sección 2.
 *
 * GET  {CF_API_BASE_URL}/cotizaciones                  -> CotizacionController::index()
 * GET  {CF_API_BASE_URL}/clientes                      -> ClienteController::index()
 * GET  {CF_API_BASE_URL}/catalogos/estados-cotizacion  -> CotizacionController::catalogoEstados()
 * GET  {CF_API_BASE_URL}/cotizaciones/{id}/json        -> CotizacionController::getJsonMaster()
 * PUT  {CF_API_BASE_URL}/cotizaciones/{id}/estado       -> CotizacionController::cambiarEstado()
 * DELETE {CF_API_BASE_URL}/cotizaciones/{id}           -> CotizacionController::delete()
 *
 * Formato estándar de respuesta (DEF-WEB-000 sección 21):
 *   { success: bool, message: string, data: {} }
 */

document.addEventListener('DOMContentLoaded', () => {

    let clientesPorID = {};
    let estadosPorID = {};
    let estadosLista = [];
    let dataTable = null;
    let ultimasCotizaciones = [];

    const permisosCotizaciones = CF_PERMISOS['cotizaciones'] || {
        PuedeCrear: false, PuedeConsultar: false, PuedeActualizar: false, PuedeEliminar: false
    };

    if (!permisosCotizaciones.PuedeCrear) {
        document.getElementById('btnNuevaCotizacion')?.remove();
    }

    cargarCotizaciones().then(() => {
        const parametros = new URLSearchParams(window.location.search);
        const cotizacionEditarID = parametros.get('editar');

        if (cotizacionEditarID) {
            mostrarFormulario(cotizacionEditarID);

            // Limpia el query param para que un refresh no reabra el modal
            const url = new URL(window.location.href);
            url.searchParams.delete('editar');
            window.history.replaceState({}, '', url);
        }
    });

    document.getElementById('btnNuevaCotizacion')?.addEventListener('click', () => {
        mostrarFormulario(null);
    });

    // ---- Delegación de eventos para los botones de Acciones (filas dinámicas) ----
    document.getElementById('tblCotizaciones')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('[data-ver]');
        if (btnVer) return verCotizacion(btnVer.dataset.ver);

        const btnEstado = e.target.closest('[data-cambiar-estado]');
        if (btnEstado) return cambiarEstadoCotizacion(btnEstado.dataset.cambiarEstado);

        const btnEliminar = e.target.closest('[data-eliminar]');
        if (btnEliminar) return eliminarCotizacion(btnEliminar.dataset.eliminar);

        const btnImprimir = e.target.closest('[data-imprimir]');
        if (btnImprimir) return imprimirCotizacion(btnImprimir.dataset.imprimir);

        const btnCorreo = e.target.closest('[data-correo]');
        if (btnCorreo) return enviarCorreoCotizacion(btnCorreo.dataset.correo);

        const btnDuplicar = e.target.closest('[data-duplicar]');
        if (btnDuplicar) return duplicarCotizacion(btnDuplicar.dataset.duplicar);

        const btnEditar = e.target.closest('[data-editar]');
        if (btnEditar) return mostrarFormulario(btnEditar.dataset.editar);
    });

    async function cargarCotizaciones() {
        // Sin orden de cliente: se respeta el orden que ya entrega la API
        // (CotizacionRepository::getAll ordena por CotizacionID DESC),
        // es decir, la última cotización capturada aparece primero.
        dataTable = cfInitDataTable('#tblCotizaciones', { order: [] });

        try {
            const [respCotizaciones, respClientes, respEstados] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/cotizaciones`),
                axios.get(`${CF_API_BASE_URL}/clientes`),
                axios.get(`${CF_API_BASE_URL}/catalogos/estados-cotizacion`)
            ]);

            if (!respCotizaciones.data.success) {
                await Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cargar el listado',
                    text: respCotizaciones.data.message || 'Ocurrió un error al consultar las cotizaciones.'
                });
                return;
            }

            clientesPorID = indexarPorID(respClientes.data.data, 'ClienteID');
            estadosLista = respEstados.data.data || [];
            estadosPorID = indexarPorID(estadosLista, 'EstadoCotizacionID');

            pintarFilas(respCotizaciones.data.data || []);

        } catch (error) {
            console.error('Error al cargar cotizaciones:', error);

            const mensaje = error.response?.data?.message
                || 'Ocurrió un error al conectar con el servidor.';

            await Swal.fire({
                icon: 'error',
                title: 'Error al cargar cotizaciones',
                text: mensaje
            });
        }
    }

    function pintarFilas(filas) {
        ultimasCotizaciones = filas;
        dataTable.clear();

        filas.forEach((c) => {
            const fila = construirFila(c);
            const nodo = dataTable.row.add(fila).node();
            aplicarAlertaVigencia(nodo, c);
        });

        dataTable.draw();
    }

    async function recargar() {
        try {
            const respCotizaciones = await axios.get(`${CF_API_BASE_URL}/cotizaciones`);
            if (respCotizaciones.data.success) {
                pintarFilas(respCotizaciones.data.data || []);
            }
        } catch (error) {
            console.error('Error al recargar cotizaciones:', error);
        }
    }

    function aplicarAlertaVigencia(nodo, c) {
        if (!c.FechaVigencia) return;

        const estado = estadosPorID[c.EstadoCotizacionID];
        if (estado?.EsFinal) return; // ya resuelta (aprobada/rechazada/cancelada/etc.), no aplica alerta

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const vigencia = new Date(c.FechaVigencia);
        if (isNaN(vigencia.getTime())) return;
        vigencia.setHours(0, 0, 0, 0);

        const diasParaVencer = Math.round((vigencia - hoy) / 86400000);

        if (diasParaVencer < 0) {
            $(nodo).addClass('cf-row-vencida');
        } else if (diasParaVencer <= 7) {
            $(nodo).addClass('cf-row-por-vencer');
        }
    }

    function indexarPorID(lista, campoID) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campoID]] = item; });
        return mapa;
    }

    function construirFila(c) {
        const cliente = clientesPorID[c.ClienteID];
        const nombreCliente = cliente?.NombreCliente || `Cliente #${c.ClienteID}`;

        const estado = estadosPorID[c.EstadoCotizacionID];
        const nombreEstado = estado?.NombreEstado || `Estado ${c.EstadoCotizacionID}`;
        const colorEstado = estado?.ColorHex || '#6C757D';
        const reglas = reglasEstadoCotizacion(estado);

        return [
            `<strong title="${escapeHtml(c.Folio || '')}">${escapeHtml(formatearFolioCorto(c.Folio))}</strong>`,
            escapeHtml(nombreCliente),
            escapeHtml(c.Atencion || '—'),
            escapeHtml(c.DescripcionTrabajo || '—'),
            formatearFecha(c.Fecha),
            formatearFecha(c.FechaVigencia),
            formatearMoneda(c.Descuento, c.Moneda),
            formatearMoneda(c.TotalVenta, c.Moneda),
            badgeEstado(nombreEstado, colorEstado),
            construirAcciones(c.CotizacionID, reglas)
        ];
    }

    function reglasEstadoCotizacion(estado) {
        const codigo = String(estado?.Codigo || '').toUpperCase();
        return {
            editable: ['BORRADOR', 'EN_REVISION', 'EN_REVISIÓN'].includes(codigo),
            eliminable: codigo === 'BORRADOR',
            cambioEstadoManual: codigo !== 'CONVERTIDA_PROYECTO'
        };
    }

    function construirAcciones(cotizacionID, reglas) {
        const botones = [];

        if (permisosCotizaciones.PuedeConsultar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Ver" data-ver="${cotizacionID}"><i class="bi bi-eye"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Imprimir" data-imprimir="${cotizacionID}"><i class="bi bi-printer"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Enviar por correo" data-correo="${cotizacionID}"><i class="bi bi-envelope"></i></button>`);
        }

        // COT-039: Duplicar -- disponible para cualquier estado (sirve para
        // usar una cotizacion existente, sin importar su estado, como punto
        // de partida de una nueva). Requiere PuedeCrear porque genera una
        // cotizacion nueva.
        if (permisosCotizaciones.PuedeCrear) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Duplicar" data-duplicar="${cotizacionID}"><i class="bi bi-copy"></i></button>`);
        }

        if (permisosCotizaciones.PuedeActualizar) {
            if (!reglas.editable) {
                botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Estado protegido: no se puede modificar libremente" disabled><i class="bi bi-lock"></i></button>`);
            } else {
                botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Modificar" data-editar="${cotizacionID}"><i class="bi bi-pencil"></i></button>`);
            }

            if (reglas.cambioEstadoManual) {
                botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Cambiar estado" data-cambiar-estado="${cotizacionID}"><i class="bi bi-arrow-repeat"></i></button>`);
            }
        }

        if (permisosCotizaciones.PuedeEliminar && reglas.eliminable) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm text-danger" title="Eliminar" data-eliminar="${cotizacionID}"><i class="bi bi-trash"></i></button>`);
        }

        return `<div class="cf-row-actions text-end">${botones.join('')}</div>`;
    }

    // ---- Formato único de cotización (Ver e Imprimir comparten esta plantilla) ----
    let empresasPorID = {};

    async function obtenerEmpresa(empresaID) {
        if (empresasPorID[empresaID]) return empresasPorID[empresaID];

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/empresas/${empresaID}`);
            if (resp.data.success) {
                empresasPorID[empresaID] = resp.data.data;
                return resp.data.data;
            }
        } catch (_) { /* ignorar, se usa fallback */ }

        return {};
    }

    async function obtenerCotizacionCompleta(cotizacionID) {
        const resp = await axios.get(`${CF_API_BASE_URL}/cotizaciones/persist/${cotizacionID}`);

        if (!resp.data.success) {
            throw new Error(resp.data.message || 'No fue posible obtener la cotización.');
        }

        return resp.data.data; // { metadata, cotizacion, detalle, actividades }
    }

    function construirHtmlCotizacion(datos, empresa) {
        const c = datos.cotizacion;
        const cliente = clientesPorID[c.ClienteID];
        const estado = estadosPorID[c.EstadoCotizacionID];

        // El Subtotal que se muestra ya lleva el descuento aplicado
        // (SubtotalVenta se guarda ANTES del descuento).
        const subtotalConDescuento = Number(c.SubtotalVenta || 0) - Number(c.Descuento || 0);
        const tieneDescuento = Number(c.Descuento || 0) > 0;

        const partesContacto = [];
        if (empresa?.Contacto) partesContacto.push(escapeHtml(empresa.Contacto));
        if (empresa?.Telefono) partesContacto.push(`Tel. ${escapeHtml(empresa.Telefono)}`);
        if (empresa?.Correo) partesContacto.push(escapeHtml(empresa.Correo));
        if (empresa?.SitioWeb) partesContacto.push(escapeHtml(empresa.SitioWeb));
        const lineaContacto = partesContacto.join(' &nbsp;|&nbsp; ');

        const filasDetalle = (datos.detalle || []).map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(d.Descripcion || '')}</td>
                <td class="text-center">${escapeHtml(d.Unidad || '')}</td>
                <td class="text-end">${Number(d.Cantidad ?? 0).toLocaleString('es-MX')}</td>
                <td class="text-end">${quitarHtml(formatearMoneda(d.PrecioUnitario, c.Moneda))}</td>
                <td class="text-end">${quitarHtml(formatearMoneda(d.ImporteVenta, c.Moneda))}</td>
                <td>${escapeHtml(d.Comentarios || '')}</td>
            </tr>
        `).join('');

        const sitioWeb = (empresa?.SitioWeb || '').trim();

        return `
            <div class="cf-cot-doc">
                <div class="cf-cot-header">
                    <table class="cf-cot-header-tabla">
                        <tr>
                            <td class="cf-cot-logo">${logoEmpresaHtml(empresa)}</td>
                            <td class="cf-cot-info">
                                <div><strong>Cliente:</strong> ${escapeHtml(cliente?.NombreCliente || `#${c.ClienteID}`)} &nbsp;&nbsp; <strong>Atención:</strong> ${escapeHtml(c.Atencion || '—')}</div>
                                <div><strong>Fecha:</strong> ${escapeHtml(formatearFechaSimple(c.Fecha))} &ndash; <strong>Vigencia:</strong> ${escapeHtml(formatearFechaSimple(c.FechaVigencia))}</div>
                                <div><strong>Forma de Pago:</strong> ${escapeHtml(c.FormaPago || 'Establecido')} &nbsp;&nbsp; <strong>Tiempo de Entrega:</strong> ${escapeHtml(c.TiempoEntregaDias ? `${c.TiempoEntregaDias} días` : '—')}</div>
                                <div class="cf-cot-separador"></div>
                                <div class="cf-cot-empresa-nombre">${escapeHtml(empresa?.NombreEmpresa || '')}</div>
                                ${lineaContacto ? `<div class="cf-cot-empresa-contacto">${lineaContacto}</div>` : ''}
                            </td>
                            <td class="cf-cot-folio">
                                <div class="cf-cot-folio-label">Número de Cotización</div>
                                <div class="cf-cot-folio-valor">${escapeHtml(c.Folio || '')}</div>
                                <div class="cf-cot-folio-estado" style="color:${estado?.ColorHex || '#6C757D'}">${escapeHtml(estado?.NombreEstado || '')}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="cf-cot-desc"><strong>DESCRIPCIÓN DEL TRABAJO:</strong> ${escapeHtml(c.NombreProyecto || '—')}</div>

                <table class="cf-cot-tabla">
                    <colgroup>
                        <col style="width:4%">
                        <col style="width:26%">
                        <col style="width:7%">
                        <col style="width:7%">
                        <col style="width:11%">
                        <col style="width:9%">
                        <col style="width:36%">
                    </colgroup>
                    <thead>
                        <tr>
                            <th class="text-center">No.</th>
                            <th class="text-center">Descripción</th>
                            <th class="text-center">Unidad</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-center">P.U.</th>
                            <th class="text-center">Importe</th>
                            <th class="text-center">Comentarios</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasDetalle || '<tr><td colspan="7">Sin partidas registradas.</td></tr>'}
                    </tbody>
                </table>

                <div class="cf-cot-footer">
                    <div class="cf-cot-nota">
                        Nota: Los precios no incluyen impuestos.<br>
                        Importes expresados en ${escapeHtml(c.Moneda || 'MXN')}.
                    </div>
                    <table class="cf-cot-totales">
                        ${tieneDescuento ? `<tr><td>Descuento</td><td class="text-end">-${quitarHtml(formatearMoneda(c.Descuento, c.Moneda))}</td></tr>` : ''}
                        <tr class="cf-cot-total-final"><td>SUBTOTAL</td><td class="text-end">${quitarHtml(formatearMoneda(subtotalConDescuento, c.Moneda))}</td></tr>
                    </table>
                </div>

                ${sitioWeb ? `<div class="cf-cot-pie-pagina">${escapeHtml(sitioWeb)}</div>` : ''}
            </div>
        `;
    }

    function logoEmpresaHtml(empresa) {
        const url = (empresa?.LogoURL || '').trim();

        if (/^https?:\/\//i.test(url)) {
            return `<img src="${url}" alt="Logo" class="cf-cot-logo-img">`;
        }

        if (url) {
            return `<img src="${CF_BASE_URL}/public/${url.replace(/^\//, '')}" alt="Logo" class="cf-cot-logo-img">`;
        }

        // Fallback mientras LogoURL no esté lleno para otras empresas
        if (Number(empresa?.EmpresaID) === 1) {
            return `<img src="${CF_BASE_URL}/public/img/logo_ROM.jpg" alt="ROM" class="cf-cot-logo-img">`;
        }
        return `<div class="cf-cot-logo-box">LOGO</div>`;
    }

    const CF_COT_ESTILOS = `
        .cf-cot-doc { font-family: Arial, sans-serif; color: #1A2332; font-size: 0.85rem; }
        .cf-cot-header { border: 2px solid #0B1F47; padding: 8px 12px; margin-bottom: 14px; }
        .cf-cot-header-tabla { width: 100%; border-collapse: collapse; }
        .cf-cot-header-tabla td { border: none; padding: 3px 10px; vertical-align: middle; }
        .cf-cot-logo { width: 110px; text-align: center; }
        .cf-cot-logo-img { max-width: 100px; max-height: 70px; object-fit: contain; }
        .cf-cot-logo-box { font-family: Poppins, Arial, sans-serif; font-weight: 800; font-size: 1.6rem; color: #F97316; letter-spacing: 1px; }
        .cf-cot-empresa-nombre { font-size: 1.15rem; font-weight: 800; color: #0B1F47; }
        .cf-cot-empresa-contacto { font-size: 0.72rem; color: #6B7280; margin-top: 1px; }
        .cf-cot-separador { border-top: 1px solid #E5E7EB; margin: 6px 0; }
        .cf-cot-info div { font-size: 0.8rem; margin-top: 2px; }
        .cf-cot-folio { width: 220px; text-align: center; }
        .cf-cot-folio-label { font-size: 0.7rem; text-transform: uppercase; color: #6B7280; }
        .cf-cot-folio-valor { font-size: 1.1rem; font-weight: 800; color: #0B1F47; }
        .cf-cot-folio-estado { font-size: 0.75rem; font-weight: 700; margin-top: 2px; }
        .cf-cot-desc { background: #F5F7FA; border: 1px solid #E5E7EB; padding: 8px 10px; margin-bottom: 10px; font-size: 0.85rem; }
        .cf-cot-tabla { width: 100%; border-collapse: collapse; font-size: 0.8rem; table-layout: fixed; }
        .cf-cot-tabla th, .cf-cot-tabla td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: left; word-wrap: break-word; }
        .cf-cot-tabla td.text-end, .cf-cot-tabla th.text-end { text-align: right; }
        .cf-cot-tabla td.text-center, .cf-cot-tabla th.text-center { text-align: center; }
        .cf-cot-tabla th { background: #0B1F47; color: #fff; font-size: 0.7rem; text-transform: uppercase; }
        .text-end { text-align: right; }
        .text-center { text-align: center; }
        .cf-cot-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; gap: 20px; }
        .cf-cot-nota { font-size: 0.78rem; color: #6B7280; font-style: italic; }
        .cf-cot-totales { border-collapse: collapse; min-width: 260px; }
        .cf-cot-totales td { padding: 3px 8px; font-size: 0.85rem; }
        .cf-cot-total-final td { font-size: 1.05rem; font-weight: 800; border-top: 2px solid #0B1F47; color: #0B1F47; }
        .cf-cot-pie-pagina { text-align: center; font-size: 0.78rem; color: #0B1F47; font-weight: 700; margin-top: 24px; padding-top: 8px; border-top: 1px solid #E5E7EB; }
    `;

    // ---- Ver ----
    async function verCotizacion(cotizacionID) {
        try {
            const datos = await obtenerCotizacionCompleta(cotizacionID);
            const empresa = await obtenerEmpresa(datos.cotizacion.EmpresaID);

            Swal.fire({
                title: false,
                width: 1000,
                showCloseButton: true,
                showConfirmButton: true,
                confirmButtonText: '<i class="bi bi-printer"></i> Imprimir',
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                html: `<style>${CF_COT_ESTILOS}</style>${construirHtmlCotizacion(datos, empresa)}`
            }).then((resultado) => {
                if (resultado.isConfirmed) imprimirCotizacion(cotizacionID);
            });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No encontrada', text: error.response?.data?.message || error.message });
        }
    }

    // ---- Imprimir (PDF generado en servidor con dompdf, sin diálogo de impresión) ----
    async function imprimirCotizacion(cotizacionID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}/pdf`, {
                responseType: 'blob'
            });

            const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');

            // libera el blob después de un rato, ya con la pestaña abierta
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        } catch (error) {
            // El error viene como Blob (porque pedimos responseType: 'blob'); hay que leerlo como texto
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

    // ---- Enviar por correo ----
    async function enviarCorreoCotizacion(cotizacionID) {
        const clienteID = obtenerClienteIDDeFila(cotizacionID);

        let correoSugerido = '';
        try {
            const respContacto = await axios.get(`${CF_API_BASE_URL}/clientes/${clienteID}/contacto-principal`);
            correoSugerido = respContacto.data?.data?.Correo || '';
        } catch (_) {
            // sin contacto principal registrado; se deja vacío y el usuario lo captura
        }

        const { value: destinatario } = await Swal.fire({
            title: 'Enviar cotización por correo',
            input: 'email',
            inputLabel: 'Correo del destinatario',
            inputValue: correoSugerido,
            inputPlaceholder: 'correo@cliente.com',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar',
            inputValidator: (valor) => {
                if (!valor) return 'Escribe un correo.';
            }
        });

        if (!destinatario) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}/enviar-correo`, {
                Destinatario: destinatario
            });

            if (!resp.data.success) {
                return Swal.fire({
                    icon: 'warning',
                    title: 'No se envió',
                    text: resp.data.message || 'El envío de correo aún no está configurado.'
                });
            }

            Swal.fire({ icon: 'success', title: 'Correo enviado', text: `Se envió la cotización a ${destinatario}.` });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible enviar el correo.' });
        }
    }

    function obtenerClienteIDDeFila(cotizacionID) {
        // Reconstruye ClienteID a partir del último listado cargado (no requiere otra llamada a la API)
        const fila = (ultimasCotizaciones || []).find((c) => String(c.CotizacionID) === String(cotizacionID));
        return fila?.ClienteID;
    }

    // ---- Formulario completo (Nueva Cotización / Modificar) vía JSON Maestro ----
    // POST {CF_API_BASE_URL}/cotizaciones/persist -> CotizacionPersistenciaService::persist()
    //   metadata.Operacion = 'INSERT' si cotizacion.CotizacionID viene vacío/0, 'UPDATE' si no.

    let cotizacionEnEdicionID = null;
    let selectsFormularioListos = false;

    function poblarSelectsFormulario() {
        if (selectsFormularioListos) return;

        const selCliente = document.getElementById('cfClienteID');
        selCliente.innerHTML = '<option value="">Selecciona un cliente</option>' +
            Object.values(clientesPorID).map((c) => `<option value="${c.ClienteID}">${escapeHtml(c.NombreCliente)}</option>`).join('');

        const selEstado = document.getElementById('cfEstadoCotizacionID');
        selEstado.innerHTML = estadosLista
            .filter((e) => e.Codigo !== 'CONVERTIDA_PROYECTO')
            .map((e) => `<option value="${e.EstadoCotizacionID}">${escapeHtml(e.NombreEstado)}</option>`).join('');

        selectsFormularioListos = true;
    }

    document.getElementById('btnCancelarFormulario')?.addEventListener('click', ocultarFormulario);
    document.getElementById('btnGuardarCotizacion')?.addEventListener('click', guardarCotizacion);
    document.getElementById('btnAgregarPartida')?.addEventListener('click', () => agregarFilaDetalle());
    document.getElementById('btnAgregarActividad')?.addEventListener('click', () => agregarFilaActividad());

    // Delegación para borrar filas de las tablas dinámicas del formulario
    document.getElementById('cfTablaDetalle')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quitar-fila]');
        if (btn) btn.closest('tr').remove();
    });
    document.getElementById('cfTablaActividades')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quitar-fila]');
        if (btn) btn.closest('tr').remove();
    });

    // Tope dinámico del Descuento según Cantidad/P.U./Tipo de Descuento de esa misma fila
    document.getElementById('cfTablaDetalle')?.addEventListener('input', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        if (!e.target.matches('.cf-det-cantidad, .cf-det-precio, .cf-det-tipo-descuento, .cf-det-descuento')) return;
        actualizarTopeDescuento(tr);
    });

    function actualizarTopeDescuento(tr) {
        const cantidad = Number(tr.querySelector('.cf-det-cantidad').value) || 0;
        const precio = Number(tr.querySelector('.cf-det-precio').value) || 0;
        const tipo = tr.querySelector('.cf-det-tipo-descuento').value;
        const inputDescuento = tr.querySelector('.cf-det-descuento');
        const ayuda = tr.querySelector('.cf-det-descuento-ayuda');

        const importeBase = cantidad * precio;
        const tope = tipo === 'PORCENTAJE' ? 100 : importeBase;

        inputDescuento.max = tope;
        ayuda.textContent = tipo === 'PORCENTAJE'
            ? 'Máx. 100%'
            : `Máx. ${importeBase.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`;
    }

    const CF_UNIDADES = ['PZA', 'SERVICIO', 'LOTE', 'GLOBAL', 'M2', 'M3', 'ML', 'KG', 'TON', 'HRS', 'JGO', 'PAR', 'LTS'];

    // ---- Cliente -> Atención: sugerencias de contactos guardados de ese cliente ----
    document.getElementById('cfClienteID')?.addEventListener('change', async (e) => {
        const inputAtencion = document.getElementById('cfAtencion');
        const datalist = document.getElementById('cfListaContactos');
        inputAtencion.value = '';
        datalist.innerHTML = '';

        const clienteID = e.target.value;
        if (!clienteID) return;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/clientes/${clienteID}/contactos`);
            const contactos = resp.data?.data || [];

            datalist.innerHTML = contactos.map((ct) =>
                `<option value="${escapeAttr(ct.Nombre || '')}">${escapeHtml(ct.Puesto || ct.Correo || '')}</option>`
            ).join('');

            const principal = contactos.find((ct) => ct.Principal == 1) || contactos[0];
            if (principal) inputAtencion.value = principal.Nombre || '';

        } catch (_) {
            // sin contactos registrados para ese cliente; se deja vacío
        }
    });

    // ---- Fecha -> Vigencia automática (1 mes después), solo en captura nueva ----
    document.getElementById('cfFecha')?.addEventListener('change', (e) => {
        if (cotizacionEnEdicionID) return; // en edición no se pisa la vigencia ya guardada

        const valor = e.target.value;
        if (!valor) return;

        const fecha = new Date(`${valor}T00:00:00`);
        fecha.setMonth(fecha.getMonth() + 1);

        document.getElementById('cfFechaVigencia').value = fecha.toISOString().substring(0, 10);
    });

    async function mostrarFormulario(cotizacionID) {
        poblarSelectsFormulario();

        document.getElementById('cfCardListado').style.display = 'none';
        document.getElementById('cfCardFormulario').style.display = '';

        document.querySelector('#cfTablaDetalle tbody').innerHTML = '';
        document.querySelector('#cfTablaActividades tbody').innerHTML = '';

        if (!cotizacionID) {
            // ---- Nueva cotización: formulario en blanco ----
            cotizacionEnEdicionID = null;
            document.getElementById('cfFormTitulo').textContent = 'Nueva Cotización';

            document.getElementById('cfClienteID').value = '';
            document.getElementById('cfAtencion').value = '';

            const selEstado = document.getElementById('cfEstadoCotizacionID');
            selEstado.value = estadosLista.find((e) => e.Codigo === 'BORRADOR')?.EstadoCotizacionID || '';
            selEstado.disabled = true;
            document.getElementById('cfEstadoNota').style.display = '';

            document.getElementById('cfNombreProyecto').value = '';
            document.getElementById('cfFormaPago').value = 'Crédito 30 días';
            document.getElementById('cfFecha').value = new Date().toISOString().substring(0, 10);
            document.getElementById('cfFechaVigencia').value = '';
            document.getElementById('cfTiempoEntrega').value = '';
            document.getElementById('cfIncluyeIVA').checked = true;
            document.getElementById('cfProbabilidadCierre').value = '50';
            document.getElementById('cfOrigenProspecto').value = '';
            document.getElementById('cfObservaciones').value = '';

            agregarFilaDetalle();
            return;
        }

        // ---- Modificar: cargar JSON maestro existente ----
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/cotizaciones/persist/${cotizacionID}`);

            if (!resp.data.success) {
                ocultarFormulario();
                return Swal.fire({ icon: 'error', title: 'No encontrada', text: resp.data.message || '' });
            }

            const { cotizacion: c, detalle, actividades } = resp.data.data;
            const reglas = reglasEstadoCotizacion(estadosPorID[c.EstadoCotizacionID]);

            if (!reglas.editable) {
                ocultarFormulario();
                return Swal.fire({
                    icon: 'info',
                    title: 'Cotización protegida',
                    text: 'Solo las cotizaciones en Borrador o En Revisión pueden modificarse desde esta pantalla.'
                });
            }

            cotizacionEnEdicionID = c.CotizacionID;
            document.getElementById('cfFormTitulo').textContent = `Modificar ${c.Folio}`;

            document.getElementById('cfClienteID').value = c.ClienteID;
            document.getElementById('cfAtencion').value = c.Atencion || '';

            const selEstado = document.getElementById('cfEstadoCotizacionID');
            selEstado.value = c.EstadoCotizacionID;
            selEstado.disabled = false;
            document.getElementById('cfEstadoNota').style.display = 'none';

            document.getElementById('cfNombreProyecto').value = c.NombreProyecto || '';
            document.getElementById('cfFormaPago').value = c.FormaPago || '';
            document.getElementById('cfFecha').value = (c.Fecha || '').substring(0, 10);
            document.getElementById('cfFechaVigencia').value = (c.FechaVigencia || '').substring(0, 10);
            document.getElementById('cfTiempoEntrega').value = c.TiempoEntregaDias || '';
            document.getElementById('cfIncluyeIVA').checked = !!Number(c.IncluyeIVA ?? 1);
            document.getElementById('cfProbabilidadCierre').value = c.ProbabilidadCierre ?? 50;
            document.getElementById('cfOrigenProspecto').value = c.OrigenProspecto || '';
            document.getElementById('cfObservaciones').value = c.Observaciones || '';

            (detalle || []).forEach((d) => agregarFilaDetalle(d));
            if (!detalle || !detalle.length) agregarFilaDetalle();

            (actividades || []).forEach((a) => agregarFilaActividad(a));

        } catch (error) {
            ocultarFormulario();
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cargar la cotización.' });
        }
    }

    function ocultarFormulario() {
        document.getElementById('cfCardFormulario').style.display = 'none';
        document.getElementById('cfCardListado').style.display = '';
    }

    function agregarFilaDetalle(d = {}) {
        const tbody = document.querySelector('#cfTablaDetalle tbody');
        const tr = document.createElement('tr');
        tr.dataset.detalleId = d.CotizacionDetalleID || 0;

        const tipoDescuento = (d.TipoDescuento === '%' || d.TipoDescuento === 'PORCENTAJE') ? 'PORCENTAJE' : 'IMPORTE';
        const unidadActual = (d.Unidad || '').toUpperCase();
        const opcionesUnidad = CF_UNIDADES.map((u) =>
            `<option value="${u}" ${u === unidadActual ? 'selected' : ''}>${u}</option>`
        ).join('');
        // Si la unidad guardada no está en el catálogo (dato histórico), se agrega como opción extra para no perderla
        const opcionExtra = (unidadActual && !CF_UNIDADES.includes(unidadActual))
            ? `<option value="${escapeAttr(unidadActual)}" selected>${escapeHtml(unidadActual)}</option>`
            : '';

        tr.innerHTML = `
            <td><input class="form-control form-control-sm cf-det-descripcion" value="${escapeAttr(d.Descripcion || '')}"></td>
            <td>
                <select class="form-select form-select-sm cf-det-unidad">
                    <option value="">Selecciona...</option>
                    ${opcionExtra}
                    ${opcionesUnidad}
                </select>
            </td>
            <td><input type="number" min="0" step="0.01" class="form-control form-control-sm cf-det-cantidad" value="${d.Cantidad ?? 1}"></td>
            <td><input type="number" min="0" step="0.01" class="form-control form-control-sm cf-det-precio" value="${d.PrecioUnitario ?? 0}"></td>
            <td><input type="number" min="0" step="0.01" class="form-control form-control-sm cf-det-costo" value="${d.CostoEstimado ?? 0}"></td>
            <td>
                <select class="form-select form-select-sm cf-det-tipo-descuento">
                    <option value="IMPORTE" ${tipoDescuento === 'IMPORTE' ? 'selected' : ''}>$</option>
                    <option value="PORCENTAJE" ${tipoDescuento === 'PORCENTAJE' ? 'selected' : ''}>%</option>
                </select>
            </td>
            <td>
                <input type="number" min="0" step="0.01" class="form-control form-control-sm cf-det-descuento" value="${d.Descuento ?? 0}">
                <div class="form-text cf-det-descuento-ayuda" style="font-size:0.68rem"></div>
            </td>
            <td><input class="form-control form-control-sm cf-det-comentarios" value="${escapeAttr(d.Comentarios || '')}"></td>
            <td class="text-center"><button type="button" class="btn btn-sm text-danger" data-quitar-fila><i class="bi bi-x-lg"></i></button></td>
        `;

        tbody.appendChild(tr);
        actualizarTopeDescuento(tr);
    }

    function agregarFilaActividad(a = {}) {
        const tbody = document.querySelector('#cfTablaActividades tbody');
        const tr = document.createElement('tr');
        tr.dataset.actividadId = a.CotizacionActividadID || 0;
        tr.dataset.codigoWbs = a.CodigoWBS || '';

        tr.innerHTML = `
            <td><input class="form-control form-control-sm cf-act-nombre" value="${escapeAttr(a.NombreActividad || '')}"></td>
            <td><input class="form-control form-control-sm cf-act-descripcion" value="${escapeAttr(a.Descripcion || '')}"></td>
            <td><input type="date" class="form-control form-control-sm cf-act-inicio" value="${(a.InicioPlan || '').substring(0, 10)}"></td>
            <td><input type="date" class="form-control form-control-sm cf-act-fin" value="${(a.FinPlan || '').substring(0, 10)}"></td>
            <td><input type="number" min="0" class="form-control form-control-sm cf-act-duracion" value="${a.DuracionPlan ?? 1}"></td>
            <td><input type="number" min="0" class="form-control form-control-sm cf-act-horas" value="${a.HorasPlaneadas ?? ''}"></td>
            <td class="text-center"><button type="button" class="btn btn-sm text-danger" data-quitar-fila><i class="bi bi-x-lg"></i></button></td>
        `;

        tbody.appendChild(tr);
    }

    function recolectarDetalle() {
        return Array.from(document.querySelectorAll('#cfTablaDetalle tbody tr')).map((tr, i) => ({
            CotizacionDetalleID: Number(tr.dataset.detalleId) || 0,
            ConceptoID: null,
            NumeroPartida: i + 1,
            Descripcion: tr.querySelector('.cf-det-descripcion').value.trim(),
            Unidad: tr.querySelector('.cf-det-unidad').value.trim(),
            Cantidad: Number(tr.querySelector('.cf-det-cantidad').value) || 0,
            PrecioUnitario: Number(tr.querySelector('.cf-det-precio').value) || 0,
            CostoEstimado: Number(tr.querySelector('.cf-det-costo').value) || 0,
            TipoDescuento: tr.querySelector('.cf-det-tipo-descuento').value,
            Descuento: Number(tr.querySelector('.cf-det-descuento').value) || 0,
            Comentarios: tr.querySelector('.cf-det-comentarios').value.trim()
        }));
    }

    function recolectarActividades() {
        return Array.from(document.querySelectorAll('#cfTablaActividades tbody tr')).map((tr, i) => ({
            CotizacionActividadID: Number(tr.dataset.actividadId) || 0,
            NumeroActividad: i + 1,
            CodigoWBS: tr.dataset.codigoWbs || '',
            NombreActividad: tr.querySelector('.cf-act-nombre').value.trim(),
            Descripcion: tr.querySelector('.cf-act-descripcion').value.trim(),
            InicioPlan: tr.querySelector('.cf-act-inicio').value || null,
            FinPlan: tr.querySelector('.cf-act-fin').value || null,
            DuracionPlan: Number(tr.querySelector('.cf-act-duracion').value) || 0,
            HorasPlaneadas: Number(tr.querySelector('.cf-act-horas').value) || 0,
            Estado: 'PLANEADA',
            OrdenVisual: i + 1
        }));
    }

    async function guardarCotizacion() {
        limpiarErroresFormulario();

        const clienteID = document.getElementById('cfClienteID').value;
        const nombreProyecto = document.getElementById('cfNombreProyecto').value.trim();
        const fecha = document.getElementById('cfFecha').value;
        const fechaVigencia = document.getElementById('cfFechaVigencia').value;
        const detalle = recolectarDetalle();

        const errores = [];

        if (!clienteID) {
            marcarInvalido('cfClienteID');
            errores.push('Selecciona un Cliente.');
        }
        if (!nombreProyecto) {
            marcarInvalido('cfNombreProyecto');
            errores.push('Captura el Nombre / Descripción del trabajo.');
        }
        if (!fecha) {
            marcarInvalido('cfFecha');
            errores.push('Captura la Fecha.');
        }
        if (!fechaVigencia) {
            marcarInvalido('cfFechaVigencia');
            errores.push('Captura la Vigencia.');
        }

        if (!detalle.length) {
            errores.push('Agrega al menos una partida.');
        } else {
            const filasDetalle = document.querySelectorAll('#cfTablaDetalle tbody tr');
            detalle.forEach((d, i) => {
                const tr = filasDetalle[i];
                if (!d.Descripcion) {
                    tr.querySelector('.cf-det-descripcion').classList.add('is-invalid');
                    errores.push(`Partida ${i + 1}: falta la Descripción.`);
                }
                if (!d.Unidad) {
                    tr.querySelector('.cf-det-unidad').classList.add('is-invalid');
                    errores.push(`Partida ${i + 1}: falta la Unidad.`);
                }
                if (!d.Cantidad || d.Cantidad <= 0) {
                    tr.querySelector('.cf-det-cantidad').classList.add('is-invalid');
                    errores.push(`Partida ${i + 1}: la Cantidad debe ser mayor a cero.`);
                }

                const importeBase = d.Cantidad * d.PrecioUnitario;

                if (d.TipoDescuento === 'PORCENTAJE' && d.Descuento > 100) {
                    tr.querySelector('.cf-det-descuento').classList.add('is-invalid');
                    errores.push(`Partida ${i + 1}: el Descuento en % no puede ser mayor a 100%.`);
                }

                if (d.TipoDescuento === 'IMPORTE' && d.Descuento > importeBase) {
                    tr.querySelector('.cf-det-descuento').classList.add('is-invalid');
                    errores.push(`Partida ${i + 1}: el Descuento en monto (${d.Descuento.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}) no puede ser mayor al importe de la partida (${importeBase.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}).`);
                }
            });
        }

        if (errores.length) {
            return Swal.fire({
                icon: 'warning',
                title: 'Revisa el formulario',
                html: `<ul style="text-align:left">${errores.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
            });
        }

        const incluyeIVA = document.getElementById('cfIncluyeIVA').checked;

        const payload = {
            metadata: {
                Operacion: cotizacionEnEdicionID ? 'UPDATE' : 'INSERT',
                Origen: 'WEB',
                UsuarioID: CF_USUARIO_ID || 1,
                Usuario: CF_USUARIO_NOMBRE || 'web',
                VersionCliente: '1.0',
                Fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
                RequestId: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
                GenerarVersion: true
            },
            cotizacion: {
                CotizacionID: cotizacionEnEdicionID || 0,
                EmpresaID: CF_EMPRESA_ID || 1,
                SucursalID: 1,
                ClienteID: Number(clienteID),
                ClienteContactoID: null,
                TipoCotizacionID: 1,
                Folio: null,
                NombreProyecto: nombreProyecto,
                DescripcionTrabajo: nombreProyecto,
                Atencion: document.getElementById('cfAtencion').value.trim(),
                Fecha: fecha,
                FechaVigencia: fechaVigencia,
                MonedaID: 1,
                TipoCambio: 1,
                FormaPago: document.getElementById('cfFormaPago').value.trim(),
                IncluyeIVA: incluyeIVA,
                PorcentajeIVA: incluyeIVA ? 16 : 0,
                TiempoEntregaDias: Number(document.getElementById('cfTiempoEntrega').value) || null,
                ProbabilidadCierre: Number(document.getElementById('cfProbabilidadCierre').value) || 0,
                OrigenProspecto: document.getElementById('cfOrigenProspecto').value.trim() || null,
                EstadoCotizacionID: Number(document.getElementById('cfEstadoCotizacionID').value),
                MotivoRechazo: '',
                Observaciones: document.getElementById('cfObservaciones').value.trim()
            },
            detalle: detalle,
            actividades: recolectarActividades()
        };

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/cotizaciones/persist`, payload);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Cotización guardada', timer: 1300, showConfirmButton: false });
            ocultarFormulario();
            recargar();

            const cotizacionGuardadaID = resp.data.data?.CotizacionID || cotizacionEnEdicionID;
            if (cotizacionGuardadaID) imprimirCotizacion(cotizacionGuardadaID);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible guardar la cotización.' });
        }
    }

    function marcarInvalido(id) {
        document.getElementById(id)?.classList.add('is-invalid');
    }

    function limpiarErroresFormulario() {
        document.querySelectorAll('#cfCardFormulario .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    }

    function escapeAttr(texto) {
        return escapeHtml(texto).replace(/"/g, '&quot;');
    }

    // ---- Cambiar Estado ----
    async function cambiarEstadoCotizacion(cotizacionID) {
        const opciones = estadosLista
            .filter((e) => e.Codigo !== 'CONVERTIDA_PROYECTO') // esa conversión tiene su propio flujo (venta -> proyecto)
            .map((e) => `<option value="${e.EstadoCotizacionID}">${escapeHtml(e.NombreEstado)}</option>`)
            .join('');

        const { value: formValues } = await Swal.fire({
            title: 'Cambiar estado',
            html: `
                <div class="text-start">
                    <label class="form-label mb-1" style="font-size:0.85rem">Nuevo estado</label>
                    <select id="swalEstado" class="form-select mb-3">
                        <option value="">Selecciona un estado</option>
                        ${opciones}
                    </select>
                    <label class="form-label mb-1" style="font-size:0.85rem">Observación (opcional)</label>
                    <textarea id="swalComentarios" class="form-control" rows="3" placeholder="Comentario sobre el cambio de estado..."></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const estadoID = document.getElementById('swalEstado').value;
                const comentarios = document.getElementById('swalComentarios').value;

                if (!estadoID) {
                    Swal.showValidationMessage('Selecciona un estado.');
                    return false;
                }

                return { estadoID, comentarios };
            }
        });

        if (!formValues) return; // canceló

        try {
            const resp = await axios.put(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}/estado`, {
                EstadoCotizacionID: Number(formValues.estadoID),
                Comentarios: formValues.comentarios || ''
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cambiar el estado', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1200, showConfirmButton: false });
            recargar();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible cambiar el estado.' });
        }
    }

    // ---- Eliminar ----
    async function eliminarCotizacion(cotizacionID) {
        const fila = (ultimasCotizaciones || []).find((c) => String(c.CotizacionID) === String(cotizacionID));
        const reglas = reglasEstadoCotizacion(estadosPorID[fila?.EstadoCotizacionID]);

        if (!reglas.eliminable) {
            return Swal.fire({
                icon: 'info',
                title: 'No eliminable',
                text: 'Solo las cotizaciones en Borrador pueden eliminarse desde esta pantalla.'
            });
        }

        const confirmacion = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar cotización?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.delete(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: resp.data.message || '' });
            }

            await Swal.fire({ icon: 'success', title: 'Cotización eliminada', timer: 1200, showConfirmButton: false });
            recargar();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible eliminar la cotización.' });
        }
    }



    // ---- Duplicar (COT-039) ----
    async function duplicarCotizacion(cotizacionID) {
        const confirmacion = await Swal.fire({
            icon: 'question',
            title: '¿Duplicar cotización?',
            text: 'Se creará una nueva cotización en Borrador con las mismas partidas y actividades.',
            showCancelButton: true,
            confirmButtonText: 'Sí, duplicar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}/duplicar`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo duplicar', text: resp.data.message || '' });
            }

            const nuevaID = resp.data.data?.CotizacionIDNueva;
            const folio = resp.data.data?.Folio;

            await Swal.fire({
                icon: 'success',
                title: 'Cotización duplicada',
                text: folio ? `Se creó ${folio} como Borrador.` : 'Se creó la nueva cotización como Borrador.',
                timer: 1800,
                showConfirmButton: false
            });

            await recargar();

            if (nuevaID) mostrarFormulario(nuevaID);

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible duplicar la cotización.' });
        }
    }

    function quitarHtml(html) {
        return html.replace(/<[^>]+>/g, '');
    }

    function formatearFechaSimple(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return valor;

        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        return `${String(fecha.getDate()).padStart(2, '0')} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
    }

    function badgeEstado(nombre, colorHex) {
        return `<span class="cf-badge" style="background:${colorHex}22;color:${colorHex}">${escapeHtml(nombre)}</span>`;
    }

    function formatearFolioCorto(folio) {
        if (!folio) return '—';

        // "ROM01-COT-000024" -> "COT-24" (quita el prefijo de empresa y los ceros a la izquierda)
        const partes = folio.split('-');
        if (partes.length < 3) return folio;

        const tipo = partes[1];
        const numero = parseInt(partes[2], 10);

        if (isNaN(numero)) return folio;

        return `${tipo}-${numero}`;
    }

    function formatearFecha(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function formatearMoneda(valor, moneda) {
        const numero = Number(valor || 0);
        return `<span class="cf-total-venta">${numero.toLocaleString('es-MX', {
            style: 'currency',
            currency: moneda || 'MXN'
        })}</span>`;
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }
});
