// Home (Server Component). Legge template E journey da Supabase lato server
// e li passa al guscio client (header + viste). Monta anche gli effetti intro (Fase D).
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toTemplateVM, toJourneyVM } from '@/lib/mappers';
import type { TemplateRow, JourneyRow } from '@/lib/types';
import RepositoryApp from '@/components/RepositoryApp';
import IntroFx from '@/components/IntroFx';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const supabase = createClient();

  const [tplRes, jRes] = await Promise.all([
    supabase.from('templates').select('*').order('name', { ascending: true }),
    supabase.from('journeys').select('*').order('name', { ascending: true }),
  ]);

  const templates = ((tplRes.data as TemplateRow[] | null) ?? []).map(toTemplateVM);
  const journeys = ((jRes.data as JourneyRow[] | null) ?? []).map(toJourneyVM);
  const error = tplRes.error || jRes.error;

  // Pool immagini per il mosaico intro: hero dei journey + hero dei template.
  const introImages = [
    ...journeys.map((j) => ({ src: j.img, name: j.name })),
    ...templates.map((t) => ({ src: t.heroImage, name: t.journeyName || t.name })),
  ].filter((x) => x.src && x.src.trim() !== '');

  return (
    <>
      <IntroFx images={introImages} count={templates.length} />
      {error ? (
        <div className="container"><div className="empty">Errore nel caricamento: {error.message}</div></div>
      ) : (
        <RepositoryApp
          role={user.role}
          username={user.username}
          templates={templates}
          journeys={journeys}
        />
      )}
    </>
  );
}
