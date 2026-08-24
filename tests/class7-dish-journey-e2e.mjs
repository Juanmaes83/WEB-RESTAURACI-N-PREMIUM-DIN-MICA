import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:980}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});

const ready=async()=>{
  await page.waitForSelector('#orbit-stage .orbit-dish',{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=6,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.class7Runtime==='ready',{timeout:15000});
};

await page.goto('http://127.0.0.1:4173/index.html?lang=es',{waitUntil:'networkidle'});
await ready();

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

const journeyImage=page.locator('#class7-journey-image');
if(!(await journeyImage.isVisible()))throw new Error('Persistent journey dish is not visible');

const checkpoints=[
  ['#experience','origin'],
  ['.experience-section','atmosphere'],
  ['.chef-section','chef'],
  ['#visit','visit']
];
const positions=[];
for(const [selector,key] of checkpoints){
  await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.waitForTimeout(900);
  await page.waitForFunction(k=>document.documentElement.dataset.journeySection===k,key,{timeout:6000});
  const box=await journeyImage.boundingBox();
  if(!box||box.width<80||box.height<80)throw new Error(`Journey dish invalid at ${key}`);
  const context=page.locator(`.class7-context[data-journey-context="${key}"]`);
  if(!(await context.isVisible()))throw new Error(`Context not visible at ${key}`);
  positions.push({key,x:Math.round(box.x),y:Math.round(box.y),w:Math.round(box.width)});
}

const unique=new Set(positions.map(p=>`${Math.round(p.x/40)}:${Math.round(p.y/40)}:${Math.round(p.w/40)}`));
if(unique.size<3)throw new Error('Dish did not visibly change position/scale across sections');

await page.click('.studio-open');
await page.waitForTimeout(250);
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

if(errors.length)throw new Error(errors.join('\n'));
console.log('CLASS7_DISH_JOURNEY_E2E_PASS');
console.log(JSON.stringify({dish:'Gamba roja salvaje',path:['detail','origin','atmosphere','chef','visit'],positions,panel:'OFF/ON persistence'},null,2));
await browser.close();
