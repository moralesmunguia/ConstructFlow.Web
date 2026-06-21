<?php

namespace App\Core;

class Router
{
    private $routes = [];

    public function get($uri, $action)
    {
        $this->routes['GET'][$uri] = $action;
    }

    public function dispatch($uri)
    {
        $method = $_SERVER['REQUEST_METHOD'];

        if (!isset($this->routes[$method][$uri])) {
            http_response_code(404);

            echo json_encode([
                'success' => false,
                'message' => 'Route not found'
            ]);

            exit;
        }

        list($controller, $function) =
            explode('@', $this->routes[$method][$uri]);

        $controller =
            "\\App\\Controllers\\" . $controller;

        $instance = new $controller();

        call_user_func([$instance, $function]);
    }
}