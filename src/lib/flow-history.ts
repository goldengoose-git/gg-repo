/**
 * flow-history.ts - storico undo/redo + "stato originale" per la Fase 2.
 *
 * Tutto in memoria: nessun localStorage, nessuna scrittura su DB. Un ricaricamento della
 * pagina ricrea la history dallo stato letto da Supabase, quindi riporta sempre all'originale.
 */
import type { FlowState } from './flow-edit';

export const HISTORY_LIMIT = 100;

export interface FlowHistory {
  /** fotografia dello stato al caricamento (mai modificata) */
  readonly original: FlowState;
  readonly past: readonly FlowState[];
  readonly present: FlowState;
  readonly future: readonly FlowState[];
}

export function createHistory(initial: FlowState): FlowHistory {
  return { original: initial, past: [], present: initial, future: [] };
}

export function commit(h: FlowHistory, next: FlowState): FlowHistory {
  if (next === h.present) return h;
  const past = [...h.past, h.present].slice(-HISTORY_LIMIT);
  return { ...h, past, present: next, future: [] };
}

export const canUndo = (h: FlowHistory) => h.past.length > 0;
export const canRedo = (h: FlowHistory) => h.future.length > 0;

export function undo(h: FlowHistory): FlowHistory {
  const prev = h.past[h.past.length - 1];
  if (!prev) return h;
  return { ...h, past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
}

export function redo(h: FlowHistory): FlowHistory {
  const [next, ...rest] = h.future;
  if (!next) return h;
  return { ...h, past: [...h.past, h.present], present: next, future: rest };
}

/** "Annulla modifiche": torna allo stato originale e svuota lo storico. */
export function reset(h: FlowHistory): FlowHistory {
  return createHistory(h.original);
}

/**
 * true se l'albero differisce dall'originale. Si confronta solo `nodes`: i contatori
 * nodeSeq/branchSeq cambiano anche con add+remove ma non sono una modifica "visibile".
 */
export function isDirty(h: FlowHistory): boolean {
  if (h.present === h.original) return false;
  return JSON.stringify(h.present.nodes) !== JSON.stringify(h.original.nodes);
}
