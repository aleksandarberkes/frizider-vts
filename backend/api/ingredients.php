<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);

// GET /api/ingredients — list (public)
// GET /api/ingredients/{id} — single (public)
if ($method === 'GET') {
    $pdo = getConnection();

    if ($id !== null) {
        $stmt = $pdo->prepare('SELECT id, name, unit FROM ingredients WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            respondError(404, 'ingredient not found');
        }
        respondJson(200, $row);
    }

    $stmt = $pdo->query('SELECT id, name, unit FROM ingredients ORDER BY name');
    respondJson(200, $stmt->fetchAll());
}

// POST /api/ingredients — any logged-in user can add (community-driven catalog)
if ($method === 'POST' && $id === null) {
    requireUser();
    $body = readJsonBody();
    $name = trim($body['name'] ?? '');
    $unit = trim($body['unit'] ?? '');

    if ($name === '' || $unit === '') {
        respondError(422, 'name and unit are required');
    }

    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('INSERT INTO ingredients (name, unit) VALUES (:name, :unit)');
        $stmt->execute([':name' => $name, ':unit' => $unit]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'an ingredient with this name already exists');
        }
        throw $e;
    }

    respondJson(201, ['id' => (int)$pdo->lastInsertId(), 'name' => $name, 'unit' => $unit]);
}

// PUT /api/ingredients/{id} — admin only
if ($method === 'PUT' && $id !== null) {
    requireAdmin();
    $body = readJsonBody();
    $name = trim($body['name'] ?? '');
    $unit = trim($body['unit'] ?? '');

    if ($name === '' || $unit === '') {
        respondError(422, 'name and unit are required');
    }

    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('UPDATE ingredients SET name = :name, unit = :unit WHERE id = :id');
        $stmt->execute([':name' => $name, ':unit' => $unit, ':id' => $id]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'an ingredient with this name already exists');
        }
        throw $e;
    }

    if ($stmt->rowCount() === 0) {
        respondError(404, 'ingredient not found');
    }
    respondJson(200, ['id' => $id, 'name' => $name, 'unit' => $unit]);
}

// DELETE /api/ingredients/{id} — admin only
if ($method === 'DELETE' && $id !== null) {
    requireAdmin();
    $pdo = getConnection();
    try {
        $stmt = $pdo->prepare('DELETE FROM ingredients WHERE id = :id');
        $stmt->execute([':id' => $id]);
    } catch (PDOException $e) {
        // 1451 = FK constraint (ingredient is referenced by recipe_ingredients or user_fridge)
        if (($e->errorInfo[1] ?? null) === 1451) {
            respondError(409, 'ingredient is in use by recipes or user fridges');
        }
        throw $e;
    }
    if ($stmt->rowCount() === 0) {
        respondError(404, 'ingredient not found');
    }
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
