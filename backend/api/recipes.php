<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

$id = intSegment($segments, 2);

// ----- helpers --------------------------------------------------------------

function loadIngredientsForRecipes(PDO $pdo, array $recipeIds): array
{
    if (empty($recipeIds)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($recipeIds), '?'));
    $sql = "SELECT ri.recipe_id, ri.ingredient_id, ri.quantity, i.name, i.unit
            FROM recipe_ingredients ri
            JOIN ingredients i ON i.id = ri.ingredient_id
            WHERE ri.recipe_id IN ($placeholders)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($recipeIds);

    $byRecipe = [];
    foreach ($stmt->fetchAll() as $row) {
        $byRecipe[$row['recipe_id']][] = [
            'ingredient_id' => (int)$row['ingredient_id'],
            'name'          => $row['name'],
            'unit'          => $row['unit'],
            'quantity'      => $row['quantity'] !== null ? (float)$row['quantity'] : null,
        ];
    }
    return $byRecipe;
}

function loadCategoriesForRecipes(PDO $pdo, array $recipeIds): array
{
    if (empty($recipeIds)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($recipeIds), '?'));
    $sql = "SELECT rc.recipe_id, rc.category_id, c.name
            FROM recipe_categories rc
            JOIN categories c ON c.id = rc.category_id
            WHERE rc.recipe_id IN ($placeholders)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($recipeIds);

    $byRecipe = [];
    foreach ($stmt->fetchAll() as $row) {
        $byRecipe[$row['recipe_id']][] = [
            'category_id' => (int)$row['category_id'],
            'name'        => $row['name'],
        ];
    }
    return $byRecipe;
}

function shapeRecipe(array $row, array $ingredients, array $categories): array
{
    return [
        'id'              => (int)$row['id'],
        'name'            => $row['name'],
        'description'     => $row['description'],
        'image_path'      => $row['image_path'],
        'estimated_price' => $row['estimated_price'] !== null ? (float)$row['estimated_price'] : null,
        'created_by'      => (int)$row['created_by'],
        'is_approved'     => (bool)$row['is_approved'],
        'created_at'      => $row['created_at'],
        'ingredients'     => $ingredients[$row['id']] ?? [],
        'categories'      => $categories[$row['id']] ?? [],
    ];
}

function replaceRecipeIngredients(PDO $pdo, int $recipeId, array $ingredients): void
{
    $pdo->prepare('DELETE FROM recipe_ingredients WHERE recipe_id = :id')
        ->execute([':id' => $recipeId]);

    if (empty($ingredients)) {
        return;
    }
    $insert = $pdo->prepare(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
         VALUES (:rid, :iid, :qty)'
    );
    foreach ($ingredients as $entry) {
        $insert->execute([
            ':rid' => $recipeId,
            ':iid' => (int)$entry['ingredient_id'],
            ':qty' => $entry['quantity'] ?? null,
        ]);
    }
}

function replaceRecipeCategories(PDO $pdo, int $recipeId, array $categoryIds): void
{
    $pdo->prepare('DELETE FROM recipe_categories WHERE recipe_id = :id')
        ->execute([':id' => $recipeId]);

    if (empty($categoryIds)) {
        return;
    }
    $insert = $pdo->prepare(
        'INSERT INTO recipe_categories (recipe_id, category_id) VALUES (:rid, :cid)'
    );
    foreach ($categoryIds as $cid) {
        $insert->execute([':rid' => $recipeId, ':cid' => (int)$cid]);
    }
}

function validateIngredientList(PDO $pdo, $raw): array
{
    if (!is_array($raw)) {
        respondError(422, 'ingredients must be an array');
    }
    $cleaned = [];
    foreach ($raw as $entry) {
        if (!is_array($entry) || !isset($entry['ingredient_id'])) {
            respondError(422, 'each ingredient needs ingredient_id');
        }
        $iid = (int)$entry['ingredient_id'];
        $check = $pdo->prepare('SELECT 1 FROM ingredients WHERE id = :id');
        $check->execute([':id' => $iid]);
        if (!$check->fetchColumn()) {
            respondError(422, "ingredient_id {$iid} does not exist");
        }
        $qty = isset($entry['quantity']) ? (float)$entry['quantity'] : null;
        $cleaned[] = ['ingredient_id' => $iid, 'quantity' => $qty];
    }
    return $cleaned;
}

