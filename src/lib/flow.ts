// Costruzione dell'albero del flusso — porting di createFlowState /
// hydrateFlowState / createFlowNodesFromDefinition da 04-jsflow.js.
// Prende una definizione (da default_flow_json o flow_view_json) e produce
// uno stato ad albero con id univoci. Pura logica, nessun DOM.
import type { FlowState, FlowNode, FlowBranch, FlowNodeType } from './types';

interface Seq { nodeSeq: number; branchSeq: number; }

function normalizeBranchLabels(raw: string | undefined, count: number): string[] {
  let l: string[] = [];
  if (typeof raw === 'string' && raw.trim()) {
    l = raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
  while (l.length < count) l.push('Branch ' + (l.length + 1));
  return l.slice(0, count);
}

function createDivider(seq: Seq, jid: string, name?: string): FlowNode {
  return { id: `${jid}_divider_${seq.nodeSeq++}`, type: 'entry', title: '', meta: '', isDivider: true, name: name || 'Phase' };
}

function createNode(
  seq: Seq, jid: string, type: FlowNodeType, title: string, meta: string, opts: any
): FlowNode {
  const n: FlowNode = { id: `${jid}_node_${seq.nodeSeq++}`, type, title: title || '', meta: meta || '' };
  if (type === 'email') {
    n.templateIndex = opts?.templateIndex != null && !isNaN(opts.templateIndex) ? Number(opts.templateIndex) : null;
    n.templateCode = opts?.templateCode || '';
    n.templateName = opts?.templateName || '';
    n.hasMmsSmsConfig = !!opts?.hasMmsSmsConfig;
    n.mmsSmsDeliveryCodes = Array.isArray(opts?.mmsSmsDeliveryCodes) ? opts.mmsSmsDeliveryCodes : [];
  }
  if (type === 'split') {
    const bc = opts?.branchCount >= 2 ? Math.min(Number(opts.branchCount), 5) : 2;
    const labels = normalizeBranchLabels(opts?.branchLabels, bc);
    n.branchCount = bc;
    n.branches = labels.map((l) => ({ id: `${jid}_branch_${seq.branchSeq++}`, label: l, nodes: [] }));
  }
  return n;
}

function fromDefinition(seq: Seq, jid: string, steps: any[]): FlowNode[] {
  const out: FlowNode[] = [];
  steps = steps || [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i] || {};
    if (s.isDivider) { out.push(createDivider(seq, jid, s.name)); continue; }

    const sd: any[] | null = Array.isArray(s.branches) ? s.branches : null;
    const n = createNode(seq, jid, s.type, s.title, s.meta || '', {
      branchCount: sd && sd.length ? sd.length : (s.branchCount || 2),
      branchLabels: sd && sd.length ? sd.map((b: any) => b.label || '').join(',') : (s.branchLabels || ''),
      templateIndex: s.templateIndex,
      templateCode: s.templateCode,
      templateName: s.templateName,
      hasMmsSmsConfig: s.hasMmsSmsConfig,
      mmsSmsDeliveryCodes: s.mmsSmsDeliveryCodes || [],
    });

    if (s.type === 'split') {
      if (sd && sd.length && n.branches) {
        n.branches.forEach((branch: FlowBranch, idx: number) => {
          const def = sd[idx] || {};
          branch.label = def.label || branch.label;
          branch.nodes = fromDefinition(seq, jid, def.nodes || []);
        });
        out.push(n);
        continue;
      }
      // split "implicito": i nodi successivi finiscono nel primo branch
      if (i < steps.length - 1 && n.branches) {
        n.branches[0].nodes = fromDefinition(seq, jid, steps.slice(i + 1));
        out.push(n);
        break;
      }
    }
    out.push(n);
  }
  return out;
}

export function createFlowState(def: any[], jid: string): FlowState {
  const seq: Seq = { nodeSeq: 1, branchSeq: 1 };
  const nodes = fromDefinition(seq, jid, def || []);
  return { version: 1, nodeSeq: seq.nodeSeq, branchSeq: seq.branchSeq, nodes };
}

// Se l'input è già uno stato {nodes,...} lo riusa; altrimenti lo costruisce.
export function hydrateFlowState(input: any, jid: string): FlowState {
  if (input && typeof input === 'object' && !Array.isArray(input) && Array.isArray(input.nodes)) {
    return {
      version: input.version || 1,
      nodeSeq: input.nodeSeq || 1,
      branchSeq: input.branchSeq || 1,
      nodes: input.nodes || [],
    };
  }
  return createFlowState(Array.isArray(input) ? input : [], jid);
}
