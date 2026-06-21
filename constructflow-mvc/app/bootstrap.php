<?php

require __DIR__ . '/core/Router.php';
require __DIR__ . '/core/Controller.php';
require __DIR__ . '/core/Model.php';
require __DIR__ . '/core/Container.php';

// Load simple config
$config = require __DIR__ . '/../config/config.php';

// Simple DI container
App\Core\Container::set('config', $config);

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    if (strpos($class, $prefix) !== 0) return;

    $path = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($path)) require $path;
});

// Start session
session_start();
