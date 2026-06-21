<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Core/Database.php';

require_once '../app/Helpers/JwtHelper.php';

require_once '../app/Middleware/JwtMiddleware.php';
require_once '../app/Middleware/EmpresaMiddleware.php';

require_once '../app/Repositories/BaseRepository.php';
require_once '../app/Repositories/ClienteRepository.php';

require_once '../app/Services/ClienteService.php';

require_once '../app/Controllers/ClienteController.php';

$_SERVER['HTTP_AUTHORIZATION'] =
'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVc3VhcmlvSUQiOiIxIiwiRW1wcmVzYUlEIjoiMSIsIlJvbElEIjoiMSIsIk5vbWJyZSI6IkFkbWluaXN0cmFkb3IiLCJDb3JyZW8iOiJhZG1pbkBjb25zdHJ1Y3RmbG93Lm14IiwiaWF0IjoxNzgxODA0OTYzLCJleHAiOjE3ODE4MzM3NjN9.gJ_BVwgNWSdSH4-FcE-Sl6bQACGUQgk-bTcinx981rU';

$_POST['RFC'] =
'XAXX010101000';

$_POST['NombreCliente'] =
'CLIENTE DEMO 1';

$_POST['ContactoPrincipal'] =
'SALVADOR MORALES';

$_POST['Telefono'] =
'3312345678';

$_POST['Correo'] =
'cliente@demo.com';

$_POST['Direccion'] =
'GUADALAJARA';

$controller =
    new \App\Controllers\ClienteController();

$controller->store();