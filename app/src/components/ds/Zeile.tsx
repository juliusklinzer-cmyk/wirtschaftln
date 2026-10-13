import Link from 'next/link';
import { Icon } from './Icon';

/**
 * Wirtschaftln, Zeile (Redesign 13.10.2026)
 * Der eine Listen-Baustein: Icon-Kachel · Titel · Untertitel · Chip oder Pfeil.
 * Als Link, Knopf (onClick / submit) oder stille Zeile. Zeilen leben in einer
 * ZeilenKarte (weiße Karte mit 4px/16px Innenabstand, Haarlinien dazwischen).
 */
export function ZeilenKarte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: '4px 16px', display: 'flex', flexDirection: 'column', ...style }}>
      {children}
    </div>
  );
}

/** Quadratische Icon-Kachel 36px: blau (Info), gold (Pergament) oder grau (gesperrt). */
export function Kachel({ ton = 'blau', children, rund = false }: { ton?: 'blau' | 'gold' | 'grau'; children: React.ReactNode; rund?: boolean }) {
  const farben = {
    blau: { bg: 'var(--info-bg)', fg: 'var(--muc-blau)' },
    gold: { bg: 'var(--pergament)', fg: 'var(--gold-700)' },
    grau: { bg: 'var(--ink-50)', fg: 'var(--ink-500)' },
  }[ton];
  return (
    <span style={{ width: 36, height: 36, flex: 'none', borderRadius: rund ? '50%' : 10, background: farben.bg, color: farben.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
  );
}

export function Zeile({
  kachel = null,
  titel,
  untertitel = null,
  chip = null,
  pfeil = true,
  href,
  onClick,
  submit = false,
  letzte = false,
  gedaempft = false,
  style = {},
}: {
  kachel?: React.ReactNode;
  titel: React.ReactNode;
  untertitel?: React.ReactNode;
  chip?: React.ReactNode;
  pfeil?: boolean;
  href?: string;
  onClick?: () => void;
  /** true = Submit-Knopf fürs umgebende <form> */
  submit?: boolean;
  letzte?: boolean;
  /** Titel ausgegraut (z. B. wer ned da war) */
  gedaempft?: boolean;
  style?: React.CSSProperties;
}) {
  const basis: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 0', width: '100%',
    borderWidth: `0 0 ${letzte ? 0 : 1}px 0`, borderStyle: 'solid', borderColor: 'var(--ink-50)',
    background: 'transparent', textAlign: 'left', textDecoration: 'none', color: 'inherit',
    fontFamily: 'var(--font-ui)', cursor: href || onClick || submit ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'transparent', ...style,
  };
  const inhalt = (
    <>
      {kachel}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: gedaempft ? 'var(--ink-300)' : 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titel}</span>
        {untertitel && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{untertitel}</span>}
      </span>
      {chip}
      {pfeil && <Icon name="chevron" size={16} color="var(--ink-200)" style={{ flex: 'none' }} />}
    </>
  );
  if (href) return <Link href={href} className="wn-press" style={basis}>{inhalt}</Link>;
  if (onClick || submit) {
    return (
      <button type={submit ? 'submit' : 'button'} onClick={onClick} className="wn-press" style={basis}>
        {inhalt}
      </button>
    );
  }
  return <div style={basis}>{inhalt}</div>;
}

/** Kleiner Zähl-/Status-Chip: grün dabei, rot abgesagt, grau offen, Pergament Punkte, blau Info. */
export function Chip({ ton = 'grau', children }: { ton?: 'erfolg' | 'strafe' | 'grau' | 'gold' | 'blau'; children: React.ReactNode }) {
  const farben = {
    erfolg: { bg: 'var(--erfolg-bg)', fg: 'var(--erfolg)' },
    strafe: { bg: 'var(--strafe-bg)', fg: 'var(--strafe)' },
    grau: { bg: 'var(--ink-50)', fg: 'var(--ink-500)' },
    gold: { bg: 'var(--pergament)', fg: 'var(--gold-700)' },
    blau: { bg: 'var(--info-bg)', fg: 'var(--muc-blau)' },
  }[ton];
  return (
    <span className="wn-tnum" style={{ flex: 'none', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: farben.bg, color: farben.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}
