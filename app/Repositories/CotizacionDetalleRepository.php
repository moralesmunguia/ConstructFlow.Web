<?php

namespace App\Repositories;

class CotizacionDetalleRepository extends BaseRepository
{
    /*
    |--------------------------------------------------------------------------
    | OBTENER DETALLE DE UNA COTIZACIÓN
    |--------------------------------------------------------------------------
    */

    public function getByCotizacion($cotizacionID)
    {
        $sql = "
            SELECT *
            FROM CF_CotizacionDetalle
            WHERE CotizacionID = ?
              AND IsActive = 1
            ORDER BY
                OrdenVisual,
                CotizacionDetalleID
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $cotizacionID
        ]);

        return $stmt->fetchAll();
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
        $sql = "
            SELECT *
            FROM CF_CotizacionDetalle
            WHERE CotizacionDetalleID = ?
              AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $cotizacionDetalleID
        ]);

        return $stmt->fetch();
    }

    /*
    |--------------------------------------------------------------------------
    | INSERTAR
    |--------------------------------------------------------------------------
    */

    public function insert($data)
    {
        $importe =
            (
                $data['Cantidad']
                *
                $data['PrecioUnitario']
            )
            -
            $data['Descuento'];

        $sql = "
            INSERT INTO CF_CotizacionDetalle
            (
                CotizacionID,

                ConceptoID,
                Concepto,

                Descripcion,
                Unidad,

                Cantidad,
                PrecioUnitario,

                Descuento,
                Importe,

                Comentarios,
                OrdenVisual,

                CreatedUserID,
                CreatedBy
            )
            VALUES
            (
                ?,?,?,?,?,?,
                ?,?,?,?,
                ?,?,?
            )
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $data['CotizacionID'],

            $data['ConceptoID'],
            $data['Concepto'],

            $data['Descripcion'],
            $data['Unidad'],

            $data['Cantidad'],
            $data['PrecioUnitario'],

            $data['Descuento'],
            $importe,

            $data['Comentarios'],
            $data['OrdenVisual'],

            $data['CreatedUserID'],
            $data['CreatedBy']
        ]);
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
        $importe =
            (
                $data['Cantidad']
                *
                $data['PrecioUnitario']
            )
            -
            $data['Descuento'];

        $sql = "
            UPDATE CF_CotizacionDetalle
            SET

                ConceptoID = ?,
                Concepto = ?,

                Descripcion = ?,
                Unidad = ?,

                Cantidad = ?,
                PrecioUnitario = ?,

                Descuento = ?,
                Importe = ?,

                Comentarios = ?,

                OrdenVisual = ?,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionDetalleID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $data['ConceptoID'],
            $data['Concepto'],

            $data['Descripcion'],
            $data['Unidad'],

            $data['Cantidad'],
            $data['PrecioUnitario'],

            $data['Descuento'],
            $importe,

            $data['Comentarios'],

            $data['OrdenVisual'],

            $data['ModifiedUserID'],
            $data['ModifiedBy'],

            $cotizacionDetalleID
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR (SOFT DELETE)
    |--------------------------------------------------------------------------
    */

    public function delete(
        $cotizacionDetalleID,
        $usuarioID,
        $usuario
    )
    {
        $sql = "
            UPDATE CF_CotizacionDetalle
            SET

                IsActive = 0,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionDetalleID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $usuarioID,
            $usuario,

            $cotizacionDetalleID
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ELIMINAR POR COTIZACIÓN
    |--------------------------------------------------------------------------
    */

    public function deleteByCotizacion(
        $cotizacionID,
        $usuarioID,
        $usuario
    )
    {
        $sql = "
            UPDATE CF_CotizacionDetalle
            SET

                IsActive = 0,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $usuarioID,
            $usuario,

            $cotizacionID
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULAR IMPORTE
    |--------------------------------------------------------------------------
    */

    public function calcularImporte(
        $cantidad,
        $precioUnitario,
        $descuento = 0
    )
    {
        return
            (
                $cantidad
                *
                $precioUnitario
            )
            -
            $descuento;
    }
}