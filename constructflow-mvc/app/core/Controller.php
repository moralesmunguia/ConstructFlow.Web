<?php

namespace App\Core;

class Controller
{
    protected function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    protected function view($path, $data = [])
    {
        extract($data);
        require __DIR__ . '/../views/' . $path . '.php';
    }
}
