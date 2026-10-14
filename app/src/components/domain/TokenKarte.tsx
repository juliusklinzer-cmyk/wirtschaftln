'use client';

import { useState, useTransition } from 'react';
import { Copy } from '@phosphor-icons/react/dist/ssr/Copy';
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { LockSimple } from '@phosphor-icons/react/dist/ssr/LockSimple';
import { PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { HourglassMedium } from '@phosphor-icons/react/dist/ssr/HourglassMedium';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { goldKnopfStil } from '@/components/domain/hero-stil';

export type TokenAnzeige = {
  token: string;
  link: string;
  widmung: string | null;
  /** „von dir · 14. Okt.“ bzw. „von Kathi · 14. Okt.“ */
  gewidmetZeile: string | null;
  /** null = no offen; sonst wer/wann eingelöst */
  eingeloest: { gruppeName: string; stadt: string | null; am: string } | null;
};
/** Frist für Anspruch-Tokens (neue Stammtische): nr 1/2, Datum lang und kurz, offen = no ned erreicht */
export type FristAnzeige = { nr: number; monate: number; abLang: string; abKurz: string; offen: boolean };
export type AnfrageAnzeige = { id: string; status: 'offen' | 'freigegeben' | 'abgelehnt'; am: string; grund: string };

const karteStil: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };
const feldStil: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-900)', outline: 'none' };
const nebenKnopfStil: React.CSSProperties = { height: 48, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
const fehlerStil: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--strafe)' };

function Kachel({ ton, children }: { ton: 'gold' | 'gruen' | 'grau'; children: React.ReactNode }) {
  const f = { gold: { bg: 'var(--pergament)', fg: 'var(--gold-700)' }, gruen: { bg: 'var(--erfolg-bg)', fg: 'var(--erfolg)' }, grau: { bg: '#EEF1F5', fg: 'var(--ink-300)' } }[ton];
  return <span style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, color: f.fg, display: 'grid', placeItems: 'center', flex: 'none' }}>{children}</span>;
}

/**
 * Gründungs-Tokens im Profil (Token-Verzeichnis-Redesign 1a–1e): offene
 * Tokens werden zuerst gewidmet, dann geteilt; eingelöste als grüne Zeile;
 * gesperrte Fristen (neue Stammtische) grau mit Schloss und Zeitstrahl;
 * Anfrage für weitere Tokens mit Verlauf. Der Gründer-Admin kann neue münzen.
 */
export function TokenKarte({
  tokens,
  fristen,
  gruendung,
  anfragen,
  darfAnfragen,
  eigene,
  widmen,
  anfrageSchicken,
  neuerToken,
}: {
  tokens: TokenAnzeige[];
  /** Alle Anspruch-Fristen (erreichte und offene), nur bei fremden Stammtischen */
  fristen: FristAnzeige[];
  /** Gründungsdatum kurz („10. Okt.“) für den Zeitstrahl */
  gruendung: string;
  anfragen: AnfrageAnzeige[];
  darfAnfragen: boolean;
  /** Gründer-Mitglied: „Dein“ statt „Euer“ */
  eigene: boolean;
  widmen: (token: string, widmung: string) => Promise<{ fehler?: string }>;
  anfrageSchicken?: (grund: string) => Promise<{ fehler?: string }>;
  /** Server Action: frischen Token münzen (nur Gründer-Admin, sonst weglassen) */
  neuerToken?: () => Promise<void>;
}) {
  const [laeuft, starte] = useTransition();
  const ungewidmet = tokens.filter((t) => !t.eingeloest && !t.widmung);
  const naechste = fristen.find((f) => f.offen) ?? null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tokens.map((t) => <TokenZeile key={t.token} t={t} eigene={eigene} frei={ungewidmet.length} widmen={widmen} />)}
      {naechste && <FristKarte frist={naechste} fristen={fristen} gruendung={gruendung} />}
      {anfrageSchicken && darfAnfragen && <AnfrageFormular schicken={anfrageSchicken} />}
      {anfragen.length > 0 && (
        <div style={{ ...karteStil, padding: '2px 16px', gap: 0 }}>
          {anfragen.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < anfragen.length - 1 ? '1px solid #EEF1F5' : 'none' }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-900)' }}>Token-Anfrage</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.status === 'offen' ? `seit ${a.am}` : a.status === 'freigegeben' ? `${a.am} · Token liegt oben` : a.am}
                </span>
              </span>
              <AnfrageChip status={a.status} />
            </div>
          ))}
        </div>
      )}
      {neuerToken && (
        <button type="button" className="wn-press" disabled={laeuft} onClick={() => starte(async () => { await neuerToken(); })} style={nebenKnopfStil}>
          <Plus size={18} weight="bold" />{laeuft ? 'Moment …' : 'Neuen Token erzeugen'}
        </button>
      )}
    </div>
  );
}

