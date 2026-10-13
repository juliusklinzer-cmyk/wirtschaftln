'use client';

/**
 * Wirtschaftln, Segment (Redesign 13.10.2026)
 * Navy-Segment mit Goldrand, aktiver Eintrag in Gold: Ansichts-Wahl auf
 * Archiv und Rang. `aufKarte` = leicht durchscheinend über der Google-Karte.
 */
export function Segment<T extends string>({
  value,
  onChange,
  items,
  aufKarte = false,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string }>;
  aufKarte?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, padding: 4, borderRadius: 14, background: aufKarte ? 'rgba(7,25,58,0.85)' : 'rgba(7,25,58,0.92)', boxShadow: '0 6px 18px rgba(7,25,58,0.3)', border: '1px solid rgba(208,173,102,0.4)', backdropFilter: aufKarte ? 'blur(4px)' : undefined }}>
      {items.map((it) => {
        const an = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            aria-pressed={an}
            style={{ height: 38, borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: an ? 800 : 700, background: an ? 'var(--gold)' : 'transparent', color: an ? 'var(--navy-900)' : 'rgba(246,240,226,0.75)', transition: 'background 160ms var(--ease-standard), color 160ms var(--ease-standard)', whiteSpace: 'nowrap' }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
