/* PROJECT 02 — REAL MASTER SCENE INGEST.

   The proxy set is gone. This is the pipeline for the real photography in
   MANO+OBJETO/: measure every source, decide which ones belong to the same take,
   solve the registration that puts their anchors on top of each other, and emit the
   runtime assets plus the manifest the engine and the audit read.

   It does NOT bake the registration into the pixels. Per the asset contract, a
   scene that sits a few pixels off is corrected by its own numbers in the manifest,
   so replacing the photography is a data drop, not a code change.

   Usage: node scripts/ingest-anchor-scenes.mjs
   Output: assets/anchor-scenes/runtime/scene-XX-<slug>.webp
           assets/anchor-scenes/scenes-manifest.json
           tests/screenshots/anchor-scenes-real-alignment-sheet.png
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SRC_DIR=path.join(ROOT,'MANO+OBJETO');
const RUNTIME=path.join(ROOT,'assets','anchor-scenes','runtime');
const MANIFEST=path.join(ROOT,'assets','anchor-scenes','scenes-manifest.json');
const SHEET=path.join(ROOT,'tests','screenshots','anchor-scenes-real-alignment-sheet.png');

/* The curation table. Which real photograph belongs to which dish is a human
   decision about content, so it lives here in the open rather than being guessed at
   runtime. Slugs name the dish, not the file. */
const CURATION={
  '5faa56e1-c9e1-48fb-bc5b-81e7ef683715.png':
    {dishId:'dish-02',slug:'atun-rojo',product:'Atún rojo / Naranja sanguina',note:'seared bluefin, avocado, edamame, radish'},
  '88a2a7a6-51f9-4c8b-869c-bb66eefa0a25.png':
    {dishId:'dish-04',slug:'lubina-salvaje',product:'Lubina salvaje',note:'raw fish cubes, avocado, radish'},
  'affdb8f4-8d67-4b7e-a010-f9cb028b4d38 (1).png':
    {dishId:'dish-01',slug:'gamba-roja',product:'Gamba roja salvaje',note:'prawns with tail, rice, micro herbs'},
  'c4e5577e-ae4b-484d-8afd-a6fd25df9660.png':
    {dishId:'dish-05',slug:'presa-iberica',product:'Presa ibérica',note:'sliced meat, truffle, creamed grain'},
  'e8522199-d6d1-489f-a446-c440e5b97c9b.png':
    {dishId:'dish-03',slug:'brasa-pulpo',product:'Alcachofa a la brasa',note:'charred octopus, tomato, potato'},
  '22285005-1749-47d7-9274-a45ad6f267f1 (1).png':
    {dishId:'dish-06',slug:'citricos-miel',product:'Cítricos y miel quemada',note:'dessert, honeycomb tuile'}
};

/* Selection thresholds. These decide whether a photograph belongs to the same take,
   which is a stricter question than whether it is a good photograph. */
const SELECT={
  objectScale:.045,   /* rim width, relative to the group median */
  objectShift:.045,   /* rim height, as a fraction of the canvas */
  fingerDiff:20,      /* mean difference in the finger zone, 0..255 */
  fingerPct:8.5       /* percentage of finger-zone pixels that moved */
};
const QUALITY=.92;

const files=fs.readdirSync(SRC_DIR).filter(f=>/\.png$/i.test(f)).sort();
if(!files.length){console.error(`no source images in ${SRC_DIR}`);process.exit(2)}
const unknown=files.filter(f=>!CURATION[f]);
if(unknown.length)console.log(`note: not in the curation table, ignored — ${unknown.join(', ')}`);

const url=f=>'/'+encodeURIComponent('MANO+OBJETO')+'/'+encodeURIComponent(f);
const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await context.newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

