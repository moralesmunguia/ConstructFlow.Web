/**
 * datatable.js
 * Inicializador genérico de DataTables para todos los módulos.
 * Ref: DEF-WEB-000 sección 16 (búsqueda, orden, paginación y exportación).
 *
 * Uso:
 *   cfInitDataTable('#tblCotizaciones', { order: [[0, 'desc']] });
 */
function cfInitDataTable(selector, options) {
    options = options || {};

    return $(selector).DataTable(Object.assign({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.11/i18n/es-MX.json'
        },
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [],
        dom:
            "<'row mb-2'<'col-sm-6'l><'col-sm-6'f>>" +
            "t" +
            "<'row mt-2 align-items-center'<'col-sm-6'i><'col-sm-6'p>>"
    }, options));
}
