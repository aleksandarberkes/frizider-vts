<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);

$dayNames = [
    1 => 'Ponedeljak',
    2 => 'Utorak',
    3 => 'Sreda',
    4 => 'Četvrtak',
    5 => 'Petak',
    6 => 'Subota',
    7 => 'Nedelja',
];

function canUseRecipe(PDO $pdo, int $recipeId, array $user): bool
{
    $isAdmin = ($user['role_name'] ?? null) === 'admin';

    $stmt = $pdo->prepare(
        'SELECT created_by, is_approved
         FROM recipes
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute([':id' => $recipeId]);
    $recipe = $stmt->fetch();

    if (!$recipe) {
        return false;
    }

    return $isAdmin || (bool)$recipe['is_approved'] || (int)$recipe['created_by'] === (int)$user['id'];
}

function validateMenuItems(PDO $pdo, $rawItems, array $user): array
{
    if (!is_array($rawItems)) {
        respondError(422, 'items must be an array');
    }

    $items = [];
    $seen = [];

    foreach ($rawItems as $index => $item) {
        if (!is_array($item)) {
            respondError(422, 'each item must be an object');
        }

        $dayOfWeek = (int)($item['day_of_week'] ?? 0);
        $recipeId = (int)($item['recipe_id'] ?? 0);

        if ($dayOfWeek < 1 || $dayOfWeek > 7) {
            respondError(422, 'day_of_week must be between 1 and 7');
        }

        if ($recipeId <= 0) {
            respondError(422, 'recipe_id is required');
        }

        if (!canUseRecipe($pdo, $recipeId, $user)) {
            respondError(422, "recipe_id {$recipeId} does not exist or is not available");
        }

        $uniqueKey = $dayOfWeek . ':' . $recipeId;
        if (isset($seen[$uniqueKey])) {
            continue;
        }

        $seen[$uniqueKey] = true;
        $items[] = [
            'day_of_week' => $dayOfWeek,
            'recipe_id' => $recipeId,
            'position' => $index + 1,
        ];
    }

    return $items;
}

function loadMenu(PDO $pdo, int $menuId, int $userId): ?array
{
    global $dayNames;

    $stmt = $pdo->prepare(
        'SELECT id, user_id, name, created_at, updated_at
         FROM weekly_menus
         WHERE id = :id
           AND user_id = :user_id
         LIMIT 1'
    );
    $stmt->execute([
        ':id' => $menuId,
        ':user_id' => $userId,
    ]);

    $menu = $stmt->fetch();
    if (!$menu) {
        return null;
    }

    $days = [];
    foreach ($dayNames as $dayNumber => $dayName) {
        $days[$dayNumber] = [
            'day_of_week' => $dayNumber,
            'day_name' => $dayName,
            'recipes' => [],
        ];
    }

    $itemsStmt = $pdo->prepare(
        'SELECT wmr.id, wmr.day_of_week, wmr.recipe_id, wmr.position,
                r.name, r.description, r.image_path, r.estimated_price,
                r.created_by, r.is_approved, r.created_at
         FROM weekly_menu_recipes wmr
         JOIN recipes r ON r.id = wmr.recipe_id
         WHERE wmr.menu_id = :menu_id
         ORDER BY wmr.day_of_week, wmr.position, wmr.id'
    );
    $itemsStmt->execute([':menu_id' => $menuId]);

    foreach ($itemsStmt->fetchAll() as $row) {
        $days[(int)$row['day_of_week']]['recipes'][] = [
            'item_id' => (int)$row['id'],
            'recipe_id' => (int)$row['recipe_id'],
            'position' => (int)$row['position'],
            'recipe' => [
                'id' => (int)$row['recipe_id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'image_path' => $row['image_path'],
                'estimated_price' => $row['estimated_price'] !== null ? (float)$row['estimated_price'] : null,
                'created_by' => (int)$row['created_by'],
                'is_approved' => (bool)$row['is_approved'],
                'created_at' => $row['created_at'],
            ],
        ];
    }

    return [
        'id' => (int)$menu['id'],
        'user_id' => (int)$menu['user_id'],
        'name' => $menu['name'],
        'created_at' => $menu['created_at'],
        'updated_at' => $menu['updated_at'],
        'days' => array_values($days),
    ];
}

function replaceMenuItems(PDO $pdo, int $menuId, array $items): void
{
    $pdo->prepare('DELETE FROM weekly_menu_recipes WHERE menu_id = :menu_id')
        ->execute([':menu_id' => $menuId]);

    if (empty($items)) {
        return;
    }

    $insert = $pdo->prepare(
        'INSERT INTO weekly_menu_recipes (menu_id, day_of_week, recipe_id, position)
         VALUES (:menu_id, :day_of_week, :recipe_id, :position)'
    );

    foreach ($items as $item) {
        $insert->execute([
            ':menu_id' => $menuId,
            ':day_of_week' => $item['day_of_week'],
            ':recipe_id' => $item['recipe_id'],
            ':position' => $item['position'],
        ]);
    }
}

if ($method === 'GET' && $id === null) {
    $user = requireUser();
    $pdo = getConnection();

    $stmt = $pdo->prepare(
        'SELECT wm.id, wm.user_id, wm.name, wm.created_at, wm.updated_at,
                COUNT(wmr.id) AS recipe_count
         FROM weekly_menus wm
         LEFT JOIN weekly_menu_recipes wmr ON wmr.menu_id = wm.id
         WHERE wm.user_id = :user_id
         GROUP BY wm.id, wm.user_id, wm.name, wm.created_at, wm.updated_at
         ORDER BY wm.updated_at DESC, wm.id DESC'
    );
    $stmt->execute([':user_id' => $user['id']]);

    $menus = [];
    foreach ($stmt->fetchAll() as $menu) {
        $menus[] = [
            'id' => (int)$menu['id'],
            'user_id' => (int)$menu['user_id'],
            'name' => $menu['name'],
            'recipe_count' => (int)$menu['recipe_count'],
            'created_at' => $menu['created_at'],
            'updated_at' => $menu['updated_at'],
        ];
    }

    respondJson(200, $menus);
}

if ($method === 'GET' && $id !== null) {
    $user = requireUser();
    $pdo = getConnection();

    $menu = loadMenu($pdo, $id, (int)$user['id']);
    if (!$menu) {
        respondError(404, 'weekly menu not found');
    }

    respondJson(200, $menu);
}

if ($method === 'POST' && $id === null) {
    $user = requireUser();
    $pdo = getConnection();
    $body = readJsonBody();

    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
        respondError(422, 'name is required');
    }
    if (mb_strlen($name) > 150) {
        respondError(422, 'name must not exceed 150 characters');
    }

    $items = validateMenuItems($pdo, $body['items'] ?? [], $user);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO weekly_menus (user_id, name)
             VALUES (:user_id, :name)'
        );
        $stmt->execute([
            ':user_id' => $user['id'],
            ':name' => $name,
        ]);

        $menuId = (int)$pdo->lastInsertId();
        replaceMenuItems($pdo, $menuId, $items);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    respondJson(201, loadMenu($pdo, $menuId, (int)$user['id']));
}

