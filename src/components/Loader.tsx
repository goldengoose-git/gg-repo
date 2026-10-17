'use client';

// Loader iniziale (ex #loader + skeleton della vecchia pagina, semplificato).
// Mostra un anello che gira e una percentuale animata, poi svanisce.
import { useEffect, useState } from 'react';

export default function Loader() {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setPct((p) => {
        const next = Math.min(100, p + Math.floor(Math.random() * 8) + 4);
        if (next >= 100) clearInterval(iv);
        return next;
      });
    }, 60);
    const t = setTimeout(() => setGone(true), 1200);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, []);

  if (gone) return null;

  return (
    <div className={`gg-loader${pct >= 100 ? ' fade' : ''}`}>
      <div className="gg-loader-ring" />
      <div className="gg-loader-title">Customer Journey <em>Library</em></div>
      <div className="gg-loader-pct">{pct}%</div>
    </div>
  );
}
