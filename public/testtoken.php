<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Helpers/JwtHelper.php';

$token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODA0OTYzLCJleHAiOjE3ODE4MzM3NjN9.gJ_BVwgNWSdSH4-FcE-Sl6bQACGUQgk-bTcinx981rU';

echo '<pre>';

$result =
    \App\Helpers\JwtHelper::validateToken(
        $token
    );

var_dump($result);

echo PHP_EOL;

print_r($result);