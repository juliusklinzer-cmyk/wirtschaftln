'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Prohibit } from '@phosphor-icons/react/dist/ssr/Prohibit';
import { LockSimpleOpen } from '@phosphor-icons/react/dist/ssr/LockSimpleOpen';
import { Gift } from '@phosphor-icons/react/dist/ssr/Gift';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { goldKnopfStil } from '@/components/domain/hero-stil';
import { anfrageEntscheidenAction, gruppeStatusAendern, tokenSchenken } from './actions';

const nebenKnopfStil: React.CSSProperties = { height: 48, borderRadius: 14, border: '1.5px solid var(--ink-200)', background: 'var(--weiss)', color: 'var(--navy)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 };
const rotKnopfStil: React.CSSProperties = { ...nebenKnopfStil, border: '1.5px solid rgba(192,57,43,0.35)', color: 'var(--strafe)' };

/** Freigeben / Ablehnen einer Token-Anfrage, danach die grüne Meldung (4e). */
export function AnfrageKnoepfe({ id }: { id: string }) {
  const [laeuft, starte] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  const entscheiden = (e: 'freigegeben' | 'abgelehnt') =>
    starte(async () => {
      const r = await anfrageEntscheidenAction(id, e);
      setMeldung(r.fehler ? { ok: false, text: r.fehler } : { ok: true, text: r.meldung ?? 'Erledigt.' });
      // Meldung kurz stehen lassen, dann Zahlen und Liste auffrischen
      if (!r.fehler) setTimeout(() => router.refresh(), 2500);
    });
  if (meldung) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: meldung.ok ? 'var(--erfolg-bg)' : 'var(--strafe-bg)' }}>
        <CheckCircle size={24} weight="fill" color={meldung.ok ? 'var(--erfolg)' : 'var(--strafe)'} />
        <span style={{ fontSize: 14, fontWeight: 800, color: meldung.ok ? 'var(--erfolg)' : 'var(--strafe)' }}>{meldung.text}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" className="wn-press" disabled={laeuft} onClick={() => entscheiden('freigegeben')} style={{ ...goldKnopfStil, minHeight: 48, fontSize: 15, flex: 1, opacity: laeuft ? 0.7 : 1 }}>
        <CheckCircle size={18} weight="fill" />Freigeben
      </button>
      <button type="button" className="wn-press" disabled={laeuft} onClick={() => entscheiden('abgelehnt')} style={rotKnopfStil}>Ablehnen</button>
    </div>
  );
}

/** Sperren mit Bestätigungs-Blatt (3c), Entsperren direkt (4b). */
export function SperrKnopf({ id, name, gesperrt, spezln }: { id: string; name: string; gesperrt: boolean; spezln: number }) {
  const [offen, setOffen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  const router = useRouter();
  const setzen = (status: 'aktiv' | 'gesperrt') =>
    starte(async () => {
      const r = await gruppeStatusAendern(id, status);
      if (r.fehler) setFehler(r.fehler);
      else { setOffen(false); router.refresh(); }
    });
  return (
    <>
      {gesperrt ? (
        <button type="button" className="wn-press" disabled={laeuft} onClick={() => setzen('aktiv')} style={nebenKnopfStil}>
          <LockSimpleOpen size={18} />{laeuft ? 'Moment …' : 'Entsperren'}
        </button>
      ) : (
        <button type="button" className="wn-press" onClick={() => setOffen(true)} style={rotKnopfStil}>
          <Prohibit size={18} />Stammtisch sperren
        </button>
      )}
      {fehler && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
      {offen && (
        <div role="dialog" aria-modal="true" onClick={() => setOffen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(7,25,58,0.5)', display: 'flex', alignItems: 'flex-end', maxWidth: 'var(--container-app)', margin: '0 auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--ink-50)', borderRadius: '28px 28px 0 0', padding: '10px 20px calc(34px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -14px 36px rgba(7,25,58,0.3)' }}>
            <span style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 99, background: 'var(--ink-200)' }} />
            <span style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--strafe-bg)', color: 'var(--strafe)', display: 'grid', placeItems: 'center', alignSelf: 'center' }}><Prohibit size={28} weight="fill" /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-fraktur)', fontSize: 28, lineHeight: 1.05, color: 'var(--navy)' }}>{name} sperren?</span>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-500)' }}>{spezln} Spezln kommen nicht mehr rein. Daten bleiben erhalten, du kannst jederzeit entsperren.</span>
            </div>
            <button type="button" className="wn-press" disabled={laeuft} onClick={() => setzen('gesperrt')} style={{ height: 52, borderRadius: 14, border: 'none', background: 'var(--strafe)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: laeuft ? 0.7 : 1 }}>
              {laeuft ? 'Moment …' : 'Sperren'}
            </button>
            <button type="button" className="wn-press" onClick={() => setOffen(false)} style={nebenKnopfStil}>Abbrechen</button>
          </div>
        </div>
      )}
    </>
  );
}

/** „Token schenken“ auf der Detailseite. */
export function SchenkKnopf({ id }: { id: string }) {
  const [laeuft, starte] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="wn-press" disabled={laeuft} onClick={() => starte(async () => { const r = await tokenSchenken(id); if (r.fehler) setFehler(r.fehler); })} style={{ ...goldKnopfStil, minHeight: 48, fontSize: 15, opacity: laeuft ? 0.7 : 1 }}>
        <Gift size={18} weight="fill" />{laeuft ? 'Moment …' : 'Token schenken'}
      </button>
      {fehler && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--strafe)' }}>{fehler}</span>}
    </>
  );
}

/** Klappt das Stammdaten-Formular auf („Stammdaten bearbeiten“). */
export function BearbeitenKlappe({ children }: { children: React.ReactNode }) {
  const [offen, setOffen] = useState(false);
  if (offen) return <>{children}</>;
  return (
    <button type="button" className="wn-press" onClick={() => setOffen(true)} style={nebenKnopfStil}>
      <PencilSimple size={18} />Stammdaten bearbeiten
    </button>
  );
}
