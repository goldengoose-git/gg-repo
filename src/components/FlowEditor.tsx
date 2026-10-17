'use client';

// FlowEditor (Fase 2): toolbar + modali + FlowViewer, tutto con stato SOLO client.
// Nessuna scrittura su DB / localStorage: al ricaricamento si riparte dai dati di Supabase.
// I ruoli diversi da mapeditor/admin vedono il viewer in sola lettura (nessun controllo).
import { useEffect, useMemo, useState } from 'react';
import FlowViewer, { type FlowEditCtx } from './FlowViewer';
import { FLOW_EDITOR_CSS } from './flow-editor-styles';
import { hydrateFlowState } from '@/lib/flow';
import { collectIds, MAX_BRANCHES, type EditResult, type FlowTarget, type NewNodeSpec } from '@/lib/flow-edit';
import type { FlowNode, FlowNodeType } from '@/lib/types';
import { useFlowEditor } from '@/hooks/use-flow-editor';

/** Template collegabili a uno step email (il chiamante li ricava dai template del journey). */
export interface FlowTemplateOption {
  /** indice usato in node.templateIndex (stesso significato dell'originale: posizione in DATA) */
  index: number;
  name: string;
  deliveryCode: string;
  mmsSmsDeliveryCodes?: string[];
}

export interface FlowEditorProps {
  journeyId: string;
  /** quello che prima passavi a hydrateFlowState: flow_view_json (oggetto) oppure default_flow_json (array) */
  flow: unknown;
  /** AppRole dell'utente: 'user' | 'mapeditor' | 'admin' */
  role: string | null | undefined;
  templates?: FlowTemplateOption[];
}

