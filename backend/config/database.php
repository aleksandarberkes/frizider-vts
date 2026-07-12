<?php

// Environment-specific DB credentials live in an optional, gitignored
// database.local.php next to this file (created per-machine, never committed),
// so `git pull` never overwrites the server's credentials. Whatever it defines
// wins; the defaults below are the local XAMPP values.
$__dbLocal = __DIR__ . '/database.local.php';
if (is_file($__dbLocal)) {
    require $__dbLocal;
}

defined('DB_HOST') || define('DB_HOST', 'localhost');
defined('DB_PORT') || define('DB_PORT', '3306');
defined('DB_NAME') || define('DB_NAME', 'fridge');
defined('DB_USER') || define('DB_USER', 'root');
defined('DB_PASS') || define('DB_PASS', '');  // XAMPP default is no password

function getConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}
