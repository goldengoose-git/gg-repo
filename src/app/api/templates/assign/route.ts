// POST /api/templates/assign
// Collega/scollega un template a un journey impostando templates.journey_name. Solo admin.
//   body: { templateId: string, journeyName: string }  (journeyName '' = scollega)
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
    const { templateId, journeyName } = body as { templateId?: string; journeyName?: unknown };
    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json({ success: false, message: 'templateId mancante.' }, { status: 400 });
    }
    if (journeyName != null && typeof journeyName !== 'string') {
      return NextResponse.json({ success: false, message: 'journeyName deve essere una stringa.' }, { status: 400 });
    }
    const jn = typeof journeyName === 'string' ? journeyName : '';

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('templates')
      .update({ journey_name: jn })
      .eq('id', templateId)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: 'Template non trovato.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: jn ? 'Template collegato.' : 'Template scollegato.', id: data.id, journeyName: jn });
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
