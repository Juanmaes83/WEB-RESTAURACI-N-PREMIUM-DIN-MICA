/* PROJECT 09 — the transversal contract.

   The E2E suite proves behaviour in a browser. This proves the things behaviour
   cannot show: that the traveler is ADDITIVE, that it owns exactly one authoritative
   value, that its route and its object are data rather than code, and that none of
   the nine approved motors lost their loader on the way in.

   Usage: node scripts/check-scroll-traveler.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const fail=m=>{console.error(`SCROLL_TRAVELER_CONTRACT_FAIL: ${m}`);process.exit(1)};
/* the engine's comments name the anti-patterns they promise to avoid, so every scan
   here reads the code and not the prose */
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');

const engine=read('class14-scroll-traveler.js');
const code=strip(engine);
const styles=read('styles-v14.css');

/* ---- 1. ONE canonical value ---- */
if(!/function progressAt\(y\)/.test(code))
  fail('the journey value is no longer derived from a scroll position');
if(!/progress=progressAt\(scrollY\)/.test(code))
  fail('scroll is no longer the writer of the journey value');
for(const banned of ['currentSection','currentTravelerPosition','activeJourneyStep',
  'selectedJourneyIndex','journeyIndex','activeChapterIndex']){
  if(code.includes(banned))fail(`a second authoritative state appeared: ${banned}`);
}
/* the chapter and the layer must be READ from the progress, never stored beside it */
if(!/chapter:t<\.5\?a\.chapter:b\.chapter/.test(code)
  ||!/layer:t<\.5\?a\.layer:b\.layer/.test(code))
  fail('chapter and layer are no longer derived inside stateAt(progress)');

/* ---- 2. the route and the object are DATA ---- */
if(!/window\.RestaurantStudioConfig\?\.get\?\.\(NS\)/.test(code))
  fail('the engine no longer reads the live config');
