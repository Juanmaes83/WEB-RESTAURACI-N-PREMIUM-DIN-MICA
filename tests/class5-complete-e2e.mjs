import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

async function waitReady(){
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('[data-panel="motion"]')&&document.getElementById('motion-orbital-style'),{timeout:15000});
  await page.waitForTimeout(500);
}

async function openMotion(){
  await page.click('.studio-open');
  await page.waitForFunction(()=>document.getElementById('studio')?.getAttribute('aria-hidden')==='false',{timeout:4000});
  await page.click('.studio-nav [data-panel="motion"]');
  await page.waitForFunction(()=>!document.querySelector('.studio-panel[data-panel="motion"]')?.hidden,{timeout:2000});
}

async function closeStudio(){
  await page.click('#studio-close');
  await page.waitForFunction(()=>document.getElementById('studio')?.getAttribute('aria-hidden')==='true',{timeout:3000});
}

async function roles(){return page.evaluate(()=>{
  const shell=document.querySelector('.orbit-shell'),sr=shell.getBoundingClientRect(),cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;
  const list=[...document.querySelectorAll('#orbit-stage .orbit-dish')].map(el=>{const r=el.getBoundingClientRect();return{id:el.dataset.id,dx:r.left+r.width/2-cx,dy:r.top+r.height/2-cy}});
  const score=x=>Math.abs(x.dx)+Math.abs(x.dy)*.18;
  const outgoing=[...list].sort((a,b)=>score(a)-score(b))[0];
  const side=list.filter(x=>x.id!==outgoing.id&&x.dx>8).sort((a,b)=>score(a)-score(b));
  const solo=side[0]||list.filter(x=>x.id!==outgoing.id).sort((a,b)=>score(a)-score(b))[0];
  const rest=list.filter(x=>x.id!==outgoing.id&&x.id!==solo.id);
  const rear=rest.filter(x=>Math.abs(x.dy)>35).sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
  const feature=rear.filter(x=>x.dx>0)[0]||rear[0]||rest[0];
  return{solo:solo.id,feature:feature.id,others:list.filter(x=>x.id!==solo.id).map(x=>x.id)};
});}

try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await waitReady();

  /* Studio + default Elegant preset. */
  await openMotion();
  assert(await page.locator('#motion-orbital-style').inputValue()==='elegant','Default Orbital preset is not Elegant');
  assert(await page.locator('.motion-panel select[data-path^="motion."]').count()>=9,'Motion Studio controls are incomplete');
  await closeStudio();
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.click('#next-dish');
  await page.waitForTimeout(180);
  assert(await page.evaluate(()=>document.documentElement.dataset.orbitalChoreography)==='elegant-orbit-v1','Elegant choreography did not own Orbital interaction');

  /* Switch project to Urban and verify full approved trajectory. */
  await openMotion();
  await page.selectOption('#motion-orbital-style','urban');
  await page.waitForFunction(()=>document.documentElement.dataset.orbitalMotion==='urban',{timeout:2500});
  await page.selectOption('[data-path="motion.text.philosophy"]','mask');
  await page.selectOption('[data-path="motion.media.atmosphere"]','still');
  assert(await page.evaluate(()=>document.documentElement.dataset.textPhilosophy)==='mask','Text reveal preset did not apply');
  assert(await page.evaluate(()=>document.documentElement.dataset.mediaAtmosphere)==='still','Media preset did not apply');
  await closeStudio();
  await page.locator('#signature').scrollIntoViewIfNeeded();
  const r=await roles();

  await page.evaluate(r=>{
    const read=id=>{const img=document.querySelector(`.orbit-dish[data-id="${id}"] img`),cs=getComputedStyle(img),m=cs.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(cs.transform);return{scale:Math.hypot(m.a,m.b),x:m.e,y:m.f,opacity:Number(cs.opacity)}};
    window.__class5Samples=[];window.__class5Sampling=true;window.__class5T0=performance.now();
    const loop=()=>{if(!window.__class5Sampling)return;window.__class5Samples.push({t:performance.now()-window.__class5T0,solo:read(r.solo),feature:read(r.feature),others:r.others.map(id=>({id,...read(id)}))});requestAnimationFrame(loop)};requestAnimationFrame(loop);
  },r);
  await page.click('#next-dish');
  await page.waitForTimeout(2300);
  const samples=await page.evaluate(()=>{window.__class5Sampling=false;return window.__class5Samples});
  assert(samples.length>35,`Too few Urban samples: ${samples.length}`);
  const minSolo=samples.reduce((a,b)=>b.solo.scale<a.solo.scale?b:a,samples[0]);
  const maxSolo=samples.reduce((a,b)=>b.solo.scale>a.solo.scale?b:a,samples[0]);
  assert(minSolo.solo.scale<.80,`Urban SOLOIST did not pull back: ${minSolo.solo.scale}`);
  assert(maxSolo.solo.scale>1.30,`Urban SOLOIST did not attack toward viewer: ${maxSolo.solo.scale}`);
  assert(minSolo.t<maxSolo.t,'Urban SOLOIST zoom order is wrong');
  const featurePeak=samples.reduce((best,s)=>{const energy=Math.abs(s.feature.x)+Math.abs(s.feature.y)+Math.abs(s.feature.scale-1)*80;return energy>best.energy?{energy,s}:best},{energy:-1,s:null});
  assert(featurePeak.energy>12,`Feature dancer lost approved movement: ${featurePeak.energy}`);
  const recoil=samples.map(s=>({s,count:s.others.filter(x=>x.scale<.94&&x.opacity<.75).length})).reduce((a,b)=>b.count>a.count?b:a);
  assert(recoil.count>=4,`Crew recoil is not synchronized: ${recoil.count}/5`);
  assert(recoil.s.t>maxSolo.t,'Crew reacted before hero attack/brake');
  assert(await page.evaluate(()=>document.documentElement.dataset.orbitalChoreography)==='urban-acrobatics-v5-final','Urban choreography did not remain active');

  /* Persistence: motion is project-level and survives reload. */
  await page.waitForTimeout(900);
  await page.reload({waitUntil:'domcontentloaded'});await waitReady();
  await openMotion();
  assert(await page.locator('#motion-orbital-style').inputValue()==='urban','Urban project preset was not restored');
  assert(await page.locator('[data-path="motion.text.philosophy"]').inputValue()==='mask','Text motion preset was not restored');
  assert(await page.locator('[data-path="motion.media.atmosphere"]').inputValue()==='still','Media motion preset was not restored');
  await closeStudio();

  /* Reduced motion keeps Orbital functional. */
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'domcontentloaded'});await waitReady();
  await page.waitForFunction(()=>document.documentElement.dataset.motionReduced==='true',{timeout:5000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  const before=await page.locator('#dish-counter').textContent();
  await page.click('#next-dish');await page.waitForTimeout(900);
  const after=await page.locator('#dish-counter').textContent();
  assert(before!==after,`Reduced motion broke Orbital navigation: ${before} -> ${after}`);

  assert(errors.length===0,`Browser errors: ${errors.join(' | ')}`);
  console.log('CLASS5_COMPLETE_E2E_PASS');
  console.log(JSON.stringify({samples:samples.length,pullBack:minSolo.solo.scale,zoomIn:maxSolo.solo.scale,featureEnergy:featurePeak.energy,recoil:`${recoil.count}/5`,persistence:'urban + text + media',reducedMotion:`${before} -> ${after}`},null,2));
}finally{
  await browser.close();
}
