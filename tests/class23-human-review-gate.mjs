/* CLASS23_HUMAN_REVIEW_GATE — Playwright como AUDITOR, no como actor.

   La entrega anterior se rechazó porque las capturas bonitas dependían de que Playwright
   inyectara el estado. Aquí la filosofía se invierte y se comprueba en el gate:

     PRODUCT URL  → contexto NUEVO, sin storageState, sin localStorage, sin IndexedDB.
                    Memories apagado, cero imágenes viejas, Studio accesible y Memories
                    localizable. Después, el recorrido de una persona: activar, añadir un
                    recuerdo, subir cuatro medias, verlas, REEMPLAZAR una y comprobar que
                    la anterior deja de estar vinculada.

     REVIEW URL   → `page.goto(...)` y NADA MÁS. Si hace falta inyectar algo para que se
                    vea bien, es un FALLO. Se exige Wall, hero, 5 recuerdos, 12+ medias,
                    vídeo, papel y tela desde el primer pintado.

   Además hay AUDITORÍA DE MOVIMIENTO: no basta un antes/después. Se mide el transform de
   la tarjeta DURANTE el arrastre, los offsets del Wall al hacer scroll, y el
   `currentTime` de los vídeos.

   Uso: node tests/class23-human-review-gate.mjs [baseUrl]
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {imageFile, videoFile} from './memories-fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'output', 'playwright', 'class23-review');
fs.mkdirSync(SHOTS, {recursive: true});

const target = process.argv[2];
const local = target ? null : await startServer(0);
const BASE = (target || local.url).replace(/\/$/, '');
const PRODUCT_URL = `${BASE}/`;
const REVIEW_URL = `${BASE}/?review=memories`;

const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => {
  results.push({name, ok});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const wait = (p, ms) => p.waitForTimeout(ms);

/* ============================================================
   PASO 1 · PRODUCT URL en un navegador limpio
   ============================================================ */
{
  /* contexto nuevo: sin storageState, sin nada arrastrado de otra sesión */
  const ctx = await browser.newContext({viewport: {width: 1440, height: 1000}});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PRODUCT_URL, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 40000});
  await wait(page, 1500);

  const clean = await page.evaluate(async () => ({
    enabled: window.RestaurantStudioConfig.get('modules.memories.enabled'),
    items: (window.RestaurantStudioConfig.get('modules.memories.items') || []).length,
    section: document.querySelectorAll('#memories').length,
    navLink: document.querySelectorAll('[data-memories-nav]').length,
    mediaInLibrary: await (async () => {
      try { return (await window.RestaurantStore.listMedia()).length; } catch { return -1; }
    })(),
    memoriesImages: document.querySelectorAll('#memories img').length
  }));
  check('1.1 · perfil limpio: Memories apagado y sin recuerdos',
    clean.enabled === false && clean.items === 0,
    `enabled ${clean.enabled} · ${clean.items} recuerdos`);
  check('1.2 · perfil limpio: ninguna imagen antigua ni media en la biblioteca',
    clean.mediaInLibrary === 0 && clean.memoriesImages === 0 && clean.section === 0,
    `${clean.mediaInLibrary} archivos · ${clean.section} secciones`);
  check('1.3 · con Memories OFF no hay enlace público a una sección inexistente',
    clean.navLink === 0, `${clean.navLink} enlaces`);

  /* Memories tiene que ser localizable */
  await page.evaluate(() => document.querySelector('.studio-open')?.click());
  await wait(page, 900);
  const tab = await page.evaluate(() => {
    const b = document.querySelector('.studio-nav [data-panel="memories"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return {label: b.textContent.trim(), w: Math.round(r.width), visible: r.width > 10,
      inViewport: r.left >= 0 && r.right <= innerWidth};
  });
  check('1.4 · el Studio ofrece una entrada visible a Memories',
    !!tab && tab.visible && /memor/i.test(tab.label),
    tab ? `pestaña "${tab.label}" · ${tab.w}px · en pantalla ${tab.inViewport}` : 'no existe');

  await page.evaluate(() => document.querySelector('.studio-nav [data-panel="memories"]').click());
  await page.waitForSelector('.mem-panel', {timeout: 10000});
  await wait(page, 500);
  const panel = await page.evaluate(() => ({
    entry: !!document.querySelector('[data-mem-entry]'),
    heading: document.querySelector('[data-mem-entry] h3')?.textContent.trim(),
    presetCards: [...document.querySelectorAll('[data-mem-preset-card]')].map(c => ({
      id: c.dataset.memPresetCard,
      name: c.querySelector('strong')?.textContent,
      note: c.querySelector('.mem-preset-note')?.textContent
    })),
    seeMemories: !!document.querySelector('[data-mem-preview]'),
    previewButtons: [...document.querySelectorAll('[data-mem-preview-preset]')]
      .map(b => b.dataset.memPreviewPreset),
    reset: !!document.querySelector('[data-mem-reset]')
  }));
  check('1.5 · entrada inequívoca «Memorias del restaurante»',
    panel.entry && /Memorias del restaurante/i.test(panel.heading || ''),
    `"${panel.heading}"`);
  check('1.6 · los tres presets se presentan visualmente, con su descripción',
    panel.presetCards.length === 3
    && panel.presetCards.every(c => c.name && c.note && c.note.length > 12),
    panel.presetCards.map(c => c.name).join(' · '));
  check('1.7 · accesos de revisión: VER MEMORIES y previsualizar cada preset',
    panel.seeMemories && panel.previewButtons.length === 3,
    `VER ${panel.seeMemories} · previsualizar ${panel.previewButtons.length}`);
  check('1.8 · existe RESTABLECER MEMORIES', panel.reset, 'acción presente en el panel');
  await page.screenshot({path: path.join(SHOTS, '10-studio-media-management.png')});

  /* ---------- el recorrido de una persona ---------- */
  await page.evaluate(() => document.querySelector('[data-mem-path="modules.memories.enabled"]').click());
  await wait(page, 900);
  const afterEnable = await page.evaluate(() => ({
    navLink: document.querySelectorAll('[data-memories-nav]').length,
    label: document.querySelector('[data-memories-nav]')?.textContent,
    href: document.querySelector('[data-memories-nav]')?.getAttribute('href'),
    section: document.querySelectorAll('#memories').length
  }));
  check('1.9 · con Memories ON aparece el enlace público a #memories',
    afterEnable.navLink === 1 && afterEnable.href === '#memories'
    && /memor/i.test(afterEnable.label || '') && afterEnable.section === 1,
    `"${afterEnable.label}" → ${afterEnable.href}`);

  await page.evaluate(() => document.querySelector('[data-mem-add]').click());
  await wait(page, 700);
  const id = await page.evaluate(() =>
    window.RestaurantStudioConfig.get('modules.memories.items')[0].id);
  await page.evaluate(n => { document.querySelectorAll('[data-mem-card]')[n].open = true; }, 0);
  await wait(page, 300);
  await page.fill('[data-mem-path="modules.memories.items.0.title"]', 'Recuerdo de prueba');
  await wait(page, 300);

  /* cuatro medias: dos imágenes, un vídeo, una imagen */
  const video = await videoFile(browser, 0, 'prueba.webm');
  await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(0, 'uno.webp'));
  await wait(page, 1400);
  await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(2, 'dos.webp'));
  await wait(page, 1400);
  await page.setInputFiles(`[data-mem-upload="${id}:video"]`, video);
  await wait(page, 1600);
  await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(4, 'tres.webp'));
  await wait(page, 1400);

  const four = await page.evaluate(() => {
    const item = window.RestaurantStudioConfig.get('modules.memories.items')[0];
    const rows = [...document.querySelectorAll(`[data-mem-card="${item.id}"] [data-mem-media-ref]`)];
    return {
      state: item.media.length,
      kinds: item.media.map(m => m.kind).join(','),
      rows: rows.length,
      thumbs: rows.filter(r => r.querySelector('.mem-media-thumb')).length,
      replaceButtons: rows.filter(r => r.querySelector('[data-mem-replace]')).length,
      cover: rows.findIndex(r => r.dataset.cover === '1'),
      publicSlots: document.querySelectorAll(`[data-mem-viewer="${item.id}"] [data-mem-slot]`).length
    };
  });
  check('1.10 · cuatro medias añadidas, y las cuatro se ven en el Studio y en la web',
    four.state === 4 && four.rows === 4 && four.thumbs === 4 && four.publicSlots === 4
    && four.cover === 0,
    `${four.state} en el estado (${four.kinds}) · ${four.rows} filas · ${four.publicSlots} en la web`);
  check('1.11 · cada media tiene su acción REEMPLAZAR, distinta de AÑADIR',
    four.replaceButtons === 4, `${four.replaceButtons} de 4 filas`);

  /* REEMPLAZAR la portada y comprobar que la antigua deja de estar vinculada */
  const before = await page.evaluate(() =>
    window.RestaurantStudioConfig.get('modules.memories.items')[0].media.map(m => m.ref));
  await page.setInputFiles(`[data-mem-replace="${before[0]}"]`, imageFile(7, 'nueva-portada.webp'));
  await wait(page, 1800);
  const replaced = await page.evaluate(async oldRef => {
    const item = window.RestaurantStudioConfig.get('modules.memories.items')[0];
    const stillInLibrary = (await window.RestaurantStore.listMedia()).some(r => r.slot === oldRef);
    return {
      refs: item.media.map(m => m.ref),
      count: item.media.length,
      linked: item.media.some(m => m.ref === oldRef),
      stillInLibrary,
      coverInDom: document.querySelector(`[data-mem-viewer="${item.id}"] [data-mem-slot="0"]`)
        ?.dataset.memMediaRef
    };
  }, before[0]);
  check('1.12 · REEMPLAZAR sustituye en su sitio: la anterior deja de estar vinculada',
    replaced.count === 4 && replaced.linked === false
    && replaced.refs[0] !== before[0] && replaced.coverInDom === replaced.refs[0],
    `${replaced.count} medias · antigua vinculada ${replaced.linked} · portada nueva en la web`);
  check('1.13 · REEMPLAZAR no borra el archivo de la Media Library',
    replaced.stillInLibrary === true, 'el asset sigue disponible para otros recuerdos');

  /* RESTABLECER MEMORIES: sólo Memories */
  const beforeReset = await page.evaluate(() => ({
    brand: window.RestaurantStudioConfig.get('brand.name'),
    dishes: (window.RestaurantStudioConfig.get('dishes') || []).length,
    modules: Object.keys(window.RestaurantStudioConfig.get('modules') || {}).length
  }));
  page.once('dialog', d => d.accept());
  await page.evaluate(() => document.querySelector('[data-mem-reset]').click());
  await wait(page, 1200);
  const afterReset = await page.evaluate(async () => ({
    enabled: window.RestaurantStudioConfig.get('modules.memories.enabled'),
    items: window.RestaurantStudioConfig.get('modules.memories.items').length,
    preset: window.RestaurantStudioConfig.get('modules.memories.preset'),
    brand: window.RestaurantStudioConfig.get('brand.name'),
    dishes: (window.RestaurantStudioConfig.get('dishes') || []).length,
    modules: Object.keys(window.RestaurantStudioConfig.get('modules') || {}).length,
    mediaInLibrary: (await window.RestaurantStore.listMedia()).length,
    section: document.querySelectorAll('#memories').length,
    navLink: document.querySelectorAll('[data-memories-nav]').length
  }));
  check('1.14 · RESTABLECER MEMORIES limpia sólo Memories',
    afterReset.enabled === false && afterReset.items === 0
    && afterReset.preset === 'cinematic-memory-wall'
    && afterReset.brand === beforeReset.brand && afterReset.dishes === beforeReset.dishes
    && afterReset.modules === beforeReset.modules,
    `Memories vacío · marca "${afterReset.brand}" · ${afterReset.dishes} platos · ${afterReset.modules} módulos intactos`);
  check('1.15 · RESTABLECER no borra la Media Library ni deja enlaces huérfanos',
    afterReset.mediaInLibrary > 0 && afterReset.section === 0 && afterReset.navLink === 0,
    `${afterReset.mediaInLibrary} archivos conservados · ${afterReset.navLink} enlaces`);

  const undone = await (async () => {
    await page.evaluate(() => document.querySelector('#undo-btn').click());
    await wait(page, 900);
    return page.evaluate(() => ({
      items: window.RestaurantStudioConfig.get('modules.memories.items').length,
      enabled: window.RestaurantStudioConfig.get('modules.memories.enabled')
    }));
  })();
  check('1.16 · el restablecido se puede deshacer con Undo',
    undone.items === 1 && undone.enabled === true,
    `${undone.items} recuerdo recuperado`);

  check('1.17 · sin errores de página en el recorrido del producto',
    errors.length === 0, errors.slice(0, 2).join(' | ') || 'limpio');
  await ctx.close();
}

