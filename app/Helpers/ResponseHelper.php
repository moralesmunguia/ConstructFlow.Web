<?php

namespace App\Helpers;

class ResponseHelper
{
    public static function success($data = [], $message = 'OK')
    {
        http_response_code(200);

        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);

        exit;
    }

    public static function error($message = 'Error', $code = 400)
    {
        http_response_code($code);

        echo json_encode([
            'success' => false,
            'message' => $message
        ]);

        exit;
    }
}