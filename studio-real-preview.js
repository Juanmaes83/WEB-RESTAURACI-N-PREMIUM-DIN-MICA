/* PHASE C1 — Restaurant Studio real viewport preview.
   Parent Studio remains the only editor/state owner. The iframe is a read-only
   renderer that receives Project State snapshots and runs at a true viewport. */
(() => {
  'use strict';

  const MESSAGE='restaurant-studio-preview:snapshot';
  const READY='restaurant-studio-preview:ready';
  const SYNCED='restaurant-studio-preview:synced';
  const params=new URLSearchParams(location.search);
  const isChild=params.get('studioPreview')==='1'&&window.parent!==window;

  const PRESETS={
    'mobile-s':{label:'Mobile S',width:360,height:800},
    'mobile-m':{label:'Mobile M',width:390,height:844},
    'mobile-l':{label:'Mobile L',width:430,height:932},
    'landscape':{label:'Landscape',width:844,height:390},
    'tablet':{label:'Tablet',width:768,height:1024},
    'desktop':{label:'Desktop',width:1440,height:900}
  };

  function installStyles(){
    if(document.getElementById('studio-real-preview-styles'))return;
    const style=document.createElement('style');
    style.id='studio-real-preview-styles';
    style.textContent=`
      html[data-studio-preview="child"] #studio,
      html[data-studio-preview="child"] #studio-backdrop,
      html[data-studio-preview="child"] .topbar .studio-open,
      html[data-studio-preview="child"] .studio-preview-dock{display:none!important}
      .studio-preview-dock{position:fixed;inset:0 min(560px,96vw) 0 0;z-index:210;
        display:none;flex-direction:column;background:#10100f;color:#f3efe6;border-right:1px solid #302f2b;
        box-shadow:18px 0 48px #0008;overflow:hidden}
      body.studio-open .studio-preview-dock{display:flex}
      .studio-preview-head{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:16px;
        padding:12px 16px;border-bottom:1px solid #302f2b;background:#171714}
      .studio-preview-head strong{font:500 12px/1.2 var(--sans,Arial,sans-serif);letter-spacing:.08em;text-transform:uppercase}
      .studio-preview-head span{display:block;margin-top:4px;font:400 10px/1.2 var(--sans,Arial,sans-serif);color:#aaa69c}
      .studio-preview-head-actions{display:flex;align-items:center;gap:8px}
      .studio-preview-head button{min-height:38px;border:1px solid #4a4842;border-radius:999px;background:#22221f;color:#f3efe6;
        padding:7px 11px;font:500 10px/1 var(--sans,Arial,sans-serif);cursor:pointer}
      .studio-preview-stage{flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;align-items:flex-start;
        padding:18px;background:radial-gradient(circle at 50% 20%,#292924,#0d0d0c 64%)}
      .studio-preview-device{flex:0 0 auto;transform-origin:top center;border:1px solid #4a4842;border-radius:18px;
        overflow:hidden;background:#080807;box-shadow:0 24px 70px #0009}
      .studio-preview-frame{display:block;border:0;background:#080807}
      .preview-select[data-real-preview="1"]{width:100%;min-height:42px;margin-top:8px}
      .studio-preview-meta{margin-top:9px!important;font-size:9px!important;color:#6f6a62!important}
      @media(max-width:1050px){.studio-preview-dock{right:min(520px,94vw)}.studio-preview-stage{padding:10px}}
    `;
    document.head.appendChild(style);
  }
  installStyles();

  function same(a,b){
    try{return JSON.stringify(a)===JSON.stringify(b)}catch{return false}
  }

  if(isChild){
    document.documentElement.dataset.studioPreview='child';
    document.documentElement.dataset.previewState='waiting';

    /* The frame may read the same IndexedDB/Media Library, but it must never become
       a second durable owner. Snapshot mutations therefore remain memory-only. */
    const store=window.RestaurantStore;
    if(store&&!store.__studioPreviewReadonly){
      store.__studioPreviewReadonly=true;
      store.saveProject=async project=>({...project,persistenceMode:'preview-readonly'});
      store.clearProject=async()=>{};
      store.saveMedia=async(slot,file,meta={})=>({slot,file,name:file?.name||meta.name||slot,type:file?.type||meta.type||'',kind:(file?.type||'').startsWith('video/')?'video':'image'});
      store.deleteMedia=async()=>{};
      store.clearMedia=async()=>{};
      store.verifyPersistence=async()=>({ok:true,mode:'preview-readonly'});
      store.getMode=()=> 'preview-readonly';
      document.documentElement.dataset.previewPersistence='readonly';
    }

    /* The normal top-level runtime deliberately suppresses framed experiences.
       A Studio preview is not an Experience Shell frame, so restore the same public
       capabilities that production would load. */
    const ensureFramedCapabilities=()=>{
      if(!document.querySelector('script[data-experience-shell-runtime]')){
        const shell=document.createElement('script');
        shell.src='class22-experience-shell.js';shell.dataset.experienceShellRuntime='1';
        document.body.appendChild(shell);
      }
      if(!document.querySelector('script[data-memories-runtime]')){
        const chain=['restaurant-media.js','restaurant-media-picker.js','class23-memories-model.js',
          'class23-memories-video.js','class23-memories-artifacts.js','class23-memories-review.js',
          'class23-memories-engine.js','class23-memories-studio.js'];
        const load=i=>{
          if(i>=chain.length)return;
          const s=document.createElement('script');s.src=chain[i];
          if(i===0)s.dataset.memoriesRuntime='1';
          s.onload=()=>load(i+1);document.body.appendChild(s);
        };
        load(0);
      }
    };

    /* Project State alone is not the whole Motion contract. The canonical Motion
       Studio publishes derived data-* state and restaurant:motion-change after a
       selector change. Snapshot hydration must replay that same side effect inside
       the read-only renderer, otherwise the config changes while the old engine
       remains mounted. Engine options are injected asynchronously, so retry until
       the requested preset and Motion Studio publisher are both available. */
    let motionSyncToken=0,motionSyncTimer=null;
    const syncMotionRuntime=()=>{
      const token=++motionSyncToken;
      clearTimeout(motionSyncTimer);
      const desired=window.RestaurantStudioConfig?.get?.('motion.orbitalStyle');
      const attempt=(tries=0)=>{
        if(token!==motionSyncToken)return;
        const select=document.getElementById('motion-orbital-style');
        const publisher=window.RestaurantMotionStudio?.publish;
        const hasOption=!desired||!!select&&[...select.options].some(option=>option.value===desired);
        if(!select||typeof publisher!=='function'||!hasOption){
          if(tries<75)motionSyncTimer=setTimeout(()=>attempt(tries+1),80);
          return;
        }
        const changed=!!desired&&select.value!==desired;
        if(desired)select.value=desired;
        if(changed){
          select.dispatchEvent(new Event('input',{bubbles:true}));
          select.dispatchEvent(new Event('change',{bubbles:true}));
        }
        publisher();
        if(desired&&document.documentElement.dataset.orbitalMotion!==desired&&tries<75){
          motionSyncTimer=setTimeout(()=>attempt(tries+1),80);
        }
      };
      attempt();
    };

    let queued=null;
    const applySnapshot=snapshot=>{
      const api=window.RestaurantStudioConfig;
      if(!api?.set||!api?.snapshot){queued=snapshot;return false}
      const current=api.snapshot();
      Object.entries(snapshot||{}).forEach(([key,value])=>{
        if(!same(current?.[key],value))api.set(key,value);
      });
      syncMotionRuntime();
      document.documentElement.dataset.previewState='parent';
      requestAnimationFrame(()=>{
        window.dispatchEvent(new Event('resize'));
        parent.postMessage({type:SYNCED,width:innerWidth,height:innerHeight},location.origin);
      });
      return true;
    };

    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!==MESSAGE)return;
      applySnapshot(event.data.config||{});
    });

    const announce=()=>{
      if(!window.RestaurantStudioConfig?.snapshot){setTimeout(announce,40);return}
      ensureFramedCapabilities();
      parent.postMessage({type:READY,width:innerWidth,height:innerHeight},location.origin);
      if(queued){const next=queued;queued=null;applySnapshot(next)}
    };
    announce();
    return;
  }

  function bootParent(){
    const select=document.getElementById('preview-mode');
    const api=window.RestaurantStudioConfig;
    if(!select||!api?.snapshot){setTimeout(bootParent,50);return}
    if(window.RestaurantStudioPreview)return;

    const card=select.closest('.project-card');
    const title=card?.querySelector('h4');
    const description=card?.querySelector('p');
    if(title)title.textContent='Preview real';
    if(description)description.textContent='Viewport real del navegador: media queries, innerWidth y unidades de viewport se evalúan dentro del frame.';
    select.dataset.realPreview='1';
    select.innerHTML=Object.entries(PRESETS).map(([value,p])=>
      `<option value="${value}"${value==='mobile-m'?' selected':''}>${p.label} · ${p.width}×${p.height}</option>`).join('');
    const meta=document.createElement('p');
    meta.className='studio-preview-meta';
    meta.textContent='Un único Project State · preview de solo lectura · sin segundo Studio persistente.';
    card?.appendChild(meta);

    const dock=document.createElement('section');
    dock.className='studio-preview-dock';dock.id='studio-preview-dock';dock.setAttribute('aria-label','Preview real del restaurante');
    dock.innerHTML=`<div class="studio-preview-head"><div><strong>Preview real</strong><span id="studio-preview-status">Esperando Studio…</span></div><div class="studio-preview-head-actions"><button id="studio-preview-reload" type="button">Recargar frame</button></div></div><div class="studio-preview-stage" id="studio-preview-stage"><div class="studio-preview-device" id="studio-preview-device"><iframe id="studio-preview-frame" class="studio-preview-frame" title="Preview real del restaurante" loading="eager"></iframe></div></div>`;
    document.body.appendChild(dock);

    const frame=dock.querySelector('#studio-preview-frame');
    const stage=dock.querySelector('#studio-preview-stage');
    const device=dock.querySelector('#studio-preview-device');
    const status=dock.querySelector('#studio-preview-status');
    const reload=dock.querySelector('#studio-preview-reload');
    let current='mobile-m',ready=false,lastMediaSignature=null,postTimer=null,epoch=0;

    const childUrl=()=>{
      const url=new URL(location.href);
      url.searchParams.set('studioPreview','1');
      url.searchParams.set('previewEpoch',String(epoch));
      url.hash='';
      return url.href;
    };
    const mediaSignature=config=>JSON.stringify({
      media:config?.media||{},
      dishes:(config?.dishes||[]).map(d=>[d.id,d.image,d.localMedia,d.mediaName])
    });
    const measurement=()=>{
      try{return {width:frame.contentWindow?.innerWidth||0,height:frame.contentWindow?.innerHeight||0}}catch{return {width:0,height:0}}
    };
    const fit=()=>{
      const p=PRESETS[current]||PRESETS['mobile-m'];
      const maxWidth=Math.max(260,stage.clientWidth-28);
      const maxHeight=Math.max(260,stage.clientHeight-28);
      const scale=Math.min(1,maxWidth/p.width,maxHeight/p.height);
      frame.style.width=`${p.width}px`;frame.style.height=`${p.height}px`;
      frame.width=p.width;frame.height=p.height;
      device.style.width=`${p.width}px`;device.style.height=`${p.height}px`;
      device.style.transform=`scale(${scale})`;
      device.style.marginBottom=`${-(p.height*(1-scale))}px`;
      const m=measurement();
      status.textContent=`${p.label} · ${p.width}×${p.height}${ready&&m.width?` · frame ${m.width}×${m.height}`:''}`;
      setTimeout(()=>{const next=measurement();if(ready&&next.width)status.textContent=`${p.label} · ${p.width}×${p.height} · frame ${next.width}×${next.height}`},80);
    };
    const sendSnapshot=({allowReload=true}={})=>{
      if(!frame.contentWindow)return;
      const config=api.snapshot();
      const nextMedia=mediaSignature(config);
      if(allowReload&&lastMediaSignature!==null&&nextMedia!==lastMediaSignature&&ready){
        lastMediaSignature=nextMedia;epoch++;ready=false;status.textContent='Actualizando Media Library…';frame.src=childUrl();return;
      }
      lastMediaSignature=nextMedia;
      frame.contentWindow.postMessage({type:MESSAGE,config},location.origin);
    };
    const queueSnapshot=()=>{
      clearTimeout(postTimer);postTimer=setTimeout(()=>sendSnapshot(),0);
    };
    const ensureFrame=()=>{
      if(frame.getAttribute('src'))return;
      ready=false;status.textContent='Cargando preview real…';frame.src=childUrl();
    };
    const setPreset=value=>{
      current=PRESETS[value]?value:'mobile-m';select.value=current;fit();
    };

    select.addEventListener('change',()=>setPreset(select.value));
    reload.addEventListener('click',()=>{epoch++;ready=false;status.textContent='Recargando preview…';frame.src=childUrl()});
    frame.addEventListener('load',()=>{fit()});
    document.addEventListener('restaurant:config-applied',queueSnapshot);
    window.addEventListener('resize',fit);
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
      if(event.data?.type===READY){ready=true;fit();sendSnapshot({allowReload:false})}
      if(event.data?.type===SYNCED){ready=true;fit()}
    });

    const observeStudio=()=>{
      if(document.body.classList.contains('studio-open')){ensureFrame();requestAnimationFrame(fit)}
    };
    new MutationObserver(observeStudio).observe(document.body,{attributes:true,attributeFilter:['class']});
    observeStudio();setPreset('mobile-m');

    window.RestaurantStudioPreview={
      presets:PRESETS,
      frame,
      dock,
      setPreset,
      sendSnapshot:()=>sendSnapshot({allowReload:false}),
      getMeasurement:measurement,
      getPreset:()=>current
    };
  }

  bootParent();
})();
