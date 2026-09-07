/* PROJECT 03 — ORBITAL FOOD SLIDER · end-to-end contract.

   The gates that decide this project are not "does it render". They are:
     · does the geometry read as a physical orbit rather than a curved row
     · does the drag hold the products mid-orbit, not animate after release
     · is there exactly ONE active index, ONE progress and ONE gesture engine
     · does everything the approved presets own still work when this one leaves

   Usage: node tests/class10-orbital-food-slider-e2e.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SHOTS=path.join(ROOT,'tests','screenshots');
fs.mkdirSync(SHOTS,{recursive:true});

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();

const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

async function selectPreset(page,value,readyFlag){
  await page.waitForFunction(v=>!!document.querySelector(`#motion-orbital-style option[value="${v}"]`),value,{timeout:25000});
  await page.evaluate(v=>{
    const s=document.getElementById('motion-orbital-style');
    s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    window.RestaurantMotionStudio?.publish?.();
  },value);
  if(readyFlag)await page.waitForFunction(f=>document.documentElement.dataset[f]==='ready',readyFlag,{timeout:14000});
}
/* Writes the ENGINE's progress. There is no preset progress to write. */
const setP=(page,v)=>page.evaluate(p=>window.RestaurantOrbit.setProgress(p),v);
const stateOf=page=>page.evaluate(()=>window.RestaurantOrbitalFood.state());
/* Bring the orbit into view and resolve a plate's centre there. Clamping a click
   into the viewport silently slides it off the product and the test then measures
   nothing. */
async function plateCentre(page,viewport,pick){
  await page.locator('.orbit-shell').scrollIntoViewIfNeeded();
  await page.waitForTimeout(320);
  const t=await page.evaluate(p=>{
    const els=[...document.querySelectorAll('#orbit-stage .orbit-dish')];
    const el=p==='hero'
      ? document.querySelector('#orbit-stage .orbit-dish[data-orbit-hero="1"]')
      : els[els.map((e,i)=>({i,f:+e.dataset.orbitFront})).sort((a,b)=>b.f-a.f)[1].i];
    const r=el.getBoundingClientRect();
    return {index:els.indexOf(el),id:el.dataset.id,x:r.left+r.width/2,y:r.top+r.height/2};
  },pick);
  if(t.y<34||t.y>viewport.height-34){
    /* nudge the page so the product's centre is reachable, then re-measure */
    await page.evaluate(dy=>scrollBy(0,dy),Math.round(t.y-viewport.height/2));
    await page.waitForTimeout(320);
    return plateCentre(page,viewport,pick);
  }
  return t;
}
const plates=page=>page.evaluate(()=>{
  const sh=document.querySelector('.orbit-shell').getBoundingClientRect();
  return [...document.querySelectorAll('#orbit-stage .orbit-dish')].map((el,i)=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {i,id:el.dataset.id,front:+el.dataset.orbitFront,hero:el.dataset.orbitHero==='1',
      w:+r.width.toFixed(1),h:+r.height.toFixed(1),
      cx:+(r.left+r.width/2-sh.left).toFixed(1),cy:+(r.top+r.height/2-sh.top).toFixed(1),
      z:+cs.zIndex||0,opacity:+(+cs.opacity).toFixed(3),filter:cs.filter};
  });
});

