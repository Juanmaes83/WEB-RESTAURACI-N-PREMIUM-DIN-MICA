/* PROJECT 12 — Product Detail adapter.
   The canonical host gets first refusal. Fallback opens only when no host explicitly confirms handling. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const root=document.documentElement,hero=$('#kps-hero'),stage=$('#kps-stage'),rail=$('#kps-rail');
  const detail=$('#kps-product-detail'),close=$('#kps-detail-close'),backdrop=$('#kps-detail-backdrop'),order=$('#kps-detail-order');
  let lastFocus=null,pointerStart=null,lastHeroOpen=0;
  const DEMO_DETAIL={
    'midnight-wagyu':{meta:'STACK° SIGNATURE · 01',short:'Dark bun, rich beef and a deliberately dramatic finish.',ingredients:'Wagyu-style beef, dark bun, cheese, signature garnish.',origin:'House signature',technique:'High-heat sear',pairing:'Smoked / bitter / bright',allergens:'Gluten · Dairy',note:'Built as the darkest, heaviest opening signature.'},
    'ramen-riot':{meta:'STACK° SIGNATURE · 02',short:'A noodle-bun build with pork, egg and stacked umami.',ingredients:'Ramen noodle bun, pork, egg, greens, sauce.',origin:'Tokyo-inspired',technique:'Pressed noodle bun',pairing:'Umami · sesame · citrus',allergens:'Egg · Gluten · Sesame',note:'Elastic, playful and intentionally unruly.'},
    'glazed-outlaw':{meta:'STACK° SIGNATURE · 03',short:'Sweet glazed bun, fried chicken and bacon with sticky contrast.',ingredients:'Glazed bun, fried chicken, bacon, glaze.',origin:'American diner remix',technique:'Crisp fry + glaze',pairing:'Sweet · salty · crisp',allergens:'Gluten · Dairy',note:'Dessert cues pushed into a savory fried-chicken build.'},
    'beet-royale':{meta:'STACK° SIGNATURE · 04',short:'Pink bun, grilled cheese and bright pickled accents.',ingredients:'Beet-style bun, grilled cheese, pickled onion, herbs.',origin:'Vegetarian signature',technique:'Plancha grill',pairing:'Tangy · floral · charred',allergens:'Gluten · Dairy',note:'Color is part of the product identity, not decoration.'},
    'tidal-gold':{meta:'STACK° SIGNATURE · 05',short:'Ocean-led filling, turquoise bun and tropical golden notes.',ingredients:'Turquoise bun, crab-style filling, mango, greens.',origin:'Coastal signature',technique:'Cold-prep + crisp finish',pairing:'Oceanic · tropical · fresh',allergens:'Gluten · Shellfish',note:'The lightest visual build in the sequence.'},
    'lava-brisket':{meta:'STACK° SIGNATURE · 06',short:'Dark pretzel bun, brisket, cheddar and jalapeño heat.',ingredients:'Pretzel bun, brisket, cheddar, jalapeño, sauce.',origin:'Smokehouse signature',technique:'Slow smoke + hot finish',pairing:'Smoky · molten · spicy',allergens:'Gluten · Dairy',note:'The final hero is designed to hold, not loop away.'}
  };
  const selector=()=>window.KineticProductSelector;
  const current=()=>{const api=selector();if(!api)return null;const s=api.state(),p=api.products()[s.index];return p?{...DEMO_DETAIL[p.id],...p}:null};
  const text=(id,value)=>{const el=$(id);if(el)el.textContent=value||''};
  function fill(p){
    const img=$('#kps-detail-image');if(img){img.src=p.image||'';img.alt=p.name||'Product'}
    text('#kps-detail-meta',p.meta||`${p.code||''} · STACK°`);text('#kps-detail-title',p.name);text('#kps-detail-price',p.price);text('#kps-detail-description',p.description||p.short||p.tagline);text('#kps-detail-ingredients',p.ingredients);text('#kps-detail-origin',p.origin);text('#kps-detail-technique',p.technique);text('#kps-detail-pairing',p.pairing);text('#kps-detail-note',p.note?`“${p.note}”`:'');text('#kps-detail-allergens',p.allergens?`Allergens · ${p.allergens}`:'');
  }
  function requestHost(product,trigger){
    const payload={product:{...product},index:selector()?.state()?.index??0,trigger,source:'kinetic-product-selector',handled:false};
    let handled=false;
    try{
      if(window.parent&&window.parent!==window&&window.parent.document){
        const ev=new window.parent.CustomEvent('restaurant:product-detail-request',{bubbles:true,cancelable:true,detail:payload});
        handled=!window.parent.document.dispatchEvent(ev)||payload.handled===true;
      }
    }catch{}
    if(!handled){
      const local=new CustomEvent('kinetic:detail-request',{bubbles:true,cancelable:true,detail:payload});
      handled=!document.dispatchEvent(local)||payload.handled===true;
    }
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'restaurant:product-detail-request',...payload},location.origin)}catch{}
    root.dataset.kpsDetailHost=handled?'handled':'fallback';
    return handled;
  }
  function open(trigger='hero'){
    const product=current();if(!product||!detail)return false;
    if(requestHost(product,trigger))return true;
    fill(product);lastFocus=document.activeElement;detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');backdrop?.classList.add('is-open');document.body.classList.add('kps-detail-open');root.dataset.kpsDetail='open';setTimeout(()=>close?.focus(),30);return true;
  }
  function closeDetail(){if(!detail?.classList.contains('is-open'))return;detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');backdrop?.classList.remove('is-open');document.body.classList.remove('kps-detail-open');root.dataset.kpsDetail='closed';lastFocus?.focus?.();lastFocus=null}
  function openHero(trigger){lastHeroOpen=performance.now();pointerStart=null;return open(trigger)}
  if(hero){
    hero.setAttribute('role','button');hero.setAttribute('tabindex','0');hero.setAttribute('aria-label','Open selected product details');
    hero.addEventListener('pointerdown',e=>{pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY}});
    stage?.addEventListener('pointerup',e=>{if(!pointerStart||pointerStart.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y);if(moved<=12)openHero('hero-pointer');else pointerStart=null});
    hero.addEventListener('click',()=>{if(performance.now()-lastHeroOpen>=260)openHero('hero')});
    hero.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openHero('hero-keyboard')}});
  }
  rail?.addEventListener('click',e=>{const thumb=e.target.closest('.kps-thumb');if(!thumb||!selector()||Number(thumb.dataset.index)!==selector().state().index)return;e.preventDefault();e.stopImmediatePropagation();open('active-thumbnail')},true);
  close?.addEventListener('click',closeDetail);backdrop?.addEventListener('click',closeDetail);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail?.classList.contains('is-open')){e.preventDefault();closeDetail()}});
  order?.addEventListener('click',()=>{const product=current();document.dispatchEvent(new CustomEvent('kinetic:detail-cta',{detail:{product}}));closeDetail();document.querySelector('#kps-cta')?.click()});
  document.addEventListener('kinetic:product-change',()=>{if(detail?.classList.contains('is-open'))fill(current()||{})});
  window.RestaurantKineticProductDetail=Object.freeze({open,close:closeDetail,current});
})();