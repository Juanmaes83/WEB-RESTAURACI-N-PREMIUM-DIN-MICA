/* PROJECT 07 PREMIUM — product-discovery contract.

   The approved motion engine has its own suite (class11, 94/94) and this one does not
   duplicate it: keeping that suite untouched and green IS the proof that the premium
   pass did not disturb the motor. What is asserted here is the product world:

     · every story element follows the ENGINE's active index, never a second selection;
     · eight chromatic worlds, switchable off for one brand accent;
     · the spin suppresses story detail while fast and restores it on settle;
     · commerce emits real intents and never fakes a completed transaction;
     · a null price is never rendered as a number;
     · an unregistered asset cannot reach production;
     · personalization writes through the existing project state and persists.

   Usage: node tests/class12-pizza-premium-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots');
fs.mkdirSync(SHOTS,{recursive:true});
const MANIFEST=JSON.parse(fs.readFileSync(path.join(ROOT,'assets','pizza-motion','slices-manifest.json'),'utf8'));

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function selectPreset(page,value,readyFlag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value,{timeout:30000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(readyFlag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',readyFlag,{timeout:20000});
}
const engineState=page=>page.evaluate(()=>window.RestaurantPizzaSliceOrbit.state());
const premiumState=page=>page.evaluate(()=>window.RestaurantPizzaPremium.state());
const settled=async page=>{
  await page.waitForFunction(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    return s.animating||s.spinning||s.dragging;
  },null,{timeout:2000}).catch(()=>{});
  await page.waitForFunction(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    return !s.animating&&!s.spinning&&!s.dragging
      &&Math.abs(s.progress-Math.round(s.progress))<1e-3;
  },null,{timeout:25000});
  await page.waitForTimeout(240);
};
/* the whole visible story, read from the DOM rather than from the adapter */
const storyOf=page=>page.evaluate(()=>({
  overline:document.querySelector('.pp-overline')?.textContent.trim(),
  lead:document.querySelector('.pp-lead')?.textContent.trim(),
  name:document.querySelector('.pp-name')?.textContent.trim(),
  tail:document.querySelector('.pp-tail')?.textContent.trim(),
  descriptor:document.querySelector('.pp-descriptor')?.textContent.trim(),
  ingredients:document.querySelector('.pp-ing-list')?.textContent.trim(),
  bgWord:document.querySelector('.pp-bg-word')?.textContent.trim(),
  bgIndex:document.querySelector('.pp-bg-index')?.textContent.trim(),
  bgName:document.querySelector('.pp-bg-name')?.textContent.trim(),
  counter:document.querySelector('.pp-counter')?.textContent.trim(),
  order:document.querySelector('.pp-order')?.textContent.trim(),
  accent:getComputedStyle(document.documentElement).getPropertyValue('--pp-accent').trim(),
  priceShown:!document.querySelector('.pp-price')?.hidden,
  priceText:document.querySelector('.pp-price')?.textContent.trim(),
  demoLabel:document.querySelector('.pp-editorial')?.dataset.demo,
  hero:document.querySelector('.ps-slice[data-hero="1"]')?.dataset.id,
  phase:document.querySelector('.orbital-section')?.dataset.ppPhase
}));

