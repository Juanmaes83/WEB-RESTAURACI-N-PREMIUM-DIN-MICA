/* CLASS 23 — MEMORIES · gate de la recuperación visual + multimedia.
   Contrato: `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-MISSION.md` §36–§41.

   La entrega anterior pasó sus tests y fue rechazada en revisión visual, así que aquí no
   se comprueba presencia de nodos: se comprueba COMPORTAMIENTO.

     · un recuerdo con CUATRO medias mezcladas (imagen · vídeo · imagen · vídeo) y hay
       que llegar a las cuatro en Wall, Stack, Journal y Story — §35 prohíbe expresamente
       el atajo de "un recuerdo de foto y otro de vídeo";
     · el vídeo se prueba con Play/Pause real y `currentTime` avanzando, no con
       `querySelector('video') !== null`;
     · el arrastre del Stack se prueba moviendo el puntero de verdad, comprobando que el
       mazo se mueve, que un gesto corto vuelve al origen y que la PÁGINA no se secuestra.

   Uso: node tests/class23-memories-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {videoFile, seedItems, seedMedia, fixtureFiles} from './memories-fixtures.mjs';

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

const FILES = await fixtureFiles(browser);
const wait = (p, ms) => p.waitForTimeout(ms);

/* ---------- utilidades ---------- */
async function boot(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.errors = errors;
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => !!window.RestaurantStudioConfig, null, {timeout: 30000});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(page, 600);
  return page;
}
const enable = page => page.evaluate(() =>
  window.RestaurantStudioConfig.set('modules.memories.enabled', true));
const openPanel = async page => {
  await page.evaluate(() => {
    if (!document.querySelector('#studio.is-open')) document.querySelector('.studio-open')?.click();
  });
  await wait(page, 700);
  await page.evaluate(() => document.querySelector('.studio-nav [data-panel="memories"]')?.click());
  await page.waitForSelector('.mem-panel', {timeout: 10000});
  await wait(page, 400);
};
const closeStudio = async page => {
  await page.evaluate(() => window.RestaurantStudioShell?.close?.());
  await wait(page, 500);
};
const openCard = async (page, i = 0) => {
  await page.evaluate(n => {
    const card = document.querySelectorAll('[data-mem-card]')[n];
    if (card) card.open = true;
  }, i);
  await wait(page, 250);
};
const setPreset = async (page, value) => {
  await page.evaluate(v => window.RestaurantStudioConfig.set('modules.memories.preset', v), value);
  await wait(page, 1200);
};
const memoriesConfig = page => page.evaluate(() =>
  JSON.parse(JSON.stringify(window.RestaurantStudioConfig.get('modules.memories'))));
const showSection = async page => {
  await page.evaluate(() => {
    const s = document.querySelector('#memories');
    window.scrollTo(0, s.offsetTop + Math.max(0, (s.offsetHeight - innerHeight) * 0.18));
  });
  await wait(page, 900);
};

/* Recorre TODAS las medias de un recuerdo por la vía que ofrezca el preset y devuelve
   cuáles llegaron a estar activas: es la prueba de que ninguna queda almacenada e
   invisible. */
const walkMedia = (page, itemId) => page.evaluate(async id => {
  const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
  if (!viewer) return {reached: [], total: 0, via: 'sin visor'};
  const total = Number(viewer.dataset.memMediaCount || 0);
  const reached = new Set();
  const active = () => viewer.querySelector('.mem-slot[data-active="1"]')?.dataset.memMediaRef;
  reached.add(active());
  const thumbs = [...viewer.querySelectorAll('[data-mem-thumb]')];
  const dots = [...viewer.querySelectorAll('[data-mem-dot]')];
  const via = thumbs.length ? 'miniaturas' : dots.length ? 'puntos' : 'anterior/siguiente';
  const controls = thumbs.length ? thumbs : dots;
  if (controls.length) {
    for (const c of controls) {
      c.click();
      await new Promise(r => setTimeout(r, 230));
      reached.add(active());
    }
  } else {
    const next = viewer.querySelector('[data-mem-media-next]');
    for (let i = 1; i < total; i++) {
      next?.click();
      await new Promise(r => setTimeout(r, 230));
      reached.add(active());
    }
  }
  return {reached: [...reached].filter(Boolean), total, via};
}, itemId);

const context = await browser.newContext({viewport: {width: 1440, height: 960}});
const page = await boot(context);
await enable(page);
await seedItems(page);
await wait(page, 500);
const seededMedia = await seedMedia(page, FILES);
await wait(page, 1600);
const HERO = (await memoriesConfig(page)).items[0];

