/* CLASS 23 — MEMORIES ENGINE. UN motor, tres presentaciones, un archivo vivo.

       modules.memories (Project State)
                 ↓
       RestaurantMemoriesEngine
         ├── cinematic-memory-wall     hero + satélites, coreografía de entrada, parallax
         ├── memory-stack              mazo físico: arrastre, lanzamiento, inercia
         └── editorial-journal         spreads con filmstrip y capas de papel
                 ↓
       MEDIA VIEWER compartido  ·  TRATAMIENTOS (papel / tejido)  ·  STORY GALLERY

   Reescrito tras el rechazo visual. Lo que cambia respecto a la entrega anterior, y por
   qué (referencias auditadas en `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`,
   gramática extraída de ThreeUI, MIT © 2026 Meng To):

   1. **`firstMedia()` ya no existe.** Era el defecto de fondo: un recuerdo con cuatro
      medias enseñaba una y guardaba tres invisibles. Ahora hay UN visor compartido —
      portada + tira navegable— y los cuatro presets lo usan, así que todas las medias
      son alcanzables en todos ellos.
   2. **El Stack pasa de estados discretos a POSICIÓN CONTINUA con física** (Koi Studies
      + Character Filmstrip). `focus` es un flotante que un muelle persigue; el arrastre
      lo mueve con el dedo y al soltar deciden umbral, intención y velocidad. Las clases
      `data-state` de antes son la razón de que no se sintiera físico.
   3. **El vídeo tiene control propio y visible**, delegado en
      `RestaurantMemoriesVideo`: el autoplay es el extra, no la única vía.
   4. **Ciclo de vida disciplinado** (patrón de `Gallery.tsx`): nada corre si la sección
      no es visible o el documento está oculto; al desmontar se cancela y desconecta todo.

   Reglas de la casa que se mantienen intactas:
   · OFF ES OFF — desmontar el nodo ES el teardown.
   · El objeto viajero de Project 09 cruza esta sección: se respeta su contrato de capas
     desde `styles-v23.css`; Project 09 no se toca.
   · NADA INVENTADO: un campo vacío no se pinta.
*/
(() => {
  'use strict';

  const M = () => window.RestaurantMemoriesModel;
  const media = () => window.RestaurantMedia;
  const video = () => window.RestaurantMemoriesVideo;
  const artifacts = () => window.RestaurantMemoriesArtifacts;
  const cfg = () => window.RestaurantStudioConfig;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const has = v => typeof v === 'string' ? v.trim().length > 0 : v != null;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let host = null;                  /* la sección pública; su ausencia ES el OFF */
  let fingerprint = null;
  let sectionIO = null, sectionVisible = false;
  const teardowns = [];             /* todo lo que hay que deshacer al repintar */
  const urlCache = new Map();
  let storyLayer = null, storyReturn = null, storyViewer = null;
  let stack = null;                 /* runtime del Stack; NUNCA en Project State */

  const config = () => M().normalize(cfg()?.get('modules.memories'));
  const items = () => M().visible(config());

  const track = fn => { if (typeof fn === 'function') teardowns.push(fn); };
  function runTeardowns() {
    while (teardowns.length) { try { teardowns.pop()(); } catch {} }
  }

  /* ---------- media: resolución ----------
     Sólo se cachea lo que RESOLVIÓ: cachear el fallo dejaba la ref muerta para siempre y
     un asset recién subido no volvía a intentarse. */
  async function resolveAll(list) {
    for (const item of list) {
      for (const m of item.media || []) {
        if (urlCache.get(m.ref)) continue;
        const url = await media().url(m.ref);
        if (url) urlCache.set(m.ref, url); else urlCache.delete(m.ref);
      }
    }
  }
  const urlOf = m => urlCache.get(m?.ref) || '';
  /* las medias UTILIZABLES de un recuerdo: las que resuelven. Una ref que no resuelve
     —media local de otro ordenador— se salta en silencio en vez de dejar un hueco. */
  const usable = item => (item.media || []).filter(m => urlOf(m));

  const TYPE_LABEL = {
    memory: 'Recuerdo', event: 'Evento', testimonial: 'Testimonio',
    press: 'Prensa', milestone: 'Hito'
  };
  const metaLine = item => [item.date, item.place]
    .map(v => (v || '').trim()).filter(Boolean).join(' · ');

  /* ============================================================
     VISOR DE MEDIA — la pieza que elimina `firstMedia()`
     Portada + tira navegable. Todas las medias del recuerdo son alcanzables, y al
     cambiar de media el vídeo anterior se pausa. Lo usan Wall, Stack, Journal y Story.
     ============================================================ */
  function mediaViewer(item, {strip = 'thumbs', autoplayCover = false, label = ''} = {}) {
    const list = usable(item);
    const wrap = el('div', 'mem-viewer');
    wrap.dataset.memViewer = item.id;
    wrap.dataset.memMediaCount = String(list.length);
    if (!list.length) return {node: wrap, count: 0, setIndex() {}, destroy() {}};

    const frame = el('div', 'mem-frame');
    frame.dataset.memFrame = item.id;
    wrap.append(frame);

    let index = 0;
    const nodes = [];

    /* Todas las medias se montan a la vez y se conmuta la activa: así el cambio es
       instantáneo, el vídeo conserva su posición y el DOM demuestra —para una persona y
       para un test— que el recuerdo tiene más de una media. */
    list.forEach((m, i) => {
      const slot = el('div', 'mem-slot');
      slot.dataset.memSlot = String(i);
      slot.dataset.memMediaRef = m.ref;
      slot.dataset.kind = m.kind;
      const url = urlOf(m);
      if (m.kind === 'video') {
        const v = document.createElement('video');
        v.src = url;
        v.className = 'mem-media mem-media-video';
        v.dataset.memVideo = '1';
        v.dataset.memMediaRef = m.ref;
        v.setAttribute('aria-label', m.alt || label || item.title || 'Vídeo del recuerdo');
        slot.append(v);
        /* el control SIEMPRE, no sólo cuando el autoplay falla */
        const button = el('button', 'mem-play');
        button.type = 'button';
        button.dataset.memPlay = m.ref;
        button.innerHTML = '<span class="mem-play-icon" aria-hidden="true"></span>';
        slot.append(button);
        video().register(v, {wrap: slot, button, autoplay: autoplayCover && i === 0});
        track(() => video().unregister(v));
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = m.alt || '';
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.className = 'mem-media mem-media-image';
        slot.append(img);
      }
      frame.append(slot);
      nodes.push(slot);
    });

    const setIndex = next => {
      const target = clamp(next, 0, list.length - 1);
      if (target === index) return;
      /* pausar lo que se va: la media anterior no sigue sonando detrás */
      video().pauseWithin(nodes[index]);
      index = target;
      paint();
    };

    let thumbs = null, dots = null, counter = null;
    function paint() {
      nodes.forEach((n, i) => {
        n.dataset.active = i === index ? '1' : '0';
        n.querySelectorAll('button').forEach(b => { b.tabIndex = i === index ? 0 : -1; });
      });
      wrap.dataset.memMediaIndex = String(index);
      thumbs?.querySelectorAll('[data-mem-thumb]').forEach((t, i) => {
        t.dataset.current = i === index ? '1' : '0';
        t.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      dots?.querySelectorAll('[data-mem-dot]').forEach((d, i) => {
        d.dataset.current = i === index ? '1' : '0';
      });
      if (counter) counter.textContent = `${index + 1} / ${list.length}`;
    }

    if (list.length > 1) {
      if (strip === 'thumbs' || strip === 'filmstrip') {
        thumbs = el('div', strip === 'filmstrip' ? 'mem-filmstrip' : 'mem-thumbs');
        thumbs.dataset.memStrip = item.id;
        thumbs.setAttribute('role', 'group');
        thumbs.setAttribute('aria-label', `Medias de ${item.title || 'este recuerdo'}`);
        list.forEach((m, i) => {
          const t = el('button', 'mem-thumb');
          t.type = 'button';
          t.dataset.memThumb = String(i);
          t.dataset.kind = m.kind;
          t.setAttribute('aria-label', `${m.kind === 'video' ? 'Vídeo' : 'Imagen'} ${i + 1} de ${list.length}`);
          const url = urlOf(m);
          if (m.kind === 'video') {
            const v = document.createElement('video');
            v.src = url; v.muted = true; v.playsInline = true; v.preload = 'metadata';
            /* un vídeo con `preload=metadata` puede no haber pintado ningún fotograma:
               la miniatura saldría negra. Se busca un instante temprano para que HAYA
               imagen — es el póster que un restaurante no tiene por qué preparar. */
            v.addEventListener('loadedmetadata', () => {
              try { v.currentTime = Math.min(0.12, (v.duration || 1) * 0.06); } catch {}
            }, {once: true});
            t.append(v);
          } else {
            const img = document.createElement('img');
            img.src = url; img.alt = ''; img.loading = 'lazy';
            t.append(img);
          }
          t.addEventListener('click', e => { e.stopPropagation(); setIndex(i); });
          thumbs.append(t);
        });
        wrap.append(thumbs);
      } else if (strip === 'dots') {
        dots = el('div', 'mem-dots');
        dots.dataset.memStrip = item.id;
        list.forEach((m, i) => {
          const d = el('button', 'mem-dot');
          d.type = 'button';
          d.dataset.memDot = String(i);
          d.dataset.kind = m.kind;
          d.setAttribute('aria-label', `Media ${i + 1} de ${list.length}`);
          d.addEventListener('click', e => { e.stopPropagation(); setIndex(i); });
          dots.append(d);
        });
        wrap.append(dots);
      }
      /* anterior/siguiente: la vía de teclado y de quien no ve las miniaturas */
      const nav = el('div', 'mem-viewer-nav');
      const prev = el('button', 'mem-viewer-btn', '‹');
      prev.type = 'button'; prev.dataset.memMediaPrev = item.id;
      prev.setAttribute('aria-label', 'Media anterior');
      prev.addEventListener('click', e => { e.stopPropagation(); setIndex(index - 1); });
      const next = el('button', 'mem-viewer-btn', '›');
      next.type = 'button'; next.dataset.memMediaNext = item.id;
      next.setAttribute('aria-label', 'Media siguiente');
      next.addEventListener('click', e => { e.stopPropagation(); setIndex(index + 1); });
      counter = el('span', 'mem-viewer-count');
      counter.dataset.memMediaCounter = item.id;
      nav.append(prev, counter, next);
      wrap.append(nav);
    }

    paint();
    return {
      node: wrap, count: list.length,
      setIndex, getIndex: () => index,
      destroy() { video().releaseWithin(wrap); }
    };
  }

  /* ---------- tratamiento material ---------- */
  function applyArtifact(container, item) {
    if (!item.artifactStyle || item.artifactStyle === 'none') return;
    container.dataset.artifact = item.artifactStyle;
    const surface = el('div', 'mem-artifact-surface');
    surface.dataset.memArtifact = item.artifactStyle;
    container.prepend(surface);
    const instance = artifacts()?.create(item.artifactStyle, surface, {});
    if (instance) track(() => instance.destroy());
  }

  /* ---------- copy compartido ---------- */
  function copyBlock(item, {expandable = true} = {}) {
    const copy = el('div', 'mem-copy');
    if (item.type && item.type !== 'memory')
      copy.append(el('p', 'mem-kind', TYPE_LABEL[item.type] || ''));
    if (has(item.title)) copy.append(el('h3', 'mem-item-title', item.title));
    const meta = metaLine(item);
    if (meta) copy.append(el('p', 'mem-meta', meta));
    if (has(item.text)) {
      const text = el('p', 'mem-text', item.text);
      if (expandable && item.text.trim().length > 180) text.dataset.clamped = '1';
      copy.append(text);
    }
    if (has(item.author)) copy.append(el('p', 'mem-author', item.author));
    ratingNode(item, copy);
    if (expandable && (item.text.trim().length > 180 || usable(item).length > 1)) {
      const open = el('button', 'mem-open', 'Abrir el recuerdo');
      open.type = 'button';
      open.dataset.memOpen = item.id;
      open.addEventListener('click', () => openStory(item, open));
      copy.append(open);
    }
    linkNode(item, copy);
    return copy;
  }

  function linkNode(item, parent) {
    if (!has(item.link)) return;
    let url;
    try { url = new URL(item.link, location.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const a = el('a', 'mem-link', 'Ver más');
    a.href = url.toString();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.memLink = item.id;
    parent.append(a);
  }

  function ratingNode(item, parent) {
    const r = Number(item.rating);
    if (!Number.isFinite(r) || r <= 0) return;
    const value = Math.min(5, Math.max(0, r));
    const n = el('p', 'mem-rating');
    n.dataset.memRating = String(value);
    n.textContent = '★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value));
    n.setAttribute('aria-label', `Valoración ${value} de 5`);
    parent.append(n);
  }

  function sectionHead(memories) {
    const head = el('header', 'mem-head');
    if (has(memories.eyebrow)) head.append(el('p', 'mem-eyebrow', memories.eyebrow));
    if (has(memories.title)) {
      const h = el('h2', 'mem-title display', memories.title);
      h.id = 'memories-title';
      head.append(h);
    }
    if (has(memories.intro)) head.append(el('p', 'mem-intro', memories.intro));
    return head.children.length ? head : null;
  }

  /* ============================================================
     PRESET 01 — CINEMATIC MEMORY WALL
     Composición asimétrica con jerarquía real, entrada coreografiada, parallax ligado al
     scroll (sin secuestrarlo) y micro-inclinación por puntero. El recuerdo destacado se
     abre como una portada con su media hero y sus satélites: un recuerdo NO es una foto.
     ============================================================ */
  function renderWall(list) {
    const wall = el('div', 'mem-wall');
    wall.dataset.memPreset = 'cinematic-memory-wall';

    list.forEach((item, i) => {
      const weight = item.featured ? 'hero' : item.visualWeight;
      const cell = el('article', 'mem-cell');
      cell.dataset.memItem = item.id;
      cell.dataset.weight = weight;
      cell.dataset.type = item.type;
      cell.dataset.rhythm = String(i % 6);
      cell.style.setProperty('--i', String(i));
      if (item.featured) cell.dataset.featured = '1';

      const viewer = mediaViewer(item, {
        strip: item.featured ? 'filmstrip' : 'thumbs',
        autoplayCover: item.featured,
        label: item.title
      });
      const stage = el('div', 'mem-cell-stage');
      applyArtifact(stage, item);
      if (viewer.count) stage.append(viewer.node);
      cell.append(stage);
      cell.dataset.memMediaCount = String(viewer.count);
      track(() => viewer.destroy());

      cell.append(copyBlock(item));
      wall.append(cell);
    });

    /* coreografía de entrada: una sola pasada, con retardo por posición */
    const revealIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.dataset.revealed = '1';
        revealIO.unobserve(e.target);
      }
    }, {threshold: 0.16, rootMargin: '0px 0px -8% 0px'});
    wall.querySelectorAll('.mem-cell').forEach(c => revealIO.observe(c));
    track(() => revealIO.disconnect());

    /* parallax: desplazamiento relativo por celda, derivado de su posición en pantalla.
       Un solo rAF, sólo mientras la sección es visible, y amplitud pequeña — el objetivo
       es profundidad, no mareo. NUNCA se toca el scroll. */
    if (!reduced.matches) {
      const cells = [...wall.querySelectorAll('.mem-cell')];
      let raf = 0, alive = true;
      /* El bucle se PARA cuando el scroll se queda quieto. La primera versión llamaba a
         `schedule()` al final de cada frame sin condición, así que el rAF seguía vivo
         indefinidamente mientras la sección estuviera a la vista — gasto continuo por
         nada, justo lo que §30 prohíbe. */
      let lastY = -1, idle = 0;
      const frame = () => {
        raf = 0;
        if (!alive) return;
        const vh = window.innerHeight || 1;
        const y = window.scrollY;
        idle = y === lastY ? idle + 1 : 0;
        lastY = y;
        for (const cell of cells) {
          const r = cell.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) continue;
          const p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
          const depth = cell.dataset.weight === 'hero' ? 22 : cell.dataset.weight === 'small' ? 40 : 30;
          cell.style.setProperty('--mem-shift', `${(-p * depth).toFixed(2)}px`);
          cell.style.setProperty('--mem-depth', (1 - Math.abs(p) * 0.06).toFixed(4));
        }
        if (idle < 3) schedule();          /* tres frames quietos y se apaga */
      };
      const schedule = () => {
        if (!alive || raf || !sectionVisible || document.hidden) return;
        raf = requestAnimationFrame(frame);
      };
      const onScroll = () => schedule();
      window.addEventListener('scroll', onScroll, {passive: true});
      document.addEventListener('visibilitychange', schedule);
      wallSchedulers.push(schedule);
      track(() => {
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('visibilitychange', schedule);
      });
      schedule();

      /* micro-inclinación: sólo la celda bajo el puntero, y sólo con puntero fino */
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const onMove = event => {
          const cell = event.target.closest?.('.mem-cell');
          if (!cell) return;
          const r = cell.getBoundingClientRect();
          const nx = (event.clientX - r.left) / r.width - 0.5;
          const ny = (event.clientY - r.top) / r.height - 0.5;
          cell.style.setProperty('--mem-tilt-x', `${(-ny * 3).toFixed(2)}deg`);
          cell.style.setProperty('--mem-tilt-y', `${(nx * 4).toFixed(2)}deg`);
        };
        const onLeave = event => {
          const cell = event.target.closest?.('.mem-cell');
          if (!cell) return;
          cell.style.setProperty('--mem-tilt-x', '0deg');
          cell.style.setProperty('--mem-tilt-y', '0deg');
        };
        wall.addEventListener('pointermove', onMove);
        wall.addEventListener('pointerleave', onLeave, true);
        track(() => {
          wall.removeEventListener('pointermove', onMove);
          wall.removeEventListener('pointerleave', onLeave, true);
        });
      }
    }

    return wall;
  }
  const wallSchedulers = [];

  /* ============================================================
     PRESET 02 — MEMORY STACK · gramática Koi Studies
     Posición CONTINUA (`focus` flotante) + física: arrastre con pointer capture, umbral
     con intención horizontal, tap slop, lanzamiento por velocidad y muelle de asentado.
     Estados de runtime IDLE / DRAGGING / SETTLING, nunca en Project State.
     ============================================================ */
  function renderStack(list) {
    const shell = el('div', 'mem-stack');
    shell.dataset.memPreset = 'memory-stack';

    const deck = el('div', 'mem-deck');
    deck.dataset.memDeck = '1';
    deck.setAttribute('role', 'group');
    deck.setAttribute('aria-label', 'Recuerdos apilados. Arrastra, usa las flechas o los botones.');
    deck.tabIndex = 0;

    const cards = list.map((item, i) => {
      const card = el('article', 'mem-card');
      card.dataset.memItem = item.id;
      card.dataset.memCardIndex = String(i);
      card.dataset.type = item.type;
      if (item.featured) card.dataset.featured = '1';

      const stage = el('div', 'mem-card-stage');
      applyArtifact(stage, item);
      /* la tarjeta en foco expone su colección; las demás, sólo portada */
      const viewer = mediaViewer(item, {strip: 'dots', autoplayCover: false, label: item.title});
      if (viewer.count) stage.append(viewer.node);
      card.append(stage);
      card.dataset.memMediaCount = String(viewer.count);
      track(() => viewer.destroy());
      card.append(copyBlock(item, {expandable: true}));
      deck.append(card);
      return {item, node: card, viewer};
    });

    const nav = el('div', 'mem-stack-nav');
    const prev = el('button', 'mem-nav-btn', '←');
    prev.type = 'button'; prev.dataset.memPrev = '1';
    prev.setAttribute('aria-label', 'Recuerdo anterior');
    const next = el('button', 'mem-nav-btn', '→');
    next.type = 'button'; next.dataset.memNext = '1';
    next.setAttribute('aria-label', 'Recuerdo siguiente');
    const counter = el('p', 'mem-counter');
    counter.dataset.memCounter = '1';
    nav.append(prev, counter, next);

    const live = el('p', 'mem-live');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');

    const hint = el('p', 'mem-stack-hint', 'Arrastra los recuerdos · ← → · o usa los botones');
    shell.append(deck, nav, hint, live);

    /* ---------- runtime ---------- */
    const last = list.length - 1;
    let focus = 0, target = 0, velocity = 0;
    let dragging = null, raf = 0, alive = true, state = 'IDLE';
    let suppressClickUntil = 0;

    const setState = next => {
      if (state === next) return;
      state = next;
      deck.dataset.stackState = state;
    };

    /* Gramática de Character Filmstrip: todo se deriva de la distancia al foco, en cada
       frame. El foco no sólo mueve: DESTIÑE lo que no está elegido. */
    function paint() {
      const w = deck.getBoundingClientRect().width || 1;
      for (const card of cards) {
        const d = Number(card.node.dataset.memCardIndex) - focus;
        const ad = Math.abs(d);
        const focusAmount = clamp(1 - ad, 0, 1);
        const x = d * (w * 0.34) + (dragging ? 0 : 0);
        const z = -ad * 150;
        const rotY = clamp(-d * 9, -26, 26);
        const rotZ = clamp(d * 2.6, -9, 9);
        const scale = clamp(1 - ad * 0.075, 0.66, 1);
        const node = card.node;
        node.style.setProperty('--d', d.toFixed(4));
        node.style.setProperty('--focus', focusAmount.toFixed(4));
        node.style.transform =
          `translate3d(${x.toFixed(2)}px,${(ad * 12).toFixed(2)}px,${z.toFixed(2)}px)` +
          ` rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        node.style.opacity = String(clamp(1 - ad * 0.34, 0, 1));
        node.style.filter = ad > 1.1 ? `blur(${Math.min((ad - 1.1) * 1.6, 4).toFixed(2)}px)` : 'none';
        node.style.zIndex = String(Math.round(1000 - ad * 100));
        node.dataset.focused = ad < 0.5 ? '1' : '0';
        /* fuera de foco no debe ser alcanzable con el tabulador */
        node.querySelectorAll('a,button').forEach(n => { n.tabIndex = ad < 0.5 ? 0 : -1; });
      }
      const active = Math.round(clamp(focus, 0, last));
      counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
      prev.disabled = active <= 0 && !dragging;
      next.disabled = active >= last && !dragging;
      deck.dataset.memFocusIndex = String(active);
      const item = list[active];
      live.textContent = item?.title ? `Recuerdo: ${item.title}` : '';
    }

    /* muelle crítico: persigue `target` y se detiene de verdad (nada de wobble eterno) */
    function frame() {
      raf = 0;
      if (!alive) return;
      if (!dragging) {
        const dist = target - focus;
        velocity = velocity * 0.82 + dist * 0.18;
        focus += velocity;
        if (Math.abs(dist) < 0.0015 && Math.abs(velocity) < 0.0015) {
          focus = target; velocity = 0;
          paint();
          setState('IDLE');
          return;                        /* se para: cero rAF en reposo */
        }
        setState('SETTLING');
      }
      paint();
      schedule();
    }
    const schedule = () => {
      if (!alive || raf || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    const goTo = index => {
      const nextTarget = clamp(Math.round(index), 0, last);
      if (nextTarget === target && state === 'IDLE') return;
      /* al cambiar de recuerdo, el vídeo del anterior se pausa */
      const leaving = cards[Math.round(clamp(focus, 0, last))];
      if (leaving && Math.round(clamp(focus, 0, last)) !== nextTarget) video().pauseWithin(leaving.node);
      target = nextTarget;
      if (reduced.matches) { focus = target; velocity = 0; paint(); setState('IDLE'); return; }
      schedule();
    };

    prev.addEventListener('click', () => { if (performance.now() > suppressClickUntil) goTo(target - 1); });
    next.addEventListener('click', () => { if (performance.now() > suppressClickUntil) goTo(target + 1); });
    deck.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(target - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(target + 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(last); }
    });

    /* ---------- arrastre y lanzamiento (Koi Studies) ----------
       `touch-action:none` en el mazo (CSS) + pointer capture: el gesto es del mazo, pero
       la RUEDA no se toca — el scroll de la página sigue siendo scroll de la página. */
    const threshold = () => clamp(deck.getBoundingClientRect().width * 0.18, 52, 88);
    const onDown = event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button,a')) return;      /* Play y miniaturas primero */
      dragging = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        startFocus: focus, lastX: event.clientX, lastT: performance.now(),
        v: 0, traveled: 0
      };
      velocity = 0;
      setState('DRAGGING');
      deck.dataset.dragging = '1';
      try { deck.setPointerCapture(event.pointerId); } catch {}
      schedule();
    };
    const onMove = event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const dx = event.clientX - dragging.startX;
      const dy = event.clientY - dragging.startY;
      dragging.traveled = Math.max(dragging.traveled, Math.hypot(dx, dy));
      /* intención horizontal, como en Koi: un gesto vertical es scroll, no arrastre */
      if (Math.abs(dy) > Math.abs(dx) * 1.4 && dragging.traveled > 12) return;
      const now = performance.now();
      const dt = Math.max(1, now - dragging.lastT);
      dragging.v = (event.clientX - dragging.lastX) / dt;      /* px/ms */
      dragging.lastX = event.clientX; dragging.lastT = now;
      const w = deck.getBoundingClientRect().width || 1;
      focus = clamp(dragging.startFocus - dx / (w * 0.34), -0.45, last + 0.45);
      paint();
      event.preventDefault();
    };
    const onUp = event => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const dx = event.clientX - dragging.startX;
      const dy = event.clientY - dragging.startY;
      const fling = dragging.v;
      const tap = dragging.traveled <= 3;
      const committed = Math.abs(dx) >= threshold() && Math.abs(dx) >= Math.abs(dy) * 0.75;
      dragging = null;
      deck.removeAttribute('data-dragging');
      try { if (deck.hasPointerCapture?.(event.pointerId)) deck.releasePointerCapture(event.pointerId); } catch {}
      suppressClickUntil = performance.now() + 320;   /* nada de click fantasma */
      if (tap) { goTo(Math.round(focus)); return; }
      /* velocidad alta = lanzamiento, aunque no se haya recorrido el umbral */
      if (Math.abs(fling) > 0.55) goTo(Math.round(dragging?.startFocus ?? focus) + (fling < 0 ? 1 : -1));
      else if (committed) goTo(Math.round(focus + (dx < 0 ? 0.3 : -0.3)));
      else goTo(Math.round(focus));                   /* insuficiente: vuelve al origen */
    };
    deck.addEventListener('pointerdown', onDown);
    deck.addEventListener('pointermove', onMove);
    deck.addEventListener('pointerup', onUp);
    deck.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', schedule);

    track(() => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      deck.removeEventListener('pointerdown', onDown);
      deck.removeEventListener('pointermove', onMove);
      deck.removeEventListener('pointerup', onUp);
      deck.removeEventListener('pointercancel', onUp);
      document.removeEventListener('visibilitychange', schedule);
      stack = null;
    });

    setState('IDLE');
    queueMicrotask(paint);
    stack = {
      goTo, get focus() { return focus; }, get target() { return target; },
      get state() { return state; },
      setMediaIndex: (itemId, i) => cards.find(c => c.item.id === itemId)?.viewer.setIndex(i)
    };
    return shell;
  }

  /* ============================================================
     PRESET 03 — EDITORIAL JOURNAL
     Spreads de archivo: entradilla de fecha y lugar, media grande con filmstrip de las
     secundarias, capas de papel y revelado por máscara. Cronología con voz de revista —
     el orden lo sigue mandando el proyecto, no la fecha.
     ============================================================ */
  function renderJournal(list) {
    const journal = el('div', 'mem-journal');
    journal.dataset.memPreset = 'editorial-journal';

    list.forEach((item, i) => {
      const entry = el('article', 'mem-entry');
      entry.dataset.memItem = item.id;
      entry.dataset.type = item.type;
      entry.dataset.side = i % 2 === 0 ? 'left' : 'right';
      entry.style.setProperty('--i', String(i));
      if (item.featured) entry.dataset.featured = '1';

      const aside = el('div', 'mem-entry-aside');
      if (has(item.date)) aside.append(el('p', 'mem-date', item.date));
      if (has(item.place)) aside.append(el('p', 'mem-place', item.place));
      if (item.type && item.type !== 'memory')
        aside.append(el('p', 'mem-kind', TYPE_LABEL[item.type] || ''));
      aside.append(el('span', 'mem-folio', String(i + 1).padStart(2, '0')));
      entry.append(aside);

      const spread = el('div', 'mem-spread');
      applyArtifact(spread, item);
      const viewer = mediaViewer(item, {strip: 'filmstrip', autoplayCover: false, label: item.title});
      if (viewer.count) spread.append(viewer.node);
      entry.append(spread);
      entry.dataset.memMediaCount = String(viewer.count);
      track(() => viewer.destroy());

      entry.append(copyBlock(item));
      journal.append(entry);
    });

    const revealIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.dataset.revealed = '1';
        revealIO.unobserve(e.target);
      }
    }, {threshold: 0.14, rootMargin: '0px 0px -6% 0px'});
    journal.querySelectorAll('.mem-entry').forEach(n => revealIO.observe(n));
    track(() => revealIO.disconnect());

    return journal;
  }

  const RENDERERS = {
    'cinematic-memory-wall': renderWall,
    'memory-stack': renderStack,
    'editorial-journal': renderJournal
  };

  /* ============================================================
     STORY — el recuerdo completo, con TODA su galería
     No es un segundo Product Detail: no hay contrato de producto, ni adaptadores, ni
     catálogo. Es el mismo recuerdo, con su texto largo y todas sus medias recorribles.
     ============================================================ */
  function openStory(item, returnTo) {
    closeStory();
    storyReturn = returnTo || null;
    storyLayer = el('div', 'mem-story');
    storyLayer.setAttribute('role', 'dialog');
    storyLayer.setAttribute('aria-modal', 'true');
    storyLayer.dataset.memStory = item.id;

    const sheet = el('div', 'mem-story-sheet');
    const close = el('button', 'mem-story-close', '×');
    close.type = 'button';
    close.dataset.memStoryClose = '1';
    close.setAttribute('aria-label', 'Cerrar el recuerdo');
    close.addEventListener('click', () => closeStory());
    sheet.append(close);

    const gallery = el('div', 'mem-story-gallery');
    applyArtifact(gallery, item);
    storyViewer = mediaViewer(item, {strip: 'thumbs', autoplayCover: false, label: item.title});
    if (storyViewer.count) gallery.append(storyViewer.node);
    sheet.append(gallery);

    const body = el('div', 'mem-story-body');
    if (item.type && item.type !== 'memory')
      body.append(el('p', 'mem-kind', TYPE_LABEL[item.type] || ''));
    if (has(item.title)) {
      const h = el('h3', 'mem-story-title', item.title);
      h.id = `mem-story-title-${item.id}`;
      storyLayer.setAttribute('aria-labelledby', h.id);
      body.append(h);
    } else storyLayer.setAttribute('aria-label', 'Recuerdo');
    const meta = metaLine(item);
    if (meta) body.append(el('p', 'mem-story-meta', meta));
    if (has(item.text)) body.append(el('p', 'mem-story-text', item.text));
    if (has(item.author)) body.append(el('p', 'mem-story-author', item.author));
    ratingNode(item, body);
    linkNode(item, body);
    sheet.append(body);

    storyLayer.append(sheet);
    storyLayer.addEventListener('click', e => { if (e.target === storyLayer) closeStory(); });
    document.body.append(storyLayer);
    document.addEventListener('keydown', onStoryKey, true);
    close.focus();
  }

  function onStoryKey(event) {
    if (!storyLayer) return;
    if (event.key === 'Escape') {
      /* el Studio escucha Escape en captura sobre `document`: sin cortar aquí, cerrar el
         recuerdo cerraría también el cajón */
      event.stopImmediatePropagation();
      event.preventDefault();
      closeStory();
      return;
    }
    if (event.key === 'ArrowLeft' && storyViewer) { event.preventDefault(); storyViewer.setIndex(storyViewer.getIndex() - 1); }
    if (event.key === 'ArrowRight' && storyViewer) { event.preventDefault(); storyViewer.setIndex(storyViewer.getIndex() + 1); }
  }

  function closeStory() {
    if (!storyLayer) return;
    /* cerrar el story pausa su vídeo: era uno de los agujeros del rechazo */
    video().pauseWithin(storyLayer);
    video().releaseWithin(storyLayer);
    storyViewer = null;
    storyLayer.remove();
    storyLayer = null;
    document.removeEventListener('keydown', onStoryKey, true);
    const back = storyReturn; storyReturn = null;
    if (back?.isConnected) requestAnimationFrame(() => back.focus());
  }

  /* ---------- montaje ---------- */
  function mount() {
    if (host) return host;
    host = document.createElement('section');
    host.className = 'mem-section';
    host.id = 'memories';
    host.dataset.memoriesSection = '1';
    host.setAttribute('aria-labelledby', 'memories-title');
    const visit = document.querySelector('#visit');
    if (visit) visit.before(host); else document.querySelector('main')?.append(host);

    sectionIO = new IntersectionObserver(([e]) => {
      sectionVisible = e.isIntersecting;
      if (sectionVisible) wallSchedulers.forEach(fn => fn());
    }, {threshold: [0, 0.05]});
    sectionIO.observe(host);
    return host;
  }

  function unmount() {
    closeStory();
    runTeardowns();
    wallSchedulers.length = 0;
    video().pauseAll();
    sectionIO?.disconnect();
    sectionIO = null;
    sectionVisible = false;
    host?.remove();
    host = null;
    fingerprint = null;
    document.documentElement.removeAttribute('data-memories');
    for (const ref of urlCache.keys()) media().revoke(ref);
    urlCache.clear();
  }

  const printOf = memories => JSON.stringify({
    p: memories.preset, h: memories.eyebrow, t: memories.title, i: memories.intro,
    items: M().visible(memories)
  });

  async function applyConfig() {
    const memories = config();

    if (!memories.enabled) { if (host) unmount(); return; }

    const list = M().visible(memories);
    const print = printOf(memories);
    if (host && print === fingerprint) return;

    await resolveAll(list);
    /* la config puede haber cambiado mientras se resolvía la media: nunca publicar un
       estado viejo */
    if (printOf(config()) !== print) { queueMicrotask(applyConfig); return; }

    /* repintar es un teardown completo: cero rAF, observers o listeners supervivientes */
    runTeardowns();
    wallSchedulers.length = 0;
    if (host) video().releaseWithin(host);

    mount();
    host.replaceChildren();
    host.dataset.preset = memories.preset;

    const head = sectionHead(memories);
    if (head) host.append(head);

    if (!list.length) {
      const empty = el('p', 'mem-empty', 'Todavía no hay recuerdos publicados.');
      empty.dataset.memEmpty = '1';
      host.append(empty);
      host.dataset.count = '0';
    } else {
      host.append((RENDERERS[memories.preset] || renderWall)(list));
      host.dataset.count = String(list.length);
    }
    host.dataset.mediaTotal = String(list.reduce((n, i) => n + usable(i).length, 0));

    fingerprint = print;
    document.documentElement.dataset.memories = 'ready';
  }

  document.addEventListener('restaurant:config-applied', () => { applyConfig().catch(console.error); });

  window.RestaurantMemoriesEngine = Object.freeze({
    applyConfig,
    destroy: unmount,
    presets: () => Object.keys(RENDERERS),
    openStory: id => {
      const item = items().find(i => i.id === id);
      if (item) openStory(item, document.activeElement);
    },
    closeStory,
    refresh: () => { fingerprint = null; return applyConfig(); },
    /* superficie para los tests: estado de runtime, nunca de Project State */
    state: () => ({
      mounted: !!host,
      preset: host?.dataset.preset || null,
      count: Number(host?.dataset.count || 0),
      mediaTotal: Number(host?.dataset.mediaTotal || 0),
      story: storyLayer?.dataset.memStory || null,
      stack: stack ? {focus: stack.focus, target: stack.target, state: stack.state} : null,
      video: video().state()
    }),
    stack: () => stack,
    storyViewer: () => storyViewer
  });

  M()?.seed?.();
  applyConfig().catch(console.error);
})();
