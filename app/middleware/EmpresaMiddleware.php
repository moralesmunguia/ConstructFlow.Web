<?php

namespace App\Middleware;

class EmpresaMiddleware
{
    /**
     * Obtener EmpresaID desde JWT
     */
    public static function getEmpresaID()
    {
        $usuario = JwtMiddleware::handle();

        if (
            !isset($usuario['EmpresaID']) ||
            empty($usuario['EmpresaID'])
        )
        {
            self::forbidden(
                'Empresa no definida'
            );
        }

        return (int)$usuario['EmpresaID'];
    }

    /**
     * Obtener UsuarioID
     */
    public static function getUsuarioID()
    {
        $usuario = JwtMiddleware::handle();

        return (int)$usuario['UsuarioID'];
    }

    /**
     * Obtener RolID
     */
    public static function getRolID()
    {
        $usuario = JwtMiddleware::handle();

        return (int)$usuario['RolID'];
    }

    /**
     * Obtener payload completo
     */
    public static function getUsuario()
    {
        return JwtMiddleware::handle();
    }

    /**
     * Respuesta 403
     */
    private static function forbidden($message)
    {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'message' => $message
        ]);

        exit;
    }
}