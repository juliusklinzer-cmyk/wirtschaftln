/**
 * Mail-Vorlagen (30.10.2026): Text + HTML aus einem Guss, ohne App-Importe,
 * damit scripts/mail-test.ts sie direkt laden kann. Wer was wann kriegt,
 * steht in lib/erinnerungen.ts und an den Aufrufstellen.
 *
 * Grundsatz von Julius: Mail nur, wenn der Termin feststeht oder wer was tun
 * muss. Alles andere läuft nur als Push.
 */

export type MailInhalt = { text: string; html?: string; ics?: { dateiname: string; inhalt: string } };

/** Was jede Mail braucht: Name des Stammtischs (Signatur) und die Basis-URL der App. */
export type MailRahmen = { stammtisch: string; basisUrl: string };

type Baustein = {
  anrede: string;
  absaetze: string[];
  /** Hervorgehobener Kasten (Wirtshaus, Datum …) als Label/Wert-Zeilen */
  kasten?: Array<[string, string]>;
  knopf?: { text: string; pfad: string };
  /** Weitere Links unter dem Knopf (Route, Kalender …), absolute URLs */
  links?: Array<{ text: string; url: string }>;
  /** Kleiner Hinweis unter dem Inhalt */
  hinweis?: string;
  /** Fußzeile mit „Mails einstellen“ (bei Passwort-/Willkommensmails ned) */
  einstellbar?: boolean;
};

const NAVY = '#0C2B5A';
const GOLD = '#D0AD66';
const PERGAMENT = '#F6F0E2';
const TINTE = '#1F2937';
const GRAU = '#6B7280';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function url(r: MailRahmen, pfad: string): string {
  return `${r.basisUrl.replace(/\/+$/, '')}${pfad.startsWith('/') ? pfad : `/${pfad}`}`;
}

