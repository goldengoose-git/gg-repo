'use client';

// Guscio dell'area Admin (solo ruolo admin).
//   Journey:          crea + elimina
//   Nuovo Template:   crea
//   Collega template: assegna i template ai journey (journey_name)
//   Asset:            prossimamente
import { useState } from 'react';
import type { JourneyVM, TemplateVM } from '@/lib/mappers';
import { ADMIN_CSS } from './admin-styles';
import NewJourneyForm from './NewJourneyForm';
import JourneyAdminList from './JourneyAdminList';
import NewTemplateForm from './NewTemplateForm';
import AssignTemplatesPanel from './AssignTemplatesPanel';

type AdminTab = 'journey' | 'template' | 'assign' | 'asset';

export default function AdminApp({
  journeys, templates,
}: {
  journeys: JourneyVM[];
  templates: TemplateVM[];
}) {
  const [tab, setTab] = useState<AdminTab>('journey');
  const existingIds = journeys.map((j) => j.id);

  return (
    <div className="container">
      <style>{ADMIN_CSS}</style>
      <div className="adm-root">
        <div className="adm-tabs">
          <button className={`adm-tab${tab === 'journey' ? ' active' : ''}`} onClick={() => setTab('journey')}>Journey</button>
          <button className={`adm-tab${tab === 'template' ? ' active' : ''}`} onClick={() => setTab('template')}>Nuovo Template</button>
          <button className={`adm-tab${tab === 'assign' ? ' active' : ''}`} onClick={() => setTab('assign')}>Collega template</button>
          <button className="adm-tab" disabled title="Prossimamente">Asset</button>
        </div>

        {tab === 'journey' && (
          <>
            <NewJourneyForm existingIds={existingIds} />
            <JourneyAdminList journeys={journeys} templates={templates} />
          </>
        )}

        {tab === 'template' && (
          <NewTemplateForm journeys={journeys} templates={templates} />
        )}

        {tab === 'assign' && (
          <AssignTemplatesPanel journeys={journeys} templates={templates} />
        )}
      </div>
    </div>
  );
}
