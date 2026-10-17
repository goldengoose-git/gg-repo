// CSS dell'area Admin, iniettato da AdminApp (non tocca globals.css).
export const ADMIN_CSS = `
.adm-root { max-width: 860px; margin: 0 auto; padding: 8px 0 48px; }
.adm-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.adm-tab {
  padding: 8px 16px; border: 1px solid #d9d6cf; background: #fff; border-radius: 999px;
  font-size: 13px; cursor: pointer; color: #333; transition: background .15s, color .15s;
}
.adm-tab.active { background: #111; color: #fff; border-color: #111; }
.adm-tab:disabled { opacity: .45; cursor: not-allowed; }

.adm-card {
  background: #fff; border: 1px solid #e7e4dd; border-radius: 14px; padding: 24px 24px 28px;
  box-shadow: 0 1px 2px rgba(0,0,0,.03);
}
.adm-card h2 { margin: 0 0 4px; font-size: 20px; }
.adm-card .adm-sub { margin: 0 0 20px; color: #777; font-size: 13px; }

.adm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; }
.adm-field { display: flex; flex-direction: column; gap: 6px; }
.adm-field.full { grid-column: 1 / -1; }
.adm-field label { font-size: 12px; font-weight: 600; color: #444; letter-spacing: .02em; }
.adm-field .req { color: #c0392b; }
.adm-field input, .adm-field textarea, .adm-field select {
  border: 1px solid #d9d6cf; border-radius: 8px; padding: 9px 11px; font-size: 14px;
  font-family: inherit; background: #fdfdfb; color: #222;
}
.adm-field input:focus, .adm-field textarea:focus, .adm-field select:focus {
  outline: none; border-color: #111; background: #fff;
}
.adm-field textarea { resize: vertical; min-height: 68px; }
.adm-help { font-size: 11px; color: #999; }
.adm-help code { background: #f1efe9; padding: 1px 5px; border-radius: 4px; }

.adm-actions { display: flex; align-items: center; gap: 12px; margin-top: 22px; }
.adm-btn {
  padding: 10px 20px; border-radius: 8px; border: 1px solid #d9d6cf; background: #fff;
  font-size: 14px; cursor: pointer; color: #222;
}
.adm-btn:hover { background: #f6f4ef; }
.adm-btn-primary { background: #111; color: #fff; border-color: #111; }
.adm-btn-primary:hover { background: #333; }
.adm-btn:disabled { opacity: .5; cursor: not-allowed; }

.adm-msg { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-top: 16px; }
.adm-msg.ok { background: #eaf7ee; color: #1e7a3a; border: 1px solid #b7e2c4; }
.adm-msg.err { background: #fdecea; color: #b0281a; border: 1px solid #f5c3bd; }
.adm-msg a { color: inherit; font-weight: 600; text-decoration: underline; }

@media (max-width: 640px) { .adm-grid { grid-template-columns: 1fr; } }
`;
