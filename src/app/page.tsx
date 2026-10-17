// Home (Server Component). Legge template E journey da Supabase lato server
// (RLS con l'identità utente) e li passa al guscio client che commuta tra
// Dashboard e Templates. Niente bridge AMPscript: query tipizzate.
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toTemplateVM, toJourneyVM } from '@/lib/mappers';
import type { TemplateRow, JourneyRow } from '@/lib/types';
import Header from '@/components/Header';
import RepositoryApp from '@/components/RepositoryApp';
import Loader from '@/components/Loader';

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

  return (
    <>
      <Loader />
      <Header username={user.username} role={user.role} />
      {error ? (
        <div className="container"><div className="empty">Errore nel caricamento: {error.message}</div></div>
      ) : (
        <RepositoryApp templates={templates} journeys={journeys} />
      )}
    </>
  );
}
