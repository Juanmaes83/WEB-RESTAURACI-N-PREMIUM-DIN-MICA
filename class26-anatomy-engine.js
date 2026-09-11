/* CLASS 26 — ANATOMY THEATER · ENGINE

       dish.anatomy.layers[]  (Project State)
                 ↓
       RestaurantAnatomyEngine
         ├── anatomy-theater    apilado denso + ficha lateral + montar/desmontar
         └── ingredient-atlas   el mismo apilado, con todas las etiquetas visibles
                 ↓
       MEDIA compartida (RestaurantMedia) · dishes[] · Product Detail

   UNA SOLA VERDAD:
     selected -> ficha · assembled -> geometría · progress de scroll -> deriva
   No hay un `activeLayer` que pueda discrepar de lo que se ve: la ficha se pinta
   siempre desde `selected`, y `selected` sólo cambia por gesto o por teclado.

   EL ESTADO EXPLOTADO ES EL REPOSO, NO EL CLÍMAX
     Esta es la decisión de dirección que se trae de la referencia
     (thebuggeddev/burger) y la mejor idea de todo ese proyecto. La composición abierta
     está ahí desde el primer frame: no hay que ganársela con scroll. La consecuencia
     que importa es de accesibilidad — con `prefers-reduced-motion` se apagan flotación,
     parallax y deriva, y la composición sigue siendo la composición. No hay versión
     degradada.

   LO QUE SE ARREGLA RESPECTO A LA REFERENCIA
     · sus capas tienen `pointer-events:none`: no se pueden tocar. Aquí cada capa es un
       <button> real, con foco, teclado y área táctil;
     · sus tweens infinitas corren fuera de pantalla para siempre. Aquí nada corre si la
       sección no es visible o el documento está oculto (patrón de Class 23);
     · su `prefers-reduced-motion` se consulta una vez al montar. Aquí es reactivo;
     · su registro son ocho constantes calibradas a mano a 1920. Aquí se mide.

   REGISTRO: GENERADO O MEDIDO
     Las capas versionadas traen su registro de `scripts/ingest-anatomy-layers.mjs` y
     llegan ya recortadas a su contenido. Las que suba un restaurante desde el Studio no
     traen nada y probablemente tengan relleno transparente alrededor: `measure()` las
     mide en un canvas la primera vez de la sesión y deriva el mismo apilado. Por eso un
     restaurante puede usar esto sin ejecutar un script.

   FALLBACK PROGRESIVO
     Con menos de dos capas resolubles no se explota nada: se pinta el héroe del plato
     con sus ingredientes como llamadas. La sección funciona con los assets que haya y
     mejora cuando el restaurante sube mejores medios.
*/
(() => {
  'use strict';
  const NS='anatomy';
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>r?[...r.querySelectorAll(s)]:[];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const M=()=>window.RestaurantAnatomyModel;
  const media=()=>window.RestaurantMedia;
  const cfgRaw=()=>window.RestaurantStudioConfig?.get?.(NS)??window.RestaurantDefaults?.[NS];
  const state=()=>M().normalize(cfgRaw());

  let section=null,shell=null,stage=null,stack=null,halo=null,fallback=null;
  let elEyebrow=null,elTitle=null,elIntro=null,sheet=null,sheetIndex=null,sheetLabel=null,
      sheetNote=null,sheetMeta=null,btnAssemble=null,btnPrev=null,btnNext=null,detailBtn=null,counter=null;
  let layers=[],nodes=[],selected=-1,assembled=false,mounted=false,visibleNow=false;
  let idleTweens=[],quickX=[],quickY=[],driftST=null,pointerBound=false,signature='',assembleTimer=0;
  let measureCache=new Map(),refreshToken=0,refreshChain=null;
  const observers=new Set();

  const gsapOk=()=>!!window.gsap;
  const motionOn=()=>!reduced.matches;

  /* ------------------------------------------------------------------ datos */

  function dishList(){
    return window.RestaurantOrbit?.getDishes?.()
      ||window.RestaurantStudioConfig?.snapshot?.()?.dishes
      ||window.RestaurantDefaults?.dishes||[];
  }

  /* El plato de la sección. `s.dish` sólo lo rellena la ruta de revisión, en memoria. */
  function activeDish(s){
    if(s.dish)return s.dish;
    const list=dishList().filter(d=>d&&d.enabled!==false);
    if(s.dishId){const hit=list.find(d=>d.id===s.dishId);if(hit)return hit}
    return list.find(d=>d.anatomy?.layers?.length)||list[0]||null;
  }

  async function resolveLayers(dish){
    const an=M().normalizeDishAnatomy(dish?.anatomy);
    if(an.enabled===false)return [];
    const out=[];
    for(const l of M().visible(an)){
      if(!l.media?.ref)continue;
      let url='';
      try{url=await media().url(l.media.ref)}catch{url=''}
      if(!url)continue;
      out.push({...l,url});
    }
    return out;
  }

  /* ------------------------------------------------------- registro medido en runtime

     Mismo cálculo que el ingestor, en pequeño: caja de contenido alfa por capa, y de las
     cajas sale el apilado. Se mide sobre un lienzo de 220px de ancho —suficiente para un
     bbox fiable y barato— y se cachea por ref durante la sesión. */
  function measureOne(url){
    if(measureCache.has(url))return Promise.resolve(measureCache.get(url));
    return new Promise(resolve=>{
      const img=new Image();
      img.crossOrigin='anonymous';
      img.onload=()=>{
        let res=null;
        try{
          const W=Math.min(220,img.naturalWidth||220);
          const H=Math.max(1,Math.round((img.naturalHeight||220)*W/(img.naturalWidth||W)));
          const c=document.createElement('canvas');c.width=W;c.height=H;
          const ctx=c.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(img,0,0,W,H);
          const d=ctx.getImageData(0,0,W,H).data;
          let x0=W,y0=H,x1=-1,y1=-1;
          /* Un umbral por fila/columna en vez de por píxel: una sola mota no mueve la
             caja, que es el fallo del bbox ingenuo. */
          const colHits=new Uint32Array(W),rowHits=new Uint32Array(H);
          for(let y=0;y<H;y++)for(let x=0;x<W;x++){
            if(d[(y*W+x)*4+3]>60){colHits[x]++;rowHits[y]++}
          }
          const minRun=Math.max(1,Math.round(Math.min(W,H)*0.012));
          for(let x=0;x<W;x++)if(colHits[x]>=minRun){x0=Math.min(x0,x);x1=Math.max(x1,x)}
          for(let y=0;y<H;y++)if(rowHits[y]>=minRun){y0=Math.min(y0,y);y1=Math.max(y1,y)}
          if(x1>=x0&&y1>=y0){
            res={imgW:img.naturalWidth||W,imgH:img.naturalHeight||H,
              /* todo normalizado al lienzo de la imagen, así que es independiente de W */
              cw:(x1-x0+1)/W,chh:(y1-y0+1)/H,
              cx:((x0+x1+1)/2)/W,ctop:y0/H};
          }
        }catch{ /* canvas contaminado o imagen sin permisos: se cae al reparto uniforme */ }
        measureCache.set(url,res);resolve(res);
      };
      img.onerror=()=>{measureCache.set(url,null);resolve(null)};
      img.src=url;
    });
  }

  /* Devuelve para cada capa la geometría final en fracción del ancho del escenario:
       box   ancho del ELEMENTO (la imagen completa, no sólo el contenido)
       lead  desplazamiento lateral para que el contenido visible caiga en el eje
       top   dónde empieza el contenido visible
       sq    aplastado vertical
     Si la capa ya trae registro del ingestor se respeta tal cual: viene recortada, así
     que elemento == contenido y no hace falta compensar nada. */
  /* `top` es siempre dónde cae el CONTENIDO VISIBLE. El elemento, en cambio, incluye el
     relleno transparente de arriba, así que lo que va al CSS es `elTop` — el top del
     elemento— ya compensado. Un asset del ingestor viene recortado: ctop=0, cx=0.5, y
     entonces elTop === top y todo esto se degenera en el caso simple. */
  function place(g){
    const imgH=g.box/Math.max(.01,g.aspect);        /* alto de la imagen sin aplastar */
    return {...g,
      elTop:+(g.top-g.ctop*imgH*g.sq).toFixed(5),
      lead:+(-g.cx*g.box+g.offsetX).toFixed(5)};
  }

  async function geometry(list,s){
    const st=s.stage;
    const pre=list.every(l=>l.width!=null&&l.height!=null&&l.top!=null&&l.squashY!=null);
    if(pre)return list.map(l=>place({
      ref:l.id,box:l.width,h:l.height,top:l.top,sq:l.squashY,offsetX:l.offsetX||0,
      /* recortada por el ingestor: el contenido ocupa el elemento entero */
      cx:.5,ctop:0,aspect:l.width/Math.max(.0001,l.height/l.squashY)
    }));

    const measured=await Promise.all(list.map(l=>measureOne(l.url)));
    /* Sin medida fiable (canvas contaminado, imagen caída) el reparto es uniforme: no es
       bonito, pero es determinista y no deja la sección en blanco. */
    const usable=measured.filter(Boolean).length>=2;
    if(!usable){
      const h=st.stackHeight/Math.max(1,list.length);
      return list.map((l,i)=>place({ref:l.id,box:.42,h,top:i*h,sq:1,offsetX:l.offsetX||0,
        cx:.5,ctop:0,aspect:.42/Math.max(.0001,h)}));
    }
    /* Mismo cálculo que el ingestor: el ancho de contenido manda la escala, y el
       aplastado sale del alto que queremos para el apilado. */
    const contentWpx=measured.map(m=>m?m.cw*m.imgW:0);
    const contentHpx=measured.map(m=>m?m.chh*m.imgH:0);
    const widest=Math.max(...contentWpx)||1;
    const unit=st.widest/widest;
    const rawH=contentHpx.map(h=>h*unit);
    const rawTotal=rawH.reduce((a,b)=>a+b,0)||1;
    const gapTotal=st.gap*(list.length-1);
    const sq=clamp((st.stackHeight-gapTotal)/rawTotal,.12,2);

    let top=0;
    return list.map((l,i)=>{
      const m=measured[i];
      const contentW=(contentWpx[i]||widest*.8)*unit;
      const box=contentW/Math.max(.02,m?m.cw:1);
      const h=rawH[i]*sq||st.stackHeight/list.length;
      const g=place({ref:l.id,box,h,top,sq,offsetX:l.offsetX||0,
        cx:m?m.cx:.5,ctop:m?m.ctop:0,
        aspect:m?(m.imgW/Math.max(1,m.imgH)):box/Math.max(.0001,h)});
      top+=h+st.gap;
      return g;
    });
  }

  /* ------------------------------------------------------------------ construcción */

  function ensureStyles(){
    if($('link[data-class26-anatomy-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v26.css';l.dataset.class26AnatomyStyles='1';
    document.head.appendChild(l);
  }

  function host(){
    /* La sección se coloca donde el producto ya tiene su hilo narrativo: después de la
       carta y antes de la visita. Sin inventar un sitio nuevo en la página. */
    return $('#visit')||$('.visit-section')||document.querySelector('main')||document.body;
  }

  function build(s,dish){
    ensureStyles();
    /* Cinturon y tirantes: si por lo que sea quedo una seccion de una pasada anterior,
       se va. Un #anatomy duplicado no es solo DOM huerfano —son ids repetidos y
       observers que nadie apaga. */
    document.querySelectorAll('.ana-section').forEach(n=>n.remove());
    section=document.createElement('section');
    section.id='anatomy';
    section.className='ana-section';
    section.dataset.anaPreset=s.preset;
    section.dataset.anaResting=s.resting;
    section.setAttribute('aria-label',s.title||'Anatomía del plato');
    section.innerHTML=`
      <div class="ana-shell" data-ana-shell>
        <div class="ana-copy">
          <p class="ana-eyebrow" data-ana-eyebrow></p>
          <h2 class="ana-title" data-ana-title></h2>
          <p class="ana-intro" data-ana-intro></p>
          <div class="ana-sheet" data-ana-sheet aria-live="polite">
            <span class="ana-sheet-index" data-ana-sheet-index></span>
            <h3 class="ana-sheet-label" data-ana-sheet-label></h3>
            <p class="ana-sheet-note" data-ana-sheet-note></p>
            <dl class="ana-sheet-meta" data-ana-sheet-meta></dl>
          </div>
          <div class="ana-actions">
            <button type="button" class="ana-assemble" data-ana-assemble></button>
            <span class="ana-nav">
              <button type="button" class="ana-prev" data-ana-prev aria-label="Capa anterior">←</button>
              <span class="ana-counter" data-ana-counter></span>
              <button type="button" class="ana-next" data-ana-next aria-label="Capa siguiente">→</button>
            </span>
            <button type="button" class="ana-detail" data-ana-detail hidden>Ver plato</button>
          </div>
        </div>
        <div class="ana-stage" data-ana-stage>
          <div class="ana-halo" aria-hidden="true"></div>
          <div class="ana-stack" data-ana-stack role="group" aria-label="Capas del plato"></div>
          <div class="ana-fallback" data-ana-fallback hidden></div>
        </div>
      </div>`;
    host().insertAdjacentElement('beforebegin',section);

    shell=$('[data-ana-shell]',section);stage=$('[data-ana-stage]',section);
    stack=$('[data-ana-stack]',section);halo=$('.ana-halo',section);
    fallback=$('[data-ana-fallback]',section);
    elEyebrow=$('[data-ana-eyebrow]',section);elTitle=$('[data-ana-title]',section);
    elIntro=$('[data-ana-intro]',section);sheet=$('[data-ana-sheet]',section);
    sheetIndex=$('[data-ana-sheet-index]',section);sheetLabel=$('[data-ana-sheet-label]',section);
    sheetNote=$('[data-ana-sheet-note]',section);sheetMeta=$('[data-ana-sheet-meta]',section);
    btnAssemble=$('[data-ana-assemble]',section);btnPrev=$('[data-ana-prev]',section);
    btnNext=$('[data-ana-next]',section);detailBtn=$('[data-ana-detail]',section);
    counter=$('[data-ana-counter]',section);

    btnAssemble.addEventListener('click',()=>setAssembled(!assembled));
    btnPrev.addEventListener('click',()=>step(-1));
    btnNext.addEventListener('click',()=>step(1));
    detailBtn.addEventListener('click',()=>openDetail(dish));
    section.addEventListener('keydown',onKey);
    return section;
  }

  /* ------------------------------------------------------------------ capas en el DOM */

  /* Montar el plato = llevar cada capa a un apilado apretado sobre la de abajo, que no
     se mueve. La distancia de cada capa se calcula una vez aquí y viaja como variable
     CSS: la timeline sólo mueve un escalar de 0 a 1, así que montar y desmontar son la
     misma animación en dos sentidos y nunca se desincronizan. */
  const TIGHT=0.028;
  function collapseDistances(geo){
    const n=geo.length,base=geo[n-1]?.top??0;
    return geo.map((g,i)=>+((base-(n-1-i)*TIGHT)-g.top).toFixed(5));
  }

  function paintLayers(list,geo,s){
    stack.innerHTML='';nodes=[];
    const cy=collapseDistances(geo);
    list.forEach((l,i)=>{
      const g=geo[i];
      const b=document.createElement('button');
      b.type='button';b.className='ana-layer';
      b.dataset.anaLayer=l.id;b.dataset.index=String(i);
      b.setAttribute('aria-label',l.label||`Capa ${i+1}`);
      b.setAttribute('aria-pressed','false');
      b.style.setProperty('--ana-box',`${(g.box*100).toFixed(4)}`);
      b.style.setProperty('--ana-lead',`${(g.lead*100).toFixed(4)}`);
      b.style.setProperty('--ana-top',`${(g.elTop*100).toFixed(4)}`);
      b.style.setProperty('--ana-h',`${(g.h*100).toFixed(4)}`);
      b.style.setProperty('--ana-cy',`${(cy[i]*100).toFixed(4)}`);
      b.style.setProperty('--ana-sq',g.sq.toFixed(5));
      b.style.setProperty('--ana-depth',String(l.depth??i));
      b.style.zIndex=String(20+list.length-i);
      const float=document.createElement('span');
      float.className='ana-layer-float';
      const img=document.createElement('img');
      img.src=l.url;img.alt='';img.loading=i<3?'eager':'lazy';img.decoding='async';
      img.draggable=false;
      float.appendChild(img);b.appendChild(float);
      const tag=document.createElement('span');
      tag.className='ana-layer-tag';tag.textContent=l.label||'';
      b.appendChild(tag);
      b.addEventListener('click',e=>{e.preventDefault();select(i)});
      b.addEventListener('pointerenter',()=>{if(motionOn())b.dataset.hover='1'});
      b.addEventListener('pointerleave',()=>{delete b.dataset.hover});
      stack.appendChild(b);nodes.push(b);
    });
    stage.style.setProperty('--ana-stack-h',`${(s.stage.stackHeight*100).toFixed(3)}`);
  }

  /* Héroe anotado: el modo que hace que la sección sirva sin capas. */
  function paintFallback(dish,s){
    const names=M().parseIngredients(dish?.ingredients);
    const hero=dish?.image||dish?.depthCarousel?.asset||'';
    fallback.hidden=false;stack.hidden=true;
    section.dataset.anaMode='hero';
    fallback.innerHTML=`
      ${hero?`<img class="ana-fallback-hero" src="${esc(hero)}" alt="${esc(dish?.name||'')}" loading="lazy">`:''}
      ${names.length?`<ul class="ana-fallback-list">${names.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}`;
    sheetLabel.textContent=dish?.name||'';
    sheetNote.textContent=names.length
      ?'Composición declarada por el restaurante. Sube un recorte por ingrediente para abrir el plato en capas.'
      :'';
    sheetIndex.textContent='';counter.textContent='';
    btnAssemble.hidden=true;btnPrev.hidden=true;btnNext.hidden=true;
    paintMeta(dish,s);
  }

  function paintMeta(dish,s){
    const rows=[];
    if(s.showOrigin&&dish?.origin)rows.push(['Procedencia',dish.origin]);
    if(dish?.technique)rows.push(['Técnica',dish.technique]);
    if(s.showPairing&&dish?.pairing)rows.push(['Maridaje',dish.pairing]);
    if(dish?.allergens)rows.push(['Alérgenos',dish.allergens]);
    sheetMeta.innerHTML=rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    sheetMeta.hidden=!rows.length;
  }

  /* ------------------------------------------------------------------ selección */

  function select(i){
    if(!nodes.length)return;
    selected=clamp(i,0,nodes.length-1);
    const l=layers[selected];
    nodes.forEach((n,k)=>{
      const on=k===selected;
      n.dataset.selected=on?'1':'0';
      n.setAttribute('aria-pressed',String(on));
      n.tabIndex=on?0:-1;
    });
    stack.dataset.hasSelection='1';
    sheetIndex.textContent=`${String(selected+1).padStart(2,'0')} / ${String(nodes.length).padStart(2,'0')}`;
    sheetLabel.textContent=l?.label||`Capa ${selected+1}`;
    const s=state();
    sheetNote.textContent=s.showNotes?(l?.note||''):'';
    sheetNote.hidden=!sheetNote.textContent;
    counter.textContent=`${selected+1}/${nodes.length}`;
    root.dataset.anatomyLayer=l?.id||'';
    observers.forEach(fn=>{try{fn(publicState())}catch{}});
  }

  function step(dir){
    if(!nodes.length)return;
    select(selected<0?(dir>0?0:nodes.length-1):(selected+dir+nodes.length)%nodes.length);
    nodes[selected]?.focus?.();
  }

  function onKey(e){
    if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();step(1)}
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();step(-1)}
    else if(e.key==='Escape'&&selected>=0){
      e.preventDefault();selected=-1;
      nodes.forEach(n=>{n.dataset.selected='0';n.setAttribute('aria-pressed','false');n.tabIndex=0});
      delete stack.dataset.hasSelection;
      sheetIndex.textContent='';sheetLabel.textContent='';sheetNote.textContent='';
    }
  }

  /* ------------------------------------------------------------------ montar / desmontar */

  function assembleLabel(){return assembled?'Desmontar':'Montar el plato'}

  function setAssembled(next){
    assembled=!!next;
    section.dataset.anaAssembled=assembled?'1':'0';
    btnAssemble.textContent=assembleLabel();
    btnAssemble.setAttribute('aria-pressed',String(assembled));
    root.dataset.anatomyAssembled=assembled?'1':'0';

    /* La transición la hace el NAVEGADOR, no GSAP.

       `--ana-collapse` está registrada con @property como <number>, así que es
       interpolable de forma nativa. Escribir 0 o 1 y dejar que el motor de estilos haga
       el resto tiene tres ventajas concretas sobre una timeline:
         · `prefers-reduced-motion` la apaga desde la hoja de estilos, sin una rama en JS
           y sin poder desincronizarse de ella;
         · el escalonado es un `transition-delay` por capa, así que aquí sólo se decide
           el ORDEN — de arriba abajo al montar, al revés al desmontar;
         · una interacción básica del producto deja de depender de una librería externa.

       Sigue habiendo un único escalar de 0 a 1, así que montar y desmontar son la misma
       animación en dos sentidos y no pueden discrepar.

       Medido: con la transición desactivada, escribir 1 lleva el apilado de 614px a
       184px de alto —solapes de 33 a 68px entre capas— y escribir 0 lo devuelve a 614. */
    const n=nodes.length;
    nodes.forEach((el,i)=>{
      el.style.setProperty('--ana-delay',`${(assembled?i:n-1-i)*42}ms`);
      el.style.setProperty('--ana-collapse',assembled?'1':'0');
    });
    clearTimeout(assembleTimer);
    assembleTimer=setTimeout(()=>observers.forEach(fn=>{try{fn(publicState())}catch{}}),
      motionOn()?640+n*42:0);
  }

  /* ------------------------------------------------------------------ movimiento */

  function startMotion(s){
    stopMotion();
    if(!gsapOk()||!motionOn()||!nodes.length)return;

    /* Flotación idle escalonada. Gramática portada de la referencia
       (y:8px / 2.4s / sine.inOut / yoyo / delay i*0.15), sobre el envoltorio interior
       para no pisar la transformación de la caja. */
    if(s.idleFloat){
      idleTweens=$$('.ana-layer-float',stack).map((el,i)=>
        gsap.to(el,{y:8,duration:2.4,delay:i*.15,ease:'sine.inOut',yoyo:true,repeat:-1}));
    }

    /* Parallax de puntero con la PROFUNDIDAD = índice de capa. Un solo parámetro, como
       en la referencia, pero con Pointer Events (sirve para lápiz y no asume ratón) y
       también en Y, que allí no existía. */
    if(s.pointerDepth){
      quickX=nodes.map(n=>gsap.quickTo(n,'--ana-px',{duration:.6,ease:'power3'}));
      quickY=nodes.map(n=>gsap.quickTo(n,'--ana-py',{duration:.6,ease:'power3'}));
      if(!pointerBound){stage.addEventListener('pointermove',onPointer);pointerBound=true}
    }

    /* Deriva de scroll: las capas entran algo más abiertas y se recogen hacia el reposo.
       Es un refuerzo de <=0.6% del ancho, no una coreografía: el reposo ya es el
       estado bueno y el scroll no debe apropiárselo. */
    if(s.scrollDrift&&window.ScrollTrigger){
      driftST=gsap.timeline({scrollTrigger:{trigger:section,start:'top 78%',end:'bottom 62%',scrub:1}});
      nodes.forEach((n,i)=>{
        const mid=(nodes.length-1)/2;
        driftST.fromTo(n,{'--ana-drift':((i-mid)*.62).toFixed(3)},
          {'--ana-drift':0,duration:1,ease:'none'},0);
      });
    }
  }

  function onPointer(e){
    if(!quickX.length)return;
    const r=stage.getBoundingClientRect();
    const dx=(e.clientX-r.left)/Math.max(1,r.width)-.5;
    const dy=(e.clientY-r.top)/Math.max(1,r.height)-.5;
    for(let i=0;i<quickX.length;i++){
      const depth=5+i*1.5;
      quickX[i](-dx*depth);
      quickY[i](-dy*depth*.45);
    }
  }

  function stopMotion(){
    idleTweens.forEach(t=>t?.kill?.());idleTweens=[];
    if(gsapOk()&&nodes.length)gsap.killTweensOf(nodes.concat($$('.ana-layer-float',stack)));
    quickX=[];quickY=[];
    if(pointerBound){stage.removeEventListener('pointermove',onPointer);pointerBound=false}
    if(driftST){driftST.scrollTrigger?.kill?.();driftST.kill?.();driftST=null}
    nodes.forEach(n=>{n.style.setProperty('--ana-px','0');n.style.setProperty('--ana-py','0');
      n.style.setProperty('--ana-drift','0')});
  }

  /* ---------------------------------------------------------------- Product Detail */

  /* La ficha NO se reimplementa. Se invoca la que ya sirve a seis motores por su seam
     público, y es Class 06 quien decide: si el plato ya es el héroe abre, y si no navega
     primero. El evento va en `window` —así lo escucha `class6-product.js:170`— y no en
     `document`. */
  function openDetail(dish){
    if(!dish?.id)return;
    if(window.RestaurantProductDetail?.open?.(dish,{via:'button'}))return;
    window.dispatchEvent(new CustomEvent('restaurant:class6-open-dish',{detail:{id:dish.id}}));
  }

  /* ------------------------------------------------------------------ ciclo de vida

     OFF ES OFF: desmontar el nodo apaga rAF, tweens, observers y decodificación de
     imágenes sin tocar una línea del resto del producto. */

  let io=null;
  function watch(){
    if(io||!section)return;
    io=new IntersectionObserver(entries=>{
      const on=entries.some(e=>e.isIntersecting);
      if(on===visibleNow)return;
      visibleNow=on;
      section.dataset.anaVisible=on?'1':'0';
      if(on&&!document.hidden)startMotion(state());else stopMotion();
    },{rootMargin:'12% 0px',threshold:0.01});
    io.observe(section);
  }

  function onVisibility(){
    if(document.hidden)stopMotion();
    else if(visibleNow&&mounted)startMotion(state());
  }

  function unmount(){
    stopMotion();
    clearTimeout(assembleTimer);assembleTimer=0;
    io?.disconnect?.();io=null;
    section?.remove?.();
    section=stack=stage=null;nodes=[];layers=[];selected=-1;assembled=false;
    mounted=false;visibleNow=false;signature='';
    delete root.dataset.anatomy;delete root.dataset.anatomyLayer;delete root.dataset.anatomyAssembled;
  }

  /* ------------------------------------------------------------------ montaje */

  function sigOf(s,dish,list){
    return [s.enabled,s.preset,s.resting,s.title,s.eyebrow,s.intro,s.dishId,
      s.idleFloat,s.pointerDepth,s.assembleControl,s.scrollDrift,
      s.showNotes,s.showOrigin,s.showPairing,
      s.stage.widest,s.stage.stackHeight,s.stage.gap,dish?.id,
      list.map(l=>[l.id,l.label,l.note,l.media?.ref,l.width,l.height,l.top,l.squashY,l.offsetX].join('~')).join('|')
    ].join('§');
  }

  /* UNA PASADA A LA VEZ.

     `refresh` es asincrona —resolver refs de media y medir recortes lo son— y
     `restaurant:config-applied` puede llegar varias veces seguidas: el panel al
     renderizar, el autosave, la ruta de revision al superponer su namespace. Sin
     candado, dos pasadas cruzaban el mismo `await`, las dos veian `mounted` en false
     y las dos construian. Medido: cuatro secciones #anatomy vivas a la vez.

     El token descarta la pasada vieja en cuanto hay una mas nueva; la cadena de
     promesas garantiza que no se solapen. */
  async function refresh(){
    const token=++refreshToken;
    const stale=()=>token!==refreshToken;
    const s=state();
    if(!s.enabled){if(mounted)unmount();return false}
    if(!M()||!media()){return false}
    const dish=activeDish(s);
    if(!dish){if(mounted)unmount();return false}
    const list=await resolveLayers(dish);
    if(stale())return false;
    const sig=sigOf(s,dish,list);
    if(mounted&&sig===signature)return true;

    const wasSelected=selected,wasAssembled=assembled;
    if(mounted)unmount();
    build(s,dish);
    signature=sig;

    elEyebrow.textContent=s.eyebrow||'';elEyebrow.hidden=!s.eyebrow;
    elTitle.textContent=s.title||dish.name||'';
    elIntro.textContent=s.intro||'';elIntro.hidden=!s.intro;
    detailBtn.hidden=!dish.id||!window.RestaurantStudioConfig?.get?.('productDetail.enabled');
    btnAssemble.hidden=!s.assembleControl;

    if(list.length<2){
      layers=[];paintFallback(dish,s);
    }else{
      layers=list;
      const geo=await geometry(list,s);
      if(stale()){unmount();return false}
      stack.hidden=false;fallback.hidden=true;section.dataset.anaMode='layers';
      paintLayers(list,geo,s);
      paintMeta(dish,s);
      btnAssemble.textContent=assembleLabel();
      select(wasSelected>=0&&wasSelected<list.length?wasSelected:0);
      if(s.resting==='assembled'||wasAssembled)setAssembled(true);
      else section.dataset.anaAssembled='0';
    }

    mounted=true;
    root.dataset.anatomy='ready';
    watch();
    if(visibleNow&&!document.hidden)startMotion(s);
    document.dispatchEvent(new CustomEvent('restaurant:anatomy-ready',{detail:publicState()}));
    return true;
  }

  function publicState(){
    return {mounted,enabled:!!cfgRaw()?.enabled,mode:section?.dataset.anaMode||'',
      layers:nodes.length,selected,assembled,visible:visibleNow,
      reducedMotion:reduced.matches,preset:section?.dataset.anaPreset||''};
  }

  /* --------------------------------------------------------------------- arranque */

  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    queueMicrotask(()=>{
      queued=false;
      refreshChain=(refreshChain||Promise.resolve())
        .then(()=>refresh())
        .catch(err=>console.error('[anatomy]',err));
    });
  }

  document.addEventListener('restaurant:config-applied',schedule);
  document.addEventListener('visibilitychange',onVisibility);
  /* Reactivo, no una foto al montar: si el visitante cambia la preferencia del sistema,
     el movimiento se apaga o se enciende sin recargar. */
  reduced.addEventListener?.('change',()=>{
    if(!mounted)return;
    stopMotion();
    if(visibleNow&&!document.hidden)startMotion(state());
    section&&(section.dataset.anaReduced=reduced.matches?'1':'0');
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();

  /* El registro medido NO se persiste, y es deliberado.

     Para un asset del ingestor da igual: ya viene con el suyo. Para uno que sube el
     restaurante, `width`/`top` medidos describen el ELEMENTO y el CONTENIDO por separado
     —hay relleno transparente alrededor—, así que guardar sólo esos cuatro números y
     leerlos después por la vía `pre`, que da por hecho un recorte ajustado, colocaría la
     capa mal. Guardar bien exigiría añadir `cx` y `ctop` al modelo para todos.

     Medir cuesta un canvas de 220px por capa y se cachea toda la sesión. No merece dos
     campos más en el contrato de datos. Esto sólo tira la caché y vuelve a medir, para
     cuando el restaurante reemplaza un recorte. */
  async function remeasure(){
    measureCache.clear();
    signature='';
    return refresh();
  }

  window.RestaurantAnatomyEngine=Object.freeze({
    refresh(){schedule();return refreshChain||Promise.resolve(false)},
    remeasure,
    select,step,setAssembled,
    state:publicState,
    layers:()=>layers.map(l=>({id:l.id,label:l.label,note:l.note,ref:l.media?.ref})),
    subscribe(fn){observers.add(fn);return()=>observers.delete(fn)},
    unmount
  });
})();
