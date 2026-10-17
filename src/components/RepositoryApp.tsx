'use client';

// Guscio client che commuta tra Dashboard, Map, Templates e (solo admin) Admin,
// e trasporta lo stato (filtro KPI / journey selezionato) tra le viste.
import { useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import type { AppRole } from '@/lib/types';
import Dashboard, { type DashFilter } from './Dashboard';
import TemplateList from './TemplateList';
import MapView from './MapView';
import AdminApp from './admin/AdminApp';

type View = 'dashboard' | 'map' | 'templates' | 'admin';

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

  const isAdmin = role === 'admin';

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
        {isAdmin && (
          <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Admin</button>
        )}
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
      {view === 'admin' && isAdmin && (
        <AdminApp templates={templates} journeys={journeys} />
      )}
    </>
  );
}
