<?php
/**
 * Componente: sidebar.php
 * Renderiza el menú dinámico ($menu) que entrega PermisoService::getMenu()
 * desde ConstructFlow.Api, ya filtrado por rol/permisos. Ref: DEF-WEB-003.
 */
?>
<aside class="cf-sidebar">
    <div class="cf-sidebar-logo">
        <img src="<?= BASE_URL ?>/public/img/logo.svg" alt="ConstructFlow" height="32">
        <span>ConstructFlow</span>
    </div>

    <nav class="cf-sidebar-nav">
        <ul>
            <?php foreach (($menu ?? []) as $item): ?>
                <li class="cf-menu-item">
                    <a href="<?= BASE_URL ?>/index.php?modulo=<?= urlencode($item['ModuloCodigo']) ?>">
                        <i class="bi <?= htmlspecialchars($item['Icono'] ?? 'bi-dot') ?>"></i>
                        <span><?= htmlspecialchars($item['Nombre']) ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>
</aside>