/* ============================================================
   §36 · MULTI-MEDIA REAL
   ============================================================ */
{
  check('36.1 · un recuerdo con 4 medias guarda 4 refs',
    HERO.media.length === 4 && seededMedia === 12
    && HERO.media.map(m => m.kind).join(',') === 'image,video,image,video',
    `${HERO.media.length} refs (${HERO.media.map(m => m.kind).join(', ')}) · ${seededMedia} en total`);

  await openPanel(page);
  await openCard(page, 0);
  const inStudio = await page.evaluate(id => {
    const card = document.querySelector(`[data-mem-card="${id}"]`);
    const rows = [...card.querySelectorAll('[data-mem-media-ref]')];
    return {
      rows: rows.length,
      thumbs: rows.filter(r => r.querySelector('.mem-media-thumb')).length,
      badges: rows.map(r => r.querySelector('.mem-media-kind')?.textContent),
      cover: rows.findIndex(r => r.dataset.cover === '1'),
      alts: rows.filter(r => r.querySelector('[data-mem-alt]')).length,
      ops: rows.every(r => r.querySelector('[data-mem-media-up]') && r.querySelector('[data-mem-media-down]')
        && r.querySelector('[data-mem-cover]') && r.querySelector('[data-mem-unlink]'))
    };
  }, HERO.id);
  check('36.2 · el Studio muestra las 4, con miniatura, badge, orden y controles',
    inStudio.rows === 4 && inStudio.thumbs === 4 && inStudio.cover === 0 && inStudio.alts === 4
    && inStudio.ops && inStudio.badges.filter(b => b === 'VÍDEO').length === 2,
    `${inStudio.rows} filas · ${inStudio.badges.join('/')} · portada en ${inStudio.cover}`);
  await page.screenshot({path: path.join(SHOTS, '01-studio-4-medias.png')});
  await closeStudio(page);

  await setPreset(page, 'cinematic-memory-wall');
  await showSection(page);
  const wall = await walkMedia(page, HERO.id);
  check('36.3 · el Wall permite llegar a las 4',
    wall.reached.length === 4 && wall.total === 4, `${wall.reached.length}/4 vía ${wall.via}`);

  await setPreset(page, 'memory-stack');
  await showSection(page);
  const stack = await walkMedia(page, HERO.id);
  check('36.4 · el Stack, en la tarjeta en foco, permite llegar a las 4',
    stack.reached.length === 4, `${stack.reached.length}/4 vía ${stack.via}`);

  await setPreset(page, 'editorial-journal');
  await showSection(page);
  const journal = await walkMedia(page, HERO.id);
  check('36.5 · el Journal permite llegar a las 4',
    journal.reached.length === 4, `${journal.reached.length}/4 vía ${journal.via}`);

  await page.evaluate(id => window.RestaurantMemoriesEngine.openStory(id), HERO.id);
  await page.waitForSelector('[data-mem-story]', {timeout: 8000});
  await wait(page, 600);
  const story = await page.evaluate(async () => {
    const layer = document.querySelector('[data-mem-story]');
    const viewer = layer.querySelector('[data-mem-viewer]');
    const reached = new Set();
    const active = () => viewer.querySelector('.mem-slot[data-active="1"]')?.dataset.memMediaRef;
    reached.add(active());
    for (const t of layer.querySelectorAll('[data-mem-thumb]')) {
      t.click();
      await new Promise(r => setTimeout(r, 230));
      reached.add(active());
    }
    return {
      reached: [...reached].filter(Boolean).length,
      total: Number(viewer.dataset.memMediaCount || 0),
      thumbs: layer.querySelectorAll('[data-mem-thumb]').length
    };
  });
  check('36.6 · el Story abre la galería completa, no la primera media',
    story.reached === 4 && story.total === 4 && story.thumbs === 4,
    `${story.reached}/4 · ${story.thumbs} miniaturas`);
  await page.screenshot({path: path.join(SHOTS, '02-story-galeria.png')});
  await page.keyboard.press('Escape');
  await wait(page, 500);

  const counts = {};
  for (const preset of ['cinematic-memory-wall', 'memory-stack', 'editorial-journal']) {
    await setPreset(page, preset);
    counts[preset] = await page.evaluate(() => ({
      slots: document.querySelectorAll('[data-mem-slot]').length,
      total: Number(document.querySelector('#memories')?.dataset.mediaTotal || 0)
    }));
  }
  check('36.7 · ninguna media desaparece al cambiar de preset',
    Object.values(counts).every(c => c.slots === 12 && c.total === 12),
    Object.entries(counts).map(([k, v]) => `${k.split('-')[0]}:${v.slots}`).join(' · '));

  await setPreset(page, 'cinematic-memory-wall');
  await openPanel(page);
  await openCard(page, 0);
  const before = (await memoriesConfig(page)).items[0].media.map(m => m.ref);
  await page.evaluate(ref => document.querySelector(`[data-mem-cover="${ref}"]`).click(), before[2]);
  await wait(page, 800);
  const after = (await memoriesConfig(page)).items[0].media.map(m => m.ref);
  const coverInDom = await page.evaluate(id =>
    document.querySelector(`[data-mem-viewer="${id}"] [data-mem-slot="0"]`)?.dataset.memMediaRef,
  HERO.id);
  check('36.8 · reordenar media cambia la portada, en el estado y en la web',
    after[0] === before[2] && coverInDom === before[2] && after.length === 4,
    `portada ${before[0].split('/').pop()} → ${after[0].split('/').pop()}`);

  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await wait(page, 800);
  const undone = (await memoriesConfig(page)).items[0].media.map(m => m.ref);
  check('36.9 · Undo del reorden de media',
    JSON.stringify(undone) === JSON.stringify(before), `portada ${undone[0].split('/').pop()}`);

  await page.evaluate(() => document.querySelector('#redo-btn').click());
  await wait(page, 800);
  const redone = (await memoriesConfig(page)).items[0].media.map(m => m.ref);
  const redoneDom = await page.evaluate(id =>
    [...document.querySelectorAll(`[data-mem-card="${id}"] [data-mem-media-ref]`)]
      .map(r => r.dataset.memMediaRef), HERO.id);
  check('36.10 · Redo del reorden, y el Studio refleja el mismo orden',
    JSON.stringify(redone) === JSON.stringify(after)
    && JSON.stringify(redoneDom) === JSON.stringify(after),
    `estado y DOM coinciden: ${JSON.stringify(redone) === JSON.stringify(redoneDom)}`);

  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await wait(page, 700);
  await closeStudio(page);
}

