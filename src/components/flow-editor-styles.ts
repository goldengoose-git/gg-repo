// Stili del Flow Editor (Fase 2). Iniettati da <FlowEditor> via <style>, cosi' non serve toccare globals.css.
// Quando vorrai, spostali in globals.css e rimuovi l'iniezione. Le var(--x, fallback) usano i token del progetto se esistono.
export const FLOW_EDITOR_CSS = `
.fe-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 14px}
.fe-toolbar-spacer{flex:1}
.fe-btn{font:inherit;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;padding:7px 12px;border:1px solid var(--border, #cfcfcf);background:var(--bg, #fff);color:var(--text, #111);border-radius:2px}
.fe-btn:hover:not(:disabled){background:var(--text, #111);color:var(--bg, #fff)}
.fe-btn:disabled{opacity:.35;cursor:not-allowed}
.fe-btn-primary{background:var(--text, #111);color:var(--bg, #fff)}
.fe-btn-primary:hover:not(:disabled){opacity:.85}
.fe-btn-danger:hover:not(:disabled){background:#b3261e;border-color:#b3261e;color:#fff}
.fe-btn-sm{padding:4px 8px;font-size:.65rem}
.fe-dirty{font-size:.72rem;color:#9a6700;background:#fff8e1;border:1px solid #f0d58a;padding:5px 10px;border-radius:2px}
.fe-clean{font-size:.72rem;color:var(--text-sub, #777)}
.fe-error{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.78rem;color:#b3261e;background:#fdecea;border:1px solid #f5c2bd;padding:8px 12px;margin:0 0 12px;border-radius:2px}
.fe-error button{background:none;border:0;cursor:pointer;color:inherit;font-size:1rem;line-height:1}
.fe-editable{position:relative}
.fe-remove{position:absolute;top:2px;right:2px;width:18px;height:18px;line-height:16px;padding:0;text-align:center;border:0;border-radius:50%;background:rgba(0,0,0,.12);color:inherit;font-size:13px;cursor:pointer;opacity:.0;transition:opacity .15s}
.fe-editable:hover>.fe-remove,.fe-remove:focus{opacity:1}
.fe-remove:hover{background:#b3261e;color:#fff}
@media (hover:none){.fe-remove{opacity:1}}
.fe-add-row{display:flex;justify-content:center;margin:6px 0}
.fe-branch-tools{display:flex;justify-content:center;margin-top:10px}
.fe-branch-remove{margin-left:6px;border:0;background:none;cursor:pointer;color:inherit;opacity:.5;font-size:.9rem;line-height:1}
.fe-branch-remove:hover:not(:disabled){opacity:1;color:#b3261e}
.fe-branch-remove:disabled{opacity:.15;cursor:not-allowed}
.fe-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}
.fe-modal{background:var(--bg, #fff);color:var(--text, #111);width:min(440px,100%);max-height:90vh;overflow:auto;padding:22px;border-radius:3px;box-shadow:0 18px 50px rgba(0,0,0,.3)}
.fe-modal h3{margin:0 0 14px;font-size:.95rem;letter-spacing:.06em;text-transform:uppercase}
.fe-field{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.fe-field label{font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--text-sub, #777)}
.fe-field input,.fe-field select{font:inherit;font-size:.85rem;padding:8px;border:1px solid var(--border, #cfcfcf);background:var(--bg, #fff);color:inherit;border-radius:2px}
.fe-help{font-size:.7rem;color:var(--text-sub, #777)}
.fe-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
`;
