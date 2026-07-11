<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/tokens.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/Mailer.php';

$action = $segments[2] ?? '';

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function publicUserShape(array $user): array
{
    return [
        'id'         => (int)$user['id'],
        'email'      => $user['email'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'phone'      => $user['phone'],
        'role_id'    => (int)$user['role_id'],
        'role_name'  => $user['role_name'] ?? null,
        'is_active'  => (bool)$user['is_active'],
    ];
}

// POST /api/auth/register — public self-signup, always creates role 'user'
if ($action === 'register' && $method === 'POST') {
    $body      = readJsonBody();
    $email     = trim($body['email']      ?? '');
    $password  = (string)($body['password'] ?? '');
    $firstName = trim($body['first_name'] ?? '');
    $lastName  = trim($body['last_name']  ?? '');
    $phone     = trim($body['phone']      ?? '') ?: null;

    if ($email === '' || $password === '' || $firstName === '' || $lastName === '') {
        http_response_code(422);
        echo json_encode(['error' => 'email, password, first_name and last_name are required']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['error' => 'email is not valid']);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(422);
        echo json_encode(['error' => 'password must be at least 6 characters']);
        exit;
    }

    $pdo = getConnection();

    $roleStmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'user' LIMIT 1");
    $roleStmt->execute();
    $roleId = $roleStmt->fetchColumn();
    if (!$roleId) {
        http_response_code(500);
        echo json_encode(['error' => "default 'user' role is missing from roles table"]);
        exit;
    }

    try {
        // New accounts start inactive; they must click the e-mailed activation
        // link before they can log in (login blocks is_active = 0).
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, is_active)
             VALUES (:email, :password_hash, :first_name, :last_name, :phone, :role_id, 0)'
        );
        $stmt->execute([
            ':email'         => $email,
            ':password_hash' => password_hash($password, PASSWORD_BCRYPT),
            ':first_name'    => $firstName,
            ':last_name'     => $lastName,
            ':phone'         => $phone,
            ':role_id'       => $roleId,
        ]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            http_response_code(409);
            echo json_encode(['error' => 'a user with this email already exists']);
            exit;
        }
        throw $e;
    }

    $newUserId = (int)$pdo->lastInsertId();

    // Issue an activation token (valid 24h) and e-mail the activation link.
    $token = createUserToken($pdo, $newUserId, 'activation', 86400);
    $link  = FRONTEND_BASE_URL . '/activate?token=' . urlencode($token);
    Mailer::sendActivation($email, $firstName, $link);

    http_response_code(201);
    echo json_encode([
        'status'  => 'activation_sent',
        'message' => 'Nalog je kreiran. Proverite e-mail da biste aktivirali nalog.',
        'email'   => $email,
    ]);
    exit;
}

// POST /api/auth/login — verify credentials, start session
if ($action === 'login' && $method === 'POST') {
    $body     = readJsonBody();
    $email    = trim($body['email']    ?? '');
    $password = (string)($body['password'] ?? '');

    if ($email === '' || $password === '') {
        http_response_code(422);
        echo json_encode(['error' => 'email and password are required']);
        exit;
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone,
                u.role_id, u.is_active, u.created_at, r.name AS role_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.email = :email
         LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid credentials']);
        exit;
    }
    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode(['error' => 'account is not active']);
        exit;
    }

    startSession();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];

    echo json_encode(publicUserShape($user));
    exit;
}

// POST /api/auth/logout — destroy session
if ($action === 'logout' && $method === 'POST') {
    startSession();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

// GET /api/auth/me — current user (rehydration endpoint)
if ($action === 'me' && $method === 'GET') {
    $user = requireUser();
    echo json_encode(publicUserShape($user));
    exit;
}

// POST /api/auth/activate — consume an activation token, activate the account
if ($action === 'activate' && $method === 'POST') {
    $body  = readJsonBody();
    $token = trim($body['token'] ?? '');

    $pdo    = getConnection();
    $userId = consumeUserToken($pdo, $token, 'activation');
    if ($userId === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Aktivacioni link je nevazeci ili je istekao.']);
        exit;
    }

    $pdo->prepare('UPDATE users SET is_active = 1 WHERE id = :id')
        ->execute([':id' => $userId]);

    echo json_encode(['status' => 'activated', 'message' => 'Nalog je aktiviran. Sada se mozete prijaviti.']);
    exit;
}

// POST /api/auth/forgot-password — issue a reset token and e-mail the link.
// Always responds 200 (never reveals whether the e-mail is registered).
if ($action === 'forgot-password' && $method === 'POST') {
    $body  = readJsonBody();
    $email = trim($body['email'] ?? '');

    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $pdo  = getConnection();
        $stmt = $pdo->prepare(
            'SELECT id, first_name FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if ($user) {
            $token = createUserToken($pdo, (int)$user['id'], 'password_reset', 3600);
            $link  = FRONTEND_BASE_URL . '/reset-password?token=' . urlencode($token);
            Mailer::sendPasswordReset($email, (string)($user['first_name'] ?? ''), $link);
        }
    }

    echo json_encode([
        'status'  => 'reset_sent',
        'message' => 'Ako nalog sa tim e-mailom postoji, poslali smo link za promenu lozinke.',
    ]);
    exit;
}

// POST /api/auth/reset-password — consume a reset token, set a new password
if ($action === 'reset-password' && $method === 'POST') {
    $body     = readJsonBody();
    $token    = trim($body['token'] ?? '');
    $password = (string)($body['password'] ?? '');

    if (strlen($password) < 6) {
        http_response_code(422);
        echo json_encode(['error' => 'password must be at least 6 characters']);
        exit;
    }

    $pdo    = getConnection();
    $userId = consumeUserToken($pdo, $token, 'password_reset');
    if ($userId === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Link za promenu lozinke je nevazeci ili je istekao.']);
        exit;
    }

    $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id')
        ->execute([
            ':hash' => password_hash($password, PASSWORD_BCRYPT),
            ':id'   => $userId,
        ]);

    echo json_encode(['status' => 'password_reset', 'message' => 'Lozinka je promenjena. Sada se mozete prijaviti.']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => "Route '/api/auth/{$action}' not found or method not allowed"]);
