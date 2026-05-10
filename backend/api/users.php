<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$sub = $segments[2] ?? '';
$id  = intSegment($segments, 2);

// ----- helpers --------------------------------------------------------------

function fetchUserRow(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id,
                r.name AS role_name, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = :id'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function deleteUserAndOwnedContent(PDO $pdo, int $userId): void
{
    // Per access rules: a user (or admin acting on a user) can be removed only
    // if the user owns no recipes. The user's own ratings and comments get
    // wiped first since the schema doesn't cascade those.
    $check = $pdo->prepare('SELECT COUNT(*) FROM recipes WHERE created_by = :id');
    $check->execute([':id' => $userId]);
    if ((int)$check->fetchColumn() > 0) {
        respondError(409, 'user has recipes; delete or reassign them before deleting the user');
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM ratings  WHERE user_id = :id')->execute([':id' => $userId]);
        $pdo->prepare('DELETE FROM comments WHERE user_id = :id')->execute([':id' => $userId]);
        $pdo->prepare('DELETE FROM users    WHERE id      = :id')->execute([':id' => $userId]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ----- /api/users/me/password (POST, self) ---------------------------------

if ($sub === 'me' && ($segments[3] ?? '') === 'password' && $method === 'POST') {
    $user = requireUser();
    $body            = readJsonBody();
    $currentPassword = (string)($body['current_password'] ?? '');
    $newPassword     = (string)($body['new_password']     ?? '');

    if ($currentPassword === '' || $newPassword === '') {
        respondError(422, 'current_password and new_password are required');
    }
    if (strlen($newPassword) < 6) {
        respondError(422, 'new_password must be at least 6 characters');
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id');
    $stmt->execute([':id' => $user['id']]);
    $hash = $stmt->fetchColumn();

    if (!$hash || !password_verify($currentPassword, $hash)) {
        respondError(401, 'current password is incorrect');
    }

    $update = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
    $update->execute([
        ':hash' => password_hash($newPassword, PASSWORD_BCRYPT),
        ':id'   => $user['id'],
    ]);

    respondJson(200, ['ok' => true]);
}

// ----- /api/users/me (PUT/DELETE, self) ------------------------------------

if ($sub === 'me' && ($segments[3] ?? '') === '') {
    $user = requireUser();

    if ($method === 'PUT') {
        $body      = readJsonBody();
        $firstName = trim($body['first_name'] ?? '');
        $lastName  = trim($body['last_name']  ?? '');
        $phone     = isset($body['phone']) ? (trim($body['phone']) ?: null) : $user['phone'];

        if ($firstName === '' || $lastName === '') {
            respondError(422, 'first_name and last_name are required');
        }

        $pdo = getConnection();
        $pdo->prepare(
            'UPDATE users
             SET first_name = :fn, last_name = :ln, phone = :ph
             WHERE id = :id'
        )->execute([
            ':fn' => $firstName,
            ':ln' => $lastName,
            ':ph' => $phone,
            ':id' => $user['id'],
        ]);

        respondJson(200, fetchUserRow($pdo, (int)$user['id']));
    }

    if ($method === 'DELETE') {
        $pdo = getConnection();
        deleteUserAndOwnedContent($pdo, (int)$user['id']);

        // Tear down the now-orphaned session.
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

        respondJson(200, ['ok' => true]);
    }

    respondError(405, 'method not allowed');
}

// ----- /api/users/{id} (GET/PUT/DELETE) ------------------------------------

if ($id !== null) {
    if ($method === 'GET') {
        $caller = requireUser();
        if ($caller['id'] !== $id && ($caller['role_name'] ?? null) !== 'admin') {
            respondError(403, 'you can only view your own user record');
        }

        $pdo = getConnection();
        $row = fetchUserRow($pdo, $id);
        if (!$row) {
            respondError(404, 'user not found');
        }
        respondJson(200, $row);
    }

    if ($method === 'PUT') {
        requireAdmin();
        $body      = readJsonBody();
        $email     = trim($body['email']      ?? '');
        $firstName = trim($body['first_name'] ?? '');
        $lastName  = trim($body['last_name']  ?? '');
        $phone     = isset($body['phone'])    ? (trim($body['phone']) ?: null) : null;
        $roleId    = isset($body['role_id'])  ? (int)$body['role_id'] : 0;
        $isActive  = isset($body['is_active']) ? (bool)$body['is_active'] : null;

        if ($email === '' || $firstName === '' || $lastName === '' || $roleId <= 0 || $isActive === null) {
            respondError(422, 'email, first_name, last_name, role_id and is_active are required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respondError(422, 'email is not valid');
        }

        $pdo = getConnection();

        $roleStmt = $pdo->prepare('SELECT name FROM roles WHERE id = :id');
        $roleStmt->execute([':id' => $roleId]);
        if (!$roleStmt->fetchColumn()) {
            respondError(422, "role_id {$roleId} does not exist");
        }

        try {
            $pdo->prepare(
                'UPDATE users
                 SET email = :em, first_name = :fn, last_name = :ln,
                     phone = :ph, role_id = :rid, is_active = :ia
                 WHERE id = :id'
            )->execute([
                ':em'  => $email,
                ':fn'  => $firstName,
                ':ln'  => $lastName,
                ':ph'  => $phone,
                ':rid' => $roleId,
                ':ia'  => $isActive ? 1 : 0,
                ':id'  => $id,
            ]);
        } catch (PDOException $e) {
            if (($e->errorInfo[1] ?? null) === 1062) {
                respondError(409, 'a user with this email already exists');
            }
            throw $e;
        }

        $row = fetchUserRow($pdo, $id);
        if (!$row) {
            respondError(404, 'user not found');
        }
        respondJson(200, $row);
    }

    if ($method === 'DELETE') {
        $caller = requireAdmin();
        if ($caller['id'] === $id) {
            respondError(409, 'admins cannot delete themselves through this endpoint; use DELETE /api/users/me');
        }
        $pdo = getConnection();
        if (!fetchUserRow($pdo, $id)) {
            respondError(404, 'user not found');
        }
        deleteUserAndOwnedContent($pdo, $id);
        respondJson(200, ['ok' => true]);
    }

    respondError(405, 'method not allowed');
}

// ----- /api/users (GET admin list / POST admin create) ---------------------

if ($method === 'GET') {
    requireAdmin();
    $pdo  = getConnection();
    $stmt = $pdo->query(
        'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id,
                r.name AS role_name, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON r.id = u.role_id
         ORDER BY u.id'
    );
    respondJson(200, $stmt->fetchAll());
}

if ($method === 'POST') {
    requireAdmin();

    $body      = readJsonBody();
    $email     = trim($body['email']      ?? '');
    $password  = (string)($body['password'] ?? '');
    $firstName = trim($body['first_name'] ?? '');
    $lastName  = trim($body['last_name']  ?? '');
    $phone     = trim($body['phone']      ?? '') ?: null;
    $roleId    = isset($body['role_id']) ? (int)$body['role_id'] : 0;

    if ($email === '' || $password === '' || $firstName === '' || $lastName === '' || $roleId <= 0) {
        respondError(422, 'email, password, first_name, last_name and role_id are required');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respondError(422, 'email is not valid');
    }
    if (strlen($password) < 6) {
        respondError(422, 'password must be at least 6 characters');
    }

    $pdo = getConnection();

    $roleStmt = $pdo->prepare('SELECT name FROM roles WHERE id = :id');
    $roleStmt->execute([':id' => $roleId]);
    $roleName = $roleStmt->fetchColumn();
    if (!$roleName) {
        respondError(422, "role_id {$roleId} does not exist");
    }

    try {
        $pdo->prepare(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id)
             VALUES (:email, :ph, :fn, :ln, :phone, :rid)'
        )->execute([
            ':email' => $email,
            ':ph'    => password_hash($password, PASSWORD_BCRYPT),
            ':fn'    => $firstName,
            ':ln'    => $lastName,
            ':phone' => $phone,
            ':rid'   => $roleId,
        ]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'a user with this email already exists');
        }
        throw $e;
    }

    respondJson(201, [
        'id'         => (int)$pdo->lastInsertId(),
        'email'      => $email,
        'first_name' => $firstName,
        'last_name'  => $lastName,
        'phone'      => $phone,
        'role_id'    => $roleId,
        'role_name'  => $roleName,
    ]);
}

respondError(405, 'method not allowed');
