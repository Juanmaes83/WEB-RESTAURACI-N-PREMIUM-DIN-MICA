/* Native Studio view; every write goes through RestaurantStudioConfig. */
(() => {
  'use strict';
  const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
  const core=()=>window.RubikSEOGeoCore,api=()=>window.RestaurantStudioConfig;
  let panel;
  const nav=el('button','','SEO · GEO');nav.type='button';nav.dataset.panel='seo-geo';
  document.querySelector('.studio-nav [data-panel="project"]').before(nav);
  function field(parent,label,path,{type='text',help='',options}={}){
    const wrap=el('label','seo-field',label),input=el(options?'select':type==='textarea'?'textarea':'input');
    if(options)for(const [value,label] of options){const o=el('option','',label);o.value=value;input.append(o);}
    else if(type!=='textarea')input.type=type;
    if(type==='textarea')input.rows=3;
    input.dataset.seoPath=path;input.id='seo-'+path.replaceAll('.','-');
    input.addEventListener('change',()=>{
      if(path.startsWith('seo.pages.home.seo.')&&path.endsWith('.value')){
        const parentPath=path.slice(0,-6);api().set(parentPath,{...api().get(parentPath),value:input.value,updatedAt:new Date().toISOString()});
      }else api().set(path,type==='checkbox'?input.checked:path==='seo.business.cuisine'?input.value.split(',').map(x=>x.trim()).filter(Boolean):input.value);
    });
    wrap.append(input);if(help)wrap.append(el('small','seo-help',help));parent.append(wrap);return input;
  }
  function section(title,description,{open=false}={}){
    const d=el('details','seo-card');d.open=open;d.append(el('summary','',title));
    if(description)d.append(el('p','seo-help',description));panel.append(d);return d;
  }
  function build(){
    if(panel){render();return;}
    const style=el('link');style.rel='stylesheet';style.href='styles-seo-geo.css';document.head.append(style);
    panel=el('section','studio-panel seo-panel');panel.dataset.panel='seo-geo';panel.hidden=true;
    const intro=el('div','panel-intro');intro.append(el('p','eyebrow','RUBIK / SEO FOUNDATION'),el('h3','','Tu negocio, bien descrito.'),el('p','','Reutiliza tus datos, revisa cómo se presenta HOME y personaliza sólo lo necesario.'));
    panel.append(intro,el('p','seo-notice','SEO generado desde Project State. El preview es seguro y noindex; Publisher materializa la producci�n. Define un baseUrl/canonical HTTPS v�lido para publicar. No es una promesa de ranking.'));
    const overview=el('p','seo-overview');overview.dataset.seoOverview='';overview.setAttribute('role','status');panel.append(overview);
    const home=section('HOME · Apariencia en buscadores','Una página real: /. Los anchors del menú no se convierten en páginas nuevas.',{open:true});
    field(home,'Idioma de las fórmulas','seo.site.defaultLanguage',{options:[['es','Espa�ol']]});
    field(home,'URL de producción','seo.site.baseUrl',{type:'url',help:'Tu dominio definitivo. No se toma automáticamente la URL temporal de Vercel.'});
    for(const [key,label] of [['title','SEO title'],['description','Meta description'],['h1','H1 sugerido']]){
      const box=el('div','seo-generated');box.dataset.seoGenerated=key;
      const path=`seo.pages.home.seo.${key}`;
      const input=field(box,label,`${path}.value`,{type:key==='description'?'textarea':'text'});
      const provenance=el('small','seo-help');provenance.dataset.seoProvenance=key;box.append(provenance);
      const toggle=el('button','studio-primary');toggle.type='button';toggle.dataset.seoMode=key;
      toggle.onclick=()=>{const f=api().get(path);api().set(path,{...f,mode:f.mode==='custom'?'auto':'custom',updatedAt:new Date().toISOString()});if(api().get(path).mode==='custom')input.focus();};
      box.append(toggle);home.append(box);
    }
    field(home,'Permitir indexación de HOME al publicar','seo.pages.home.indexable',{type:'checkbox'});
    const serp=el('div','seo-serp');serp.setAttribute('aria-label','Preview orientativo del resultado de búsqueda');
    for(const name of ['url','title','description']){const n=el(name==='title'?'strong':'p');n.dataset.seoSerp=name;serp.append(n);}home.append(serp,el('p','seo-help','Preview orientativo. Google puede reescribir el título y el snippet; no hay un límite rígido de caracteres. El H1 sugerido no cambia aún el hero público.'));
    const entity=section('Negocio · Fuentes compartidas','Estos campos editan Marca, Hero y Ubicación en el mismo proyecto. No hay una segunda ficha SEO.');
    const grid=el('div','seo-grid');entity.append(grid);
    for(const [label,path,type,help] of [
      ['Nombre comercial','brand.name','text','Fuente: Marca'],['Descripción del negocio','hero.body','textarea','Fuente: texto del Hero'],
      ['Categoría','seo.business.category','text','Si está vacío, se usa Restaurante.'],['Cocina','seo.business.cuisine','text','Sólo cocinas reales, separadas por coma.'],
      ['Nombre legal','seo.business.legalName','text','Opcional; sólo información pública.'],['Rango de precios','seo.business.priceRange','text','Opcional; no se calcula ni se inventa.'],
      ['Calle','modules.location.address.street'],['Ciudad','modules.location.address.city'],['Región','modules.location.address.region'],['Código postal','modules.location.address.postalCode'],['País','modules.location.address.country'],
      ['Teléfono público','modules.location.phone','tel','Fuente: Ubicación'],['Contacto / email visible','visit.contact','text','Fuente: Visit. No introduzcas un email administrativo privado.']
    ])field(grid,label,path,{type:type||'text',help:help||'Fuente: Ubicación'});
    const privacy=section('Revisión y privacidad','Los datos de contacto se omiten del schema hasta confirmarlos. Los datos se publican en schema s�lo cuando est�n estructurados, confirmados y marcados como p�blicos. La visibilidad del m�dulo Location/Maps es independiente de la elegibilidad SEO.');
    for(const [key,label] of [['address','Dirección en schema'],['phone','Teléfono en schema'],['email','Email en schema']])field(privacy,label,`seo.visibility.${key}`,{options:[['private','Omitir'],['public','Permitir datos públicos']]});
    const confirm=el('button','studio-primary','Confirmar datos reales revisados');confirm.type='button';confirm.dataset.seoConfirm='';
    confirm.onclick=()=>{const config=api().snapshot();api().set('seo.business',{...config.seo.business,publicDataConfirmed:true,confirmationSignature:core().signature(config)});};privacy.append(confirm);
    const state=el('p','seo-help');state.dataset.seoConfirmation='';privacy.append(state);
    const schema=section('Restaurant schema · Preview','Sólo datos disponibles y autorizados. No se generan reviews, ratings, horarios estructurados ni coordenadas desde texto libre.');
    const pre=el('pre','seo-json');pre.dataset.seoSchema='';pre.tabIndex=0;schema.append(pre);
    const audit=section('Comprobaciones antes de publicar','Checks locales del proyecto. No son rankings ni una auditoría de la web online.',{open:true});const list=el('ul','seo-checks');list.dataset.seoChecks='';audit.append(list);
    const context=section('Contexto y medición','La base funciona sin servicios de pago. Las integraciones y Media SEO se implementarán en sus fases.');
    const info=el('p','seo-help');info.dataset.seoContext='';context.append(info);
    context.append(el('p','seo-help','DataForSEO: NOT MEASURED · Search Console: NOT CONNECTED · OpenSEO: NOT CONNECTED · Visibilidad IA: NOT MEASURED.'));
    document.querySelector('#studio-scroll').append(panel);render();
  }
  function render(){
    if(!panel||!api())return;
    const result=core().preview(api().snapshot());
    for(const input of panel.querySelectorAll('[data-seo-path]')){
      const value=api().get(input.dataset.seoPath);
      if(document.activeElement!==input){if(input.type==='checkbox')input.checked=!!value;else input.value=Array.isArray(value)?value.join(', '):(value??'');}
    }
    const names={'brand.name':'Marca','hero.body':'Hero','seo.business.category':'Categoría','seo.business.cuisine':'Cocina','modules.location.address.city':'Ubicación','seo.site.defaultLanguage':'Idioma'};
    for(const key of ['title','description','h1']){
      const f=result.home.seo[key],box=panel.querySelector(`[data-seo-generated="${key}"]`),input=box.querySelector('input,textarea');
      input.readOnly=f.mode==='auto';input.value=f.value;
      box.querySelector('[data-seo-mode]').textContent=f.mode==='auto'?'Personalizar':'Volver a automático';
      box.querySelector('[data-seo-provenance]').textContent=f.mode==='auto'?`AUTO · ${f.derivedFrom.map(p=>names[p]||p).join(' ← ')}`:'CUSTOM · Se conserva aunque cambien los datos del negocio.';
    }
    panel.querySelector('[data-seo-serp="url"]').textContent=result.canonical||'Dominio pendiente';
    for(const key of ['title','description'])panel.querySelector(`[data-seo-serp="${key}"]`).textContent=result.home.seo[key].value||'Pendiente';
    panel.querySelector('[data-seo-schema]').textContent=JSON.stringify(result.schema,null,2);
    panel.querySelector('[data-seo-confirmation]').textContent=result.seo.business.publicDataConfirmed?'Datos confirmados.':'Pendiente de revisión; cualquier cambio en las fuentes invalida la confirmación anterior.';
    const counts=result.checks.reduce((a,c)=>(a[c.severity]=(a[c.severity]||0)+1,a),{});
    panel.querySelector('[data-seo-overview]').textContent=`${counts.PASS||0} comprobaciones correctas · ${counts.BLOCKER||0} bloqueos · ${counts.WARNING||0} avisos. Preparación local, no medición de visibilidad.`;
    const list=panel.querySelector('[data-seo-checks]');list.replaceChildren();
    for(const c of result.checks){const li=el('li');li.dataset.severity=c.severity;li.append(el('strong','',c.severity),el('span','',c.message));list.append(li);}
    panel.querySelector('[data-seo-context]').textContent=`${result.source.dishes.length} platos disponibles para contexto futuro; no se introducen en el title de HOME. ${result.source.media.length} referencias a la Media Library compartida. El Core no guarda archivos ni crea otra biblioteca.`;
  }
  nav.addEventListener('click',build);
  document.addEventListener('restaurant:config-applied',render);
  window.RestaurantSEOGeoStudio={open(){build();window.RestaurantStudioShell?.open();nav.click();}};
})();
