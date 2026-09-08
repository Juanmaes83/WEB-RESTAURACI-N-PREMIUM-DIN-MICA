/* CLASS 04 — regression guard: the public experience must survive Studio/storage failures. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(base,over)=>{if(Array.isArray(base))return Array.isArray(over)?over:base;if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out;}return over===undefined?base:over;};

  /* Class 06 guaranteed entrypoint. index.html always loads this guard, so the final
     product layer can no longer exist in the repository without being executed. */
  function loadClass6(){
    if(!document.querySelector('link[data-class6-styles]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v6.css';l.dataset.class6Styles='1';document.head.appendChild(l);
    }
    const load=(src,key)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1';document.body.appendChild(s);};
    load('class6-product.js','class6-product-runtime');
    load('class6-detail-bridge.js','class6-detail-bridge');
  }
  loadClass6();

  async function install(){
    const nextBtn=$('#next-dish'),prevBtn=$('#prev-dish'),shell=$('.orbit-shell');
    if(!nextBtn||!prevBtn||!shell)return;
    if(typeof nextBtn.onclick==='function'&&typeof prevBtn.onclick==='function'){document.documentElement.dataset.orbitRuntime='primary';return;}

    console.warn('Class 04 primary interaction boot incomplete — restoring Class 03 orbital fallback.');
    document.documentElement.dataset.orbitRuntime='fallback';
    let cfg=clone(window.RestaurantDefaults||{dishes:[]});
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config)cfg=merge(cfg,saved.config);}catch{}
    const dishes=()=>cfg.dishes.filter(d=>d.enabled!==false);
    let progress=0,active=0,tween=null,drag=false,startX=0,startP=0,lastX=0,velocity=0;

    function build(){const stage=$('#orbit-stage');if(!stage||!dishes().length)return;stage.innerHTML='';dishes().forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.className='orbit-dish';b.dataset.guardIndex=i;b.innerHTML=`<img src="${d.image||''}" alt="${String(d.name||'Dish').replace(/"/g,'&quot;')}">`;b.onclick=()=>i===active?openDetail():go(i);stage.appendChild(b)});render();copy(true);}
    function dist(i){const n=dishes().length;let d=i-progress;if(d>n/2)d-=n;if(d<-n/2)d+=n;return d;}
    function render(){const n=dishes().length;if(!n)return;const mobile=innerWidth<620,rx=(mobile?.47:.40)*shell.clientWidth,ry=(mobile?.25:.27)*shell.clientHeight;$$('.orbit-dish').forEach((el,i)=>{const d=dist(i),a=d*Math.PI*2/n,front=(Math.cos(a)+1)/2,x=Math.sin(a)*rx,y=-(1-front)*ry*.85+Math.abs(Math.sin(a))*ry*.20,scale=.42+Math.pow(front,1.4)*(mobile?.76:.72),opacity=.22+front*.78,blur=(1-front)*4,brightness=.54+front*.50,rot=Math.sin(a)*5,z=Math.round(front*100);if(window.gsap)gsap.set(el,{xPercent:-50,yPercent:-50,x,y,scale,rotation:rot,opacity,filter:`blur(${blur}px) brightness(${brightness})`,zIndex:z});else{el.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale}) rotate(${rot}deg)`;el.style.opacity=opacity;el.style.filter=`blur(${blur}px) brightness(${brightness})`;el.style.zIndex=z;}});}
    function nearest(){const n=dishes().length;return n?((Math.round(progress)%n)+n)%n:0;}
    function sync(){const n=nearest();if(n!==active){active=n;copy();}}
    function animate(target,duration=.7){tween?.kill?.();if(window.gsap){const s={v:progress};tween=gsap.to(s,{v:target,duration,ease:'power3.inOut',onUpdate(){progress=s.v;render();sync()},onComplete(){progress=Math.round(target);render();sync()}});}else{progress=Math.round(target);render();sync();}}
    function go(index){const n=dishes().length;let d=index-progress;while(d>n/2)d-=n;while(d<-n/2)d+=n;animate(progress+d);}
    function copy(immediate=false){const d=dishes()[active];if(!d)return;const els=[$('#dish-meta'),$('#dish-title'),$('#dish-short')].filter(Boolean);const set=()=>{if($('#dish-meta'))$('#dish-meta').textContent=d.meta||'';if($('#dish-title'))$('#dish-title').textContent=d.name||'';if($('#dish-short'))$('#dish-short').textContent=d.short||'';if($('#dish-counter'))$('#dish-counter').textContent=`${String(active+1).padStart(2,'0')} / ${String(dishes().length).padStart(2,'0')}`;if(window.gsap)gsap.to(els,{opacity:1,y:0,duration:immediate?0:.28,stagger:.035});};if(!immediate&&window.gsap)gsap.to(els,{opacity:0,y:7,duration:.14,onComplete:set});else set();}
    function openDetail(){const d=dishes()[active],detail=$('#dish-detail');if(!d||!detail)return;const pairs={meta:'detail-meta',name:'detail-title',price:'detail-price',short:'detail-description',ingredients:'detail-ingredients',origin:'detail-origin',technique:'detail-technique',pairing:'detail-pairing'};Object.entries(pairs).forEach(([k,id])=>{const el=$('#'+id);if(el)el.textContent=d[k]||'';});if($('#detail-note'))$('#detail-note').textContent=`“${d.note||''}”`;if($('#detail-allergens'))$('#detail-allergens').textContent=`Allergens · ${d.allergens||''}`;detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');document.body.classList.add('detail-open');if(window.gsap)gsap.fromTo(detail,{opacity:0},{opacity:1,duration:.3});}
    function closeDetail(){const detail=$('#dish-detail');detail?.classList.remove('is-open');detail?.setAttribute('aria-hidden','true');document.body.classList.remove('detail-open');}

    nextBtn.onclick=()=>animate(Math.round(progress)+1);prevBtn.onclick=()=>animate(Math.round(progress)-1);if($('#explore-dish'))$('#explore-dish').onclick=openDetail;if($('#detail-close'))$('#detail-close').onclick=closeDetail;
    shell.addEventListener('keydown',e=>{if(e.key==='ArrowRight')nextBtn.click();if(e.key==='ArrowLeft')prevBtn.click();if(e.key==='Enter')openDetail();});
    shell.addEventListener('wheel',e=>{e.preventDefault();e.deltaY>0?nextBtn.click():prevBtn.click();},{passive:false});
    shell.addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;lastX=e.clientX;startP=progress;velocity=0;shell.setPointerCapture?.(e.pointerId);tween?.kill?.();});
    shell.addEventListener('pointermove',e=>{if(!drag)return;velocity=e.clientX-lastX;lastX=e.clientX;progress=startP-(e.clientX-startX)/(innerWidth<620?170:240);render();sync();});
    const end=()=>{if(!drag)return;drag=false;animate(Math.round(progress-velocity*.018),.55);};shell.addEventListener('pointerup',end);shell.addEventListener('pointercancel',end);addEventListener('resize',render);

    const dlg=$('#reserve-dialog');$$('.reserve-open').forEach(b=>b.onclick=()=>dlg?.showModal?.());if($('.modal-close'))$('.modal-close').onclick=()=>dlg?.close?.();
    if(window.gsap&&matchMedia('(pointer:fine)').matches){const cursor=$('.cursor'),label=$('.cursor span');if(cursor&&label){document.addEventListener('mousemove',e=>gsap.to(cursor,{x:e.clientX,y:e.clientY,duration:.18,ease:'power2.out'}));$$('.orbit-shell,.explore,.wide-image,.studio-open').forEach(el=>{el.addEventListener('mouseenter',()=>{label.textContent=el.classList.contains('orbit-shell')?'DRAG':el.classList.contains('studio-open')?'EDIT':'VIEW';gsap.to(cursor,{scale:1,duration:.2});});el.addEventListener('mouseleave',()=>gsap.to(cursor,{scale:0,duration:.2}));});}}
    build();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));else setTimeout(install,500);
})();
/* CLASS 08 · PROJECT 01 — load the Depth Carousel preset additively.
   index.html stays untouched: the guard is the guaranteed entrypoint. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-depth-carousel-runtime]'))return;
    const s=document.createElement('script');
    s.src='class8-depth-carousel.js';s.dataset.depthCarouselRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,60));
  else setTimeout(load,60);
})();

/* CLASS 09 · PROJECT 02 — load the Anchor Scenes preset additively.
   Same pattern as Project 01: index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-anchor-scenes-runtime]'))return;
    const s=document.createElement('script');
    s.src='class9-anchor-scenes.js';s.dataset.anchorScenesRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,80));
  else setTimeout(load,80);
})();

/* CLASS 10 · PROJECT 03 — load the Orbital Food Slider preset additively.
   Same pattern as Projects 01 and 02: index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-orbital-food-runtime]'))return;
    const s=document.createElement('script');
    s.src='class10-orbital-food.js';s.dataset.orbitalFoodRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,100));
  else setTimeout(load,100);
})();

/* CLASS 11 · PROJECT 07 — load the Pizza Slice Orbit preset additively.
   Same pattern as Projects 01, 02 and 03: index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-pizza-slice-runtime]'))return;
    const s=document.createElement('script');
    s.src='class11-pizza-slice-orbit.js';s.dataset.pizzaSliceRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,120));
  else setTimeout(load,120);
})();

/* CLASS 12 · PROJECT 07 PREMIUM — load the product-discovery layer additively.
   It presents; class11 keeps the approved motion engine. index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-pizza-premium-runtime]'))return;
    const s=document.createElement('script');
    s.src='class12-pizza-premium.js';s.dataset.pizzaPremiumRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,140));
  else setTimeout(load,140);
})();

/* CLASS 14 · PROJECT 09 — load the Scroll Traveler additively.
   A page-level capability, transversal to every product preset: it coexists with
   whichever choreography is selected. index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-scroll-traveler-runtime]'))return;
    const s=document.createElement('script');
    s.src='class14-scroll-traveler.js';s.dataset.scrollTravelerRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,160));
  else setTimeout(load,160);
})();

/* CLASS 19 — load the Motion Library additively.
   Studio chrome, not an engine: it indexes the eleven motion engines and the modules
   so they can be seen and chosen in one place. It loads last, because it reads what
   every other runtime has registered. index.html stays untouched. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-motion-library-runtime]'))return;
    const s=document.createElement('script');
    s.src='class19-motion-library.js';s.dataset.motionLibraryRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,220));
  else setTimeout(load,220);
})();

/* CLASS 21 — carga la ficha unificada de producto de forma aditiva.
   Es capacidad del Product Engine, no un motor: se carga después de los motores
   porque lee qué motor está en pantalla para elegir su adaptador. index.html no se
   toca. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-product-detail-runtime]'))return;
    const s=document.createElement('script');
    s.src='class21-unified-product-detail.js';s.dataset.productDetailRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,240));
  else setTimeout(load,240);
})();

/* CLASS 22 — carga la shell de experiencias de forma aditiva.
   Es superficie de producto, no un motor: abre las tres experiencias autónomas dentro
   de la misma aplicación en lugar de mandar al usuario a /labs/. index.html no se
   toca. */
(() => {
  'use strict';
  const load=()=>{
    if(document.querySelector('script[data-experience-shell-runtime]'))return;
    /* dentro de una experiencia enmarcada no se carga otra shell */
    if(window.parent!==window)return;
    const s=document.createElement('script');
    s.src='class22-experience-shell.js';s.dataset.experienceShellRuntime='1';
    document.body.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,200));
  else setTimeout(load,200);
})();

/* CLASS 23 — MEMORIES. Capacidad completa del producto, cargada de forma aditiva.
   `index.html` no se toca, como en Class 21 y Class 22.

   El orden importa y es el único motivo de que sean cuatro ficheros:

     restaurant-media.js         → la Media Library COMPARTIDA (resolución, no almacén)
     restaurant-media-picker.js  → el selector compartido (lo usará Beverages)
     class23-memories-model.js   → el dominio: esquema, normalización y siembra
     class23-memories-engine.js  → el motor y sus tres presentaciones
     class23-memories-studio.js  → el panel, dentro del Studio de siempre

   Dentro de una experiencia enmarcada no se carga: ahí el producto es la shell padre. */
(() => {
  'use strict';
  const CHAIN=['restaurant-media.js','restaurant-media-picker.js',
    'class23-memories-model.js','class23-memories-engine.js','class23-memories-studio.js'];
  const load=(i=0)=>{
    if(i>=CHAIN.length)return;
    const s=document.createElement('script');
    s.src=CHAIN[i];
    if(i===0)s.dataset.memoriesRuntime='1';
    /* en cadena a propósito: el modelo necesita la Media Library, y el motor y el panel
       necesitan el modelo. Nada de carreras de arranque. */
    s.onload=()=>load(i+1);
    document.body.appendChild(s);
  };
  const start=()=>{
    if(document.querySelector('script[data-memories-runtime]'))return;
    if(window.parent!==window)return;
    load();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,260));
  else setTimeout(start,260);
})();
