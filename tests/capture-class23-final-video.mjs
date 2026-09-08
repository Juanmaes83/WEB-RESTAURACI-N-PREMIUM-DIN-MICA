/* CLASS 23 — el vídeo ÚNICO de evidencia (§21 del contrato de entrega final).

   Una sola sesión, sin montaje y sin fixtures inyectados por Playwright:

     REVIEW URL   → `goto` y nada más. Wall con scroll, multimedia, Play de un vídeo,
                    Stack con arrastre y lanzamiento reales, media de la tarjeta en foco,
                    Journal, Paper, Cloth y el story con su vídeo.
     PRODUCT URL  → Studio, Memories, gestión real de cuatro medias, y REEMPLAZAR una
                    para ver que la anterior deja de estar vinculada.

   Playwright actúa aquí como una persona: mueve el ratón, pulsa y sube ficheros. No
   escribe en el Project State ni siembra nada.

   Uso: node tests/capture-class23-final-video.mjs [baseUrl]
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
import {imageFile, videoFile} from './memories-fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output', 'playwright', 'class23-review', 'video');
fs.mkdirSync(OUT, {recursive: true});

const target = process.argv[2];
const local = target ? null : await startServer(0);
const BASE = (target || local.url).replace(/\/$/, '');
const browser = await chromium.launch();

/* El contrato pide UN vídeo de 30–45s sin montaje, así que no se puede recortar el
   fichero: hay que acortar la sesión real. `S` escala todas las pausas de lectura a la
   vez —incluidas las de dentro de los `evaluate`— para poder ajustar la duración total
   con un solo número sin cambiar el guion ni lo que se demuestra. */
const S = 0.56;
const ms = value => Math.round(value * S);
const wait = (p, value) => p.waitForTimeout(ms(value));

const ctx = await browser.newContext({viewport: {width: 1440, height: 900},
  recordVideo: {dir: OUT, size: {width: 1440, height: 900}}});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

/* ============================================================
   PARTE 1 · REVIEW URL — sin inyección
   ============================================================ */
await page.goto(`${BASE}/?review=memories`, {waitUntil: 'domcontentloaded', timeout: 45000});
await page.waitForFunction(() => document.documentElement.dataset.memories === 'ready',
  null, {timeout: 40000});
await wait(page, 1800);

const frameAt = async fraction => {
  await page.evaluate(f => {
    const s = document.querySelector('#memories');
    window.scrollTo({top: Math.max(0, s.offsetTop + (s.offsetHeight - innerHeight) * f),
      behavior: 'smooth'});
  }, fraction);
  await wait(page, 1300);
};
const setPreset = async preset => {
  await page.evaluate(p => document.querySelector(`[data-review-preset="${p}"]`)?.click(), preset);
  await wait(page, 1500);
};

/* Wall: entrada, scroll y multimedia */
await frameAt(0.04);
await wait(page, 900);
await frameAt(0.22);
await wait(page, 900);

/* un vídeo del Wall, con Play de verdad */
await page.evaluate(async t => {
  const viewer = [...document.querySelectorAll('[data-mem-viewer]')]
    .find(v => v.querySelector('[data-mem-thumb][data-kind=video]'));
  viewer.scrollIntoView({block: 'center', behavior: 'smooth'});
  await new Promise(r => setTimeout(r, t.scroll));
  viewer.querySelector('[data-mem-thumb][data-kind=video]').click();
  await new Promise(r => setTimeout(r, t.swap));
  const slot = viewer.querySelector('.mem-slot[data-active="1"]');
  try { slot.querySelector('video').currentTime = 0; } catch {}
  slot.querySelector('[data-mem-play]').click();
}, {scroll: ms(900), swap: ms(700)});
await wait(page, 2800);

/* Stack: arrastre y lanzamiento con el ratón */
await setPreset('memory-stack');
await frameAt(0.18);
{
  const deck = await page.evaluate(() => {
    const d = document.querySelector('[data-mem-deck]').getBoundingClientRect();
    return {x: Math.round(d.x + d.width / 2), y: Math.round(d.y + d.height * 0.35)};
  });
  /* arrastre lento, para que se vea que la tarjeta sigue el gesto */
  await page.mouse.move(deck.x, deck.y);
  await page.mouse.down();
  for (const dx of [30, 70, 110, 150, 175]) {
    await page.mouse.move(deck.x - dx, deck.y, {steps: 6});
    await wait(page, 90);
  }
  await page.mouse.up();
  await wait(page, 1500);
  /* y un lanzamiento rápido en el otro sentido */
  await page.mouse.move(deck.x, deck.y);
  await page.mouse.down();
  await page.mouse.move(deck.x + 240, deck.y, {steps: 8});
  await page.mouse.up();
  await wait(page, 1600);
}
/* la media de la tarjeta en foco */
await page.evaluate(async hold => {
  const focused = document.querySelector('.mem-card[data-focused="1"]');
  const dots = [...focused.querySelectorAll('[data-mem-dot]')];
  for (const dot of dots.slice(1)) { dot.click(); await new Promise(r => setTimeout(r, hold)); }
}, ms(700));
await wait(page, 900);

