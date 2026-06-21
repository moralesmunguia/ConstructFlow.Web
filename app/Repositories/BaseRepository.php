<?php

namespace App\Repositories;

use App\Core\Database;

class BaseRepository
{
    protected $db;

    public function __construct()
    {
        $this->db = Database::getInstance()
                            ->getConnection();
    }
}