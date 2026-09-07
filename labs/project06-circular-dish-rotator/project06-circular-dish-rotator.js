(() => {
  'use strict';

  const STEP_DEG = 45;
  const BASE_OFFSET_DEG = -22.5;
  const COUNT = 8;

  // Demo content only. The motor consumes data; the final Studio integration will
  // expose these fields for restaurant-specific authoring.
  const PIZZAS = [
    {
      name:'Diavola',
      ingredients:'Tomate San Marzano · fior di latte · salami picante · albahaca',
      price:'€14',
      descriptor:'spicy · smoky · bold',
      mood:'FIRE · SIGNATURE 01',
      lead:'the slice with',
      tail:'Fire at the centre of the table.',
      accent:'#ff5a36'
    },
    {
      name:'Prosciutto Funghi',
      ingredients:'Tomate · mozzarella · prosciutto cotto · champiñón · parmigiano',
      price:'€15',
      descriptor:'silky · savoury · woodland',
      mood:'FOREST · SIGNATURE 02',
      lead:'a softer kind of',
      tail:'Silk, earth and savoury depth.',
      accent:'#d6a56d'
    },
    {
      name:'4 Quesos',
      ingredients:'Fior di latte · gorgonzola · taleggio · parmigiano',
      price:'€15',
      descriptor:'creamy · rich · intense',
      mood:'CREAM · SIGNATURE 03',
      lead:'melt into',
      tail:'Four cheeses. One unapologetic finish.',
      accent:'#f0c867'
    },
    {
      name:'Mortadela y Pistacho',
      ingredients:'Mortadela · burrata · crema de pistacho · pistacho tostado',
      price:'€16',
      descriptor:'velvety · nutty · elegant',
      mood:'SILK · SIGNATURE 04',
      lead:'dress the table in',
      tail:'Velvet, pistachio and a slow finish.',
      accent:'#a9c875'
    },
    {
      name:'Carbonara',
      ingredients:'Fior di latte · guanciale · pecorino · yema · pimienta negra',
      price:'€16',
      descriptor:'golden · peppery · indulgent',
      mood:'GOLD · SIGNATURE 05',
      lead:'go all in on',
      tail:'Golden richness with a peppered edge.',
      accent:'#e5b84b'
    },
    {
      name:'Barbacoa',
      ingredients:'Mozzarella · carne especiada · cebolla roja · salsa barbacoa ahumada',
      price:'€15',
      descriptor:'smoked · sweet · robust',
      mood:'SMOKE · SIGNATURE 06',
      lead:'turn up the',
      tail:'Smoke, sweetness and serious appetite.',
      accent:'#d86f43'
    },
    {
      name:'Verduras',
      ingredients:'Calabacín · pimiento · berenjena · tomate · pesto de albahaca',
      price:'€14',
      descriptor:'fresh · green · vibrant',
      mood:'GARDEN · SIGNATURE 07',
      lead:'keep it vivid with',
      tail:'The garden, sharpened into a slice.',
      accent:'#7cbf72'
    },
    {
      name:'Margarita',
      ingredients:'Tomate San Marzano · fior di latte · albahaca · aceite de oliva virgen extra',
      price:'€13',
      descriptor:'clean · classic · bright',
      mood:'CLASSIC · SIGNATURE 08',
      lead:'come back to',
      tail:'The original. Still impossible to beat.',
      accent:'#e05b4f'
    }
  ];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shell = document.getElementById('cdr-shell');
  const disc = document.getElementById('cdr-disc');
  const sectorDisc = document.getElementById('cdr-sector-disc');
  const counter = document.getElementById('cdr-counter');
  const nameEl = document.getElementById('cdr-name');
  const heroName = document.getElementById('cdr-hero-name');
  const ghostName = document.getElementById('cdr-ghost-name');
  const moodEl = document.getElementById('cdr-mood');
  const leadEl = document.getElementById('cdr-headline-lead');
  const tailEl = document.getElementById('cdr-headline-tail');
  const ingredientsEl = document.getElementById('cdr-ingredients');
  const priceEl = document.getElementById('cdr-price');
  const descriptorEl = document.getElementById('cdr-descriptor');
  const copy = document.getElementById('cdr-copy');
  const live = document.getElementById('cdr-live');
  const prev = document.getElementById('cdr-prev');
  const next = document.getElementById('cdr-next');
  const spin = document.getElementById('cdr-spin');
  const spinLabel = document.getElementById('cdr-spin-label');
  const hint = document.getElementById('cdr-hint');

  if (!shell || !disc || !sectorDisc || !counter || !nameEl || !heroName || !ghostName || !moodEl || !leadEl || !tailEl || !ingredientsEl || !priceEl || !descriptorEl || !copy || !prev || !next || !spin || !spinLabel || !hint) return;

  // ONE canonical selection state. Everything visual and interactive derives from this.
  let rotationProgress = 0;
  let tween = null;
  let spinning = false;
  let dragging = false;
  let dragPointerId = null;
  let dragStartProgress = 0;
  let dragAccumulatedDeg = 0;
  let previousAngle = 0;
  let previousTime = 0;
  let angularVelocity = 0;
  let lastAnnounced = null;
  let lastVisualIndex = null;
  let tickTimer = 0;
  let copyTimer = 0;
  let landTimer = 0;

  const mod = (value, n) => ((value % n) + n) % n;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nearestIndex = () => mod(Math.round(rotationProgress), COUNT);
  const rotationDeg = () => BASE_OFFSET_DEG - rotationProgress * STEP_DEG;
  const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
  const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeInCubic = t => t * t * t;

  function pulseSectorCross(index) {
    if (lastVisualIndex === null) {
      lastVisualIndex = index;
      return;
    }
    if (index === lastVisualIndex) return;
    lastVisualIndex = index;

    clearTimeout(tickTimer);
    shell.classList.remove('cdr-tick-hit');
    void shell.offsetWidth;
    shell.classList.add('cdr-tick-hit');
    tickTimer = setTimeout(() => shell.classList.remove('cdr-tick-hit'), 135);

    clearTimeout(copyTimer);
    copy.classList.remove('cdr-copy-change');
    void copy.offsetWidth;
    copy.classList.add('cdr-copy-change');
    copyTimer = setTimeout(() => copy.classList.remove('cdr-copy-change'), 320);
  }

  function updateCopy(index) {
    const pizza = PIZZAS[index];
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(COUNT).padStart(2, '0')}`;
    nameEl.textContent = pizza.name;
    heroName.textContent = pizza.name;
    ghostName.textContent = pizza.name.toUpperCase();
    moodEl.textContent = pizza.mood;
    leadEl.textContent = pizza.lead;
    tailEl.textContent = pizza.tail;
    ingredientsEl.textContent = pizza.ingredients;
    priceEl.textContent = pizza.price;
    descriptorEl.textContent = pizza.descriptor;
    document.documentElement.style.setProperty('--cdr-accent', pizza.accent);
    shell.dataset.pizza = pizza.name.toLowerCase().replace(/\s+/g,'-');
  }

  function render({announce = false} = {}) {
    const deg = rotationDeg();
    const transform = `rotate(${deg.toFixed(3)}deg)`;
    disc.style.transform = transform;
    sectorDisc.style.transform = transform;

    const index = nearestIndex();
    pulseSectorCross(index);
    updateCopy(index);

    shell.dataset.activeIndex = String(index);
    shell.style.setProperty('--cdr-progress', rotationProgress.toFixed(4));
    shell.style.setProperty('--cdr-rotation', `${deg.toFixed(3)}deg`);

    if (announce && lastAnnounced !== index) {
      lastAnnounced = index;
      live.textContent = `Selected pizza: ${PIZZAS[index].name}`;
    }
  }

  function setSettled(value, {announce = false, land = false} = {}) {
    shell.dataset.settled = value ? 'true' : 'false';
    if (!value || !land) return;

    clearTimeout(landTimer);
    shell.classList.remove('cdr-land');
    copy.classList.remove('cdr-copy-land');
    void shell.offsetWidth;
    shell.classList.add('cdr-land');
    copy.classList.add('cdr-copy-land');
    landTimer = setTimeout(() => {
      shell.classList.remove('cdr-land');
      copy.classList.remove('cdr-copy-land');
    }, 760);

    if (announce) render({announce: true});
  }

  function cancelTween() {
    if (tween?.raf) cancelAnimationFrame(tween.raf);
    tween = null;
  }

  function animateTo(target, duration = 480, {announce = true, easing = easeInOutCubic, land = true} = {}) {
    cancelTween();
    setSettled(false);

    if (reducedMotion.matches || duration <= 0) {
      rotationProgress = target;
      render({announce});
      setSettled(true, {land});
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
        setSettled(true, {land});
        resolve();
      };
      tween.raf = requestAnimationFrame(frame);
    });
  }

  function stepBy(amount) {
    if (spinning) return;
    const anchor = Math.round(rotationProgress);
    animateTo(anchor + amount, 520, {announce: true, easing: easeInOutCubic, land: true});
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
    setSettled(false);
    dragging = true;
    dragPointerId = event.pointerId;
    previousAngle = pointAngle(event);
    previousTime = performance.now();
    dragStartProgress = rotationProgress;
    dragAccumulatedDeg = 0;
    angularVelocity = 0;
    shell.setPointerCapture?.(event.pointerId);
    shell.dataset.dragging = 'true';
    hint.textContent = 'Suelta lentamente para snap · Lanza fuerte para varias vueltas';
  });

  shell.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    const now = performance.now();
    const angle = pointAngle(event);
    const frameDelta = shortestAngleDelta(angle, previousAngle);
    const dt = Math.max(8, now - previousTime);

    // Accumulate frame deltas: the user's hand can cross ±180° and complete full turns.
    dragAccumulatedDeg += frameDelta;
    rotationProgress = dragStartProgress - dragAccumulatedDeg / STEP_DEG;
    angularVelocity = frameDelta / dt; // deg/ms
    previousAngle = angle;
    previousTime = now;
    render();
  });

  async function finishFlick(target, distance) {
    const strong = distance >= 4;
    if (strong) {
      spinning = true;
      shell.dataset.spinning = 'true';
      shell.dataset.spinPhase = 'flick';
      prev.disabled = true;
      next.disabled = true;
      spin.disabled = true;
      spinLabel.textContent = 'Spinning';
    }

    const duration = reducedMotion.matches ? 0 : clamp(520 + distance * 100, 560, 2200);
    await animateTo(target, duration, {
      announce: true,
      easing: strong ? easeOutQuint : easeInOutCubic,
      land: true
    });

    if (strong) {
      spinning = false;
      shell.dataset.spinning = 'false';
      shell.dataset.spinPhase = 'idle';
      prev.disabled = false;
      next.disabled = false;
      spin.disabled = false;
      spinLabel.textContent = 'Discover';
    }
    hint.textContent = 'Drag circular · Flick para lanzar · ← → · Discover';
  }

  function endDrag(event) {
    if (!dragging || event.pointerId !== dragPointerId) return;
    dragging = false;
    shell.dataset.dragging = 'false';
    shell.releasePointerCapture?.(event.pointerId);
    dragPointerId = null;

    // Slow release = nearby snap. Fast flick = physical multi-sector / multi-turn throw.
    const speed = Math.abs(angularVelocity);
    const progressVelocity = -angularVelocity / STEP_DEG; // sectors per millisecond
    const projectionMs = speed < .18 ? 190 : 760;
    const projectedTravel = clamp(progressVelocity * projectionMs, -COUNT * 3, COUNT * 3);
    const projectedProgress = rotationProgress + projectedTravel;
    const target = Math.round(projectedProgress);
    const distance = Math.abs(target - rotationProgress);
    finishFlick(target, distance);
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

  async function discover(targetOverride = null, turnsOverride = null) {
    if (spinning || dragging) return;
    spinning = true;
    shell.dataset.spinning = 'true';
    shell.dataset.settled = 'false';
    shell.dataset.spinPhase = 'anticipation';
    spin.disabled = true;
    prev.disabled = true;
    next.disabled = true;
    spinLabel.textContent = 'Ready';
    hint.textContent = 'Finding your next obsession…';

    const current = Math.round(rotationProgress);
    const currentIndex = mod(current, COUNT);
    let targetIndex = Number.isInteger(targetOverride) ? mod(targetOverride, COUNT) : Math.floor(Math.random() * COUNT);
    if (targetIndex === currentIndex && targetOverride === null) {
      targetIndex = mod(targetIndex + 1 + Math.floor(Math.random() * (COUNT - 1)), COUNT);
    }

    const forwardSteps = mod(targetIndex - currentIndex, COUNT) || COUNT;
    const turns = Number.isInteger(turnsOverride) ? Math.max(0, turnsOverride) : 4 + Math.floor(Math.random() * 3);

    if (!reducedMotion.matches) {
      // A small reverse wind-up gives the main throw an unmistakable physical cue.
      await animateTo(rotationProgress - .18, 220, {announce:false, easing:easeInCubic, land:false});
    }

    shell.dataset.spinPhase = 'travel';
    spinLabel.textContent = 'Spinning';

    const launchBase = Math.round(rotationProgress);
    const launchIndex = mod(launchBase, COUNT);
    const launchForward = mod(targetIndex - launchIndex, COUNT) || COUNT;
    const target = launchBase + turns * COUNT + launchForward;
    const duration = reducedMotion.matches ? 0 : 3150 + turns * 190;

    // Fortune-wheel motion: immediate throw followed by a long, readable deceleration.
    await animateTo(target, duration, {announce: true, easing: easeOutQuint, land: true});

    shell.dataset.spinPhase = 'reveal';
    spinLabel.textContent = 'Selected';
    await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 520));

    spinning = false;
    shell.dataset.spinning = 'false';
    shell.dataset.spinPhase = 'idle';
    spin.disabled = false;
    prev.disabled = false;
    next.disabled = false;
    spinLabel.textContent = 'Discover';
    hint.textContent = `Selected · ${PIZZAS[targetIndex].name}`;
    return targetIndex;
  }

  spin.addEventListener('click', () => discover());

  // Test/debug adapter. Selection still has one canonical state: rotationProgress.
  window.CircularDishRotator = Object.freeze({
    getProgress: () => rotationProgress,
    getActiveIndex: nearestIndex,
    getRotationDeg: rotationDeg,
    getNames: () => PIZZAS.map(p => p.name),
    getProducts: () => PIZZAS.map(p => ({...p})),
    isDragging: () => dragging,
    isSpinning: () => spinning,
    setProgress(value, announce = false) {
      cancelTween();
      rotationProgress = Number(value) || 0;
      render({announce});
      setSettled(Number.isInteger(rotationProgress), {land: false});
    },
    next: () => stepBy(1),
    prev: () => stepBy(-1),
    discover
  });

  render({announce: false});
  setSettled(true, {land: false});
})();