/* ============================================================
   §37 · VÍDEO REAL — Play, currentTime, Pause y ciclo de vida
   ============================================================ */
{
  await setPreset(page, 'cinematic-memory-wall');
  await openPanel(page);
  await openCard(page, 4);
  const lastId = (await memoriesConfig(page)).items[4].id;
  const beforeUpload = (await memoriesConfig(page)).items[4].media.length;
  const extraVideo = await videoFile(browser, 2, 'extra.webm');
  await page.setInputFiles(`[data-mem-upload="${lastId}:video"]`, extraVideo);
  await wait(page, 1700);
  const afterUpload = (await memoriesConfig(page)).items[4].media;
  const uploadedRef = afterUpload[afterUpload.length - 1]?.ref;
  const inStore = await page.evaluate(async ref => {
    const rec = (await window.RestaurantStore.listMedia()).find(r => r.slot === ref);
    return {found: !!rec, kind: rec?.kind, size: rec?.size || 0};
  }, uploadedRef);
  check('37.11 · subida de vídeo real por el panel a la Media Library compartida',
    afterUpload.length === beforeUpload + 1 && inStore.found && inStore.kind === 'video'
    && inStore.size > 0,
    `${inStore.size} bytes · ${afterUpload.length} medias en el recuerdo`);

  await closeStudio(page);
  await wait(page, 1000);
  const appeared = await page.evaluate(id => {
    const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
    return {
      count: Number(viewer?.dataset.memMediaCount || 0),
      videos: viewer?.querySelectorAll('video[data-mem-video]').length || 0
    };
  }, lastId);
  check('37.12 · el vídeo aparece en la web sin recargar',
    appeared.count === beforeUpload + 1 && appeared.videos === 1,
    `${appeared.count} medias · ${appeared.videos} vídeo`);

  await showSection(page);
  const playback = await page.evaluate(async id => {
    const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
    const videoThumb = [...viewer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    if (videoThumb) { videoThumb.click(); await new Promise(r => setTimeout(r, 400)); }
    const slot = viewer.querySelector('.mem-slot[data-active="1"]');
    const v = slot?.querySelector('video');
    const button = slot?.querySelector('[data-mem-play]');
    if (!v || !button) return {error: 'sin vídeo activo ni control'};
    const pausedBefore = v.paused;
    button.click();
    await new Promise(r => setTimeout(r, 900));
    const t1 = v.currentTime, playing = !v.paused;
    await new Promise(r => setTimeout(r, 800));
    const t2 = v.currentTime;
    button.click();
    await new Promise(r => setTimeout(r, 400));
    return {pausedBefore, playing, t1, t2, advanced: t2 > t1, pausedAfter: v.paused,
      buttonState: button.dataset.state};
  }, HERO.id);
  check('37.13 · Play manual arranca el vídeo',
    playback.pausedBefore === true && playback.playing === true,
    `pausado antes ${playback.pausedBefore} · reproduciendo ${playback.playing}`);
  check('37.14 · currentTime avanza de verdad',
    playback.advanced === true && playback.t2 > 0,
    `${playback.t1?.toFixed(2)}s → ${playback.t2?.toFixed(2)}s`);
  check('37.15 · Pause detiene el vídeo, y el control lo refleja',
    playback.pausedAfter === true && playback.buttonState === 'paused',
    `pausado ${playback.pausedAfter} · botón "${playback.buttonState}"`);
  check('37.16 · el vídeo inline cumple el contrato de atributos',
    await page.evaluate(() => {
      const v = document.querySelector('#memories video[data-mem-video]');
      return !!v && v.playsInline && v.muted && v.getAttribute('preload') === 'metadata'
        && !!v.getAttribute('aria-label');
    }),
    'playsinline · muted · preload=metadata · aria-label');

  await page.evaluate(id => window.RestaurantMemoriesEngine.openStory(id), HERO.id);
  await page.waitForSelector('[data-mem-story]', {timeout: 8000});
  await wait(page, 500);
  const storyPlay = await page.evaluate(async () => {
    const layer = document.querySelector('[data-mem-story]');
    const videoThumb = [...layer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    videoThumb.click();
    await new Promise(r => setTimeout(r, 400));
    const slot = layer.querySelector('.mem-slot[data-active="1"]');
    const v = slot.querySelector('video');
    slot.querySelector('[data-mem-play]').click();
    await new Promise(r => setTimeout(r, 900));
    const t1 = v.currentTime;
    await new Promise(r => setTimeout(r, 700));
    return {playing: !v.paused, t1, t2: v.currentTime, advanced: v.currentTime > t1};
  });
  check('37.17 · el vídeo del story se reproduce con su propio control',
    storyPlay.playing && storyPlay.advanced,
    `${storyPlay.t1?.toFixed(2)}s → ${storyPlay.t2?.toFixed(2)}s`);
  await page.screenshot({path: path.join(SHOTS, '03-story-video.png')});

  const onSwitch = await page.evaluate(async () => {
    const layer = document.querySelector('[data-mem-story]');
    const playingBefore = [...layer.querySelectorAll('video')].filter(v => !v.paused).length;
    const imageThumb = [...layer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'image');
    imageThumb.click();
    await new Promise(r => setTimeout(r, 500));
    return {playingBefore,
      playingAfter: [...layer.querySelectorAll('video')].filter(v => !v.paused).length};
  });
  check('37.18 · cambiar de media pausa el vídeo anterior',
    onSwitch.playingBefore === 1 && onSwitch.playingAfter === 0,
    `${onSwitch.playingBefore} → ${onSwitch.playingAfter} reproduciéndose`);

  await page.evaluate(async () => {
    const layer = document.querySelector('[data-mem-story]');
    const videoThumb = [...layer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    videoThumb.click();
    await new Promise(r => setTimeout(r, 300));
    layer.querySelector('.mem-slot[data-active="1"] [data-mem-play]').click();
    await new Promise(r => setTimeout(r, 800));
  });
  const playingInStory = await page.evaluate(() => window.RestaurantMemoriesVideo.state().playing);
  await page.keyboard.press('Escape');
  await wait(page, 700);
  const afterClose = await page.evaluate(() => ({
    story: document.querySelectorAll('[data-mem-story]').length,
    playing: window.RestaurantMemoriesVideo.state().playing
  }));
  check('37.20 · cerrar el story pausa su vídeo',
    playingInStory === 1 && afterClose.story === 0 && afterClose.playing === 0,
    `${playingInStory} → ${afterClose.playing} reproduciéndose`);

  await showSection(page);
  const offscreen = await page.evaluate(async id => {
    const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
    const videoThumb = [...viewer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    videoThumb.click();
    await new Promise(r => setTimeout(r, 350));
    viewer.querySelector('.mem-slot[data-active="1"] [data-mem-play]').click();
    await new Promise(r => setTimeout(r, 900));
    const playing = window.RestaurantMemoriesVideo.state().playing;
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 1500));
    return {playing, afterScroll: window.RestaurantMemoriesVideo.state().playing};
  }, HERO.id);
  check('37.21 · el scroll fuera de pantalla pausa el vídeo',
    offscreen.playing === 1 && offscreen.afterScroll === 0,
    `${offscreen.playing} → ${offscreen.afterScroll}`);

  await showSection(page);
  const hidden = await page.evaluate(async id => {
    const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
    /* activar el VÍDEO antes de pulsar Play: el slot activo podía haber quedado en una
       imagen, y entonces no había nada que pausar y el caso no probaba nada */
    const videoThumb = [...viewer.querySelectorAll('[data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    videoThumb?.click();
    await new Promise(r => setTimeout(r, 400));
    /* el vídeo, a la vista: si queda a medias en pantalla el observer lo pausaría y el
       caso no probaría lo que dice probar */
    viewer.scrollIntoView({block: 'center'});
    await new Promise(r => setTimeout(r, 700));
    const slot = viewer.querySelector('.mem-slot[data-active="1"]');
    const btn = slot?.querySelector('[data-mem-play]');
    const vid = slot?.querySelector('video');
    /* punto de partida limpio: los casos anteriores dejaron este clip al final, y
       arrancar desde el final no demuestra nada sobre `document.hidden` */
    if (vid) { try { vid.currentTime = 0; } catch {} }
    await new Promise(r => setTimeout(r, 200));
    btn?.click();
    await new Promise(r => setTimeout(r, 900));
    const playing = window.RestaurantMemoriesVideo.state().playing;
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 450));
    const after = window.RestaurantMemoriesVideo.state().playing;
    delete document.hidden;
    return {playing, after, slotKind: slot?.dataset.kind, hadButton: !!btn,
      time: slot?.querySelector('video')?.currentTime ?? null};
  }, HERO.id);
  check('37.22 · el documento oculto pausa el vídeo',
    hidden.playing === 1 && hidden.after === 0,
    `${hidden.playing} → ${hidden.after} · slot ${hidden.slotKind} · botón ${hidden.hadButton} · t=${hidden.time}`);

  const heightOn = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', false));
  await wait(page, 1000);
  const off = await page.evaluate(() => ({
    section: document.querySelectorAll('#memories').length,
    video: window.RestaurantMemoriesVideo.state(),
    canvases: document.querySelectorAll('.mem-artifact-canvas').length,
    height: document.body.scrollHeight
  }));
  check('37.23 · apagar Memories pausa y suelta todos los vídeos',
    off.section === 0 && off.video.playing === 0 && off.video.registered === 0,
    `${off.video.registered} registrados · ${off.video.playing} reproduciéndose`);
  check('41.47 · OFF real: ni sección, ni canvas, ni espacio',
    off.section === 0 && off.canvases === 0 && off.height < heightOn - 500,
    `alto ${heightOn} → ${off.height} · ${off.canvases} canvas`);
  await enable(page);
  await wait(page, 1400);
}

/* ---------- §37.19 · cambiar de recuerdo pausa el vídeo (Stack) ---------- */
{
  await setPreset(page, 'memory-stack');
  await showSection(page);
  const onCardChange = await page.evaluate(async () => {
    const deck = document.querySelector('[data-mem-deck]');
    const focused = deck.querySelector('.mem-card[data-focused="1"]');
    const viewer = focused.querySelector('[data-mem-viewer]');
    const videoDot = [...viewer.querySelectorAll('[data-mem-dot]')]
      .find(d => d.dataset.kind === 'video');
    videoDot?.click();
    await new Promise(r => setTimeout(r, 400));
    focused.querySelector('.mem-slot[data-active="1"] [data-mem-play]')?.click();
    await new Promise(r => setTimeout(r, 900));
    const playing = window.RestaurantMemoriesVideo.state().playing;
    document.querySelector('[data-mem-next]').click();
    await new Promise(r => setTimeout(r, 1300));
    return {playing, after: window.RestaurantMemoriesVideo.state().playing};
  });
  check('37.19 · cambiar de recuerdo en el Stack pausa el vídeo anterior',
    onCardChange.playing === 1 && onCardChange.after === 0,
    `${onCardChange.playing} → ${onCardChange.after}`);
}

/* ============================================================
   §38 · STACK — física de verdad
   ============================================================ */
{
  await setPreset(page, 'memory-stack');
  await showSection(page);
  /* punto de partida conocido: otro caso dejó el mazo en el segundo recuerdo, y un test
     de física no puede depender de dónde lo dejó el anterior */
  await page.evaluate(() => window.RestaurantMemoriesEngine.stack()?.goTo(0));
  await wait(page, 1200);

  const visible = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.mem-card')];
    const inside = cards.filter(c => {
      const r = c.getBoundingClientRect();
      return parseFloat(getComputedStyle(c).opacity) > 0.08
        && r.right > 0 && r.left < innerWidth && r.width > 60;
    });
    return {
      total: cards.length, perceptible: inside.length,
      state: document.querySelector('[data-mem-deck]')?.dataset.stackState,
      depths: inside.slice(0, 4).map(c => Number(c.style.getPropertyValue('--d')).toFixed(2))
    };
  });
  check('38.26 · con 5 recuerdos hay 3 o más tarjetas perceptibles',
    visible.perceptible >= 3 && visible.total === 5,
    `${visible.perceptible} de ${visible.total} · profundidades ${visible.depths.join('/')}`);
  await page.screenshot({path: path.join(SHOTS, '04-stack-profundidad.png')});

  const deckBox = await page.evaluate(() => {
    const d = document.querySelector('[data-mem-deck]').getBoundingClientRect();
    return {x: d.x + d.width / 2, y: d.y + d.height * 0.35};
  });
  await page.mouse.move(deckBox.x, deckBox.y);
  await page.mouse.down();
  await page.mouse.move(deckBox.x - 60, deckBox.y, {steps: 6});
  const during = await page.evaluate(() => ({
    state: document.querySelector('[data-mem-deck]')?.dataset.stackState,
    dragging: document.querySelector('[data-mem-deck]')?.dataset.dragging === '1',
    focus: window.RestaurantMemoriesEngine.state().stack.focus,
    transform: document.querySelector('.mem-card').style.transform
  }));
  await page.mouse.move(deckBox.x - 150, deckBox.y, {steps: 8});
  const deeper = await page.evaluate(() => window.RestaurantMemoriesEngine.state().stack.focus);
  await page.mouse.up();
  /* esperar el ASENTADO, no un tiempo fijo: el muelle tarda lo que tarda */
  await page.waitForFunction(
    () => window.RestaurantMemoriesEngine.state().stack.state === 'IDLE',
    null, {timeout: 6000});
  const afterDrag = await page.evaluate(() => window.RestaurantMemoriesEngine.state().stack);
  check('38.27 · el arrastre con puntero mueve el mazo de verdad',
    during.dragging && during.state === 'DRAGGING' && during.focus > 0.05
    && deeper > during.focus && /translate3d/.test(during.transform),
    `estado ${during.state} · focus ${during.focus.toFixed(3)} → ${deeper.toFixed(3)}`);
  check('38.28 · un lanzamiento cambia el recuerdo en foco y el muelle asienta',
    afterDrag.target === 1 && afterDrag.state === 'IDLE'
    && Math.abs(afterDrag.focus - afterDrag.target) < 0.02,
    `objetivo ${afterDrag.target} · focus ${afterDrag.focus.toFixed(3)} · ${afterDrag.state}`);

  const originTarget = afterDrag.target;
  await page.mouse.move(deckBox.x, deckBox.y);
  await page.mouse.down();
  await page.mouse.move(deckBox.x - 22, deckBox.y, {steps: 5});
  await page.mouse.up();
  await wait(page, 1000);
  const snapped = await page.evaluate(() => window.RestaurantMemoriesEngine.state().stack);
  check('38.29 · un arrastre insuficiente vuelve al origen',
    snapped.target === originTarget && Math.abs(snapped.focus - originTarget) < 0.02,
    `sigue en ${snapped.target} con focus ${snapped.focus.toFixed(3)}`);

  await page.evaluate(() => document.querySelector('[data-mem-deck]').focus({preventScroll: true}));
  await wait(page, 300);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('ArrowRight');
  await wait(page, 1000);
  const byKey = await page.evaluate(() => ({
    target: window.RestaurantMemoriesEngine.state().stack.target, scroll: window.scrollY}));
  check('38.30 · teclado ← →', byKey.target === originTarget + 1, `objetivo ${byKey.target}`);
  check('38.30b · el teclado no desplaza la página',
    Math.abs(byKey.scroll - scrollBefore) < 4, `scroll ${scrollBefore} → ${byKey.scroll}`);

  await page.evaluate(() => document.querySelector('[data-mem-prev]').click());
  await wait(page, 1000);
  const byButton = await page.evaluate(() => window.RestaurantMemoriesEngine.state().stack.target);
  check('38.31 · botones anterior/siguiente', byButton === originTarget, `objetivo ${byButton}`);

  const wheel = await page.evaluate(async () => {
    const before = window.scrollY;
    const focusBefore = window.RestaurantMemoriesEngine.state().stack.target;
    const deck = document.querySelector('[data-mem-deck]');
    const r = deck.getBoundingClientRect();
    deck.dispatchEvent(new WheelEvent('wheel', {deltaY: 320, bubbles: true, cancelable: true,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2}));
    window.scrollBy(0, 320);
    await new Promise(res => setTimeout(res, 600));
    return {moved: window.scrollY - before,
      focusChanged: window.RestaurantMemoriesEngine.state().stack.target !== focusBefore};
  });
  check('38.32 · la rueda no se secuestra: la página baja y el mazo no cambia',
    wheel.moved > 200 && wheel.focusChanged === false,
    `la página bajó ${wheel.moved}px · el foco cambió: ${wheel.focusChanged}`);

  await showSection(page);
  const reel = await walkMedia(page, HERO.id);
  check('38.33 · la tarjeta en foco recorre su colección de medias',
    reel.reached.length === 4, `${reel.reached.length}/4 vía ${reel.via}`);
  await page.screenshot({path: path.join(SHOTS, '05-stack-media.png')});
}