export function AnfrageChip({ status }: { status: AnfrageAnzeige['status'] }) {
  const f = status === 'offen'
    ? { bg: '#FBF1D6', fg: '#B7791F', icon: <HourglassMedium size={13} weight="fill" />, text: 'Anfrage läuft' }
    : status === 'freigegeben'
      ? { bg: 'var(--erfolg-bg)', fg: 'var(--erfolg)', icon: <CheckCircle size={13} weight="fill" />, text: 'Freigegeben' }
      : { bg: '#EEF1F5', fg: 'var(--ink-500)', icon: <XCircle size={13} weight="fill" />, text: 'Abgelehnt' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: f.bg, color: f.fg, whiteSpace: 'nowrap', flex: 'none' }}>
      {f.icon}{f.text}
    </span>
  );
}

function TokenZeile({ t, eigene, frei, widmen }: { t: TokenAnzeige; eigene: boolean; frei: number; widmen: (token: string, widmung: string) => Promise<{ fehler?: string }> }) {
  const [kopiert, setKopiert] = useState(false);
  const [widmung, setWidmung] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(t.link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1800);
    } catch { /* koa Clipboard, der Link steht ja lesbar da */ }
  };
  const teilen = async () => {
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    const fuer = t.widmung ? ` für ${t.widmung}` : '';
    if (nav.share) {
      try {
        await nav.share({ title: 'Gründe deinen eigenen Stammtisch', text: `Eine Ehren-Einladung${fuer}: Mit dem Link gründest du euren eigenen Stammtisch in der Wirtschaftln-App.`, url: t.link });
        return;
      } catch { /* abgebrochen */ }
    }
    void kopieren();
  };

  if (t.eingeloest) {
    return (
      <div style={karteStil}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Kachel ton="gruen"><CheckCircle size={22} weight="fill" /></Kachel>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{t.eingeloest.gruppeName} gegründet</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
              {[t.eingeloest.stadt, t.eingeloest.am, t.widmung ? `für ${t.widmung}` : 'ohne Widmung'].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!t.widmung) {
    /* 1a: zuerst widmen */
    return (
      <form
        style={karteStil}
        onSubmit={(e) => {
          e.preventDefault();
          setFehler(null);
          starte(async () => {
            const r = await widmen(t.token, widmung);
            if (r.fehler) setFehler(r.fehler);
          });
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Kachel ton="gold"><Ticket size={22} weight="fill" /></Kachel>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, lineHeight: 1.05, color: 'var(--navy)' }}>{eigene ? 'Dein Gründungs-Token' : 'Euer Gründungs-Token'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{frei} Token frei · noch niemandem gewidmet</span>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--ink-500)' }}>Ein Token ist eine Ehren-Einladung. Überlegt’s euch gemeinsam, wen ihr dabei haben wollt.</span>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Für wen ist der Token?</span>
          <input value={widmung} onChange={(e) => setWidmung(e.target.value)} placeholder="Sepp aus Regensburg" maxLength={60} required style={feldStil} />
        </label>
        {fehler && <span style={fehlerStil}>{fehler}</span>}
        <button type="submit" className="wn-press" disabled={laeuft} style={{ ...goldKnopfStil, minHeight: 52, fontSize: 15, opacity: laeuft ? 0.7 : 1 }}>
          <SealCheck size={18} weight="fill" />{laeuft ? 'Moment …' : 'Widmen'}
        </button>
      </form>
    );
  }

  /* 1b: gewidmet, jetzt Link, Teilen, Kopieren */
  return (
    <div style={karteStil}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Kachel ton="gold"><Ticket size={22} weight="fill" /></Kachel>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>Gewidmet</span>
          <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 22, lineHeight: 1.05, color: 'var(--navy)' }}>Für {t.widmung}</span>
          {t.gewidmetZeile && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>{t.gewidmetZeile}</span>}
        </div>
      </div>
      <button type="button" onClick={kopieren} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, background: 'var(--pergament)', border: '1px dashed var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.link.replace(/^https?:\/\//, '')}</span>
        <Copy size={18} color="var(--gold-700)" style={{ flex: 'none' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" onClick={teilen} className="wn-press" style={{ ...goldKnopfStil, minHeight: 48, fontSize: 15 }}>
          <ShareNetwork size={18} weight="fill" />Teilen
        </button>
        <button type="button" onClick={kopieren} className="wn-press" style={nebenKnopfStil}>
          <Copy size={18} />{kopiert ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}

/** 1d: nächste Frist grau mit Schloss, drunter der Zeitstrahl Gründung → Token 1 → Token 2 */
function FristKarte({ frist, fristen, gruendung }: { frist: FristAnzeige; fristen: FristAnzeige[]; gruendung: string }) {
  const punkt = (label: string, datum: string, erreicht: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ width: 12, height: 12, borderRadius: 99, background: erreicht ? 'var(--gold)' : '#fff', border: `2px solid ${erreicht ? 'var(--gold)' : 'var(--ink-200)'}` }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: erreicht ? 'var(--gold-700)' : 'var(--ink-300)' }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-300)' }}>{datum}</span>
    </div>
  );
  const linie = <span style={{ flex: 1, height: 2, background: 'var(--ink-100)', borderRadius: 2 }} />;
  return (
    <div style={{ ...karteStil, background: '#F7F9FB' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Kachel ton="grau"><LockSimple size={22} weight="fill" /></Kachel>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-500)' }}>Euer nächster Token kommt am {frist.abLang}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-300)' }}>{frist.monate} Monate nach der Gründung</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #EEF1F5' }}>
        {punkt('Gründung', gruendung, true)}
        {fristen.map((f) => (
          <span key={f.nr} style={{ display: 'contents' }}>
            {linie}
            {punkt(`Token ${f.nr}`, f.abKurz, !f.offen)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 1e: weiteren Token anfragen, Grund is Pflicht */
function AnfrageFormular({ schicken }: { schicken: (grund: string) => Promise<{ fehler?: string }> }) {
  const [grund, setGrund] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  return (
    <form
      style={karteStil}
      onSubmit={(e) => {
        e.preventDefault();
        setFehler(null);
        starte(async () => {
          const r = await schicken(grund);
          if (r.fehler) setFehler(r.fehler);
          else setGrund('');
        });
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 24, lineHeight: 1, color: 'var(--navy)' }}>Weiteren Token anfragen</span>
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink-500)' }}>Wen wollt ihr einladen und warum?</span>
      </div>
      <textarea value={grund} onChange={(e) => setGrund(e.target.value)} rows={3} maxLength={300} required placeholder="z. B. Mein Schwager will in Passau einen Stammtisch aufmachen, die Runde ist schon beisammen." style={{ ...feldStil, minHeight: 88, resize: 'vertical' }} />
      {fehler && <span style={fehlerStil}>{fehler}</span>}
      <button type="submit" className="wn-press" disabled={laeuft} style={{ ...goldKnopfStil, minHeight: 52, fontSize: 15, opacity: laeuft ? 0.7 : 1 }}>
        <PaperPlaneTilt size={18} weight="fill" />{laeuft ? 'Moment …' : 'Anfrage schicken'}
      </button>
    </form>
  );
}
