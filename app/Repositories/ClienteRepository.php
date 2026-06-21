<?php

namespace App\Repositories;

class ClienteRepository extends BaseRepository
{
    public function existsNombreCliente(
        $empresaID,
        $nombreCliente
        )
        {
            $sql = "
                SELECT ClienteID
                FROM CF_Cliente
                WHERE EmpresaID = ?
                AND UPPER(TRIM(NombreCliente)) =
                    UPPER(TRIM(?))
                AND IsActive = 1
                LIMIT 1
            ";

            $stmt = $this->db->prepare($sql);

            $stmt->execute([
                $empresaID,
                $nombreCliente
            ]);

            return $stmt->fetch();
        }

    public function getAll($empresaID)
    {
        $sql = "
            SELECT *
            FROM CF_Cliente
            WHERE EmpresaID = ?
              AND IsActive = 1
            ORDER BY NombreCliente
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$empresaID]);

        return $stmt->fetchAll();
    }

    public function getById($clienteID, $empresaID)
    {
        $sql = "
            SELECT *
            FROM CF_Cliente
            WHERE ClienteID = ?
              AND EmpresaID = ?
              AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $clienteID,
            $empresaID
        ]);

        return $stmt->fetch();
    }

    public function insert($data)
    {
        $sql = "
            INSERT INTO CF_Cliente
            (
                EmpresaID,
                RFC,
                NombreCliente,
                ContactoPrincipal,
                Telefono,
                Correo,
                Direccion,
                LimiteCredito,
                DiasCredito,
                Observaciones,

                CreatedUserID,
                CreatedBy
            )
            VALUES
            (
                ?,?,?,?,?,?,?,?,?,?,
                ?,?
            )
        ";
        try
        {

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            $data['EmpresaID'],
            $data['RFC'],
            $data['NombreCliente'],
            $data['ContactoPrincipal'],
            $data['Telefono'],
            $data['Correo'],
            $data['Direccion'],
            $data['LimiteCredito'],
            $data['DiasCredito'],
            $data['Observaciones'],
            $data['CreatedUserID'],
            $data['CreatedBy']
        ]);
            return true;
        }
        catch (\PDOException $e)
        {
            return false;
        }
    }

    public function update($clienteID, $empresaID, $data)
    {
        $sql = "
            UPDATE CF_Cliente
            SET

                RFC = ?,
                NombreCliente = ?,
                ContactoPrincipal = ?,
                Telefono = ?,
                Correo = ?,
                Direccion = ?,
                LimiteCredito = ?,
                DiasCredito = ?,
                Observaciones = ?,

                ModifiedUserID = ?,
                ModifiedBy = ?,
                ModifiedDate = NOW(),

                RowVersion = RowVersion + 1

            WHERE ClienteID = ?
            AND EmpresaID = ?
        ";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([

            $data['RFC'],
            $data['NombreCliente'],
            $data['ContactoPrincipal'],
            $data['Telefono'],
            $data['Correo'],
            $data['Direccion'],
            $data['LimiteCredito'],
            $data['DiasCredito'],
            $data['Observaciones'],

            $data['ModifiedUserID'],
            $data['ModifiedBy'],

            $clienteID,
            $empresaID
        ]);
    }
    public function existsNombreClienteUpdate(
    $empresaID,
    $nombreCliente,
    $clienteID
    )
    {
        $sql = "
            SELECT ClienteID
            FROM CF_Cliente
            WHERE EmpresaID = ?
            AND UPPER(TRIM(NombreCliente))
                = UPPER(TRIM(?))
            AND ClienteID <> ?
            AND IsActive = 1
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            $empresaID,
            $nombreCliente,
            $clienteID
        ]);

        return $stmt->fetch();
    }

    public function delete(
    $clienteID,
    $empresaID,
    $usuarioID,
    $usuario
)
{
    $sql = "
        UPDATE CF_Cliente
        SET

            IsActive = 0,

            ModifiedUserID = ?,
            ModifiedBy = ?,
            ModifiedDate = NOW(),

            RowVersion = RowVersion + 1

        WHERE ClienteID = ?
          AND EmpresaID = ?
    ";

    $stmt = $this->db->prepare($sql);

    return $stmt->execute([
        $usuarioID,
        $usuario,
        $clienteID,
        $empresaID
    ]);
}
}