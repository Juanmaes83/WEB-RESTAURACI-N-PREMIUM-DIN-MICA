/* FASE 1C — genera las DOS puertas de cada experiencia autónoma desde UNA fuente neutral.

   Antes este script leía `labs/<lab>/index.html` y generaba el entrypoint productivo.
   Eso quitaba la dependencia de RUNTIME, pero dejaba al LAB como fuente AUTORADA del
   producto, que es incoherente con `LAB = evidencia / regresión`. La autoría vive ahora
   fuera de `/labs/`:

       experiences/_source/<id>.html          ← FUENTE NEUTRAL (autoría)
                 ┌──────────┴──────────┐
       experiences/<id>/index.html      labs/<lab>/index.html
        puerta PRODUCTIVA                puerta de evidencia
                 └──────────┬──────────┘
                    MOTOR CANÓNICO en la raíz
                  (una implementación, dos puertas)

   Este script NO lee nada de `/labs/`: sólo escribe ahí. El gate lo comprueba.

   Qué hace con la fuente:
     · resuelve las regiones por puerta — `@door:lab` sólo va al LAB, `@door:product`
       sólo va al producto;
     · en la puerta productiva convierte la navegación de marca en un elemento NO
       navegable: dentro del iframe, un enlace a `index.html` recarga la experiencia sin
       `#shell` —o abre una app raíz anidada— y el proyecto activo se pierde;
     · las dos salidas están a la misma profundidad, así que las rutas `../../` del motor
       y de los assets resuelven igual en ambas.

   Uso: node scripts/build-experience-entrypoints.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE_DIR=path.join(ROOT,'experiences','_source');

const EXPERIENCES=[
  {id:'circular-dish-rotator',name:'Circular Dish Rotator',project:'Project 06',
    lab:'labs/project06-circular-dish-rotator/index.html'},
  {id:'dish-stage',name:'Dish Stage',project:'Project 10',
    lab:'labs/project10-dish-stage/index.html'},
  {id:'cinematic-product-rail',name:'Cinematic Product Rail',project:'Project 11',
    lab:'labs/project11-cinematic-product-rail/index.html'}
];

const HEAD_PRODUCT=exp=>`<!doctype html>
<!-- GENERADO por scripts/build-experience-entrypoints.mjs desde
     experiences/_source/${exp.id}.html — no editar a mano.

     Entrypoint PRODUCTIVO de ${exp.name} (${exp.project}): la puerta que abre la In-App
     Experience Shell (Class 22). Carga el MOTOR CANÓNICO de la raíz y consume el
     proyecto activo. Sin configurador propio, sin almacén propio, sin volver a /labs/. -->`;

const HEAD_LAB=exp=>`<!doctype html>
<!-- GENERADO por scripts/build-experience-entrypoints.mjs desde
     experiences/_source/${exp.id}.html — no editar a mano.

     LAB: entrypoint histórico de evidencia y regresión. Conserva su cromo y sus
     controles propios; abierto directamente se comporta como siempre. El motor es el
     canónico de la raíz, el mismo que carga experiences/${exp.id}/. -->`;

/* Resuelve las regiones por puerta. Se hace sobre las marcas y no con un parser de HTML
   a propósito: la fuente es marcado autorado, no un documento que haya que normalizar. */
function forDoor(html,door){
  const other=door==='lab'?'product':'lab';
  const keep=new RegExp(`[ \\t]*<!-- @door:${door} -->\\n?([\\s\\S]*?)[ \\t]*<!-- @/door -->\\n?`,'g');
  const drop=new RegExp(`[ \\t]*<!-- @door:${other} -->\\n?[\\s\\S]*?[ \\t]*<!-- @/door -->\\n?`,'g');
  const out=html.replace(drop,'').replace(keep,(_m,inner)=>inner);
  if(/@door:|@\/door/.test(out)){
    console.error(`marcas de puerta sin resolver en la salida ${door}`);process.exit(2);
  }
  return out;
}

/* Dentro del producto, la marca no navega. Se conserva la etiqueta como <span> con sus
   clases y su id —que es lo que usan el CSS y el motor— y se pierde sólo la navegación:
   en el rotador ese enlace ENVUELVE su bloque de marca (#cdr-brand-text,
   #cdr-brand-logo), y borrar el elemento se llevaba esos nodos y reventaba applyBrand(). */
function unlinkBrand(html){
  return html.replace(/<a\s([^>]*?)href="(?:\.\.\/\.\.\/)?index\.html"([^>]*?)>([\s\S]*?)<\/a>/g,
    (_m,before,after,inner)=>{
      const attrs=`${before} ${after}`.replace(/\s(target|rel)="[^"]*"/g,'').trim();
      return `<span ${attrs}>${inner}</span>`;
    });
}

let written=0;
for(const exp of EXPERIENCES){
  const src=path.join(SOURCE_DIR,`${exp.id}.html`);
  if(!fs.existsSync(src)){
    console.error(`falta la fuente: ${path.relative(ROOT,src)}`);process.exit(2);
  }
  let html=fs.readFileSync(src,'utf8').replace(/\r\n/g,'\n');
  html=html.slice(html.indexOf('<html'));            /* la cabecera la pone cada puerta */

  const outputs=[
    {file:path.join(ROOT,'experiences',exp.id,'index.html'),
      body:`${HEAD_PRODUCT(exp)}\n${unlinkBrand(forDoor(html,'product'))}`},
    {file:path.join(ROOT,exp.lab),
      body:`${HEAD_LAB(exp)}\n${forDoor(html,'lab')}`}
  ];

  for(const out of outputs){
    fs.mkdirSync(path.dirname(out.file),{recursive:true});
    const previous=fs.existsSync(out.file)
      ? fs.readFileSync(out.file,'utf8').replace(/\r\n/g,'\n') : null;
    if(previous!==out.body){fs.writeFileSync(out.file,out.body);written++}
  }
  console.log(`${exp.id.padEnd(24)} -> experiences/${exp.id}/ + ${path.dirname(exp.lab)}/`);
}
console.log(`\n2 puertas por experiencia desde experiences/_source/ (${written} escritas)`);
