'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';

export default function Header({ username, role }: { username: string; role: AppRole }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="app-header">
      <div className="brand">Customer Journey <em>Library</em></div>
      <div className="user-badge">
        <span>{username}</span>
        <span className={`role-pill ${role}`}>{role}</span>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
