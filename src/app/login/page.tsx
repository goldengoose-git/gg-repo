'use client';

// Login. Rimpiazza l'intera CloudPage SSJS (ggdb_cj_library_login):
// niente più SHA256+salt a mano, lockout manuale, DE dei tentativi.
// Supabase Auth gestisce hashing, rate limiting e sessione via cookie.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Credenziali non valide.');
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Accedi alla <em>Repository</em></h1>
        <p className="sub">Customer Journey Library · Golden Goose</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email} autoComplete="username"
              onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password} autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Accesso…' : 'Accedi'}
          </button>
        </form>
        {error && <div className="msg error">{error}</div>}
      </div>
    </div>
  );
}
