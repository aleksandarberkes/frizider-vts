<?php

require_once __DIR__ . '/database.php';

function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function currentUser(): ?array
{
    startSession();

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        return null;
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id,
                u.is_active, u.created_at, r.name AS role_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = :id'
    );
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user || !$user['is_active']) {
        $_SESSION = [];
        session_destroy();
        return null;
    }

    return $user;
}

function requireUser(): array
{
    $user = currentUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'authentication required']);
        exit;
    }
    return $user;
}

function requireAdmin(): array
{
    $user = requireUser();
    if (($user['role_name'] ?? null) !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'admin role required']);
        exit;
    }
    return $user;
}
