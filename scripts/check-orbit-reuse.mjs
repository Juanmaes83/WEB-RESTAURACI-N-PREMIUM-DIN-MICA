/* PROJECT 03 — the reuse contract, checked on the source itself.

   The end-to-end suite proves the preset BEHAVES like presentation over one engine.
   This proves it is not QUIETLY becoming a second engine: no orbit progress of its
   own, no active index of its own, no gesture handling of its own, and the products
   still rendered through the engine's delegation hook.

   It lives in a file rather than inline in the workflow because the tokens it looks
   for contain quotes, and escaping those through YAML into node -e is how a guard
   ends up testing its own syntax instead of the code.

   Usage: node scripts/check-orbit-reuse.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const fail=m=>{console.error(`ORBIT_REUSE_FAIL: ${m}`);process.exit(1)};

/* 1. the adapter has to exist, and expose rather than copy */
const app=read('app-v4.js');
if(!/window\.RestaurantOrbit\s*=/.test(app))fail('the orbit adapter is gone from app-v4.js');
for(const member of ['getProgress','getActiveIndex','nearestIndex','setDishRenderer',
  'subscribeProgress','subscribeActive','continuousDistance']){
  if(!app.includes(member))fail(`the adapter no longer exposes ${member}`);
}

/* 2. the preset must render through the engine and own no state */
const preset=read('class10-orbital-food.js');
if(!preset.includes('setDishRenderer'))fail('Project 03 is not rendering through the engine');
if(!preset.includes('subscribeProgress'))fail('Project 03 is not driven by the engine progress');

/* Strip comments first: these words are exactly the ones the file talks ABOUT, so
   matching them inside prose would make the guard fire on its own documentation. */
const code=preset.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
const banned=[
  ['orbitProgress','its own orbit progress'],
  ['let active','its own active index'],
  ['setupOrbitInteraction','its own interaction setup'],
  ['pointerdown','its own gesture engine'],
  ['pointermove','its own gesture engine'],
  ['setPointerCapture','its own gesture engine'],
  ['RestaurantClass6Detail','a detail path of its own']
];
for(const [token,what] of banned){
  if(code.includes(token))fail(`Project 03 is growing ${what} (found "${token}")`);
}

/* 3. the products must stay the engine's own DOM */
if(/createElement\(['"]button['"]\)/.test(code))fail('Project 03 is building its own dish elements');
if(!code.includes('#orbit-stage .orbit-dish'))fail('Project 03 is not composing the engine\'s dishes');

console.log('reuse contract: presentation only — state, gestures and the detail stay in the base engine');
