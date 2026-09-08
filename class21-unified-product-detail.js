/* CLASS 21 — UNIFIED PRODUCT DETAIL

   La ficha de producto sube al PRODUCT ENGINE. Antes de esto la abría cada motor por
   su cuenta y no había forma de encenderla, apagarla ni configurarla en un sitio.

   Lo que este archivo NO hace, deliberadamente:

     · no reescribe la ficha compartida. `app-v4.js` + `class6-product.js` +
       `#dish-detail` ya sirven a seis motores con su transición GSAP Flip desde el
       plato real, y eso es exactamente el nivel visual que hay que preservar. Aquí no
       se toca una línea de ellos;
     · no crea un segundo estado de producto. Quién es el producto activo lo siguen
       decidiendo el motor (`RestaurantOrbit`, `DishStageEngine`, …) y la excepción
       documentada `[data-orbit-hero="1"]`;
     · no duplica la regla del producto lateral. `class6-product` ya la implementa —
       si el plato no es el héroe, navega primero y sólo abre si llega a serlo — y se
       invoca por su evento público `restaurant:class6-open-dish`;
     · no inventa contenido. Un campo vacío se oculta.

   Lo que sí hace:

     1. da nombre al contrato: RestaurantProductDetail.open/close/isOpen;
     2. lo hace OPCIONAL y configurable desde el Studio existente (`productDetail`);
     3. registra ADAPTADORES por motor, para que cada uno abra SU ficha aprobada;
     4. y aporta un diálogo propio sólo para el caso que no tenía ninguna: Pizza,
        cuyo modelo de producto se conserva y se traduce, no se sustituye.

   Los adaptadores son datos: `match()` dice si este motor está en pantalla, y el
   resto es la interfaz. Un motor nuevo es un adaptador, no una rama aquí dentro.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NS='productDetail';
  const root=document.documentElement;

  const cfg=()=>window.RestaurantStudioConfig?.get?.(NS)
    ||window.RestaurantDefaults?.[NS]||{};
  const enabled=()=>cfg().enabled!==false;
  const trigger=()=>cfg().trigger||'product-and-button';
  const allowProductClick=()=>enabled()&&/product/.test(trigger());
  const allowButton=()=>enabled()&&/button/.test(trigger());
  const fields=()=>cfg().fields||{};
  const wants=name=>fields()[name]!==false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- adaptadores ----------

     El orden importa y es explícito: gana el primero cuyo `match()` sea cierto, así
     que los motores que se APODERAN del escenario se registran antes que el genérico.
     Los platos base siguen existiendo en el DOM cuando un preset los oculta, así que
     "hay platos" no distingue a un motor que se apodera del escenario: eso lo dice su
     preset, y el orden de registro lo resuelve sin condicionales cruzados. */
  const adapters=new Map();
  const register=(id,adapter)=>{adapters.set(id,adapter);return id};
  const current=()=>{
    for(const [id,a] of adapters){
      try{if(a.match&&a.match())return {id,...a}}catch(e){}
    }
    return null;
  };

  /* GROUP C — Pizza. Conserva su modelo propio (`pizzaSliceOrbit.products[]`,
     `demoContent:true`, `price:null`) y no se convierte en un plato normal: se traduce
     al contrato. Es el único motor que no tenía ficha, así que aquí sí hace falta un
     diálogo, y es del Product Engine — uno, no cinco. */
  register('pizza',{
    match:()=>root.dataset.orbitalMotion==='pizza-slice-orbit'
      &&!!window.RestaurantPizzaSliceOrbit,
    activeProduct(){
      const i=window.RestaurantPizzaSliceOrbit?.state?.().activeIndex??0;
      const list=window.RestaurantStudioConfig?.get?.('pizzaSliceOrbit.products')||[];
      const p=list[i];
      if(!p)return null;
      return {
        id:p.id,source:'pizza',index:i,
        name:p.name,
        meta:[p.descriptor,p.mood].filter(Boolean).join(' · '),
        /* price:null significa "no hay precio", no "cero" */
        price:p.price??null,
        short:p.story||p.lead||'',
        ingredients:p.ingredients||'',
        origin:p.origin||'',
        technique:p.technique||'',
        pairing:p.pairing||'',
        allergens:p.allergens||'',
        story:p.tale||p.story||'',
        image:p.runtimeAsset||p.asset||'',
        demoContent:p.demoContent===true
      };
    },
    open(product){return openOwnDialog(product)},
    close(){return closeOwnDialog()},
    isOpen:()=>!!dialog&&dialog.classList.contains('is-open')
  });

  /* GROUP A — los seis motores que ya comparten `#dish-detail`.
     El adaptador no abre nada por su cuenta: pide a Class 06 que abra, porque ahí vive
     la regla de héroe/lateral y la transición Flip. */
  register('orbit',{
    /* NO se exige que el escenario base esté "vivo": Depth Carousel y Anchor Scenes
       lo ocultan porque se apoderan del shell, y siguen siendo del GROUP A — usan
       esta misma ficha compartida. Lo que distingue a Pizza es su preset, y para eso
       basta con que su adaptador se registre antes. */
    match:()=>!!$('#dish-detail')&&$$('#orbit-stage .orbit-dish').length>0,
    activeProduct(){
      /* el estado del motor, no uno nuevo: el marcador de héroe manda cuando existe
         (Project 03 descentra su héroe a propósito), y si no, el índice del motor */
      const marked=$('#orbit-stage .orbit-dish[data-orbit-hero="1"]')?.dataset.id;
      const inDetail=$('#detail-visual .orbit-dish')?.dataset.id;
      const id=inDetail||marked
        ||window.RestaurantOrbit?.getDishes?.()[window.RestaurantOrbit?.getActiveIndex?.()]?.id
        ||null;
      return id?describeDish(id):null;
    },
    open(product){
      const id=product?.id;
      if(!id)return false;
      /* Class 06 decide: si ya es el héroe abre, y si no navega primero */
      window.dispatchEvent(new CustomEvent('restaurant:class6-open-dish',{detail:{id}}));
      return true;
    },
    close(){$('#detail-close')?.click();return true},
    isOpen:()=>root.dataset.dishDetail==='open'
      ||$('#dish-detail')?.getAttribute('aria-hidden')==='false'
  });

  /* GROUP B — motores con ficha propia en su propia página. Se adaptan al contrato,
     no al marcado: abren por su propio disparador aprobado. */
  register('dish-stage',{
    match:()=>!!window.DishStageEngine&&!!$('[data-ds-detail]'),
    activeProduct(){
      const e=window.DishStageEngine;
      const d=e?.getDishes?.()[e?.getActiveIndex?.()];
      return d?describeDish(d.id)||normalize(d):null;
    },
    open(){
      if(typeof window.DishStageEngine?.openDetail==='function'){
        window.DishStageEngine.openDetail();return true;
      }
      $('[data-ds-explore]')?.click();
      return true;
    },
    close(){$('[data-ds-detail-close]')?.click();return true},
    isOpen:()=>$('[data-ds-detail]')?.getAttribute('aria-hidden')==='false'
  });
  register('product-rail',{
    match:()=>!!window.CinematicProductRail&&!!$('#cpr-detail'),
    activeProduct(){
      const e=window.CinematicProductRail;
      const d=e?.getDishes?.()[e?.getActiveIndex?.()];
      return d?describeDish(d.id)||normalize(d):null;
    },
    /* su API congelada no expone openDetail, así que se usa su propio botón: su flujo
       y su animación quedan intactos */
    open(){const b=$('#cpr-explore');if(!b)return false;b.click();return true},
    close(){$('#cpr-detail-close')?.click();return true},
    isOpen:()=>{const d=$('#cpr-detail');return !!d&&(d.open===true||d.hasAttribute('open'))}
  });

  /* ---------- el producto, desde la única fuente que ya existe ---------- */
  function normalize(d){
    if(!d)return null;
    return {id:d.id,source:'dish',name:d.name,meta:d.meta||'',
      price:d.price??null,short:d.short||d.description||'',
      ingredients:d.ingredients||'',origin:d.origin||'',technique:d.technique||'',
      pairing:d.pairing||'',allergens:d.allergens||'',story:d.story||'',
      image:d.depthCarousel?.asset||d.image||''};
  }
  function describeDish(id){
    const list=window.RestaurantStudioConfig?.get?.('dishes')
      ||window.RestaurantDefaults?.dishes||[];
    return normalize(list.find(d=>d.id===id));
  }

  /* ---------- diálogo propio del Product Engine (sólo Pizza, hoy) ---------- */
  let dialog=null,dialogTrigger=null;
  function ensureStyles(){
    if($('link[data-product-detail-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v21.css';l.dataset.productDetailStyles='1';
    document.head.appendChild(l);
  }
  function ensureDialog(){
    if(dialog?.isConnected)return dialog;
    ensureStyles();
    dialog=document.createElement('div');
    dialog.className='upd-dialog';
    dialog.id='product-detail';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-hidden','true');
    dialog.setAttribute('aria-labelledby','upd-title');
    dialog.innerHTML=`
      <div class="upd-scrim" data-upd-scrim></div>
      <article class="upd-card">
        <button type="button" class="upd-close" data-upd-close
          aria-label="Cerrar ficha del producto">×</button>
        <div class="upd-media"><img class="upd-image" alt=""></div>
        <div class="upd-copy">
          <p class="upd-meta" data-upd="meta"></p>
          <h2 class="upd-title" id="upd-title" data-upd="name"></h2>
          <p class="upd-price" data-upd="price"></p>
          <p class="upd-short" data-upd="description"></p>
          <dl class="upd-grid">
            ${['ingredients','origin','technique','pairing','allergens'].map(f=>
              `<div class="upd-block" data-upd-block="${f}">
                 <dt>${({ingredients:'Ingredientes',origin:'Origen',
                   technique:'Técnica',pairing:'Maridaje',allergens:'Alérgenos'})[f]}</dt>
                 <dd data-upd="${f}"></dd>
               </div>`).join('')}
          </dl>
          <p class="upd-story" data-upd="story"></p>
          <p class="upd-demo" data-upd-demo hidden>Contenido de demostración.</p>
        </div>
      </article>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',e=>{
      if(e.target.closest('[data-upd-close]')||e.target.closest('[data-upd-scrim]'))
        closeOwnDialog();
    });
    return dialog;
  }
  /* un campo que el producto no tiene se OCULTA; jamás se rellena */
  function fill(product){
    const set=(name,value)=>{
      const el=$(`[data-upd="${name}"]`,dialog);
      if(!el)return;
      const show=!!String(value??'').trim()&&(name==='name'||name==='meta'
        ||name==='price'||wants(name));
      el.textContent=show?value:'';
      el.hidden=!show;
      const block=el.closest('[data-upd-block]');
      if(block)block.hidden=!show;
    };
    set('name',product.name);
    set('meta',product.meta);
    /* price:null no se renderiza como 0 ni como "—" */
    set('price',product.price===null||product.price===undefined?'':product.price);
    set('description',product.short);
    ['ingredients','origin','technique','pairing','allergens']
      .forEach(f=>set(f,product[f]));
    set('story',product.story);
    const img=$('.upd-image',dialog);
    if(img){
      if(product.image){img.src=product.image;img.hidden=false}
      else{img.removeAttribute('src');img.hidden=true}
    }
    const demo=$('[data-upd-demo]',dialog);
    if(demo)demo.hidden=!product.demoContent;
    dialog.dataset.product=product.id||'';
  }
  function openOwnDialog(product){
    if(!product)return false;
    ensureDialog();
    fill(product);
    dialogTrigger=document.activeElement instanceof HTMLElement?document.activeElement:null;
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden','false');
    document.body.classList.add('detail-open');
    root.dataset.productDetail='open';
    requestAnimationFrame(()=>$('[data-upd-close]',dialog)?.focus());
    return true;
  }
  function closeOwnDialog(){
    if(!dialog||!dialog.classList.contains('is-open'))return false;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden','true');
    document.body.classList.remove('detail-open');
    delete root.dataset.productDetail;
    /* el foco vuelve a quien abrió */
    if(dialogTrigger&&dialogTrigger.isConnected)dialogTrigger.focus();
    dialogTrigger=null;
    return true;
  }

  /* ---------- el contrato ---------- */
  function open(product,options={}){
    if(!enabled())return false;
    if(options.via==='button'&&!allowButton())return false;
    if(options.via==='product'&&!allowProductClick())return false;
    const a=current();
    if(!a)return false;
    const resolved=typeof product==='string'?describeDish(product)
      :(product&&product.id?product:a.activeProduct?.());
    if(!resolved)return false;
    return a.open(resolved)!==false;
  }
  function close(){
    const a=current();
    if(a&&a.isOpen&&a.isOpen())return a.close()!==false;
    return closeOwnDialog();
  }
  const isOpen=()=>{
    const a=current();
    return !!(a?.isOpen?.())||!!(dialog&&dialog.classList.contains('is-open'));
  };

  /* ---------- apagado: el clic vuelve a ser navegación ----------

     Los motores del GROUP A escuchan en fase de captura sobre sus propios elementos.
     Un listener en `document`, también en captura, corre ANTES que ellos — así que
     apagar la ficha se hace deteniendo la propagación ahí, sin editar ni un motor.  */
  function guard(){
    const swallow=e=>{e.preventDefault();e.stopImmediatePropagation()};
    document.addEventListener('click',e=>{
      if(isOpen())return;
      if(e.target.closest('#explore-dish')){if(!allowButton())swallow(e);return}
      if(e.target.closest('.orbit-shell')||e.target.closest('#orbit-stage')){
        if(!allowProductClick())swallow(e);
      }
    },true);
    document.addEventListener('keydown',e=>{
      if(e.key!=='Enter'||isOpen())return;
      if((e.target.closest?.('.orbit-shell')||e.target.closest?.('#orbit-stage'))
        &&!allowProductClick())swallow(e);
    },true);
    /* Escape cierra el diálogo propio; el de Class 06 ya lo gestiona app-v4 */
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&dialog?.classList.contains('is-open')){
        e.preventDefault();closeOwnDialog();
      }
    },true);
    /* si se apaga con la ficha abierta, se cierra */
    document.addEventListener('restaurant:config-applied',()=>{
      if(!enabled()&&isOpen())close();
      syncStudio();
      publish();
      if(isOpen())applyFieldGates();
    });
  }

  /* ---------- campos en la ficha COMPARTIDA ----------

     `app-v4.fillDetail` escribe textContent en nodos con id propio y no conoce esta
     capacidad, así que apagar un campo se hace ocultando su nodo — nunca borrando su
     contenido ni editando Class 06. Se aplica al abrir y ante cualquier cambio de
     configuración, porque el motor puede rellenarla de nuevo.

     Un campo apagado se oculta. Un campo encendido que el producto no tiene TAMBIÉN
     se oculta: es la misma regla que en el diálogo propio, y evita el bloque vacío
     que la ficha compartida dejaba a la vista. */
  const SHARED_FIELDS={
    description:'#detail-description',
    ingredients:'#detail-ingredients',
    origin:'#detail-origin',
    technique:'#detail-technique',
    pairing:'#detail-pairing',
    allergens:'#detail-allergens',
    story:'#class6-story'
  };
  /* el prefijo fijo que la ficha compartida imprime cuando no hay alérgenos deja el
     nodo "no vacío" sin decir nada, así que se mide el valor, no la cadena */
  const meaningful=(name,text)=>{
    const value=name==='allergens'?text.replace(/^[^·]*·\s*/,''):text;
    return value.replace(/[“”"'\s·—-]/g,'').length>0;
  };
  function applyFieldGates(){
    const detail=$('#dish-detail');
    if(!detail)return;
    Object.entries(SHARED_FIELDS).forEach(([name,sel])=>{
      const node=$(sel,detail);
      if(!node)return;
      const host=node.closest('.detail-columns > div')||node;
      const text=(node.textContent||'').trim();
      const show=wants(name)&&meaningful(name,text);
      host.hidden=!show;
      if(host!==node)node.hidden=!show;
    });
    const columns=$('.detail-columns',detail);
    if(columns){
      const anyVisible=$$('.detail-columns > div',detail).some(d=>!d.hidden);
      columns.hidden=!anyVisible;
    }
  }
  function watchSharedDetail(){
    const detail=$('#dish-detail');
    if(!detail)return;
    /* el contenido lo reescriben app-v4 y Class 06; observar el subárbol mantiene el
       gateado correcto sin acoplarse a cuándo lo hacen */
    new MutationObserver(()=>{if(isOpen())applyFieldGates()})
      .observe(detail,{childList:true,characterData:true,subtree:true,
        attributes:true,attributeFilter:['aria-hidden','class']});
    window.addEventListener('restaurant:dish-detail-open',()=>
      requestAnimationFrame(applyFieldGates));
  }

  function publish(){
    root.dataset.productDetailEnabled=enabled()?'on':'off';
    root.dataset.productDetailTrigger=trigger();
  }

  /* ---------- Studio: nativo, en el panel de Platos que ya existe ---------- */
  const FIELD_LABELS={description:'Descripción',ingredients:'Ingredientes',
    origin:'Origen',technique:'Técnica',pairing:'Maridaje',allergens:'Alérgenos',
    story:'Historia'};
  function ensureStudioCard(){
    const panel=$('.studio-panel[data-panel="dishes"]');
    if(!panel||$('.upd-studio',panel))return false;
    ensureStyles();
    const card=document.createElement('article');
    card.className='upd-studio';
    card.innerHTML=`
      <div class="upd-studio-head">
        <div><span class="upd-studio-n">21</span><strong>Ficha del plato</strong></div>
        <span class="upd-studio-badge">PRODUCT ENGINE</span>
      </div>
      <p>La misma ficha en todos los motores. La coreografía elige el producto; la
         ficha cuenta el producto.</p>
      <label class="upd-check">
        <input type="checkbox" data-path="${NS}.enabled"> Activada</label>
      <label>Apertura
        <select data-path="${NS}.trigger">
          <option value="product">Al pulsar el producto</option>
          <option value="button">Mediante botón</option>
          <option value="product-and-button">Ambos</option>
        </select></label>
      <fieldset class="upd-fields">
        <legend>Campos</legend>
        ${Object.entries(FIELD_LABELS).map(([f,label])=>
          `<label class="upd-check"><input type="checkbox"
             data-path="${NS}.fields.${f}"> ${label}</label>`).join('')}
      </fieldset>
      <small>Un campo activado que el producto no tiene se oculta: nunca se rellena.</small>`;
    panel.appendChild(card);
    /* Studio enlaza los [data-path] una sola vez al arrancar, así que una tarjeta
       añadida después se cablea por el mismo camino mutate → apply → persist */
    $$('[data-path]',card).forEach(input=>{
      const write=()=>{
        const value=input.type==='checkbox'?input.checked:input.value;
        window.RestaurantStudioConfig?.set?.(input.dataset.path,value);
      };
      input.addEventListener('input',write);
      input.addEventListener('change',write);
    });
    syncStudio();
    return true;
  }
  function syncStudio(){
    const card=$('.upd-studio');
    if(!card)return;
    $$('[data-path]',card).forEach(input=>{
      if(document.activeElement===input)return;
      const v=window.RestaurantStudioConfig?.get?.(input.dataset.path);
      if(input.type==='checkbox')input.checked=v!==false;
      else if(v!==undefined&&v!==null)input.value=v;
    });
  }

  /* ---------- arranque ---------- */
  let ready=false;
  function boot(){
    if(ready)return;
    /* En la página principal la configuración viene del Studio; en la página propia de
       un motor del GROUP B no hay Studio, y entonces manda la plantilla. El contrato
       tiene que existir en ambas o el adaptador de ese motor es código muerto. */
    if(!window.RestaurantStudioConfig&&!window.RestaurantDefaults?.[NS])return;
    ready=true;
    guard();
    watchSharedDetail();
    publish();
    root.dataset.productDetailReady='ready';
  }
  const timer=setInterval(()=>{boot();ensureStudioCard();
    if(ready&&$('.upd-studio'))clearInterval(timer)},250);
  setTimeout(()=>clearInterval(timer),60000);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.studio-open'))setTimeout(()=>{ensureStudioCard();syncStudio()},260);
  },true);

  window.RestaurantProductDetail={
    open,close,isOpen,
    register,
    adapters:()=>[...adapters.keys()],
    activeAdapter:()=>current()?.id||null,
    activeProduct:()=>current()?.activeProduct?.()||null,
    describe:describeDish,
    fields,
    /* seam de prueba: forzar una reevaluación del gateado sin esperar al observador */
    applyFields:applyFieldGates,
    state(){
      const a=current();
      return {ready,enabled:enabled(),trigger:trigger(),
        adapter:a?.id||null,open:isOpen(),
        product:a?.activeProduct?.()?.id||null,
        fields:{...fields()},reduced:reduced.matches};
    }
  };
})();
