import nodemailer from 'nodemailer';
import type { MailInhalt } from '@/lib/mail-vorlagen';

/**
 * Mail-Versand über Brevo (seit 30.10.2026, Absender servus@wirtschaftln.de).
 * Ohne konfiguriertes SMTP_PASSWORD wird der Versand still übersprungen
 * (lokal loggen wir stattdessen), die App funktioniert auch ohne Mail.
 */
function transporter() {
  const password = process.env.SMTP_PASSWORD;
  if (!password || password.startsWith('__')) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS auf 587
    auth: { user: process.env.SMTP_USER ?? 'servus@wirtschaftln.de', pass: password },
  });
}

/** Persönliche Adresse für Feedback aus der App (FEEDBACK_MAIL, sonst julius@). */
export function feedbackAdresse(): string {
  return process.env.FEEDBACK_MAIL ?? 'julius@wirtschaftln.de';
}

/**
 * Mail an eine oder mehrere Adressen, mehrere immer per BCC. `inhalt` is
 * entweder reiner Text oder a fertige Vorlage aus lib/mail-vorlagen.ts
 * (Text + HTML + optional Kalender-Anhang).
 */
export async function mailAn(empfaenger: string[], betreff: string, inhalt: string | MailInhalt): Promise<void> {
  if (empfaenger.length === 0) return;
  const m: MailInhalt = typeof inhalt === 'string' ? { text: inhalt } : inhalt;
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
      text: m.text,
      html: m.html,
      attachments: m.ics
        ? [{ filename: m.ics.dateiname, content: m.ics.inhalt, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }]
        : undefined,
    });
  } catch (err) {
    console.error('Mail-Versand fehlgeschlagen:', err);
  }
}
