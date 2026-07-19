<?php
/**
 * Vista: dashboard/index.php
 * Placeholder inicial. Aquí van los widgets/KPIs de Proyectos, Cotizaciones,
 * Cobranza, etc. (Chart.js según DEF-WEB-000 sección 8).
 */
?>
<div class="cf-dashboard-welcome">
    <h1>Bienvenido, <?= htmlspecialchars(is_array($usuario ?? null) ? ($usuario['nombre'] ?? '') : ($usuario ?? '')) ?></h1>
    <p>Este es tu panel principal. Los widgets del dashboard se agregarán en la siguiente iteración.</p>
</div>
