import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const flow=read('class7-editorial-flow.js');
const elegant=read('class5-elegant-orbit.js');

const checks=[
  ['third mode id',flow.includes("const MODE='editorial-flow'")],
  ['studio option',flow.includes("option.textContent='Editorial Flow'")],
  ['continuous track interpolation',flow.includes('sampleTrack(distance)')&&flow.includes('renderAt(position)')&&flow.includes('interpolate(A.x,B.x,t)')],
  ['single visible master timeline',flow.includes('master=gsap.timeline')&&flow.includes('passBaseStep(direction)')],
  ['real engine crossover is cue',flow.includes('pendingIndex')&&flow.includes('commitCue(idx)')&&flow.includes("editorialFlowCue='waiting'")],
  ['dynamic headline architecture',flow.includes('editorial-flow-dynamic-wrap')&&flow.includes('editorial-flow-dynamic')&&flow.includes('exitHeadline')],
  ['per-dish colour metadata',flow.includes('editorialFlow')&&flow.includes('dish-flow-color')&&flow.includes('PALETTE')],
  ['per-dish headline editable in Studio',flow.includes('dish-flow-headline')&&flow.includes('persistOverrides')],
  ['autoplay guarded by reduced motion and visibility',flow.includes('reduced.matches')&&flow.includes('inView')&&flow.includes('scheduleAuto')],
  ['detail bridge preserved',flow.includes('passBaseClick(base)')],
  ['wheel keyboard drag intercepted by flow owner',flow.includes("addEventListener('wheel'")&&flow.includes("addEventListener('keydown'")&&flow.includes("addEventListener('pointerup'")],
  ['flow choreography signature V2',flow.includes("orbitalChoreography='editorial-flow-v2'")],
  ['elegant isolated',elegant.includes("dataset.orbitalMotion==='elegant'")&&!elegant.includes("dataset.orbitalMotion!=='urban'")],
  ['flow runtime loader',elegant.includes("s.src='class7-editorial-flow.js'")]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length){console.error(`CLASS7_STATIC_FAIL ${failed.map(([n])=>n).join(', ')}`);process.exit(1)}
console.log('CLASS7_EDITORIAL_FLOW_V2_STATIC_PASS');
