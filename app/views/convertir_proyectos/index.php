<?php
/**
 * Vista: convertir_proyectos/index.php
 * Ref: DEF-WEB-002 (API Cotizaci\u00f3n) + DEF-WEB-003 (API Proyectos).
 *
 * Reutiliza el mismo grid de Cotizaciones, pero SOLO muestra las
 * cotizaciones en estado APROBADA (listas para convertir) o ya
 * CONVERTIDA_PROYECTO (para consulta / trazabilidad), con una
 * columna extra de N\u00famero de Proyecto.
 */
?>
<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Convertir a Proyecto</h1>
        <p class="cf-page-subtitle">Cotizaciones aprobadas listas para convertir, y las ya convertidas a proyecto.</p>
    </div>
</div>

<div class="cf-card cf-card-table" id="cfCardListado">
    <div class="table-responsive">
        <table id="tblConvertirProyectos" class="table cf-table w-100">
            <thead>
                <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Atenci\u00f3n</th>
                    <th>Descripci\u00f3n del Trabajo</th>
                    <th>Fecha</th>
                    <th>Vigencia</th>
                    <th class="text-end">Total Venta</th>
                    <th>Estado</th>
                    <th>No. Proyecto</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Filas cargadas din\u00e1micamente por convertir_proyectos.js -->
            </tbody>
        </table>
    </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/css/dataTables.bootstrap5.min.css">
<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/datatable.css">

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/convertir_proyectos.js"></script>
