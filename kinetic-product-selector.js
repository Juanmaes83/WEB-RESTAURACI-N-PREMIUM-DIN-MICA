/* PROJECT 12 — KINETIC PRODUCT SELECTOR
   Reusable full-screen product storytelling engine.
   One active product is the single source of truth for image, copy, palette, motion and selector state. */
(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const DEFAULTS={
    brand:{logoText:'STACK°',nav:['BURGERS','OUR STORY','ORDER'],bagLabel:'BAG · 00'},
    cta:{label:'TASTE THE CHAOS →'},
    autoplay:{enabled:true,delay:3000,interval:2450},
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
  const products=(config.products||[]).slice(0,8).filter(p=>p&&p.image&&p.name);
  if(!products.length) return;

  let active=0;
  let autoplayTimer=0;
  let autoplayStartTimer=0;
  let lastInteraction=0;
  let touchX=null;

  const stage=$('#kps-stage');
  const hero=$('#kps-hero');
  const rail=$('#kps-rail');
  const code=$('#kps-code');
  const title=$('#kps-title');
  const tagline=$('#kps-tagline');
  const live=$('#kps-live');
  const cta=$('#kps-cta');
  const demo=$('#kps-demo');
  const progress=$('#kps-progress');
  const fx=$('#kps-fx');
  const brand=$('#kps-brand');
  const nav=$('#kps-nav');
  const bag=$('#kps-bag');

  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImage=v=>String(v||'').trim();

  function initChrome(){
    if(brand)brand.textContent=config.brand?.logoText||'STACK°';
    if(nav)nav.innerHTML=(config.brand?.nav||[]).slice(0,4).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
    if(bag)bag.textContent=config.brand?.bagLabel||'BAG · 00';
    if(cta)cta.querySelector('span').textContent=config.cta?.label||'TASTE THE CHAOS →';
  }

  function preload(){
    products.forEach((p,i)=>{const img=new Image();img.decoding='async';if(i<2)img.fetchPriority='high';img.src=safeImage(p.image)});
  }

  function buildRail(){
    rail.innerHTML=products.map((p,i)=>`
      <button class="kps-thumb" type="button" data-index="${i}" aria-label="${escapeHtml(p.code)} · ${escapeHtml(p.name)}" aria-pressed="${i===0}">
        <span class="kps-thumb-img"><img src="${escapeHtml(safeImage(p.image))}" alt="" draggable="false"></span>
        <span class="kps-thumb-code">${escapeHtml(p.code||String(i+1).padStart(2,'0'))}</span>
      </button>`).join('');
    rail.addEventListener('click',e=>{
      const b=e.target.closest('.kps-thumb');if(!b)return;
      stopAutoplay(true);select(+b.dataset.index,{reason:'click'});
    });
  }

  function splitTitle(text){
    const words=String(text||'').trim().split(/\s+/);
    if(words.length<=1)return [words[0]||''];
    if(words.length===2)return words;
    const cut=Math.ceil(words.length/2);return [words.slice(0,cut).join(' '),words.slice(cut).join(' ')];
  }

  function setTheme(p){
    root.style.setProperty('--kps-primary',p.primary||'#111');
    root.style.setProperty('--kps-secondary',p.secondary||'#fff');
    root.style.setProperty('--kps-ink',p.ink||'#111');
    root.style.setProperty('--kps-paper',p.paper||'#ece9df');
    root.dataset.kpsFx=p.fx||'none';
    root.dataset.kpsMotion=p.motion||'heavy-drop';
    root.dataset.kpsProduct=p.id||'';
  }

  function titleAnimation(){
    const lines=$$('.kps-title-line',title);
    if(reduced.matches){lines.forEach(l=>{l.style.opacity='1';l.style.transform='none'});return}
    lines.forEach((line,i)=>line.animate([
      {transform:'translateY(115%) skewY(4deg)',opacity:0},
      {transform:'translateY(-7%) skewY(-1deg)',opacity:1,offset:.72},
      {transform:'translateY(0) skewY(0)',opacity:1}
    ],{duration:560+i*55,delay:90+i*55,easing:'cubic-bezier(.18,.82,.22,1)',fill:'both'}));
    tagline?.animate([{transform:'translateY(12px)',opacity:0},{transform:'translateY(0)',opacity:1}],
      {duration:420,delay:260,easing:'cubic-bezier(.22,.8,.22,1)',fill:'both'});
    code?.animate([{transform:'translateY(8px)',opacity:0},{transform:'translateY(0)',opacity:1}],
      {duration:320,delay:80,easing:'ease-out',fill:'both'});
  }

  const MOTIONS={
    'heavy-drop':[
      {transform:'translate3d(10%,-46%,0) scale(.68) rotate(8deg)',opacity:0,filter:'blur(10px)'},
      {transform:'translate3d(-2%,4%,0) scale(1.045) rotate(-1deg)',opacity:1,filter:'blur(0)',offset:.75},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',opacity:1,filter:'blur(0)'}],
    'elastic-stack':[
      {transform:'translate3d(-48%,8%,0) scale(.72) rotate(-10deg)',opacity:0},
      {transform:'translate3d(7%,-2%,0) scale(1.06) rotate(2deg)',opacity:1,offset:.72},
      {transform:'translate3d(0,0,0) scale(1)',opacity:1}],
    'orbital-drop':[
      {transform:'translate3d(34%,-38%,0) scale(.64) rotate(24deg)',opacity:0},
      {transform:'translate3d(-3%,5%,0) scale(1.05) rotate(-3deg)',opacity:1,offset:.72},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',opacity:1}],
    'diagonal-bloom':[
      {transform:'translate3d(-36%,40%,0) scale(.62) rotate(-11deg)',opacity:0},
      {transform:'translate3d(4%,-3%,0) scale(1.075) rotate(2deg)',opacity:1,offset:.72},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',opacity:1}],
    'liquid-sweep':[
      {transform:'translate3d(46%,0,0) scale(.72) rotate(11deg)',opacity:0,clipPath:'inset(0 0 0 65% round 40%)'},
      {transform:'translate3d(-3%,0,0) scale(1.045) rotate(-2deg)',opacity:1,clipPath:'inset(0 0 0 0 round 0)',offset:.76},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',opacity:1,clipPath:'inset(0 0 0 0 round 0)'}],
    'molten-rise':[
      {transform:'translate3d(0,52%,0) scale(.78)',opacity:0,filter:'blur(8px)'},
      {transform:'translate3d(0,-4%,0) scale(1.065)',opacity:1,filter:'blur(0)',offset:.76},
      {transform:'translate3d(0,0,0) scale(1)',opacity:1,filter:'blur(0)'}]
  };

  function heroAnimation(p){
    if(!hero)return;
    hero.getAnimations().forEach(a=>a.cancel());
    if(reduced.matches)return;
    hero.animate(MOTIONS[p.motion]||MOTIONS['heavy-drop'],
      {duration:630,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});
    $('#kps-product-shadow')?.animate([{transform:'translateX(-50%) scale(.72)',opacity:.08},{transform:'translateX(-50%) scale(1.05)',opacity:.23,offset:.72},{transform:'translateX(-50%) scale(1)',opacity:.18}],
      {duration:630,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});
  }

  function backgroundAnimation(){
    if(reduced.matches)return;
    $$('.kps-shape').forEach((el,i)=>el.animate([
      {transform:`translate3d(${i%2?-18:18}px,${i%2?14:-14}px,0) scale(.94) rotate(${i%2?-3:3}deg)`,opacity:.54},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',opacity:1}
    ],{duration:720+i*80,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
  }

  function makeFx(p){
    if(!fx)return;fx.innerHTML='';
    const count=reduced.matches?0:7;
    for(let i=0;i<count;i++){
      const el=document.createElement('i');el.className='kps-particle';
      el.style.setProperty('--i',i);el.style.setProperty('--r',`${(i*47)%120-60}deg`);
      el.style.left=`${47+((i*17)%36)}%`;el.style.top=`${22+((i*23)%56)}%`;
      fx.appendChild(el);
      el.animate([
        {transform:'translate3d(0,0,0) scale(.2) rotate(0)',opacity:0},
        {opacity:.8,offset:.2},
        {transform:`translate3d(${(i%2?1:-1)*(28+i*8)}px,${-34+(i%3)*32}px,0) scale(1) rotate(${120+i*35}deg)`,opacity:0}
      ],{duration:900+i*55,delay:180+i*35,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
    }
  }

  function select(index,{reason='api',announce=true}={}){
    if(!products.length)return false;
    index=(index%products.length+products.length)%products.length;
    active=index;const p=products[active];
    setTheme(p);

    /* Single hero node: source changes in the same interaction transaction. There is
       never an old and a new hero visible at once. The same `p.image` is also used by
       the selected thumbnail — identity is structural, not approximate. */
    hero.src=safeImage(p.image);hero.alt=p.name;
    code.textContent=p.code||String(active+1).padStart(2,'0');
    title.innerHTML=splitTitle(p.name).map(line=>`<span class="kps-title-mask"><span class="kps-title-line">${escapeHtml(line)}</span></span>`).join('');
    tagline.textContent=p.tagline||'';
    progress.textContent=`${String(active+1).padStart(2,'0')} / ${String(products.length).padStart(2,'0')}`;
    $$('.kps-thumb',rail).forEach((b,i)=>{const on=i===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
    stage?.classList.toggle('is-final',active===products.length-1);
    if(cta){cta.tabIndex=active===products.length-1?0:-1;cta.setAttribute('aria-hidden',String(active!==products.length-1));}
    titleAnimation();heroAnimation(p);backgroundAnimation();makeFx(p);
    if(announce&&live)live.textContent=`${p.code}. ${p.name}. ${p.tagline}`;
    root.dataset.kpsIndex=String(active);
    root.dataset.kpsReason=reason;
    document.dispatchEvent(new CustomEvent('kinetic:product-change',{detail:{index:active,id:p.id,reason}}));
    return true;
  }

  function next(reason='next'){return select(active+1,{reason})}
  function prev(reason='prev'){return select(active-1,{reason})}

  function stopAutoplay(user=false){
    clearTimeout(autoplayStartTimer);clearInterval(autoplayTimer);autoplayStartTimer=0;autoplayTimer=0;
    root.dataset.kpsAutoplay='off';if(demo){demo.setAttribute('aria-pressed','false');demo.querySelector('span').textContent='AUTO';}
    if(user)lastInteraction=Date.now();
  }
  function startAutoplay({restart=false}={}){
    stopAutoplay(false);if(reduced.matches)return false;
    if(restart)select(0,{reason:'autoplay-reset',announce:false});
    root.dataset.kpsAutoplay='on';if(demo){demo.setAttribute('aria-pressed','true');demo.querySelector('span').textContent='PAUSE';}
    autoplayTimer=setInterval(()=>{
      if(Date.now()-lastInteraction<1800)return;
      select((active+1)%products.length,{reason:'autoplay',announce:false});
    },Math.max(1600,+config.autoplay?.interval||2450));
    return true;
  }

  function wire(){
    demo?.addEventListener('click',()=>root.dataset.kpsAutoplay==='on'?stopAutoplay(true):startAutoplay());
    cta?.addEventListener('pointermove',e=>{
      if(reduced.matches)return;const r=cta.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*.08,y=(e.clientY-r.top-r.height/2)*.12;
      cta.style.transform=`translate(${x}px,${y}px)`;
    });
    cta?.addEventListener('pointerleave',()=>cta.style.transform='');
    cta?.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('kinetic:cta',{detail:{product:products[active]}})));

    stage?.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'){e.preventDefault();stopAutoplay(true);next('keyboard')}
      if(e.key==='ArrowLeft'){e.preventDefault();stopAutoplay(true);prev('keyboard')}
      if(e.key==='Home'){e.preventDefault();stopAutoplay(true);select(0,{reason:'keyboard'})}
      if(e.key==='End'){e.preventDefault();stopAutoplay(true);select(products.length-1,{reason:'keyboard'})}
    });
    stage?.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchX=e.clientX});
    stage?.addEventListener('pointerup',e=>{
      if(touchX===null||e.pointerType!=='touch')return;const dx=e.clientX-touchX;touchX=null;
      if(Math.abs(dx)<42)return;stopAutoplay(true);dx<0?next('swipe'):prev('swipe');
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAutoplay(false)});
  }

  initChrome();preload();buildRail();wire();select(0,{reason:'init',announce:false});
  root.dataset.kpsReady='1';
  if(config.autoplay?.enabled&&!reduced.matches){autoplayStartTimer=setTimeout(()=>startAutoplay(),Math.max(0,+config.autoplay.delay||3000));}

  window.KineticProductSelector=Object.freeze({
    select,next,prev,startAutoplay,stopAutoplay,
    products:()=>products.map(p=>({...p})),
    state:()=>({ready:true,index:active,id:products[active]?.id||'',count:products.length,
      autoplay:root.dataset.kpsAutoplay==='on',hero:hero?.getAttribute('src')||'',
      activeThumb:$('.kps-thumb.is-active img',rail)?.getAttribute('src')||'',reduced:reduced.matches})
  });
})();