function baue(r: MailRahmen, b: Baustein): MailInhalt {
  const einstellUrl = url(r, '/profil#mails');
  const signatur = `Dei ${r.stammtisch}-App`;

  const text = [
    b.anrede,
    '',
    ...b.absaetze.flatMap((a) => [a, '']),
    ...(b.kasten ? [...b.kasten.map(([k, v]) => `${k}: ${v}`), ''] : []),
    ...(b.knopf ? [`${b.knopf.text}: ${url(r, b.knopf.pfad)}`] : []),
    ...(b.links ?? []).map((l) => `${l.text}: ${l.url}`),
    ...(b.knopf || b.links?.length ? [''] : []),
    ...(b.hinweis ? [b.hinweis, ''] : []),
    signatur,
    ...(b.einstellbar !== false ? ['', `Mails einstellen: ${einstellUrl}`] : []),
  ].join('\n');

  const kasten = b.kasten
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:${PERGAMENT};border:1px solid ${GOLD};border-radius:14px">
        <tr><td style="padding:14px 16px">
          ${b.kasten
            .map(
              ([k, v]) =>
                `<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${GRAU};margin-top:6px">${esc(k)}</div><div style="font-size:16px;font-weight:700;color:${NAVY}">${esc(v)}</div>`,
            )
            .join('')}
        </td></tr></table>`
    : '';
  const knopf = b.knopf
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px"><tr><td style="background:${NAVY};border-radius:12px">
        <a href="${esc(url(r, b.knopf.pfad))}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">${esc(b.knopf.text)}</a>
      </td></tr></table>`
    : '';
  const links = (b.links ?? [])
    .map((l) => `<div style="margin:6px 0"><a href="${esc(l.url)}" style="font-size:14px;font-weight:700;color:${NAVY}">${esc(l.text)}</a></div>`)
    .join('');

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF1F5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <tr><td style="background:${NAVY};padding:18px 22px;border-bottom:3px solid ${GOLD}">
    <span style="font-size:18px;font-weight:800;color:${GOLD}">${esc(r.stammtisch)}</span>
  </td></tr>
  <tr><td style="padding:22px;color:${TINTE};font-size:15px;line-height:1.55">
    <p style="margin:0 0 14px;font-weight:700">${esc(b.anrede)}</p>
    ${b.absaetze.map((a) => `<p style="margin:0 0 14px">${esc(a)}</p>`).join('')}
    ${kasten}${knopf}${links}
    ${b.hinweis ? `<p style="margin:14px 0 0;font-size:13px;color:${GRAU}">${esc(b.hinweis)}</p>` : ''}
    <p style="margin:20px 0 0;font-weight:700;color:${NAVY}">${esc(signatur)}</p>
  </td></tr>
  ${b.einstellbar !== false ? `<tr><td style="padding:14px 22px;border-top:1px solid #E5E7EB;font-size:12px;color:${GRAU}">Zu viele Mails? <a href="${esc(einstellUrl)}" style="color:${GRAU}">Mails einstellen</a></td></tr>` : ''}
</table></td></tr></table></body></html>`;

  return { text, html };
}

// ───────────────────────── Kalender ─────────────────────────

/** Lokale Berliner Zeit → UTC im ICS-Format (20261105T180000Z), Sommer-/Winterzeit inklusive. */
function berlinNachUtc(datum: string, zeit: string): Date {
  const [y, mo, d] = datum.split('-').map(Number);
  const [h, mi] = zeit.split(':').map(Number);
  const alsUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Versatz Berlin↔UTC zu diesem Zeitpunkt ermitteln
  const teile = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(alsUtc))
    .reduce<Record<string, number>>((acc, p) => (p.type === 'literal' ? acc : { ...acc, [p.type]: Number(p.value) }), {});
  const berlinAlsUtc = Date.UTC(teile.year, teile.month - 1, teile.day, teile.hour, teile.minute);
  return new Date(alsUtc - (berlinAlsUtc - alsUtc));
}

function icsZeit(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Text für ICS-Felder escapen (RFC 5545: Backslash, Komma, Semikolon, Zeilenumbruch). */
function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Kalendereintrag für an Stammtisch (4 Stunden), für Mail-Anhang und /termin/[id]/ics. */
export function icsTermin(t: { uid: string; datum: string; zeit: string; titel: string; ort?: string | null; beschreibung?: string; url?: string }): string {
  const start = berlinNachUtc(t.datum, t.zeit || '19:00');
  const ende = new Date(start.getTime() + 4 * 3600_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wirtschaftln//Stammtisch//DE',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${t.uid}`,
    `DTSTAMP:${icsZeit(new Date())}`,
    `DTSTART:${icsZeit(start)}`,
    `DTEND:${icsZeit(ende)}`,
    `SUMMARY:${icsText(t.titel)}`,
    t.ort ? `LOCATION:${icsText(t.ort)}` : null,
    t.beschreibung ? `DESCRIPTION:${icsText(t.beschreibung)}` : null,
    t.url ? `URL:${t.url}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

// ───────────────────────── Die Mails ─────────────────────────

/** Termin und Wirtshaus stehen fest: alle außer dem Organisator, mit Kalender und Route. */
export function mailTerminFest(
  r: MailRahmen,
  d: { terminId: string; uid: string; datum: string; zeit: string; datumText: string; wirtshaus: string; adresse: string | null; bezirk: string | null; routeUrl: string; organisator: string | null },
): { betreff: string; inhalt: MailInhalt } {
  const ort = [d.wirtshaus, d.adresse].filter(Boolean).join(', ');
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: [
      `Da nächste Stammtisch steht: ${d.wirtshaus}${d.bezirk ? ` (${d.bezirk})` : ''}.${d.organisator ? ` ${d.organisator} hat reserviert.` : ''}`,
      'Sag bis 3 Tage vorher zu oder ab, dann gibt’s an WP obendrauf.',
    ],
    kasten: [
      ['Wann', `${d.datumText}, ${d.zeit} Uhr`],
      ['Wo', d.wirtshaus],
      ...(d.adresse ? ([['Adresse', d.adresse]] as Array<[string, string]>) : []),
    ],
    knopf: { text: 'Zu- oder absagen', pfad: '/termin' },
    links: [{ text: 'Route in Google Maps', url: d.routeUrl }],
    hinweis: 'Im Anhang hängt der Termin für deinen Kalender. Antippen und speichern, am iPhone und am Android.',
  });
  inhalt.ics = {
    dateiname: `stammtisch-${d.datum}.ics`,
    inhalt: icsTermin({ uid: d.uid, datum: d.datum, zeit: d.zeit, titel: `${r.stammtisch}: ${d.wirtshaus}`, ort, beschreibung: `Route: ${d.routeUrl}`, url: url(r, '/termin') }),
  };
  return { betreff: `Stammtisch am ${d.datumText}: ${d.wirtshaus}`, inhalt };
}

/** Noch ned abgestimmt: 1 Tag vor der Frist (letzte = am Tag vorm Termin). */
export function mailAbstimmen(
  r: MailRahmen,
  d: { datumText: string; zeit: string; wirtshaus: string | null; letzte: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const wo = d.wirtshaus ? ` im ${d.wirtshaus}` : '';
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: d.letzte
      ? [
          `Morgen is Stammtisch${wo}, ${d.datumText} um ${d.zeit} Uhr, und von dir fehlt no a Antwort.`,
          'Sag kurz zu oder ab. Wer ohne Absage fehlt, zählt als unentschuldigt.',
        ]
      : [
          `Du hast für den Stammtisch${wo} am ${d.datumText} no ned zu- oder abgsagt.`,
          'Wenn du bis morgen abstimmst, kriagst no den WP fürs rechtzeitige Abstimmen.',
        ],
    knopf: { text: 'Jetzt abstimmen', pfad: '/termin' },
  });
  return { betreff: d.letzte ? `Morgen is Stammtisch: bist dabei?` : `Bist dabei am ${d.datumText}?`, inhalt };
}

/** Orga no frei, 14 Tage vorher an alle. */
export function mailOrgaOffen(r: MailRahmen, d: { datumText: string; tage: number }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: [
      `Für den Stammtisch am ${d.datumText} hat si no koana die Orga gschnappt, und es san nur no ${d.tage} Tage.`,
      'Wer’s übernimmt, sucht a Wirtshaus aus und reserviert. Gibt natürlich WP dafür.',
    ],
    knopf: { text: 'I regl’s', pfad: '/termin' },
  });
  return { betreff: `Wer organisiert den Stammtisch am ${d.datumText}?`, inhalt };
}

/** Reservierung offen: an den Organisator (beim zweiten Mal mit Präsident). */
export function mailReservierungOffen(
  r: MailRahmen,
  d: { datumText: string; tage: number; organisator: string; zweite: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: d.zweite ? 'Servus beinand!' : `Servus ${d.organisator}!`,
    absaetze: d.zweite
      ? [
          `Für den Stammtisch am ${d.datumText} steht in ${d.tage} Tagen no koa Wirtshaus fest. ${d.organisator} hat die Orga.`,
          'Bitte schnell reservieren und in der App eintragen, sonst wissen die Spezln ned, wo’s hingeht.',
        ]
      : [
          `Du hast die Orga für den Stammtisch am ${d.datumText}, und in ${d.tage} Tagen is es so weit.`,
          'Is scho a Wirtshaus reserviert? Dann trag’s in der App ein, erst dann können die Spezln zu- oder absagen.',
        ],
    knopf: { text: 'Wirtshaus eintragen', pfad: '/termin' },
  });
  return { betreff: d.zweite ? `Dringend: no koa Wirtshaus für den ${d.datumText}` : `No koa Wirtshaus für den ${d.datumText}`, inhalt };
}

/** Gemeldet: der Betroffene. */
export function mailGemeldet(
  r: MailRahmen,
  d: { name: string; von: string; grund: string; hoibe: number; paypal: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const menge = d.hoibe === 1 ? 'a Hoibe' : `${d.hoibe} Hoibe`;
  const inhalt = baue(r, {
    anrede: `Servus ${d.name}!`,
    absaetze: [`${d.von} hat di gmeldt: „${d.grund}“. Des kost ${menge}.`, `Zahl beim Kassenwart${d.paypal ? ' oder per PayPal' : ''}.`],
    knopf: { text: 'Zur Kasse', pfad: '/kasse' },
  });
  return { betreff: 'Du wurdst gmeldt', inhalt };
}

/** Feedback aus der App: geht an Julius persönlich. */
export function mailFeedback(r: MailRahmen, d: { name: string; gruppe: string; text: string }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: 'Servus Julius!',
    absaetze: [`${d.name} vom ${d.gruppe} hat Feedback zur App gschickt:`, `„${d.text}“`],
    knopf: { text: 'Im Verzeichnis anschauen', pfad: '/verzeichnis' },
    einstellbar: false,
  });
  return { betreff: `Feedback: ${d.gruppe}`, inhalt };
}