const identity=[
  /===\s*['"`](?:gamba|red-prawn|dish-\d+|chef|signature|origin|atmosphere|visit)['"`]/i,
  /(?:dishId|chapter|anchor)\s*[!=]==/,
  /\.(?:chapter|dishId)\s*===/];
for(const re of identity){
  if(re.test(code))fail(`the renderer takes a decision from an identity: ${re}`);
}
/* coordinates belong in the config, not in the engine */
const inlineStops=code.match(/anchor:\s*['"`]#/g)||[];
if(inlineStops.length)fail(`${inlineStops.length} route stops are hardcoded in the engine`);

const cfg=read('class4-config.js');
if(!/scrollTraveler=\{/.test(cfg))fail('scrollTraveler is missing from the config');
const block=cfg.slice(cfg.indexOf('scrollTraveler={'));
for(const key of ['route:[','routeMobile:[','source:{','intensity:','enabled:']){
  if(!block.includes(key))fail(`the traveler contract is missing ${key}`);
}
const stops=(block.match(/chapter:'/g)||[]).length;
if(stops<10)fail(`expected a desktop and a mobile route, found ${stops} stops in total`);

/* the demonstration object must exist, and must be the cleaned runtime cut */
const manifest=JSON.parse(read('assets/scroll-traveler/traveler-manifest.json'));
for(const t of manifest.travelers){
  if(!fs.existsSync(path.join(ROOT,t.source)))fail(`missing source master: ${t.source}`);
  if(!fs.existsSync(path.join(ROOT,t.runtimeAsset)))fail(`missing runtime object: ${t.runtimeAsset}`);
  if(!block.includes(t.runtimeAsset))fail(`the config does not point at ${t.runtimeAsset}`);
}
/* one product record: the traveler REFERENCES dish-01, it does not copy it */
const sourceBlock=block.slice(block.indexOf('source:{'),block.indexOf('route:['));
if(!/dishId:'dish-01'/.test(sourceBlock))
  fail('the traveler no longer references the canonical dish record');
if(/name:|priceLabel:|description:/.test(sourceBlock))
  fail('the traveler source is duplicating product content instead of referencing it');

/* ---- 3. scroll drives the animation, never the other way round ---- */
if(/preventDefault/.test(code))fail('the engine calls preventDefault');
if(/['"]wheel['"]/.test(code))fail('the engine listens for the wheel');
if(/scroll-snap|scrollIntoView|scrollBy\(/.test(code))
  fail('the engine moves the page instead of reading it');
const listeners=(code.match(/addEventListener\('(?:scroll|resize)'/g)||[]).length;
const passive=(code.match(/\{passive:true\}/g)||[]).length;
if(!listeners||listeners!==passive)
  fail(`${listeners} scroll/resize listeners but ${passive} marked passive`);
/* scrollToProgress exists for tests and evidence; it must be the only scroller */
if((code.match(/scrollTo\(/g)||[]).length>1)
  fail('more than one place in the engine scrolls the page');

/* ---- 4. one object, transform and opacity only ---- */
const created=(code.match(/createElement\('div'\)/g)||[]).length;
if(created>2)fail(`the engine creates ${created} divs — one layer and one shadow is the budget`);
if(/cloneNode|appendChild\(img\.cloneNode/.test(code))fail('the engine clones the object');
if(/getContext|WebGL|new Image\(\)[\s\S]{0,80}drawImage/.test(code))
  fail('the traveler is drawing on a canvas');
if(!/transform:translate3d\(var\(--st-x/.test(styles))
  fail('the object is no longer placed by one transform');
if(/contain:[^;]*paint/.test(styles))
  fail('paint containment is back — it clips the object shadow and rasterises its box');
if(!/pointer-events:none/.test(styles))fail('the traveler layer can swallow clicks');
if(!/@media\(max-width:820px\)/.test(styles))fail('the mobile sizing block is gone');
if(!/prefers-reduced-motion/.test(styles))fail('the reduced-motion block is gone');

/* ---- 5. no second settings or storage system ---- */
if(/localStorage|sessionStorage|indexedDB\.open/.test(code))
  fail('the traveler grew its own persistence');
if(!/RestaurantStudioConfig\?\.set\?\./.test(code))
  fail('the Studio card no longer writes through the existing project state');
if(!/RestaurantStore\?\.saveMedia\?\./.test(code))
  fail('uploads no longer go through the existing media store');

/* ---- 6. ADDITIVE: index.html untouched, every motor still loaded ---- */
const html=read('index.html');
if(!/class4-runtime-guard\.js/.test(html))fail('index.html lost the runtime guard');
if(/class14-scroll-traveler/.test(html))fail('index.html was edited to load the traveler');
if(/styles-v14\.css/.test(html))fail('index.html was edited to load the traveler stylesheet');
const guard=read('class4-runtime-guard.js');
const MOTORS=['class8-depth-carousel.js','class9-anchor-scenes.js','class10-orbital-food.js',
  'class11-pizza-slice-orbit.js','class12-pizza-premium.js','class14-scroll-traveler.js'];
for(const m of MOTORS){
  if(!guard.includes(`s.src='${m}'`))fail(`the runtime guard no longer loads ${m}`);
}
/* the presets a visitor can choose must still all be there */
const presets=['depth-carousel','anchor-scenes','orbital-food','pizza-slice-orbit'];
const options=presets.filter(p=>
  read('class8-depth-carousel.js').includes(p)||read('class9-anchor-scenes.js').includes(p)
  ||read('class10-orbital-food.js').includes(p)||read('class11-pizza-slice-orbit.js').includes(p));
if(options.length!==presets.length)
  fail(`a product preset lost its runtime: ${presets.filter(p=>!options.includes(p)).join(', ')}`);
/* and the traveler must NOT be one of them: it is page motion, transversal */
for(const f of ['class8-depth-carousel.js','class10-orbital-food.js','class11-pizza-slice-orbit.js']){
  if(/scrollTraveler/.test(read(f)))
    fail(`${f} was edited to know about the traveler — it must stay transversal`);
}
if(/motion-orbital-style/.test(code))
  fail('the traveler injects itself into product navigation instead of its own card');

console.log('traveler contract: one canonical progress with no rival state, route and object '
  +'are data with no identity conditionals, scroll only ever read, one layer on transform '
  +'and opacity, existing project state reused, index.html untouched and all six runtimes '
  +'still loaded additively');
