/* CLASS 26 — ANATOMY THEATER · PROJECT MODEL

   Class 25 se quedó con sus dos entregas (Beverage Experience y Chromatic Ingredient
   Wipe), así que Anatomy empieza en el siguiente número libre.

   QUÉ ES Y QUÉ NO ES
     No es un motor de producto. Los nueve presets de Motion ya responden a la misma
     pregunta —cómo paso de un plato al siguiente— y la responden bien. Esto responde a
     otra que la plataforma no había formulado: QUÉ HAY DENTRO de este plato. Por eso es
     una Section Experience, como Memories y Beverages, y no compite con la regla de
     Class 24 de un único motor de producto.

   DÓNDE VIVEN LOS DATOS
     Las capas pertenecen al PLATO, no a la sección: `dish.anatomy.layers[]` dentro de la
     colección `dishes[]` de siempre. La sección sólo guarda su propia configuración y a
     qué plato mira (`anatomy.dishId`).

     Todo lo editorial —`origin`, `technique`, `pairing`, `note`, `allergens`— ya existe
     en `dishes[]` desde Class 04 y aquí se LEE, no se copia. Esta clase no añade ni un
     campo que ya estuviera.

   REGISTRO MEDIDO, NO CABLEADO
     Cada capa lleva `width/height/top/squashY/offsetX` en fracción del ancho del
     escenario. Los genera `scripts/ingest-anatomy-layers.mjs` midiendo la caja de
     contenido alfa. Una capa SIN esos valores no es un error: el motor la mide en el
     navegador la primera vez (ver `measure()` en el engine) y sigue. Eso es lo que
     permite que un restaurante suba sus propios recortes sin ejecutar ningún script.

   APAGADO POR DEFECTO
     `enabled:false`. Cero sección, cero espacio, cero observers. Desmontar el nodo ES
     el teardown, como en Class 23.
*/
(() => {
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const PRESETS=Object.freeze(['anatomy-theater','ingredient-atlas']);
  /* Cómo se comporta el apilado en reposo. `exploded` es el DEFECTO a propósito: el
     estado abierto es el reposo, no el clímax, así que un visitante con
     prefers-reduced-motion ve la misma composición y no una versión degradada. */
  const RESTING=Object.freeze(['exploded','assembled']);
  const DEFAULT_STAGE=Object.freeze({widest:0.52,stackHeight:1.12,gap:-0.006});
  const DEFAULTS=Object.freeze({
    enabled:false,preset:'anatomy-theater',resting:'exploded',
    eyebrow:'Anatomía',title:'Por dentro.',intro:'',
    dishId:'',
    /* refuerzos, todos opcionales y todos apagables */
    idleFloat:true,pointerDepth:true,assembleControl:true,scrollDrift:true,
    showNotes:true,showOrigin:true,showPairing:true,
    stage:clone(DEFAULT_STAGE)
  });

  const num=(v,fallback)=>{const n=+v;return Number.isFinite(n)?n:fallback};
  const mediaRef=m=>m&&m.ref?{id:m.id||String(m.ref).split('/').pop(),kind:'image',ref:String(m.ref),alt:m.alt||''}:null;

  /* Una capa. `mediaRef` es una referencia lógica que resuelve RestaurantMedia; nunca
     una URL y nunca un blob:. Los campos de registro pueden venir a null: el motor los
     mide. */
  const layer=(patch={},index=0)=>({
    id:patch.id||`layer-${index+1}`,
    label:patch.label||'',
    note:patch.note||'',
    enabled:patch.enabled!==false,
    order:Number.isInteger(patch.order)?patch.order:index,
    media:mediaRef(patch.media)||(patch.mediaRef?{id:String(patch.mediaRef).split('/').pop(),kind:'image',ref:String(patch.mediaRef),alt:patch.label||''}:null),
    /* registro: null = medir en runtime */
    width:patch.width==null?null:num(patch.width,null),
    height:patch.height==null?null:num(patch.height,null),
    top:patch.top==null?null:num(patch.top,null),
    squashY:patch.squashY==null?null:num(patch.squashY,null),
    offsetX:num(patch.offsetX,0),
    depth:Number.isInteger(patch.depth)?patch.depth:index
  });

  function normalizeLayers(value){
    if(!Array.isArray(value))return [];
    return value.map((l,i)=>layer(l,i)).sort((a,b)=>a.order-b.order).map((l,i)=>({...l,order:i,depth:i}));
  }

  /* La anatomía de un plato. Vive en `dish.anatomy`. */
  function normalizeDishAnatomy(value){
    const v=value&&typeof value==='object'?value:{};
    return {enabled:v.enabled!==false,layers:normalizeLayers(v.layers)};
  }

  function normalize(value){
    const v=value&&typeof value==='object'?value:{};
    const stage=v.stage&&typeof v.stage==='object'?v.stage:{};
    return {...clone(DEFAULTS),...v,
      enabled:v.enabled===true,
      preset:PRESETS.includes(v.preset)?v.preset:DEFAULTS.preset,
      resting:RESTING.includes(v.resting)?v.resting:DEFAULTS.resting,
      eyebrow:typeof v.eyebrow==='string'?v.eyebrow:DEFAULTS.eyebrow,
      title:typeof v.title==='string'?v.title:DEFAULTS.title,
      intro:typeof v.intro==='string'?v.intro:'',
      dishId:typeof v.dishId==='string'?v.dishId:'',
      idleFloat:v.idleFloat!==false,pointerDepth:v.pointerDepth!==false,
      assembleControl:v.assembleControl!==false,scrollDrift:v.scrollDrift!==false,
      showNotes:v.showNotes!==false,showOrigin:v.showOrigin!==false,showPairing:v.showPairing!==false,
      stage:{widest:num(stage.widest,DEFAULT_STAGE.widest),
        stackHeight:num(stage.stackHeight,DEFAULT_STAGE.stackHeight),
        gap:num(stage.gap,DEFAULT_STAGE.gap)},
      /* `dish` es un plato completo entregado en memoria. Sólo lo usa la ruta de
         revisión: permite juzgar la sección con assets versionados del repositorio sin
         escribir nada en el Project State ni inventar un plato en la carta. */
      dish:v.dish&&typeof v.dish==='object'?v.dish:null
    };
  }

  const visible=a=>(a?.layers||[]).filter(l=>l&&l.enabled!==false);
  const newMediaId=()=>`layer-${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`;
  const refFor=(dishId,layerId)=>`project/anatomy/${dishId}/${layerId}`;

  /* Ingredientes como texto es lo que hay hoy en `dishes[]`
     (`'Sea bass · saffron · leek · fennel'`). Cuando no hay capas con etiqueta propia,
     esto es de dónde salen los nombres: se parte, no se inventa. */
  const parseIngredients=s=>String(s||'').split(/\s*[·|,]\s*/).map(x=>x.trim()).filter(Boolean);

  if(window.RestaurantDefaults&&!window.RestaurantDefaults.anatomy)
    window.RestaurantDefaults.anatomy=clone(DEFAULTS);

  window.RestaurantAnatomyModel=Object.freeze({
    PRESETS,RESTING,DEFAULTS,DEFAULT_STAGE,
    layer,normalize,normalizeLayers,normalizeDishAnatomy,
    visible,newMediaId,refFor,parseIngredients,clone
  });
})();
