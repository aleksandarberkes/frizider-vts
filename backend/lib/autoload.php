<?php

// Minimal loader for the vendored PHPMailer library (no Composer on this box).
// If Composer is introduced later, replace this include with vendor/autoload.php.

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
