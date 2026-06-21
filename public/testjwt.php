<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Helpers/JwtHelper.php';

use App\Helpers\JwtHelper;

$usuario = [

    'UsuarioID' => 1,

    'EmpresaID' => 1,

    'RolID' => 1,

    'Nombre' => 'Administrador',

    'Correo' => 'admin@constructflow.mx'
];

$token = JwtHelper::generateToken($usuario);

echo "<h2>TOKEN</h2>";

echo "<textarea rows='8' cols='120'>";
echo $token;
echo "</textarea>";

echo "<hr>";

echo "<h2>VALIDACIÓN</h2>";

echo "<pre>";

print_r(
    JwtHelper::validateToken($token)
);

echo "</pre>";