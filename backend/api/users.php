<?php

require_once __DIR__ . '/../config/database.php';

// GET /api/users — return all users
if ($method === 'GET') {
    $pdo   = getConnection();
    $stmt  = $pdo->query('SELECT id, name, email FROM users');
    $users = $stmt->fetchAll();

    echo json_encode($users);
    exit;
}

// POST /api/users — create a user
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (empty($body['name']) || empty($body['email'])) {
        http_response_code(422);
        echo json_encode(['error' => 'name and email are required']);
        exit;
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (:name, :email)');
    $stmt->execute([':name' => $body['name'], ':email' => $body['email']]);

    http_response_code(201);
    echo json_encode(['id' => $pdo->lastInsertId(), 'name' => $body['name'], 'email' => $body['email']]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