async function run(label,viewport,isMobile){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});

  /* ---- 0. the Studio exposes the preset without replacing any approved one ---- */
  /* The runtime presets inject their options after boot, so wait for the full set
     rather than racing it. */
  await page.waitForFunction(()=>{
    const s=document.getElementById('motion-orbital-style');
    if(!s)return false;
    const v=[...s.options].map(o=>o.value);
    return ['elegant','urban','editorial-flow','depth-carousel','anchor-scenes','orbital-food'].every(x=>v.includes(x));
  },null,{timeout:30000});
  const options=await page.evaluate(()=>{
    const s=document.getElementById('motion-orbital-style');
    return s?[...s.options].map(o=>o.value):[];
  });
  check(`${label} · Studio exposes Orbital Food Slider beside every approved preset`,
    options.includes('orbital-food')&&['elegant','urban','editorial-flow','depth-carousel','anchor-scenes']
      .every(v=>options.includes(v)),options.join(','));

  await selectPreset(page,'orbital-food','orbitalFood');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);

  const st=await stateOf(page);
  check(`${label} · preset is live with the whole collection`,
    st.mode==='orbital-food'&&st.ready&&st.count>=6&&st.words===st.count,
    JSON.stringify({count:st.count,words:st.words,decorGroups:st.decorGroups}));

  /* ---- 1. THE REUSE CONTRACT ----
     One index, one progress, one gesture engine. The preset reports the engine's own
     numbers because it has none of its own, and the products on stage are the base
     engine's DOM with their transform delegated. */
  check(`${label} · the products are the base engine's own elements, re-composed`,
    st.usesEngineRenderer&&await page.evaluate(()=>
      document.querySelectorAll('#orbit-stage .orbit-dish').length===window.RestaurantOrbit.getCount()),
    `engine renderer registered: ${st.usesEngineRenderer}`);

  const identity=await page.evaluate(()=>{
    const o=window.RestaurantOrbit;
    const active=o.getActiveIndex();
    const counter=parseInt(document.getElementById('dish-counter').textContent,10)-1;
    const hero=[...document.querySelectorAll('#orbit-stage .orbit-dish')]
      .findIndex(el=>el.dataset.orbitHero==='1');
    /* Class 06 writes the copy in the active language while the engine's dish object
       keeps the default-language name, so identity is asserted on ids and indices:
       comparing the two strings would only be comparing locales. */
    return {active,counter,hero,
      heroId:document.querySelector('#orbit-stage .orbit-dish[data-orbit-hero="1"]')?.dataset.id,
      engineId:o.getDishes()[active]?.id,
      title:document.getElementById('dish-title').textContent.trim()};
  });
  check(`${label} · base active index = hero = dish counter, all naming one dish`,
    identity.active===identity.counter&&identity.active===identity.hero
    &&identity.heroId===identity.engineId&&identity.title.length>2,
    JSON.stringify(identity));

  const noSecondProgress=await page.evaluate(()=>{
    const before=window.RestaurantOrbit.getProgress();
    window.RestaurantOrbit.setProgress(before+0.37);
    const reported=window.RestaurantOrbitalFood.state().progress;
    const engine=window.RestaurantOrbit.getProgress();
    window.RestaurantOrbit.setProgress(before);
    return {reported,engine,same:Math.abs(reported-engine)<1e-9};
  });
  check(`${label} · the preset reports the engine's progress, not one of its own`,
    noSecondProgress.same,JSON.stringify(noSecondProgress));

  /* ---- 2. HERO + DEPTH ---- */
  await setP(page,0);await page.waitForTimeout(320);
  const rest=await plates(page);
  const hero=rest.find(p=>p.hero);
  const byFront=[...rest].sort((a,b)=>b.front-a.front);
  const neighbour=byFront[1];
  check(`${label} · the hero is unmistakably the largest product`,
    !!hero&&hero.w/neighbour.w>=1.35,
    hero?`hero ${hero.w}px vs neighbour ${neighbour.w}px = ${(hero.w/neighbour.w).toFixed(2)}x`:'no hero');
  check(`${label} · the hero is the brightest and the frontmost`,
    !!hero&&hero.opacity>=Math.max(...rest.map(p=>p.opacity))-1e-6
    &&hero.z>=Math.max(...rest.map(p=>p.z)),
    hero?`opacity ${hero.opacity} z ${hero.z}`:'-');

  /* Depth is real when the sizes form distinct steps, not two states. */
  const widths=[...new Set(rest.map(p=>Math.round(p.w/12)))];
  check(`${label} · at least three perceptible depth levels`,widths.length>=3,
    rest.map(p=>Math.round(p.w)).join(' / '));
  const zOrdered=[...rest].sort((a,b)=>a.front-b.front).every((p,i,arr)=>i===0||p.z>=arr[i-1].z);
  check(`${label} · z-order follows depth`,zOrdered,rest.map(p=>`${Math.round(p.front*100)}:${p.z}`).join(' '));

  /* Not a rail and not a row: the products have to move vertically as well, and the
     rear of the orbit must not sit on the hero's line. */
  const ySpread=Math.max(...rest.map(p=>p.cy))-Math.min(...rest.map(p=>p.cy));
  const sh=await page.evaluate(()=>document.querySelector('.orbit-shell').clientHeight);
  check(`${label} · the orbit travels vertically, not on a horizontal rail`,
    ySpread>sh*0.12,`${Math.round(ySpread)}px of ${sh}px shell`);

  const overlap=(a,b)=>Math.min(a.cx+a.w/2,b.cx+b.w/2)-Math.max(a.cx-a.w/2,b.cx-b.w/2);
  check(`${label} · products overlap, so depth reads as occlusion`,
    overlap(hero,neighbour)>0,`${Math.round(overlap(hero,neighbour))}px shared`);

  /* rear must be context, never dominant */
  const rear=byFront[byFront.length-1];
  check(`${label} · the rear of the orbit stays context`,
    rear.w<hero.w*.45&&rear.opacity<hero.opacity,
    `rear ${Math.round(rear.w)}px @ ${rear.opacity} vs hero ${Math.round(hero.w)}px @ ${hero.opacity}`);

  await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-01-idle.png`)});

  /* ---- 3. CONTINUITY ----
     Sample a whole turn. No product may teleport, the incoming one must approach the
     front monotonically and the outgoing recede, and the z-order has to change
     DURING the pass rather than at the end. */
  const stops=[0,.2,.4,.5,.6,.8,1];
  const track=[];
  for(const p of stops){
    await setP(page,p);await page.waitForTimeout(190);
    track.push(await plates(page));
  }
  const jumpOf=i=>{
    let worst=0;
    for(let k=1;k<track.length;k++){
      const a=track[k-1][i],b=track[k][i];
      worst=Math.max(worst,Math.hypot(b.cx-a.cx,b.cy-a.cy));
    }
    return worst;
  };
  const worstJump=Math.max(...track[0].map((_,i)=>jumpOf(i)));
  const shellW=await page.evaluate(()=>document.querySelector('.orbit-shell').clientWidth);
  check(`${label} · no product teleports across the turn`,worstJump<shellW*.42,
    `largest step ${Math.round(worstJump)}px over ${stops.length} samples`);

  const incoming=track.map(f=>f[1].front),outgoing=track.map(f=>f[0].front);
  const monotonicUp=incoming.every((v,i,a)=>i===0||v>=a[i-1]-.02);
  const monotonicDown=outgoing.every((v,i,a)=>i===0||v<=a[i-1]+.02);
  check(`${label} · the incoming product approaches the front continuously`,monotonicUp,
    incoming.map(v=>v.toFixed(2)).join(' → '));
  check(`${label} · the outgoing product recedes continuously`,monotonicDown,
    outgoing.map(v=>v.toFixed(2)).join(' → '));

  const zTrack=track.map(f=>f[1].z);
  check(`${label} · z-order changes during the pass, not only at the end`,
    new Set(zTrack).size>=4&&zTrack[0]<zTrack[zTrack.length-1],zTrack.join(' → '));

  const scaleTrack=track.map(f=>Math.round(f[1].w));
  check(`${label} · the incoming product grows out of depth toward the viewer`,
    scaleTrack[scaleTrack.length-1]>scaleTrack[0]*1.35
    &&scaleTrack.every((v,i,a)=>i===0||v>=a[i-1]-3),scaleTrack.join(' → '));

  /* depth proof sheet: the whole turn on one image */
  if(!isMobile){
    const frames=[];
    for(const p of [0,.25,.5,.75]){
      await setP(page,p);await page.waitForTimeout(240);
      frames.push('data:image/png;base64,'+(await page.screenshot()).toString('base64'));
    }
    await page.evaluate(([frames,labels])=>{
      document.body.style.margin='0';
      document.body.innerHTML=`<div id="proof" style="width:1400px;background:#0a0a0e;padding:10px;font:12px system-ui">
        <div style="letter-spacing:.2em;text-transform:uppercase;color:#d8ff4f;padding:2px 2px 10px">
          Orbital depth proof · one full turn</div>
        ${frames.map((f,i)=>`<div style="position:relative;margin-bottom:3px">
          <img src="${f}" style="width:100%;display:block">
          <span style="position:absolute;left:10px;top:8px;font:700 15px system-ui;color:#d8ff4f;
            text-shadow:0 1px 5px #000">progress ${labels[i]}</span></div>`).join('')}
      </div>`;
    },[frames,['0.00','0.25','0.50','0.75']]);
    await page.waitForTimeout(800);
    await page.locator('#proof').screenshot({path:path.join(SHOTS,'orbital-food-desktop-depth-proof.png')});
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await selectPreset(page,'orbital-food','orbitalFood');
    await page.locator('#signature').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
  }

  await setP(page,.25);await page.waitForTimeout(260);
  await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-02-quarter.png`)});
  await setP(page,.5);await page.waitForTimeout(260);
  await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-03-half.png`)});

  /* ---- 4. the world interpolates with the orbit, not at the snap ---- */
  const worlds=[];
  for(const p of [0,.25,.5,.75,1]){
    await setP(page,p);await page.waitForTimeout(200);
    worlds.push(await page.evaluate(()=>getComputedStyle(document.documentElement)
      .getPropertyValue('--of-accent').trim()));
  }
  check(`${label} · the colour world interpolates across the orbit`,
    new Set(worlds).size>=4&&worlds[0]!==worlds[2]&&worlds[2]!==worlds[4],worlds.join(' → '));

  /* ---- 5. decor orbit ---- */
  const decor=await page.evaluate(()=>{
    const items=[...document.querySelectorAll('.of-decor-item')];
    const live=items.filter(el=>+getComputedStyle(el).opacity>.04);
    const pos=el=>{const r=el.getBoundingClientRect();return `${Math.round(r.left)},${Math.round(r.top)}`};
    return {total:items.length,live:live.length,sample:live.slice(0,3).map(pos)};
  });
  await setP(page,.5);await page.waitForTimeout(260);
  const decorMoved=await page.evaluate(prev=>{
    const live=[...document.querySelectorAll('.of-decor-item')].filter(el=>+getComputedStyle(el).opacity>.04);
    const pos=el=>{const r=el.getBoundingClientRect();return `${Math.round(r.left)},${Math.round(r.top)}`};
    const now=live.slice(0,3).map(pos);
    return now.some((v,i)=>v!==prev[i]);
  },decor.sample);
  check(`${label} · a second orbit of ingredients exists and travels`,
    decor.total>0&&decor.live>0&&decorMoved,
    `${decor.live} of ${decor.total} items visible, moved with progress: ${decorMoved}`);

  const decorBelongs=await page.evaluate(()=>{
    /* the decor of a product that is nowhere near the front must be silent */
    const groups=[...document.querySelectorAll('.of-decor-group')];
    const fronts=[...document.querySelectorAll('#orbit-stage .orbit-dish')].map(e=>+e.dataset.orbitFront);
    return groups.every(g=>{
      const f=fronts[+g.dataset.index];
      return f>.35||+getComputedStyle(g).opacity<.25;
    });
  });
  check(`${label} · decor belongs to its product and fades with it`,decorBelongs);

  /* ---- 6. typography ---- */
  const words=await page.evaluate(()=>{
    const els=[...document.querySelectorAll('.of-word')];
    const vis=els.filter(e=>+getComputedStyle(e).opacity>.03);
    return {total:els.length,visible:vis.length,texts:vis.map(e=>e.textContent.trim()),
      override:els.some(e=>e.textContent.trim()==='HONEY')};
  });
  check(`${label} · one word per product, and only the front of the orbit speaks`,
    words.total>=6&&words.visible<=2&&words.visible>=1,
    `${words.visible} legible of ${words.total}: ${words.texts.join(' + ')}`);

  /* ---- 7. GESTURE = PROGRESS (the critical gate) ----
     Half way through the pointer, the products must be half way round the orbit.
     Nothing here drives the drag: it is the base engine's. */
  await setP(page,0);await page.waitForTimeout(300);
  const box=await page.locator('.orbit-shell').boundingBox();
  const gy=Math.min(Math.max(box.y+box.height*.5,30),viewport.height-40);
  const gx=box.x+box.width*(isMobile?.5:.62);
  /* One drag unit is 240px on desktop and 170px on mobile, so stay well inside it:
     dragging a whole unit would measure a finished turn, not a held one. */
  const held=[];
  await page.mouse.move(gx,gy);
  await page.mouse.down();
  for(let i=1;i<=8;i++){
    await page.mouse.move(gx-i*(isMobile?9:13),gy);
    await page.waitForTimeout(24);
    if(i%2===0)held.push({p:+(await page.evaluate(()=>window.RestaurantOrbit.getProgress())).toFixed(3),
      front:+(await page.evaluate(()=>+document.querySelectorAll('#orbit-stage .orbit-dish')[1].dataset.orbitFront)).toFixed(3)});
  }
  const midDrag=await page.evaluate(()=>({
    progress:window.RestaurantOrbit.getProgress(),
    dragging:window.RestaurantOrbit.isDragging(),
    fronts:[...document.querySelectorAll('#orbit-stage .orbit-dish')].map(e=>+e.dataset.orbitFront)
  }));
  check(`${label} · the drag holds the orbit mid-travel while the pointer is down`,
    midDrag.dragging&&midDrag.progress>.08&&midDrag.progress<.95
    &&midDrag.fronts[1]>0.05&&midDrag.fronts[1]<0.999,
    `progress ${midDrag.progress.toFixed(3)} · incoming front ${midDrag.fronts[1].toFixed(3)}`);
  check(`${label} · progress tracks the pointer continuously`,
    held.length>=3&&held.every((v,i,a)=>i===0||v.p>=a[i-1].p-1e-6)
    &&held.every((v,i,a)=>i===0||v.front>=a[i-1].front-.02),
    held.map(v=>`${v.p}/${v.front}`).join(' → '));

  await page.mouse.up();
  await page.waitForTimeout(1200);
  const afterRelease=await page.evaluate(()=>({
    progress:window.RestaurantOrbit.getProgress(),
    active:window.RestaurantOrbit.getActiveIndex()
  }));
  check(`${label} · release snaps to a product, keeping the engine's momentum`,
    Math.abs(afterRelease.progress-Math.round(afterRelease.progress))<.02,
    `settled at ${afterRelease.progress}`);

  /* ---- 8. every input converges on the same engine ---- */
  const viaButton=await (async()=>{
    const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
    await page.click('#next-dish');await page.waitForTimeout(1200);
    const after=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
    return {before,after};
  })();
  check(`${label} · next() advances the orbit`,viaButton.after!==viaButton.before,
    `${viaButton.before} → ${viaButton.after}`);
  const viaPrev=await (async()=>{
    const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
    await page.click('#prev-dish');await page.waitForTimeout(1200);
    return {before,after:await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex())};
  })();
  check(`${label} · prev() reverses it`,viaPrev.after!==viaPrev.before,`${viaPrev.before} → ${viaPrev.after}`);

  if(!isMobile){
    const kb=await (async()=>{
      const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
      await page.locator('.orbit-shell').focus();
      await page.keyboard.press('ArrowRight');await page.waitForTimeout(1200);
      return {before,after:await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex())};
    })();
    check(`${label} · the keyboard reaches the same engine`,kb.after!==kb.before,`${kb.before} → ${kb.after}`);

    const wheel=await (async()=>{
      const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
      await page.mouse.move(box.x+box.width*.62,gy);
      await page.mouse.wheel(0,240);await page.waitForTimeout(1300);
      return {before,after:await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex())};
    })();
    check(`${label} · the wheel reaches the same engine`,wheel.after!==wheel.before,`${wheel.before} → ${wheel.after}`);
  }

  /* ---- 9. copy follows the active product, never a stale one ---- */
  const sync=await page.evaluate(()=>{
    const o=window.RestaurantOrbit,d=o.getDishes()[o.getActiveIndex()];
    return {price:document.querySelector('.of-price').textContent.trim(),dishPrice:d.price||'',
      counter:document.getElementById('dish-counter').textContent.trim(),
      expected:`${String(o.getActiveIndex()+1).padStart(2,'0')} / ${String(o.getCount()).padStart(2,'0')}`,
      titleFilled:document.getElementById('dish-title').textContent.trim().length>2};
  });
  check(`${label} · price and counter describe the active product, title filled`,
    sync.price===sync.dishPrice&&sync.counter===sync.expected&&sync.titleFilled,
    JSON.stringify(sync));

  /* the crossover cue: the copy hands over at the engine's own half-way point */
  const crossover=await page.evaluate(async()=>{
    const o=window.RestaurantOrbit;
    const base=Math.round(o.getProgress());
    const read=()=>({active:o.getActiveIndex(),title:document.getElementById('dish-title').textContent.trim()});
    o.setProgress(base+.40);await new Promise(r=>setTimeout(r,520));const before=read();
    o.setProgress(base+.60);await new Promise(r=>setTimeout(r,520));const after=read();
    o.setProgress(base);
    return {before,after};
  });
  check(`${label} · the copy hands over at the engine's crossover`,
    crossover.before.active!==crossover.after.active
    &&crossover.before.title!==crossover.after.title,
    `${crossover.before.active}:"${crossover.before.title}" → ${crossover.after.active}:"${crossover.after.title}"`);

  await setP(page,0);await page.waitForTimeout(400);
  await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-04-three-quarter.png`)});

  /* ---- 10. clicking products ---- */
  const neighbourClick=await (async()=>{
    const target=await plateCentre(page,viewport,'neighbour');
    const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
    await page.mouse.click(target.x,target.y);
    await page.waitForTimeout(1400);
    return {before,after:await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex()),
      wanted:target.index,
      detail:await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open'))};
  })();
  check(`${label} · clicking a neighbour navigates to it and opens nothing`,
    neighbourClick.after===neighbourClick.wanted&&!neighbourClick.detail,
    `${neighbourClick.before} → ${neighbourClick.after} (wanted ${neighbourClick.wanted}), detail ${neighbourClick.detail}`);

  const heroClick=await (async()=>{
    const target=await plateCentre(page,viewport,'hero');
    await page.mouse.click(target.x,target.y);
    await page.waitForTimeout(1500);
    return {id:target.id,
      open:await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open')),
      detailTitle:await page.evaluate(()=>document.getElementById('detail-title').textContent.trim()),
      detailId:await page.evaluate(()=>document.querySelector('#detail-visual .orbit-dish')?.dataset.id
        ||document.querySelector('#detail-visual [data-id]')?.dataset.id||null)};
  })();
  check(`${label} · clicking the hero opens the real dish detail`,
    heroClick.open&&heroClick.detailTitle.length>2&&heroClick.detailId===heroClick.id,
    `${heroClick.detailTitle} · detail dish ${heroClick.detailId} vs hero ${heroClick.id}`);
  if(heroClick.open)await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-06-detail.png`)});

  const closed=await (async()=>{
    const activeBefore=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
    await page.evaluate(()=>document.querySelector('#detail-close')?.click());
    await page.waitForFunction(()=>!document.getElementById('dish-detail').classList.contains('is-open'),null,{timeout:8000});
    await page.waitForTimeout(2400);
    const p=await plates(page);
    const heroNow=p.find(x=>x.hero);
    return {activeBefore,activeAfter:await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex()),
      heroBig:heroNow&&heroNow.w/[...p].sort((a,b)=>b.front-a.front)[1].w>=1.35};
  })();
  check(`${label} · closing the detail returns the product to its orbital place`,
    closed.activeAfter===closed.activeBefore&&closed.heroBig,JSON.stringify(closed));

  await page.screenshot({path:path.join(SHOTS,`orbital-food-${label}-05-complete.png`)});

  /* ---- 11. layout ---- */
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(`${label} · no horizontal overflow`,overflow<=2,`${overflow}px`);
  const inFrame=await page.evaluate(()=>{
    const sec=document.querySelector('.orbital-section').getBoundingClientRect();
    return [...document.querySelectorAll('#orbit-stage .orbit-dish')].every(el=>{
      const r=el.getBoundingClientRect();
      return r.right>sec.left-40&&r.left<sec.right+40;
    });
  });
  check(`${label} · no product escapes the section`,inFrame);
  check(`${label} · copy and controls stay reachable`,
    await page.locator('#next-dish').isVisible()&&await page.locator('#explore-dish').isVisible()
    &&await page.locator('.of-price').isVisible());

  /* the copy column must not be buried under a plate */
  /* .dish-copy is pointer-events:none, so elementFromPoint reports whatever sits
     BEHIND it and would always look like a plate. Measure the rectangles instead. */
  const copyClear=await page.evaluate(()=>{
    const t=document.getElementById('dish-title').getBoundingClientRect();
    const worst=[...document.querySelectorAll('#orbit-stage .orbit-dish')]
      .filter(el=>+getComputedStyle(el).opacity>.25)
      .map(el=>{
        const r=el.getBoundingClientRect();
        const ox=Math.min(t.right,r.right)-Math.max(t.left,r.left);
        const oy=Math.min(t.bottom,r.bottom)-Math.max(t.top,r.top);
        return ox>0&&oy>0?(ox*oy)/(t.width*t.height):0;
      }).sort((a,b)=>b-a)[0]||0;
    return {coverage:+worst.toFixed(3)};
  });
  check(`${label} · no product buries the dish title`,copyClear.coverage<.3,
    `${Math.round(copyClear.coverage*100)}% of the title covered by a visible plate`);

  /* ---- 12. regressions: the preset must leave nothing behind ---- */
  await selectPreset(page,'depth-carousel','depthCarousel');
  await page.waitForTimeout(1300);
  const p01=await page.evaluate(()=>{
    const s=window.RestaurantDepthCarousel.state();
    const present=[...document.querySelectorAll('.dc-plate')].filter(e=>+getComputedStyle(e.firstElementChild).opacity>=.3).length;
    return {present,free:s.freeObjects,
      foodStage:document.querySelector('.of-stage')?.hidden===true,
      rendererReleased:!window.RestaurantOrbit.hasDishRenderer(),
      heroMarks:document.querySelectorAll('#orbit-stage .orbit-dish[data-orbit-hero]').length};
  });
  check(`${label} · Project 01 still works and Orbital Food steps aside`,
    p01.present>=(isMobile?4:5)&&p01.free>=3&&p01.foodStage&&p01.rendererReleased&&p01.heroMarks===0,
    JSON.stringify(p01));
  await page.screenshot({path:path.join(SHOTS,`orbital-food-regression-depth.png`)});

  await selectPreset(page,'anchor-scenes','anchorScenes');
  await page.waitForTimeout(1300);
  const p02=await page.evaluate(()=>({
    scenes:document.querySelectorAll('.sc-scene[data-kind="scene"]').length,
    counter:document.querySelector('.sc-counter')?.textContent.trim(),
    foodStage:document.querySelector('.of-stage')?.hidden===true,
    rendererReleased:!window.RestaurantOrbit.hasDishRenderer()
  }));
  check(`${label} · Project 02 still works`,
    p02.scenes===2&&/^\d\d \/ \d\d$/.test(p02.counter||'')&&p02.foodStage&&p02.rendererReleased,
    JSON.stringify(p02));
  await page.screenshot({path:path.join(SHOTS,`orbital-food-regression-anchor-scenes.png`)});

  await selectPreset(page,'elegant');
  await page.waitForTimeout(1300);
  const orbital=await page.evaluate(()=>{
    const el=document.querySelector('#orbit-stage .orbit-dish');
    const cs=getComputedStyle(el);
    return {stage:getComputedStyle(document.getElementById('orbit-stage')).visibility!=='hidden',
      dishes:document.querySelectorAll('#orbit-stage .orbit-dish').length,
      foodStage:document.querySelector('.of-stage')?.hidden===true,
      rendererReleased:!window.RestaurantOrbit.hasDishRenderer(),
      titleFilled:document.getElementById('dish-title').textContent.trim().length>2,
      /* Orbital Food is the only preset that adds saturate() to a plate, so finding
         it here would mean the renderer left tone behind. */
      saturateLeftOver:/saturate/.test(cs.filter||'')};
  });
  check(`${label} · Elegant Orbit is restored intact, with no leftover tone`,
    orbital.stage&&orbital.dishes>=6&&orbital.foodStage&&orbital.rendererReleased
    &&orbital.titleFilled&&!orbital.saturateLeftOver,JSON.stringify(orbital));
  await page.screenshot({path:path.join(SHOTS,`orbital-food-regression-elegant.png`)});

  await selectPreset(page,'urban');
  await page.waitForTimeout(1100);
  check(`${label} · Urban Acrobatics is untouched`,
    await page.evaluate(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6
      &&document.querySelector('.of-stage')?.hidden===true));

  await selectPreset(page,'editorial-flow');
  await page.waitForTimeout(1100);
  check(`${label} · Editorial Flow is untouched`,
    await page.evaluate(()=>document.documentElement.dataset.orbitalMotion==='editorial-flow'
      &&document.querySelector('.of-stage')?.hidden===true));

  /* ---- 13. Studio still opens over the preset ---- */
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(700);
  check(`${label} · Restaurant Studio still opens`,
    await page.evaluate(()=>document.getElementById('studio').getAttribute('aria-hidden')==='false'));
  await page.evaluate(()=>document.querySelector('#studio-close').click());
  await page.waitForTimeout(400);

  const fatal=errors.filter(e=>!/favicon|net::ERR/i.test(e));
  check(`${label} · no JS errors`,fatal.length===0,fatal.slice(0,3).join(' | '));
  await context.close();
}

