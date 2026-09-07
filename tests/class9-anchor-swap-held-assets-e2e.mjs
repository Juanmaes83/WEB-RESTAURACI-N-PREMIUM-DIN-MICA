import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {startServer} from './static-server.mjs';

const out=path.resolve('tests/screenshots/anchor-swap-held-final.png');
fs.mkdirSync(path.dirname(out),{recursive:true});
const {server,url}=await startServer(0);
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForSelector('#motion-orbital-style',{timeout:10000});
  await page.waitForFunction(()=>window.RestaurantAnchorSwap&&window.RestaurantAnchorSwapArtDirection,{timeout:10000});
  await page.selectOption('#motion-orbital-style','anchor-swap');
  await page.dispatchEvent('#motion-orbital-style','change');
  await page.waitForFunction(()=>document.documentElement.dataset.orbitalMotion==='anchor-swap',{timeout:10000});
  await page.waitForFunction(()=>document.documentElement.dataset.anchorHeldAssets==='ready',{timeout:10000});
  await page.evaluate(()=>window.RestaurantAnchorSwapArtDirection.apply());
  await page.waitForFunction(()=>{
    const a=document.querySelector('.as-product-out'),b=document.querySelector('.as-product-in');
    return a&&b&&a.dataset.heldType&&b.dataset.heldType&&
      /cloudfront\.net/.test(a.getAttribute('src')||'')&&/cloudfront\.net/.test(b.getAttribute('src')||'')&&
      a.complete&&b.complete&&a.naturalWidth>0&&b.naturalWidth>0;
  },{timeout:15000});
  const state=await page.evaluate(()=>({
    mode:document.documentElement.dataset.orbitalMotion,
    ready:document.documentElement.dataset.anchorHeldAssets,
    out:{src:document.querySelector('.as-product-out')?.getAttribute('src'),type:document.querySelector('.as-product-out')?.dataset.heldType,w:document.querySelector('.as-product-out')?.naturalWidth},
    incoming:{src:document.querySelector('.as-product-in')?.getAttribute('src'),type:document.querySelector('.as-product-in')?.dataset.heldType,w:document.querySelector('.as-product-in')?.naturalWidth}
  }));
  if(state.mode!=='anchor-swap'||state.ready!=='ready')throw new Error('held-product layer not ready '+JSON.stringify(state));
  if(errors.length)throw new Error('page errors: '+errors.join(' | '));
  await page.locator('.orbital-section').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({path:out,fullPage:false});
  console.log('HELD ASSETS PASS',JSON.stringify(state));
} finally {
  await browser?.close();
  await new Promise(r=>server.close(r));
}
