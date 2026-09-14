/* PROJECT 12 — KINETIC PRODUCT SELECTOR
   Product-grade interaction contract: six exact products, one active source of truth,
   fully decoded assets, click/arrow/keyboard/drag/swipe navigation and finite autoplay. */
(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const DEFAULTS={
    brand:{logoText:'STACK°',nav:['BURGERS','OUR STORY','ORDER'],bagLabel:'BAG · 00'},
    cta:{label:'TASTE THE CHAOS →',href:''},
    autoplay:{enabled:true,delay:3000,interval:2000},
    products:[
      {id:'midnight-wagyu',code:'01',name:'MIDNIGHT WAGYU',tagline:'DARK. BOLD. UNEXPECTED.',
        image:'../../assets/kinetic-product-selector/01-midnight-wagyu.webp',primary:'#C8A24A',secondary:'#E4DCCB',
        ink:'#12100d',paper:'#d8dad5',motion:'heavy-drop',fx:'sesame'},
      {id:'ramen-riot',code:'02',name:'RAMEN RIOT',tagline:'SLURP. STACK. REPEAT.',
        image:'../../assets/kinetic-product-selector/02-ramen-riot.webp',primary:'#F5A623',secondary:'#6B3F1D',
        ink:'#261506',paper:'#efe1b8',motion:'elastic-stack',fx:'noodle'},
      {id:'glazed-outlaw',code:'03',name:'GLAZED OUTLAW',tagline:'CRISPY. SWEET. ILLEGAL.',
        image:'../../assets/kinetic-product-selector/03-glazed-outlaw.webp',primary:'#A85C1E',secondary:'#E8B84B',
        ink:'#2a1206',paper:'#f2dfb8',motion:'orbital-drop',fx:'syrup'},
      {id:'beet-royale',code:'04',name:'BEET ROYALE',tagline:'PINK. GRILLED. FEARLESS.',
        image:'../../assets/kinetic-product-selector/04-beet-royale.webp',primary:'#C21E67',secondary:'#7B4BC4',
        ink:'#33091f',paper:'#e9c9d8',motion:'diagonal-bloom',fx:'petal'},
      {id:'tidal-gold',code:'05',name:'TIDAL GOLD',tagline:'CRISPY. OCEANIC. GOLDEN.',
        image:'../../assets/kinetic-product-selector/05-tidal-gold.webp',primary:'#0E7C86',secondary:'#F2B01E',
        ink:'#07343a',paper:'#a8ddd8',motion:'liquid-sweep',fx:'mango'},
      {id:'lava-brisket',code:'06',name:'LAVA BRISKET',tagline:'SMOKED. MOLTEN. MERCILESS.',
        image:'../../assets/kinetic-product-selector/06-lava-brisket.webp',primary:'#E8801A',secondary:'#4C6B2F',
        ink:'#2c170b',paper:'#e6c6a3',motion:'molten-rise',fx:'cheese'}
    ]
  };

  const deepMerge=(base,over)=>{
    if(Array.isArray(base)) return Array.isArray(over)&&over.length ? over.map((v,i)=>deepMerge(base[i]||{},v)) : base.map(v=>deepMerge(v,{}));
    if(base&&typeof base==='object'){
      const out={...base};
      Object.keys(over||{}).forEach(k=>out[k]=k in base?deepMerge(base[k],over[k]):over[k]);
      return out;
    }
    return over===undefined||over===null||over===''?base:over;
  };

  const fromSource=window.RestaurantKineticSource?.config?.(structuredClone(DEFAULTS))||DEFAULTS;
  const config=deepMerge(DEFAULTS,fromSource);
  const products=(config.products||[]).slice(0,6).filter(p=>p&&p.image&&p.name);
  if(products.length!==6){root.dataset.kpsFatal='product-count';return;}

  let active=0, autoplayTimer=0, autoplayStartTimer=0, lastInteraction=0;
  let pointer=null, toastTimer=0, assetsReady=false;

  const stage=$('#kps-stage'),hero=$('#kps-hero'),rail=$('#kps-rail'),code=$('#kps-code');
  const title=$('#kps-title'),tagline=$('#kps-tagline'),live=$('#kps-live'),cta=$('#kps-cta');
  const demo=$('#kps-demo'),progress=$('#kps-progress'),fx=$('#kps-fx'),brand=$('#kps-brand');
  const nav=$('#kps-nav'),bag=$('#kps-bag'),prevBtn=$('#kps-prev'),nextBtn=$('#kps-next');
  const storyPanel=$('#kps-story-panel'),bagPanel=$('#kps-bag-panel'),toast=$('#kps-toast');

  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImage=v=>String(v||'').trim();

  function showToast(message){
    if(!toast)return;clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('is-visible');
    toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2200);
  }
  function closePanels(){
    [storyPanel,bagPanel].forEach(p=>{p?.classList.remove('is-open');p?.setAttribute('aria-hidden','true')});
    bag?.setAttribute('aria-expanded','false');
  }
  function togglePanel(panel){
    const open=!panel?.classList.contains('is-open');closePanels();
    if(open&&panel){panel.classList.add('is-open');panel.setAttribute('aria-hidden','false')}
    if(panel===bagPanel)bag?.setAttribute('aria-expanded',String(open));
  }

  function initChrome(){
    if(brand)brand.textContent=config.brand?.logoText||'STACK°';
    const labels=(config.brand?.nav||[]).slice(0,3);
    if(nav)nav.innerHTML=labels.map((x,i)=>`<button type="button" data-kps-nav="${['burgers','story','order'][i]||'burgers'}">${escapeHtml(typeof x==='string'?x:(x?.label||''))}</button>`).join('');
    if(bag)bag.textContent=config.brand?.bagLabel||'BAG · 00';
    if(cta)cta.querySelector('span').textContent=config.cta?.label||'TASTE THE CHAOS →';
  }

  async function preload(){
    const jobs=products.map(p=>new Promise((resolve,reject)=>{
      const img=new Image();img.decoding='async';img.onload=async()=>{try{await img.decode?.()}catch{}resolve(img)};img.onerror=()=>reject(new Error(`Asset failed: ${p.image}`));img.src=safeImage(p.image);
    }));
    await Promise.all(jobs);assetsReady=true;root.dataset.kpsAssets='ready';
  }

  function buildRail(){
    rail.innerHTML=products.map((p,i)=>`
      <button class="kps-thumb" type="button" data-index="${i}" aria-label="${escapeHtml(p.code)} · ${escapeHtml(p.name)}" aria-pressed="${i===0}">
        <span class="kps-thumb-img"><img src="${escapeHtml(safeImage(p.image))}" alt="" draggable="false" decoding="async"></span>
        <span class="kps-thumb-code">${escapeHtml(p.code||String(i+1).padStart(2,'0'))}</span>
      </button>`).join('');
    rail.addEventListener('click',e=>{
      const b=e.target.closest('.kps-thumb');if(!b)return;
      stopAutoplay(true);select(+b.dataset.index,{reason:'click'});
    });
  }

  function splitTitle(text){
    const words=String(text||'').trim().split(/\s+/);if(words.length<=1)return [words[0]||''];if(words.length===2)return words;
    const cut=Math.ceil(words.length/2);return [words.slice(0,cut).join(' '),words.slice(cut).join(' ')];
  }
  function setTheme(p){
    root.style.setProperty('--kps-primary',p.primary||'#111');root.style.setProperty('--kps-secondary',p.secondary||'#fff');
    root.style.setProperty('--kps-ink',p.ink||'#111');root.style.setProperty('--kps-paper',p.paper||'#ece9df');
    root.dataset.kpsFx=p.fx||'none';root.dataset.kpsMotion=p.motion||'heavy-drop';root.dataset.kpsProduct=p.id||'';
  }

  function titleAnimation(){
    const lines=$$('.kps-title-line',title);if(reduced.matches)return;
    lines.forEach((line,i)=>line.animate([
      {transform:'translateY(110%) skewY(4deg)'},{transform:'translateY(-6%) skewY(-1deg)',offset:.72},{transform:'translateY(0) skewY(0)'}
    ],{duration:430+i*35,delay:40+i*35,easing:'cubic-bezier(.18,.82,.22,1)',fill:'both'}));
    tagline?.animate([{transform:'translateY(10px)'},{transform:'translateY(0)'}],{duration:340,delay:150,easing:'cubic-bezier(.22,.8,.22,1)'});
  }

  const MOTIONS={
    'heavy-drop':[{transform:'translate3d(10%,-42%,0) scale(.74) rotate(8deg)'},{transform:'translate3d(-2%,3%,0) scale(1.035) rotate(-1deg)',offset:.76},{transform:'translate3d(0,0,0) scale(1) rotate(0)'}],
    'elastic-stack':[{transform:'translate3d(-42%,8%,0) scale(.76) rotate(-9deg)'},{transform:'translate3d(6%,-2%,0) scale(1.045) rotate(2deg)',offset:.72},{transform:'translate3d(0,0,0) scale(1)'}],
    'orbital-drop':[{transform:'translate3d(30%,-34%,0) scale(.72) rotate(22deg)'},{transform:'translate3d(-3%,4%,0) scale(1.04) rotate(-3deg)',offset:.72},{transform:'translate3d(0,0,0) scale(1) rotate(0)'}],
    'diagonal-bloom':[{transform:'translate3d(-31%,34%,0) scale(.72) rotate(-10deg)'},{transform:'translate3d(4%,-3%,0) scale(1.05) rotate(2deg)',offset:.72},{transform:'translate3d(0,0,0) scale(1) rotate(0)'}],
    'liquid-sweep':[{transform:'translate3d(40%,0,0) scale(.76) rotate(10deg)',clipPath:'inset(0 0 0 55% round 40%)'},{transform:'translate3d(-3%,0,0) scale(1.035) rotate(-2deg)',clipPath:'inset(0 0 0 0 round 0)',offset:.75},{transform:'translate3d(0,0,0) scale(1) rotate(0)',clipPath:'inset(0 0 0 0 round 0)'}],
    'molten-rise':[{transform:'translate3d(0,44%,0) scale(.78)'},{transform:'translate3d(0,-4%,0) scale(1.05)',offset:.76},{transform:'translate3d(0,0,0) scale(1)'}]
  };
  function heroAnimation(p){
    if(!hero||reduced.matches)return;hero.getAnimations().forEach(a=>a.cancel());
    hero.animate(MOTIONS[p.motion]||MOTIONS['heavy-drop'],{duration:410,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});
    $('#kps-product-shadow')?.animate([{transform:'translateX(-50%) scale(.8)',opacity:.11},{transform:'translateX(-50%) scale(1.05)',opacity:.22,offset:.72},{transform:'translateX(-50%) scale(1)',opacity:.18}],{duration:410,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});
  }
  function backgroundAnimation(){
    if(reduced.matches)return;$$('.kps-shape').forEach((el,i)=>el.animate([{transform:`translate3d(${i%2?-12:12}px,${i%2?9:-9}px,0) scale(.96)`},{transform:'translate3d(0,0,0) scale(1)'}],{duration:560+i*60,easing:'cubic-bezier(.2,.8,.2,1)'}));
  }
  function makeFx(p){
    if(!fx)return;fx.innerHTML='';const count=reduced.matches?0:9;
    for(let i=0;i<count;i++){
      const el=document.createElement('i');el.className='kps-particle';el.style.setProperty('--i',i);el.style.setProperty('--r',`${(i*47)%120-60}deg`);el.style.left=`${46+((i*17)%37)}%`;el.style.top=`${20+((i*23)%57)}%`;fx.appendChild(el);
      el.animate([{transform:'translate3d(0,0,0) scale(.25)',opacity:0},{opacity:.85,offset:.18},{transform:`translate3d(${(i%2?1:-1)*(32+i*7)}px,${-38+(i%3)*34}px,0) scale(1) rotate(${120+i*35}deg)`,opacity:0}],{duration:760+i*45,delay:110+i*26,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
    }
  }

  function select(index,{reason='api',announce=true}={}){
    index=(index%products.length+products.length)%products.length;active=index;const p=products[active];setTheme(p);
    hero.src=safeImage(p.image);hero.alt=p.name;code.textContent=p.code||String(active+1).padStart(2,'0');
    title.innerHTML=splitTitle(p.name).map(line=>`<span class="kps-title-mask"><span class="kps-title-line">${escapeHtml(line)}</span></span>`).join('');
    tagline.textContent=p.tagline||'';progress.textContent=`${String(active+1).padStart(2,'0')} / 06`;
    $$('.kps-thumb',rail).forEach((b,i)=>{const on=i===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));if(on)b.scrollIntoView?.({block:'nearest',inline:'nearest'})});
    stage?.classList.toggle('is-final',active===5);if(cta){cta.tabIndex=active===5?0:-1;cta.setAttribute('aria-hidden',String(active!==5));}
    titleAnimation();heroAnimation(p);backgroundAnimation();makeFx(p);
    if(announce&&live)live.textContent=`${p.code}. ${p.name}. ${p.tagline}`;root.dataset.kpsIndex=String(active);root.dataset.kpsReason=reason;
    document.dispatchEvent(new CustomEvent('kinetic:product-change',{detail:{index:active,id:p.id,reason}}));return true;
  }
  function next(reason='next'){return select(active+1,{reason})}
  function prev(reason='prev'){return select(active-1,{reason})}

  function stopAutoplay(user=false){
    clearTimeout(autoplayStartTimer);clearInterval(autoplayTimer);autoplayStartTimer=0;autoplayTimer=0;root.dataset.kpsAutoplay='off';
    if(demo){demo.setAttribute('aria-pressed','false');demo.querySelector('span').textContent='AUTO';demo.title='Play automatic choreography'}if(user)lastInteraction=Date.now();
  }
  function startAutoplay({restart=false}={}){
    stopAutoplay(false);if(reduced.matches||!assetsReady)return false;if(restart||active===5)select(0,{reason:'autoplay-reset',announce:false});
    root.dataset.kpsAutoplay='on';if(demo){demo.setAttribute('aria-pressed','true');demo.querySelector('span').textContent='PAUSE';demo.title='Pause automatic choreography'}
    autoplayTimer=setInterval(()=>{
      if(Date.now()-lastInteraction<1200)return;if(active>=5){stopAutoplay(false);return;}select(active+1,{reason:'autoplay',announce:false});if(active===5)stopAutoplay(false);
    },Math.max(1500,+config.autoplay?.interval||2000));return true;
  }

  function handleNav(action){
    stopAutoplay(true);if(action==='burgers'){closePanels();select(0,{reason:'nav'});rail?.querySelector('.kps-thumb')?.focus();return}
    if(action==='story'){togglePanel(storyPanel);return}
    if(action==='order'){closePanels();select(5,{reason:'nav-order'});setTimeout(()=>cta?.focus(),460);return}
  }

  function wire(){
    demo?.addEventListener('click',()=>root.dataset.kpsAutoplay==='on'?stopAutoplay(true):startAutoplay({restart:active===5}));
    prevBtn?.addEventListener('click',()=>{stopAutoplay(true);prev('button')});nextBtn?.addEventListener('click',()=>{stopAutoplay(true);next('button')});
    nav?.addEventListener('click',e=>{const b=e.target.closest('[data-kps-nav]');if(b)handleNav(b.dataset.kpsNav)});brand?.addEventListener('click',()=>handleNav('burgers'));
    bag?.addEventListener('click',()=>{stopAutoplay(true);togglePanel(bagPanel)});$$('[data-kps-close-panel]').forEach(b=>b.addEventListener('click',closePanels));

    cta?.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=cta.getBoundingClientRect();cta.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.07}px,${(e.clientY-r.top-r.height/2)*.09}px)`});
    cta?.addEventListener('pointerleave',()=>cta.style.transform='');
    cta?.addEventListener('click',()=>{
      document.dispatchEvent(new CustomEvent('kinetic:cta',{detail:{product:products[active]}}));const href=String(config.cta?.href||'').trim();
      if(href){location.href=href;return}showToast('ORDER FLOW READY · CONNECT CHECKOUT URL IN STUDIO');
    });

    document.addEventListener('keydown',e=>{
      if(e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
      if(e.key==='ArrowRight'){e.preventDefault();stopAutoplay(true);next('keyboard')}else if(e.key==='ArrowLeft'){e.preventDefault();stopAutoplay(true);prev('keyboard')}
      else if(e.key==='Home'){e.preventDefault();stopAutoplay(true);select(0,{reason:'keyboard'})}else if(e.key==='End'){e.preventDefault();stopAutoplay(true);select(5,{reason:'keyboard'})}
      else if(e.key==='Escape')closePanels();
    });

    stage?.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,a,input,textarea,select'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,type:e.pointerType};stage.setPointerCapture?.(e.pointerId);stage.classList.add('is-dragging');
    });
    stage?.addEventListener('pointerup',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;stage.classList.remove('is-dragging');
      if(Math.abs(dx)<44||Math.abs(dx)<Math.abs(dy)*1.15)return;stopAutoplay(true);dx<0?next('swipe'):prev('swipe');
    });
    stage?.addEventListener('pointercancel',()=>{pointer=null;stage.classList.remove('is-dragging')});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAutoplay(false)});
  }

  async function boot(){
    initChrome();buildRail();wire();root.dataset.kpsReady='loading';
    try{await preload()}catch(err){root.dataset.kpsAssets='error';console.error(err);return}
    select(0,{reason:'init',announce:false});root.dataset.kpsReady='1';
    if(config.autoplay?.enabled&&!reduced.matches)autoplayStartTimer=setTimeout(()=>startAutoplay(),Math.max(0,+config.autoplay.delay||3000));
  }

  window.KineticProductSelector=Object.freeze({
    select,next,prev,startAutoplay,stopAutoplay,
    products:()=>products.map(p=>({...p})),
    state:()=>({ready:root.dataset.kpsReady==='1',assetsReady,index:active,id:products[active]?.id||'',count:products.length,autoplay:root.dataset.kpsAutoplay==='on',hero:hero?.getAttribute('src')||'',activeThumb:$('.kps-thumb.is-active img',rail)?.getAttribute('src')||'',heroNaturalWidth:hero?.naturalWidth||0,heroNaturalHeight:hero?.naturalHeight||0,reduced:reduced.matches})
  });
  boot();
})();
