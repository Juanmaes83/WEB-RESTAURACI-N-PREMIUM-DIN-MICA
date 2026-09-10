/* CLASS 26 — ANATOMY STUDIO
   Un panel más dentro del Restaurant Studio ACTUAL. No construye un segundo Studio y
   escribe únicamente por `RestaurantStudioConfig.set`.

   DÓNDE ESCRIBE CADA COSA
     La configuración de la sección  ->  `anatomy.*`
     Las capas de un plato           ->  `dishes.<i>.anatomy.layers`

     Lo segundo es lo que importa: las capas pertenecen al PLATO, no a la sección, así que
     se editan dentro de la colección `dishes[]` de siempre. Cambiar de plato en el
     selector no mueve datos: sólo cambia a qué plato mira el panel.

   LO QUE ESTE PANEL NO PIDE
     Ni procedencia, ni técnica, ni maridaje, ni alérgenos: esos campos ya existen en el
     panel Platos desde Class 04 y la sección los LEE. Pedirlos otra vez aquí sería
     abrir un segundo sitio donde editar lo mismo.
*/
(() => {
  'use strict';
  const A=()=>window.RestaurantAnatomyModel,cfg=()=>window.RestaurantStudioConfig,
        media=()=>window.RestaurantMedia,picker=()=>window.RestaurantMediaPicker,
        engine=()=>window.RestaurantAnatomyEngine;
  const PATH='anatomy';
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const get=p=>cfg()?.get?.(p),set=(p,v)=>cfg()?.set?.(p,v);
  let panel=null,button=null,built=false,openId=null;

  const state=()=>A().normalize(get(PATH));
  const dishes=()=>cfg()?.snapshot?.()?.dishes||window.RestaurantDefaults?.dishes||[];
  /* El plato al que mira el panel. Misma resolución que el motor, para que el panel no
     pueda estar editando un plato distinto del que se ve. */
  function targetIndex(){
    const list=dishes(),s=state();
    if(s.dishId){const i=list.findIndex(d=>d.id===s.dishId);if(i>=0)return i}
    const withLayers=list.findIndex(d=>d.anatomy?.layers?.length);
    return withLayers>=0?withLayers:0;
  }
  const targetDish=()=>dishes()[targetIndex()]||null;
  const layerPath=()=>`dishes.${targetIndex()}.anatomy.layers`;
  const layers=()=>A().normalizeLayers(targetDish()?.anatomy?.layers);

  function status(text){const n=panel?.querySelector('[data-ana-status]');if(n)n.textContent=text||''}

  function field(label,{type='text',options=null,value='',path=null,step=null}={}){
    const wrap=el('label',type==='checkbox'?'ana-studio-field ana-studio-check':'ana-studio-field');
    let input;
    if(options){input=el('select');options.forEach(([v,t])=>{const o=el('option','',t);o.value=v;input.append(o)})}
    else if(type==='textarea'){input=el('textarea');input.rows=3}
    else{input=el('input');input.type=type;if(step!=null)input.step=String(step)}
    if(type==='checkbox')input.checked=!!value;else input.value=value??'';
    if(path){
      input.dataset.anaPath=path;
      input.addEventListener(type==='checkbox'||options?'change':'input',()=>{
        set(path,type==='checkbox'?input.checked:(type==='number'?+input.value:input.value));
      });
    }
    if(type==='checkbox')wrap.append(input,document.createTextNode(label));
    else wrap.append(el('span','',label),input);
    return wrap;
  }

  /* ------------------------------------------------------------------ mutaciones */

  function writeLayers(next){
    set(layerPath(),A().normalizeLayers(next));
    render();engine()?.refresh?.();
  }
  function updateLayer(id,mutate){
    const next=layers();const item=next.find(x=>x.id===id);if(!item)return;
    mutate(item);openId=id;writeLayers(next);
  }
  function addLayer(){
    const next=layers();
    const item=A().layer({id:`layer-${Date.now().toString(36)}`,label:'Nueva capa'},next.length);
    next.push(item);openId=item.id;writeLayers(next);
    status('Capa creada. Asígnale un recorte con transparencia para que entre en el apilado.');
  }
  function removeLayer(id){
    /* Se desvincula la capa; el asset NO se borra de la Media Library. Misma regla que
       Memories: eliminar del dominio no destruye el archivo. */
    writeLayers(layers().filter(x=>x.id!==id));
    if(openId===id)openId=null;
    status('Capa eliminada del plato. El archivo sigue en la Media Library.');
  }
  function move(id,delta){
    const next=layers(),from=next.findIndex(x=>x.id===id),to=from+delta;
    if(from<0||to<0||to>=next.length)return;
    [next[from],next[to]]=[next[to],next[from]];
    next.forEach((l,i)=>{l.order=i});
    openId=id;writeLayers(next);
  }
  async function upload(id,file){
    if(!file||!file.type.startsWith('image/')){status('Selecciona una imagen.');return}
    const dish=targetDish();if(!dish)return;
    const ref=A().refFor(dish.id,`${id}-${Date.now().toString(36)}`);
    try{await media().save(ref,file)}
    catch(err){console.error(err);status('No se pudo guardar la imagen.');return}
    updateLayer(id,l=>{l.media={id:String(ref).split('/').pop(),kind:'image',ref,alt:l.label||''}});
    status('Recorte vinculado desde la Media Library compartida. Si tiene fondo, el apilado no cuadrará: hace falta transparencia real.');
  }
  async function choose(id){
    const chosen=await picker()?.open?.({kind:'image',title:'Recortes de capa'});
    if(!chosen)return;
    updateLayer(id,l=>{l.media={id:String(chosen.ref).split('/').pop(),kind:'image',ref:chosen.ref,alt:l.label||''}});
  }

  /* ------------------------------------------------------------------ tarjeta de capa */

  function card(item,index,total){
    const d=el('details','ana-edit-card');
    d.dataset.anaCard=item.id;
    if(openId===item.id)d.open=true;
    d.addEventListener('toggle',()=>{if(d.open)openId=item.id});

    const s=el('summary');
    s.append(el('strong','',item.label||'Capa sin nombre'),
      el('span','ana-edit-badge',
        `${String(index+1).padStart(2,'0')} · ${item.media?.ref?'CON RECORTE':'SIN RECORTE'}${item.enabled===false?' · OCULTA':''}`));
    d.append(s);

    const ops=el('div','ana-edit-ops');
    [['↑ Subir',-1],['↓ Bajar',1]].forEach(([txt,delta])=>{
      const b=el('button','',txt);b.type='button';
      b.disabled=delta<0?index===0:index===total-1;
      b.onclick=()=>move(item.id,delta);ops.append(b);
    });
    const del=el('button','ana-delete','Eliminar');del.type='button';
    del.onclick=()=>removeLayer(item.id);ops.append(del);
    d.append(ops);

    const grid=el('div','ana-studio-grid');
    /* `offsetX` sí se guarda: es autoría, no medida. Es lo que da vida al apilado
       —en la referencia el tomate está desplazado a la derecha a propósito. */
    const specs=[['Visible','enabled','checkbox'],['Etiqueta','label','text'],
      ['Nota','note','textarea'],['Desplazamiento lateral','offsetX','number']];
    specs.forEach(([label,key,type])=>{
      const wrap=field(label,{type,value:item[key],step:type==='number'?0.005:null});
      const control=wrap.querySelector('input,textarea,select');
      const write=()=>updateLayer(item.id,x=>{
        x[key]=control.type==='checkbox'?control.checked:(type==='number'?(+control.value||0):control.value);
      });
      control.addEventListener(control.type==='checkbox'?'change':'input',write);
      grid.append(wrap);
    });
    d.append(grid);

    const row=el('div','ana-media-tools');
    const label=el('label','upload-btn','Subir recorte');
    const file=el('input');file.type='file';file.accept='image/*';file.hidden=true;
    file.onchange=()=>upload(item.id,file.files?.[0]);
    label.append(file);
    const pick=el('button','','Elegir de Media Library');pick.type='button';
    pick.onclick=()=>choose(item.id);
    row.append(label,pick);
    if(item.media?.ref){
      const ref=el('code','ana-media-ref',item.media.ref);
      row.append(ref);
    }
    d.append(row);
    return d;
  }

  /* ------------------------------------------------------------------ render */

  function render(){
    if(!built)return;
    const s=state(),dish=targetDish(),list=layers();

    const sel=panel.querySelector('[data-ana-dish]');
    if(sel&&document.activeElement!==sel){
      sel.innerHTML='';
      dishes().forEach(d=>{const o=el('option','',`${d.name||d.id}${d.anatomy?.layers?.length?` · ${d.anatomy.layers.length} capas`:''}`);o.value=d.id;sel.append(o)});
      sel.value=dish?.id||'';
    }

    const list_el=panel.querySelector('[data-ana-list]');
    list_el.innerHTML='';
    if(!dish){
      list_el.append(el('p','studio-help','No hay platos en la carta todavía.'));
    }else if(!list.length){
      const p=el('p','studio-help',
        'Este plato no tiene capas. Añade una por ingrediente, de arriba abajo, con un recorte transparente cada una. Mientras haya menos de dos, la sección se pinta como héroe anotado en vez de abrirse.');
      p.dataset.anaEmpty='1';
      list_el.append(p);
    }else{
      list.forEach((item,i)=>list_el.append(card(item,i,list.length)));
    }

    const count=panel.querySelector('[data-ana-count]');
    if(count)count.textContent=list.length
      ? `${list.length} capa${list.length===1?'':'s'} · ${list.filter(l=>l.media?.ref).length} con recorte`
      : 'sin capas';

    panel.querySelectorAll('[data-ana-global]').forEach(input=>{
      if(document.activeElement===input)return;
      const v=get(input.dataset.anaGlobal);
      if(input.type==='checkbox')input.checked=!!v;
      else input.value=v??'';
    });
  }

  /* ------------------------------------------------------------------ construcción */

  function build(){
    if(built)return;built=true;
    panel=el('section','studio-panel anatomy-panel');
    panel.dataset.panel='anatomy';panel.hidden=true;

    const intro=el('div','panel-intro');
    intro.append(el('p','eyebrow','CLASS 26 · ANATOMY THEATER'),el('h3','','Anatomía'),
      el('p','','El plato abierto en sus capas, con una ficha por ingrediente. Vive en el mismo Project State: las capas pertenecen al plato y la procedencia, técnica y maridaje se siguen editando en el panel Platos.'));
    panel.append(intro);

    const globals=el('div','ana-studio-grid ana-global');
    [['Publicar sección','enabled','checkbox'],
     ['Presentación','preset','preset'],
     ['Estado en reposo','resting','resting'],
     ['Antetítulo','eyebrow','text'],
     ['Título','title','text'],
     ['Introducción','intro','textarea'],
     ['Botón montar/desmontar','assembleControl','checkbox'],
     ['Flotación de capas','idleFloat','checkbox'],
     ['Profundidad con el puntero','pointerDepth','checkbox'],
     ['Deriva al hacer scroll','scrollDrift','checkbox'],
     ['Mostrar notas','showNotes','checkbox'],
     ['Mostrar procedencia','showOrigin','checkbox'],
     ['Mostrar maridaje','showPairing','checkbox']
    ].forEach(([label,key,type])=>{
      const options=type==='preset'?A().PRESETS.map(v=>[v,v])
        :type==='resting'?A().RESTING.map(v=>[v,v==='exploded'?'Abierto (recomendado)':'Montado'])
        :null;
      const f=field(label,{type:options?'text':type,options,value:state()[key],path:`${PATH}.${key}`});
      const input=f.querySelector('input,textarea,select');
      input.dataset.anaGlobal=`${PATH}.${key}`;
      globals.append(f);
    });
    panel.append(globals);

    /* Selector de plato. Escribe `anatomy.dishId`: la sección mira a un plato, no se
       queda con una copia de él. */
    const dishRow=el('div','ana-studio-field');
    dishRow.append(el('span','','Plato'));
    const sel=el('select');sel.dataset.anaDish='1';
    sel.addEventListener('change',()=>{set(`${PATH}.dishId`,sel.value);openId=null;render();engine()?.refresh?.()});
    dishRow.append(sel);
    panel.append(dishRow);

    const bar=el('div','ana-studio-toolbar');
    const add=el('button','studio-primary','+ Añadir capa');add.type='button';add.onclick=addLayer;
    const remeasure=el('button','','Volver a medir');remeasure.type='button';
    remeasure.title='Descarta el registro medido en caché y vuelve a medir cada recorte. Útil tras reemplazar una imagen.';
    remeasure.onclick=async()=>{status('Midiendo…');await engine()?.remeasure?.();status('Registro medido de nuevo.')};
    const preview=el('button','panel-preview','Ver Anatomy Theater ↗');preview.type='button';
    preview.onclick=()=>{
      if(!state().enabled)set(`${PATH}.enabled`,true);
      window.RestaurantStudioShell?.close?.();
      setTimeout(()=>document.querySelector('#anatomy')?.scrollIntoView({behavior:'smooth'}),180);
    };
    const count=el('span','ana-count');count.dataset.anaCount='1';
    bar.append(add,remeasure,preview,count);
    panel.append(bar);

    const list=el('div','ana-edit-list');list.dataset.anaList='1';panel.append(list);
    const note=el('p','studio-help');note.dataset.anaStatus='1';panel.append(note);

    document.querySelector('#studio-scroll')?.append(panel);
    render();
  }

  function install(){
    const nav=document.querySelector('#studio .studio-nav');
    if(!nav||button)return !!button;
    button=el('button','','Anatomía');button.type='button';button.dataset.panel='anatomy';
    const project=nav.querySelector('[data-panel="project"]');
    nav.insertBefore(button,project||null);
    button.addEventListener('click',()=>{
      build();
      nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));
      document.querySelectorAll('#studio .studio-panel').forEach(p=>p.hidden=p!==panel);
      render();
    });
    document.documentElement.dataset.anatomyStudio='ready';
    return true;
  }

  document.addEventListener('restaurant:config-applied',()=>{render();engine()?.refresh?.()});
  const timer=setInterval(()=>{if(install()&&cfg()?.get)clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),30000);

  window.RestaurantAnatomyStudio=Object.freeze({
    open(){install();button?.click()},render,state,
    targetDishId:()=>targetDish()?.id||''
  });
})();
