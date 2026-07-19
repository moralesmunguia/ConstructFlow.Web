<?php
/**
 * logout.php
 * Destruye la sesión PHP y redirige al login.
 * El token JWT en el navegador (localStorage/sessionStorage) se limpia
 * desde el propio login.js/menu.js al detectar este redirect, o puedes
 * limpiarlo aquí mismo con un pequeño script antes de redirigir.
 */

session_start();
require_once __DIR__ . '/config/config.php';

session_unset();
session_destroy();

header('Location: ' . BASE_URL . '/app/views/auth/login.php');
exit;
