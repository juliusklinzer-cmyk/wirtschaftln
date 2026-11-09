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
  /** Hauptknopf: `pfad` in der App oder fertige `url` */
  knopf?: { text: string; pfad?: string; url?: string };
  /** Zweiter, heller Knopf daneben (z. B. „Ich verabschiede mich“) */
  knopf2?: { text: string; url: string };
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
const RAND = '#E5E7EB';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Satzanfang groß („da Toni“ → „Da Toni“). */
function gross(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function url(r: MailRahmen, pfad: string): string {
  return `${r.basisUrl.replace(/\/+$/, '')}${pfad.startsWith('/') ? pfad : `/${pfad}`}`;
}

function baue(r: MailRahmen, b: Baustein): MailInhalt {
  const einstellUrl = url(r, '/profil#mails');
  const signatur = `Deine ${r.stammtisch}-App`;
  const knopfUrl = b.knopf ? (b.knopf.url ?? url(r, b.knopf.pfad ?? '/')) : null;

  const text = [
    b.anrede,
    '',
    ...b.absaetze.flatMap((a) => [a, '']),
    ...(b.kasten ? [...b.kasten.map(([k, v]) => `${k}: ${v}`), ''] : []),
    ...(b.knopf && knopfUrl ? [`${b.knopf.text}: ${knopfUrl}`] : []),
    ...(b.knopf2 ? [`${b.knopf2.text}: ${b.knopf2.url}`] : []),
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
  const knopf = b.knopf && knopfUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px"><tr><td style="background:${NAVY};border-radius:12px">
        <a href="${esc(knopfUrl)}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">${esc(b.knopf.text)}</a>
      </td></tr></table>`
    : '';
  const knopf2 = b.knopf2
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px"><tr><td style="border:1.5px solid ${RAND};border-radius:12px">
        <a href="${esc(b.knopf2.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:700;color:${NAVY};text-decoration:none">${esc(b.knopf2.text)}</a>
      </td></tr></table>`
    : '';
  const links = (b.links ?? [])
    .map((l) => `<div style="margin:6px 0"><a href="${esc(l.url)}" style="font-size:14px;font-weight:700;color:${NAVY}">${esc(l.text)}</a></div>`)
    .join('');

  // Weißer Hintergrund wie in der Mail-App, die Karte hebt si nur mit am Rand ab
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${RAND};border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <tr><td style="background:${NAVY};padding:18px 22px;border-bottom:3px solid ${GOLD}">
    <span style="font-size:18px;font-weight:800;color:${GOLD}">${esc(r.stammtisch)}</span>
  </td></tr>
  <tr><td style="padding:22px;color:${TINTE};font-size:15px;line-height:1.55">
    <p style="margin:0 0 14px;font-weight:700">${esc(b.anrede)}</p>
    ${b.absaetze.map((a) => `<p style="margin:0 0 14px">${esc(a)}</p>`).join('')}
    ${kasten}${knopf}${knopf2}${links}
    ${b.hinweis ? `<p style="margin:14px 0 0;font-size:13px;color:${GRAU}">${esc(b.hinweis)}</p>` : ''}
    <p style="margin:20px 0 0;font-weight:700;color:${NAVY}">${esc(signatur)}</p>
  </td></tr>
  ${b.einstellbar !== false ? `<tr><td style="padding:14px 22px;border-top:1px solid ${RAND};font-size:12px;color:${GRAU}">Zu viele Mails? <a href="${esc(einstellUrl)}" style="color:${GRAU}">Mails einstellen</a></td></tr>` : ''}
</table></td></tr></table></body></html>`;

  return { text, html };
}

// ───────────────────────── Kalender ─────────────────────────

/** Lokale Berliner Zeit → UTC im ICS-Format (20261105T180000Z), Sommer-/Winterzeit inklusive. */
export function berlinNachUtc(datum: string, zeit: string): Date {
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

/** Zeilen über 75 Byte falten (RFC 5545: Fortsetzung beginnt mit Leerzeichen), ohne UTF-8-Zeichen zu zerteilen. */
function icsFalten(zeile: string): string {
  const teile: string[] = [];
  let aktuell = '';
  let bytes = 0;
  for (const z of zeile) {
    const n = Buffer.byteLength(z);
    if (bytes + n > 75) {
      teile.push(aktuell);
      aktuell = ' ';
      bytes = 1;
    }
    aktuell += z;
    bytes += n;
  }
  teile.push(aktuell);
  return teile.join('\r\n');
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
    .filter((z): z is string => Boolean(z))
    .map(icsFalten)
    .join('\r\n');
}

// ───────────────────────── Die Mails ─────────────────────────
// Ton: Münchnerisch, also Hochdeutsch mit bayrischem Einschlag (Julius, 30.10.2026)

/** Termin und Wirtshaus stehen fest: alle außer dem Organisator, mit Kalender und Route. */
export function mailTerminFest(
  r: MailRahmen,
  d: { terminId: string; uid: string; datum: string; zeit: string; datumText: string; wirtshaus: string; adresse: string | null; bezirk: string | null; routeUrl: string; organisator: string | null },
): { betreff: string; inhalt: MailInhalt } {
  const ort = [d.wirtshaus, d.adresse].filter(Boolean).join(', ');
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: [
      `Der nächste Stammtisch steht fest: ${d.wirtshaus}${d.bezirk ? ` in ${d.bezirk}` : ''}.${d.organisator ? ` ${d.organisator} hat reserviert.` : ''}`,
      'Sag bis drei Tage vorher zu oder ab, dann gibt’s einen WP obendrauf.',
    ],
    kasten: [
      ['Wann', `${d.datumText}, ${d.zeit} Uhr`],
      ['Wo', d.wirtshaus],
      ...(d.adresse ? ([['Adresse', d.adresse]] as Array<[string, string]>) : []),
    ],
    knopf: { text: 'Zu- oder absagen', pfad: '/termin' },
    links: [{ text: 'Route in Google Maps', url: d.routeUrl }],
    hinweis: 'Im Anhang findest du den Termin für deinen Kalender. Einfach antippen und speichern, am iPhone genauso wie am Android.',
  });
  inhalt.ics = {
    dateiname: `stammtisch-${d.datum}.ics`,
    inhalt: icsTermin({ uid: d.uid, datum: d.datum, zeit: d.zeit, titel: `${r.stammtisch}: ${d.wirtshaus}`, ort, beschreibung: `Route: ${d.routeUrl}`, url: url(r, '/termin') }),
  };
  return { betreff: `Stammtisch am ${d.datumText}: ${d.wirtshaus}`, inhalt };
}

/** Termin verschoben: an alle, Stimmen sind zurückgesetzt. */
export function mailTerminVerschoben(
  r: MailRahmen,
  d: { altText: string; datumText: string; zeit: string; wirtshaus: string | null; von: string },
): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: [
      `${gross(d.von)} hat den Stammtisch vom ${d.altText} verschoben.`,
      'Deine Zu- oder Absage ist damit zurückgesetzt. Sag bitte für den neuen Termin nochmal kurz zu oder ab.',
    ],
    kasten: [['Neuer Termin', `${d.datumText}, ${d.zeit} Uhr`], ...(d.wirtshaus ? ([['Wirtshaus', d.wirtshaus]] as Array<[string, string]>) : [])],
    knopf: { text: 'Jetzt abstimmen', pfad: '/termin' },
  });
  return { betreff: `Stammtisch verschoben auf ${d.datumText}`, inhalt };
}

/** Noch nicht abgestimmt: 1 Tag vor der Frist (letzte = am Tag vorm Termin). */
export function mailAbstimmen(
  r: MailRahmen,
  d: { datumText: string; zeit: string; wirtshaus: string | null; letzte: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const wo = d.wirtshaus ? ` im ${d.wirtshaus}` : '';
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: d.letzte
      ? [
          `Morgen ist Stammtisch${wo}, ${d.datumText} um ${d.zeit} Uhr, und von dir fehlt noch eine Antwort.`,
          'Sag kurz zu oder ab. Wer ohne Absage fehlt, gilt als unentschuldigt.',
        ]
      : [
          `Für den Stammtisch${wo} am ${d.datumText} hast du noch nicht zu- oder abgesagt.`,
          'Wenn du bis morgen abstimmst, bekommst du noch den WP fürs rechtzeitige Abstimmen.',
        ],
    knopf: { text: 'Jetzt abstimmen', pfad: '/termin' },
  });
  return { betreff: d.letzte ? 'Morgen ist Stammtisch: Bist du dabei?' : `Bist du dabei am ${d.datumText}?`, inhalt };
}

/** Orga noch frei, 14 Tage vorher an alle. */
export function mailOrgaOffen(r: MailRahmen, d: { datumText: string; tage: number }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: 'Servus!',
    absaetze: [
      `Für den Stammtisch am ${d.datumText} hat sich noch keiner die Orga geschnappt, und es sind nur noch ${d.tage} Tage.`,
      'Wer sie übernimmt, sucht ein Wirtshaus aus und reserviert. Dafür gibt’s natürlich WP.',
    ],
    knopf: { text: 'Ich regel das', pfad: '/termin' },
  });
  return { betreff: `Wer organisiert den Stammtisch am ${d.datumText}?`, inhalt };
}

/** Reservierung offen: an den Organisator (beim zweiten Mal mit Präsident). */
export function mailReservierungOffen(
  r: MailRahmen,
  d: { datumText: string; tage: number; organisator: string; zweite: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: d.zweite ? 'Servus miteinander!' : `Servus ${d.organisator}!`,
    absaetze: d.zweite
      ? [
          `Für den Stammtisch am ${d.datumText} steht ${d.tage === 1 ? 'einen Tag' : `${d.tage} Tage`} vorher noch kein Wirtshaus fest. Die Orga hat ${d.organisator}.`,
          'Bitte schnell reservieren und in der App eintragen, sonst weiß keiner, wo’s hingeht.',
        ]
      : [
          `Du hast die Orga für den Stammtisch am ${d.datumText}, in ${d.tage === 1 ? 'einem Tag' : `${d.tage} Tagen`} ist es so weit.`,
          'Ist schon ein Wirtshaus reserviert? Dann trag es in der App ein, erst dann können die anderen zu- oder absagen.',
        ],
    knopf: { text: 'Wirtshaus eintragen', pfad: '/termin' },
  });
  return { betreff: d.zweite ? `Dringend: Noch kein Wirtshaus für den ${d.datumText}` : `Noch kein Wirtshaus für den ${d.datumText}`, inhalt };
}

/** Gemeldet: nur der Betroffene. */
export function mailStrafe(
  r: MailRahmen,
  d: { name: string; von: string | null; strafe: string; folge: string; zahlen: boolean; paypal: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const wer = d.von ? `${gross(d.von)} hat dir eine Strafe gebucht` : 'Die App hat dir eine Strafe gebucht';
  const absaetze = [`${wer}: „${d.strafe}“. Das kostet ${d.folge}.`];
  if (d.zahlen) absaetze.push(`Zahlen kannst du beim Kassenwart${d.paypal ? ' oder per PayPal' : ''}.`);
  const inhalt = baue(r, { anrede: `Servus ${d.name}!`, absaetze, knopf: { text: 'Zur Kasse', pfad: '/kasse' } });
  return { betreff: `Strafe: ${d.strafe}`, inhalt };
}

/** Zahlungsaufforderung vom Kassenwart (WIR-011): alle offenen Forderungen des Spezls. */
export function mailZahlung(
  r: MailRahmen,
  d: { name: string; kassenwart: string | null; posten: Array<[string, string]>; summe: string; paypal: boolean },
): { betreff: string; inhalt: MailInhalt } {
  const wer = d.kassenwart ? `${gross(d.kassenwart)} wahrt die Kasse und` : 'Die Kasse';
  const inhalt = baue(r, {
    anrede: `Servus ${d.name}!`,
    absaetze: [
      `${wer} erinnert dich: bei dir ist noch was offen, zusammen ${d.summe}.`,
      `Zahlen kannst du ${d.kassenwart ? `bar bei ${d.kassenwart}` : 'beim Kassenwart'}${d.paypal ? ' oder per PayPal' : ''}.`,
    ],
    kasten: [...d.posten, ['Zusammen', d.summe]],
    knopf: { text: 'Zur Kasse', pfad: '/kasse' },
  });
  return { betreff: `Bitte zahlen: ${d.summe} offen`, inhalt };
}

/** Feedback aus der App: geht an Julius persönlich. */
export function mailFeedback(r: MailRahmen, d: { name: string; gruppe: string; text: string }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: 'Servus Julius!',
    absaetze: [`${d.name} vom Stammtisch ${d.gruppe} hat Feedback zur App geschickt:`, `„${d.text}“`],
    knopf: { text: 'Im Verzeichnis anschauen', pfad: '/verzeichnis' },
    einstellbar: false,
  });
  return { betreff: `Feedback: ${d.gruppe}`, inhalt };
}

/** Passwort vergessen: ein Link pro Stammtisch, kommt immer. */
export function mailPasswort(r: MailRahmen, d: { vorname: string | null; links: Array<{ name: string; url: string }> }): { betreff: string; inhalt: MailInhalt } {
  const einer = d.links.length === 1;
  const inhalt = baue(r, {
    anrede: d.vorname ? `Servus ${d.vorname}!` : 'Servus!',
    absaetze: [einer ? 'Mit diesem Link setzt du dir ein neues Passwort:' : 'Du bist in mehreren Stammtischen, für jeden gibt’s einen eigenen Link zum neuen Passwort:'],
    knopf: einer ? { text: 'Neues Passwort setzen', url: d.links[0].url } : undefined,
    links: einer ? undefined : d.links.map((l) => ({ text: `Neues Passwort für ${l.name}`, url: l.url })),
    hinweis: 'Der Link gilt eine Stunde. Wenn du das nicht angefordert hast, ignorier die Mail einfach, dein Passwort bleibt, wie es ist.',
    einstellbar: false,
  });
  return { betreff: `Neues Passwort für ${r.stammtisch}`, inhalt };
}

/** Willkommen: der neu aufgenommene Spezl mit Zugang, kommt immer. */
export function mailWillkommen(
  r: MailRahmen,
  d: { vorname: string; woher: string; email: string; passwort: string },
): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: `Servus ${d.vorname}!`,
    absaetze: [
      `Du bist jetzt dabei beim ${r.stammtisch}${d.woher ? `, dem Stammtisch ${d.woher}` : ''}.`,
      'Beim ersten Anmelden setzt du dir gleich dein eigenes Passwort und füllst dein Profil aus. Das Lieblingsbier nicht vergessen!',
    ],
    kasten: [
      ['E-Mail', d.email],
      ['Start-Passwort', d.passwort],
    ],
    knopf: { text: 'Jetzt anmelden', pfad: '/login' },
    hinweis: 'Bis bald am Tisch!',
    einstellbar: false,
  });
  return { betreff: `Servus beim ${r.stammtisch}!`, inhalt };
}

/** Wackler: dreimal in Folge unentschuldigt gefehlt, einmal pro Wackel-Phase. Kommt immer. */
export function mailWackeln(r: MailRahmen, d: { vorname: string; anzahl: number; dabeiUrl: string; abschiedUrl: string }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: `Servus ${d.vorname}!`,
    absaetze: [
      `Du hast jetzt ${d.anzahl} Stammtische hintereinander ohne Absage gefehlt. Das ist kein Vorwurf, manchmal kommt halt das Leben dazwischen.`,
      'Wir wollen nur wissen, woran wir sind: Bist du weiter dabei, oder magst du dich lieber verabschieden?',
      'Wenn du dich verabschiedest, bleiben deine Abende, Punkte und Bewertungen in der Chronik. Und wenn du irgendwann zurück willst, holen wir dich gern wieder rein.',
    ],
    knopf: { text: 'Ja, ich bin dabei', url: d.dabeiUrl },
    knopf2: { text: 'Ich verabschiede mich', url: d.abschiedUrl },
    hinweis: 'Wenn du nicht antwortest, entscheidet nach 14 Tagen der Präsident.',
    einstellbar: false,
  });
  return { betreff: 'Bist du noch dabei?', inhalt };
}

/** Einer ist ausgeschieden: kurze Info an alle anderen. */
export function mailAbschied(r: MailRahmen, d: { anrede: string; name: string; selbst: boolean }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: `Servus ${d.anrede}!`,
    absaetze: [
      d.selbst ? `${gross(d.name)} hat sich vom Stammtisch verabschiedet. Servus und mach’s gut!` : `${gross(d.name)} ist aus dem Stammtisch ausgeschieden.`,
      'Seine Abende und Punkte bleiben in der Chronik.',
    ],
    knopf: { text: 'Zu den Spezln', pfad: '/spezln' },
  });
  return { betreff: d.selbst ? `${gross(d.name)} hat sich verabschiedet` : `${gross(d.name)} ist ausgeschieden`, inhalt };
}

/** Wackler hat 14 Tage nicht geantwortet: an den Präsident (oder die Admins). */
export function mailWacklerOhneAntwort(r: MailRahmen, d: { anrede: string; wackler: string; gefragtAm: string }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: `Servus ${d.anrede}!`,
    absaetze: [
      `${gross(d.wackler)} wackelt und hat sich auf unsere Frage vom ${d.gefragtAm} nicht gemeldet.`,
      'Als Präsident entscheidest du jetzt: ausscheiden lassen oder dabei lassen. Das geht unter Spezln ganz unten.',
    ],
    knopf: { text: 'Jetzt entscheiden', pfad: '/spezln#wackler' },
  });
  return { betreff: `${gross(d.wackler)} hat nicht geantwortet`, inhalt };
}

/** Weihnachtsgeschenk (24.12.2026): jeder Spezl kriegt seinen persönlichen Einladungstoken. */
export function mailWeihnachten(r: MailRahmen, d: { vorname: string; token: string }): { betreff: string; inhalt: MailInhalt } {
  const inhalt = baue(r, {
    anrede: `Frohe Weihnachten, ${d.vorname}!`,
    absaetze: [
      'Unterm Christbaum liegt heuer was für dich: dein persönlicher Einladungstoken. Damit kannst du einen neuen Stammtisch einladen, Freunde, Kollegen, die Verwandtschaft.',
      'In der App schreibst du dazu, für wen er ist, und schickst ihn gleich weiter.',
    ],
    kasten: [['Dein Token', d.token]],
    knopf: { text: 'Token verschenken', pfad: '/' },
    hinweis: 'Schöne Feiertage und an guaden Rutsch!',
    einstellbar: false,
  });
  return { betreff: '🎁 Frohe Weihnachten! Dein Einladungstoken', inhalt };
}
