<?php

require_once __DIR__ . '/app/Core/Database.php';

require_once __DIR__ . '/app/Helpers/JwtHelper.php';

require_once __DIR__ . '/app/Middleware/JwtMiddleware.php';
require_once __DIR__ . '/app/Middleware/EmpresaMiddleware.php';

require_once __DIR__ . '/app/Repositories/BaseRepository.php';
require_once __DIR__ . '/app/Repositories/UsuarioRepository.php';
require_once __DIR__ . '/app/Repositories/ClienteRepository.php';

require_once __DIR__ . '/app/Services/AuthService.php';
require_once __DIR__ . '/app/Services/ClienteService.php';

require_once __DIR__ . '/app/Controllers/AuthController.php';
require_once __DIR__ . '/app/Controllers/ClienteController.php';

require_once __DIR__ . '/app/Repositories/CotizacionRepository.php';
require_once __DIR__ . '/app/Services/CotizacionService.php';
require_once __DIR__ . '/app/Controllers/CotizacionController.php';


require_once __DIR__ .'/app/Repositories/CotizacionDetalleRepository.php';
require_once __DIR__ .'/app/Services/CotizacionDetalleService.php';
require_once __DIR__ .'/app/Controllers/CotizacionDetalleController.php';