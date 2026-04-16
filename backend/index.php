<?php

require_once __DIR__ . '/config/cors.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip leading slash and split into segments
// e.g. /api/users → ['api', 'users']
$segments = explode('/', trim($uri, '/'));

$prefix   = $segments[0] ?? '';  // expected: 'api'
$resource = $segments[1] ?? '';  // e.g. 'users'

if ($prefix !== 'api') {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

$routeFile = __DIR__ . '/api/' . $resource . '.php';

if ($resource === '' || !file_exists($routeFile)) {
    http_response_code(404);
    echo json_encode(['error' => "Route '/api/{$resource}' not found"]);
    exit;
}

require_once $routeFile;
