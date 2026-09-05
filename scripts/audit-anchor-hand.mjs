/* PROJECT 02 — ANCHOR HAND ASSET AUDIT.

   Before any engine code: are the three PNGs actually usable as an anchor?

   The MASTER is the source of truth. BACK and FRONT are supposed to be the same
   hand split into the layer behind the product and the layer in front of it. This
   script measures all three, recomposes BACK + FRONT on one canvas and compares
   the result against MASTER pixel by pixel, so we know whether the split is
   trustworthy before we build a choreography on top of it.

   Runs on the Chromium Playwright already installs. No new dependency.

   Usage: node scripts/audit-anchor-hand.mjs
   Output: assets/anchor-swap/audit/*.png + audit.json
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SRC='assets/anchor-swap/source';
const OUT=path.join(ROOT,'assets','anchor-swap','audit');
fs.mkdirSync(OUT,{recursive:true});

const FILES={
  master:`${SRC}/anchor-hand-master.png`,
  back:`${SRC}/anchor-hand-back-source.png`,
  front:`${SRC}/anchor-hand-front-source.png`
};

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1400,height:900}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

const report=await page.evaluate(async files=>{
  const load=src=>new Promise((res,rej)=>{
    const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('load '+src));i.src=src;
  });
  const ctxOf=img=>{
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);return {c,x};
  };
  const stats=(name,img)=>{
    const {x}=ctxOf(img);
    const w=img.naturalWidth,h=img.naturalHeight;
    const d=x.getImageData(0,0,w,h).data;
    let minX=w,minY=h,maxX=0,maxY=0,opaque=0,semi=0;
    for(let y=0;y<h;y++)for(let px=0;px<w;px++){
      const a=d[(y*w+px)*4+3];
      if(a<8)continue;
      if(a<248)semi++;else opaque++;
      if(px<minX)minX=px;if(px>maxX)maxX=px;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
    const cover=(opaque+semi)/(w*h);
    return {name,w,h,bounds:{minX,minY,maxX,maxY,bw:maxX-minX+1,bh:maxY-minY+1},
      coverage:+cover.toFixed(4),semiEdgePx:semi,hasAlpha:cover<0.995};
  };

  const imgs={};
  for(const [k,v] of Object.entries(files))imgs[k]=await load(v);
  const s={master:stats('master',imgs.master),back:stats('back',imgs.back),front:stats('front',imgs.front)};

  /* Recompose BACK + FRONT on the master canvas and diff against MASTER. */
  const W=imgs.master.naturalWidth,H=imgs.master.naturalHeight;
  const comp=document.createElement('canvas');comp.width=W;comp.height=H;
  const cx=comp.getContext('2d',{willReadFrequently:true});
  cx.drawImage(imgs.back,0,0,W,H);
  cx.drawImage(imgs.front,0,0,W,H);

  const {x:mx}=ctxOf(imgs.master);
  const md=mx.getImageData(0,0,W,H).data;
  const cd=cx.getImageData(0,0,W,H).data;

  let diffSum=0,diffPx=0,masterInk=0,compInk=0,bothInk=0;
  const diff=document.createElement('canvas');diff.width=W;diff.height=H;
  const dx=diff.getContext('2d');
  const out=dx.createImageData(W,H);
  for(let i=0;i<md.length;i+=4){
    const ma=md[i+3],ca=cd[i+3];
    if(ma>24)masterInk++;
    if(ca>24)compInk++;
    if(ma>24&&ca>24)bothInk++;
    const dr=Math.abs(md[i]-cd[i]),dg=Math.abs(md[i+1]-cd[i+1]),db=Math.abs(md[i+2]-cd[i+2]),da=Math.abs(ma-ca);
    const e=Math.max(dr,dg,db,da);
    if(e>26){diffPx++;out.data[i]=255;out.data[i+1]=32;out.data[i+2]=64;out.data[i+3]=210}
    else {out.data[i]=0;out.data[i+1]=0;out.data[i+2]=0;out.data[i+3]=0}
    diffSum+=e;
  }
  dx.putImageData(out,0,0);

  const total=W*H;
  return {
    stats:s,
    composite:{
      sameCanvas:s.back.w===W&&s.back.h===H&&s.front.w===W&&s.front.h===H,
      meanError:+(diffSum/total).toFixed(2),
      diffRatio:+(diffPx/total).toFixed(4),
      coverageMaster:+(masterInk/total).toFixed(4),
      coverageComposite:+(compInk/total).toFixed(4),
      iou:+(bothInk/Math.max(1,masterInk+compInk-bothInk)).toFixed(4)
    },
    dataUrls:{composite:comp.toDataURL('image/png'),diff:diff.toDataURL('image/png')}
  };
},FILES);

const write=(name,dataUrl)=>{
  fs.writeFileSync(path.join(OUT,name),Buffer.from(dataUrl.split(',')[1],'base64'));
};
write('composite-back-plus-front.png',report.dataUrls.composite);
write('diff-vs-master.png',report.dataUrls.diff);
delete report.dataUrls;

/* Contact sheet: master · back · front · recomposition, over a mid ground so the
   alpha and the split are both judgeable by eye. */
await page.evaluate(([files,outRel])=>{
  const cell=(label,src,extra='')=>`<div style="position:relative;height:420px;display:grid;place-items:center;padding:12px;${extra}">
    <img src="${src}" style="max-width:100%;max-height:100%">
    <span style="position:absolute;left:12px;bottom:8px;font:12px system-ui;color:#fff;opacity:.8">${label}</span></div>`;
  document.body.style.margin='0';
  document.body.innerHTML=`<div style="width:1360px;display:grid;grid-template-columns:repeat(2,1fr);
    background:linear-gradient(120deg,#3a2a1c,#16303f 55%,#1d3a1a)">
    ${cell('MASTER',files.master)}
    ${cell('BACK + FRONT recomposed',outRel+'/composite-back-plus-front.png')}
    ${cell('BACK (behind product)',files.back)}
    ${cell('FRONT (in front of product)',files.front)}
  </div>`;
},[FILES,'assets/anchor-swap/audit']);
await page.waitForTimeout(1400);
await page.locator('body > div').screenshot({path:path.join(OUT,'_audit-sheet.png')});

fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify(report,null,2));
await browser.close();server.close();

const c=report.composite;
console.log(JSON.stringify(report.stats,null,1));
console.log('\ncomposite vs master:',JSON.stringify(c));
console.log(c.sameCanvas?'canvas: MATCH':'canvas: MISMATCH — back/front are not the master canvas');
console.log(`IoU ${c.iou} · mean error ${c.meanError} · differing pixels ${(c.diffRatio*100).toFixed(2)}%`);
console.log(`sheet → ${path.join(OUT,'_audit-sheet.png')}`);
