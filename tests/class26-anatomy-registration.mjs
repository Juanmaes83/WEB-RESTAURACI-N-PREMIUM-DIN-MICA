/* CLASS 26 — ANATOMY REGISTRATION INTEGRITY
   Sin navegador: comprueba que el manifiesto y los assets de runtime son coherentes
   entre si y con lo que el motor da por hecho. Corre antes del gate de Playwright,
   porque si el registro esta mal no hay nada visual que juzgar.

   Uso: node tests/class26-anatomy-registration.mjs */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const MANIFEST=path.join(ROOT,'assets','anatomy','layers-manifest.json');
const checks=[];
const check=(n,ok,d='')=>{const row={name:n,ok:!!ok,detail:d||''};checks.push(row);console.log(`${row.ok?'PASS':'FAIL'} ${n}${d?` — ${d}`:''}`)};

/* Cabecera PNG minima: basta el IHDR para saber ancho, alto y si hay canal alfa. */
function pngHeader(file){
  const fd=fs.openSync(file,'r'),buf=Buffer.alloc(33);
  fs.readSync(fd,buf,0,33,0);fs.closeSync(fd);
  if(buf.toString('hex',0,8)!=='89504e470d0a1a0a')return null;
  return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),bitDepth:buf[24],colorType:buf[25]};
}

check('el manifiesto existe',fs.existsSync(MANIFEST),MANIFEST.replace(ROOT+path.sep,''));
if(!fs.existsSync(MANIFEST)){report();process.exit(1)}

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
check('lo genera el ingestor, no una mano',
  manifest.generatedBy==='scripts/ingest-anatomy-layers.mjs',manifest.generatedBy);
check('hay al menos un plato con anatomia',(manifest.dishes||[]).length>=1,
  String((manifest.dishes||[]).length));

