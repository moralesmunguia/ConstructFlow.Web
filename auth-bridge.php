<?php
/**
 * auth-bridge.php
 * Puente entre la autenticación JWT (manejada en el navegador) y la sesión
 * PHP que valida index.php (DEF-WEB-003).
 *
 * El JWT en sí NO se guarda en $_SESSION por seguridad de servidor; solo
 * los datos necesarios para construir el menú y validar acceso.
 * El token se queda en localStorage/sessionStorage del navegador y se
 * manda como header Authorization en cada llamada a la API vía Axios.
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['token']) || empty($input['usuario'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Datos de sesión incompletos.'
    ]);
    exit;
}

// ---- Guardar información de sesión (DEF-WEB-003 sección 6) ----
$_SESSION['Usuario']       = $input['usuario'];
$_SESSION['EmpresaID']     = $input['empresaId'] ?? null;
$_SESSION['EmpresaNombre'] = $input['empresaNombre'] ?? null;
$_SESSION['Roles']         = $input['roles'] ?? [];
$_SESSION['Permisos']      = $input['permisos'] ?? [];
$_SESSION['Menu']          = $input['menu'] ?? null; // si la API ya lo entrega armado
$_SESSION['FechaInicio']   = date('Y-m-d H:i:s');

// El token NO se guarda en $_SESSION; vive en el cliente (localStorage/sessionStorage).
// Si se requiere para llamadas server-side (SSR a la API), se puede guardar cifrado aquí.

echo json_encode([
    'success' => true,
    'message' => 'Sesión iniciada correctamente.'
]);
