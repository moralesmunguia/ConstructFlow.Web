<?php

namespace App\Models;

use App\Core\Model;

class Cotizacion extends Model
{
    public static function all()
    {
        $pdo = self::pdo();
        $stmt = $pdo->query('SELECT * FROM cotizaciones ORDER BY id DESC');
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public static function find($id)
    {
        $pdo = self::pdo();
        $stmt = $pdo->prepare('SELECT * FROM cotizaciones WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public static function create($data)
    {
        $pdo = self::pdo();
        $stmt = $pdo->prepare('INSERT INTO cotizaciones (empresa_id,user_id,numero,atencion,compras,fecha,forma_pago,descripcion,total,incluye_iva,fecha_inicio_tentativa,costo_real,estado,created_at,updated_at) VALUES (:empresa_id,:user_id,:numero,:atencion,:compras,:fecha,:forma_pago,:descripcion,:total,:incluye_iva,:fecha_inicio_tentativa,:costo_real,:estado, NOW(), NOW())');
        $stmt->execute([
            'empresa_id' => $data['empresa_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'numero' => $data['numero'] ?? null,
            'atencion' => $data['atencion'] ?? null,
            'compras' => $data['compras'] ?? null,
            'fecha' => $data['fecha'] ?? null,
            'forma_pago' => $data['forma_pago'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'total' => $data['total'] ?? 0,
            'incluye_iva' => $data['incluye_iva'] ?? 0,
            'fecha_inicio_tentativa' => $data['fecha_inicio_tentativa'] ?? null,
            'costo_real' => $data['costo_real'] ?? null,
            'estado' => $data['estado'] ?? 'borrador',
        ]);
        return $pdo->lastInsertId();
    }

    public static function update($id, $data)
    {
        $pdo = self::pdo();
        $stmt = $pdo->prepare('UPDATE cotizaciones SET numero=:numero,atencion=:atencion,compras=:compras,fecha=:fecha,forma_pago=:forma_pago,descripcion=:descripcion,total=:total,incluye_iva=:incluye_iva,fecha_inicio_tentativa=:fecha_inicio_tentativa,costo_real=:costo_real,estado=:estado,updated_at=NOW() WHERE id=:id');
        $stmt->execute([
            'id' => $id,
            'numero' => $data['numero'] ?? null,
            'atencion' => $data['atencion'] ?? null,
            'compras' => $data['compras'] ?? null,
            'fecha' => $data['fecha'] ?? null,
            'forma_pago' => $data['forma_pago'] ?? null,
            'descripcion' => $data['descripcion'] ?? null,
            'total' => $data['total'] ?? 0,
            'incluye_iva' => $data['incluye_iva'] ?? 0,
            'fecha_inicio_tentativa' => $data['fecha_inicio_tentativa'] ?? null,
            'costo_real' => $data['costo_real'] ?? null,
            'estado' => $data['estado'] ?? 'borrador',
        ]);
    }

    public static function delete($id)
    {
        $pdo = self::pdo();
        $stmt = $pdo->prepare('DELETE FROM cotizaciones WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
