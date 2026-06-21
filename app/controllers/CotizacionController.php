<?php

namespace App\Controllers;

use App\Services\CotizacionService;
use App\Middleware\EmpresaMiddleware;

class CotizacionController
{
    public function index()
    {
        $empresaID =
            EmpresaMiddleware::getEmpresaID();

        $service =
            new CotizacionService();

        echo json_encode([
            'success' => true,
            'data' =>
                $service->getAll(
                    $empresaID
                )
        ]);
    }

    public function show($cotizacionID)
    {
        $empresaID =
            EmpresaMiddleware::getEmpresaID();

        $service =
            new CotizacionService();

        echo json_encode([
            'success' => true,
            'data' =>
                $service->getById(
                    $cotizacionID,
                    $empresaID
                )
        ]);
    }
}