/* ---------- measure ---------- */
const measured=await page.evaluate(async urls=>{
  const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(s));i.src=s});
  const imgs=await Promise.all(urls.map(load));
  const W=imgs[0].naturalWidth,H=imgs[0].naturalHeight;
  const px=imgs.map(im=>{
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
    return {w:im.naturalWidth,h:im.naturalHeight,d:x.getImageData(0,0,im.naturalWidth,im.naturalHeight).data};
  });

  /* A studio backdrop is smooth, so it has almost no local gradient while every real
     silhouette edge has one. Scanning for the gradient rather than the colour makes
     the vignette irrelevant — an absolute per-row colour model reports the vignette
     itself as foreground and puts the silhouette at the frame edge. */
  const geometry=p=>{
    const {w,h,d}=p;
    const lum=new Float32Array(w*h);
    for(let i=0,q=0;q<w*h;q++,i+=4)lum[q]=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
    const edge=(x,y)=>Math.abs(lum[y*w+x+3]-lum[y*w+x-3])>11;
    const prof=[];
    for(let y=0;y<h;y+=2){
      let l=-1,r=-1;
      for(let x=5;x<w-5;x++)if(edge(x,y)){if(l<0)l=x;r=x}
      prof.push({y,l,r,w:l<0?0:r-l});
    }
    const rimStart=prof.find(q=>q.w>w*.52);
    const near=rimStart?prof.filter(q=>q.y>=rimStart.y&&q.y<=rimStart.y+70):[];
    const rim=near.reduce((a,q)=>q.w>a.w?q:a,near[0]||{l:0,r:0,y:0,w:0});
    const top=prof.find(q=>q.w>30)?.y??0;
    return {rimY:rim.y,rimL:rim.l,rimR:rim.r,rimW:rim.w,contentTop:top};
  };

  /* Three anchor zones the food never occupies. Fingers are the sensitive one: they
     wrap the object, so a differently sized object moves them even when the palm and
     the wrist are pixel-identical. */
  const ZONES={
    fingers:{x0:.14,x1:.86,y0:.40,y1:.57},
    palm:{x0:.20,x1:.80,y0:.57,y1:.68},
    wrist:{x0:.30,x1:.95,y0:.70,y1:.99}
  };
  const zoneDiff=(a,b,z,dx=0,dy=0)=>{
    const w=a.w,h=a.h;
    const x0=Math.round(w*z.x0),x1=Math.round(w*z.x1),y0=Math.round(h*z.y0),y1=Math.round(h*z.y1);
    let s=0,n=0,over=0;
    for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){
      const sx=x+dx,sy=y+dy;
      if(sx<0||sy<0||sx>=w||sy>=h)continue;
      const i=(y*w+x)*4,j=(sy*w+sx)*4;
      const e=Math.max(Math.abs(a.d[i]-b.d[j]),Math.abs(a.d[i+1]-b.d[j+1]),Math.abs(a.d[i+2]-b.d[j+2]));
      s+=e;n++;if(e>48)over++;
    }
    return {mean:+(s/n).toFixed(2),pct:+(100*over/n).toFixed(2)};
  };

  const geo=px.map(geometry);
  /* the reference take is the scene closest to the group median rim width */
  const widths=geo.map(g=>g.rimW).slice().sort((a,b)=>a-b);
  const medianW=widths[widths.length>>1];
  const refIdx=geo.reduce((best,g,i)=>Math.abs(g.rimW-medianW)<Math.abs(geo[best].rimW-medianW)?i:best,0);

  /* Registration: search a small translation that minimises the difference over palm
     and wrist together — the part of the hand that must not move. Sub-pixel accuracy
     is pointless here; the display box is smaller than the source. */
  const solve=i=>{
    if(i===refIdx)return {dx:0,dy:0,before:0,after:0};
    const score=(dx,dy)=>zoneDiff(px[refIdx],px[i],ZONES.palm,dx,dy).mean
                        +zoneDiff(px[refIdx],px[i],ZONES.wrist,dx,dy).mean;
    let best={dx:0,dy:0,v:score(0,0)};
    const before=best.v;
    for(let dy=-8;dy<=8;dy+=2)for(let dx=-8;dx<=8;dx+=2){
      const v=score(dx,dy);
      if(v<best.v-1e-6)best={dx,dy,v};
    }
    return {dx:best.dx,dy:best.dy,before:+before.toFixed(2),after:+best.v.toFixed(2)};
  };

  return {
    canvas:{W,H},refIdx,medianW,
    scenes:px.map((p,i)=>({
      i,w:p.w,h:p.h,
      orientation:p.w<p.h?'portrait':'landscape',
      geo:geo[i],
      /* every zone measured against the reference take */
      fingers:zoneDiff(px[refIdx],p,ZONES.fingers),
      palm:zoneDiff(px[refIdx],p,ZONES.palm),
      wrist:zoneDiff(px[refIdx],p,ZONES.wrist),
      registration:solve(i)
    })),
    zones:ZONES
  };
},files.map(url));

