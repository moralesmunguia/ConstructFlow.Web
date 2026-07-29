<?php

require_once '../app/Core/Database.php';

require_once '../app/Repositories/BaseRepository.php';
require_once '../app/Repositories/UsuarioRepository.php';

require_once '../app/Services/AuthService.php';

require_once '../app/Helpers/JwtHelper.php';

require_once '../app/Controllers/AuthController.php';


// Generar el hash de la nueva contraseña
//echo password_hash('TuNuevaContraseñaSegura123!', PASSWORD_BCRYPT);

$route = isset($_GET['route'])
    ? $_GET['route']
    : '';

switch ($route)
{
    case 'api/v1/health':
            var_dump($token);
            exit;
        echo json_encode([
            'success' => true,
            'application' => 'ConstructFlow',
            'version' => '1.0',
            'status' => 'ONLINE'
        ]);

        break;
    case 'api/v1/auth/login':

    $controller =
            new \App\Controllers\AuthController();

    $controller->login();

    break;    

    default:

        echo json_encode([
            'success' => true,
            'message' => 'ConstructFlow API'
        ]);
}