<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Core/Database.php';

require_once '../app/Repositories/BaseRepository.php';
require_once '../app/Repositories/UsuarioRepository.php';

require_once '../app/Services/AuthService.php';

use App\Services\AuthService;

$auth = new AuthService();

$result = $auth->login(
    'admin@constructflow.mx',
    '123456'
);

echo '<pre>';
print_r($result);