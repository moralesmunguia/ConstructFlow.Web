<?php

namespace App\Controllers;

use App\Services\CotizacionDetalleService;
use App\Middleware\EmpresaMiddleware;

class CotizacionDetalleController
{
    /*
    |--------------------------------------------------------------------------
    | LISTAR DETALLE DE COTIZACIÓN
    |--------------------------------------------------------------------------
    */

    public function index(
        $cotizacionID
    )
    {
        $service =
            new CotizacionDetalleService();

        echo json_encode([

            'success' => true,

            'data' =>
                $service
                    ->getByCotizacion(
                        $cotizacionID
                    )
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | OBTENER POR ID
    |--------------------------------------------------------------------------
    */

    public function show(
        $cotizacionDetalleID
    )
    {
        $service =
            new CotizacionDetalleService();

        echo json_encode([

            'success' => true,

            'data' =>
                $service
                    ->getById(
                        $cotizacionDetalleID
                    )
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INSERTAR
    |--------------------------------------------------------------------------
    */

    public function store()
    {
        $usuarioID =
            EmpresaMiddleware::getUsuarioID();

        $payload =
            EmpresaMiddleware::getUsuario();

        $service =
            new CotizacionDetalleService();

        $data = [

            'CotizacionID' =>
                $_POST['CotizacionID'],

            'ConceptoID' =>
                $_POST['ConceptoID'] ?? null,

            'Concepto' =>
                $_POST['Concepto'] ?? '',

            'Descripcion' =>
                $_POST['Descripcion'] ?? '',

            'Unidad' =>
                $_POST['Unidad'] ?? '',

            'Cantidad' =>
                $_POST['Cantidad'] ?? 0,

            'PrecioUnitario' =>
                $_POST['PrecioUnitario'] ?? 0,

            'Descuento' =>
                $_POST['Descuento'] ?? 0,

            'Comentarios' =>
                $_POST['Comentarios'] ?? '',

            'OrdenVisual' =>
                $_POST['OrdenVisual'] ?? 0,

            'CreatedUserID' =>
                $usuarioID,

            'CreatedBy' =>
                $payload['Nombre']
        ];

        echo json_encode([

            'success' =>
                $service
                    ->create($data)
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR
    |--------------------------------------------------------------------------
    */

    public function update(
        $cotizacionDetalleID
    )
    {
        $usuarioID =
            EmpresaMiddleware::getUsuarioID();

        $payload =
            EmpresaMiddleware::getUsuario();

        $service =
            new CotizacionDetalleService();

        $data = [

            'CotizacionID' =>
                $_POST['CotizacionID'],

            'ConceptoID' =>
                $_POST['ConceptoID'] ?? null,

            'Concepto' =>
                $_POST['Concepto'] ?? '',

            'Descripcion' =>
                $_POST['Descripcion'] ?? '',

            'Unidad' =>
                $_POST['Unidad'] ?? '',

            'Cantidad' =>
                $_POST['Cantidad'] ?? 0,

            'PrecioUnitario' =>
                $_POST['PrecioUnitario'] ?? 0,

            'Descuento' =>
                $_POST['Descuento'] ?? 0,

            'Comentarios' =>
                $_POST['Comentarios'] ?? '',

            'OrdenVisual' =>
                $_POST['OrdenVisual'] ?? 0,

            'ModifiedUserID' =>
                $usuarioID,

            'ModifiedBy' =>
                $payload['Nombre']
        ];

        echo json_encode([

            'success' =>
                $service
                    ->update(
                        $cotizacionDetalleID,
                        $data
                    )
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR
    |--------------------------------------------------------------------------
    */

    public function delete(
        $cotizacionDetalleID
    )
    {
        $usuarioID =
            EmpresaMiddleware::getUsuarioID();

        $payload =
            EmpresaMiddleware::getUsuario();

        $service =
            new CotizacionDetalleService();

        echo json_encode([

            'success' =>
                $service
                    ->delete(
                        $cotizacionDetalleID,
                        $usuarioID,
                        $payload['Nombre']
                    )
        ]);
    }
}