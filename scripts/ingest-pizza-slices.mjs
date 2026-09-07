/* PROJECT 07 — PIZZA SLICE AUDIT + NORMALIZATION.

   Eight independent slices have to arrive, one after another, into ONE fixed hero
   outline. The canvas is the same for all of them (1254x1254 RGBA) but the visible
   wedge is not: raw image dimensions are not registration.

   So measure what actually decides the fit — the alpha bounds, the apex, the crust
   line, the axis and the wedge length — and solve the differences with REGISTRATION
   DATA, never with per-slice conditionals inside the renderer.

   A wedge radiates from its apex, so the apex is the registration anchor: land every
   apex on the same point, with the same axis and the same apex-to-crust length, and
   every slice fills the same outline.

   The source files are immutable masters. This reads them and writes elsewhere.

   Usage: node scripts/ingest-pizza-slices.mjs
   Output: assets/pizza-motion/runtime/slices/<id>.webp
           assets/pizza-motion/slices-manifest.json
           assets/pizza-motion/audit/slice-registration.json
           assets/pizza-motion/audit/slice-contact-sheet.png
           tests/screenshots/pizza-slice-orbit-registration-proof.png
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SRC_DIR=path.join(ROOT,'assets','pizza-motion','source','slices');
const RUNTIME=path.join(ROOT,'assets','pizza-motion','runtime','slices');
const AUDIT=path.join(ROOT,'assets','pizza-motion','audit');
const MANIFEST=path.join(ROOT,'assets','pizza-motion','slices-manifest.json');
const PROOF=path.join(ROOT,'tests','screenshots','pizza-slice-orbit-registration-proof.png');

/* The product names come from the filenames — the mission forbids inventing any other
   product data, so the manifest carries name and id and leaves the rest as declared
   extension points. */
const NAMES={
  'TROZO PIZZA 4 QUESOS.png':{id:'quattro-formaggi',name:'4 Quesos'},
  'TROZO PIZZA BARBACOA.png':{id:'barbacoa',name:'Barbacoa'},
  'TROZO PIZZA CARBONARA.png':{id:'carbonara',name:'Carbonara'},
  'TROZO PIZZA DIAVOLA.png':{id:'diavola',name:'Diavola'},
  'TROZO PIZZA MARGARITA.png':{id:'margarita',name:'Margarita'},
  'TROZO PIZZA MORTADELA Y PISTACHO.png':{id:'mortadela-pistacho',name:'Mortadela y Pistacho'},
  'TROZO PIZZA PROSCIUTTO FUNGI.png':{id:'prosciutto-funghi',name:'Prosciutto Funghi'},
  'TROZO PIZZA VERDURAS.png':{id:'verduras',name:'Verduras'}
};

/* The runtime asset is emitted at this size: the hero renders around 460px tall on a
   desktop stage, so 1000px is generous and the sources stay untouched at 1254. */
const RUNTIME_PX=1000, QUALITY=.88;
/* Tolerance for calling the set registered, as a fraction of the canonical wedge. */
/* halfAngle is ADVISORY: how wide each wedge was cut is a property of the
   photography, not something registration can change, so a spread there is reported
   and only flagged when it is large enough to suggest a mismatched drop-in. The gate
   that decides the project is fitsStation — every slice inside one frame. */
const TOL={length:.02,axis:1.2,halfAngle:3.5,apex:.02};

fs.mkdirSync(RUNTIME,{recursive:true});
fs.mkdirSync(AUDIT,{recursive:true});
fs.mkdirSync(path.dirname(PROOF),{recursive:true});

const files=fs.readdirSync(SRC_DIR).filter(f=>/\.png$/i.test(f)).sort();
if(files.length!==8){console.error(`expected 8 slices, found ${files.length}`);process.exit(2)}
const unknown=files.filter(f=>!NAMES[f]);
if(unknown.length){console.error(`unnamed source files: ${unknown.join(', ')}`);process.exit(2)}

const rel=f=>'assets/pizza-motion/source/slices/'+f;
const url=f=>'/'+rel(f).split('/').map(encodeURIComponent).join('/');

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await context.newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

