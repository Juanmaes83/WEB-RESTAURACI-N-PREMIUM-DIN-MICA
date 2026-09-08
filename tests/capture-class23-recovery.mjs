/* Evidencia visual de la RECUPERACIÓN de CLASS 23 (§42–§45 del contrato).

   Tres carpetas, como pide el contrato:

     references/      las fuentes de ThreeUI que se auditaron, capturadas tal cual
     implementation/  las 15 capturas obligatorias del producto
     video/           el recorrido real, en una sola sesión

   Las referencias se sirven desde el clon de `Juanmaes83/threeui` (MIT © Meng To). Si no
   está clonado, esa parte se salta con un aviso: la evidencia del producto no depende de
   tener el repo de referencia a mano.

   Uso: node tests/capture-class23-recovery.mjs [url] [--refs=<ruta al clon de threeui>]
   Salida: output/playwright/class23-recovery/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {MEMORIES, imageFile, videoFile, seedItems, seedMedia, fixtureFiles}
  from './memories-fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output', 'playwright', 'class23-recovery');
const REFS = path.join(OUT, 'references');
const IMPL = path.join(OUT, 'implementation');
const VIDEO_DIR = path.join(OUT, 'video');
for (const dir of [REFS, IMPL, VIDEO_DIR]) fs.mkdirSync(dir, {recursive: true});

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const refsArg = args.find(a => a.startsWith('--refs='))?.slice(7);
const REF_REPO = refsArg || path.join(
  process.env.TEMP || '/tmp', 'claude', 'C--Users-temp123',
  'b0aa5eb6-7627-482d-95ec-e4e07d6ae011', 'scratchpad', 'threeui');

const local = target ? null : await startServer(0);
const BASE = (target || local.url).replace(/\/$/, '');
const browser = await chromium.launch();
const report = {url: BASE, references: {}, implementation: {}, video: null};
const wait = (p, ms) => p.waitForTimeout(ms);

/* ============================================================
   §43 · REFERENCIAS
   ============================================================ */
{
  const REFERENCES = [
    {file: 'public/synthralos-halftone.html', name: 'koi-studies', wait: 3200,
      note: 'stacked physical studies · arrastre y lanzamiento'},
    {file: 'src/shaders/neuform-isolated/sources/kinetic-lathe-certificate.html',
      name: 'kinetic-certificate', wait: 3000, note: 'papel · roseta y guilloché cinéticos'},
    {file: 'src/shaders/neuform-isolated/sources/lumina-weavers-cloth.html',
      name: 'heritage-cloth', wait: 4200, note: 'tela · Verlet + viento'},
    {file: 'public/landing-pages/meng-to-sketchbook.html', name: 'sketchbook', wait: 3200,
      note: 'página · collage editorial'},
    {file: 'src/shaders/character-carousel/sources/character-filmstrip.html',
      name: 'character-filmstrip', wait: 2600, note: 'filmstrip · estado continuo por foco'}
  ];
  if (!fs.existsSync(REF_REPO)) {
    console.log(`referencias: no encontrado el clon de threeui en ${REF_REPO} — se omite`);
    report.references.skipped = REF_REPO;
  } else {
    /* servidor mínimo sobre el clon: los ficheros piden assets por ruta absoluta */
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const candidates = [path.join(REF_REPO, url), path.join(REF_REPO, 'public', url)];
      const file = candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
      if (!file) { res.writeHead(404).end(); return; }
      const ext = path.extname(file).toLowerCase();
      const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
        '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm'};
      res.writeHead(200, {'content-type': types[ext] || 'application/octet-stream'});
      res.end(fs.readFileSync(file));
    });
    const port = await new Promise(r => server.listen(0, '127.0.0.1', () => r(server.address().port)));
    const ctx = await browser.newContext({viewport: {width: 1440, height: 900}});
    for (const ref of REFERENCES) {
      const full = path.join(REF_REPO, ref.file);
      if (!fs.existsSync(full)) { report.references[ref.name] = 'no existe'; continue; }
      const page = await ctx.newPage();
      try {
        await page.goto(`http://127.0.0.1:${port}/${ref.file}`,
          {waitUntil: 'load', timeout: 30000});
        await wait(page, ref.wait);
        await page.screenshot({path: path.join(REFS, `${ref.name}.png`)});
        report.references[ref.name] = ref.note;
        console.log(`referencia -> ${ref.name}.png`);
      } catch (err) {
        report.references[ref.name] = `no capturable: ${err.message.split('\n')[0]}`;
      }
      await page.close();
    }
    await ctx.close();
    server.close();
  }
}