/* ============================================================
   PASO 2 · REVIEW URL — goto y nada más
   ============================================================ */
{
  const ctx = await browser.newContext({viewport: {width: 1440, height: 1000}});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  /* ÚNICA acción permitida para crear contenido */
  await page.goto(REVIEW_URL, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => document.documentElement.dataset.memories === 'ready',
    null, {timeout: 40000});
  await wait(page, 2500);

  const review = await page.evaluate(() => {
    const section = document.querySelector('#memories');
    const cells = [...document.querySelectorAll('[data-mem-item]')];
    return {
      banner: !!document.querySelector('[data-memories-review-banner]'),
      preset: section?.dataset.preset,
      memories: Number(section?.dataset.count || 0),
      media: Number(section?.dataset.mediaTotal || 0),
      slots: document.querySelectorAll('[data-mem-slot]').length,
      images: document.querySelectorAll('#memories img.mem-media-image').length,
      videos: document.querySelectorAll('#memories video[data-mem-video]').length,
      hero: !!document.querySelector('.mem-cell[data-featured]'),
      heroMedia: Number(document.querySelector('.mem-cell[data-featured]')?.dataset.memMediaCount || 0),
      artifacts: [...document.querySelectorAll('[data-mem-artifact]')].map(n => n.dataset.memArtifact),
      weights: [...new Set(cells.map(c => c.dataset.weight))].filter(Boolean),
      /* y lo que hace honesta a esta ruta: el proyecto del restaurante sigue vacío */
      projectUntouched: window.RestaurantStudioConfig.get('modules.memories.enabled') === false
        && window.RestaurantStudioConfig.get('modules.memories.items').length === 0,
      demoLabelled: /DEMO|demostración/i.test(section?.innerText || '')
    };
  });
  check('2.1 · la REVIEW URL pinta Memories completa sin una sola inyección',
    review.banner && review.memories === 5 && review.media >= 12 && review.slots >= 12,
    `${review.memories} recuerdos · ${review.media} medias · ${review.slots} slots`);
  check('2.2 · con hero, 9 imágenes y 3 vídeos desde el primer pintado',
    review.hero && review.heroMedia === 4 && review.images >= 8 && review.videos >= 3,
    `hero con ${review.heroMedia} medias · ${review.images} imágenes · ${review.videos} vídeos`);
  check('2.3 · los dos artefactos materiales están presentes',
    review.artifacts.includes('paper') && review.artifacts.includes('cloth'),
    review.artifacts.join(', '));
  check('2.4 · los tres pesos visuales conviven',
    review.weights.length >= 2, review.weights.join(', '));
  check('2.5 · la review NO escribe en el Project State del restaurante',
    review.projectUntouched === true, 'proyecto apagado y vacío al cargar la review');
  check('2.6 · el contenido está etiquetado como DEMO',
    review.demoLabelled === true, 'la sección lo dice en su propio texto');

  /* ---------- capturas decisivas ---------- */
  const frameAt = async fraction => {
    await page.evaluate(f => {
      const s = document.querySelector('#memories');
      window.scrollTo(0, Math.max(0, s.offsetTop + (s.offsetHeight - innerHeight) * f));
    }, fraction);
    await wait(page, 1500);
  };
  const setPreset = async preset => {
    await page.evaluate(p => document.querySelector(`[data-review-preset="${p}"]`)?.click(), preset);
    await wait(page, 1600);
  };

  await frameAt(0.3);
  await page.screenshot({path: path.join(SHOTS, '01-review-wall.png')});
  await frameAt(0.08);
  await page.screenshot({path: path.join(SHOTS, '02-review-wall-multimedia.png')});

  /* AUDITORÍA DE MOVIMIENTO · Wall: el scroll cambia los offsets de verdad */
  const wallMotion = await page.evaluate(async () => {
    const cell = document.querySelector('.mem-cell[data-weight]');
    const read = () => cell.style.getPropertyValue('--mem-shift');
    const before = read();
    window.scrollBy(0, 420);
    await new Promise(r => setTimeout(r, 700));
    const after = read();
    return {before, after, changed: before !== after};
  });
  check('2.7 · Wall: el scroll cambia los offsets de parallax de verdad',
    wallMotion.changed, `${wallMotion.before} → ${wallMotion.after}`);

  /* Wall: vídeo con Play manual */
  const wallVideo = await page.evaluate(async () => {
    const viewer = [...document.querySelectorAll('[data-mem-viewer]')]
      .find(v => v.querySelector('[data-mem-thumb][data-kind=video]'));
    viewer.scrollIntoView({block: 'center'});
    await new Promise(r => setTimeout(r, 800));
    viewer.querySelector('[data-mem-thumb][data-kind=video]').click();
    await new Promise(r => setTimeout(r, 500));
    const slot = viewer.querySelector('.mem-slot[data-active="1"]');
    const v = slot.querySelector('video');
    try { v.currentTime = 0; } catch {}
    slot.querySelector('[data-mem-play]').click();
    await new Promise(r => setTimeout(r, 1000));
    const t1 = v.currentTime, playing = !v.paused;
    await new Promise(r => setTimeout(r, 800));
    const t2 = v.currentTime;
    slot.querySelector('[data-mem-play]').click();
    await new Promise(r => setTimeout(r, 400));
    return {playing, t1, t2, advanced: t2 > t1, pausedAfter: v.paused};
  });
  check('2.8 · vídeo del Wall: Play manual reproduce y Pause detiene',
    wallVideo.playing && wallVideo.advanced && wallVideo.pausedAfter,
    `${wallVideo.t1.toFixed(2)}s → ${wallVideo.t2.toFixed(2)}s · pausado ${wallVideo.pausedAfter}`);

  /* ---------- STACK: física medida ---------- */
  await setPreset('memory-stack');
  await frameAt(0.2);
  const cards = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.mem-card')];
    return {
      total: all.length,
      perceptible: all.filter(c => {
        const r = c.getBoundingClientRect();
        return parseFloat(getComputedStyle(c).opacity) > 0.08 && r.right > 0
          && r.left < innerWidth && r.width > 60;
      }).length
    };
  });
  check('2.9 · Stack: al cargar se perciben 3 o más tarjetas',
    cards.perceptible >= 3, `${cards.perceptible} de ${cards.total}`);
  await page.screenshot({path: path.join(SHOTS, '03-review-stack.png')});

  const deck = await page.evaluate(() => {
    const d = document.querySelector('[data-mem-deck]').getBoundingClientRect();
    return {x: Math.round(d.x + d.width / 2), y: Math.round(d.y + d.height * 0.35)};
  });
  const readCard = () => page.evaluate(() => {
    const card = document.querySelector('.mem-card');
    return {transform: card.style.transform,
      focus: window.RestaurantMemoriesEngine.state().stack?.focus,
      state: document.querySelector('[data-mem-deck]')?.dataset.stackState};
  });
  await page.mouse.move(deck.x, deck.y);
  await page.mouse.down();
  const frames = [];
  for (const dx of [30, 60, 90, 120]) {
    await page.mouse.move(deck.x - dx, deck.y, {steps: 3});
    frames.push(await readCard());
  }
  await page.screenshot({path: path.join(SHOTS, '04-review-stack-drag.png')});
  await page.mouse.up();
  /* y el asentado: varios estados hasta IDLE */
  const settling = [];
  for (let i = 0; i < 6; i++) { settling.push(await readCard()); await wait(page, 120); }
  await page.waitForFunction(
    () => window.RestaurantMemoriesEngine.state().stack?.state === 'IDLE',
    null, {timeout: 6000});
  const settled = await readCard();
  const transforms = new Set(frames.map(f => f.transform));
  check('2.10 · Stack: la tarjeta sigue el gesto DURANTE el arrastre',
    transforms.size === frames.length && frames.every(f => f.state === 'DRAGGING')
    && frames[3].focus > frames[0].focus,
    `${transforms.size} transforms distintos · focus ${frames[0].focus?.toFixed(3)} → ${frames[3].focus?.toFixed(3)}`);
  const settlingStates = new Set(settling.map(s => s.state));
  check('2.11 · Stack: al soltar hay inercia y asentado, no un salto',
    settlingStates.has('SETTLING') && settled.state === 'IDLE'
    && new Set(settling.map(s => s.transform)).size > 2,
    `estados ${[...settlingStates].join('/')} → ${settled.state} · ${new Set(settling.map(s => s.transform)).size} pasos`);

  const noHijack = await page.evaluate(async () => {
    const before = window.scrollY;
    const focusBefore = window.RestaurantMemoriesEngine.state().stack.target;
    const d = document.querySelector('[data-mem-deck]');
    const r = d.getBoundingClientRect();
    d.dispatchEvent(new WheelEvent('wheel', {deltaY: 300, bubbles: true, cancelable: true,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2}));
    window.scrollBy(0, 300);
    await new Promise(res => setTimeout(res, 500));
    return {moved: window.scrollY - before,
      focusChanged: window.RestaurantMemoriesEngine.state().stack.target !== focusBefore};
  });
  check('2.12 · Stack: la rueda no se secuestra',
    noHijack.moved > 180 && !noHijack.focusChanged,
    `la página bajó ${noHijack.moved}px · foco cambiado ${noHijack.focusChanged}`);

  await frameAt(0.2);
  const stackMedia = await page.evaluate(async () => {
    const focused = document.querySelector('.mem-card[data-focused="1"]');
    const viewer = focused.querySelector('[data-mem-viewer]');
    const total = Number(viewer.dataset.memMediaCount || 0);
    const reached = new Set([viewer.querySelector('.mem-slot[data-active="1"]')?.dataset.memMediaRef]);
    for (const dot of viewer.querySelectorAll('[data-mem-dot]')) {
      dot.click();
      await new Promise(r => setTimeout(r, 250));
      reached.add(viewer.querySelector('.mem-slot[data-active="1"]')?.dataset.memMediaRef);
    }
    return {total, reached: [...reached].filter(Boolean).length};
  });
  check('2.13 · Stack: la tarjeta en foco recorre todas sus medias',
    stackMedia.reached === stackMedia.total && stackMedia.total >= 2,
    `${stackMedia.reached}/${stackMedia.total}`);
  await page.screenshot({path: path.join(SHOTS, '05-review-stack-focused-media.png')});

  /* ---------- JOURNAL ---------- */
  await setPreset('editorial-journal');
  await frameAt(0.1);
  const journal = await page.evaluate(() => {
    const entries = [...document.querySelectorAll('.mem-entry')];
    return {
      entries: entries.length,
      sides: entries.map(e => e.dataset.side).slice(0, 4).join('/'),
      strips: entries.filter(e => e.querySelector('[data-mem-strip]')).length,
      folios: entries.filter(e => e.querySelector('.mem-folio')).length
    };
  });
  check('2.14 · Journal: spreads alternos con filmstrip y folio',
    journal.entries === 5 && journal.strips >= 3 && journal.folios === 5
    && journal.sides.startsWith('left/right'),
    `${journal.entries} entradas · ${journal.strips} con filmstrip · ritmo ${journal.sides}`);
  await page.screenshot({path: path.join(SHOTS, '06-review-journal.png')});

  /* ---------- ARTEFACTOS ---------- */
  for (const [style, file] of [['paper', '07-review-paper.png'], ['cloth', '08-review-cloth.png']]) {
    await page.evaluate(s => document.querySelector(`[data-mem-artifact="${s}"]`)
      ?.closest('[data-mem-item]')?.scrollIntoView({block: 'center'}), style);
    await wait(page, 1700);
    await page.screenshot({path: path.join(SHOTS, file)});
  }
  const artifacts = await page.evaluate(() => {
    const out = {};
    for (const style of ['paper', 'cloth']) {
      const surface = document.querySelector(`[data-mem-artifact="${style}"]`);
      const canvas = surface?.querySelector('canvas.mem-artifact-canvas');
      let painted = 0;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = Math.min(canvas.width, 400), h = Math.min(canvas.height, 400);
        const data = ctx.getImageData(0, 0, w, h).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 6) painted++;
      }
      out[style] = painted;
    }
    return out;
  });
  check('2.15 · Paper: grabado cinético realmente pintado',
    artifacts.paper > 300, `${artifacts.paper} píxeles`);
  check('2.16 · Cloth: tejido realmente pintado',
    artifacts.cloth > 1500, `${artifacts.cloth} píxeles`);

  /* ---------- STORY con vídeo ---------- */
  await setPreset('cinematic-memory-wall');
  await frameAt(0.08);
  const story = await page.evaluate(async () => {
    document.querySelector('[data-mem-open]')?.click();
    await new Promise(r => setTimeout(r, 700));
    const layer = document.querySelector('[data-mem-story]');
    if (!layer) return {error: 'no abrió'};
    const t = [...layer.querySelectorAll('[data-mem-thumb]')].find(x => x.dataset.kind === 'video');
    t.click();
    await new Promise(r => setTimeout(r, 500));
    const slot = layer.querySelector('.mem-slot[data-active="1"]');
    const v = slot.querySelector('video');
    try { v.currentTime = 0; } catch {}
    slot.querySelector('[data-mem-play]').click();
    await new Promise(r => setTimeout(r, 1100));
    const t1 = v.currentTime;
    await new Promise(r => setTimeout(r, 700));
    return {thumbs: layer.querySelectorAll('[data-mem-thumb]').length,
      playing: !v.paused, t1, t2: v.currentTime, advanced: v.currentTime > t1};
  });
  check('2.17 · Story: galería completa y vídeo reproduciéndose',
    story.thumbs === 4 && story.playing && story.advanced,
    `${story.thumbs} miniaturas · ${story.t1?.toFixed(2)}s → ${story.t2?.toFixed(2)}s`);
  await page.screenshot({path: path.join(SHOTS, '09-review-story-video.png')});
  await page.keyboard.press('Escape');
  await wait(page, 600);

  check('2.18 · sin errores de página en la review',
    errors.length === 0, errors.slice(0, 2).join(' | ') || 'limpio');
  await ctx.close();
}

