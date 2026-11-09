'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Schaut alle 20 Sekunden nach, ob der Bürge zugesagt hat (dann leitet die Seite selbst weiter). */
export function NachschauenTakt() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