/* ============================================================
   §44 · IMPLEMENTACIÓN — las 15 capturas
   ============================================================ */
const FILES = await fixtureFiles(browser);
const IMAGE = imageFile(0);

async function boot(page) {
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(page, 700);
}
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
const setPreset = async (page, value) => {
  await page.evaluate(v => window.RestaurantStudioConfig.set('modules.memories.preset', v), value);
  await wait(page, 1300);
};
/* encuadra una fracción de la sección: medirla es la única forma de que la captura
   enseñe lo que dice enseñar */
const frameAt = async (page, fraction) => {
  await page.evaluate(f => {
    const s = document.querySelector('#memories');
    window.scrollTo(0, Math.max(0, s.offsetTop + (s.offsetHeight - innerHeight) * f));
  }, fraction);
  await wait(page, 1400);
};
const frameOn = async (page, selector) => {
  await page.evaluate(sel => document.querySelector(sel)
    ?.closest('[data-mem-item]')?.scrollIntoView({block: 'center'}), selector);
  await wait(page, 1500);
};

const context = await browser.newContext({viewport: {width: 1440, height: 960}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await boot(page);
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
await seedItems(page);
await wait(page, 600);
report.implementation.media = await seedMedia(page, FILES);
await wait(page, 1700);
const HERO = await page.evaluate(() =>
  window.RestaurantStudioConfig.get('modules.memories.items')[0].id);

/* 01 · Studio con un recuerdo de 4 medias visibles */
await openPanel(page);
await page.evaluate(id => {
  const card = document.querySelector(`[data-mem-card="${id}"]`);
  card.open = true;
  card.querySelector('.mem-media-box')?.scrollIntoView({block: 'center'});
}, HERO);
await wait(page, 700);
await page.screenshot({path: path.join(IMPL, '01-studio-memories-4-medias.png')});

/* 02 · el picker de la Media Library, con imágenes y vídeos */
await page.evaluate(id => document.querySelector(`[data-mem-pick="${id}"]`)?.click(), HERO);
await page.waitForSelector('[data-media-picker="open"]', {timeout: 8000});
await wait(page, 700);
await page.screenshot({path: path.join(IMPL, '02-media-library-picker.png')});
report.implementation.picker = await page.evaluate(() => ({
  archivos: document.querySelectorAll('[data-media-picker-ref]').length,
  kinds: [...new Set([...document.querySelectorAll('[data-media-picker-ref]')]
    .map(n => n.dataset.kind))]
}));
await page.keyboard.press('Escape');
await wait(page, 400);
await closeStudio(page);

/* 03·04 · Cinematic Memory Wall */
await setPreset(page, 'cinematic-memory-wall');
await frameAt(page, 0.36);
await page.screenshot({path: path.join(IMPL, '03-wall-general.png')});
await frameAt(page, 0.1);
await page.screenshot({path: path.join(IMPL, '04-wall-featured-multimedia.png')});

/* 05·06·07 · Memory Stack: profundidad, interacción y media de la tarjeta */
await setPreset(page, 'memory-stack');
await frameAt(page, 0.2);
await page.screenshot({path: path.join(IMPL, '05-stack-3-cards.png')});
{
  const box = await page.evaluate(() => {
    const d = document.querySelector('[data-mem-deck]').getBoundingClientRect();
    return {x: d.x + d.width / 2, y: d.y + d.height * 0.35};
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x - 120, box.y, {steps: 10});
  await wait(page, 120);
  await page.screenshot({path: path.join(IMPL, '06-stack-durante-el-arrastre.png')});
  await page.mouse.up();
  await page.waitForFunction(
    () => window.RestaurantMemoriesEngine.state().stack?.state === 'IDLE',
    null, {timeout: 6000}).catch(() => {});
  await wait(page, 600);
  report.implementation.stack = await page.evaluate(() =>
    window.RestaurantMemoriesEngine.state().stack);
}
await page.evaluate(() => window.RestaurantMemoriesEngine.stack()?.goTo(0));
await wait(page, 1200);
await page.evaluate(id => {
  const dots = document.querySelectorAll(`[data-mem-viewer="${id}"] [data-mem-dot]`);
  dots[1]?.click();
}, HERO);
await wait(page, 800);
await page.screenshot({path: path.join(IMPL, '07-stack-foco-media-multiple.png')});

/* 08·09 · Editorial Journal */
await setPreset(page, 'editorial-journal');
await frameAt(page, 0.08);
await page.screenshot({path: path.join(IMPL, '08-journal-general.png')});
await frameAt(page, 0.3);
await page.screenshot({path: path.join(IMPL, '09-journal-spread-multimedia.png')});

/* 10·11 · los artefactos materiales */
await frameOn(page, '[data-mem-artifact="paper"]');
await page.screenshot({path: path.join(IMPL, '10-paper-artifact.png')});
await frameOn(page, '[data-mem-artifact="cloth"]');
await page.screenshot({path: path.join(IMPL, '11-heritage-cloth.png')});

/* 12 · Story Gallery con filmstrip y vídeo reproduciéndose */
await setPreset(page, 'cinematic-memory-wall');
await frameAt(page, 0.1);
await page.evaluate(id => window.RestaurantMemoriesEngine.openStory(id), HERO);
await page.waitForSelector('[data-mem-story]', {timeout: 8000});
await wait(page, 600);
report.implementation.storyVideo = await page.evaluate(async () => {
  const layer = document.querySelector('[data-mem-story]');
  const videoThumb = [...layer.querySelectorAll('[data-mem-thumb]')]
    .find(t => t.dataset.kind === 'video');
  videoThumb.click();
  await new Promise(r => setTimeout(r, 500));
  const slot = layer.querySelector('.mem-slot[data-active="1"]');
  const v = slot.querySelector('video');
  try { v.currentTime = 0; } catch {}
  slot.querySelector('[data-mem-play]').click();
  await new Promise(r => setTimeout(r, 1100));
  return {reproduciendo: !v.paused, segundo: Number(v.currentTime.toFixed(2))};
});
await page.screenshot({path: path.join(IMPL, '12-story-gallery-video.png')});
await page.keyboard.press('Escape');
await wait(page, 600);

/* 13 · OFF */
const heightOn = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', false));
await wait(page, 1000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.74));
await wait(page, 700);
await page.screenshot({path: path.join(IMPL, '13-memories-off.png')});
report.implementation.off = await page.evaluate(hOn => ({
  seccion: document.querySelectorAll('#memories').length,
  canvas: document.querySelectorAll('.mem-artifact-canvas').length,
  videos: window.RestaurantMemoriesVideo.state().registered,
  altoAntes: hOn, altoDespues: document.body.scrollHeight
}), heightOn);

/* 14 · recarga con la misma data */
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
await wait(page, 900);
const before = await page.evaluate(() =>
  JSON.stringify(window.RestaurantStudioConfig.get('modules.memories')));
await page.reload({waitUntil: 'domcontentloaded'});
await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
await wait(page, 2000);
await frameAt(page, 0.34);
await page.screenshot({path: path.join(IMPL, '14-tras-recargar.png')});
report.implementation.reload = await page.evaluate(prev => ({
  igual: JSON.stringify(window.RestaurantStudioConfig.get('modules.memories')) === prev,
  medias: Number(document.querySelector('#memories')?.dataset.mediaTotal || 0),
  imagenes: document.querySelectorAll('#memories img.mem-media-image').length,
  videos: document.querySelectorAll('#memories video[data-mem-video]').length
}), before);
report.implementation.errores = errors;
await context.close();

/* 15 · responsive público a 390 px */
{
  const mobile = await browser.newContext({viewport: {width: 390, height: 844},
    isMobile: true, hasTouch: true});
  const m = await mobile.newPage();
  await boot(m);
  await m.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
  await seedItems(m);
  await wait(m, 600);
  await seedMedia(m, FILES);
  await wait(m, 1800);
  await m.evaluate(() => {
    const s = document.querySelector('#memories');
    window.scrollTo(0, s.offsetTop + s.offsetHeight * 0.12);
  });
  await wait(m, 1200);
  await m.screenshot({path: path.join(IMPL, '15-responsive-390.png')});
  report.implementation.movil = await m.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    recuerdos: document.querySelectorAll('[data-mem-item]').length
  }));
  await mobile.close();
}

