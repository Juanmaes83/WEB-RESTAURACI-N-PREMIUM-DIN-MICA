import {spawn} from 'node:child_process';
import fs from 'node:fs';
const tests=['class14-scroll-traveler-e2e','class8-depth-carousel-e2e','class9-anchor-scenes-e2e','class10-orbital-food-slider-e2e','class11-pizza-slice-orbit-e2e','class12-pizza-premium-e2e','project06-circular-dish-rotator-contract','class13-dish-stage-contract','class15-cinematic-product-rail-contract','class16-location-maps-contract','class17-social-reputation-contract','class18-whatsapp-contact-contract'];
const dir='output/playwright/class20/regression';fs.mkdirSync(dir,{recursive:true});const results=[];
async function run(name){return new Promise(resolve=>{let log='';const p=spawn(process.execPath,['tests/'+name+'.mjs'],{stdio:['ignore','pipe','pipe']});p.stdout.on('data',x=>log+=x);p.stderr.on('data',x=>log+=x);p.on('exit',code=>{fs.writeFileSync(`${dir}/${name}.txt`,log);results.push({name,code});console.log(code===0?'PASS':'FAIL',name);resolve()})})}
let next=0;async function worker(){while(next<tests.length)await run(tests[next++])}await Promise.all([worker(),worker()]);
fs.writeFileSync(`${dir}/summary.json`,JSON.stringify(results,null,2));process.exitCode=results.some(r=>r.code!==0)?1:0;
