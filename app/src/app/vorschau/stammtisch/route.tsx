import { bildAntwort, stammtischBild } from '@/lib/link-vorschau';

/** Vorschaubild für jede andere Seite: Stammtisch, Stadt · seit Jahr */
export async function GET(req: Request) {
  const g = new URL(req.url).searchParams.get('g') ?? undefined;
  return bildAntwort(await stammtischBild(g));
}
