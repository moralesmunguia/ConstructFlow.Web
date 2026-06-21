<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Helpers\JwtHelper;

class AuthController
{
    public function login()
    {
        $correo   = $_GET['correo'] ?? '';
        $password = $_GET['password'] ?? '';

        $service = new AuthService();

        $usuario = $service->login(
            $correo,
            $password
        );

        if (!$usuario)
        {
            echo json_encode([
                'success' => false,
                'message' => 'Credenciales inválidas'
            ]);
            return;
        }

        $token = \App\Helpers\JwtHelper::generateToken(
            $usuario
        );

        echo json_encode([
            'success' => true,

            'token' => $token,

                    'usuario' => [

                        'UsuarioID' =>
                            $usuario['UsuarioID'],

                        'EmpresaID' =>
                            $usuario['EmpresaID'],

                        'RolID' =>
                            $usuario['RolID'],

                        'Nombre' =>
                            $usuario['Nombre'],

                        'Correo' =>
                            $usuario['Correo']
            ]
        ]);
    }
}