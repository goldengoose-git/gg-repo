'use client';

// Sidebar Customer Journeys (ex renderHomeCjSidebar di 03-jsviews.js).
// Lista scura filtrabile dei journey, con dot di stato e tag. Generata dai
// dati reali del DB. Click -> apre i template di quel journey.
import { useMemo, useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import { isTemplateExpired } from '@/lib/mms-config';

export default function CjSidebar({
  templates, journeys, onOpenJourney,
}: {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  onOpenJourney: (id: string) => void;
}) {
  const [filter, setFilter] = useState('');

  const counts = useMemo(() => {
    const nameToId: Record<string, string> = {};
    journeys.forEach((j) => { nameToId[j.name] = j.id; });
    const map: Record<string, { total: number; active: number; expired: boolean }> = {};
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

  const visible = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return journeys;
    return journeys.filter((j) =>
      (j.name + ' ' + j.description + ' ' + j.tags.join(' ')).toLowerCase().includes(q)
    );
  }, [journeys, filter]);

  return (
    <aside className="cj-sidebar">
      <div className="cj-sidebar-head">
        <span className="cj-sidebar-title">Customer Journeys</span>
        <span className="cj-sidebar-count">{visible.length}</span>
      </div>
      <div className="cj-sidebar-search">
        <input
          placeholder="Filter journeys"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="cj-sidebar-list">
        {visible.map((j) => {
          const c = counts[j.id] || { total: 0, active: 0, expired: false };
          const dot = c.active === c.total ? '#4caf50' : c.active === 0 ? '#f44336' : '#ff9800';
          return (
            <button key={j.id} className="cj-sl-item" onClick={() => onOpenJourney(j.id)}>
              <span className="cj-sl-dot" style={{ background: dot }} />
              <span className="cj-sl-body">
                <span className="cj-sl-name">
                  {j.name}
                  {c.expired && <span className="cj-sl-exp">⚠ expired</span>}
                </span>
                <span className="cj-sl-meta">
                  <span className="cj-sl-count">{c.total} tpl · {c.active} active</span>
                  {j.tags.slice(0, 2).map((tg, i) => <span key={i} className="cj-sl-tag">{tg}</span>)}
                </span>
              </span>
              <span className="cj-sl-arrow">›</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
