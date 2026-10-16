import { bildAntwort, gruendungBild, gruendungVorschau } from '@/lib/link-vorschau';

/** Vorschaubild für /gruenden/[token] (Link-Vorschau 5a/6b) */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return bildAntwort(await gruendungBild(gruendungVorschau(token)));
}
