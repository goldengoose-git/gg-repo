// POST /api/journeys/flow
// Salva il Flow (albero) e, opzionalmente, le note di un journey.
// Equivalente dell'azione SSJS "saveJourneyFlow", ma:
//   - l'autorizzazione (mapeditor/admin) e' verificata sul server e NON aggirabile;
//   - la validazione e' la STESSA usata dalla UI (validateFlowState): nessuna divergenza;
//   - la scrittura usa la service key, quindi e' esplicita e tracciabile.
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeFlowState, validateFlowState } from '@/lib/flow-edit';

export async function POST(req: NextRequest) {
  try {
    // 1) Autorizzazione: mapeditor o admin (come da roadmap Fase 3).
    await requireRole(['mapeditor', 'admin']);

    // 2) Input
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

    // 3) Normalizzazione + validazione (stessa logica del client; mai fidarsi del body)
    const flowState = normalizeFlowState(state);
    const problems = validateFlowState(flowState);
    if (problems.length) {
      return NextResponse.json(
        { success: false, message: 'Flow non valido.', errors: problems },
        { status: 422 },
      );
    }

    // 4) Scrittura (patch minima: flow sempre, notes solo se fornite)
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = { flow_view_json: flowState };
    if (typeof notes === 'string') patch.notes = notes;

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
      message: 'Flow salvato correttamente.',
      id: data.id,
      state: flowState,
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
