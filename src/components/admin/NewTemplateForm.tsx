'use client';

// Form "Nuovo Template" (Admin). Crea una riga in public.templates via POST /api/templates.
// Obbligatorio solo `name`. Chiave logica unica: (name, delivery_code) -> avviso live se collide.
// Asset gallery: righe {name,url} a mano oppure "Incolla JSON" -> assets_json.
// mms_sms_config_json NON e' qui (si gestisce dalla modale MMS/SMS).
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JourneyVM, TemplateVM } from '@/lib/mappers';

const EMPTY = {
  name: '', deliveryCode: '', journeyName: '', status: 'Active',
  subjectLine: '', preheader: '', bodyCopyIta: '', bodyCopyEng: '',
  languages: '', market: '', heroImage: '', previewJpg: '', banner: 'None',
  mms: 'No', cdp: 'No', cdpFallback: 'No', stopped: 'No', wallet: 'No',
  lastUpdate: '', copyDeKey: '', assetsDeKey: '',
  mmsLink: '', smsLink: '',
  mmsCopyEn: '', mmsCopyZh: '', mmsCopyKr: '', smsCopyEn: '', smsCopyZh: '', smsCopyKr: '',
};
type FormState = typeof EMPTY;
type AssetRow = { name: string; url: string };

function todayMMDDYYYY(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export default function NewTemplateForm({
  journeys, templates,
}: {
  journeys: JourneyVM[];
  templates: TemplateVM[];
}) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(EMPTY);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [assetsJsonText, setAssetsJsonText] = useState('');
  const [assetsJsonErr, setAssetsJsonErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { setF((s) => (s.lastUpdate ? s : { ...s, lastUpdate: todayMMDDYYYY() })); }, []);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const existingPairs = useMemo(
    () => new Set(templates.map((t) => `${t.name}|||${t.deliveryCode || ''}`)),
    [templates],
  );
  const pairClash = f.name.trim() !== '' && existingPairs.has(`${f.name.trim()}|||${f.deliveryCode.trim()}`);
  const journeyNames = useMemo(() => journeys.map((j) => j.name).sort((a, b) => a.localeCompare(b)), [journeys]);

  // --- Asset helpers ---
  const addAsset = () => setAssets((a) => [...a, { name: '', url: '' }]);
  const removeAsset = (i: number) => setAssets((a) => a.filter((_, idx) => idx !== i));
  const setAsset = (i: number, k: keyof AssetRow, v: string) =>
    setAssets((a) => a.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  function importAssetsJson() {
    setAssetsJsonErr(null);
    try {
      const parsed = JSON.parse(assetsJsonText);
      if (!Array.isArray(parsed)) throw new Error('Deve essere un array JSON.');
      const clean: AssetRow[] = parsed
        .map((x: unknown) => {
          const o = (x ?? {}) as Record<string, unknown>;
          return { name: typeof o.name === 'string' ? o.name : '', url: typeof o.url === 'string' ? o.url : '' };
        })
        .filter((a) => a.url.trim() !== '');
      if (!clean.length) throw new Error('Nessun asset con url valido trovato.');
      setAssets(clean);
      setAssetsJsonText('');
    } catch (e) {
      setAssetsJsonErr(e instanceof Error ? e.message : 'JSON non valido.');
    }
  }

  function reset() {
    setF({ ...EMPTY, lastUpdate: todayMMDDYYYY() });
    setAssets([]);
    setAssetsJsonText('');
    setAssetsJsonErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!f.name.trim()) { setMsg({ kind: 'err', text: 'Il nome e\' obbligatorio.' }); return; }
    if (pairClash) { setMsg({ kind: 'err', text: 'Esiste gia\' un template con questo nome + delivery code.' }); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...f,
          name: f.name.trim(),
          deliveryCode: f.deliveryCode.trim(),
          assets: assets.filter((a) => a.url.trim() !== '').map((a) => ({ name: a.name.trim(), url: a.url.trim() })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMsg({ kind: 'err', text: json?.message ?? `Errore ${res.status}` });
        return;
      }
      setMsg({ kind: 'ok', text: `Template creato${json.assets ? ` con ${json.assets} asset` : ''}.` });
      reset();
      router.refresh();
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Errore di rete.' });
    } finally {
      setSaving(false);
    }
  }

  const YesNo = ({ k, label }: { k: keyof FormState; label: string }) => (
    <div className="adm-field">
      <label htmlFor={`t-${k}`}>{label}</label>
      <select id={`t-${k}`} value={f[k]} onChange={set(k)}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>
    </div>
  );

  return (
    <div className="adm-card">
      <h2>Nuovo Template</h2>
      <p className="adm-sub">Config MMS/SMS si aggiunge dopo dalla modale dedicata. Qui crei la scheda, inclusi gli asset.</p>

      <form onSubmit={submit}>
        {/* Base */}
        <div className="adm-grid">
          <div className="adm-field">
            <label htmlFor="t-name">Nome <span className="req">*</span></label>
            <input id="t-name" value={f.name} onChange={set('name')} placeholder="Es. WELCOME_BRAND_CONTACT" autoFocus />
          </div>
          <div className="adm-field">
            <label htmlFor="t-dc">Delivery code</label>
            <input id="t-dc" value={f.deliveryCode} onChange={set('deliveryCode')} placeholder="CJ_EU_00CJ00_ALL_..." />
            <span className="adm-help">
              {pairClash ? <span style={{ color: '#c0392b' }}>nome + delivery code già esistente!</span> : 'Unico insieme al nome.'}
            </span>
          </div>
          <div className="adm-field">
            <label htmlFor="t-jn">Journey collegato</label>
            <select id="t-jn" value={f.journeyName} onChange={set('journeyName')}>
              <option value="">— Nessuno —</option>
              {journeyNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="adm-help">Collegamento per nome (journey_name).</span>
          </div>
          <div className="adm-field">
            <label htmlFor="t-status">Status</label>
            <select id="t-status" value={f.status} onChange={set('status')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <div className="adm-field">
            <label htmlFor="t-lu">Last update</label>
            <input id="t-lu" value={f.lastUpdate} onChange={set('lastUpdate')} placeholder="MM/DD/YYYY" />
            <span className="adm-help">Usato per il calcolo "expired". Formato MM/DD/YYYY.</span>
          </div>
        </div>

        {/* Contenuto email */}
        <h3 style={{ margin: '24px 0 4px', fontSize: 15 }}>Contenuto email</h3>
        <div className="adm-grid">
          <div className="adm-field full">
            <label htmlFor="t-subj">Subject line</label>
            <input id="t-subj" value={f.subjectLine} onChange={set('subjectLine')} />
          </div>
          <div className="adm-field full">
            <label htmlFor="t-pre">Preheader</label>
            <input id="t-pre" value={f.preheader} onChange={set('preheader')} />
          </div>
          <div className="adm-field full">
            <label htmlFor="t-ita">Body copy IT</label>
            <textarea id="t-ita" value={f.bodyCopyIta} onChange={set('bodyCopyIta')} />
          </div>
          <div className="adm-field full">
            <label htmlFor="t-eng">Body copy EN</label>
            <textarea id="t-eng" value={f.bodyCopyEng} onChange={set('bodyCopyEng')} />
          </div>
          <div className="adm-field">
            <label htmlFor="t-mkt">Market</label>
            <input id="t-mkt" value={f.market} onChange={set('market')} placeholder="Es. WW, EU, KR" />
          </div>
          <div className="adm-field">
            <label htmlFor="t-lang">Languages</label>
            <input id="t-lang" value={f.languages} onChange={set('languages')} placeholder="Es. IT, EN" />
          </div>
          <div className="adm-field">
            <label htmlFor="t-hero">Hero image (URL)</label>
            <input id="t-hero" value={f.heroImage} onChange={set('heroImage')} placeholder="https://..." />
          </div>
          <div className="adm-field">
            <label htmlFor="t-prev">Preview JPG (URL)</label>
            <input id="t-prev" value={f.previewJpg} onChange={set('previewJpg')} placeholder="https://..." />
          </div>
          <div className="adm-field">
            <label htmlFor="t-ban">Banner</label>
            <input id="t-ban" value={f.banner} onChange={set('banner')} placeholder="None" />
          </div>
        </div>

        {/* Asset gallery */}
        <h3 style={{ margin: '24px 0 4px', fontSize: 15 }}>Asset (gallery)</h3>
        <p className="adm-sub" style={{ margin: '0 0 10px' }}>
          Immagini del template (name + url) → <code>assets_json</code>. Aggiungile a mano o incolla un array JSON.
        </p>

        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444' }}>Incolla JSON asset</summary>
          <div className="adm-field" style={{ marginTop: 10 }}>
            <textarea
              value={assetsJsonText}
              onChange={(e) => setAssetsJsonText(e.target.value)}
              placeholder='[{"name":"Hero","url":"https://..."},{"name":"Image1","url":"https://..."}]'
              style={{ minHeight: 90, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          <div className="adm-actions" style={{ marginTop: 10 }}>
            <button type="button" className="adm-btn" onClick={importAssetsJson} disabled={!assetsJsonText.trim()}>Importa JSON</button>
            {assetsJsonErr && <span style={{ color: '#b0281a', fontSize: 12 }}>{assetsJsonErr}</span>}
          </div>
        </details>

        <div className="adm-list">
          {assets.length === 0 && <div className="adm-sub">Nessun asset. Aggiungine o incolla il JSON.</div>}
          {assets.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
              <input
                value={a.name}
                onChange={(e) => setAsset(i, 'name', e.target.value)}
                placeholder="name"
                style={{ width: 150, border: '1px solid #d9d6cf', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fdfdfb' }}
              />
              <input
                value={a.url}
                onChange={(e) => setAsset(i, 'url', e.target.value)}
                placeholder="https://..."
                style={{ flex: 1, minWidth: 0, border: '1px solid #d9d6cf', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fdfdfb' }}
              />
              <button type="button" className="adm-btn adm-btn-danger" onClick={() => removeAsset(i)} style={{ padding: '7px 12px' }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="button" className="adm-btn" onClick={addAsset}>+ Aggiungi asset</button>
          {assets.length > 0 && <span className="adm-help" style={{ marginLeft: 10 }}>{assets.length} asset</span>}
        </div>

        {/* Flag */}
        <h3 style={{ margin: '24px 0 4px', fontSize: 15 }}>Flag</h3>
        <div className="adm-grid">
          <YesNo k="mms" label="MMS" />
          <YesNo k="cdp" label="CDP" />
          <YesNo k="cdpFallback" label="CDP fallback" />
          <YesNo k="stopped" label="Stopped" />
          <YesNo k="wallet" label="Wallet" />
        </div>

        {/* Avanzato */}
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#444' }}>MMS / SMS e chiavi DE (avanzato)</summary>
          <div className="adm-grid" style={{ marginTop: 14 }}>
            <div className="adm-field"><label htmlFor="t-mlink">MMS link</label><input id="t-mlink" value={f.mmsLink} onChange={set('mmsLink')} placeholder="https://..." /></div>
            <div className="adm-field"><label htmlFor="t-slink">SMS link</label><input id="t-slink" value={f.smsLink} onChange={set('smsLink')} placeholder="https://..." /></div>
            <div className="adm-field"><label htmlFor="t-mce">MMS copy EN</label><input id="t-mce" value={f.mmsCopyEn} onChange={set('mmsCopyEn')} /></div>
            <div className="adm-field"><label htmlFor="t-mcz">MMS copy ZH</label><input id="t-mcz" value={f.mmsCopyZh} onChange={set('mmsCopyZh')} /></div>
            <div className="adm-field"><label htmlFor="t-mck">MMS copy KR</label><input id="t-mck" value={f.mmsCopyKr} onChange={set('mmsCopyKr')} /></div>
            <div className="adm-field"><label htmlFor="t-sce">SMS copy EN</label><input id="t-sce" value={f.smsCopyEn} onChange={set('smsCopyEn')} /></div>
            <div className="adm-field"><label htmlFor="t-scz">SMS copy ZH</label><input id="t-scz" value={f.smsCopyZh} onChange={set('smsCopyZh')} /></div>
            <div className="adm-field"><label htmlFor="t-sck">SMS copy KR</label><input id="t-sck" value={f.smsCopyKr} onChange={set('smsCopyKr')} /></div>
            <div className="adm-field"><label htmlFor="t-cdk">Copy DE key</label><input id="t-cdk" value={f.copyDeKey} onChange={set('copyDeKey')} /></div>
            <div className="adm-field"><label htmlFor="t-adk">Assets DE key</label><input id="t-adk" value={f.assetsDeKey} onChange={set('assetsDeKey')} /></div>
          </div>
        </details>

        <div className="adm-actions">
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving || !f.name.trim() || pairClash}>
            {saving ? 'Creazione…' : 'Crea Template'}
          </button>
          <button type="button" className="adm-btn" onClick={reset} disabled={saving}>Pulisci</button>
        </div>

        {msg && (
          <div className={`adm-msg ${msg.kind}`} role={msg.kind === 'err' ? 'alert' : 'status'}>
            {msg.kind === 'ok' ? msg.text + ' Lo trovi in Templates e, se collegato, nel journey.' : msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