async function run(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile});
  const page=await context.newPage();
  const errors=[],bad=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400)bad.push(`${r.status()} ${r.url().split('/').pop()}`)});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaPremium==='ready',null,{timeout:20000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await settled(page);

  /* ---- 1. product story data ---- */
  const data=await page.evaluate(()=>{
    const cfg=window.RestaurantStudioConfig.get('pizzaSliceOrbit');
    return {count:(cfg.products||[]).length,
      allDemo:(cfg.products||[]).every(p=>p.demoContent===true),
      allNullPrice:(cfg.products||[]).every(p=>p.price===null),
      ids:(cfg.products||[]).map(p=>p.id),
      fields:(cfg.products||[]).every(p=>['id','name','ingredients','descriptor','mood',
        'headlineLead','headlineTail','accent','background','orderUrl','available','demoContent']
        .every(k=>k in p)),
      brand:Object.keys(cfg.brand||{})};
  });
  check(`${label} · eight product story records with the full schema`,
    data.count===8&&data.fields,`${data.count} products · schema complete: ${data.fields}`);
  check(`${label} · story ids join the slice manifest one to one`,
    data.ids.join(',')===MANIFEST.slices.map(s=>s.id).join(','),data.ids.join(' '));
  check(`${label} · demo content is labelled demo and no price is invented`,
    data.allDemo&&data.allNullPrice,`demoContent on all: ${data.allDemo} · price null on all: ${data.allNullPrice}`);
  check(`${label} · no failed requests`,bad.length===0,bad.slice(0,3).join(' | '));

  /* ---- 2. everything follows the ENGINE's index ---- */
  const walk=[];
  for(const i of [0,3,5,7,1]){
    await page.evaluate(v=>window.RestaurantPizzaSliceOrbit.goTo(v),i);
    await settled(page);
    const st=await engineState(page);
    const story=await storyOf(page);
    const cfg=await page.evaluate(v=>window.RestaurantStudioConfig.get('pizzaSliceOrbit').products[v],i);
    walk.push({i,engine:st.activeIndex,engineId:st.activeId,story,cfg});
  }
  check(`${label} · headline name follows the active index`,
    walk.every(w=>w.story.name===w.cfg.name&&w.engine===w.i),
    walk.map(w=>`${w.i}:${w.story.name}`).join(' · '));
  check(`${label} · ingredients follow the active index`,
    walk.every(w=>w.story.ingredients===w.cfg.ingredients),
    walk.map(w=>w.story.ingredients.slice(0,14)).join(' | '));
  check(`${label} · descriptor and mood follow the active index`,
    walk.every(w=>w.story.descriptor===`${w.cfg.mood} · ${w.cfg.descriptor}`),
    walk.map(w=>w.story.descriptor).join(' | '));
  check(`${label} · the palette follows the active index`,
    walk.every(w=>w.story.accent.toLowerCase()===w.cfg.accent.toLowerCase()),
    walk.map(w=>w.story.accent).join(' '));
  check(`${label} · the background word and index follow the active index`,
    walk.every(w=>w.story.bgWord===w.cfg.mood
      &&w.story.bgIndex===String(w.i+1).padStart(2,'0')),
    walk.map(w=>`${w.story.bgWord}/${w.story.bgIndex}`).join(' '));
  check(`${label} · the counter follows the active index`,
    walk.every(w=>w.story.counter===`${String(w.i+1).padStart(2,'0')} / 08`),
    walk.map(w=>w.story.counter).join(' '));
  check(`${label} · the CTA follows the active index`,
    walk.every(w=>w.story.order===`Order ${w.cfg.name}`),
    walk.map(w=>w.story.order).join(' | '));
  check(`${label} · the hero slice on stage is the product being told`,
    walk.every(w=>w.story.hero===w.engineId&&w.engineId===w.cfg.id),
    walk.map(w=>`${w.story.hero}=${w.cfg.id}`).join(' '));
  check(`${label} · a null price renders nothing at all`,
    walk.every(w=>w.cfg.price===null&&!w.story.priceShown&&!w.story.priceText),
    `price element hidden on all ${walk.length} products`);
  check(`${label} · demo content carries its label`,
    walk.every(w=>w.story.demoLabel==='1'));

  /* ---- 3. no second product state ---- */
  const noSecond=await page.evaluate(()=>{
    const out=[];
    for(const p of [2.4,4.6,-1.3,9.7]){
      window.RestaurantPizzaSliceOrbit.setProgress(p);
      const e=window.RestaurantPizzaSliceOrbit.state();
      const pr=window.RestaurantPizzaPremium.state();
      out.push({p,e:e.activeIndex,pm:pr.activeIndex,id:e.activeId,pid:pr.productId});
    }
    window.RestaurantPizzaSliceOrbit.setProgress(0);
    return out;
  });
  check(`${label} · the premium layer reports the engine's index, never its own`,
    noSecond.every(o=>o.e===o.pm&&o.id===o.pid),
    noSecond.map(o=>`${o.p}:${o.e}/${o.pm}`).join(' '));

  /* ---- 4. eight chromatic worlds, and the switch that turns them off ---- */
  const worlds=[];
  for(let i=0;i<8;i++){
    await page.evaluate(v=>window.RestaurantPizzaSliceOrbit.setProgress(v),i);
    await page.waitForTimeout(140);
    worlds.push(await page.evaluate(()=>{
      const pal=window.RestaurantPizzaPremium.getCurrentPalette();
      return {accent:pal.accent,mood:pal.mood,
        world:getComputedStyle(document.querySelector('.pp-world')).backgroundImage.length};
    }));
  }
  check(`${label} · eight distinct chromatic worlds`,
    new Set(worlds.map(w=>w.accent)).size===8&&new Set(worlds.map(w=>w.mood)).size===8,
    worlds.map(w=>w.mood).join(' '));

  const brandAccent=await page.evaluate(()=>window.RestaurantStudioConfig.get('pizzaSliceOrbit.brand.accent'));
  await page.evaluate(()=>window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.perProductWorlds',false));
  await page.waitForTimeout(500);
  const single=[];
  for(const i of [0,3,6]){
    await page.evaluate(v=>window.RestaurantPizzaSliceOrbit.setProgress(v),i);
    await page.waitForTimeout(200);
    single.push(await page.evaluate(()=>window.RestaurantPizzaPremium.getCurrentPalette().accent));
  }
  check(`${label} · per-pizza worlds can be switched off for one brand accent`,
    single.every(a=>a.toLowerCase()===brandAccent.toLowerCase())&&new Set(single).size===1,
    `${single.join(' ')} vs brand ${brandAccent}`);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.perProductWorlds',true));
  await page.waitForTimeout(400);

  /* ---- 5. spin choreography: story out while fast, back on settle ---- */
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.setProgress(0));
  await settled(page);
  const beforeSpin=await storyOf(page);
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:6,turns:3}));
  const phases=new Set();
  let fastSample=null;
  for(let k=0;k<40;k++){
    const s=await page.evaluate(()=>{
      const st=window.RestaurantPizzaSliceOrbit.state();
      const pm=window.RestaurantPizzaPremium.state();
      const ing=getComputedStyle(document.querySelector('.pp-ingredients'));
      return {spinning:st.spinning,phase:pm.phase,speed:pm.speed,ingOpacity:+ing.opacity};
    });
    phases.add(s.phase);
    if(s.phase==='fast'&&!fastSample)fastSample=s;
    if(!s.spinning)break;
    await page.waitForTimeout(110);
    if(k===6)await page.screenshot({path:path.join(SHOTS,`premium-${isMobile?'mobile-03-spin':'05-spin-fast'}.png`)});
    if(k===16&&!isMobile)await page.screenshot({path:path.join(SHOTS,'premium-06-spin-deceleration.png')});
  }
  check(`${label} · the spin passes through fast and decelerating phases`,
    phases.has('fast')&&(phases.has('decelerating')||phases.has('resolving')),
    [...phases].join(' → '));
  check(`${label} · fast travel suppresses the story detail`,
    !!fastSample&&fastSample.ingOpacity<.3,
    fastSample?`ingredients at ${fastSample.ingOpacity} while fast (speed ${fastSample.speed})`:'no fast phase seen');

  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:25000});
  await settled(page);
  const afterSpin=await storyOf(page);
  const settleState=await page.evaluate(()=>({
    phase:window.RestaurantPizzaPremium.state().phase,
    ingOpacity:+getComputedStyle(document.querySelector('.pp-ingredients')).opacity
  }));
  check(`${label} · settle restores the whole story`,
    settleState.phase==='settled'&&settleState.ingOpacity>.85,
    `phase ${settleState.phase} · ingredients at ${settleState.ingOpacity}`);
  const spun=await engineState(page);
  const cfg6=await page.evaluate(()=>window.RestaurantStudioConfig.get('pizzaSliceOrbit').products[6]);
  check(`${label} · after the spin hero, headline, ingredients and CTA are one product`,
    spun.activeIndex===6&&afterSpin.hero===cfg6.id&&afterSpin.name===cfg6.name
    &&afterSpin.ingredients===cfg6.ingredients&&afterSpin.order===`Order ${cfg6.name}`
    &&afterSpin.bgWord===cfg6.mood,
    `${afterSpin.hero} · ${afterSpin.name} · ${afterSpin.order}`);
  check(`${label} · the story actually changed from before the spin`,
    beforeSpin.name!==afterSpin.name,`${beforeSpin.name} → ${afterSpin.name}`);
  await page.screenshot({path:path.join(SHOTS,`premium-${isMobile?'mobile-04-result':'07-spin-result'}.png`)});

  /* ---- 6. commerce adapters ---- */
  const commerce=await page.evaluate(()=>{
    const seen=[];
    const on=t=>e=>seen.push({t,d:e.detail});
    const h1=on('pizza:order-request'),h2=on('pizza:reservation-request'),h3=on('pizza:commerce-intent');
    addEventListener('pizza:order-request',h1);
    addEventListener('pizza:reservation-request',h2);
    addEventListener('pizza:commerce-intent',h3);
    const order=window.RestaurantPizzaPremium.requestOrder();
    const reservation=window.RestaurantPizzaPremium.requestReservation();
    removeEventListener('pizza:order-request',h1);
    removeEventListener('pizza:reservation-request',h2);
    removeEventListener('pizza:commerce-intent',h3);
    return {order,reservation,seen,
      note:document.querySelector('.pp-commerce-note').textContent.trim(),
      engine:window.RestaurantPizzaSliceOrbit.state()};
  });
  const wanted={productId:commerce.engine.activeId,productName:commerce.engine.activeName,
    activeIndex:commerce.engine.activeIndex};
  const payloadOk=d=>d.productId===wanted.productId&&d.productName===wanted.productName
    &&d.activeIndex===wanted.activeIndex;
  check(`${label} · the order event carries the active product`,
    commerce.seen.some(e=>e.t==='pizza:order-request'&&payloadOk(e.d)),
    JSON.stringify(commerce.seen.find(e=>e.t==='pizza:order-request')?.d||null));
  check(`${label} · the reservation event carries the active product`,
    commerce.seen.some(e=>e.t==='pizza:reservation-request'&&payloadOk(e.d)),
    JSON.stringify(commerce.seen.find(e=>e.t==='pizza:reservation-request')?.d||null));
  check(`${label} · a neutral commerce intent is emitted for both`,
    commerce.seen.filter(e=>e.t==='pizza:commerce-intent').length===2);
  check(`${label} · with no URL configured nothing is faked as completed`,
    commerce.order.opened===false&&commerce.order.url===null
    &&commerce.reservation.opened===false
    &&/no [a-z]+ endpoint is configured/i.test(commerce.note),`"${commerce.note}"`);

  const withUrl=await page.evaluate(()=>{
    window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.orderUrl','https://example.test/order');
    const opens=[];
    const orig=window.open;
    window.open=(u)=>{opens.push(u);return null};
    const r=window.RestaurantPizzaPremium.requestOrder();
    window.open=orig;
    window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.orderUrl','');
    return {r,opens};
  });
  check(`${label} · a configured order URL is opened with product context`,
    withUrl.r.opened===true&&/example\.test\/order/.test(withUrl.opens[0]||'')
    &&/product=/.test(withUrl.opens[0]||'')&&/action=order/.test(withUrl.opens[0]||''),
    withUrl.opens[0]||'nothing opened');

  const priority=await page.evaluate(()=>{
    window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.ctaPriority','reserve');
    return new Promise(r=>setTimeout(()=>r(document.querySelector('.pp-cta').dataset.priority),260));
  });
  check(`${label} · CTA priority can be reversed`,priority==='reserve',priority);
  await page.evaluate(()=>window.RestaurantStudioConfig.set('pizzaSliceOrbit.brand.ctaPriority','order'));
  await page.waitForTimeout(260);

  /* ---- 7. asset replacement cannot bypass registration ---- */
  const registration=await page.evaluate(async()=>{
    /* a plain opaque square: no transparent wedge, so no apex and no axis */
    const c=document.createElement('canvas');c.width=c.height=400;
    const x=c.getContext('2d');x.fillStyle='#c33';x.fillRect(0,0,400,400);
    const blob=await new Promise(r=>c.toBlob(r,'image/png'));
    const bad=await window.RestaurantPizzaPremium.registerUpload(
      new File([blob],'square.png',{type:'image/png'}));
    /* a wedge that opens far wider than the station accepts */
    const c2=document.createElement('canvas');c2.width=c2.height=400;
    const y=c2.getContext('2d');
    y.fillStyle='#c33';y.beginPath();y.moveTo(200,390);y.lineTo(10,20);y.lineTo(390,20);y.closePath();y.fill();
    const blob2=await new Promise(r=>c2.toBlob(r,'image/png'));
    const wide=await window.RestaurantPizzaPremium.registerUpload(
      new File([blob2],'wide.png',{type:'image/png'}));
    return {bad,wide};
  });
  check(`${label} · an asset with no usable wedge is refused`,
    registration.bad.ok===false&&/requires registration/i.test(registration.bad.reason),
    registration.bad.reason);
  check(`${label} · an asset that does not fit the station is refused`,
    registration.wide.ok===false&&/requires registration/i.test(registration.wide.reason),
    registration.wide.reason);
  const stillProduction=await page.evaluate(()=>[...document.querySelectorAll('.ps-slice .ps-slice-img')]
    .every(i=>/^assets\/pizza-motion\/runtime\/slices\//.test(i.getAttribute('src')||'')));
  check(`${label} · a refused upload never reaches production`,stillProduction);

  /* ---- 8. the approved motor is untouched by all of this ---- */
  const motor=await page.evaluate(()=>{
    const s=window.RestaurantPizzaSliceOrbit.state();
    const el=document.querySelector('.ps-station');
    const r=el.getBoundingClientRect();
    return {count:s.count,canonical:s.canonical,
      station:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1)},
      stationTransform:getComputedStyle(el).transform,
      progressKeys:Object.keys(s)};
  });
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.setProgress(3.4));
  await page.waitForTimeout(180);
  const motor2=await page.evaluate(()=>{
    const el=document.querySelector('.ps-station');
    const r=el.getBoundingClientRect();
    return {station:{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1)},
      stationTransform:getComputedStyle(el).transform};
  });
  check(`${label} · the station still never moves under the premium layer`,
    Math.abs(motor.station.x-motor2.station.x)<.6&&Math.abs(motor.station.y-motor2.station.y)<.6
    &&Math.abs(motor.station.w-motor2.station.w)<.6
    &&(motor2.stationTransform==='none'||/matrix\(1,\s*0,\s*0,\s*1/.test(motor2.stationTransform)),
    `${JSON.stringify(motor2.station)} ${motor2.stationTransform}`);
  check(`${label} · registration data is still the audited set`,
    motor.canonical&&motor.canonical.length===MANIFEST.canonical.length
    &&motor.canonical.halfAngleDeg===MANIFEST.canonical.halfAngleDeg&&motor.count===8,
    `length ${motor.canonical?.length} · station ${motor.canonical?.halfAngleDeg}°`);
  check(`${label} · the premium layer added no progress variable`,
    !motor.progressKeys.some(k=>/progress/i.test(k)&&k!=='progress'),
    motor.progressKeys.filter(k=>/progress/i.test(k)).join(','));

  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.setProgress(3));
  await settled(page);
  await page.screenshot({path:path.join(SHOTS,`premium-${isMobile?'mobile-01-idle':'01-diavola-idle'}.png`)});
  if(!isMobile){
    await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.goTo(0));
    await settled(page);
    await page.screenshot({path:path.join(SHOTS,'premium-02-quattro-formaggi.png')});
    await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.goTo(7));
    await settled(page);
    await page.screenshot({path:path.join(SHOTS,'premium-03-verduras.png')});
  }else{
    await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.goTo(5));
    await settled(page);
    await page.screenshot({path:path.join(SHOTS,'premium-mobile-02-story.png')});
  }

  /* ---- 9. drag still owns the orbit, with the world following ---- */
  const box=await page.locator('.orbit-shell').boundingBox();
  const gx=box.x+box.width*.5;
  const gy=Math.min(Math.max(box.y+box.height*.62,40),viewport.height-40);
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.setProgress(0));
  await settled(page);
  await page.mouse.move(gx,gy);await page.mouse.down();
  for(let i=1;i<=7;i++){await page.mouse.move(gx-i*(isMobile?10:14),gy);await page.waitForTimeout(28)}
  const mid=await page.evaluate(()=>({
    engine:window.RestaurantPizzaSliceOrbit.state(),
    phase:window.RestaurantPizzaPremium.state().phase}));
  check(`${label} · drag still moves the orbit and the world knows it`,
    mid.engine.dragging&&mid.engine.progress>.05&&mid.phase==='drag',
    `progress ${mid.engine.progress.toFixed(3)} · phase ${mid.phase}`);
  if(!isMobile)await page.screenshot({path:path.join(SHOTS,'premium-04-half-drag.png')});
  await page.mouse.up();await settled(page);

  /* ---- 10. layout ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no horizontal overflow`,overflow<=2,`${overflow}px`);
  const legible=await page.evaluate(()=>{
    const name=document.querySelector('.pp-name').getBoundingClientRect();
    const heroImg=document.querySelector('.ps-slice[data-hero="1"] .ps-slice-img').getBoundingClientRect();
    const ox=Math.min(name.right,heroImg.right)-Math.max(name.left,heroImg.left);
    const oy=Math.min(name.bottom,heroImg.bottom)-Math.max(name.top,heroImg.top);
    return {overlap:ox>0&&oy>0?(ox*oy)/(name.width*name.height):0,
      nameVisible:name.width>40&&name.height>10,
      ctaVisible:!!document.querySelector('.pp-order')?.offsetParent};
  });
  check(`${label} · the headline is legible and not buried under the hero`,
    legible.nameVisible&&legible.overlap<.35&&legible.ctaVisible,
    `${Math.round(legible.overlap*100)}% of the headline overlapped by the hero`);

  /* ---- 11. approved presets still intact ---- */
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.waitForTimeout(1400);
  const p03=await page.evaluate(()=>({
    ready:document.documentElement.dataset.orbitalFood==='ready',
    renderer:window.RestaurantOrbit.hasDishRenderer(),
    dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length,
    premiumGone:!('pizzaPremium' in document.documentElement.dataset),
    worldGone:!document.querySelector('.pp-world')?.style.background
      ||getComputedStyle(document.querySelector('.pp-editorial')).display==='none'
  }));
  check(`${label} · Project 03 still works and the pizza world steps aside`,
    p03.ready&&p03.renderer&&p03.dishes>=6&&p03.premiumGone&&p03.worldGone,JSON.stringify(p03));
  await page.screenshot({path:path.join(SHOTS,'premium-regression-orbital-food.png')});

  await selectPreset(page,'depth-carousel','depthCarousel');
  await page.waitForTimeout(1400);
  check(`${label} · Project 01 still works`,
    await page.evaluate(()=>[...document.querySelectorAll('.dc-plate')]
      .filter(e=>+getComputedStyle(e.firstElementChild).opacity>=.3).length>=(innerWidth<820?4:5)));
  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.waitForTimeout(1400);
  check(`${label} · Project 02 still works`,
    await page.evaluate(()=>document.querySelectorAll('.sc-scene[data-kind="scene"]').length===2));
  await selectPreset(page,'elegant');
  await page.waitForTimeout(1300);
  check(`${label} · Elegant Orbit is restored intact`,
    await page.evaluate(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6
      &&getComputedStyle(document.getElementById('orbit-stage')).visibility!=='hidden'));

  const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
  check(`${label} · no JS errors`,fatal.length===0,fatal.slice(0,3).join(' | '));
  await context.close();
}

