'use client';

// Note del journey. Per mapeditor/admin sono editabili e si salvano via
// POST /api/journeys/flow (solo `notes`, il flow non viene toccato).
// Per gli altri ruoli resta il blocco in sola lettura (come prima).
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CSS = `
.jne textarea {
  width: 100%; box-sizing: border-box; border: 1px solid #d9d6cf; border-radius: 8px;
  padding: 10px 12px; font: inherit; min-height: 90px; resize: vertical; background: #fdfdfb; color: #222;
}
.jne textarea:focus { outline: none; border-color: #111; background: #fff; }
.jne-bar { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.jne-btn {
  padding: 7px 16px; border-radius: 7px; border: 1px solid #111; background: #111; color: #fff;
  font-size: 13px; cursor: pointer;
}
.jne-btn:disabled { opacity: .5; cursor: not-allowed; }
.jne-status { font-size: 12px; color: #777; }
.jne-status.err { color: #b0281a; }
`;

export default function JourneyNotesEditor({
  journeyId, initialNotes, canEdit,
}: {
  journeyId: string;
  initialNotes: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Sola lettura: identico a prima (niente blocco se non ci sono note).
  if (!canEdit) {
    if (!initialNotes) return null;
    return (
      <div className="flow-notes-block">
        <div className="flow-panel-title small">Journey <em>Notes</em></div>
        <div className="flow-notes">{initialNotes}</div>
      </div>
    );
  }

  const dirty = value !== saved;

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/journeys/flow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ journeyId, notes: value }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErr(json?.message ?? `Errore ${res.status}`);
        return;
      }
      setSaved(value);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flow-notes-block jne">
      <style>{CSS}</style>
      <div className="flow-panel-title small">Journey <em>Notes</em></div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Note del journey…" />
      <div className="jne-bar">
        <button type="button" className="jne-btn" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Salvataggio…' : 'Salva note'}
        </button>
        {err
          ? <span className="jne-status err">{err}</span>
          : dirty
            ? <span className="jne-status">Modifiche non salvate</span>
            : <span className="jne-status">Salvato</span>}
      </div>
    </div>
  );
}