/* Journal, Paper y Cloth */
await setPreset('editorial-journal');
await frameAt(0.06);
await wait(page, 1100);
/* Estos dos NO se escalan. El scroll suave hasta el artefacto tarda lo que tarda, y en una
   pasada anterior la cámara llegaba mientras aún viajaba: se veía una banda en vez de la
   hoja. El material es justo lo que hay que juzgar aquí, así que se le da reposo fijo. */
for (const style of ['paper', 'cloth']) {
  await page.evaluate(s => document.querySelector(`[data-mem-artifact="${s}"]`)
    ?.closest('[data-mem-item]')?.scrollIntoView({block: 'center', behavior: 'smooth'}), style);
  await page.waitForTimeout(2600);
}

/* Story con su vídeo */
await setPreset('cinematic-memory-wall');
await frameAt(0.06);
await page.evaluate(async t => {
  document.querySelector('[data-mem-open]')?.click();
  await new Promise(r => setTimeout(r, t.open));
  const layer = document.querySelector('[data-mem-story]');
  const thumb = [...layer.querySelectorAll('[data-mem-thumb]')].find(x => x.dataset.kind === 'video');
  thumb.click();
  await new Promise(r => setTimeout(r, t.swap));
  const slot = layer.querySelector('.mem-slot[data-active="1"]');
  try { slot.querySelector('video').currentTime = 0; } catch {}
  slot.querySelector('[data-mem-play]').click();
}, {open: ms(800), swap: ms(600)});
await wait(page, 3000);
await page.keyboard.press('Escape');
await wait(page, 900);

/* ============================================================
   PARTE 2 · PRODUCT URL — el Studio real, y REEMPLAZAR
   ============================================================ */
await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded', timeout: 45000});
await page.waitForFunction(() => !!window.RestaurantMemoriesEngine, null, {timeout: 40000});
await wait(page, 1500);

await page.evaluate(() => document.querySelector('.studio-open')?.click());
await wait(page, 1100);
await page.evaluate(() => document.querySelector('.studio-nav [data-panel="memories"]').click());
await page.waitForSelector('.mem-panel', {timeout: 10000});
await wait(page, 1400);

await page.evaluate(() => document.querySelector('[data-mem-path="modules.memories.enabled"]').click());
await wait(page, 900);
await page.evaluate(() => document.querySelector('[data-mem-add]').click());
await wait(page, 800);
const id = await page.evaluate(() =>
  window.RestaurantStudioConfig.get('modules.memories.items')[0].id);
await page.evaluate(() => { document.querySelectorAll('[data-mem-card]')[0].open = true; });
await wait(page, 400);
await page.fill('[data-mem-path="modules.memories.items.0.title"]', 'Una noche cualquiera');
await wait(page, 700);

/* cuatro medias, subidas como lo haría una persona */
const clip = await videoFile(browser, 1, 'demo.webm');
await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(0, 'foto-01.webp'));
await wait(page, 1500);
await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(2, 'foto-02.webp'));
await wait(page, 1500);
await page.setInputFiles(`[data-mem-upload="${id}:video"]`, clip);
await wait(page, 1700);
await page.setInputFiles(`[data-mem-upload="${id}:image"]`, imageFile(4, 'foto-03.webp'));
await wait(page, 1600);
await page.evaluate(() => document.querySelector('.mem-media-box')?.scrollIntoView({block: 'center'}));
await wait(page, 1600);

/* REEMPLAZAR la portada: la anterior deja de estar vinculada */
const before = await page.evaluate(() =>
  window.RestaurantStudioConfig.get('modules.memories.items')[0].media.map(m => m.ref));
await page.setInputFiles(`[data-mem-replace="${before[0]}"]`, imageFile(7, 'portada-nueva.webp'));
await wait(page, 2000);
const after = await page.evaluate(oldRef => {
  const item = window.RestaurantStudioConfig.get('modules.memories.items')[0];
  return {count: item.media.length, oldStillLinked: item.media.some(m => m.ref === oldRef),
    cover: item.media[0].ref.split('/').pop()};
}, before[0]);
await wait(page, 1200);

/* y la sección real, con lo que acaba de montar. Reposo fijo: este es el remate —el
   recuerdo recién construido, con la portada reemplazada, vivo en la página pública— y
   tiene que quedarse en pantalla, no cortarse al llegar. */
await page.evaluate(() => document.querySelector('[data-mem-preview]').click());
await page.waitForTimeout(2800);

const video = page.video();
await ctx.close();
const dest = path.join(OUT, 'class23-memories-final.webm');
fs.rmSync(dest, {force: true});
fs.renameSync(await video.path(), dest);
const kb = Math.round(fs.statSync(dest).size / 1024);

await browser.close();
local?.server?.close();

console.log(`vídeo -> ${path.relative(ROOT, dest)} (${kb}KB)`);
console.log(`reemplazo: ${after.count} medias · antigua vinculada ${after.oldStillLinked}`
  + ` · portada ${after.cover}`);
console.log(`errores: ${errors.length ? errors.slice(0, 2).join(' | ') : 'ninguno'}`);
