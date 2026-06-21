<?php
// Simple MVC front controller for ConstructFlow (lightweight)
require __DIR__ . '/app/bootstrap.php';

use App\Core\Router;

$router = new Router();
$router->dispatch($_SERVER['REQUEST_URI']);
