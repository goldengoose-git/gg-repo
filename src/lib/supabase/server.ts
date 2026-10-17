// Client Supabase lato SERVER (Server Components, Route Handlers).
// Usa la anon key + i cookie di sessione dell'utente: le query passano
// quindi attraverso la RLS con l'identità del visitatore.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: ignorabile se c'è un middleware
            // che rinfresca la sessione.
          }
        },
      },
    }
  );
}
