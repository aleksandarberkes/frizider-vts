<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);

// GET /api/comments?recipe_id=N — list comments for a recipe.
//   admin → all
//   logged-in → is_approved=1 OR own
//   anonymous → is_approved=1
if ($method === 'GET' && $id === null) {
    $recipeId = isset($_GET['recipe_id']) ? (int)$_GET['recipe_id'] : 0;
    if ($recipeId <= 0) {
        respondError(422, 'recipe_id query param is required');
    }

    $caller  = currentUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo = getConnection();
    if ($isAdmin) {
        $stmt = $pdo->prepare(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.created_at,
                    u.first_name, u.last_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.recipe_id = :rid
             ORDER BY c.id'
        );
        $stmt->execute([':rid' => $recipeId]);
    } elseif ($caller) {
        $stmt = $pdo->prepare(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.created_at,
                    u.first_name, u.last_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.recipe_id = :rid
               AND (c.is_approved = 1 OR c.user_id = :uid)
             ORDER BY c.id'
        );
        $stmt->execute([':rid' => $recipeId, ':uid' => $caller['id']]);
    } else {
        $stmt = $pdo->prepare(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.created_at,
                    u.first_name, u.last_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.recipe_id = :rid
               AND c.is_approved = 1
             ORDER BY c.id'
        );
        $stmt->execute([':rid' => $recipeId]);
    }
    respondJson(200, $stmt->fetchAll());
}

// POST /api/comments — caller leaves a comment.
//   user_id is taken from the session; any user_id in the body is ignored.
//   is_approved starts at 0.
if ($method === 'POST' && $id === null) {
    $caller   = requireUser();
    $body     = readJsonBody();
    $recipeId = isset($body['recipe_id']) ? (int)$body['recipe_id'] : 0;
    $content  = trim($body['content'] ?? '');

    if ($recipeId <= 0 || $content === '') {
        respondError(422, 'recipe_id and content are required');
    }

    $pdo   = getConnection();
    $check = $pdo->prepare('SELECT 1 FROM recipes WHERE id = :id');
    $check->execute([':id' => $recipeId]);
    if (!$check->fetchColumn()) {
        respondError(422, "recipe_id {$recipeId} does not exist");
    }

    $pdo->prepare(
        'INSERT INTO comments (user_id, recipe_id, content, is_approved)
         VALUES (:uid, :rid, :c, 0)'
    )->execute([
        ':uid' => $caller['id'],
        ':rid' => $recipeId,
        ':c'   => $content,
    ]);

    respondJson(201, [
        'id'          => (int)$pdo->lastInsertId(),
        'user_id'     => (int)$caller['id'],
        'recipe_id'   => $recipeId,
        'content'     => $content,
        'is_approved' => false,
    ]);
}

// PUT /api/comments/{id} — owner can edit content; admin can edit content + is_approved.
if ($method === 'PUT' && $id !== null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT id, user_id, content, is_approved FROM comments WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        respondError(404, 'comment not found');
    }
    $isOwner = (int)$caller['id'] === (int)$existing['user_id'];
    if (!$isAdmin && !$isOwner) {
        respondError(403, 'only the author or an admin can update this comment');
    }

    $body    = readJsonBody();
    $content = isset($body['content']) ? trim($body['content']) : null;
    if ($content !== null && $content === '') {
        respondError(422, 'content cannot be empty');
    }
    $approval = ($isAdmin && array_key_exists('is_approved', $body))
        ? ($body['is_approved'] ? 1 : 0)
        : (int)$existing['is_approved'];

    $pdo->prepare(
        'UPDATE comments
         SET content = :c, is_approved = :ia
         WHERE id = :id'
    )->execute([
        ':c'  => $content ?? $existing['content'],
        ':ia' => $approval,
        ':id' => $id,
    ]);

    $stmt = $pdo->prepare(
        'SELECT id, user_id, recipe_id, content, is_approved, created_at
         FROM comments WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    $row['is_approved'] = (bool)$row['is_approved'];
    respondJson(200, $row);
}

// DELETE /api/comments/{id} — owner or admin
if ($method === 'DELETE' && $id !== null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare('SELECT user_id FROM comments WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $userId = $stmt->fetchColumn();
    if ($userId === false) {
        respondError(404, 'comment not found');
    }
    if (!$isAdmin && (int)$caller['id'] !== (int)$userId) {
        respondError(403, 'only the author or an admin can delete this comment');
    }

    $pdo->prepare('DELETE FROM comments WHERE id = :id')->execute([':id' => $id]);
    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
