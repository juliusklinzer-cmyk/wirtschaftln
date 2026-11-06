import { currentTenant } from '@/lib/db';
import { getAktiveMitglieder } from '@/lib/queries';
import { anzeigeName } from '@/lib/namen';

/** Wer hat mir heut was ausgegeben? „Anna“, „Anna 2×“, je Art, für die Zeile unterm Deckel. */
export function ausgegebenVon(terminId: string, memberId: string): { bier: string[]; schnaps: string[] } {
  const rows = currentTenant().sqlite
    .prepare(
      `SELECT r.art AS art, r.spender_id AS spender, COUNT(*) AS n FROM runden r JOIN runden_empfaenger e ON e.runde_id = r.id
       WHERE r.termin_id = ? AND e.member_id = ? GROUP BY r.art, r.spender_id ORDER BY MIN(r.created_at)`,
    )
    .all(terminId, memberId) as Array<{ art: 'bier' | 'schnaps'; spender: string; n: number }>;
  const mitglieder = getAktiveMitglieder();
  const name = (id: string) => {
    const m = mitglieder.find((x) => x.id === id);
    if (!m) return 'wer';
    const [erster, ...rest] = anzeigeName(m).split(' ');
    return erster.length <= 3 && rest.length > 0 ? anzeigeName(m) : erster;
  };
  const liste = (art: 'bier' | 'schnaps') => rows.filter((r) => r.art === art).map((r) => (r.n > 1 ? `${name(r.spender)} ${r.n}×` : name(r.spender)));
  return { bier: liste('bier'), schnaps: liste('schnaps') };
}
