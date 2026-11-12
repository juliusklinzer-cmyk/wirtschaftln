'use client';

import { useMemo, useState, useTransition } from 'react';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { HandHeart } from '@phosphor-icons/react/dist/ssr/HandHeart';
import { HandCoins } from '@phosphor-icons/react/dist/ssr/HandCoins';
import { Receipt } from '@phosphor-icons/react/dist/ssr/Receipt';
import { ShoppingCart } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr/DownloadSimple';
import { Crown } from '@phosphor-icons/react/dist/ssr/Crown';

export type KassenbuchArt = 'strafe' | 'spende' | 'einzahlung' | 'ausgabe' | 'auslage';
/** `erlassen`/`zuruecknehmen` gehen über die Katalog-Buchung, `aufgehoben` erlässt eine alte Forderung ohne Buchung */
export type KassenbuchKnopf = { art: 'beglichen' | 'offen' | 'aufgehoben' | 'erlassen' | 'zuruecknehmen'; id: string };
export type KassenbuchZeile = {
  id: string;
  art: KassenbuchArt;
  /** Grund („Zu spät ab 1 Std“, „Spende, Geburtstag“) */
  titel: string;
  /** Wer: Vorname, „Du“ oder „Vereinskasse“ */
  person: string;
  /** ISO-Tag (Termin-Datum, sonst Buchungstag) */
  datum: string;
  /** Aus Sicht der Kasse: Forderungen plus, Ausgaben minus */
  cents: number;
  status: 'offen' | 'beglichen' | 'aufgehoben' | null;
  /** „erlassen von Resi“, „bleibt, gerichtet von Hansi“ */
  vermerk: string | null;
  knoepfe: KassenbuchKnopf[];
};
type Filter = 'alle' | 'strafe' | 'spende' | 'ausgabe';

