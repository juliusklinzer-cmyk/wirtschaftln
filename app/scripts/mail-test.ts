// Alle Mails einmal als [Test] mit Beispieldaten verschicken, IMMER nur an
// servus@wirtschaftln.de (fest verdrahtet, geht an niemand sonst).
//
// Aufruf:  SMTP_PASSWORD=… SMTP_USER=… node scripts/mail-test.ts [nummern …]
//          (ohne Nummern alle, sonst nur die genannten, z. B. 11 12)
//          (Host/Port/Absender wie in deploy/.env, Default Brevo)
import nodemailer from 'nodemailer';
import {
  mailTerminFest,
  mailAbstimmen,
  mailOrgaOffen,
  mailReservierungOffen,
  mailStrafe,
  mailFeedback,
  mailPasswort,
  mailWillkommen,
  mailWackeln,
  mailWacklerOhneAntwort,
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
      organisator: 'Chris',
    }),
    wer: 'alle außer dem Organisator, sobald das Wirtshaus eingetragen ist',
  },
  { ...mailAbstimmen(r, { datumText, zeit: '19:00', wirtshaus: 'Augustiner Bräustuben', letzte: false }), wer: '4 Tage vorher, 18 Uhr, nur wer noch nicht abgestimmt hat' },
  { ...mailAbstimmen(r, { datumText, zeit: '19:00', wirtshaus: 'Augustiner Bräustuben', letzte: true }), wer: 'Tag vorher, 18 Uhr, nur wer immer noch nicht abgestimmt hat' },
  { ...mailOrgaOffen(r, { datumText, tage: 14 }), wer: '14 Tage vorher, 18 Uhr, alle, solange keiner die Orga hat' },
  { ...mailReservierungOffen(r, { datumText, tage: 7, organisator: 'Alex', zweite: false }), wer: '7 Tage vorher, 18 Uhr, nur der Organisator' },
  { ...mailReservierungOffen(r, { datumText, tage: 3, organisator: 'Alex', zweite: true }), wer: '3 Tage vorher, 18 Uhr, Organisator und Präsident' },
  { ...mailStrafe(r, { name: 'Julius', von: 'Da Munz Marc', strafe: 'Zu spät ab 30 Min', folge: '5 €', zahlen: true, paypal: true }), wer: 'sofort, nur wer die Strafe bekommt (Mail-Schalter Kasse)' },
  { ...mailStrafe(r, { name: 'Toni', von: null, strafe: 'Unentschuldigt gefehlt', folge: '20 €', zahlen: true, paypal: true }), wer: 'nach dem Abend (3 Uhr), nur Strafen mit Geld, Mail-Schalter Kasse' },
  { ...mailFeedback(r, { name: 'Kathi Obermeier', gruppe: 'Die Kichererbsen', text: 'Kann man beim Termin noch eine Uhrzeit fürs Essen eintragen?' }), wer: 'sofort, an julius@wirtschaftln.de' },
  { ...mailPasswort(r, { vorname: 'Julius', links: [{ name: 'Wirtschaftln', url: 'https://wirtschaftln.de/passwort/BEISPIEL' }] }), wer: 'sofort, wer „Passwort vergessen“ antippt (kommt immer)' },
  { ...mailWillkommen(r, { vorname: 'Sepp', woher: 'aus München, seit 2019', email: 'sepp@beispiel.de', passwort: 'BEISPIEL' }), wer: 'sofort, wenn ein Admin einen Spezl aufnimmt (kommt immer)' },
  { ...mailWackeln(r, { vorname: 'Toni', anzahl: 3, dabeiUrl: 'https://wirtschaftln.de/dabei/BEISPIEL?a=dabei', abschiedUrl: 'https://wirtschaftln.de/dabei/BEISPIEL?a=abschied' }), wer: 'einmal pro Wackel-Phase, 18 Uhr nach dem 3. unentschuldigten Fehlen in Folge (kommt immer)' },
  { ...mailWacklerOhneAntwort(r, { anrede: 'Julius', wackler: 'da Toni', gefragtAm: '30. Okt.' }), wer: '14 Tage ohne Antwort, an den Präsidenten (ohne Präsident an die Admins)' },
];

const nur = process.argv.slice(2).map(Number).filter(Boolean);
for (const [i, m] of mails.entries()) {
  if (nur.length > 0 && !nur.includes(i + 1)) continue;
  const vorspann = `[Test ${i + 1}/${mails.length}] Wer bekommt das: ${m.wer}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? 'Wirtschaftln <servus@wirtschaftln.de>',
    to: AN,
    subject: `[Test] ${m.betreff}`,
    text: `${vorspann}\n\n${m.inhalt.text}`,
    html: m.inhalt.html?.replace('<body style="margin:0;padding:0;background:#ffffff">', `<body style="margin:0;padding:0;background:#ffffff"><div style="padding:10px 16px;background:#FEF3C7;font:13px/1.4 sans-serif;color:#92400E">${vorspann}</div>`),
    attachments: m.inhalt.ics ? [{ filename: m.inhalt.ics.dateiname, content: m.inhalt.ics.inhalt, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }] : undefined,
  });
  console.log(`✓ ${i + 1}/${mails.length} ${m.betreff}`);
}
