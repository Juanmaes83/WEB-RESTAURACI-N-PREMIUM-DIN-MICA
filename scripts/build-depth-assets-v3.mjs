/* PROJECT 01 V3 — ASSET PASS.

   V2 removed the card but kept the whole top-down plate, so the collection still
   read as six discs. V3 removes the plate too: it segments the FOOD off the
   porcelain and exports it at its real aspect ratio, so prawns come out
   elongated and irregular, artichokes radial, sea bass horizontal, dessert
   compact. Different silhouettes, not six circles.

   It also exports the individual garnish components as decor assets, so the
   foreground/background decor layers use real ingredients from the same dish
   instead of invented confetti.

   Runs on the Chromium Playwright already installs. No new dependency.

   Usage: node scripts/build-depth-assets-v3.mjs
   Output: assets/depth-carousel/<id>-food.webp        (hero object, real aspect)
           assets/depth-carousel/<id>-decor-{a,b}.webp (ingredient cut-outs)
           assets/depth-carousel/_preview-v3.png       (contact sheet)
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','depth-carousel');
fs.mkdirSync(OUT,{recursive:true});

/* SAT/LUM are how far a pixel must sit from the porcelain to count as food.
   DECOR_MIN/MAX bound which connected components are worth exporting alone. */
const P={SAT:0.24,LUM:0.22,CLOSE:2,FEATHER:2,MAX_EDGE:900,PAD:0.02,
         MIN_AREA:0.0016,DECOR_MIN:0.00012,DECOR_MAX:0.05};

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1280,height:900}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.RestaurantDefaults?.dishes?.length,null,{timeout:20000});
const dishes=await page.evaluate(()=>window.RestaurantDefaults.dishes.map(d=>({id:d.id,name:d.name,image:d.image})));

async function toDataUrl(url){
  const res=await fetch(url);
  if(!res.ok)throw new Error(`${res.status} ${url}`);
  const buf=Buffer.from(await res.arrayBuffer());
  return `data:${res.headers.get('content-type')||'image/png'};base64,${buf.toString('base64')}`;
}

