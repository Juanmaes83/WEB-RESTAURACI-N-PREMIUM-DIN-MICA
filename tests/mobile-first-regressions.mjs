/* Run the existing contracts unchanged; preserve every exit code and full log. */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const dir='output/playwright/mobile-first/regressions';fs.mkdirSync(dir,{recursive:true});
const suites=[
 'scripts/class4-static-check.mjs','scripts/check-pizza-premium.mjs',
 'tests/class5-orbital-e2e.mjs','tests/class5-complete-e2e.mjs','tests/class6-product-e2e.mjs',
 'tests/class7-editorial-flow-static.mjs','tests/class8-depth-carousel-e2e.mjs',
 'tests/class9-anchor-scenes-e2e.mjs','tests/class10-orbital-food-slider-e2e.mjs',
 'tests/class11-pizza-slice-orbit-e2e.mjs','tests/class12-pizza-premium-e2e.mjs',
 'tests/class14-scroll-traveler-e2e.mjs','tests/class16-location-maps-contract.mjs',
 'tests/class17-social-reputation-contract.mjs','tests/class18-whatsapp-contact-contract.mjs',
 'tests/class19-motion-library-e2e.mjs','tests/class20-modules-studio-integration-e2e.mjs',
 'tests/class21-unified-product-detail-e2e.mjs','tests/class22-experience-shell-e2e.mjs',
 'tests/class23-memories-e2e.mjs','tests/class24-half-orbit-selector-e2e.mjs',
 'tests/class24-interaction-governance-e2e.mjs','tests/class24-premium-transition-e2e.mjs',
 'tests/class25-beverage-e2e.mjs'
];
const results=[];
for(const file of suites){
 const name=file.split('/').pop();const log=fs.openSync(`${dir}/${name}.log`,'w');
 const code=await new Promise(resolve=>{
   const child=spawn(process.execPath,[file],{stdio:['ignore',log,log]});
   child.on('error',e=>{fs.writeSync(log,e.stack);resolve(-1)});
   child.on('exit',code=>resolve(code));
 });
 fs.closeSync(log);results.push({file,exitCode:code});
 fs.writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2));
 console.log(`${code===0?'PASS':'FAIL'} ${file} (${code})`);
}
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