/* ============================================================
   §39 · WALL
   ============================================================ */
{
  await setPreset(page, 'cinematic-memory-wall');
  await showSection(page);
  const wall = await page.evaluate(() => {
    const featured = document.querySelector('.mem-cell[data-featured]');
    const others = [...document.querySelectorAll('.mem-cell:not([data-featured])')];
    const fr = featured.querySelector('.mem-frame').getBoundingClientRect();
    const areas = others.map(o => {
      const r = o.querySelector('.mem-frame')?.getBoundingClientRect();
      return r ? r.width * r.height : 0;
    });
    return {
      featuredArea: fr.width * fr.height,
      biggestOther: Math.max(...areas),
      featuredMedia: Number(featured.dataset.memMediaCount || 0),
      multiMediaCells: [...document.querySelectorAll('[data-mem-item]')]
        .filter(c => Number(c.dataset.memMediaCount || 0) > 1).length,
      allHaveStrips: [...document.querySelectorAll('[data-mem-item]')]
        .filter(c => Number(c.dataset.memMediaCount || 0) > 1)
        .every(c => c.querySelectorAll('[data-mem-thumb]').length > 0),
      weights: [...new Set([...document.querySelectorAll('.mem-cell')].map(c => c.dataset.weight))],
      revealed: document.querySelectorAll('.mem-cell[data-revealed]').length,
      shifted: [...document.querySelectorAll('.mem-cell')]
        .filter(c => {
          const v = c.style.getPropertyValue('--mem-shift');
          return v && v !== '0px' && v !== '0.00px';
        }).length
    };
  });
  check('39.35 · el destacado tiene jerarquía hero real',
    wall.featuredArea > wall.biggestOther * 1.5 && wall.featuredMedia === 4,
    `área ${Math.round(wall.featuredArea / 1000)}k vs ${Math.round(wall.biggestOther / 1000)}k · ${wall.featuredMedia} medias`);
  check('39.36 · las medias secundarias son visibles y navegables en la pared',
    wall.multiMediaCells >= 4 && wall.allHaveStrips,
    `${wall.multiMediaCells} recuerdos multimedia, todos con miniaturas`);
  check('39.37 · más de una media a la vista en un recuerdo multimedia',
    await page.evaluate(id => {
      const cell = document.querySelector(`[data-mem-item="${id}"]`);
      const cover = cell.querySelector('.mem-slot[data-active="1"]');
      const shown = [...cell.querySelectorAll('[data-mem-thumb]')].filter(t => {
        const r = t.getBoundingClientRect();
        return r.width > 20 && r.height > 20;
      });
      return !!cover && shown.length >= 3;
    }, HERO.id),
    'portada + al menos 3 satélites con caja real');
  check('39.38 · la coreografía de entrada y el parallax ocurren',
    wall.revealed >= 1 && wall.shifted >= 1,
    `${wall.revealed} celdas reveladas · ${wall.shifted} con parallax aplicado`);
  check('39.39 · no es un grid genérico de una imagen por celda',
    wall.weights.length >= 2 && wall.multiMediaCells >= 4,
    `pesos: ${wall.weights.join(', ')}`);

  const occlusion = await page.evaluate(async () => {
    const section = document.querySelector('#memories');
    const hits = [];
    for (let f = 0; f <= 1; f += 0.07) {
      window.scrollTo(0, Math.max(0, section.offsetTop + (section.offsetHeight - innerHeight) * f));
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 110)));
      for (const t of section.querySelectorAll('.mem-item-title,.mem-text,.mem-date,.mem-author,.mem-title')) {
        const r = t.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight || r.width < 20) continue;
        for (const dx of [0.2, 0.5, 0.8]) {
          const el = document.elementFromPoint(Math.round(r.left + r.width * dx),
            Math.round(r.top + r.height * 0.5));
          if (el && el.closest('.st-traveler')) hits.push(`${t.className}@${dx}`);
        }
      }
    }
    return hits;
  });
  check('39.40 · el objeto viajero cruza la sección sin tapar una sola palabra',
    occlusion.length === 0,
    occlusion.length ? occlusion.slice(0, 3).join(' · ') : 'barrido completo sin oclusión');
  await showSection(page);
  await page.screenshot({path: path.join(SHOTS, '06-wall.png')});
}

