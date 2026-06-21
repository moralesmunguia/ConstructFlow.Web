<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Helpers/JwtHelper.php';

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODA0ODE4LCJleHAiOjE3ODE4MzM2MTh9.ormPIZ_b9c7PtfS9kQ7vsARlF3pkARPtlDrJIAsRi_s';

$token = str_replace(
    'Bearer ',
    '',
    $_SERVER['HTTP_AUTHORIZATION']
);

echo '<pre>';

var_dump($token);

echo "\n\n";

print_r(
    \App\Helpers\JwtHelper::validateToken($token)
);