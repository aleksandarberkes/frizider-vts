<?php

require_once __DIR__ . '/../config/util.php';
require_once __DIR__ . '/../config/auth.php';

if ($method !== 'POST') {
    respondError(405, 'method not allowed');
}

requireUser();

if (!isset($_FILES['image'])) {
    respondError(422, 'image file is required');
}

$file = $_FILES['image'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respondError(422, 'image upload failed');
}

$tmpPath = $file['tmp_name'] ?? '';
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    respondError(422, 'invalid uploaded file');
}

$maxSizeBytes = 5 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxSizeBytes) {
    respondError(422, 'image must be smaller than 5MB');
}

$mimeType = mime_content_type($tmpPath) ?: '';
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

if (!isset($allowed[$mimeType])) {
    respondError(422, 'only jpg, png, webp and gif images are allowed');
}

$uploadDir = __DIR__ . '/../uploads/recipes';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
    respondError(500, 'failed to create upload directory');
}
@chmod(__DIR__ . '/../uploads', 0777);
@chmod($uploadDir, 0777);

$fileName = sprintf('recipe_%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(6)), $allowed[$mimeType]);
$targetPath = $uploadDir . '/' . $fileName;

if (!move_uploaded_file($tmpPath, $targetPath)) {
    respondError(500, 'failed to store uploaded image');
}

$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$publicPath = $scriptDir . '/uploads/recipes/' . $fileName;

respondJson(201, [
    'path' => $publicPath,
]);
