<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Cotizacion;

class CotizacionController extends Controller
{
    public function index()
    {
        Cotizacion::init(require __DIR__ . '/../../config/config.php');
        $data = Cotizacion::all();
        return $this->json(['data' => $data]);
    }

    public function show($id)
    {
        Cotizacion::init(require __DIR__ . '/../../config/config.php');
        $c = Cotizacion::find($id);
        if (!$c) return $this->json(['error' => 'Not found'], 404);
        return $this->json($c);
    }

    public function store()
    {
        Cotizacion::init(require __DIR__ . '/../../config/config.php');
        $input = json_decode(file_get_contents('php://input'), true);
        $id = Cotizacion::create($input);
        return $this->json(['id' => $id], 201);
    }

    public function update($id)
    {
        Cotizacion::init(require __DIR__ . '/../../config/config.php');
        $input = json_decode(file_get_contents('php://input'), true);
        Cotizacion::update($id, $input);
        return $this->json(['ok' => true]);
    }

    public function delete($id)
    {
        Cotizacion::init(require __DIR__ . '/../../config/config.php');
        Cotizacion::delete($id);
        return $this->json(['ok' => true]);
    }
}
