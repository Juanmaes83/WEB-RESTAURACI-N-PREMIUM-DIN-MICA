import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

async function ready(){
  await page.waitForFunction(()=>document.documentElement.dataset.class6==='product-final',null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('.studio-nav [data-panel="class6"]')&&document.querySelector('#class6-language'),null,{timeout:15000});
  await page.waitForTimeout(450);
}
async function openPanel(name){
  await page.click('.studio-open');
  await page.waitForFunction(()=>document.getElementById('studio')?.getAttribute('aria-hidden')==='false',null,{timeout:4000});
  await page.click(`.studio-nav [data-panel="${name}"]`);
  await page.waitForFunction(n=>!document.querySelector(`.studio-panel[data-panel="${n}"]`)?.hidden,name,{timeout:2500});
}
async function closeStudio(){await page.click('#studio-close');await page.waitForFunction(()=>document.getElementById('studio')?.getAttribute('aria-hidden')==='true',null,{timeout:3000})}
async function visualHeroId(){return page.evaluate(()=>{const shell=document.querySelector('.orbit-shell'),sr=shell.getBoundingClientRect(),cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;return[...document.querySelectorAll('#orbit-stage .orbit-dish')].map(el=>{const r=el.getBoundingClientRect();return{id:el.dataset.id,score:Math.abs(r.left+r.width/2-cx)+Math.abs(r.top+r.height/2-cy)*.18}}).sort((a,b)=>a.score-b.score)[0]?.id})}
async function openHeroByPlate(){
  const id=await visualHeroId();assert(id,'No visual hero dish found');
  await page.locator(`#orbit-stage .orbit-dish[data-id="${id}"]`).click();
  await page.waitForFunction(()=>document.getElementById('dish-detail')?.getAttribute('aria-hidden')==='false',null,{timeout:3500});
  await page.waitForFunction(()=>{const d=document.getElementById('dish-detail'),cs=getComputedStyle(d),r=d.getBoundingClientRect();return d.classList.contains('is-open')&&cs.visibility==='visible'&&Number(cs.opacity)>.95&&r.width>innerWidth*.9&&r.height>innerHeight*.9},{timeout:3500});
  assert(await page.locator(`#detail-visual .orbit-dish[data-id="${id}"]`).count()===1,'Hero plate was not moved into emotional detail');
  await page.waitForFunction(()=>document.getElementById('class6-story-text')?.textContent?.length>80,null,{timeout:3000});
  return id;
}
async function closeHeroAndAssertReturn(id){
  await page.click('#detail-close');
  await page.waitForFunction(()=>document.getElementById('dish-detail')?.getAttribute('aria-hidden')==='true',null,{timeout:3500});
  await page.waitForFunction(()=>{const d=document.getElementById('dish-detail'),cs=getComputedStyle(d);return Number(cs.opacity)<.05&&cs.visibility==='hidden'},{timeout:3500});
  assert(await page.locator(`#orbit-stage .orbit-dish[data-id="${id}"]`).count()===1,'Hero plate did not return to Orbital after closing detail');
}

