// POST /api/journeys/flow
// Salva il Flow (albero) e/oppure le note di un journey.
//   - requireRole(['mapeditor','admin']) verificato sul server, non aggirabile;
//   - `state` e `notes` sono entrambi OPZIONALI: si scrive solo cio' che viene passato,
//     cosi' un salvataggio di sole note non azzera il flow (e viceversa);
//   - lo stato, se presente, viene ri-normalizzato e ri-validato (non ci si fida del body);
//   - scrittura con service key.
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeFlowState, validateFlowState } from '@/lib/flow-edit';

export async function POST(req: NextRequest) {
  try {
    await requireRole(['mapeditor', 'admin']);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Body JSON mancante.' }, { status: 400 });
    }
    const { journeyId, state, notes } = body as {
      journeyId?: string;
      state?: unknown;
      notes?: unknown;
    };
    if (!journeyId || typeof journeyId !== 'string') {
      return NextResponse.json({ success: false, message: 'journeyId mancante.' }, { status: 400 });
    }
    if (notes != null && typeof notes !== 'string') {
      return NextResponse.json({ success: false, message: 'notes deve essere una stringa.' }, { status: 400 });
    }

    const hasState = state !== undefined && state !== null;
    const hasNotes = typeof notes === 'string';
    if (!hasState && !hasNotes) {
      return NextResponse.json({ success: false, message: 'Niente da salvare (nessuno stato o nota).' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (hasState) {
      const flowState = normalizeFlowState(state);
      const problems = validateFlowState(flowState);
      if (problems.length) {
        return NextResponse.json(
          { success: false, message: 'Flow non valido.', errors: problems },
          { status: 422 },
        );
      }
      patch.flow_view_json = flowState;
    }
    if (hasNotes) patch.notes = notes;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('journeys')
      .update(patch)
      .eq('id', journeyId)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: 'Journey non trovato.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Salvataggio riuscito.',
      id: data.id,
      saved: { flow: hasState, notes: hasNotes },
    });
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
