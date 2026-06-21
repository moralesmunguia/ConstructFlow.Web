<?php

namespace App\Controllers;

use App\Services\ClienteService;

use App\Middleware\EmpresaMiddleware;

class ClienteController
{
    public function index()
    {
        $empresaID =
            EmpresaMiddleware::getEmpresaID();

        $service =
            new ClienteService();

        $clientes =
            $service->getAll(
                $empresaID
            );

        echo json_encode([
            'success' => true,
            'data' => $clientes
        ]);
    }

    public function update($clienteID)
{
    $empresaID =
        EmpresaMiddleware::getEmpresaID();

    $usuarioID =
        EmpresaMiddleware::getUsuarioID();

    $payload =
        EmpresaMiddleware::getUsuario();

    $data = [

        'RFC' =>
            $_POST['RFC'] ?? '',

        'NombreCliente' =>
            $_POST['NombreCliente'] ?? '',

        'ContactoPrincipal' =>
            $_POST['ContactoPrincipal'] ?? '',

        'Telefono' =>
            $_POST['Telefono'] ?? '',

        'Correo' =>
            $_POST['Correo'] ?? '',

        'Direccion' =>
            $_POST['Direccion'] ?? '',

        'LimiteCredito' =>
            $_POST['LimiteCredito'] ?? 0,

        'DiasCredito' =>
            $_POST['DiasCredito'] ?? 30,

        'Observaciones' =>
            $_POST['Observaciones'] ?? '',

        'ModifiedUserID' =>
            $usuarioID,

        'ModifiedBy' =>
            $payload['Nombre']
    ];

    $service =
        new ClienteService();

    $resultado =
        $service->update(
            $clienteID,
            $empresaID,
            $data
        );

    echo json_encode([
        'success' => $resultado
    ]);
}

public function show($clienteID)
{
    $empresaID =
        EmpresaMiddleware::getEmpresaID();

    $service =
        new ClienteService();

    $cliente =
        $service->getById(
            $clienteID,
            $empresaID
        );

    if (!$cliente)
    {
        echo json_encode([
            'success' => false,
            'message' => 'Cliente no encontrado'
        ]);

        return;
    }

    echo json_encode([
        'success' => true,
        'data' => $cliente
    ]);
}

public function delete($clienteID)
{
    $empresaID =
        EmpresaMiddleware::getEmpresaID();

    $usuarioID =
        EmpresaMiddleware::getUsuarioID();

    $payload =
        EmpresaMiddleware::getUsuario();

    $service =
        new ClienteService();

    $resultado =
        $service->delete(
            $clienteID,
            $empresaID,
            $usuarioID,
            $payload['Nombre']
        );

    echo json_encode([
        'success' => $resultado
    ]);
}

public function store()
{
    $empresaID =
        EmpresaMiddleware::getEmpresaID();

    $usuarioID =
        EmpresaMiddleware::getUsuarioID();

    $payload =
        EmpresaMiddleware::getUsuario();

    $data = [

        'EmpresaID' => $empresaID,

        'RFC' => $_POST['RFC'] ?? '',

        'NombreCliente' =>
            $_POST['NombreCliente'] ?? '',

        'ContactoPrincipal' =>
            $_POST['ContactoPrincipal'] ?? '',

        'Telefono' =>
            $_POST['Telefono'] ?? '',

        'Correo' =>
            $_POST['Correo'] ?? '',

        'Direccion' =>
            $_POST['Direccion'] ?? '',

        'LimiteCredito' =>
            $_POST['LimiteCredito'] ?? 0,

        'DiasCredito' =>
            $_POST['DiasCredito'] ?? 30,

        'Observaciones' =>
            $_POST['Observaciones'] ?? '',

        'CreatedUserID' =>
            $usuarioID,

        'CreatedBy' =>
            $payload['Nombre']
    ];

    $service = new ClienteService();

    $resultado =
        $service->create($data);

    echo json_encode(
        $resultado
    );
}
}