/* PROJECT 09 — SCROLL TRAVELER runtime asset.

   The traveller is a free-floating object that crosses cream sections, dark sections
   and large typography, and the page gives it its own shadow so it reads as physical
   rather than as a sticker. That is a far harsher test than Project 01's dark stage,
   and neither approved master survives it untouched:

     assets/depth-carousel/dish-01-food.webp — the food without the plate
       Cut for the dark stage. Its broad cream sauce field spans almost the whole
       frame at full alpha, so on a CREAM section it reads as a pale rectangle behind
       the prawns. Those pixels are legitimately sauce; no hygiene pass can fix it.

     assets/depth-carousel/dish-01.webp — the plated dish  <- what we use
       A round silhouette that reads on both grounds, and the dish itself is the
       object the journey is about. But it carries a BAKED DROP SHADOW: a dark
       crescent outside the plate, up and to the left. Invisible on black, a grey
       stain on cream, and lit from the opposite side to the page's own shadow.

   So the work here is alpha hygiene, NOT background removal. No colour is
   reinterpreted, no flood fill runs, and no pixel of the dish is re-decided:
     1. `deshadow`: locate the plate's own disk from its bright opaque mass and clear
        alpha outside it. Everything inside the disk is kept exactly as authored —
        luminance only LOCATES the plate, it never judges a dish pixel. What this
        removes is a shadow, which a runtime object should never carry.
     2. alpha at or below the floor becomes 0 — sub-visible on any ground, but
        `drop-shadow` reads the ALPHA channel, so it would cast a real shadow.
     3. only the largest connected component survives, dropping specks far from the
        object;
     4. the result is cropped to its own alpha bounds with a small margin.

   The source is an approved master and is never written to.

   Usage: node scripts/build-traveler-asset.mjs
   Output: assets/scroll-traveler/runtime/<id>.webp
           assets/scroll-traveler/traveler-manifest.json
           assets/scroll-traveler/audit/traveler-asset-proof.png
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','scroll-traveler','runtime');
const AUDIT=path.join(ROOT,'assets','scroll-traveler','audit');
const MANIFEST=path.join(ROOT,'assets','scroll-traveler','traveler-manifest.json');

/* One entry per traveller object. The engine is generic; this is just which approved
   masters we have cleaned so far. */
const SOURCES=[
  {id:'dish-01-prawn',dishId:'dish-01',
    source:'assets/depth-carousel/dish-01.webp',
    /* the plate is round, so its baked shadow is separable by geometry */
    deshadow:'disk',
    alt:'Gamba roja salvaje',altEn:'Wild red prawn'}
];
const ALPHA_FLOOR=24;   /* at or below this, a pixel is not part of the object */
const MARGIN=.02;       /* of the cropped size, so the shadow has room */
const QUALITY=.92;

fs.mkdirSync(OUT,{recursive:true});
fs.mkdirSync(AUDIT,{recursive:true});

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1300,height:900}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

