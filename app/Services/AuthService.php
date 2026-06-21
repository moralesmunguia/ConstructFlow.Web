<?php

namespace App\Services;

use App\Repositories\UsuarioRepository;

class AuthService
{
    private $usuarioRepository;

    public function __construct()
    {
        $this->usuarioRepository = new UsuarioRepository();
    }

    public function login($correo, $password)
    {
        $usuario = $this->usuarioRepository->getByEmail($correo);

        if (!$usuario)
        {
            return false;
        }

        if (!password_verify(
                $password,
                $usuario['PasswordHash']
            ))
        {
            return false;
        }

        return $usuario;
    }
}