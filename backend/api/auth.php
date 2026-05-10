<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

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
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id)
             VALUES (:email, :password_hash, :first_name, :last_name, :phone, :role_id)'
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

    http_response_code(201);
    echo json_encode([
        'id'         => (int)$pdo->lastInsertId(),
        'email'      => $email,
        'first_name' => $firstName,
        'last_name'  => $lastName,
        'phone'      => $phone,
        'role_id'    => (int)$roleId,
        'role_name'  => 'user',
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

http_response_code(404);
echo json_encode(['error' => "Route '/api/auth/{$action}' not found or method not allowed"]);
