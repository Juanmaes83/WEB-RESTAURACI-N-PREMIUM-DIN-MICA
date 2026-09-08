/* CLASS 19 — the library contract.

   An index earns its place by being TRUE. The E2E suite proves it behaves in a browser;
   this proves the things behaviour cannot show: that the catalogue matches what the
   repository actually contains, that the library owns no engine and no second
   selection, and that it is additive.

   Usage: node scripts/check-motion-library.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const fail=m=>{console.error(`MOTION_LIBRARY_CONTRACT_FAIL: ${m}`);process.exit(1)};
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');

const lib=read('class19-motion-library.js');
const code=strip(lib);

/* ---- 1. eleven engines, and every one of them real ---- */
const entries=[...code.matchAll(/\{n:'(\d\d)',id:'([a-z0-9-]+)',kind:'(preset|page|experience)'/g)]
  .map(m=>({n:m[1],id:m[2],kind:m[3]}));
if(entries.length!==11)fail(`the catalogue lists ${entries.length} engines, not 11`);
const numbers=entries.map(e=>e.n).join(',');
if(numbers!=='01,02,03,04,05,06,07,08,09,10,11')fail(`engines are not numbered 01..11: ${numbers}`);
if(new Set(entries.map(e=>e.id)).size!==11)fail('two engines share an id');

const kinds=entries.reduce((a,e)=>({...a,[e.kind]:(a[e.kind]||0)+1}),{});
if(kinds.preset!==7||kinds.page!==1||kinds.experience!==3)
  fail(`expected 7 presets, 1 page motion and 3 experiences, got ${JSON.stringify(kinds)}`);

/* every preset must be a value some runtime really injects into the select */
const runtimes=['class8-depth-carousel.js','class9-anchor-scenes.js','class10-orbital-food.js',
  'class11-pizza-slice-orbit.js','class5-studio-motion.js','class7-editorial-flow.js'];
const runtimeSource=runtimes.filter(f=>fs.existsSync(path.join(ROOT,f))).map(read).join('\n');
for(const e of entries.filter(x=>x.kind==='preset')){
  const value=(code.match(new RegExp(`id:'${e.id}',kind:'preset',value:'([a-z-]+)'`))||[])[1];
  if(!value)fail(`preset ${e.id} declares no select value`);
  if(!runtimeSource.includes(`"${value}"`)&&!runtimeSource.includes(`'${value}'`))
    fail(`no runtime registers the preset value "${value}" — the library would list a dead engine`);
}
/* every experience must be a page that exists */
for(const e of entries.filter(x=>x.kind==='experience')){
  const href=(code.match(new RegExp(`id:'${e.id}',kind:'experience',\\s*href:'([^']+)'`))||[])[1];
  if(!href)fail(`experience ${e.id} declares no page`);
  if(!fs.existsSync(path.join(ROOT,href)))fail(`experience page missing: ${href}`);
}
/* the transversal one must point at a real config flag */
if(!/path:'scrollTraveler\.enabled'/.test(code))
  fail('the page-motion engine no longer toggles the real project-state flag');

/* ---- 2. the modules are listed and are NOT engines ----

   The invariant is not a module COUNT. Modules arrive and leave with the business
   roadmap — Class 20 added Location beside Social and WhatsApp — and pinning a literal
   here only made the guard fail for doing its job. What must hold is that every module
   listed is real, that none of them is smuggled into the eleven, and that the engine
   count above stays at eleven. */
/* Phase 1C removed the module `href`: a module is configured in the Studio and seen on
   the public site, so there is no page for the product to link to. The invariant is
   better for it — every module listed must be CONFIGURABLE, which ties the library to
   the Studio instead of to a lab. */
const moduleBlock=code.slice(code.indexOf('const MODULES=['));
const modules=[...moduleBlock.matchAll(/\{id:'([a-z0-9-]+)',\s*\n?\s*name:/g)].map(m=>m[1]);
if(!modules.length)fail('no modules are listed at all');
if(/href:'labs\//.test(moduleBlock))fail('a module card still points at a lab');
const studio=read('class20-modules-studio.js');
const KEY={'social-reputation':'social','whatsapp-contact':'whatsapp'};
for(const id of modules){
  if(entries.some(e=>e.id===id))fail(`${id} is counted both as a module and as an engine`);
  const key=KEY[id]||id;
  if(!studio.includes(`${key}:{name:`)&&!studio.includes(`'${key}'`)&&!studio.includes(`${key}:{`))
    fail(`module ${id} is listed but the Studio cannot configure it`);
}

/* ---- 3. it owns no engine and no second selection ---- */
if(/requestAnimationFrame|gsap|ScrollTrigger|@keyframes/.test(code))
  fail('the library grew an animation of its own');
for(const banned of ['activeEngine','currentEngine','selectedEngine','activeIndex']){
  if(new RegExp(`${banned}\\s*=`).test(code))fail(`the library grew a second selection: ${banned}`);
}
if(!/select\(\)\?\.value===engine\.value/.test(code))
  fail('the active choreography is no longer read from the select');
if(!/s\.dispatchEvent\(new Event\('change'/.test(code))
  fail('activating an engine no longer goes through the select the visitor uses');
if(!/RestaurantStudioConfig\?\.set\?\./.test(code))
  fail('the transversal toggle no longer writes through the existing project state');
if(/localStorage|sessionStorage|indexedDB/.test(code))
  fail('the library grew its own persistence');

/* the renderer must not branch on a specific engine */
for(const re of [/id===['"](?:elegant|dish-stage|scroll-traveler)['"]/,/name===['"]/]){
  if(re.test(code))fail(`the renderer branches on an identity: ${re}`);
}

/* ---- 4. additive ---- */
const html=read('index.html');
if(/class19-motion-library|styles-v19/.test(html))
  fail('index.html was edited to load the library');
const guard=read('class4-runtime-guard.js');
if(!guard.includes("s.src='class19-motion-library.js'"))
  fail('the runtime guard no longer loads the library');
for(const m of ['class8-depth-carousel.js','class9-anchor-scenes.js','class10-orbital-food.js',
  'class11-pizza-slice-orbit.js','class12-pizza-premium.js','class14-scroll-traveler.js']){
  if(!guard.includes(`s.src='${m}'`))fail(`the runtime guard lost ${m}`);
}
/* the labs must stay standalone: the library links to them, it does not rewire them */
for(const [,,href] of [...code.matchAll(/href:'(labs\/[^']+)'/g)].map(m=>[0,0,m[1]])){
  const lab=read(href);
  if(/class19-motion-library/.test(lab))fail(`${href} was rewired to the library`);
}
/* and no engine was taught about the library */
for(const f of ['class8-depth-carousel.js','class10-orbital-food.js','class11-pizza-slice-orbit.js',
  'class14-scroll-traveler.js']){
  if(/MotionLibrary|ml-library/.test(read(f)))
    fail(`${f} was edited to know about the library — it must stay an index`);
}

console.log(`motion library contract: 11 engines numbered 01..11 (7 orbit presets, 1 page motion, `
  +`3 full-screen experiences), every preset registered by a real runtime and every experience a `
  +`page that exists, ${modules.length} configurable modules listed outside the count, `
  +`no second selection, `
  +`no persistence of its own, index.html untouched and every engine runtime still loaded`);
