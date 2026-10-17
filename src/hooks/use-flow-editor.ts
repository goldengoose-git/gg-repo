'use client';
/**
 * use-flow-editor.ts - collega flow-edit + flow-history a React.
 *   Fase 2: stato client (add/remove, undo/redo, reset).
 *   Fase 3: save() -> POST /api/journeys/flow (requireRole mapeditor/admin lato server).
 *
 * Uso nel contenitore (FlowEditor):
 *   const ed = useFlowEditor({ journeyId, initialState: hydrateFlowState(...), role });
 *   <FlowViewer nodes={ed.state.nodes} ... />
 *   ed.addNode({kind:'branch', id}, {type:'email', title:'...'});
 *   await ed.save();   // persiste su Supabase
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addBranch as opAddBranch,
  addDivider as opAddDivider,
  addNode as opAddNode,
  normalizeFlowState,
  removeBranch as opRemoveBranch,
  removeItem as opRemoveItem,
  type EditError,
  type EditResult,
  type FlowState,
  type FlowTarget,
  type NewNodeSpec,
} from '@/lib/flow-edit';
import {
  canRedo,
  canUndo,
  commit,
  createHistory,
  isDirty,
  markSaved,
  redo as hRedo,
  reset as hReset,
  undo as hUndo,
  type FlowHistory,
} from '@/lib/flow-history';

/** Ruoli che possono modificare il flow (il server in Fase 3 li ricontrolla con requireRole). */
export function canEditFlow(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return r === 'mapeditor' || r === 'admin';
}

export interface UseFlowEditorArgs {
  journeyId: string;
  /** stato letto dal DB (gia' passato da hydrateFlowState); null/undefined/[] = flow vuoto */
  initialState: unknown;
  role: string | null | undefined;
}

export function useFlowEditor({ journeyId, initialState, role }: UseFlowEditorArgs) {
  const router = useRouter();
  const canEdit = canEditFlow(role);
  const [history, setHistory] = useState<FlowHistory>(() => createHistory(normalizeFlowState(initialState)));
  const [forJourney, setForJourney] = useState(journeyId);
  const [lastError, setLastError] = useState<EditError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Cambio journey: si riparte dall'originale del nuovo journey (le modifiche non salvate si perdono).
  if (forJourney !== journeyId) {
    const fresh = createHistory(normalizeFlowState(initialState));
    setForJourney(journeyId);
    setHistory(fresh);
    setLastError(null);
    setSaveError(null);
  }

  const ref = useRef(history);
  ref.current = history;

  const apply = useCallback(
    (op: (s: FlowState) => EditResult): EditResult => {
      if (!canEdit) {
        const err: EditError = { ok: false, code: 'FORBIDDEN', message: 'Il tuo ruolo non puo\' modificare il flow' };
        setLastError(err);
        return err;
      }
      const res = op(ref.current.present);
      if (res.ok) {
        const next = commit(ref.current, res.state);
        ref.current = next;
        setHistory(next);
        setLastError(null);
      } else {
        setLastError(res);
      }
      return res;
    },
    [canEdit],
  );

  const dirty = canEdit && isDirty(history);

  // Avviso alla chiusura/ricarica del tab con modifiche non salvate.
  // (Non copre la navigazione client-side di Next: per quella serve un confirm sul link.)
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // FASE 3 — salvataggio su Supabase via API route (autorizzazione ricontrollata lato server).
  const save = useCallback(
    async (notesToSave?: string): Promise<boolean> => {
      if (!canEdit) {
        setSaveError('Il tuo ruolo non puo\' salvare il flow.');
        return false;
      }
      setSaving(true);
      setSaveError(null);
      try {
        const payload: Record<string, unknown> = { journeyId, state: ref.current.present };
        if (typeof notesToSave === 'string') payload.notes = notesToSave;

        const res = await fetch('/api/journeys/flow', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.success) {
          const base = json?.message ?? `Errore ${res.status}`;
          const msg = Array.isArray(json?.errors) && json.errors.length
            ? `${base} (${json.errors.join('; ')})`
            : base;
          setSaveError(msg);
          return false;
        }

        // Successo: il present diventa il nuovo "originale" (dirty -> false)
        const n = markSaved(ref.current);
        ref.current = n;
        setHistory(n);
        // Riallinea i dati SSR (notes/flow della pagina) con quanto appena salvato.
        router.refresh();
        return true;
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Errore di rete durante il salvataggio.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [canEdit, journeyId, router],
  );

  return {
    state: history.present,
    original: history.original,
    canEdit,
    dirty,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    lastError,
    clearError: useCallback(() => setLastError(null), []),
    saving,
    saveError,
    clearSaveError: useCallback(() => setSaveError(null), []),
    save,
    addNode: useCallback((target: FlowTarget, spec: NewNodeSpec) => apply((s) => opAddNode(s, journeyId, target, spec)), [apply, journeyId]),
    addDivider: useCallback((name?: string) => apply((s) => opAddDivider(s, journeyId, name)), [apply, journeyId]),
    addBranch: useCallback((splitId: string, label?: string) => apply((s) => opAddBranch(s, journeyId, splitId, label)), [apply, journeyId]),
    removeItem: useCallback((id: string) => apply((s) => opRemoveItem(s, id)), [apply]),
    removeBranch: useCallback((branchId: string) => apply((s) => opRemoveBranch(s, branchId)), [apply]),
    undo: useCallback(() => {
      if (!canEdit) return;
      const n = hUndo(ref.current); ref.current = n; setHistory(n);
    }, [canEdit]),
    redo: useCallback(() => {
      if (!canEdit) return;
      const n = hRedo(ref.current); ref.current = n; setHistory(n);
    }, [canEdit]),
    /** "Annulla modifiche": ripristina lo stato originale */
    reset: useCallback(() => {
      const n = hReset(ref.current); ref.current = n; setHistory(n); setLastError(null);
    }, []),
  };
}

export type FlowEditorApi = ReturnType<typeof useFlowEditor>;
