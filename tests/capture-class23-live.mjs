/* Evidencia visual de la FASE 2 — CLASS 23 MEMORIES.

   Compacta y útil: ocho capturas de desktop, un smoke responsive y un vídeo corto del
   recorrido completo. Los recuerdos son fixtures explícitos y la media es real, subida
   por el panel a la Media Library compartida.

     01 Memories Studio — lista + editor
     02 upload / Media Library — imagen y vídeo
     03 Cinematic Memory Wall
     04 Memory Stack
     05 Editorial Journal
     06 el recuerdo ampliado
     07 OFF — la sección desaparece
     08 tras recargar — el mismo contenido

   Uso: node tests/capture-class23-live.mjs [url]
   Salida: output/playwright/class23/live/ y .../video/
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {MEMORIES, imageFile, videoFile, seedItems} from './memories-fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output', 'playwright', 'class23', 'live');
const VIDEO_DIR = path.join(ROOT, 'output', 'playwright', 'class23', 'video');
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(VIDEO_DIR, {recursive: true});

const target = process.argv[2];
const local = target ? null : await startServer(0);
const BASE = (target || local.url).replace(/\/$/, '');
const browser = await chromium.launch();
const VIDEO = await videoFile(browser);
const IMAGE = imageFile();
const report = {url: BASE};

const wait = (p, ms) => p.waitForTimeout(ms);

async function boot(page) {
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded', timeout: 45000});
  await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(page, 700);
}
async function openPanel(page) {
  await page.evaluate(() => {
    if (!document.querySelector('#studio.is-open')) document.querySelector('.studio-open')?.click();
  });
  await wait(page, 700);
  await page.evaluate(() => document.querySelector('.studio-nav [data-panel="memories"]')?.click());
  await page.waitForSelector('.mem-panel', {timeout: 10000});
  await wait(page, 400);
}
const openCard = async (page, i = 0) => {
  await page.evaluate(n => {
    const card = document.querySelectorAll('[data-mem-card]')[n];
    if (card) card.open = true;
  }, i);
  await wait(page, 300);
};
const setPreset = async (page, value) => {
  await page.evaluate(v => window.RestaurantStudioConfig.set('modules.memories.preset', v), value);
  await wait(page, 1100);
};
const showSection = async page => {
  await page.evaluate(() => window.RestaurantStudioShell?.close?.());
  await wait(page, 500);
  await page.evaluate(() => document.querySelector('#memories')?.scrollIntoView({block: 'start'}));
  await wait(page, 800);
};

/* sube media real por el panel: es el camino del restaurante, no un atajo */
async function uploadTo(page, index, kind, file) {
  await openCard(page, index);
  const id = await page.evaluate(i =>
    window.RestaurantStudioConfig.get('modules.memories.items')[i].id, index);
  await page.setInputFiles(`[data-mem-upload="${id}:${kind}"]`, file);
  await wait(page, 1300);
  return id;
}

const context = await browser.newContext({viewport: {width: 1440, height: 960}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await boot(page);
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
await seedItems(page);
await wait(page, 900);

/* 01 — el panel: lista y editor */
await openPanel(page);
await page.screenshot({path: path.join(OUT, '01-studio-lista.png')});
await openCard(page, 0);
await page.evaluate(() => document.querySelector('[data-mem-card] .mem-media-box')
  ?.scrollIntoView({block: 'center'}));
await wait(page, 400);
await page.screenshot({path: path.join(OUT, '01b-studio-editor.png')});

/* 02 — subida real de imagen y de vídeo, y el picker compartido */
await uploadTo(page, 0, 'image', IMAGE);
await uploadTo(page, 1, 'image', IMAGE);
await uploadTo(page, 2, 'video', VIDEO);
await page.evaluate(() => document.querySelector('.mem-media-box')?.scrollIntoView({block: 'center'}));
await wait(page, 500);
await page.screenshot({path: path.join(OUT, '02-media-subida.png')});
const pickId = await page.evaluate(() =>
  window.RestaurantStudioConfig.get('modules.memories.items')[3].id);
await openCard(page, 3);
await page.evaluate(id => document.querySelector(`[data-mem-pick="${id}"]`)?.click(), pickId);
await page.waitForSelector('[data-media-picker="open"]', {timeout: 8000});
await wait(page, 600);
await page.screenshot({path: path.join(OUT, '02b-media-library.png')});
report.picker = await page.evaluate(() => ({
  archivos: document.querySelectorAll('[data-media-picker-ref]').length,
  kinds: [...new Set([...document.querySelectorAll('[data-media-picker-ref]')].map(n => n.dataset.kind))]
}));
await page.evaluate(() => document.querySelector('[data-media-picker-ref]')?.click());
await wait(page, 700);

/* 03·04·05 — el mismo dato, tres presentaciones */
for (const [preset, file] of [['cinematic-memory-wall', '03-cinematic-memory-wall'],
  ['memory-stack', '04-memory-stack'], ['editorial-journal', '05-editorial-journal']]) {
  await setPreset(page, preset);
  await showSection(page);
  await page.screenshot({path: path.join(OUT, `${file}.png`)});
  report[preset] = await page.evaluate(() => ({
    recuerdos: Number(document.querySelector('#memories')?.dataset.count || 0),
    imagenes: document.querySelectorAll('#memories img.mem-media-image').length,
    videos: document.querySelectorAll('#memories video[data-mem-video]').length
  }));
}

/* 06 — el recuerdo ampliado */
await setPreset(page, 'cinematic-memory-wall');
await showSection(page);
await page.evaluate(() => document.querySelector('[data-mem-open]')?.click());
await page.waitForSelector('[data-mem-story]', {timeout: 8000});
await wait(page, 700);
await page.screenshot({path: path.join(OUT, '06-recuerdo-ampliado.png')});
await page.keyboard.press('Escape');
await wait(page, 600);

/* 07 — OFF: la sección desaparece */
const beforeOff = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', false));
await wait(page, 900);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.72));
await wait(page, 600);
await page.screenshot({path: path.join(OUT, '07-off.png')});
report.off = await page.evaluate(() => ({
  seccion: document.querySelectorAll('#memories').length,
  videos: document.querySelectorAll('video[data-mem-video]').length,
  alto: document.body.scrollHeight
}));
report.off.altoConMemories = beforeOff;