for(const dish of manifest.dishes||[]){
  const tag=`[${dish.id}]`;
  const layers=dish.layers||[];
  check(`${tag} tres capas o mas — con menos el motor cae a heroe anotado`,
    layers.length>=3,String(layers.length));
  check(`${tag} el veredicto del registro es favorable`,dish.verdict?.registered===true,
    JSON.stringify({widthSpreadOk:dish.verdict?.widthSpreadOk,stackHeightOk:dish.verdict?.stackHeightOk}));

  /* --- assets --- */
  let allExist=true,allAlpha=true,allMatch=true,heaviest=0;
  const missing=[];
  for(const l of layers){
    const abs=path.join(ROOT,l.runtimeAsset);
    if(!fs.existsSync(abs)){allExist=false;missing.push(l.id);continue}
    const bytes=fs.statSync(abs).size;
    heaviest=Math.max(heaviest,bytes);
    const head=pngHeader(abs);
    /* colorType 6 = RGBA, 4 = gris+alfa. Sin canal alfa no hay recorte que apilar. */
    if(!head||(head.colorType!==6&&head.colorType!==4))allAlpha=false;
    if(!head||head.w!==l.runtime.w||head.h!==l.runtime.h)allMatch=false;
  }
  check(`${tag} todos los assets de runtime existen`,allExist,missing.join(',')||'ok');
  check(`${tag} todos llevan canal alfa real`,allAlpha);
  check(`${tag} las dimensiones declaradas coinciden con el fichero`,allMatch);
  check(`${tag} ninguna capa pasa de 1.5MB`,heaviest<=1_572_864,`${(heaviest/1024).toFixed(0)}KB la mayor`);

  /* --- el runtime esta RECORTADO a su contenido ---
     De esto depende que el motor pueda tomar la via `pre` sin compensar cx ni ctop.
     Si un asset llegara con relleno, el apilado saldria descuadrado. */
  const cropped=layers.every(l=>l.runtime.w===Math.min(dish.layout.maxRuntimeWidth,l.content.w)
    ||l.runtime.w===dish.layout.maxRuntimeWidth);
  check(`${tag} el runtime esta recortado a la caja de contenido`,cropped);

  /* --- coherencia del layout ---
     Reconstruimos el apilado desde los datos y tiene que dar lo que dice el veredicto. */
  const gap=dish.layout.gapFraction;
  let top=0,tolerable=true;
  for(const l of layers){
    if(Math.abs(l.layout.top-top)>0.0005)tolerable=false;
    top+=l.layout.height+gap;
  }
  const height=+(top-gap).toFixed(5);
  check(`${tag} los tops del manifiesto son el acumulado real`,tolerable);
  check(`${tag} el alto del apilado coincide con el declarado`,
    Math.abs(height-dish.verdict.stackHeight)<=0.002,`${height} vs ${dish.verdict.stackHeight}`);
  check(`${tag} el apilado respeta el objetivo de alto`,
    Math.abs(height-dish.layout.targetStackHeight)<=0.01,
    `${height} vs ${dish.layout.targetStackHeight}`);

  /* --- densidad: el criterio de direccion, no un detalle ---
     Un despiece con huecos generosos parece un diagrama de montaje. */
  check(`${tag} el apilado es DENSO (huecos <= 0 o minimos)`,gap<=0.002,String(gap));

  /* --- aplastado --- */
  const sq=layers.map(l=>l.layout.squashY);
  check(`${tag} el aplastado es un valor derivado y unico`,
    new Set(sq).size===1&&sq[0]>0.1&&sq[0]<1.6,`${sq[0]}`);

  /* --- orden y unicidad --- */
  check(`${tag} el orden es 0..n sin huecos ni repetidos`,
    layers.every((l,i)=>l.layout.order===i&&l.layout.depth===i));
  check(`${tag} los ids no se repiten`,new Set(layers.map(l=>l.id)).size===layers.length);
  check(`${tag} cada capa tiene etiqueta`,layers.every(l=>String(l.label||'').trim().length>0));

  /* --- masters intactos --- */
  check(`${tag} los masters de origen siguen ahi`,
    layers.every(l=>fs.existsSync(path.join(ROOT,l.source))));

  /* --- peso total: lo que hace viable una revision desde una rama --- */
  const runtimeMB=dish.verdict.runtimeBytes/1048576;
  check(`${tag} el juego de runtime baja de 8MB`,runtimeMB<=8,`${runtimeMB.toFixed(1)}MB`);
  check(`${tag} el ingestor ahorra al menos un 40%`,dish.verdict.savedPct>=40,
    `-${dish.verdict.savedPct}%`);

  if(dish.hero){
    check(`${tag} el heroe de runtime existe`,fs.existsSync(path.join(ROOT,dish.hero.runtimeAsset)));
    check(`${tag} el heroe pesa menos que su master`,
      dish.hero.runtimeBytes<dish.hero.sourceBytes,
      `${(dish.hero.sourceBytes/1024).toFixed(0)}KB -> ${(dish.hero.runtimeBytes/1024).toFixed(0)}KB`);
  }
}

/* El fixture de revision se une al manifiesto por id: si un id cambia, la nota
   editorial se cae en silencio. Mejor que lo cace el gate. */
const review=fs.readFileSync(path.join(ROOT,'class26-anatomy-review.js'),'utf8');
const copyIds=[...review.matchAll(/^\s*'([a-z0-9-]+)':\[/gm)].map(m=>m[1]);
const manifestIds=(manifest.dishes?.[0]?.layers||[]).map(l=>l.id);
check('el fixture de revision cubre todas las capas del manifiesto',
  manifestIds.every(id=>copyIds.includes(id)),
  manifestIds.filter(id=>!copyIds.includes(id)).join(',')||'todas cubiertas');

function report(){
  const passed=checks.filter(c=>c.ok).length;
  const out=path.join(ROOT,'output','anatomy');
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'registration-report.json'),
    JSON.stringify({passed,total:checks.length,status:passed===checks.length?'PASS':'FAIL',checks},null,2));
  console.log(`\n${passed}/${checks.length} ${passed===checks.length?'CLASS26_REGISTRATION_PASS':'CLASS26_REGISTRATION_FAIL'}`);
  if(passed!==checks.length)process.exitCode=1;
}
report();
