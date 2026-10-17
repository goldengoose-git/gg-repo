'use client';

// Fase D — porting di 06-jsanim.js: loader, intro mosaic (GSAP), sfondo Three.js,
// smooth-scroll Lenis, cursore custom dot+ring. Carica le lib da CDN come l'originale.
// Overlay a schermo intero sopra l'app; esce con scroll / click / "Explore Collection".
import { useEffect } from 'react';

const GG_LOGO = 'https://www.goldengoose.com/on/demandware.static/Sites-ggdb-emea-Site/-/default/dw0550352e/images/logo.svg';
const PWC_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/PwC_2025_Logo.svg/120px-PwC_2025_Logo.svg.png';

type Img = { src: string; name: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { gsap?: any; THREE?: any; Lenis?: any; __introfxDone?: boolean; }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // non bloccare: fallback senza animazioni
    document.head.appendChild(s);
  });
}

function escAttr(s: string) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function escHtml(s: string) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export default function IntroFx({ images, count }: { images: Img[]; count: number }) {
  useEffect(() => {
    if (window.__introfxDone) {
      const o = document.getElementById('intro-mosaic'); if (o) o.style.display = 'none';
      const l = document.getElementById('loader'); if (l) l.style.display = 'none';
      return;
    }
    let exited = false;
    let lenis: any = null;

    const forceHide = () => {
      const l = document.getElementById('loader'); if (l) l.style.display = 'none';
      const m = document.getElementById('intro-mosaic'); if (m) m.style.display = 'none';
      window.__introfxDone = true;
    };
    // Sicurezza: se qualcosa va storto, l'app non resta mai dietro il nero.
    const safety = setTimeout(forceHide, 7000);

    /* ---- cursore custom (dot + ring) ---- */
    function initCursor() {
      if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const dot = document.getElementById('cursorDot');
      const ring = document.getElementById('cursorRing');
      if (!dot || !ring) return;
      document.documentElement.classList.add('repo-custom-cursor');
      let tx = window.innerWidth / 2, ty = window.innerHeight / 2, dx = tx, dy = ty, rx = tx, ry = ty, visible = false;
      const hoverSel = 'a,button,input,select,textarea,.toggle-btn,.mosaic-tile,.cj-grid-tile,.home-hub-card,.flow-node,.flow-node-mini,.card-row,.logout-btn,.intro-enter-btn,[data-cursor-hover]';
      const inputSel = 'input,textarea,select,[contenteditable="true"]';
      const show = () => { if (visible) return; visible = true; dot.classList.add('visible'); ring.classList.add('visible'); };
      const setHover = (a: boolean) => { ring.classList.toggle('hover', a); dot.classList.toggle('hover', a); };
      const setInput = (a: boolean) => {
        dot.classList.toggle('hidden-on-input', a); ring.classList.toggle('hidden-on-input', a);
        document.documentElement.classList.toggle('repo-custom-cursor', !a);
      };
      document.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; setInput(!!(e.target as Element)?.closest?.(inputSel)); show(); }, { passive: true });
      document.addEventListener('pointerover', (e) => { const t = e.target as Element; if (t?.closest?.(inputSel)) { setInput(true); return; } if (t?.closest?.(hoverSel)) setHover(true); }, { passive: true });
      document.addEventListener('pointerout', (e) => { const t = e.target as Element; const rel = (e as any).relatedTarget as Element; if (t?.closest?.(hoverSel) && !rel?.closest?.(hoverSel)) setHover(false); }, { passive: true });
      document.addEventListener('pointerdown', () => ring.classList.add('clicking'), { passive: true });
      document.addEventListener('pointerup', () => ring.classList.remove('clicking'), { passive: true });
      (function raf() { dx += (tx - dx) * 0.42; dy += (ty - dy) * 0.42; rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; dot.style.transform = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`; ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`; requestAnimationFrame(raf); })();
    }

    /* ---- sfondo Three.js (particelle oro) ---- */
    function initThree() {
      const THREE = window.THREE; if (!THREE) return;
      try {
        const c = document.getElementById('three-bg') as HTMLCanvasElement;
        const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
        r.setSize(window.innerWidth, window.innerHeight); r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const s = new THREE.Scene(), cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); cam.position.z = 5;
        const n = 400, p = new Float32Array(n * 3), v: any[] = [];
        for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 15; p[i * 3 + 1] = (Math.random() - 0.5) * 15; p[i * 3 + 2] = (Math.random() - 0.5) * 15; v.push({ x: (Math.random() - 0.5) * 0.004, y: (Math.random() - 0.5) * 0.004, z: (Math.random() - 0.5) * 0.004 }); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
        const m = new THREE.PointsMaterial({ color: 0xc9a96e, size: 0.03, transparent: true, opacity: 0.5, sizeAttenuation: true });
        const pts = new THREE.Points(g, m); s.add(pts);
        (function a() { requestAnimationFrame(a); const pos = g.attributes.position.array; for (let i = 0; i < n; i++) { pos[i * 3] += v[i].x; pos[i * 3 + 1] += v[i].y; pos[i * 3 + 2] += v[i].z; if (Math.abs(pos[i * 3]) > 7.5) pos[i * 3] *= -0.95; if (Math.abs(pos[i * 3 + 1]) > 7.5) pos[i * 3 + 1] *= -0.95; if (Math.abs(pos[i * 3 + 2]) > 7.5) pos[i * 3 + 2] *= -0.95; } g.attributes.position.needsUpdate = true; pts.rotation.y += 0.0003; pts.rotation.x += 0.0001; r.render(s, cam); })();
        window.addEventListener('resize', () => { cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); r.setSize(window.innerWidth, window.innerHeight); });
      } catch { /* no-op */ }
    }

    /* ---- smooth scroll ---- */
    function initLenis() {
      const Lenis = window.Lenis; if (!Lenis) return;
      lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, syncTouch: false });
      (function raf(time: number) { if (lenis) lenis.raf(time); requestAnimationFrame(raf); })(0 as any);
    }

    /* ---- loader percentuale ---- */
    function animateLoaderPct() {
      const el = document.getElementById('loaderPercentage'); if (!el) return; let c = 0;
      const iv = setInterval(() => { c += Math.floor(Math.random() * 8) + 2; if (c > 100) c = 100; el.textContent = c + '%'; if (c >= 100) clearInterval(iv); }, 30);
    }

    /* ---- mosaico intro ---- */
    function buildMosaic(): HTMLElement[] {
      const grid = document.getElementById('mosaic-grid'); if (!grid) return [];
      const vw = window.innerWidth, vh = window.innerHeight, tw = vw < 768 ? 120 : 180;
      const cols = Math.max(3, Math.round(vw / tw)), rows = Math.max(2, Math.round(vh / (tw * 1.25))), total = cols * rows;
      grid.style.gridTemplateColumns = `repeat(${cols},1fr)`; grid.style.gridTemplateRows = `repeat(${rows},1fr)`;
      const pool = images.filter((t) => t.src && t.src.trim() !== '');
      if (!pool.length) return [];
      const tiles: HTMLElement[] = [];
      for (let i = 0; i < total; i++) {
        const item = pool[i % pool.length];
        const tile = document.createElement('div');
        tile.className = 'mosaic-tile';
        tile.innerHTML = `<img src="${escAttr(item.src)}" alt="${escAttr(item.name)}" loading="eager"><div class="tile-label">${escHtml(item.name)}</div>`;
        grid.appendChild(tile); tiles.push(tile);
      }
      return tiles;
    }

    function animateIntro(tiles: HTMLElement[]) {
      const gsap = window.gsap; if (!gsap || !tiles.length) return;
      const tl = gsap.timeline(); const sl = document.getElementById('scanline');
      tl.set(sl, { top: 0, opacity: 1 }).to(sl, { top: '100%', duration: 0.6, ease: 'power1.inOut', onComplete: () => { if (sl) sl.style.opacity = '0'; } }, 0);
      tl.to(tiles, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: { amount: 1.1, from: 'start', grid: 'auto' } }, 0.2);
      tl.to('.mosaic-tile img', { scale: 1, duration: 6, ease: 'none', stagger: { amount: 2, from: 'random' } }, 0.5);
      tl.to('#intro-logo', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 1.4);
      tl.to('#intro-pwc-badge', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 1.75);
      tl.to('#intro-tagline', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 2.1);
      tl.add(() => { const el = document.getElementById('intro-count'); if (!el) return; el.style.opacity = '1'; let c = 0; const tot = count || 1; const iv = setInterval(() => { c++; el.textContent = c + ' templates in library'; if (c >= tot) clearInterval(iv); }, 800 / tot); }, 2.5);
      tl.to('#intro-progress-bar', { width: '100%', duration: 1, ease: 'power2.inOut' }, 2.6);
      tl.add(() => { const w = document.getElementById('intro-cta-wrap'); if (w) w.classList.add('visible'); }, 3.6);
    }

    function exitIntro() {
      if (exited) return; exited = true; window.__introfxDone = true;
      const gsap = window.gsap; const m = document.getElementById('intro-mosaic');
      if (lenis) lenis.stop();
      if (gsap && m) {
        gsap.to('#intro-mosaic', { yPercent: -100, duration: 1.2, ease: 'power4.inOut', onComplete: () => { if (m) m.style.display = 'none'; if (lenis) lenis.start(); } });
      } else if (m) { m.style.display = 'none'; }
    }

    function bindScrollToEnter() {
      const el = document.getElementById('intro-mosaic'); if (!el) return; let tr = false; let sY = 0;
      el.addEventListener('wheel', (e) => { if (tr || (e as WheelEvent).deltaY <= 0) return; tr = true; exitIntro(); }, { passive: true });
      el.addEventListener('touchstart', (e) => { sY = (e as TouchEvent).touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', (e) => { if (tr) return; if (sY - (e as TouchEvent).changedTouches[0].clientY > 40) { tr = true; exitIntro(); } }, { passive: true });
      const btn = document.getElementById('introEnterBtn'); if (btn) btn.addEventListener('click', exitIntro);
    }

    // page-progress su scroll
    const onScroll = () => { const bar = document.getElementById('page-progress'); if (!bar) return; const h = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%'; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const libs = [
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js',
    ];
    Promise.all(libs.map(loadScript)).then(() => {
      initCursor();
      initThree();
      animateLoaderPct();
      const gsap = window.gsap;
      if (gsap) gsap.to('#loaderLogo', { opacity: 1, duration: 0.6, delay: 0.2 });
      setTimeout(() => {
        const finish = () => {
          const l = document.getElementById('loader'); if (l) l.style.display = 'none';
          const m = document.getElementById('intro-mosaic');
          if (m) { m.style.display = 'flex'; const tiles = buildMosaic(); animateIntro(tiles); bindScrollToEnter(); initLenis(); }
          if (!m || !window.gsap) forceHide();
        };
        if (gsap) gsap.to('#loader', { opacity: 0, duration: 0.6, onComplete: finish });
        else finish();
      }, 2200);
    });

    return () => { clearTimeout(safety); window.removeEventListener('scroll', onScroll); };
  }, [images, count]);

  return (
    <>
      <div id="page-progress" />
      <div className="cursor-dot" id="cursorDot" />
      <div className="cursor-ring" id="cursorRing" />
      <canvas id="three-bg" />

      <div id="loader">
        <div className="loader-ring" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="loaderLogo" src={PWC_LOGO} alt="PwC" />
        <div className="loader-bar-container"><div className="loader-bar-fill" /></div>
        <div className="loader-text">Loading Repository</div>
        <div className="loader-percentage" id="loaderPercentage">0%</div>
      </div>

      <div id="intro-mosaic">
        <div id="mosaic-grid" />
        <div className="mosaic-scanline" id="scanline" />
        <div id="intro-overlay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="intro-logo" src={GG_LOGO} alt="Golden Goose" />
          <div id="intro-pwc-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PWC_LOGO} alt="PwC" />
            <div className="badge-sep" />
            <div className="badge-text">Marketing Cloud<br />CJ Repository</div>
          </div>
          <div id="intro-tagline">Asset Repository &amp; Journey Library</div>
          <div id="intro-count" />
        </div>
        <div id="intro-progress-bar" />
        <div id="intro-cta-wrap">
          <button className="intro-enter-btn" id="introEnterBtn" type="button">Explore Collection</button>
          <span className="intro-scroll-hint">&#x2193; scroll to enter</span>
        </div>
      </div>
    </>
  );
}
