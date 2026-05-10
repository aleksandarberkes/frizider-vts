<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

// /api/favorites             → caller's favorites
// /api/favorites/{recipe_id} → a single favorite slot

$recipeId = intSegment($segments, 2);

// GET /api/favorites — caller's favorited recipes (joined with recipe info)
// Approval gating: hide unapproved recipes the caller doesn't own.
if ($method === 'GET' && $recipeId === null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo = getConnection();
    if ($isAdmin) {
        $stmt = $pdo->prepare(
            'SELECT f.recipe_id, r.name, r.image_path, r.is_approved, r.created_by
             FROM favorites f
             JOIN recipes r ON r.id = f.recipe_id
             WHERE f.user_id = :uid
             ORDER BY r.name'
        );
        $stmt->execute([':uid' => $caller['id']]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT f.recipe_id, r.name, r.image_path, r.is_approved, r.created_by
             FROM favorites f
             JOIN recipes r ON r.id = f.recipe_id
             WHERE f.user_id = :uid
               AND (r.is_approved = 1 OR r.created_by = :uid)
             ORDER BY r.name'
        );
        $stmt->execute([':uid' => $caller['id']]);
    }
    respondJson(200, $stmt->fetchAll());
}

// POST /api/favorites — add a favorite. user_id forced from session.
if ($method === 'POST' && $recipeId === null) {
    $caller = requireUser();
    $body   = readJsonBody();
    $rid    = isset($body['recipe_id']) ? (int)$body['recipe_id'] : 0;
    if ($rid <= 0) {
        respondError(422, 'recipe_id is required');
    }

    $pdo   = getConnection();
    $check = $pdo->prepare('SELECT 1 FROM recipes WHERE id = :id');
    $check->execute([':id' => $rid]);
    if (!$check->fetchColumn()) {
        respondError(422, "recipe_id {$rid} does not exist");
    }

    try {
        $pdo->prepare(
            'INSERT INTO favorites (user_id, recipe_id) VALUES (:uid, :rid)'
        )->execute([':uid' => $caller['id'], ':rid' => $rid]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'this recipe is already in your favorites');
        }
        throw $e;
    }
    respondJson(201, ['user_id' => (int)$caller['id'], 'recipe_id' => $rid]);
}

// DELETE /api/favorites/{recipe_id} — remove from caller's favorites
if ($method === 'DELETE' && $recipeId !== null) {
    $caller = requireUser();
    $pdo    = getConnection();
    $stmt   = $pdo->prepare(
        'DELETE FROM favorites WHERE user_id = :uid AND recipe_id = :rid'
    );
    $stmt->execute([':uid' => $caller['id'], ':rid' => $recipeId]);
    if ($stmt->rowCount() === 0) {
        respondError(404, 'recipe is not in your favorites');
    }
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
