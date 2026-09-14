/* PROJECT 12 — Studio customizer for Kinetic Product Selector.
   Uses the existing RestaurantStudioConfig only. No second store, no localStorage, no upload silo. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const root=document.documentElement;

  const defaults=()=>({
    brand:{logoText:'STACK°',nav:['BURGERS','OUR STORY','ORDER'],bagLabel:'BAG · 00'},
    cta:{label:'TASTE THE CHAOS →'},
    autoplay:{enabled:true,delay:3000,interval:2450},
    products:[
      {id:'midnight-wagyu',code:'01',name:'MIDNIGHT WAGYU',tagline:'DARK. BOLD. UNEXPECTED.',image:'assets/kinetic-product-selector/01-midnight-wagyu.webp',primary:'#C8A24A',secondary:'#E4DCCB',ink:'#12100d',paper:'#d8dad5',motion:'heavy-drop',fx:'sesame'},
      {id:'ramen-riot',code:'02',name:'RAMEN RIOT',tagline:'SLURP. STACK. REPEAT.',image:'assets/kinetic-product-selector/02-ramen-riot.webp',primary:'#F5A623',secondary:'#6B3F1D',ink:'#261506',paper:'#efe1b8',motion:'elastic-stack',fx:'noodle'},
      {id:'glazed-outlaw',code:'03',name:'GLAZED OUTLAW',tagline:'CRISPY. SWEET. ILLEGAL.',image:'assets/kinetic-product-selector/03-glazed-outlaw.webp',primary:'#A85C1E',secondary:'#E8B84B',ink:'#2a1206',paper:'#f2dfb8',motion:'orbital-drop',fx:'syrup'},
      {id:'beet-royale',code:'04',name:'BEET ROYALE',tagline:'PINK. GRILLED. FEARLESS.',image:'assets/kinetic-product-selector/04-beet-royale.webp',primary:'#C21E67',secondary:'#7B4BC4',ink:'#33091f',paper:'#e9c9d8',motion:'diagonal-bloom',fx:'petal'},
      {id:'tidal-gold',code:'05',name:'TIDAL GOLD',tagline:'CRISPY. OCEANIC. GOLDEN.',image:'assets/kinetic-product-selector/05-tidal-gold.webp',primary:'#0E7C86',secondary:'#F2B01E',ink:'#07343a',paper:'#a8ddd8',motion:'liquid-sweep',fx:'mango'},
      {id:'lava-brisket',code:'06',name:'LAVA BRISKET',tagline:'SMOKED. MOLTEN. MERCILESS.',image:'assets/kinetic-product-selector/06-lava-brisket.webp',primary:'#E8801A',secondary:'#4C6B2F',ink:'#2c170b',paper:'#e6c6a3',motion:'molten-rise',fx:'cheese'}
    ]
  });
  const clone=o=>JSON.parse(JSON.stringify(o));
  const cfg=()=>window.RestaurantStudioConfig;
  const current=()=>clone(cfg()?.get?.('kineticProductSelector')||defaults());
  const save=value=>cfg()?.set?.('kineticProductSelector',value);

  function styles(){
    if($('#kps-studio-style'))return;
    const s=document.createElement('style');s.id='kps-studio-style';s.textContent=`
      .kps-studio-editor{grid-column:1/-1;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:18px;background:rgba(255,255,255,.035);display:none}
      .kps-studio-editor.is-open{display:block}.kps-studio-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.kps-studio-head h4{margin:2px 0 4px;font-size:16px}.kps-studio-head p{margin:0;opacity:.68;font-size:11px;max-width:580px;line-height:1.5}.kps-studio-actions{display:flex;gap:7px;flex-wrap:wrap}.kps-mini-btn{border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:700;cursor:pointer}.kps-global{display:grid;grid-template-columns:1.1fr 1.4fr .8fr;gap:10px;margin-bottom:14px}.kps-field{display:grid;gap:5px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.kps-field input,.kps-field select{width:100%;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.16);color:inherit;border-radius:10px;padding:9px 10px;font:inherit;font-size:11px;text-transform:none;letter-spacing:0}.kps-products-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.kps-product-editor{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;display:grid;gap:9px}.kps-product-editor summary{cursor:pointer;font-weight:800;font-size:11px;list-style:none;display:flex;justify-content:space-between}.kps-product-editor summary::-webkit-details-marker{display:none}.kps-product-editor summary span{opacity:.55}.kps-fields-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kps-color input{min-height:37px;padding:4px}.kps-studio-note{font-size:9px;line-height:1.45;opacity:.58;margin:10px 0 0}.kps-configure{margin-left:6px}
      @media(max-width:700px){.kps-global,.kps-products-editor,.kps-fields-2{grid-template-columns:1fr}.kps-studio-head{display:block}.kps-studio-actions{margin-top:10px}}
    `;document.head.appendChild(s);
  }

  const motions=['heavy-drop','elastic-stack','orbital-drop','diagonal-bloom','liquid-sweep','molten-rise'];
  function editorMarkup(data){
    return `<div class="kps-studio-head"><div><span class="eyebrow">Project 12</span><h4>Kinetic Product Selector</h4><p>Imagen, copy, color y coreografía viven en el Project State actual. El héroe y su miniatura siempre usan la misma referencia de imagen.</p></div><div class="kps-studio-actions"><button class="kps-mini-btn" type="button" data-kps-preview>Vista previa</button><button class="kps-mini-btn" type="button" data-kps-reset>Restaurar referencia</button></div></div>
      <div class="kps-global">
        <label class="kps-field">Marca<input data-kps-global="brand.logoText" value="${esc(data.brand?.logoText||'')}"></label>
        <label class="kps-field">CTA final<input data-kps-global="cta.label" value="${esc(data.cta?.label||'')}"></label>
        <label class="kps-field">Autoplay<select data-kps-global="autoplay.enabled"><option value="true" ${data.autoplay?.enabled!==false?'selected':''}>Sí</option><option value="false" ${data.autoplay?.enabled===false?'selected':''}>No</option></select></label>
      </div>
      <div class="kps-products-editor">${data.products.map((p,i)=>`<details class="kps-product-editor" ${i===0?'open':''} data-kps-product="${i}"><summary>${esc(p.code)} · ${esc(p.name)} <span>EDITAR</span></summary>
        <label class="kps-field">Imagen / URL / slot<input data-kps-key="image" value="${esc(p.image||'')}"></label>
        <label class="kps-field">Nombre<input data-kps-key="name" value="${esc(p.name||'')}"></label>
        <label class="kps-field">Tagline<input data-kps-key="tagline" value="${esc(p.tagline||'')}"></label>
        <div class="kps-fields-2"><label class="kps-field kps-color">Color principal<input type="color" data-kps-key="primary" value="${esc(p.primary||'#111111')}"></label><label class="kps-field kps-color">Color secundario<input type="color" data-kps-key="secondary" value="${esc(p.secondary||'#ffffff')}"></label></div>
        <label class="kps-field">Coreografía<select data-kps-key="motion">${motions.map(m=>`<option value="${m}" ${m===p.motion?'selected':''}>${m}</option>`).join('')}</select></label>
      </details>`).join('')}</div>
      <p class="kps-studio-note">Para usar la Media Library existente, escribe <strong>slot:nombre-ranura</strong>. También acepta URLs absolutas y rutas de <strong>assets/</strong>. No se crea un almacén paralelo.</p>`;
  }
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setPath=(obj,path,value)=>{const parts=path.split('.');let cur=obj;parts.forEach((p,i)=>{if(i===parts.length-1)cur[p]=value;else cur=cur[p]||(cur[p]={})});return obj};

  function ensure(){
    const card=$('[data-ml-card="kinetic-product-selector"]');if(!card)return false;
    styles();
    if(!$('.kps-configure',card)){
      const foot=$('.ml-card-foot',card);const open=$('.ml-open',card);
      const b=document.createElement('button');b.type='button';b.className='ml-action kps-configure';b.textContent='Personalizar';b.dataset.kpsConfigure='1';
      foot?.insertBefore(b,open||null);
    }
    let ed=$('.kps-studio-editor');
    if(!ed){ed=document.createElement('section');ed.className='kps-studio-editor';ed.dataset.kpsStudio='1';card.insertAdjacentElement('afterend',ed)}
    if(ed.dataset.wired!=='1'){
      ed.dataset.wired='1';
      card.addEventListener('click',e=>{if(!e.target.closest('[data-kps-configure]'))return;render(ed);ed.classList.toggle('is-open');e.target.textContent=ed.classList.contains('is-open')?'Cerrar personalización':'Personalizar';});
      ed.addEventListener('input',e=>onChange(e,ed));ed.addEventListener('change',e=>onChange(e,ed));
      ed.addEventListener('click',e=>{
        if(e.target.closest('[data-kps-preview]'))window.RestaurantExperienceShell?.open?.('kinetic-product-selector',{trigger:e.target});
        if(e.target.closest('[data-kps-reset]')){save(defaults());render(ed);document.dispatchEvent(new CustomEvent('restaurant:kinetic-config-change'))}
      });
    }
    root.dataset.kpsStudio='ready';return true;
  }
  function render(ed){const data=current();if(!cfg()?.get?.('kineticProductSelector'))save(data);ed.innerHTML=editorMarkup(data)}
  function onChange(e,ed){
    const global=e.target.closest('[data-kps-global]');const product=e.target.closest('[data-kps-key]');if(!global&&!product)return;
    const data=current();
    if(global){let value=global.value;if(global.dataset.kpsGlobal==='autoplay.enabled')value=value==='true';setPath(data,global.dataset.kpsGlobal,value)}
    if(product){const box=product.closest('[data-kps-product]');const i=+box.dataset.kpsProduct;if(!data.products[i])return;data.products[i][product.dataset.kpsKey]=product.value}
    save(data);document.dispatchEvent(new CustomEvent('restaurant:kinetic-config-change',{detail:{config:data}}));
  }

  const timer=setInterval(()=>{if(ensure())clearInterval(timer)},250);setTimeout(()=>clearInterval(timer),120000);
  document.addEventListener('click',e=>{if(e.target.closest?.('.studio-open'))setTimeout(ensure,500)},true);
  window.RestaurantKineticStudio=Object.freeze({defaults,current,open(){const card=$('[data-ml-card="kinetic-product-selector"]');card?.querySelector('[data-kps-configure]')?.click();return !!card}});
})();