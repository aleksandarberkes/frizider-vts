<?php

require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/../lib/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Thin object-oriented wrapper around PHPMailer.
 *
 * When SMTP_HOST is empty (local dev) every message is appended to
 * backend/logs/mail.log instead of being sent, so activation/reset links can be
 * copied straight from the log. When SMTP_HOST is set, messages go out over SMTP.
 */
class Mailer
{
    /**
     * Send one HTML e-mail. Returns true on success. Never throws — callers
     * treat mail as best-effort and must not fail the request on a mail error.
     */
    public static function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = ''
    ): bool {
        if (SMTP_HOST === '') {
            return self::logToFile($toEmail, $subject, $htmlBody);
        }

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->Port       = SMTP_PORT;
            $mail->SMTPAuth   = SMTP_USER !== '';
            if (SMTP_USER !== '') {
                $mail->Username = SMTP_USER;
                $mail->Password = SMTP_PASS;
            }
            if (SMTP_SECURE !== '') {
                $mail->SMTPSecure = SMTP_SECURE;
            }

            $mail->CharSet = 'UTF-8';
            $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
            $mail->addAddress($toEmail, $toName);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody !== '' ? $textBody : strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            error_log('Mailer SMTP error: ' . $mail->ErrorInfo);
            return false;
        }
    }

    // ----- ready-made messages for the app's flows --------------------------

    public static function sendActivation(string $toEmail, string $toName, string $link): bool
    {
        $subject = 'Aktivirajte svoj nalog — Moj Frizider';
        $html    = self::wrap(
            'Dobrodosli na Moj Frizider!',
            '<p>Zdravo ' . self::e($toName) . ',</p>'
            . '<p>Da biste aktivirali svoj nalog, kliknite na dugme ispod:</p>'
            . self::button($link, 'Aktiviraj nalog')
            . '<p>Ako dugme ne radi, otvorite ovaj link:<br>'
            . '<a href="' . self::e($link) . '">' . self::e($link) . '</a></p>'
            . '<p>Link vazi 24 sata.</p>'
        );
        return self::send($toEmail, $toName, $subject, $html);
    }

    public static function sendPasswordReset(string $toEmail, string $toName, string $link): bool
    {
        $subject = 'Promena lozinke — Moj Frizider';
        $html    = self::wrap(
            'Zahtev za promenu lozinke',
            '<p>Zdravo ' . self::e($toName) . ',</p>'
            . '<p>Dobili smo zahtev za promenu vase lozinke. Kliknite ispod da postavite novu:</p>'
            . self::button($link, 'Postavi novu lozinku')
            . '<p>Ako dugme ne radi, otvorite ovaj link:<br>'
            . '<a href="' . self::e($link) . '">' . self::e($link) . '</a></p>'
            . '<p>Link vazi 1 sat. Ako niste vi poslali zahtev, ignorisite ovu poruku.</p>'
        );
        return self::send($toEmail, $toName, $subject, $html);
    }

    /**
     * @param string $kind  'recept' or 'komentar'
     */
    public static function sendRejection(
        string $toEmail,
        string $toName,
        string $kind,
        string $itemName,
        string $reason
    ): bool {
        $subject = 'Vas ' . $kind . ' je odbijen — Moj Frizider';
        $html    = self::wrap(
            'Sadrzaj je odbijen',
            '<p>Zdravo ' . self::e($toName) . ',</p>'
            . '<p>Nazalost, vas ' . self::e($kind) . ' <strong>'
            . self::e($itemName) . '</strong> je odbijen od strane administratora.</p>'
            . '<p><strong>Razlog:</strong></p>'
            . '<blockquote style="margin:0;padding:12px 16px;background:#fff4f4;'
            . 'border-left:4px solid #e05353;border-radius:4px;">'
            . self::e($reason) . '</blockquote>'
            . '<p>Mozete ispraviti sadrzaj i pokusati ponovo.</p>'
        );
        return self::send($toEmail, $toName, $subject, $html);
    }

    // ----- internals --------------------------------------------------------

    private static function logToFile(string $toEmail, string $subject, string $htmlBody): bool
    {
        // Pull the first URL straight from the raw HTML (href attribute) so the
        // quote terminates the match cleanly.
        $link = '';
        if (preg_match('/https?:\/\/[^\s"\'<>]+/', $htmlBody, $m)) {
            $link = $m[0];
        }
        $plain = strip_tags(str_replace(['</p>', '<br>', '</h2>', '</blockquote>'], "\n", $htmlBody));
        $plain = html_entity_decode($plain, ENT_QUOTES, 'UTF-8');
        $record = sprintf(
            "==== %s ====\nTO: %s\nSUBJECT: %s\n%sBODY:\n%s\n\n",
            date('Y-m-d H:i:s'),
            $toEmail,
            $subject,
            $link !== '' ? "LINK: {$link}\n" : '',
            trim($plain)
        );

        $dir = dirname(MAIL_LOG_FILE);
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        return file_put_contents(MAIL_LOG_FILE, $record, FILE_APPEND | LOCK_EX) !== false;
    }

    private static function wrap(string $heading, string $bodyHtml): string
    {
        return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;'
            . 'margin:0 auto;color:#222;line-height:1.5;">'
            . '<h2 style="color:#2b7a4b;">' . self::e($heading) . '</h2>'
            . $bodyHtml
            . '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">'
            . '<p style="font-size:12px;color:#888;">Moj Frizider</p>'
            . '</div>';
    }

    private static function button(string $link, string $label): string
    {
        return '<p><a href="' . self::e($link) . '" '
            . 'style="display:inline-block;padding:12px 22px;background:#2b7a4b;'
            . 'color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">'
            . self::e($label) . '</a></p>';
    }

    private static function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}