const results=[];
for(const src of SOURCES){
  const abs=path.join(ROOT,src.source);
  if(!fs.existsSync(abs)){console.error(`missing source: ${src.source}`);process.exit(2)}
  const before=fs.statSync(abs).size;

  const out=await page.evaluate(async([url,floor,margin,quality,deshadow])=>{
    const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(url));i.src=url});
    const W=img.naturalWidth,H=img.naturalHeight;
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0);
    const frame=x.getImageData(0,0,W,H),d=frame.data,n=W*H;

    /* 0. the baked shadow.

          The plate is a disk, so the shadow is separable by geometry alone: find the
          bright opaque mass (the ceramic), take its extent as the disk, and clear
          alpha outside it. Luminance is used only to LOCATE the plate — nothing
          inside the disk is examined, let alone changed. The edge is feathered over
          a few pixels so the rim does not alias. */
    let disk=null;
    if(deshadow==='disk'){
      let px0=W,px1=-1,py0=H,py1=-1;
      for(let y=0;y<H;y++)for(let x2=0;x2<W;x2++){
        const i=(y*W+x2)*4;
        if(d[i+3]<200)continue;
        const lum=d[i]*.299+d[i+1]*.587+d[i+2]*.114;
        if(lum<150)continue;                 /* ceramic, not shadow and not prawn */
        if(x2<px0)px0=x2;if(x2>px1)px1=x2;if(y<py0)py0=y;if(y>py1)py1=y;
      }
      const cx=(px0+px1)/2,cy=(py0+py1)/2;
      const R=Math.max(px1-px0,py1-py0)/2*1.012;   /* the rim, plus a hair */
      const feather=Math.max(2,R*.012);
      let cleared=0;
      for(let y=0;y<H;y++)for(let x2=0;x2<W;x2++){
        const i=(y*W+x2)*4;
        if(d[i+3]===0)continue;
        const dist=Math.hypot(x2-cx,y-cy);
        if(dist<=R)continue;
        const t=Math.min(1,(dist-R)/feather);
        const a=Math.round(d[i+3]*(1-t));
        if(a!==d[i+3]){cleared+=d[i+3]-a;d[i+3]=a}
      }
      disk={cx:Math.round(cx),cy:Math.round(cy),r:Math.round(R),
        bbox:[px0,py0,px1-px0+1,py1-py0+1],alphaCleared:cleared};
    }

    /* 1. the alpha floor */
    let floored=0;
    for(let i=0;i<n;i++){
      const a=d[i*4+3];
      if(a>0&&a<=floor){d[i*4+3]=0;floored++}
    }

    /* 2. keep the largest connected component of what is left. An object is one
          piece; anything separate is debris the cut left behind. */
    const seen=new Uint8Array(n),comp=new Int32Array(n).fill(-1);
    const q=new Int32Array(n);
    let best=-1,bestSize=0,compCount=0;
    for(let start=0;start<n;start++){
      if(seen[start]||d[start*4+3]===0)continue;
      let head=0,tail=0;q[tail++]=start;seen[start]=1;
      let size=0;
      const id=compCount++;
      while(head<tail){
        const i=q[head++];comp[i]=id;size++;
        const px=i%W,py=(i/W)|0;
        const push=j=>{if(j<0||j>=n||seen[j]||d[j*4+3]===0)return;seen[j]=1;q[tail++]=j};
        if(px>0)push(i-1);
        if(px<W-1)push(i+1);
        if(py>0)push(i-W);
        if(py<H-1)push(i+W);
      }
      if(size>bestSize){bestSize=size;best=id}
    }
    let dropped=0;
    for(let i=0;i<n;i++){
      if(d[i*4+3]!==0&&comp[i]!==best){d[i*4+3]=0;dropped++}
    }

    /* 3. crop to the surviving silhouette */
    let x0=W,x1=-1,y0=H,y1=-1;
    for(let py=0;py<H;py++)for(let px=0;px<W;px++){
      if(d[(py*W+px)*4+3]>0){
        if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;
      }
    }
    x.putImageData(frame,0,0);
    const cw=x1-x0+1,ch=y1-y0+1;
    const pad=Math.round(Math.max(cw,ch)*margin);
    const side=Math.max(cw,ch)+pad*2;
    const o=document.createElement('canvas');o.width=side;o.height=side;
    const ox=o.getContext('2d');
    ox.imageSmoothingQuality='high';
    ox.drawImage(c,x0,y0,cw,ch,(side-cw)/2,(side-ch)/2,cw,ch);

    /* report the cleaned silhouette's real extent, which is what drop-shadow uses */
    const od=ox.getImageData(0,0,side,side).data;
    let sx0=side,sx1=-1,sy0=side,sy1=-1,solid=0;
    for(let py=0;py<side;py++)for(let px=0;px<side;px++){
      const a=od[(py*side+px)*4+3];
      if(a>0){if(px<sx0)sx0=px;if(px>sx1)sx1=px;if(py<sy0)sy0=py;if(py>sy1)sy1=py}
      if(a>200)solid++;
    }
    return {W,H,disk,floored,dropped,components:compCount,
      crop:[x0,y0,cw,ch],side,
      silhouette:[sx0,sy0,sx1-sx0+1,sy1-sy0+1],
      solidPct:+(100*solid/(side*side)).toFixed(2),
      data:o.toDataURL('image/webp',quality)};
  },['/'+src.source.split('/').map(encodeURIComponent).join('/'),
     ALPHA_FLOOR,MARGIN,QUALITY,src.deshadow||null]);

  const file=path.join(OUT,`${src.id}.webp`);
  fs.writeFileSync(file,Buffer.from(out.data.split(',')[1],'base64'));
  const after=fs.statSync(file).size;
  results.push({...src,
    runtimeAsset:`assets/scroll-traveler/runtime/${src.id}.webp`,
    sourceBytes:before,bytes:after,
    sourceCanvas:{w:out.W,h:out.H},runtimeCanvas:{w:out.side,h:out.side},
    alphaFloor:ALPHA_FLOOR,deshadow:src.deshadow||null,plateDisk:out.disk,
    flooredPixels:out.floored,droppedPixels:out.dropped,components:out.components,
    crop:out.crop,silhouette:out.silhouette,solidPct:out.solidPct});

  console.log(`${src.id}`);
  console.log(`  source            ${out.W}x${out.H}  ${Math.round(before/1024)}KB (untouched)`);
  if(out.disk)console.log(`  plate disk        r=${out.disk.r} at ${out.disk.cx},${out.disk.cy}`
    +` — baked shadow outside it removed`);
  console.log(`  alpha <= ${ALPHA_FLOOR} cleared  ${out.floored} px`);
  console.log(`  components found  ${out.components}, kept the largest, dropped ${out.dropped} px of debris`);
  console.log(`  cropped to        ${out.crop[2]}x${out.crop[3]} at ${out.crop[0]},${out.crop[1]}`);
  console.log(`  runtime           ${out.side}x${out.side}  ${Math.round(after/1024)}KB`);
  console.log(`  silhouette fills  ${out.silhouette[2]}x${out.silhouette[3]} of ${out.side} — solid ${out.solidPct}%`);
}

