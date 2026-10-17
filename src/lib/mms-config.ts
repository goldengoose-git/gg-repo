// Validazione e normalizzazione di MMS_SMS_CONFIG_JSON.
// Porting 1:1 della logica che esisteva in DUE posti (01-jsconfig.js lato
// client e REPO_SSJS_BACKEND validateMmsSmsConfigJson lato SFMC). Ora è UNA
// sola implementazione, usata sia dalla UI che dalle API routes.
import {
  MMS_SMS_ALLOWED_MARKETS,
  MMS_SMS_ALLOWED_CHANNELS,
  type MmsSmsConfig,
  type MmsSmsItem,
} from './types';

export function isValidHttpUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/.+/i.test(url.trim());
}

export function safeParseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

function normalizeItem(item: Partial<MmsSmsItem> & Record<string, any>, index: number): MmsSmsItem {
  const images: Record<string, any> = item.images || {};
  return {
    id: item.id || `mms_sms_${index}`,
    channel: String(item.channel || '').trim().toUpperCase(),
    market: String(item.market || '').trim().toUpperCase(),
    deliveryCode: String(item.deliveryCode || '').trim(),
    enabled: item.enabled !== false,
    label: String(item.label || '').trim(),
    images: {
      male: String(images.male || item.maleImage || '').trim(),
      female: String(images.female || item.femaleImage || '').trim(),
      fallback: String(images.fallback || item.fallbackImage || '').trim(),
    },
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  config: MmsSmsConfig;
}

// Accetta: oggetto {version,items}, array nudo, singolo item, o stringa JSON
// di uno di questi. Normalizza, valida, restituisce config + errori.
export function validateMmsSmsConfig(raw: unknown): ValidationResult {
  const parsed = safeParseJson<any>(raw, null);

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Configuration JSON is empty or invalid.'], config: { version: 1, items: [] } };
  }

  // Normalizza formati legacy nello schema {version, items}
  let itemsRaw: any[];
  let version = 1;
  if (Array.isArray(parsed)) {
    itemsRaw = parsed;
  } else if (Array.isArray(parsed.items)) {
    itemsRaw = parsed.items;
    version = parsed.version || 1;
  } else if (parsed.channel || parsed.market || parsed.deliveryCode || parsed.images) {
    itemsRaw = [parsed];
  } else {
    itemsRaw = [];
  }

  const items = itemsRaw.map((it, i) => normalizeItem(it, i));
  const errors: string[] = [];
  const deliveryMap: Record<string, boolean> = {};

  items.forEach((item, index) => {
    const prefix = `Item #${index + 1}: `;

    if (!item.channel) errors.push(prefix + 'channel is required.');
    else if (!MMS_SMS_ALLOWED_CHANNELS.includes(item.channel))
      errors.push(prefix + 'channel must be one of: ' + MMS_SMS_ALLOWED_CHANNELS.join(', '));

    if (!item.market) errors.push(prefix + 'market is required.');
    else if (!MMS_SMS_ALLOWED_MARKETS.includes(item.market))
      errors.push(prefix + 'market must be one of: ' + MMS_SMS_ALLOWED_MARKETS.join(', '));

    if (!item.deliveryCode) {
      errors.push(prefix + 'deliveryCode is required.');
    } else {
      const key = item.deliveryCode.toLowerCase();
      if (deliveryMap[key]) errors.push(prefix + 'duplicate deliveryCode: ' + item.deliveryCode);
      deliveryMap[key] = true;
    }

    const hasAnyImage = !!(item.images.male || item.images.female || item.images.fallback);
    if (!hasAnyImage) errors.push(prefix + 'at least one image is required (male, female or fallback).');

    (['male', 'female', 'fallback'] as const).forEach((k) => {
      if (item.images[k] && !isValidHttpUrl(item.images[k]))
        errors.push(prefix + `images.${k} must be a valid URL.`);
    });
  });

  return { valid: errors.length === 0, errors, config: { version, items } };
}

// Helper UI: template "scaduto"/"aggiornato" dalla data last_update.
// Soglie come nel vecchio 01-jsconfig.js (expired > 10gg, updated <= 30gg).
export function parseDateField(raw: string): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const mt = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const d = mt ? new Date(+mt[3], +mt[1] - 1, +mt[2]) : new Date(s);
  return d && !isNaN(d.getTime()) ? d : null;
}

export function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

const EXPIRED_DAYS = 10;
const UPDATED_DAYS = 30;

export function isTemplateExpired(lastUpdate: string): boolean {
  const d = parseDateField(lastUpdate);
  return !!(d && daysSince(d) > EXPIRED_DAYS);
}

export function isTemplateRecentlyUpdated(lastUpdate: string): boolean {
  if (isTemplateExpired(lastUpdate)) return false;
  const d = parseDateField(lastUpdate);
  return !!(d && daysSince(d) <= UPDATED_DAYS);
}
