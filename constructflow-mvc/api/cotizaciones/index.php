<?php
// Standalone safe API endpoint for /api/cotizaciones
header('Content-Type: application/json');
@mkdir(__DIR__ . '/../../tmp', 0755, true);
file_put_contents(__DIR__ . '/../../tmp/cotizaciones.request.log', date('c') . " - " . ($_SERVER['REQUEST_METHOD'] ?? '?') . " " . ($_SERVER['REQUEST_URI'] ?? '?') . "\n", FILE_APPEND);

$configFile = __DIR__ . '/../../config/config.php';
if (!file_exists($configFile)) {
    echo json_encode(['data' => [], 'error' => 'Config file not found']);
    exit;
}

$config = require $configFile;
$host = $config['db_host'] ?? '127.0.0.1';
$name = $config['db_name'] ?? 'constructflow';
$user = $config['db_user'] ?? 'root';
$pass = $config['db_pass'] ?? '';
$charset = $config['db_charset'] ?? 'utf8mb4';

$dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $name, $charset);
if (!class_exists('PDO')) {
    file_put_contents(__DIR__ . '/../../tmp/cotizaciones.error.log', date('c') . " - PDO not available\n", FILE_APPEND);
    echo json_encode(['data' => [], 'error' => 'PDO extension not available on this server']);
    exit;
}

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query('SELECT id, empresa_id, user_id, numero, atencion, fecha, total, estado, created_at FROM cotizaciones ORDER BY id DESC LIMIT 100');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['data' => $rows]);
} catch (\Throwable $e) {
    file_put_contents(__DIR__ . '/../../tmp/cotizaciones.error.log', date('c') . " - " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n", FILE_APPEND);
    echo json_encode(['data' => [], 'error' => 'DB connection/query failed (see tmp/cotizaciones.error.log)']);
}
