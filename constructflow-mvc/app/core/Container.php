<?php

namespace App\Core;

class Container
{
    protected static $items = [];

    public static function set($key, $value)
    {
        self::$items[$key] = $value;
    }

    public static function get($key, $default = null)
    {
        return self::$items[$key] ?? $default;
    }
}
