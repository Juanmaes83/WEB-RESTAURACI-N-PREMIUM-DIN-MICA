/* FASE 1C — genera los entrypoints PRODUCTIVOS de las tres experiencias autónomas.

   El producto no puede cargar `/labs/` en runtime: un LAB es evidencia, no la fuente
   operativa. Pero tampoco puede existir un segundo motor. La solución es una sola
   implementación con dos puertas:

       experiences/<id>/index.html   ← puerta PRODUCTIVA (la que abre Class 22)
                    ↓
            MOTOR CANÓNICO en la raíz
                    ↑
       labs/<lab>/index.html         ← puerta histórica de evidencia y regresión

   Este script es la autoría de esa puerta productiva, no una dependencia de runtime:
   se ejecuta a mano cuando el DOM que un motor exige cambia, y su salida se commitea.
   `tests/phase-1c-consolidation-gate.mjs` comprueba después que las dos puertas cargan
   exactamente los mismos ficheros de motor y que no queda ningún `.js`/`.css` dentro del
   LAB del rotador.

   Lo que hace con el marcado del lab:
     · reescribe las rutas para la profundidad de `experiences/<id>/` (la misma que
       `labs/<lab>/`, así que en la práctica sólo cambian las que apuntaban al propio
       directorio del lab);
     · quita el cromo que sólo tiene sentido en un lab (el enlace de vuelta al índice);
     · deja el puente del proyecto, que es el que entrega el Project State.

   Uso: node scripts/build-experience-entrypoints.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

const EXPERIENCES=[
  {id:'circular-dish-rotator',name:'Circular Dish Rotator',project:'Project 06',
    lab:'labs/project06-circular-dish-rotator/index.html'},
  {id:'dish-stage',name:'Dish Stage',project:'Project 10',
    lab:'labs/project10-dish-stage/index.html'},
  {id:'cinematic-product-rail',name:'Cinematic Product Rail',project:'Project 11',
    lab:'labs/project11-cinematic-product-rail/index.html'}
];

const HEADER=(exp)=>`<!doctype html>
<!-- GENERADO por scripts/build-experience-entrypoints.mjs — no editar a mano.

     Entrypoint PRODUCTIVO de ${exp.name} (${exp.project}). Es la puerta que abre la
     In-App Experience Shell (Class 22). Carga el MOTOR CANÓNICO de la raíz, el mismo
     que carga la puerta histórica de ${exp.lab}: una implementación, dos puertas.

     El producto no depende de /labs/ en runtime. -->`;

let changed=0;
for(const exp of EXPERIENCES){
  const labPath=path.join(ROOT,exp.lab);
  if(!fs.existsSync(labPath)){console.error(`falta el lab: ${exp.lab}`);process.exit(2)}
  let html=fs.readFileSync(labPath,'utf8').replace(/\r\n/g,'\n');

  /* el doctype y los comentarios de cabecera del lab se sustituyen por los propios */
  html=html.slice(html.indexOf('<html'));

  /* El enlace de vuelta al índice del repositorio es cromo de lab: dentro del producto
     la vuelta la da la barra de la shell.

     Se DESENVUELVE, no se borra: en el rotador ese enlace envuelve su bloque de marca
     (#cdr-brand-text, #cdr-brand-logo) y su motor le escribe el nombre del restaurante
     al arrancar. Borrar el elemento se llevaba esos nodos y `applyBrand()` reventaba.
     Se conservan la etiqueta como <span>, sus clases y su id — que es lo que usan el
     CSS y el motor — y se pierde sólo la navegación fuera del producto. */
  html=html.replace(/<a\s([^>]*?)href="\.\.\/\.\.\/index\.html"([^>]*?)>([\s\S]*?)<\/a>/g,
    (_m,before,after,inner)=>{
      const attrs=`${before} ${after}`.replace(/\s(target|rel)="[^"]*"/g,'').trim();
      return `<span ${attrs}>${inner}</span>`;
    });

  /* La placa que identifica al LAB no puede viajar al producto: dentro de la aplicación
     esta pantalla es una vista previa del proyecto, no un laboratorio aislado. El lab
     conserva la suya intacta. */
  html=html.replace(/(<span class="cdr-status">)ISOLATED LAB · PHASE 2(<\/span>)/,
    '$1VISTA PREVIA DEL PROYECTO$2');

  /* las rutas propias del directorio del lab pasan a la raíz canónica; el resto ya era
     relativo a la raíz y `experiences/<id>/` está a la misma profundidad */
  html=html.replace(/(href|src)="\.\/([^"]+)"/g,'$1="../../$2"');

  const out=`${HEADER(exp)}\n${html}`;
  const outPath=path.join(ROOT,'experiences',exp.id,'index.html');
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const previous=fs.existsSync(outPath)?fs.readFileSync(outPath,'utf8').replace(/\r\n/g,'\n'):null;
  if(previous!==out){fs.writeFileSync(outPath,out);changed++}
  console.log(`${exp.id.padEnd(24)} <- ${exp.lab}`);
}
console.log(`\n${EXPERIENCES.length} entrypoints productivos en experiences/ (${changed} escritos)`);
