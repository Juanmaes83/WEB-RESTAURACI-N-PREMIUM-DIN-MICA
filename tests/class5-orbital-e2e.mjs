import { chromium } from 'playwright';
import fs from 'node:fs';

const source=fs.readFileSync('class5-urban-harmony.js','utf8');
const required=[
  "rotation:direction*1080",
  "function addReverseSweep",
  "function addAirTurn",
  "function addSoloist",
  "function addCrewRecoil",
  "scale:.68",
  "scale:1.40",
  "scale:1.18"
];
for(const token of required){
  if(!source.includes(token))throw new Error(`Missing Class 5 choreography contract: ${token}`);
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});

function assert(condition,message){if(!condition)throw new Error(message)}

try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.orbitalChoreography==='urban-acrobatics-v5-final',{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#orbit-stage .orbit-dish').length>=3,{timeout:15000});
  await page.locator('#signature').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const roles=await page.evaluate(()=>{
    const shell=document.querySelector('.orbit-shell');
    const stage=document.querySelector('#orbit-stage');
    const sr=shell.getBoundingClientRect();
    const cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;
    const list=[...stage.querySelectorAll('.orbit-dish')].map(el=>{
      const r=el.getBoundingClientRect();
      return {id:el.dataset.id,dx:r.left+r.width/2-cx,dy:r.top+r.height/2-cy};
    });
    const score=x=>Math.abs(x.dx)+Math.abs(x.dy)*.18;
    const outgoing=[...list].sort((a,b)=>score(a)-score(b))[0];
    const side=list.filter(x=>x!==outgoing&&x.dx>8).sort((a,b)=>score(a)-score(b));
    const solo=side[0]||list.filter(x=>x!==outgoing).sort((a,b)=>score(a)-score(b))[0];
    const rest=list.filter(x=>x.id!==outgoing.id&&x.id!==solo.id);
    const rear=rest.filter(x=>Math.abs(x.dy)>35).sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
    const preferred=rear.filter(x=>x.dx>0);
    const feature=preferred[0]||rear[0]||rest.sort((a,b)=>Math.abs(b.dx)-Math.abs(a.dx))[0];
    return {solo:solo.id,feature:feature.id,others:list.filter(x=>x.id!==solo.id).map(x=>x.id)};
  });

  const sample=async id=>page.evaluate(id=>{
    const img=document.querySelector(`.orbit-dish[data-id="${id}"] img`);
    const cs=getComputedStyle(img);
    const m=cs.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(cs.transform);
    return {scale:Math.hypot(m.a,m.b),x:m.e,y:m.f,transform:cs.transform,opacity:Number(cs.opacity),filter:cs.filter};
  },id);

  await page.click('#next-dish');

  await page.waitForTimeout(300);
  const pullBack=await sample(roles.solo);
  assert(pullBack.scale<.90,`SOLOIST pull-back not visible enough: scale=${pullBack.scale}`);

  await page.waitForTimeout(200);
  const featureMotion=await sample(roles.feature);
  assert(featureMotion.transform!=='none'&&(Math.abs(featureMotion.x)>3||Math.abs(featureMotion.y)>3||Math.abs(featureMotion.scale-1)>.02),`FEATURE DANCER did not visibly move: ${JSON.stringify(featureMotion)}`);

  await page.waitForTimeout(280);
  const attack=await sample(roles.solo);
  assert(attack.scale>1.20,`SOLOIST frontal attack did not overshoot: scale=${attack.scale}`);

  await page.waitForTimeout(200);
  const stopped=await sample(roles.solo);
  assert(stopped.scale>1.12,`SOLOIST did not remain dominant at brake/hold: scale=${stopped.scale}`);
  assert(Math.abs(stopped.y)<6,`SOLOIST was not visually stopped near landing pose: y=${stopped.y}`);

  await page.waitForTimeout(220);
  const recoil=await Promise.all(roles.others.map(sample));
  const recoiling=recoil.filter(x=>x.scale<.96&&x.opacity<.8);
  assert(recoiling.length>=Math.max(2,roles.others.length-1),`Crew recoil not synchronized/readable: ${JSON.stringify(recoil)}`);

  await page.waitForTimeout(700);
  const heroFinal=await sample(roles.solo);
  const othersFinal=await Promise.all(roles.others.map(sample));
  assert(heroFinal.scale>1.08,`Final protagonist lost hierarchy: scale=${heroFinal.scale}`);
  assert(othersFinal.every(x=>Math.abs(x.scale-1)<.06),`Crew did not restore formation: ${JSON.stringify(othersFinal)}`);

  assert(errors.length===0,`Browser errors detected: ${errors.join(' | ')}`);
  console.log('CLASS5_ORBITAL_E2E_PASS');
  console.log(JSON.stringify({roles,pullBack,featureMotion,attack,stopped,recoil,heroFinal,othersFinal},null,2));
}finally{
  await browser.close();
}
