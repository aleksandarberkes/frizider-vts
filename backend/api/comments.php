<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../config/Mailer.php';

function normalizeCommentRow(array $row): array
{
    $row['id'] = (int)$row['id'];
    $row['user_id'] = (int)$row['user_id'];
    $row['recipe_id'] = (int)$row['recipe_id'];
    $row['is_approved'] = (bool)$row['is_approved'];
    if (!array_key_exists('rejection_reason', $row)) {
        $row['rejection_reason'] = null;
    }
    if (array_key_exists('rating', $row) && $row['rating'] !== null) {
        $row['rating'] = (int)$row['rating'];
    }
    return $row;
}

$id = intSegment($segments, 2);

// GET /api/comments?recipe_id=N — list comments for a recipe.
// GET /api/comments — admin-only full moderation list
//   admin → all
//   everyone else → is_approved=1
if ($method === 'GET' && $id === null) {
    $caller  = currentUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';
    $recipeId = isset($_GET['recipe_id']) ? (int)$_GET['recipe_id'] : 0;

    if ($recipeId <= 0 && !$isAdmin) {
        respondError(422, 'recipe_id query param is required');
    }

    $pdo = getConnection();
    if ($isAdmin && $recipeId <= 0) {
        $stmt = $pdo->query(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.rejection_reason, c.created_at,
                    u.first_name, u.last_name, r.rating, rc.name AS recipe_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             JOIN recipes rc ON rc.id = c.recipe_id
             LEFT JOIN ratings r ON r.user_id = c.user_id AND r.recipe_id = c.recipe_id
             ORDER BY c.is_approved ASC, c.id DESC'
        );
    } elseif ($isAdmin) {
        $stmt = $pdo->prepare(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.rejection_reason, c.created_at,
                    u.first_name, u.last_name, r.rating, rc.name AS recipe_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             JOIN recipes rc ON rc.id = c.recipe_id
             LEFT JOIN ratings r ON r.user_id = c.user_id AND r.recipe_id = c.recipe_id
             WHERE c.recipe_id = :rid
             ORDER BY c.id'
        );
        $stmt->execute([':rid' => $recipeId]);
    } else {
        // Everyone sees approved comments; a logged-in caller also sees their
        // own comment even while it is pending, so the UI can tell they have
        // already commented on this recipe.
        $callerId = $caller ? (int)$caller['id'] : 0;
        $stmt = $pdo->prepare(
            'SELECT c.id, c.user_id, c.recipe_id, c.content, c.is_approved, c.rejection_reason, c.created_at,
                    u.first_name, u.last_name, r.rating, rc.name AS recipe_name
             FROM comments c
             JOIN users u ON u.id = c.user_id
             JOIN recipes rc ON rc.id = c.recipe_id
             LEFT JOIN ratings r ON r.user_id = c.user_id AND r.recipe_id = c.recipe_id
             WHERE c.recipe_id = :rid
               AND (c.is_approved = 1 OR c.user_id = :uid)
             ORDER BY c.id'
        );
        $stmt->execute([':rid' => $recipeId, ':uid' => $callerId]);
    }
    $rows = array_map('normalizeCommentRow', $stmt->fetchAll());
    respondJson(200, $rows);
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

    try {
        $pdo->prepare(
            'INSERT INTO comments (user_id, recipe_id, content, is_approved)
             VALUES (:uid, :rid, :c, 0)'
        )->execute([
            ':uid' => $caller['id'],
            ':rid' => $recipeId,
            ':c'   => $content,
        ]);
    } catch (PDOException $e) {
        // 1062 = the uq_comment_user_recipe unique key: one comment per recipe.
        if (($e->errorInfo[1] ?? null) === 1062) {
            respondError(409, 'vec ste komentarisali ovaj recept');
        }
        throw $e;
    }

    respondJson(201, normalizeCommentRow([
        'id'          => (int)$pdo->lastInsertId(),
        'user_id'     => (int)$caller['id'],
        'recipe_id'   => $recipeId,
        'content'     => $content,
        'is_approved' => false,
    ]));
}

// PUT /api/comments/{id} — owner can edit content; admin can edit content + is_approved.
if ($method === 'PUT' && $id !== null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT id, user_id, content, is_approved, rejection_reason FROM comments WHERE id = :id'
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

    // An admin can reject a comment (is_approved -> 0) with a reason; the author
    // is notified by e-mail.
    $rejectionReason = trim($body['rejection_reason'] ?? '');
    $isRejection     = $isAdmin
        && array_key_exists('is_approved', $body)
        && $approval === 0
        && $rejectionReason !== '';

    // Persist the reason: approving clears it, rejecting stores it, other edits keep it.
    if ($isAdmin && array_key_exists('is_approved', $body)) {
        $rejectionValue = $approval === 1 ? null : ($rejectionReason !== '' ? $rejectionReason : ($existing['rejection_reason'] ?? null));
    } else {
        $rejectionValue = $existing['rejection_reason'] ?? null;
    }

    $pdo->prepare(
        'UPDATE comments
         SET content = :c, is_approved = :ia, rejection_reason = :rr
         WHERE id = :id'
    )->execute([
        ':c'  => $content ?? $existing['content'],
        ':ia' => $approval,
        ':rr' => $rejectionValue,
        ':id' => $id,
    ]);

    $stmt = $pdo->prepare(
        'SELECT id, user_id, recipe_id, content, is_approved, rejection_reason, created_at
         FROM comments WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    // Best-effort rejection e-mail (never fail the request on a mail error).
    if ($isRejection) {
        $infoStmt = $pdo->prepare(
            'SELECT u.email, u.first_name, r.name AS recipe_name
             FROM comments c
             JOIN users u   ON u.id = c.user_id
             JOIN recipes r ON r.id = c.recipe_id
             WHERE c.id = :id'
        );
        $infoStmt->execute([':id' => $id]);
        $info = $infoStmt->fetch();
        if ($info) {
            Mailer::sendRejection(
                $info['email'],
                (string)($info['first_name'] ?? ''),
                'komentar',
                'na recept "' . $info['recipe_name'] . '"',
                $rejectionReason
            );
        }
    }

    respondJson(200, normalizeCommentRow($row));
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
