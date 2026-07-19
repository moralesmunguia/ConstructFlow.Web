<?php
/**
 * ConstructFlow.Web
 * Configuración general
 */

//-----------------------------------------------------
// Detectar protocolo
//-----------------------------------------------------
$protocol = (
    isset($_SERVER['HTTPS']) &&
    $_SERVER['HTTPS'] !== 'off'
) ? 'https' : 'http';

//-----------------------------------------------------
// Host actual (incluye puerto)
// Ejemplo:
// localhost:8081
// 192.168.100.96:8081
// constructflow.com
//-----------------------------------------------------
$host = $_SERVER['HTTP_HOST'];

//-----------------------------------------------------
// URLs base
//-----------------------------------------------------
define('BASE_URL', $protocol . '://' . $host . '/ConstructFlow.Web');

define('API_BASE_URL', $protocol . '://' . $host . '/ConstructFlow.Api/public/api/v1');

//-----------------------------------------------------
// Aplicación
//-----------------------------------------------------
define('APP_NAME', 'ConstructFlow');
define('APP_VERSION', '1.0.1');

date_default_timezone_set('America/Mexico_City');