/* ============================================================
   §40 · JOURNAL y ARTEFACTOS
   ============================================================ */
{
  await setPreset(page, 'editorial-journal');
  await showSection(page);
  const journal = await page.evaluate(() => {
    const entries = [...document.querySelectorAll('.mem-entry')];
    return {
      entries: entries.length,
      sides: entries.map(e => e.dataset.side).slice(0, 4),
      withStrip: entries.filter(e => e.querySelector('[data-mem-strip]')).length,
      spreads: entries.filter(e => e.querySelector('.mem-spread .mem-frame')).length,
      dates: entries.map(e => e.querySelector('.mem-date')?.textContent).filter(Boolean).length,
      places: entries.map(e => e.querySelector('.mem-place')?.textContent).filter(Boolean).length,
      stories: entries.filter(e => e.querySelector('.mem-text')).length,
      folios: entries.filter(e => e.querySelector('.mem-folio')).length
    };
  });
  check('40.41 · spreads mixtos: cada entrada es una página con su media',
    journal.entries === 5 && journal.spreads === 5
    && journal.sides[0] === 'left' && journal.sides[1] === 'right',
    `${journal.spreads} spreads · ritmo ${journal.sides.join('/')}`);
  check('40.42 · el filmstrip usa las medias secundarias',
    journal.withStrip === 4,
    `${journal.withStrip} entradas con filmstrip (las que tienen más de una media)`);
  const journalVideo = await page.evaluate(async () => {
    const strip = [...document.querySelectorAll('.mem-entry [data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    strip.click();
    await new Promise(r => setTimeout(r, 400));
    const slot = strip.closest('[data-mem-viewer]').querySelector('.mem-slot[data-active="1"]');
    const v = slot.querySelector('video');
    slot.querySelector('[data-mem-play]').click();
    await new Promise(r => setTimeout(r, 900));
    const t1 = v.currentTime;
    await new Promise(r => setTimeout(r, 700));
    return {playing: !v.paused, advanced: v.currentTime > t1, t: v.currentTime};
  });
  check('40.43 · el vídeo del Journal se reproduce',
    journalVideo.playing && journalVideo.advanced, `${journalVideo.t?.toFixed(2)}s`);
  check('40.46 · fecha, lugar, historia y folio intactos',
    journal.dates === 5 && journal.places === 5 && journal.stories === 5 && journal.folios === 5,
    `${journal.dates} fechas · ${journal.places} lugares · ${journal.folios} folios`);
  await showSection(page);
  await page.screenshot({path: path.join(SHOTS, '07-journal.png')});

  const art = await page.evaluate(async () => {
    const out = {};
    for (const style of ['paper', 'cloth']) {
      const surface = document.querySelector(`[data-mem-artifact="${style}"]`);
      surface?.closest('[data-mem-item]')?.scrollIntoView({block: 'center'});
      await new Promise(r => setTimeout(r, 1000));
      const canvas = surface?.querySelector('canvas.mem-artifact-canvas');
      const box = surface?.getBoundingClientRect();
      let painted = 0;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = Math.min(canvas.width, 400), h = Math.min(canvas.height, 400);
        const data = ctx.getImageData(0, 0, w, h).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 6) painted++;
      }
      out[style] = {
        surface: !!surface, canvas: !!canvas, painted,
        w: box ? Math.round(box.width) : 0, h: box ? Math.round(box.height) : 0
      };
    }
    return out;
  });
  check('40.44 · Paper Artifact: superficie material con grabado cinético pintado',
    art.paper.surface && art.paper.canvas && art.paper.painted > 300 && art.paper.w > 200,
    `${art.paper.w}×${art.paper.h} · ${art.paper.painted} píxeles de grabado`);
  check('40.45 · Heritage Cloth: tejido con deformación pintada',
    art.cloth.surface && art.cloth.canvas && art.cloth.painted > 1500 && art.cloth.w > 200,
    `${art.cloth.w}×${art.cloth.h} · ${art.cloth.painted} píxeles de tela`);
}

