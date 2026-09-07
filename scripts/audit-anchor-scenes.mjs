/* PROJECT 02 PIVOT — SCENE CONSISTENCY AUDIT.

   The old audit asked "do BACK + FRONT rebuild MASTER?". That question is gone with
   the layered approach. The question now is the one that decides whether the swap
   sells: do these images look like the same take?

   Practical, not forensic. It checks what actually breaks the illusion:
     · identical canvas, dimensions and orientation;
     · the anchor region (where the hand is) stays put and stays similar between
       scenes — measured on pixels, in a band that excludes the object;
     · the object does not jump in scale or position from scene to scene;
     · overall luminance stays in one range, so no scene looks lit differently.

   Usage: node scripts/audit-anchor-scenes.mjs
   Output: assets/anchor-scenes/audit/_scenes-sheet.png · anchor-region-diff.png
           assets/anchor-scenes/audit/scenes-audit.json
   Exit 1 if a scene is inconsistent enough to break the swap.
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','anchor-scenes','audit');
fs.mkdirSync(OUT,{recursive:true});

const MANIFEST=path.join(ROOT,'assets','anchor-scenes','scenes-manifest.json');
if(!fs.existsSync(MANIFEST)){console.error('no scenes-manifest.json — run build-anchor-scenes.mjs first');process.exit(2)}
const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
const files=manifest.scenes.map(s=>s.runtimeAsset);
if(files.length<3){console.error(`need at least 3 scenes, found ${files.length}`);process.exit(2)}

/* Tolerances. Loose enough for a real photo session, tight enough to catch a
   misaligned drop-in. */
const TOL={anchorDiff:26,anchorRatio:.055,objectScale:.34,objectCentre:.06,luma:.10};

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1500,height:1000}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

const report=await page.evaluate(async([files,tol])=>{
  const load=src=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(src));i.src=src});
  const imgs=await Promise.all(files.map(load));
  const W=imgs[0].naturalWidth,H=imgs[0].naturalHeight;

  const data=imgs.map(img=>{
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0,W,H);
    return x.getImageData(0,0,W,H).data;
  });

  const lumaAt=(d,i)=>(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;

  /* The anchor band: the lower third, where wrist and palm live in every scene and
     the object never reaches. If the hand moved or was lit differently, it shows
     here and nowhere else. */
  const band={x0:Math.round(W*.14),x1:Math.round(W*.94),y0:Math.round(H*.66),y1:Math.round(H*.98)};
  const bandStats=d=>{
    let sum=0,n=0;
    for(let y=band.y0;y<band.y1;y+=2)for(let x=band.x0;x<band.x1;x+=2){
      sum+=lumaAt(d,(y*W+x)*4);n++;
    }
    return {mean:sum/n,n};
  };
  const bandDiff=(a,b)=>{
    let sum=0,n=0,over=0;
    for(let y=band.y0;y<band.y1;y+=2)for(let x=band.x0;x<band.x1;x+=2){
      const i=(y*W+x)*4;
      const e=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));
      sum+=e;n++;if(e>48)over++;
    }
    return {mean:+(sum/n).toFixed(2),ratio:+(over/n).toFixed(4)};
  };

  const scenes=imgs.map((img,i)=>({
    i,w:img.naturalWidth,h:img.naturalHeight,
    orientation:img.naturalWidth<img.naturalHeight?'portrait':'landscape',
    bandMean:+bandStats(data[i]).mean.toFixed(4),
    frameMean:+(()=>{let s=0,n=0;for(let y=0;y<H;y+=6)for(let x=0;x<W;x+=6){s+=lumaAt(data[i],(y*W+x)*4);n++}return s/n})().toFixed(4)
  }));

  /* every scene against the first one — the reference take */
  const pairs=[];
  for(let i=1;i<data.length;i++)pairs.push({i,...bandDiff(data[0],data[i])});

  /* a visual diff of the anchor band, worst pair */
  const worst=pairs.reduce((p,q)=>q.mean>p.mean?q:p,pairs[0]||{i:1,mean:0});
  const dc=document.createElement('canvas');dc.width=W;dc.height=H;
  const dx=dc.getContext('2d');
  const out=dx.createImageData(W,H);
  if(data[worst.i]){
    for(let p=0;p<W*H;p++){
      const i=p*4,y=(p/W)|0,x=p%W;
      const inBand=x>=band.x0&&x<band.x1&&y>=band.y0&&y<band.y1;
      const e=inBand?Math.max(Math.abs(data[0][i]-data[worst.i][i]),
        Math.abs(data[0][i+1]-data[worst.i][i+1]),Math.abs(data[0][i+2]-data[worst.i][i+2])):0;
      out.data[i]=e>48?255:0;out.data[i+1]=e>48?40:0;out.data[i+2]=e>48?70:0;
      out.data[i+3]=e>48?220:(inBand?36:0);
    }
  }
  dx.putImageData(out,0,0);

  const sameCanvas=scenes.every(s=>s.w===W&&s.h===H);
  const sameOrientation=new Set(scenes.map(s=>s.orientation)).size===1;
  const lumaSpread=+(Math.max(...scenes.map(s=>s.frameMean))-Math.min(...scenes.map(s=>s.frameMean))).toFixed(4);
  const anchorWorst=pairs.length?Math.max(...pairs.map(p=>p.mean)):0;
  const anchorWorstRatio=pairs.length?Math.max(...pairs.map(p=>p.ratio)):0;

  return {
    canvas:{W,H},count:imgs.length,scenes,pairs,band,
    verdict:{
      sameCanvas,sameOrientation,
      lumaSpread,lumaOk:lumaSpread<=tol.luma,
      anchorWorst:+anchorWorst.toFixed(2),anchorOk:anchorWorst<=tol.anchorDiff,
      anchorWorstRatio,anchorRatioOk:anchorWorstRatio<=tol.anchorRatio
    },
    diffUrl:dc.toDataURL('image/png')
  };
},[files,TOL]);