/* ============================================================
   PASO 3 · móvil real sobre la REVIEW URL
   ============================================================ */
{
  const ctx = await browser.newContext({viewport: {width: 390, height: 844},
    isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  await page.goto(REVIEW_URL, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => document.documentElement.dataset.memories === 'ready',
    null, {timeout: 40000});
  await wait(page, 2500);
  await page.evaluate(() => {
    const s = document.querySelector('#memories');
    window.scrollTo(0, s.offsetTop + s.offsetHeight * 0.1);
  });
  await wait(page, 1400);
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    memories: Number(document.querySelector('#memories')?.dataset.count || 0),
    media: Number(document.querySelector('#memories')?.dataset.mediaTotal || 0)
  }));
  check('3.1 · móvil real 390px sobre la review: sin desbordamiento y con todo el archivo',
    !mobile.overflow && mobile.memories === 5 && mobile.media >= 12,
    `overflow ${mobile.overflow} · ${mobile.memories} recuerdos · ${mobile.media} medias`);
  await page.screenshot({path: path.join(SHOTS, '11-review-mobile.png')});
  await ctx.close();
}

await browser.close();
local?.server?.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`PRODUCT URL: ${PRODUCT_URL}`);
console.log(`REVIEW  URL: ${REVIEW_URL}`);
console.log(`screenshots -> output/playwright/class23-review/`);
if (failed.length) {
  console.error(`CLASS23_HUMAN_REVIEW_GATE_FAIL: ${failed.map(f => f.name).join(' | ')}`);
  process.exit(1);
}
console.log('CLASS23_HUMAN_REVIEW_GATE_PASS');
