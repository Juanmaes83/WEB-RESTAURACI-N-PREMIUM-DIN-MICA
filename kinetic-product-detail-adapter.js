/* Project 12 — isolated Product Detail adapter.
   It never writes to Restaurant core. A future canonical host can intercept
   `kinetic:detail-request`; otherwise the standalone review uses this fallback. */
(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const root=document.documentElement;
  const hero=$('#kps-hero');
  const stage=$('#kps-stage');
  const rail=$('#kps-rail');
  const detail=$('#kps-product-detail');
  const close=$('#kps-detail-close');
  const backdrop=$('#kps-detail-backdrop');
  const order=$('#kps-detail-order');
  let lastFocus=null;
  let pointerStart=null;
  let lastHeroOpen=0;

  const DEMO_DETAIL={
    'midnight-wagyu':{
      meta:'STACK° SIGNATURE · 01',price:'',short:'Dark bun, rich beef and a deliberately dramatic finish.',
      ingredients:'Wagyu-style beef, dark bun, cheese, signature garnish.',origin:'House signature',technique:'High-heat sear',pairing:'Smoked / bitter / bright',allergens:'Gluten · Dairy',note:'Built as the darkest, heaviest opening signature.'
    },
    'ramen-riot':{
      meta:'STACK° SIGNATURE · 02',price:'',short:'A noodle-bun build with pork, egg and stacked umami.',
      ingredients:'Ramen noodle bun, pork, egg, greens, sauce.',origin:'Tokyo-inspired',technique:'Pressed noodle bun',pairing:'Umami · sesame · citrus',allergens:'Egg · Gluten · Sesame',note:'Elastic, playful and intentionally unruly.'
    },
    'glazed-outlaw':{
      meta:'STACK° SIGNATURE · 03',price:'',short:'Sweet glazed bun, fried chicken and bacon with sticky contrast.',
      ingredients:'Glazed bun, fried chicken, bacon, glaze.',origin:'American diner remix',technique:'Crisp fry + glaze',pairing:'Sweet · salty · crisp',allergens:'Gluten · Dairy',note:'Dessert cues pushed into a savory fried-chicken build.'
    },
    'beet-royale':{
      meta:'STACK° SIGNATURE · 04',price:'',short:'Pink bun, grilled cheese and bright pickled accents.',
      ingredients:'Beet-style bun, grilled cheese, pickled onion, herbs.',origin:'Vegetarian signature',technique:'Plancha grill',pairing:'Tangy · floral · charred',allergens:'Gluten · Dairy',note:'Color is part of the product identity, not decoration.'
    },
    'tidal-gold':{
      meta:'STACK° SIGNATURE · 05',price:'',short:'Ocean-led filling, turquoise bun and tropical golden notes.',
      ingredients:'Turquoise bun, crab-style filling, mango, greens.',origin:'Coastal signature',technique:'Cold-prep + crisp finish',pairing:'Oceanic · tropical · fresh',allergens:'Gluten · Shellfish',note:'The lightest visual build in the sequence.'
    },
    'lava-brisket':{
      meta:'STACK° SIGNATURE · 06',price:'',short:'Dark pretzel bun, brisket, cheddar and jalapeño heat.',
      ingredients:'Pretzel bun, brisket, cheddar, jalapeño, sauce.',origin:'Smokehouse signature',technique:'Slow smoke + hot finish',pairing:'Smoky · molten · spicy',allergens:'Gluten · Dairy',note:'The final hero is designed to hold, not loop away.'
    }
  };

  function selector(){return window.KineticProductSelector}
  function current(){
    const api=selector();if(!api)return null;
    const state=api.state();const product=api.products()[state.index];if(!product)return null;
    return {...DEMO_DETAIL[product.id],...product};
  }
  function text(id,value){const el=$(id);if(el)el.textContent=value||''}
  function fill(product){
    const img=$('#kps-detail-image');if(img){img.src=product.image||'';img.alt=product.name||'Product'}
    text('#kps-detail-meta',product.meta||`${product.code||''} · STACK°`);
    text('#kps-detail-title',product.name);
    text('#kps-detail-price',product.price);
    text('#kps-detail-description',product.description||product.short||product.tagline);
    text('#kps-detail-ingredients',product.ingredients);
    text('#kps-detail-origin',product.origin);
    text('#kps-detail-technique',product.technique);
    text('#kps-detail-pairing',product.pairing);
    text('#kps-detail-note',product.note?`“${product.note}”`: '');
    text('#kps-detail-allergens',product.allergens?`Allergens · ${product.allergens}`:'');
  }
  function postContract(product,trigger){
    try{
      if(window.parent&&window.parent!==window){
        window.parent.postMessage({type:'restaurant:product-detail-request',source:'kinetic-product-selector',product,index:selector()?.state()?.index??0,trigger},location.origin);
      }
    }catch{}
  }
  function open(trigger='hero'){
    const product=current();if(!product||!detail)return false;
    const request=new CustomEvent('kinetic:detail-request',{bubbles:true,cancelable:true,detail:{product:{...product},index:selector().state().index,trigger,source:'kinetic-product-selector'}});
    const useFallback=document.dispatchEvent(request);
    postContract(product,trigger);
    if(!useFallback)return true;
    fill(product);lastFocus=document.activeElement;
    detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');backdrop?.classList.add('is-open');
    document.body.classList.add('kps-detail-open');root.dataset.kpsDetail='open';
    setTimeout(()=>close?.focus(),30);return true;
  }
  function openHero(trigger){lastHeroOpen=performance.now();pointerStart=null;return open(trigger)}
  function closeDetail(){
    if(!detail?.classList.contains('is-open'))return;
    detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');backdrop?.classList.remove('is-open');
    document.body.classList.remove('kps-detail-open');root.dataset.kpsDetail='closed';
    lastFocus?.focus?.();lastFocus=null;
  }

  if(hero){
    hero.setAttribute('role','button');hero.setAttribute('tabindex','0');hero.setAttribute('aria-label','Open selected product details');
    hero.addEventListener('pointerdown',e=>{pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY}});
    /* The selector captures the pointer on the stage so drag/swipe remains robust.
       A short pointerup on the captured stage is therefore the canonical tap signal. */
    stage?.addEventListener('pointerup',e=>{
      if(!pointerStart||pointerStart.id!==e.pointerId)return;
      const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y);
      if(moved<=12)openHero('hero-pointer');else pointerStart=null;
    });
    hero.addEventListener('click',e=>{
      if(performance.now()-lastHeroOpen<260)return;
      const moved=pointerStart?Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y):0;
      pointerStart=null;if(moved>12)return;openHero('hero');
    });
    hero.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openHero('hero-keyboard')}});
  }

  rail?.addEventListener('click',e=>{
    const thumb=e.target.closest('.kps-thumb');if(!thumb||!selector())return;
    if(Number(thumb.dataset.index)!==selector().state().index)return;
    e.preventDefault();e.stopImmediatePropagation();open('active-thumbnail');
  },true);

  close?.addEventListener('click',closeDetail);backdrop?.addEventListener('click',closeDetail);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail?.classList.contains('is-open')){e.preventDefault();closeDetail()}});
  order?.addEventListener('click',()=>{
    const product=current();document.dispatchEvent(new CustomEvent('kinetic:detail-cta',{detail:{product}}));
    closeDetail();document.querySelector('#kps-cta')?.click();
  });
  document.addEventListener('kinetic:product-change',()=>{
    if(detail?.classList.contains('is-open'))fill(current()||{});
  });

  window.RestaurantKineticProductDetail=Object.freeze({open,close:closeDetail,current});
})();
