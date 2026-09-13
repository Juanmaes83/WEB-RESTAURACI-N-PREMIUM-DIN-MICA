import {chromium} from 'playwright';
import {startServer} from './static-server.mjs';

const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const {server,url:BASE}=await startServer(0);
let browser;

try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const pageErrors=[];
  const badResources=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('response',response=>{
    if(response.url().startsWith(BASE)&&response.status()>=400)badResources.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.RestaurantStudioConfig&&window.RestaurantStudioPreview,{timeout:30000});
  await page.locator('.studio-open').click();
  await page.waitForFunction(()=>document.body.classList.contains('studio-open'));
  await page.waitForSelector('#studio-preview-frame');

  const frameHandle=await page.locator('#studio-preview-frame').elementHandle();
  const frame=await frameHandle.contentFrame();
  assert(frame,'C1 preview iframe did not create a content frame');
  await frame.waitForFunction(()=>document.documentElement.dataset.previewState==='parent',{timeout:30000});

  const mobile=await frame.evaluate(()=>({
    width:innerWidth,height:innerHeight,
    mobileQuery:matchMedia('(max-width:980px)').matches,
    mobileNav:getComputedStyle(document.querySelector('.mobile-actions')).display,
    desktopNav:getComputedStyle(document.querySelector('.desktop-nav')).display,
    persistence:document.documentElement.dataset.previewPersistence,
    child:document.documentElement.dataset.studioPreview
  }));
  assert(mobile.width===390&&mobile.height===844,`Mobile M viewport is ${mobile.width}x${mobile.height}, expected 390x844`);
  assert(mobile.mobileQuery,'Mobile media query does not evaluate inside iframe');
  assert(mobile.mobileNav!=='none','Mobile navigation is hidden in Mobile M preview');
  assert(mobile.desktopNav==='none','Desktop navigation is visible in Mobile M preview');
  assert(mobile.child==='child','Preview renderer is not marked as child');
  assert(mobile.persistence==='readonly','Preview renderer is not read-only');

  /* Preserve the original C1 proof that parent Project State re-renders the child. */
  const testName=`C1 PREVIEW ${Date.now()}`;
  await page.evaluate(name=>window.RestaurantStudioConfig.set('brand.name',name),testName);
  await frame.waitForFunction(name=>window.RestaurantStudioConfig?.get('brand.name')===name,testName);
  await frame.waitForFunction(name=>document.title.startsWith(name),testName);

  /* C1 must replay the canonical Motion side effects, not only hydrate Project State.
     The original regression left motion.orbitalStyle updated while data-orbital-motion
     and the mounted engine stayed on the previous choreography. */
  const setMotion=async mode=>{
    await page.evaluate(value=>window.RestaurantStudioConfig.set('motion.orbitalStyle',value),mode);
    await frame.waitForFunction(value=>window.RestaurantStudioConfig?.get('motion.orbitalStyle')===value,mode,{timeout:30000});
    await frame.waitForFunction(value=>document.documentElement.dataset.orbitalMotion===value,mode,{timeout:30000});
    return frame.evaluate(()=>({
      config:window.RestaurantStudioConfig?.get('motion.orbitalStyle'),
      select:document.getElementById('motion-orbital-style')?.value,
      runtime:document.documentElement.dataset.orbitalMotion,
      choreography:document.documentElement.dataset.orbitalChoreography||''
    }));
  };

  const elegant=await setMotion('elegant');
  assert(elegant.config==='elegant'&&elegant.select==='elegant'&&elegant.runtime==='elegant',
    `Elegant did not reach runtime: ${JSON.stringify(elegant)}`);

  const depth=await setMotion('depth-carousel');
  await frame.waitForFunction(()=>document.documentElement.dataset.depthCarousel==='ready'&&document.querySelector('.dc-scene')?.hidden===false,{timeout:30000});
  assert(depth.config==='depth-carousel'&&depth.select==='depth-carousel'&&depth.runtime==='depth-carousel',
    `Depth Carousel did not reach runtime: ${JSON.stringify(depth)}`);

  const half=await setMotion('half-orbit');
  await frame.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready===true&&document.querySelector('.hos-stage')?.hidden===false,{timeout:30000});
  assert(half.config==='half-orbit'&&half.select==='half-orbit'&&half.runtime==='half-orbit',
    `Half Orbit did not reach runtime: ${JSON.stringify(half)}`);

  const orbital=await setMotion('orbital-food');
  assert(orbital.config==='orbital-food'&&orbital.select==='orbital-food'&&orbital.runtime==='orbital-food',
    `Orbital Food did not reach runtime: ${JSON.stringify(orbital)}`);

  await page.evaluate(()=>window.RestaurantStudioConfig.set('motion.text.hero','mask'));
  await frame.waitForFunction(()=>document.documentElement.dataset.textHero==='mask',{timeout:10000});
  await page.evaluate(()=>window.RestaurantStudioConfig.set('motion.media.hero','slowZoom'));
  await frame.waitForFunction(()=>document.documentElement.dataset.mediaHero==='slowZoom',{timeout:10000});
  const motionDerived=await frame.evaluate(()=>({
    text:document.documentElement.dataset.textHero,
    media:document.documentElement.dataset.mediaHero,
    orbital:document.documentElement.dataset.orbitalMotion
  }));
  assert(motionDerived.text==='mask'&&motionDerived.media==='slowZoom'&&motionDerived.orbital==='orbital-food',
    `Derived Motion datasets are stale: ${JSON.stringify(motionDerived)}`);

  const backToElegant=await setMotion('elegant');
  assert(backToElegant.runtime==='elegant','Preview did not return to the baseline engine after Motion switching');

  await page.evaluate(()=>window.RestaurantStudioPreview.setPreset('desktop'));
  await frame.waitForFunction(()=>innerWidth===1440&&innerHeight===900,{timeout:10000});
  const desktop=await frame.evaluate(()=>({
    width:innerWidth,height:innerHeight,
    mobileQuery:matchMedia('(max-width:980px)').matches,
    mobileNav:getComputedStyle(document.querySelector('.mobile-actions')).display,
    desktopNav:getComputedStyle(document.querySelector('.desktop-nav')).display,
    name:window.RestaurantStudioConfig?.get('brand.name')
  }));
  assert(!desktop.mobileQuery,'Desktop preview still matches mobile media query');
  assert(desktop.mobileNav==='none','Mobile navigation is visible in desktop preview');
  assert(desktop.desktopNav!=='none','Desktop navigation is hidden in desktop preview');
  assert(desktop.name===testName,'Project State was lost when switching viewport');

  await page.evaluate(()=>window.RestaurantStudioPreview.setPreset('landscape'));
  await frame.waitForFunction(()=>innerWidth===844&&innerHeight===390);
  const landscapeName=await frame.evaluate(()=>window.RestaurantStudioConfig?.get('brand.name'));
  assert(landscapeName===testName,'Project State was lost in landscape preview');

  await page.evaluate(()=>window.RestaurantStudioPreview.setPreset('mobile-m'));
  await frame.waitForFunction(()=>innerWidth===390&&innerHeight===844);
  await frame.locator('#explore-dish').click();
  await frame.waitForFunction(()=>document.querySelector('#dish-detail')?.classList.contains('is-open'));
  await frame.locator('#detail-close').click();
  await frame.waitForFunction(()=>!document.querySelector('#dish-detail')?.classList.contains('is-open'));
  await frame.locator('.mobile-actions .reserve-open').click();
  await frame.waitForFunction(()=>document.querySelector('#reserve-dialog')?.open===true);
  await frame.locator('#reserve-dialog .modal-close').click();

  await page.evaluate(()=>window.RestaurantStudioConfig.set('modules.location.enabled',true));
  await frame.waitForFunction(()=>window.RestaurantStudioConfig?.get('modules.location.enabled')===true);
  await frame.waitForFunction(()=>document.querySelector('[data-mobile-visit]')?.getAttribute('href')==='#module-location');
  await page.evaluate(()=>window.RestaurantStudioConfig.set('modules.location.enabled',false));
  await frame.waitForFunction(()=>window.RestaurantStudioConfig?.get('modules.location.enabled')===false);
  await frame.waitForFunction(()=>document.querySelector('[data-mobile-visit]')?.getAttribute('href')==='#visit');

  const overflow=await frame.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
  assert(overflow===0,`Preview has ${overflow}px horizontal overflow at 390px`);
  assert(pageErrors.length===0,`Fatal JS errors: ${pageErrors.join(' | ')}`);
  assert(badResources.length===0,`Same-origin failed resources: ${badResources.join(' | ')}`);

  console.log('STUDIO_REAL_PREVIEW_PASS');
  console.log(JSON.stringify({mobile,motion:{elegant,depth,half,orbital,derived:motionDerived,backToElegant},desktop,landscape:{width:844,height:390},overflow},null,2));
} finally {
  if(browser)await browser.close();
  server.close();
}
