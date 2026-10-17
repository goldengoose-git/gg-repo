'use client';

// Form "Nuovo Journey" (Admin). Crea una riga in public.journeys via POST /api/journeys.
// Obbligatorio solo `name`; `id` (slug) si deriva dal nome ma e' editabile.
// Il flow nasce vuoto: si costruisce poi con l'editor (Fase 2/3). map_json: default DB.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function slugify(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export default function NewJourneyForm({ existingIds }: { existingIds: string[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [heroImg, setHeroImg] = useState('');
  const [tags, setTags] = useState('');
  const [miroBoardLink, setMiroBoardLink] = useState('');
  const [pptLink, setPptLink] = useState('');
  const [flowRulesText, setFlowRulesText] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [active, setActive] = useState('Yes');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string; id?: string } | null>(null);

  // slug effettivo: se l'utente non ha toccato il campo id, lo deriva dal nome
  const effectiveId = idTouched ? slugify(id) : slugify(name);
  const existing = useMemo(() => new Set(existingIds), [existingIds]);
  const idClash = effectiveId !== '' && existing.has(effectiveId);

  function reset() {
    setName(''); setId(''); setIdTouched(false); setDescription(''); setHeroImg('');
    setTags(''); setMiroBoardLink(''); setPptLink(''); setFlowRulesText(''); setNotes('');
    setStatus('Active'); setActive('Yes');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!name.trim()) { setMsg({ kind: 'err', text: 'Il nome e\' obbligatorio.' }); return; }
    if (!effectiveId) { setMsg({ kind: 'err', text: 'Slug (id) non valido: usa lettere o numeri nel nome.' }); return; }
    if (idClash) { setMsg({ kind: 'err', text: `Esiste gia' un journey con id "${effectiveId}".` }); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: effectiveId, name: name.trim(), description, heroImg, tags,
          miroBoardLink, pptLink, flowRulesText, notes, status, active,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMsg({ kind: 'err', text: json?.message ?? `Errore ${res.status}` });
        return;
      }
      setMsg({ kind: 'ok', text: 'Journey creato.', id: json.id });
      reset();
      router.refresh(); // aggiorna la lista journey nelle altre viste
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Errore di rete.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-card">
      <h2>Nuovo Journey</h2>
      <p className="adm-sub">
        Crea il journey "guscio". Il flusso lo costruisci dopo, nella vista Map, con l&apos;editor del Flow.
      </p>

      <form onSubmit={submit}>
        <div className="adm-grid">
          <div className="adm-field">
            <label htmlFor="j-name">Nome <span className="req">*</span></label>
            <input id="j-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Welcome" autoFocus />
          </div>

          <div className="adm-field">
            <label htmlFor="j-id">Id / slug</label>
            <input
              id="j-id"
              value={idTouched ? id : effectiveId}
              onChange={(e) => { setIdTouched(true); setId(e.target.value); }}
              placeholder="auto dal nome"
            />
            <span className="adm-help">
              Chiave stabile (PK). {idClash ? <span style={{ color: '#c0392b' }}>già esistente!</span> : <>sarà <code>{effectiveId || '—'}</code></>}
            </span>
          </div>

          <div className="adm-field full">
            <label htmlFor="j-desc">Descrizione</label>
            <textarea id="j-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="adm-field">
            <label htmlFor="j-hero">Hero image (URL)</label>
            <input id="j-hero" value={heroImg} onChange={(e) => setHeroImg(e.target.value)} placeholder="https://..." />
          </div>

          <div className="adm-field">
            <label htmlFor="j-tags">Tag</label>
            <input id="j-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Onboarding, Welcome" />
            <span className="adm-help">Separati da virgola.</span>
          </div>

          <div className="adm-field">
            <label htmlFor="j-miro">Miro board link</label>
            <input id="j-miro" value={miroBoardLink} onChange={(e) => setMiroBoardLink(e.target.value)} placeholder="https://miro.com/..." />
          </div>

          <div className="adm-field">
            <label htmlFor="j-ppt">PPT link</label>
            <input id="j-ppt" value={pptLink} onChange={(e) => setPptLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="adm-field full">
            <label htmlFor="j-rules">Flow rules (testo)</label>
            <textarea id="j-rules" value={flowRulesText} onChange={(e) => setFlowRulesText(e.target.value)} placeholder="Iscriviti alla lista > Attendi 1 ora > ..." />
          </div>

          <div className="adm-field full">
            <label htmlFor="j-notes">Note</label>
            <textarea id="j-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="adm-field">
            <label htmlFor="j-status">Status</label>
            <select id="j-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="adm-field">
            <label htmlFor="j-active">Active</label>
            <select id="j-active" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <div className="adm-actions">
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving || !name.trim() || idClash}>
            {saving ? 'Creazione…' : 'Crea Journey'}
          </button>
          <button type="button" className="adm-btn" onClick={reset} disabled={saving}>Pulisci</button>
        </div>

        {msg && (
          <div className={`adm-msg ${msg.kind}`} role={msg.kind === 'err' ? 'alert' : 'status'}>
            {msg.kind === 'ok'
              ? <>Journey <strong>{msg.id}</strong> creato. Vai nella vista <strong>Map</strong> per costruirne il flusso.</>
              : msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
