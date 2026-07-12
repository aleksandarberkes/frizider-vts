<?php

// Outgoing-mail settings.
//
// This file is identical on every environment so it can be deployed/rsynced
// without editing. Environment-specific settings go in an optional, gitignored
// `mail.local.php` next to this file (present only in local dev, never on the
// server). Anything that file defines wins; everything else falls back to the
// production defaults below.
//
//   - PRODUCTION (no mail.local.php): sends through the server's own mail
//     server (Postfix on localhost:25).
//   - LOCAL DEV (mail.local.php present): typically logs to backend/logs/mail.log
//     or points at a local catcher like Mailpit/MailHog.

$__mailLocal = __DIR__ . '/mail.local.php';
if (is_file($__mailLocal)) {
    require $__mailLocal;
}

// ----- production defaults (kept only if not already set above) -------------
defined('SMTP_HOST')      || define('SMTP_HOST', 'localhost'); // '' => log to file
defined('SMTP_PORT')      || define('SMTP_PORT', 25);
defined('SMTP_USER')      || define('SMTP_USER', '');          // '' => no SMTP auth
defined('SMTP_PASS')      || define('SMTP_PASS', '');
defined('SMTP_SECURE')    || define('SMTP_SECURE', '');        // '', 'tls' or 'ssl'
defined('MAIL_FROM')      || define('MAIL_FROM', 'no-reply@react.stud.vts.su.ac.rs');
defined('MAIL_FROM_NAME') || define('MAIL_FROM_NAME', 'Moj Frizider');

// Where the React app lives, used to build clickable links in e-mails. Derived
// from the incoming request so links match the live host/scheme automatically.
if (!defined('FRONTEND_BASE_URL')) {
    $mailScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $mailHost   = $_SERVER['HTTP_HOST'] ?? 'react.stud.vts.su.ac.rs';
    define('FRONTEND_BASE_URL', $mailScheme . '://' . $mailHost);
}

// Where the file-fallback transport writes messages when SMTP_HOST is ''.
defined('MAIL_LOG_FILE') || define('MAIL_LOG_FILE', __DIR__ . '/../logs/mail.log');