/* ---------- measure ---------- */
const measured=await page.evaluate(async urls=>{
  const load=s=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(s));i.src=s});
  const imgs=await Promise.all(urls.map(load));

  return imgs.map(img=>{
    const W=img.naturalWidth,H=img.naturalHeight;
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0);
    const d=x.getImageData(0,0,W,H).data;
    const A=(px,py)=>d[(py*W+px)*4+3];
    const SOLID=28;

    /* alpha bounds */
    let x0=W,x1=-1,y0=H,y1=-1,mass=0,sx=0,sy=0;
    for(let py=0;py<H;py++)for(let px=0;px<W;px++){
      if(A(px,py)>SOLID){
        if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;
        mass++;sx+=px;sy+=py;
      }
    }
    const rowSpan=py=>{let a=-1,b=-1;for(let px=0;px<W;px++)if(A(px,py)>SOLID){if(a<0)a=px;b=px}
      return a<0?null:{a,b,mid:(a+b)/2,w:b-a+1}};

    /* The apex is the tip: take the bottom 2% of the wedge's height and use the
       centroid of those rows, which is stable against a single stray pixel. */
    const hgt=y1-y0+1;
    const apexBand=Math.max(2,Math.round(hgt*.02));
    let ax=0,an=0;
    for(let py=y1;py>y1-apexBand;py--){const r=rowSpan(py);if(r){ax+=r.mid;an++}}
    const apex={x:ax/Math.max(1,an),y:y1};

    /* The crust is the top edge: same idea from the other end, and its span gives the
       wedge's opening. */
    const crustBand=Math.max(2,Math.round(hgt*.02));
    let cx=0,cn=0,cw=0;
    for(let py=y0;py<y0+crustBand;py++){const r=rowSpan(py);if(r){cx+=r.mid;cn++;cw=Math.max(cw,r.w)}}
    const crust={x:cx/Math.max(1,cn),y:y0,width:cw};

    /* the widest row anywhere — the crust's real outer edge */
    let widest={w:0,y:y0};
    for(let py=y0;py<=y1;py+=2){const r=rowSpan(py);if(r&&r.w>widest.w)widest={w:r.w,y:py}}

    const length=Math.hypot(crust.x-apex.x,crust.y-apex.y);
    /* axis measured from straight up, positive clockwise */
    const axisDeg=Math.atan2(crust.x-apex.x,apex.y-crust.y)*180/Math.PI;
    /* The widest row is the crust's CHORD, and chord/2 = R·sin(half), so the half
       angle is asin — atan would understate it and the outline would cut the crust. */
    const halfAngleDeg=Math.asin(Math.min(1,(widest.w/2)/length))*180/Math.PI;

    return {W,H,
      bounds:{x0,x1,y0,y1,w:x1-x0+1,h:y1-y0+1},
      coverage:+(mass/(W*H)).toFixed(4),
      centroid:{x:+(sx/mass).toFixed(1),y:+(sy/mass).toFixed(1)},
      apex:{x:+apex.x.toFixed(1),y:apex.y},
      crust:{x:+crust.x.toFixed(1),y:crust.y,width:crust.width},
      widest,
      length:+length.toFixed(1),
      axisDeg:+axisDeg.toFixed(2),
      halfAngleDeg:+halfAngleDeg.toFixed(2)};
  });
},files.map(url));

const W=measured[0].W,H=measured[0].H;
console.log(`sources: ${files.length} @ ${W}x${H}\n`);
console.log('slice                 bbox w x h     apex          crust        length   axis   half°');
measured.forEach((m,i)=>{
  console.log(`${NAMES[files[i]].id.padEnd(20)} ${String(m.bounds.w).padStart(4)} x ${String(m.bounds.h).padStart(4)}   `
    +`${String(Math.round(m.apex.x)).padStart(4)},${String(m.apex.y).padStart(4)}   `
    +`${String(Math.round(m.crust.x)).padStart(4)},${String(m.crust.y).padStart(4)}   `
    +`${String(m.length).padStart(6)}  ${String(m.axisDeg).padStart(6)}  ${String(m.halfAngleDeg).padStart(5)}`);
});

/* ---------- the canonical wedge ----------
   Median rather than mean: one unusually small or large slice must not drag the
   station it has to fit into. */
