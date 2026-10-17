'use client';

// Login fedele all'originale SFMC (ggdb_cj_library_login): top-bar, header con logo,
// titolo "Accedi alla Repository" in oro, griglia a 2 colonne (auth + card Cloudflare).
// L'autenticazione resta Supabase (email/password); niente SSJS/SHA256/lockout manuale.
// CSS scoped sotto .lg-root per non entrare in conflitto con globals.css.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CSS = `
@font-face{font-family:"urw-din";src:url("https://use.typekit.net/af/f1d51b/00000000000000007735a83d/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3") format("woff2"),url("https://use.typekit.net/af/f1d51b/00000000000000007735a83d/30/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3") format("woff");font-display:swap;font-style:normal;font-weight:400;}
@font-face{font-family:"urw-din";src:url("https://use.typekit.net/af/c3b3a1/00000000000000007735a834/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3") format("woff2"),url("https://use.typekit.net/af/c3b3a1/00000000000000007735a834/30/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3") format("woff");font-display:swap;font-style:normal;font-weight:600;}
@font-face{font-family:"urw-din-semi-condensed";src:url("https://use.typekit.net/af/bd0e8a/00000000000000007735a84c/30/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n6&v=3") format("woff2"),url("https://use.typekit.net/af/bd0e8a/00000000000000007735a84c/30/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n6&v=3") format("woff");font-display:swap;font-style:normal;font-weight:600;}

.lg-root{ --bg:#f2f1ee; --card:#fff; --ink:#111; --muted:#767672; --line:#e7e6e2; --gold-a:#d9b978; --gold-b:#b9924f; --danger:#c62828; --danger-bg:#fbeaea; --danger-line:#f0c6c6;
  --font:'urw-din',Arial,Helvetica,sans-serif; --font-display:'urw-din-semi-condensed','urw-din',Arial,sans-serif;
  position:fixed; inset:0; overflow-y:auto; background:var(--bg); color:var(--ink); font-family:var(--font); font-weight:400; z-index:1; }