await run('desktop',{width:1440,height:900},false);
await run('mobile',{width:390,height:844},true);

/* ---- reduced motion: nothing may be lost ---- */
{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const rm=await page.evaluate(()=>({
    hero:!!document.querySelector('#orbit-stage .orbit-dish[data-orbit-hero="1"]'),
    title:document.getElementById('dish-title').textContent.trim(),
    price:document.querySelector('.of-price').textContent.trim(),
    controls:!!document.querySelector('#next-dish'),
    reduced:window.RestaurantOrbitalFood.state().reduced
  }));
  check('reduced-motion · product, copy, price and controls all survive',
    rm.hero&&rm.title.length>2&&rm.price.length>0&&rm.controls&&rm.reduced,JSON.stringify(rm));
  const before=await page.evaluate(()=>window.RestaurantOrbit.getActiveIndex());
  await page.click('#next-dish');await page.waitForTimeout(1300);
  check('reduced-motion · navigation still changes the product',
    await page.evaluate(v=>window.RestaurantOrbit.getActiveIndex()!==v,before));
  await page.evaluate(()=>document.querySelector('#explore-dish').click());
  await page.waitForTimeout(1300);
  check('reduced-motion · the dish detail still opens',
    await page.evaluate(()=>document.getElementById('dish-detail').classList.contains('is-open')));
  await page.evaluate(()=>document.querySelector('#detail-close')?.click());
  await page.waitForTimeout(600);
  await page.screenshot({path:path.join(SHOTS,'orbital-food-reduced-motion.png')});
  await context.close();
}

