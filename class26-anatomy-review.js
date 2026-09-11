/* CLASS 26 — ANATOMY REVIEW FIXTURE
   `?review=anatomy` únicamente. Todos los assets visuales salen de este repositorio.

   El estado de revisión es una capa de sesión: el Studio y el motor ven los mismos
   valores, mientras el Project State durable queda intacto. Mismo contrato que
   `class25-beverages-review.js`.

   POR QUÉ HAY UN PLATO DE REVISIÓN Y NO UN PLATO NUEVO EN LA CARTA
     LÚMINA es un restaurante mediterráneo de autor y su carta son seis platos. Meter una
     hamburguesa en `dishes[]` sería inventar contenido del restaurante para lucir un
     motor, y eso es exactamente lo que las reglas de la casa prohíben. Así que el plato
     de la anatomía llega SÓLO en esta ruta, en memoria, marcado como material de
     revisión — y el motor lo consume por el mismo camino que consumiría un plato real.

   DE DÓNDE SALEN LAS CAPAS
     `assets/anatomy/layers-manifest.json`, generado por
     `scripts/ingest-anatomy-layers.mjs`. No se copian aquí los números de registro: se
     leen. Si alguien reejecuta el ingestor con otros másters, esta ruta enseña el
     resultado nuevo sin tocar una línea.

   PROCEDENCIA DE LOS ASSETS
     Los nueve recortes vienen del proyecto de referencia de hamburguesa que se auditó en
     `docs/BURGER-SOURCE-ADAPTATION-AUDIT.md`, ingeridos a runtime propio. La nota
     editorial de cada capa es material de revisión, no información oficial de ningún
     restaurante: `demoContent: true`.
*/
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('review')!=='anatomy')return;

  const MANIFEST='assets/anatomy/layers-manifest.json';
  const DISH_ID='burger-clasica';
  const root=document.documentElement;

  /* Etiqueta y nota por capa. Se une al manifiesto por `id`; el manifiesto manda en la
     geometría y esto sólo aporta el texto. Si el ingestor añade una capa que no esté
     aquí, se pinta con la etiqueta que ya trae el manifiesto y sin nota. */
  const COPY={
    'top-bun':['Pan brioche con sésamo','Miga tierna y corteza brillante. Aguanta la salsa sin deshacerse, que es todo lo que se le pide.'],
    'bacon':['Bacon crujiente','Curado y pasado por plancha hasta que suena. Aporta la sal y el humo de todo el conjunto.'],
    'tomato':['Tomate en rodaja','Cortado grueso a propósito: aguanta el calor de la carne y mantiene el frescor.'],
    'cheese':['Cheddar fundido','Se funde con el calor residual de la carne, no con el grill. Cubre sin dominar.'],
    'patty':['Carne a la brasa','Sellada fuerte por fuera y jugosa dentro. El centro de gravedad del plato.'],
    'sauce':['Salsa de la casa','Ligeramente ácida para cortar la grasa. Va debajo de la carne para que no empape el pan.'],
    'onion-tomato':['Cebolla roja','En aro fino y crudo. Es el punto de mordida y el contraste dulce.'],
    'lettuce':['Lechuga fresca','La barrera entre el pan base y el jugo: protege la miga y suma textura.'],
    'bottom-bun-board':['Pan base sobre tabla','La base sostiene el conjunto entero. Se tuesta sólo por dentro.']
  };

  const DISH={
    id:DISH_ID,
    name:'Hamburguesa clásica con queso',
    meta:'Brasa · Cheddar · Bacon',
    short:'Carne a la brasa, cheddar fundido, bacon, tomate, cebolla roja y lechuga sobre pan brioche.',
    price:null,
    ingredients:'Carne a la brasa · cheddar · bacon · tomate · cebolla roja · lechuga · pan brioche',
    origin:'Material de revisión · sin procedencia declarada',
    technique:'Brasa · fundido con calor residual · montaje en frío',
    pairing:'Cerveza tostada · vermut rojo',
    allergens:'Gluten · lácteos · sésamo',
    note:'Nueve capas, cada una con su papel. El plato se explica solo cuando se abre.',
    enabled:true,
    demoContent:true,
    /* Lo rellena `boot()` con el heroe de runtime que emite el ingestor. Se usa en el
       modo de heroe anotado y en la ficha de producto. */
    image:'',
    anatomy:{enabled:true,layers:[]}
  };

  const FIXTURE={
    enabled:true,preset:'anatomy-theater',resting:'exploded',
    eyebrow:'Class 26 · Anatomy Theater',
    title:'Por dentro.',
    intro:'El plato en reposo ya está abierto. Cada capa se puede elegir y cuenta su parte; el botón vuelve a montarlo. Registro medido, no calibrado a mano: todos los assets y todas las medidas salen de este repositorio.',
    idleFloat:true,pointerDepth:true,assembleControl:true,scrollDrift:true,
    showNotes:true,showOrigin:true,showPairing:true
  };

  async function boot(){
    const M=window.RestaurantAnatomyModel;
    if(!M){setTimeout(boot,60);return}

    let manifest=null;
    try{
      const r=await fetch(MANIFEST,{cache:'force-cache'});
      if(!r.ok)throw new Error(`manifest ${r.status}`);
      manifest=await r.json();
    }catch(err){
      /* Sin manifiesto no se inventa geometría: se dice y se para. El motor, sin capas,
         cae solo a su modo de héroe anotado. */
      console.error('[anatomy-review] manifiesto no disponible',err);
      root.dataset.anatomyReview='error';
      return;
    }

    const dish=manifest.dishes?.find(d=>d.id===DISH_ID);
    if(!dish?.layers?.length){
      console.error(`[anatomy-review] el manifiesto no trae capas para ${DISH_ID}`);
      root.dataset.anatomyReview='error';
      return;
    }

    /* Las refs son lógicas, como en producción. `map()` las resuelve contra ficheros
       versionados sin guardar nada en la Media Library. */
    if(dish.hero?.runtimeAsset)DISH.image=dish.hero.runtimeAsset;

    DISH.anatomy.layers=dish.layers.map((l,i)=>{
      const [label,note]=COPY[l.id]||[l.label||l.id,''];
      const ref=`review/anatomy/${DISH_ID}/${l.id}`;
      window.RestaurantMedia?.map?.(ref,l.runtimeAsset);
      return {
        id:l.id,label,note,enabled:true,order:i,
        media:{id:l.id,kind:'image',ref,alt:label},
        /* geometría LEÍDA del manifiesto, no repetida aquí */
        width:l.layout.width,height:l.layout.height,top:l.layout.top,
        squashY:l.layout.squashY,offsetX:l.layout.offsetX,depth:l.layout.depth
      };
    });

    const fixture=M.normalize({...FIXTURE,dishId:DISH_ID,dish:DISH});

    /* La revisión es editable durante la sesión, pero nunca entra en IndexedDB ni en
       localStorage. Se superpone SÓLO el namespace `anatomy`: sigue habiendo un Studio y
       un único Project State durable, y el motor y el panel ven el mismo estado. */
    let current=fixture;
    const cfg=window.RestaurantStudioConfig;
    if(cfg?.get&&cfg?.set&&!cfg.__anatomyReviewPatched){
      const get=cfg.get.bind(cfg),set=cfg.set.bind(cfg);
      const inNS=p=>typeof p==='string'&&(p==='anatomy'||p.startsWith('anatomy.'));
      const tail=p=>p==='anatomy'?'':p.slice('anatomy.'.length);
      const pathGet=(o,p)=>p?p.split('.').reduce((a,k)=>a?.[k],o):o;
      const pathSet=(o,p,v)=>{const parts=p.split('.'),last=parts.pop(),
        t=parts.reduce((a,k)=>(a[k]??={}),o);t[last]=v;return o};
      const patched=Object.create(cfg);
      patched.get=p=>inNS(p)?pathGet(current,tail(p)):get(p);
      patched.set=(p,v)=>{
        if(!inNS(p))return set(p,v);
        const t=tail(p);
        current=t?M.normalize(pathSet(M.clone(current),t,v)):M.normalize(v);
        document.dispatchEvent(new CustomEvent('restaurant:config-applied',{detail:{scope:'anatomy-review'}}));
        return v;
      };
      patched.__anatomyReviewPatched=true;
      window.RestaurantStudioConfig=patched;
    }

    root.dataset.anatomyReview='ready';
    root.dataset.anatomyReviewLayers=String(DISH.anatomy.layers.length);
    document.dispatchEvent(new CustomEvent('restaurant:config-applied',{detail:{scope:'anatomy-review'}}));
    window.RestaurantAnatomyEngine?.refresh?.();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.RestaurantAnatomyReview=Object.freeze({
    dishId:DISH_ID,
    state:()=>({review:root.dataset.anatomyReview||'',layers:+(root.dataset.anatomyReviewLayers||0)})
  });
})();
