'use client';

// Modale dettaglio MMS/SMS (ex openMmsDetailModal + render di patch_js_features.js).
// Tab MMS/SMS, switch per mercato, anteprima "telefono" e copy per lingua.
// Sola lettura.
import { useMemo, useState } from 'react';
import type { TemplateVM } from '@/lib/mappers';
import type { MmsSmsItem } from '@/lib/types';

function imageFor(it: MmsSmsItem): string {
  return it.images.female || it.images.male || it.images.fallback || '';
}

function itemsForChannel(all: MmsSmsItem[], channel: 'MMS' | 'SMS'): MmsSmsItem[] {
  return all.filter(
    (x) => String(x.channel || '').toUpperCase() === channel && x.enabled !== false
  );
}

export default function MmsModal({ t, onClose }: { t: TemplateVM; onClose: () => void }) {
  const mmsItems = useMemo(() => itemsForChannel(t.mmsSmsAll, 'MMS'), [t]);
  const smsItems = useMemo(() => itemsForChannel(t.mmsSmsAll, 'SMS'), [t]);

  const hasMms = mmsItems.length > 0;
  const hasSms = smsItems.length > 0;

  const [tab, setTab] = useState<'mms' | 'sms'>(hasMms ? 'mms' : 'sms');
  const items = tab === 'mms' ? mmsItems : smsItems;
  const link = tab === 'mms' ? t.mmsLink : t.smsLink;
  const copy = tab === 'mms' ? t.mmsCopy : t.smsCopy;

  // mercati disponibili per il canale corrente
  const markets = useMemo(() => {
    const set = new Set(items.map((i) => String(i.market || '').toUpperCase()).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const [market, setMarket] = useState<string>(markets[0] || '');
  const activeMarket = markets.includes(market) ? market : markets[0] || '';
  const current = items.filter((i) => String(i.market || '').toUpperCase() === activeMarket);
  const first = current[0] || items[0];
  const previewUrl = first ? imageFor(first) : '';

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box mms-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">MMS / SMS Details</div>

        <div className="mms-tabs">
          {hasMms && (
            <button className={tab === 'mms' ? 'active' : ''} onClick={() => { setTab('mms'); setMarket(''); }}>MMS</button>
          )}
          {hasSms && (
            <button className={tab === 'sms' ? 'active' : ''} onClick={() => { setTab('sms'); setMarket(''); }}>SMS</button>
          )}
        </div>

        {markets.length > 0 && (
          <div className="mms-market-chips">
            {markets.map((m) => (
              <button
                key={m}
                className={`chip market${m === activeMarket ? ' active' : ''}`}
                onClick={() => setMarket(m)}
              >
                {m} ({items.filter((i) => String(i.market || '').toUpperCase() === m).length})
              </button>
            ))}
          </div>
        )}

        <div className="mms-split">
          <div className="mms-phone">
            <div className="mms-phone-notch" />
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewUrl} alt={`${tab.toUpperCase()} preview`} />
            ) : (
              <div className="mms-no-asset">Nessuna immagine disponibile</div>
            )}
          </div>

          <div className="mms-info">
            <Info label="Template" value={t.name || '-'} />
            <Info label="Delivery Code" value={first?.deliveryCode || t.deliveryCode || '-'} />
            <Info label="Asset URL" value={previewUrl || '-'} url />
            <Info label={`${tab.toUpperCase()} Link (CTA)`} value={link || '-'} url />

            <div className="mms-copy-block">
              <div className="meta-k">Copy</div>
              <div className="mms-copy">
                <div><strong>EN:</strong> {copy.en || '-'}</div>
                <div><strong>ZH:</strong> {copy.zh || '-'}</div>
                <div><strong>KR:</strong> {copy.kr || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {previewUrl && (
            <a className="btn-view" href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 0 }}>
              Open Full Image
            </a>
          )}
          <button className="jc-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, url }: { label: string; value: string; url?: boolean }) {
  return (
    <div className="mms-info-group">
      <div className="meta-k">{label}</div>
      <div className={`meta-v${url ? ' url' : ''}`}>{value}</div>
    </div>
  );
}
