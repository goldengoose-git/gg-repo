/**
 * flow-edit.ts - operazioni PURE e IMMUTABILI sull'albero del Flow (Fase 2).
 *
 * Porting di 04-jsflow.js (createFlowNode, confirmAddNode, removeNodeDeep,
 * removeDividerDeep, findBranchById) sui tipi reali di types.ts. Differenze volute:
 *  - nessuna mutazione: ogni funzione restituisce un NUOVO stato (l'input resta intatto);
 *  - nessun DOM, nessun salvataggio;
 *  - errori espliciti (EditResult) invece di "return" silenzioso;
 *  - rimozione/aggiunta di un singolo branch (nell'originale non esisteva);
 *  - nodeSeq/branchSeq vengono riallineati agli id esistenti: niente id duplicati.
 */
import type { FlowBranch, FlowNode, FlowNodeType, FlowState } from './types';

export type { FlowBranch, FlowNode, FlowNodeType, FlowState };

export const MIN_BRANCHES = 2;
export const MAX_BRANCHES = 5;
export const FLOW_NODE_TYPES: readonly FlowNodeType[] = ['entry', 'email', 'delay', 'split', 'exit'];

export type FlowTarget = { kind: 'root' } | { kind: 'branch'; id: string };

export interface NewNodeSpec {
  type: FlowNodeType;
  title?: string;
  meta?: string;
  /** solo split: 2..5 (fuori range viene riportato nel range) */
  branchCount?: number;
  /** solo split: "A, B, C" oppure ["A","B","C"]; i mancanti diventano "Branch n" */
  branchLabels?: string | string[];
  /** solo email */
  templateIndex?: number | null;
  templateCode?: string;
  templateName?: string;
  hasMmsSmsConfig?: boolean;
  mmsSmsDeliveryCodes?: string[];
}

export type EditErrorCode =
  | 'TARGET_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'BRANCH_NOT_FOUND'
  | 'SPLIT_NOT_FOUND'
  | 'MIN_BRANCHES'
  | 'MAX_BRANCHES'
  | 'INVALID_INPUT'
  | 'FORBIDDEN';

export interface EditError { ok: false; code: EditErrorCode; message: string }
export interface EditOk {
  ok: true;
  state: FlowState;
  /** id dell'elemento creato (add*) */
  id?: string;
  /** id di tutti gli elementi eliminati (remove*), compresi i discendenti */
  removedIds?: string[];
}
export type EditResult = EditOk | EditError;

class EditFailure extends Error {
  constructor(public code: EditErrorCode, message: string) { super(message); }
}
const fail = (code: EditErrorCode, message: string): never => { throw new EditFailure(code, message); };
function guard(fn: () => EditOk): EditResult {
  try { return fn(); } catch (e) {
    if (e instanceof EditFailure) return { ok: false, code: e.code, message: e.message };
    throw e;
  }
}

/* ---------- Type guards / utility ---------- */

export const isDivider = (n: FlowNode): boolean => n.isDivider === true;
export const isSplit = (n: FlowNode): boolean => n.isDivider !== true && n.type === 'split';

export function emptyFlowState(): FlowState {
  return { version: 1, nodeSeq: 1, branchSeq: 1, nodes: [] };
}

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function sanitizeItems(raw: unknown): FlowNode[] {
  return asArray<Record<string, unknown>>(raw)
    .filter((n) => n && typeof n === 'object')
    .map((n) => {
      if (n.isDivider === true) return n as unknown as FlowNode;
      if (n.type === 'split') {
        const branches = asArray<Record<string, unknown>>(n.branches)
          .filter((b) => b && typeof b === 'object')
          .map((b) => ({ ...(b as object), nodes: sanitizeItems(b.nodes) }) as unknown as FlowBranch);
        return { ...n, branches, branchCount: branches.length } as unknown as FlowNode;
      }
      return n as unknown as FlowNode;
    });
}

function scanSeq(items: FlowNode[], acc: { node: number; branch: number }): void {
  for (const it of items) {
    const m = /_(?:node|divider)_(\d+)$/.exec(it.id || '');
    if (m && m[1]) acc.node = Math.max(acc.node, Number(m[1]));
    if (isSplit(it)) {
      for (const b of it.branches ?? []) {
        const mb = /_branch_(\d+)$/.exec(b.id || '');
        if (mb && mb[1]) acc.branch = Math.max(acc.branch, Number(mb[1]));
        scanSeq(b.nodes ?? [], acc);
      }
    }
  }
}

