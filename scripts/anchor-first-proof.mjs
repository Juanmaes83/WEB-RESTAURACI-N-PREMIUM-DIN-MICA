/* PROJECT 02 — FIRST VISUAL PROOF.

   Gate 1 of the brief: does BACK + PRODUCT + FRONT read as a hand actually HOLDING
   the product, or as a picture pasted in front of a hand? Nothing else gets built
   until this looks right.

   It also measures the cup — the empty pocket between thumb and fingertips — so the
   engine has a real anchor point instead of a guessed one.

   Usage: node scripts/anchor-first-proof.mjs
   Output: assets/anchor-swap/audit/_first-proof.png + cup.json
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','anchor-swap','audit');
fs.mkdirSync(OUT,{recursive:true});

const BACK='assets/anchor-swap/source/anchor-hand-back-source.png';
const FRONT='assets/anchor-swap/source/anchor-hand-front-source.png';
const PRODUCTS=[
  'assets/depth-carousel/dish-02-food.webp',   /* tall curved ribbon */
  'assets/depth-carousel/dish-06-food.webp',   /* compact citrus cluster */
  'assets/depth-carousel/dish-03-food.webp'    /* radial cluster */
];

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1500,height:1000}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});

/* ---- measure the cup ---------------------------------------------------- */
const cup=await page.evaluate(async([back,front])=>{
  const load=src=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(src));i.src=src});
  const b=await load(back), f=await load(front);
  const W=b.naturalWidth,H=b.naturalHeight;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(b,0,0);x.drawImage(f,0,0);
  const a=x.getImageData(0,0,W,H).data;
  const ink=(px,py)=>a[(py*W+px)*4+3]>24;

  /* For every row, the gap is what sits between the leftmost and the rightmost ink.
     The cup is the widest run of such interior emptiness. */
  const rows=[];
  for(let y=0;y<H;y++){
    let l=-1,r=-1;
    for(let px=0;px<W;px++)if(ink(px,y)){if(l<0)l=px;r=px}
    if(l<0||r-l<40)continue;
    let best=0,bs=-1,run=0,start=-1;
    for(let px=l;px<=r;px++){
      if(!ink(px,y)){if(run===0)start=px;run++}
      else {if(run>best){best=run;bs=start}run=0}
    }
    if(run>best){best=run;bs=start}
    if(best>30)rows.push({y,gap:best,x0:bs,x1:bs+best-1,l,r});
  }
  if(!rows.length)return null;
  const widest=rows.reduce((p,q)=>q.gap>p.gap?q:p);
  /* the pocket = the band of rows around the widest gap that keep at least 55% of it */
  const band=rows.filter(q=>q.gap>=widest.gap*0.55&&Math.abs(q.y-widest.y)<H*0.30);
  const top=Math.min(...band.map(q=>q.y)),bottom=Math.max(...band.map(q=>q.y));
  const cx=band.reduce((s,q)=>s+(q.x0+q.x1)/2,0)/band.length;
  const cw=band.reduce((s,q)=>s+q.gap,0)/band.length;
  return {canvas:{W,H},cup:{cx:Math.round(cx),cy:Math.round((top+bottom)/2),
    w:Math.round(cw),h:bottom-top+1,top,bottom},
    cxPct:+(cx/W*100).toFixed(1),cyPct:+(((top+bottom)/2)/H*100).toFixed(1),
    wPct:+(cw/W*100).toFixed(1),hPct:+((bottom-top+1)/H*100).toFixed(1)};
},[BACK,FRONT]);
console.log('cup:',JSON.stringify(cup));

/* ---- compose back + product + front -------------------------------------- */
await page.evaluate(([back,front,products,cup])=>{
  document.body.style.margin='0';
  const {W,H}=cup.canvas;
  const scale=430/W;                       /* cell width */
  const cell=(label,productSrc)=>`
    <div style="position:relative;width:${Math.round(W*scale)}px;height:${Math.round(H*scale)}px;overflow:hidden">
      <img src="${back}"  style="position:absolute;inset:0;width:100%;height:100%;z-index:1">
      ${productSrc?`<img src="${productSrc}" style="position:absolute;z-index:2;
        left:${cup.cxPct}%;top:${cup.cyPct}%;width:${cup.wPct*1.28}%;
        transform:translate(-50%,-46%);filter:drop-shadow(0 12px 16px rgba(0,0,0,.45))">`:''}
      <img src="${front}" style="position:absolute;inset:0;width:100%;height:100%;z-index:3">
      <span style="position:absolute;left:10px;bottom:8px;z-index:4;font:11px system-ui;color:#fff;opacity:.85">${label}</span>
    </div>`;
  document.body.innerHTML=`<div style="display:flex;background:linear-gradient(115deg,#2a1a10,#12283a 55%,#16301a)">
    ${cell('anchor only','')}
    ${products.map((p,i)=>cell('product '+(i+1),p)).join('')}
  </div>`;
},[BACK,FRONT,PRODUCTS,cup]);
await page.waitForTimeout(1600);
await page.locator('body > div').screenshot({path:path.join(OUT,'_first-proof.png')});
fs.writeFileSync(path.join(OUT,'cup.json'),JSON.stringify(cup,null,2));

await browser.close();server.close();
console.log(`proof → ${path.join(OUT,'_first-proof.png')}`);
