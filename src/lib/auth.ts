// Autorizzazione lato server. Equivalente di blockIfReadOnly()/enforceRoleUI()
// del vecchio frontend, ma qui il controllo è REALE: gira sul server prima
// di qualsiasi scrittura, e non è aggirabile dalla console del browser.
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/lib/types';

export interface SessionUser {
  id: string;
  email: string | null;
  username: string;
  role: AppRole;
}

// Ritorna l'utente autenticato + ruolo, oppure null.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role, active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.active) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile.username ?? (user.email?.split('@')[0] ?? 'user'),
    role: profile.role as AppRole,
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

// Garantisce che l'utente abbia uno dei ruoli richiesti; altrimenti lancia.
// Da usare in cima a ogni API route che scrive.
export async function requireRole(roles: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError('Non autenticato.', 401);
  if (!roles.includes(user.role)) {
    throw new AuthError(
      `Operazione riservata ai ruoli: ${roles.join(', ')}. Il tuo ruolo è ${user.role}.`,
      403
    );
  }
  return user;
}
