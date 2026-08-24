/* CLASS 06 — PRODUCT FINAL
   Bilingual public experience, emotional dish storytelling, accessibility and SEO runtime.
   Does not own or modify Class 05 motion choreography. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const defaults=window.RestaurantDefaults;if(!defaults)return;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(base,over)=>{if(Array.isArray(base))return Array.isArray(over)?over:base;if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out}return over===undefined?base:over};
  let config=clone(defaults),locale='es',applyTimer=null,detailOpenState=false,ownedDetailSource=null;

  const publicMap={
    'hero-kicker':'hero.kicker','hero-line1':'hero.line1','hero-line2':'hero.line2','hero-body':'hero.body','hero-cta':'hero.cta','hero-stamp':'hero.stamp','scroll-hint':'hero.scroll',
    'philosophy-index':'philosophy.index','philosophy-title':'philosophy.title','philosophy-body1':'philosophy.body1','philosophy-body2':'philosophy.body2',
    'orbital-index':'orbital.index','orbital-kicker':'orbital.kicker','orbital-title':'orbital.title','explore-label':'orbital.explore',
    'origin-index':'origin.index','origin-title':'origin.title','origin-body':'origin.body','origin-caption':'origin.caption',
    'atmosphere-index':'atmosphere.index','atmosphere-title':'atmosphere.title','atmosphere-caption':'atmosphere.caption','atmosphere-body':'atmosphere.body','atmosphere-cta':'atmosphere.cta',
    'chef-index':'chef.index','chef-title':'chef.title','chef-quote':'chef.quote','visit-kicker':'visit.kicker','visit-title':'visit.title','visit-cta':'visit.cta','address-label':'visit.addressLabel','service-label':'visit.serviceLabel','contact-label':'visit.contactLabel'
  };
  const pathGet=(obj,path)=>path.split('.').reduce((a,k)=>a?.[k],obj);
  const langData=()=>config.i18n?.[locale]||defaults.i18n?.[locale]||{};
  const dishData=id=>langData().dishes?.[id]||config.i18n?.en?.dishes?.[id]||{};
  const baseDish=id=>config.dishes?.find(d=>d.id===id)||defaults.dishes?.find(d=>d.id===id)||{};
  const activeDishId=()=>{
    const inDetail=$('#detail-visual .orbit-dish')?.dataset.id;if(inDetail)return inDetail;
    const shell=$('.orbit-shell');if(!shell)return null;const sr=shell.getBoundingClientRect(),cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;
    return $$('#orbit-stage .orbit-dish').map(el=>{const r=el.getBoundingClientRect();return{el,score:Math.abs(r.left+r.width/2-cx)+Math.abs(r.top+r.height/2-cy)*.18}}).sort((a,b)=>a.score-b.score)[0]?.el.dataset.id||null;
  };
  const isVisualHero=dish=>{
    if(!dish||!dish.closest('#orbit-stage'))return false;
    const id=activeDishId();return !!id&&dish.dataset.id===id;
  };

  async function loadConfig(){
    try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config)config=merge(clone(defaults),saved.config)}catch(err){console.warn('Class 06 config fallback',err)}
    const q=new URLSearchParams(location.search).get('lang');
    const stored=localStorage.getItem('restaurant-locale');
    locale=(q==='es'||q==='en')?q:((stored==='es'||stored==='en')?stored:(config.locale||'es'));
  }

  function ensureLanguageSwitch(){
    if($('#class6-language'))return;
    const actions=$('.nav-actions');if(!actions)return;
    const group=document.createElement('div');group.id='class6-language';group.className='class6-language';group.setAttribute('role','group');group.setAttribute('aria-label','Language / Idioma');
    group.innerHTML='<button type="button" data-lang="es">ES</button><span aria-hidden="true">/</span><button type="button" data-lang="en">EN</button>';
    actions.insertBefore(group,actions.firstChild);
    group.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLocale(b.dataset.lang,true)});
  }

  function ensureStoryUI(){
    const copy=$('#dish-detail .detail-copy');if(!copy||$('#class6-story'))return;
    const story=document.createElement('section');story.id='class6-story';story.className='class6-story';
    story.innerHTML='<div class="class6-story-lead"><span id="class6-story-label"></span><p id="class6-story-text"></p></div><div class="class6-elaboration"><span id="class6-elaboration-label"></span><p id="class6-elaboration-text"></p></div>';
    const desc=$('#detail-description');desc?.insertAdjacentElement('afterend',story);
    $$('.detail-columns h4').forEach((h,i)=>h.dataset.class6Label=String(i));
  }

  function setText(id,value){const el=$('#'+id);if(el&&value!==undefined)el.textContent=value}
  function applyGlobals(){
    const d=langData();document.documentElement.lang=locale;document.documentElement.dataset.locale=locale;
    Object.entries(publicMap).forEach(([id,path])=>setText(id,pathGet(d,path)));
    const badges=$('#chef-badges');if(badges&&d.chef?.badges)badges.innerHTML=d.chef.badges.map(x=>`<span>${String(x).replace(/[<&]/g,c=>c==='<'?'&lt;':'&amp;')}</span>`).join('');
    const nav=$$('.desktop-nav a');const navCopy=locale==='es'?['Carta','Historia','Experiencia','Visita']:['Menu','Story','Experience','Visit'];nav.forEach((a,i)=>{if(navCopy[i])a.textContent=navCopy[i]});
    const reserve=d.ui?.reserve||'Reserve';$$('.reserve-open').forEach(b=>{if(b.classList.contains('detail-reserve'))b.textContent=reserve+' →';else if(b.closest('.nav-actions')||b.id==='visit-cta')b.textContent=b.id==='visit-cta'?(d.visit?.cta||reserve):reserve});
    const lang=$('#class6-language');if(lang){lang.querySelectorAll('[data-lang]').forEach(b=>{const on=b.dataset.lang===locale;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})}
    setText('footer-center',locale==='es'?'Class 06 · Producto Final':'Class 06 · Product Final');
    applyOrbitCopy();applyDetail();applyReservation();updateSEO();
  }

  function applyOrbitCopy(){
    const id=activeDishId();if(!id)return;const d=dishData(id);if(!d)return;
    setText('dish-meta',d.meta);setText('dish-title',d.name);setText('dish-short',d.short);
    const img=$(`.orbit-dish[data-id="${id}"] img`);if(img)img.alt=d.name||'Dish';
  }

  function applyDetail(){
    ensureStoryUI();const id=$('#detail-visual .orbit-dish')?.dataset.id;if(!id)return;const d=dishData(id),raw=baseDish(id),ui=langData().ui||{};
    setText('detail-meta',d.meta);setText('detail-title',d.name);setText('detail-price',raw.price||'');setText('detail-description',d.short);setText('detail-ingredients',d.ingredients);setText('detail-origin',d.origin);setText('detail-technique',d.technique);setText('detail-pairing',d.pairing);setText('detail-note',`“${d.note||''}”`);setText('detail-allergens',`${ui.allergens||'Allergens'} · ${d.allergens||''}`);
    setText('class6-story-label',ui.story||'The story');setText('class6-story-text',d.story);setText('class6-elaboration-label',ui.elaboration||'Preparation');setText('class6-elaboration-text',d.elaboration);
    const labels=[ui.ingredients,ui.origin,ui.technique,ui.pairing];$$('.detail-columns h4').forEach((h,i)=>{if(labels[i])h.textContent=labels[i]});
    const noteLabel=$('.detail-note span');if(noteLabel)noteLabel.textContent=ui.chefNote||"Chef's note";
    const close=$('#detail-close');if(close)close.setAttribute('aria-label',ui.close||'Close dish');
    const visualImg=$('#detail-visual img');if(visualImg)visualImg.alt=d.name||'Dish';
  }

  function applyReservation(){
    const dlg=$('#reserve-dialog');if(!dlg)return;
    const es=locale==='es';
    const kicker=$('.kicker',dlg),title=$('.display',dlg),small=$('form small',dlg),submit=$('form button[type="submit"]',dlg);
    if(kicker)kicker.textContent=es?'Reserva':'Reservation';if(title)title.innerHTML=es?'Tu mesa,<br>después del sol.':'Your table,<br>after dark.';if(submit)submit.textContent=es?'Solicitar reserva':'Request reservation';if(small)small.textContent=es?'Demo académica: no se envían datos a un restaurante real.':'Academic demo: no data is sent to a real restaurant.';
    const labels=$$('form label',dlg),names=es?['Nombre','Email','Fecha','Personas','Notas']:['Name','Email','Date','Guests','Notes'];labels.forEach((l,i)=>{const input=l.querySelector('input,select,textarea');if(!input||!names[i])return;for(const n of [...l.childNodes])if(n.nodeType===3)n.textContent='';l.insertBefore(document.createTextNode(names[i]),input)});
  }

  function updateSEO(){
    const d=langData(),brand=config.brand?.name||'LÚMINA';document.title=locale==='es'?`${brand} — Restaurante mediterráneo en Alicante`:`${brand} — Mediterranean dining in Alicante`;
    let meta=$('meta[name="description"]');if(meta)meta.content=locale==='es'?'LÚMINA: experiencia gastronómica mediterránea en Alicante con carta orbital, producto local y cocina de fuego.':'LÚMINA: a Mediterranean dining experience in Alicante with an orbital menu, local produce and fire-led cooking.';
    const ensure=(selector,create)=>{let el=$(selector);if(!el){el=document.createElement(create.tag);Object.entries(create.attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));document.head.appendChild(el)}return el};
    const base=location.href.split('?')[0].split('#')[0];
    const canonical=ensure('link[rel="canonical"]',{tag:'link',attrs:{rel:'canonical'}});canonical.href=base;
    ['es','en'].forEach(l=>{const alt=ensure(`link[rel="alternate"][hreflang="${l}"]`,{tag:'link',attrs:{rel:'alternate',hreflang:l}});alt.href=`${base}?lang=${l}`});
    const ogTitle=ensure('meta[property="og:title"]',{tag:'meta',attrs:{property:'og:title'}});ogTitle.content=document.title;
    const ogDesc=ensure('meta[property="og:description"]',{tag:'meta',attrs:{property:'og:description'}});ogDesc.content=meta?.content||'';
    let schema=$('#class6-schema');if(!schema){schema=document.createElement('script');schema.type='application/ld+json';schema.id='class6-schema';document.head.appendChild(schema)}
    schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Restaurant',name:brand,description:meta?.content||'',servesCuisine:['Mediterranean','Spanish'],address:{'@type':'PostalAddress',streetAddress:config.visit?.address||'',addressLocality:'Alicante',addressCountry:'ES'},email:config.visit?.contact||'',priceRange:'€€€',inLanguage:locale,hasMenu:`${base}#signature`});
  }

  function setLocale(lang,persist=false){
    if(lang!=='es'&&lang!=='en')return;locale=lang;if(persist)localStorage.setItem('restaurant-locale',lang);applyGlobals();
    window.dispatchEvent(new CustomEvent('restaurant:locale-change',{detail:{lang}}));
  }

  async function refreshConfig(){try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config)config=merge(clone(defaults),saved.config)}catch{}applyGlobals()}
  function scheduleApply(delay=70){clearTimeout(applyTimer);applyTimer=setTimeout(()=>{applyGlobals()},delay)}
  function publishDetailState(detail){
    const open=detail?.getAttribute('aria-hidden')==='false'||detail?.classList.contains('is-open');
    if(open===detailOpenState)return;detailOpenState=open;
    document.documentElement.dataset.dishDetail=open?'open':'closed';
    window.dispatchEvent(new CustomEvent(open?'restaurant:dish-detail-open':'restaurant:dish-detail-close',{detail:{id:open?$('#detail-visual .orbit-dish')?.dataset.id||null:null}}));
    if(open){requestAnimationFrame(()=>{applyDetail();const copy=$('#dish-detail .detail-copy');if(copy)copy.scrollTop=0})}
  }

  function openOwnedDetail(dish){
    if(!dish||ownedDetailSource||!dish.closest('#orbit-stage'))return;
    const detail=$('#dish-detail'),visual=$('#detail-visual');if(!detail||!visual)return;
    ownedDetailSource={node:dish,parent:dish.parentNode,next:dish.nextSibling};
    const state=window.Flip?Flip.getState(dish):null;
    visual.appendChild(dish);detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');document.body.classList.add('detail-open');
    applyDetail();publishDetailState(detail);
    if(state&&window.Flip)Flip.from(state,{duration:.82,ease:'power4.inOut',absolute:true,scale:true});
    requestAnimationFrame(()=>$('#detail-close')?.focus());
  }
  function closeOwnedDetail(){
    if(!ownedDetailSource)return false;
    const detail=$('#dish-detail'),source=ownedDetailSource.node,state=window.Flip?Flip.getState(source):null,record=ownedDetailSource;
    if(record.next&&record.next.parentNode===record.parent)record.parent.insertBefore(source,record.next);else record.parent.appendChild(source);
    const done=()=>{detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');document.body.classList.remove('detail-open');ownedDetailSource=null;publishDetailState(detail);scheduleApply(40)};
    if(state&&window.Flip)Flip.from(state,{duration:.62,ease:'power3.inOut',absolute:true,scale:true,onComplete:done});else done();
    return true;
  }

  function bind(){
    ensureLanguageSwitch();ensureStoryUI();
    document.addEventListener('input',e=>{if(e.target.closest('#studio'))setTimeout(refreshConfig,520)},true);document.addEventListener('change',e=>{if(e.target.closest('#studio'))setTimeout(refreshConfig,520)},true);
    ['#next-dish','#prev-dish'].forEach(sel=>$(sel)?.addEventListener('click',()=>{scheduleApply(80);scheduleApply(760)},true));
    $('.orbit-shell')?.addEventListener('wheel',()=>{scheduleApply(120);scheduleApply(780)},{passive:true,capture:true});
    $('.orbit-shell')?.addEventListener('pointerup',()=>{scheduleApply(180);scheduleApply(850)},{passive:true,capture:true});
    /* Class 06 owns the emotional detail lifecycle so direct hero click never depends on a private Class 04 binding. */
    $('#orbit-stage')?.addEventListener('click',e=>{const dish=e.target.closest('.orbit-dish');if(!dish||!isVisualHero(dish))return;e.preventDefault();e.stopImmediatePropagation();openOwnedDetail(dish)},true);
    $('#explore-dish')?.addEventListener('click',e=>{if(ownedDetailSource)return;e.preventDefault();e.stopImmediatePropagation();const id=activeDishId(),dish=id?$(`#orbit-stage .orbit-dish[data-id="${id}"]`):null;if(dish)openOwnedDetail(dish)},true);
    $('.orbit-shell')?.addEventListener('keydown',e=>{if(e.key!=='Enter'||ownedDetailSource)return;const id=activeDishId(),dish=id?$(`#orbit-stage .orbit-dish[data-id="${id}"]`):null;if(!dish)return;e.preventDefault();e.stopImmediatePropagation();openOwnedDetail(dish)},true);
    $('#detail-close')?.addEventListener('click',e=>{if(!ownedDetailSource)return;e.preventDefault();e.stopImmediatePropagation();closeOwnedDetail()},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ownedDetailSource){e.preventDefault();closeOwnedDetail()}},true);
    const detail=$('#dish-detail');if(detail){publishDetailState(detail);new MutationObserver(()=>{publishDetailState(detail);scheduleApply(35)}).observe(detail,{attributes:true,attributeFilter:['aria-hidden','class'],subtree:false})}
    const title=$('#dish-title');if(title)new MutationObserver(()=>scheduleApply(20)).observe(title,{childList:true,characterData:true,subtree:true});
    window.addEventListener('restaurant:locale-request',e=>setLocale(e.detail?.lang||'es',true));
    window.addEventListener('restaurant:class6-open-dish',e=>openDish(e.detail?.id,e.detail?.lang));
    window.addEventListener('restaurant:motion-change',()=>scheduleApply(50));
  }

  function openDish(id,lang){
    if(lang)setLocale(lang,true);const dish=$(`#orbit-stage .orbit-dish[data-id="${id}"]`);if(!dish)return;
    if(isVisualHero(dish)){openOwnedDetail(dish);return}
    dish.click();setTimeout(()=>{const candidate=$(`#orbit-stage .orbit-dish[data-id="${id}"]`);if(candidate&&isVisualHero(candidate))openOwnedDetail(candidate)},920);
  }

  async function boot(){await loadConfig();bind();applyGlobals();document.documentElement.dataset.class6='product-final';document.documentElement.dataset.dishDetail='closed';}
  boot();
})();