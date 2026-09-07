(() => {
  'use strict';

  const STEP_DEG = 45;
  const BASE_OFFSET_DEG = -22.5;
  const COUNT = 8;
  const NAMES = [
    'Diavola',
    'Prosciutto Funghi',
    '4 Quesos',
    'Mortadela y Pistacho',
    'Carbonara',
    'Barbacoa',
    'Verduras',
    'Margarita'
  ];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell = document.getElementById('cdr-shell');
  const disc = document.getElementById('cdr-disc');
  const counter = document.getElementById('cdr-counter');
  const nameEl = document.getElementById('cdr-name');
  const live = document.getElementById('cdr-live');
  const prev = document.getElementById('cdr-prev');
  const next = document.getElementById('cdr-next');
  const spin = document.getElementById('cdr-spin');

  if (!shell || !disc || !counter || !nameEl || !prev || !next || !spin) return;

  let rotationProgress = 0;
  let tween = null;
  let spinning = false;
  let dragging = false;
  let dragPointerId = null;
  let dragStartAngle = 0;
  let dragStartProgress = 0;
  let previousAngle = 0;
  let previousTime = 0;
  let angularVelocity = 0;
  let lastAnnounced = null;

  const mod = (value, n) => ((value % n) + n) % n;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nearestIndex = () => mod(Math.round(rotationProgress), COUNT);
  const rotationDeg = () => BASE_OFFSET_DEG - rotationProgress * STEP_DEG;
  const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
  const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function render({announce = false} = {}) {
    disc.style.transform = `rotate(${rotationDeg().toFixed(3)}deg)`;
    const index = nearestIndex();
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(COUNT).padStart(2, '0')}`;
    nameEl.textContent = NAMES[index];
    shell.dataset.activeIndex = String(index);
    shell.style.setProperty('--cdr-progress', rotationProgress.toFixed(4));
    shell.style.setProperty('--cdr-rotation', `${rotationDeg().toFixed(3)}deg`);
    if (announce && lastAnnounced !== index) {
      lastAnnounced = index;
      live.textContent = `Selected pizza: ${NAMES[index]}`;
    }
  }

  function cancelTween() {
    if (tween?.raf) cancelAnimationFrame(tween.raf);
    tween = null;
  }

  function animateTo(target, duration = 480, {announce = true, easing = easeInOutCubic} = {}) {
    cancelTween();
    if (reducedMotion.matches || duration <= 0) {
      rotationProgress = target;
      render({announce});
      return Promise.resolve();
    }

    const start = rotationProgress;
    const delta = target - start;
    const t0 = performance.now();

    return new Promise(resolve => {
      tween = {raf: 0};
      const frame = now => {
        const p = clamp((now - t0) / duration, 0, 1);
        rotationProgress = start + delta * easing(p);
        render();
        if (p < 1) {
          tween.raf = requestAnimationFrame(frame);
          return;
        }
        rotationProgress = target;
        tween = null;
        render({announce});
        resolve();
      };
      tween.raf = requestAnimationFrame(frame);
    });
  }

  function stepBy(amount) {
    if (spinning) return;
    const anchor = Math.round(rotationProgress);
    animateTo(anchor + amount, 460, {announce: true});
  }

  function pointAngle(event) {
    const rect = shell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI;
  }

  function shortestAngleDelta(nextAngle, prevAngle) {
    let d = nextAngle - prevAngle;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  shell.addEventListener('pointerdown', event => {
    if (spinning) return;
    cancelTween();
    dragging = true;
    dragPointerId = event.pointerId;
    dragStartAngle = pointAngle(event);
    previousAngle = dragStartAngle;
    previousTime = performance.now();
    dragStartProgress = rotationProgress;
    angularVelocity = 0;
    shell.setPointerCapture?.(event.pointerId);
    shell.dataset.dragging = 'true';
  });

  shell.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    const now = performance.now();
    const angle = pointAngle(event);
    const totalDelta = shortestAngleDelta(angle, dragStartAngle);
    const frameDelta = shortestAngleDelta(angle, previousAngle);
    const dt = Math.max(8, now - previousTime);

    // Positive hand rotation turns the visual product in the same direction.
    rotationProgress = dragStartProgress - totalDelta / STEP_DEG;
    angularVelocity = frameDelta / dt; // deg/ms
    previousAngle = angle;
    previousTime = now;
    render();
  });

  function endDrag(event) {
    if (!dragging || event.pointerId !== dragPointerId) return;
    dragging = false;
    shell.dataset.dragging = 'false';
    shell.releasePointerCapture?.(event.pointerId);
    dragPointerId = null;

    // Project a restrained amount of angular momentum, then snap to the nearest 45° sector.
    const projectedDeg = angularVelocity * 170;
    const projectedProgress = rotationProgress - projectedDeg / STEP_DEG;
    const target = Math.round(projectedProgress);
    animateTo(target, 520, {announce: true});
  }

  shell.addEventListener('pointerup', endDrag);
  shell.addEventListener('pointercancel', endDrag);

  shell.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepBy(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      discover();
    }
  });

  prev.addEventListener('click', () => stepBy(-1));
  next.addEventListener('click', () => stepBy(1));

  async function discover() {
    if (spinning || dragging) return;
    spinning = true;
    shell.dataset.spinning = 'true';
    spin.disabled = true;
    prev.disabled = true;
    next.disabled = true;

    const current = Math.round(rotationProgress);
    const currentIndex = mod(current, COUNT);
    let targetIndex = Math.floor(Math.random() * COUNT);
    if (targetIndex === currentIndex) targetIndex = mod(targetIndex + 1 + Math.floor(Math.random() * (COUNT - 1)), COUNT);
    const forwardSteps = mod(targetIndex - currentIndex, COUNT) || COUNT;
    const turns = 2 + Math.floor(Math.random() * 3);
    const target = current + turns * COUNT + forwardSteps;
    const duration = reducedMotion.matches ? 0 : 2300 + turns * 240;

    await animateTo(target, duration, {announce: true, easing: easeOutQuint});

    spinning = false;
    shell.dataset.spinning = 'false';
    spin.disabled = false;
    prev.disabled = false;
    next.disabled = false;
  }

  spin.addEventListener('click', discover);

  // Test/debug adapter. The lab still has one canonical state: rotationProgress.
  window.CircularDishRotator = Object.freeze({
    getProgress: () => rotationProgress,
    getActiveIndex: nearestIndex,
    getRotationDeg: rotationDeg,
    getNames: () => [...NAMES],
    setProgress(value, announce = false) {
      cancelTween();
      rotationProgress = Number(value) || 0;
      render({announce});
    },
    next: () => stepBy(1),
    prev: () => stepBy(-1),
    discover
  });

  render({announce: false});
})();