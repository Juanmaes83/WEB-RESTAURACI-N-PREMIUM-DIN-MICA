/* PROJECT 01 V2 — free object asset pipeline.

   Turns the orbital 1:1 dish photography (product on a dark background) into
   transparent "free objects": no card, no artificial circle, no container.
   The silhouette becomes the real product edge, so the engine can use
   filter: drop-shadow() instead of a box-shadow on a round div.

   Runs on the Chromium that Playwright already provides — no new dependency.
   Images are fetched in Node and handed to the page as data URLs, so the canvas
   is never tainted and toDataURL() works.

   Usage: node scripts/build-depth-assets.mjs
   Output: assets/depth-carousel/<dish-id>.webp + _preview.png (contact sheet)
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from '../tests/static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets','depth-carousel');
fs.mkdirSync(OUT,{recursive:true});

/* Keying parameters. LO/HI are luminance stops: below LO the pixel is background,
   above HI it is product. The ramp between them keeps the natural contact shadow
   as a soft alpha edge instead of a hard cut. */
const LO=0.085, HI=0.30, SIZE=820, PAD=0.03;

const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const page=await(await browser.newContext({viewport:{width:1200,height:900}})).newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.RestaurantDefaults?.dishes?.length,null,{timeout:20000});

const dishes=await page.evaluate(()=>window.RestaurantDefaults.dishes.map(d=>({id:d.id,name:d.name,image:d.image})));
console.log(`source dishes: ${dishes.length}`);

async function toDataUrl(url){
  const res=await fetch(url);
  if(!res.ok)throw new Error(`${res.status} ${url}`);
  const buf=Buffer.from(await res.arrayBuffer());
  const type=res.headers.get('content-type')||'image/png';
  return `data:${type};base64,${buf.toString('base64')}`;
}

const cut=async(dataUrl,opts)=>page.evaluate(async ([src,{LO,HI,SIZE,PAD}])=>{
  const img=new Image();
  img.src=src;
  await img.decode();

  const w=img.naturalWidth,h=img.naturalHeight;
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,w,h);
  const px=data.data;

  const smooth=t=>{const x=Math.min(1,Math.max(0,t));return x*x*(3-2*x)};
  const cx=w/2,cy=h/2,guard=Math.min(w,h)*0.505;

  let minX=w,minY=h,maxX=0,maxY=0,kept=0;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const lum=(px[i]*0.2126+px[i+1]*0.7152+px[i+2]*0.0722)/255;
      let a=smooth((lum-LO)/(HI-LO));
      /* kill anything outside the plate circle: the source frames carry a dark
         square background whose corners would survive as grey haze */
      const dist=Math.hypot(x-cx,y-cy);
      if(dist>guard)a=0;
      else if(dist>guard*0.93)a*=1-smooth((dist-guard*0.93)/(guard*0.07));
      px[i+3]=Math.round(a*255);
      if(a>0.06){kept++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
    }
  }
  ctx.putImageData(data,0,0);
  if(!kept)throw new Error('empty cut-out');

  /* Trim to the real silhouette and re-centre, so the object fills its frame
     instead of floating inside the original photographic margin. */
  const bw=maxX-minX+1,bh=maxY-minY+1,side=Math.max(bw,bh)*(1+PAD*2);
  const sx=minX+bw/2-side/2, sy=minY+bh/2-side/2;

  const out=document.createElement('canvas');out.width=SIZE;out.height=SIZE;
  const octx=out.getContext('2d');
  octx.imageSmoothingQuality='high';
  octx.drawImage(c,sx,sy,side,side,0,0,SIZE,SIZE);
  return {url:out.toDataURL('image/webp',0.92),coverage:+(kept/(w*h)).toFixed(3),trim:`${bw}x${bh} of ${w}x${h}`};
},[dataUrl,opts]);

const made=[];
for(const d of dishes){
  if(!d.image){console.log(`skip ${d.id} (no image)`);continue}
  try{
    const src=await toDataUrl(d.image);
    const {url,coverage,trim}=await cut(src,{LO,HI,SIZE,PAD});
    const buf=Buffer.from(url.split(',')[1],'base64');
    const file=path.join(OUT,`${d.id}.webp`);
    fs.writeFileSync(file,buf);
    made.push({id:d.id,name:d.name,rel:`assets/depth-carousel/${d.id}.webp`,kb:Math.round(buf.length/1024),coverage,trim});
    console.log(`ok   ${d.id}  ${Math.round(buf.length/1024)}KB  coverage=${coverage}  trim=${trim}`);
  }catch(err){console.log(`FAIL ${d.id}: ${err.message}`)}
}

/* Contact sheet over a mid-tone ground so the alpha edges can actually be judged. */
if(made.length){
  const previewHtml=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:linear-gradient(135deg,#5d3320,#1d3a52 50%,#2f4a1c);width:1080px">
    ${made.map(m=>`<div style="aspect-ratio:1;display:grid;place-items:center;padding:10px"><img src="${m.rel}" style="width:100%;filter:drop-shadow(0 26px 30px rgba(0,0,0,.55))"></div>`).join('')}
  </div>`;
  await page.setContent(`<body style="margin:0">${previewHtml}</body>`,{baseURL:BASE});
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(html=>{document.body.innerHTML=html;document.body.style.margin='0'},previewHtml);
  await page.waitForTimeout(1200);
  await page.locator('body > div').screenshot({path:path.join(OUT,'_preview.png')});
  console.log(`preview → ${path.join(OUT,'_preview.png')}`);
}

fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({generatedFrom:'class4-config dish.image',params:{LO,HI,SIZE,PAD},assets:made},null,2));
await browser.close();server.close();
console.log(`\n${made.length}/${dishes.length} free-object assets written to ${OUT}`);
