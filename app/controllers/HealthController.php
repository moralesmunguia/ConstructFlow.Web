<?php

namespace App\Controllers;

use App\Helpers\ResponseHelper;

class HealthController
{
    public function index()
    {
        ResponseHelper::success([
            'application' => 'ConstructFlow',
            'version' => '1.0'
        ], 'API ONLINE');
    }
}