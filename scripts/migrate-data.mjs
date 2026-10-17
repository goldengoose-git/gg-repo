#!/usr/bin/env node
/**
 * migrate-data.mjs
 * Importa in Supabase i dati esportati dalle Data Extension SFMC.
 *
 * COME ESPORTARE DA SFMC
 *   La CloudPage originale già serializzava le DE in JSON (variabili
 *   @jsonString e @journeysJsonString). Il modo più semplice:
 *   apri la vecchia pagina loggato, apri la console e salva:
 *       copy(JSON.stringify(DATA))      -> incolla in data/templates.json
 *       copy(JSON.stringify(JOURNEYS))  -> incolla in data/journeys.json
 *   In alternativa esporta le DE come CSV e convertile in questi JSON.
 *
 * USO
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migrate-data.mjs ./data/templates.json ./data/journeys.json
 *
 * Idempotente: fa upsert sulle chiavi naturali.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [, , templatesPath, journeysPath] = process.argv;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Mancano SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!templatesPath || !journeysPath) {
  console.error('Uso: node scripts/migrate-data.mjs <templates.json> <journeys.json>');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// Normalizza MMS_SMS_CONFIG_JSON (stringa, array nudo o oggetto) nello
// schema canonico {version, items}. Stessa logica del backend SSJS.
function normalizeMmsSms(raw) {
  if (raw == null || raw === '') return { version: 1, items: [] };
  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { return { version: 1, items: [] }; }
  }
  if (Array.isArray(parsed)) return { version: 1, items: parsed };
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.items)) return { version: parsed.version || 1, items: parsed.items };
    if (parsed.channel || parsed.market || parsed.deliveryCode || parsed.images) {
      return { version: 1, items: [parsed] };
    }
  }
  return { version: 1, items: [] };
}

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return a; } catch {}
  }
  return [];
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function migrateJourneys(rows) {
  const mapped = rows.map((j, i) => ({
    id: (j.id && String(j.id).trim()) || slugify(j.name || `journey_${i}`),
    name: j.name || j.nameDE || '',
    description: j.desc || '',
    miro_board: j.miroBoard || '',
    miro_board_link: j.miroBoardLink || '',
    hero_img: j.heroImg || j.img || '',
    tags: Array.isArray(j.tags)
      ? j.tags
      : (typeof j.tags === 'string'
          ? j.tags.replace(/^\[|\]$/g, '').split(',').map((t) => t.replace(/["']/g, '').trim()).filter(Boolean)
          : []),
    default_flow_json: toArray(j.defaultFlowJson),
    flow_view_json: (j.flowViewJson && typeof j.flowViewJson === 'object') ? j.flowViewJson : toArray(j.flowViewJson),
    flow_rules_text: j.flowRulesText || '',
    map_json: toArray(j.MapJson),
    notes: j.notes || '',
    ppt_link: j.pptLink || '',
    status: j.status || (j.active === 'Yes' ? 'Active' : 'Stopped'),
    active: j.active || 'Yes',
  }));

  const { error } = await supabase.from('journeys').upsert(mapped, { onConflict: 'id' });
  if (error) throw error;
  return mapped.length;
}

async function migrateTemplates(rows) {
  const mapped = rows.map((t) => ({
    name: t.Name || '',
    delivery_code: t.deliveryCode || '',
    status: t.status || 'Active',
    subject_line: t.subjectLine || '',
    body_copy_ita: t.bodyCopyIta || '',
    body_copy_eng: t.bodyCopyEng || '',
    assets_json: toArray(t.assetsJson),
    mms: t.mms || 'No',
    cdp: t.cdp || 'No',
    journey_name: t.journeyName || '',
    market: t.market || '',
    languages: t.languages || '',
    hero_image: t.heroImage || '',
    preview_jpg: t.previewJpg || '',
    banner: t.banner || 'None',
    cdp_fallback: t.cdpFallback || 'No',
    stopped: t.stopped || 'No',
    wallet: t.wallet || 'No',
    preheader: t.preheader || '',
    last_update: t.lastUpdate || '',
    copy_de_key: t.copyDeKey || '',
    assets_de_key: t.assetsDeKey || '',
    mms_sms_config_json: normalizeMmsSms(t.MMS_SMS_CONFIG_JSON ?? t.MMS_SMS_Config_JSON),
    mms_copy_en: t.mmsCopyEn || '',
    mms_copy_zh: t.mmsCopyZh || '',
    mms_copy_kr: t.mmsCopyKr || '',
    sms_copy_en: t.smsCopyEn || '',
    sms_copy_zh: t.smsCopyZh || '',
    sms_copy_kr: t.smsCopyKr || '',
    mms_link: t.mmsLink || '',
    sms_link: t.smsLink || '',
  }));

  const { error } = await supabase
    .from('templates')
    .upsert(mapped, { onConflict: 'name,delivery_code' });
  if (error) throw error;
  return mapped.length;
}

(async () => {
  try {
    const journeys = readJson(journeysPath);
    const templates = readJson(templatesPath);
    const nj = await migrateJourneys(journeys);
    console.log(`✓ Journeys importati: ${nj}`);
    const nt = await migrateTemplates(templates);
    console.log(`✓ Templates importati: ${nt}`);
    console.log('Migrazione completata.');
  } catch (e) {
    console.error('Errore migrazione:', e.message || e);
    process.exit(1);
  }
})();
