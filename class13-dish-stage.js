/* PROJECT 10 — DISH STAGE LAB
   Isolated product-stage engine. No Studio/runtime integration in this branch.
   Canonical state: `position` only. Active dish is always derived from it.
*/
(() => {
  'use strict';

  const root = document.querySelector('[data-dish-stage-lab]');
  if (!root) return;

  const $ = (s, r = root) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const source = (window.RestaurantDefaults?.dishes || []).filter(d => d.enabled !== false);
  const dishes = source.map((dish, i) => ({
    ...dish,
    dishStage: {
      word: dish.depthCarousel?.word || String(dish.name || 'DISH').split(/[\s/·—-]+/)[0].toUpperCase(),
      accent: dish.depthCarousel?.accent || window.RestaurantDefaults?.brand?.accent || '#d8ff4f',
      backgroundColor: dish.depthCarousel?.backgroundColor || '#090907',
      asset: dish.depthCarousel?.asset || dish.image,
      ...(dish.dishStage || {})
    },
    __index: i
  }));

  if (!dishes.length) return;

  const stage = $('[data-ds-stage]');
  const worldA = $('[data-ds-world-a]');
  const worldB = $('[data-ds-world-b]');
  const word = $('[data-ds-word]');
  const indexEl = $('[data-ds-index]');
  const metaEl = $('[data-ds-meta]');
  const titleEl = $('[data-ds-title]');
  const shortEl = $('[data-ds-short]');
  const ingredientsEl = $('[data-ds-ingredients]');
  const priceEl = $('[data-ds-price]');
  const counterEl = $('[data-ds-counter]');
  const liveEl = $('[data-ds-live]');
  const prevBtn = $('[data-ds-prev]');
  const nextBtn = $('[data-ds-next]');
  const exploreBtn = $('[data-ds-explore]');
  const detail = $('[data-ds-detail]');
  const detailClose = $('[data-ds-detail-close]');

  let position = 0;
  let tween = null;
  let dragging = false;
  let pointerId = null;
  let dragOriginX = 0;
  let dragOriginPosition = 0;
  let lastPointerX = 0;
  let lastPointerT = 0;
  let progressVelocity = 0;
  let lastRenderedIndex = -1; // render cache only; never authoritative product state
  let wheelLockUntil = 0;

  const total = () => dishes.length;
  const normalize = v => ((v % total()) + total()) % total();
  const activeIndex = () => normalize(Math.round(position));
  const dishAt = i => dishes[normalize(i)];
  const activeDish = () => dishAt(activeIndex());

  function continuousDistance(i, p = position) {
    const n = total();
    let d = i - p;
    while (d > n / 2) d -= n;
    while (d < -n / 2) d += n;
    return d;
  }

  function hexToRgb(hex) {
    const raw = String(hex || '#000').replace('#', '');
    const v = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
    const n = parseInt(v, 16);
    return Number.isFinite(n) ? [n >> 16 & 255, n >> 8 & 255, n & 255] : [0, 0, 0];
  }
  const rgb = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  function worldForProgress() {
    const lo = Math.floor(position);
    const hi = lo + 1;
    const tRaw = position - lo;
    const t = tRaw * tRaw * (3 - 2 * tRaw);
    const a = dishAt(lo).dishStage;
    const b = dishAt(hi).dishStage;
    const cA = hexToRgb(a.backgroundColor);
    const cB = hexToRgb(b.backgroundColor);
    const accentA = hexToRgb(a.accent);
    const accentB = hexToRgb(b.accent);
    root.style.setProperty('--ds-world', rgb(mix(cA, cB, t)));
    root.style.setProperty('--ds-accent', rgb(mix(accentA, accentB, t)));
    root.style.setProperty('--ds-world-next', b.backgroundColor);
    if (worldA) worldA.style.background = `radial-gradient(circle at 70% 48%, ${rgb(mix(accentA, [0,0,0], .52))} 0%, transparent 38%), ${rgb(mix(cA, cB, t))}`;
    if (worldB) worldB.style.opacity = String(clamp(Math.abs(tRaw - .5) * -.55 + .22, 0, .16));
  }

  function trackFor(distance) {
    const mobile = innerWidth < 760;
    const a = clamp(Math.abs(distance), 0, 1.35);
    const sign = Math.sign(distance) || 1;
    if (mobile) {
      const y = distance > 0 ? -a * 235 : a * 255;
      const x = sign * a * 28;
      return {
        x, y,
        scale: 1 - a * .34,
        rotation: sign * a * 6,
        opacity: clamp(1 - a * .76, 0, 1),
        blur: a * 2.2,
        z: Math.round(100 - a * 42)
      };
    }
    const x = distance > 0 ? a * 360 : -a * 330;
    const y = distance > 0 ? -a * 118 : a * 150;
    return {
      x, y,
      scale: 1 - a * .35,
      rotation: distance > 0 ? -a * 8 : a * 7,
      opacity: clamp(1 - a * .72, 0, 1),
      blur: a * 2.6,
      z: Math.round(100 - a * 45)
    };
  }

  function renderProducts() {
    const nodes = [...stage.querySelectorAll('.ds-product')];
    nodes.forEach((node, i) => {
      const d = continuousDistance(i);
      const slot = trackFor(d);
      const hero = Math.abs(d) < .16;
      node.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0) scale(${slot.scale}) rotate(${slot.rotation}deg)`;
      node.style.opacity = String(slot.opacity);
      node.style.zIndex = String(slot.z);
      node.style.filter = `blur(${slot.blur}px) brightness(${hero ? 1.09 : .72 + slot.opacity * .25}) saturate(${hero ? 1.06 : .9})`;
      node.style.pointerEvents = Math.abs(d) < .42 ? 'auto' : 'none';
      node.dataset.hero = hero ? 'true' : 'false';
      node.setAttribute('aria-hidden', Math.abs(d) > .65 ? 'true' : 'false');
    });
  }

  function setCopy(index, announce = false) {
    const d = dishAt(index);
    const ds = d.dishStage;
    root.classList.add('ds-copy-changing');
    requestAnimationFrame(() => {
      if (indexEl) indexEl.textContent = `${String(index + 1).padStart(2, '0')} / SIGNATURE`;
      if (metaEl) metaEl.textContent = d.meta || '';
      if (titleEl) titleEl.textContent = d.name || '';
      if (shortEl) shortEl.textContent = d.short || '';
      if (ingredientsEl) ingredientsEl.textContent = d.ingredients || '';
      if (priceEl) priceEl.textContent = d.price || '';
      if (counterEl) counterEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total()).padStart(2, '0')}`;
      if (word) word.textContent = ds.word || 'DISH';
      root.style.setProperty('--ds-active-accent', ds.accent);
      root.dataset.activeDish = d.id || String(index);
      requestAnimationFrame(() => root.classList.remove('ds-copy-changing'));
      if (announce && liveEl) liveEl.textContent = `Selected dish: ${d.name}`;
    });
  }

  function syncDerivedUI(announce = false) {
    const nextIndex = activeIndex();
    if (nextIndex !== lastRenderedIndex) {
      lastRenderedIndex = nextIndex;
      setCopy(nextIndex, announce);
    }
  }

  function render(announce = false) {
    worldForProgress();
    renderProducts();
    syncDerivedUI(announce);
    root.style.setProperty('--ds-fraction', String(Math.abs(position - Math.round(position))));
  }

  function killTween() {
    tween?.kill?.();
    tween = null;
  }

  function animatePosition(target, duration = .78, announce = true) {
    killTween();
    const roundedTarget = Math.round(target);
    if (reduced.matches || !window.gsap) {
      position = roundedTarget;
      render(announce);
      settlePulse();
      return;
    }
    const state = { p: position };
    tween = gsap.to(state, {
      p: roundedTarget,
      duration,
      ease: 'power4.inOut',
      onUpdate() {
        position = state.p;
        render(false);
      },
      onComplete() {
        position = roundedTarget;
        render(announce);
        settlePulse();
        tween = null;
      }
    });
  }

  function settlePulse() {
    const hero = stage.querySelector('.ds-product[data-hero="true"] .ds-product-visual');
    if (!hero || reduced.matches || !window.gsap) return;
    gsap.killTweensOf(hero);
    gsap.timeline()
      .fromTo(hero, { scale: .985, y: 4 }, { scale: 1.035, y: -8, duration: .22, ease: 'power3.out' })
      .to(hero, { scale: 1, y: 0, duration: .34, ease: 'elastic.out(1,.55)' });
  }

  function step(direction) {
    const base = Math.round(position);
    animatePosition(base + Math.sign(direction || 1), reduced.matches ? 0 : .82, true);
  }

  function onPointerDown(e) {
    if (detail?.classList.contains('is-open')) return;
    killTween();
    dragging = true;
    pointerId = e.pointerId;
    dragOriginX = lastPointerX = e.clientX;
    dragOriginPosition = position;
    lastPointerT = performance.now();
    progressVelocity = 0;
    root.classList.add('is-dragging');
    root.setPointerCapture?.(pointerId);
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const now = performance.now();
    const unit = innerWidth < 760 ? 150 : 245;
    position = dragOriginPosition - (e.clientX - dragOriginX) / unit;
    const dt = Math.max(8, now - lastPointerT);
    const dxProgress = -((e.clientX - lastPointerX) / unit);
    progressVelocity = dxProgress / dt;
    lastPointerX = e.clientX;
    lastPointerT = now;
    render(false);
  }

  function onPointerEnd(e) {
    if (!dragging || (e.pointerId != null && e.pointerId !== pointerId)) return;
    dragging = false;
    root.classList.remove('is-dragging');
    root.releasePointerCapture?.(pointerId);
    const anchor = Math.round(dragOriginPosition);
    const delta = position - anchor;
    const projected = delta + progressVelocity * 165;
    let direction = 0;
    if (Math.abs(projected) > .34) direction = Math.sign(projected);
    const target = anchor + direction;
    pointerId = null;
    animatePosition(target, reduced.matches ? 0 : .62 + Math.min(.22, Math.abs(progressVelocity) * 38), true);
  }

  function openDetail() {
    const d = activeDish();
    if (!detail || !d) return;
    $('[data-detail-meta]', detail).textContent = d.meta || '';
    $('[data-detail-title]', detail).textContent = d.name || '';
    $('[data-detail-price]', detail).textContent = d.price || '';
    $('[data-detail-description]', detail).textContent = d.short || '';
    $('[data-detail-ingredients]', detail).textContent = d.ingredients || '';
    $('[data-detail-origin]', detail).textContent = d.origin || '';
    $('[data-detail-technique]', detail).textContent = d.technique || '';
    $('[data-detail-pairing]', detail).textContent = d.pairing || '';
    const media = $('[data-detail-media]', detail);
    media.src = d.dishStage.asset || d.image || '';
    media.alt = d.name || 'Dish';
    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    detailClose?.focus();
  }

  function closeDetail() {
    if (!detail) return;
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    exploreBtn?.focus();
  }

  function build() {
    stage.innerHTML = '';
    dishes.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-product';
      btn.dataset.index = String(i);
      btn.setAttribute('aria-label', `View ${d.name}`);
      const visual = document.createElement('span');
      visual.className = 'ds-product-visual';
      const img = document.createElement('img');
      img.src = d.dishStage.asset || d.image || '';
      img.alt = d.name || 'Dish';
      img.draggable = false;
      visual.appendChild(img);
      btn.appendChild(visual);
      btn.addEventListener('click', () => {
        const dist = continuousDistance(i);
        if (Math.abs(dist) < .18) openDetail();
        else animatePosition(position + dist, .72, true);
      });
      stage.appendChild(btn);
    });
    render(false);
    settlePulse();
  }

  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));
  exploreBtn?.addEventListener('click', openDetail);
  detailClose?.addEventListener('click', closeDetail);
  detail?.addEventListener('click', e => { if (e.target === detail) closeDetail(); });

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerEnd);
  root.addEventListener('pointercancel', onPointerEnd);
  root.addEventListener('wheel', e => {
    if (detail?.classList.contains('is-open') || Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    const now = performance.now();
    if (now < wheelLockUntil) return;
    wheelLockUntil = now + 560;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'Enter' && e.target === root) { e.preventDefault(); openDetail(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
  addEventListener('resize', () => render(false));
  reduced.addEventListener?.('change', () => { killTween(); position = Math.round(position); render(false); });

  build();

  window.DishStageEngine = Object.freeze({
    getPosition: () => position,
    getActiveIndex: () => activeIndex(),
    getDishes: () => dishes.map(({ __index, ...d }) => d),
    setPosition(v) { killTween(); position = Number(v) || 0; render(false); },
    next: () => step(1),
    prev: () => step(-1),
    openDetail,
    closeDetail
  });
})();
