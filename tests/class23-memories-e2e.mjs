/* CLASS 23 — MEMORIES · gate de la Fase 2.

   No prueba tres motores: prueba UN dominio con tres presentaciones, editado desde el
   Studio de siempre, guardado en el Project State de siempre y con la media en la Media
   Library de siempre.

       modules.memories → Memories Studio → Media compartida → Engine → web pública

   Los recuerdos de los tests son fixtures explícitos (`tests/memories-fixtures.mjs`):
   el proyecto base no afirma nada que el restaurante no haya escrito.

   Uso: node tests/class23-memories-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {MEMORIES, imageFile, videoFile, seedItems} from './memories-fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'output', 'playwright', 'class23');
fs.mkdirSync(SHOTS, {recursive: true});

const {server, url: BASE} = await startServer(0);
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => {
  results.push({name, ok});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const VIDEO = await videoFile(browser);
const IMAGE = imageFile();

/* ---------- utilidades ---------- */
async function boot(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.errors = errors;
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => !!window.RestaurantStudioConfig, null, {timeout: 30000});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await page.waitForTimeout(600);
  return page;
}
const openStudio = async page => {
  await page.evaluate(() => {
    if (!document.querySelector('#studio.is-open')) document.querySelector('.studio-open')?.click();
  });
  await page.waitForTimeout(700);
};
const openPanel = async page => {
  await openStudio(page);
  await page.evaluate(() => document.querySelector('.studio-nav [data-panel="memories"]')?.click());
  await page.waitForFunction(() => !!document.querySelector('.mem-panel'), null, {timeout: 10000});
  await page.waitForTimeout(400);
};
/* Las fichas del panel son <details> y arrancan cerradas salvo la que se acaba de
   tocar: un input dentro de un <details> cerrado no es rellenable. */
const openCard = async (page, index = 0) => {
  await page.evaluate(i => {
    const card = document.querySelectorAll('[data-mem-card]')[i];
    if (card && !card.open) card.open = true;
  }, index);
  await page.waitForTimeout(250);
};
const enable = page => page.evaluate(() =>
  window.RestaurantStudioConfig.set('modules.memories.enabled', true));
const publicState = page => page.evaluate(() => {
  const section = document.querySelector('#memories');
  return {
    exists: !!section,
    height: section ? Math.round(section.getBoundingClientRect().height) : 0,
    count: Number(section?.dataset.count ?? -1),
    preset: section?.dataset.preset || null,
    items: [...document.querySelectorAll('[data-mem-item]')].map(n => n.dataset.memItem),
    titles: [...document.querySelectorAll('.mem-item-title')].map(n => n.textContent.trim()),
    videos: document.querySelectorAll('video[data-mem-video]').length,
    images: document.querySelectorAll('img.mem-media-image').length
  };
});
const memoriesConfig = page => page.evaluate(() =>
  JSON.parse(JSON.stringify(window.RestaurantStudioConfig.get('modules.memories'))));

/* ============================================================
   1. OFF por defecto — perfil limpio
   ============================================================ */
const context = await browser.newContext({viewport: {width: 1440, height: 960}});
let page = await boot(context);
{
  const off = await memoriesConfig(page);
  check('1 · Memories está OFF por defecto',
    off?.enabled === false && Array.isArray(off.items) && off.items.length === 0,
    `enabled ${off?.enabled} · ${off?.items?.length} items · preset ${off?.preset}`);

  const dom = await publicState(page);
  check('2 · OFF no ocupa ningún espacio público',
    !dom.exists && dom.height === 0 && dom.videos === 0,
    `sección ${dom.exists} · alto ${dom.height}px · vídeos ${dom.videos}`);

  /* ON sin recuerdos: se dice que no hay, y no se inventa ninguno */
  await enable(page);
  await page.waitForTimeout(700);
  const empty = await page.evaluate(() => ({
    marker: !!document.querySelector('[data-mem-empty]'),
    text: (document.querySelector('#memories')?.innerText || ''),
    cells: document.querySelectorAll('[data-mem-item]').length
  }));
  const INVENTED = /aniversario|premio|cliente|lorem|ejemplo de recuerdo/i;
  check('3 · ON con cero recuerdos no inventa contenido',
    empty.marker && empty.cells === 0 && !INVENTED.test(empty.text),
    `marcador ${empty.marker} · ${empty.cells} celdas`);
}

