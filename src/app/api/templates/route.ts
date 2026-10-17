// POST /api/templates
// Crea un nuovo Template (riga in public.templates). Solo admin.
// `assets` (array {name,url}) -> assets_json. mms_sms_config_json resta al default DB
// (si gestisce dalla modale MMS/SMS). Chiave logica unica: (name, delivery_code).
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Body JSON mancante.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const str = (v: unknown, def = '') => (typeof v === 'string' ? v : def);
    const yn = (v: unknown, def = 'No') => {
      const s = str(v, def).trim();
      return s === 'Yes' || s === 'No' ? s : def;
    };

    const name = str(b.name).trim();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Il nome e\' obbligatorio.' }, { status: 400 });
    }

    // assets_json: array di {name,url}. Si scartano gli item senza url.
    const assets = Array.isArray(b.assets)
      ? (b.assets as unknown[])
          .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
          .map((x) => ({ name: typeof x.name === 'string' ? x.name : '', url: typeof x.url === 'string' ? x.url : '' }))
          .filter((a) => a.url.trim() !== '')
      : [];

    const row = {
      name,
      delivery_code: str(b.deliveryCode).trim(),
      journey_name: str(b.journeyName),
      status: str(b.status, 'Active') || 'Active',
      subject_line: str(b.subjectLine),
      preheader: str(b.preheader),
      body_copy_ita: str(b.bodyCopyIta),
      body_copy_eng: str(b.bodyCopyEng),
      languages: str(b.languages),
      market: str(b.market),
      hero_image: str(b.heroImage),
      preview_jpg: str(b.previewJpg),
      banner: str(b.banner, 'None') || 'None',
      mms: yn(b.mms),
      cdp: yn(b.cdp),
      cdp_fallback: yn(b.cdpFallback),
      stopped: yn(b.stopped),
      wallet: yn(b.wallet),
      last_update: str(b.lastUpdate),
      copy_de_key: str(b.copyDeKey),
      assets_de_key: str(b.assetsDeKey),
      assets_json: assets,
      mms_link: str(b.mmsLink),
      sms_link: str(b.smsLink),
      mms_copy_en: str(b.mmsCopyEn),
      mms_copy_zh: str(b.mmsCopyZh),
      mms_copy_kr: str(b.mmsCopyKr),
      sms_copy_en: str(b.smsCopyEn),
      sms_copy_zh: str(b.smsCopyZh),
      sms_copy_kr: str(b.smsCopyKr),
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('templates')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json(
          {
            success: false,
            message: `Esiste gia' un template con nome "${name}" e delivery code "${row.delivery_code || '(vuoto)'}".`,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Template creato.', id: data.id, assets: assets.length });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { success: false, message: 'Unhandled error.', error: String(e) },
      { status: 500 },
    );
  }
}
