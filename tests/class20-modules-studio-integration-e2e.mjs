import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {startServer} from './static-server.mjs';
const shots=path.resolve(process.env.BASE_URL?'output/playwright/class20/live':'output/playwright/class20');fs.mkdirSync(shots,{recursive:true});
const local=process.env.BASE_URL?null:await startServer(0),url=process.env.BASE_URL||local.url;
const browser=await chromium.launch();const results=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
const errors=[],maps=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/https:\/\/(?:[^/]+\.)?(?:google\.com|goo\.gl)\/(?:maps|.*output=embed)/.test(r.url()))maps.push(r.url())});
const check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('PASS',name)};
const state=()=>page.evaluate(()=>RestaurantStudioConfig.snapshot());
const waitSave=()=>page.waitForFunction(()=>document.querySelector('#studio-status').dataset.state==='saved');
async function boot(){await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3);await waitSave()}
async function modules(key){await page.evaluate(()=>RestaurantStudioShell.open());await page.locator('.studio-nav [data-panel="modules"]').click();if(key){const card=page.locator(`[data-module-card="${key}"]`);if(!await card.evaluate(n=>n.open))await card.locator('summary').click()}}
const control=p=>page.locator(`[data-path="modules.${p}"]`);
async function fill(p,value){await control(p).fill(value);await waitSave()}
async function select(p,value){await control(p).selectOption(value);await waitSave()}
async function toggle(p,on){await control(p).setChecked(on);await waitSave()}
async function shot(name,selector){await page.mouse.move(0,0);await page.waitForTimeout(250);if(selector)await page.locator(selector).screenshot({path:path.join(shots,name+'.png')});else await page.screenshot({path:path.join(shots,name+'.png')})}
try{
  await boot();
  check('clean project: all modules OFF',Object.values((await state()).modules).every(m=>m.enabled===false));
  check('OFF: zero public module DOM / iframe / Maps request',await page.locator('[data-public-module],iframe').count()===0&&maps.length===0);
  check('hidden Studio controls are not built at boot',await page.locator('.modules-panel').count()===0);
  await modules();check('one native panel, three module cards',await page.locator('.modules-panel').count()===1&&await page.locator('[data-module-card]').count()===3);await shot('01-studio-modules-overview','#studio');
  await modules('location');await fill('location.title','Ven a nuestra mesa');await fill('location.address.street','Paseo Vistalegre 12');await fill('location.address.city','Torrevieja');await fill('location.address.country','España');await fill('location.hours','Martes–domingo · 13:00–23:00');await toggle('location.enabled',true);
  await page.waitForSelector('[data-location-module]');check('Location ON and click-to-load without iframe',await page.locator('[data-location-module] iframe').count()===0&&maps.length===0);await shot('02-location-controls','#studio');
  await page.evaluate(()=>RestaurantStudioShell.close());await shot('05-public-location','#module-location');await page.locator('.lm-load-map').click();await page.waitForSelector('#module-location iframe');check('explicit interaction creates Google iframe',(await page.locator('#module-location iframe').getAttribute('src')).startsWith('https://www.google.com/maps'));
  await modules('location');
  for(const [preset,cls] of [['full-width-map','full-width'],['minimal-location','minimal'],['split-editorial','split-editorial']]){await select('location.design.preset',preset);check('Location preset '+preset,await page.locator('.lm-preset-'+cls).count()===1)}
  await select('location.maps.mode','embed');await fill('location.maps.embedUrl','https://google.com.evil.test/maps/embed');check('Location rejects hostile embed',await page.evaluate(()=>!LocationMapsModuleUtils.isAllowedGoogleMapUrl(RestaurantStudioConfig.get('modules.location.maps.embedUrl'),{embedOnly:true})));check('invalid embed falls back safely',await page.locator('#module-location iframe').count()===0);
  await select('location.maps.privacyMode','auto');await page.waitForSelector('#module-location iframe');check('auto uses safe address fallback',!(await page.locator('#module-location iframe').getAttribute('src')).includes('evil.test'));await select('location.maps.privacyMode','click-to-load');await select('location.maps.mode','address');
  await fill('location.cta.label','<img src=x onerror=alert(1)>');check('Location CTA text cannot inject HTML',await page.locator('.lm-directions img').count()===0);await fill('location.cta.label','Cómo llegar');
  await modules('social');await fill('social.heading','Sigamos cerca de la mesa');await fill('social.platforms.0.url','https://www.instagram.com/');await toggle('social.platforms.0.enabled',true);await toggle('social.enabled',true);await page.waitForSelector('[data-social-reputation]');await shot('03-social-controls','#studio');
  for(const preset of ['reputation-strip','social-minimal','editorial-footer']){await select('social.preset',preset);check('Social preset '+preset,await page.locator('.sr-'+preset).count()===1)}
  await fill('social.platforms.0.url','https://instagram.com.evil.test/');check('invalid social host produces no platform link',await page.locator('.sr-platforms a').count()===0);await fill('social.platforms.0.url','https://www.instagram.com/');
  check('Social extends original footer',await page.locator('body>footer #footer-left').count()===1&&await page.locator('body>footer [data-social-reputation]').count()===1);
  await page.evaluate(()=>RestaurantStudioShell.close());await shot('06-public-social-footer','body>footer');
  await modules('whatsapp');await fill('whatsapp.phone','+34 600 123 456');await fill('whatsapp.title','Tu mesa empieza aquí');await fill('whatsapp.message','Hola, mesa para 2 & terraza?');await toggle('whatsapp.enabled',true);await page.waitForSelector('.wa-launcher',{state:'attached'});await shot('04-whatsapp-controls','#studio');
  check('normalized phone / encoded message',await page.locator('.wa-launcher').getAttribute('href')==='https://wa.me/34600123456?text=Hola%2C%20mesa%20para%202%20%26%20terraza%3F');
  await page.evaluate(()=>RestaurantStudioShell.close());await page.locator('#visit').scrollIntoViewIfNeeded();await shot('07-whatsapp-floating');
  await modules('whatsapp');for(const mode of ['inline-concierge','direct-cta']){await select('whatsapp.mode',mode);check('WhatsApp mode '+mode,await page.locator('.wa-mode-'+mode).count()===1);await page.evaluate(()=>RestaurantStudioShell.close());await shot('08-whatsapp-'+mode,'#module-whatsapp');await modules('whatsapp')}
  await fill('whatsapp.phone','123');check('invalid phone: no external destination',await page.locator('#module-whatsapp a[href^="https:"]').count()===0);await fill('whatsapp.phone','+34 600 123 456');await select('whatsapp.mode','floating-launcher');
  const savedModules=(await state()).modules;await page.reload({waitUntil:'domcontentloaded'});await waitSave();await page.waitForSelector('.wa-launcher');check('ON + edited config persist through reload',JSON.stringify((await state()).modules)===JSON.stringify(savedModules));
  await modules('location');const old=(await state()).modules.location.title;await fill('location.title','Undo probe');await page.locator('.studio-nav [data-panel="project"]').click();await page.locator('#undo-btn').click();check('Undo follows shared history',(await state()).modules.location.title===old);await page.locator('#redo-btn').click();check('Redo follows shared history',(await state()).modules.location.title==='Undo probe');
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-config').click();const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));check('global export includes modules',!!exported.project?.config?.modules);
  await page.locator('#import-config').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await waitSave();check('global import preserves modules',(await state()).modules.whatsapp.enabled===true);
  await page.locator('.studio-nav [data-panel="motion"]').click();await page.waitForFunction(()=>window.RestaurantMotionLibrary?.state().available===11);check('Class 19 still exposes eleven engines',await page.evaluate(()=>RestaurantMotionLibrary.state().count===11));
  const moduleState=JSON.stringify((await state()).modules);
  for(const engine of ['elegant','pizza-slice-orbit','anchor-scenes','orbital-food']){
    await page.locator('#motion-orbital-style').selectOption(engine);await waitSave();await page.waitForTimeout(700);check(engine+' + Traveler + all modules coexist',(await state()).motion.orbitalStyle===engine&&(await state()).scrollTraveler.enabled===true&&await page.locator('[data-public-module]').count()===3);check(engine+' leaves modules unchanged',JSON.stringify((await state()).modules)===moduleState);
  }
  await modules('location');await fill('location.hours','13:00–23:30');check('module edit preserves selected Motion',(await state()).motion.orbitalStyle==='orbital-food');
  const links=await page.locator('[data-public-module] a[target="_blank"]').evaluateAll(a=>a.every(n=>n.rel.includes('noopener')&&n.rel.includes('noreferrer')));check('all external blank links protected',links);
  await page.setViewportSize({width:390,height:844});await modules();await shot('09-mobile-studio','#studio');await page.evaluate(()=>RestaurantStudioShell.close());await page.locator('#module-location').scrollIntoViewIfNeeded();await shot('10-mobile-public-modules');check('mobile: no document overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.emulateMedia({reducedMotion:'reduce'});check('reduced motion module transitions disabled',await page.locator('.wa-launcher').evaluate(n=>getComputedStyle(n).transitionDuration==='0s'));
  for(const key of ['location','social','whatsapp']){await modules(key);await toggle(key+'.enabled',false)}
  await page.reload({waitUntil:'domcontentloaded'});await waitSave();check('OFF persists and removes all public module DOM',Object.values((await state()).modules).every(m=>!m.enabled)&&await page.locator('[data-public-module],iframe').count()===0);
  check('no module storage implementation',!/(localStorage|indexedDB|sessionStorage)/.test(fs.readFileSync('class20-modules-studio.js','utf8')));
  check('no JavaScript runtime errors',errors.length===0);
}finally{fs.writeFileSync(path.join(shots,process.env.BASE_URL?'live-results.json':'results.json'),JSON.stringify({url,passed:results.length,results,errors},null,2));await browser.close();local?.server.close()}
