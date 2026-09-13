/* MOTION 15 — THREE NATIVE PRODUCT ENGINES

   Additive product-engine siblings of the three approved full-page Experiences.
   The Experiences remain untouched and continue to live in Class 22.

   Modes:
     circular-product       → radial selector inspired by Circular Dish Rotator
     dish-stage-product     → cinematic hero stage inspired by Dish Stage
     cinematic-rail-product → perspective rail inspired by Cinematic Product Rail

   CONTRACT
     · one Studio / one Project State / one Media Library;
     · dishes[] is the canonical collection;
     · no iframe, no second store, no persistence;
     · only the Signature section is replaced while a native mode is active;
     · vertical touch stays page scroll; horizontal intent owns the product gesture;
     · true OFF: inactive host is hidden, inert and has no running animation loop.
*/
(() => {
  'use strict';

  const MODES = Object.freeze([
    'circular-product',
    'dish-stage-product',
    'cinematic-rail-product'
  ]);
  const MODE_SET = new Set(MODES);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, n) => n ? ((v % n) + n) % n : 0;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);

  let section = null;
  let shell = null;
  let host = null;
  let items = [];
  let mode = '';
  let progress = 0;
  let activeIndex = 0;
  let lastSignature = '';
  let mounted = false;
  let transitionTimer = 0;
  let refreshTimer = 0;

  const drag = {
    pointerId: null,
    intent: 'idle',
    startX: 0,
    startY: 0,
    startProgress: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false
  };

  function isNative(value = root.dataset.orbitalMotion) {
    return MODE_SET.has(value || '');
  }

  function liveImage(dish) {
    if (!dish) return '';
    const id = String(dish.id || '');
    const live = id ? $(`#orbit-stage .orbit-dish[data-id="${CSS.escape(id)}"] img`) : null;
    return live?.currentSrc || live?.src || dish.depthCarousel?.asset || dish.image || '';
  }

  function collectItems() {
    const list = window.RestaurantOrbit?.getDishes?.()
      || window.RestaurantStudioConfig?.snapshot?.().dishes
      || window.RestaurantDefaults?.dishes
      || [];
    return list.filter(d => d && d.enabled !== false).map((d, i) => ({
      id: d.id || `dish-${i}`,
      name: d.name || `Plato ${i + 1}`,
      meta: d.meta || '',
      short: d.short || d.description || '',
      ingredients: d.ingredients || '',
      price: d.price ?? '',
      image: liveImage(d),
      accent: d.depthCarousel?.accent
        || window.RestaurantStudioConfig?.get?.('brand.accent')
        || '#d8ff4f',
      background: d.depthCarousel?.backgroundColor
        || window.RestaurantStudioConfig?.get?.('brand.ink')
        || '#0a0a09',
      word: d.depthCarousel?.word || String(d.name || 'SIGNATURE').split(/\s+/)[0].toUpperCase(),
      raw: d
    }));
  }

  function signatureOf(list) {
    return list.map(x => [x.id,x.name,x.meta,x.short,x.ingredients,x.price,x.image,x.accent,x.background,x.word]
      .map(v => String(v ?? '')).join('~')).join('|');
  }

  function ensureStyles() {
    if ($('link[data-native-product-engines-styles]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'styles-native-product-engines.css';
    l.dataset.nativeProductEnginesStyles = '1';
    document.head.appendChild(l);
  }

  function ensureHost() {
    section ||= $('.orbital-section');
    shell ||= $('.orbit-shell');
    if (!section || !shell) return false;
    if (host?.isConnected) return true;
    ensureStyles();
    host = document.createElement('div');
    host.className = 'npe-stage';
    host.hidden = true;
    host.inert = true;
    host.setAttribute('aria-hidden', 'true');
    host.tabIndex = -1;
    shell.appendChild(host);
    bindHost();
    mounted = true;
    return true;
  }

  function baseTemplate(kind) {
    const item = items[activeIndex] || items[0] || {};
    const controls = `
      <div class="npe-controls" aria-label="Navegación de productos">
        <button type="button" data-npe-prev aria-label="Producto anterior">←</button>
        <span data-npe-counter></span>
        <button type="button" data-npe-next aria-label="Producto siguiente">→</button>
      </div>`;
    const copy = `
      <div class="npe-copy" aria-live="polite">
        <p class="npe-kicker" data-npe-meta></p>
        <h3 class="npe-title" data-npe-title>${esc(item.name || '')}</h3>
        <p class="npe-short" data-npe-short></p>
        <div class="npe-copy-foot">
          <span class="npe-price" data-npe-price></span>
          <button type="button" class="npe-detail" data-npe-detail>Descubrir plato +</button>
        </div>
      </div>`;

    if (kind === 'circular-product') {
      return `
        <div class="npe-world" aria-hidden="true"><div class="npe-grain"></div></div>
        <div class="npe-circular" data-npe-gesture tabindex="0" aria-label="Selector circular de platos. Arrastra horizontalmente o usa las flechas.">
          <div class="npe-circular-halo" aria-hidden="true"></div>
          <div class="npe-circular-ring" data-npe-ring></div>
          <div class="npe-circular-center">
            <div class="npe-circular-image-wrap"><img data-npe-hero alt=""></div>
            <span class="npe-circular-index" data-npe-index></span>
          </div>
          <div class="npe-circular-marker" aria-hidden="true"><i></i></div>
        </div>
        ${copy}${controls}`;
    }

    if (kind === 'dish-stage-product') {
      return `
        <div class="npe-world npe-stage-world" aria-hidden="true"><div class="npe-grain"></div></div>
        <div class="npe-stage-word" data-npe-word aria-hidden="true"></div>
        <div class="npe-stage-track" data-npe-gesture tabindex="0" aria-label="Escenario de platos. Arrastra horizontalmente o usa las flechas."></div>
        <div class="npe-stage-line" aria-hidden="true"></div>
        ${copy}${controls}`;
    }

    return `
      <div class="npe-world npe-rail-world" aria-hidden="true"><div class="npe-grain"></div></div>
      <div class="npe-rail-word" data-npe-word aria-hidden="true"></div>
      <div class="npe-rail-viewport" data-npe-gesture tabindex="0" aria-label="Raíl cinematográfico de platos. Arrastra horizontalmente o usa las flechas.">
        <div class="npe-rail-track" data-npe-track></div>
      </div>
      ${copy}${controls}`;
  }

  function buildMode(nextMode) {
    if (!host) return;
    host.className = `npe-stage npe-${nextMode}`;
    host.dataset.engine = nextMode;
    host.innerHTML = baseTemplate(nextMode);
    if (nextMode === 'circular-product') buildCircularNodes();
    if (nextMode === 'dish-stage-product') buildStageNodes();
    if (nextMode === 'cinematic-rail-product') buildRailNodes();
  }

  function buildCircularNodes() {
    const ring = $('[data-npe-ring]', host);
    if (!ring) return;
    ring.innerHTML = items.map((item, i) => `
      <button type="button" class="npe-circular-label" data-npe-go="${i}" aria-label="Seleccionar ${esc(item.name)}">
        <span>${String(i + 1).padStart(2,'0')}</span><strong>${esc(item.name)}</strong>
      </button>`).join('');
  }

  function buildStageNodes() {
    const track = $('.npe-stage-track', host);
    if (!track) return;
    track.innerHTML = items.map((item, i) => `
      <button type="button" class="npe-stage-card" data-npe-go="${i}" aria-label="Seleccionar ${esc(item.name)}">
        <img src="${esc(item.image)}" alt="${esc(item.name)}" draggable="false">
      </button>`).join('');
  }

  function buildRailNodes() {
    const track = $('[data-npe-track]', host);
    if (!track) return;
    track.innerHTML = items.map((item, i) => `
      <button type="button" class="npe-rail-card" data-npe-go="${i}" aria-label="Seleccionar ${esc(item.name)}">
        <span class="npe-rail-no">${String(i + 1).padStart(2,'0')}</span>
        <img src="${esc(item.image)}" alt="${esc(item.name)}" draggable="false">
        <span class="npe-rail-card-title">${esc(item.name)}</span>
      </button>`).join('');
  }

  function distance(index) {
    const n = items.length;
    if (!n) return 0;
    let d = index - mod(progress, n);
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  function syncCopy() {
    const item = items[activeIndex];
    if (!item || !host) return;
    const set = (sel, value) => { const el = $(sel, host); if (el) el.textContent = value || ''; };
    set('[data-npe-meta]', item.meta || 'Signature selection');
    set('[data-npe-title]', item.name);
    set('[data-npe-short]', item.short || item.ingredients);
    set('[data-npe-price]', item.price);
    set('[data-npe-counter]', `${String(activeIndex + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`);
    set('[data-npe-index]', String(activeIndex + 1).padStart(2,'0'));
    set('[data-npe-word]', item.word);
    host.style.setProperty('--npe-accent', item.accent || '#d8ff4f');
    host.style.setProperty('--npe-world', item.background || '#0a0a09');
    host.dataset.activeIndex = String(activeIndex);
  }

  function renderCircular() {
    const n = items.length;
    if (!n) return;
    const hero = $('[data-npe-hero]', host);
    const item = items[activeIndex];
    if (hero && item) {
      if (hero.getAttribute('src') !== item.image) hero.src = item.image || '';
      hero.alt = item.name || '';
    }
    $$('.npe-circular-label', host).forEach((el, i) => {
      const d = distance(i);
      const angle = d * (360 / n) - 90;
      const r = innerWidth < 760 ? 38 : 41;
      const rad = angle * Math.PI / 180;
      const x = Math.cos(rad) * r;
      const y = Math.sin(rad) * r;
      const ad = Math.abs(d);
      const focus = clamp(1 - ad / Math.max(2.8, n / 2), 0, 1);
      el.style.setProperty('--npe-x', `${x.toFixed(3)}%`);
      el.style.setProperty('--npe-y', `${y.toFixed(3)}%`);
      el.style.setProperty('--npe-scale', (0.72 + focus * 0.32).toFixed(3));
      el.style.setProperty('--npe-opacity', (0.25 + focus * 0.75).toFixed(3));
      el.dataset.active = ad < 0.45 ? '1' : '0';
      el.tabIndex = ad < 0.45 ? 0 : -1;
    });
    const ring = $('[data-npe-ring]', host);
    if (ring) ring.style.setProperty('--npe-ring-turn', `${(-progress * 360 / n).toFixed(2)}deg`);
  }

  function renderStage() {
    $$('.npe-stage-card', host).forEach((el, i) => {
      const d = distance(i);
      const ad = Math.abs(d);
      const x = d * (innerWidth < 760 ? 54 : 42);
      const y = ad * (innerWidth < 760 ? 9 : 12);
      const scale = ad < 1 ? 1 - ad * .24 : .76 - Math.min(ad - 1, 2) * .14;
      const opacity = clamp(1 - ad * .30, .08, 1);
      const rotate = d * -5.5;
      el.style.transform = `translate(-50%,-50%) translateX(${x}vw) translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(100 - Math.round(ad * 20));
      el.style.filter = ad < .45 ? 'brightness(1.08) saturate(1.04)' : `brightness(${clamp(1 - ad * .12,.55,.92)}) saturate(.76)`;
      el.dataset.active = ad < .45 ? '1' : '0';
      el.setAttribute('aria-hidden', ad > 2.6 ? 'true' : 'false');
    });
  }

  function renderRail() {
    $$('.npe-rail-card', host).forEach((el, i) => {
      const d = distance(i);
      const ad = Math.abs(d);
      const x = d * (innerWidth < 760 ? 72 : 61);
      const y = Math.min(ad, 3) * (innerWidth < 760 ? 18 : 24);
      const scale = ad <= 1 ? 1 - ad * .25 : .75 - Math.min(ad - 1, 2) * .15;
      const opacity = clamp(1 - ad * .30, .05, 1);
      el.style.transform = `translate(-50%,-50%) translateX(${x}%) translateY(${y}px) scale(${scale}) rotate(${d * -3.8}deg)`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(100 - Math.round(ad * 22));
      el.style.filter = ad < .45 ? 'brightness(1.08) saturate(1.06)' : `brightness(${clamp(.9 - ad * .12,.48,.85)}) saturate(.72)`;
      el.dataset.active = ad < .45 ? '1' : '0';
      el.setAttribute('aria-hidden', ad > 2.7 ? 'true' : 'false');
    });
  }

  function render() {
    if (!host || !items.length || !isNative(mode)) return;
    activeIndex = mod(Math.round(progress), items.length);
    syncCopy();
    if (mode === 'circular-product') renderCircular();
    else if (mode === 'dish-stage-product') renderStage();
    else renderRail();
    try { window.RestaurantOrbit?.setProgress?.(activeIndex); } catch (_) {}
  }

  function goTo(index, {animate = true} = {}) {
    if (!items.length) return;
    const target = mod(Number(index) || 0, items.length);
    let delta = target - mod(progress, items.length);
    if (delta > items.length / 2) delta -= items.length;
    if (delta < -items.length / 2) delta += items.length;
    const finalValue = progress + delta;
    if (!animate || reduced.matches || !window.gsap) {
      progress = finalValue;
      render();
      return;
    }
    clearTimeout(transitionTimer);
    const box = {v: progress};
    host.dataset.transitioning = 'true';
    gsap.killTweensOf(box);
    gsap.to(box, {
      v: finalValue,
      duration: mode === 'circular-product' ? .72 : .58,
      ease: mode === 'circular-product' ? 'power4.inOut' : 'power3.inOut',
      onUpdate(){ progress = box.v; render(); },
      onComplete(){
        progress = finalValue;
        render();
        transitionTimer = setTimeout(() => { if (host) delete host.dataset.transitioning; }, 80);
      }
    });
  }

  const step = (delta) => goTo(activeIndex + delta);

  function openDetail() {
    const item = items[activeIndex];
    if (!item) return false;
    try { window.RestaurantOrbit?.setProgress?.(activeIndex); } catch (_) {}
    if (window.RestaurantProductDetail?.open) {
      return window.RestaurantProductDetail.open(item.id, {via:'button'}) !== false;
    }
    window.dispatchEvent(new CustomEvent('restaurant:class6-open-dish', {detail:{id:item.id}}));
    return true;
  }

  function bindHost() {
    host.addEventListener('click', event => {
      const prev = event.target.closest('[data-npe-prev]');
      const next = event.target.closest('[data-npe-next]');
      const detail = event.target.closest('[data-npe-detail]');
      const go = event.target.closest('[data-npe-go]');
      if (prev) { event.stopPropagation(); step(-1); return; }
      if (next) { event.stopPropagation(); step(1); return; }
      if (detail) { event.stopPropagation(); openDetail(); return; }
      if (go) {
        event.stopPropagation();
        const i = Number(go.dataset.npeGo);
        if (Number.isFinite(i)) {
          if (i === activeIndex && go.dataset.active === '1') openDetail();
          else goTo(i);
        }
      }
    });

    host.addEventListener('keydown', event => {
      if (!isNative(mode)) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); step(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); step(-1); }
      else if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-npe-gesture]')) {
        event.preventDefault(); event.stopPropagation(); openDetail();
      }
    });

    host.addEventListener('pointerdown', event => {
      if (!isNative(mode) || !event.target.closest('[data-npe-gesture]')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag.pointerId = event.pointerId;
      drag.intent = 'idle';
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      drag.startProgress = progress;
      drag.lastX = event.clientX;
      drag.lastT = performance.now();
      drag.velocity = 0;
      drag.moved = false;
    }, true);

    host.addEventListener('pointermove', event => {
      if (drag.pointerId !== event.pointerId || drag.intent === 'vertical') return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (drag.intent === 'idle') {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.18) {
          drag.intent = 'vertical';
          drag.pointerId = null;
          return;
        }
        drag.intent = 'horizontal';
        drag.moved = true;
        host.dataset.dragging = 'true';
        event.target.closest('[data-npe-gesture]')?.setPointerCapture?.(event.pointerId);
      }
      if (drag.intent !== 'horizontal') return;
      event.preventDefault();
      event.stopPropagation();
      const divisor = mode === 'circular-product'
        ? Math.max(105, shell.clientWidth * .17)
        : Math.max(190, shell.clientWidth * .28);
      progress = drag.startProgress - dx / divisor;
      const now = performance.now();
      const dt = Math.max(8, now - drag.lastT);
      drag.velocity = (event.clientX - drag.lastX) / dt;
      drag.lastX = event.clientX;
      drag.lastT = now;
      render();
    }, {passive:false});

    const finish = event => {
      if (drag.pointerId !== event.pointerId && drag.pointerId !== null) return;
      const horizontal = drag.intent === 'horizontal';
      const velocity = drag.velocity;
      drag.pointerId = null;
      drag.intent = 'idle';
      delete host.dataset.dragging;
      if (!horizontal) return;
      event.stopPropagation();
      const projected = progress - velocity * (mode === 'circular-product' ? .28 : .18);
      goTo(Math.round(projected));
    };
    host.addEventListener('pointerup', finish);
    host.addEventListener('pointercancel', finish);

    host.addEventListener('wheel', event => {
      if (!isNative(mode) || !event.target.closest('[data-npe-gesture]')) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      event.stopPropagation();
      step(event.deltaX > 0 ? 1 : -1);
    }, {passive:false});
  }

  function setActive(nextMode) {
    if (!ensureHost()) return false;
    if (!MODE_SET.has(nextMode)) {
      deactivate();
      return false;
    }
    const nextItems = collectItems();
    const sig = signatureOf(nextItems);
    const modeChanged = mode !== nextMode;
    const dataChanged = sig !== lastSignature;
    mode = nextMode;
    items = nextItems;
    lastSignature = sig;

    const orbitIndex = Number(window.RestaurantOrbit?.getActiveIndex?.());
    if (modeChanged && Number.isFinite(orbitIndex)) progress = orbitIndex;
    if (items.length) {
      progress = mod(progress, items.length);
      activeIndex = mod(Math.round(progress), items.length);
    } else {
      progress = 0;
      activeIndex = 0;
    }

    if (modeChanged || dataChanged || !host.children.length) buildMode(mode);
    section.classList.add('npe-active');
    section.dataset.nativeEngine = mode;
    host.hidden = false;
    host.inert = false;
    host.setAttribute('aria-hidden', 'false');
    root.dataset.nativeProductEngine = mode;
    root.dataset.orbitalChoreography = mode;
    render();
    document.dispatchEvent(new CustomEvent('restaurant:native-product-engine-change', {
      detail:{mode,activeIndex,count:items.length}
    }));
    return true;
  }

  function deactivate() {
    if (!host) return;
    if (window.gsap) {
      try { gsap.killTweensOf($$('*', host)); } catch (_) {}
    }
    host.hidden = true;
    host.inert = true;
    host.setAttribute('aria-hidden', 'true');
    delete host.dataset.dragging;
    section?.classList.remove('npe-active');
    if (section) delete section.dataset.nativeEngine;
    delete root.dataset.nativeProductEngine;
    if (MODE_SET.has(root.dataset.orbitalChoreography || '')) delete root.dataset.orbitalChoreography;
    mode = '';
    drag.pointerId = null;
    drag.intent = 'idle';
  }

  function activateFromDocument() {
    const desired = root.dataset.orbitalMotion || '';
    if (MODE_SET.has(desired)) setActive(desired);
    else deactivate();
  }

  function refresh() {
    if (!isNative()) return false;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => setActive(root.dataset.orbitalMotion), 0);
    return true;
  }

  window.addEventListener('restaurant:motion-change', activateFromDocument);
  document.addEventListener('restaurant:config-applied', refresh);
  window.addEventListener('resize', () => { if (isNative(mode)) render(); }, {passive:true});
  reduced.addEventListener?.('change', () => { if (isNative(mode)) render(); });

  const api = Object.freeze({
    modes: () => MODES.slice(),
    activate: setActive,
    refresh,
    deactivate,
    step,
    goTo,
    openDetail,
    state: () => ({
      mounted,
      active: isNative(mode),
      mode,
      activeIndex,
      progress,
      count: items.length,
      hidden: host?.hidden ?? true
    })
  });
  window.RestaurantNativeProductEngines = api;
  root.dataset.nativeProductEnginesReady = 'ready';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(activateFromDocument, 0), {once:true});
  } else {
    setTimeout(activateFromDocument, 0);
  }
})();
