/* PROJECT 12 — Studio customizer for Kinetic Product Selector.
   Uses the existing RestaurantStudioConfig only. No second store, no localStorage, no upload silo. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const root=document.documentElement;

  const defaults=()=>({
    brand:{logoText:'STACK°',nav:['BURGERS','OUR STORY','ORDER'],bagLabel:'BAG · 00'},
    cta:{label:'TASTE THE CHAOS →',href:''},
    autoplay:{enabled:true,delay:3000,interval:2450},
    products:[
      {id:'midnight-wagyu',code:'01',name:'MIDNIGHT WAGYU',tagline:'DARK. BOLD. UNEXPECTED.',image:'assets/kinetic-product-selector/01-midnight-wagyu.webp',primary:'#C8A24A',secondary:'#E4DCCB',ink:'#12100d',paper:'#d8dad5',motion:'heavy-drop',fx:'sesame',meta:'STACK° SIGNATURE · 01',price:'',short:'Dark bun, rich beef and a deliberately dramatic finish.',ingredients:'Wagyu-style beef, dark bun, cheese, signature garnish.',origin:'House signature',technique:'High-heat sear',pairing:'Smoked / bitter / bright',allergens:'Gluten · Dairy',note:'Built as the darkest, heaviest opening signature.'},
      {id:'ramen-riot',code:'02',name:'RAMEN RIOT',tagline:'SLURP. STACK. REPEAT.',image:'assets/kinetic-product-selector/02-ramen-riot.webp',primary:'#F5A623',secondary:'#6B3F1D',ink:'#261506',paper:'#efe1b8',motion:'elastic-stack',fx:'noodle',meta:'STACK° SIGNATURE · 02',price:'',short:'A noodle-bun build with pork, egg and stacked umami.',ingredients:'Ramen noodle bun, pork, egg, greens, sauce.',origin:'Tokyo-inspired',technique:'Pressed noodle bun',pairing:'Umami · sesame · citrus',allergens:'Egg · Gluten · Sesame',note:'Elastic, playful and intentionally unruly.'},
      {id:'glazed-outlaw',code:'03',name:'GLAZED OUTLAW',tagline:'CRISPY. SWEET. ILLEGAL.',image:'assets/kinetic-product-selector/03-glazed-outlaw.webp',primary:'#A85C1E',secondary:'#E8B84B',ink:'#2a1206',paper:'#f2dfb8',motion:'orbital-drop',fx:'syrup',meta:'STACK° SIGNATURE · 03',price:'',short:'Sweet glazed bun, fried chicken and bacon with sticky contrast.',ingredients:'Glazed bun, fried chicken, bacon, glaze.',origin:'American diner remix',technique:'Crisp fry + glaze',pairing:'Sweet · salty · crisp',allergens:'Gluten · Dairy',note:'Dessert cues pushed into a savory fried-chicken build.'},
      {id:'beet-royale',code:'04',name:'BEET ROYALE',tagline:'PINK. GRILLED. FEARLESS.',image:'assets/kinetic-product-selector/04-beet-royale.webp',primary:'#C21E67',secondary:'#7B4BC4',ink:'#33091f',paper:'#e9c9d8',motion:'diagonal-bloom',fx:'petal',meta:'STACK° SIGNATURE · 04',price:'',short:'Pink bun, grilled cheese and bright pickled accents.',ingredients:'Beet-style bun, grilled cheese, pickled onion, herbs.',origin:'Vegetarian signature',technique:'Plancha grill',pairing:'Tangy · floral · charred',allergens:'Gluten · Dairy',note:'Color is part of the product identity, not decoration.'},
      {id:'tidal-gold',code:'05',name:'TIDAL GOLD',tagline:'CRISPY. OCEANIC. GOLDEN.',image:'assets/kinetic-product-selector/05-tidal-gold.webp',primary:'#0E7C86',secondary:'#F2B01E',ink:'#07343a',paper:'#a8ddd8',motion:'liquid-sweep',fx:'mango',meta:'STACK° SIGNATURE · 05',price:'',short:'Ocean-led filling, turquoise bun and tropical golden notes.',ingredients:'Turquoise bun, crab-style filling, mango, greens.',origin:'Coastal signature',technique:'Cold-prep + crisp finish',pairing:'Oceanic · tropical · fresh',allergens:'Gluten · Shellfish',note:'The lightest visual build in the sequence.'},
      {id:'lava-brisket',code:'06',name:'LAVA BRISKET',tagline:'SMOKED. MOLTEN. MERCILESS.',image:'assets/kinetic-product-selector/06-lava-brisket.webp',primary:'#E8801A',secondary:'#4C6B2F',ink:'#2c170b',paper:'#e6c6a3',motion:'molten-rise',fx:'cheese',meta:'STACK° SIGNATURE · 06',price:'',short:'Dark pretzel bun, brisket, cheddar and jalapeño heat.',ingredients:'Pretzel bun, brisket, cheddar, jalapeño, sauce.',origin:'Smokehouse signature',technique:'Slow smoke + hot finish',pairing:'Smoky · molten · spicy',allergens:'Gluten · Dairy',note:'The final hero is designed to hold, not loop away.'}
    ]
  });
  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(base,over)=>{if(Array.isArray(base))return Array.isArray(over)?base.map((v,i)=>merge(v,over[i]||{})):clone(base);if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out}return over===undefined?base:over};
  const cfg=()=>window.RestaurantStudioConfig;
  const current=()=>merge(defaults(),clone(cfg()?.get?.('kineticProductSelector')||{}));
  const save=value=>cfg()?.set?.('kineticProductSelector',value);

  function styles(){
    if($('#kps-studio-style'))return;
    const s=document.createElement('style');s.id='kps-studio-style';s.textContent=`
      .kps-studio-editor{grid-column:1/-1;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:18px;background:rgba(255,255,255,.035);display:none}
      .kps-studio-editor.is-open{display:block}.kps-studio-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.kps-studio-head h4{margin:2px 0 4px;font-size:16px}.kps-studio-head p{margin:0;opacity:.68;font-size:11px;max-width:620px;line-height:1.5}.kps-studio-actions{display:flex;gap:7px;flex-wrap:wrap}.kps-mini-btn{border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:700;cursor:pointer}.kps-global{display:grid;grid-template-columns:1.1fr 1.4fr 1.4fr .8fr;gap:10px;margin-bottom:14px}.kps-field{display:grid;gap:5px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.kps-field input,.kps-field select,.kps-field textarea{width:100%;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.16);color:inherit;border-radius:10px;padding:9px 10px;font:inherit;font-size:11px;text-transform:none;letter-spacing:0;resize:vertical}.kps-products-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.kps-product-editor{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;display:grid;gap:9px}.kps-product-editor summary{cursor:pointer;font-weight:800;font-size:11px;list-style:none;display:flex;justify-content:space-between}.kps-product-editor summary::-webkit-details-marker{display:none}.kps-product-editor summary span{opacity:.55}.kps-fields-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kps-color input{min-height:37px;padding:4px}.kps-product-detail-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:9px;border-top:1px solid rgba(255,255,255,.1)}.kps-product-detail-fields .full{grid-column:1/-1}.kps-studio-note{font-size:9px;line-height:1.45;opacity:.58;margin:10px 0 0}.kps-configure{margin-left:6px}
      @media(max-width:900px){.kps-global{grid-template-columns:1fr 1fr}}
      @media(max-width:700px){.kps-global,.kps-products-editor,.kps-fields-2,.kps-product-detail-fields{grid-template-columns:1fr}.kps-product-detail-fields .full{grid-column:1}.kps-studio-head{display:block}.kps-studio-actions{margin-top:10px}}
    `;document.head.appendChild(s);
  }

  const motions=['heavy-drop','elastic-stack','orbital-drop','diagonal-bloom','liquid-sweep','molten-rise'];
  function editorMarkup(data){
    return `<div class="kps-studio-head"><div><span class="eyebrow">Project 12</span><h4>Kinetic Product Selector</h4><p>Imagen, copy, color, coreografía y ficha viven en el Project State actual. No se crea un segundo gestor: esta extensión prepara los mismos campos que consume Product Detail.</p></div><div class="kps-studio-actions"><button class="kps-mini-btn" type="button" data-kps-preview>Vista previa</button><button class="kps-mini-btn" type="button" data-kps-reset>Restaurar referencia</button></div></div>
      <div class="kps-global">
        <label class="kps-field">Marca<input data-kps-global="brand.logoText" value="${esc(data.brand?.logoText||'')}"></label>
        <label class="kps-field">CTA final<input data-kps-global="cta.label" value="${esc(data.cta?.label||'')}"></label>
        <label class="kps-field">CTA / checkout URL<input data-kps-global="cta.href" value="${esc(data.cta?.href||'')}" placeholder="https://..."></label>
        <label class="kps-field">Autoplay<select data-kps-global="autoplay.enabled"><option value="true" ${data.autoplay?.enabled!==false?'selected':''}>Sí</option><option value="false" ${data.autoplay?.enabled===false?'selected':''}>No</option></select></label>
      </div>
      <div class="kps-products-editor">${data.products.map((p,i)=>`<details class="kps-product-editor" ${i===0?'open':''} data-kps-product="${i}"><summary>${esc(p.code)} · ${esc(p.name)} <span>EDITAR</span></summary>
        <label class="kps-field">Imagen / URL / slot<input data-kps-key="image" value="${esc(p.image||'')}"></label>
        <label class="kps-field">Nombre<input data-kps-key="name" value="${esc(p.name||'')}"></label>
        <label class="kps-field">Tagline<input data-kps-key="tagline" value="${esc(p.tagline||'')}"></label>
        <div class="kps-fields-2"><label class="kps-field kps-color">Color principal<input type="color" data-kps-key="primary" value="${esc(p.primary||'#111111')}"></label><label class="kps-field kps-color">Color secundario<input type="color" data-kps-key="secondary" value="${esc(p.secondary||'#ffffff')}"></label></div>
        <label class="kps-field">Coreografía<select data-kps-key="motion">${motions.map(m=>`<option value="${m}" ${m===p.motion?'selected':''}>${m}</option>`).join('')}</select></label>
        <div class="kps-product-detail-fields">
          <label class="kps-field">Precio<input data-kps-key="price" value="${esc(p.price||'')}"></label>
          <label class="kps-field">Meta / procedencia<input data-kps-key="meta" value="${esc(p.meta||'')}"></label>
          <label class="kps-field full">Descripción<textarea rows="2" data-kps-key="short">${esc(p.short||'')}</textarea></label>
          <label class="kps-field full">Ingredientes<textarea rows="2" data-kps-key="ingredients">${esc(p.ingredients||'')}</textarea></label>
          <label class="kps-field">Origen<input data-kps-key="origin" value="${esc(p.origin||'')}"></label>
          <label class="kps-field">Técnica<input data-kps-key="technique" value="${esc(p.technique||'')}"></label>
          <label class="kps-field">Maridaje<input data-kps-key="pairing" value="${esc(p.pairing||'')}"></label>
          <label class="kps-field">Alérgenos<input data-kps-key="allergens" value="${esc(p.allergens||'')}"></label>
          <label class="kps-field full">Chef note<textarea rows="2" data-kps-key="note">${esc(p.note||'')}</textarea></label>
        </div>
      </details>`).join('')}</div>
      <p class="kps-studio-note">Media Library: usa <strong>slot:nombre-ranura</strong>, una URL absoluta o una ruta de <strong>assets/</strong>. La ficha se guarda dentro del mismo <strong>kineticProductSelector.products[]</strong>; no hay Store, CMS ni Media Library paralelos.</p>`;
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
