/* PROJECT 07 — the contract, checked on the source and the manifest.

   The E2E suite proves the preset BEHAVES correctly. This proves the things a
   behavioural test cannot see: that the user's master files were never touched, that
   the assembled pizza is not wired in as a product, and that the preset has not
   quietly grown a second progress, a second index or its own dish model.

   It lives in a file rather than inline in the workflow because the tokens it looks
   for contain quotes, and escaping those through YAML into node -e is how a guard
   ends up testing its own syntax instead of the code.

   Usage: node scripts/check-pizza-slices.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const fail=m=>{console.error(`PIZZA_SLICE_CONTRACT_FAIL: ${m}`);process.exit(1)};

const M=JSON.parse(read('assets/pizza-motion/slices-manifest.json'));

/* 1. eight real slices, and the masters exactly as the user uploaded them */
if(M.slices.length!==8)fail(`expected 8 slices, manifest has ${M.slices.length}`);
for(const s of M.slices){
  const src=path.join(ROOT,s.source);
  if(!fs.existsSync(src))fail(`missing master: ${s.source}`);
  if(fs.statSync(src).size!==s.sourceBytes)
    fail(`master modified: ${s.source} is ${fs.statSync(src).size}B, expected ${s.sourceBytes}B`);
  const rt=path.join(ROOT,s.runtimeAsset);
  if(!fs.existsSync(rt))fail(`missing runtime asset: ${s.runtimeAsset}`);
  if(!s.registration||!Number.isFinite(s.registration.scale)||!Number.isFinite(s.registration.rotationBias))
    fail(`no registration for ${s.id}`);
}
const fp=path.join(ROOT,M.fullPizzaReference);
if(!fs.existsSync(fp)||fs.statSync(fp).size!==M.fullPizzaBytes)
  fail('the complete pizza master is missing or modified');

/* 2. the set actually fits one station */
if(!M.verdict.registered||!M.verdict.fitsStation)
  fail(`the set does not register: ${JSON.stringify(M.verdict)}`);

/* 3. Project 06's assembled pizza must not be a Project 07 product */
const preset=read('class11-pizza-slice-orbit.js');
const code=preset.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
if(/full-pizza|PIZZA COMPLETA/i.test(code))
  fail('the complete pizza is referenced by the Project 07 renderer');

/* 4. one progress, one index, one interaction path, no dish model of its own */
for(const [token,what] of [
  ['dragProgress','a separate drag progress'],
  ['spinProgress','a separate spin progress'],
  ['stepProgress','a separate step progress'],
  ['selectedIndex','a selected index of its own'],
  ['RestaurantDefaults','a dependency on the dish model'],
  ['RestaurantClass6Detail','a detail path of its own']
]){
  if(code.includes(token))fail(`the preset is growing ${what} (found "${token}")`);
}
for(const needed of ['rotationProgress','continuousDistance','setRng']){
  if(!preset.includes(needed))fail(`the preset no longer documents/uses ${needed}`);
}

/* 5. runtime must be materially lighter than source, and nothing stray */
const declared=new Set(M.slices.map(s=>path.basename(s.runtimeAsset)));
const stray=fs.readdirSync(path.join(ROOT,'assets','pizza-motion','runtime','slices'))
  .filter(f=>!declared.has(f));
if(stray.length)fail(`undeclared runtime assets: ${stray.join(', ')}`);
const runtimeKb=Math.round(M.slices.reduce((a,s)=>a+s.bytes,0)/1024);
const sourceKb=Math.round(M.slices.reduce((a,s)=>a+s.sourceBytes,0)/1024);
if(runtimeKb>=sourceKb)fail(`runtime (${runtimeKb}KB) is not lighter than source (${sourceKb}KB)`);

console.log(`pizza slice contract: 8 untouched masters (${sourceKb}KB) → 8 runtime assets `
  +`(${runtimeKb}KB), all registered, station margin ${M.verdict.tightestMarginDeg}°, `
  +`one progress scalar`);
