/* CLASS 24 — BEVERAGE EXPERIENCE ENGINE
   Starbucks source is treated as choreography reference only. This engine is native DOM + GSAP,
   reads one Restaurant Project State, resolves media through RestaurantMedia, and owns only
   ephemeral UI state (active index / transition). mount + refresh + destroy are explicit. */
(() => {
  'use strict';
  const B=()=>window.RestaurantBeveragesModel;
  const cfg=()=>window.RestaurantStudioConfig;
  const media=()=>window.RestaurantMedia;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const $=(s,r=document)=>r.querySelector(s);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  let host=null,active=0,timeline=null,fingerprint='',urls=new Map(),destroyers=[];
  const review=()=>window.RestaurantBeveragesReview?.active?window.RestaurantBeveragesReview.beverages:null;
  const config=()=>B().normalize(review()||cfg()?.get?.('beverages')||window.RestaurantDefaults?.beverages);
  const items=()=>B().visible(config());
  const cleanup=fn=>{if(typeof fn==='function')destroyers.push(fn)};
  function runCleanup(){while(destroyers.length){try{destroyers.pop()()}catch{}}}
  function mediaFor(item){return (item.media||[]).find(m=>m.kind==='image')||(item.media||[])[0]||null}
  async function resolve(){
    const list=items();
    for(const item of list){
      const m=mediaFor(item);if(!m?.ref)continue;
      const existing=window.RestaurantMediaResolve?.(m.ref);if(existing){urls.set(m.ref,existing);continue}
      const url=await media()?.url?.(m.ref);if(url)urls.set(m.ref,url);
    }
  }
  const urlOf=item=>{const m=mediaFor(item);return m?(window.RestaurantMediaResolve?.(m.ref)||urls.get(m.ref)||''):''};
  function ensureHost(){
    if(host?.isConnected)return host;
    host=el('section','bev-section');host.id='beverages';host.setAttribute('aria-labelledby','bev-title');
    const visit=$('#visit');const footer=$('body > footer');
    (visit||footer)?.parentNode?.insertBefore(host,visit||footer);
    return host;
  }
  function safeLink(url){try{const u=new URL(url,location.href);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
  function priceText(value){return value===null||value===undefined?'':String(value)}
  function build(){
    const c=config(),list=items();
    if(!c.enabled||!list.length){destroy();return false}
    ensureHost();active=Math.min(active,list.length-1);
    host.innerHTML=`<div class="bev-shell">
      <div class="bev-ambient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="bev-copy">
        <p class="bev-eyebrow"></p><h2 class="bev-title" id="bev-title"></h2><p class="bev-intro"></p>
        <div class="bev-product-copy" aria-live="polite"><span class="bev-index"></span><h3 class="bev-name"></h3><p class="bev-description"></p><p class="bev-pairing"></p><p class="bev-price"></p></div>
        <div class="bev-actions"><button class="bev-prev" type="button" aria-label="Bebida anterior">←</button><button class="bev-next" type="button" aria-label="Bebida siguiente">→</button><a class="bev-cta"></a></div>
      </div>
      <div class="bev-stage"><div class="bev-halo" aria-hidden="true"></div><div class="bev-media-wrap"><img class="bev-media" alt=""></div><span class="bev-word" aria-hidden="true"></span></div>
      <div class="bev-selector" role="list" aria-label="Seleccionar bebida"></div>
    </div>`;
    host.dataset.preset=c.preset;host.dataset.mounted='1';
    $('.bev-eyebrow',host).textContent=c.eyebrow||'';$('.bev-title',host).textContent=c.title||'';$('.bev-intro',host).textContent=c.intro||'';
    const cta=$('.bev-cta',host),href=safeLink(c.ctaUrl);
    cta.textContent=c.ctaLabel||'Explorar';cta.href=href||'#beverages';if(!href)cta.addEventListener('click',e=>e.preventDefault());
    const selector=$('.bev-selector',host);
    list.forEach((item,i)=>{
      const b=el('button','bev-option');b.type='button';b.dataset.index=String(i);b.setAttribute('role','listitem');b.setAttribute('aria-label',`Seleccionar ${item.name||'bebida'}`);
      const thumb=urlOf(item);if(thumb){const im=el('img');im.src=thumb;im.alt='';b.append(im)}
      b.append(el('span','',item.shortName||item.name||`Bebida ${i+1}`));b.addEventListener('click',()=>select(i));selector.append(b);
    });
    $('.bev-prev',host).addEventListener('click',()=>select((active-1+list.length)%list.length));
    $('.bev-next',host).addEventListener('click',()=>select((active+1)%list.length));
    const onKey=e=>{if(!host?.isConnected)return;if(e.key==='ArrowRight')select((active+1)%list.length);if(e.key==='ArrowLeft')select((active-1+list.length)%list.length)};
    host.addEventListener('keydown',onKey);cleanup(()=>host?.removeEventListener('keydown',onKey));
    paint(active,{intro:true});
    return true;
  }
  function applyTheme(item){const t=item.theme||B().DEFAULT_THEME;[['--bev-accent',t.accent],['--bev-accent-soft',t.accentSoft],['--bev-accent-deep',t.accentDeep],['--bev-button',t.button],['--bev-price',t.price],['--bev-ambient',t.ambient],['--bev-backdrop',t.backdrop],['--bev-glow',t.glow]].forEach(([k,v])=>host.style.setProperty(k,v||''))}
  function paint(index,{intro=false}={}){
    const c=config(),list=items(),item=list[index];if(!host||!item)return;
    active=index;applyTheme(item);
    const img=$('.bev-media',host),url=urlOf(item);if(url)img.src=url;else img.removeAttribute('src');img.alt=item.name||'';
    $('.bev-name',host).textContent=item.name||'';$('.bev-description',host).textContent=item.description||'';
    const pairing=$('.bev-pairing',host);pairing.textContent=c.showPairing&&item.pairing?`Maridaje · ${item.pairing}`:'';pairing.hidden=!pairing.textContent;
    const price=$('.bev-price',host);price.textContent=c.showPrice?priceText(item.price):'';price.hidden=!price.textContent;
    $('.bev-index',host).textContent=`${String(index+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
    $('.bev-word',host).textContent=(item.shortName||item.name||'').toUpperCase();
    host.querySelectorAll('.bev-option').forEach((b,i)=>{const on=i===index;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});
    if(c.ambientParticles===false)host.classList.add('no-particles');else host.classList.remove('no-particles');
    if(intro&&!reduced.matches&&window.gsap){
      const gs=window.gsap;gs.fromTo($('.bev-title',host),{y:42,opacity:0},{y:0,opacity:1,duration:.85,ease:'power4.out'});gs.fromTo(img,{y:70,scale:.88,rotation:-3,opacity:0,filter:'blur(16px)'},{y:0,scale:1,rotation:1.5,opacity:1,filter:'blur(0px)',duration:1.2,ease:'expo.out'});gs.fromTo(host.querySelectorAll('.bev-option'),{y:20,opacity:0},{y:0,opacity:1,stagger:.08,duration:.6,ease:'power3.out',delay:.25});
    }
  }
  function select(next){
    const list=items();if(!list.length||next===active||next<0||next>=list.length)return;
    const incoming=list[next],img=$('.bev-media',host),copy=$('.bev-product-copy',host),particles=[...host.querySelectorAll('.bev-ambient i')];
    timeline?.kill?.();window.gsap?.killTweensOf?.([img,copy,...particles]);
    if(reduced.matches||!window.gsap){paint(next);return}
    const gs=window.gsap;timeline=gs.timeline({defaults:{ease:'power3.inOut',overwrite:'auto'},onComplete:()=>{timeline=null}});
    timeline.to(img,{y:-22,scale:1.025,rotation:-.6,duration:.24,ease:'sine.out'},0)
      .to(particles,{x:(i)=>(i-2)*22,y:(i)=>i%2?24:-26,scale:1.08,opacity:.65,duration:.38,stagger:.02},.02)
      .to([img,copy],{opacity:0,y:24,filter:'blur(13px)',duration:.38,ease:'power3.in'},.22)
      .add(()=>paint(next),.58)
      .set(img,{opacity:0,y:72,scale:.86,rotation:-3,filter:'blur(16px)'},.59)
      .set(copy,{opacity:0,y:18,filter:'blur(8px)'},.59)
      .to(img,{opacity:1,y:-7,scale:1.018,rotation:1.8,filter:'blur(0px)',duration:.7,ease:'expo.out'},.62)
      .to(copy,{opacity:1,y:0,filter:'blur(0px)',duration:.58,ease:'power3.out'},.69)
      .to(particles,{x:0,y:0,scale:1,opacity:1,duration:.72,stagger:.035,ease:'expo.out'},.66)
      .to(img,{y:0,scale:1,rotation:0,duration:.35,ease:'sine.out'},1.12);
  }
  async function refresh(){
    B()?.seed?.();await resolve();const next=JSON.stringify(config());if(next===fingerprint&&host?.isConnected)return true;fingerprint=next;runCleanup();return build();
  }
  function destroy(){timeline?.kill?.();timeline=null;runCleanup();if(host){host.remove();host=null}fingerprint='';return true}
  function mount(){return refresh()}
  document.addEventListener('restaurant:config-applied',()=>refresh().catch(console.error));
  const start=()=>mount().catch(console.error);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else setTimeout(start,0);
  window.RestaurantBeveragesEngine=Object.freeze({mount,refresh,destroy,select,state:()=>({mounted:!!host?.isConnected,active,count:items().length,review:!!window.RestaurantBeveragesReview?.active})});
})();