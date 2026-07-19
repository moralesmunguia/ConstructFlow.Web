<?php
/**
 * routes.php
 * Router simple para ConstructFlow.Web.
 * Se ejecuta SOLO después de confirmar sesión activa (index.php ya validó
 * usuario, roles, permisos y menú antes de llegar aquí).
 *
 * IMPORTANTE: se rutea por el Codigo PROPIO de cada item de menú (slug),
 * NO por ModuloCodigo — varias pantallas (Usuarios/Roles/Permisos/Menús)
 * comparten el mismo permiso de módulo ("configuracion") pero son vistas
 * distintas. El permiso real se valida contra el ModuloCodigo del item
 * encontrado en $menu, no contra el slug de la URL.
 *
 * Cada item debe existir dentro de app/Views/{slug}/index.php.
 */

// ---- Determinar slug solicitado ----
// Ej: index.php?modulo=roles  ->  app/Views/roles/index.php
$modulo = strtolower($_GET['modulo'] ?? 'dashboard');

// ---- Buscar el item de menú por su slug dentro del menú real de sesión ----
// $menu viene de la API ya filtrado por permisos (PermisoService::getMenu).
// Esto reemplaza la whitelist fija: solo se puede navegar a lo que el menú
// realmente contiene para este usuario (evita path traversal / LFI vía $_GET).
$itemMenu = null;

foreach (($menu ?? []) as $item) {
    if (strtolower($item['Codigo']) === $modulo) {
        $itemMenu = $item;
        break;
    }
}

// Dashboard siempre debe poder cargar aunque no tenga fila explícita en cf_menu.
if ($modulo === 'dashboard' && !$itemMenu) {
    $itemMenu = ['Codigo' => 'DASHBOARD', 'ModuloCodigo' => 'dashboard'];
}

if (!$itemMenu) {
    http_response_code(404);
    require_once __DIR__ . '/../app/Views/errores/404.php';
    exit;
}

// ---- Validar permiso de acceso (defensa adicional al menú) ----
// $permisos viene de la API: [{ ModuloCodigo, PuedeConsultar, ... }, ...]
$moduloPermiso = $itemMenu['ModuloCodigo'] ?? null;
$tienePermiso  = $modulo === 'dashboard'; // dashboard siempre visible tras login

if (!$tienePermiso && $moduloPermiso) {
    foreach ($permisos as $permiso) {
        if (($permiso['ModuloCodigo'] ?? null) === $moduloPermiso && !empty($permiso['PuedeConsultar'])) {
            $tienePermiso = true;
            break;
        }
    }
}

if (!$tienePermiso) {
    http_response_code(403);
    require_once __DIR__ . '/../app/Views/errores/403.php';
    exit;
}

// ---- Cargar la vista del módulo dentro del layout principal ----
// Variables disponibles aquí (vienen de index.php): $usuario, $empresaId,
// $roles, $permisos, $menu.

$vistaModulo = __DIR__ . "/../app/Views/{$modulo}/index.php";

if (!file_exists($vistaModulo)) {
    http_response_code(404);
    require_once __DIR__ . '/../app/Views/errores/404.php';
    exit;
}

// Se captura el HTML del módulo para inyectarlo en el layout principal (app.php)
ob_start();
require $vistaModulo;
$contenidoModulo = ob_get_clean();

$pageTitle = ($itemMenu['Nombre'] ?? ucfirst($modulo)) . ' | ConstructFlow';
$content   = $contenidoModulo;

require_once __DIR__ . '/../app/Views/layouts/app.php';
