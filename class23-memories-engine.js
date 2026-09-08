/* CLASS 23 — MEMORIES ENGINE. UN motor, tres presentaciones.

       modules.memories (Project State)
                 ↓
       RestaurantMemoriesEngine
         ├── cinematic-memory-wall
         ├── memory-stack
         └── editorial-journal

   Los presets son PRESENTACIÓN. El dominio es uno: cambiar de preset no toca los datos,
   ni el orden, ni las referencias de media, ni `featured`. Por eso los renderers reciben
   los mismos ítems y no guardan nada propio.

   Reglas que vienen de fases anteriores y aquí se respetan:

   · UN SOLO ÍNDICE CANÓNICO. El Stack tiene `focus`, y sólo `focus`: un segundo índice
     que pueda discrepar con la pantalla es el bug que ya costó dos fases.
   · OFF ES OFF. Sin sección, sin hueco, sin observers, sin vídeo, sin trabajo de
     render. Desmontar el nodo ES el teardown.
   · EL OBJETO VIAJERO PASA POR ENCIMA. `styles-v14.css` documenta el contrato de capas
     (copy 5, media 3 bajo `html[data-scroll-traveler="ready"]`); esta sección se suma a
     él desde `styles-v23.css` en vez de rediseñar Project 09.
   · NADA INVENTADO. Un campo vacío no se rellena: no se pinta.
*/
(() => {
  'use strict';

  const M = () => window.RestaurantMemoriesModel;
  const media = () => window.RestaurantMedia;
  const cfg = () => window.RestaurantStudioConfig;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const has = v => typeof v === 'string' ? v.trim().length > 0 : v != null;

  let host = null;                 /* la sección pública; su ausencia ES el OFF */
  let io = null;                   /* observer de vídeo */
  let fingerprint = null;
  let focus = 0;                   /* Stack: el ÚNICO índice */
  let story = null;                /* overlay de historia abierto, si lo hay */
  let storyReturn = null;
  const urlCache = new Map();

  const config = () => M().normalize(cfg()?.get('modules.memories'));
  const items = () => M().visible(config());

  /* ---------- media ----------
     Se resuelven TODAS las refs antes de pintar: el DOM no puede quedar a medias
     esperando promesas, y una ref sin resolver debe poder no pintarse en absoluto. */
  async function resolveAll(list) {
    for (const item of list) {
      for (const m of item.media || []) {
        /* Sólo se cachea lo que RESOLVIÓ. Cachear el fallo dejaba la ref muerta para
           siempre: un asset que aparece después —porque acaba de subirse, o porque el
           almacén todavía estaba hidratando— nunca volvía a intentarse y su recuerdo se
           quedaba sin media hasta recargar la página. */
        if (urlCache.get(m.ref)) continue;
        const url = await media().url(m.ref);
        if (url) urlCache.set(m.ref, url); else urlCache.delete(m.ref);
      }
    }
  }
  const urlOf = m => urlCache.get(m?.ref) || '';

  /* El primer asset utilizable de un recuerdo. Una ref que no resuelve —media local de
     otro ordenador, por ejemplo— se salta en silencio en vez de dejar un hueco roto. */
  const firstMedia = item => (item.media || []).find(m => urlOf(m));

  function mediaNode(m, {label = ''} = {}) {
    const url = urlOf(m);
    if (!url) return null;
    if (m.kind === 'video') {
      const v = document.createElement('video');
      v.src = url;
      v.muted = true;                       /* nunca audio automático */
      v.loop = true;
      v.playsInline = true;
      v.preload = 'metadata';               /* no descargar el vídeo entero por si acaso */
      v.dataset.memVideo = '1';
      v.className = 'mem-media mem-media-video';
      /* el vídeo necesita nombre accesible: no hay `alt` en <video> */
      v.setAttribute('aria-label', m.alt || label || 'Vídeo del recuerdo');
      v.setAttribute('role', 'img');
      return v;
    }
    const i = document.createElement('img');
    i.src = url;
    i.alt = m.alt || '';                    /* vacío a propósito si es decorativa */
    i.loading = 'lazy';
    i.decoding = 'async';
    i.className = 'mem-media mem-media-image';
    return i;
  }

  /* ---------- vídeo: ciclo de vida ----------
     Nunca todos a la vez, nunca fuera de viewport, nunca con el documento oculto, y
     nunca en reduced-motion. */
  function pauseAll(root = host) {
    root?.querySelectorAll('video[data-mem-video]').forEach(v => { try { v.pause(); } catch {} });
  }

  function watchVideos() {
    io?.disconnect();
    io = null;
    if (!host) return;
    const videos = [...host.querySelectorAll('video[data-mem-video]')];
    if (!videos.length) return;
    if (reduced.matches) { pauseAll(); return; }

    io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const v = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.55 && !document.hidden) {
          /* uno cada vez: una pared con cinco vídeos reproduciéndose es un problema de
             red y de atención, no una decisión estética */
          pauseAll();
          v.play().catch(() => {});
        } else {
          try { v.pause(); } catch {}
        }
      }
    }, {threshold: [0, 0.55, 0.9]});
    videos.forEach(v => io.observe(v));
  }

  const onVisibility = () => { if (document.hidden) pauseAll(); };
  const onReduced = () => { if (host) { pauseAll(); watchVideos(); } };

  /* ---------- historia ampliada ----------
     NO es un segundo Product Detail: no hay contrato de producto, ni adaptadores, ni
     catálogo. Es el texto largo del mismo recuerdo, en su propia capa, con Escape y
     devolución de foco. Sólo existe si el recuerdo tiene algo más que enseñar. */
  const expandable = item => has(item.text) && item.text.trim().length > 180;

  function openStory(item, returnTo) {
    closeStory();
    storyReturn = returnTo || null;
    story = el('div', 'mem-story');
    story.setAttribute('role', 'dialog');
    story.setAttribute('aria-modal', 'true');
    story.dataset.memStory = item.id;
    const sheet = el('div', 'mem-story-sheet');
    const close = el('button', 'mem-story-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar el recuerdo');
    close.addEventListener('click', () => closeStory());
    sheet.append(close);

    const m = firstMedia(item);
    if (m) {
      const wrap = el('div', 'mem-story-media');
      const node = mediaNode(m, {label: item.title});
      if (node) wrap.append(node);
      sheet.append(wrap);
    }
    const body = el('div', 'mem-story-body');
    if (has(item.title)) {
      const h = el('h3', 'mem-story-title', item.title);
      h.id = `mem-story-title-${item.id}`;
      story.setAttribute('aria-labelledby', h.id);
      body.append(h);
    } else {
      story.setAttribute('aria-label', 'Recuerdo');
    }
    const meta = metaLine(item);
    if (meta) body.append(el('p', 'mem-story-meta', meta));
    if (has(item.text)) body.append(el('p', 'mem-story-text', item.text));
    if (has(item.author)) body.append(el('p', 'mem-story-author', item.author));
    linkNode(item, body);
    sheet.append(body);
    story.append(sheet);
    story.addEventListener('click', e => { if (e.target === story) closeStory(); });
    document.body.append(story);
    document.addEventListener('keydown', onStoryKey, true);
    close.focus();
    watchVideos();
  }

  function onStoryKey(event) {
    if (event.key !== 'Escape' || !story) return;
    /* el Studio escucha Escape en captura sobre `document`; sin cortar aquí, cerrar el
       recuerdo cerraría también el cajón */
    event.stopImmediatePropagation();
    event.preventDefault();
    closeStory();
  }

  function closeStory() {
    if (!story) return;
    pauseAll(story);
    story.remove();
    story = null;
    document.removeEventListener('keydown', onStoryKey, true);
    const back = storyReturn; storyReturn = null;
    if (back?.isConnected) requestAnimationFrame(() => back.focus());
    watchVideos();
  }

  /* ---------- piezas de copy compartidas por los tres presets ---------- */
  const TYPE_LABEL = {
    memory: 'Recuerdo', event: 'Evento', testimonial: 'Testimonio',
    press: 'Prensa', milestone: 'Hito'
  };

  /* fecha y lugar sólo si existen; sin separadores colgando */
  function metaLine(item) {
    return [item.date, item.place].map(v => (v || '').trim()).filter(Boolean).join(' · ');
  }

  function linkNode(item, parent) {
    if (!has(item.link)) return;
    let url;
    try { url = new URL(item.link, location.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;      /* nada de javascript: ni data: */
    const a = el('a', 'mem-link', 'Ver más');
    a.href = url.toString();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.memLink = item.id;
    parent.append(a);
  }

  function ratingNode(item, parent) {
    const r = Number(item.rating);
    if (!Number.isFinite(r) || r <= 0) return;        /* 0/null = no hay valoración */
    const value = Math.min(5, Math.max(0, r));
    const n = el('p', 'mem-rating');
    n.dataset.memRating = String(value);
    n.textContent = '★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value));
    n.setAttribute('aria-label', `Valoración ${value} de 5`);
    parent.append(n);
  }

  /* la cabecera de la sección: sólo lo que el restaurante ha escrito */
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
     Pared editorial asimétrica, no un grid de tarjetas. El peso visual manda: `hero`
     ocupa el momento grande, `medium` acompaña, `small` respira. `featured` gana
     jerarquía de verdad (columna completa y tipografía mayor), no un badge.
     ============================================================ */
  function renderWall(list, memories) {
    const wall = el('div', 'mem-wall');
    wall.dataset.memPreset = 'cinematic-memory-wall';
    list.forEach((item, index) => {
      const weight = item.featured ? 'hero' : item.visualWeight;
      const cell = el('article', 'mem-cell');
      cell.dataset.memItem = item.id;
      cell.dataset.weight = weight;
      cell.dataset.type = item.type;
      if (item.featured) cell.dataset.featured = '1';
      /* el ritmo de la pared es data + posición: nada aleatorio, para que la
         composición sea la misma en cada carga */
      cell.dataset.rhythm = String(index % 6);

      const m = firstMedia(item);
      if (m) {
        const frame = el('div', 'mem-frame');
        frame.dataset.kind = m.kind;
        const node = mediaNode(m, {label: item.title});
        if (node) frame.append(node);
        cell.append(frame);
      }

      const copy = el('div', 'mem-copy');
      if (has(item.type) && item.type !== 'memory')
        copy.append(el('p', 'mem-kind', TYPE_LABEL[item.type] || ''));
      if (has(item.title)) copy.append(el('h3', 'mem-item-title', item.title));
      const meta = metaLine(item);
      if (meta) copy.append(el('p', 'mem-meta', meta));
      if (has(item.text)) {
        const text = el('p', 'mem-text', item.text);
        if (expandable(item)) text.dataset.clamped = '1';
        copy.append(text);
      }
      if (has(item.author)) copy.append(el('p', 'mem-author', item.author));
      ratingNode(item, copy);
      if (expandable(item)) {
        const open = el('button', 'mem-open', 'Leer el recuerdo');
        open.type = 'button';
        open.dataset.memOpen = item.id;
        open.addEventListener('click', () => openStory(item, open));
        copy.append(open);
      }
      linkNode(item, copy);
      if (copy.children.length) cell.append(copy);
      wall.append(cell);
    });
    return wall;
  }

  /* ============================================================
     PRESET 02 — MEMORY STACK
     Recuerdos apilados, uno en foco y los vecinos asomando. Botones y teclado son la
     vía principal; el arrastre es un extra de desktop. Nunca secuestra el scroll: la
     rueda no se toca.
     ============================================================ */
  function renderStack(list, memories) {
    const stack = el('div', 'mem-stack');
    stack.dataset.memPreset = 'memory-stack';
    focus = Math.min(focus, Math.max(0, list.length - 1));

    const deck = el('div', 'mem-deck');
    deck.setAttribute('role', 'group');
    deck.setAttribute('aria-label', 'Recuerdos apilados');
    deck.tabIndex = 0;

    list.forEach((item, index) => {
      const card = el('article', 'mem-card');
      card.dataset.memItem = item.id;
      card.dataset.type = item.type;
      if (item.featured) card.dataset.featured = '1';
      const m = firstMedia(item);
      if (m) {
        const frame = el('div', 'mem-frame');
        frame.dataset.kind = m.kind;
        const node = mediaNode(m, {label: item.title});
        if (node) frame.append(node);
        card.append(frame);
      }
      const copy = el('div', 'mem-copy');
      if (has(item.title)) copy.append(el('h3', 'mem-item-title', item.title));
      const meta = metaLine(item);
      if (meta) copy.append(el('p', 'mem-meta', meta));
      if (has(item.text)) copy.append(el('p', 'mem-text', item.text));
      if (has(item.author)) copy.append(el('p', 'mem-author', item.author));
      ratingNode(item, copy);
      linkNode(item, copy);
      if (copy.children.length) card.append(copy);
      deck.append(card);
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

    /* el ÚNICO estado del stack: `focus`. Todo lo demás se deriva de él. */
    const paint = () => {
      [...deck.children].forEach((card, index) => {
        const offset = index - focus;
        card.dataset.offset = String(offset);
        card.dataset.state = offset === 0 ? 'focus' : Math.abs(offset) <= 2 ? 'near' : 'far';
        /* fuera de foco no debe ser alcanzable con el tabulador */
        card.querySelectorAll('a,button').forEach(n => {
          if (offset === 0) n.removeAttribute('tabindex'); else n.tabIndex = -1;
        });
      });
      counter.textContent = `${String(focus + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
      prev.disabled = focus <= 0;
      next.disabled = focus >= list.length - 1;
      const current = list[focus];
      live.textContent = current?.title ? `Recuerdo: ${current.title}` : '';
      watchVideos();
    };
    const go = delta => {
      const nextIndex = Math.min(list.length - 1, Math.max(0, focus + delta));
      if (nextIndex === focus) return;
      focus = nextIndex;
      paint();
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    deck.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    /* arrastre: extra, no requisito. `wheel` no se toca — nada de scroll hijacking. */
    let dragFrom = null;
    deck.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragFrom = e.clientX;
    });
    deck.addEventListener('pointerup', e => {
      if (dragFrom === null) return;
      const dx = e.clientX - dragFrom;
      dragFrom = null;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    });
    deck.addEventListener('pointercancel', () => { dragFrom = null; });

    stack.append(deck, nav, live);
    queueMicrotask(paint);
    return stack;
  }

  /* ============================================================
     PRESET 03 — EDITORIAL JOURNAL
     Cronología con voz de revista: fecha y lugar como entradilla, media grande y ritmo
     alternado. El orden sigue siendo el del proyecto — no se reordena por fecha a
     espaldas del restaurante; una fecha sirve para leerla, no para mandar.
     ============================================================ */
  function renderJournal(list, memories) {
    const journal = el('div', 'mem-journal');
    journal.dataset.memPreset = 'editorial-journal';
    list.forEach((item, index) => {
      const entry = el('article', 'mem-entry');
      entry.dataset.memItem = item.id;
      entry.dataset.type = item.type;
      entry.dataset.side = index % 2 === 0 ? 'left' : 'right';
      if (item.featured) entry.dataset.featured = '1';

      const aside = el('div', 'mem-entry-aside');
      if (has(item.date)) aside.append(el('p', 'mem-date', item.date));
      if (has(item.place)) aside.append(el('p', 'mem-place', item.place));
      if (item.type && item.type !== 'memory')
        aside.append(el('p', 'mem-kind', TYPE_LABEL[item.type] || ''));
      if (aside.children.length) entry.append(aside);

      const m = firstMedia(item);
      if (m) {
        const frame = el('div', 'mem-frame');
        frame.dataset.kind = m.kind;
        const node = mediaNode(m, {label: item.title});
        if (node) frame.append(node);
        entry.append(frame);
      }

      const copy = el('div', 'mem-copy');
      if (has(item.title)) copy.append(el('h3', 'mem-item-title', item.title));
      if (has(item.text)) copy.append(el('p', 'mem-text', item.text));
      if (has(item.author)) copy.append(el('p', 'mem-author', item.author));
      ratingNode(item, copy);
      linkNode(item, copy);
      if (copy.children.length) entry.append(copy);
      journal.append(entry);
    });
    return journal;
  }

  const RENDERERS = {
    'cinematic-memory-wall': renderWall,
    'memory-stack': renderStack,
    'editorial-journal': renderJournal
  };

  /* ---------- montaje ---------- */
  function mount() {
    if (host) return host;
    host = document.createElement('section');
    host.className = 'mem-section';
    host.id = 'memories';
    host.dataset.memoriesSection = '1';
    host.setAttribute('aria-labelledby', 'memories-title');
    /* antes de la invitación a reservar: la memoria cierra el relato */
    const visit = document.querySelector('#visit');
    if (visit) visit.before(host); else document.querySelector('main')?.append(host);
    return host;
  }

  function unmount() {
    closeStory();
    io?.disconnect();
    io = null;
    pauseAll();
    host?.remove();
    host = null;
    fingerprint = null;
    document.documentElement.removeAttribute('data-memories');
    for (const ref of urlCache.keys()) media().revoke(ref);
    urlCache.clear();
  }

  async function applyConfig() {
    const memories = config();

    /* OFF: desmontar ES el teardown. Sin sección, sin hueco, sin observers, sin vídeo. */
    if (!memories.enabled) { if (host) unmount(); return; }

    const list = M().visible(memories);
    const print = JSON.stringify({p: memories.preset, h: memories.eyebrow, t: memories.title,
      i: memories.intro, items: list});
    if (host && print === fingerprint) return;

    await resolveAll(list);
    /* la config puede haber cambiado mientras se resolvía la media: nunca publicar un
       estado viejo (misma lección que Class 20 con su CSS) */
    if (JSON.stringify({p: config().preset, h: config().eyebrow, t: config().title,
      i: config().intro, items: items()}) !== print) { queueMicrotask(applyConfig); return; }

    mount();
    host.replaceChildren();
    host.dataset.preset = memories.preset;

    const head = sectionHead(memories);
    if (head) host.append(head);

    if (!list.length) {
      /* ON pero sin recuerdos: se dice que no hay, y no se inventa ninguno. */
      const empty = el('p', 'mem-empty', 'Todavía no hay recuerdos publicados.');
      empty.dataset.memEmpty = '1';
      host.append(empty);
      host.dataset.count = '0';
    } else {
      host.append((RENDERERS[memories.preset] || renderWall)(list, memories));
      host.dataset.count = String(list.length);
    }

    fingerprint = print;
    document.documentElement.dataset.memories = 'ready';
    watchVideos();
  }

  document.addEventListener('restaurant:config-applied', () => { applyConfig().catch(console.error); });
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener?.('change', onReduced);

  window.RestaurantMemoriesEngine = Object.freeze({
    applyConfig,
    destroy: unmount,
    presets: () => Object.keys(RENDERERS),
    state: () => ({
      mounted: !!host,
      preset: host?.dataset.preset || null,
      count: Number(host?.dataset.count || 0),
      focus,
      story: story?.dataset.memStory || null
    }),
    openStory: id => {
      const item = items().find(i => i.id === id);
      if (item) openStory(item, document.activeElement);
    },
    closeStory,
    /* para el preview del Studio: fuerza un repintado aunque el fingerprint coincida */
    refresh: () => { fingerprint = null; return applyConfig(); }
  });

  /* el modelo puede tener que sembrar la rama antes del primer pintado */
  M()?.seed?.();
  applyConfig().catch(console.error);
})();