/** Allinea i contatori agli id realmente presenti nell'albero. */
function withSeq(state: FlowState): FlowState {
  const acc = { node: 0, branch: 0 };
  scanSeq(state.nodes, acc);
  const nodeSeq = Math.max(state.nodeSeq || 1, acc.node + 1);
  const branchSeq = Math.max(state.branchSeq || 1, acc.branch + 1);
  if (nodeSeq === state.nodeSeq && branchSeq === state.branchSeq) return state;
  return { ...state, nodeSeq, branchSeq };
}

/**
 * Da usare UNA volta all'ingresso (dopo hydrateFlowState di flow.ts).
 * Accetta qualunque cosa: null, undefined, {}, [] o un flow malformato -> stato valido.
 */
export function normalizeFlowState(raw: unknown): FlowState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyFlowState();
  const r = raw as Partial<FlowState>;
  if (!Array.isArray(r.nodes)) return emptyFlowState();
  return withSeq({
    version: r.version || 1,
    nodeSeq: Number(r.nodeSeq) || 1,
    branchSeq: Number(r.branchSeq) || 1,
    nodes: sanitizeItems(r.nodes),
  });
}

/* ---------- Lettura ---------- */

export function findItem(items: FlowNode[], id: string): FlowNode | null {
  for (const it of items) {
    if (it.id === id) return it;
    if (isSplit(it)) {
      for (const b of it.branches ?? []) {
        const f = findItem(b.nodes ?? [], id);
        if (f) return f;
      }
    }
  }
  return null;
}

export function findBranch(items: FlowNode[], branchId: string): FlowBranch | null {
  for (const it of items) {
    if (!isSplit(it)) continue;
    for (const b of it.branches ?? []) {
      if (b.id === branchId) return b;
      const f = findBranch(b.nodes ?? [], branchId);
      if (f) return f;
    }
  }
  return null;
}

/** Tutti gli id (nodi, divider, branch) contenuti in items, ricorsivamente. */
export function collectIds(items: FlowNode[], out: string[] = []): string[] {
  for (const it of items) {
    out.push(it.id);
    if (isSplit(it)) {
      for (const b of it.branches ?? []) {
        out.push(b.id);
        collectIds(b.nodes ?? [], out);
      }
    }
  }
  return out;
}

/** Numero di nodi/divider (i branch non contano). */
export function countNodes(items: FlowNode[]): number {
  let n = 0;
  for (const it of items) {
    n += 1;
    if (isSplit(it)) for (const b of it.branches ?? []) n += countNodes(b.nodes ?? []);
  }
  return n;
}

/** Controlli di coerenza (riusabili lato API in Fase 3). Array vuoto = ok. */
export function validateFlowState(state: FlowState): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const visit = (items: FlowNode[], path: string) => {
    for (const it of items) {
      if (!it.id) problems.push(`${path}: elemento senza id`);
      else if (seen.has(it.id)) problems.push(`id duplicato: ${it.id}`);
      else seen.add(it.id);
      if (isSplit(it)) {
        const br = it.branches ?? [];
        if (br.length < MIN_BRANCHES || br.length > MAX_BRANCHES)
          problems.push(`split ${it.id}: ${br.length} branch (ammessi ${MIN_BRANCHES}-${MAX_BRANCHES})`);
        if (it.branchCount !== br.length)
          problems.push(`split ${it.id}: branchCount=${it.branchCount} ma branches=${br.length}`);
        for (const b of br) {
          if (!b.id) problems.push(`split ${it.id}: branch senza id`);
          else if (seen.has(b.id)) problems.push(`id duplicato: ${b.id}`);
          else seen.add(b.id);
          visit(b.nodes ?? [], `${path}>${b.id}`);
        }
      }
    }
  };
  visit(state.nodes, 'root');
  return problems;
}

/* ---------- Helper di copia strutturale (path-copying) ---------- */

function updateBranchNodes(
  items: FlowNode[],
  branchId: string,
  fn: (nodes: FlowNode[]) => FlowNode[],
): FlowNode[] | null {
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as FlowNode;
    if (!isSplit(it)) continue;
    const branches = it.branches ?? [];
    for (let j = 0; j < branches.length; j++) {
      const b = branches[j] as FlowBranch;
      const newNodes = b.id === branchId ? fn(b.nodes ?? []) : updateBranchNodes(b.nodes ?? [], branchId, fn);
      if (newNodes) {
        const newBranches = branches.slice();
        newBranches[j] = { ...b, nodes: newNodes };
        const newItems = items.slice();
        newItems[i] = { ...it, branches: newBranches };
        return newItems;
      }
    }
  }
  return null;
}

