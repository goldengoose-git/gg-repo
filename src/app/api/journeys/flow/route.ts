// /api/journeys
//   POST   -> crea un nuovo Journey (solo admin)
//   DELETE -> elimina un Journey esistente per id (?id=slug) (solo admin)
// Stesso schema degli altri endpoint: requireRole -> validazione -> service key.
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/** slug stabile: minuscole, trattini, solo [a-z0-9-]. Come gli id esistenti ("welcome", "thankyou-reco"). */
function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Body JSON mancante.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const name = typeof b.name === 'string' ? b.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, message: 'Il nome e\' obbligatorio.' }, { status: 400 });
    }

    const rawId = typeof b.id === 'string' && b.id.trim() ? b.id : name;
    const id = slugify(rawId);
    if (!id) {
      return NextResponse.json({ success: false, message: 'Slug (id) non valido.' }, { status: 400 });
    }

    const str = (v: unknown, def = '') => (typeof v === 'string' ? v : def);
    const tags = Array.isArray(b.tags)
      ? b.tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof b.tags === 'string'
        ? b.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

    const miroLink = str(b.miroBoardLink);

    const row = {
      id,
      name,
      description: str(b.description),
      miro_board: miroLink,
      miro_board_link: miroLink,
      hero_img: str(b.heroImg),
      tags,
      flow_rules_text: str(b.flowRulesText),
      notes: str(b.notes),
      ppt_link: str(b.pptLink),
      status: str(b.status, 'Active') || 'Active',
      active: str(b.active, 'Yes') || 'Yes',
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('journeys')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json(
          { success: false, message: `Esiste gia' un journey con id "${id}". Cambia nome o id.` },
          { status: 409 },
        );
      }
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Journey creato.', id: data.id });
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

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Parametro id mancante.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('journeys')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: `Journey "${id}" non trovato.` }, { status: 404 });
    }

    // Nota: i template con journey_name = <nome> NON vengono toccati (collegamento per nome, non FK).
    return NextResponse.json({ success: true, message: 'Journey eliminato.', id: data.id });
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
