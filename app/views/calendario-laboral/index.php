<?php
/**
 * Vista: calendario-laboral/index.php
 * Ref: DEF-WEB-003 (PRO-020 - Calendario laboral) + DEF-WEB-000 (Estándares Frontend).
 *
 * Configuración > Calendario Laboral: permite prender/apagar si Sábado y
 * Domingo cuentan como días laborables para la Empresa en sesión. Antes
 * solo existía lectura (GET /calendario-laboral) usada por el Gantt de
 * Proyectos; el cambio se hacía por UPDATE directo a BD.
 *
 * Consume:
 *   GET /api/v1/calendario-laboral
 *   PUT /api/v1/calendario-laboral
 */
?>
<div class="cf-page-header">
    <div>
        <h1 class="cf-page-title">Calendario Laboral</h1>
        <p class="cf-page-subtitle">Define qué días de fin de semana cuentan como laborables para la planeación y el Gantt de Proyectos.</p>
    </div>
</div>

<div class="cf-card" style="max-width:560px">
    <h2 class="cf-form-titulo mb-3">Días de fin de semana</h2>

    <div class="form-check form-switch mb-3 fs-5">
        <input class="form-check-input" type="checkbox" role="switch" id="cfSabadoLaboral">
        <label class="form-check-label" for="cfSabadoLaboral">Sábado es día laborable</label>
    </div>

    <div class="form-check form-switch mb-4 fs-5">
        <input class="form-check-input" type="checkbox" role="switch" id="cfDomingoLaboral">
        <label class="form-check-label" for="cfDomingoLaboral">Domingo es día laborable</label>
    </div>

    <div class="form-text mb-3">
        Esta configuración afecta el cálculo de duración de actividades en días hábiles
        (Gantt, reprogramación y cronograma al convertir una cotización a proyecto).
    </div>

    <button type="button" class="btn btn-cf-primary" id="btnGuardarCalendarioLaboral">
        <i class="bi bi-save"></i> Guardar
    </button>
</div>

<script src="<?= BASE_URL ?>/public/js/calendario-laboral.js"></script>