const euro = (cents: number) => `${(Math.abs(cents) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const vorzeichen = (cents: number) => (cents < 0 ? `−${euro(cents)}` : `+${euro(cents)}`);
const tagMonat = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

const ART: Record<KassenbuchArt, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
  strafe: { label: 'Strafe', bg: 'var(--strafe-bg)', fg: 'var(--strafe)', icon: <Gavel size={17} weight="fill" /> },
  spende: { label: 'Spende', bg: 'var(--erfolg-bg)', fg: 'var(--erfolg)', icon: <HandHeart size={17} weight="fill" /> },
  einzahlung: { label: 'Einzahlung', bg: 'var(--erfolg-bg)', fg: 'var(--erfolg)', icon: <HandCoins size={17} weight="fill" /> },
  ausgabe: { label: 'Ausgabe', bg: 'var(--info-bg)', fg: 'var(--muc-blau)', icon: <ShoppingCart size={17} weight="fill" /> },
  auslage: { label: 'Auslage', bg: 'var(--info-bg)', fg: 'var(--muc-blau)', icon: <Receipt size={17} weight="fill" /> },
};
const FILTER: { key: Filter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'strafe', label: 'Strafen' },
  { key: 'spende', label: 'Spenden' },
  { key: 'ausgabe', label: 'Ausgaben' },
];
const passt = (f: Filter, art: KassenbuchArt) =>
  f === 'alle' || (f === 'strafe' && art === 'strafe') || (f === 'spende' && (art === 'spende' || art === 'einzahlung')) || (f === 'ausgabe' && (art === 'ausgabe' || art === 'auslage'));

const ZEIGEN = 14;
const SPALTEN = '36px minmax(0, 1fr) auto auto 84px';

/**
 * Kassenbuch ab Tablet (Responsive Redesign 4a, 12.11.2026): eine Karte mit
 * Filter-Pillen, nach Monat gruppiert mit Monatssumme, je Zeile Symbol, Grund
 * und Wer, Art-Chip, Datum und Betrag. Kassenwart und Präsident haben ihre
 * kleinen Knöpfe (beglichen, erlassen, zurücknehmen) unter dem Grund. Unten
 * „Alle Bewegungen“ und der CSV-Export.
 */
export function KassenbuchBreit({
  zeilen,
  actions,
}: {
  zeilen: KassenbuchZeile[];
  actions: {
    status: (id: string, status: 'offen' | 'beglichen' | 'aufgehoben') => Promise<void>;
    erlassen: (buchungId: string) => Promise<void>;
    zuruecknehmen: (buchungId: string) => Promise<void>;
  };
}) {
  const [filter, setFilter] = useState<Filter>('alle');
  const [alle, setAlle] = useState(false);
  const [pending, startTransition] = useTransition();

  const gefiltert = useMemo(() => zeilen.filter((z) => passt(filter, z.art)), [zeilen, filter]);
  const sichtbar = alle ? gefiltert : gefiltert.slice(0, ZEIGEN);

  // Monatsgruppen in der Reihenfolge der Zeilen (neueste zuerst)
  const gruppen: { key: string; label: string; summe: number; zeilen: KassenbuchZeile[] }[] = [];
  const heuerJahr = new Date().getFullYear();
  for (const z of sichtbar) {
    const key = z.datum.slice(0, 7);
    let g = gruppen.find((x) => x.key === key);
    if (!g) {
      const d = new Date(`${z.datum.slice(0, 7)}-01T12:00:00`);
      const label = d.toLocaleDateString('de-DE', { month: 'long', ...(d.getFullYear() !== heuerJahr ? { year: 'numeric' } : {}) });
      g = { key, label, summe: 0, zeilen: [] };
      gruppen.push(g);
    }
    g.zeilen.push(z);
    if (z.status !== 'aufgehoben') g.summe += z.cents;
  }

  const klick = (k: KassenbuchKnopf) =>
    startTransition(async () => {
      if (k.art === 'erlassen') await actions.erlassen(k.id);
      else if (k.art === 'zuruecknehmen') await actions.zuruecknehmen(k.id);
      else await actions.status(k.id, k.art);
    });

  const exportieren = () => {
    const kopf = ['Datum', 'Art', 'Wer', 'Grund', 'Betrag', 'Status'];
    const zeile = (z: KassenbuchZeile) => [
      z.datum,
      ART[z.art].label,
      z.person,
      z.titel,
      ((z.status === 'aufgehoben' ? 0 : z.cents) / 100).toFixed(2).replace('.', ','),
      z.status ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';');
    const csv = `﻿${[kopf.join(';'), ...gefiltert.map(zeile)].join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kassenbuch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const pille = (aktiv: boolean): React.CSSProperties => ({
    height: 32, padding: '0 12px', borderRadius: 999, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    border: aktiv ? 'none' : '1.5px solid var(--ink-200)', background: aktiv ? 'var(--navy)' : 'var(--weiss)', color: aktiv ? 'var(--pergament)' : 'var(--navy)',
  });
  const kleinKnopf = (farbe: string): React.CSSProperties => ({
    padding: '3px 9px', borderRadius: 999, border: `1.5px solid ${farbe}`, background: 'transparent', color: farbe,
    fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: pending ? 0.6 : 1,
  });
  const KNOPF: Record<KassenbuchKnopf['art'], { label: string; farbe: string }> = {
    beglichen: { label: '✓ beglichen', farbe: 'var(--erfolg)' },
    offen: { label: 'wieder offen', farbe: '#B7791F' },
    aufgehoben: { label: 'Erlassen', farbe: 'var(--gold-700)' },
    erlassen: { label: 'Erlassen', farbe: 'var(--gold-700)' },
    zuruecknehmen: { label: 'Zurücknehmen', farbe: 'var(--ink-500)' },
  };

  return (
    <section style={{ background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '18px 22px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 28, lineHeight: 1, color: 'var(--navy)' }}>Kassenbuch</h2>
        <div role="group" aria-label="Kassenbuch filtern" style={{ display: 'flex', gap: 6 }}>
          {FILTER.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); setAlle(false); }} className="wn-press" style={pille(filter === f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {gefiltert.length === 0 && (
        <div style={{ padding: '28px 0 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--ink-500)' }}>
          {zeilen.length === 0 ? 'Noch keine Bewegungen, brav seid’s.' : 'Nix in dieser Sorte.'}
        </div>
      )}

      {gruppen.map((g) => (
        <div key={g.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 6px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{g.label}</span>
            <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 800, color: g.summe < 0 ? 'var(--strafe)' : 'var(--erfolg)' }}>{vorzeichen(g.summe)}</span>
          </div>
          {g.zeilen.map((z) => {
            const a = ART[z.art];
            const erlassen = z.status === 'aufgehoben';
            const offen = z.art === 'strafe' && z.status === 'offen';
            const [chipBg, chipFg, chipText] = erlassen ? ['var(--ink-50)', 'var(--ink-500)', 'erlassen'] : offen ? ['var(--warnung-bg)', '#B7791F', 'offen'] : [a.bg, a.fg, a.label];
            const betragFarbe = erlassen ? 'var(--ink-300)' : offen ? '#B7791F' : z.cents < 0 ? 'var(--strafe)' : 'var(--erfolg)';
            return (
              <div key={z.id} style={{ display: 'grid', gridTemplateColumns: SPALTEN, gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--ink-50)', opacity: erlassen ? 0.65 : 1 }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: a.bg, color: a.fg, display: 'grid', placeItems: 'center' }}>{a.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span title={z.titel} style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{z.titel}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{z.person}</span>
                  {z.vermerk && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-700)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Crown size={12} weight="fill" />
                      {z.vermerk}
                    </span>
                  )}
                  {z.knoepfe.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {z.knoepfe.map((k) => (
                        <button key={k.art} type="button" disabled={pending} onClick={() => klick(k)} className="wn-press" style={kleinKnopf(KNOPF[k.art].farbe)}>
                          {KNOPF[k.art].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: chipFg, justifySelf: 'start', padding: '3px 8px', borderRadius: 999, background: chipBg, whiteSpace: 'nowrap' }}>{chipText}</span>
                <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{tagMonat(z.datum)}</span>
                <span className="wn-tnum" style={{ fontSize: 14, fontWeight: 800, color: betragFarbe, textAlign: 'right', whiteSpace: 'nowrap', textDecoration: erlassen ? 'line-through' : undefined }}>{vorzeichen(z.cents)}</span>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, gap: 12 }}>
        {gefiltert.length > ZEIGEN ? (
          <button type="button" onClick={() => setAlle((v) => !v)} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 800, color: 'var(--muc-blau)', cursor: 'pointer' }}>
            {alle ? 'Weniger anzeigen' : `Ganzes Kassenbuch · ${gefiltert.length} Bewegungen →`}
          </button>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{gefiltert.length === 1 ? '1 Bewegung' : `${gefiltert.length} Bewegungen`}</span>
        )}
        <button type="button" onClick={exportieren} disabled={gefiltert.length === 0} className="wn-press" style={{ height: 34, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          <DownloadSimple size={15} weight="bold" />
          Export
        </button>
      </div>
    </section>
  );
}
