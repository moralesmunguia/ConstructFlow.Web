/**
 * auditoria.js
 * Ref: DEF-WEB-022 (API Auditoría) -- la bitacora es INMUTABLE: esta
 * pantalla solo consulta y exporta, no hay crear/editar/eliminar.
 *
 * GET  {CF_API_BASE_URL}/auditoria                        -> listado general (filtrado en cliente por fecha)
 * GET  {CF_API_BASE_URL}/auditoria/usuarios/{id}
 * GET  {CF_API_BASE_URL}/auditoria/proyectos/{id}
 * GET  {CF_API_BASE_URL}/auditoria/modulos/{modulo}
 * GET  {CF_API_BASE_URL}/auditoria/eventos                -> catalogo de acciones (informativo, no se usa como filtro por ahora)
 * GET  {CF_API_BASE_URL}/auditoria/{id}                   -> detalle (modal)
 * POST {CF_API_BASE_URL}/auditoria/exportar                -> CSV (blob)  Body: { usuarioId, modulo, proyectoId, fechaDesde, fechaHasta }
 * GET  {CF_API_BASE_URL}/usuarios                          -> combo de filtro
 * GET  {CF_API_BASE_URL}/proyectos                         -> combo de filtro
 */

document.addEventListener('DOMContentLoaded', () => {

    let dataTable = null;

    cargarCatalogos();
    buscar();

    document.getElementById('btnBuscarAuditoria')?.addEventListener('click', buscar);
    document.getElementById('btnExportarAuditoriaCsv')?.addEventListener('click', exportarCsv);

    document.getElementById('cfTablaAuditoria')?.addEventListener('click', (e) => {
        const btnDetalle = e.target.closest('[data-ver-auditoria]');
        if (btnDetalle) return verDetalle(btnDetalle.dataset.verAuditoria);
    });

    async function cargarCatalogos() {
        try {
            const [usuarios, proyectos] = await Promise.all([
                axios.get(`${CF_API_BASE_URL}/usuarios`),
                axios.get(`${CF_API_BASE_URL}/proyectos`)
            ]);

            const selectUsuario = document.getElementById('cfFiltroUsuario');
            (usuarios.data.data || []).forEach((u) => {
                selectUsuario.insertAdjacentHTML('beforeend',
                    `<option value="${u.UsuarioID}">${escapeHtml(u.NombreCompleto || u.Nombre || `Usuario #${u.UsuarioID}`)}</option>`);
            });

            const selectProyecto = document.getElementById('cfFiltroProyecto');
            (proyectos.data.data || []).forEach((p) => {
                selectProyecto.insertAdjacentHTML('beforeend',
                    `<option value="${p.ProyectoID}">${escapeHtml(p.NombreProyecto || `Proyecto #${p.ProyectoID}`)}</option>`);
            });
        } catch (error) {
            console.error('Error al cargar catálogos de auditoría:', error);
        }

        // Módulos: catálogo cerrado y estable (mismo criterio que otras
        // pantallas -- no hay endpoint de catálogo de módulos, así que se
        // listan los que existen como Modulo en cf_auditoria hoy en dia).
        const selectModulo = document.getElementById('cfFiltroModulo');
        ['PROYECTOS', 'ACTIVIDADES', 'COTIZACIONES', 'FACTURACION', 'PAGOS',
         'DOCUMENTOS', 'EVIDENCIAS', 'USUARIOS', 'CONFIGURACION'].forEach((m) => {
            selectModulo.insertAdjacentHTML('beforeend', `<option value="${m}">${m}</option>`);
        });
    }

    function leerFiltros() {
        return {
            usuarioId: document.getElementById('cfFiltroUsuario').value || null,
            modulo: document.getElementById('cfFiltroModulo').value || null,
            proyectoId: document.getElementById('cfFiltroProyecto').value || null,
            fechaDesde: document.getElementById('cfFiltroFechaDesde').value || null,
            fechaHasta: document.getElementById('cfFiltroFechaHasta').value || null
        };
    }

    // ---- Buscar: elige el endpoint mas especifico segun los filtros
    // activos (usuario > proyecto > modulo > general), y filtra fechas
    // en cliente ya que esos endpoints especificos no aceptan rango de
    // fecha -- solo /auditoria/exportar lo soporta en el API. ----
    async function buscar() {
        if (!dataTable) {
            dataTable = cfInitDataTable('#cfTablaAuditoria', { order: [[0, 'desc']] });
        }

        const filtros = leerFiltros();

        try {
            let url = `${CF_API_BASE_URL}/auditoria`;
            if (filtros.usuarioId) url = `${CF_API_BASE_URL}/auditoria/usuarios/${filtros.usuarioId}`;
            else if (filtros.proyectoId) url = `${CF_API_BASE_URL}/auditoria/proyectos/${filtros.proyectoId}`;
            else if (filtros.modulo) url = `${CF_API_BASE_URL}/auditoria/modulos/${filtros.modulo}`;

            const resp = await axios.get(url, { params: { limite: 200 } });

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar la bitácora', text: resp.data.message || '' });
            }

            let filas = resp.data.data || [];

            if (filtros.fechaDesde) {
                filas = filas.filter((f) => f.FechaHora && f.FechaHora >= filtros.fechaDesde);
            }
            if (filtros.fechaHasta) {
                filas = filas.filter((f) => f.FechaHora && f.FechaHora <= (filtros.fechaHasta + ' 23:59:59'));
            }

            pintarFilas(filas);

        } catch (error) {
            console.error('Error al cargar la bitácora de auditoría:', error);
            Swal.fire({ icon: 'error', title: 'Error al cargar la bitácora', text: error.response?.data?.message || 'No fue posible conectar con el servidor.' });
        }
    }

    function pintarFilas(filas) {
        dataTable.clear();
        filas.forEach((a) => dataTable.row.add(construirFila(a)));
        dataTable.draw();
    }

    function construirFila(a) {
        return [
            formatearFechaHora(a.FechaHora),
            escapeHtml(a.UsuarioNombre || (a.UsuarioID ? `Usuario #${a.UsuarioID}` : '—')),
            escapeHtml(a.Modulo || '—'),
            escapeHtml([a.Entidad, a.EntidadID].filter(Boolean).join(' #')) || '—',
            escapeHtml(a.Accion || '—'),
            construirBadgeNivel(a.Nivel),
            escapeHtml(a.IP || '—'),
            `<div class="cf-row-actions text-end">
                <button type="button" class="btn btn-cf-secondary btn-sm" title="Ver detalle" data-ver-auditoria="${a.AuditoriaID}"><i class="bi bi-eye"></i></button>
            </div>`
        ];
    }

    function construirBadgeNivel(nivel) {
        const colores = {
            CRITICO: '#EF4444',
            FINANCIERO: '#F97316',
            OPERATIVO: '#0B69D4',
            INFORMATIVO: '#6B7280'
        };
        const color = colores[nivel] || '#6B7280';
        return `<span class="cf-badge" style="background:${color}22;color:${color}">${escapeHtml(nivel || '—')}</span>`;
    }

    // ---- Detalle ----
    async function verDetalle(auditoriaID) {
        try {
            const resp = await axios.get(`${CF_API_BASE_URL}/auditoria/${auditoriaID}`);

            if (!resp.data.success) {
                return Swal.fire({ icon: 'error', title: 'No se pudo cargar el detalle', text: resp.data.message || '' });
            }

            const a = resp.data.data || {};
            const campos = [
                ['Fecha', formatearFechaHora(a.FechaHora)],
                ['Usuario', a.UsuarioNombre || (a.UsuarioID ? `Usuario #${a.UsuarioID}` : '—')],
                ['Módulo', a.Modulo],
                ['Entidad', [a.Entidad, a.EntidadID].filter(Boolean).join(' #')],
                ['Acción', a.Accion],
                ['Nivel', a.Nivel],
                ['IP', a.IP],
                ['Valor anterior', formatearValorJson(a.ValorAnterior)],
                ['Valor nuevo', formatearValorJson(a.ValorNuevo)]
            ];

            const filasHtml = campos.map(([etiqueta, valor]) => `<tr>
                <td class="text-muted" style="padding:6px 8px;width:160px">${escapeHtml(etiqueta)}</td>
                <td style="padding:6px 8px"><strong>${escapeHtml(valor ?? '—')}</strong></td>
            </tr>`).join('');

            // Nivel/IP/Valor anterior/Valor nuevo vienen vacíos en los
            // registros que no pasaron por AuditoriaService::registrar()
            // (p. ej. los generados por un mecanismo externo a la app,
            // como un trigger de BD sobre CF_Proyecto) -- se avisa para
            // que no se lea como un error de la pantalla.
            const esRegistroLimitado = !a.Nivel && !a.IP && !a.ValorAnterior && !a.ValorNuevo;
            const nota = esRegistroLimitado
                ? `<p class="text-muted" style="font-size:0.8rem;margin-top:10px">
                     Este registro no incluye Nivel/IP/valores porque se generó fuera del
                     flujo estándar de auditoría de la aplicación (no vía AuditoriaService).
                   </p>`
                : '';

            Swal.fire({
                title: `Auditoría #${auditoriaID}`,
                width: 640,
                html: `<div class="text-start cf-table-wrap"><table class="cf-table"><tbody>${filasHtml}</tbody></table></div>${nota}`,
                confirmButtonText: 'Cerrar'
            });

        } catch (error) {
            console.error('Error al cargar el detalle de auditoría:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No fue posible conectar con el servidor.' });
        }
    }

    // ---- Exportar CSV ----
    async function exportarCsv() {
        const filtros = leerFiltros();

        try {
            const resp = await axios.post(`${CF_API_BASE_URL}/auditoria/exportar`, filtros, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Bitacora_Auditoria.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error('Error al exportar la bitácora:', error);

            let mensaje = 'No fue posible generar el archivo.';
            if (error.response?.data instanceof Blob) {
                try {
                    const texto = await error.response.data.text();
                    mensaje = JSON.parse(texto)?.message || mensaje;
                } catch (e) { /* deja el mensaje por defecto */ }
            } else {
                mensaje = error.response?.data?.message || mensaje;
            }

            Swal.fire({ icon: 'error', title: 'Error al exportar', text: mensaje });
        }
    }

    // ---- Helpers ----
    function formatearValorJson(valor) {
        if (!valor) return null;
        try {
            return JSON.stringify(JSON.parse(valor), null, 2);
        } catch (e) {
            return valor;
        }
    }

    function formatearFechaHora(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor.replace(' ', 'T'));
        if (isNaN(fecha.getTime())) return escapeHtml(valor);
        return fecha.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }
});
