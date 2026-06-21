<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Helpers/JwtHelper.php';
require_once '../app/Middleware/JwtMiddleware.php';

use App\Middleware\JwtMiddleware;

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODAzOTQyLCJleHAiOjE3ODE4MzI3NDJ9.-PLNXOs5E2LaKWrGDL2oG9nHoGK8u5TkgQKvcaM4ETI';

$usuario = JwtMiddleware::handle();

echo '<pre>';

print_r($usuario);