'use client';

import { useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import type { AppRole } from '@/lib/types';
import Dashboard, { type DashFilter } from './Dashboard';
import TemplateList from './TemplateList';
import MapView from './MapView';

type View = 'dashboard' | 'map' | 'templates';

export default function RepositoryApp({
  templates, journeys, role = null,
}: {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  role?: AppRole | null;
}) {
  const [view, setView] = useState<View>('dashboard');
  const [initialFilter, setInitialFilter] = useState<DashFilter>('all');
  const [journeyName, setJourneyName] = useState<string | null>(null);

  function goToTemplatesWithFilter(f: DashFilter) {
    setInitialFilter(f);
    setJourneyName(null);
    setView('templates');
  }

  function openJourney(id: string) {
    const j = journeys.find((x) => x.id === id);
    setJourneyName(j ? j.name : null);
    setInitialFilter('all');
    setView('templates');
  }

  function openTemplatesByName(name: string) {
    setJourneyName(name);
    setInitialFilter('all');
    setView('templates');
  }

  return (
    <>
      <div className="view-tabs container">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
        <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map</button>
        <button className={view === 'templates' ? 'active' : ''} onClick={() => { setJourneyName(null); setInitialFilter('all'); setView('templates'); }}>Templates</button>
      </div>

      {view === 'dashboard' && (
        <Dashboard
          templates={templates}
          journeys={journeys}
          onKpi={goToTemplatesWithFilter}
          onOpenJourney={openJourney}
        />
      )}
      {view === 'map' && (
        <MapView
          templates={templates}
          journeys={journeys}
          onOpenTemplates={openTemplatesByName}
          role={role}
        />
      )}
      {view === 'templates' && (
        <TemplateList
          templates={templates}
          initialFilter={initialFilter}
          journeyName={journeyName}
        />
      )}
    </>
  );
}
