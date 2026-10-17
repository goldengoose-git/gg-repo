'use client';

// Header fedele all'originale SFMC: barra a 3 colonne (brand GG|PwC — toggle
// Home/Map/List(/Admin) — Status, badge utente+ruolo, timer sessione, Logout).
// Le toggle controllano la vista di RepositoryApp. Dark-mode su Map/List.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';

export type HeaderView = 'dashboard' | 'map' | 'templates' | 'admin';

const GG_LOGO = 'https://www.goldengoose.com/on/demandware.static/Sites-ggdb-emea-Site/-/default/dw0550352e/images/logo.svg';
const PWC_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/PwC_2025_Logo.svg/120px-PwC_2025_Logo.svg.png';

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>,
  templates: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></svg>,
  admin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /><polyline points="9 12 11 14 15 10" /></svg>,
};

export default function Header({
  username, role, view, onSwitch, isAdmin,
}: {
  username: string;
  role: AppRole;
  view: HeaderView;
  onSwitch: (v: HeaderView) => void;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [secs, setSecs] = useState(600);

  // Timer sessione (cosmetico, fedele all'originale): conto alla rovescia da 10:00,
  // si resetta all'attività. Non effettua logout automatico.
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    let last = 0;
    const reset = () => { const n = Date.now(); if (n - last > 1000) { last = n; setSecs(600); } };
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => { clearInterval(id); window.removeEventListener('pointerdown', reset); window.removeEventListener('keydown', reset); };
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const tabs: { key: HeaderView; label: string }[] = [
    { key: 'dashboard', label: 'Home' },
    { key: 'map', label: 'Map' },
    { key: 'templates', label: 'List' },
  ];
  if (isAdmin) tabs.push({ key: 'admin', label: 'Admin' });

  const dark = view === 'map' || view === 'templates';

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className={`gg-header${dark ? ' dark-mode' : ''}`}>
      <div className="header-left">
        <div className="header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nav-logo" src={GG_LOGO} alt="Golden Goose" />
          <div className="header-sep" />
          <span className="header-title">SFMC Repository</span>
          <div className="header-sep" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pwc-logo" src={PWC_LOGO} alt="PwC" />
        </div>
      </div>

      <div className="header-center">
        <div className="toggle-group">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`toggle-btn${view === t.key ? ' active' : ''}`}
              onClick={() => onSwitch(t.key)}
              title={t.label}
            >
              {ICONS[t.key]}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        <button type="button" className="alert-pill" title="Status">
          <span className="alert-dot" />
          <span>Status</span>
          <span className="alert-count">0</span>
        </button>

        <div className="repo-user-badge">
          <span>{username}</span>
          <strong>{role}</strong>
          <span className={`repo-role-pill ${role}`}>{role}</span>
        </div>

        <div className="session-block">
          <div className={`session-timer${secs <= 60 ? ' warning' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span className="session-timer-value">{mm}:{ss}</span>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
