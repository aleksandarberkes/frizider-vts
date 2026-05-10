<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

// /api/fridge          → user's own fridge
// /api/fridge/{id}     → a single ingredient slot in the user's fridge
// /api/fridge?user_id=N → admin can read another user's fridge

$ingredientId = intSegment($segments, 2);

// GET /api/fridge — list the caller's fridge (admin can read any with ?user_id=N)
if ($method === 'GET' && $ingredientId === null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $targetUserId = (int)$caller['id'];
    if ($isAdmin && isset($_GET['user_id'])) {
        $targetUserId = (int)$_GET['user_id'];
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT uf.user_id, uf.ingredient_id, i.name, i.unit
         FROM user_fridge uf
         JOIN ingredients i ON i.id = uf.ingredient_id
         WHERE uf.user_id = :uid
         ORDER BY i.name'
    );
    $stmt->execute([':uid' => $targetUserId]);
    respondJson(200, $stmt->fetchAll());
}

// POST /api/fridge — add an ingredient to the caller's fridge
//   Body: { "ingredient_id": int }
//   user_id is forced from the session — clients can never set it.
if ($method === 'POST' && $ingredientId === null) {
    $caller = requireUser();
    $body   = readJsonBody();
    $iid    = isset($body['ingredient_id']) ? (int)$body['ingredient_id'] : 0;
    if ($iid <= 0) {
        respondError(422, 'ingredient_id is required');
    }

    $pdo   = getConnection();
    $check = $pdo->prepare('SELECT 1 FROM ingredients WHERE id = :id');
    $check->execute([':id' => $iid]);
    if (!$check->fetchColumn()) {
        respondError(422, "ingredient_id {$iid} does not exist");
    }

    try {
        $pdo->prepare(
            'INSERT INTO user_fridge (user_id, ingredient_id) VALUES (:uid, :iid)'
        )->execute([':uid' => $caller['id'], ':iid' => $iid]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'ingredient is already in your fridge');
        }
        throw $e;
    }

    respondJson(201, ['user_id' => (int)$caller['id'], 'ingredient_id' => $iid]);
}

// DELETE /api/fridge/{ingredient_id} — remove an ingredient from caller's fridge
if ($method === 'DELETE' && $ingredientId !== null) {
    $caller = requireUser();
    $pdo    = getConnection();
    $stmt   = $pdo->prepare(
        'DELETE FROM user_fridge WHERE user_id = :uid AND ingredient_id = :iid'
    );
    $stmt->execute([':uid' => $caller['id'], ':iid' => $ingredientId]);
    if ($stmt->rowCount() === 0) {
        respondError(404, 'ingredient is not in your fridge');
    }
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
