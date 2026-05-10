<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';

$id = intSegment($segments, 2);

// GET /api/roles — list all roles (public)
// GET /api/roles/{id} — single role (public)
if ($method === 'GET') {
    $pdo = getConnection();

    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT id, name FROM roles WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            respondError(404, 'role not found');
        }
        respondJson(200, $row);
    }

    $stmt = $pdo->query('SELECT id, name FROM roles ORDER BY id');
    respondJson(200, $stmt->fetchAll());
}

respondError(405, 'method not allowed');
