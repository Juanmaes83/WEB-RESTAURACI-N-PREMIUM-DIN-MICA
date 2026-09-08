/* Class 20: native Studio adapter. One Project State; no persistence owned here. */
(() => {
  'use strict';
  const L=window.LocationMapsModuleUtils,S=window.SocialReputationModuleUtils,W=window.WhatsAppContactModuleUtils;
  const clone=x=>JSON.parse(JSON.stringify(x));
  RestaurantDefaults.modules={
    location:{...clone(L.DEFAULTS),eyebrow:'',address:{street:'',postalCode:'',city:'',region:'',country:''},phone:'',hours:'',maps:{...clone(L.DEFAULTS.maps),privacyMode:'click-to-load'}},
    social:S.normalize({...clone(S.DEFAULTS),showRating:false,rating:0,reviewCount:0,platforms:Object.keys(S.PLATFORM_META).map(id=>({id,enabled:false,url:''}))}),
    whatsapp:{...clone(W.DEFAULTS),phone:''}
  };
  const specs={
    location:{name:'Location / Google Maps',factory:()=>window.LocationMapsModule,fields:[
      ['title','Título'],['eyebrow','Antetítulo'],['address.street','Calle'],['address.postalCode','Código postal'],['address.city','Ciudad'],['address.region','Región'],['address.country','País'],['phone','Teléfono'],['hours','Horario'],
      ['design.preset','Preset',['split-editorial','full-width-map','minimal-location']],['maps.mode','Origen del mapa',['address','url','embed']],['maps.googleMapsUrl','URL Google Maps'],['maps.embedUrl','URL embed HTTPS'],['maps.latitude','Latitud','number'],['maps.longitude','Longitud','number'],['maps.privacyMode','Privacidad',['click-to-load','auto']],['cta.label','Texto del CTA']]},
    social:{name:'Social / Reputation',factory:()=>window.SocialReputationModule,fields:[
      ['preset','Preset',['editorial-footer','reputation-strip','social-minimal']],['heading','Título'],['eyebrow','Antetítulo'],['body','Descripción','textarea'],['showRating','Mostrar valoración verificada','checkbox'],['rating','Valoración (0–5)','number'],['reviewCount','Número de reseñas','number'],['ratingLabel','Etiqueta de valoración'],['reviewCtaLabel','Texto reseñas'],['reviewCtaUrl','URL de reseñas HTTPS'],
      ...Object.entries(S.PLATFORM_META).flatMap(([id,meta],i)=>[[`platforms.${i}.enabled`,meta.label,'checkbox'],[`platforms.${i}.url`,`${meta.label} URL`]])]},
    whatsapp:{name:'WhatsApp Contact / Concierge',factory:()=>window.WhatsAppContactModule,fields:[
      ['mode','Modo',['floating-launcher','inline-concierge','direct-cta']],['phone','Teléfono internacional'],['message','Mensaje predefinido','textarea'],['label','Texto del CTA'],['eyebrow','Antetítulo'],['title','Título'],['body','Descripción','textarea'],['availability','Disponibilidad'],['position','Posición',['right','left']],['showPrompt','Mostrar mensaje de bienvenida','checkbox']]}
  };
  const instances=new Map();let panel,built=false,stylePromise;
  const get=path=>window.RestaurantStudioConfig?.get(path);
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
  function styles(){return stylePromise??=new Promise((resolve,reject)=>{const l=el('link');l.rel='stylesheet';l.href='styles-v20-public.css';l.onload=resolve;l.onerror=()=>{stylePromise=null;l.remove();reject(new Error('Module styles unavailable'))};document.head.append(l)})}
  async function apply(){
    for(const [key,spec] of Object.entries(specs)){
      const value=get('modules.'+key);const existing=instances.get(key);
      if(!value?.enabled){existing?.host.remove();instances.delete(key);continue}
      const fingerprint=JSON.stringify(value);
      if(existing?.fingerprint===fingerprint)continue;
      await styles();
      // Config may change while CSS is loading; never publish a stale enabled state.
      if(JSON.stringify(get('modules.'+key))!==fingerprint){queueMicrotask(apply);continue}
      let item=instances.get(key);
      if(!item){
        const host=el('div','module-public');host.dataset.publicModule=key;host.id='module-'+key;
        if(key==='social')document.querySelector('body > footer').prepend(host);
        else if(key==='whatsapp')document.body.append(host);
        else document.querySelector('#visit').after(host);
        item={host,renderer:spec.factory().create(host,host),fingerprint:null};instances.set(key,item);
      }
      if(item.fingerprint===fingerprint)continue;
      if(key==='whatsapp'){
        if(value.mode==='floating-launcher')document.body.append(item.host);
        else (document.querySelector('#module-location')||document.querySelector('#visit')).after(item.host);
      }
      item.renderer.setConfig(value);item.fingerprint=fingerprint;
      window.ScrollTrigger?.refresh?.();
    }
    sync();
  }
  function field(key,[path,label,type='text']){
    const wrap=el('label',type==='checkbox'?'inline-check full':'');
    let input;
    if(Array.isArray(type)){input=el('select');type.forEach(v=>{const o=el('option','',v);o.value=v;input.append(o)})}
    else {input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;if(type==='number')input.step='any';if(type==='textarea')input.rows=2}
    input.dataset.path=`modules.${key}.${path}`;
    if(type==='checkbox')wrap.append(input,document.createTextNode(label));else wrap.append(document.createTextNode(label),input);
    input.addEventListener('input',()=>{const value=type==='checkbox'?input.checked:type==='number'?(input.value===''?null:Number(input.value)):input.value;window.RestaurantStudioConfig.set(input.dataset.path,value)});
    return wrap;
  }
  function build(){
    if(built)return;built=true;
    panel=el('section','studio-panel modules-panel');panel.dataset.panel='modules';panel.hidden=true;
    const intro=el('div','panel-intro');intro.append(el('p','eyebrow','MODULES / INTEGRATIONS'),el('h3','','Módulos opcionales'),el('p','','Activa sólo lo que tu restaurante necesita. Los tres módulos comparten el proyecto, historial y guardado del Studio.'));
    panel.append(intro);
    for(const [key,spec] of Object.entries(specs)){
      const card=el('details','project-card module-card');card.dataset.moduleCard=key;
      const summary=el('summary');summary.append(el('strong','',spec.name));const status=el('span','module-state','OFF');status.dataset.moduleState=key;summary.append(status);card.append(summary);
      card.append(field(key,['enabled','Publicar módulo','checkbox']));
      const grid=el('div','control-grid');spec.fields.forEach(f=>grid.append(field(key,f)));card.append(grid);
      const help=el('p','studio-help');help.dataset.moduleHelp=key;help.setAttribute('role','status');card.append(help);
      const preview=el('button','panel-preview','Ver módulo en la web ↗');preview.type='button';preview.onclick=()=>{window.RestaurantStudioShell?.close();document.querySelector('#module-'+key)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};card.append(preview);panel.append(card);
    }
    document.querySelector('#studio-scroll').append(panel);sync();
  }
  function sync(){
    if(!built)return;
    panel.querySelectorAll('[data-path]').forEach(input=>{const v=get(input.dataset.path);if(document.activeElement!==input){if(input.type==='checkbox')input.checked=!!v;else input.value=v??''}});
    for(const key of Object.keys(specs)){
      const c=get('modules.'+key);panel.querySelector(`[data-module-state="${key}"]`).textContent=c?.enabled?'ON':'OFF';
      let message=key==='location'?'Click-to-load: no se crea iframe ni se contacta con Google antes de pulsar el botón.':key==='social'?'Introduce sólo perfiles reales y datos de reputación verificables.':'8–15 dígitos. Un teléfono inválido no genera destino externo.';
      if(key==='location'&&c?.maps.mode!=='address'){const url=c.maps.mode==='embed'?c.maps.embedUrl:c.maps.googleMapsUrl;if(!L.isAllowedGoogleMapUrl(url,{embedOnly:c.maps.mode==='embed'}))message='URL no permitida. Se mantiene dirección + CTA seguros como alternativa.'}
      if(key==='social'&&c?.platforms.some(p=>p.enabled&&!S.isAllowedPlatformUrl(p.id,p.url)))message='Hay perfiles activos con URL inválida: no se publicarán esos enlaces.';
      if(key==='whatsapp'&&c?.enabled&&!W.isValidPhone(c.phone))message='Teléfono inválido: el CTA no tiene destino externo.';
      panel.querySelector(`[data-module-help="${key}"]`).textContent=message;
    }
  }
  const button=el('button','','Módulos');button.type='button';button.dataset.panel='modules';
  document.querySelector('.studio-nav [data-panel="project"]').before(button);
  button.addEventListener('click',build);
  document.addEventListener('restaurant:config-applied',()=>{apply().catch(console.error);sync()});
  window.RestaurantModulesStudio={open(key){build();button.click();if(key){const card=panel.querySelector(`[data-module-card="${key}"]`);if(card){card.open=true;card.scrollIntoView({block:'start'});card.querySelector('input')?.focus()}}},apply};
})();
