<?php

// One-shot CLI script: rewrite seeded users' password_hash to a real bcrypt
// hash for the dev password. Run with:
//   php backend/db/seed_passwords.php [optional-password]
// Default password is "password123".

require_once __DIR__ . '/../config/database.php';

$password = $argv[1] ?? 'password123';
$hash     = password_hash($password, PASSWORD_BCRYPT);

$pdo  = getConnection();
$stmt = $pdo->prepare(
    "UPDATE users
     SET password_hash = :hash
     WHERE password_hash = '\$2y\$10\$abcdefghijklmnopqrstuv'
        OR password_hash = ''
        OR id BETWEEN 1 AND 7"
);
$stmt->execute([':hash' => $hash]);

$rows = $stmt->rowCount();
fwrite(STDOUT, "Updated {$rows} user row(s).\n");
fwrite(STDOUT, "Dev password is now: {$password}\n");
fwrite(STDOUT, "Try: admin1@mojfrizider.rs / {$password}\n");
