import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const flow=read('class7-editorial-flow.js');
const elegant=read('class5-elegant-orbit.js');

const checks=[
  ['third mode id',flow.includes("const MODE='editorial-flow'")],
  ['studio option',flow.includes("option.textContent='Editorial Flow'")],
  ['vertical flow slots',flow.includes("'0':{x:64,y:50")&&flow.includes("'1':{x:70,y:77")],
  ['copy transition',flow.includes('editorial-flow-title-ghost')&&flow.includes('animateCopy')],
  ['autoplay guarded by reduced motion',flow.includes('reduced.matches')&&flow.includes('scheduleAuto')],
  ['detail bridge preserved',flow.includes('base.click()')],
  ['flow choreography signature',flow.includes("orbitalChoreography='editorial-flow-v1'")],
  ['elegant isolated',elegant.includes("dataset.orbitalMotion==='elegant'")&&!elegant.includes("dataset.orbitalMotion!=='urban'")],
  ['flow runtime loader',elegant.includes("s.src='class7-editorial-flow.js'")]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length){console.error(`CLASS7_STATIC_FAIL ${failed.map(([n])=>n).join(', ')}`);process.exit(1)}
console.log('CLASS7_EDITORIAL_FLOW_STATIC_PASS');