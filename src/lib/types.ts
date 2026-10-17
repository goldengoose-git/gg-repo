// Tipi condivisi — rispecchiano lo schema Postgres (snake_case) e il
// modello che la UI usava (camelCase). Teniamo entrambi e mappiamo
// al confine (vedi mappers.ts).

export type AppRole = 'user' | 'mapeditor' | 'admin';

export interface MmsSmsItem {
  id: string;
  channel: string;        // 'MMS' | 'SMS'
  market: string;         // 'KR' | 'CN' | ...
  deliveryCode: string;
  enabled: boolean;
  label: string;
  images: { male: string; female: string; fallback: string };
}

export interface MmsSmsConfig {
  version: number;
  items: MmsSmsItem[];
}

export interface Asset {
  name: string;
  url: string;
}

// Riga DB (snake_case)
export interface TemplateRow {
  id: string;
  name: string;
  delivery_code: string;
  status: string;
  subject_line: string;
  body_copy_ita: string;
  body_copy_eng: string;
  assets_json: Asset[];
  mms: string;
  cdp: string;
  journey_name: string;
  market: string;
  languages: string;
  hero_image: string;
  preview_jpg: string;
  banner: string;
  cdp_fallback: string;
  stopped: string;
  wallet: string;
  preheader: string;
  last_update: string;
  copy_de_key: string;
  assets_de_key: string;
  mms_sms_config_json: MmsSmsConfig;
  mms_copy_en: string;
  mms_copy_zh: string;
  mms_copy_kr: string;
  sms_copy_en: string;
  sms_copy_zh: string;
  sms_copy_kr: string;
  mms_link: string;
  sms_link: string;
  updated_at: string;
}

export interface JourneyRow {
  id: string;
  name: string;
  description: string;
  miro_board: string;
  miro_board_link: string;
  hero_img: string;
  tags: string[];
  default_flow_json: unknown[];
  flow_view_json: unknown;
  flow_rules_text: string;
  notes: string;
  ppt_link: string;
  status: string;
  active: string;
}

// Costanti di validazione (identiche al vecchio 01-jsconfig.js)
export const MMS_SMS_ALLOWED_MARKETS = ['KR', 'CN', 'TW', 'MO', 'HK', 'FR', 'AE', 'ES', 'IT'];
export const MMS_SMS_ALLOWED_CHANNELS = ['MMS', 'SMS'];