try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await ready();

  /* Class 06 UI + Spanish default. */
  assert(await page.locator('#class6-language [data-lang="es"]').getAttribute('aria-pressed')==='true','Spanish is not the initial public locale');
  assert((await page.locator('#hero-body').textContent()).includes('Producto mediterráneo'),'Spanish public copy did not apply');
  await openPanel('class6');
  assert(await page.locator('#class6-default-locale').inputValue()==='es','Studio locale default is not Spanish');
  assert(await page.locator('.class6-dish-fields [data-class6-field="story"]').count()===1,'Storytelling editor is missing');
  await closeStudio();

  /* Public EN switch + direct physical click on Elegant hero dish. */
  await page.click('#class6-language [data-lang="en"]');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert((await page.locator('#hero-body').textContent()).includes('Mediterranean produce'),'English public copy did not apply');
  await page.locator('#signature').scrollIntoViewIfNeeded();
  const elegantHero=await openHeroByPlate();
  assert(await page.evaluate(()=>document.documentElement.dataset.dishDetail)==='open','Detail lifecycle did not enter open state');
  const enStory=await page.locator('#class6-story-text').textContent();
  assert(enStory.includes('Santa Pola')||enStory.includes('Mediterranean'),'English emotional story is not populated');
  assert((await page.locator('#class6-elaboration-text').textContent()).length>70,'Elaboration block is missing');
  await closeHeroAndAssertReturn(elegantHero);
  assert(await page.evaluate(()=>document.documentElement.dataset.dishDetail)==='closed','Detail lifecycle did not return to closed state');

  /* Studio bilingual story is editable and persists through Class 04 store. */
  await openPanel('class6');
  await page.selectOption('#class6-edit-locale','en');
  await page.selectOption('#class6-dish-select','dish-01');
  await page.waitForTimeout(180);
  const storyField='.class6-dish-fields [data-class6-field="story"]';
  const marker='CLASS6 STORY PERSISTENCE TEST';
  await page.fill(storyField,marker+' — a deliberately edited English story for browser validation.');
  await page.waitForTimeout(900);
  await closeStudio();
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  await page.click('#class6-language [data-lang="en"]');
  await page.locator('#signature').scrollIntoViewIfNeeded();const persistedHero=await openHeroByPlate();
  await page.waitForFunction(m=>document.getElementById('class6-story-text')?.textContent?.includes(m),marker,{timeout:4000});
  await closeHeroAndAssertReturn(persistedHero);

  /* Class 05 regression: Urban remains operational with approved hero trajectory. */
  await openPanel('motion');
  await page.selectOption('#motion-orbital-style','urban');
  await page.waitForFunction(()=>document.documentElement.dataset.orbitalMotion==='urban',null,{timeout:2500});
  await closeStudio();
  await page.locator('#signature').scrollIntoViewIfNeeded();
  const role=await page.evaluate(()=>{const shell=document.querySelector('.orbit-shell'),sr=shell.getBoundingClientRect(),cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;const list=[...document.querySelectorAll('#orbit-stage .orbit-dish')].map(el=>{const r=el.getBoundingClientRect();return{id:el.dataset.id,dx:r.left+r.width/2-cx,dy:r.top+r.height/2-cy}});const score=x=>Math.abs(x.dx)+Math.abs(x.dy)*.18;const out=[...list].sort((a,b)=>score(a)-score(b))[0];const solo=list.filter(x=>x.id!==out.id&&x.dx>8).sort((a,b)=>score(a)-score(b))[0];return solo?.id});
  await page.evaluate(id=>{const read=()=>{const img=document.querySelector(`#orbit-stage .orbit-dish[data-id="${id}"] img`),cs=getComputedStyle(img),m=cs.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(cs.transform);return Math.hypot(m.a,m.b)};window.__c6=[];window.__c6on=true;const t=performance.now();const loop=()=>{if(!window.__c6on)return;window.__c6.push({t:performance.now()-t,s:read()});requestAnimationFrame(loop)};requestAnimationFrame(loop)},role);
  await page.click('#next-dish');await page.waitForTimeout(2100);
  const samples=await page.evaluate(()=>{window.__c6on=false;return window.__c6});
  const min=Math.min(...samples.map(x=>x.s)),max=Math.max(...samples.map(x=>x.s));
  assert(min<.80,`Class 06 broke Urban pull-back: ${min}`);assert(max>1.30,`Class 06 broke Urban zoom-in: ${max}`);
  /* Urban must also open the detail by clicking the actual hero plate, then resume after close. */
  const urbanHero=await openHeroByPlate();
  assert(await page.evaluate(()=>document.documentElement.dataset.dishDetail)==='open','Urban direct plate click did not enter detail lifecycle');
  await closeHeroAndAssertReturn(urbanHero);await page.waitForTimeout(450);
  assert(await page.evaluate(()=>document.documentElement.dataset.orbitalChoreography)==='urban-acrobatics-v5-final','Urban choreography did not resume after detail close');

  /* Second restaurant proof: import MAREA without touching code. */
  await openPanel('project');
  page.once('dialog',d=>d.accept());
  await page.setInputFiles('#import-config','presets/MAREA-CLASS06.json');
  await page.waitForTimeout(1000);
  assert((await page.locator('#studio-project-name').textContent())==='MAREA','Second restaurant preset did not import');
  await closeStudio();
  await page.waitForTimeout(350);
  assert((await page.locator('.brand-visual').textContent()).includes('MAREA'),'Second restaurant branding did not reach public site');

  /* Reduced motion + keyboard navigation remain functional with the 3-dish imported restaurant. */
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'domcontentloaded'});await ready();
  await page.locator('#signature').scrollIntoViewIfNeeded();const before=await page.locator('#dish-counter').textContent();await page.locator('.orbit-shell').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(800);const after=await page.locator('#dish-counter').textContent();assert(before!==after,`Reduced motion keyboard navigation failed: ${before} -> ${after}`);

  /* SEO/structured data. */
  assert(await page.locator('link[rel="canonical"]').count()===1,'Canonical missing');
  assert(await page.locator('link[rel="alternate"][hreflang="es"]').count()===1,'ES hreflang missing');
  assert(await page.locator('link[rel="alternate"][hreflang="en"]').count()===1,'EN hreflang missing');
  const schema=JSON.parse(await page.locator('#class6-schema').textContent());assert(schema['@type']==='Restaurant','Restaurant schema missing');

  assert(errors.length===0,`Browser errors: ${errors.join(' | ')}`);
  console.log('CLASS6_PRODUCT_E2E_PASS');
  console.log(JSON.stringify({languages:'ES/EN',directHeroClick:'Elegant + Urban',visibleDetail:'opacity + viewport + story',storyLength:enStory.length,urbanPullBack:min,urbanZoomIn:max,secondRestaurant:'MAREA',reducedMotion:`${before} -> ${after}`,schema:schema['@type']},null,2));
}finally{await browser.close()}