'use client';

// Dashboard / Home fedele all'originale SFMC (ggdb_cj_library #dashboardView):
// hero scuro, barra KPI a pillola, sezione expired, Journey Overview (griglia/lista),
// e home-main-split (frame presentazione + sidebar Customer Journeys scura).
import { useEffect, useMemo, useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import { isTemplateExpired } from '@/lib/mms-config';
import CjTimeline from './CjTimeline';

export type DashFilter =
  | 'all' | 'active' | 'stopped' | 'expired' | 'cdp' | 'mms' | 'wallet';

interface Props {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  onKpi: (f: DashFilter) => void;
  onOpenJourney: (id: string) => void;
}

const KPI_ICON: Record<string, React.ReactNode> = {
  total: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>,
  active: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  stopped: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  expired: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  cdp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  mms: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
};

export default function Dashboard({ templates, journeys, onKpi, onOpenJourney }: Props) {
  const [q, setQ] = useState('');
  const [listMode, setListMode] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [expiredOpen, setExpiredOpen] = useState(true);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t) => t.stopped !== 'Yes').length;
    return {
      total, active, stopped: total - active,
      expired: templates.filter((t) => isTemplateExpired(t.lastUpdate)).length,
      cdp: templates.filter((t) => t.cdp === 'Yes').length,
      mms: templates.filter((t) => t.mms === 'Yes').length,
      wallet: templates.filter((t) => t.wallet === 'Yes').length,
    };
  }, [templates]);

  const byJourney = useMemo(() => {
    const map: Record<string, { total: number; active: number; expired: boolean }> = {};
    const nameToId: Record<string, string> = {};
    journeys.forEach((j) => { nameToId[j.name] = j.id; });
    templates.forEach((t) => {
      const jid = nameToId[t.journeyName];
      if (!jid) return;
      if (!map[jid]) map[jid] = { total: 0, active: 0, expired: false };
      map[jid].total += 1;
      if (t.stopped !== 'Yes') map[jid].active += 1;
      if (isTemplateExpired(t.lastUpdate)) map[jid].expired = true;
    });
    return map;
  }, [templates, journeys]);

  const expiredTpls = useMemo(() => templates.filter((t) => isTemplateExpired(t.lastUpdate)), [templates]);

  const visibleJourneys = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return journeys;
    return journeys.filter((j) => j.name.toLowerCase().includes(term) || (j.description || '').toLowerCase().includes(term));
  }, [journeys, q]);

  const KPIS: { key: DashFilter; icon: keyof typeof KPI_ICON; num: number; label: string }[] = [
    { key: 'all', icon: 'total', num: stats.total, label: 'Total Templates' },
    { key: 'active', icon: 'active', num: stats.active, label: 'Active' },
    { key: 'stopped', icon: 'stopped', num: stats.stopped, label: 'Stopped' },
    { key: 'expired', icon: 'expired', num: stats.expired, label: 'Expired' },
    { key: 'cdp', icon: 'cdp', num: stats.cdp, label: 'CDP' },
    { key: 'mms', icon: 'mms', num: stats.mms, label: 'MMS' },
    { key: 'wallet', icon: 'wallet', num: stats.wallet, label: 'Wallet' },
  ];

  return (
    <div id="dashboardView" style={{ display: 'block' }}>
      {/* HERO */}
      <div className="home-hero-strip">
        <div className="home-hero-strip-bg" />
        <div className="home-hero-strip-content">
          <div className="home-hero-left">
            <div className="home-hero-kicker"><span className="home-hero-kicker-dot" />SFMC Repository • Live Dashboard</div>
            <h1 className="home-hero-headline">Customer Journey <em>Library</em></h1>
            <p className="home-hero-sub">PwC • Golden Goose • Unified Marketing Cloud Asset &amp; Journey Management</p>
          </div>
          <div className="home-hero-right">
            <div className="home-hero-date">{dateStr}</div>
            <div className="home-hero-version">V2.199</div>
          </div>
        </div>
      </div>

      {/* KPI BAR */}
      <div className="home-kpi-bar">
        {KPIS.map((k) => (
          <button key={k.key} type="button" className="home-kpi-card" onClick={() => onKpi(k.key)}>
            <div className={`home-kpi-icon ${k.icon}`}>{KPI_ICON[k.icon]}</div>
            <div className="home-kpi-data">
              <span className="home-kpi-num">{k.num}</span>
              <span className="home-kpi-label">{k.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* EXPIRED */}
      {expiredTpls.length > 0 && expiredOpen && (
        <div className="home-expired-section" style={{ display: 'block', padding: '0 24px', marginTop: 18 }}>
          <div className="home-expired-header">
            <div className="home-expired-header-left">
              <div className="home-expired-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div>
                <div className="home-expired-title">Expired Templates</div>
                <div className="home-expired-sub">{expiredTpls.length} template{expiredTpls.length !== 1 ? 's' : ''} require attention</div>
              </div>
            </div>
            <button className="home-expired-dismiss" onClick={() => setExpiredOpen(false)}>Dismiss</button>
          </div>
          <div className="home-expired-grid">
            {expiredTpls.slice(0, 12).map((t) => (
              <button key={t.id} className="home-hub-list-btn" style={{ justifyContent: 'space-between' }} onClick={() => onKpi('expired')}>
                {t.name} · {t.journeyName || '—'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* JOURNEY OVERVIEW */}
      <div className="home-journeys-section">
        <div className="home-journeys-header">
          <div className="home-journeys-header-left">
            <h2 className="home-journeys-title">Journey <em>Overview</em></h2>
            <span className="home-journeys-count">{journeys.length} journeys</span>
          </div>
          <div className="home-journeys-header-right">
            <div className="home-journeys-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input className="home-journeys-search-input" placeholder="Search journeys" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="home-journeys-view-toggle">
              <button className={`home-view-btn${!listMode ? ' active' : ''}`} onClick={() => setListMode(false)} title="Grid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              </button>
              <button className={`home-view-btn${listMode ? ' active' : ''}`} onClick={() => setListMode(true)} title="List">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`home-hub-grid${listMode ? ' list-mode' : ''}`}>
          {visibleJourneys.map((j) => {
            const c = byJourney[j.id] || { total: 0, active: 0, expired: false };
            const activeColor = c.total > 0 && c.active === c.total ? 'var(--green)' : c.active === 0 ? 'var(--red)' : '#e08a2a';
            const hasPpt = !!j.pptLink && j.pptLink !== '#';
            return (
              <div key={j.id} className="home-hub-card" onClick={() => onOpenJourney(j.id)}>
                <div className="home-hub-card-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.img || ''} alt={j.name} loading="lazy" />
                  <div className="home-hub-card-overlay">
                    <span className="home-hub-card-overlay-name">{j.name}</span>
                    <span className="home-hub-card-tpl-count">
                      {c.total} TPL · <span style={{ color: activeColor }}>{c.active} ACTIVE</span>
                    </span>
                  </div>
                </div>
                <div className="home-hub-card-body">
                  <div className="home-hub-card-desc">{j.description || '—'}</div>
                  <div className="home-hub-card-actions" onClick={(e) => e.stopPropagation()}>
                    {hasPpt ? (
                      <a className="home-hub-ppt-btn" href={j.pptLink} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>PPT
                      </a>
                    ) : (
                      <span className="home-hub-ppt-btn disabled">PPT N/A</span>
                    )}
                    <button className="home-hub-flow-btn" onClick={() => onOpenJourney(j.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4" /><path d="M12 11l-7 6" /><path d="M12 11l7 6" /></svg>FLOW
                    </button>
                    <button className="home-hub-list-btn" onClick={() => onOpenJourney(j.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>LIST
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {visibleJourneys.length === 0 && <div className="home-hub-empty">Nessun journey.</div>}
        </div>
      </div>

      {/* MAIN SPLIT: presentazione + sidebar CJ */}
      <div className="home-main-split">
        <div className="home-main-left">
          <div className="home-ppt-section">
            <div className="home-ppt-header">
              <div className="home-ppt-header-left">
                <div className="home-ppt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
                <div><div className="home-ppt-label">Presentation</div><div className="home-ppt-title">Marketing Cloud • CJ Library</div></div>
              </div>
            </div>
            <div className="home-ppt-frame">
              <div className="home-ppt-frame-bar">
                <div className="home-ppt-dots"><span className="dot red" /><span className="dot yellow" /><span className="dot green" /></div>
                <span className="home-ppt-frame-url">Customer Journey Timeline</span>
              </div>
              <div style={{ background: '#f5f0e8', overflow: 'auto', maxHeight: 620 }}>
                <CjTimeline />
              </div>
            </div>
          </div>
        </div>

        <div className="home-cj-sidebar">
          <div className="home-cj-sidebar-header">
            <div className="home-cj-sidebar-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4" /><path d="M12 11l-7 6" /><path d="M12 11l7 6" /></svg>Customer Journeys
            </div>
            <span className="home-cj-sidebar-count">{journeys.length}</span>
          </div>
          <div className="home-cj-sidebar-list cj-sidebar-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {journeys.map((j) => {
              const c = byJourney[j.id] || { total: 0, active: 0, expired: false };
              const dot = c.total > 0 && c.active === c.total ? 'var(--green)' : c.active === 0 ? '#888' : '#e08a2a';
              return (
                <div key={j.id} className="cj-sl-item" onClick={() => onOpenJourney(j.id)}>
                  <span className="cj-sl-dot" style={{ background: dot }} />
                  <div className="cj-sl-body">
                    <div className="cj-sl-name">{j.name}</div>
                    <div className="cj-sl-meta">
                      <span className="cj-sl-count">{c.total} tpl • {c.active} active</span>
                      {j.tags.slice(0, 2).map((t, i) => <span key={i} className="cj-sl-tag">{t}</span>)}
                    </div>
                  </div>
                  <span className="cj-sl-arrow">›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
