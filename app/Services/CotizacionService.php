<?php

namespace App\Services;

use App\Repositories\CotizacionRepository;

class CotizacionService
{
    private $repository;

    public function __construct()
    {
        $this->repository =
            new CotizacionRepository();
    }

    public function getAll($empresaID)
    {
        return $this->repository
                    ->getAll($empresaID);
    }

    public function getById(
        $cotizacionID,
        $empresaID
    )
    {
        return $this->repository
                    ->getById(
                        $cotizacionID,
                        $empresaID
                    );
    }

    public function create($data)
    {
        if (
            $this->repository
                 ->existsFolio(
                    $data['EmpresaID'],
                    $data['Folio']
                 )
        )
        {
            return [
                'success' => false,
                'message' =>
                    'El folio ya existe.'
            ];
        }

        return [
            'success' =>
                $this->repository
                     ->insert($data)
        ];
    }
}