fs.writeFileSync(MANIFEST,JSON.stringify({
  project:'PROJECT 09 — Scroll Traveler',
  generatedBy:'scripts/build-traveler-asset.mjs',
  generatedAt:new Date().toISOString().slice(0,10),
  note:'Alpha hygiene on approved masters: an alpha floor, largest-component only, '
    +'and a crop to the silhouette. No colour is reinterpreted and no source is written.',
  alphaFloor:ALPHA_FLOOR,
  travelers:results
},null,2));
console.log(`\nmanifest → ${MANIFEST}`);

/* proof sheet: source and runtime, on both grounds, with the shadow the page uses */
await page.evaluate(([items])=>{
  document.body.style.margin='0';
  const cell=(url,label,bg)=>`<div style="position:relative;width:250px;height:250px;background:${bg};
      display:flex;align-items:center;justify-content:center">
      <img src="/${url}" style="max-width:86%;max-height:86%;object-fit:contain;
        filter:drop-shadow(0 22px 30px rgba(0,0,0,.45))">
      <span style="position:absolute;left:6px;bottom:4px;font:600 10px system-ui;
        color:${bg==='#0a0a0c'?'#d8ff4f':'#333'}">${label}</span></div>`;
  document.body.innerHTML=`<div id="proof" style="width:1060px;background:#17171b;padding:10px;
      font:11px system-ui;color:#cfcbc2">
    <div style="letter-spacing:.2em;text-transform:uppercase;color:#d8ff4f;padding:2px 2px 4px">
      Scroll Traveler · asset proof</div>
    <div style="padding:0 2px 10px;color:#8d8a83">the light ground is the test the dark stage
      never applied: a baked shadow reads as a stain, and leftover alpha casts a rectangle</div>
    ${items.map(it=>`<div style="display:flex;gap:6px;margin-bottom:6px">
      ${cell(it.source,'source · light','#efe9dd')}
      ${cell(it.runtimeAsset,'runtime · light','#efe9dd')}
      ${cell(it.source,'source · dark','#0a0a0c')}
      ${cell(it.runtimeAsset,'runtime · dark','#0a0a0c')}
    </div>`).join('')}
  </div>`;
},[results]);
await page.waitForTimeout(2200);
await page.locator('#proof').screenshot({path:path.join(AUDIT,'traveler-asset-proof.png')});
console.log(`proof → ${path.join(AUDIT,'traveler-asset-proof.png')}`);

await browser.close();server.close();
console.log('\nTRAVELER_ASSET_OK');
