'use client';

// Map view (ex buildL1 / openL2 di 03-jsviews.js). Griglia journey (L1);
// aprendone uno si vede il Flow Viewer + note + template collegati (L2).
// FASE 1 del Flow: sola lettura.
import { useMemo, useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import FlowViewer from './FlowViewer';

export default function MapView({
  templates, journeys, onOpenTemplates,
}: {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  onOpenTemplates: (journeyName: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const journey = openId ? journeys.find((j) => j.id === openId) : null;

  const linkedTemplates = useMemo(() => {
    if (!journey) return [];
    return templates.filter((t) => t.journeyName === journey.name);
  }, [journey, templates]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    templates.forEach((t) => { map[t.journeyName] = (map[t.journeyName] || 0) + 1; });
    return map;
  }, [templates]);

  // L2 — dettaglio journey con flow
  if (journey) {
    return (
      <div className="container map-l2">
        <div className="map-l2-bar">
          <button className="jc-btn" onClick={() => setOpenId(null)}>← All Journeys</button>
          <div className="map-l2-info">
            <div className="map-l2-name">{journey.name}</div>
            <div className="map-l2-desc">{journey.description}</div>
          </div>
          {journey.miroBoardLink && journey.miroBoardLink !== '#' && (
            <a className="jc-btn" href={journey.miroBoardLink} target="_blank" rel="noopener noreferrer">Miro ↗</a>
          )}
        </div>

        <div className="flow-panel">
          <div className="flow-panel-title">Journey <em>Flow View</em></div>
          <FlowViewer nodes={journey.flow.nodes} />

          {journey.notes && (
            <div className="flow-notes-block">
              <div className="flow-panel-title small">Journey <em>Notes</em></div>
              <div className="flow-notes">{journey.notes}</div>
            </div>
          )}

          <div className="flow-linked">
            <div className="flow-panel-title small">Journey <em>Templates</em></div>
            {linkedTemplates.length === 0 ? (
              <div className="muted">Nessun template collegato.</div>
            ) : (
              linkedTemplates.map((t) => (
                <button key={t.id} className="flow-tpl-link" onClick={() => onOpenTemplates(journey.name)}>
                  <span className="flow-tpl-name">{t.name}</span>
                  <span className="flow-tpl-code">{t.deliveryCode || '-'}</span>
                  <span className="flow-tpl-meta">Open List →</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // L1 — griglia journey
  return (
    <div className="container map-l1">
      <div className="dash-section-head"><h2>Customer <em>Journey Map</em></h2></div>
      <div className="journey-grid">
        {journeys.map((j) => (
          <div key={j.id} className="journey-card" onClick={() => setOpenId(j.id)}>
            <div className="journey-card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={j.img || ''} alt={j.name} loading="lazy" />
              <div className="journey-card-overlay">
                <span className="journey-card-name">{j.name}</span>
                <span className="journey-card-count">{counts[j.name] || 0} template</span>
              </div>
            </div>
            <div className="journey-card-body">
              <p className="journey-card-desc">{j.description || '—'}</p>
              <button className="jc-btn primary" onClick={(e) => { e.stopPropagation(); setOpenId(j.id); }}>
                Flow View →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
