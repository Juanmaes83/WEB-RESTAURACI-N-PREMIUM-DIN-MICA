/* PROJECT 11 — CINEMATIC PRODUCT RAIL / CLASS 15
   Isolated product-motion lab. One canonical railProgress drives geometry and selection. */
(() => {
  'use strict';

  const root = document.getElementById('cpr-page');
  const viewport = document.getElementById('cpr-viewport');
  const track = document.getElementById('cpr-track');
  if (!root || !viewport || !track || !window.RestaurantDefaults?.dishes) return;

  const dishes = window.RestaurantDefaults.dishes.filter((dish) => dish.enabled !== false);
  const count = dishes.length;
  if (!count) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set();
  const itemNodes = [];

  const els = {
    counter: document.getElementById('cpr-counter'),
    kicker: document.getElementById('cpr-kicker'),
    title: document.getElementById('cpr-title'),
    short: document.getElementById('cpr-short'),
    ingredients: document.getElementById('cpr-ingredients'),
    price: document.getElementById('cpr-price'),
    word: document.getElementById('cpr-world-word'),
    prev: document.getElementById('cpr-prev'),
    next: document.getElementById('cpr-next'),
    explore: document.getElementById('cpr-explore'),
    live: document.getElementById('cpr-live'),
    detail: document.getElementById('cpr-detail'),
    detailClose: document.getElementById('cpr-detail-close'),
    detailTitle: document.getElementById('cpr-detail-title'),
    detailMeta: document.getElementById('cpr-detail-meta'),
    detailStory: document.getElementById('cpr-detail-story'),
    detailIngredients: document.getElementById('cpr-detail-ingredients'),
    detailOrigin: document.getElementById('cpr-detail-origin'),
    detailTechnique: document.getElementById('cpr-detail-technique'),
    detailPairing: document.getElementById('cpr-detail-pairing')
  };

  const mod = (n, m) => ((n % m) + m) % m;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const hexToRgb = (hex) => {
    const clean = String(hex || '#09090b').replace('#', '');
    const value = clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6);
    const n = Number.parseInt(value, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };

  const mixHex = (a, b, t) => {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    const r = Math.round(lerp(ca.r, cb.r, t));
    const g = Math.round(lerp(ca.g, cb.g, t));
    const bl = Math.round(lerp(ca.b, cb.b, t));
    return `rgb(${r} ${g} ${bl})`;
  };

  // Signed shortest distance from the rail's continuous progress to an item index.
  const wrapDistance = (index, progress) => {
    let d = index - mod(progress, count);
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  let railProgress = 0;
  let animationFrame = 0;
  let dragging = false;
  let dragOriginX = 0;
  let dragOriginProgress = 0;
  let previousProgress = 0;
  let previousTime = 0;
  let progressVelocity = 0;
  let lastRenderedIndex = -1; // DOM cache only; never authoritative product state.
  let wheelLockedUntil = 0;

  function activeIndex() {
    return mod(Math.round(railProgress), count);
  }

  function makeItems() {
    dishes.forEach((dish, index) => {
      const article = document.createElement('article');
      article.className = 'cpr-item';
      article.dataset.index = String(index);
      article.tabIndex = -1;
      article.setAttribute('aria-label', dish.name);
      const img = document.createElement('img');
      img.draggable = false;
      img.alt = dish.name;
      img.src = dish.depthCarousel?.asset || dish.image;
      const label = document.createElement('span');
      label.textContent = String(index + 1).padStart(2, '0');
      article.append(img, label);
      article.addEventListener('click', () => {
        const distance = wrapDistance(index, railProgress);
        if (Math.abs(distance) < 0.35) openDetail();
        else animateTo(railProgress + distance);
      });
      track.appendChild(article);
      itemNodes.push(article);
    });
  }

  function updateCopy(index) {
    if (index === lastRenderedIndex) return;
    lastRenderedIndex = index;
    const dish = dishes[index];
    root.classList.remove('cpr-copy-swap');
    void root.offsetWidth;
    root.classList.add('cpr-copy-swap');
    els.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    els.kicker.textContent = dish.meta || 'Signature selection';
    els.title.textContent = dish.name;
    els.short.textContent = dish.short || '';
    els.ingredients.textContent = dish.ingredients || '';
    els.price.textContent = dish.price || '';
    els.word.textContent = dish.depthCarousel?.word || dish.name.split(' ')[0].toUpperCase();
    els.live.textContent = `Selected dish: ${dish.name}`;
  }

  function updateWorld() {
    const base = Math.floor(railProgress);
    const t = railProgress - base;
    const a = dishes[mod(base, count)];
    const b = dishes[mod(base + 1, count)];
    const aBg = a.depthCarousel?.backgroundColor || '#111114';
    const bBg = b.depthCarousel?.backgroundColor || '#111114';
    const aAccent = a.depthCarousel?.accent || '#d8ff4f';
    const bAccent = b.depthCarousel?.accent || '#d8ff4f';
    root.style.setProperty('--cpr-world', mixHex(aBg, bBg, t));
    root.style.setProperty('--cpr-accent', mixHex(aAccent, bAccent, t));
    root.style.setProperty('--cpr-drift', `${(t - 0.5) * 18}px`);
  }

  function render() {
    const index = activeIndex();
    updateWorld();
    updateCopy(index);

    itemNodes.forEach((node, itemIndex) => {
      const d = wrapDistance(itemIndex, railProgress);
      const ad = Math.abs(d);
      let scale;
      if (ad <= 1) scale = lerp(1, 0.72, ad);
      else if (ad <= 2) scale = lerp(0.72, 0.48, ad - 1);
      else scale = lerp(0.48, 0.34, clamp(ad - 2, 0, 1));

      let opacity;
      if (ad <= 1) opacity = lerp(1, 0.86, ad);
      else if (ad <= 2) opacity = lerp(0.86, 0.38, ad - 1);
      else opacity = lerp(0.38, 0.08, clamp(ad - 2, 0, 1));

      const x = d * 78;
      const y = Math.min(ad, 3) * 18 + Math.pow(Math.min(ad, 2.4), 2) * 5;
      const rotation = d * -4.5;
      const heroLift = Math.max(0, 1 - ad * 1.65) * -10;
      const z = Math.max(1, 100 - Math.round(ad * 25));

      node.style.transform = `translate(-50%, -50%) translateX(${x}%) translateY(${y + heroLift}px) scale(${scale}) rotate(${rotation}deg)`;
      node.style.opacity = String(opacity);
      node.style.zIndex = String(z);
      node.style.filter = ad < 0.45
        ? 'brightness(1.08) saturate(1.08) contrast(1.03)'
        : `brightness(${lerp(0.92, 0.72, clamp(ad / 2.5, 0, 1))}) saturate(${lerp(0.92, 0.62, clamp(ad / 2.5, 0, 1))})`;
      node.classList.toggle('is-hero', ad < 0.45);
      node.setAttribute('aria-hidden', ad > 2.55 ? 'true' : 'false');
    });

    root.dataset.dragging = dragging ? 'true' : 'false';
    root.dataset.activeIndex = String(index);
    listeners.forEach((fn) => fn({ railProgress, activeIndex: index }));
  }

  function cancelAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function animateTo(target, duration = 620) {
    cancelAnimation();
    if (reducedMotion.matches) {
      railProgress = target;
      render();
      return;
    }
    const start = railProgress;
    const delta = target - start;
    const started = performance.now();
    const tick = (now) => {
      const t = clamp((now - started) / duration, 0, 1);
      railProgress = start + delta * easeOut(t);
      render();
      if (t < 1) animationFrame = requestAnimationFrame(tick);
      else {
        railProgress = target;
        animationFrame = 0;
        render();
      }
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function step(delta) {
    animateTo(Math.round(railProgress) + delta);
  }

  function openDetail() {
    const dish = dishes[activeIndex()];
    els.detailTitle.textContent = dish.name;
    els.detailMeta.textContent = dish.meta || '';
    els.detailStory.textContent = dish.short || '';
    els.detailIngredients.textContent = dish.ingredients || '';
    els.detailOrigin.textContent = dish.origin || '';
    els.detailTechnique.textContent = dish.technique || '';
    els.detailPairing.textContent = dish.pairing || '';
    if (typeof els.detail.showModal === 'function') els.detail.showModal();
    else els.detail.setAttribute('open', '');
  }

  function closeDetail() {
    if (typeof els.detail.close === 'function') els.detail.close();
    else els.detail.removeAttribute('open');
  }

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    cancelAnimation();
    dragging = true;
    viewport.setPointerCapture?.(event.pointerId);
    dragOriginX = event.clientX;
    dragOriginProgress = railProgress;
    previousProgress = railProgress;
    previousTime = performance.now();
    progressVelocity = 0;
    root.classList.remove('cpr-copy-swap');
    render();
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const stepPixels = Math.max(220, viewport.clientWidth * 0.38);
    const nextProgress = dragOriginProgress - (event.clientX - dragOriginX) / stepPixels;
    const now = performance.now();
    const dt = Math.max(8, now - previousTime);
    progressVelocity = (nextProgress - previousProgress) / dt;
    railProgress = nextProgress;
    previousProgress = nextProgress;
    previousTime = now;
    render();
  });

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    const projected = railProgress + progressVelocity * 150;
    const origin = Math.round(dragOriginProgress);
    const target = clamp(Math.round(projected), origin - 1, origin + 1);
    animateTo(target, 540);
  };
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  viewport.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
    const now = performance.now();
    if (now < wheelLockedUntil) return;
    wheelLockedUntil = now + 520;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    step(delta > 0 ? 1 : -1);
  }, { passive: false });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(); }
  });

  els.prev?.addEventListener('click', () => step(-1));
  els.next?.addEventListener('click', () => step(1));
  els.explore?.addEventListener('click', openDetail);
  els.detailClose?.addEventListener('click', closeDetail);
  els.detail?.addEventListener('click', (event) => { if (event.target === els.detail) closeDetail(); });

  reducedMotion.addEventListener?.('change', render);

  makeItems();
  render();

  window.CinematicProductRail = Object.freeze({
    getProgress: () => railProgress,
    getActiveIndex: activeIndex,
    getDishes: () => dishes.slice(),
    step,
    setProgress(value, options = {}) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      if (options.animate) animateTo(numeric, options.duration || 620);
      else { cancelAnimation(); railProgress = numeric; render(); }
    },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  });
})();
