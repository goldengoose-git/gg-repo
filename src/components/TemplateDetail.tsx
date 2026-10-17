'use client';

// Pannello di dettaglio del template (ex "drawer" di render() in 03-jsviews.js).
// Mostra: asset gallery, config MMS/SMS, template details, copy IT/EN, DE keys.
// È puramente di lettura; le azioni di edit (asset / MMS config) arrivano nei
// giri successivi e sono riservate all'admin.
import { useState } from 'react';
import type { TemplateVM } from '@/lib/mappers';
import MmsModal from './MmsModal';

function pills(raw: string): string[] {
  return String(raw || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TemplateDetail({ t }: { t: TemplateVM }) {
  const [mmsOpen, setMmsOpen] = useState(false);
  const hasMmsSms = t.mmsSmsAll.length > 0;
  return (
    <div className="tpl-detail">
      {/* ---- colonna sinistra: asset + config + meta ---- */}
      <div>
        <div className="detail-label">Asset Gallery</div>
        {t.assets.length === 0 ? (
          <p className="muted">Nessun asset disponibile</p>
        ) : (
          <div className="asset-gallery">
            {t.assets.map((a, i) => (
              <div className="asset-card" key={i} title={a.name || 'Asset'}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url || ''} alt={a.name || 'Asset'} loading="lazy" />
                <span>{a.name || 'Asset'}</span>
              </div>
            ))}
          </div>
        )}

        {/* ---- MMS / SMS Config ---- */}
        <div className="detail-label" style={{ marginTop: 24 }}>MMS / SMS Config</div>
        {t.mmsSmsItems.length === 0 ? (
          <div className="muted-box">Nessuna configurazione MMS / SMS per i mercati attivi.</div>
        ) : (
          <div className="mms-grid">
            {t.mmsSmsItems.map((it) => (
              <div className="mms-card" key={it.id}>
                <div className="mms-card-meta">
                  <span className="chip">{it.channel || '-'}</span>
                  <span className="chip">{it.market || '-'}</span>
                  <span className={`chip ${it.enabled ? 'on' : 'off'}`}>
                    {it.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                {it.label && <div className="mms-card-label">{it.label}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ---- Template Details ---- */}
        <div className="detail-label" style={{ marginTop: 24 }}>Template Details</div>
        <div className="meta-grid">
          <Meta full label="Preheader" value={t.preheader || '-'} />
          <MetaPills label="Market" values={pills(t.market)} />
          <MetaPills label="Languages" values={pills(t.languages)} />
          <Meta label="CDP Fallback" value={t.cdpFallback || 'No'} />
          <Meta label="Banner" value={t.banner || 'None'} />
          <Meta full label="Last Update" value={t.lastUpdate || '-'} />
        </div>

        {/* ---- DE keys ---- */}
        {t.copyDeKey && <DeKey label="Copy DE Key" value={t.copyDeKey} />}
        {t.assetsDeKey && <DeKey label="Assets DE Key" value={t.assetsDeKey} />}
      </div>

      {/* ---- colonna destra: copy ---- */}
      <div className="copy-col">
        <span className="copy-lang">ITA Copy</span>
        <div className="copy-box">{t.bodyCopyIta || 'N/A'}</div>
        <span className="copy-lang">ENG Copy</span>
        <div className="copy-box eng">{t.bodyCopyEng || 'N/A'}</div>
        {t.heroImage && (
          <a className="btn-view" href={t.heroImage} target="_blank" rel="noopener noreferrer">
            View Full Template
          </a>
        )}
        {hasMmsSms && (
          <button className="btn-view secondary" onClick={() => setMmsOpen(true)}>
            MMS / SMS Details
          </button>
        )}
      </div>

      {mmsOpen && <MmsModal t={t} onClose={() => setMmsOpen(false)} />}
    </div>
  );
}

function Meta({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`meta-item${full ? ' full' : ''}`}>
      <div className="meta-k">{label}</div>
      <div className="meta-v">{value}</div>
    </div>
  );
}

function MetaPills({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="meta-item">
      <div className="meta-k">{label}</div>
      <div className="meta-v chips">
        {values.length ? values.map((v, i) => <span className="chip" key={i}>{v}</span>) : <span className="chip">None</span>}
      </div>
    </div>
  );
}

function DeKey({ label, value }: { label: string; value: string }) {
  return (
    <div className="de-key">
      <span className="de-key-label">{label}</span>
      <span className="de-key-value">{value}</span>
      <button
        className="de-key-copy"
        onClick={(e) => {
          navigator.clipboard.writeText(value);
          const b = e.currentTarget;
          const prev = b.textContent;
          b.textContent = 'Copied!';
          setTimeout(() => { b.textContent = prev; }, 1500);
        }}
      >
        Copy
      </button>
    </div>
  );
}
