<?php

namespace App\Services;

use App\Repositories\CotizacionDetalleRepository;
use App\Repositories\CotizacionRepository;

class CotizacionDetalleService
{
    private $repository;
    private $cotizacionRepository;

    public function __construct()
    {
        $this->repository =
            new CotizacionDetalleRepository();

        $this->cotizacionRepository =
            new CotizacionRepository();
    }

    /*
    |--------------------------------------------------------------------------
    | LISTAR DETALLE POR COTIZACIÓN
    |--------------------------------------------------------------------------
    */

    public function getByCotizacion(
        $cotizacionID
    )
    {
        return $this->repository
                    ->getByCotizacion(
                        $cotizacionID
                    );
    }

    /*
    |--------------------------------------------------------------------------
    | OBTENER POR ID
    |--------------------------------------------------------------------------
    */

    public function getById(
        $cotizacionDetalleID
    )
    {
        return $this->repository
                    ->getById(
                        $cotizacionDetalleID
                    );
    }

    /*
    |--------------------------------------------------------------------------
    | INSERTAR
    |--------------------------------------------------------------------------
    */

    public function create($data)
    {
        $ok =
            $this->repository
                 ->insert($data);

        if ($ok)
        {
            $this->cotizacionRepository
                 ->recalcularTotales(
                    $data['CotizacionID']
                 );
        }

        return $ok;
    }

    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR
    |--------------------------------------------------------------------------
    */

    public function update(
        $cotizacionDetalleID,
        $data
    )
    {
        $ok =
            $this->repository
                 ->update(
                    $cotizacionDetalleID,
                    $data
                 );

        if ($ok)
        {
            $this->cotizacionRepository
                 ->recalcularTotales(
                    $data['CotizacionID']
                 );
        }

        return $ok;
    }

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR
    |--------------------------------------------------------------------------
    */

    public function delete(
        $cotizacionDetalleID,
        $usuarioID,
        $usuario
    )
    {
        $detalle =
            $this->repository
                 ->getById(
                    $cotizacionDetalleID
                 );

        if (!$detalle)
        {
            return false;
        }

        $ok =
            $this->repository
                 ->delete(
                    $cotizacionDetalleID,
                    $usuarioID,
                    $usuario
                 );

        if ($ok)
        {
            $this->cotizacionRepository
                 ->recalcularTotales(
                    $detalle['CotizacionID']
                 );
        }

        return $ok;
    }
}