function validateCategoryList(PDO $pdo, $raw): array
{
    if (!is_array($raw)) {
        respondError(422, 'categories must be an array of ids');
    }
    $cleaned = [];
    foreach ($raw as $cid) {
        $cid = (int)$cid;
        $check = $pdo->prepare('SELECT 1 FROM categories WHERE id = :id');
        $check->execute([':id' => $cid]);
        if (!$check->fetchColumn()) {
            respondError(422, "category_id {$cid} does not exist");
        }
        $cleaned[] = $cid;
    }
    return $cleaned;
}

// ----- GET /api/recipes — list with visibility filter -----------------------
//   admin     → all recipes
//   logged-in → is_approved=1 OR created_by = self
//   anonymous → is_approved=1 only

if ($method === 'GET' && $id === null) {
    $caller   = currentUser();
    $isAdmin  = ($caller['role_name'] ?? null) === 'admin';

    $pdo = getConnection();
    if ($isAdmin) {
        $stmt = $pdo->query(
            'SELECT id, name, description, image_path, estimated_price, created_by,
                    is_approved, created_at
             FROM recipes
             ORDER BY id'
        );
        $rows = $stmt->fetchAll();
    } elseif ($caller) {
        $stmt = $pdo->prepare(
            'SELECT id, name, description, image_path, estimated_price, created_by,
                    is_approved, created_at
             FROM recipes
             WHERE is_approved = 1 OR created_by = :uid
             ORDER BY id'
        );
        $stmt->execute([':uid' => $caller['id']]);
        $rows = $stmt->fetchAll();
    } else {
        $stmt = $pdo->query(
            'SELECT id, name, description, image_path, estimated_price, created_by,
                    is_approved, created_at
             FROM recipes
             WHERE is_approved = 1
             ORDER BY id'
        );
        $rows = $stmt->fetchAll();
    }

    $ids        = array_column($rows, 'id');
    $ingredients = loadIngredientsForRecipes($pdo, $ids);
    $categories  = loadCategoriesForRecipes($pdo, $ids);

    $out = [];
    foreach ($rows as $row) {
        $out[] = shapeRecipe($row, $ingredients, $categories);
    }
    respondJson(200, $out);
}

// ----- GET /api/recipes/{id} — single ---------------------------------------

if ($method === 'GET' && $id !== null) {
    $caller   = currentUser();
    $isAdmin  = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare(
        'SELECT id, name, description, image_path, estimated_price, created_by,
                is_approved, created_at
         FROM recipes WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        respondError(404, 'recipe not found');
    }

    $isOwner = $caller && (int)$caller['id'] === (int)$row['created_by'];
    if (!$row['is_approved'] && !$isAdmin && !$isOwner) {
        respondError(404, 'recipe not found');
    }

    $ingredients = loadIngredientsForRecipes($pdo, [$row['id']]);
    $categories  = loadCategoriesForRecipes($pdo, [$row['id']]);
    respondJson(200, shapeRecipe($row, $ingredients, $categories));
}

// ----- POST /api/recipes — create (any logged-in user) ---------------------

