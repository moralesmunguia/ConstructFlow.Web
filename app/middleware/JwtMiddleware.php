<?php

namespace App\Middleware;

use App\Helpers\JwtHelper;

class JwtMiddleware
{
    /**
     * Valida el token JWT
     */
    public static function handle()
    {
        $headers = self::getAuthorizationHeader();

        if (!$headers)
        {
            self::unauthorized(
                'Token requerido'
            );
        }

        if (
            strpos(
                $headers,
                'Bearer '
            ) !== 0
        )
        {
            self::unauthorized(
                'Formato de token inválido'
            );
        }

        $token = trim(
            str_replace(
                'Bearer ',
                '',
                $headers
            )
        );

        $payload =
            JwtHelper::validateToken(
                $token
            );

        if (!$payload)
        {
            self::unauthorized(
                'Token inválido o expirado'
            );
        }

        return $payload;
    }

    /**
     * Obtiene Authorization Header
     */
    private static function getAuthorizationHeader()
    {
        if (
            isset($_SERVER['HTTP_AUTHORIZATION'])
        )
        {
            return trim(
                $_SERVER['HTTP_AUTHORIZATION']
            );
        }

        if (
            function_exists(
                'apache_request_headers'
            )
        )
        {
            $headers =
                apache_request_headers();

            if (
                isset(
                    $headers['Authorization']
                )
            )
            {
                return trim(
                    $headers['Authorization']
                );
            }
        }

        return null;
    }

    /**
     * Respuesta 401
     */
    private static function unauthorized(
        $message
    )
    {
        http_response_code(401);

        echo json_encode([

            'success' => false,

            'message' => $message

        ]);

        exit;
    }
}