const TYPE_LABELS: Record<FlowNodeType, string> = {
  entry: 'Entry', email: 'Email', delay: 'Delay', split: 'Split', exit: 'Exit',
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fe-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fe-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AddStepModal({
  templates, onSubmit, onClose,
}: {
  templates: FlowTemplateOption[];
  onSubmit: (spec: NewNodeSpec) => EditResult;
  onClose: () => void;
}) {
  const [type, setType] = useState<FlowNodeType>('email');
  const [title, setTitle] = useState('');
  const [meta, setMeta] = useState('');
  const [branchCount, setBranchCount] = useState('2');
  const [labels, setLabels] = useState('');
  const [tpl, setTpl] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const spec: NewNodeSpec = { type, title: title.trim(), meta: meta.trim() };
    if (type === 'split') {
      spec.branchCount = parseInt(branchCount, 10) || 2;
      spec.branchLabels = labels.trim();
    }
    if (type === 'email' && tpl !== '') {
      const t = templates.find((x) => String(x.index) === tpl);
      if (t) {
        spec.templateIndex = t.index;
        spec.templateCode = t.deliveryCode;
        spec.templateName = t.name;
        spec.mmsSmsDeliveryCodes = t.mmsSmsDeliveryCodes ?? [];
        spec.hasMmsSmsConfig = spec.mmsSmsDeliveryCodes.length > 0;
        if (!spec.title) spec.title = t.name;       // come l'originale: titolo = nome template
        if (!spec.meta) spec.meta = t.deliveryCode; // meta = delivery code
      }
    }
    const res = onSubmit(spec);
    if (res.ok) onClose(); else setError(res.message);
  }

  return (
    <Modal title="Aggiungi step" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="fe-field">
          <label htmlFor="fe-type">Tipo</label>
          <select id="fe-type" value={type} onChange={(e) => setType(e.target.value as FlowNodeType)}>
            {(Object.keys(TYPE_LABELS) as FlowNodeType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>

        {type === 'email' && (
          <div className="fe-field">
            <label htmlFor="fe-tpl">Template collegato</label>
            <select id="fe-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)} disabled={!templates.length}>
              {templates.length === 0 ? (
                <option value="">Nessun template collegato a questo journey</option>
              ) : (
                <>
                  <option value="">Nessuno</option>
                  {templates.map((t) => (
                    <option key={t.index} value={t.index}>
                      {t.name} • {t.deliveryCode || '-'}{t.mmsSmsDeliveryCodes?.length ? ' • MMS/SMS' : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        <div className="fe-field">
          <label htmlFor="fe-title">Titolo</label>
          <input id="fe-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={TYPE_LABELS[type]} />
        </div>
        <div className="fe-field">
          <label htmlFor="fe-meta">Meta / descrizione</label>
          <input id="fe-meta" value={meta} onChange={(e) => setMeta(e.target.value)} />
        </div>

        {type === 'split' && (
          <>
            <div className="fe-field">
              <label htmlFor="fe-bc">Numero di branch</label>
              <select id="fe-bc" value={branchCount} onChange={(e) => setBranchCount(e.target.value)}>
                {Array.from({ length: MAX_BRANCHES - 1 }, (_, i) => i + 2).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="fe-field">
              <label htmlFor="fe-bl">Nomi dei branch</label>
              <input id="fe-bl" value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="Es. Yes, No" />
              <span className="fe-help">Separati da virgola. I mancanti diventano &quot;Branch n&quot;.</span>
            </div>
          </>
        )}

        {error && <div className="fe-error" role="alert">{error}</div>}
        <div className="fe-modal-actions">
          <button type="button" className="fe-btn" onClick={onClose}>Annulla</button>
          <button type="submit" className="fe-btn fe-btn-primary">Aggiungi</button>
        </div>
      </form>
    </Modal>
  );
}

function AddPhaseModal({ onSubmit, onClose }: { onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Modal title="Aggiungi fase" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(name.trim()); onClose(); }}>
        <div className="fe-field">
          <label htmlFor="fe-phase">Nome fase</label>
          <input id="fe-phase" value={name} onChange={(e) => setName(e.target.value)} placeholder="Phase" autoFocus />
        </div>
        <div className="fe-modal-actions">
          <button type="button" className="fe-btn" onClick={onClose}>Annulla</button>
          <button type="submit" className="fe-btn fe-btn-primary">Aggiungi</button>
        </div>
      </form>
    </Modal>
  );
}

export default function FlowEditor({ journeyId, flow, role, templates = [] }: FlowEditorProps) {
  const initial = useMemo(() => hydrateFlowState(flow, journeyId), [flow, journeyId]);
  const ed = useFlowEditor({ journeyId, initialState: initial, role });
  const [addTarget, setAddTarget] = useState<FlowTarget | null>(null);
  const [phaseOpen, setPhaseOpen] = useState(false);

  // Sola lettura: identico alla Fase 1.
  if (!ed.canEdit) return <FlowViewer nodes={ed.state.nodes} />;

  const ctx: FlowEditCtx = {
    addStep: (t) => setAddTarget(t),
    addBranch: (split) => { ed.addBranch(split.id); },
    removeItem: (node) => {
      const inner = collectIds([node]).length - 1;
      const what = node.isDivider ? `la fase "${node.name ?? ''}"` : `lo step "${node.title}"`;
      const msg = inner > 0
        ? `Rimuovere ${what}? Verranno eliminati anche ${inner} elementi contenuti (branch e step).`
        : `Rimuovere ${what}?`;
      if (inner === 0 || window.confirm(msg)) ed.removeItem(node.id);
    },
    removeBranch: (_split, branch) => {
      const inner = collectIds(branch.nodes).length;
      const msg = `Rimuovere il branch "${branch.label}"? Verranno eliminati anche ${inner} elementi contenuti.`;
      if (inner === 0 || window.confirm(msg)) ed.removeBranch(branch.id);
    },
  };

  return (
    <div className="fe-root">
      <style>{FLOW_EDITOR_CSS}</style>

      <div className="fe-toolbar">
        <button type="button" className="fe-btn" onClick={() => setPhaseOpen(true)}>+ Phase</button>
        <button type="button" className="fe-btn" onClick={ed.undo} disabled={!ed.canUndo} title="Annulla ultima operazione">Undo</button>
        <button type="button" className="fe-btn" onClick={ed.redo} disabled={!ed.canRedo} title="Ripristina">Redo</button>
        <button
          type="button"
          className="fe-btn fe-btn-danger"
          disabled={!ed.dirty}
          onClick={() => { if (window.confirm('Annullare tutte le modifiche non salvate?')) ed.reset(); }}
        >
          Annulla modifiche
        </button>
        <span className="fe-toolbar-spacer" />
        {ed.dirty
          ? <span className="fe-dirty" role="status">Modifiche non salvate — solo in questa pagina, il salvataggio arriva con la Fase 3</span>
          : <span className="fe-clean">Nessuna modifica</span>}
      </div>

      {ed.lastError && (
        <div className="fe-error" role="alert">
          <span>{ed.lastError.message}</span>
          <button type="button" aria-label="Chiudi" onClick={ed.clearError}>&times;</button>
        </div>
      )}

      <FlowViewer nodes={ed.state.nodes} edit={ctx} />

      {addTarget && (
        <AddStepModal
          templates={templates}
          onSubmit={(spec) => ed.addNode(addTarget, spec)}
          onClose={() => setAddTarget(null)}
        />
      )}
      {phaseOpen && <AddPhaseModal onSubmit={(n) => ed.addDivider(n)} onClose={() => setPhaseOpen(false)} />}
    </div>
  );
}