/* ============================================================
   §41 · PERSISTENCIA Y DOMINIO
   ============================================================ */
{
  const snapshots = {};
  for (const preset of ['cinematic-memory-wall', 'memory-stack', 'editorial-journal']) {
    await setPreset(page, preset);
    snapshots[preset] = (await memoriesConfig(page)).items
      .map(i => `${i.id}:${i.media.map(m => m.ref).join(',')}:${i.featured}:${i.artifactStyle}`).join('|');
  }
  const values = Object.values(snapshots);
  check('41.48 · cambiar de preset conserva media, orden, featured y tratamiento',
    values.every(v => v === values[0]), 'los tres presets ven exactamente lo mismo');

  await setPreset(page, 'cinematic-memory-wall');
  const before = await memoriesConfig(page);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(page, 2000);
  const after = await memoriesConfig(page);
  const rendered = await page.evaluate(() => ({
    count: Number(document.querySelector('#memories')?.dataset.count || 0),
    media: Number(document.querySelector('#memories')?.dataset.mediaTotal || 0),
    images: document.querySelectorAll('#memories img.mem-media-image').length,
    videos: document.querySelectorAll('#memories video[data-mem-video]').length
  }));
  check('41.49 · tras recargar: mismo estado, y la media local se resuelve otra vez',
    JSON.stringify(after) === JSON.stringify(before)
    && rendered.count === 5 && rendered.media === 13 && rendered.videos >= 3,
    `${rendered.count} recuerdos · ${rendered.media} medias · ${rendered.videos} vídeos`);
  await page.screenshot({path: path.join(SHOTS, '08-tras-recargar.png')});

  await openPanel(page);
  const domIds = () => page.evaluate(() =>
    [...document.querySelectorAll('[data-mem-card]')].map(c => c.dataset.memCard));
  const stateIds = async () => (await memoriesConfig(page)).items.map(i => i.id);
  const original = await stateIds();
  await page.evaluate(() => document.querySelector('[data-mem-down]:not(:disabled)').click());
  await wait(page, 800);
  const reordered = await stateIds();
  const reorderedDom = await domIds();
  check('41.50a · reordenar recuerdos: el DOM del Studio sigue al estado',
    reordered[0] === original[1] && JSON.stringify(reorderedDom) === JSON.stringify(reordered),
    `${original.slice(0, 2).map(s => s.slice(-4)).join(',')} → ${reordered.slice(0, 2).map(s => s.slice(-4)).join(',')}`);

  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await wait(page, 900);
  const undoneState = await stateIds();
  const undoneDom = await domIds();
  check('41.50 · Undo del reorden: estado y DOM coinciden (no B,A con inputs cruzados)',
    JSON.stringify(undoneState) === JSON.stringify(original)
    && JSON.stringify(undoneDom) === JSON.stringify(original),
    `estado ${undoneState[0].slice(-4)} · DOM ${undoneDom[0].slice(-4)}`);

  await page.evaluate(() => document.querySelector('#redo-btn').click());
  await wait(page, 900);
  const redoneState = await stateIds();
  const redoneDom = await domIds();
  check('41.51 · Redo del reorden: estado y DOM coinciden',
    JSON.stringify(redoneState) === JSON.stringify(reordered)
    && JSON.stringify(redoneDom) === JSON.stringify(reordered),
    `estado ${redoneState[0].slice(-4)} · DOM ${redoneDom[0].slice(-4)}`);

  await page.evaluate(() => {
    const items = JSON.parse(JSON.stringify(
      window.RestaurantStudioConfig.get('modules.memories.items')));
    items.reverse();
    window.RestaurantStudioConfig.set('modules.memories.items', items);
  });
  await wait(page, 900);
  const importedState = await stateIds();
  const importedDom = await domIds();
  check('41.52 · un import con el mismo número de items actualiza el DOM del Studio',
    JSON.stringify(importedDom) === JSON.stringify(importedState)
    && importedState[0] === redoneState[redoneState.length - 1],
    `DOM y estado en el mismo orden: ${JSON.stringify(importedDom) === JSON.stringify(importedState)}`);
  await page.evaluate(() => document.querySelector('#undo-btn').click());
  await wait(page, 700);
  await closeStudio(page);

  const stores = await page.evaluate(async () => ({
    local: Object.keys(localStorage).filter(k => /memor/i.test(k)),
    session: Object.keys(sessionStorage || {}).filter(k => /memor/i.test(k)),
    dbs: (await indexedDB.databases()).map(d => d.name),
    caches: 'caches' in window ? await caches.keys() : [],
    apis: {
      media: !!window.RestaurantMedia, picker: !!window.RestaurantMediaPicker,
      extra: Object.keys(window).filter(k => /MemoriesMedia|MemoriesStore|MemoriesLibrary/.test(k))
    }
  }));
  check('41.53 · Memories no crea claves propias en localStorage',
    stores.local.length === 0 && stores.session.length === 0,
    `local [${stores.local.join(', ')}]`);
  check('41.54 · Memories no crea IndexedDB ni Cache propios',
    !stores.dbs.some(n => /memor/i.test(n || '')) && !stores.caches.some(n => /memor/i.test(n || '')),
    `bases: ${stores.dbs.join(', ')}`);
  check('41.55 · una sola Media Library, compartida',
    stores.apis.media && stores.apis.picker && stores.apis.extra.length === 0,
    'RestaurantMedia + RestaurantMediaPicker, sin biblioteca paralela');

  const studio = await page.evaluate(() => ({
    drawers: document.querySelectorAll('#studio').length,
    panelInside: !!document.querySelector('#studio .mem-panel'),
    tabs: document.querySelectorAll('.studio-nav [data-panel="memories"]').length,
    iframes: document.querySelectorAll('iframe').length
  }));
  check('41.56 · no hay segundo Studio',
    studio.drawers === 1 && studio.panelInside && studio.tabs === 1 && studio.iframes === 0,
    `${studio.drawers} cajón · panel dentro ${studio.panelInside}`);

  const labs = await page.evaluate(() => [...document.querySelectorAll('a[href], iframe[src]')]
    .map(n => n.getAttribute('href') || n.getAttribute('src'))
    .filter(v => v && /(^|\/)labs\//.test(v)));
  check('41.57 · Memories no introduce dependencia de /labs/',
    labs.length === 0, labs.length ? labs.join(' · ') : 'ningún enlace a labs');

  const state = await memoriesConfig(page);
  const raw = JSON.stringify(state);
  check('41.58 · ni un blob: ni un File en el Project State',
    !/blob:/.test(raw) && !/"file"/.test(raw)
    && state.items.every(i => i.media.every(m => /^project\/memories\//.test(m.ref))),
    'todas las refs son lógicas');

  const withStyles = state.items.map(i => `${i.type}:${i.artifactStyle}`).join(' ');
  check('41.59 · artifactStyle persiste tras la recarga',
    /paper/.test(withStyles) && /cloth/.test(withStyles), withStyles);

  const paperItem = state.items.find(i => i.artifactStyle === 'paper');
  const beforeStyle = JSON.stringify({...paperItem, artifactStyle: null});
  await page.evaluate(id => {
    const items = JSON.parse(JSON.stringify(
      window.RestaurantStudioConfig.get('modules.memories.items')));
    items.find(i => i.id === id).artifactStyle = 'none';
    window.RestaurantStudioConfig.set('modules.memories.items', items);
  }, paperItem.id);
  await wait(page, 1100);
  const afterStyle = (await memoriesConfig(page)).items.find(i => i.id === paperItem.id);
  const stillThere = await page.evaluate(id => {
    const cell = document.querySelector(`[data-mem-item="${id}"]`);
    return {
      artifact: !!cell?.querySelector('[data-mem-artifact]'),
      media: Number(cell?.dataset.memMediaCount || 0),
      title: cell?.querySelector('.mem-item-title')?.textContent
    };
  }, paperItem.id);
  check('41.60 · cambiar el tratamiento sólo cambia la presentación',
    JSON.stringify({...afterStyle, artifactStyle: null}) === beforeStyle
    && stillThere.artifact === false && stillThere.media === paperItem.media.length
    && stillThere.title === paperItem.title,
    `mismo recuerdo y ${stillThere.media} medias, sin superficie de papel`);
  await page.evaluate(id => {
    const items = JSON.parse(JSON.stringify(
      window.RestaurantStudioConfig.get('modules.memories.items')));
    items.find(i => i.id === id).artifactStyle = 'paper';
    window.RestaurantStudioConfig.set('modules.memories.items', items);
  }, paperItem.id);
  await wait(page, 900);
}

/* ---------- reduced motion: sin autoplay, con Play disponible ---------- */
{
  const rmContext = await browser.newContext({viewport: {width: 1440, height: 960}, reducedMotion: 'reduce'});
  const rm = await boot(rmContext);
  await enable(rm);
  await seedItems(rm);
  await wait(rm, 500);
  await seedMedia(rm, FILES);
  await wait(rm, 1600);
  await rm.evaluate(() => {
    const s = document.querySelector('#memories');
    window.scrollTo(0, s.offsetTop);
  });
  await wait(rm, 2200);
  const motion = await rm.evaluate(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    videos: document.querySelectorAll('#memories video[data-mem-video]').length,
    playing: window.RestaurantMemoriesVideo.state().playing,
    framesVisible: [...document.querySelectorAll('.mem-cell')].every(c =>
      parseFloat(getComputedStyle(c.querySelector('.mem-frame')).opacity) > 0.9)
  }));
  check('37.24 · reduced-motion: ningún vídeo arranca solo',
    motion.reduced && motion.videos >= 3 && motion.playing === 0,
    `${motion.videos} vídeos · ${motion.playing} reproduciéndose`);
  const manual = await rm.evaluate(async () => {
    const thumb = [...document.querySelectorAll('#memories [data-mem-thumb]')]
      .find(t => t.dataset.kind === 'video');
    thumb?.click();
    await new Promise(r => setTimeout(r, 450));
    const active = document.querySelector('#memories .mem-slot[data-active="1"][data-kind=video]');
    const v = active?.querySelector('video');
    active?.querySelector('[data-mem-play]')?.click();
    await new Promise(r => setTimeout(r, 900));
    const t1 = v?.currentTime ?? 0;
    await new Promise(r => setTimeout(r, 700));
    return {playing: v ? !v.paused : false, advanced: (v?.currentTime ?? 0) > t1};
  });
  check('37.25 · reduced-motion: el Play manual sigue disponible y funciona',
    manual.playing && manual.advanced, 'arranca y avanza con el control');
  check('39.38b · reduced-motion: la composición no queda oculta por no animarse',
    motion.framesVisible, 'todos los marcos visibles sin coreografía');
  await rm.screenshot({path: path.join(SHOTS, '09-reduced-motion.png')});
  await rmContext.close();
}

/* ---------- móvil real: los tres presets ---------- */
{
  const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  const m = await boot(mobile);
  await enable(m);
  await seedItems(m);
  await wait(m, 500);
  await seedMedia(m, FILES);
  await wait(m, 1700);
  const smoke = {};
  for (const preset of ['cinematic-memory-wall', 'memory-stack', 'editorial-journal']) {
    await m.evaluate(v => window.RestaurantStudioConfig.set('modules.memories.preset', v), preset);
    await wait(m, 1300);
    await m.evaluate(() => {
      const s = document.querySelector('#memories');
      window.scrollTo(0, s.offsetTop);
    });
    await wait(m, 800);
    smoke[preset] = await m.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      items: document.querySelectorAll('[data-mem-item]').length,
      widest: Math.max(...[...document.querySelectorAll('[data-mem-item]')]
        .map(c => Math.round(c.getBoundingClientRect().width)))
    }));
  }
  check('50 · público responsive a 390 px en los tres presets, sin desbordamiento',
    Object.values(smoke).every(s => !s.overflow && s.items === 5 && s.widest <= 392),
    Object.entries(smoke).map(([k, v]) => `${k.split('-')[0]}:${v.widest}px`).join(' · '));
  await m.screenshot({path: path.join(SHOTS, '10-movil.png')});
  await mobile.close();
}

check('runtime · sin errores de página en todo el recorrido',
  page.errors.length === 0, page.errors.slice(0, 2).join(' | ') || 'limpio');

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
