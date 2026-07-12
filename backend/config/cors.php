<?php

// Reflect the request Origin when it is one we trust. In production the app is
// served from the same origin as the API (so CORS is not even triggered); this
// list keeps local development (localhost:3000) and both http/https of the live
// host working.
$allowedOrigins = [
    'http://localhost:3000',
    'http://react.stud.vts.su.ac.rs',
    'https://react.stud.vts.su.ac.rs',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