/* ============================================================
   2. El editor: añadir, escribir, ordenar, borrar
   ============================================================ */
{
  await openPanel(page);
  await page.evaluate(() => document.querySelector('[data-mem-add]').click());
  await page.waitForTimeout(500);
  let cfg = await memoriesConfig(page);
  check('4 · añadir un recuerdo desde el panel',
    cfg.items.length === 1 && typeof cfg.items[0].id === 'string' && cfg.items[0].title === '',
    `${cfg.items.length} item · id ${cfg.items[0]?.id}`);

  const id = cfg.items[0].id;
  const type = async (path, value) => {
    await page.fill(`[data-mem-path="modules.memories.items.0.${path}"]`, value);
    await page.waitForTimeout(260);
  };
  await type('title', 'La primera noche');
  cfg = await memoriesConfig(page);
  const dom = await publicState(page);
  check('5 · editar el título llega al Project State y a la web sin recargar',
    cfg.items[0].title === 'La primera noche' && dom.titles.includes('La primera noche'),
    `estado "${cfg.items[0].title}" · web ${JSON.stringify(dom.titles)}`);

  await type('text', MEMORIES[0].text);
  cfg = await memoriesConfig(page);
  const story = await page.evaluate(() => document.querySelector('.mem-text')?.textContent || '');
  check('6 · editar la historia',
    cfg.items[0].text === MEMORIES[0].text && story.startsWith('Abrimos con doce mesas'),
    `${cfg.items[0].text.length} caracteres en el estado, ${story.length} en la web`);

  await type('author', 'El equipo');
  await type('date', '2019');
  await type('place', 'Alicante');
  cfg = await memoriesConfig(page);
  const meta = await page.evaluate(() => ({
    meta: document.querySelector('.mem-meta')?.textContent || '',
    author: document.querySelector('.mem-author')?.textContent || ''
  }));
  check('7 · autor, fecha y lugar',
    cfg.items[0].author === 'El equipo' && cfg.items[0].date === '2019'
    && cfg.items[0].place === 'Alicante'
    && meta.meta.includes('2019') && meta.meta.includes('Alicante')
    && meta.author === 'El equipo',
    `"${meta.meta}" · "${meta.author}"`);

  await page.selectOption('[data-mem-path="modules.memories.items.0.type"]', 'event');
  await page.waitForTimeout(300);
  cfg = await memoriesConfig(page);
  const typeDom = await page.evaluate(() => ({
    attr: document.querySelector('[data-mem-item]')?.dataset.type,
    label: document.querySelector('.mem-kind')?.textContent || ''
  }));
  check('8 · el tipo es DATA y se refleja en la presentación',
    cfg.items[0].type === 'event' && typeDom.attr === 'event' && typeDom.label === 'Evento',
    `${cfg.items[0].type} → "${typeDom.label}"`);

  await page.check('[data-mem-path="modules.memories.items.0.featured"]');
  await page.waitForTimeout(400);
  cfg = await memoriesConfig(page);
  const featured = await page.evaluate(() =>
    document.querySelector('[data-mem-item]')?.dataset.featured === '1');
  check('9 · featured da jerarquía real en la pared',
    cfg.items[0].featured === true && featured,
    `estado ${cfg.items[0].featured} · DOM ${featured}`);

  await page.uncheck('[data-mem-path="modules.memories.items.0.featured"]');
  await page.selectOption('[data-mem-path="modules.memories.items.0.visualWeight"]', 'small');
  await page.waitForTimeout(400);
  cfg = await memoriesConfig(page);
  const weight = await page.evaluate(() =>
    document.querySelector('[data-mem-item]')?.dataset.weight);
  check('10 · visualWeight manda en la composición',
    cfg.items[0].visualWeight === 'small' && weight === 'small',
    `${cfg.items[0].visualWeight} → data-weight ${weight}`);

  /* un segundo recuerdo, para poder reordenar */
  await page.evaluate(() => document.querySelector('[data-mem-add]').click());
  await page.waitForTimeout(400);
  await page.fill('[data-mem-path="modules.memories.items.1.title"]', 'Mesa 7');
  await page.waitForTimeout(300);
  const before = (await memoriesConfig(page)).items.map(i => i.title);
  await page.evaluate(() => document.querySelector('[data-mem-down]:not(:disabled)').click());
  await page.waitForTimeout(500);
  const after = (await memoriesConfig(page)).items.map(i => i.title);
  const orderDom = (await publicState(page)).titles;
  check('11 · reordenar cambia sólo el array del Project State, y la web lo sigue',
    JSON.stringify(after) === JSON.stringify([...before].reverse())
    && orderDom[0] === after[0],
    `${before.join(' | ')} → ${after.join(' | ')}`);

  /* borrar + Undo: el recuerdo vuelve entero */
  const doomed = (await memoriesConfig(page)).items[0];
  await page.evaluate(() => document.querySelector('[data-mem-delete]').click());
  await page.waitForTimeout(500);
  const deleted = await memoriesConfig(page);
  check('12 · eliminar un recuerdo',
    deleted.items.length === 1 && !deleted.items.some(i => i.id === doomed.id),
    `quedan ${deleted.items.length}`);

  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await page.waitForTimeout(600);
  const undone = await memoriesConfig(page);
  const back = undone.items.find(i => i.id === doomed.id);
  check('13 · Undo devuelve el recuerdo con su contenido intacto',
    !!back && back.title === doomed.title && back.text === doomed.text
    && JSON.stringify(back.media) === JSON.stringify(doomed.media),
    `recuperado "${back?.title}" con ${back?.media?.length ?? 0} refs`);
}

