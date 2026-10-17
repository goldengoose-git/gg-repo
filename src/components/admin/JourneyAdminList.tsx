'use client';

// Lista dei journey esistenti con eliminazione (solo admin, via DELETE /api/journeys?id=).
// Mostra quanti template sono collegati per nome e avvisa prima di cancellare.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JourneyVM, TemplateVM } from '@/lib/mappers';

export default function JourneyAdminList({
  journeys, templates,
}: {
  journeys: JourneyVM[];
  templates: TemplateVM[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    templates.forEach((t) => { m[t.journeyName] = (m[t.journeyName] || 0) + 1; });
    return m;
  }, [templates]);

  async function del(j: JourneyVM) {
    const n = counts[j.name] || 0;
    const msg = n > 0
      ? `Eliminare il journey "${j.name}"? Resteranno a DB ${n} template con questo journey, ma senza journey collegato.`
      : `Eliminare il journey "${j.name}"? L'operazione e' definitiva.`;
    if (!window.confirm(msg)) return;

    setBusyId(j.id);
    setErr(null);
    try {
      const res = await fetch(`/api/journeys?id=${encodeURIComponent(j.id)}`, { method: 'DELETE' });
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

  return (
    <div className="adm-card" style={{ marginTop: 20 }}>
      <h2>Journey esistenti</h2>
      <p className="adm-sub">{journeys.length} journey. L&apos;eliminazione &egrave; definitiva.</p>

      {err && <div className="adm-msg err" role="alert">{err}</div>}

      <div className="adm-list">
        {journeys.length === 0 && <div className="adm-sub">Nessun journey.</div>}
        {journeys.map((j) => (
          <div className="adm-row" key={j.id}>
            <div className="adm-row-main">
              <span className="adm-row-name">{j.name}</span>
              <span className="adm-row-id">
                {j.id}{(counts[j.name] || 0) > 0 ? ` · ${counts[j.name]} template` : ''}
              </span>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-danger"
              disabled={busyId === j.id}
              onClick={() => del(j)}
            >
              {busyId === j.id ? 'Elimino…' : 'Elimina'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
