<?php

namespace App\Core;

use PDO;

class Model
{
    protected static $pdo;

    public static function init($config)
    {
        if (self::$pdo) return;
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $config['db_host'], $config['db_name'], $config['db_charset']);
        self::$pdo = new PDO($dsn, $config['db_user'], $config['db_pass']);
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    protected function pdo()
    {
        return self::$pdo;
    }
}
