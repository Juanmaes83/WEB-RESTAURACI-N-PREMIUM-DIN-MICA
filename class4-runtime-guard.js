/* CLASS 04 — regression guard: the public experience must survive Studio/storage failures. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(base,over)=>{if(Array.isArray(base))return Array.isArray(over)?over:base;if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out;}return over===undefined?base:over;};

  async function install(){
    const nextBtn=$('#next-dish'),prevBtn=$('#prev-dish'),shell=$('.orbit-shell');
    if(!nextBtn||!prevBtn||!shell)return;
    /* app-v4 successfully owns the experience: do nothing. */
    if(typeof nextBtn.onclick==='function'&&typeof prevBtn.onclick==='function'){document.documentElement.dataset.orbitRuntime='primary';return;}

    console.warn('Class 04 primary interaction boot incomplete — restoring Class 03 orbital fallback.');
    document.documentElement.dataset.orbitRuntime='fallback';
    let cfg=clone(window.RestaurantDefaults||{dishes:[]});
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config)cfg=merge(cfg,saved.config);}catch{}
    const dishes=()=>cfg.dishes.filter(d=>d.enabled!==false);
    let progress=0,active=0,tween=null,drag=false,startX=0,startP=0,lastX=0,velocity=0;

    function build(){
      const stage=$('#orbit-stage');if(!stage||!dishes().length)return;
      stage.innerHTML='';
      dishes().forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.className='orbit-dish';b.dataset.guardIndex=i;b.innerHTML=`<img src="${d.image||''}" alt="${String(d.name||'Dish').replace(/"/g,'&quot;')}">`;b.onclick=()=>i===active?openDetail():go(i);stage.appendChild(b)});
      render();copy(true);
    }
    function dist(i){const n=dishes().length;let d=i-progress;if(d>n/2)d-=n;if(d<-n/2)d+=n;return d;}
    function render(){
      const n=dishes().length;if(!n)return;const mobile=innerWidth<620,rx=(mobile?.47:.40)*shell.clientWidth,ry=(mobile?.25:.27)*shell.clientHeight;
      $$('.orbit-dish').forEach((el,i)=>{const d=dist(i),a=d*Math.PI*2/n,front=(Math.cos(a)+1)/2,x=Math.sin(a)*rx,y=-(1-front)*ry*.85+Math.abs(Math.sin(a))*ry*.20,scale=.42+Math.pow(front,1.4)*(mobile?.76:.72),opacity=.22+front*.78,blur=(1-front)*4,brightness=.54+front*.50,rot=Math.sin(a)*5,z=Math.round(front*100);if(window.gsap)gsap.set(el,{xPercent:-50,yPercent:-50,x,y,scale,rotation:rot,opacity,filter:`blur(${blur}px) brightness(${brightness})`,zIndex:z});else{el.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale}) rotate(${rot}deg)`;el.style.opacity=opacity;el.style.filter=`blur(${blur}px) brightness(${brightness})`;el.style.zIndex=z;}});
    }
    function nearest(){const n=dishes().length;return n?((Math.round(progress)%n)+n)%n:0;}
    function sync(){const n=nearest();if(n!==active){active=n;copy();}}
    function animate(target,duration=.7){tween?.kill?.();if(window.gsap){const s={v:progress};tween=gsap.to(s,{v:target,duration,ease:'power3.inOut',onUpdate(){progress=s.v;render();sync()},onComplete(){progress=Math.round(target);render();sync()}});}else{progress=Math.round(target);render();sync();}}
    function go(index){const n=dishes().length;let d=index-progress;while(d>n/2)d-=n;while(d<-n/2)d+=n;animate(progress+d);}
    function copy(immediate=false){const d=dishes()[active];if(!d)return;const els=[$('#dish-meta'),$('#dish-title'),$('#dish-short')].filter(Boolean);const set=()=>{if($('#dish-meta'))$('#dish-meta').textContent=d.meta||'';if($('#dish-title'))$('#dish-title').textContent=d.name||'';if($('#dish-short'))$('#dish-short').textContent=d.short||'';if($('#dish-counter'))$('#dish-counter').textContent=`${String(active+1).padStart(2,'0')} / ${String(dishes().length).padStart(2,'0')}`;if(window.gsap)gsap.to(els,{opacity:1,y:0,duration:immediate?0:.28,stagger:.035});};if(!immediate&&window.gsap)gsap.to(els,{opacity:0,y:7,duration:.14,onComplete:set});else set();}
    function openDetail(){const d=dishes()[active],detail=$('#dish-detail');if(!d||!detail)return;const pairs={meta:'detail-meta',name:'detail-title',price:'detail-price',short:'detail-description',ingredients:'detail-ingredients',origin:'detail-origin',technique:'detail-technique',pairing:'detail-pairing'};Object.entries(pairs).forEach(([k,id])=>{const el=$('#'+id);if(el)el.textContent=d[k]||'';});if($('#detail-note'))$('#detail-note').textContent=`“${d.note||''}”`;if($('#detail-allergens'))$('#detail-allergens').textContent=`Allergens · ${d.allergens||''}`;detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');document.body.classList.add('detail-open');}
    function closeDetail(){const detail=$('#dish-detail');detail?.classList.remove('is-open');detail?.setAttribute('aria-hidden','true');document.body.classList.remove('detail-open');}

    nextBtn.onclick=()=>animate(Math.round(progress)+1);prevBtn.onclick=()=>animate(Math.round(progress)-1);if($('#explore-dish'))$('#explore-dish').onclick=openDetail;if($('#detail-close'))$('#detail-close').onclick=closeDetail;
    shell.addEventListener('keydown',e=>{if(e.key==='ArrowRight')nextBtn.click();if(e.key==='ArrowLeft')prevBtn.click();if(e.key==='Enter')openDetail();});
    shell.addEventListener('wheel',e=>{e.preventDefault();e.deltaY>0?nextBtn.click():prevBtn.click();},{passive:false});
    shell.addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;lastX=e.clientX;startP=progress;velocity=0;shell.setPointerCapture?.(e.pointerId);tween?.kill?.();});
    shell.addEventListener('pointermove',e=>{if(!drag)return;velocity=e.clientX-lastX;lastX=e.clientX;progress=startP-(e.clientX-startX)/(innerWidth<620?170:240);render();sync();});
    const end=()=>{if(!drag)return;drag=false;animate(Math.round(progress-velocity*.018),.55);};shell.addEventListener('pointerup',end);shell.addEventListener('pointercancel',end);addEventListener('resize',render);
    build();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));else setTimeout(install,500);
})();