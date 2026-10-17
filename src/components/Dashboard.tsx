'use client';

// Dashboard (ex buildDashboard / renderHomeHub di 03-jsviews.js).
// KPI grandi, griglia journey, sezione expired. Sola lettura.
// I KPI cliccabili passano alla vista Templates con un filtro applicato.
import { useMemo } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import { isTemplateExpired } from '@/lib/mms-config';
import CjTimeline from './CjTimeline';
import CjSidebar from './CjSidebar';

export type DashFilter =
  | 'all' | 'active' | 'stopped' | 'expired' | 'cdp' | 'mms' | 'wallet';

interface Props {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  onKpi: (f: DashFilter) => void;      // clic su un KPI -> vai ai template filtrati
  onOpenJourney: (id: string) => void; // clic su un journey -> template di quel CJ
}

export default function Dashboard({ templates, journeys, onKpi, onOpenJourney }: Props) {
  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t) => t.stopped !== 'Yes').length;
    return {
      total,
      active,
      stopped: total - active,
      expired: templates.filter((t) => isTemplateExpired(t.lastUpdate)).length,
      cdp: templates.filter((t) => t.cdp === 'Yes').length,
      mms: templates.filter((t) => t.mms === 'Yes').length,
      wallet: templates.filter((t) => t.wallet === 'Yes').length,
    };
  }, [templates]);

  // conteggio template per journey (match su journeyName, come l'originale)
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

  const expiredTpls = useMemo(
    () => templates.filter((t) => isTemplateExpired(t.lastUpdate)),
    [templates]
  );

  return (
    <div className="container dash">
      {/* KPI */}
      <div className="dash-kpi-bar">
        <DashKpi label="Total Templates" value={stats.total} tone="blue" onClick={() => onKpi('all')} />
        <DashKpi label="Active" value={stats.active} tone="green" onClick={() => onKpi('active')} />
        <DashKpi label="Stopped" value={stats.stopped} tone="red" onClick={() => onKpi('stopped')} />
        <DashKpi label="Expired" value={stats.expired} tone="gold" onClick={() => onKpi('expired')} />
        <DashKpi label="CDP" value={stats.cdp} tone="purple" onClick={() => onKpi('cdp')} />
        <DashKpi label="MMS" value={stats.mms} tone="teal" onClick={() => onKpi('mms')} />
        <DashKpi label="Wallet" value={stats.wallet} tone="orange" onClick={() => onKpi('wallet')} />
      </div>

      {/* Expired alerts */}
      {expiredTpls.length > 0 && (
        <div className="dash-expired">
          <div className="dash-expired-head">
            <strong>{expiredTpls.length} template{expiredTpls.length !== 1 ? 's' : ''} expired</strong>
          </div>
          <div className="dash-expired-list">
            {expiredTpls.map((t) => (
              <button key={t.id} className="dash-exp-row" onClick={() => onKpi('expired')}>
                <span className="dash-exp-name">{t.name}</span>
                <span className="dash-exp-code">{t.journeyName || '—'} · {t.deliveryCode || '-'}</span>
                <span className="dash-exp-tag">EXPIRED</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Journey grid */}
      <div className="dash-section-head">
        <h2>Journey <em>Overview</em></h2>
        <span className="count-pill">{journeys.length} journey{journeys.length !== 1 ? 's' : ''}</span>
      </div>

      {journeys.length === 0 ? (
        <div className="empty">Nessun journey. Esegui la migrazione dei journey.</div>
      ) : (
        <div className="journey-grid">
          {journeys.map((j) => {
            const c = byJourney[j.id] || { total: 0, active: 0, expired: false };
            const statusColor = c.active === c.total ? '#4caf50' : c.active === 0 ? '#f44336' : '#ff9800';
            return (
              <div key={j.id} className="journey-card" onClick={() => onOpenJourney(j.id)}>
                <div className="journey-card-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.img || ''} alt={j.name} loading="lazy" />
                  <div className="journey-card-overlay">
                    <span className="journey-card-name">{j.name}</span>
                    <span className="journey-card-count">
                      {c.total} tpl · <span style={{ color: statusColor }}>{c.active} active</span>
                    </span>
                  </div>
                  {c.expired && <span className="journey-card-exp">⚠ expired</span>}
                </div>
                <div className="journey-card-body">
                  <p className="journey-card-desc">{j.description || '—'}</p>
                  {j.tags.length > 0 && (
                    <div className="journey-card-tags">
                      {j.tags.map((tag, i) => <span key={i} className="chip">{tag}</span>)}
                    </div>
                  )}
                  <div className="journey-card-actions" onClick={(e) => e.stopPropagation()}>
                    {j.miroBoardLink && j.miroBoardLink !== '#' && (
                      <a className="jc-btn" href={j.miroBoardLink} target="_blank" rel="noopener noreferrer">Miro</a>
                    )}
                    <button className="jc-btn primary" onClick={() => onOpenJourney(j.id)}>Templates →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline + sidebar journey (ex home-main-split dell'originale) */}
      <div className="dash-split">
        <div className="dash-split-main">
          <div className="dash-section-head"><h2>Journey <em>Timeline</em></h2></div>
          <CjTimeline />
        </div>
        <CjSidebar templates={templates} journeys={journeys} onOpenJourney={onOpenJourney} />
      </div>
    </div>
  );
}

function DashKpi({
  label, value, tone, onClick,
}: { label: string; value: number; tone: string; onClick: () => void }) {
  return (
    <button className={`dash-kpi tone-${tone}`} onClick={onClick}>
      <span className="dash-kpi-num">{value}</span>
      <span className="dash-kpi-label">{label}</span>
    </button>
  );
}
