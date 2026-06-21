<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Helpers/JwtHelper.php';

require_once '../app/Middleware/JwtMiddleware.php';
require_once '../app/Middleware/EmpresaMiddleware.php';

use App\Middleware\EmpresaMiddleware;

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODA0ODE4LCJleHAiOjE3ODE4MzM2MTh9.ormPIZ_b9c7PtfS9kQ7vsARlF3pkARPtlDrJIAsRi_s';

echo '<h3>EmpresaID</h3>';

echo EmpresaMiddleware::getEmpresaID();

echo '<hr>';

echo '<h3>UsuarioID</h3>';

echo EmpresaMiddleware::getUsuarioID();

echo '<hr>';

echo '<h3>RolID</h3>';

echo EmpresaMiddleware::getRolID();