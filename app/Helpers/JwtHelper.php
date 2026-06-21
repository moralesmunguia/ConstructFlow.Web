<?php

namespace App\Helpers;

class JwtHelper
{
    private static $secret =
        'ConstructFlow_2026_Secret_Key';

    /**
     * Generar Token
     */
    public static function generateToken($usuario)
    {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $payload = [

            'UsuarioID' => $usuario['UsuarioID'],

            'EmpresaID' => $usuario['EmpresaID'],

            'RolID' => $usuario['RolID'],

            'Nombre' => $usuario['Nombre'],

            'Correo' => $usuario['Correo'],

            'iat' => time(),

            'exp' => time() + (60 * 60 * 8) // 8 horas
        ];

        $headerEncoded =
            self::base64UrlEncode(
                json_encode($header)
            );

        $payloadEncoded =
            self::base64UrlEncode(
                json_encode($payload)
            );

        $signature =
            hash_hmac(
                'sha256',
                $headerEncoded . "." . $payloadEncoded,
                self::$secret,
                true
            );

        $signatureEncoded =
            self::base64UrlEncode($signature);

        return
            $headerEncoded . "." .
            $payloadEncoded . "." .
            $signatureEncoded;
    }

    /**
     * Validar Token
     */
    public static function validateToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) != 3) {
            return false;
        }

        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];

        $validSignature =
            self::base64UrlEncode(
                hash_hmac(
                    'sha256',
                    $header . "." . $payload,
                    self::$secret,
                    true
                )
            );

        if ($signature !== $validSignature) {
            return false;
        }

        $payloadData =
            json_decode(
                self::base64UrlDecode($payload),
                true
            );

        if (!$payloadData) {
            return false;
        }

        if (
            isset($payloadData['exp']) &&
            $payloadData['exp'] < time()
        ) {
            return false;
        }

        return $payloadData;
    }

    /**
     * Decodificar Payload
     */
    public static function decodeToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) != 3) {
            return false;
        }

        return json_decode(
            self::base64UrlDecode($parts[1]),
            true
        );
    }

    /**
     * Base64 URL Encode
     */
    private static function base64UrlEncode($data)
    {
        return rtrim(
            strtr(
                base64_encode($data),
                '+/',
                '-_'
            ),
            '='
        );
    }

    /**
     * Base64 URL Decode
     */
    private static function base64UrlDecode($data)
    {
        return base64_decode(
            strtr(
                $data,
                '-_',
                '+/'
            )
        );
    }
}