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

  const testName=`C1 PREVIEW ${Date.now()}`;
  await page.evaluate(name=>window.RestaurantStudioConfig.set('brand.name',name),testName);
  await frame.waitForFunction(name=>window.RestaurantStudioConfig?.get('brand.name')===name,testName);
  await frame.waitForFunction(name=>document.title.startsWith(name),testName);

  await page.selectOption('#preview-mode','desktop');
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

  await page.selectOption('#preview-mode','landscape');
  await frame.waitForFunction(()=>innerWidth===844&&innerHeight===390);
  const landscapeName=await frame.evaluate(()=>window.RestaurantStudioConfig?.get('brand.name'));
  assert(landscapeName===testName,'Project State was lost in landscape preview');

  await page.selectOption('#preview-mode','mobile-m');
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
  console.log(JSON.stringify({mobile,desktop,landscape:{width:844,height:390},overflow},null,2));
} finally {
  if(browser)await browser.close();
  server.close();
}
