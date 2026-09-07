/* PROJECT 02 PIVOT — PRECOMPOSED ANCHOR SCENES · proxy scene builder.

   The pivot: the runtime must swap ONE flattened master image per product, not
   assemble a hand out of layers at 60fps. The human review rejected the layered
   assembly ("mano entrecortada"), and baking the composite once is what lets us add
   the two things live compositing never had: a contact shadow where the product
   rests on the palm, and the shadow the fingertips cast ONTO the product.

   Real photography of a hand holding each product is a production dependency and is
   not in the repository. This script builds a PROXY set from what is: the hand
   master and the Project 01 food cut-outs. Every scene shares canvas, framing,
   hand placement, lighting geometry, vignette and grade; only the object and the
   chromatic world change. That is exactly the contract the engine consumes, so the
   day the real photographs land they drop into assets/anchor-scenes/source with no
   code change.

   Runs on the Chromium Playwright already installs. No new dependency.

   DEVELOPMENT FALLBACK ONLY — SUPERSEDED BY THE REAL PHOTOGRAPHY.
   The live demo is built by scripts/ingest-anchor-scenes.mjs from MANO+OBJETO/. This
   generator is kept because it still answers a real question — what does a project
   show before the photo session exists? — and it now writes to a sandbox of its own,
   so it can never overwrite the real runtime set or the manifest the engine reads.

   Usage: node scripts/build-anchor-scenes.mjs
   Output: assets/anchor-scenes/proxy-dev/scene-XX-<slug>.webp
           assets/anchor-scenes/proxy-dev/scenes-manifest.json
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','anchor-scenes','proxy-dev');
const SRC=path.join(ROOT,'assets','anchor-scenes','source');
fs.mkdirSync(OUT,{recursive:true});
fs.mkdirSync(SRC,{recursive:true});

/* One shared take. These numbers are the "camera" and never vary per scene. */
const TAKE={
  W:1200,H:1500,
  hand:{w:.86,left:.10,top:.10},        /* fraction of canvas */
  cup:{x:.515,y:.301,w:.464,h:.224},    /* fraction of the hand canvas, measured on alpha */
  productLift:-.005,                     /* the object sits IN the cup, not above it */
  quality:.9
};

const HAND={
  back:'MANOS/b8c52400-a56d-4183-83e5-b6a3b63f4ff9 (1).png',
  front:'MANOS/c4e86201-747f-498f-a539-8485f3d85a48 (1).png'
};

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1300,height:900}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.RestaurantDefaults?.dishes?.length,null,{timeout:20000});

const dishes=await page.evaluate(()=>window.RestaurantDefaults.dishes
  .filter(d=>d.enabled!==false)
  .map((d,i)=>({i,id:d.id,name:d.name,
    asset:d.depthCarousel?.asset||'',
    accent:d.depthCarousel?.accent||'#d8ff4f',
    bg:d.depthCarousel?.backgroundColor||'#0a0a08',
    word:d.depthCarousel?.word||''})));
console.log(`scenes to compose: ${dishes.length}`);