/* ============================================================
   3. MEDIA — imagen y vídeo por la biblioteca compartida
   ============================================================ */
{
  const cfg = await memoriesConfig(page);
  const firstId = cfg.items[0].id;
  await page.setInputFiles(`[data-mem-upload="${firstId}:image"]`, IMAGE);
  await page.waitForTimeout(1200);
  let after = await memoriesConfig(page);
  const imageRef = after.items[0].media[0];
  const inStore = await page.evaluate(async ref => {
    const list = await window.RestaurantStore.listMedia();
    const rec = list.find(r => r.slot === ref);
    return {found: !!rec, kind: rec?.kind, dbs: (await indexedDB.databases()).map(d => d.name)};
  }, imageRef?.ref);
  check('14 · la imagen se guarda en la Media Library COMPARTIDA',
    !!imageRef && inStore.found && inStore.kind === 'image'
    && inStore.dbs.filter(n => /memor/i.test(n || '')).length === 0,
    `ref ${imageRef?.ref} · en el store ${inStore.found} · bases ${inStore.dbs.join(', ')}`);

  /* El vídeo se sube al SEGUNDO recuerdo a propósito: una celda compone con la PRIMERA
     media que resuelve, así que para ver un vídeo en la pared tiene que ser la primera
     de su recuerdo. Las refs extra se conservan en el dato. */
  const secondCardId = after.items[1].id;
  await openCard(page, 1);
  await page.setInputFiles(`[data-mem-upload="${secondCardId}:video"]`, VIDEO);
  await page.waitForTimeout(1400);
  after = await memoriesConfig(page);
  const videoRef = after.items[1].media.find(m => m.kind === 'video');
  const videoStored = await page.evaluate(async ref => {
    const rec = (await window.RestaurantStore.listMedia()).find(r => r.slot === ref);
    return {found: !!rec, kind: rec?.kind, size: rec?.size || 0};
  }, videoRef?.ref);
  check('15 · el vídeo se guarda en la misma Media Library',
    !!videoRef && videoStored.found && videoStored.kind === 'video' && videoStored.size > 0,
    `ref ${videoRef?.ref} · ${videoStored.size} bytes · kind ${videoStored.kind}`);

  /* elegir un asset YA subido: el picker compartido */
  const secondId = after.items[1].id;
  await page.evaluate(id => document.querySelector(`[data-mem-pick="${id}"]`).click(), secondId);
  await page.waitForSelector('[data-media-picker="open"]', {timeout: 8000});
  const pickerState = await page.evaluate(() => ({
    cards: document.querySelectorAll('[data-media-picker-ref]').length,
    kinds: [...document.querySelectorAll('[data-media-picker-ref]')].map(n => n.dataset.kind)
  }));
  await page.evaluate(() => document.querySelector('[data-media-picker-ref]').click());
  await page.waitForTimeout(800);
  const linked = await memoriesConfig(page);
  check('16 · el picker compartido lista la biblioteca y devuelve una referencia',
    pickerState.cards >= 2 && pickerState.kinds.includes('video')
    && linked.items[1].media.length === 2,
    `${pickerState.cards} archivos (${pickerState.kinds.join(', ')}) · vinculado ${linked.items[1].media[1]?.ref}`);

  const raw = JSON.stringify(linked);
  check('17 · el Project State guarda referencias, nunca blob: ni File',
    !/blob:/.test(raw) && !/^file:/m.test(raw)
    && linked.items[0].media.every(m => /^project\/memories\//.test(m.ref)),
    linked.items[0].media.map(m => m.ref).join(' · '));

  /* la media se pinta de verdad */
  await page.evaluate(() => window.RestaurantStudioShell?.close?.());
  await page.waitForTimeout(600);
  const painted = await page.evaluate(() => {
    const img = document.querySelector('#memories img.mem-media-image');
    const video = document.querySelector('#memories video[data-mem-video]');
    return {
      img: !!img, imgSrc: (img?.currentSrc || img?.src || '').slice(0, 5),
      imgBox: img ? Math.round(img.getBoundingClientRect().width) : 0,
      video: !!video, videoSrc: (video?.src || '').slice(0, 5),
      preload: video?.getAttribute('preload'), muted: video?.muted,
      label: video?.getAttribute('aria-label') || ''
    };
  });
  check('18 · la imagen se renderiza',
    painted.img && painted.imgSrc === 'blob:' && painted.imgBox > 80,
    `${painted.imgBox}px desde ${painted.imgSrc}…`);
  check('19 · el vídeo se renderiza con preload de metadatos, sin audio y con nombre accesible',
    painted.video && painted.videoSrc === 'blob:' && painted.preload === 'metadata'
    && painted.muted === true && painted.label.length > 0,
    `preload ${painted.preload} · muted ${painted.muted} · "${painted.label}"`);

  /* fuera de viewport se pausa */
  await page.evaluate(() => document.querySelector('#memories')?.scrollIntoView({block: 'center'}));
  await page.waitForTimeout(2000);
  const playing = await page.evaluate(() =>
    [...document.querySelectorAll('video[data-mem-video]')].filter(v => !v.paused).length);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  const offscreen = await page.evaluate(() =>
    [...document.querySelectorAll('video[data-mem-video]')].filter(v => !v.paused).length);
  check('20 · el vídeo se pausa fuera del viewport y nunca suenan todos a la vez',
    offscreen === 0 && playing <= 1,
    `en pantalla ${playing} reproduciéndose · fuera ${offscreen}`);
  await page.screenshot({path: path.join(SHOTS, '01-wall-con-media.png'), fullPage: false});
}

/* ============================================================
   4. Presets: misma data, otra presentación
   ============================================================ */
{
  await seedItems(page);
  await page.waitForTimeout(900);
  const wall = await publicState(page);
  check('22 · preset Cinematic Memory Wall',
    wall.preset === 'cinematic-memory-wall' && wall.items.length === MEMORIES.length
    && await page.evaluate(() => !!document.querySelector('[data-mem-preset="cinematic-memory-wall"]')),
    `${wall.items.length} recuerdos`);

  const setPreset = async value => {
    await page.evaluate(v => window.RestaurantStudioConfig.set('modules.memories.preset', v), value);
    await page.waitForTimeout(900);
  };

  await setPreset('memory-stack');
  const stack = await page.evaluate(() => {
    const focus = document.querySelector('.mem-card[data-state=focus]');
    return {
      preset: document.querySelector('[data-mem-preset]')?.dataset.memPreset,
      cards: document.querySelectorAll('.mem-card').length,
      focus: focus?.dataset.memItem || null,
      near: document.querySelectorAll('.mem-card[data-state=near]').length,
      counter: document.querySelector('[data-mem-counter]')?.textContent || '',
      prevDisabled: document.querySelector('[data-mem-prev]')?.disabled
    };
  });
  await page.evaluate(() => document.querySelector('[data-mem-next]').click());
  await page.waitForTimeout(700);
  const advanced = await page.evaluate(() => ({
    focus: document.querySelector('.mem-card[data-state=focus]')?.dataset.memItem || null,
    counter: document.querySelector('[data-mem-counter]')?.textContent || '',
    engineFocus: window.RestaurantMemoriesEngine.state().focus
  }));
  check('23 · preset Memory Stack: uno en foco, vecinos asomando, y un único índice',
    stack.preset === 'memory-stack' && stack.cards === MEMORIES.length
    && stack.near > 0 && stack.prevDisabled === true
    && advanced.focus !== stack.focus && advanced.engineFocus === 1
    && advanced.counter.startsWith('02'),
    `${stack.cards} tarjetas · ${stack.near} asomando · ${stack.counter} → ${advanced.counter}`);

  /* Teclado, y sin secuestrar el scroll. El scroll se mide DESPUÉS de enfocar: es
     `.focus()` quien lleva el mazo a la vista, y medir antes acusaba a la tecla de un
     desplazamiento que no había hecho. */
  await page.evaluate(() => document.querySelector('.mem-deck').focus({preventScroll: true}));
  await page.waitForTimeout(300);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  const keyboard = await page.evaluate(() => ({
    focus: window.RestaurantMemoriesEngine.state().focus,
    scroll: window.scrollY
  }));
  check('23b · el Stack se maneja con teclado y no secuestra el scroll',
    keyboard.focus === 2 && Math.abs(keyboard.scroll - scrollBefore) < 4,
    `índice ${keyboard.focus} · scroll ${scrollBefore} → ${keyboard.scroll}`);

  await setPreset('editorial-journal');
  const journal = await page.evaluate(() => ({
    preset: document.querySelector('[data-mem-preset]')?.dataset.memPreset,
    entries: document.querySelectorAll('.mem-entry').length,
    sides: [...document.querySelectorAll('.mem-entry')].map(n => n.dataset.side),
    dates: [...document.querySelectorAll('.mem-date')].map(n => n.textContent.trim())
  }));
  check('24 · preset Editorial Journal: cronología con ritmo alternado',
    journal.preset === 'editorial-journal' && journal.entries === MEMORIES.length
    && journal.sides[0] === 'left' && journal.sides[1] === 'right'
    && journal.dates.includes('2019'),
    `${journal.entries} entradas · fechas ${journal.dates.join(', ')}`);

  /* el dato no se mueve al cambiar de presentación */
  const beforeSwitch = await memoriesConfig(page);
  await setPreset('cinematic-memory-wall');
  const afterSwitch = await memoriesConfig(page);
  const sameData = JSON.stringify({...beforeSwitch, preset: null})
    === JSON.stringify({...afterSwitch, preset: null});
  check('25 · cambiar de preset NO cambia los datos',
    sameData && afterSwitch.items.length === beforeSwitch.items.length
    && afterSwitch.items[0].featured === beforeSwitch.items[0].featured,
    `${afterSwitch.items.length} recuerdos, mismo orden, misma media`);
}

/* ============================================================
   5. Persistencia, Undo/Redo, import/export
   ============================================================ */
{
  /* los fixtures sembrados no traen media: se sube una imagen por el panel, que es lo
     que hace interesante la prueba de recarga */
  await openPanel(page);
  await openCard(page, 0);
  const seededId = (await memoriesConfig(page)).items[0].id;
  await page.setInputFiles(`[data-mem-upload="${seededId}:image"]`, IMAGE);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.RestaurantStudioShell?.close?.());
  await page.waitForTimeout(500);

  const before = await memoriesConfig(page);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await page.waitForTimeout(1500);
  const after = await memoriesConfig(page);
  const dom = await publicState(page);
  check('26 · tras recargar, el mismo Memories y las mismas referencias',
    JSON.stringify(after) === JSON.stringify(before) && dom.count === before.items.length,
    `${after.items.length} recuerdos · ${after.items[0].media.length} refs · web ${dom.count}`);

  const rendered = await page.evaluate(() => ({
    img: !!document.querySelector('#memories img.mem-media-image'),
    src: (document.querySelector('#memories img.mem-media-image')?.src || '').slice(0, 5)
  }));
  check('26b · la media local se resuelve otra vez desde la Media Library',
    rendered.img && rendered.src === 'blob:',
    `imagen ${rendered.img} desde ${rendered.src}…`);

  await openPanel(page);
  await openCard(page, 0);
  await page.fill('[data-mem-path="modules.memories.items.0.title"]', 'Título editado');
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await page.waitForTimeout(500);
  const undone = (await memoriesConfig(page)).items[0].title;
  await page.evaluate(() => document.querySelector('#redo-btn').click());
  await page.waitForTimeout(500);
  const redone = (await memoriesConfig(page)).items[0].title;
  check('27 · Undo/Redo usan el historial existente, sin historia propia',
    undone !== 'Título editado' && redone === 'Título editado',
    `undo "${undone}" · redo "${redone}"`);

  /* export: el JSON del proyecto lleva Memories y sus refs */
  const exported = await page.evaluate(() => {
    const snap = window.RestaurantStudioConfig.snapshot();
    return JSON.stringify(snap.modules?.memories || null);
  });
  const parsed = JSON.parse(exported);
  check('28 · el export del proyecto incluye modules.memories con sus mediaRefs',
    !!parsed && parsed.items.length > 0
    && parsed.items.some(i => i.media?.some(m => /^project\/memories\//.test(m.ref)))
    && !/blob:/.test(exported),
    `${parsed?.items?.length} recuerdos · ${parsed?.items?.[0]?.media?.length ?? 0} refs en el primero`);
}

/* ============================================================
   6. Un solo Studio, un solo almacén
   ============================================================ */
{
  const stores = await page.evaluate(async () => ({
    local: Object.keys(localStorage).filter(k => /memor/i.test(k)),
    session: Object.keys(sessionStorage || {}).filter(k => /memor/i.test(k)),
    dbs: (await indexedDB.databases()).map(d => d.name),
    caches: 'caches' in window ? await caches.keys() : []
  }));
  check('29 · Memories no crea ninguna clave propia en localStorage',
    stores.local.length === 0 && stores.session.length === 0,
    `local [${stores.local.join(', ')}] · session [${stores.session.join(', ')}]`);
  check('30 · Memories no crea IndexedDB ni Cache propios',
    !stores.dbs.some(n => /memor/i.test(n || ''))
    && !stores.caches.some(n => /memor/i.test(n || '')),
    `bases: ${stores.dbs.join(', ')} · caches: ${stores.caches.join(', ')}`);

  const studio = await page.evaluate(() => ({
    drawers: document.querySelectorAll('#studio').length,
    panelInside: !!document.querySelector('#studio .mem-panel'),
    tabs: document.querySelectorAll('.studio-nav [data-panel="memories"]').length,
    iframes: document.querySelectorAll('iframe').length,
    editors: document.querySelectorAll('[data-memories-studio]').length
  }));
  check('31 · no hay segundo Studio: el panel vive dentro del cajón existente',
    studio.drawers === 1 && studio.panelInside && studio.tabs === 1
    && studio.iframes === 0 && studio.editors === 0,
    `${studio.drawers} cajón · panel dentro ${studio.panelInside} · ${studio.iframes} iframes`);

  const labs = await page.evaluate(() => [...document.querySelectorAll('a[href], iframe[src]')]
    .map(n => n.getAttribute('href') || n.getAttribute('src'))
    .filter(v => v && /(^|\/)labs\//.test(v)));
  check('32 · Memories no introduce ninguna entrada de producto hacia /labs/',
    labs.length === 0, labs.length ? labs.join(' · ') : 'ningún enlace a labs');
}

/* ============================================================
   7. Público: desktop, móvil, reduced-motion, campos vacíos
   ============================================================ */
{
  await page.evaluate(() => window.RestaurantStudioShell?.close?.());
  await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.preset', 'cinematic-memory-wall'));
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector('#memories .mem-item-title')
    ?.scrollIntoView({block: 'center'}));
  await page.waitForTimeout(900);

  /* que la sección se vea de verdad: el viajero de Project 09 sobrevuela justo aquí, y
     un rect no demuestra quién pinta encima */
  const visible = await page.evaluate(() => {
    const section = document.querySelector('#memories');
    const box = section.getBoundingClientRect();
    /* un título que esté DE VERDAD en el viewport: `elementFromPoint` devuelve null
       fuera de él, y eso no probaría nada sobre la oclusión */
    const title = [...section.querySelectorAll('.mem-item-title')].find(n => {
      const r = n.getBoundingClientRect();
      return r.top > 0 && r.bottom < innerHeight && r.width > 40;
    }) || section.querySelector('.mem-item-title');
    const t = title?.getBoundingClientRect();
    const at = t ? document.elementFromPoint(Math.round(t.left + t.width / 2), Math.round(t.top + t.height / 2)) : null;
    return {
      width: Math.round(box.width), height: Math.round(box.height),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      titleOwned: !!at && (at === title || title.contains(at) || at.contains(title)),
      topTag: at ? at.tagName + (at.className ? '.' + String(at.className).split(' ')[0] : '') : ''
    };
  });
  check('33 · público desktop: la sección se ve y su tipografía no queda tapada',
    visible.height > 400 && !visible.overflow && visible.titleOwned,
    `${visible.width}×${visible.height} · en el título pinta ${visible.topTag}`);
  await page.screenshot({path: path.join(SHOTS, '02-publico-desktop.png')});

  /* campos vacíos e inválidos: nada inventado */
  await page.evaluate(() => {
    const model = window.RestaurantMemoriesModel;
    window.RestaurantStudioConfig.set('modules.memories.items', [
      model.item({title: 'Sólo un título', rating: 0, link: 'javascript:alert(1)'}),
      model.item({text: 'Sin título, sin fecha y sin lugar.'})
    ]);
  });
  await page.waitForTimeout(900);
  const sparse = await page.evaluate(() => ({
    cells: document.querySelectorAll('[data-mem-item]').length,
    ratings: document.querySelectorAll('.mem-rating').length,
    links: document.querySelectorAll('.mem-link').length,
    metas: [...document.querySelectorAll('.mem-meta')].map(n => n.textContent.trim()),
    titles: [...document.querySelectorAll('.mem-item-title')].map(n => n.textContent.trim()),
    dangling: (document.querySelector('#memories')?.innerText || '').includes('·undefined')
  }));
  check('35 · los campos vacíos o inválidos no inventan contenido',
    sparse.cells === 2 && sparse.ratings === 0 && sparse.links === 0
    && sparse.metas.length === 0 && sparse.titles.length === 1 && !sparse.dangling,
    `valoraciones ${sparse.ratings} · enlaces ${sparse.links} · metas ${sparse.metas.length}`);

  await seedItems(page);
  await page.waitForTimeout(800);
}

/* ---------- reduced motion, en su propio contexto ---------- */
{
  const rmContext = await browser.newContext({viewport: {width: 1440, height: 960}, reducedMotion: 'reduce'});
  const rm = await boot(rmContext);
  await rm.evaluate(() => {
    window.RestaurantStudioConfig.set('modules.memories.enabled', true);
  });
  await seedItems(rm);
  await rm.waitForTimeout(900);
  /* con reduced-motion el vídeo no debe arrancar solo */
  const cfg = await memoriesConfig(rm);
  const firstId = cfg.items[0].id;
  await rm.evaluate(async ({ref, id}) => {
    /* se reutiliza una ref cualquiera: lo que se prueba es el autoplay, no la subida */
    const items = JSON.parse(JSON.stringify(window.RestaurantStudioConfig.get('modules.memories.items')));
    items[0].media = [{id: 'v', kind: 'video', ref, alt: 'Vídeo de prueba'}];
    window.RestaurantStudioConfig.set('modules.memories.items', items);
  }, {ref: 'project/memories/rm/video', id: firstId});
  /* el asset tiene que existir en la biblioteca para poder pintarse */
  await rm.evaluate(async b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    await window.RestaurantMedia.save('project/memories/rm/video', new Blob([bytes], {type: 'video/webm'}));
    await window.RestaurantMemoriesEngine.refresh();
  }, VIDEO.buffer.toString('base64'));
  await rm.evaluate(() => document.querySelector('#memories').scrollIntoView({block: 'center'}));
  await rm.waitForTimeout(2200);
  const motion = await rm.evaluate(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    videos: document.querySelectorAll('video[data-mem-video]').length,
    playing: [...document.querySelectorAll('video[data-mem-video]')].filter(v => !v.paused).length
  }));
  check('21 · reduced-motion: el vídeo no arranca solo',
    motion.reduced && motion.videos > 0 && motion.playing === 0,
    `${motion.videos} vídeos · ${motion.playing} reproduciéndose`);
  await rm.screenshot({path: path.join(SHOTS, '03-reduced-motion.png')});
  await rmContext.close();
}

