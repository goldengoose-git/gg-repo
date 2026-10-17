// Mapper riga-DB -> oggetto-UI. La vecchia SPA lavorava con camelCase
// (item.Name, item.deliveryCode, item.MMS_SMS_CONFIG_JSON...). Qui traduciamo
// una volta al confine, così i componenti restano leggibili e vicini
// all'originale, e il DB resta in snake_case idiomatico.
import type { TemplateRow, JourneyRow, Asset, MmsSmsItem } from './types';

// --- Journey view-model ---
export interface JourneyVM {
  id: string;
  name: string;
  description: string;
  img: string;
  tags: string[];
  miroBoardLink: string;
  pptLink: string;
  status: string;
  active: string;
  flowRulesText: string;
}

export function toJourneyVM(r: JourneyRow): JourneyVM {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    img: r.hero_img,
    tags: Array.isArray(r.tags) ? r.tags : [],
    miroBoardLink: r.miro_board_link,
    pptLink: r.ppt_link,
    status: r.status,
    active: r.active,
    flowRulesText: r.flow_rules_text,
  };
}

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
  // --- campi per il pannello di dettaglio ---
  bodyCopyIta: string;
  bodyCopyEng: string;
  preheader: string;
  market: string;
  languages: string;
  banner: string;
  cdpFallback: string;
  copyDeKey: string;
  assetsDeKey: string;
  assets: Asset[];          // escluse mms/sms (come renderAssetGallery)
  mmsSmsItems: MmsSmsItem[]; // solo market attivi, come renderMmsSmsConfigSection
  // --- dati completi per il modale MMS/SMS ---
  mmsSmsAll: MmsSmsItem[];  // tutti gli item (ogni canale/mercato), per il modale
  mmsLink: string;
  smsLink: string;
  mmsCopy: { en: string; zh: string; kr: string };
  smsCopy: { en: string; zh: string; kr: string };
}

// Mercati mostrati nel blocco config, nell'ordine originale (03-jsviews.js)
const ACTIVE_MMS_SMS_MARKETS = ['KR', 'HK', 'MO', 'TW', 'CN'];

export function toTemplateVM(r: TemplateRow): TemplateVM {
  const allItems = r.mms_sms_config_json?.items ?? [];

  // Asset gallery: come l'originale, nasconde quelli con "mms"/"sms" nel nome
  const assets = (Array.isArray(r.assets_json) ? r.assets_json : []).filter((a) => {
    const n = String(a?.name || '').toLowerCase();
    return !n.includes('mms') && !n.includes('sms');
  });

  // Config MMS/SMS: solo mercati attivi, ordinati come nell'originale
  const mmsSmsItems = allItems
    .filter((it) => ACTIVE_MMS_SMS_MARKETS.includes(String(it.market || '').toUpperCase()))
    .sort(
      (a, b) =>
        ACTIVE_MMS_SMS_MARKETS.indexOf(String(a.market || '').toUpperCase()) -
        ACTIVE_MMS_SMS_MARKETS.indexOf(String(b.market || '').toUpperCase())
    );

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
    mmsSmsItemsCount: allItems.length,
    bodyCopyIta: r.body_copy_ita,
    bodyCopyEng: r.body_copy_eng,
    preheader: r.preheader,
    market: r.market,
    languages: r.languages,
    banner: r.banner,
    cdpFallback: r.cdp_fallback,
    copyDeKey: r.copy_de_key,
    assetsDeKey: r.assets_de_key,
    assets,
    mmsSmsItems,
    mmsSmsAll: allItems,
    mmsLink: r.mms_link,
    smsLink: r.sms_link,
    mmsCopy: { en: r.mms_copy_en, zh: r.mms_copy_zh, kr: r.mms_copy_kr },
    smsCopy: { en: r.sms_copy_en, zh: r.sms_copy_zh, kr: r.sms_copy_kr },
  };
}
