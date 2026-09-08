/* CLASS 23 — ARTEFACTOS MATERIALES de Memories: PAPEL y TEJIDO.

   No son motores aparte: no tienen store, ni Studio, ni Project State propios. Son un
   TRATAMIENTO de presentación (`item.artifactStyle`) que el restaurante elige y que
   cualquier preset puede pintar sobre el mismo recuerdo, con los mismos datos y la misma
   media.

   Gramática extraída de ThreeUI (MIT © 2026 Meng To) y auditada en
   `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`:

     PAPEL  ← `neuform-isolated/sources/kinetic-lathe-certificate.html`
             la matemática de la roseta —familia de curvas anidadas
             x = cx + A(1−shrink·f)·cos t + d·cos(m·t+φ)— y las bandas guilloché que
             desplazan un contorno por su normal. Grabado a línea fina con tinta de alfa
             bajo, y una fase que deriva: el documento respira.

     TEJIDO ← `neuform-isolated/sources/lumina-weavers-cloth.html`
             el solver Verlet sobre rejilla fijada por arriba, con su función de viento
             y tres iteraciones de relajación de distancias por paso.

   Lo que NO se reutiliza, y es una decisión, no un atajo: **Three.js y WebGL**. El sitio
   no carga Three; añadirlo por un artefacto son ~600 KB de CDN nuevo y un contexto que
   hay que mantener vivo y destruir bien — justo lo que §29 de la misión prohíbe dejar
   huérfano. La misma tela sale en canvas 2D dibujando urdimbre y trama con iluminación
   por normal local: deformación, movimiento, luz y profundidad de verdad, sin caja plana.

   Ciclo de vida (patrón de `Gallery.tsx`): nada corre si el artefacto no es visible o el
   documento está oculto; `destroy()` cancela el rAF, desconecta el observer y suelta el
   canvas. Con reduced-motion se pinta UN fotograma y se para — estado premium estático,
   no una caja vacía.
*/
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* DPR limitado a 2: más resolución no se ve y sí se paga (§30) */
  function fit(canvas, ctx, w, h) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(1, Math.round(w * dpr));
    const H = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
  }

  /* ============================================================
     PAPEL — grabado cinético sobre papel
     ============================================================ */
  function paper(host, {accent = '#b9964f', ink = '#2b2318'} = {}) {
    const canvas = document.createElement('canvas');
    canvas.className = 'mem-artifact-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    const ctx = canvas.getContext('2d');
    let raf = 0, phase = 0, w = 0, h = 0, alive = true;

    const inkColor = alpha => {
      const v = ink.replace('#', '');
      const n = parseInt(v.length === 3 ? v.split('').map(c => c + c).join('') : v, 16);
      return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
    };

    /* la roseta del certificado: n curvas anidadas que giran una respecto a otra */
    function rosette(cx, cy, {A, d, m, n, pts, lw, alpha, shrink = 0.06, dir = 1}) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = inkColor(alpha);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const f = k / n;
        const phi = phase * dir + f * TAU;
        const a = A * (1 - shrink * f);
        for (let i = 0; i <= pts; i++) {
          const t = (i / pts) * TAU;
          const x = cx + a * Math.cos(t) + d * Math.cos(m * t + phi);
          const y = cy + a * Math.sin(t) - d * Math.sin(m * t + phi);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }

    /* banda guilloché: un contorno rectangular desplazado por su propia normal */
    function band(inset, {amp, waves, K, lw, alpha}) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = inkColor(alpha);
      const M = 240;
      const rw = w - inset * 2, rh = h - inset * 2;
      const per = 2 * (rw + rh);
      const at = u => {
        let s = u * per;
        if (s < rw) return [inset + s, inset, 0, -1];
        s -= rw;
        if (s < rh) return [w - inset, inset + s, 1, 0];
        s -= rh;
        if (s < rw) return [w - inset - s, h - inset, 0, 1];
        s -= rw;
        return [inset, h - inset - s, -1, 0];
      };
      ctx.beginPath();
      for (let k = 0; k < K; k++) {
        const ph = phase * 0.6 + (k / K) * TAU;
        for (let i = 0; i <= M; i++) {
          const u = (i % M) / M;
          const [px, py, nx, ny] = at(u);
          const off = amp * Math.sin(waves * u * TAU + ph);
          const x = px + nx * off, y = py + ny * off;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }

    function draw() {
      const rect = host.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w < 4 || h < 4) return;
      fit(canvas, ctx, w, h);
      /* el sello, en la esquina alta: un documento no se centra su propio grabado */
      const cx = w - Math.min(w, h) * 0.26, cy = Math.min(h * 0.34, 150);
      const A = Math.min(w, h) * 0.17;
      rosette(cx, cy, {A, d: A * 0.42, m: 7, n: 16, pts: 220, lw: 0.55, alpha: 0.3});
      rosette(cx, cy, {A: A * 0.56, d: A * 0.2, m: 11, n: 10, pts: 180, lw: 0.5, alpha: 0.22, dir: -1});
      band(14, {amp: 3.2, waves: 26, K: 3, lw: 0.4, alpha: 0.16});
      band(22, {amp: 1.8, waves: 44, K: 2, lw: 0.35, alpha: 0.1});
    }

    let visible = false;
    const tick = () => {
      raf = 0;
      if (!alive) return;
      phase += 0.0022;                 /* deriva lenta: respira, no gira */
      draw();
      schedule();
    };
    const schedule = () => {
      if (!alive || raf || !visible || document.hidden || reduced.matches) return;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { draw(); schedule(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, {threshold: [0, 0.15]});
    io.observe(host);
    const onVis = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else schedule(); };
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => { draw(); });
    ro.observe(host);
    draw();

    return {
      kind: 'paper',
      destroy() {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        canvas.remove();
      }
    };
  }

  /* ============================================================
     TEJIDO — Verlet sobre rejilla, dibujado como urdimbre y trama
     ============================================================ */
  function cloth(host, {accent = '#8d2f2a', warm = '#e8ddc8'} = {}) {
    const canvas = document.createElement('canvas');
    canvas.className = 'mem-artifact-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    const ctx = canvas.getContext('2d');

    /* rejilla modesta a propósito: 18×12 son 234 nodos, suficiente para que la tela se
       lea y barato de resolver 60 veces por segundo */
    const GX = 18, GY = 12;
    const N = (GX + 1) * (GY + 1);
    const idx = (ix, iy) => ix + iy * (GX + 1);
    const cur = new Float32Array(N * 3), prev = new Float32Array(N * 3);
    let w = 0, h = 0, restH = 0, restV = 0, raf = 0, t = 0, alive = true, visible = false;

    function layout() {
      const rect = host.getBoundingClientRect();
      w = rect.width; h = rect.height;
      restH = w / GX; restV = (h * 0.92) / GY;
      for (let iy = 0; iy <= GY; iy++) {
        for (let ix = 0; ix <= GX; ix++) {
          const i = idx(ix, iy) * 3;
          cur[i] = prev[i] = ix * restH;
          cur[i + 1] = prev[i + 1] = iy * restV;
          cur[i + 2] = prev[i + 2] = 0;
        }
      }
    }

    /* el viento del original: viaja hacia abajo y crece hacia el borde libre */
    function wind(ix, iy) {
      const cx = ix / GX, cy = iy / GY;
      const travel = t * 1.7 - cy * 4.2;
      const gust = 0.6 + 0.42 * Math.sin(t * 0.6) + 0.18 * Math.sin(t * 1.9 + 1.3);
      const amp = 4.3 * cy;
      return [
        Math.sin(t * 0.9 + cy * 2.2) * 0.6 * cy,
        -0.4 * cy,
        (Math.sin(travel + cx * 3.3) + 0.5 * Math.sin(travel * 1.7 + cx * 6)) * amp * gust
      ];
    }

    const GRAV = 3.1, DAMP = 0.985, DT = 0.016;

    function solve(a, b, rest) {
      const ax = a * 3, bx = b * 3;
      const dx = cur[bx] - cur[ax], dy = cur[bx + 1] - cur[ax + 1], dz = cur[bx + 2] - cur[ax + 2];
      const len = Math.hypot(dx, dy, dz) || 1e-6;
      const k = ((len - rest) / len) * 0.5;
      const ox = dx * k, oy = dy * k, oz = dz * k;
      /* la fila 0 está fijada: sólo se mueve el nodo libre */
      if (a >= GX + 1) { cur[ax] += ox; cur[ax + 1] += oy; cur[ax + 2] += oz; }
      if (b >= GX + 1) { cur[bx] -= ox; cur[bx + 1] -= oy; cur[bx + 2] -= oz; }
    }

    function step() {
      t += DT;
      for (let iy = 1; iy <= GY; iy++) {
        for (let ix = 0; ix <= GX; ix++) {
          const i = idx(ix, iy) * 3;
          const [fx, fy, fz] = wind(ix, iy);
          const acc = [fx, fy + GRAV, fz];
          for (let k = 0; k < 3; k++) {
            const j = i + k;
            const v = (cur[j] - prev[j]) * DAMP;
            prev[j] = cur[j];
            cur[j] = cur[j] + v + acc[k] * DT * DT * 60;
          }
        }
      }
      for (let it = 0; it < 3; it++) {
        for (let iy = 0; iy <= GY; iy++)
          for (let ix = 0; ix < GX; ix++) solve(idx(ix, iy), idx(ix + 1, iy), restH);
        for (let iy = 0; iy < GY; iy++)
          for (let ix = 0; ix <= GX; ix++) solve(idx(ix, iy), idx(ix, iy + 1), restV);
      }
    }

    /* la profundidad z se convierte en escala y en luz: un hilo que se acerca se ve más
       claro y más ancho. Eso es lo que hace que parezca tela y no una malla. */
    const project = i => {
      const j = i * 3;
      const z = cur[j + 2];
      const k = 1 + z * 0.0016;
      return [w / 2 + (cur[j] - w / 2) * k, cur[j + 1] * k, z];
    };

    function draw() {
      if (w < 4 || h < 4) return;
      fit(canvas, ctx, w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,.28)');

      /* trama (horizontales): el cuerpo de la tela */
      for (let iy = 0; iy <= GY; iy++) {
        ctx.beginPath();
        let light = 0;
        for (let ix = 0; ix <= GX; ix++) {
          const [x, y, z] = project(idx(ix, iy));
          light += z;
          if (ix) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        const l = clamp(0.5 + (light / (GX + 1)) * 0.02, 0.12, 0.95);
        ctx.strokeStyle = `rgba(236,225,203,${(0.16 + l * 0.4).toFixed(3)})`;
        ctx.lineWidth = 0.9 + l * 1.7;
        ctx.stroke();
      }
      /* urdimbre (verticales), en el tono de la casa */
      for (let ix = 0; ix <= GX; ix++) {
        ctx.beginPath();
        let light = 0;
        for (let iy = 0; iy <= GY; iy++) {
          const [x, y, z] = project(idx(ix, iy));
          light += z;
          if (iy) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        const l = clamp(0.5 + (light / (GY + 1)) * 0.02, 0.12, 0.95);
        ctx.strokeStyle = ix % 3 === 0
          ? `rgba(141,47,42,${(0.14 + l * 0.3).toFixed(3)})`
          : `rgba(200,182,150,${(0.06 + l * 0.2).toFixed(3)})`;
        ctx.lineWidth = 0.7 + l * 1.1;
        ctx.stroke();
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    const tick = () => {
      raf = 0;
      if (!alive) return;
      step();
      draw();
      schedule();
    };
    const schedule = () => {
      if (!alive || raf || !visible || document.hidden || reduced.matches) return;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) schedule();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, {threshold: [0, 0.15]});
    io.observe(host);
    const onVis = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else schedule(); };
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => { layout(); draw(); });
    ro.observe(host);

    layout();
    /* con reduced-motion la tela cae y se queda: unos pasos y un fotograma */
    if (reduced.matches) { for (let i = 0; i < 90; i++) step(); }
    draw();

    return {
      kind: 'cloth',
      destroy() {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        canvas.remove();
      }
    };
  }

  const FACTORIES = {paper, cloth};

  window.RestaurantMemoriesArtifacts = Object.freeze({
    create(style, host, options) {
      const factory = FACTORIES[style];
      if (!factory || !host) return null;
      try { return factory(host, options || {}); }
      catch (err) { console.warn('Memories: artefacto no disponible', err); return null; }
    },
    styles: () => Object.keys(FACTORIES)
  });
})();