await run('desktop',{width:1440,height:900},false);
await run('mobile',{width:390,height:844},true);

/* ---- personalization: the Studio panel, and persistence through project state ---- */
{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaPremium==='ready',null,{timeout:20000});
  await page.waitForTimeout(600);

  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(700);
  await page.evaluate(()=>document.querySelector('#studio [data-panel="motion"]')?.click());
  await page.waitForTimeout(700);
  const panel=await page.evaluate(()=>{
    const card=document.querySelector('.pp-studio');
    return {exists:!!card,
      inputs:card?card.querySelectorAll('[data-path]').length:0,
      motionSelectIntact:!!document.querySelector('#motion-orbital-style option[value="orbital-food"]'),
      fields:card?[...card.querySelectorAll('[data-path]')].map(i=>i.dataset.path.split('.').slice(1).join('.')):[]};
  });
  check('personalization · the panel is added without disturbing the Motion panel',
    panel.exists&&panel.motionSelectIntact&&panel.inputs>=15,
    `${panel.inputs} bound controls`);
  check('personalization · restaurant, collection, accent, worlds, CTA and both URLs are editable',
    ['brand.restaurantName','brand.collectionName','brand.accent','brand.perProductWorlds',
     'brand.ctaPriority','brand.orderUrl','brand.reservationUrl']
      .every(f=>panel.fields.includes(f)),panel.fields.slice(0,7).join(' '));
  check('personalization · every product exposes name, ingredients, descriptor, mood, accent and price',
    [0,7].every(i=>['name','ingredients','descriptor','mood','accent','price']
      .every(k=>panel.fields.includes(`products.${i}.${k}`))));
  await page.screenshot({path:path.join(SHOTS,'premium-08-personalization-panel.png')});

  /* edit through the panel, then reload and prove the existing project state kept it */
  const stamp=`Trattoria ${Date.now()%10000}`;
  await page.evaluate(v=>{
    const input=document.querySelector('.pp-studio [data-path$="restaurantName"]');
    input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));
  },stamp);
  await page.evaluate(()=>{
    const c=document.querySelector('.pp-studio [data-path$="ingredients"]');
    c.value='Ingrediente de prueba';c.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForTimeout(2600);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaPremium==='ready',null,{timeout:25000});
  await page.waitForTimeout(900);
  const persisted=await page.evaluate(()=>({
    name:window.RestaurantStudioConfig.get('pizzaSliceOrbit.brand.restaurantName'),
    ing:window.RestaurantStudioConfig.get('pizzaSliceOrbit.products.0.ingredients'),
    preset:document.getElementById('motion-orbital-style')?.value
  }));
  check('personalization · edits persist through the existing project state and a reload',
    persisted.name===stamp&&persisted.ing==='Ingrediente de prueba'&&persisted.preset==='pizza-slice-orbit',
    `${persisted.name} · ${persisted.ing} · ${persisted.preset}`);

  /* the CTA screenshot with a real order URL configured */
  await page.evaluate(()=>document.querySelector('#studio-close')?.click());
  await page.waitForTimeout(500);
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.goTo(3));
  await settled(page);
  await page.evaluate(()=>window.RestaurantPizzaPremium.requestOrder());
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(SHOTS,'premium-09-order-cta.png')});
  await context.close();
}

