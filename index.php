<?php
/**
 * ConstructFlow.Web
 * Front Controller
 * Ref: DEF-WEB-003 - Único punto de entrada del sistema.
 *
 * Flujo (sección 4 y 7 del documento):
 *  1. Inicializar sesión.
 *  2. Validar autenticación -> si no hay usuario, redirigir a Login.
 *  3. Obtener información del usuario.
 *  4. Consultar roles y permisos (ya vienen en sesión desde auth-bridge.php).
 *  5. Generar menú dinámico.
 *  6. Cargar Dashboard.
 */

session_start();

require_once __DIR__ . '/config/config.php'; // define BASE_URL, etc.

// ---- 2. ¿Existe usuario? ----
if (!isset($_SESSION['Usuario']) || empty($_SESSION['Usuario'])) {
    header('Location: ' . BASE_URL . '/app/views/auth/login.php');
    exit;
}

// ---- 3. Obtener información del usuario ----
$usuario     = $_SESSION['Usuario'];
$empresaId   = $_SESSION['EmpresaID']   ?? null;
$fechaInicio = $_SESSION['FechaInicio'] ?? null;

// ---- 4. Consultar roles y permisos ----
$roles    = $_SESSION['Roles']    ?? [];
$permisos = $_SESSION['Permisos'] ?? [];

// Si por alguna razón no hay permisos en sesión, no se asume acceso total:
// se fuerza re-login para evitar exponer el sistema sin autorización real.
if (empty($permisos)) {
    session_unset();
    session_destroy();
    header('Location: ' . BASE_URL . '/app/views/auth/login.php?motivo=sin_permisos');
    exit;
}

// ---- 5. Menú dinámico ----
// La API (PermisoService::getMenu) ya entrega el menú armado y filtrado por
// rol/permisos desde el login; no se recalcula aquí.
$menu = $_SESSION['Menu'] ?? [];

// ---- 6. Cargar Dashboard / enrutar ----
require_once __DIR__ . '/config/routes.php';