/* ---- persistence of the new metadata ---- */
{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await selectPreset(page,'orbital-food','orbitalFood');
  await page.waitForTimeout(900);
  const before=await page.evaluate(()=>JSON.stringify(
    (window.RestaurantDefaults.dishes||[]).map(d=>d.orbitalFood||null)));
  /* edit an unrelated field, wait for the store, reload */
  const stamp=`LAB-${Date.now()%100000}`;
  await page.evaluate(()=>document.querySelector('.studio-open').click());
  await page.waitForTimeout(600);
  await page.evaluate(v=>{
    const input=document.querySelector('[data-path="brand.name"]');
    input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  },stamp);
  await page.waitForTimeout(2600);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:25000});
  await page.waitForTimeout(1400);
  const after=await page.evaluate(()=>JSON.stringify(
    (window.RestaurantDefaults.dishes||[]).map(d=>d.orbitalFood||null)));
  const brand=await page.evaluate(()=>document.querySelector('[data-path="brand.name"]')?.value||'');
  const preset=await page.evaluate(()=>document.getElementById('motion-orbital-style')?.value);
  check('persistence · orbitalFood metadata survives an unrelated edit and a reload',
    after===before&&/orbitScale/.test(after),after.slice(0,90));
  check('persistence · the preset choice and the edit both survive the reload',
    preset==='orbital-food'&&brand===stamp,`${preset} / ${brand}`);
  await context.close();
}

await browser.close();server.close();

const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
console.log(`screenshots → ${SHOTS}`);
if(failed.length){console.error(`ORBITAL_FOOD_FAIL: ${failed.map(f=>f.name).join(' | ')}`);process.exit(1)}
console.log('ORBITAL_FOOD_PASS');
