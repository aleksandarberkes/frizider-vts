<?php

function respondJson(int $status, $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function respondError(int $status, string $message): void
{
    respondJson($status, ['error' => $message]);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function intSegment(array $segments, int $index): ?int
{
    if (!isset($segments[$index]) || $segments[$index] === '') {
        return null;
    }
    if (!ctype_digit((string)$segments[$index])) {
        return null;
    }
    return (int)$segments[$index];
}