const {canvas:{W,H},refIdx,medianW}=measured;
console.log(`sources: ${files.length} @ ${W}x${H}   reference take: ${String.fromCharCode(65+refIdx)}\n`);
console.log('src  rimW    Δscale  rimY   Δshift  fingers        palm         registration');
const rows=measured.scenes.map((s,i)=>{
  const dScale=Math.abs(s.geo.rimW-medianW)/medianW;
  const dShift=Math.abs(s.geo.rimY-measured.scenes[refIdx].geo.rimY)/H;
  const reasons=[];
  if(s.w!==W||s.h!==H)reasons.push(`canvas ${s.w}x${s.h}`);
  if(s.orientation!==measured.scenes[refIdx].orientation)reasons.push('orientation');
  if(dScale>SELECT.objectScale)reasons.push(`object scale ${(dScale*100).toFixed(1)}% off the take`);
  if(dShift>SELECT.objectShift)reasons.push(`object sits ${(dShift*100).toFixed(1)}% of the frame away`);
  if(s.fingers.mean>SELECT.fingerDiff||s.fingers.pct>SELECT.fingerPct)
    reasons.push(`fingers move (${s.fingers.mean} mean, ${s.fingers.pct}% of pixels)`);
  const L=String.fromCharCode(65+i);
  console.log(`${L}    ${String(s.geo.rimW).padStart(4)}   ${(dScale*100).toFixed(1).padStart(5)}%  ${String(s.geo.rimY).padStart(4)}  ${(dShift*100).toFixed(1).padStart(5)}%  ${String(s.fingers.mean).padStart(5)}/${String(s.fingers.pct).padStart(5)}%  ${String(s.palm.mean).padStart(5)}/${String(s.palm.pct).padStart(5)}%  dx ${String(s.registration.dx).padStart(3)} dy ${String(s.registration.dy).padStart(3)}  ${reasons.length?'EXCLUDED':'selected'}`);
  if(reasons.length)console.log(`      └─ ${reasons.join(' · ')}`);
  return {i,file:files[i],letter:L,...s,dScale,dShift,reasons};
});

const selected=rows.filter(r=>!r.reasons.length&&CURATION[r.file]);
const excluded=rows.filter(r=>r.reasons.length||!CURATION[r.file]);
if(selected.length<3){console.error(`\nonly ${selected.length} coherent scenes — not enough for a swap`);process.exit(1)}
console.log(`\nselected ${selected.length}: ${selected.map(r=>r.letter).join(' ')}`);
if(excluded.length)console.log(`excluded ${excluded.length}: ${excluded.map(r=>r.letter).join(' ')}`);

/* ---------- emit runtime assets ---------- */
fs.rmSync(RUNTIME,{recursive:true,force:true});
fs.mkdirSync(RUNTIME,{recursive:true});
const order=['dish-01','dish-02','dish-03','dish-04','dish-05','dish-06'];
selected.sort((a,b)=>order.indexOf(CURATION[a.file].dishId)-order.indexOf(CURATION[b.file].dishId));

