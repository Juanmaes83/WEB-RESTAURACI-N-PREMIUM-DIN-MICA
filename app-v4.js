/* LÚMINA · CLASS 04 · durable Restaurant Studio */
(() => {
  'use strict';
  if(!window.RestaurantDefaults||!window.RestaurantStore){console.error('Class 04 dependencies missing');return;}
  if(window.gsap&&window.ScrollTrigger&&window.Observer&&window.Flip) gsap.registerPlugin(ScrollTrigger,Observer,Flip);

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(base,over)=>{if(Array.isArray(base))return Array.isArray(over)?over:base;if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out;}return over===undefined?base:over;};
  const pathGet=(obj,path)=>path.split('.').reduce((a,k)=>a?.[k],obj);
  const pathSet=(obj,path,value)=>{const p=path.split('.'),last=p.pop(),target=p.reduce((a,k)=>(a[k]??={}),obj);target[last]=value;};
  const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug=s=>String(s||'restaurant').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  let config=clone(window.RestaurantDefaults), objectUrls={}, history=[], future=[], editIndex=0;
  let active=0,orbitProgress=0,orbitTween=null,dragging=false,dragStartX=0,lastPointerX=0,dragStartProgress=0,velocity=0,detailSource=null;
  let saveTimer=null, savingPromise=Promise.resolve();
  const enabledDishes=()=>config.dishes.filter(d=>d.enabled!==false);

  function setStatus(kind,text){const el=$('#studio-status');if(el){el.dataset.state=kind;el.textContent=text;}}
  async function saveNow(){
    clearTimeout(saveTimer);setStatus('saving','Guardando…');
    const payload={id:'restaurant-class4',schemaVersion:4,status:'draft',config:clone(config)};
    savingPromise=savingPromise.catch(()=>{}).then(()=>RestaurantStore.saveProject(payload));
    try{await savingPromise;setStatus('saved','Guardado ✓');return true}catch(err){console.error(err);setStatus('error','Error al guardar');return false}
  }
  function scheduleSave(delay=450){clearTimeout(saveTimer);setStatus('saving','Guardando…');saveTimer=setTimeout(saveNow,delay)}
  function snapshot(){history.push(JSON.stringify(config));if(history.length>50)history.shift();future=[];}
  function mutate(fn,{immediate=false}={}){snapshot();fn();applyAll();immediate?saveNow():scheduleSave()}

  async function boot(){
    setStatus('saving','Cargando proyecto…');
    try{
      const saved=await RestaurantStore.loadProject();
      if(saved?.config)config=merge(clone(RestaurantDefaults),saved.config);
      await hydrateMedia();
      bindStudio();bindGlobal();applyAll();setupOrbitInteraction();setupDetail();setupReserve();setupScroll();setupCursor();
      await RestaurantStore.verifyPersistence();
      setStatus('saved',saved?.config?'Proyecto restaurado ✓':'Listo · IndexedDB ✓');
    }catch(err){console.error('Class 04 boot error',err);bindStudio();applyAll();setStatus('error','Persistencia no disponible');}
  }

  async function hydrateMedia(){
    const slots=['logo','hero','origin','atmosphere','chef'];
    for(const slot of slots){
      try{const rec=await RestaurantStore.loadMedia(slot);if(rec?.file){replaceObjectUrl(slot,rec.file);config.media[slot]=config.media[slot]||{};config.media[slot].type=rec.kind||((rec.type||'').startsWith('video/')?'video':'image');config.media[slot].local=true;config.media[slot].name=rec.name;}}
      catch(err){console.warn('Media hydrate failed',slot,err)}
    }
    for(const dish of config.dishes){
      try{const rec=await RestaurantStore.loadMedia(dish.id);if(rec?.file){replaceObjectUrl(dish.id,rec.file);dish.localMedia=true;dish.mediaType='image';dish.mediaName=rec.name;}}
      catch(err){console.warn('Dish media hydrate failed',dish.id,err)}
    }
  }
  function replaceObjectUrl(key,blob){if(objectUrls[key])URL.revokeObjectURL(objectUrls[key]);objectUrls[key]=URL.createObjectURL(blob)}
  function resolveMedia(slot,fallback=''){return objectUrls[slot]||config.media?.[slot]?.url||fallback||''}
  function resolveDishMedia(d){return objectUrls[d.id]||d.image||''}
  function fallbackSvg(label='LÚMINA'){const text=escapeHtml(label).slice(0,22);return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><radialGradient id="g"><stop stop-color="#34352c"/><stop offset="1" stop-color="#090908"/></radialGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="400" cy="400" r="245" fill="#e6dfd1"/><circle cx="400" cy="400" r="172" fill="#191914"/><text x="400" y="415" fill="#e6dfd1" text-anchor="middle" font-family="Arial" font-size="26" letter-spacing="3">${text}</text></svg>`)}`}
  function safeImage(img,label){img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='1';img.src=fallbackSvg(label)}})}

  function renderMedia(slot,host){
    if(!host)return;const def=config.media?.[slot]||{},src=resolveMedia(slot);host.innerHTML='';
    if(!src){host.style.background='radial-gradient(circle at 50% 40%,#33342c,#090908 72%)';return}
    host.style.background='';const el=document.createElement(def.type==='video'?'video':'img');el.src=src;el.className='section-media-element';
    if(el.tagName==='VIDEO'){el.autoplay=true;el.muted=true;el.loop=true;el.playsInline=true;el.preload='metadata';el.addEventListener('error',()=>{host.innerHTML='';host.style.background='radial-gradient(circle,#292a23,#090908 72%)'})}
    else{el.alt=`${slot} visual`;safeImage(el,slot.toUpperCase())}
    el.style.objectFit=def.fit||'cover';el.style.objectPosition=def.position||'50% 50%';host.appendChild(el);
  }

  function applyAll(){
    document.documentElement.style.setProperty('--accent',config.brand.accent);document.documentElement.style.setProperty('--ink',config.brand.ink);document.documentElement.style.setProperty('--paper',config.brand.paper);
    $$('[data-brand]').forEach(el=>el.textContent=config.brand.name);
    const map={'hero-kicker':'hero.kicker','hero-line1':'hero.line1','hero-line2':'hero.line2','hero-body':'hero.body','hero-cta':'hero.cta','hero-stamp':'hero.stamp','scroll-hint':'hero.scroll','philosophy-index':'philosophy.index','philosophy-title':'philosophy.title','philosophy-body1':'philosophy.body1','philosophy-body2':'philosophy.body2','orbital-index':'orbital.index','orbital-kicker':'orbital.kicker','orbital-title':'orbital.title','explore-label':'orbital.explore','origin-index':'origin.index','origin-title':'origin.title','origin-body':'origin.body','origin-caption':'origin.caption','atmosphere-index':'atmosphere.index','atmosphere-title':'atmosphere.title','atmosphere-caption':'atmosphere.caption','atmosphere-body':'atmosphere.body','atmosphere-cta':'atmosphere.cta','chef-index':'chef.index','chef-title':'chef.title','chef-quote':'chef.quote','visit-kicker':'visit.kicker','visit-title':'visit.title','visit-cta':'visit.cta','address-label':'visit.addressLabel','address-text':'visit.address','service-label':'visit.serviceLabel','service-text':'visit.service','contact-label':'visit.contactLabel','contact-text':'visit.contact','footer-left':'footer.left','footer-center':'footer.center','footer-right':'footer.right'};
    Object.entries(map).forEach(([id,path])=>{const el=$('#'+id);if(el)el.textContent=pathGet(config,path)??''});
    const badges=$('#chef-badges');if(badges)badges.innerHTML=(config.chef.badges||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
    renderBrand();['hero','origin','atmosphere','chef'].forEach(slot=>renderMedia(slot,$(`[data-media-host="${slot}"]`)));buildOrbit();syncStudioInputs();renderDishList();renderMediaCards();document.title=`${config.brand.name} — Orbital Dining`;
  }
  function renderBrand(){const src=objectUrls.logo||config.media?.logo?.url;$$('.brand-visual').forEach(el=>{el.innerHTML=src?`<img src="${src}" alt="${escapeHtml(config.brand.name)}">`:`<span class="brand-dot"></span><span>${escapeHtml(config.brand.name)}</span>`;const img=$('img',el);if(img)safeImage(img,config.brand.name)})}

  function buildOrbit(){const stage=$('#orbit-stage'),dishes=enabledDishes();if(!stage||!dishes.length)return;active=Math.min(active,dishes.length-1);stage.innerHTML='';dishes.forEach((dish,i)=>{const b=document.createElement('button');b.type='button';b.className='orbit-dish';b.dataset.id=dish.id;b.innerHTML=`<img src="${resolveDishMedia(dish)}" alt="${escapeHtml(dish.name)}">`;safeImage($('img',b),dish.name);b.onclick=()=>{if(i===active)openDetail();else goToIndex(i)};stage.appendChild(b)});renderOrbit();updateCopy(true)}
  function continuousDistance(i){const n=enabledDishes().length;let d=i-orbitProgress;if(d>n/2)d-=n;if(d<-n/2)d+=n;return d}
  function renderOrbit(){const shell=$('.orbit-shell'),n=enabledDishes().length;if(!shell||!n)return;const mobile=innerWidth<620,rx=(mobile?.47:.40)*shell.clientWidth,ry=(mobile?.25:.27)*shell.clientHeight;$$('.orbit-dish').forEach((el,i)=>{const d=continuousDistance(i),a=d*Math.PI*2/n,front=(Math.cos(a)+1)/2,x=Math.sin(a)*rx,y=-(1-front)*ry*.85+Math.abs(Math.sin(a))*ry*.2,scale=.42+Math.pow(front,1.4)*(mobile?.76:.72),opacity=.22+front*.78,blur=(1-front)*4,brightness=.54+front*.5,rot=Math.sin(a)*5,z=Math.round(front*100);if(window.gsap)gsap.set(el,{xPercent:-50,yPercent:-50,x,y,scale,rotation:rot,opacity,filter:`blur(${blur}px) brightness(${brightness})`,zIndex:z});else{el.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale}) rotate(${rot}deg)`;el.style.opacity=opacity;el.style.filter=`blur(${blur}px) brightness(${brightness})`;el.style.zIndex=z}})}
  function nearestIndex(){const n=enabledDishes().length;return n?((Math.round(orbitProgress)%n)+n)%n:0}
  function syncActive(){const n=nearestIndex();if(n!==active){active=n;updateCopy()}}
  function goToIndex(index){const n=enabledDishes().length;let d=index-orbitProgress;while(d>n/2)d-=n;while(d<-n/2)d+=n;animateProgress(orbitProgress+d)}
  function animateProgress(target,duration=.7){orbitTween?.kill?.();if(window.gsap){const s={v:orbitProgress};orbitTween=gsap.to(s,{v:target,duration,ease:'power3.inOut',onUpdate(){orbitProgress=s.v;renderOrbit();syncActive()},onComplete(){orbitProgress=Math.round(target);renderOrbit();syncActive()}})}else{orbitProgress=Math.round(target);renderOrbit();syncActive()}}
  const next=()=>animateProgress(Math.round(orbitProgress)+1),prev=()=>animateProgress(Math.round(orbitProgress)-1);
  function updateCopy(){const d=enabledDishes()[active];if(!d)return;$('#dish-meta').textContent=d.meta||'';$('#dish-title').textContent=d.name||'';$('#dish-short').textContent=d.short||'';$('#dish-counter').textContent=`${String(active+1).padStart(2,'0')} / ${String(enabledDishes().length).padStart(2,'0')}`}
  function setupOrbitInteraction(){const shell=$('.orbit-shell');if(!shell)return;$('#next-dish').onclick=next;$('#prev-dish').onclick=prev;$('#explore-dish').onclick=openDetail;shell.addEventListener('keydown',e=>{if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev();if(e.key==='Enter')openDetail()});if(window.Observer)Observer.create({target:shell,type:'wheel',preventDefault:true,tolerance:12,onDown:next,onUp:prev});else shell.addEventListener('wheel',e=>{e.preventDefault();e.deltaY>0?next():prev()},{passive:false});shell.addEventListener('pointerdown',e=>{dragging=true;dragStartX=e.clientX;lastPointerX=e.clientX;dragStartProgress=orbitProgress;velocity=0;shell.setPointerCapture?.(e.pointerId);orbitTween?.kill?.()});shell.addEventListener('pointermove',e=>{if(!dragging)return;velocity=e.clientX-lastPointerX;lastPointerX=e.clientX;orbitProgress=dragStartProgress-(e.clientX-dragStartX)/(innerWidth<620?170:240);renderOrbit();syncActive()});const end=()=>{if(!dragging)return;dragging=false;animateProgress(Math.round(orbitProgress-velocity*.018),.55)};shell.addEventListener('pointerup',end);shell.addEventListener('pointercancel',end);addEventListener('resize',renderOrbit)}

  function fillDetail(d){[['detail-meta','meta'],['detail-title','name'],['detail-price','price'],['detail-description','short'],['detail-ingredients','ingredients'],['detail-origin','origin'],['detail-technique','technique'],['detail-pairing','pairing']].forEach(([id,k])=>{$('#'+id).textContent=d[k]||''});$('#detail-note').textContent=`“${d.note||''}”`;$('#detail-allergens').textContent=`Allergens · ${d.allergens||''}`}
  function openDetail(){const d=enabledDishes()[active],detail=$('#dish-detail'),source=$(`.orbit-dish[data-id="${d?.id}"]`);if(!d||!detail||!source)return;fillDetail(d);detailSource={node:source,parent:source.parentNode,next:source.nextSibling};const state=window.Flip?Flip.getState(source):null;$('#detail-visual').appendChild(source);detail.classList.add('is-open');detail.setAttribute('aria-hidden','false');document.body.classList.add('detail-open');if(state)Flip.from(state,{duration:.8,ease:'power4.inOut',absolute:true,scale:true});$('#detail-close').focus()}
  function closeDetail(){if(!detailSource)return;const detail=$('#dish-detail'),source=detailSource.node,state=window.Flip?Flip.getState(source):null;detailSource.parent.insertBefore(source,detailSource.next);const done=()=>{detail.classList.remove('is-open');detail.setAttribute('aria-hidden','true');document.body.classList.remove('detail-open');detailSource=null;renderOrbit()};state?Flip.from(state,{duration:.7,ease:'power3.inOut',absolute:true,scale:true,onComplete:done}):done()}
  function setupDetail(){if($('#detail-close'))$('#detail-close').onclick=closeDetail}

  function closeStudio(){window.RestaurantStudioShell?.close?.()}
  function bindStudio(){
    $$('.studio-nav button').forEach(btn=>btn.onclick=()=>showPanel(btn.dataset.panel));
    $$('[data-path]').forEach(input=>{const event=input.type==='color'?'input':'input';input.addEventListener(event,()=>{const value=input.type==='checkbox'?input.checked:input.value;mutate(()=>pathSet(config,input.dataset.path,value))})});
    $$('[data-preview-target]').forEach(btn=>btn.onclick=()=>{const target=$(btn.dataset.previewTarget);closeStudio();setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'start'}),120)});
    $$('.media-upload').forEach(input=>input.addEventListener('change',()=>handleMediaUpload(input.dataset.slot,input.files?.[0])));
    $('#dish-add').onclick=addDish;$('#dish-duplicate').onclick=duplicateDish;$('#dish-delete').onclick=deleteDish;$('#dish-up').onclick=()=>moveDish(-1);$('#dish-down').onclick=()=>moveDish(1);$('#dish-save').onclick=saveDishFields;$('#dish-media').addEventListener('change',()=>handleDishMedia($('#dish-media').files?.[0]));
    $('#undo-btn').onclick=undo;$('#redo-btn').onclick=redo;$('#export-config').onclick=exportConfig;$('#import-config').addEventListener('change',importConfig);$('#reset-config').onclick=resetProject;$('#preview-mode').addEventListener('change',e=>document.body.dataset.preview=e.target.value);
    $('#studio-scroll')?.addEventListener('click',async e=>{const btn=e.target.closest('[data-remove-media]');if(!btn)return;const slot=btn.dataset.removeMedia;await removeMedia(slot)});
  }
  function showPanel(name){$$('.studio-nav button').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));$$('.studio-panel').forEach(p=>p.hidden=p.dataset.panel!==name);if($('#studio-scroll'))$('#studio-scroll').scrollTop=0}
  function syncStudioInputs(){$$('[data-path]').forEach(input=>{const v=pathGet(config,input.dataset.path);if(v!==undefined&&document.activeElement!==input)input.value=v});if($('#studio-project-name'))$('#studio-project-name').textContent=config.brand.name}

  function renderMediaCards(){$$('.media-card').forEach(card=>{const slot=card.dataset.slot,preview=$('.media-preview',card),src=resolveMedia(slot),type=config.media?.[slot]?.type||'image';if(!preview)return;preview.innerHTML='';if(src){const el=document.createElement(type==='video'?'video':'img');el.src=src;if(type==='video'){el.muted=true;el.autoplay=true;el.loop=true;el.playsInline=true}else safeImage(el,slot.toUpperCase());preview.appendChild(el)}const state=$('.media-state',card);if(state)state.textContent=objectUrls[slot]?'Guardado local ✓':'Placeholder';if(!card.querySelector('[data-remove-media]')){const b=document.createElement('button');b.type='button';b.dataset.removeMedia=slot;b.className='media-remove';b.textContent='Restaurar placeholder';card.appendChild(b)}})}
  async function handleMediaUpload(slot,file){if(!slot||!file)return;if(!/^image\//.test(file.type)&&!/^video\//.test(file.type)){alert('Selecciona una imagen o vídeo válido.');return}setStatus('saving','Guardando media…');try{snapshot();await RestaurantStore.saveMedia(slot,file,{fit:config.media?.[slot]?.fit,position:config.media?.[slot]?.position});replaceObjectUrl(slot,file);config.media[slot]=config.media[slot]||{};config.media[slot].type=file.type.startsWith('video/')?'video':'image';config.media[slot].local=true;config.media[slot].name=file.name;applyAll();await saveNow();setStatus('saved','Media guardada ✓')}catch(err){console.error(err);setStatus('error','Error guardando media');alert('No se pudo guardar el archivo en IndexedDB.')}}
  async function removeMedia(slot){try{await RestaurantStore.deleteMedia(slot);if(objectUrls[slot]){URL.revokeObjectURL(objectUrls[slot]);delete objectUrls[slot]}if(config.media?.[slot]){config.media[slot].local=false;delete config.media[slot].name}applyAll();await saveNow()}catch(err){console.error(err)}}

  function renderDishList(){const list=$('#studio-dish-list');if(!list)return;list.innerHTML='';config.dishes.forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.className='studio-dish-item'+(i===editIndex?' active':'');b.innerHTML=`<img src="${resolveDishMedia(d)}" alt=""><span><strong>${String(i+1).padStart(2,'0')} · ${escapeHtml(d.name)}</strong><small>${escapeHtml(d.price)} · ${d.enabled===false?'oculto':'visible'}${d.localMedia?' · media guardada':''}</small></span>`;safeImage($('img',b),d.name);b.onclick=()=>{editIndex=i;renderDishList()};list.appendChild(b)});loadDishEditor()}
  function loadDishEditor(){const d=config.dishes[editIndex];if(!d)return;const fields={name:'dish-name',meta:'dish-meta-edit',short:'dish-short-edit',price:'dish-price',ingredients:'dish-ingredients',origin:'dish-origin-edit',technique:'dish-technique',pairing:'dish-pairing',note:'dish-note',allergens:'dish-allergens'};Object.entries(fields).forEach(([k,id])=>{if($('#'+id))$('#'+id).value=d[k]||''});if($('#dish-enabled'))$('#dish-enabled').checked=d.enabled!==false;const p=$('#dish-media-preview');if(p){p.innerHTML=`<img src="${resolveDishMedia(d)}" alt="">`;safeImage($('img',p),d.name)}}
  function readDishFields(d){d.name=$('#dish-name').value;d.meta=$('#dish-meta-edit').value;d.short=$('#dish-short-edit').value;d.price=$('#dish-price').value;d.ingredients=$('#dish-ingredients').value;d.origin=$('#dish-origin-edit').value;d.technique=$('#dish-technique').value;d.pairing=$('#dish-pairing').value;d.note=$('#dish-note').value;d.allergens=$('#dish-allergens').value;d.enabled=$('#dish-enabled').checked}
  function saveDishFields(){mutate(()=>readDishFields(config.dishes[editIndex]),{immediate:true})}
  function addDish(){mutate(()=>{const n=config.dishes.length+1;config.dishes.push({id:`dish-${Date.now()}`,name:`New Dish ${n}`,meta:'Origin · Technique · Accent',short:'Describe the dish.',price:'€00',image:RestaurantDefaults.dishes[0].image,ingredients:'Ingredients',origin:'Origin',technique:'Technique',pairing:'Pairing',note:'Chef note',allergens:'Allergens',enabled:true});editIndex=config.dishes.length-1});showPanel('dishes')}
  function duplicateDish(){const d=config.dishes[editIndex];if(!d)return;mutate(()=>{const copy=clone(d);copy.id=`dish-${Date.now()}`;copy.name=`${copy.name} — copy`;copy.localMedia=false;config.dishes.splice(editIndex+1,0,copy);editIndex++})}
  async function deleteDish(){if(config.dishes.length<=3){alert('Mantén al menos 3 platos para conservar la experiencia orbital.');return}const d=config.dishes[editIndex];if(!confirm(`Eliminar ${d.name}?`))return;await RestaurantStore.deleteMedia(d.id).catch(()=>{});if(objectUrls[d.id]){URL.revokeObjectURL(objectUrls[d.id]);delete objectUrls[d.id]}mutate(()=>{config.dishes.splice(editIndex,1);editIndex=Math.max(0,Math.min(editIndex,config.dishes.length-1))},{immediate:true})}
  function moveDish(dir){const next=editIndex+dir;if(next<0||next>=config.dishes.length)return;mutate(()=>{[config.dishes[editIndex],config.dishes[next]]=[config.dishes[next],config.dishes[editIndex]];editIndex=next})}
  async function handleDishMedia(file){if(!file)return;if(!/^image\//.test(file.type)){alert('El menú orbital utiliza imagen 1:1.');return}const d=config.dishes[editIndex];setStatus('saving','Guardando plato…');try{snapshot();await RestaurantStore.saveMedia(d.id,file);replaceObjectUrl(d.id,file);d.localMedia=true;d.mediaName=file.name;applyAll();await saveNow();setStatus('saved','Imagen de plato guardada ✓')}catch(err){console.error(err);setStatus('error','Error guardando plato')}}

  function undo(){if(!history.length)return;future.push(JSON.stringify(config));config=JSON.parse(history.pop());applyAll();scheduleSave(0)}
  function redo(){if(!future.length)return;history.push(JSON.stringify(config));config=JSON.parse(future.pop());applyAll();scheduleSave(0)}
  function exportConfig(){const blob=new Blob([RestaurantStore.exportJSON({id:'restaurant-class4',config})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${slug(config.brand.name)}-restaurant-config.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  async function importConfig(e){const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text()),incoming=data.project?.config||data.config||data;snapshot();config=merge(clone(RestaurantDefaults),incoming);applyAll();await saveNow();alert('Configuración importada y guardada.')}catch(err){console.error(err);alert('JSON no válido.')}e.target.value=''}
  async function resetProject(){if(!confirm('Restaurar LÚMINA y eliminar media local?'))return;await RestaurantStore.clearMedia();await RestaurantStore.clearProject();Object.values(objectUrls).forEach(URL.revokeObjectURL);objectUrls={};config=clone(RestaurantDefaults);history=[];future=[];editIndex=0;applyAll();await saveNow()}

  function setupReserve(){const dlg=$('#reserve-dialog');$$('.reserve-open').forEach(b=>b.onclick=()=>{if(config.visit.bookingUrl&&config.visit.bookingUrl!=='#'){window.open(config.visit.bookingUrl,'_blank','noopener');return}dlg?.showModal?.()});if($('.modal-close'))$('.modal-close').onclick=()=>dlg?.close?.();const date=dlg?$('input[type=date]',dlg):null;if(date)date.min=new Date().toISOString().split('T')[0];if($('#reserve-form'))$('#reserve-form').onsubmit=e=>{e.preventDefault();$('#reserve-form').style.display='none';$('#reserve-success').style.display='block'}}
  function setupScroll(){if(!window.gsap||!window.ScrollTrigger)return;$$('[data-reveal]').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 84%'}}));$$('.reveal-lines').forEach(el=>gsap.from(el,{y:55,opacity:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%'}}));ScrollTrigger.create({start:0,end:'max',onUpdate:self=>gsap.set('.page-progress',{width:`${self.progress*100}%`})})}
  function setupCursor(){if(!window.gsap||!matchMedia('(pointer:fine)').matches)return;const c=$('.cursor'),label=$('.cursor span');if(!c)return;document.addEventListener('mousemove',e=>gsap.to(c,{x:e.clientX,y:e.clientY,duration:.18,ease:'power2.out'}));document.addEventListener('mouseover',e=>{const hit=e.target.closest('.orbit-shell,.explore,.wide-image,.studio-open,.reserve-open');if(!hit)return;label.textContent=hit.classList.contains('orbit-shell')?'DRAG':hit.classList.contains('studio-open')?'EDIT':hit.classList.contains('reserve-open')?'RESERVE':hit.classList.contains('explore')?'EXPLORE':'VIEW';gsap.to(c,{scale:1,duration:.2})});document.addEventListener('mouseout',e=>{if(e.target.closest('.orbit-shell,.explore,.wide-image,.studio-open,.reserve-open'))gsap.to(c,{scale:0,duration:.2})})}
  function bindGlobal(){document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#dish-detail')?.classList.contains('is-open'))closeDetail()});document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});window.addEventListener('pagehide',()=>{if(saveTimer)saveNow()});window.addEventListener('beforeunload',()=>Object.values(objectUrls).forEach(u=>{try{URL.revokeObjectURL(u)}catch{}}))}

  boot();
})();
