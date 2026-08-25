import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('qa-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:980}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});

  const ready=async p=>{
    await p.waitForSelector('#orbit-stage .orbit-dish',{timeout:15000});
    await p.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6,{timeout:15000});
    await p.waitForFunction(()=>document.documentElement.dataset.class7Runtime==='ready',{timeout:15000});
  };
  const openJourney=async p=>{
    await p.click('#explore-dish');
    await p.waitForFunction(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='false');
    await p.waitForFunction(()=>!document.querySelector('#class7-journey-hint')?.hidden);
    await p.locator('#dish-detail').dispatchEvent('wheel',{deltaY:620,deltaX:0});
    await p.waitForFunction(()=>document.documentElement.dataset.dishJourney==='active',{timeout:10000});
    await p.waitForFunction(()=>document.querySelector('#class7-journey-layer')?.classList.contains('is-active'));
    await p.waitForFunction(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='true');
    await p.waitForFunction(()=>document.documentElement.dataset.journeyAlpha==='ready',{timeout:10000});
  };

  await page.goto('http://127.0.0.1:4173/index.html?lang=es',{waitUntil:'networkidle'});
  await ready(page);

  const enabled=await page.getAttribute('html','data-dish-journey-enabled');
  if(enabled!=='true')throw new Error('Dish Journey must default ON in Class 07 demo');

  await page.click('#explore-dish');
  await page.waitForFunction(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='false');
  await page.waitForFunction(()=>!document.querySelector('#class7-journey-hint')?.hidden);
  const hint=await page.locator('#class7-hint-title').textContent();
  if(!/gamba/i.test(hint||''))throw new Error('Red prawn journey hint is missing');
  await page.locator('#dish-detail').dispatchEvent('wheel',{deltaY:620,deltaX:0});
  await page.waitForFunction(()=>document.documentElement.dataset.dishJourney==='active',{timeout:10000});
  await page.waitForFunction(()=>document.querySelector('#class7-journey-layer')?.classList.contains('is-active'));
  await page.waitForFunction(()=>document.querySelector('#dish-detail')?.getAttribute('aria-hidden')==='true');
  await page.waitForFunction(()=>document.documentElement.dataset.journeyAlpha==='ready',{timeout:10000});

  const journeyImage=page.locator('#class7-journey-image');
  if(!(await journeyImage.isVisible()))throw new Error('Persistent journey dish is not visible');

  const alpha=await page.evaluate(async()=>{
    const src=window.Class7DishJourney?.preparedSource;
    if(!src?.startsWith('data:image/png'))return {ok:false,reason:'prepared source is not PNG data'};
    const img=new Image();img.src=src;await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;
    let min=255,max=0,transparent=0,opaque=0;
    for(let i=3;i<d.length;i+=4){const a=d[i];if(a<min)min=a;if(a>max)max=a;if(a<8)transparent++;if(a>247)opaque++}
    return {ok:min<8&&max>247&&transparent>100&&opaque>100,min,max,transparent,opaque,width:c.width,height:c.height};
  });
  if(!alpha.ok)throw new Error(`Dish transparency is not real: ${JSON.stringify(alpha)}`);

  const checkpoints=[['#experience','origin'],['.experience-section','atmosphere'],['.chef-section','chef'],['#visit','visit']];
  const positions=[];
  for(const [selector,key] of checkpoints){
    await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'center'}));
    await page.waitForTimeout(900);
    await page.waitForFunction(k=>document.documentElement.dataset.journeySection===k,key,{timeout:6000});
    const box=await journeyImage.boundingBox();
    if(!box||box.width<80||box.height<80)throw new Error(`Journey dish invalid at ${key}`);
    if(box.x<0||box.y<0||box.x+box.width>1440||box.y+box.height>980)throw new Error(`Journey dish leaves viewport at ${key}: ${JSON.stringify(box)}`);
    const context=page.locator(`.class7-context[data-journey-context="${key}"]`);
    if(!(await context.isVisible()))throw new Error(`Context not visible at ${key}`);
    positions.push({key,x:Math.round(box.x),y:Math.round(box.y),w:Math.round(box.width)});
    if(key==='atmosphere')await page.screenshot({path:'qa-artifacts/01-transit-atmosphere.png',fullPage:false});
    if(key==='chef')await page.screenshot({path:'qa-artifacts/02-chef-landing.png',fullPage:false});
    if(key==='visit')await page.screenshot({path:'qa-artifacts/03-reserva-hero.png',fullPage:false});
  }

  const unique=new Set(positions.map(p=>`${Math.round(p.x/40)}:${Math.round(p.y/40)}:${Math.round(p.w/40)}`));
  if(unique.size<3)throw new Error('Dish did not visibly change position/scale across sections');
  if(Math.abs(positions.find(p=>p.key==='chef').x-positions.find(p=>p.key==='visit').x)<20)throw new Error('Chef and Visit landings are not visually distinct enough');

  await page.locator('#experience').evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.waitForTimeout(1000);
  await page.waitForFunction(()=>document.documentElement.dataset.journeySection==='origin',{timeout:6000});
  if(!(await journeyImage.isVisible()))throw new Error('Journey dish disappeared when scrolling back up');

  await page.click('.studio-open');
  await page.waitForTimeout(250);
  await page.click('.studio-nav [data-panel="motion"]');
  await page.waitForSelector('#class7-journey-toggle');
  await page.locator('#class7-journey-toggle [data-value="off"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.dishJourneyEnabled==='false');
  await page.waitForFunction(()=>document.documentElement.dataset.dishJourney==='inactive');
  await page.waitForTimeout(650);
  const savedOff=await page.evaluate(async()=>{const p=await window.RestaurantStore.loadProject();return p?.config?.motion?.dishJourney});
  if(savedOff!==false)throw new Error('Dish Journey OFF did not persist');

  await page.locator('#class7-journey-toggle [data-value="on"]').click();
  await page.waitForFunction(()=>document.documentElement.dataset.dishJourneyEnabled==='true');
  await page.waitForTimeout(650);
  const savedOn=await page.evaluate(async()=>{const p=await window.RestaurantStore.loadProject();return p?.config?.motion?.dishJourney});
  if(savedOn!==true)throw new Error('Dish Journey ON did not persist');

  /* Mobile + reduced-motion QA on a clean context. */
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const mobile=await mobileContext.newPage();
  const mobileErrors=[];
  mobile.on('pageerror',e=>mobileErrors.push('pageerror: '+e.message));
  mobile.on('console',m=>{if(m.type()==='error')mobileErrors.push('console: '+m.text())});
  await mobile.goto('http://127.0.0.1:4173/index.html?lang=en',{waitUntil:'networkidle'});
  await ready(mobile);
  await openJourney(mobile);
  for(const [selector,key] of [['#experience','origin'],['.chef-section','chef'],['#visit','visit']]){
    await mobile.locator(selector).evaluate(el=>el.scrollIntoView({block:'center'}));
    await mobile.waitForTimeout(450);
    await mobile.waitForFunction(k=>document.documentElement.dataset.journeySection===k,key,{timeout:6000});
    const b=await mobile.locator('#class7-journey-image').boundingBox();
    if(!b||b.x<0||b.y<0||b.x+b.width>390||b.y+b.height>844)throw new Error(`Mobile/reduced-motion dish leaves viewport at ${key}: ${JSON.stringify(b)}`);
  }
  if(mobileErrors.length)throw new Error('Mobile/reduced-motion errors: '+mobileErrors.join('\n'));
  await mobileContext.close();

  if(errors.length)throw new Error(errors.join('\n'));
  console.log('CLASS7_DISH_JOURNEY_E2E_PASS');
  console.log(JSON.stringify({dish:'Gamba roja salvaje',alpha,path:['detail','origin','atmosphere','chef','visit','origin-back'],positions,panel:'OFF/ON persistence',mobile:'390x844 + reduced motion PASS',visualQA:['01-transit-atmosphere.png','02-chef-landing.png','03-reserva-hero.png']},null,2));
} finally {
  await browser.close();
}
