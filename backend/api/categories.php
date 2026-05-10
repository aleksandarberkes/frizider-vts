<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);

// GET /api/categories — list (public)
// GET /api/categories/{id} — single (public)
if ($method === 'GET') {
    $pdo = getConnection();

    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT id, name FROM categories WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            respondError(404, 'category not found');
        }
        respondJson(200, $row);
    }

    $stmt = $pdo->query('SELECT id, name FROM categories ORDER BY name');
    respondJson(200, $stmt->fetchAll());
}

// POST /api/categories — admin only
if ($method === 'POST' && $id === null) {
    requireAdmin();
    $body = readJsonBody();
    $name = trim($body['name'] ?? '');

    if ($name === '') {
        respondError(422, 'name is required');
    }

    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('INSERT INTO categories (name) VALUES (:name)');
        $stmt->execute([':name' => $name]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'a category with this name already exists');
        }
        throw $e;
    }

    respondJson(201, ['id' => (int)$pdo->lastInsertId(), 'name' => $name]);
}

// PUT /api/categories/{id} — admin only
if ($method === 'PUT' && $id !== null) {
    requireAdmin();
    $body = readJsonBody();
    $name = trim($body['name'] ?? '');

    if ($name === '') {
        respondError(422, 'name is required');
    }

    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('UPDATE categories SET name = :name WHERE id = :id');
        $stmt->execute([':name' => $name, ':id' => $id]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'a category with this name already exists');
        }
        throw $e;
    }

    if ($stmt->rowCount() === 0) {
        respondError(404, 'category not found');
    }
    respondJson(200, ['id' => $id, 'name' => $name]);
}

// DELETE /api/categories/{id} — admin only
if ($method === 'DELETE' && $id !== null) {
    requireAdmin();
    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('DELETE FROM categories WHERE id = :id');
        $stmt->execute([':id' => $id]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1451) {
            respondError(409, 'category is in use by recipes');
        }
        throw $e;
    }
    if ($stmt->rowCount() === 0) {
        respondError(404, 'category not found');
    }
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
