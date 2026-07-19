<?php
/**
 * MenuBuilder
 * Ref: DEF-WEB-003 sección 3 (Generar el menú dinámico) y sección 6.
 *
 * Construye el árbol de menú a partir del catálogo maestro de opciones
 * del sistema, filtrado por los permisos del usuario autenticado.
 *
 * Nota: el catálogo maestro ($catalogo) se muestra aquí como arreglo
 * estático de referencia. En una siguiente iteración puede moverse a
 * Repositories/MenuRepository.php y traerse desde la API/BD, manteniendo
 * esta clase únicamente como el "armador" (regla de negocio de armado,
 * no de origen de datos).
 */

class MenuBuilder
{
    /**
     * Catálogo maestro de opciones de menú del sistema.
     * 'permiso' es la clave que debe existir (con valor truthy) en el
     * arreglo de permisos del usuario para que la opción sea visible.
     */
    private static array $catalogo = [
        [
            'label'   => 'Dashboard',
            'icon'    => 'bi-speedometer2',
            'url'     => '/dashboard',
            'permiso' => 'dashboard.ver',
        ],
        [
            'label'   => 'Clientes',
            'icon'    => 'bi-people',
            'url'     => '/clientes',
            'permiso' => 'clientes.ver',
        ],
        [
            'label'   => 'Cotizaciones',
            'icon'    => 'bi-file-earmark-text',
            'url'     => '/cotizaciones',
            'permiso' => 'cotizaciones.ver',
            'submenu' => [
                ['label' => 'Nueva cotización', 'url' => '/cotizaciones/nueva',   'permiso' => 'cotizaciones.crear'],
                ['label' => 'Seguimiento',      'url' => '/cotizaciones/seguimiento', 'permiso' => 'cotizaciones.seguimiento'],
            ],
        ],
        [
            'label'   => 'Proyectos',
            'icon'    => 'bi-kanban',
            'url'     => '/proyectos',
            'permiso' => 'proyectos.ver',
        ],
        [
            'label'   => 'Reportes',
            'icon'    => 'bi-graph-up',
            'url'     => '/reportes',
            'permiso' => 'reportes.ver',
        ],
        [
            'label'   => 'Configuración',
            'icon'    => 'bi-gear',
            'url'     => '/configuracion',
            'permiso' => 'configuracion.ver',
        ],
    ];

    /**
     * Genera el menú visible para el usuario según sus permisos.
     *
     * @param array $permisos Arreglo de permisos del usuario, ej: ['dashboard.ver' => true, ...]
     *                        También acepta lista simple: ['dashboard.ver', 'clientes.ver', ...]
     * @return array Menú filtrado, listo para renderizar en views/components/sidebar.php
     */
    public static function generar(array $permisos): array
    {
        // Normaliza el formato de permisos a un set de búsqueda rápida (isset)
        $permisosSet = self::normalizarPermisos($permisos);

        $menu = [];

        foreach (self::$catalogo as $opcion) {
            if (!self::tienePermiso($permisosSet, $opcion['permiso'])) {
                continue;
            }

            $item = [
                'label' => $opcion['label'],
                'icon'  => $opcion['icon'],
                'url'   => $opcion['url'],
            ];

            if (!empty($opcion['submenu'])) {
                $submenu = [];
                foreach ($opcion['submenu'] as $sub) {
                    if (self::tienePermiso($permisosSet, $sub['permiso'])) {
                        $submenu[] = [
                            'label' => $sub['label'],
                            'url'   => $sub['url'],
                        ];
                    }
                }
                if (!empty($submenu)) {
                    $item['submenu'] = $submenu;
                }
            }

            $menu[] = $item;
        }

        return $menu;
    }

    private static function normalizarPermisos(array $permisos): array
    {
        // ['clientes.ver', 'proyectos.ver'] -> ['clientes.ver' => true, 'proyectos.ver' => true]
        if (array_is_list($permisos)) {
            return array_fill_keys($permisos, true);
        }
        return $permisos;
    }

    private static function tienePermiso(array $permisosSet, string $clave): bool
    {
        return !empty($permisosSet[$clave]);
    }
}
