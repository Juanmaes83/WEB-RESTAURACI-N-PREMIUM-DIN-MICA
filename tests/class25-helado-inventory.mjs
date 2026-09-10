/* CLASS 25 — visual inventory for repo-local ice cream assets.
   Produces a labelled contact sheet so the review can select a coherent camera family
   before those assets are wired into the Beverage Experience. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tests','screenshots','class25-helado-inventory');fs.mkdirSync(OUT,{recursive:true});
const target=process.argv[2],local=target?null:await startServer(0),BASE=(target||local.url).replace(/\/$/,'');
const names=['HELADO 1.jpg','HELADO 2.jpg','HELADO 3.jpg','HELADO 4.jpg','HELADO 8.jpg','HELADO 11.jpg','HELADO 12.jpg','HELADO 13.jpg','HELADO 15.jpg','HELADO 17.jpg','HELADO 18.jpg'];
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1800,height:1300},deviceScaleFactor:1});
await page.setContent(`<!doctype html><html><head><base href="${BASE}/"><style>
*{box-sizing:border-box}body{margin:0;background:#111;color:#fff;font:14px/1.4 Arial,sans-serif;padding:28px}h1{margin:0 0 8px;font-size:26px}.lead{opacity:.7;margin:0 0 24px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.card{background:#1d1d1d;border:1px solid #333;border-radius:14px;overflow:hidden}.frame{height:300px;display:grid;place-items:center;background:#eee}.frame img{width:100%;height:100%;object-fit:contain}.meta{padding:12px}.name{font-weight:700;font-size:15px}.dims{opacity:.65;font-size:12px;margin-top:5px}</style></head><body><h1>Class 25 · Inventario visual de helados</h1><p class="lead">Misma hoja, misma escala de frame. Seleccionar por ángulo/plano, no por sabor.</p><div class="grid">${names.map((n,i)=>`<article class="card"><div class="frame"><img data-i="${i}" src="assets/half-orbit/dishes-transparent/${encodeURIComponent(n)}" alt="${n}"></div><div class="meta"><div class="name">${n}</div><div class="dims" data-dims="${i}">cargando…</div></div></article>`).join('')}</div></body></html>`,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:20000});
const info=await page.evaluate(()=>[...document.images].map((img,i)=>({name:img.alt,ready:img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight,ratio:img.naturalHeight?+(img.naturalWidth/img.naturalHeight).toFixed(3):0})).map((x,i)=>{const el=document.querySelector(`[data-dims="${i}"]`);if(el)el.textContent=x.ready?`${x.width}×${x.height} · ratio ${x.ratio}`:'BROKEN';return x}));
fs.writeFileSync(path.join(OUT,'inventory.json'),JSON.stringify(info,null,2));
await page.screenshot({path:path.join(OUT,'helados-contact-sheet.png'),fullPage:true});
for(const x of info)console.log(`${x.ready?'PASS':'FAIL'} ${x.name} — ${x.width}x${x.height} — ${x.ratio}`);
if(info.some(x=>!x.ready))process.exitCode=1;
await browser.close();if(local)await new Promise(r=>local.server.close(r));