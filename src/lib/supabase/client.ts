// Client Supabase lato BROWSER (Client Components).
// Usato per login/logout e, se vuoi, letture dirette protette da RLS.
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
