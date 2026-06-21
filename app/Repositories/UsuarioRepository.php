<?php

namespace App\Repositories;

class UsuarioRepository extends BaseRepository
{
    public function getByEmail($correo)
    {
        $sql = "
            SELECT *
            FROM CF_Usuario
            WHERE Correo = ?
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([$correo]);

        return $stmt->fetch();
    }
}