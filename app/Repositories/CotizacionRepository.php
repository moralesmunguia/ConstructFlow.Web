<?php

namespace App\Repositories;

class CotizacionRepository extends BaseRepository
{
    /*
    |--------------------------------------------------------------------------
    | CONSULTAS
    |--------------------------------------------------------------------------
    */

    public function getAll($empresaID)
    {
        $sql = "
            SELECT
                c.*,
                cl.NombreCliente
            FROM CF_Cotizacion c
            INNER JOIN CF_Cliente cl
                ON c.ClienteID = cl.ClienteID
            WHERE c.EmpresaID = ?
              AND c.IsActive = 1
            ORDER BY c.CotizacionID DESC
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $empresaID
        ]);

        return $stmt->fetchAll();
    }

    public function getById(
        $cotizacionID,
        $empresaID
    )
    {
        $sql = "
            SELECT *
            FROM CF_Cotizacion
            WHERE CotizacionID = ?
              AND EmpresaID = ?
              AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $cotizacionID,
            $empresaID
        ]);

        return $stmt->fetch();
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDACIONES
    |--------------------------------------------------------------------------
    */

    public function existsFolio(
        $empresaID,
        $folio
    )
    {
        $sql = "
            SELECT CotizacionID
            FROM CF_Cotizacion
            WHERE EmpresaID = ?
              AND UPPER(TRIM(Folio))
                  = UPPER(TRIM(?))
              AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $empresaID,
            $folio
        ]);

        return $stmt->fetch();
    }

    public function existsFolioUpdate(
        $empresaID,
        $folio,
        $cotizacionID
    )
    {
        $sql = "
            SELECT CotizacionID
            FROM CF_Cotizacion
            WHERE EmpresaID = ?
              AND UPPER(TRIM(Folio))
                  = UPPER(TRIM(?))
              AND CotizacionID <> ?
              AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $empresaID,
            $folio,
            $cotizacionID
        ]);

        return $stmt->fetch();
    }

    /*
    |--------------------------------------------------------------------------
    | INSERT
    |--------------------------------------------------------------------------
    */

    public function insert($data)
    {
        $sql = "
            INSERT INTO CF_Cotizacion
            (
                EmpresaID,
                ClienteID,
                Folio,
                Fecha,
                Vigencia,

                Moneda,
                TipoCambio,

                Subtotal,
                IVA,
                Total,

                Estado,
                VersionActual,
                ProbabilidadCierre,
                OrigenProspecto,
                Observaciones,

                CreatedUserID,
                CreatedBy
            )
            VALUES
            (
                ?,?,?,?,?,?,
                ?,?,?,?,
                ?,?,?,?,?,
                ?,?
            )
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $data['EmpresaID'],
            $data['ClienteID'],
            $data['Folio'],
            $data['Fecha'],
            $data['Vigencia'],

            $data['Moneda'],
            $data['TipoCambio'],

            $data['Subtotal'],
            $data['IVA'],
            $data['Total'],

            $data['Estado'],
            $data['VersionActual'],
            $data['ProbabilidadCierre'],
            $data['OrigenProspecto'],
            $data['Observaciones'],

            $data['CreatedUserID'],
            $data['CreatedBy']
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        $cotizacionID,
        $empresaID,
        $data
    )
    {
        $sql = "
            UPDATE CF_Cotizacion
            SET

                ClienteID = ?,
                Folio = ?,
                Fecha = ?,
                Vigencia = ?,

                Moneda = ?,
                TipoCambio = ?,

                Subtotal = ?,
                IVA = ?,
                Total = ?,

                Estado = ?,
                VersionActual = ?,
                ProbabilidadCierre = ?,
                OrigenProspecto = ?,
                Observaciones = ?,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionID = ?
              AND EmpresaID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $data['ClienteID'],
            $data['Folio'],
            $data['Fecha'],
            $data['Vigencia'],

            $data['Moneda'],
            $data['TipoCambio'],

            $data['Subtotal'],
            $data['IVA'],
            $data['Total'],

            $data['Estado'],
            $data['VersionActual'],
            $data['ProbabilidadCierre'],
            $data['OrigenProspecto'],
            $data['Observaciones'],

            $data['ModifiedUserID'],
            $data['ModifiedBy'],

            $cotizacionID,
            $empresaID
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE (SOFT DELETE)
    |--------------------------------------------------------------------------
    */

    public function delete(
        $cotizacionID,
        $empresaID,
        $usuarioID,
        $usuario
    )
    {
        $sql = "
            UPDATE CF_Cotizacion
            SET

                IsActive = 0,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionID = ?
              AND EmpresaID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $usuarioID,
            $usuario,

            $cotizacionID,
            $empresaID
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CAMBIO DE ESTADO
    |--------------------------------------------------------------------------
    */

    public function updateEstado(
        $cotizacionID,
        $empresaID,
        $estado,
        $usuarioID,
        $usuario
    )
    {
        $sql = "
            UPDATE CF_Cotizacion
            SET

                Estado = ?,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE CotizacionID = ?
              AND EmpresaID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $estado,

            $usuarioID,
            $usuario,

            $cotizacionID,
            $empresaID
        ]);
    }
}