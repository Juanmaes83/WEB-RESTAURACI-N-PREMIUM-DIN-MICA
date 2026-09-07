/* CLASS 12 · PROJECT 07 PREMIUM — PRODUCT DISCOVERY LAYER

   Project 07's motion engine is APPROVED and is not rebuilt here. This file adds the
   product world around it and owns PRESENTATION AND COMMERCE ONLY:

     headline · ingredients · descriptor · chromatic world · background typography ·
     hero emphasis · copy-to-station bridge · contextual CTA · personalization ·
     asset replacement · order / reservation adapters

   It never writes rotationProgress, never touches registration, never moves the
   station and never keeps a selected product of its own. It reads
   window.RestaurantPizzaSliceOrbit.state() — the engine's own active index derived
   from its own single scalar — through a read-only subscription, and derives
   everything from that. If it disagreed with the orbit it would be a bug in here.

   Story data comes from RestaurantDefaults.pizzaSliceOrbit (Studio-editable,
   persisted by the existing project state) and is joined to the slice geometry in
   slices-manifest.json by `id`. Geometry stays generated; story stays authored.
*/
(() => {
  'use strict';
  const MODE='pizza-slice-orbit';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NS='pizzaSliceOrbit';

  /* Phase thresholds in progress units per second. The engine does not publish a
     phase; speed is measured here from the progress it reports, so the choreography
     is derived rather than a second state machine. */
  const FAST=3.2, SLOWING=.55;

  let root=document.documentElement,section=null,shell=null;
  let world=null,bgType=null,editorial=null,bridge=null,cta=null,stage=null;
  let elOverline=null,elLead=null,elName=null,elTail=null,elDescriptor=null,elIngredients=null;
  let elBgWord=null,elBgIndex=null,elBgName=null,elPrice=null,elCounter=null;
  let btnOrder=null,btnReserve=null;
  let unsub=null,ready=false,mounted=false;
  let lastProgress=null,lastAt=0,speed=0,phase='idle',lastIndex=-1;
  let profileCache=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  const engine=()=>window.RestaurantPizzaSliceOrbit;
  const isPizza=()=>root.dataset.orbitalMotion===MODE;
  const isMobile=()=>innerWidth<820;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const hex2rgb=h=>{const v=String(h||'').replace('#','');
    const n=v.length===3?v.split('').map(c=>c+c).join(''):v;const i=parseInt(n,16);
    return Number.isFinite(i)?[i>>16&255,i>>8&255,i&255]:[216,255,79]};
  const rgba=(h,a)=>`rgba(${hex2rgb(h).join(',')},${a})`;

  /* ---------- data ---------- */
  /* The LIVE project config, not the defaults template. Studio edits mutate app-v4's
     working copy; RestaurantDefaults stays as authored, so reading it would show the
     original values forever and make every personalization control look broken. */
  function config(){
    const live=window.RestaurantStudioConfig?.get?.(NS);
    return live||window.RestaurantDefaults?.[NS]||{brand:{},products:[]};
  }
  function profile(){
    const b=config().brand||{};
    profileCache={
      restaurantName:b.restaurantName||'',
      collectionName:b.collectionName||'Pizza selection',
      accent:b.accent||'#d8ff4f',
      perProductWorlds:b.perProductWorlds!==false,
      backgroundTypography:b.backgroundTypography!==false,
      ctaPriority:b.ctaPriority==='reserve'?'reserve':'order',
      orderUrl:(b.orderUrl||'').trim(),
      reservationUrl:(b.reservationUrl||'').trim()
    };
    return profileCache;
  }
  function productAt(index){
    const list=config().products||[];
    const st=engine()?.state?.();
    /* join by id when the engine can name the slice, so a reordered manifest cannot
       silently pair a story with the wrong pizza */
    if(st&&st.activeId&&index===st.activeIndex){
      const byId=list.find(p=>p.id===st.activeId);
      if(byId)return byId;
    }
    return list[index]||null;
  }
  /* The palette is a product personality inside ONE system: only accent, glow and
     the soft world grounds change. Brand and architecture stay put. */
  function paletteFor(product){
    const p=profile();
    if(!product)return {accent:p.accent,a:'#0b0a08',b:'#050505',glow:rgba(p.accent,.18),mood:''};
    if(!p.perProductWorlds)
      return {accent:p.accent,a:'#0b0a08',b:'#050505',glow:rgba(p.accent,.18),mood:product.mood||''};
    const bg=product.background||{};
    return {accent:product.accent||p.accent,
      a:bg.a||'#0b0a08',b:bg.b||'#050505',
      glow:bg.glow||rgba(product.accent||p.accent,.20),
      mood:product.mood||''};
  }

  /* ---------- build ---------- */
  function ensureStyles(){
    if($('link[data-pizza-premium-styles]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='styles-v12.css';l.dataset.pizzaPremiumStyles='1';
    document.head.appendChild(l);
  }

  function ensureLayers(){
    section=section||$('.orbital-section');
    shell=shell||$('.orbit-shell');
    stage=stage||$('.ps-stage');
    if(!section||!shell)return false;

    if(!world?.isConnected){
      world=document.createElement('div');world.className='pp-world';world.setAttribute('aria-hidden','true');
      section.insertBefore(world,section.firstChild);
    }
    /* Background typography sits behind the orbit: three depths, all low contrast. */
    if(!bgType?.isConnected){
      bgType=document.createElement('div');bgType.className='pp-bgtype';bgType.setAttribute('aria-hidden','true');
      bgType.innerHTML='<span class="pp-bg-word"></span>'
        +'<span class="pp-bg-index"></span>'
        +'<span class="pp-bg-name"></span>';
      section.insertBefore(bgType,world.nextSibling);
    }
    elBgWord=$('.pp-bg-word',bgType);elBgIndex=$('.pp-bg-index',bgType);elBgName=$('.pp-bg-name',bgType);

    if(!editorial?.isConnected){
      editorial=document.createElement('div');editorial.className='pp-editorial';
      editorial.innerHTML=
         '<p class="pp-overline"></p>'
        +'<h3 class="pp-headline"><span class="pp-lead"></span>'
        +'<span class="pp-name"></span></h3>'
        +'<p class="pp-tail"></p>'
        +'<p class="pp-descriptor"></p>'
        +'<p class="pp-counter"></p>'
        +'<div class="pp-ingredients"><span class="pp-ing-label">Ingredients</span>'
        +'<p class="pp-ing-list"></p><span class="pp-demo-note">Demo content</span></div>'
        +'<p class="pp-price"></p>';
      section.insertBefore(editorial,shell);
    }
    elOverline=$('.pp-overline',editorial);elLead=$('.pp-lead',editorial);
    elName=$('.pp-name',editorial);elTail=$('.pp-tail',editorial);
    elDescriptor=$('.pp-descriptor',editorial);elIngredients=$('.pp-ing-list',editorial);
    elPrice=$('.pp-price',editorial);elCounter=$('.pp-counter',editorial);

    /* The bridge links the editorial column to the fixed station so the two do not
       read as unrelated columns. It is a line and a marker, not decoration. */
    if(!bridge?.isConnected){
      bridge=document.createElement('div');bridge.className='pp-bridge';bridge.setAttribute('aria-hidden','true');
      bridge.innerHTML='<span class="pp-bridge-line"></span><span class="pp-bridge-dot"></span>';
      section.insertBefore(bridge,shell);
    }

    if(!cta?.isConnected){
      cta=document.createElement('div');cta.className='pp-cta';
      cta.innerHTML='<button type="button" class="pp-btn pp-order"></button>'
        +'<button type="button" class="pp-btn pp-reserve">Reserve table</button>'
        +'<p class="pp-commerce-note" role="status" aria-live="polite"></p>';
      const controls=$('.ps-controls',section);
      controls?controls.insertAdjacentElement('afterend',cta):section.appendChild(cta);
    }
    btnOrder=$('.pp-order',cta);btnReserve=$('.pp-reserve',cta);
    return true;
  }

  /* ---------- the world and the copy, from the engine's index ---------- */
  function paintProduct(index,{animate=true}={}){
    const product=productAt(index);
    const pal=paletteFor(product);
    const p=profile();
    const n=engine()?.state?.().count||8;

    root.style.setProperty('--ps-accent',pal.accent);
    root.style.setProperty('--pp-accent',pal.accent);
    root.style.setProperty('--pp-glow',pal.glow);
    if(world){
      world.style.background=[
        `radial-gradient(ellipse 58% 44% at 50% 22%, ${pal.glow} 0%, transparent 64%)`,
        `radial-gradient(ellipse 74% 52% at 50% 96%, ${rgba(pal.accent,.07)} 0%, transparent 72%)`,
        `linear-gradient(176deg, ${pal.a} 0%, ${pal.b} 68%, ${pal.a} 100%)`
      ].join(',');
    }

    if(!product)return;
    const set=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};
    set(elOverline,product.headlineOverline||'');
    set(elLead,product.headlineLead||'');
    set(elName,product.name||'');
    set(elTail,product.headlineTail||'');
    set(elDescriptor,[pal.mood,product.descriptor].filter(Boolean).join(' · '));
    /* The counter came from the engine's own head block, which the premium editorial
       replaces — it is rebuilt here from the same index rather than dropped. */
    set(elCounter,`${String(index+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`);
    set(elIngredients,product.ingredients||'');
    /* A null price is never rendered as a number: no price is more honest than an
       invented one, and every demo product ships with price null. */
    if(elPrice){
      const hasPrice=product.price!==null&&product.price!==undefined&&String(product.price).trim()!=='';
      elPrice.textContent=hasPrice?String(product.price):'';
      elPrice.hidden=!hasPrice;
    }
    if(editorial)editorial.dataset.demo=product.demoContent?'1':'0';

    set(elBgWord,p.backgroundTypography?(pal.mood||product.name||''):'');
    set(elBgIndex,p.backgroundTypography?String(index+1).padStart(2,'0'):'');
    set(elBgName,p.backgroundTypography?(product.name||''):'');

    if(btnOrder)btnOrder.textContent=`Order ${product.name}`;
    if(cta)cta.dataset.priority=p.ctaPriority;
    /* A commerce note belongs to the product it was raised for: leaving it under the
       next one reads as a message about that product, which it is not. */
    if(animate)note('');

    if(animate&&!reduced.matches&&editorial){
      /* the copy hands over as a block: the whole story belongs to one slice */
      editorial.classList.remove('pp-handoff');
      void editorial.offsetWidth;
      editorial.classList.add('pp-handoff');
      if(bgType){
        bgType.classList.remove('pp-handoff');
        void bgType.offsetWidth;
        bgType.classList.add('pp-handoff');
      }
    }
  }

  /* ---------- choreography ----------
     Derived from the engine's progress, never from a timer of its own. While the
     orbit is travelling fast the story simplifies; as it decelerates the story comes
     back; on settle everything lands together. */
  function computePhase(st){
    const now=performance.now();
    if(lastProgress!==null){
      const dt=Math.max(16,now-lastAt)/1000;
      const inst=Math.abs(st.progress-lastProgress)/dt;
      speed=speed*.55+inst*.45;
    }
    lastProgress=st.progress;lastAt=now;

    if(st.dragging)return 'drag';
    if(st.spinning)return speed>FAST?'fast':(speed>SLOWING?'decelerating':'resolving');
    if(st.animating)return speed>FAST?'fast':'resolving';
    return 'settled';
  }

  function applyPhase(ph){
    if(phase===ph)return;
    phase=ph;
    root.dataset.pizzaPhase=ph;
    /* one class on the section drives every layer's response, so the phases cannot
       drift apart between the copy, the typography and the bridge */
    if(section)section.dataset.ppPhase=ph;
  }

  function onFrame(){
    if(!isPizza())return;
    const st=engine()?.state?.();
    if(!st)return;
    applyPhase(computePhase(st));
    /* the background typography tracks the fractional progress: a slight parallax
       while dragging, a streak while spinning */
    if(bgType){
      const frac=st.progress-Math.round(st.progress);
      bgType.style.setProperty('--pp-drift',`${(frac*(isMobile()?14:26)).toFixed(2)}px`);
      bgType.style.setProperty('--pp-speed',clamp(speed/FAST,0,1).toFixed(3));
    }
    /* Point the bridge at where the station actually is. A percentage guess leaves it
       terminating in empty space as soon as the grid or the hub changes. */
    if(bridge&&section){
      const st2=$('.ps-station');
      if(st2){
        const sr=section.getBoundingClientRect(),tr=st2.getBoundingClientRect();
        if(tr.width>1){
          const left=Math.max(section.clientWidth*.06,0);
          const endX=tr.left-sr.left;
          bridge.style.setProperty('--pp-bridge-left',`${left.toFixed(1)}px`);
          bridge.style.setProperty('--pp-bridge-top',`${(tr.top-sr.top+tr.height*.82).toFixed(1)}px`);
          bridge.style.setProperty('--pp-bridge-width',`${Math.max(0,endX-left-8).toFixed(1)}px`);
        }
      }
    }
    if(st.activeIndex!==lastIndex){
      lastIndex=st.activeIndex;
      paintProduct(st.activeIndex,{animate:true});
    }
  }

  /* ---------- commerce ----------
     A real integration path that never pretends to have completed a transaction. */
  function emit(name,detail){
    try{dispatchEvent(new CustomEvent(name,{detail}))}catch(e){}
  }
  function commercePayload(action){
    const st=engine()?.state?.()||{};
    const product=productAt(st.activeIndex);
    return {productId:product?.id||null,productName:product?.name||null,
      activeIndex:typeof st.activeIndex==='number'?st.activeIndex:null,
      action,source:'pizza-slice-orbit'};
  }
  function note(text){
    const el=$('.pp-commerce-note',cta||document);
    if(el)el.textContent=text||'';
  }
  function openWithContext(url,payload){
    try{
      const u=new URL(url,location.href);
      u.searchParams.set('source',payload.source);
      if(payload.productId)u.searchParams.set('product',payload.productId);
      if(payload.productName)u.searchParams.set('name',payload.productName);
      u.searchParams.set('action',payload.action);
      window.open(u.toString(),'_blank','noopener');
      return true;
    }catch(e){return false}
  }
  function requestOrder(){
    const payload=commercePayload('order');
    const product=productAt(payload.activeIndex);
    const url=(product?.orderUrl||'').trim()||profile().orderUrl;
    emit('pizza:commerce-intent',payload);
    emit('pizza:order-request',payload);
    if(url&&openWithContext(url,payload)){
      note(`Opening order for ${payload.productName}`);
      return {...payload,opened:true,url};
    }
    /* No URL configured: the intent is recorded and the visitor is told the truth.
       Nothing is confirmed, nothing is sent, no backend is simulated. */
    note(`Order intent registered for ${payload.productName}. No ordering endpoint is configured yet.`);
    return {...payload,opened:false,url:null};
  }
  function requestReservation(){
    const payload=commercePayload('reservation');
    const url=profile().reservationUrl;
    emit('pizza:commerce-intent',payload);
    emit('pizza:reservation-request',payload);
    if(url&&openWithContext(url,payload)){
      note('Opening reservations');
      return {...payload,opened:true,url};
    }
    note('Reservation intent registered. No reservation endpoint is configured yet.');
    return {...payload,opened:false,url:null};
  }

  /* ---------- asset replacement ----------
     A restaurant may supply its own eight slices, but an arbitrary image cannot go
     straight into the hero: the whole illusion depends on registration. So an upload
     is MEASURED here with the same method as the ingest pipeline, and it is only
     accepted if it produces a wedge that fits the station. Otherwise it is stored as
     pending and the production set is left alone. */
  function measureSlice(img){
    const W=img.naturalWidth,H=img.naturalHeight;
    if(!W||!H)return null;
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0);
    let d;
    try{d=x.getImageData(0,0,W,H).data}catch(e){return null}
    const A=(px,py)=>d[(py*W+px)*4+3];
    const SOLID=28;
    let x0=W,x1=-1,y0=H,y1=-1,mass=0;
    for(let py=0;py<H;py++)for(let px=0;px<W;px++)
      if(A(px,py)>SOLID){if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;mass++}
    if(mass<W*H*.02)return null;
    const rowSpan=py=>{let a=-1,b=-1;for(let px=0;px<W;px++)if(A(px,py)>SOLID){if(a<0)a=px;b=px}
      return a<0?null:{a,b,mid:(a+b)/2,w:b-a+1}};
    const hgt=y1-y0+1,band=Math.max(2,Math.round(hgt*.02));
    let ax=0,an=0;
    for(let py=y1;py>y1-band;py--){const r=rowSpan(py);if(r){ax+=r.mid;an++}}
    const apex={x:ax/Math.max(1,an),y:y1};
    let cxs=0,cn=0;
    for(let py=y0;py<y0+band;py++){const r=rowSpan(py);if(r){cxs+=r.mid;cn++}}
    const crust={x:cxs/Math.max(1,cn),y:y0};
    let widest=0;
    for(let py=y0;py<=y1;py+=2){const r=rowSpan(py);if(r&&r.w>widest)widest=r.w}
    const length=Math.hypot(crust.x-apex.x,crust.y-apex.y);
    if(length<H*.25)return null;
    return {W,H,apex,crust,length,
      axisDeg:Math.atan2(crust.x-apex.x,apex.y-crust.y)*180/Math.PI,
      halfAngleDeg:Math.asin(Math.min(1,(widest/2)/length))*180/Math.PI};
  }
  async function registerUpload(file){
    const canon=engine()?.state?.().canonical;
    if(!canon)return {ok:false,reason:'The orbit is not ready yet.'};
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((res,rej)=>{
        const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('decode'));i.src=url;
      });
      const m=measureSlice(img);
      if(!m)return {ok:false,reason:'Asset requires registration: no usable transparent wedge was found.'};
      if(m.halfAngleDeg>canon.halfAngleDeg)
        return {ok:false,reason:`Asset requires registration: the wedge opens ${m.halfAngleDeg.toFixed(1)}° `
          +`and the station accepts up to ${canon.halfAngleDeg.toFixed(1)}°.`,measured:m};
      /* it fits: hand back the registration the renderer would need */
      return {ok:true,measured:m,
        registration:{
          scale:+(canon.length/m.length).toFixed(5),
          offsetX:+((canon.apex.x-m.apex.x)/m.W).toFixed(5),
          offsetY:+((canon.apex.y-m.apex.y)/m.H).toFixed(5),
          rotationBias:+(-m.axisDeg).toFixed(3),
          apex:{x:+(m.apex.x/m.W).toFixed(5),y:+(m.apex.y/m.H).toFixed(5)}
        }};
    }catch(e){
      return {ok:false,reason:'Asset requires registration: the file could not be decoded.'};
    }finally{URL.revokeObjectURL(url)}
  }

  /* ---------- Studio personalization ----------
     Uses the Studio's own data-path binding, so text settings persist through the
     existing project state and travel with import/export. No parallel settings
     system, and the Motion panel is left exactly as it is — this appends a card. */
  function ensureStudioPanel(){
    const panel=$('.studio-panel.motion-panel');
    if(!panel||$('.pp-studio',panel))return;
    const list=config().products||[];
    const card=document.createElement('article');
    card.className='motion-card pp-studio';
    card.innerHTML=`
      <div class="motion-card-head">
        <div><span class="motion-number">07</span><strong>Pizza Slice Orbit</strong></div>
        <span class="motion-badge">PREMIUM</span>
      </div>
      <p>Personaliza la experiencia de descubrimiento: marca, mundos de color, comercio
         y las ocho porciones. Los datos de demo están marcados como tal.</p>
      <label>Nombre del restaurante<input type="text" data-path="${NS}.brand.restaurantName"></label>
      <label>Nombre de la colección<input type="text" data-path="${NS}.brand.collectionName"></label>
      <label>Acento de marca<input type="color" data-path="${NS}.brand.accent"></label>
      <label class="pp-check"><input type="checkbox" data-path="${NS}.brand.perProductWorlds">
        Mundo de color por pizza</label>
      <label class="pp-check"><input type="checkbox" data-path="${NS}.brand.backgroundTypography">
        Tipografía de fondo</label>
      <label>Acción principal
        <select data-path="${NS}.brand.ctaPriority">
          <option value="order">Order</option>
          <option value="reserve">Reserve</option>
        </select></label>
      <label>Order URL<input type="url" data-path="${NS}.brand.orderUrl" placeholder="https://…"></label>
      <label>Reservation URL<input type="url" data-path="${NS}.brand.reservationUrl" placeholder="https://…"></label>

      <details class="pp-products">
        <summary>Las ocho porciones</summary>
        ${list.map((p,i)=>`
          <fieldset class="pp-product">
            <legend>${String(i+1).padStart(2,'0')} · ${p.name}</legend>
            <label>Nombre<input type="text" data-path="${NS}.products.${i}.name"></label>
            <label>Ingredientes<input type="text" data-path="${NS}.products.${i}.ingredients"></label>
            <label>Descriptor<input type="text" data-path="${NS}.products.${i}.descriptor"></label>
            <label>Mood<input type="text" data-path="${NS}.products.${i}.mood"></label>
            <label>Acento<input type="color" data-path="${NS}.products.${i}.accent"></label>
            <label>Precio (vacío = sin precio)<input type="text" data-path="${NS}.products.${i}.price" placeholder="—"></label>
            <label>Order URL<input type="url" data-path="${NS}.products.${i}.orderUrl" placeholder="https://…"></label>
          </fieldset>`).join('')}
      </details>

      <details class="pp-assets">
        <summary>Assets del restaurante</summary>
        <p class="pp-assets-note">Una porción subida <strong>no entra en producción sin registro</strong>:
           se mide su alfa, su ápice, su eje y su apertura, y sólo se acepta si encaja en la
           misma estación. El logo y la atmósfera no afectan al motor.</p>
        <label>Porción (PNG con transparencia)
          <input type="file" class="pp-upload-slice" accept="image/png,image/webp"></label>
        <label>Logo / wordmark<input type="file" class="pp-upload-logo" accept="image/*"></label>
        <label>Atmósfera de fondo<input type="file" class="pp-upload-atmo" accept="image/*"></label>
        <p class="pp-asset-status" role="status" aria-live="polite"></p>
      </details>`;
    panel.appendChild(card);

    /* Studio binds [data-path] once at boot, so inputs added later are wired here —
       through the same mutate/persist path, not a private store. */
    $$('[data-path]',card).forEach(input=>{
      const path=input.dataset.path;
      const apply=()=>{
        const value=input.type==='checkbox'?input.checked
          :(input.type==='text'&&/\.price$/.test(path)&&input.value.trim()===''?null:input.value);
        window.RestaurantStudioConfig?.set?.(path,value);
      };
      input.addEventListener('input',apply);
      input.addEventListener('change',apply);
    });
    syncStudioPanel();

    const status=t=>{const el=$('.pp-asset-status',card);if(el)el.textContent=t};
    $('.pp-upload-slice',card)?.addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      status('Measuring…');
      const res=await registerUpload(file);
      if(!res.ok){status(res.reason);e.target.value='';return}
      try{
        await window.RestaurantStore?.saveMedia?.('pizza-slice-pending',file,
          {kind:'pizza-slice',registration:res.registration,measured:res.measured,accepted:false});
        status('Registration passed. Stored as a pending slice — the production set is '
          +'unchanged until the ingest pipeline emits its runtime asset.');
      }catch(err){status('Registration passed, but the asset could not be stored.')}
    });
    const simpleUpload=(sel,slot,label)=>{
      $(sel,card)?.addEventListener('change',async e=>{
        const file=e.target.files?.[0];if(!file)return;
        try{
          await window.RestaurantStore?.saveMedia?.(slot,file,{kind:slot});
          status(`${label} stored.`);
        }catch(err){status(`${label} could not be stored.`)}
      });
    };
    simpleUpload('.pp-upload-logo','pizza-brand-logo','Logo');
    simpleUpload('.pp-upload-atmo','pizza-brand-atmosphere','Atmosphere');
  }

  function syncStudioPanel(){
    const card=$('.pp-studio');
    if(!card)return;
    $$('[data-path]',card).forEach(input=>{
      const v=window.RestaurantStudioConfig?.get?.(input.dataset.path);
      if(document.activeElement===input)return;
      if(input.type==='checkbox')input.checked=v!==false;
      else input.value=v===null||v===undefined?'':v;
    });
  }

  /* ---------- activation ---------- */
  function bind(){
    if(mounted)return;
    mounted=true;
    btnOrder?.addEventListener('click',()=>requestOrder());
    btnReserve?.addEventListener('click',()=>requestReservation());
    addEventListener('resize',()=>{if(isPizza())onFrame()});
  }

  function activate(){
    ensureStyles();
    if(isPizza()){
      if(!engine()?.state)return;
      if(!ensureLayers())return;
      ensureStudioPanel();
      bind();
      if(!unsub)unsub=engine().subscribe(onFrame);
      lastIndex=-1;lastProgress=null;speed=0;phase='';
      const st=engine().state();
      paintProduct(st.activeIndex,{animate:false});
      lastIndex=st.activeIndex;
      applyPhase('settled');
      root.dataset.pizzaPremium='ready';
    }else{
      unsub?.();unsub=null;
      delete root.dataset.pizzaPremium;
      delete root.dataset.pizzaPhase;
      if(section)delete section.dataset.ppPhase;
      root.style.removeProperty('--pp-accent');
      root.style.removeProperty('--pp-glow');
      lastIndex=-1;lastProgress=null;speed=0;phase='';
    }
  }

  new MutationObserver(()=>activate())
    .observe(root,{attributes:true,attributeFilter:['data-orbital-motion']});
  /* The project config was applied — by a Studio input, a programmatic set, an import
     or an undo. Repaint from the SAME active index the engine reports; listening for
     raw input events would miss every other route. */
  document.addEventListener('restaurant:config-applied',()=>{
    if(!isPizza())return;
    profileCache=null;
    const st=engine()?.state?.();
    if(st)paintProduct(st.activeIndex,{animate:false});
    syncStudioPanel();
  });

  function boot(){
    if(ready)return;
    if(!engine()?.subscribe||!$('.orbital-section'))return;
    ready=true;
    activate();
  }
  const timer=setInterval(()=>{boot();if(ready)clearInterval(timer)},140);
  setTimeout(()=>clearInterval(timer),25000);
  boot();

  window.RestaurantPizzaPremium={
    getProfile:()=>profile(),
    getCurrentProduct(){const st=engine()?.state?.();return st?productAt(st.activeIndex):null},
    getCurrentPalette(){const st=engine()?.state?.();return paletteFor(st?productAt(st.activeIndex):null)},
    requestOrder,requestReservation,
    registerUpload,
    syncStudioPanel,
    /* deliberately reports the ENGINE's index: there is no product state here */
    state(){
      const st=engine()?.state?.()||{};
      const product=productAt(st.activeIndex);
      return {ready:root.dataset.pizzaPremium==='ready',
        phase,speed:+speed.toFixed(3),
        activeIndex:st.activeIndex,productId:product?.id||null,productName:product?.name||null,
        demoContent:!!product?.demoContent,price:product?.price??null,
        palette:paletteFor(product),profile:profile(),
        products:(config().products||[]).length};
    }
  };
})();