fs.writeFileSync(path.join(OUT,'anchor-region-diff.png'),
  Buffer.from(report.diffUrl.split(',')[1],'base64'));
delete report.diffUrl;

/* object geometry consistency, straight from the manifest the builder wrote */
/* The object's scale is its measured width on the canvas. For real photography that
   is the vessel's rim: the same bowl reading a different size between scenes means
   the camera moved, which is exactly what must not happen. */
const objs=manifest.scenes.map(s=>s.object);
const scales=objs.map(o=>o.w/report.canvas.W);
const scaleSpread=+((Math.max(...scales)-Math.min(...scales))/Math.max(...scales)).toFixed(4);
const cx=manifest.scenes.map(s=>(s.object.x+s.object.w/2)/report.canvas.W);
const cy=manifest.scenes.map(s=>(s.object.y+s.object.h/2)/report.canvas.H);
const centreSpread=+Math.max(Math.max(...cx)-Math.min(...cx),Math.max(...cy)-Math.min(...cy)).toFixed(4);
report.object={scaleSpread,scaleOk:scaleSpread<=TOL.objectScale,
  centreSpread,centreOk:centreSpread<=TOL.objectCentre};

/* contact sheet */
await page.evaluate(([files,names])=>{
  document.body.style.margin='0';
  document.body.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);width:1290px;background:#0a0a0e">
    ${files.map((f,i)=>`<div style="position:relative">
      <img src="${f}" style="width:100%;display:block">
      <span style="position:absolute;left:10px;bottom:8px;font:11px system-ui;color:#fff;opacity:.85">${names[i]}</span>
    </div>`).join('')}</div>`;
},[files,manifest.scenes.map(s=>s.product||s.dishId)]);
await page.waitForTimeout(1500);
await page.locator('body > div').screenshot({path:path.join(OUT,'_scenes-sheet.png')});

fs.writeFileSync(path.join(OUT,'scenes-audit.json'),JSON.stringify({tolerances:TOL,...report},null,2));
await browser.close();server.close();

const v=report.verdict,o=report.object;
console.log(`scenes: ${report.count} @ ${report.canvas.W}x${report.canvas.H}`);
console.log(`same canvas ......... ${v.sameCanvas?'OK':'FAIL'}`);
console.log(`same orientation .... ${v.sameOrientation?'OK':'FAIL'}`);
console.log(`lighting spread ..... ${v.lumaSpread} (<= ${TOL.luma}) ${v.lumaOk?'OK':'FAIL'}`);
console.log(`anchor region ....... mean diff ${v.anchorWorst} (<= ${TOL.anchorDiff}) ${v.anchorOk?'OK':'FAIL'}`);
console.log(`anchor region ....... changed ${(v.anchorWorstRatio*100).toFixed(2)}% (<= ${TOL.anchorRatio*100}%) ${v.anchorRatioOk?'OK':'FAIL'}`);
console.log(`object scale spread . ${o.scaleSpread} (<= ${TOL.objectScale}) ${o.scaleOk?'OK':'FAIL'}`);
console.log(`object centre spread  ${o.centreSpread} (<= ${TOL.objectCentre}) ${o.centreOk?'OK':'FAIL'}`);
console.log(`sheet → ${path.join(OUT,'_scenes-sheet.png')}`);

const ok=v.sameCanvas&&v.sameOrientation&&v.lumaOk&&v.anchorOk&&v.anchorRatioOk&&o.scaleOk&&o.centreOk;
if(!ok){console.error('SCENE_CONSISTENCY_FAIL');process.exit(1)}
console.log('SCENE_CONSISTENCY_PASS');
