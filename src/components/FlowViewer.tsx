'use client';

// Flow Viewer — porting di renderFlow / renderFlowSequence / renderNodeCard / renderSplitBranches
// di 04-jsflow.js, in React ricorsivo.
// FASE 1: visualizzazione (invariata). FASE 2: se si passa `edit` compaiono i controlli
// (+ Step, x su nodi/divider, x sul branch, + Branch). Senza `edit` il rendering e' quello di prima.
import type { FlowNode, FlowBranch } from '@/lib/types';
import { MAX_BRANCHES, MIN_BRANCHES, type FlowTarget } from '@/lib/flow-edit';

/** Azioni di editing: le fornisce <FlowEditor>. Il viewer resta puramente presentazionale. */
export interface FlowEditCtx {
  addStep(target: FlowTarget): void;
  removeItem(node: FlowNode): void;
  removeBranch(split: FlowNode, branch: FlowBranch): void;
  addBranch(split: FlowNode): void;
}

const icons: Record<string, React.ReactNode> = {
  entry: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><polyline points="12 8 16 12 12 16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  email: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><polyline points="22,6 12,13 2,6" /></svg>,
  delay: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>,
  split: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4" /><path d="M12 11l-7 6" /><path d="M12 11l7 6" /></svg>,
  exit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>,
};

const Connector = () => (
  <div className="flow-connector">
    <svg viewBox="0 0 20 12"><line x1="0" y1="6" x2="14" y2="6" /><polygon points="14,2 20,6 14,10" /></svg>
  </div>
);

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="fe-remove"
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      &times;
    </button>
  );
}

function NodeCard({ node, edit }: { node: FlowNode; edit?: FlowEditCtx }) {
  if (node.isDivider) {
    return (
      <div className={`flow-divider${edit ? ' fe-editable' : ''}`} data-divider-id={node.id}>
        {edit && <RemoveButton label={`Rimuovi fase ${node.name ?? ''}`.trim()} onClick={() => edit.removeItem(node)} />}
        <div className="flow-divider-label">Phase</div>
        <div className="flow-divider-name">{node.name}</div>
      </div>
    );
  }

  const sub = node.type === 'email' ? (node.templateCode || node.title) : node.meta;
  const hasMms = node.hasMmsSmsConfig && (node.mmsSmsDeliveryCodes?.length ?? 0) > 0;

  return (
    <div className="flow-node-block">
      <div className="flow-node-wrap">
        <div className={`flow-node is-${node.type}${edit ? ' fe-editable' : ''}`} data-node-id={node.id}>
          {edit && <RemoveButton label={`Rimuovi step ${node.title}`} onClick={() => edit.removeItem(node)} />}
          <div className={`flow-node-icon ${node.type}`}>{icons[node.type] || icons.exit}</div>
          <div className="flow-node-title">{node.title}</div>
        </div>
        {sub && <div className="flow-node-sub">{sub}</div>}
        {hasMms && <div className="flow-node-hint">MMS/SMS: {node.mmsSmsDeliveryCodes!.join(', ')}</div>}
      </div>

      {node.type === 'split' && node.branches && <SplitBranches split={node} edit={edit} />}
    </div>
  );
}

function SplitBranches({ split, edit }: { split: FlowNode; edit?: FlowEditCtx }) {
  const branches = split.branches ?? [];
  const count = branches.length || split.branchCount || 2;
  const canRemoveBranch = branches.length > MIN_BRANCHES;
  return (
    <div className="flow-split">
      <div className={`flow-branch-grid cols-${Math.min(count, 5)}`}>
        {branches.map((b) => (
          <div className="flow-branch" key={b.id} data-branch-id={b.id}>
            <div className="flow-branch-label">
              {b.label || 'Branch'}
              {edit && (
                <button
                  type="button"
                  className="fe-branch-remove"
                  disabled={!canRemoveBranch}
                  aria-label={`Rimuovi branch ${b.label}`}
                  title={canRemoveBranch ? `Rimuovi branch ${b.label}` : `Uno split richiede almeno ${MIN_BRANCHES} branch: rimuovi l'intero step split`}
                  onClick={() => edit.removeBranch(split, b)}
                >
                  &times;
                </button>
              )}
            </div>
            {b.nodes.length ? (
              <Sequence nodes={b.nodes} target={edit ? { kind: 'branch', id: b.id } : undefined} edit={edit} />
            ) : (
              <>
                <div className="flow-empty-branch">No steps</div>
                {edit && <Sequence nodes={[]} target={{ kind: 'branch', id: b.id }} edit={edit} />}
              </>
            )}
          </div>
        ))}
      </div>
      {edit && (
        <div className="fe-branch-tools">
          <button
            type="button"
            className="fe-btn fe-btn-sm"
            disabled={branches.length >= MAX_BRANCHES}
            title={branches.length >= MAX_BRANCHES ? `Massimo ${MAX_BRANCHES} branch` : 'Aggiungi un branch'}
            onClick={() => edit.addBranch(split)}
          >
            + Branch
          </button>
        </div>
      )}
    </div>
  );
}

function Sequence({ nodes, target, edit }: { nodes: FlowNode[]; target?: FlowTarget; edit?: FlowEditCtx }) {
  return (
    <div className="flow-seq">
      {nodes.map((n, i) => (
        <div key={n.id} style={{ display: 'contents' }}>
          {i > 0 && <Connector />}
          <NodeCard node={n} edit={edit} />
        </div>
      ))}
      {edit && target && (
        <>
          {nodes.length > 0 && <Connector />}
          <div className="fe-add-row">
            <button type="button" className="fe-btn fe-btn-sm" onClick={() => edit.addStep(target)}>+ Step</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function FlowViewer({ nodes, edit }: { nodes: FlowNode[]; edit?: FlowEditCtx }) {
  if (!nodes.length && !edit) {
    return <div className="flow-empty">Nessuno step nel flusso di questo journey.</div>;
  }
  return (
    <div className="flow-canvas">
      {!nodes.length && <div className="flow-empty">Nessuno step nel flusso di questo journey.</div>}
      <Sequence nodes={nodes} target={edit ? { kind: 'root' } : undefined} edit={edit} />
    </div>
  );
}
