import { beitrittBild, beitrittVorschau, bildAntwort } from '@/lib/link-vorschau';

/** Vorschaubild für /beitreten?code=… (Link-Vorschau 5a/6a) */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code') ?? undefined;
  return bildAntwort(await beitrittBild(beitrittVorschau(code)));
}