/* ============================================================
   §45 · VÍDEO DE PRODUCTO — una sola sesión, sin montaje
   ============================================================ */
{
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900},
    recordVideo: {dir: VIDEO_DIR, size: {width: 1440, height: 900}}});
  const v = await ctx.newPage();
  await boot(v);

  /* Studio → Memories ON → un recuerdo nuevo → foto → vídeo → copy */
  await openPanel(v);
  await wait(v, 900);
  await v.evaluate(() => document.querySelector('[data-mem-path="modules.memories.enabled"]').click());
  await wait(v, 900);
  await v.evaluate(() => document.querySelector('[data-mem-add]').click());
  await wait(v, 800);
  await v.fill('[data-mem-path="modules.memories.items.0.title"]', 'La primera noche');
  await wait(v, 600);
  await v.fill('[data-mem-path="modules.memories.items.0.text"]', MEMORIES[0].text);
  await wait(v, 700);
  const newId = await v.evaluate(() =>
    window.RestaurantStudioConfig.get('modules.memories.items')[0].id);
  await v.setInputFiles(`[data-mem-upload="${newId}:image"]`, IMAGE);
  await wait(v, 1500);
  await v.setInputFiles(`[data-mem-upload="${newId}:video"]`, FILES.videos[0]);
  await wait(v, 1700);
  await v.setInputFiles(`[data-mem-upload="${newId}:image"]`, imageFile(3));
  await wait(v, 1500);
  await v.evaluate(() => document.querySelector('.mem-media-box')?.scrollIntoView({block: 'center'}));
  await wait(v, 1400);

  /* el resto del archivo, con sus tratamientos */
  await seedItems(v);
  await wait(v, 700);
  await seedMedia(v, FILES);
  await wait(v, 1600);
  /* los ids se generan al sembrar: el del contexto anterior no existe en esta sesión */
  const vHero = await v.evaluate(() =>
    window.RestaurantStudioConfig.get('modules.memories.items')[0].id);

  /* Wall → movimiento */
  await closeStudio(v);
  await setPreset(v, 'cinematic-memory-wall');
  await frameAt(v, 0.05);
  await v.evaluate(() => window.scrollBy(0, 420));
  await wait(v, 1600);
  /* Play de un vídeo en la pared, en directo */
  await v.evaluate(async id => {
    const viewer = document.querySelector(`[data-mem-viewer="${id}"]`);
    if (!viewer) return;
    viewer.scrollIntoView({block: 'center'});
    await new Promise(r => setTimeout(r, 700));
    const t = [...viewer.querySelectorAll('[data-mem-thumb]')].find(x => x.dataset.kind === 'video');
    t?.click();
    await new Promise(r => setTimeout(r, 600));
    const slot = viewer.querySelector('.mem-slot[data-active="1"]');
    try { slot.querySelector('video').currentTime = 0; } catch {}
    slot.querySelector('[data-mem-play]')?.click();
  }, vHero);
  await wait(v, 2600);

  /* Stack → arrastre y lanzamiento */
  await setPreset(v, 'memory-stack');
  await frameAt(v, 0.2);
  {
    const box = await v.evaluate(() => {
      const d = document.querySelector('[data-mem-deck]').getBoundingClientRect();
      return {x: d.x + d.width / 2, y: d.y + d.height * 0.35};
    });
    await v.mouse.move(box.x, box.y);
    await v.mouse.down();
    await v.mouse.move(box.x - 180, box.y, {steps: 22});
    await v.mouse.up();
    await wait(v, 1500);
    await v.mouse.move(box.x, box.y);
    await v.mouse.down();
    await v.mouse.move(box.x + 200, box.y, {steps: 24});
    await v.mouse.up();
    await wait(v, 1500);
  }
  /* la media de la tarjeta en foco */
  await v.evaluate(id => {
    const dots = document.querySelectorAll(`[data-mem-viewer="${id}"] [data-mem-dot]`);
    dots[2]?.click();
  }, vHero);
  await wait(v, 1400);

  /* Journal → Paper → Cloth */
  await setPreset(v, 'editorial-journal');
  await frameAt(v, 0.06);
  await wait(v, 1200);
  await frameOn(v, '[data-mem-artifact="paper"]');
  await wait(v, 1800);
  await frameOn(v, '[data-mem-artifact="cloth"]');
  await wait(v, 2200);

  /* Story → vídeo reproduciéndose → cerrar */
  await setPreset(v, 'cinematic-memory-wall');
  await frameAt(v, 0.1);
  await v.evaluate(id => window.RestaurantMemoriesEngine.openStory(id), vHero);
  await v.waitForSelector('[data-mem-story]', {timeout: 8000});
  await wait(v, 900);
  await v.evaluate(async () => {
    const layer = document.querySelector('[data-mem-story]');
    const t = [...layer.querySelectorAll('[data-mem-thumb]')].find(x => x.dataset.kind === 'video');
    t.click();
    await new Promise(r => setTimeout(r, 600));
    const slot = layer.querySelector('.mem-slot[data-active="1"]');
    try { slot.querySelector('video').currentTime = 0; } catch {}
    slot.querySelector('[data-mem-play]').click();
  });
  await wait(v, 3000);
  await v.keyboard.press('Escape');
  await wait(v, 900);

  /* vuelta al Studio y recarga: sigue todo ahí */
  await openPanel(v);
  await wait(v, 1300);
  await v.reload({waitUntil: 'domcontentloaded'});
  await v.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(v, 1600);
  await frameAt(v, 0.3);
  await wait(v, 1800);

  const clip = v.video();
  await ctx.close();
  const dest = path.join(VIDEO_DIR, 'class23-memories-recovery.webm');
  fs.rmSync(dest, {force: true});
  fs.renameSync(await clip.path(), dest);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  report.video = {file: path.relative(ROOT, dest), kb};
  console.log(`\nvídeo -> ${report.video.file} (${kb}KB)`);
}