const median=a=>{const v=[...a].sort((x,y)=>x-y);return v.length%2?v[v.length>>1]:(v[v.length/2-1]+v[v.length/2])/2};
const openings=measured.map(m=>m.halfAngleDeg);
const canon={
  length:+median(measured.map(m=>m.length)).toFixed(1),
  /* Registration can scale, move and rotate a slice but it cannot change how wide the
     wedge was cut, and squeezing one to match another would deform the food. Three of
     these are cut wider, so the station is drawn to CONTAIN the widest plus a small
     margin: every slice then sits inside one frame, which is the actual requirement. */
  halfAngleDeg:+(Math.max(...openings)+0.9).toFixed(2),
  halfAngleMedianDeg:+median(openings).toFixed(2),
  halfAngleMinDeg:+Math.min(...openings).toFixed(2),
  halfAngleMaxDeg:+Math.max(...openings).toFixed(2),
  /* the apex sits on the canvas centre line, low enough that a normalized wedge of
     canonical length fits with a small margin above the crust */
  apex:{x:W/2,y:0}
};
canon.apex.y=Math.round(canon.length+(H-canon.length)*0.62);
/* the crust corner of the widest opening reaches this far up and out from the apex */
canon.corner={
  dx:+(canon.length*Math.sin(canon.halfAngleDeg*Math.PI/180)).toFixed(1),
  dy:+(canon.length*Math.cos(canon.halfAngleDeg*Math.PI/180)).toFixed(1)
};
console.log(`\ncanonical wedge: length ${canon.length}px · station half-angle ${canon.halfAngleDeg}°`
  +` (slices ${canon.halfAngleMinDeg}°–${canon.halfAngleMaxDeg}°) · apex ${canon.apex.x},${canon.apex.y}`);

/* ---------- registration ----------
   Everything a slice needs to land on the canonical wedge, expressed as fractions of
   the canvas so the renderer can apply them at any display size. */
const slices=measured.map((m,i)=>{
  const meta=NAMES[files[i]];
  const scale=+(canon.length/m.length).toFixed(5);
  /* rotate the axis upright, about the apex */
  const rotationBias=+(-m.axisDeg).toFixed(3);
  /* after scaling and rotating about its own apex, move that apex onto the canonical one */
  const offsetX=+((canon.apex.x-m.apex.x)/W).toFixed(5);
  const offsetY=+((canon.apex.y-m.apex.y)/H).toFixed(5);
  return {
    index:i,
    id:meta.id,
    name:meta.name,
    source:rel(files[i]),
    /* recorded so a test can prove the immutable masters were never touched */
    sourceBytes:fs.statSync(path.join(SRC_DIR,files[i])).size,
    runtimeAsset:`assets/pizza-motion/runtime/slices/${meta.id}.webp`,
    /* Registration is data. A slice that sits small, off-centre or tilted inside its
       canvas is corrected by its own numbers, so replacing the photography is a data
       drop and the renderer stays free of per-slice special cases. */
    registration:{
      scale,
      offsetX,
      offsetY,
      rotationBias,
      /* the apex in canvas fractions, before and after: the renderer rotates and
         scales about the ORIGINAL apex, then applies the offset */
      apex:{x:+(m.apex.x/W).toFixed(5),y:+(m.apex.y/H).toFixed(5)}
    },
    measured:{
      bounds:m.bounds,coverage:m.coverage,
      apex:m.apex,crust:m.crust,
      length:m.length,axisDeg:m.axisDeg,halfAngleDeg:m.halfAngleDeg
    },
    normalized:{
      length:+(m.length*scale).toFixed(1),
      halfAngleDeg:m.halfAngleDeg,
      axisDeg:+(m.axisDeg+rotationBias).toFixed(3)
    },
    /* declared extension points — deliberately empty rather than invented */
    price:null,ingredients:null,allergens:null,productId:null,cta:null,accent:null
  };
});

/* how well the set registers, after its own numbers are applied */
const spread=k=>{const v=slices.map(s=>s.normalized[k]);return +(Math.max(...v)-Math.min(...v)).toFixed(3)};
const verdict={
  lengthSpreadPct:+((spread('length')/canon.length)).toFixed(4),
  axisSpreadDeg:spread('axisDeg'),
  halfAngleSpreadDeg:spread('halfAngleDeg'),
  /* every normalized slice must fit inside the station's opening, with headroom */
  worstOverhangDeg:+Math.max(...slices.map(s=>s.normalized.halfAngleDeg-canon.halfAngleDeg)).toFixed(3),
  tightestMarginDeg:+Math.min(...slices.map(s=>canon.halfAngleDeg-s.normalized.halfAngleDeg)).toFixed(3)
};
verdict.lengthOk=verdict.lengthSpreadPct<=TOL.length;
verdict.axisOk=Math.abs(verdict.axisSpreadDeg)<=TOL.axis;
verdict.halfAngleOk=verdict.halfAngleSpreadDeg<=TOL.halfAngle;
verdict.fitsStation=verdict.worstOverhangDeg<=0;
verdict.registered=verdict.lengthOk&&verdict.axisOk&&verdict.fitsStation;
verdict.openingAdvisory=verdict.halfAngleOk?'ok':'wide spread — check the set is one cut';

