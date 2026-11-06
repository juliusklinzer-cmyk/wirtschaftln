import { Avatar } from '@/components/ds';

export type ErgebnisZeile = { id: string; name: string; photoUrl: string | null; verein: string | null; anzahl: number };

/**
 * Ergebnis der Präsidentenwahl (06.11.2026): Gewinner oben, darunter die
 * Stimmen je Kandidat als Balken. „Einstimmig“, wenn alle den gleichen
 * gwählt haben, bei Gleichstand der Hinweis auf die Stichwahl samt Vorrunde.
 */
export function WahlErgebnis({
  jahr,
  zeilen,
  abgegeben,
  einstimmig,
  vorrunde,
}: {
  jahr: number;
  zeilen: ErgebnisZeile[];
  abgegeben: number;
  einstimmig: boolean;
  /** Erste Runde, wenn’s über a Stichwahl ging */
  vorrunde?: ErgebnisZeile[] | null;
}) {
  const sieger = zeilen[0];
  if (!sieger) return null;
  const balken = (liste: ErgebnisZeile[], gesamt: number, klein = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: klein ? 6 : 8 }}>
      {liste.map((z, i) => (
        <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!klein && <Avatar src={z.photoUrl} name={z.name} size={28} verein={z.verein} />}
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: klein ? 12 : 13, fontWeight: 700, color: 'var(--ink-700)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
              <span className="wn-tnum" style={{ flex: 'none', fontWeight: 800 }}>{z.anzahl} {z.anzahl === 1 ? 'Stimme' : 'Stimmen'}</span>
            </span>
            <span style={{ height: klein ? 4 : 6, borderRadius: 999, background: 'var(--ink-50)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.round((z.anzahl / Math.max(1, gesamt)) * 100)}%`, borderRadius: 999, background: i === 0 && !klein ? 'var(--grad-gold)' : 'var(--ink-200)' }} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
  const vorrundeGesamt = vorrunde?.reduce((n, z) => n + z.anzahl, 0) ?? 0;

  return (
    <div style={{ background: 'var(--weiss)', borderRadius: 'var(--r-lg)', border: '1px solid var(--ink-100)', boxShadow: 'var(--sh-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: '0 0 0 3px var(--gold)' }}>
          <Avatar src={sieger.photoUrl} name={sieger.name} size={48} verein={sieger.verein} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-700)' }}>Präsident {jahr}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{sieger.name}</span>
        </span>
        {(einstimmig || vorrunde) && (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: einstimmig ? 'var(--grad-gold)' : 'var(--ink-50)', color: einstimmig ? 'var(--navy-900)' : 'var(--ink-700)', whiteSpace: 'nowrap', flex: 'none' }}>
            {einstimmig ? 'Einstimmig' : 'Nach Stichwahl'}
          </span>
        )}
      </div>
      {!einstimmig && balken(zeilen, abgegeben)}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)' }}>
        {einstimmig ? `Alle ${abgegeben} Stimmen für ${sieger.name}.` : `${abgegeben} ${abgegeben === 1 ? 'Stimme' : 'Stimmen'} abgegeben.`}
      </span>
      {vorrunde && vorrunde.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 800, color: 'var(--muc-blau)' }}>Erste Runde anschauen</summary>
          <div style={{ paddingTop: 10 }}>{balken(vorrunde, vorrundeGesamt, true)}</div>
        </details>
      )}
    </div>
  );
}
