import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const requiredIds=['studio','studio-close','studio-backdrop','studio-status','studio-dish-list','dish-add','dish-save','dish-media','orbit-stage','explore-dish','dish-detail','reserve-dialog'];
const requiredScripts=['class4-store.js','class4-config.js','app-v4.js'];
const requiredSlots=['hero','origin','atmosphere','chef'];
let failed=false;
for(const id of requiredIds){if(!html.includes(`id="${id}"`)){console.error(`Missing required id: ${id}`);failed=true;}}
for(const script of requiredScripts){if(!html.includes(script)){console.error(`Missing required script: ${script}`);failed=true;}}
for(const slot of requiredSlots){if(!html.includes(`data-media-host="${slot}"`)||!html.includes(`data-slot="${slot}"`)){console.error(`Missing media slot contract: ${slot}`);failed=true;}}
if(!html.includes('styles-v4.css')){console.error('styles-v4.css not loaded');failed=true;}
if(failed)process.exit(1);
console.log('CLASS 04 static contract: PASS');