if ($method === 'POST' && $id === null) {
    $user = requireUser();
    $body = readJsonBody();

    $name           = trim($body['name'] ?? '');
    $description    = trim($body['description'] ?? '') ?: null;
    $imagePath      = trim($body['image_path']  ?? '') ?: null;
    $estimatedPrice = isset($body['estimated_price']) ? (float)$body['estimated_price'] : null;

    if ($name === '') {
        respondError(422, 'name is required');
    }

    $pdo = getConnection();
    $ingredients = validateIngredientList($pdo, $body['ingredients'] ?? []);
    $categoryIds = validateCategoryList($pdo, $body['categories']  ?? []);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO recipes
             (name, description, image_path, estimated_price, created_by, is_approved)
             VALUES (:n, :d, :ip, :ep, :cb, 0)'
        )->execute([
            ':n'  => $name,
            ':d'  => $description,
            ':ip' => $imagePath,
            ':ep' => $estimatedPrice,
            ':cb' => $user['id'],
        ]);
        $newId = (int)$pdo->lastInsertId();
        replaceRecipeIngredients($pdo, $newId, $ingredients);
        replaceRecipeCategories ($pdo, $newId, $categoryIds);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $stmt = $pdo->prepare(
        'SELECT id, name, description, image_path, estimated_price, created_by,
                is_approved, created_at
         FROM recipes WHERE id = :id'
    );
    $stmt->execute([':id' => $newId]);
    $row = $stmt->fetch();
    respondJson(201, shapeRecipe(
        $row,
        loadIngredientsForRecipes($pdo, [$newId]),
        loadCategoriesForRecipes($pdo, [$newId])
    ));
}

// ----- PUT /api/recipes/{id} — owner or admin -------------------------------

if ($method === 'PUT' && $id !== null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare('SELECT id, created_by, is_approved FROM recipes WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        respondError(404, 'recipe not found');
    }
    $isOwner = (int)$caller['id'] === (int)$existing['created_by'];
    if (!$isAdmin && !$isOwner) {
        respondError(403, 'only the owner or an admin can update this recipe');
    }

    $body           = readJsonBody();
    $name           = trim($body['name'] ?? '');
    $description    = trim($body['description'] ?? '') ?: null;
    $imagePath      = trim($body['image_path']  ?? '') ?: null;
    $estimatedPrice = isset($body['estimated_price']) ? (float)$body['estimated_price'] : null;

    if ($name === '') {
        respondError(422, 'name is required');
    }

    // Only admins can change is_approved. Owner edits keep the current flag.
    $isApproved = $isAdmin && array_key_exists('is_approved', $body)
        ? ($body['is_approved'] ? 1 : 0)
        : (int)$existing['is_approved'];

    $ingredients = validateIngredientList($pdo, $body['ingredients'] ?? []);
    $categoryIds = validateCategoryList($pdo, $body['categories']  ?? []);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'UPDATE recipes
             SET name = :n, description = :d, image_path = :ip,
                 estimated_price = :ep, is_approved = :ia
             WHERE id = :id'
        )->execute([
            ':n'  => $name,
            ':d'  => $description,
            ':ip' => $imagePath,
            ':ep' => $estimatedPrice,
            ':ia' => $isApproved,
            ':id' => $id,
        ]);
        replaceRecipeIngredients($pdo, $id, $ingredients);
        replaceRecipeCategories ($pdo, $id, $categoryIds);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $stmt = $pdo->prepare(
        'SELECT id, name, description, image_path, estimated_price, created_by,
                is_approved, created_at
         FROM recipes WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    respondJson(200, shapeRecipe(
        $row,
        loadIngredientsForRecipes($pdo, [$id]),
        loadCategoriesForRecipes($pdo, [$id])
    ));
}

// ----- DELETE /api/recipes/{id} — owner or admin ----------------------------

if ($method === 'DELETE' && $id !== null) {
    $caller  = requireUser();
    $isAdmin = ($caller['role_name'] ?? null) === 'admin';

    $pdo  = getConnection();
    $stmt = $pdo->prepare('SELECT created_by FROM recipes WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $createdBy = $stmt->fetchColumn();
    if ($createdBy === false) {
        respondError(404, 'recipe not found');
    }
    if (!$isAdmin && (int)$caller['id'] !== (int)$createdBy) {
        respondError(403, 'only the owner or an admin can delete this recipe');
    }

    // Comments and ratings on this recipe don't cascade in the schema; clear
    // them first so the FKs don't block the recipe delete.
    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM ratings  WHERE recipe_id = :id')->execute([':id' => $id]);
        $pdo->prepare('DELETE FROM comments WHERE recipe_id = :id')->execute([':id' => $id]);
        $pdo->prepare('DELETE FROM recipes  WHERE id = :id')->execute([':id' => $id]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    respondJson(200, ['ok' => true]);
}

respondError(405, 'method not allowed');
