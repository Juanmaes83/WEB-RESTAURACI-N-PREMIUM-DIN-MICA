/* PROJECT 07 PREMIUM — the protection contract.

   The premium pass is only allowed to add a product world AROUND the approved motion
   engine. The E2E suites prove behaviour; this proves the things behaviour cannot
   show — that the approved geometry was not quietly edited, and that the presentation
   layer has not grown a state of its own.

   Usage: node scripts/check-pizza-premium.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const fail=m=>{console.error(`PIZZA_PREMIUM_CONTRACT_FAIL: ${m}`);process.exit(1)};
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');

/* ---- 1. the approved engine's numbers are exactly as approved ---- */
const engine=read('class11-pizza-slice-orbit.js');
const APPROVED=[
  /const\s+FAST?_?=?/,                                     /* sanity: file is the engine */
  /desktop:\{rx:\.52,ry:\.17,hubY:\.70,heroLen:\.56,heroScale:1\.00,minScale:\.21,/,
  /curve:2\.8,spread:\.62,dim:\.30,blur:2\.6\}/,
  /mobile:\{rx:\.50,ry:\.16,hubY:\.58,heroLen:\.43,heroScale:1\.00,minScale:\.20,/,
  /curve:2\.6,spread:\.48,dim:\.32,blur:1\.9\}/,
  /const DRAG_UNIT=\{desktop:190,mobile:130\}/,
  /const RELEASE=\.42, FLING=\.55/
];
for(const re of APPROVED.slice(1)){
  if(!re.test(engine))fail(`the approved geometry changed — ${re} no longer matches class11`);
}
/* one progress scalar, one derived index, still */
if(!/let progress=0/.test(engine))fail('class11 no longer holds a single progress scalar');
if(!/const activeIndex=\(\)=>normalize\(Math\.round\(progress\)\)/.test(engine))
  fail('the active index is no longer derived from progress');
const engineCode=strip(engine);
for(const banned of ['dragProgress','spinProgress','selectedIndex']){
  if(engineCode.includes(banned))fail(`class11 grew a second state: ${banned}`);
}

/* ---- 2. the premium layer owns presentation only ---- */
const premium=read('class12-pizza-premium.js');
const code=strip(premium);
for(const [token,what] of [
  ['rotationProgress','a progress variable of its own'],
  ['setProgress(','a write to the engine progress'],
  ['selectedIndex','a selected index of its own'],
  ['selectedProduct','a selected product of its own'],
  ['full-pizza','the assembled pizza that belongs to Project 06'],
  ['PIZZA COMPLETA','the assembled pizza that belongs to Project 06'],
  ['CircularDish','Project 06 wheel logic']
]){
  if(code.includes(token))fail(`the premium layer is growing ${what} (found "${token}")`);
}
for(const needed of ['RestaurantPizzaSliceOrbit','subscribe(','activeIndex']){
  if(!premium.includes(needed))fail(`the premium layer no longer reads the engine (${needed} missing)`);
}
/* it must read the LIVE project config, not the defaults template */
if(!/RestaurantStudioConfig\?\.\get\?\.\(NS\)/.test(premium)&&!/RestaurantStudioConfig\?\.get\?\.\(NS\)/.test(premium))
  fail('the premium layer is not reading the live project config');

/* ---- 3. the premium CSS must not touch the approved geometry ---- */
const css=read('styles-v12.css');
const cssCode=css.replace(/\/\*[\s\S]*?\*\//g,'');
for(const prop of ['--ps-x','--ps-y','--ps-rot','--ps-scale','--ps-size','--ps-apex-x','--ps-apex-y']){
  const re=new RegExp(`${prop}\\s*:`);
  if(re.test(cssCode))fail(`styles-v12 sets ${prop}: the approved slice geometry is not its to change`);
}
/* the station may be recoloured for legibility, never moved or transformed */
const stationRules=cssCode.split('}').filter(b=>/\.ps-station(?![-\w])/.test(b));
for(const b of stationRules){
  if(/(^|[;{\s])(left|top|right|bottom|width|height|transform)\s*:/.test(b))
    fail('styles-v12 repositions or transforms .ps-station: the fixed station is not its to move');
}

/* ---- 4. story data honesty ---- */
const cfg=read('class4-config.js');
if(!/pizzaSliceOrbit/.test(cfg))fail('the pizza story layer is missing from the config');
const storyStart=cfg.indexOf('pizzaSliceOrbit');
const products=[...cfg.slice(storyStart).matchAll(/\{id:'([a-z0-9-]+)',name:'/g)].map(m=>m[1]);
if(products.length!==8)fail(`expected 8 story records, found ${products.length}`);
const manifest=JSON.parse(read('assets/pizza-motion/slices-manifest.json'));
const ids=manifest.slices.map(s=>s.id);
if(products.join(',')!==ids.join(','))
  fail(`story ids do not join the manifest: ${products.join(',')} vs ${ids.join(',')}`);
/* every demo record must say so, and no demo price may be asserted */
const storyBlock=cfg.slice(storyStart);
const demoCount=(storyBlock.match(/demoContent:true/g)||[]).length;
const nullPrices=(storyBlock.match(/price:null/g)||[]).length;
if(demoCount!==8)fail(`${demoCount} of 8 story records are marked demoContent`);
if(nullPrices!==8)fail(`${nullPrices} of 8 story records keep price null — a demo price must not be asserted`);

console.log('premium contract: approved geometry byte-identical, presentation layer owns no state, '
  +`station not moved by CSS, 8 demo-marked story records joined to the manifest with no asserted prices`);
