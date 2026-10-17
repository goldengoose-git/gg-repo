'use client';

// Guscio dell'area Admin (solo ruolo admin). Tab Journey: crea + elimina.
// Template e Asset arriveranno come tab successivi.
import { useState } from 'react';
import type { JourneyVM, TemplateVM } from '@/lib/mappers';
import { ADMIN_CSS } from './admin-styles';
import NewJourneyForm from './NewJourneyForm';
import JourneyAdminList from './JourneyAdminList';

type AdminTab = 'journey' | 'template' | 'asset';

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
          <button className="adm-tab" disabled title="Prossimamente">Nuovo Template</button>
          <button className="adm-tab" disabled title="Prossimamente">Asset</button>
        </div>

        {tab === 'journey' && (
          <>
            <NewJourneyForm existingIds={existingIds} />
            <JourneyAdminList journeys={journeys} templates={templates} />
          </>
        )}
      </div>
    </div>
  );
}
