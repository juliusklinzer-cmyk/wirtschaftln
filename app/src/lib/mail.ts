import nodemailer from 'nodemailer';

/**
 * Mail-Versand über das Hetzner-Postfach (servus@wirtschaftln.de).
 * Ohne konfiguriertes SMTP_PASSWORD wird der Versand still übersprungen
 * (lokal loggen wir stattdessen), die App funktioniert auch ohne Mail.
 */
function transporter() {
  const password = process.env.SMTP_PASSWORD;
  if (!password || password.startsWith('__')) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'mail.your-server.de',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS auf 587
    auth: { user: process.env.SMTP_USER ?? 'servus@wirtschaftln.de', pass: password },
  });
}

export async function mailAn(empfaenger: string[], betreff: string, text: string): Promise<void> {
  if (empfaenger.length === 0) return;
  const t = transporter();
  if (!t) {
    console.log(`[mail übersprungen, kein SMTP_PASSWORD] an ${empfaenger.length} Empfänger: ${betreff}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? 'Wirtschaftln <servus@wirtschaftln.de>',
      bcc: empfaenger, // BCC, damit koa Spezl die Adressen der anderen sieht
      subject: betreff,
      text,
    });
  } catch (err) {
    console.error('Mail-Versand fehlgeschlagen:', err);
  }
}
