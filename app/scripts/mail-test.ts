// Alle Mails einmal als [Test] mit Beispieldaten verschicken, IMMER nur an
// servus@wirtschaftln.de (fest verdrahtet, geht an niemand sonst).
//
// Aufruf:  SMTP_PASSWORD=… SMTP_USER=… node scripts/mail-test.ts
//          (Host/Port/Absender wie in deploy/.env, Default Brevo)
import nodemailer from 'nodemailer';
import {
  mailTerminFest,
  mailAbstimmen,
  mailOrgaOffen,
  mailReservierungOffen,
  mailGemeldet,
  mailFeedback,
  type MailInhalt,
  type MailRahmen,
} from '../src/lib/mail-vorlagen.ts';

const AN = 'servus@wirtschaftln.de';

if (!process.env.SMTP_PASSWORD || !process.env.SMTP_USER) {
  console.error('SMTP_USER und SMTP_PASSWORD setzen.');
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

const r: MailRahmen = { stammtisch: 'Wirtschaftln', basisUrl: 'https://wirtschaftln.de' };
const datum = '2026-11-12';
const datumText = 'Donnerstag, 12. November';

const mails: Array<{ betreff: string; inhalt: MailInhalt; wer: string }> = [
  {
    ...mailTerminFest(r, {
      terminId: 't_test',
      uid: 't_test@wirtschaftln.de',
      datum,
      zeit: '19:00',
      datumText,
      wirtshaus: 'Augustiner Bräustuben',
      adresse: 'Landsberger Str. 19, 80339 München',
      bezirk: 'Schwanthalerhöhe',
      routeUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Augustiner Bräustuben, Landsberger Str. 19, 80339 München')}`,
      organisator: 'Da Ertl Chris',
    }),
    wer: 'alle außer dem Organisator, sobald das Wirtshaus eingetragen ist',
  },
  { ...mailAbstimmen(r, { datumText, zeit: '19:00', wirtshaus: 'Augustiner Bräustuben', letzte: false }), wer: '4 Tage vorher, 18 Uhr, nur wer noch nicht abgestimmt hat' },
  { ...mailAbstimmen(r, { datumText, zeit: '19:00', wirtshaus: 'Augustiner Bräustuben', letzte: true }), wer: 'Tag vorher, 18 Uhr, nur wer immer noch nicht abgestimmt hat' },
  { ...mailOrgaOffen(r, { datumText, tage: 14 }), wer: '14 Tage vorher, 18 Uhr, alle, solange keiner die Orga hat' },
  { ...mailReservierungOffen(r, { datumText, tage: 7, organisator: 'Da Schneider Alex', zweite: false }), wer: '7 Tage vorher, 18 Uhr, nur der Organisator' },
  { ...mailReservierungOffen(r, { datumText, tage: 3, organisator: 'Da Schneider Alex', zweite: true }), wer: '3 Tage vorher, 18 Uhr, Organisator und Präsident' },
  { ...mailGemeldet(r, { name: 'Da Klinzer Julius', von: 'Da Munz Marc', grund: 'Hat a Radler bstellt', hoibe: 2, paypal: true }), wer: 'sofort, nur der Gemeldete' },
  { ...mailFeedback(r, { name: 'Kathi Obermeier', gruppe: 'Die Kichererbsen', text: 'Kannma beim Termin no a Uhrzeit fürs Essen eintragen?' }), wer: 'sofort, an julius@wirtschaftln.de' },
  {
    betreff: 'Neues Passwort für Wirtschaftln',
    inhalt: { text: 'Servus Julius,\n\nmit diesem Link setzt du dir ein neues Passwort für Wirtschaftln:\n\nhttps://wirtschaftln.de/passwort/BEISPIEL\n\nDer Link gilt eine Stunde. Wenn du das nicht warst, ignorier die Mail einfach, dein Passwort bleibt wie es ist.\n\nDei Wirtschaftln-App' },
    wer: 'sofort, wer „Passwort vergessen“ antippt (unverändert, kommt immer)',
  },
  {
    betreff: '🍺 Servus beim Wirtschaftln-Stammtisch!',
    inhalt: { text: 'Servus Sepp!\n\nDu bist jetzt dabei beim Wirtschaftln, dem Stammtisch, München, seit 2019.\n\nSo kommst eini:\n→ https://wirtschaftln.de/login\nE-Mail: sepp@beispiel.de\nStart-Passwort: BEISPIEL\n\nBeim ersten Anmelden setzt dich glei dei eigenes Passwort und füllst dei Profil aus (Lieblingsbier ned vergessen).\n\nBis boid am Tisch!\nDei Wirtschaftln-App' },
    wer: 'sofort, wenn ein Admin einen Spezl aufnimmt (unverändert, kommt immer)',
  },
];

for (const [i, m] of mails.entries()) {
  const vorspann = `[Test ${i + 1}/${mails.length}] Wer bekommt das: ${m.wer}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? 'Wirtschaftln <servus@wirtschaftln.de>',
    to: AN,
    subject: `[Test] ${m.betreff}`,
    text: `${vorspann}\n\n${m.inhalt.text}`,
    html: m.inhalt.html?.replace('<body style="margin:0;padding:0;background:#EEF1F5">', `<body style="margin:0;padding:0;background:#EEF1F5"><div style="padding:10px 16px;background:#FEF3C7;font:13px/1.4 sans-serif;color:#92400E">${vorspann}</div>`),
    attachments: m.inhalt.ics ? [{ filename: m.inhalt.ics.dateiname, content: m.inhalt.ics.inhalt, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }] : undefined,
  });
  console.log(`✓ ${i + 1}/${mails.length} ${m.betreff}`);
}
