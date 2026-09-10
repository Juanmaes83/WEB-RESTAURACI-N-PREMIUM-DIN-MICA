/* CLASS 25 — BEVERAGE / ICE CREAM EXPERIENCE · Playwright visual/integration gate
   Proves the feature on the CURRENT approved Half Orbit line. The review overlay must
   feed both engine + SAME Studio without persisting fixture data into Project State. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tests','screenshots','class25-beverages');fs.mkdirSync(OUT,{recursive:true});
const target=process.argv[2],local=target?null:await startServer(0),BASE=(target||local.url).replace(/\/$/,'');
const browser=await chromium.launch();const checks=[];const check=(n,ok,d='')=>{checks.push(ok);console.log(`${ok?'PASS':'FAIL'} ${n}${d?` — ${d}`:''}`)};
async function boot(page){const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${BASE}/?review=beverages`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.RestaurantBeveragesEngine?.state?.().ready===true,null,{timeout:40000});await page.waitForTimeout(650);return errors}
{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=await boot(page);
 const initial=await page.evaluate(()=>{const h=document.querySelector('#beverages'),img=h?.querySelector('.bev-media'),review=window.RestaurantBeveragesReview,studioState=window.RestaurantBeveragesStudio?.state?.();return {headers:document.querySelectorAll('header.topbar').length,studios:document.querySelectorAll('#studio').length,beverages:!!h,title:h?.querySelector('.bev-title')?.textContent.trim(),active:h?.dataset.activeItem,imgSrc:img?.getAttribute('src')||'',imgReady:!!img&&img.complete&&img.naturalWidth>0,halfOrbit:!!window.RestaurantHalfOrbit,governanceApi:!!window.RestaurantMotionGovernance,libraryCount:window.RestaurantMotionLibrary?.count?.()||0,bevTab:!!document.querySelector('#studio .studio-nav [data-panel="beverages"]'),motionTab:!!document.querySelector('#studio .studio-nav [data-panel="motion"]'),optionCount:h?.querySelectorAll('.bev-option').length||0,selected:review?.selectedAssets||[],allAssets:review?.allAssets||[],studioCount:studioState?.items?.length||0,studioTitle:studioState?.title||'',reviewTraveler:document.documentElement.dataset.class25ReviewTraveler||'',travelerActive:document.documentElement.dataset.scrollTraveler||''};});
 check('latest line · exactly one original top navigation',initial.headers===1,String(initial.headers));
 check('latest line · exactly one Restaurant Studio',initial.studios===1,String(initial.studios));
 check('Ice Cream Experience mounts in real page',initial.beverages&&initial.title==='Un helado. Un mundo.',initial.title);
 check('first selected repo-local helado paints',initial.imgReady&&/HELADO(?:%20| )1\.jpg/i.test(initial.imgSrc),initial.imgSrc);
 check('four coherent helados are wired to selector',initial.optionCount===4&&initial.selected.length===4,`${initial.optionCount}/${initial.selected.join(',')}`);
 check('all eleven HELADO assets are inventoried',initial.allAssets.length===11,String(initial.allAssets.length));
 check('review and SAME Studio resolve the same four-item state',initial.studioCount===4&&initial.studioTitle==='Un helado. Un mundo.',`${initial.studioCount}/${initial.studioTitle}`);
 check('Beverage review starts with Traveler visually OFF',initial.reviewTraveler==='off'&&!initial.travelerActive,`${initial.reviewTraveler}/${initial.travelerActive}`);
 check('Half Orbit runtime is still present',initial.halfOrbit);
 check('Motion Governance API remains present',initial.governanceApi);
 check('Motion Library still has 12 existing engines',initial.libraryCount===12,String(initial.libraryCount));
 check('Bebidas and Motion are separate Studio tabs',initial.bevTab&&initial.motionTab);
 await page.locator('#beverages').screenshot({path:path.join(OUT,'01-helado-desktop.png')});
 const expected=['HELADO 1.jpg','HELADO 2.jpg','HELADO 3.jpg','HELADO 4.jpg'];let allLocal=true,allReady=true,worlds=new Set();
 for(let i=0;i<4;i++){
   if(i>0){await page.click(`.bev-option[data-index="${i}"]`);await page.waitForFunction(index=>document.querySelector('#beverages')?.dataset.activeItem===`review-helado-${index+1}`,i,{timeout:6000});await page.waitForTimeout(1250)}
   const v=await page.evaluate(()=>{const h=document.querySelector('#beverages'),img=h.querySelector('.bev-media');return {src:img.getAttribute('src')||'',ready:img.complete&&img.naturalWidth>0,bg:getComputedStyle(h).getPropertyValue('--bev-backdrop'),transition:window.RestaurantBeveragesEngine.state().transition}});
   allLocal=allLocal&&v.src.startsWith('assets/half-orbit/dishes-transparent/')&&v.src.includes(expected[i]);allReady=allReady&&v.ready;worlds.add(v.bg);check(`helado ${i+1} transition settles`,v.transition==='settled',v.transition);
 }
 check('selected family uses only repo-local HELADO 1–4 assets',allLocal);
 check('all four selected helado images paint',allReady);
 check('each helado changes the visual world',worlds.size===4,String(worlds.size));

 /* Prove review edits flow through the same StudioConfig surface but stay session-only. */
 await page.click('.bev-option[data-index="0"]');await page.waitForTimeout(1250);
 const overlay=await page.evaluate(async()=>{
   const original=window.RestaurantStudioConfig.__class25ReviewOverlay;
   const before=JSON.stringify(original?.get?.('beverages')??null);
   window.RestaurantStudioConfig.set('beverages.items.0.name','Red Velvet Session');
   await new Promise(r=>setTimeout(r,120));
   const effective=window.RestaurantBeveragesStudio.state();
   const painted=document.querySelector('#beverages .bev-name')?.textContent.trim();
   const after=JSON.stringify(original?.get?.('beverages')??null);
   window.RestaurantStudioConfig.set('beverages.items.0.name','Red Velvet');
   return {before,after,effective:effective.items?.[0]?.name,painted};
 });
 check('review edit updates Studio and engine together',overlay.effective==='Red Velvet Session'&&overlay.painted==='Red Velvet Session',JSON.stringify(overlay));
 check('review fixture edits do not persist into durable Project State',overlay.before===overlay.after,`${overlay.before} -> ${overlay.after}`);

 /* Simulate a previously saved Traveler=ON. The Class25 review guardian must suppress
    the visual runtime without changing Class14 code. This browser context is disposable. */
 await page.evaluate(()=>window.RestaurantStudioConfig.set('scrollTraveler.enabled',true));
 await page.waitForTimeout(900);
 const travelerGuard=await page.evaluate(()=>({runtime:document.documentElement.dataset.scrollTraveler||'',active:document.querySelector('#scroll-traveler')?.classList.contains('is-active')||false,guard:document.documentElement.dataset.class25ReviewTraveler||''}));
 check('review suppresses persisted Traveler=ON at runtime',travelerGuard.guard==='off'&&!travelerGuard.runtime&&!travelerGuard.active,JSON.stringify(travelerGuard));

 await page.click('.studio-open');await page.waitForTimeout(300);
 await page.click('#studio .studio-nav [data-panel="motion"]');await page.evaluate(()=>window.RestaurantMotionGovernance?.apply?.());
 await page.waitForFunction(()=>window.RestaurantMotionGovernance?.state?.().grouped===true&&document.querySelectorAll('.st-studio-governed').length===1,null,{timeout:5000});
 const motion=await page.evaluate(()=>{const box=document.querySelector('#studio [data-path="scrollTraveler.enabled"]');return {groups:window.RestaurantMotionGovernance.state().groups,travelerTuner:document.querySelectorAll('.st-studio-governed').length,motionActive:document.querySelector('#studio .studio-nav button.active')?.dataset.panel,travelerChecked:box?.checked,travelerDisabled:box?.disabled}});
 check('Motion Governance exposes preset/page/experience groups',motion.groups.includes('preset')&&motion.groups.includes('page')&&motion.groups.includes('experience'),motion.groups.join(','));
 check('Scroll Traveler remains a single transversal tuner',motion.travelerTuner===1&&motion.motionActive==='motion',JSON.stringify(motion));
 check('review shows Traveler OFF and locked without mutating Class24',motion.travelerChecked===false&&motion.travelerDisabled===true,JSON.stringify(motion));
 await page.evaluate(()=>window.RestaurantBeveragesStudio.open());await page.waitForTimeout(220);
 const studio=await page.evaluate(()=>({open:document.querySelector('#studio')?.classList.contains('is-open'),active:document.querySelector('#studio .studio-nav button.active')?.dataset.panel,panels:document.querySelectorAll('#studio').length,motionTabs:document.querySelectorAll('#studio .studio-nav [data-panel="motion"]').length,bevTabs:document.querySelectorAll('#studio .studio-nav [data-panel="beverages"]').length,cards:document.querySelectorAll('#studio [data-bev-card]').length,title:window.RestaurantBeveragesStudio.state().title}));
 check('Bebidas opens inside SAME Studio',studio.open&&studio.active==='beverages'&&studio.panels===1,JSON.stringify(studio));
 check('Studio keeps Motion and Bebidas as separate single tabs',studio.motionTabs===1&&studio.bevTabs===1,JSON.stringify(studio));
 check('Bebidas Studio visibly receives the four review products',studio.cards===4&&studio.title==='Un helado. Un mundo.',JSON.stringify(studio));
 await page.screenshot({path:path.join(OUT,'02-helado-studio.png'),fullPage:false});check('desktop · no JS page errors',errors.length===0,errors.join(' | '));await ctx.close();
}
{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=await boot(page);const m=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,rect:(()=>{const r=document.querySelector('#beverages')?.getBoundingClientRect();return r&&{left:r.left,right:r.right,width:r.width}})(),img:(()=>{const i=document.querySelector('.bev-media');return !!i&&i.complete&&i.naturalWidth>0})(),count:document.querySelectorAll('.bev-option').length,traveler:document.documentElement.dataset.scrollTraveler||''}));check('mobile 390 · no horizontal overflow',m.scrollWidth<=m.width,`${m.scrollWidth}/${m.width}`);check('mobile · helado asset paints',m.img);check('mobile · four-item selector remains intact',m.count===4,String(m.count));check('mobile review · Traveler remains visually OFF',!m.traveler,m.traveler);await page.locator('#beverages').screenshot({path:path.join(OUT,'03-helado-mobile.png')});check('mobile · no JS page errors',errors.length===0,errors.join(' | '));await ctx.close();
}
{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();await boot(page);const first=await page.evaluate(()=>document.querySelector('#beverages').dataset.activeItem);await page.click('.bev-option[data-index="1"]');await page.waitForTimeout(100);const second=await page.evaluate(()=>document.querySelector('#beverages').dataset.activeItem);check('reduced motion · selector remains functional',first!==second,`${first} -> ${second}`);await ctx.close();
}
await browser.close();if(local)await new Promise(r=>local.server.close(r));const passed=checks.filter(Boolean).length;console.log(`\n${passed}/${checks.length} ${passed===checks.length?'CLASS25_BEVERAGE_PASS':'CLASS25_BEVERAGE_FAIL'}`);if(passed!==checks.length)process.exitCode=1;