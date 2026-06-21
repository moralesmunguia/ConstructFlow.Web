<?php

namespace App\Services;

use App\Repositories\ClienteRepository;

class ClienteService
{
    private $repository;

    public function create($data)
    {
        $existe =
            $this->repository
                ->existsNombreCliente(
                    $data['EmpresaID'],
                    $data['NombreCliente']
                );

        if ($existe)
        {
            return [
                'success' => false,
                'message' =>
                    'Ya existe un cliente con ese nombre.'
            ];
        }

        $ok =
            $this->repository
                ->insert($data);

        return [
            'success' => $ok
        ];
    }

    public function update(
        $clienteID,
        $empresaID,
        $data
    )
    {
        $existe =
            $this->repository
                ->existsNombreClienteUpdate(
                    $empresaID,
                    $data['NombreCliente'],
                    $clienteID
                );

        if ($existe)
        {
            return [
                'success' => false,
                'message' =>
                    'Ya existe un cliente con ese nombre.'
            ];
        }

        return $this->repository
                    ->update(
                        $clienteID,
                        $empresaID,
                        $data
                    );
    }

        
public function delete(
    $clienteID,
    $empresaID,
    $usuarioID,
    $usuario
)
{
    return $this->repository
                ->delete(
                    $clienteID,
                    $empresaID,
                    $usuarioID,
                    $usuario
                );
}
    public function __construct()
    {
        $this->repository =
            new ClienteRepository();
    }

    public function getAll($empresaID)
    {
        return $this->repository
                    ->getAll($empresaID);
    }

    public function getById(
        $clienteID,
        $empresaID
    )
    {
        return $this->repository
                    ->getById(
                        $clienteID,
                        $empresaID
                    );
    }
}