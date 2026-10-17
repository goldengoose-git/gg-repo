'use client';

// Guscio client che commuta tra Dashboard e Templates e trasporta lo stato
// (filtro KPI / journey selezionato) tra le due viste. Ex switchView() + i
// vari goToJourneyFromHome/openTemplateListFromHome dell'originale.
import { useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import Dashboard, { type DashFilter } from './Dashboard';
import TemplateList from './TemplateList';

type View = 'dashboard' | 'templates';

export default function RepositoryApp({
  templates, journeys,
}: { templates: TemplateVM[]; journeys: JourneyVM[] }) {
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

  return (
    <>
      <div className="view-tabs container">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
        <button className={view === 'templates' ? 'active' : ''} onClick={() => { setJourneyName(null); setInitialFilter('all'); setView('templates'); }}>Templates</button>
      </div>

      {view === 'dashboard' ? (
        <Dashboard
          templates={templates}
          journeys={journeys}
          onKpi={goToTemplatesWithFilter}
          onOpenJourney={openJourney}
        />
      ) : (
        <TemplateList
          templates={templates}
          initialFilter={initialFilter}
          journeyName={journeyName}
        />
      )}
    </>
  );
}
