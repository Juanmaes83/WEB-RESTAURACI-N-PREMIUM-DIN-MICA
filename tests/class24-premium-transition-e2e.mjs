/* CLASS 24 · HALF ORBIT — PREMIUM TRANSITION GATE (§18)
   Proves the change between products is ONE coordinated choreography, not A -> B:
     A. CLICK NEXT  — mid-transition hero cross + world interpolation + title coexistence, direction === 1
     B. CLICK PREV  — same language, direction === -1
     C. RAPID INPUT — NEXT, 150ms, NEXT advances two products, no JS error, no residual DOM
     D. DRAG        — progress + chromatic accent interpolate continuously during the gesture
   Playwright audits the live product; it never injects selector state.
   Usage: node tests/class24-premium-transition-e2e.mjs [baseUrl]
*/
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const out=[];
const check=(name,ok,detail='')=>{out.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function waitReady(page){
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,null,{timeout:40000});
  await page.waitForTimeout(600);
}
async function waitSettled(page){
  await page.waitForFunction(()=>{
    const s=window.RestaurantHalfOrbit?.state?.();
    return s&&!s.transition&&!s.dragging&&Math.abs(s.progress-Math.round(s.progress))<.001;
  },null,{timeout:3000}).catch(()=>{});
}
async function goTo(page,i){
  await page.evaluate(n=>window.RestaurantHalfOrbit.goTo(n),i);
  await waitSettled(page);
}
/* Sample the busiest frame of a transition: first tick where both heroes and both worlds overlap. */
async function captureMidTransition(page){
  let best=null;
  for(let i=0;i<26;i++){
    const f=await page.evaluate(()=>{
      const gs=el=>el?parseFloat(getComputedStyle(el).opacity):0;
      const s=window.RestaurantHalfOrbit.state();
      const hA=gs(document.querySelector('.hos-hero-a')),hB=gs(document.querySelector('.hos-hero-b'));
      const wA=gs(document.querySelector('.hos-world-a')),wB=gs(document.querySelector('.hos-world-b'));
      return {transition:s.transition,direction:s.direction,
        heroesOverlap:hA>0.05&&hB>0.05,worldsOverlap:wA>0.02&&wB>0.02,
        ghost:(document.querySelector('.hos-title-ghost')?.textContent||'').trim(),
        titleGhostVisible:gs(document.querySelector('.hos-title-ghost'))>0.02,
        hA:+hA.toFixed(2),hB:+hB.toFixed(2),wA:+wA.toFixed(2),wB:+wB.toFixed(2)};
    });
    if(f.transition&&f.heroesOverlap&&(!best||(f.worldsOverlap&&!best.worldsOverlap)))best=f;
    if(f.transition&&f.heroesOverlap&&f.worldsOverlap&&f.ghost){best=f;break}
    await page.waitForTimeout(28);
  }
  return best;
}

async function directionCase(page,label,selector,expectDir){
  await goTo(page,0);
  const before=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  await page.click(selector);
  const mid=await captureMidTransition(page);
  check(`${label} · mid-transition is a single coreography`,
    !!mid&&mid.transition&&mid.heroesOverlap&&mid.worldsOverlap&&!!mid.ghost,
    mid?`dir=${mid.direction} heroes ${mid.hA}/${mid.hB} worlds ${mid.wA}/${mid.wB} ghost="${mid.ghost}"`:'no mid frame');
  check(`${label} · direction === ${expectDir}`,!!mid&&mid.direction===expectDir,mid?String(mid.direction):'—');
  await waitSettled(page);
  const after=await page.evaluate(()=>({s:window.RestaurantHalfOrbit.state(),title:document.querySelector('.hos-title')?.textContent.trim()}));
  const expected=((before.activeIndex+expectDir)%before.count+before.count)%before.count;
  check(`${label} · lands on the correct product, transition closed`,
    after.s.activeIndex===expected&&after.s.transition===false&&Math.abs(after.s.progress-Math.round(after.s.progress))<.001,
    `${before.activeIndex} -> ${after.s.activeIndex} (want ${expected})`);
  check(`${label} · exactly one 180° half-turn`,Math.abs(Math.abs(after.s.halfTurnDeg-before.halfTurnDeg)-180)<1,
    `${before.halfTurnDeg}° -> ${after.s.halfTurnDeg}°`);
}