/* ---------- móvil real ---------- */
{
  const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  const m = await boot(mobile);
  await m.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
  await seedItems(m);
  await m.waitForTimeout(1000);
  await m.evaluate(() => document.querySelector('#memories').scrollIntoView({block: 'start'}));
  await m.waitForTimeout(700);
  const smoke = await m.evaluate(() => {
    const section = document.querySelector('#memories');
    const cells = [...document.querySelectorAll('[data-mem-item]')];
    return {
      height: Math.round(section.getBoundingClientRect().height),
      cells: cells.length,
      widest: Math.max(...cells.map(c => Math.round(c.getBoundingClientRect().width))),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      viewport: window.innerWidth
    };
  });
  check('34 · público móvil real a 390px: una columna y sin desbordamiento',
    !smoke.overflow && smoke.cells === MEMORIES.length && smoke.widest <= 390,
    `${smoke.cells} recuerdos · celda más ancha ${smoke.widest}px · overflow ${smoke.overflow}`);
  await m.screenshot({path: path.join(SHOTS, '04-movil.png')});
  await mobile.close();
}

/* ---------- OFF otra vez: no queda nada ---------- */
{
  await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', false));
  await page.waitForTimeout(900);
  const off = await page.evaluate(() => ({
    section: document.querySelectorAll('#memories').length,
    videos: document.querySelectorAll('video[data-mem-video]').length,
    flag: document.documentElement.dataset.memories || null,
    state: window.RestaurantMemoriesEngine.state()
  }));
  check('2b · apagar Memories lo desmonta por completo',
    off.section === 0 && off.videos === 0 && off.flag === null && off.state.mounted === false,
    `sección ${off.section} · vídeos ${off.videos} · flag ${off.flag}`);
  check('runtime · sin errores de página en todo el recorrido',
    page.errors.length === 0, page.errors.slice(0, 2).join(' | ') || 'limpio');
}

await context.close();
await browser.close();
server.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`screenshots -> output/playwright/class23/`);
if (failed.length) {
  console.error(`MEMORIES_FAIL: ${failed.map(f => f.name).join(' | ')}`);
  process.exit(1);
}
console.log('MEMORIES_PASS');
