import { HandWaving } from '@phosphor-icons/react/dist/ssr/HandWaving';

/** Wer sich in den letzten 90 Tagen verabschiedet hat, sieht jeder (auch ohne Push). */
export function AbschiedZeilen({ abschiede }: { abschiede: Array<{ id: string; name: string; am: string; selbst: boolean }> }) {
  return (
    <section style={{ background: 'var(--weiss)', border: '1px solid var(--ink-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {abschiede.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HandWaving size={20} weight="fill" color="var(--ink-500)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.4 }}>
            <b style={{ color: 'var(--ink-900)' }}>{a.name.charAt(0).toUpperCase() + a.name.slice(1)}</b> {a.selbst ? 'hat sich' : 'ist'} am {a.am} {a.selbst ? 'verabschiedet' : 'ausgeschieden'}. Servus und mach’s gut!
          </span>
        </div>
      ))}
    </section>
  );
}
