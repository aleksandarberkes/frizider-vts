<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

// /api/ratings                → caller's own ratings (logged-in)
// /api/ratings/recipe/{id}    → aggregate (avg, count) for a recipe (public)
// /api/ratings/{recipe_id}    → caller's specific rating-row actions
//                               (POST = upsert, DELETE = remove own;
//                                admin can DELETE anyone's via ?user_id=N)

$sub = $segments[2] ?? '';

// GET /api/ratings/recipe/{id} — public aggregate for a recipe
if ($sub === 'recipe' && $method === 'GET') {
    $recipeId = intSegment($segments, 3);
    if ($recipeId === null) {
        respondError(404, 'recipe id required');
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count
         FROM ratings WHERE recipe_id = :rid'
    );
    $stmt->execute([':rid' => $recipeId]);
    $row = $stmt->fetch();
    respondJson(200, [
        'recipe_id'    => $recipeId,
        'average'      => $row['avg_rating'] !== null ? (float)$row['avg_rating'] : null,
        'count'        => (int)$row['rating_count'],
    ]);
}

// GET /api/ratings — caller's own ratings
if ($method === 'GET' && $sub === '') {
    $caller = requireUser();
    $pdo    = getConnection();
    $stmt   = $pdo->prepare(
        'SELECT recipe_id, rating FROM ratings WHERE user_id = :uid ORDER BY recipe_id'
    );
    $stmt->execute([':uid' => $caller['id']]);
    respondJson(200, $stmt->fetchAll());
}

// POST /api/ratings — upsert caller's rating for a recipe
//   Body: { "recipe_id": int, "rating": 1..5 }
//   user_id forced from session.
if ($method === 'POST' && $sub === '') {
    $caller = requireUser();
    $body   = readJsonBody();
    $rid    = isset($body['recipe_id']) ? (int)$body['recipe_id'] : 0;
    $value  = isset($body['rating'])    ? (int)$body['rating']    : 0;

    if ($rid <= 0 || $value < 1 || $value > 5) {
        respondError(422, 'recipe_id and rating (1..5) are required');
    }

    $pdo   = getConnection();
    $check = $pdo->prepare('SELECT 1 FROM recipes WHERE id = :id');
    $check->execute([':id' => $rid]);
    if (!$check->fetchColumn()) {
        respondError(422, "recipe_id {$rid} does not exist");
    }

    $pdo->prepare(
        'INSERT INTO ratings (user_id, recipe_id, rating)
         VALUES (:uid, :rid, :rt)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating)'
    )->execute([
        ':uid' => $caller['id'],
        ':rid' => $rid,
        ':rt'  => $value,
    ]);

    respondJson(200, [
        'user_id'   => (int)$caller['id'],
        'recipe_id' => $rid,
        'rating'    => $value,
    ]);
}

// DELETE /api/ratings/{recipe_id} — caller deletes own rating
//   Admin can delete anyone's by passing ?user_id=N
if ($method === 'DELETE') {
    $caller   = requireUser();
    $isAdmin  = ($caller['role_name'] ?? null) === 'admin';
    $recipeId = intSegment($segments, 2);
    if ($recipeId === null) {
        respondError(404, 'recipe id required');
    }

    $targetUserId = (int)$caller['id'];
    if ($isAdmin && isset($_GET['user_id'])) {
        $targetUserId = (int)$_GET['user_id'];
    }

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'DELETE FROM ratings WHERE user_id = :uid AND recipe_id = :rid'
    );
    $stmt->execute([':uid' => $targetUserId, ':rid' => $recipeId]);
    if ($stmt->rowCount() === 0) {
        respondError(404, 'rating not found');
    }
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
