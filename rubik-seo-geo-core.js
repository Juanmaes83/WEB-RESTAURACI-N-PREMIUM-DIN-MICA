/* Rubik SEO/GEO Core · Phase 1. Pure projections; persistence belongs to app-v4.
   Contract: docs/SEO-GEO-ENGINE-ARCHITECTURE.md. No published head mutation. */
(function(root,factory){
  const core=factory();
  if(typeof module==='object'&&module.exports)module.exports=core;
  else {root.RubikSEOGeoCore=core;root.RestaurantDefaults.seo=core.defaults();}
})(globalThis,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const text=x=>typeof x==='string'?x.trim():'';
  const publicText=x=>x&&typeof x==='object'?(x.visibility==='public'?text(x.value):''):text(x);
  const field=()=>({mode:'auto',value:'',templateId:'',derivedFrom:[],updatedAt:''});
  function defaults(){return {
    schemaVersion:1,
    site:{baseUrl:'',defaultLanguage:'es',defaultSocialImageRef:''},
    business:{businessType:'restaurant',schemaType:'Restaurant',category:'',cuisine:[],legalName:'',priceRange:'',publicDataConfirmed:false,confirmationSignature:''},
    visibility:{address:'private',phone:'private',email:'private'},
    pages:{home:{id:'home',path:'/',type:'home',indexable:true,canonicalMode:'auto',seo:{title:field(),description:field(),h1:field()}}}
  };}
  function merge(base,over){
    if(!over||typeof over!=='object'||Array.isArray(over))return base;
    for(const k of Object.keys(over)){
      if(['__proto__','constructor','prototype'].includes(k))continue;
      const v=over[k];base[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(base[k]&&typeof base[k]==='object'?base[k]:{},v):v;
    }return base;
  }
  function https(value){
    try {const u=new URL(text(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}
  }
  function baseUrl(value){
    const valid=https(value);if(!valid)return '';
    const u=new URL(valid);
    if(u.search||u.hash||u.hostname==='localhost'||u.hostname.endsWith('.local')||/^(127\.|0\.|192\.168\.|10\.)/.test(u.hostname))return '';
    return u.href.endsWith('/')?u.href:u.href+'/';
  }
  function restaurantSource(config){
    const s=config.seo||{},b=s.business||{},l=config.modules?.location||{};
    const lang=s.site?.defaultLanguage==='en'?'en':'es';
    const address={};
    for(const [out,key] of Object.entries({streetAddress:'street',addressLocality:'city',addressRegion:'region',postalCode:'postalCode',addressCountry:'country'})){
      const value=publicText(l.address?.[key]);if(value)address[out]=value;
    }
    return {
      language:lang,name:publicText(config.brand?.name),description:publicText(config.hero?.body),
      category:publicText(b.category)||(lang==='es'?'Restaurante':'Restaurant'),
      cuisine:Array.isArray(b.cuisine)?b.cuisine.map(publicText).filter(Boolean):[],
      legalName:publicText(b.legalName),priceRange:publicText(b.priceRange),
      city:address.addressLocality||'',address,
      legacyAddress:publicText(config.visit?.address),locationVisible:l.enabled===true,
      phone:publicText(l.phone),email:publicText(config.visit?.contact),
      reservationUrl:https(publicText(config.visit?.bookingUrl)),
      // No parsing cities, cuisine, coordinates or hours from editorial/demo copy.
      hoursLabel:publicText(l.hours)||publicText(config.visit?.service),
      dishes:(Array.isArray(config.dishes)?config.dishes:[]).filter(d=>d.enabled!==false).map(d=>({id:d.id,name:publicText(d.name),origin:publicText(d.origin),ingredients:publicText(d.ingredients),mediaRef:d.id})),
      media:Object.keys(config.media||{}).map(ref=>({ref,type:config.media[ref]?.type||'image'})),
      paths:{name:'brand.name',description:'hero.body',city:'modules.location.address.city',phone:'modules.location.phone',email:'visit.contact'}
    };
  }
  function signature(config){
    const s=restaurantSource(config);let hash=2166136261;
    // A change invalidates confirmation without storing a second copy of source data.
    for(const c of JSON.stringify([s,config.seo?.visibility,config.seo?.site])){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return (hash>>>0).toString(16);
  }
  function reconcile(config,now=new Date().toISOString()){
    const seo=merge(defaults(),copy(config.seo||{}));
    const s=restaurantSource({...config,seo}),where=s.city?(s.language==='es'?' en ':' in ')+s.city:'';
    const home=seo.pages.home;
    // Phase 1 has exactly one supported route; preserve future entries for import compatibility.
    home.id='home';home.path='/';home.type='home';home.canonicalMode='auto';
    home.indexable=home.indexable===true;
    const generated={
      title:s.name?[s.name,s.category+where].filter(Boolean).join(' | '):'',
      description:s.name?`${s.name} · ${s.category}${where}.${s.description?' '+s.description:''}`:'',
      h1:s.name?`${s.name} · ${s.cuisine[0]||s.category}${where}`:''
    };
    const paths={title:['brand.name','seo.business.category','modules.location.address.city','seo.site.defaultLanguage'],description:['brand.name','hero.body','seo.business.category','modules.location.address.city','seo.site.defaultLanguage'],h1:['brand.name','seo.business.cuisine','seo.business.category','modules.location.address.city','seo.site.defaultLanguage']};
    for(const key of Object.keys(generated)){
      const prior=home.seo[key]||field();
      if(prior.mode==='custom'){home.seo[key]={...prior,mode:'custom',value:text(prior.value)};continue;}
      const next={mode:'auto',value:generated[key],templateId:`restaurant.home.${key}.v1.${s.language}`,derivedFrom:paths[key]};
      const changed=Object.keys(next).some(k=>JSON.stringify(prior[k])!==JSON.stringify(next[k]));
      home.seo[key]={...next,updatedAt:changed?now:(prior.updatedAt||now)};
    }
    if(seo.business.publicDataConfirmed&&seo.business.confirmationSignature!==signature({...config,seo}))seo.business.publicDataConfirmed=false;
    return seo;
  }
  function preview(config){
    const seo=reconcile(config),s=restaurantSource({...config,seo}),canonical=baseUrl(seo.site.baseUrl);
    const confirmed=seo.business.publicDataConfirmed===true;
    const restaurant={'@context':'https://schema.org','@type':'Restaurant',name:s.name};
    if(s.description)restaurant.description=s.description;
    if(canonical){restaurant['@id']=canonical+'#restaurant';restaurant.url=canonical;}
    if(s.cuisine.length)restaurant.servesCuisine=s.cuisine;
    if(s.legalName)restaurant.legalName=s.legalName;
    if(s.priceRange)restaurant.priceRange=s.priceRange;
    // Schema is a preview, but even previews must respect private/internal fields.
    if(confirmed&&seo.visibility.address==='public'&&s.locationVisible&&Object.keys(s.address).length)restaurant.address={'@type':'PostalAddress',...s.address};
    if(confirmed&&seo.visibility.phone==='public'&&s.locationVisible&&/^\+?[\d ()-]{8,24}$/.test(s.phone))restaurant.telephone=s.phone;
    if(confirmed&&seo.visibility.email==='public'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))restaurant.email=s.email;
    const checks=[];
    const check=(id,severity,message)=>checks.push({id,severity,message});
    check('name',s.name?'PASS':'BLOCKER',s.name?'Nombre heredado de Marca.':'Falta el nombre comercial en Marca.');
    for(const key of ['title','description','h1'])check(key,seo.pages.home.seo[key].value?'PASS':'ERROR',`${key}: ${seo.pages.home.seo[key].value?'preview generado.':'falta contenido.'}`);
    check('canonical',canonical?'PASS':'BLOCKER',canonical?'URL de producción candidata válida.':'Define una URL HTTPS de producción, sin query ni fragmento.');
    check('confirmation',confirmed?'PASS':'BLOCKER',confirmed?'Datos revisados por el responsable.':'Confirma los datos reales antes de publicar. Los cambios requieren nueva revisión.');
    check('location',s.city&&s.address.streetAddress?'PASS':'WARNING',s.city&&s.address.streetAddress?'Ubicación estructurada disponible.':'Completa calle y ciudad en los datos compartidos de Ubicación; no se infieren de un texto.');
    check('address-schema',restaurant.address?'PASS':'WARNING',restaurant.address?'Dirección pública incluida en el preview.':'Dirección omitida: requiere datos confirmados, permiso público y módulo Ubicación activo.');
    check('schema','PASS','JSON-LD Restaurant generado sin ratings, reviews ni datos inventados.');
    check('indexable',seo.pages.home.indexable?'PASS':'WARNING',seo.pages.home.indexable?'HOME marcada como indexable para el futuro Publisher.':'HOME configurada como noindex.');
    if(seo.pages.home.seo.title.value.length>70||seo.pages.home.seo.description.value.length>180)check('length','OPPORTUNITY','Revisa la concisión. La longitud es orientativa, no un límite de Google.');
    check('publisher','BLOCKER','Publicación SEO pendiente de Fase 2: estos previews no sustituyen todavía el head, H1 ni schema públicos heredados.');
    return {seo,source:s,home:seo.pages.home,canonical,schema:restaurant,checks,
      policy:{preview:'noindex',production:seo.pages.home.indexable?'index':'noindex',applied:false},
      measurements:{dataForSEO:'NOT MEASURED',searchConsole:'NOT CONNECTED',openSEO:'NOT CONNECTED',aiVisibility:'NOT MEASURED'}};
  }
  return Object.freeze({defaults,restaurantSource,reconcile,preview,signature,baseUrl});
});
