// POST /api/templates/mms-config
// Salva MMS_SMS_CONFIG_JSON di un template. Equivalente dell'azione SSJS
// "saveTemplateMmsSmsConfig", ma:
//   - l'autorizzazione (solo admin) è verificata sul server e NON aggirabile;
//   - la validazione è la stessa usata dalla UI (nessuna divergenza);
//   - la scrittura usa la service key, quindi è esplicita e tracciabile.
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateMmsSmsConfig } from '@/lib/mms-config';

export async function POST(req: NextRequest) {
  try {
    // 1) Autorizzazione: solo admin può editare i template (come l'originale).
    await requireRole(['admin']);

    // 2) Input
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Body JSON mancante.' }, { status: 400 });
    }
    const { id, config } = body as { id?: string; config?: unknown };
    if (!id) {
      return NextResponse.json({ success: false, message: 'templateId (id) mancante.' }, { status: 400 });
    }

    // 3) Validazione (stessa logica del client)
    const result = validateMmsSmsConfig(config);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed.', errors: result.errors },
        { status: 422 }
      );
    }

    // 4) Scrittura
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('templates')
      .update({ mms_sms_config_json: result.config })
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: 'Template non trovato.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'MMS / SMS config saved successfully.',
      id: data.id,
      config: result.config,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ success: false, message: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { success: false, message: 'Unhandled error.', error: String(e) },
      { status: 500 }
    );
  }
}
