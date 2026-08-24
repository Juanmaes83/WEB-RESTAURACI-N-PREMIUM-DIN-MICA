/* LÚMINA · CLASS 04 · RESTAURANT STUDIO */
(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger, Observer, Flip);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=o=>JSON.parse(JSON.stringify(o));
  let config=clone(window.RestaurantDefaults);
  let active=0, orbitProgress=0, orbitTween=null, dragging=false, dragStartX=0, dragStartProgress=0, lastPointerX=0, velocity=0, editIndex=0, detailSource=null;
  let autosaveTimer=null, history=[], future=[], objectUrls={};

  const pathGet=(obj,path)=>path.split('.').reduce((a,k)=>a?.[k],obj);
  const pathSet=(obj,path,value)=>{const parts=path.split('.');const last=parts.pop();const target=parts.reduce((a,k)=>(a[k]??={}),obj);target[last]=value;};
  const merge=(base,over)=>{if(Array.isArray(base)) return Array.isArray(over)?over:base;if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out;}return over===undefined?base:over;};
  const enabledDishes=()=>config.dishes.filter(d=>d.enabled!==false);

  async function boot(){
    try{const saved=await RestaurantStore.loadProject();if(saved?.config) config=merge(clone(window.RestaurantDefaults),saved.config);}catch(e){console.warn('Studio store unavailable',e)}
    await hydrateMedia();
    bindStudio(); bindGlobal(); applyAll(); setupOrbitInteraction(); setupDetail(); setupReserve(); setupScroll(); setupCursor();
    setStatus('saved','Proyecto cargado');
  }

  function snapshot(){history.push(JSON.stringify(config));if(history.length>40)history.shift();future=[];}
  function scheduleSave(){clearTimeout(autosaveTimer);setStatus('saving','Guardando…');autosaveTimer=setTimeout(async()=>{try{await RestaurantStore.saveProject({id:'restaurant-class4',schemaVersion:4,status:'draft',config});setStatus('saved','Guardado');}catch(e){setStatus('error','Error al guardar')}},500)}
  function setStatus(kind,text){const el=$('#studio-status');if(!el)return;el.dataset.state=kind;el.textContent=text;}
  function mutate(fn){snapshot();fn();applyAll();scheduleSave();}

  async function hydrateMedia(){
    const slots=['logo','hero','origin','atmosphere','chef'];
    for(const slot of slots){
      try{const record=await RestaurantStore.loadMedia(slot);if(record?.file){if(objectUrls[slot])URL.revokeObjectURL(objectUrls[slot]);objectUrls[slot]=URL.createObjectURL(record.file);config.media[slot]=config.media[slot]||{};config.media[slot].type=record.file.type.startsWith('video/')?'video':'image';config.media[slot].local=true;}}
      catch(e){}
    }
    for(const dish of config.dishes){
      try{const record=await RestaurantStore.loadMedia(dish.id);if(record?.file){if(objectUrls[dish.id])URL.revokeObjectURL(objectUrls[dish.id]);objectUrls[dish.id]=URL.createObjectURL(record.file);dish.localMedia=true;dish.mediaType=record.file.type.startsWith('video/')?'video':'image';}}
      catch(e){}
    }
  }

  function resolveMedia(slot, fallback){return objectUrls[slot] || config.media?.[slot]?.url || fallback || ''}
  function resolveDishMedia(d){return objectUrls[d.id] || d.image}

  function renderMedia(slot,host){
    if(!host)return;
    const def=config.media[slot]||{};const src=resolveMedia(slot);host.innerHTML='';host.style.background='';
    if(!src)return;
    const el=document.createElement(def.type==='video'?'video':'img');
    el.src=src;el.className='section-media-element';
    if(el.tagName==='VIDEO'){el.autoplay=true;el.muted=true;el.loop=true;el.playsInline=true;el.setAttribute('aria-label',`${slot} video`)}else{el.alt=`${slot} visual`}
    el.style.objectFit=def.fit||'cover';el.style.objectPosition=def.position||'50% 50%';host.appendChild(el);
  }

  function applyAll(){
    document.documentElement.style.setProperty('--accent',config.brand.accent);document.documentElement.style.setProperty('--ink',config.brand.ink);document.documentElement.style.setProperty('--paper',config.brand.paper);
    $$('[data-brand]').forEach(el=>el.textContent=config.brand.name);
    const map={
      'hero-kicker':'hero.kicker','hero-line1':'hero.line1','hero-line2':'hero.line2','hero-body':'hero.body','hero-cta':'hero.cta','hero-stamp':'hero.stamp','scroll-hint':'hero.scroll',
      'philosophy-index':'philosophy.index','philosophy-title':'philosophy.title','philosophy-body1':'philosophy.body1','philosophy-body2':'philosophy.body2',
      'orbital-index':'orbital.index','orbital-kicker':'orbital.kicker','orbital-title':'orbital.title','explore-label':'orbital.explore',
      'origin-index':'origin.index','origin-title':'origin.title','origin-body':'origin.body','origin-caption':'origin.caption',
      'atmosphere-index':'atmosphere.index','atmosphere-title':'atmosphere.title','atmosphere-caption':'atmosphere.caption','atmosphere-body':'atmosphere.body','atmosphere-cta':'atmosphere.cta',
      'chef-index':'chef.index','chef-title':'chef.title','chef-quote':'chef.quote',
      'visit-kicker':'visit.kicker','visit-title':'visit.title','visit-cta':'visit.cta','address-label':'visit.addressLabel','address-text':'visit.address','service-label':'visit.serviceLabel','service-text':'visit.service','contact-label':'visit.contactLabel','contact-text':'visit.contact',
      'footer-left':'footer.left','footer-center':'footer.center','footer-right':'footer.right'
    };
    Object.entries(map).forEach(([id,path])=>{const el=$('#'+id);if(el)el.textContent=pathGet(config,path)??''});
    const badges=$('#chef-badges');if(badges)badges.innerHTML=(config.chef.badges||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
    renderBrand(); ['hero','origin','atmosphere','chef'].forEach(slot=>renderMedia(slot,$(`[data-media-host="${slot}"]`)));
    buildOrbit(); syncStudioInputs(); renderDishList(); renderMediaCards();
    document.title=`${config.brand.name} — Orbital Dining`;
  }

  function renderBrand(){
    const slot=objectUrls.logo || config.media?.logo?.url;
    $$('.brand-visual').forEach(el=>{el.innerHTML=slot?`<img src="${slot}" alt="${escapeHtml(config.brand.name)}">`:`<span class="brand-dot"></span><span>${escapeHtml(config.brand.name)}</span>`});
  }

  function buildOrbit(){
    const stage=$('#orbit-stage');if(!stage)return;const dishes=enabledDishes();if(!dishes.length)return;
    active=Math.min(active,dishes.length-1);stage.innerHTML='';
    dishes.forEach((dish,i)=>{const item=document.createElement('button');item.type='button';item.className='orbit-dish';item.dataset.index=i;item.dataset.id=dish.id;item.setAttribute('aria-label',`Ver ${dish.name}`);item.innerHTML=`<img src="${resolveDishMedia(dish)}" alt="${escapeHtml(dish.name)}">`;item.addEventListener('click',()=>{if(Math.abs(shortestIndexDistance(i,active,dishes.length))<.2)openDetail();else goToIndex(i)});stage.appendChild(item)});
    renderOrbit();updateCopy(true);
  }
  function shortestIndexDistance(i,a,n){let d=i-a;if(d>n/2)d-=n;if(d<-n/2)d+=n;return d}
  function continuousDistance(i){const n=enabledDishes().length;let d=i-orbitProgress;if(d>n/2)d-=n;if(d<-n/2)d+=n;return d}
  function renderOrbit(){const shell=$('.orbit-shell');if(!shell)return;const n=enabledDishes().length;if(!n)return;const mobile=innerWidth<620,rx=(mobile?.47:.40)*shell.clientWidth,ry=(mobile?.25:.27)*shell.clientHeight;$$('.orbit-dish').forEach((el,i)=>{const d=continuousDistance(i),angle=d*(Math.PI*2/n),front=(Math.cos(angle)+1)/2,x=Math.sin(angle)*rx,y=-(1-front)*ry*.85+Math.abs(Math.sin(angle))*ry*.20,scale=.42+Math.pow(front,1.4)*(mobile?.76:.72),opacity=.22+front*.78,blur=(1-front)*4,brightness=.54+front*.50,rotate=Math.sin(angle)*5,z=Math.round(front*100);gsap.set(el,{xPercent:-50,yPercent:-50,x,y,scale,rotation:rotate,opacity,filter:`blur(${blur}px) brightness(${brightness})`,zIndex:z})})}
  function nearestIndex(){const n=enabledDishes().length;return n?((Math.round(orbitProgress)%n)+n)%n:0}
  function syncActive(){const n=nearestIndex();if(n!==active){active=n;updateCopy()}}
  function goToIndex(index){const n=enabledDishes().length;let d=index-orbitProgress;while(d>n/2)d-=n;while(d<-n/2)d+=n;animateProgress(orbitProgress+d)}
  function animateProgress(target,duration=.72){orbitTween?.kill();const state={v:orbitProgress};orbitTween=gsap.to(state,{v:target,duration,ease:'power3.inOut',onUpdate(){orbitProgress=state.v;renderOrbit();syncActive()},onComplete(){orbitProgress=Math.round(target);renderOrbit();syncActive()}})}
  const next=()=>animateProgress(Math.round(orbitProgress)+1), prev=()=>animateProgress(Math.round(orbitProgress)-1);
  function updateCopy(immediate=false){const d=enabledDishes()[active];if(!d)return;const els=[$('#dish-meta'),$('#dish-title'),$('#dish-short')];const set=()=>{$('#dish-meta').textContent=d.meta;$('#dish-title').textContent=d.name;$('#dish-short').textContent=d.short;$('#dish-counter').textContent=`${String(active+1).padStart(2,'0')} / ${String(enabledDishes().length).padStart(2,'0')}`;gsap.to(els,{opacity:1,y:0,duration:immediate?0:.28,stagger:.035})};if(immediate)set();else gsap.to(els,{opacity:0,y:7,duration:.14,onComplete:set})}

  function setupOrbitInteraction(){const shell=$('.orbit-shell');$('#next-dish').onclick=next;$('#prev-dish').onclick=prev;$('#explore-dish').onclick=openDetail;shell.addEventListener('keydown',e=>{if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev();if(e.key==='Enter')openDetail()});Observer.create({target:shell,type:'wheel',preventDefault:true,wheelSpeed:-1,tolerance:12,onDown:next,onUp:prev});shell.addEventListener('pointerdown',e=>{dragging=true;dragStartX=e.clientX;lastPointerX=e.clientX;dragStartProgress=orbitProgress;velocity=0;shell.setPointerCapture?.(e.pointerId);orbitTween?.kill()});shell.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-dragStartX;velocity=e.clientX-lastPointerX;lastPointerX=e.clientX;orbitProgress=dragStartProgress-dx/(innerWidth<620?170:240);renderOrbit();syncActive()});const end=()=>{if(!dragging)return;dragging=false;animateProgress(Math.round(orbitProgress-velocity*.018),.55)};shell.addEventListener('pointerup',end);shell.addEventListener('pointercancel',end);addEventListener('resize',renderOrbit)}

  function fillDetail(d){$('#detail-meta').textContent=d.meta;$('#detail-title').textContent=d.name;$('#detail-price').textContent=d.price;$('#detail-description').textContent=d.short;$('#detail-ingredients').textContent=d.ingredients;$('#detail-origin').textContent=d.origin;$('#detail-technique').textContent=d.technique;$('#detail-pairing').textContent=d.pairing;$('#detail-note').textContent=`“${d.note}”`;$('#detail-allergens').textContent=`Allergens · ${d.allergens}`}
  function openDetail(){const d=enabledDishes()[active],detail=$('#dish-detail'),source=$(`.orbit-dish[data-id="${d.id}"]`);if(!source)return;detailSource={node:source,parent:source.parentNode,next:source.nextSibling};const state=Flip.getState(source);$('#detail-visual').appendChild(source);fillDetail(d);detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');document.body.classList.add('detail-open');Flip.from(state,{duration:.85,ease:'power4.inOut',absolute:true,scale:true});gsap.fromTo(detail,{opacity:0},{opacity:1,duration:.35});gsap.from('.detail-copy>*',{opacity:0,y:22,duration:.55,stagger:.045,delay:.25,ease:'power2.out'});$('#detail-close').focus()}
  function closeDetail(){if(!detailSource)return;const detail=$('#dish-detail'),source=detailSource.node,state=Flip.getState(source);detailSource.parent.insertBefore(source,detailSource.next);Flip.from(state,{duration:.72,ease:'power3.inOut',absolute:true,scale:true,onComplete(){detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');document.body.classList.remove('detail-open');detailSource=null;renderOrbit()}});gsap.to(detail,{opacity:0,duration:.45})}
  function setupDetail(){$('#detail-close').onclick=closeDetail;document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#dish-detail').classList.contains('is-open'))closeDetail();else if($('#studio').getAttribute('aria-hidden')==='false')closeStudio()}})}

  function openStudio(){const studio=$('#studio'),back=$('#studio-backdrop');studio.setAttribute('aria-hidden','false');document.body.classList.add('studio-open');back.style.visibility='visible';gsap.set(studio,{xPercent:100});gsap.to(studio,{xPercent:0,duration:.65,ease:'power4.out',overwrite:true});gsap.to(back,{autoAlpha:1,duration:.3,overwrite:true});setTimeout(()=>$('#studio-close')?.focus(),300)}
  function closeStudio(){const studio=$('#studio'),back=$('#studio-backdrop');studio.setAttribute('aria-hidden','true');document.body.classList.remove('studio-open');gsap.to(studio,{xPercent:100,duration:.45,ease:'power3.in',overwrite:true});gsap.to(back,{autoAlpha:0,duration:.3,overwrite:true,onComplete:()=>back.style.visibility='hidden'})}

  function bindStudio(){
    $$('.studio-open').forEach(b=>b.addEventListener('click',openStudio));$('#studio-close').onclick=closeStudio;$('#studio-backdrop').onclick=closeStudio;gsap.set('#studio',{xPercent:100});
    $$('.studio-nav button').forEach(btn=>btn.onclick=()=>showPanel(btn.dataset.panel));
    $$('[data-path]').forEach(input=>{const event=input.type==='color'?'input':'change';input.addEventListener(event,()=>mutate(()=>pathSet(config,input.dataset.path,input.value)))});
    $$('[data-preview-target]').forEach(btn=>btn.onclick=()=>{const target=$(btn.dataset.previewTarget);closeStudio();setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'start'}),250)});
    $$('.media-upload').forEach(input=>input.addEventListener('change',()=>handleMediaUpload(input.dataset.slot,input.files?.[0])));
    $('#dish-add').onclick=addDish;$('#dish-duplicate').onclick=duplicateDish;$('#dish-delete').onclick=deleteDish;$('#dish-up').onclick=()=>moveDish(-1);$('#dish-down').onclick=()=>moveDish(1);$('#dish-save').onclick=saveDishFields;
    $('#dish-media').addEventListener('change',()=>handleDishMedia($('#dish-media').files?.[0]));
    $('#undo-btn').onclick=undo;$('#redo-btn').onclick=redo;$('#export-config').onclick=exportConfig;$('#import-config').addEventListener('change',importConfig);$('#reset-config').onclick=resetProject;
    $('#preview-mode').addEventListener('change',e=>document.body.dataset.preview=e.target.value);
  }

  function showPanel(name){$$('.studio-nav button').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));$$('.studio-panel').forEach(p=>p.hidden=p.dataset.panel!==name);$('#studio-scroll').scrollTop=0;}
  function syncStudioInputs(){$$('[data-path]').forEach(input=>{const v=pathGet(config,input.dataset.path);if(v!==undefined&&document.activeElement!==input)input.value=v});$('#studio-project-name').textContent=config.brand.name;}

  function renderMediaCards(){
    $$('.media-card').forEach(card=>{const slot=card.dataset.slot,preview=$('.media-preview',card),src=resolveMedia(slot);preview.innerHTML='';if(src){const type=config.media?.[slot]?.type||'image';const el=document.createElement(type==='video'?'video':'img');el.src=src;if(type==='video'){el.muted=true;el.autoplay=true;el.loop=true;el.playsInline=true}preview.appendChild(el)}$('.media-state',card).textContent=objectUrls[slot]?'Archivo local':'Placeholder';});
  }
  async function handleMediaUpload(slot,file){if(!file)return;if(!/^image\//.test(file.type)&&!/^video\//.test(file.type))return alert('Selecciona una imagen o vídeo.');snapshot();await RestaurantStore.saveMedia(slot,file);if(objectUrls[slot])URL.revokeObjectURL(objectUrls[slot]);objectUrls[slot]=URL.createObjectURL(file);config.media[slot]=config.media[slot]||{};config.media[slot].type=file.type.startsWith('video/')?'video':'image';config.media[slot].local=true;applyAll();scheduleSave();}

  function renderDishList(){const list=$('#studio-dish-list');if(!list)return;list.innerHTML='';config.dishes.forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.className='studio-dish-item'+(i===editIndex?' active':'');b.innerHTML=`<img src="${resolveDishMedia(d)}" alt=""><span><strong>${String(i+1).padStart(2,'0')} · ${escapeHtml(d.name)}</strong><small>${escapeHtml(d.price)} · ${d.enabled===false?'oculto':'visible'}</small></span>`;b.onclick=()=>{editIndex=i;renderDishList();loadDishEditor()};list.appendChild(b)});loadDishEditor();}
  function loadDishEditor(){const d=config.dishes[editIndex];if(!d)return;const fields={name:'dish-name',meta:'dish-meta-edit',short:'dish-short-edit',price:'dish-price',ingredients:'dish-ingredients',origin:'dish-origin-edit',technique:'dish-technique',pairing:'dish-pairing',note:'dish-note',allergens:'dish-allergens'};Object.entries(fields).forEach(([key,id])=>$('#'+id).value=d[key]||'');$('#dish-enabled').checked=d.enabled!==false;const p=$('#dish-media-preview');p.innerHTML=`<img src="${resolveDishMedia(d)}" alt="">`;}
  function readDishFields(d){d.name=$('#dish-name').value;d.meta=$('#dish-meta-edit').value;d.short=$('#dish-short-edit').value;d.price=$('#dish-price').value;d.ingredients=$('#dish-ingredients').value;d.origin=$('#dish-origin-edit').value;d.technique=$('#dish-technique').value;d.pairing=$('#dish-pairing').value;d.note=$('#dish-note').value;d.allergens=$('#dish-allergens').value;d.enabled=$('#dish-enabled').checked;}
  function saveDishFields(){mutate(()=>readDishFields(config.dishes[editIndex]))}
  function addDish(){mutate(()=>{const n=config.dishes.length+1;config.dishes.push({id:`dish-${Date.now()}`,name:`New Dish ${n}`,meta:'Origin · Technique · Accent',short:'Describe the dish.',price:'€00',image:window.RestaurantDefaults.dishes[0].image,ingredients:'Ingredients',origin:'Origin',technique:'Technique',pairing:'Pairing',note:'Chef note',allergens:'Allergens',enabled:true});editIndex=config.dishes.length-1});showPanel('dishes')}
  function duplicateDish(){const d=config.dishes[editIndex];if(!d)return;mutate(()=>{const copy=clone(d);copy.id=`dish-${Date.now()}`;copy.name=`${copy.name} — copy`;copy.localMedia=false;config.dishes.splice(editIndex+1,0,copy);editIndex++})}
  function deleteDish(){if(config.dishes.length<=3)return alert('Mantén al menos 3 platos para conservar la experiencia orbital.');const d=config.dishes[editIndex];if(!confirm(`Eliminar ${d.name}?`))return;mutate(()=>{config.dishes.splice(editIndex,1);editIndex=Math.max(0,Math.min(editIndex,config.dishes.length-1))})}
  function moveDish(dir){const next=editIndex+dir;if(next<0||next>=config.dishes.length)return;mutate(()=>{[config.dishes[editIndex],config.dishes[next]]=[config.dishes[next],config.dishes[editIndex]];editIndex=next})}
  async function handleDishMedia(file){if(!file)return;if(!/^image\//.test(file.type))return alert('El menú orbital utiliza imagen 1:1. El vídeo se reserva para secciones editoriales.');const d=config.dishes[editIndex];snapshot();await RestaurantStore.saveMedia(d.id,file);if(objectUrls[d.id])URL.revokeObjectURL(objectUrls[d.id]);objectUrls[d.id]=URL.createObjectURL(file);d.localMedia=true;applyAll();scheduleSave();}

  function undo(){if(!history.length)return;future.push(JSON.stringify(config));config=JSON.parse(history.pop());applyAll();scheduleSave()}
  function redo(){if(!future.length)return;history.push(JSON.stringify(config));config=JSON.parse(future.pop());applyAll();scheduleSave()}
  function exportConfig(){const blob=new Blob([RestaurantStore.exportJSON({id:'restaurant-class4',config})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${slug(config.brand.name)}-restaurant-config.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  async function importConfig(e){const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=data.project?.config||data.config||data;mutate(()=>{config=merge(clone(window.RestaurantDefaults),incoming)});alert('Configuración importada. Los archivos multimedia locales se conservan por separado.')}catch(err){alert('JSON no válido.')}e.target.value=''}
  async function resetProject(){if(!confirm('Restaurar LÚMINA y eliminar media local de este proyecto?'))return;await RestaurantStore.clearMedia();await RestaurantStore.clearProject();Object.values(objectUrls).forEach(URL.revokeObjectURL);objectUrls={};config=clone(window.RestaurantDefaults);history=[];future=[];editIndex=0;applyAll();scheduleSave()}

  function setupReserve(){const dlg=$('#reserve-dialog');$$('.reserve-open').forEach(b=>b.onclick=()=>{if(config.visit.bookingUrl&&config.visit.bookingUrl!=='#'){window.open(config.visit.bookingUrl,'_blank','noopener');return}dlg.showModal()});$('.modal-close').onclick=()=>dlg.close();const date=$('input[type=date]',dlg);date.min=new Date().toISOString().split('T')[0];$('#reserve-form').onsubmit=e=>{e.preventDefault();$('#reserve-form').style.display='none';$('#reserve-success').style.display='block'}}
  function setupScroll(){$$('[data-reveal]').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 84%'}}));$$('.reveal-lines').forEach(el=>gsap.from(el,{y:55,opacity:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%'}}));$$('.parallax-card .section-media-element').forEach(img=>gsap.to(img,{yPercent:7,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}}));ScrollTrigger.create({start:0,end:'max',onUpdate:self=>gsap.set('.page-progress',{width:`${self.progress*100}%`})})}
  function setupCursor(){if(matchMedia('(pointer:fine)').matches){const c=$('.cursor'),label=$('.cursor span');document.addEventListener('mousemove',e=>gsap.to(c,{x:e.clientX,y:e.clientY,duration:.18,ease:'power2.out'}));document.addEventListener('mouseover',e=>{const hit=e.target.closest('.orbit-shell,.explore,.wide-image,.studio-open,.reserve-open');if(!hit)return;label.textContent=hit.classList.contains('orbit-shell')?'DRAG':hit.classList.contains('studio-open')?'EDIT':hit.classList.contains('reserve-open')?'RESERVE':hit.classList.contains('explore')?'EXPLORE':'VIEW';gsap.to(c,{scale:1,duration:.2})});document.addEventListener('mouseout',e=>{if(e.target.closest('.orbit-shell,.explore,.wide-image,.studio-open,.reserve-open'))gsap.to(c,{scale:0,duration:.2})})}}
  function bindGlobal(){document.addEventListener('visibilitychange',()=>{if(document.hidden&&autosaveTimer)scheduleSave()})}
  const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug=s=>String(s||'restaurant').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  boot();
})();