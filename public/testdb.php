<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../app/Core/Database.php';
require_once '../app/Repositories/BaseRepository.php';
require_once '../app/Repositories/UsuarioRepository.php';

use App\Repositories\UsuarioRepository;

$repo = new UsuarioRepository();

echo '<pre>';
print_r(
    $repo->getByEmail('admin@constructflow.mx')
);