const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`${BASE}/?review=half-orbit`,{waitUntil:'domcontentloaded',timeout:45000});
await waitReady(page);

/* A + B */
await directionCase(page,'NEXT',' .hos-next',1);
await directionCase(page,'PREV',' .hos-prev',-1);

/* C · RAPID INPUT */
await goTo(page,0);
const rapidStart=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
await page.click('.hos-next');
await page.waitForTimeout(150);
await page.click('.hos-next');
await waitSettled(page);
const rapid=await page.evaluate(()=>({
  s:window.RestaurantHalfOrbit.state(),
  heroes:document.querySelectorAll('.hos-hero-img').length,
  worlds:document.querySelectorAll('.hos-world').length,
  titles:document.querySelectorAll('.hos-title').length,
  ghosts:document.querySelectorAll('.hos-title-ghost').length
}));
const rapidExpected=(rapidStart.activeIndex+2)%rapidStart.count;
check('RAPID · NEXT+NEXT advances two products',rapid.s.activeIndex===rapidExpected,`${rapidStart.activeIndex} -> ${rapid.s.activeIndex} (want ${rapidExpected})`);
check('RAPID · no residual / duplicated DOM layers',rapid.heroes===2&&rapid.worlds===2&&rapid.titles===1&&rapid.ghosts===1,
  `${rapid.heroes} heroes / ${rapid.worlds} worlds / ${rapid.titles} title / ${rapid.ghosts} ghost`);
check('RAPID · transition closed cleanly',rapid.s.transition===false&&rapid.s.direction===0,JSON.stringify({t:rapid.s.transition,d:rapid.s.direction}));

/* D · DRAG chromatic interpolation */
await goTo(page,0);
const dragPoint=await page.evaluate(()=>{
  const stage=document.querySelector('.hos-stage'),r=stage.getBoundingClientRect();
  const interactive='button,a,input,select,textarea,label,[role="button"]';
  for(const yr of [.28,.34,.40,.48])for(const xr of [.62,.52,.72,.38]){
    const x=r.left+r.width*xr,y=r.top+r.height*yr;
    const el=document.elementFromPoint(x,y);
    if(el&&stage.contains(el)&&!el.closest(interactive))return {x,y};
  }
  return null;
});
const readAccent=()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--hos-accent').trim());
const accent0=await readAccent();
const p0=await page.evaluate(()=>window.RestaurantHalfOrbit.state().progress);
if(dragPoint){
  await page.mouse.move(dragPoint.x,dragPoint.y);await page.mouse.down();
  await page.mouse.move(dragPoint.x-170,dragPoint.y,{steps:8});
}
const during=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
const accentDuring=await readAccent();
check('DRAG · progress follows the pointer continuously',during.dragging&&Math.abs(during.p||during.progress-p0)>.2||Math.abs(during.progress-p0)>.2,
  `progress ${p0.toFixed(2)} -> ${during.progress.toFixed(2)}`);
check('DRAG · chromatic accent interpolates during the gesture',during.dragPreview===true&&accentDuring!==''&&accentDuring!==accent0,
  `accent ${accent0||'—'} -> ${accentDuring||'—'} · dragPreview=${during.dragPreview}`);
if(dragPoint)await page.mouse.up();
await waitSettled(page);
const dragSettled=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
check('DRAG · snaps to an integer product after release',Math.abs(dragSettled.progress-Math.round(dragSettled.progress))<.001,`progress ${dragSettled.progress}`);

check('no JS errors across the premium-transition gate',errors.length===0,errors.join(' | '));
await ctx.close();

await browser.close();if(local)await new Promise(r=>local.server.close(r));
const passed=out.filter(x=>x.ok).length;
console.log(`\n${passed}/${out.length} ${passed===out.length?'CLASS24_PREMIUM_TRANSITION_PASS':'CLASS24_PREMIUM_TRANSITION_FAIL'}`);
if(passed!==out.length)process.exitCode=1;
