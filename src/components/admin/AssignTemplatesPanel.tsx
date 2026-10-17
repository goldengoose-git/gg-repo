'use client';

// Collega template a un journey (Admin). Imposta templates.journey_name via
// POST /api/templates/assign. Lista "collegati" (Rimuovi) + ricerca per aggiungere.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JourneyVM, TemplateVM } from '@/lib/mappers';

export default function AssignTemplatesPanel({
  journeys, templates,
}: {
  journeys: JourneyVM[];
  templates: TemplateVM[];
}) {
  const router = useRouter();
  const journeyNames = useMemo(
    () => journeys.map((j) => j.name).sort((a, b) => a.localeCompare(b)),
    [journeys],
  );
  const [journeyName, setJourneyName] = useState<string>(journeyNames[0] ?? '');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const linked = useMemo(
    () => templates.filter((t) => t.journeyName === journeyName),
    [templates, journeyName],
  );
  const available = useMemo(() => {
    const term = q.trim().toLowerCase();
    return templates
      .filter((t) => t.journeyName !== journeyName)
      .filter((t) => !term || t.name.toLowerCase().includes(term) || (t.deliveryCode || '').toLowerCase().includes(term))
      .slice(0, 50);
  }, [templates, journeyName, q]);

  async function assign(t: TemplateVM, toJourney: string) {
    setBusyId(t.id);
    setErr(null);
    try {
      const res = await fetch('/api/templates/assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateId: t.id, journeyName: toJourney }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErr(json?.message ?? `Errore ${res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore di rete.');
    } finally {
      setBusyId(null);
    }
  }

  if (journeyNames.length === 0) {
    return (
      <div className="adm-card">
        <h2>Collega template</h2>
        <p className="adm-sub">Nessun journey. Creane uno prima, nel tab Journey.</p>
      </div>
    );
  }

  return (
    <div className="adm-card">
      <h2>Collega template a un journey</h2>
      <p className="adm-sub">Imposta il <code>journey_name</code> dei template. Aggiungi o rimuovi dal journey selezionato (spostando anche da un altro journey).</p>

      <div className="adm-field" style={{ maxWidth: 360 }}>
        <label htmlFor="asg-j">Journey</label>
        <select id="asg-j" value={journeyName} onChange={(e) => setJourneyName(e.target.value)}>
          {journeyNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {err && <div className="adm-msg err" role="alert">{err}</div>}

      <h3 style={{ margin: '22px 0 6px', fontSize: 15 }}>Collegati ({linked.length})</h3>
      <div className="adm-list">
        {linked.length === 0 && <div className="adm-sub">Nessun template collegato a questo journey.</div>}
        {linked.map((t) => (
          <div className="adm-row" key={t.id}>
            <div className="adm-row-main">
              <span className="adm-row-name">{t.name}</span>
              <span className="adm-row-id">{t.deliveryCode || '—'}</span>
            </div>
            <button type="button" className="adm-btn adm-btn-danger" disabled={busyId === t.id} onClick={() => assign(t, '')}>
              {busyId === t.id ? '…' : 'Rimuovi'}
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '22px 0 6px', fontSize: 15 }}>Aggiungi template</h3>
      <div className="adm-field" style={{ marginBottom: 10 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o delivery code…" />
      </div>
      <div className="adm-list">
        {available.length === 0 && <div className="adm-sub">Nessun template trovato.</div>}
        {available.map((t) => (
          <div className="adm-row" key={t.id}>
            <div className="adm-row-main">
              <span className="adm-row-name">{t.name}</span>
              <span className="adm-row-id">
                {t.deliveryCode || '—'} · {t.journeyName ? `ora: ${t.journeyName}` : 'non collegato'}
              </span>
            </div>
            <button type="button" className="adm-btn adm-btn-primary" disabled={busyId === t.id} onClick={() => assign(t, journeyName)}>
              {busyId === t.id ? '…' : 'Aggiungi'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
