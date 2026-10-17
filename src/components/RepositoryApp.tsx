'use client';

// Guscio client: header (con le toggle di vista) + Dashboard / Map / Templates / Admin.
// Trasporta lo stato (filtro KPI / journey selezionato) tra le viste.
import { useState } from 'react';
import type { TemplateVM, JourneyVM } from '@/lib/mappers';
import type { AppRole } from '@/lib/types';
import Header, { type HeaderView } from './Header';
import Dashboard, { type DashFilter } from './Dashboard';
import TemplateList from './TemplateList';
import MapView from './MapView';
import AdminApp from './admin/AdminApp';

export default function RepositoryApp({
  templates, journeys, role = null, username = 'User',
}: {
  templates: TemplateVM[];
  journeys: JourneyVM[];
  role?: AppRole | null;
  username?: string;
}) {
  const [view, setView] = useState<HeaderView>('dashboard');
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

  // Le toggle dell'header: cambiano vista azzerando i filtri contestuali.
  function switchView(v: HeaderView) {
    if (v === 'templates') { setJourneyName(null); setInitialFilter('all'); }
    setView(v);
  }

  return (
    <>
      <Header
        username={username}
        role={(role ?? 'user') as AppRole}
        view={view}
        onSwitch={switchView}
        isAdmin={isAdmin}
      />

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