const compose=async(dish,take,hand)=>page.evaluate(async([d,T,H])=>{
  const load=src=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>j(new Error(src));i.src=src});
  const [back,front,prod]=await Promise.all([load(H.back),load(H.front),load(d.asset)]);

  const c=document.createElement('canvas');c.width=T.W;c.height=T.H;
  const x=c.getContext('2d');
  const hex=h=>{const v=h.replace('#','');const n=parseInt(v.length===3?v.split('').map(s=>s+s).join(''):v,16);
    return [n>>16&255,n>>8&255,n&255]};
  const a=hex(d.accent), base=hex(d.bg);
  const rgba=(c3,al)=>`rgba(${c3.map(v=>Math.round(v)).join(',')},${al})`;

  /* ---- the set. Identical geometry in every scene; only the hue changes. ---- */
  let g=x.createLinearGradient(0,0,T.W*.25,T.H);
  g.addColorStop(0,rgba(base,1));g.addColorStop(1,'rgba(5,5,9,1)');
  x.fillStyle=g;x.fillRect(0,0,T.W,T.H);

  const glow=(cx,cy,r,tint,al)=>{
    const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);
    rg.addColorStop(0,rgba(a.map(v=>v*tint),al));
    rg.addColorStop(1,rgba(a.map(v=>v*tint),0));
    x.fillStyle=rg;x.fillRect(0,0,T.W,T.H);
  };
  glow(T.W*.72,T.H*.20,T.W*.78,1,.42);      /* key light, top right */
  glow(T.W*.10,T.H*.86,T.W*.62,.55,.30);    /* fill, bottom left */
  glow(T.W*.50,T.H*.62,T.W*.40,.32,.18);    /* bounce off the palm */

  /* a soft floor line, same in every scene: it is what makes them read as one set */
  const floor=x.createLinearGradient(0,T.H*.72,0,T.H);
  floor.addColorStop(0,'rgba(0,0,0,0)');floor.addColorStop(1,'rgba(2,2,5,.72)');
  x.fillStyle=floor;x.fillRect(0,T.H*.72,T.W,T.H*.28);

  /* ---- geometry ---- */
  const hw=T.W*T.hand.w, hh=hw*(back.naturalHeight/back.naturalWidth);
  const hx=T.W*T.hand.left, hy=T.H*T.hand.top;
  const cupX=hx+T.cup.x*hw, cupY=hy+T.cup.y*hh;
  const cupW=T.cup.w*hw,   cupH=T.cup.h*hh;

  /* The Project 01 cut-outs carry a faint alpha halo over their trim padding. Left
     alone it composites as a straight-edged haze across the palm — the single most
     obvious "this was assembled" tell in the first pass. Clamp it away. */
  const clean=(()=>{
    const q=document.createElement('canvas');q.width=prod.naturalWidth;q.height=prod.naturalHeight;
    const qx=q.getContext('2d',{willReadFrequently:true});
    qx.drawImage(prod,0,0);
    const d2=qx.getImageData(0,0,q.width,q.height);
    for(let i=3;i<d2.data.length;i+=4){
      const al=d2.data[i];
      d2.data[i]=al<30?0:(al>226?255:Math.round((al-30)/196*255));
    }
    qx.putImageData(d2,0,0);
    return q;
  })();

  const pr=prod.naturalWidth/prod.naturalHeight;
  /* big enough that the fingertips genuinely cross it: an object that clears the
     finger line hovers, which is what made the first attempt read as pasted on */
  const s=Math.min((cupW*1.34)/prod.naturalWidth,(cupH*1.92)/prod.naturalHeight);
  const pw=prod.naturalWidth*s, ph=prod.naturalHeight*s;
  const px=cupX-pw/2, py=cupY-ph/2-hh*T.productLift;

  /* ---- back of the hand ---- */
  x.drawImage(back,hx,hy,hw,hh);

  /* ---- contact shadow: the object rests on the palm. Live compositing never had
         this, which is exactly why the hand read as cut apart. ---- */
  /* Painted by scaling the context, not by clipping a circular gradient to an
     ellipse: clipping cuts the falloff before it reaches zero and leaves a straight
     edge across the palm — subtle, and the first thing that gives the composite away. */
  x.save();
  const shR=pw*.50, shSquash=(ph*.22)/shR;
  x.translate(cupX,py+ph*.84);
  x.scale(1,shSquash);
  const sh=x.createRadialGradient(0,0,0,0,0,shR);
  sh.addColorStop(0,'rgba(0,0,0,.56)');sh.addColorStop(.55,'rgba(0,0,0,.22)');sh.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=sh;
  x.fillRect(-shR,-shR,shR*2,shR*2);
  x.restore();

  /* ---- the object ---- */
  x.drawImage(clean,px,py,pw,ph);

  /* ---- the fingertips cast a shadow ON the object, and ONLY on the object.
         Unmasked, the cut line where the fingers were separated from the master
         blurs into a straight band across the palm — a giveaway that the scene was
         assembled. Clipping the shadow to the object silhouette removes it. ---- */
  const sc=document.createElement('canvas');sc.width=T.W;sc.height=T.H;
  const sx=sc.getContext('2d');
  sx.filter='blur(9px)';
  sx.drawImage(front,hx-hw*.012,hy+hh*.012,hw,hh);
  sx.filter='none';
  sx.globalCompositeOperation='source-in';
  sx.fillStyle='rgba(0,0,0,1)';sx.fillRect(0,0,T.W,T.H);
  sx.globalCompositeOperation='destination-in';
  sx.drawImage(clean,px,py,pw,ph);
  x.save();x.globalAlpha=.46;x.drawImage(sc,0,0);x.restore();

  /* ---- front of the hand ---- */
  x.drawImage(front,hx,hy,hw,hh);

  /* ---- unified grade + vignette, identical in every scene ---- */
  x.save();
  x.globalCompositeOperation='soft-light';
  const grade=x.createLinearGradient(T.W,0,0,T.H);
  grade.addColorStop(0,rgba(a,.20));grade.addColorStop(1,'rgba(0,0,0,.22)');
  x.fillStyle=grade;x.fillRect(0,0,T.W,T.H);
  x.restore();

  const vg=x.createRadialGradient(T.W*.54,T.H*.44,T.H*.30,T.W*.54,T.H*.44,T.H*.86);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(2,2,6,.66)');
  x.fillStyle=vg;x.fillRect(0,0,T.W,T.H);

  return {
    url:c.toDataURL('image/webp',T.quality),
    anchor:{cupX:Math.round(cupX),cupY:Math.round(cupY),handX:Math.round(hx),handY:Math.round(hy),
      handW:Math.round(hw),handH:Math.round(hh)},
    object:{w:Math.round(pw),h:Math.round(ph),ratio:+pr.toFixed(2),
      x:Math.round(px),y:Math.round(py),scale:+s.toFixed(3)}
  };
},[dish,take,hand]);

const slug=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,26);

const made=[];
for(const d of dishes){
  if(!d.asset){console.log(`skip ${d.id} (no object asset)`);continue}
  try{
    const r=await compose(d,TAKE,HAND);
    const name=`scene-${String(d.i+1).padStart(2,'0')}-${slug(d.name)}.webp`;
    const buf=Buffer.from(r.url.split(',')[1],'base64');
    fs.writeFileSync(path.join(OUT,name),buf);
    made.push({dishId:d.id,name:d.name,word:d.word,accent:d.accent,backgroundColor:d.bg,
      file:`assets/anchor-scenes/proxy-dev/${name}`,kb:Math.round(buf.length/1024),
      anchor:r.anchor,object:r.object});
    console.log(`ok   ${name}  ${Math.round(buf.length/1024)}KB  object ${r.object.w}x${r.object.h} (ratio ${r.object.ratio})`);
  }catch(err){console.log(`FAIL ${d.id}: ${err.message}`)}
}

fs.writeFileSync(path.join(OUT,'scenes-manifest.json'),
  JSON.stringify({
    kind:'proxy',
    note:'Proxy set composed from the hand master and the Project 01 object cut-outs. Replace with real photography in assets/anchor-scenes/source and re-point dish.anchorScene.image; the engine needs no change.',
    take:TAKE,scenes:made},null,2));

await browser.close();server.close();
console.log(`\n${made.length}/${dishes.length} proxy anchor scenes written to ${OUT}`);