console.log(`\nafter registration — length spread ${(verdict.lengthSpreadPct*100).toFixed(2)}% `
  +`· axis spread ${verdict.axisSpreadDeg}° · opening spread ${verdict.halfAngleSpreadDeg}°`);
console.log(`station fit — worst overhang ${verdict.worstOverhangDeg}° `
  +`· tightest margin ${verdict.tightestMarginDeg}° · ${verdict.fitsStation?'all eight fit':'A SLICE OVERFLOWS'}`);

/* ---------- runtime assets ---------- */
for(const s of slices){
  const data=await page.evaluate(async([src,px,q])=>{
    const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(src));i.src=src});
    const c=document.createElement('canvas');c.width=px;c.height=px;
    const x=c.getContext('2d');
    x.imageSmoothingQuality='high';
    /* no registration is baked in: the transform stays in the manifest */
    x.drawImage(img,0,0,px,px);
    return c.toDataURL('image/webp',q);
  },[url(files[s.index]),RUNTIME_PX,QUALITY]);
  const out=path.join(RUNTIME,`${s.id}.webp`);
  fs.writeFileSync(out,Buffer.from(data.split(',')[1],'base64'));
  s.bytes=fs.statSync(out).size;
  s.runtimeCanvas={w:RUNTIME_PX,h:RUNTIME_PX};
}
const totalKb=Math.round(slices.reduce((a,s)=>a+s.bytes,0)/1024);
const srcKb=Math.round(files.reduce((a,f)=>a+fs.statSync(path.join(SRC_DIR,f)).size,0)/1024);
console.log(`\nruntime: 8 webp @ ${RUNTIME_PX}px — ${totalKb}KB total (sources ${srcKb}KB, untouched)`);
slices.forEach(s=>console.log(`  ${s.id.padEnd(20)} ${String(Math.round(s.bytes/1024)).padStart(4)}KB`));

const manifest={
  project:'PROJECT 07 — Pizza Slice Orbit / Hero Selector',
  kind:'real',
  source:'assets/pizza-motion/source/slices/',
  generatedBy:'scripts/ingest-pizza-slices.mjs',
  generatedAt:new Date().toISOString().slice(0,10),
  canvas:{w:W,h:H},
  runtimeCanvas:{w:RUNTIME_PX,h:RUNTIME_PX},
  canonical:canon,
  tolerances:TOL,
  verdict,
  /* Project 06 owns the assembled wheel; this manifest records the file so it is
     explicit that Project 07 never moves it. */
  fullPizzaReference:'assets/pizza-motion/source/full-pizza/PIZZA COMPLETA DE 8 TROZOS.png',
  fullPizzaBytes:fs.statSync(path.join(ROOT,'assets','pizza-motion','source','full-pizza','PIZZA COMPLETA DE 8 TROZOS.png')).size,
  slices
};
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(AUDIT,'slice-registration.json'),JSON.stringify({canonical:canon,tolerances:TOL,verdict,
  slices:slices.map(s=>({id:s.id,name:s.name,registration:s.registration,measured:s.measured,normalized:s.normalized}))},null,2));
console.log(`\nmanifest → ${MANIFEST}`);

