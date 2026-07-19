<?php
/**
 * Layout: app.php
 * Ref: DEF-WEB-000 sección 11 - usado por TODAS las pantallas privadas.
 *
 * Variables esperadas (inyectadas desde routes.php / index.php):
 * - $pageTitle (string)
 * - $content   (string HTML del módulo actual)
 * - $usuario, $empresaId, $roles, $permisos, $menu
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'ConstructFlow') ?></title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/variables.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/constructflow.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/layout.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>/public/css/responsive.css">

    <script>
        // Constantes globales para los módulos (Ref: DEF-WEB-000 sección 21).
        const CF_BASE_URL     = "<?= BASE_URL ?>";
        const CF_API_BASE_URL = "<?= API_BASE_URL ?>";
    </script>
</head>
<body class="cf-app-body">

<div class="cf-app-shell">

    <!-- Barra superior: logo + menú dinámico + usuario -->
    <?php require __DIR__ . '/../components/topbar.php'; ?>

    <div class="cf-app-main">
        <!-- Breadcrumb -->
        <?php require __DIR__ . '/../components/breadcrumb.php'; ?>

        <!-- Contenido del módulo actual -->
        <main class="cf-app-content">
            <?= $content ?>
        </main>

        <?php require __DIR__ . '/../components/footer.php'; ?>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= BASE_URL ?>/public/js/helpers.js"></script>
<script src="<?= BASE_URL ?>/public/js/menu.js"></script>
<script src="<?= BASE_URL ?>/public/js/app.js"></script>
</body>
</html>
