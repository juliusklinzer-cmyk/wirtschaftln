'use client';

import { useEffect, useState } from 'react';
import { Avatar, Icon } from '@/components/ds';
import { VotePills } from '@/components/domain/VotePills';

export type ZugesagterSpezl = { name: string; photoUrl: string | null; verein: 'bayern' | 'sechzig' | null };

/**
 * Abstimmung auf der Heim-Karte: solange koa Stimme da is, stehen die
 * Zusagen/Absagen-Knöpfe offen. Danach is die Karte „zua": Daumen + eigene
 * Antwort fix, drunter wer scho kommt (Avatare) und der Zählerstand
 * („6 kemman · 1 ko ned · 3 warten no"). Ändern geht weiterhin über den
 * kleinen Knopf, bis zum Abend derf jeder umschwenken.
 */
export function AbstimmungsStand({
  terminId,
  terminDatum,
  meinVote,
  zugesagte,
  abgesagt,
  offen,
}: {
  terminId: string;
  terminDatum: string;
  meinVote: 'zu' | 'vielleicht' | 'ab' | null;
  zugesagte: ZugesagterSpezl[];
  abgesagt: number;
  offen: number;
}) {
  // Legacy-„vielleicht" zählt wie keine Antwort
  const stimme = meinVote === 'zu' || meinVote === 'ab' ? meinVote : null;
  const [aendern, setAendern] = useState(false);
  // Neue Stimme vom Server angekommen → Ändern-Modus wieder zuklappen
  useEffect(() => setAendern(false), [meinVote]);

  const dabei = stimme === 'zu';
  const zu = zugesagte.length;

  return (
    <div>
      {stimme === null || aendern ? (
        <>
          <div style={{ margin: '16px 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--gold-bright)' }}>
            Hast du Zeit?
          </div>
          <VotePills terminId={terminId} current={stimme} terminDatum={terminDatum} onDark />
          {aendern && (
            <button
              type="button"
              onClick={() => setAendern(false)}
              style={{ marginTop: 8, border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.65)', cursor: 'pointer' }}
            >
              Doch ned ändern
            </button>
          )}
        </>
      ) : (
        <div
          style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            background: 'rgba(255,255,255,0.08)', border: `1.5px solid ${dabei ? 'var(--erfolg)' : 'var(--strafe)'}`,
            borderRadius: 'var(--r-md)',
          }}
        >
          <span
            style={{
              width: 38, height: 38, flex: 'none', borderRadius: '50%',
              background: dabei ? 'var(--erfolg)' : 'var(--strafe)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="daumen" size={19} style={dabei ? undefined : { transform: 'rotate(180deg) scaleX(-1)' }} />
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: 'var(--pergament)' }}>
            {dabei ? 'Passt, du bist dabei!' : 'Du hast abgsagt.'}
          </span>
          <button
            type="button"
            onClick={() => setAendern(true)}
            style={{
              flex: 'none', border: '1px solid rgba(255,255,255,0.35)', background: 'transparent',
              borderRadius: 'var(--r-pill)', padding: '6px 12px', fontFamily: 'var(--font-ui)',
              fontSize: 12, fontWeight: 800, color: 'var(--pergament)', cursor: 'pointer',
            }}
          >
            Ändern
          </button>
        </div>
      )}

      {/* Wer kommt, Avatare der Zugesagten + Zählerstand */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {zu > 0 && (
          <span style={{ display: 'inline-flex', flex: 'none' }}>
            {zugesagte.slice(0, 8).map((s, i) => (
              <span key={s.name} style={{ marginLeft: i === 0 ? 0 : -9, display: 'inline-flex', borderRadius: '50%', border: '2px solid var(--navy-900)', zIndex: 8 - i }}>
                <Avatar src={s.photoUrl} name={s.name} size={27} verein={s.verein} />
              </span>
            ))}
            {zu > 8 && (
              <span className="wn-tnum" style={{ marginLeft: -9, width: 31, height: 31, borderRadius: '50%', border: '2px solid var(--navy-900)', background: 'rgba(255,255,255,0.18)', color: 'var(--pergament)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                +{zu - 8}
              </span>
            )}
          </span>
        )}
        <span className="wn-tnum" style={{ fontSize: 12, fontWeight: 700, color: 'rgba(246,240,226,0.75)' }}>
          <b style={{ color: 'var(--erfolg)' }}>{zu}</b> {zu === 1 ? 'kimmt' : 'kemman'}
          {' · '}
          <b style={{ color: abgesagt > 0 ? 'var(--strafe)' : undefined }}>{abgesagt}</b> {abgesagt === 1 ? 'ko ned' : 'kennan ned'}
          {' · '}
          <b>{offen}</b> {offen === 1 ? 'wart no' : 'warten no'}
        </span>
      </div>
    </div>
  );
}
