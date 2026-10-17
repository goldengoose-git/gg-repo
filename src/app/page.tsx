// Home (Server Component). Legge i template da Supabase lato server,
// passando per la RLS con l'identità dell'utente loggato. È lo slice
// verticale di LETTURA end-to-end: DB -> SSR -> UI.
//
// La vecchia pagina iniettava i dati via %%=v(@jsonString)=%% da SSJS;
// qui li prendiamo con una query tipizzata, senza bridge AMPscript.
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toTemplateVM } from '@/lib/mappers';
import type { TemplateRow } from '@/lib/types';
import Header from '@/components/Header';
import TemplateList from '@/components/TemplateList';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('name', { ascending: true });

  const templates = ((data as TemplateRow[] | null) ?? []).map(toTemplateVM);

  return (
    <>
      <Header username={user.username} role={user.role} />
      {error ? (
        <div className="container"><div className="empty">Errore nel caricamento: {error.message}</div></div>
      ) : (
        <TemplateList templates={templates} />
      )}
    </>
  );
}
