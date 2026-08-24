import { chromium } from 'playwright';
import fs from 'node:fs';

const source=fs.readFileSync('class5-urban-harmony.js','utf8');
const required=[
  'rotation:direction*1080',
  'function addReverseSweep',
  'function addAirTurn',
  'function addSoloist',
  'function addCrewRecoil',
  'scale:.66',
  'scale:1.42',
  'scale:1.18'
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
  await page.waitForTimeout(300);

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
    const side=list.filter(x=>x.id!==outgoing.id&&x.dx>8).sort((a,b)=>score(a)-score(b));
    const solo=side[0]||list.filter(x=>x.id!==outgoing.id).sort((a,b)=>score(a)-score(b))[0];
    const rest=list.filter(x=>x.id!==outgoing.id&&x.id!==solo.id);
    const rear=rest.filter(x=>Math.abs(x.dy)>35).sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
    const preferred=rear.filter(x=>x.dx>0);
    const feature=preferred[0]||rear[0]||rest.sort((a,b)=>Math.abs(b.dx)-Math.abs(a.dx))[0];
    return {solo:solo.id,feature:feature.id,others:list.filter(x=>x.id!==solo.id).map(x=>x.id)};
  });

  await page.evaluate(roles=>{
    const read=id=>{
      const img=document.querySelector(`.orbit-dish[data-id="${id}"] img`);
      const cs=getComputedStyle(img);
      const m=cs.transform==='none'?new DOMMatrixReadOnly():new DOMMatrixReadOnly(cs.transform);
      return {
        scale:Math.hypot(m.a,m.b),
        x:m.e,
        y:m.f,
        opacity:Number(cs.opacity),
        angle:Math.atan2(m.b,m.a)*180/Math.PI,
        filter:cs.filter
      };
    };
    window.__class5Samples=[];
    window.__class5Sampling=true;
    window.__class5T0=performance.now();
    const loop=()=>{
      if(!window.__class5Sampling)return;
      window.__class5Samples.push({
        t:performance.now()-window.__class5T0,
        solo:read(roles.solo),
        feature:read(roles.feature),
        others:roles.others.map(id=>({id,...read(id)}))
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },roles);

  await page.click('#next-dish');
  await page.waitForTimeout(2300);
  const samples=await page.evaluate(()=>{window.__class5Sampling=false;return window.__class5Samples;});

  assert(samples.length>70,`Insufficient animation samples: ${samples.length}`);

  const minSolo=samples.reduce((a,b)=>b.solo.scale<a.solo.scale?b:a,samples[0]);
  const maxSolo=samples.reduce((a,b)=>b.solo.scale>a.solo.scale?b:a,samples[0]);
  assert(minSolo.solo.scale<.80,`SOLOIST did not visibly pull back: min=${minSolo.solo.scale.toFixed(3)} at ${minSolo.t.toFixed(0)}ms`);
  assert(maxSolo.solo.scale>1.30,`SOLOIST did not visibly zoom toward viewer: max=${maxSolo.solo.scale.toFixed(3)} at ${maxSolo.t.toFixed(0)}ms`);
  assert(minSolo.t<maxSolo.t,`SOLOIST order invalid: pull-back ${minSolo.t}ms, zoom-in ${maxSolo.t}ms`);

  const featurePeak=samples.reduce((best,s)=>{
    const energy=Math.abs(s.feature.x)+Math.abs(s.feature.y)+Math.abs(s.feature.scale-1)*80;
    return energy>best.energy?{energy,s}:best;
  },{energy:-1,s:null});
  assert(featurePeak.energy>12,`FEATURE DANCER lost approved movement: energy=${featurePeak.energy.toFixed(2)}`);

  const stableHero=samples.filter(s=>s.t>maxSolo.t+50&&s.solo.scale>1.14&&s.solo.scale<1.23&&Math.abs(s.solo.y)<5);
  assert(stableHero.length>=5,`Hero brake/hold not readable after attack: frames=${stableHero.length}`);

  const recoilFrames=samples.map(s=>({
    s,
    count:s.others.filter(x=>x.scale<.94&&x.opacity<.75).length
  }));
  const recoilPeak=recoilFrames.reduce((a,b)=>b.count>a.count?b:a,recoilFrames[0]);
  const needed=Math.max(2,roles.others.length-1);
  assert(recoilPeak.count>=needed,`Crew recoil not synchronized: ${recoilPeak.count}/${roles.others.length} plates at ${recoilPeak.s.t.toFixed(0)}ms`);
  assert(recoilPeak.s.t>maxSolo.t,`Crew reacted before protagonist completed attack: recoil=${recoilPeak.s.t}ms maxSolo=${maxSolo.t}ms`);

  const featureSettledBeforeRecoil=samples.some(s=>{
    if(s.t<maxSolo.t||s.t>=recoilPeak.s.t)return false;
    const energy=Math.abs(s.feature.x)+Math.abs(s.feature.y)+Math.abs(s.feature.scale-1)*80;
    return energy<7;
  });
  assert(featureSettledBeforeRecoil,'Feature trick did not finish before crew recoil');

  const final=samples[samples.length-1];
  assert(final.solo.scale>1.08,`Final protagonist lost hierarchy: scale=${final.solo.scale.toFixed(3)}`);
  assert(final.others.every(x=>Math.abs(x.scale-1)<.07),`Crew did not restore formation: ${JSON.stringify(final.others)}`);
  assert(errors.length===0,`Browser errors detected: ${errors.join(' | ')}`);

  console.log('CLASS5_ORBITAL_E2E_PASS');
  console.log(JSON.stringify({
    roles,
    samples:samples.length,
    pullBack:{t:minSolo.t,scale:minSolo.solo.scale},
    zoomIn:{t:maxSolo.t,scale:maxSolo.solo.scale},
    featurePeak:{t:featurePeak.s.t,energy:featurePeak.energy},
    heroHoldFrames:stableHero.length,
    recoil:{t:recoilPeak.s.t,count:recoilPeak.count,total:roles.others.length},
    final:{soloScale:final.solo.scale,others:final.others.map(x=>x.scale)}
  },null,2));
}finally{
  await browser.close();
}
