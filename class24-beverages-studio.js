/* CLASS 24 — BEVERAGES STUDIO
   Adds ONE tab to the existing Restaurant Studio. All edits go through RestaurantStudioConfig.set.
   Media goes through RestaurantMedia / RestaurantMediaPicker. No independent store, history or uploader backend. */
(() => {
  'use strict';
  const B=()=>window.RestaurantBeveragesModel;
  const cfg=()=>window.RestaurantStudioConfig;
  const media=()=>window.RestaurantMedia;
  const picker=()=>window.RestaurantMediaPicker;
  const engine=()=>window.RestaurantBeveragesEngine;
  const PATH='beverages';
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const get=p=>cfg()?.get?.(p),set=(p,v)=>cfg()?.set?.(p,v);
  let panel=null,button=null,built=false,openId=null;
  const state=()=>B().normalize(get(PATH));
  const items=()=>B().clone(state().items);
  function status(text){const n=panel?.querySelector('[data-bev-status]');if(n)n.textContent=text||''}
  function field(label,path,{type='text',options=null,value=''}={}){
    const wrap=el('label',type==='checkbox'?'bev-studio-field bev-studio-check':'bev-studio-field');
    let input;
    if(options){input=el('select');options.forEach(([v,t])=>{const o=el('option','',t);o.value=v;input.append(o)})}
    else if(type==='textarea'){input=el('textarea');input.rows=3}
    else{input=el('input');input.type=type}
    if(type==='checkbox')input.checked=!!value;else input.value=value??'';
    if(path){
      input.dataset.bevPath=path;
      const event=(type==='checkbox'||options)?'change':'input';
      input.addEventListener(event,()=>{let v=type==='checkbox'?input.checked:input.value;if(type==='number')v=input.value===''?null:Number(input.value);set(path,v)});
    }
    if(type==='checkbox'){wrap.append(input,document.createTextNode(label))}else{wrap.append(el('span','',label),input)}
    return wrap;
  }
  function updateItem(id,mutate){const next=items(),item=next.find(x=>x.id===id);if(!item)return;mutate(item);set(`${PATH}.items`,next);openId=id;render();engine()?.refresh?.()}
  function addItem(){const next=items(),item=B().item();next.push(item);set(`${PATH}.items`,next);openId=item.id;render();panel.querySelector(`[data-bev-card="${item.id}"] input`)?.focus()}
  function removeItem(id){set(`${PATH}.items`,items().filter(x=>x.id!==id));if(openId===id)openId=null;render();engine()?.refresh?.()}
  function move(id,delta){const next=items(),from=next.findIndex(x=>x.id===id),to=from+delta;if(from<0||to<0||to>=next.length)return;[next[from],next[to]]=[next[to],next[from]];set(`${PATH}.items`,next);openId=id;render();engine()?.refresh?.()}
  async function upload(id,file){if(!file||!file.type.startsWith('image/')){status('Selecciona una imagen.');return}const mediaId=B().newMediaId('image'),ref=B().refFor(id,mediaId);try{await media().save(ref,file)}catch(err){console.error(err);status('No se pudo guardar la imagen.');return}updateItem(id,item=>{item.media=[{id:mediaId,kind:'image',ref,alt:item.name||''},...(item.media||[]).filter(m=>m.kind!=='image')]});status('Imagen vinculada desde la Media Library.')}
  async function choose(id){const chosen=await picker()?.open?.({kind:'image',title:'Imágenes para bebidas'});if(!chosen)return;updateItem(id,item=>{item.media=[{id:chosen.ref.split('/').pop(),kind:'image',ref:chosen.ref,alt:item.name||''},...(item.media||[]).filter(m=>m.kind!=='image')]})}
  function card(item,index,total){
    const d=el('details','bev-edit-card');d.dataset.bevCard=item.id;if(openId===item.id)d.open=true;d.addEventListener('toggle',()=>{if(d.open)openId=item.id});
    const s=el('summary');s.append(el('strong','',item.name||'Bebida sin nombre'),el('span','bev-edit-badge',`${String(index+1).padStart(2,'0')} · ${item.enabled===false?'OCULTA':'VISIBLE'}`));d.append(s);
    const ops=el('div','bev-edit-ops');[['↑ Subir',-1],['↓ Bajar',1]].forEach(([txt,delta])=>{const b=el('button','',txt);b.type='button';b.disabled=delta<0?index===0:index===total-1;b.onclick=()=>move(item.id,delta);ops.append(b)});const del=el('button','bev-delete','Eliminar');del.type='button';del.onclick=()=>removeItem(item.id);ops.append(del);d.append(ops);
    const grid=el('div','bev-studio-grid');
    const specs=[['Visible','enabled','checkbox'],['Nombre','name','text'],['Nombre corto','shortName','text'],['Tipo','type','select'],['Precio','price','text'],['Descripción','description','textarea'],['Ingredientes','ingredients','textarea'],['Maridaje','pairing','text'],['Disponibilidad','availability','text'],['Movimiento','motionPreset','motion'],['Color principal','theme.accent','color'],['Color suave','theme.accentSoft','color'],['Color profundo','theme.accentDeep','color']];
    specs.forEach(([label,key,type])=>{let wrap;if(type==='select')wrap=field(label,null,{options:B().TYPES.map(v=>[v,v]),value:item[key]});else if(type==='motion')wrap=field(label,null,{options:B().MOTION.map(v=>[v,v]),value:item[key]});else wrap=field(label,null,{type,value:key.includes('.')?key.split('.').reduce((a,k)=>a?.[k],item):item[key]});const control=wrap.querySelector('input,textarea,select');const write=()=>updateItem(item.id,x=>{const parts=key.split('.');const last=parts.pop();const target=parts.reduce((a,k)=>(a[k]??={}),x);target[last]=control.type==='checkbox'?control.checked:control.value});control.addEventListener(control.type==='checkbox'||control.tagName==='SELECT'?'change':'input',write);grid.append(wrap)});
    d.append(grid);
    const mediaRow=el('div','bev-media-tools');const fileLabel=el('label','upload-btn','Subir imagen');const file=el('input');file.type='file';file.accept='image/*';file.hidden=true;file.onchange=()=>upload(item.id,file.files?.[0]);fileLabel.append(file);const pick=el('button','','Elegir de Media Library');pick.type='button';pick.onclick=()=>choose(item.id);mediaRow.append(fileLabel,pick);d.append(mediaRow);return d;
  }
  function render(){if(!built)return;const s=state();const list=panel.querySelector('[data-bev-list]');list.innerHTML='';s.items.forEach((item,i)=>list.append(card(item,i,s.items.length)));panel.querySelectorAll('[data-bev-global]').forEach(input=>{if(document.activeElement===input)return;const v=get(input.dataset.bevGlobal);if(input.type==='checkbox')input.checked=!!v;else input.value=v??''})}
  function build(){
    if(built)return;built=true;B().seed();panel=el('section','studio-panel beverages-panel');panel.dataset.panel='beverages';panel.hidden=true;
    const intro=el('div','panel-intro');intro.append(el('p','eyebrow','CLASS 24 · BEVERAGE EXPERIENCE'),el('h3','','Bebidas'),el('p','','Un único dominio de bebidas con selector dinámico, media compartida y tema por producto. Nada se guarda fuera del Project State.'));panel.append(intro);
    const globals=el('div','bev-studio-grid bev-global');
    const g=[['Publicar sección','enabled','checkbox'],['Presentación','preset','preset'],['Antetítulo','eyebrow','text'],['Título','title','text'],['Introducción','intro','textarea'],['Mostrar precio','showPrice','checkbox'],['Mostrar maridaje','showPairing','checkbox'],['Partículas ambientales','ambientParticles','checkbox']];
    g.forEach(([label,key,type])=>{const options=type==='preset'?B().PRESETS.map(v=>[v,v]):null;const f=field(label,`${PATH}.${key}`,{type:type==='preset'?'text':type,options,value:state()[key]});const input=f.querySelector('input,textarea,select');input.dataset.bevGlobal=`${PATH}.${key}`;globals.append(f)});panel.append(globals);
    const bar=el('div','bev-studio-toolbar');const add=el('button','studio-primary','+ Añadir bebida');add.type='button';add.onclick=addItem;const preview=el('button','panel-preview','Ver Beverage Experience ↗');preview.type='button';preview.onclick=()=>{if(!state().enabled)set(`${PATH}.enabled`,true);window.RestaurantStudioShell?.close?.();setTimeout(()=>document.querySelector('#beverages')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),180)};bar.append(add,preview);panel.append(bar);
    const list=el('div','bev-edit-list');list.dataset.bevList='1';panel.append(list);const note=el('p','studio-help');note.dataset.bevStatus='1';panel.append(note);
    document.querySelector('#studio-scroll')?.append(panel);render();
  }
  function install(){
    const nav=document.querySelector('.studio-nav');if(!nav||button)return !!button;button=el('button','','Bebidas');button.type='button';button.dataset.panel='beverages';const project=nav.querySelector('[data-panel="project"]');nav.insertBefore(button,project||null);button.addEventListener('click',()=>{build();nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('.studio-panel').forEach(p=>p.hidden=p!==panel);render()});return true;
  }
  document.addEventListener('restaurant:config-applied',()=>{B().seed();render();engine()?.refresh?.()});
  const timer=setInterval(()=>{if(install()&&cfg()?.get){B().seed();clearInterval(timer)}},180);setTimeout(()=>clearInterval(timer),30000);
  window.RestaurantBeveragesStudio=Object.freeze({open(){install();button?.click()},render,state});
})();