const segment=async(dataUrl,opts)=>page.evaluate(async ([src,P])=>{
  const img=new Image();img.src=src;await img.decode();
  const w=img.naturalWidth,h=img.naturalHeight;
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);
  const src32=ctx.getImageData(0,0,w,h).data;

  const lum=i=>(src32[i]*0.2126+src32[i+1]*0.7152+src32[i+2]*0.0722)/255;
  const sat=i=>{const r=src32[i]/255,g=src32[i+1]/255,b=src32[i+2]/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx<=0?0:(mx-mn)/mx};

  /* 1 — find the PORCELAIN, not the frame. The dish sits on a dark charger on a
        dark background; keying on distance-from-plate over the whole frame keeps
        both of them. So first locate the bright desaturated disc, then work only
        inside it. */
  let bMinX=w,bMinY=h,bMaxX=0,bMaxY=0,sum=0,n=0;
  const lo=Math.round(w*0.10),hi=Math.round(w*0.90);
  const loY=Math.round(h*0.10),hiY=Math.round(h*0.90);
  for(let y=loY;y<hiY;y++)for(let x=lo;x<hi;x++){
    const i=(y*w+x)*4;
    if(lum(i)>0.50&&sat(i)<0.26){
      if(x<bMinX)bMinX=x;if(x>bMaxX)bMaxX=x;
      if(y<bMinY)bMinY=y;if(y>bMaxY)bMaxY=y;
      sum+=lum(i);n++;
    }
  }
  if(!n)throw new Error('no porcelain found');
  const cx=(bMinX+bMaxX)/2, cy=(bMinY+bMaxY)/2;
  const rPorcelain=Math.min(bMaxX-bMinX,bMaxY-bMinY)/2;
  const inside=(x,y)=>Math.hypot(x-cx,y-cy)<rPorcelain*0.82;

  /* The porcelain is not one luminance: it carries its own vignette, so an average
     makes half the plate read as food. Use a high percentile of the luminance
     inside the disc — the plate dominates the area, so that IS the porcelain. */
  const hist=new Int32Array(256);let inCount=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!inside(x,y))continue;
    hist[Math.min(255,Math.round(lum((y*w+x)*4)*255))]++;inCount++;
  }
  let acc=0,plateLum=0.8;
  for(let v=0;v<256;v++){acc+=hist[v];if(acc>=inCount*0.70){plateLum=v/255;break}}

  /* 2 — food is what the porcelain is not: saturated, or clearly darker than it.
        Never "brighter than average", which is just the plate's own highlight. */
  let mask=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*w+x,i=p*4;
    if(!inside(x,y)){mask[p]=0;continue}
    mask[p]=(sat(i)>P.SAT||lum(i)<plateLum-P.LUM)?1:0;
  }

  /* 3 — morphological close, so a plating of separate elements reads as one
        composition instead of a hundred specks. */
  const dilate=(m,r)=>{
    const o=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(!m[y*w+x])continue;
      for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;
        for(let dx=-r;dx<=r;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;o[yy*w+xx]=1}}
    }
    return o;
  };
  const erode=(m,r)=>{
    const o=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let keep=1;
      for(let dy=-r;dy<=r&&keep;dy++){const yy=y+dy;if(yy<0||yy>=h){keep=0;break}
        for(let dx=-r;dx<=r;dx++){const xx=x+dx;if(xx<0||xx>=w||!m[yy*w+xx]){keep=0;break}}}
      o[y*w+x]=keep;
    }
    return o;
  };
  const rawMask=mask;
  mask=erode(dilate(mask,P.CLOSE),P.CLOSE);

  /* 4 — connected components.
        Two passes on purpose: the CLOSED mask fuses a plating into one hero
        composition, which is what we want for the object — but it also fuses every
        garnish into it, leaving nothing to cut out as decor. So the decor pool is
        labelled on the RAW mask, where a dill sprig is still its own component. */
  const stack=new Int32Array(w*h);
  function components(m,lbl){
    const out=[];
    for(let p=0;p<w*h;p++){
      if(!m[p]||lbl[p]>=0)continue;
      const id=out.length;let sp=0,area=0,minX=w,minY=h,maxX=0,maxY=0,satSum=0;
      stack[sp++]=p;lbl[p]=id;
      while(sp){
        const q=stack[--sp],qx=q%w,qy=(q/w)|0;
        area++;satSum+=sat(q*4);
        if(qx<minX)minX=qx;if(qx>maxX)maxX=qx;if(qy<minY)minY=qy;if(qy>maxY)maxY=qy;
        const nb=[qx>0?q-1:-1,qx<w-1?q+1:-1,qy>0?q-w:-1,qy<h-1?q+w:-1];
        for(const r of nb)if(r>=0&&m[r]&&lbl[r]<0){lbl[r]=id;stack[sp++]=r}
      }
      out.push({id,area,minX,minY,maxX,maxY,sat:satSum/area});
    }
    return out;
  }
  const label=new Int32Array(w*h).fill(-1);
  const rawLabel=new Int32Array(w*h).fill(-1);
  const comps=components(mask,label);
  const rawComps=components(rawMask,rawLabel);
  if(false){
    if(!mask[0]||label[0]>=0)0;
  }
  const total=w*h;
  /* The shadowed inner rim of the plate survives the luminance test as a thin
     crescent: a huge bounding box with almost nothing inside it. Real food fills
     its box. Drop anything that is a large, nearly empty arc. */
  const solid=k=>{
    const bw=k.maxX-k.minX+1,bh=k.maxY-k.minY+1;
    const fill=k.area/(bw*bh), span=Math.max(bw,bh)/Math.min(w,h);
    return !(fill<0.14&&span>0.42);
  };
  const kept=comps.filter(k=>k.area/total>=P.MIN_AREA&&solid(k)).sort((a,b)=>b.area-a.area);
  if(!kept.length)throw new Error('no food components found');
  const keepIds=new Set(kept.map(k=>k.id));

  /* 5 — render a component set to a trimmed, feathered, non-square WebP */
  function render(ids,pad,lbl=label){
    let minX=w,minY=h,maxX=0,maxY=0;
    for(let p=0;p<w*h;p++)if(lbl[p]>=0&&ids.has(lbl[p])){
      const x=p%w,y=(p/w)|0;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
    const bw=maxX-minX+1,bh=maxY-minY+1;
    const px=Math.round(bw*pad),py=Math.round(bh*pad);
    const sx=Math.max(0,minX-px),sy=Math.max(0,minY-py);
    const sw=Math.min(w-sx,bw+px*2),sh=Math.min(h-sy,bh+py*2);

    /* alpha with a small feather so the cut does not look stamped */
    const alpha=new Float32Array(sw*sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
      const p=(sy+y)*w+(sx+x);
      alpha[y*sw+x]=(lbl[p]>=0&&ids.has(lbl[p]))?1:0;
    }
    const blur=(a,r)=>{
      const tmp=new Float32Array(sw*sh),out=new Float32Array(sw*sh);
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        let s=0,c=0;
        for(let d=-r;d<=r;d++){const xx=x+d;if(xx<0||xx>=sw)continue;s+=a[y*sw+xx];c++}
        tmp[y*sw+x]=s/c;
      }
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        let s=0,c=0;
        for(let d=-r;d<=r;d++){const yy=y+d;if(yy<0||yy>=sh)continue;s+=tmp[yy*sw+x];c++}
        out[y*sw+x]=s/c;
      }
      return out;
    };
    const soft=blur(alpha,P.FEATHER);

    const cut=document.createElement('canvas');cut.width=sw;cut.height=sh;
    const cctx=cut.getContext('2d');
    const out=cctx.createImageData(sw,sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
      const d=(y*sw+x)*4,s=((sy+y)*w+(sx+x))*4;
      out.data[d]=src32[s];out.data[d+1]=src32[s+1];out.data[d+2]=src32[s+2];
      out.data[d+3]=Math.round(Math.min(1,soft[y*sw+x]*1.12)*255);
    }
    cctx.putImageData(out,0,0);

    const k=Math.min(1,P.MAX_EDGE/Math.max(sw,sh));
    const fin=document.createElement('canvas');
    fin.width=Math.max(1,Math.round(sw*k));fin.height=Math.max(1,Math.round(sh*k));
    const fctx=fin.getContext('2d');fctx.imageSmoothingQuality='high';
    fctx.drawImage(cut,0,0,fin.width,fin.height);
    return {url:fin.toDataURL('image/webp',0.92),w:fin.width,h:fin.height,
      ratio:+(fin.width/fin.height).toFixed(2)};
  }

  const hero=render(keepIds,P.PAD);
  /* decor: mid-sized components — a herb, a citrus segment, a quenelle. Not the
     main mass, which is already the hero. */
  /* Decor should be an ingredient with colour — a herb, a citrus segment, a
     charred leek — not the biggest beige sauce dot. Rank the small components by
     saturation weighted by size, and take the two most vivid. */
  const decorPool=rawComps
    .filter(k=>k.area>=400&&k.area/total>=P.DECOR_MIN&&k.area/total<=P.DECOR_MAX&&solid(k))
    .sort((a,b)=>(b.sat*Math.sqrt(b.area))-(a.sat*Math.sqrt(a.area)))
    .slice(0,3);
  const decor=decorPool.map(k=>render(new Set([k.id]),0.08,rawLabel));

  return {hero,decor,plateLum:+plateLum.toFixed(3),rPorcelain:Math.round(rPorcelain),components:kept.length};
},[dataUrl,opts]);