fs.writeFileSync(path.join(OUT, 'recovery-log.json'), JSON.stringify(report, null, 2));
await browser.close();
local?.server?.close();

console.log(`\nreferencias: ${Object.entries(report.references).map(([k]) => k).join(', ') || 'omitidas'}`);
console.log(`picker: ${report.implementation.picker?.archivos} archivos (${report.implementation.picker?.kinds?.join(', ')})`);
console.log(`stack tras el lanzamiento: objetivo ${report.implementation.stack?.target} · ${report.implementation.stack?.state}`);
console.log(`vídeo del story: reproduciendo ${report.implementation.storyVideo?.reproduciendo} en ${report.implementation.storyVideo?.segundo}s`);
console.log(`OFF: ${report.implementation.off?.seccion} secciones · ${report.implementation.off?.canvas} canvas · alto ${report.implementation.off?.altoAntes} → ${report.implementation.off?.altoDespues}`);
console.log(`recarga: mismo estado ${report.implementation.reload?.igual} · ${report.implementation.reload?.medias} medias`);
console.log(`móvil: overflow ${report.implementation.movil?.overflow}`);
console.log(`errores: ${report.implementation.errores?.length ? report.implementation.errores.slice(0, 2).join(' | ') : 'ninguno'}`);
console.log(`\nevidencia -> output/playwright/class23-recovery/`);
