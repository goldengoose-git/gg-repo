// Mapper riga-DB -> oggetto-UI. La vecchia SPA lavorava con camelCase
// (item.Name, item.deliveryCode, item.MMS_SMS_CONFIG_JSON...). Qui traduciamo
// una volta al confine, così i componenti restano leggibili e vicini
// all'originale, e il DB resta in snake_case idiomatico.
import type { TemplateRow } from './types';

export interface TemplateVM {
  id: string;
  name: string;
  deliveryCode: string;
  status: string;
  subjectLine: string;
  cdp: string;
  mms: string;
  wallet: string;
  stopped: string;
  journeyName: string;
  lastUpdate: string;
  heroImage: string;
  mmsSmsItemsCount: number;
}

export function toTemplateVM(r: TemplateRow): TemplateVM {
  const items = r.mms_sms_config_json?.items ?? [];
  return {
    id: r.id,
    name: r.name,
    deliveryCode: r.delivery_code,
    status: r.status,
    subjectLine: r.subject_line,
    cdp: r.cdp,
    mms: r.mms,
    wallet: r.wallet,
    stopped: r.stopped,
    journeyName: r.journey_name,
    lastUpdate: r.last_update,
    heroImage: r.hero_image,
    mmsSmsItemsCount: items.length,
  };
}
