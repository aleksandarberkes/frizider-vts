<?php

// Shared recipe-shaping helpers, used by api/recipes.php and api/fridge.php
// (the "Moj frizider" match endpoint). Kept here so both endpoints return the
// exact same recipe JSON shape from one implementation.

require_once __DIR__ . '/database.php';

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
        'rejection_reason' => $row['rejection_reason'] ?? null,
        'created_at'      => $row['created_at'],
        'ingredients'     => $ingredients[$row['id']] ?? [],
        'categories'      => $categories[$row['id']] ?? [],
    ];
}
