/**
 * convertir_proyectos.js
 * Ref: DEF-WEB-002 (API Cotización) + DEF-WEB-003 (API Proyectos).
 *
 * GET  {CF_API_BASE_URL}/cotizaciones                          -> CotizacionController::index()
 * GET  {CF_API_BASE_URL}/clientes                              -> ClienteController::index()
 * GET  {CF_API_BASE_URL}/catalogos/estados-cotizacion          -> CotizacionController::catalogoEstados()
 * GET  {CF_API_BASE_URL}/proyectos/{id}                        -> ProyectoController::show()
 * GET  {CF_API_BASE_URL}/cotizaciones/{id}/pdf                 -> CotizacionController::pdf()
 * POST {CF_API_BASE_URL}/proyectos/convertir-cotizacion/{id}   -> ProyectoController::convertirCotizacion()
 *
 * Solo muestra cotizaciones en estado APROBADA (listas para convertir)
 * o CONVERTIDA_PROYECTO (ya convertidas, para trazabilidad).
 */

document.addEventListener('DOMContentLoaded', () => {

    let clientesPorID = {};
    let estadosPorID = {};
    let proyectosPorID = {};
    let usuariosCache = null;
    let dataTable = null;

    const permisos = CF_PERMISOS['convertir_proyectos'] || {
        PuedeConsultar: false, PuedeActualizar: false
    };

    cargarDatos();

    document.getElementById('tblConvertirProyectos')?.addEventListener('click', (e) => {
        const btnVer = e.target.closest('[data-ver]');
        if (btnVer) return verCotizacion(btnVer.dataset.ver);

        const btnImprimir = e.target.closest('[data-imprimir]');
        if (btnImprimir) return imprimirCotizacion(btnImprimir.dataset.imprimir);

        const btnImprimirProyecto = e.target.closest('[data-imprimir-proyecto]');
        if (btnImprimirProyecto) return imprimirProyecto(btnImprimirProyecto.dataset.imprimirProyecto);

        const btnConvertir = e.target.closest('[data-convertir]');
        if (btnConvertir) return convertirAProyecto(btnConvertir.dataset.convertir);

        const btnModificar = e.target.closest('[data-modificar]');
        if (btnModificar) return modificarCotizacion(btnModificar.dataset.modificar);
    });

    async function cargarDatos() {
        if (dataTable) {
            dataTable.destroy();
            dataTable = null;
        }

        dataTable = cfInitDataTable('#tblConvertirProyectos', { order: [] });

        try {
            const [respCotizaciones, respClientes, respEstados] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/cotizaciones`),
                axios.get(`${CF_API_BASE_URL}/clientes`),
                axios.get(`${CF_API_BASE_URL}/catalogos/estados-cotizacion`)
            ]);

            if (!respCotizaciones.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el listado', text: respCotizaciones.data.message || '' });
            }

            clientesPorID = indexarPorID(respClientes.data.data, 'ClienteID');
            estadosPorID = indexarPorID(respEstados.data.data, 'EstadoCotizacionID');

            const codigosVisibles = ['APROBADA', 'CONVERTIDA_PROYECTO'];
            const filas = (respCotizaciones.data.data || []).filter((c) => {
                const estado = estadosPorID[c.EstadoCotizacionID];
                return estado && codigosVisibles.includes(estado.Codigo);
            });

            // Trae el folio del proyecto para las ya convertidas
            await Promise.all(
                filas
                    .filter((c) => c.ProyectoID)
                    .map((c) => obtenerProyecto(c.ProyectoID))
            );

            pintarFilas(filas);

        } catch (error) {
            console.error('Error al cargar convertir_proyectos:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Ocurrió un error al conectar con el servidor.' });
        }
    }

    async function obtenerProyecto(proyectoID) {
        if (proyectosPorID[proyectoID]) return proyectosPorID[proyectoID];

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}`);
            if (resp.data.success) {
                proyectosPorID[proyectoID] = resp.data.data;
                return resp.data.data;
            }
        } catch (_) { /* ignorar */ }

        return null;
    }

    function indexarPorID(lista, campoID) {
        const mapa = {};
        (lista || []).forEach((item) => { mapa[item[campoID]] = item; });
        return mapa;
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((c) => dataTable.row.add(construirFila(c)));
        dataTable.draw();
    }

    function construirFila(c) {
        const cliente = clientesPorID[c.ClienteID];
        const estado = estadosPorID[c.EstadoCotizacionID];
        const proyecto = c.ProyectoID ? proyectosPorID[c.ProyectoID] : null;
        const esConvertida = estado?.Codigo === 'CONVERTIDA_PROYECTO';

        return [
            `<strong title="${escapeHtml(c.Folio || '')}">${escapeHtml(formatearFolioCorto(c.Folio))}</strong>`,
            escapeHtml(cliente?.NombreCliente || `Cliente #${c.ClienteID}`),
            escapeHtml(c.Atencion || '—'),
            escapeHtml(c.DescripcionTrabajo || '—'),
            formatearFecha(c.Fecha),
            formatearFecha(c.FechaVigencia),
            formatearMoneda(c.TotalVenta, c.Moneda),
            badgeEstado(estado?.NombreEstado || '', estado?.ColorHex || '#6C757D'),
            proyecto
                ? `<strong class="text-success">${escapeHtml(proyecto.CodigoProyecto || proyecto.NombreProyecto || ('#' + proyecto.ProyectoID))}</strong>`
                : (esConvertida
                    ? '<span class="cf-badge" style="background:#EF444422;color:#EF4444">Sin Proyecto</span>'
                    : '<span class="text-muted">—</span>'),
            construirAcciones(c.CotizacionID, esConvertida, c.ProyectoID)
        ];
    }

    function construirAcciones(cotizacionID, esConvertida, proyectoID) {
        const botones = [];

        if (permisos.PuedeConsultar) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Ver" data-ver="${cotizacionID}"><i class="bi bi-eye"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Imprimir Cotización" data-imprimir="${cotizacionID}"><i class="bi bi-printer"></i></button>`);

            if (esConvertida && proyectoID) {
                botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Imprimir Proyecto" data-imprimir-proyecto="${proyectoID}"><i class="bi bi-file-earmark-text"></i> Proyecto</button>`);
            }
        }

        if (permisos.PuedeActualizar && !esConvertida && !proyectoID) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Modificar Cotización" data-modificar="${cotizacionID}"><i class="bi bi-pencil"></i></button>`);
            botones.push(`<button type="button" class="btn btn-cf-primary btn-sm" title="Convertir a Proyecto" data-convertir="${cotizacionID}"><i class="bi bi-arrow-repeat"></i> Convertir</button>`);
        } else if (permisos.PuedeActualizar && (esConvertida || proyectoID)) {
            botones.push(`<button type="button" class="btn btn-cf-secondary btn-sm" title="Cotización ya convertida: no se permite segunda conversión" disabled><i class="bi bi-lock"></i></button>`);
        }

        return `<div class="cf-row-actions text-end">${botones.join('')}</div>`;
    }

    // ---- Ver (mismo formato de documento que usa Cotizaciones, + Actividades) ----
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

    function logoEmpresaHtml(empresa) {
        const url = (empresa?.LogoURL || '').trim();

        if (/^https?:\/\//i.test(url)) {
            return `<img src="${url}" alt="Logo" class="cf-cot-logo-img">`;
        }

        if (url) {
            return `<img src="${CF_BASE_URL}/public/${url.replace(/^\//, '')}" alt="Logo" class="cf-cot-logo-img">`;
        }

        if (Number(empresa?.EmpresaID) === 1) {
            return `<img src="${CF_BASE_URL}/public/img/logo_ROM.jpg" alt="ROM" class="cf-cot-logo-img">`;
        }
        return `<div class="cf-cot-logo-box">LOGO</div>`;
    }

    function construirHtmlCotizacion(datos, empresa) {
        const c = datos.cotizacion;
        const cliente = clientesPorID[c.ClienteID];
        const estado = estadosPorID[c.EstadoCotizacionID];

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

        const filasActividades = (datos.actividades || []).map((a, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(a.NombreActividad || '')}</td>
                <td>${escapeHtml(a.Descripcion || '')}</td>
                <td class="text-center">${escapeHtml((a.InicioPlan || '').substring(0, 10) || '—')}</td>
                <td class="text-center">${escapeHtml((a.FinPlan || '').substring(0, 10) || '—')}</td>
                <td class="text-end">${a.DuracionPlan ?? 0}</td>
                <td class="text-end">${a.HorasPlaneadas ?? 0}</td>
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

                <div class="cf-cot-subtitulo">ACTIVIDADES CAPTURADAS</div>

                <table class="cf-cot-tabla">
                    <thead>
                        <tr>
                            <th class="text-center">No.</th>
                            <th class="text-center">Actividad</th>
                            <th class="text-center">Descripción</th>
                            <th class="text-center">Inicio Plan</th>
                            <th class="text-center">Fin Plan</th>
                            <th class="text-center">Duración</th>
                            <th class="text-center">Horas Plan.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasActividades || '<tr><td colspan="7">Sin actividades registradas.</td></tr>'}
                    </tbody>
                </table>

                ${sitioWeb ? `<div class="cf-cot-pie-pagina">${escapeHtml(sitioWeb)}</div>` : ''}
            </div>
        `;
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
        .cf-cot-subtitulo { font-weight: 800; color: #0B1F47; font-size: 0.8rem; margin: 16px 0 6px; text-transform: uppercase; }
        .cf-cot-tabla { width: 100%; border-collapse: collapse; font-size: 0.8rem; table-layout: fixed; margin-bottom: 4px; }
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

    async function verCotizacion(cotizacionID) {
        try {
            const datos = await obtenerCotizacionCompleta(cotizacionID);
            const empresa = await obtenerEmpresa(datos.cotizacion.EmpresaID);

            Swal.fire({
                title: false,
                width: 1000,
                showCloseButton: true,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                html: `<style>${CF_COT_ESTILOS}</style>${construirHtmlCotizacion(datos, empresa)}`
            });

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No encontrada', text: error.response?.data?.message || error.message || 'No fue posible cargar la cotización.' });
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

    // ---- Imprimir (mismo PDF de servidor que usa Cotizaciones) ----
    async function imprimirCotizacion(cotizacionID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/cotizaciones/${cotizacionID}/pdf`, { responseType: 'blob' });
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

    // ---- Convertir a Proyecto ----
    async function obtenerUsuariosActivos() {
        if (usuariosCache) return usuariosCache;

        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/usuarios`);
            usuariosCache = resp.data.success ? (resp.data.data || []) : [];
        } catch (_) {
            usuariosCache = [];
        }

        return usuariosCache;
    }

    async function convertirAProyecto(cotizacionID) {
        const hoy = new Date().toISOString().substring(0, 10);
        const usuarios = await obtenerUsuariosActivos();

        const opcionesUsuarios = usuarios
            .map(u => `<option value="${u.UsuarioID}">${escapeHtml(u.Nombre || u.NombreUsuario || `Usuario #${u.UsuarioID}`)}</option>`)
            .join('');

        const { value: formValues, isConfirmed } = await Swal.fire({
            icon: 'question',
            title: '¿Convertir a Proyecto?',
            html: `
                <p style="text-align:left">Se creará un proyecto nuevo a partir de esta cotización aprobada.</p>
                <label style="display:block;text-align:left;font-size:0.85rem;margin-top:10px">Fecha de inicio del proyecto</label>
                <input type="date" id="swalFechaInicio" class="swal2-input" value="${hoy}" min="${hoy}" style="width:90%">
                <label style="display:block;text-align:left;font-size:0.85rem;margin-top:10px">Responsable del proyecto</label>
                <select id="swalResponsable" class="swal2-input" style="width:90%">
                    <option value="">Selecciona un responsable...</option>
                    ${opcionesUsuarios}
                </select>
                <small style="display:block;text-align:left;color:#6B7280;margin-top:4px">Este responsable quedará asignado al proyecto y a todas sus actividades.</small>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sí, convertir',
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            preConfirm: () => {
                const fechaInicio = document.getElementById('swalFechaInicio').value;
                const responsableID = document.getElementById('swalResponsable').value;

                if (!fechaInicio) {
                    Swal.showValidationMessage('Debes indicar la fecha de inicio.');
                    return false;
                }

                if (!responsableID) {
                    Swal.showValidationMessage('Debes seleccionar un responsable del proyecto.');
                    return false;
                }

                return { fechaInicio, responsableID };
            }
        });

        if (!isConfirmed) return;

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/proyectos/convertir-cotizacion/${cotizacionID}`, {
                FechaInicio: formValues.fechaInicio,
                ResponsableID: formValues.responsableID
            });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo convertir', text: resp.data.message || '' });
            }

            const codigoProyecto = resp.data.data?.CodigoProyecto || resp.data.data?.ProyectoID || '';

            await Swal.fire({
                icon: 'success',
                title: 'Convertido a Proyecto',
                text: codigoProyecto ? `Proyecto generado: ${codigoProyecto}` : 'La cotización ya es un proyecto.'
            });

            cargarDatos();

        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible convertir la cotización.' });
        }
    }

    // ---- Imprimir Proyecto (PDF real generado en servidor con dompdf) ----
    async function imprimirProyecto(proyectoID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/proyectos/${proyectoID}/pdf`, { responseType: 'blob' });
            const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            let mensaje = 'No fue posible generar el PDF del proyecto.';
            if (error.response?.data instanceof Blob) {
                try {
                    const texto = await error.response.data.text();
                    mensaje = JSON.parse(texto)?.message || mensaje;
                } catch (_) { /* ignorar */ }
            }
            Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
        }
    }

    // ---- Modificar Cotización (redirige al editor de Cotizaciones) ----
    function modificarCotizacion(cotizacionID) {
        window.location.href = `${CF_BASE_URL}/index.php?modulo=cotizaciones&editar=${cotizacionID}`;
    }

    function badgeEstado(nombre, colorHex) {
        return `<span class="cf-badge" style="background:${colorHex}22;color:${colorHex}">${escapeHtml(nombre)}</span>`;
    }

    function formatearFolioCorto(folio) {
        if (!folio) return '—';
        const partes = folio.split('-');
        if (partes.length < 3) return folio;
        const numero = parseInt(partes[2], 10);
        return isNaN(numero) ? folio : `${partes[1]}-${numero}`;
    }

    function formatearFecha(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function formatearMoneda(valor, moneda) {
        const numero = Number(valor || 0);
        return `<span class="cf-total-venta">${numero.toLocaleString('es-MX', { style: 'currency', currency: moneda || 'MXN' })}</span>`;
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }
});