/* 08 — ON otra vez y recarga: el mismo contenido y la misma media */
await page.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
await wait(page, 900);
const before = await page.evaluate(() =>
  JSON.stringify(window.RestaurantStudioConfig.get('modules.memories')));
await page.reload({waitUntil: 'domcontentloaded'});
await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
await wait(page, 1600);
await showSection(page);
await page.screenshot({path: path.join(OUT, '08-tras-recargar.png')});
report.reload = await page.evaluate(prev => ({
  igual: JSON.stringify(window.RestaurantStudioConfig.get('modules.memories')) === prev,
  imagenes: document.querySelectorAll('#memories img.mem-media-image').length,
  videos: document.querySelectorAll('#memories video[data-mem-video]').length
}), before);

report.errores = errors;
await context.close();

/* smoke responsive */
{
  const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  const m = await mobile.newPage();
  await boot(m);
  await m.evaluate(() => window.RestaurantStudioConfig.set('modules.memories.enabled', true));
  await seedItems(m);
  await wait(m, 1000);
  await m.evaluate(() => document.querySelector('#memories')?.scrollIntoView({block: 'start'}));
  await wait(m, 700);
  await m.screenshot({path: path.join(OUT, '09-movil.png')});
  report.movil = await m.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    recuerdos: document.querySelectorAll('[data-mem-item]').length
  }));
  await mobile.close();
}

/* vídeo del recorrido completo */
{
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900},
    recordVideo: {dir: VIDEO_DIR, size: {width: 1440, height: 900}}});
  const v = await ctx.newPage();
  await boot(v);
  await openPanel(v);
  await wait(v, 900);
  /* Memories ON, un recuerdo nuevo, media, copy */
  await v.evaluate(() => document.querySelector('[data-mem-path="modules.memories.enabled"]').click());
  await wait(v, 900);
  await v.evaluate(() => document.querySelector('[data-mem-add]').click());
  await wait(v, 800);
  await v.fill('[data-mem-path="modules.memories.items.0.title"]', 'La primera noche');
  await wait(v, 700);
  await v.fill('[data-mem-path="modules.memories.items.0.text"]', MEMORIES[0].text);
  await wait(v, 900);
  await uploadTo(v, 0, 'image', IMAGE);
  await wait(v, 900);
  await seedItems(v);
  await wait(v, 900);
  await uploadTo(v, 2, 'video', VIDEO);
  await wait(v, 900);
  for (const preset of ['cinematic-memory-wall', 'memory-stack', 'editorial-journal']) {
    await setPreset(v, preset);
    await showSection(v);
    await wait(v, 1900);
  }
  /* vuelta al Studio y recarga: el contenido sigue ahí */
  await openPanel(v);
  await wait(v, 1200);
  await v.reload({waitUntil: 'domcontentloaded'});
  await v.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 30000});
  await wait(v, 1500);
  await v.evaluate(() => document.querySelector('#memories')?.scrollIntoView({block: 'start'}));
  await wait(v, 2000);
  const clip = v.video();
  await ctx.close();
  const dest = path.join(VIDEO_DIR, 'class23-memories.webm');
  fs.rmSync(dest, {force: true});
  fs.renameSync(await clip.path(), dest);
  console.log(`vídeo -> ${path.relative(ROOT, dest)} (${Math.round(fs.statSync(dest).size / 1024)}KB)`);
}

fs.writeFileSync(path.join(OUT, 'live-log.json'), JSON.stringify(report, null, 2));
await browser.close();
local?.server?.close();

console.log(`\npicker: ${report.picker.archivos} archivos (${report.picker.kinds.join(', ')})`);
for (const p of ['cinematic-memory-wall', 'memory-stack', 'editorial-journal'])
  console.log(`${p.padEnd(24)} ${report[p].recuerdos} recuerdos · ${report[p].imagenes} imágenes · ${report[p].videos} vídeos`);
console.log(`OFF: ${report.off.seccion} secciones, ${report.off.videos} vídeos · alto ${report.off.altoConMemories} → ${report.off.alto}`);
console.log(`recarga: mismo estado ${report.reload.igual} · ${report.reload.imagenes} imágenes · ${report.reload.videos} vídeos`);
console.log(`móvil: overflow ${report.movil.overflow} · ${report.movil.recuerdos} recuerdos`);
console.log(`errores: ${errors.length ? errors.slice(0, 2).join(' | ') : 'ninguno'}`);
console.log(`\nevidencia -> output/playwright/class23/live/`);
