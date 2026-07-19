<?php
/**
 * Componente: topbar.php
 * Barra superior horizontal: logo + menú dinámico (con submenús) + usuario.
 * Ref: DEF-WEB-003 (menú dinámico por permisos).
 *
 * $menu llega plano desde la API (PermisoService::getMenu), cada item con
 * MenuID/MenuPadreID/ModuloCodigo. Aquí se arma el árbol de 2 niveles.
 *
 * IMPORTANTE: la navegación (?modulo=...) usa el Codigo PROPIO de cada item
 * de menú (en minúsculas), NO el ModuloCodigo — varias pantallas pueden
 * compartir el mismo módulo/permiso (ej. Usuarios/Roles/Permisos/Menús
 * comparten el permiso "configuracion" pero son pantallas distintas).
 * routes.php resuelve el slug -> busca el item -> valida permiso por su
 * ModuloCodigo -> carga app/Views/{slug}/index.php.
 */

function cfConstruirArbolMenu(array $menu): array
{
    $porId = [];
    foreach ($menu as $item) {
        if ($item['MenuID'] !== null) {
            $porId[$item['MenuID']] = $item;
        }
    }

    $raiz = [];
    $hijosPorPadre = [];

    foreach ($menu as $item) {
        $padreId = $item['MenuPadreID'] ?? null;

        if ($padreId !== null && isset($porId[$padreId])) {
            $hijosPorPadre[$padreId][] = $item;
        } else {
            $raiz[] = $item;
        }
    }

    foreach ($raiz as &$item) {
        $id = $item['MenuID'] ?? null;
        $item['hijos'] = ($id !== null && isset($hijosPorPadre[$id]))
            ? $hijosPorPadre[$id]
            : [];
    }
    unset($item);

    return $raiz;
}

$cfArbolMenu = cfConstruirArbolMenu($menu ?? []);
?>
<header class="cf-topbar">
    <div class="cf-topbar-brand">
        <img src="<?= BASE_URL ?>/public/img/logo construct.png" alt="ConstructFlow" height="34">
    </div>

    <button class="cf-topbar-toggle" id="btnToggleMenu">
        <i class="bi bi-list"></i>
    </button>

    <nav class="cf-topbar-nav" id="cfTopbarNav">
        <ul>
            <?php foreach ($cfArbolMenu as $item): ?>
                <?php
                    $esGrupoPuro = empty($item['Ruta']); // grupo sin pantalla propia (ej. "Gestión Proyectos")
                    $slug = strtolower($item['Codigo']);
                ?>
                <li class="cf-menu-item <?= !empty($item['hijos']) ? 'cf-has-submenu' : '' ?>">
                    <?php if ($esGrupoPuro): ?>
                        <a href="#" class="cf-menu-group-toggle" onclick="return false;">
                            <i class="bi <?= htmlspecialchars($item['Icono'] ?? 'bi-dot') ?>"></i>
                            <span><?= htmlspecialchars($item['Nombre']) ?></span>
                            <i class="bi bi-chevron-down cf-submenu-caret"></i>
                        </a>
                    <?php else: ?>
                        <a href="<?= BASE_URL ?>/index.php?modulo=<?= urlencode($slug) ?>">
                            <i class="bi <?= htmlspecialchars($item['Icono'] ?? 'bi-dot') ?>"></i>
                            <span><?= htmlspecialchars($item['Nombre']) ?></span>
                            <?php if (!empty($item['hijos'])): ?>
                                <i class="bi bi-chevron-down cf-submenu-caret"></i>
                            <?php endif; ?>
                        </a>
                    <?php endif; ?>

                    <?php if (!empty($item['hijos'])): ?>
                        <ul class="cf-submenu">
                            <?php foreach ($item['hijos'] as $hijo): ?>
                                <li>
                                    <a href="<?= BASE_URL ?>/index.php?modulo=<?= urlencode(strtolower($hijo['Codigo'])) ?>">
                                        <i class="bi <?= htmlspecialchars($hijo['Icono'] ?? 'bi-dot') ?>"></i>
                                        <span><?= htmlspecialchars($hijo['Nombre']) ?></span>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>

    <div class="cf-topbar-right">
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