const scenes=[];
for(let n=0;n<selected.length;n++){
  const r=selected[n],cur=CURATION[r.file];
  const name=`scene-${String(n+1).padStart(2,'0')}-${cur.slug}.webp`;
  const data=await page.evaluate(async([src,q])=>{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error(src));i.src=src});
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    /* no transform is baked in: registration stays in the manifest */
    c.getContext('2d').drawImage(img,0,0);
    return c.toDataURL('image/webp',q);
  },[url(r.file),QUALITY]);
  fs.writeFileSync(path.join(RUNTIME,name),Buffer.from(data.split(',')[1],'base64'));

  /* the object's region, for the clickable area and the audit */
  const g=r.geo;
  const y1=Math.min(H,Math.round(g.rimY+g.rimW*.55));
  const obj={x:g.rimL,y:g.contentTop,w:g.rimW,h:y1-g.contentTop};
  scenes.push({
    dishIndex:order.indexOf(cur.dishId),
    dishId:cur.dishId,
    product:cur.product,
    sourceOriginal:`MANO+OBJETO/${r.file}`,
    runtimeAsset:`assets/anchor-scenes/runtime/${name}`,
    bytes:fs.statSync(path.join(RUNTIME,name)).size,
    canvas:{w:r.w,h:r.h},
    /* Registration is data, so a replacement photograph is corrected by its own
       numbers. offsetX / offsetY are fractions of the scene box, positive right and
       down; objectPosition is the object's centre in the same fractions. */
    registration:{
      scale:1,
      offsetX:+(r.registration.dx/W).toFixed(5),
      offsetY:+(r.registration.dy/H).toFixed(5),
      objectPosition:{x:+((obj.x+obj.w/2)/W).toFixed(4),y:+((obj.y+obj.h/2)/H).toFixed(4)}
    },
    object:obj,
    hit:{x:+(obj.x/W).toFixed(4),y:+(obj.y/H).toFixed(4),w:+(obj.w/W).toFixed(4),h:+(obj.h/H).toFixed(4)},
    anchor:{fingers:r.fingers,palm:r.palm,wrist:r.wrist,
      registrationGain:+(r.registration.before-r.registration.after).toFixed(2)},
    note:cur.note
  });
  console.log(`${name}  ${Math.round(scenes[n].bytes/1024)}KB  → ${cur.dishId}  ${cur.product}`);
}

const manifest={
  kind:'real',
  source:'MANO+OBJETO/',
  generatedBy:'scripts/ingest-anchor-scenes.mjs',
  generatedAt:new Date().toISOString().slice(0,10),
  canvas:{w:W,h:H},
  referenceTake:`MANO+OBJETO/${files[refIdx]}`,
  selectionThresholds:SELECT,
  anchorZones:measured.zones,
  scenes,
  excluded:excluded.map(r=>({
    sourceOriginal:`MANO+OBJETO/${r.file}`,
    product:CURATION[r.file]?.product||'(not in the curation table)',
    dishId:CURATION[r.file]?.dishId||null,
    measured:{rimW:r.geo.rimW,rimY:r.geo.rimY,
      objectScaleOff:+(r.dScale).toFixed(4),objectShiftOff:+(r.dShift).toFixed(4),
      fingers:r.fingers,palm:r.palm,wrist:r.wrist},
    reasons:r.reasons.length?r.reasons:['not in the curation table']
  })),
  note:'Real master photography. Registration lives here, not in the engine: dropping in a new set means replacing these files and their registration numbers.'
};
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2));
console.log(`\nmanifest → ${MANIFEST}`);

/* ---------- the alignment sheet: the first evidence that has to convince ---------- */
await page.setViewportSize({width:1400,height:1000});
await page.evaluate(([scenes,excluded])=>{
  document.body.style.margin='0';
  const cell=(src,label,bad)=>`<div style="position:relative;outline:${bad?'2px solid #ff3b5c':'none'};outline-offset:-2px">
      <img src="/${src}" style="width:100%;display:block">
      <span style="position:absolute;left:9px;top:7px;font:700 13px system-ui;color:${bad?'#ff3b5c':'#d8ff4f'};
        text-shadow:0 1px 4px rgba(0,0,0,.7)">${label}</span></div>`;
  document.body.innerHTML=`<div id="sheet" style="width:1380px;background:#0a0a0e;padding:10px;font:12px system-ui;color:#cfcbc2">
    <div style="padding:4px 2px 10px;letter-spacing:.18em;text-transform:uppercase;color:#d8ff4f">Selected · one take</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px">
      ${scenes.map((s,i)=>cell(s.runtimeAsset,`SCENE 0${i+1} · ${s.product}`,false)).join('')}
    </div>
    ${excluded.length?`<div style="padding:14px 2px 10px;letter-spacing:.18em;text-transform:uppercase;color:#ff3b5c">Excluded</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px">
      ${excluded.map(s=>cell(s.sourceOriginal.split('/').map(encodeURIComponent).join('/'),
        `${s.product} — ${s.reasons[0]}`,true)).join('')}</div>`:''}
  </div>`;
},[scenes,manifest.excluded]);
await page.waitForTimeout(2200);
await page.locator('#sheet').screenshot({path:SHEET});
console.log(`alignment sheet → ${SHEET}`);

await browser.close();server.close();
console.log('\nANCHOR_SCENES_INGEST_OK');
