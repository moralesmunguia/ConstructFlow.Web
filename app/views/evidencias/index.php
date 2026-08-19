<?php
/**
 * Vista: evidencias/index.php
 * Ref: DEF-WEB-015 (API Evidencias) -- pantalla independiente. El API
 * (EvidenciaController/Service/Repository) ya existia y se usaba desde el
 * modal embebido en Actividades/Proyectos (ver ACT-014 en actividades.js/
 * proyectos.js); esta vista es el listado global de TODAS las evidencias
 * de TODOS los proyectos/actividades, con filtros, subida y asociacion de
 * documento -- lo que causaba el 404 en ?modulo=evidencias.
 *
 * Consume:
 *   GET    {CF_API_BASE_URL}/evidencias?proyecto_id=&actividad_id=&tipo=&momento=
 *   GET    {CF_API_BASE_URL}/evidencias/{id}
 *   GET    {CF_API_BASE_URL}/evidencias/kpis
 *   POST   {CF_API_BASE_URL}/evidencias                 (multipart, campo 'archivo')
 *   PUT    {CF_API_BASE_URL}/evidencias/{id}
 *   DELETE {CF_API_BASE_URL}/evidencias/{id}
 *   GET    {CF_API_BASE_URL}/evidencias/{id}/descarga
 *   POST   {CF_API_BASE_URL}/evidencias/{id}/documento  { DocumentoID }
 *   GET    {CF_API_BASE_URL}/proyectos                  (catalogo filtro/alta)
 *   GET    {CF_API_BASE_URL}/proyectos/{id}/actividades (catalogo dependiente)
 *   GET    {CF_API_BASE_URL}/documentos?proyecto_id=    (catalogo para asociar)
 */
?>
<nav aria-label="breadcrumb" class="cf-breadcrumb">
    <a href="<?= BASE_URL ?>/index.php"><i class="bi bi-house-door"></i> Inicio</a>
    <span>/</span>
    <span>Evidencias</span>
</nav>

<link rel="stylesheet" href="<?= BASE_URL ?>/public/css/cf-components.css">

<div class="cf-listado-container">
<div class="cf-listado-header">
    <div>
        <h1 class="cf-listado-title">Evidencias</h1>
        <p class="cf-listado-subtitle">Fotografías, videos y documentos de avance asociados a proyectos y actividades.</p>
    </div>
    <div style="display:flex;gap:10px">
        <button type="button" class="cf-btn-secondary" id="btnReporteEvidencias" title="Selecciona un proyecto en el filtro para generarlo"><i class="bi bi-file-earmark-pdf"></i> Generar Reporte</button>
        <button type="button" class="cf-btn-primary" id="btnNuevaEvidencia"><i class="bi bi-upload"></i> Subir Evidencia</button>
    </div>
</div>

<div class="cf-resumen-grid">
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#EEF2FF;color:#0B1F47;">
            <i class="bi bi-camera-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenEvidenciasTotal">—</span>
            <span class="cf-resumen-label">Evidencias registradas</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#ECFDF5;color:#10B981;">
            <i class="bi bi-list-check"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenActividadesConEvidencia">—</span>
            <span class="cf-resumen-label">Actividades con evidencia</span>
        </div>
    </div>
    <div class="cf-resumen-card">
        <div class="cf-resumen-icon" style="background:#FFF7ED;color:#F97316;">
            <i class="bi bi-diagram-3-fill"></i>
        </div>
        <div class="cf-resumen-info">
            <span class="cf-resumen-value" id="cfResumenProyectosConEvidencia">—</span>
            <span class="cf-resumen-label">Proyectos con evidencia</span>
        </div>
    </div>
</div>

<div class="cf-card" style="margin-bottom:16px">
    <div class="cf-card-body">
        <div class="cf-field-row-3">
            <div class="cf-field-group">
                <label class="cf-label">Proyecto</label>
                <select id="cfFiltroProyectoEvidencia" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Actividad</label>
                <select id="cfFiltroActividadEvidencia" class="cf-input" style="cursor:pointer">
                    <option value="">Todas</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Tipo</label>
                <select id="cfFiltroTipoEvidencia" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                    <option value="FOTO">Foto</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENTO">Documento</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>
        </div>
        <div class="cf-field-row-3" style="margin-top:12px">
            <div class="cf-field-group">
                <label class="cf-label">Momento</label>
                <select id="cfFiltroMomentoEvidencia" class="cf-input" style="cursor:pointer">
                    <option value="">Todos</option>
                    <option value="ANTES">Antes</option>
                    <option value="DURANTE">Durante</option>
                    <option value="DESPUES">Después</option>
                </select>
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Desde</label>
                <input type="date" id="cfFiltroFechaDesdeEvidencia" class="cf-input">
            </div>
            <div class="cf-field-group">
                <label class="cf-label">Hasta</label>
                <input type="date" id="cfFiltroFechaHastaEvidencia" class="cf-input">
            </div>
        </div>
        <div class="cf-field-row" style="margin-top:12px;margin-bottom:0">
            <div class="cf-field-group cf-field-full" style="flex-direction:row;gap:8px;justify-content:flex-end">
                <button type="button" class="cf-btn-primary" id="btnFiltrarEvidencias"><i class="bi bi-search"></i> Buscar</button>
                <button type="button" class="cf-btn-secondary" id="btnLimpiarFiltrosEvidencias" title="Limpiar"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
    </div>
</div>

<div class="cf-card cf-card-table">
    <div class="cf-table-toolbar">
        <div class="cf-table-search">
            <i class="bi bi-search"></i>
            <input type="text" id="cfBuscarEvidencias" placeholder="Buscar descripción, proyecto, actividad...">
        </div>
    </div>
    <div class="cf-table-wrap">
        <table class="cf-table" id="cfTablaEvidencias" style="width:100%">
            <thead>
                <tr>
                    <th>Archivo</th>
                    <th>Proyecto</th>
                    <th>Actividad</th>
                    <th>Tipo</th>
                    <th>Momento</th>
                    <th>Descripción</th>
                    <th>Documento asociado</th>
                    <th>Capturada</th>
                    <th>Usuario</th>
                    <th class="text-end">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net@1.13.11/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@1.13.11/js/dataTables.bootstrap5.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/datatable.js"></script>
<script src="<?= BASE_URL ?>/public/js/evidencias.js"></script>
