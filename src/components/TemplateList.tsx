'use client';

// Porting della List View (render() in 03-jsviews.js) in React.
// Stessa logica di filtri/ricerca/KPI, ma dichiarativa. I dati arrivano
// già dal server (SSR via Supabase) invece che da DATA_RAW_STRING iniettato.
import { useMemo, useState } from 'react';
import type { TemplateVM } from '@/lib/mappers';
import { isTemplateExpired, isTemplateRecentlyUpdated } from '@/lib/mms-config';
import TemplateDetail from './TemplateDetail';

type FilterKey = 'all' | 'active' | 'stopped' | 'expired' | 'cdp' | 'mms' | 'wallet';

export default function TemplateList({
  templates,
  initialFilter = 'all',
  journeyName = null,
}: {
  templates: TemplateVM[];
  initialFilter?: FilterKey;
  journeyName?: string | null;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  // filtro per journey arrivato dalla dashboard (clearabile dall'utente)
  const [cjFilter, setCjFilter] = useState<string | null>(journeyName);

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

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return templates.filter((t) => {
      // filtro per journey (dalla dashboard)
      if (cjFilter && t.journeyName !== cjFilter) return false;
      // filtro
      let pass = true;
      if (filter === 'active') pass = t.stopped !== 'Yes';
      else if (filter === 'stopped') pass = t.stopped === 'Yes';
      else if (filter === 'expired') pass = isTemplateExpired(t.lastUpdate);
      else if (filter === 'cdp') pass = t.cdp === 'Yes';
      else if (filter === 'mms') pass = t.mms === 'Yes';
      else if (filter === 'wallet') pass = t.wallet === 'Yes';
      if (!pass) return false;
      // ricerca
      if (!q) return true;
      return [t.name, t.deliveryCode, t.journeyName, t.subjectLine]
        .join(' ').toLowerCase().includes(q);
    });
  }, [templates, query, filter, cjFilter]);

  const Kpi = ({ k, label, value }: { k: FilterKey; label: string; value: number }) => (
    <button
      className="kpi"
      style={{ cursor: 'pointer', borderColor: filter === k ? 'var(--accent)' : 'var(--border)' }}
      onClick={() => setFilter(filter === k && k !== 'all' ? 'all' : k)}
    >
      <span className="num">{value}</span>
      <span className="label">{label}</span>
    </button>
  );

  return (
    <div className="container">
      <div className="kpi-bar">
        <Kpi k="all" label="Total" value={stats.total} />
        <Kpi k="active" label="Active" value={stats.active} />
        <Kpi k="stopped" label="Stopped" value={stats.stopped} />
        <Kpi k="expired" label="Expired" value={stats.expired} />
        <Kpi k="cdp" label="CDP" value={stats.cdp} />
        <Kpi k="mms" label="MMS" value={stats.mms} />
        <Kpi k="wallet" label="Wallet" value={stats.wallet} />
      </div>

      {cjFilter && (
        <div className="cj-filter-banner">
          <span>Filtrato per journey: <strong>{cjFilter}</strong></span>
          <button onClick={() => setCjFilter(null)}>× Rimuovi filtro</button>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Cerca per nome, delivery code, journey…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span style={{ fontSize: '.72rem', color: 'var(--text-sub)' }}>
          {visible.length} template{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="empty">Nessun template per questo filtro.</div>
      ) : (
        <div className="templates">
          {visible.map((t) => (
            <TemplateRow key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ t }: { t: TemplateVM }) {
  const [open, setOpen] = useState(false);
  const expired = isTemplateExpired(t.lastUpdate);
  const updated = isTemplateRecentlyUpdated(t.lastUpdate);
  return (
    <div className={`tpl-row${open ? ' open' : ''}`}>
      <div className="tpl-row-head" onClick={() => setOpen((o) => !o)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pills">
            <span className={`pill ${t.stopped === 'Yes' ? 'stopped' : 'black'}`}>{t.status}</span>
            <span className={`pill ${t.cdp === 'Yes' ? 'gold' : 'silver'}`}>CDP: {t.cdp}</span>
            <span className={`pill ${t.mms === 'Yes' ? 'gold' : 'silver'}`}>MMS: {t.mms}</span>
            <span className={`pill ${t.wallet === 'Yes' ? 'gold' : 'silver'}`}>Wallet: {t.wallet}</span>
            {expired && <span className="badge expired">EXPIRED</span>}
            {updated && <span className="badge updated">UPDATED</span>}
            {t.mmsSmsItemsCount > 0 && (
              <span className="badge updated">MMS/SMS · {t.mmsSmsItemsCount}</span>
            )}
          </div>
          <h3>{t.name}</h3>
          <code>{t.deliveryCode || '-'}</code>
          {t.subjectLine && <span className="subject"><strong>Subject:</strong> {t.subjectLine}</span>}
        </div>
        <div className="tpl-row-toggle">{open ? 'Chiudi −' : 'Dettagli +'}</div>
      </div>
      {open && <TemplateDetail t={t} />}
    </div>
  );
}