const made=[];
for(const d of dishes){
  if(!d.image){console.log(`skip ${d.id}`);continue}
  try{
    const src=await toDataUrl(d.image);
    const r=await segment(src,P);
    const write=(url,suffix)=>{
      const buf=Buffer.from(url.split(',')[1],'base64');
      const rel=`assets/depth-carousel/${d.id}${suffix}.webp`;
      fs.writeFileSync(path.join(ROOT,rel),buf);
      return {rel,kb:Math.round(buf.length/1024)};
    };
    const hero=write(r.hero.url,'-food');
    const decor=r.decor.map((x,i)=>({...write(x.url,`-decor-${'abc'[i]}`),ratio:x.ratio,w:x.w,h:x.h}));
    made.push({id:d.id,name:d.name,hero:{...hero,ratio:r.hero.ratio,w:r.hero.w,h:r.hero.h},decor,components:r.components});
    console.log(`ok   ${d.id}  hero ${r.hero.w}x${r.hero.h} ratio ${r.hero.ratio} ${hero.kb}KB · decor ${decor.length} · ${r.components} comps`);
  }catch(err){console.log(`FAIL ${d.id}: ${err.message}`)}
}

/* Contact sheet over a mid ground so silhouettes and alpha edges can be judged. */
if(made.length){
  const html=`<div style="background:linear-gradient(120deg,#5d2a18,#132c46 45%,#213d16);width:1320px;padding:0">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0">
      ${made.map(m=>`<div style="height:430px;display:grid;place-items:center;padding:14px;position:relative;overflow:hidden">
        <img src="${m.hero.rel}" style="max-width:100%;max-height:100%;filter:drop-shadow(0 24px 28px rgba(0,0,0,.55))">
        <span style="position:absolute;left:10px;bottom:8px;font:11px system-ui;color:#fff;opacity:.75">${m.id} · ${m.hero.ratio}</span>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0;background:rgba(0,0,0,.35)">
      ${made.flatMap(m=>m.decor).map(d=>`<div style="height:200px;display:grid;place-items:center;padding:12px;overflow:hidden">
        <img src="${d.rel}" style="max-width:100%;max-height:100%;filter:drop-shadow(0 14px 16px rgba(0,0,0,.5))"></div>`).join('')}
    </div>
  </div>`;
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(h=>{document.body.innerHTML=h;document.body.style.margin='0'},html);
  await page.waitForTimeout(1500);
  await page.locator('body > div').screenshot({path:path.join(OUT,'_preview-v3.png')});
  console.log(`preview → ${path.join(OUT,'_preview-v3.png')}`);
}

fs.writeFileSync(path.join(OUT,'manifest-v3.json'),JSON.stringify({params:P,assets:made},null,2));
await browser.close();server.close();
console.log(`\n${made.length}/${dishes.length} food objects + ${made.reduce((n,m)=>n+m.decor.length,0)} decor cut-outs`);
