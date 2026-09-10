/* CLASS 24 — real pointer controls + Motion governance gate.
   Playwright acts like a visitor: no state injection for Half Orbit interaction. */
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};
const center=box=>({x:box.x+box.width/2,y:box.y+box.height/2});

{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}?review=half-orbit`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,null,{timeout:30000});
  await page.waitForTimeout(650);

  const defaults=await page.evaluate(()=>({
    traveler:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),
    capability:window.RestaurantStudioConfig.get('capabilities.motionStudio'),
    active:window.RestaurantScrollTraveler?.state?.().active||false
  }));
  check('Scroll Traveler is opt-in by default',defaults.traveler===false&&!defaults.active,JSON.stringify(defaults));
  check('Motion Studio capability is enabled for this restaurant template',defaults.capability!==false,String(defaults.capability));

  /* Physical pointer click, not locator.click(): pointerdown must NOT start drag. */
  const before=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  const nextBox=await page.locator('.hos-next').boundingBox();const np=center(nextBox);
  await page.mouse.move(np.x,np.y);await page.mouse.down();
  const down=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  await page.mouse.up();await page.waitForTimeout(850);
  const after=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  check('arrow pointerdown never enters drag state',down.dragging===false,JSON.stringify(down));
  check('right arrow changes exactly one product',after.activeIndex===(before.activeIndex+1)%before.count,`${before.activeIndex} -> ${after.activeIndex}`);
  check('right arrow produces one 180deg half-turn',Math.abs((after.halfTurnDeg-before.halfTurnDeg)-180)<1,`${before.halfTurnDeg} -> ${after.halfTurnDeg}`);

  const labelInfo=await page.evaluate(()=>{
    const active=window.RestaurantHalfOrbit.state().activeIndex;
    const el=[...document.querySelectorAll('.hos-label:not(:disabled)')].find(x=>+x.dataset.index!==active);
    if(!el)return null;const r=el.getBoundingClientRect();return {index:+el.dataset.index,x:r.left+r.width/2,y:r.top+r.height/2};
  });
  if(labelInfo){
    await page.mouse.move(labelInfo.x,labelInfo.y);await page.mouse.down();
    const labelDown=await page.evaluate(()=>window.RestaurantHalfOrbit.state().dragging);
    await page.mouse.up();await page.waitForTimeout(900);
    const labelAfter=await page.evaluate(()=>window.RestaurantHalfOrbit.state().activeIndex);
    check('product-name pointerdown never starts drag',labelDown===false,String(labelDown));
    check('clicking a visible product name selects it',labelAfter===labelInfo.index,`${labelAfter} / ${labelInfo.index}`);
  }else check('a secondary product label is reachable',false,'none');

  await page.evaluate(()=>window.RestaurantHalfOrbit.goTo(0));await page.waitForTimeout(900);
  const detailBox=await page.locator('.hos-detail').boundingBox();const dp=center(detailBox);
  await page.mouse.move(dp.x,dp.y);await page.mouse.down();
  const detailDown=await page.evaluate(()=>window.RestaurantHalfOrbit.state().dragging);
  await page.mouse.up();await page.waitForTimeout(500);
  const detailOpen=await page.evaluate(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='false');
  check('detail CTA pointerdown never starts drag',detailDown===false,String(detailDown));
  check('detail CTA still opens the real product detail',detailOpen,'dish detail open');
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());await page.waitForTimeout(250);

  /* Ordinary empty-stage drag still works. */
  const stageBox=await page.locator('.hos-stage').boundingBox();
  const p0=await page.evaluate(()=>window.RestaurantHalfOrbit.state().progress);
  await page.mouse.move(stageBox.x+stageBox.width*.62,stageBox.y+stageBox.height*.40);await page.mouse.down();
  await page.mouse.move(stageBox.x+stageBox.width*.40,stageBox.y+stageBox.height*.40,{steps:5});
  const held=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  await page.mouse.up();await page.waitForTimeout(800);
  check('empty-stage drag remains continuous',held.dragging&&Math.abs(held.progress-p0)>.15,`${p0} -> ${held.progress}`);

  /* Live copy must update even when id/name/image/accent stay unchanged. */
  await page.evaluate(()=>window.RestaurantHalfOrbit.goTo(0));await page.waitForTimeout(850);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('dishes.0.short','COPY LIVE CLASS24'));
  await page.waitForTimeout(600);
  const liveCopy=await page.locator('.hos-desc').textContent();
  check('Half Orbit repaints description-only Project State edits',liveCopy.trim()==='COPY LIVE CLASS24',liveCopy.trim());

  /* Motion information architecture. */
  await page.evaluate(()=>document.querySelector('.studio-open')?.click());await page.waitForTimeout(500);
  await page.evaluate(()=>document.querySelector('#studio [data-panel="motion"]')?.click());
  await page.waitForFunction(()=>window.RestaurantMotionGovernance?.state?.().grouped===true,null,{timeout:20000});
  await page.waitForTimeout(350);
  const groups=await page.evaluate(()=>({
    groups:window.RestaurantMotionGovernance.state().groups,
    product:document.querySelectorAll('[data-motion-group="preset"] [data-ml-kind="preset"]').length,
    page:document.querySelectorAll('[data-motion-group="page"] [data-ml-kind="page"]').length,
    experiences:document.querySelectorAll('[data-motion-group="experience"] [data-ml-kind="experience"]').length,
    tunerInside:!!document.querySelector('[data-motion-group="page"] .st-studio-governed'),
    off:document.querySelector('.st-studio-governed')?.classList.contains('is-off')
  }));
  check('Motion panel reads as Product / Transversal / Experiences',groups.groups.join(',')==='preset,page,experience',groups.groups.join(','));
  check('the three concepts contain 8 / 1 / 3 engines',groups.product===8&&groups.page===1&&groups.experiences===3,`${groups.product}/${groups.page}/${groups.experiences}`);
  check('Scroll Traveler tuning lives inside the transversal block',groups.tunerInside&&groups.off,'off and grouped');

  const hiddenControls=await page.evaluate(()=>{
    const tuner=document.querySelector('.st-studio-governed');
    return [...tuner.querySelectorAll('label:not(.st-check)')].every(x=>getComputedStyle(x).display==='none');
  });
  check('Scroll Traveler OFF collapses advanced controls',hiddenControls,'controls hidden');

  await page.evaluate(()=>document.querySelector('[data-ml-card="scroll-traveler"] .ml-toggle')?.click());
  await page.waitForFunction(()=>window.RestaurantScrollTraveler?.state?.().active===true,null,{timeout:10000});
  const on=await page.evaluate(()=>({cfg:window.RestaurantStudioConfig.get('scrollTraveler.enabled'),
    classOn:document.querySelector('.st-studio-governed')?.classList.contains('is-on'),
    text:document.querySelector('[data-ml-card="scroll-traveler"] .ml-toggle')?.textContent.trim()}));
  check('Scroll Traveler is a clear independent ON switch',on.cfg===true&&on.classOn&&/^ON/.test(on.text),JSON.stringify(on));
  await page.evaluate(()=>document.querySelector('[data-ml-card="scroll-traveler"] .ml-toggle')?.click());
  await page.waitForFunction(()=>window.RestaurantScrollTraveler?.state?.().active===false,null,{timeout:10000});

  /* A template can hide advanced Motion authoring without changing the public engine. */
  const activeMode=await page.evaluate(()=>document.documentElement.dataset.orbitalMotion);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('capabilities.motionStudio',false));await page.waitForTimeout(350);
  const hidden=await page.evaluate(()=>({
    tab:document.querySelector('#studio .studio-nav [data-panel="motion"]')?.hidden,
    panel:document.querySelector('#studio .motion-panel')?.hidden,
    mode:document.documentElement.dataset.orbitalMotion
  }));
  check('template capability can hide Motion authoring',hidden.tab===true&&hidden.panel===true,JSON.stringify(hidden));
  check('hiding Motion authoring does not change the public choreography',hidden.mode===activeMode,`${activeMode} -> ${hidden.mode}`);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('capabilities.motionStudio',true));await page.waitForTimeout(250);
  check('the Motion tab can be exposed again',await page.evaluate(()=>document.querySelector('#studio .studio-nav [data-panel="motion"]')?.hidden===false),'visible again');

  /* Leaving the preset must tear its interaction listeners down. */
  await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');s.value='elegant';
    s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  });
  await page.waitForTimeout(450);
  const gone=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  check('leaving Half Orbit unbinds its interaction lifecycle',gone.mounted===false&&gone.dragging===false,JSON.stringify(gone));
  check('no JS errors in the full governance pass',errors.length===0,errors.join(' | '));
  await ctx.close();
}

await browser.close();server.close();
const failed=results.filter(x=>!x.ok);
console.log(`\n${results.length-failed.length}/${results.length} ${failed.length?'CLASS24_GOVERNANCE_FAIL':'CLASS24_GOVERNANCE_PASS'}`);
if(failed.length){console.error(failed.map(x=>x.name).join(' | '));process.exit(1)}
