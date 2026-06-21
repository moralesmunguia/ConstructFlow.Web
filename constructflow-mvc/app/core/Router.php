<?php

namespace App\Core;

class Router
{
    protected $routes = [];

    public function __construct()
    {
        // define simple routes
        $this->routes = [
            ['GET', '/', 'App\\Controllers\\HomeController@index'],
            ['GET', '/api/cotizaciones', 'App\\Controllers\\CotizacionController@index'],
            ['POST', '/api/cotizaciones', 'App\\Controllers\\CotizacionController@store'],
            ['GET', '/api/cotizaciones/{id}', 'App\\Controllers\\CotizacionController@show'],
            ['PUT', '/api/cotizaciones/{id}', 'App\\Controllers\\CotizacionController@update'],
            ['DELETE', '/api/cotizaciones/{id}', 'App\\Controllers\\CotizacionController@delete'],
        ];
    }

    public function dispatch($uri)
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($uri, PHP_URL_PATH);

        // Remove base path if app is served from a subdirectory (e.g., /SiCon/constructflow-mvc)
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        if ($base !== '' && $base !== '/' && strpos($path, $base) === 0) {
            $path = substr($path, strlen($base));
            if ($path === '') $path = '/';
        }

        foreach ($this->routes as $r) {
            [$m, $route, $handler] = $r;
            if ($m !== $method) continue;

            $pattern = preg_replace('#\{[^/]+\}#', '([^/]+)', $route);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches);
                return $this->callHandler($handler, $matches);
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Not Found', 'path' => $path, 'method' => $method]);
    }

    protected function callHandler($handler, $params)
    {
        [$class, $method] = explode('@', $handler);
        if (!class_exists($class)) {
            http_response_code(500);
            echo json_encode(['error' => 'Handler class not found', 'class' => $class]);
            return;
        }

        $controller = new $class();
        if (!method_exists($controller, $method)) {
            http_response_code(500);
            echo json_encode(['error' => 'Handler method not found', 'method' => $method]);
            return;
        }

        return call_user_func_array([$controller, $method], $params);
    }
}