if ($method === 'PUT' && $id !== null) {
    $user = requireUser();
    $pdo = getConnection();
    $body = readJsonBody();

    $existing = loadMenu($pdo, $id, (int)$user['id']);
    if (!$existing) {
        respondError(404, 'weekly menu not found');
    }

    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
        respondError(422, 'name is required');
    }
    if (mb_strlen($name) > 150) {
        respondError(422, 'name must not exceed 150 characters');
    }

    $items = validateMenuItems($pdo, $body['items'] ?? [], $user);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'UPDATE weekly_menus
             SET name = :name
             WHERE id = :id
               AND user_id = :user_id'
        );
        $stmt->execute([
            ':name' => $name,
            ':id' => $id,
            ':user_id' => $user['id'],
        ]);

        replaceMenuItems($pdo, $id, $items);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    respondJson(200, loadMenu($pdo, $id, (int)$user['id']));
}

if ($method === 'DELETE' && $id !== null) {
    $user = requireUser();
    $pdo = getConnection();

    $stmt = $pdo->prepare(
        'DELETE FROM weekly_menus
         WHERE id = :id
           AND user_id = :user_id'
    );
    $stmt->execute([
        ':id' => $id,
        ':user_id' => $user['id'],
    ]);

    if ($stmt->rowCount() === 0) {
        respondError(404, 'weekly menu not found');
    }

    respondJson(200, ['ok' => true]);
}

respondError(405, 'Method not allowed');
