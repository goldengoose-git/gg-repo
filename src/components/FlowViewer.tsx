'use client';

// Flow Viewer (sola lettura) — porting di renderFlow / renderFlowSequence /
// renderNodeCard / renderSplitBranches di 04-jsflow.js, in React ricorsivo.
// FASE 1: solo visualizzazione. L'editing arriva nelle fasi successive.
import type { FlowNode, FlowBranch } from '@/lib/types';

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

function NodeCard({ node }: { node: FlowNode }) {
  if (node.isDivider) {
    return (
      <div className="flow-divider">
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
        <div className={`flow-node is-${node.type}`}>
          <div className={`flow-node-icon ${node.type}`}>{icons[node.type] || icons.exit}</div>
          <div className="flow-node-title">{node.title}</div>
        </div>
        {sub && <div className="flow-node-sub">{sub}</div>}
        {hasMms && <div className="flow-node-hint">MMS/SMS: {node.mmsSmsDeliveryCodes!.join(', ')}</div>}
      </div>

      {node.type === 'split' && node.branches && <SplitBranches branches={node.branches} count={node.branchCount || 2} />}
    </div>
  );
}

function SplitBranches({ branches, count }: { branches: FlowBranch[]; count: number }) {
  return (
    <div className="flow-split">
      <div className={`flow-branch-grid cols-${Math.min(count, 5)}`}>
        {branches.map((b) => (
          <div className="flow-branch" key={b.id}>
            <div className="flow-branch-label">{b.label || 'Branch'}</div>
            {b.nodes.length ? (
              <Sequence nodes={b.nodes} />
            ) : (
              <div className="flow-empty-branch">No steps</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Sequence({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="flow-seq">
      {nodes.map((n, i) => (
        <div key={n.id} style={{ display: 'contents' }}>
          {i > 0 && <Connector />}
          <NodeCard node={n} />
        </div>
      ))}
    </div>
  );
}

export default function FlowViewer({ nodes }: { nodes: FlowNode[] }) {
  if (!nodes.length) {
    return <div className="flow-empty">Nessuno step nel flusso di questo journey.</div>;
  }
  return (
    <div className="flow-canvas">
      <Sequence nodes={nodes} />
    </div>
  );
}
