<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../bootstrap.php';

/*
|--------------------------------------------------------------------------
| TOKEN JWT VIGENTE
|--------------------------------------------------------------------------
*/

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODA0OTYzLCJleHAiOjE3ODE4MzM3NjN9.gJ_BVwgNWSdSH4-FcE-Sl6bQACGUQgk-bTcinx981rU';

/*
|--------------------------------------------------------------------------
| DATOS A MODIFICAR
|--------------------------------------------------------------------------
*/

$_POST['RFC'] =
'XAXX010101000';

$_POST['NombreCliente'] =
'CLIENTE DEMO 1 MODIFICADO';

$_POST['ContactoPrincipal'] =
'SALVADOR MORALES';

$_POST['Telefono'] =
'3333333333';

$_POST['Correo'] =
'cliente.modificado@demo.com';

$_POST['Direccion'] =
'GUADALAJARA JALISCO';

$_POST['LimiteCredito'] =
50000;

$_POST['DiasCredito'] =
45;

$_POST['Observaciones'] =
'Cliente actualizado desde prueba';

/*
|--------------------------------------------------------------------------
| ACTUALIZAR CLIENTE
|--------------------------------------------------------------------------
*/

$controller =
    new \App\Controllers\ClienteController();

/*
| ClienteID = 9
| Cambia el número si deseas actualizar otro registro
*/

$controller->update(9);