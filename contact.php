<?php
/* ============================================================
   NEXUS TECH — contacto.php
   Manejo del formulario de contacto con PostgreSQL / Neon
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* ── CONFIGURACIÓN DE BASE DE DATOS (Neon / Vercel) ──────── */
// Reemplaza los valores con tus credenciales de Neon
define('DB_HOST',     getenv('PGHOST')     ?: 'ep-old-rain-anx76mf7-pooler.c-6.us-east-1.aws.neon.tech');
define('DB_PORT',     getenv('PGPORT')     ?: '5432');
define('DB_NAME',     getenv('PGDATABASE') ?: 'maindb');
define('DB_USER',     getenv('PGUSER')     ?: 'neondb_owner');
define('DB_PASSWORD', getenv('PGPASSWORD') ?: 'npg_jOgItXdAhu69');
define('DB_SSLMODE',  'require');

/* ── FUNCIÓN: Conexión PDO ──────────────────────────────── */
function getDB(): PDO {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_SSLMODE
    );
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    return new PDO($dsn, DB_USER, DB_PASSWORD, $options);
}

/* ── FUNCIÓN: Sanitizar texto ───────────────────────────── */
function clean(string $val): string {
    return trim(strip_tags($val));
}

/* ── VALIDACIONES ───────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$nombres   = clean($_POST['nombres']   ?? '');
$apellidos = clean($_POST['apellidos'] ?? '');
$correo    = clean($_POST['correo']    ?? '');
$telefono  = clean($_POST['telefono']  ?? '');
$mensaje   = clean($_POST['mensaje']   ?? '');

// Nombres (mayúsculas, solo letras)
if (!preg_match('/^[A-ZÁÉÍÓÚÑÜ\s]{2,100}$/u', $nombres)) {
    echo json_encode(['success' => false, 'error' => 'Nombres inválidos.']);
    exit;
}

// Apellidos (mayúsculas, solo letras)
if (!preg_match('/^[A-ZÁÉÍÓÚÑÜ\s]{2,100}$/u', $apellidos)) {
    echo json_encode(['success' => false, 'error' => 'Apellidos inválidos.']);
    exit;
}

// Correo válido con @
if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || !str_contains($correo, '@')) {
    echo json_encode(['success' => false, 'error' => 'Correo electrónico inválido.']);
    exit;
}

// Teléfono: solo dígitos, 7-15 caracteres
if (!preg_match('/^\d{7,15}$/', $telefono)) {
    echo json_encode(['success' => false, 'error' => 'Teléfono inválido.']);
    exit;
}

// Mensaje
if (mb_strlen($mensaje) < 10 || mb_strlen($mensaje) > 2000) {
    echo json_encode(['success' => false, 'error' => 'El mensaje debe tener entre 10 y 2000 caracteres.']);
    exit;
}

/* ── INSERCIÓN EN BASE DE DATOS ─────────────────────────── */
try {
    $pdo = getDB();

    // Verificar si el teléfono ya existe (llave única)
    $stmtCheck = $pdo->prepare('SELECT id FROM clientes_web WHERE telefono = :telefono LIMIT 1');
    $stmtCheck->execute([':telefono' => $telefono]);

    if ($stmtCheck->fetch()) {
        echo json_encode([
            'success' => false,
            'error'   => 'Ya existe un registro con este número de teléfono.'
        ]);
        exit;
    }

    // Insertar nuevo registro
    $sql = 'INSERT INTO clientes_web (nombres, apellidos, correo, telefono, mensaje)
            VALUES (:nombres, :apellidos, :correo, :telefono, :mensaje)
            RETURNING id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombres'   => $nombres,
        ':apellidos' => $apellidos,
        ':correo'    => $correo,
        ':telefono'  => $telefono,
        ':mensaje'   => $mensaje,
    ]);

    $row = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'id'      => $row['id'] ?? null,
        'message' => '¡Mensaje enviado con éxito!'
    ]);

} catch (PDOException $e) {
    // En producción, no exponer detalles del error
    error_log('DB Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Error interno del servidor. Inténtalo más tarde.'
    ]);
}
exit;

/*
 ============================================================
  SQL PARA CREAR LA TABLA (ejecutar una sola vez en Neon):
 ============================================================

  CREATE TABLE IF NOT EXISTS clientes_web (
    id        SERIAL PRIMARY KEY,
    nombres   VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo    VARCHAR(150) NOT NULL,
    telefono  VARCHAR(20)  NOT NULL UNIQUE,
    mensaje   VARCHAR(2000),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes_web(telefono);

 ============================================================
  VARIABLES DE ENTORNO RECOMENDADAS (vercel.json o .env):
 ============================================================

  PGHOST=ep-xxxxxxxx.us-east-1.aws.neon.tech
  PGPORT=5432
  PGDATABASE=maindb_web
  PGUSER=tu_usuario
  PGPASSWORD=tu_contraseña_segura

 ============================================================
*/