.lg-root *{ box-sizing:border-box; }
.lg-top{ background:#000; color:#fff; text-align:center; font-family:var(--font-display); font-size:.68rem; letter-spacing:2px; text-transform:uppercase; padding:10px 16px; font-weight:600; }
.lg-top strong{ color:var(--gold-a); }
.lg-header{ background:#fff; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; padding:20px 40px; }
.lg-header img{ display:block; max-width:200px; height:auto; }
.lg-page{ max-width:1180px; margin:0 auto; padding:40px 40px 80px; }
.lg-crumb{ font-size:.78rem; color:var(--muted); margin-bottom:22px; }
.lg-crumb b{ color:var(--ink); font-weight:600; }
.lg-title{ font-family:var(--font-display); font-size:2.4rem; font-weight:600; letter-spacing:.5px; text-transform:uppercase; line-height:1.1; margin-bottom:12px; }
.lg-title em{ font-style:normal; background:linear-gradient(135deg,var(--gold-a),var(--gold-b)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.lg-sub{ color:var(--muted); font-size:.95rem; line-height:1.7; max-width:640px; margin-bottom:34px; }
.lg-grid{ display:grid; grid-template-columns:1.15fr .85fr; gap:2px; background:var(--line); }
.lg-grid>.lg-card{ background:var(--card); }
.lg-card{ padding:34px; }
.lg-card-title{ font-family:var(--font-display); font-size:1.05rem; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; }
.lg-card-desc{ color:var(--muted); font-size:.85rem; line-height:1.6; margin-bottom:24px; }
.lg-field{ margin-bottom:18px; position:relative; }
.lg-label{ font-family:var(--font-display); display:block; margin-bottom:8px; font-size:.68rem; text-transform:uppercase; letter-spacing:1.8px; color:#555; font-weight:600; }
.lg-input{ width:100%; height:50px; border:1px solid #cfcfca; background:#fafaf8; color:var(--ink); padding:0 44px 0 14px; font-size:.92rem; outline:none; transition:border-color .2s,background .2s; }
.lg-input:focus{ border-color:var(--ink); background:#fff; }
.lg-eye{ position:absolute; right:12px; top:34px; background:none; border:none; cursor:pointer; color:#8c8c86; padding:0; line-height:0; }
.lg-eye:hover{ color:var(--ink); }
.lg-eye svg{ width:18px; height:18px; display:block; }
.lg-btn{ width:100%; height:52px; font-family:var(--font-display); font-size:.76rem; text-transform:uppercase; letter-spacing:2px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; background:#111; border:1px solid #111; color:#fff; margin-top:4px; transition:background .2s,opacity .2s; }
.lg-btn:hover{ background:#000; }
.lg-btn:disabled{ opacity:.45; cursor:not-allowed; }
.lg-msg{ margin-top:16px; padding:13px 15px; font-size:.85rem; line-height:1.5; background:var(--danger-bg); border:1px solid var(--danger-line); color:var(--danger); }
.lg-foot{ margin-top:22px; padding-top:18px; border-top:1px solid var(--line); color:var(--muted); font-size:.76rem; line-height:1.6; }
.lg-foot strong{ color:var(--ink); }
.lg-gold{ background:linear-gradient(135deg,var(--gold-a) 0%,var(--gold-b) 100%); color:#241a08; padding:26px; display:flex; flex-direction:column; gap:14px; }
.lg-gold-top{ font-family:var(--font-display); display:flex; align-items:center; gap:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; font-size:.95rem; }
.lg-gold-top svg{ width:20px; height:20px; }
.lg-gold-body{ background:rgba(255,255,255,.55); padding:14px 16px; font-size:.78rem; line-height:1.55; color:#2a2108; }
.lg-status{ font-family:var(--font-display); display:flex; align-items:center; gap:8px; font-size:.72rem; font-weight:600; letter-spacing:.5px; text-transform:uppercase; }
.lg-dot{ width:8px; height:8px; border-radius:50%; background:#2e7d32; box-shadow:0 0 0 3px rgba(46,125,50,.18); }
@media(max-width:860px){ .lg-grid{ grid-template-columns:1fr; } .lg-header{ padding:16px 20px; } .lg-page{ padding:28px 20px 60px; } .lg-title{ font-size:1.7rem; } }
`;

const GG_LOGO = 'https://www.goldengoose.com/on/demandware.static/Sites-ggdb-emea-Site/-/default/dw0550352e/images/logo.svg';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError('Credenziali non valide.'); return; }
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="lg-root">
      <style>{CSS}</style>
      <div className="lg-top">PwC <strong>×</strong> Golden Goose — SFMC Repository</div>
      <header className="lg-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GG_LOGO} alt="Golden Goose" />
      </header>

      <div className="lg-page">
        <div className="lg-crumb">Home / <b>Accesso Repository</b></div>
        <h1 className="lg-title">Accedi alla <em>Repository</em></h1>
        <p className="lg-sub">
          Accesso sicuro alla repository Customer Journey, alla libreria template,
          all&apos;area di gestione asset e al workspace di marketing operations.
        </p>

        <div className="lg-grid">
          <div className="lg-card">
            <div className="lg-card-title">Autenticazione</div>
            <p className="lg-card-desc">Inserisci le tue credenziali per accedere alla repository.</p>

            <form onSubmit={onSubmit}>
              <div className="lg-field">
                <label className="lg-label" htmlFor="email">Email</label>
                <input className="lg-input" id="email" type="email" value={email} autoComplete="username"
                  placeholder="Inserisci email" onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="lg-field">
                <label className="lg-label" htmlFor="password">Password</label>
                <input className="lg-input" id="password" type={show ? 'text' : 'password'} value={password}
                  autoComplete="current-password" placeholder="Inserisci password"
                  onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="lg-eye" onClick={() => setShow((s) => !s)} aria-label="Mostra/nascondi password">
                  {show ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>

              <button className="lg-btn" type="submit" disabled={loading}>
                {loading ? 'Accesso in corso…' : 'Accedi'}
              </button>
            </form>

            {error && <div className="lg-msg">{error}</div>}

            <div className="lg-foot">
              Accesso consentito solo agli utenti <strong>registrati</strong>.
            </div>
          </div>

          <div className="lg-card" style={{ padding: 0 }}>
            <div className="lg-gold">
              <div className="lg-gold-top">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" /></svg>
                Accesso protetto
              </div>
              <div className="lg-gold-body">
                L&apos;accesso è gestito da Supabase Auth: password con hashing sicuro,
                rate limiting e sessione via cookie HttpOnly. Nessuna credenziale in chiaro.
              </div>
              <div className="lg-status"><span className="lg-dot" />Canale sicuro attivo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