function updateSplit(
  items: FlowNode[],
  match: (split: FlowNode) => boolean,
  fn: (split: FlowNode) => FlowNode,
): FlowNode[] | null {
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as FlowNode;
    if (!isSplit(it)) continue;
    if (match(it)) {
      const newItems = items.slice();
      newItems[i] = fn(it);
      return newItems;
    }
    const branches = it.branches ?? [];
    for (let j = 0; j < branches.length; j++) {
      const b = branches[j] as FlowBranch;
      const inner = updateSplit(b.nodes ?? [], match, fn);
      if (inner) {
        const newBranches = branches.slice();
        newBranches[j] = { ...b, nodes: inner };
        const newItems = items.slice();
        newItems[i] = { ...it, branches: newBranches };
        return newItems;
      }
    }
  }
  return null;
}

function removeFromItems(items: FlowNode[], id: string): FlowNode[] | null {
  const idx = items.findIndex((x) => x.id === id);
  if (idx !== -1) return [...items.slice(0, idx), ...items.slice(idx + 1)];
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as FlowNode;
    if (!isSplit(it)) continue;
    const branches = it.branches ?? [];
    for (let j = 0; j < branches.length; j++) {
      const b = branches[j] as FlowBranch;
      const inner = removeFromItems(b.nodes ?? [], id);
      if (inner) {
        const newBranches = branches.slice();
        newBranches[j] = { ...b, nodes: inner };
        const newItems = items.slice();
        newItems[i] = { ...it, branches: newBranches };
        return newItems;
      }
    }
  }
  return null;
}

/* ---------- Costruzione nodi ---------- */

export function normalizeBranchLabels(raw: string | string[] | undefined, count: number): string[] {
  let l: string[] = [];
  if (Array.isArray(raw)) l = raw.map((x) => String(x).trim()).filter(Boolean);
  else if (typeof raw === 'string' && raw.trim()) l = raw.split(',').map((x) => x.trim()).filter(Boolean);
  while (l.length < count) l.push('Branch ' + (l.length + 1));
  return l.slice(0, count);
}

function buildNode(state: FlowState, jid: string, spec: NewNodeSpec): { node: FlowNode; state: FlowState } {
  let nodeSeq = state.nodeSeq;
  let branchSeq = state.branchSeq;
  const type = spec.type;
  const title = (spec.title ?? '').trim() || type.charAt(0).toUpperCase() + type.slice(1);

  const node: FlowNode = { id: `${jid}_node_${nodeSeq++}`, type, title, meta: (spec.meta ?? '').trim() };

  if (type === 'email') {
    node.templateIndex =
      spec.templateIndex != null && !Number.isNaN(Number(spec.templateIndex)) ? Number(spec.templateIndex) : null;
    node.templateCode = spec.templateCode ?? '';
    node.templateName = spec.templateName ?? '';
    node.hasMmsSmsConfig = !!spec.hasMmsSmsConfig;
    node.mmsSmsDeliveryCodes = Array.isArray(spec.mmsSmsDeliveryCodes) ? [...spec.mmsSmsDeliveryCodes] : [];
  }

  if (type === 'split') {
    const requested = Number(spec.branchCount);
    const bc = Number.isFinite(requested) && requested >= MIN_BRANCHES ? Math.min(requested, MAX_BRANCHES) : MIN_BRANCHES;
    const labels = normalizeBranchLabels(spec.branchLabels, bc);
    node.branchCount = bc;
    node.branches = labels.map((label) => ({ id: `${jid}_branch_${branchSeq++}`, label, nodes: [] }));
  }

  return { node, state: { ...state, nodeSeq, branchSeq } };
}

/* ---------- Operazioni pubbliche ---------- */

/** Aggiunge un nodo in coda alla radice o a un branch (anche annidato). */
export function addNode(state: FlowState, jid: string, target: FlowTarget, spec: NewNodeSpec): EditResult {
  return guard(() => {
    if (!jid) fail('INVALID_INPUT', 'journey id mancante');
    if (!spec || !FLOW_NODE_TYPES.includes(spec.type)) fail('INVALID_INPUT', 'tipo di step non valido');
    const seeded = withSeq(state);
    const { node, state: next } = buildNode(seeded, jid, spec);

    if (target.kind === 'root') {
      return { ok: true, id: node.id, state: { ...next, nodes: [...next.nodes, node] } };
    }
    const nodes = updateBranchNodes(next.nodes, target.id, (arr) => [...arr, node]);
    if (!nodes) return fail('TARGET_NOT_FOUND', `branch ${target.id} non trovato`);
    return { ok: true, id: node.id, state: { ...next, nodes } };
  });
}

