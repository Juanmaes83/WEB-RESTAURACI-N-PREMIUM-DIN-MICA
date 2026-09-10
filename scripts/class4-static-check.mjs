import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles-v4.css','utf8');
const store=fs.readFileSync('class4-store.js','utf8');
const shell=fs.existsSync('studio-shell.js')?fs.readFileSync('studio-shell.js','utf8'):'';
const requiredIds=['studio','studio-close','studio-backdrop','studio-status','studio-dish-list','dish-add','dish-save','dish-media','orbit-stage','explore-dish','dish-detail','reserve-dialog'];
const requiredScripts=['class4-store.js','class4-config.js','app-v4.js'];
const requiredSlots=['hero','origin','atmosphere','chef'];
let failed=false;
for(const id of requiredIds){if(!html.includes(`id="${id}"`)){console.error(`Missing required id: ${id}`);failed=true;}}
for(const script of requiredScripts){if(!html.includes(script)){console.error(`Missing required script: ${script}`);failed=true;}}
for(const slot of requiredSlots){if(!html.includes(`data-media-host="${slot}"`)||!html.includes(`data-slot="${slot}"`)){console.error(`Missing media slot contract: ${slot}`);failed=true;}}
if(!html.includes('styles-v4.css')){console.error('styles-v4.css not loaded');failed=true;}
if(!css.includes('.studio.is-open')||!css.includes('translateX(102%)')){console.error('Missing CSS Studio open/closed fallback');failed=true;}

/* Class 04 originally delegated the drawer to studio-shell.js. The current approved
   product integrates the exact same open/close contract in class4-store.js so Studio
   still works if a later runtime fails. Accept either architecture; do not require a
   stale loader string that no longer exists. */
const integratedShell=store.includes("studio.classList.add('is-open')")
  &&store.includes("studio.classList.remove('is-open')")
  &&store.includes('window.RestaurantStudioShell');
const externalShell=store.includes("shell.src='studio-shell.js'")
  &&shell.includes("studio.classList.add('is-open')")
  &&shell.includes("studio.classList.remove('is-open')");
if(!integratedShell&&!externalShell){console.error('Studio shell open/close contract is missing');failed=true;}

if(failed)process.exit(1);
console.log(`CLASS 04 static contract: PASS — Studio shell ${integratedShell?'integrated':'external'} + editable platform`);
