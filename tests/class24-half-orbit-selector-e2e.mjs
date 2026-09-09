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
    libraryCount:window.RestaurantMotionLibrary?.count?.()||0,
    errors:[]
  }));
  check(`${source} · review abre el motor productivo`,initial.stage&&initial.state.mode==='half-orbit'&&initial.state.source===source,JSON.stringify(initial.state));
  check(`${source} · arco tipográfico visible`,initial.labels>=3&&initial.active===1,`${initial.labels} nombres visibles`);
  check(`${source} · hero y titular reales`,!!initial.title&&initial.state.count>=5,`${initial.title} · ${initial.state.count} productos`);
  check(`${source} · Motion Library registra 12 motores`,initial.libraryCount===12,String(initial.libraryCount));

  const before=initial.state;
  await page.click('.hos-next');await page.waitForTimeout(850);
  const next=await page.evaluate(()=>({state:window.RestaurantHalfOrbit.state(),title:document.querySelector('.hos-title')?.textContent.trim(),turn:getComputedStyle(document.querySelector('.hos-orbit-sweep')).transform}));
  check(`${source} · flecha cambia producto`,next.state.activeIndex!==before.activeIndex&&next.title!==initial.title,`${initial.title} → ${next.title}`);
  check(`${source} · cada paso suma un half-turn de 180°`,Math.abs((next.state.halfTurnDeg-before.halfTurnDeg)-180)<1,`${before.halfTurnDeg}° → ${next.state.halfTurnDeg}°`);

  const box=await page.locator('.hos-stage').boundingBox();
  const start=await page.evaluate(()=>window.RestaurantHalfOrbit.state().progress);
  await page.mouse.move(box.x+box.width*.62,box.y+box.height*.46);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.38,box.y+box.height*.46,{steps:6});
  const during=await page.evaluate(()=>({p:window.RestaurantHalfOrbit.state().progress,drag:window.RestaurantHalfOrbit.state().dragging,turn:document.querySelector('.hos-orbit')?.style.getPropertyValue('--hos-turn')}));
  check(`${source} · drag es continuo antes de soltar`,during.drag&&Math.abs(during.p-start)>.2,`progress ${start.toFixed(2)} → ${during.p.toFixed(2)} · ${during.turn}`);
  await page.mouse.up();await page.waitForTimeout(800);
  const settled=await page.evaluate(()=>window.RestaurantHalfOrbit.state());
  check(`${source} · drag hace snap`,Math.abs(settled.progress-Math.round(settled.progress))<.001,`progress ${settled.progress}`);

  /* Half Orbit must not hijack wheel scrolling. */
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('#signature').offsetTop+100));
  const y0=await page.evaluate(()=>scrollY);await page.mouse.move(box.x+box.width*.5,Math.max(80,box.y+box.height*.3));await page.mouse.wheel(0,420);await page.waitForTimeout(300);
  const y1=await page.evaluate(()=>scrollY);
  check(`${source} · rueda conserva scroll de página`,y1>y0+40,`${Math.round(y0)} → ${Math.round(y1)}`);
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

await browser.close();if(local)await local.close();
const passed=out.filter(x=>x.ok).length;
console.log(`\n${passed}/${out.length} ${passed===out.length?'CLASS24_HALF_ORBIT_PASS':'CLASS24_HALF_ORBIT_FAIL'}`);
if(passed!==out.length)process.exitCode=1;
