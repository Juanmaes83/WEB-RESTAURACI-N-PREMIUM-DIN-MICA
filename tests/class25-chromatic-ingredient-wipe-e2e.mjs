/* CLASS 25 · CHROMATIC INGREDIENT WIPE — human-review gate.
   Playwright audits the real production engine; it never injects selector state.
   Usage: node tests/class25-chromatic-ingredient-wipe-e2e.mjs [baseUrl] */
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const out=[];
const check=(name,ok,detail='')=>{out.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function ready(page){
  await page.waitForFunction(()=>window.RestaurantChromaticWipe?.state?.().ready===true,null,{timeout:40000});
  await page.waitForTimeout(600);
}
async function settled(page){
  await page.waitForFunction(()=>{const s=window.RestaurantChromaticWipe?.state?.();return s&&!s.transition&&!s.dragging&&Math.abs(s.progress-Math.round(s.progress))<.01},null,{timeout:3500}).catch(()=>{});
}
async function goTo(page,i){await page.evaluate(n=>window.RestaurantChromaticWipe.goTo(n),i);await settled(page);}
/* Capture the wipe path (centre-x + width) during a transition, bucketed by progress. */
async function capturePath(page,fire){
  await fire();
  const frames=[];
  for(let i=0;i<30;i++){
    const f=await page.evaluate(()=>{
      const s=window.RestaurantChromaticWipe.state();
      const el=document.querySelector('.cw-ingredient');const r=el.getBoundingClientRect();
      const wb=document.querySelector('.cw-world-b'),wa=document.querySelector('.cw-world-a');
      return {p:s.progress,t:s.transition,d:s.direction,
        cx:r.x+r.width/2,w:r.width,op:parseFloat(getComputedStyle(el).opacity),
        wbOp:parseFloat(getComputedStyle(wb).opacity),waOp:parseFloat(getComputedStyle(wa).opacity),
        giantA:document.querySelector('.cw-giant-a')?.textContent,giantB:document.querySelector('.cw-giant-b')?.textContent,
        heroA:document.querySelector('.cw-hero-a')?.dataset.item,heroB:document.querySelector('.cw-hero-b')?.dataset.item,
        accent:getComputedStyle(document.documentElement).getPropertyValue('--cw-accent').trim()};
    });
    frames.push(f);
    if(!f.t&&i>3)break;
    await page.waitForTimeout(30);
  }
  return frames;
}
const near=(frames,p)=>frames.filter(f=>f.t).reduce((a,f)=>Math.abs(f.p-p)<Math.abs((a?.p??9)-p)?f:a,null);

async function reviewPass(source){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/?review=chromatic-wipe${source==='pizzas'?'&source=pizzas':''}`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  const vw=1440;
  const init=await page.evaluate(()=>({s:window.RestaurantChromaticWipe.state(),
    stage:!!document.querySelector('.cw-stage:not([hidden])'),
    lib:window.RestaurantMotionLibrary?.count?.()||0,
    giant:[...document.querySelectorAll('.cw-giant')].filter(g=>parseFloat(getComputedStyle(g).opacity)>0.5).map(g=>g.textContent).join('')}));
  check(`${source} · review loads the production engine`,init.stage&&init.s.mode==='chromatic-ingredient-wipe'&&init.s.source===source&&init.s.ready,JSON.stringify({mode:init.s.mode,src:init.s.source}));
  check(`${source} · at least 4 products`,init.s.count>=4,`${init.s.count} products`);
  check(`${source} · Motion Library registers 13 engines`,init.lib===13,String(init.lib));

  await goTo(page,0);
  const before=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  const path=await capturePath(page,()=>page.click('.cw-next'));
  await settled(page);
  const after=await page.evaluate(()=>({s:window.RestaurantChromaticWipe.state(),
    giant:[...document.querySelectorAll('.cw-giant')].filter(g=>parseFloat(getComputedStyle(g).opacity)>0.5).map(g=>g.textContent).join(''),
    heroItem:document.querySelector('.cw-hero-img[style*="opacity: 1"]')?.dataset.item||null}));

  const q=near(path,.25),m=near(path,.5),tq=near(path,.75);
  check(`${source} · arrow changes exactly one product`,after.s.activeIndex===(before.activeIndex+1)%before.count&&after.s.direction===0,`${before.activeIndex} → ${after.s.activeIndex}`);
  const crossed=q&&tq&&q.cx>vw*0.55&&tq.cx<vw*0.45; // enters from right, exits toward left
  check(`${source} · foreground wipe physically crosses the viewport`,!!crossed,q&&tq?`cx ~.25=${Math.round(q.cx)} → ~.75=${Math.round(tq.cx)}`:'no frames');
  const minW=Math.min(...path.filter(f=>f.op>0).map(f=>f.w));
  const big=m&&m.w>vw*0.6&&m.w>minW*1.6; // grows from its edge size to dominate the frame
  check(`${source} · wipe is a dominant occluder near midpoint`,!!big,m?`w@mid=${Math.round(m.w)} vs edge=${Math.round(minW)} (vw=${vw})`:'none');
  const incomingRose=path.some(f=>f.t&&f.wbOp>0.5),outgoingFell=path.some(f=>f.t&&f.waOp<0.8);
  const worldSwap=incomingRose&&outgoingFell&&after.s.accent!==before.accent;
  check(`${source} · background world changes (crossfade + accent)`,worldSwap,`accent ${before.accent} → ${after.s.accent} · inRose=${incomingRose} outFell=${outgoingFell}`);
  check(`${source} · giant title changes`,after.giant&&after.giant!==init.giant,`${init.giant} → ${after.giant}`);
  check(`${source} · hero changes`,after.heroItem&&after.heroItem!==before.activeId,`${before.activeId} → ${after.heroItem}`);
  check(`${source} · direction === 1 on NEXT`,(m||q)?.d===1,String((m||q)?.d));

  /* LEFT reverses the choreography: ingredient enters from the left, travels right. */
  await goTo(page,2);
  const revBefore=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  const revPath=await capturePath(page,()=>page.click('.cw-prev'));
  await settled(page);
  const revAfter=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  const rq=near(revPath,.25),rtq=near(revPath,.75);
  const reversed=rq&&rtq&&rq.cx<vw*0.45&&rtq.cx>vw*0.55&&(near(revPath,.5)?.d===-1);
  const revExpected=((revBefore.activeIndex-1)%revBefore.count+revBefore.count)%revBefore.count;
  check(`${source} · LEFT reverses direction (enters left → exits right)`,!!reversed&&revAfter.activeIndex===revExpected,
    rq&&rtq?`cx ~.25=${Math.round(rq.cx)} → ~.75=${Math.round(rtq.cx)} dir=${near(revPath,.5)?.d} · idx ${revBefore.activeIndex}→${revAfter.activeIndex} (want ${revExpected})`:'no frames');

  check(`${source} · no JS errors`,errors.length===0,errors.slice(0,3).join(' | '));
  await ctx.close();
  return errors.length;
}

await reviewPass('dishes');
await reviewPass('pizzas');

/* Interaction + lifecycle on dishes. */
{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  await page.locator('.cw-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(200);

  /* Controls must not start a drag. */
  const before=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  const nb=await page.locator('.cw-next').boundingBox();
  await page.mouse.move(nb.x+nb.width/2,nb.y+nb.height/2);await page.mouse.down();
  const down=await page.evaluate(()=>window.RestaurantChromaticWipe.state().dragging);
  await page.mouse.up();await settled(page);
  const after=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  check('arrow pointerdown never enters drag',down===false,String(down));
  check('right arrow advances one product',after.activeIndex===(before.activeIndex+1)%before.count,`${before.activeIndex} → ${after.activeIndex}`);

  /* Keyboard. */
  await goTo(page,0);
  await page.evaluate(()=>document.querySelector('.cw-stage').focus());
  await page.keyboard.press('ArrowRight');await settled(page);
  const kb=await page.evaluate(()=>window.RestaurantChromaticWipe.state().activeIndex);
  check('keyboard ArrowRight changes product',kb===1,String(kb));

  /* Free-stage drag scrub: continuous, and short drag cancels. */
  await goTo(page,0);
  const drag=async(dx,steps=6,wait=14)=>{
    const bb=await page.locator('.cw-stage').boundingBox();
    const x=bb.x+bb.width*0.5,y=bb.y+bb.height*0.72;
    await page.mouse.move(x,y);await page.mouse.down();
    for(let i=1;i<=steps;i++){await page.mouse.move(x+dx*i/steps,y,{steps:1});await page.waitForTimeout(wait);}
    const mid=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
    await page.mouse.up();await settled(page);
    return mid;
  };
  const startIdx=await page.evaluate(()=>window.RestaurantChromaticWipe.state().activeIndex);
  const shortMid=await drag(-40,8,45); // small + slow → below distance and velocity thresholds
  const shortAfter=await page.evaluate(()=>window.RestaurantChromaticWipe.state().activeIndex);
  check('free-stage drag scrubs continuously',shortMid.dragging&&shortMid.progress>0.02,`progress ${shortMid.progress.toFixed(3)}`);
  check('short drag cancels back to the same product',shortAfter===startIdx,`${startIdx} → ${shortAfter}`);

  /* Committed drag (long + fling) completes the transition. */
  await goTo(page,0);
  const longMid=await drag(-460,9);
  const longAfter=await page.evaluate(()=>window.RestaurantChromaticWipe.state().activeIndex);
  check('committed drag completes to the next product',longAfter===1,`0 → ${longAfter}`);

  /* Product Detail CTA. */
  await goTo(page,0);
  await page.locator('.cw-detail').scrollIntoViewIfNeeded();await page.waitForTimeout(80);
  const db=await page.locator('.cw-detail').boundingBox();
  await page.mouse.move(db.x+db.width/2,db.y+db.height/2);await page.mouse.down();
  const detailDrag=await page.evaluate(()=>window.RestaurantChromaticWipe.state().dragging);
  await page.mouse.up();await page.waitForTimeout(500);
  const detailOpen=await page.evaluate(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='false');
  check('detail CTA pointerdown never drags',detailDrag===false,String(detailDrag));
  check('detail CTA opens the real Product Detail',detailOpen,'dish detail open');
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());await page.waitForTimeout(250);

  /* Vertical wheel keeps scrolling the page. */
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const t=document.querySelector('#signature').offsetTop+100;window.scrollTo({top:t,behavior:'instant'})});
  await page.waitForTimeout(120);
  const box=await page.locator('.cw-stage').boundingBox();
  const y0=await page.evaluate(()=>scrollY);
  await page.mouse.move(box.x+box.width*.5,Math.max(80,Math.min(920,box.y+box.height*.3)));
  await page.mouse.wheel(0,420);await page.waitForTimeout(260);
  const y1=await page.evaluate(()=>scrollY);
  check('vertical wheel still scrolls the page',y1>y0+100,`${Math.round(y0)} → ${Math.round(y1)}`);

  /* Leaving the engine unbinds its lifecycle. */
  await page.evaluate(()=>{const s=document.getElementById('motion-orbital-style');s.value='elegant';
    s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));window.RestaurantMotionStudio?.publish?.()});
  await page.waitForTimeout(450);
  const gone=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  check('leaving the engine unbinds its interaction lifecycle',gone.mounted===false&&gone.dragging===false,JSON.stringify({mounted:gone.mounted}));
  check('no JS errors in the interaction pass',errors.length===0,errors.slice(0,3).join(' | '));
  await ctx.close();
}

/* Reduced motion: usable, no giant sweep. */
{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  const before=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  await page.click('.cw-next');
  let maxIngredientOpacity=0;
  for(let i=0;i<18;i++){const o=await page.evaluate(()=>{const s=window.RestaurantChromaticWipe.state();return {t:s.transition,op:parseFloat(getComputedStyle(document.querySelector('.cw-ingredient')).opacity)}});maxIngredientOpacity=Math.max(maxIngredientOpacity,o.op);if(!o.t&&i>2)break;await page.waitForTimeout(25)}
  await settled(page);
  const after=await page.evaluate(()=>window.RestaurantChromaticWipe.state());
  check('reduced-motion · navigation still changes product',after.activeIndex===(before.activeIndex+1)%before.count,`${before.activeIndex} → ${after.activeIndex}`);
  check('reduced-motion · no giant ingredient sweep',maxIngredientOpacity<0.05,`max ingredient opacity ${maxIngredientOpacity.toFixed(2)}`);
  check('reduced-motion · no JS errors',errors.length===0,errors.slice(0,3).join(' | '));
  await ctx.close();
}

/* Mobile 390: no horizontal overflow. */
{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=chromatic-wipe`,{waitUntil:'domcontentloaded',timeout:45000});
  await ready(page);
  const mob=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,
    name:document.querySelector('.cw-name')?.getBoundingClientRect()}));
  check('mobile 390px · no horizontal overflow',mob.sw<=390,`${mob.sw}px`);
  check('mobile 390px · copy stays in viewport',mob.name&&mob.name.left>=0&&mob.name.right<=390,`${Math.round(mob.name?.left||0)}..${Math.round(mob.name?.right||0)}`);
  await ctx.close();
}

await browser.close();if(local)await new Promise(r=>local.server.close(r));
const passed=out.filter(x=>x.ok).length;
console.log(`\n${passed}/${out.length} ${passed===out.length?'CLASS25_CHROMATIC_WIPE_PASS':'CLASS25_CHROMATIC_WIPE_FAIL'}`);
if(passed!==out.length)process.exitCode=1;
