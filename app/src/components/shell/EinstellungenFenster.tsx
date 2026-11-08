'use client';

import { useRouter } from 'next/navigation';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { HouseLine } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { Gavel } from '@phosphor-icons/react/dist/ssr/Gavel';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket';
import { UserPlus } from '@phosphor-icons/react/dist/ssr/UserPlus';
import { EinstellungZeile } from '@/components/domain/EinstellungZeile';
import { PushEinstellung } from '@/components/domain/PushEinstellung';
import { AppInstallieren } from '@/components/domain/AppInstallieren';
import { DaniModusSchalter } from '@/components/domain/DaniModus';

/**
 * Einstellungen übers Zahnrad im breiten Kopf (Responsive Redesign 6b): links
 * „Für dich“, rechts der Stammtisch. Die Verwaltung sehen nur Admin und
 * Präsident, alle anderen kriegen Steckbrief, Strafen und Einladen.
 */
export function EinstellungenFenster({ darfVerwalten, gaudi, onClose }: { darfVerwalten: boolean; gaudi: boolean; onClose: () => void }) {
  const router = useRouter();
  const geh = (href: string) => () => {
    onClose();
    router.push(href);
  };
  const pfeil = <CaretRight size={18} color="var(--ink-300)" />;
  const karte: React.CSSProperties = { background: 'var(--weiss)', borderRadius: 20, border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '6px 18px 4px', minWidth: 0 };
  const eyebrow: React.CSSProperties = { display: 'block', paddingTop: 10, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-700)' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Einstellungen"
      className="wn-fenster wn-scroll-still"
      style={{ position: 'fixed', inset: 0, zIndex: 60, ['--wn-fenster-breite' as string]: '860px', background: 'var(--ink-50)', color: 'var(--ink-900)', padding: '26px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-fraktur)', fontWeight: 400, fontSize: 36, lineHeight: 1, color: 'var(--navy)' }}>Einstellungen</h2>
        <button type="button" onClick={onClose} aria-label="Schließen" className="wn-press" style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--ink-100)', color: 'var(--ink-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <section style={karte}>
          <span style={eyebrow}>Für dich</span>
          <PushEinstellung />
          <EinstellungZeile icon={<EnvelopeSimple size={19} weight="fill" />} titel="Mails" unter="Termin, Kasse, Umfragen" rechts={pfeil} onClick={geh('/profil#mails')} letzte={!gaudi} />
          {gaudi && <DaniModusSchalter />}
          <AppInstallieren variante="profil" />
        </section>
        <section style={karte}>
          {darfVerwalten ? (
            <>
              <span style={eyebrow}>Stammtisch · Admin</span>
              <EinstellungZeile icon={<HouseLine size={19} weight="fill" />} titel="Stammdaten" unter="Name, Ort, Bier, Motto" rechts={pfeil} onClick={geh('/stammtisch')} />
              <EinstellungZeile icon={<Gavel size={19} weight="fill" />} titel="Strafen" unter="Katalog pflegen" rechts={pfeil} onClick={geh('/stammtisch')} />
              <EinstellungZeile icon={<UsersThree size={19} weight="fill" />} titel="Mitglieder & Ämter" unter="Rang, Ämter, neue Spezln" rechts={pfeil} onClick={geh('/spezln')} />
              <EinstellungZeile icon={<Ticket size={19} weight="fill" />} titel="Gründungs-Token" unter="im Profil unter Einstellungen" rechts={pfeil} onClick={geh('/profil')} letzte />
            </>
          ) : (
            <>
              <span style={eyebrow}>Stammtisch</span>
              <EinstellungZeile icon={<HouseLine size={19} weight="fill" />} titel="Unser Stammtisch" unter="Steckbrief & Strafen" rechts={pfeil} onClick={geh('/stammtisch')} />
              <EinstellungZeile icon={<UserPlus size={19} weight="fill" />} titel="Spezl einladen" rechts={pfeil} onClick={geh('/einladen')} letzte />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
