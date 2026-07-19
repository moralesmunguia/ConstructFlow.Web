<?php
/**
 * Componente: navbar.php
 * Barra superior: usuario en sesión, notificaciones, cerrar sesión.
 */
?>
<header class="cf-navbar">
    <button class="cf-navbar-toggle d-lg-none" id="btnToggleSidebar">
        <i class="bi bi-list"></i>
    </button>

    <div class="cf-navbar-right">
        <button class="cf-navbar-icon-btn" title="Notificaciones">
            <i class="bi bi-bell"></i>
        </button>

        <div class="dropdown cf-navbar-user">
            <a href="#" class="dropdown-toggle" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle"></i>
                <span><?= htmlspecialchars(is_array($usuario ?? null) ? ($usuario['Nombre'] ?? 'Usuario') : ($usuario ?? 'Usuario')) ?></span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="<?= BASE_URL ?>/index.php?modulo=perfil"><i class="bi bi-person"></i> Mi perfil</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="<?= BASE_URL ?>/logout.php"><i class="bi bi-box-arrow-right"></i> Cerrar sesión</a></li>
            </ul>
        </div>
    </div>
</header>
