<?php

require_once __DIR__ . '/database.php';

// Helpers around the `user_tokens` table (activation + password_reset flows).
// A token is a long random string, single-use, with an expiry.

/**
 * Create and store a fresh token for a user. Returns the raw token string to
 * embed in an e-mail link. $type must be 'activation' or 'password_reset'.
 */
function createUserToken(PDO $pdo, int $userId, string $type, int $ttlSeconds): string
{
    $token     = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + $ttlSeconds);

    $pdo->prepare(
        'INSERT INTO user_tokens (user_id, token, type, expires_at)
         VALUES (:uid, :token, :type, :exp)'
    )->execute([
        ':uid'   => $userId,
        ':token' => $token,
        ':type'  => $type,
        ':exp'   => $expiresAt,
    ]);

    return $token;
}

/**
 * Validate and consume a token. If it exists, matches $type, is unused and not
 * expired, it is marked used and the owning user_id is returned. Otherwise null.
 */
function consumeUserToken(PDO $pdo, string $token, string $type): ?int
{
    if ($token === '') {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT id, user_id FROM user_tokens
         WHERE token = :token AND type = :type
           AND is_used = 0 AND expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([':token' => $token, ':type' => $type]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }

    $pdo->prepare('UPDATE user_tokens SET is_used = 1 WHERE id = :id')
        ->execute([':id' => $row['id']]);

    return (int)$row['user_id'];
}
