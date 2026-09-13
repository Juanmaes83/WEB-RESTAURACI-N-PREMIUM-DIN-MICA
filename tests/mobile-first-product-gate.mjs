/* Public product gate. No mouse-drag substitution for native Chromium touch.
   BASELINE=1 records failures without stopping; BASE_URL targets a real deployment. */
import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs';
import {startServer} from './static-server.mjs';
const baseline=process.env.BASELINE==='1';
const phase=baseline?'before':(process.env.BASE_URL?'live':'after');
const out=`output/playwright/mobile-first/${phase}`;
fs.mkdirSync(out,{recursive:true});
const local=process.env.BASE_URL?null:await startServer(0);
const url=process.env.BASE_URL||local.url;
const report={url,phase,date:new Date().toISOString(),limitations:['Emulation is not a physical phone. WebKit has touch emulation but no native multi-point swipe API; native scroll/drag proof uses Chromium CDP.','Local unthrottled cold contexts; transfer sizes exclude cross-origin resources without Timing-Allow-Origin. LCP/CLS are lab observations, not field percentiles.'],runs:[]};
const sizes=[[360,800],[390,844],[430,932],[844,390],[768,1024],[1440,900]];
async function touch(page,dx,dy,{tiny=false}={}){
  const stage=page.locator(await page.locator('.hos-stage:visible').count()?'.hos-stage':'.orbit-shell');
  await stage.evaluate(n=>window.scrollTo({top:n.getBoundingClientRect().top+scrollY-100,behavior:'instant'}));
  await page.waitForTimeout(350);
  const b=await stage.boundingBox(),v=page.viewportSize();
  const preferredY=v.height<500?230:Math.min(v.height-110,Math.max(260,b.y+Math.min(b.height*.4,350)));
  // Hit-test the actual stage, never the fixed chrome or a product-name button.
  const point=await page.evaluate(({b,y})=>{
    for(const cy of [y,y-20,y+15])for(const fraction of [.62,.72,.42,.52,.82]){
      const x=b.x+b.width*fraction,el=document.elementFromPoint(x,cy);
      if(x<190||cy<210)continue;
      const nearControl=[...document.querySelectorAll('.hos-stage button:not(:disabled),.mobile-actions,.topbar')].some(n=>{
        const r=n.getBoundingClientRect();return r.width&&x>r.left-20&&x<r.right+20&&cy>r.top-20&&cy<r.bottom+20;
      });
      if(!nearControl&&el?.closest('.hos-stage,.orbit-shell')&&!el.closest('button:not(.orbit-dish),a,input,select,textarea'))return {x,y:cy,target:el.className};
    }
    return null;
  },{b,y:preferredY});
  if(!point)throw new Error('No unobstructed stage surface for a 240px native swipe');
  const {x,y}=point;
  if(dy<0)dy=-Math.min(-dy,y-20);
  const read=()=>page.evaluate(()=>({scroll:scrollY,index:window.RestaurantHalfOrbit?.state?.().mode==='half-orbit'?RestaurantHalfOrbit.state().activeIndex:RestaurantOrbit.getActiveIndex(),dragging:window.RestaurantHalfOrbit?.state?.().dragging,gesture:document.documentElement.dataset.orbitalMotion==='half-orbit'?document.querySelector('.hos-stage')?.dataset.gesture:document.querySelector('.orbit-shell')?.dataset.gesture,progress:window.RestaurantHalfOrbit?.state?.().progress,detail:document.querySelector('#dish-detail')?.getAttribute('aria-hidden')}));
  const before=await read();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  const down=await read();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+3,y:y+3,id:1}]});
  const undecided=await read();
  for(let i=1;i<=12;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dy*i/12,id:1}]});
    await page.waitForTimeout(18);
  }
  const held=await read();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(1400);await cdp.detach();
  return {before,down,undecided,held,after:await read(),point:{x,y}};
}
for(const engine of (process.env.BROWSERS||'chromium,webkit').split(',')){
 const browser=await ({chromium,webkit}[engine]).launch();
 for(const [width,height] of sizes){
  if(process.env.VIEWPORT&&width!==Number(process.env.VIEWPORT))continue;
  if(engine==='webkit'&&width===1440)continue;
  const mobile=width<1000,context=await browser.newContext({...mobile?(engine==='webkit'?devices['iPhone 13']:devices['Pixel 5']):{},viewport:{width,height},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(12000);
  const run={engine,width,height,checks:[],errors:[],failedResources:[],sameOrigin4xx:[]};report.runs.push(run);
  const press=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const check=(name,pass,evidence)=>{run.checks.push({name,pass:!!pass,evidence});console.log(`${pass?'PASS':'FAIL'} ${engine} ${width}x${height} ${name}`)};
  const step=async(name,fn)=>{try{await fn()}catch(e){check(name,false,e.message)}};
  page.on('pageerror',e=>run.errors.push(e.message));
  page.on('requestfailed',r=>run.failedResources.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400&&r.status()<500&&new URL(r.url()).origin===new URL(url).origin)run.sameOrigin4xx.push({url:r.url(),status:r.status()})});
  await page.addInitScript(()=>{
    window.__mobileMetrics={cls:0,lcp:null,longTasks:[]};
    for(const type of ['layout-shift','largest-contentful-paint','longtask']){
      if(!PerformanceObserver.supportedEntryTypes.includes(type))continue;
      new PerformanceObserver(list=>{for(const e of list.getEntries()){
        if(type==='layout-shift'&&!e.hadRecentInput)__mobileMetrics.cls+=e.value;
        if(type==='largest-contentful-paint')__mobileMetrics.lcp=e.startTime;
        if(type==='longtask')__mobileMetrics.longTasks.push(e.duration);
      }}).observe({type,buffered:true});
    }
  });
  await step('boot',async()=>{
    await page.goto(url,{waitUntil:'load'});
    await page.waitForFunction(()=>window.RestaurantProductDetail?.state?.().ready&&document.querySelectorAll('.orbit-dish').length>2);
    await page.waitForTimeout(1200);
    run.metrics=await page.evaluate(()=>{
      const resources=performance.getEntriesByType('resource'),n=performance.getEntriesByType('navigation')[0];
      const count=re=>resources.filter(r=>re.test(r.name.split('?')[0])).length;
      return {requests:resources.length+1,js:count(/\.m?js$/),css:count(/\.css$/),images:count(/\.(png|webp|jpe?g|svg|avif)$/),video:count(/\.(mp4|webm)$/),measuredTransferBytes:resources.reduce((s,r)=>s+r.transferSize,0)+n.transferSize,unmeasuredResources:resources.filter(r=>!r.transferSize).length,DOMContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,...__mobileMetrics,resourceSizes:resources.filter(r=>r.transferSize>500000).map(r=>({url:r.name,bytes:r.transferSize}))};
    });
    if(mobile){
      await page.evaluate(()=>document.addEventListener('touchstart',()=>window.__touchSeen=true,{once:true}));
      await page.touchscreen.tap(4,90);
      check('mobile device context',await page.evaluate(()=>window.__touchSeen&&matchMedia('(pointer:coarse)').matches));
      run.device=await page.evaluate(()=>({userAgent:navigator.userAgent,maxTouchPoints:navigator.maxTouchPoints,coarse:matchMedia('(pointer:coarse)').matches}));
    }else check('desktop context',true);
    check('module defaults OFF',await page.locator('[data-public-module]').count()===0);
    for(const motion of ['no-preference','reduce']){
      await page.emulateMedia({reducedMotion:motion});
      if([390,430,1440].includes(width))for(const [name,selector] of [['hero','.hero'],['menu','#signature'],['visit','#visit']]){
        await page.locator(selector).evaluate(n=>n.scrollIntoView({behavior:'instant',block:'start'}));await page.waitForTimeout(450);
        await page.screenshot({path:`${out}/${engine}-${width}-${motion}-${name}.png`});
      }
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
    run.targets=await page.locator('.topbar a,.topbar button,#explore-dish,#prev-dish,#next-dish,#visit-cta,.hero .text-link').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{const r=n.getBoundingClientRect();return {selector:n.id||n.className,text:n.textContent.trim(),width:r.width,height:r.height}}));
    check('critical targets >=44',!mobile||run.targets.every(r=>r.width>=44&&r.height>=44),run.targets);
    check('functional copy >=16',!mobile||await page.locator('#dish-short,#address-text,#service-text,#contact-text').evaluateAll(a=>a.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)));
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    check('task navigation first viewport',!mobile||await page.locator('.mobile-actions a[href="#signature"]').isVisible());
    if(mobile&&!baseline){
      await press('.mobile-actions a[href="#signature"]');
      await page.waitForFunction(()=>Math.abs(document.querySelector('#signature').getBoundingClientRect().top-100)<10);
      check('menu in one action',true);
      await press('.mobile-actions [data-mobile-visit]');
      await page.waitForFunction(()=>document.querySelector('#visit').getBoundingClientRect().top<innerHeight/2);
      check('visit in one action',true);
    }
  });
  if(engine==='chromium'&&mobile)for(const mode of ['elegant','half-orbit','urban','orbital-food'])await step(`${mode} gestures`,async()=>{
    await page.evaluate(mode=>{RestaurantStudioConfig.set('motion.orbitalStyle',mode);RestaurantMotionStudio.publish()},mode);
    await page.waitForTimeout(650);
    if(mode==='half-orbit')await page.waitForFunction(()=>RestaurantHalfOrbit.state().ready);
    for(const [name,dx,dy] of [['vertical',5,-240],['horizontal',-175,5],['diagonal',-8,-220]]){
      const evidence=await touch(page,dx,dy);(run.gestures??=[]).push({mode,name,...evidence});
      check(`${mode} ${name}`,name==='horizontal'?evidence.after.index!==evidence.before.index&&Math.abs(evidence.after.scroll-evidence.before.scroll)<8:evidence.after.scroll-evidence.before.scroll>100&&evidence.after.index===evidence.before.index,evidence);
      check(`${mode} undecided threshold`,evidence.undecided.gesture==='undecided'&&evidence.undecided.dragging!==true,evidence.undecided);
      if(evidence.after.detail==='false'){await page.locator('#detail-close').click();await page.waitForTimeout(800)}
    }
  });
  await step('public detail and reservation',async()=>{
    await page.evaluate(()=>{RestaurantStudioConfig.set('motion.orbitalStyle','half-orbit');RestaurantMotionStudio.publish()});
    await page.waitForFunction(()=>window.RestaurantHalfOrbit?.state?.().ready);
    await press('.hos-detail');
    await page.waitForFunction(()=>document.querySelector('#dish-detail').getAttribute('aria-hidden')==='false');
    await page.waitForTimeout(850);
    check('product detail opens',await page.locator('#detail-title').innerText());
    const boxes=await page.locator('#detail-close,.detail-reserve').evaluateAll(a=>a.map(n=>{const r=n.getBoundingClientRect();return {width:r.width,height:r.height}}));
    check('detail targets >=44',!mobile||boxes.every(r=>r.width>=44&&r.height>=44),boxes);
    check('one detail',await page.locator('#dish-detail.is-open,.upd-dialog.is-open').count()===1);
    check('navigation yields to detail',!mobile||!(await page.locator('.mobile-actions').isVisible()));
    if([390,430,1440].includes(width))await page.screenshot({path:`${out}/${engine}-${width}-detail.png`});
    await page.locator('#dish-detail').evaluate(n=>n.scrollTop=n.scrollHeight);
    const closeBox=await page.locator('#detail-close').boundingBox();
    check('detail close stays reachable',closeBox.y>=0&&closeBox.y+closeBox.height<=height);
    await press('.detail-reserve');
    await page.waitForFunction(()=>document.querySelector('#reserve-dialog').open);
    check('reservation from detail',await page.locator('#reserve-dialog').isVisible());
    await page.locator('#reserve-form [name=name]').fill('Mobile QA');
    await page.locator('#reserve-form [name=email]').fill('mobile@example.invalid');
    await page.locator('#reserve-form [name=date]').fill('2027-06-20');
    await press('#reserve-form button[type=submit]');
    check('reservation demo feedback',await page.locator('#reserve-success').isVisible());
    await press('#reserve-dialog .modal-close');
    if(await page.locator('#dish-detail').getAttribute('aria-hidden')==='false')await press('#detail-close');
    await page.waitForTimeout(800);
  });
  await step('optional modules ON / OFF',async()=>{
    // Fixture follows the same canonical API as Studio; never changes published defaults.
    await page.evaluate(()=>{
      RestaurantStudioConfig.set('modules.location.address.street','Paseo Vistalegre 12');
      RestaurantStudioConfig.set('modules.location.address.city','Torrevieja');
      RestaurantStudioConfig.set('modules.location.hours','13:00–23:00');
      RestaurantStudioConfig.set('modules.location.enabled',true);
      RestaurantStudioConfig.set('modules.whatsapp.phone','+34 600 123 456');
      RestaurantStudioConfig.set('modules.whatsapp.enabled',true);
    });
    await page.waitForSelector('.wa-launcher');await page.waitForSelector('[data-location-module]');
    check('Maps privacy before tap',await page.locator('#module-location iframe').count()===0);
    check('Maps destination',await page.locator('#module-location a[href*="google"]').count()>0);
    check('WhatsApp destination',/^https:\/\/wa.me\//.test(await page.locator('.wa-launcher').getAttribute('href')));
    if(mobile){
      const wa=await page.locator('.wa-launcher').boundingBox(),nav=await page.locator('.mobile-actions').boundingBox();
      check('WhatsApp / navigation no collision',wa.y+wa.height<=nav.y, {wa,nav});
      check('location nav follows ON',await page.locator('[data-mobile-visit]').getAttribute('href')==='#module-location');
    }
    await page.locator('#module-location').evaluate(n=>n.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(300);
    if([390,430,1440].includes(width))await page.screenshot({path:`${out}/${engine}-${width}-location.png`});
    await press('.topbar .reserve-open');
    check('reservation covers floating UI',await page.evaluate(()=>{const r=document.querySelector('#reserve-dialog').getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+30)?.closest('#reserve-dialog')!==null}));
    await press('#reserve-dialog .modal-close');
    await page.evaluate(()=>{RestaurantStudioConfig.set('modules.location.enabled',false);RestaurantStudioConfig.set('modules.whatsapp.enabled',false)});
    await page.waitForFunction(()=>!document.querySelector('[data-public-module]'));
    check('OFF removes modules',await page.locator('[data-public-module]').count()===0);
  });
  await step('whole page overflow',async()=>{
    const evidence=await page.evaluate(async()=>{
      const results=[];
      for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.7){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,40));results.push({y,overflow:document.documentElement.scrollWidth-innerWidth})}
      return results;
    });
    check('horizontal overflow 0',evidence.every(r=>r.overflow<=1),evidence.filter(r=>r.overflow>1));
  });
  check('JS errors 0',run.errors.length===0,run.errors);
  check('same-origin 4xx 0',run.sameOrigin4xx.length===0,run.sameOrigin4xx);
  await context.close();
  fs.writeFileSync(`${out}/results.json`,JSON.stringify(report,null,2));
 }
 await browser.close();
}
local?.server.close();
if(baseline)fs.writeFileSync('docs/mobile-first-baseline.json',JSON.stringify(report,null,2));
const failed=report.runs.flatMap(r=>r.checks.filter(c=>!c.pass).map(c=>`${r.engine} ${r.width} ${c.name}`));
console.log(JSON.stringify({runs:report.runs.length,failed},null,2));
if(failed.length&&!baseline)process.exitCode=1;
