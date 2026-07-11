<?php

// Outgoing-mail settings. Mirrors config/database.php (plain define() constants).
//
// Leave SMTP_HOST empty for local development: Mailer then writes every message
// (including activation/reset links) to backend/logs/mail.log instead of sending
// it, so the whole flow works without a mail server. To send for real, fill in
// the SMTP_* constants below (e.g. Mailtrap, Gmail with an app password).

define('SMTP_HOST', '');                 // '' => log to file; set a host to send
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_SECURE', 'tls');            // 'tls' (STARTTLS, 587) or 'ssl' (465)

define('MAIL_FROM', 'no-reply@mojfrizider.rs');
define('MAIL_FROM_NAME', 'Moj Frizider');

// Where the React app lives, used to build clickable links in e-mails.
define('FRONTEND_BASE_URL', 'http://localhost:3000');

// Where the file-fallback transport writes messages.
define('MAIL_LOG_FILE', __DIR__ . '/../logs/mail.log');