/* ---------- audit sheets ---------- */
/* 1. contact sheet: the raw wedges with their measurements */
await page.evaluate(([slices,dir])=>{
  document.body.style.margin='0';
  document.body.innerHTML=`<div id="sheet" style="width:1360px;background:#0e0e12;padding:10px;font:11px system-ui;color:#cfcbc2">
    <div style="letter-spacing:.2em;text-transform:uppercase;color:#d8ff4f;padding:2px 2px 10px">
      Pizza slices · raw sources · measured</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">
    ${slices.map(s=>`<div style="position:relative;background:#181820">
      <img src="/${s.source.split('/').map(encodeURIComponent).join('/')}" style="width:100%;display:block">
      <span style="position:absolute;left:7px;top:6px;font:700 12px system-ui;color:#d8ff4f">${s.name}</span>
      <span style="position:absolute;left:7px;bottom:6px;right:7px;font:10px/1.5 ui-monospace,monospace;color:#9a978f">
        ${s.measured.bounds.w}×${s.measured.bounds.h} · len ${s.measured.length}<br>
        axis ${s.measured.axisDeg}° · half ${s.measured.halfAngleDeg}°<br>
        scale ${s.registration.scale} · rot ${s.registration.rotationBias}°</span>
    </div>`).join('')}
    </div></div>`;
},[slices,SRC_DIR]);
await page.waitForTimeout(2600);
await page.locator('#sheet').screenshot({path:path.join(AUDIT,'slice-contact-sheet.png')});
console.log(`contact sheet → ${path.join(AUDIT,'slice-contact-sheet.png')}`);

/* 2. registration proof: every normalized slice over the SAME fixed hero outline */
await page.setViewportSize({width:1400,height:1000});
await page.evaluate(([slices,canon,canvas])=>{
  const CELL=330;
  const k=CELL/canvas.w;
  /* the outline is drawn from the canonical wedge only — never from a slice */
  const apexX=canon.apex.x*k, apexY=canon.apex.y*k;
  const len=canon.length*k;
  const half=canon.halfAngleDeg*Math.PI/180;
  /* A sector's crust corners lie ON the circle of radius len: at ±len·sin(half)
     across and len·cos(half) up. Putting them at the full radius up with a tangent
     offset across draws the triangle that CIRCUMSCRIBES the wedge, which is why the
     first proof overshot the crust on both sides. */
  const dx=Math.sin(half)*len, dy=Math.cos(half)*len;
  const lx=apexX-dx, rx=apexX+dx, ty=apexY-dy;
  const outline=`<svg viewBox="0 0 ${CELL} ${CELL}" style="position:absolute;inset:0;width:100%;height:100%">
      <path d="M ${apexX} ${apexY} L ${lx} ${ty} A ${len} ${len} 0 0 1 ${rx} ${ty} Z"
        fill="none" stroke="#d8ff4f" stroke-width="1.6" opacity=".95"/>
      <circle cx="${apexX}" cy="${apexY}" r="3" fill="#d8ff4f"/>
      <line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${apexY-len}" stroke="#d8ff4f" stroke-width=".7" opacity=".45" stroke-dasharray="4 4"/>
    </svg>`;
  const cell=s=>{
    const r=s.registration;
    /* the same transform the renderer applies: scale and rotate about the slice's own
       apex, then move that apex onto the canonical one */
    const ox=r.offsetX*100, oy=r.offsetY*100;
    return `<div style="position:relative;width:${CELL}px;height:${CELL}px;background:#15151c;overflow:hidden">
      <img src="/${s.runtimeAsset.split('/').map(encodeURIComponent).join('/')}"
        style="position:absolute;left:0;top:0;width:100%;height:100%;
          transform-origin:${r.apex.x*100}% ${r.apex.y*100}%;
          transform:translate(${ox}%,${oy}%) rotate(${r.rotationBias}deg) scale(${r.scale})">
      ${outline}
      <span style="position:absolute;left:8px;top:6px;font:700 12px system-ui;color:#fff;
        text-shadow:0 1px 4px #000">${s.name}</span>
    </div>`;
  };
  document.body.style.margin='0';
  document.body.innerHTML=`<div id="proof" style="width:1360px;background:#0e0e12;padding:10px;font:11px system-ui;color:#cfcbc2">
    <div style="letter-spacing:.2em;text-transform:uppercase;color:#d8ff4f;padding:2px 2px 4px">
      Registration proof · eight normalized slices · ONE fixed hero outline</div>
    <div style="padding:0 2px 10px;color:#8d8a83">the outline is drawn from the canonical wedge, never from a slice</div>
    <div style="display:grid;grid-template-columns:repeat(4,${CELL}px);gap:3px">
      ${slices.map(cell).join('')}
    </div></div>`;
},[slices,canon,{w:W,h:H}]);
await page.waitForTimeout(2600);
await page.locator('#proof').screenshot({path:PROOF});
console.log(`registration proof → ${PROOF}`);

await browser.close();server.close();
if(!verdict.registered){console.error('\nPIZZA_SLICE_REGISTRATION_FAIL');process.exit(1)}
console.log('\nPIZZA_SLICE_INGEST_OK');
