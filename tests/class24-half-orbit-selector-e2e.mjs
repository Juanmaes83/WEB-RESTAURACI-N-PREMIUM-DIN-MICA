/* CLASS 24 · HALF ORBIT SELECTOR — human-review gate
   Playwright audits the product; it does not inject state.
   Usage: node tests/class24-half-orbit-selector-e2e.mjs [baseUrl]
*/
import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const target=process.argv[2];
const local=target?null:await startServer(0);
const BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();
const out=[];
const check=(name,ok,detail='')=>{out.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function emptyDragPoint(page){
  return page.evaluate(()=>{
    const stage=document.querySelector('.hos-stage');
    if(!stage)return null;
    const r=stage.getBoundingClientRect();
    const interactive='button,a,input,select,textarea,label,[role="button"]';
    for(const yr of [.28,.34,.40,.48,.56])for(const xr of [.62,.52,.72,.38,.28]){
      const x=r.left+r.width*xr,y=r.top+r.height*yr;
      if(x<20||x>innerWidth-20||y<20||y>innerHeight-20)continue;
      const el=document.elementFromPoint(x,y);
      if(el&&stage.contains(el)&&!el.closest(interactive))return {x,y};
    }
    return null;
  });
}

async function waitSettled(page){
  await page.waitForFunction(()=>{
    const s=window.RestaurantHalfOrbit?.state?.();
    return s&&!s.transition&&!s.dragging&&Math.abs(s.progress-Math.round(s.progress))<.001;
  },null,{timeout:2600}).catch(()=>{});
}

async function review(source){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/?review=half-orbit${source==='pizzas'?'&source=pizzas':''}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,null,{timeout:40000});
  await page.waitForTimeout(650);
  const initial=await page.evaluate(()=>({
    state:window.RestaurantHalfOrbit.state(),
    stage:!!document.querySelector('.hos-stage:not([hidden])'),
    labels:[...document.querySelectorAll('.hos-label:not(:disabled)')].length,
    active:[...document.querySelectorAll('.hos-label')].filter(x=>x.dataset.active==='1').length,
    title:document.querySelector('.hos-title')?.textContent.trim(),
    hero:document.querySelector('.hos-hero-img[style*="opacity: 1"]')?.dataset.item||null,
    libraryCount:window.RestaurantMotionLibrary?.count?.()||0
  }));
  check(`${source} · review abre el motor productivo`,initial.stage&&initial.state.mode==='half-orbit'&&initial.state.source===source,JSON.stringify(initial.state));
  check(`${source} · arco tipográfico visible`,initial.labels>=3&&initial.active===1,`${initial.labels} nombres visibles`);
  check(`${source} · hero y titular reales`,!!initial.title&&initial.state.count>=5,`${initial.title} · ${initial.state.count} productos`);
  check(`${source} · Motion Library registra 12 motores`,initial.libraryCount===12,String(initial.libraryCount));

  const before=initial.state;
  await page.click('.hos-next');await waitSettled(page);
  const next=await page.evaluate(()=>({state:window.RestaurantHalfOrbit.state(),title:document.querySelector('.hos-title')?.textContent.trim(),turn:getComputedStyle(document.querySelector('.hos-orbit-sweep')).transform}));
  check(`${source} · flecha cambia producto`,next.state.activeIndex!==before.activeIndex&&next.title!==initial.title,`${initial.title} → ${next.title}`);
  check(`${source} · cada paso suma un half-turn de 180°`,Math.abs((next.state.halfTurnDeg-before.halfTurnDeg)-180)<1,`${before.halfTurnDeg}° → ${next.state.halfTurnDeg}°`);

  const dragPoint=await emptyDragPoint(page);
  check(`${source} · existe superficie de drag libre de controles`,!!dragPoint,dragPoint?`${Math.round(dragPoint.x)},${Math.round(dragPoint.y)}`:'none');
  const start=await page.evaluate(()=>window.RestaurantHalfOrbit.state().progress);
  if(dragPoint){
    await page.mouse.move(dragPoint.x,dragPoint.y);await page.mouse.down();
    await page.mouse.move(dragPoint.x-300,dragPoint.y,{steps:6});
  }
  const during=await page.evaluate(()=>({p:window.RestaurantHalfOrbit.state().progress,drag:window.RestaurantHalfOrbit.state().dragging,turn:document.querySelector('.hos-orbit')?.style.getPropertyValue('--hos-turn')}));
  check(`${source} · drag es continuo antes de soltar`,during.drag&&Math.abs(during.p-start)>.2,`progress ${start.toFixed(2)} → ${during.p.toFixed(2)} · ${during.turn}`);
  if(dragPoint)await page.mouse.up();
  await waitSettled(page);
  const settled=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  check(`${source} · drag hace snap`,Math.abs(settled.progress-Math.round(settled.progress))<.001,`progress ${settled.progress}`);

  await page.evaluate(()=>{
    document.documentElement.style.scrollBehavior='auto';
    const top=document.querySelector('#signature').offsetTop+100;
    window.scrollTo({top,behavior:'instant'});
  });
  await page.waitForTimeout(120);
  const wheelBox=await page.locator('.hos-stage').boundingBox();
  const y0=await page.evaluate(()=>scrollY);
  const mouseY=Math.max(80,Math.min(920,wheelBox.y+wheelBox.height*.3));
  await page.mouse.move(wheelBox.x+wheelBox.width*.5,mouseY);
  await page.mouse.wheel(0,420);await page.waitForTimeout(260);
  const y1=await page.evaluate(()=>scrollY);
  check(`${source} · rueda conserva scroll de página`,y1>y0+100,`${Math.round(y0)} → ${Math.round(y1)}`);
  check(`${source} · sin errores JS`,errors.length===0,errors.join(' | '));
  await ctx.close();
}

await review('dishes');
await review('pizzas');

{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});const page=await ctx.newPage();
  await page.goto(`${BASE}/?review=half-orbit`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true,null,{timeout:40000});
  const mobile=await page.evaluate(()=>({
    viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    title:document.querySelector('.hos-title')?.getBoundingClientRect(),
    stage:document.querySelector('.hos-stage')?.getBoundingClientRect()
  }));
  check('mobile 390px · sin overflow horizontal',mobile.scrollWidth<=390,`${mobile.scrollWidth}px`);
  check('mobile 390px · hero/copy siguen en viewport',mobile.title&&mobile.stage&&mobile.title.left>=0&&mobile.title.right<=390,`${Math.round(mobile.title?.left||0)}..${Math.round(mobile.title?.right||0)}`);
  await ctx.close();
}

await browser.close();if(local)await new Promise(resolve=>local.server.close(resolve));
const passed=out.filter(x=>x.ok).length;
console.log(`\n${passed}/${out.length} ${passed===out.length?'CLASS24_HALF_ORBIT_PASS':'CLASS24_HALF_ORBIT_FAIL'}`);
if(passed!==out.length)process.exitCode=1;
