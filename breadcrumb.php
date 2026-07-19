<?php
/**
 * Componente: breadcrumb.php
 * Migaja de pan simple según el módulo actual ($modulo, seteado en routes.php).
 */
?>
<div class="cf-breadcrumb">
    <a href="/public/index.php?modulo=dashboard"><i class="bi bi-house"></i> Inicio</a>
    <?php if (!empty($modulo) && $modulo !== 'dashboard'): ?>
        <span class="cf-breadcrumb-sep">/</span>
        <span class="cf-breadcrumb-current"><?= htmlspecialchars(ucfirst($modulo)) ?></span>
    <?php endif; ?>
</div>
