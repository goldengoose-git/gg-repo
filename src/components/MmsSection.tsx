'use client';

// Sezione "MMS / SMS Assets" (ex buildHomeMmsSection / renderHomeMmsGrid di
// patch_js_features.js). Griglia dei template con MMS/SMS, filtri ALL/MMS/SMS,
// card che aprono il modale MMS. Sola lettura.
import { useMemo, useState } from 'react';
import type { TemplateVM } from '@/lib/mappers';
import type { MmsSmsItem } from '@/lib/types';
import MmsModal from './MmsModal';

function channelItems(t: TemplateVM, channel: 'MMS' | 'SMS'): MmsSmsItem[] {
  return t.mmsSmsAll.filter(
    (x) => String(x.channel || '').toUpperCase() === channel && x.enabled !== false
  );
}

function previewFor(t: TemplateVM): string {
  const first = t.mmsSmsAll[0];
  if (first) {
    const img = first.images.female || first.images.male || first.images.fallback;
    if (img) return img;
  }
  return t.heroImage || '';
}

export default function MmsSection({ templates }: { templates: TemplateVM[] }) {
  const [tab, setTab] = useState<'all' | 'mms' | 'sms'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => {
    return templates.filter((t) => {
      const hasMms = channelItems(t, 'MMS').length > 0 || t.mms === 'Yes';
      const hasSms = channelItems(t, 'SMS').length > 0;
      if (tab === 'mms') return hasMms;
      if (tab === 'sms') return hasSms;
      return hasMms || hasSms;
    });
  }, [templates, tab]);

  const openTpl = openId ? templates.find((t) => t.id === openId) : null;

  return (
    <div className="mms-section">
      <div className="mms-section-head">
        <div className="mms-section-title">
          <h2>MMS / SMS <em>Assets</em></h2>
          <span className="count-pill">{items.length} template{items.length !== 1 ? 's' : ''} with MMS/SMS</span>
        </div>
        <div className="mms-section-tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All</button>
          <button className={tab === 'mms' ? 'active' : ''} onClick={() => setTab('mms')}>MMS Only</button>
          <button className={tab === 'sms' ? 'active' : ''} onClick={() => setTab('sms')}>SMS Only</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">Nessun template con asset MMS/SMS per questo filtro.</div>
      ) : (
        <div className="mms-section-grid">
          {items.map((t) => {
            const hasMms = channelItems(t, 'MMS').length > 0 || t.mms === 'Yes';
            const hasSms = channelItems(t, 'SMS').length > 0;
            return (
              <div key={t.id} className="mms-asset-card" onClick={() => setOpenId(t.id)}>
                <div className="mms-asset-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewFor(t)} alt={t.name} loading="lazy" />
                  <div className="mms-asset-overlay"><span>{t.name}</span></div>
                </div>
                <div className="mms-asset-body">
                  <div className="mms-asset-code">{t.deliveryCode || '-'}</div>
                  <div className="mms-asset-tags">
                    <span className={`chip${hasMms ? ' tag-mms' : ''}`}>MMS: {hasMms ? 'Yes' : 'No'}</span>
                    <span className={`chip${hasSms ? ' tag-sms' : ''}`}>SMS: {hasSms ? 'Yes' : 'No'}</span>
                  </div>
                  <button className="jc-btn primary" onClick={(e) => { e.stopPropagation(); setOpenId(t.id); }}>
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openTpl && <MmsModal t={openTpl} onClose={() => setOpenId(null)} />}
    </div>
  );
}