/** Aggiunge un divider ("Phase") in coda alla radice, con la stessa forma di createDivider in flow.ts. */
export function addDivider(state: FlowState, jid: string, name?: string): EditResult {
  return guard(() => {
    if (!jid) fail('INVALID_INPUT', 'journey id mancante');
    const seeded = withSeq(state);
    const d: FlowNode = {
      id: `${jid}_divider_${seeded.nodeSeq}`,
      type: 'entry',
      title: '',
      meta: '',
      isDivider: true,
      name: (name ?? '').trim() || 'Phase',
    };
    return { ok: true, id: d.id, state: { ...seeded, nodeSeq: seeded.nodeSeq + 1, nodes: [...seeded.nodes, d] } };
  });
}

/**
 * Rimuove un nodo o un divider (a qualsiasi profondita').
 * Se e' uno split elimina anche tutti i suoi branch e i discendenti: removedIds li elenca.
 */
export function removeItem(state: FlowState, id: string): EditResult {
  return guard(() => {
    const target = findItem(state.nodes, id);
    if (!target) return fail('ITEM_NOT_FOUND', `elemento ${id} non trovato`);
    const nodes = removeFromItems(state.nodes, id);
    if (!nodes) return fail('ITEM_NOT_FOUND', `elemento ${id} non trovato`);
    return { ok: true, state: { ...state, nodes }, removedIds: collectIds([target]) };
  });
}

/**
 * Rimuove un branch con tutto il suo contenuto (anche altri split).
 * Regola: uno split ha almeno MIN_BRANCHES (2) branch; con 2 branch l'operazione e' rifiutata
 * (MIN_BRANCHES) e va rimosso l'intero split con removeItem.
 */
export function removeBranch(state: FlowState, branchId: string): EditResult {
  return guard(() => {
    const branch = findBranch(state.nodes, branchId);
    if (!branch) return fail('BRANCH_NOT_FOUND', `branch ${branchId} non trovato`);
    const nodes = updateSplit(
      state.nodes,
      (s) => (s.branches ?? []).some((b) => b.id === branchId),
      (s) => {
        const branches = s.branches ?? [];
        if (branches.length <= MIN_BRANCHES)
          return fail('MIN_BRANCHES', `uno split richiede almeno ${MIN_BRANCHES} branch: rimuovi l'intero split`);
        const remaining = branches.filter((b) => b.id !== branchId);
        return { ...s, branches: remaining, branchCount: remaining.length };
      },
    );
    if (!nodes) return fail('BRANCH_NOT_FOUND', `branch ${branchId} non trovato`);
    return { ok: true, state: { ...state, nodes }, removedIds: [branch.id, ...collectIds(branch.nodes ?? [])] };
  });
}

/** Aggiunge un branch vuoto a uno split esistente (max MAX_BRANCHES). */
export function addBranch(state: FlowState, jid: string, splitId: string, label?: string): EditResult {
  return guard(() => {
    if (!jid) fail('INVALID_INPUT', 'journey id mancante');
    const seeded = withSeq(state);
    const found = findItem(seeded.nodes, splitId);
    if (!found || !isSplit(found)) return fail('SPLIT_NOT_FOUND', `split ${splitId} non trovato`);
    let newId = '';
    const nodes = updateSplit(
      seeded.nodes,
      (s) => s.id === splitId,
      (s) => {
        const branches = s.branches ?? [];
        if (branches.length >= MAX_BRANCHES) return fail('MAX_BRANCHES', `uno split ammette al massimo ${MAX_BRANCHES} branch`);
        const labels = new Set(branches.map((b) => b.label));
        let n = branches.length + 1;
        while (labels.has('Branch ' + n)) n++;
        newId = `${jid}_branch_${seeded.branchSeq}`;
        const nb: FlowBranch = { id: newId, label: (label ?? '').trim() || 'Branch ' + n, nodes: [] };
        return { ...s, branches: [...branches, nb], branchCount: branches.length + 1 };
      },
    );
    if (!nodes) return fail('SPLIT_NOT_FOUND', `split ${splitId} non trovato`);
    return { ok: true, id: newId, state: { ...seeded, branchSeq: seeded.branchSeq + 1, nodes } };
  });
}
