<?php
/* ============================================================
   NEXUS TECH — admin.php
   Protected admin panel — view & filter Clientes_web
   ============================================================ */
session_start();

// ── Credentials (change in production!) ────────────────────
define('ADMIN_USER', 'nexusadmin');
define('ADMIN_PASS', '$2y$12$' . 'changethishashbeforegoinglivePleaseDontUseThis!!XYZ');
// Use password_hash('yourpassword', PASSWORD_BCRYPT) to generate a real hash.
// For quick testing you can also compare plain text (see login block below).
define('ADMIN_PASS_PLAIN', 'Nexus@2024!');   // REMOVE in production

// ── Login ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $u = trim($_POST['username'] ?? '');
    $p = trim($_POST['password'] ?? '');
    if ($u === ADMIN_USER && $p === ADMIN_PASS_PLAIN) {
        $_SESSION['nexus_admin'] = true;
    } else {
        $loginError = 'Credenciales incorrectas.';
    }
}

// ── Logout ──────────────────────────────────────────────────
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// ── DB connection ───────────────────────────────────────────
function getDB(): ?PDO {
    $dsn = getenv('DATABASE_URL');
    if (!$dsn) return null;
    try {
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

$clients = [];
$total   = 0;
$search  = '';

if (!empty($_SESSION['nexus_admin'])) {
    $pdo    = getDB();
    $search = trim($_GET['s'] ?? '');
    if ($pdo) {
        if ($search) {
            $stmt = $pdo->prepare("
                SELECT * FROM Clientes_web
                WHERE Nombres ILIKE :s OR Apellidos ILIKE :s OR Correo ILIKE :s OR Telefono ILIKE :s
                ORDER BY Id DESC
            ");
            $stmt->execute([':s' => "%$search%"]);
        } else {
            $stmt = $pdo->query("SELECT * FROM Clientes_web ORDER BY Id DESC");
        }
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $total   = count($clients);
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin — Nexus Tech</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:#0A0A0A;color:#fff;min-height:100vh}
a{color:#0066FF;text-decoration:none}
/* Login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.login-box{background:#0B1F3B;border:1px solid rgba(0,102,255,.2);border-radius:20px;padding:48px 40px;width:100%;max-width:420px;text-align:center}
.login-box h1{font-size:1.6rem;margin-bottom:8px}
.login-box p{color:#8899AA;margin-bottom:36px;font-size:.9rem}
.form-group{margin-bottom:18px;text-align:left}
.form-group label{display:block;font-size:.8rem;font-weight:600;color:#8899AA;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
.form-group input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:13px 16px;color:#fff;font-size:.95rem;outline:none;transition:border-color .25s}
.form-group input:focus{border-color:#0066FF}
.login-btn{width:100%;padding:14px;background:#CC5500;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:background .25s;margin-top:8px}
.login-btn:hover{background:#e06000}
.err{color:#FF7A90;font-size:.85rem;margin-top:12px}
/* Admin layout */
.admin-bar{background:#050B14;border-bottom:1px solid rgba(0,102,255,.15);padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between}
.admin-bar .logo{font-size:1.2rem;font-weight:800;font-family:system-ui}
.admin-bar .logo span{color:#CC5500} .admin-bar .logo em{color:#0066FF;font-style:normal}
.admin-bar .logout{padding:8px 20px;border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#8899AA;font-size:.85rem;transition:all .25s}
.admin-bar .logout:hover{background:#FF4A6B;border-color:#FF4A6B;color:#fff}
.admin-main{max-width:1200px;margin:0 auto;padding:40px 24px}
.stats-row{display:flex;gap:20px;margin-bottom:36px;flex-wrap:wrap}
.stat-card{background:rgba(11,31,59,.6);border:1px solid rgba(0,102,255,.15);border-radius:16px;padding:24px 28px;flex:1;min-width:160px}
.stat-num{font-size:2rem;font-weight:800;color:#0066FF}
.stat-label{font-size:.85rem;color:#8899AA;margin-top:4px}
.search-bar{display:flex;gap:12px;margin-bottom:28px}
.search-bar input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px 18px;color:#fff;font-size:.95rem;outline:none;transition:border-color .25s}
.search-bar input:focus{border-color:#0066FF}
.search-bar button{padding:12px 24px;background:#0066FF;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .25s}
.search-bar button:hover{background:#0055dd}
.table-wrap{overflow-x:auto;border-radius:16px;border:1px solid rgba(0,102,255,.12)}
table{width:100%;border-collapse:collapse;min-width:700px}
thead th{background:rgba(0,102,255,.1);padding:14px 18px;text-align:left;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8899AA;border-bottom:1px solid rgba(0,102,255,.12)}
tbody tr{border-bottom:1px solid rgba(255,255,255,.05);transition:background .2s}
tbody tr:hover{background:rgba(0,102,255,.06)}
tbody tr:last-child{border-bottom:none}
tbody td{padding:14px 18px;font-size:.88rem;color:rgba(255,255,255,.8)}
.badge-id{background:rgba(0,102,255,.15);color:#69AAFF;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700}
.no-data{text-align:center;padding:60px;color:#8899AA}
</style>
</head>
<body>

<?php if (empty($_SESSION['nexus_admin'])): ?>
<!-- ── LOGIN ── -->
<div class="login-wrap">
  <div class="login-box">
    <h1>🔐 Admin Panel</h1>
    <p>Acceso restringido — Nexus Tech</p>
    <form method="POST">
      <div class="form-group">
        <label>Usuario</label>
        <input type="text" name="username" autocomplete="username" required>
      </div>
      <div class="form-group">
        <label>Contraseña</label>
        <input type="password" name="password" autocomplete="current-password" required>
      </div>
      <?php if (!empty($loginError)): ?>
        <p class="err"><?= htmlspecialchars($loginError) ?></p>
      <?php endif; ?>
      <button class="login-btn" name="login" type="submit">Ingresar</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ── ADMIN ── -->
<div class="admin-bar">
  <div class="logo"><span>Nexus</span><em>Tech</em> · Admin</div>
  <a href="?logout=1" class="logout">Cerrar sesión</a>
</div>

<div class="admin-main">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-num"><?= $total ?></div>
      <div class="stat-label"><?= $search ? 'Resultados' : 'Clientes registrados' ?></div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#CC5500"><?= date('d/m/Y') ?></div>
      <div class="stat-label">Fecha actual</div>
    </div>
  </div>

  <form method="GET" class="search-bar">
    <input type="text" name="s" value="<?= htmlspecialchars($search) ?>" placeholder="Buscar por nombre, correo o teléfono…">
    <button type="submit">Buscar</button>
    <?php if ($search): ?><a href="admin.php" style="padding:12px 20px;border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#8899AA;display:flex;align-items:center;white-space:nowrap">✕ Limpiar</a><?php endif; ?>
  </form>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombres</th>
          <th>Apellidos</th>
          <th>Correo</th>
          <th>Teléfono</th>
          <th>Mensaje</th>
          <?php if (isset($clients[0]['Fecha'])): ?><th>Fecha</th><?php endif; ?>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($clients)): ?>
          <tr><td colspan="7" class="no-data">No hay registros<?= $search ? ' para "'.htmlspecialchars($search).'"' : '' ?>.</td></tr>
        <?php else: ?>
          <?php foreach ($clients as $c): ?>
          <tr>
            <td><span class="badge-id">#<?= $c['id'] ?? $c['Id'] ?></span></td>
            <td><?= htmlspecialchars($c['nombres']   ?? $c['Nombres']) ?></td>
            <td><?= htmlspecialchars($c['apellidos'] ?? $c['Apellidos']) ?></td>
            <td><?= htmlspecialchars($c['correo']    ?? $c['Correo']) ?></td>
            <td><?= htmlspecialchars($c['telefono']  ?? $c['Telefono']) ?></td>
            <td style="max-width:260px"><?= htmlspecialchars(substr($c['mensaje'] ?? $c['Mensaje'], 0, 100)) ?>…</td>
            <?php if (isset($c['Fecha'])): ?><td style="color:#8899AA;font-size:.8rem"><?= date('d/m/Y H:i', strtotime($c['Fecha'])) ?></td><?php endif; ?>
          </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php endif; ?>
</body>
</html>