/* ---- reduced motion ---- */
{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'pizza-slice-orbit','pizzaSliceOrbit');
  await page.waitForFunction(()=>document.documentElement.dataset.pizzaPremium==='ready',null,{timeout:20000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await settled(page);
  const rm=await storyOf(page);
  check('reduced-motion · the full story is present',
    !!rm.name&&!!rm.ingredients&&!!rm.descriptor&&!!rm.order,
    `${rm.name} · ${rm.order}`);
  await page.evaluate(()=>window.RestaurantPizzaSliceOrbit.spin({target:2}));
  await page.waitForFunction(()=>!window.RestaurantPizzaSliceOrbit.state().spinning,null,{timeout:15000});
  await settled(page);
  const rmAfter=await page.evaluate(()=>({
    engine:window.RestaurantPizzaSliceOrbit.state().activeIndex,
    name:document.querySelector('.pp-name').textContent.trim(),
    cfg:window.RestaurantStudioConfig.get('pizzaSliceOrbit').products[2].name}));
  check('reduced-motion · discover still selects and the story follows',
    rmAfter.engine===2&&rmAfter.name===rmAfter.cfg,`${rmAfter.name}`);
  await page.screenshot({path:path.join(SHOTS,'premium-reduced-motion.png')});
  await context.close();
}

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){console.error(`PIZZA_PREMIUM_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('PIZZA_PREMIUM_PASS');
