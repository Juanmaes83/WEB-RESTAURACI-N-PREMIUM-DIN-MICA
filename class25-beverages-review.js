/* CLASS 25 — BEVERAGE / ICE CREAM REVIEW FIXTURE
   ?review=beverages only. All visual assets come from this repository.
   The review state is a session-only overlay: Studio + engine see the same values,
   while the durable Project State remains untouched. Scroll Traveler is visually
   suppressed only for this review URL; the approved Class 24 runtime is not changed. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('review')!=='beverages')return;
  const B=window.RestaurantBeveragesModel;if(!B)return;
  const root=document.documentElement;
  const base='assets/half-orbit/dishes-transparent/';
  const allAssets=['HELADO 1.jpg','HELADO 2.jpg','HELADO 3.jpg','HELADO 4.jpg','HELADO 8.jpg','HELADO 11.jpg','HELADO 12.jpg','HELADO 13.jpg','HELADO 15.jpg','HELADO 17.jpg','HELADO 18.jpg'];
  const families=Object.freeze({
    bowls:['HELADO 1.jpg','HELADO 2.jpg','HELADO 3.jpg','HELADO 4.jpg'],
    singleCups:['HELADO 11.jpg','HELADO 12.jpg','HELADO 13.jpg','HELADO 17.jpg'],
    pairedCups:['HELADO 8.jpg','HELADO 15.jpg','HELADO 18.jpg']
  });
  const selected=families.bowls;
  const refs=Object.fromEntries(allAssets.map((name,i)=>[`helado${i+1}`,`review/beverages/helado-${i+1}`]));
  const refByName=Object.fromEntries(allAssets.map((name,i)=>[name,refs[`helado${i+1}`]]));
  const map=()=>allAssets.forEach(name=>window.RestaurantMedia?.map?.(refByName[name],base+name));
  map();
  const mk=(id,name,shortName,description,price,pairing,motion,file,theme)=>B.item({
    id,type:'ice-cream',name,shortName,description,price,pairing,motionPreset:motion,
    featured:id==='review-helado-1',availability:'Disponible',media:[{id:'hero',kind:'image',ref:refByName[file],alt:name}],theme
  });
  const fixture={
    enabled:true,preset:'dynamic-selector',eyebrow:'Ice Cream Experience',title:'Un helado. Un mundo.',
    intro:'Cuatro productos de la misma familia visual: plano 3/4 frontal, escala homogénea y composición premium. Todos los assets proceden del propio repositorio.',
    ctaLabel:'Explorar helados',ctaUrl:'#beverages',showPrice:true,showPairing:true,ambientParticles:true,
    items:[
      mk('review-helado-1','Red Velvet','RED VELVET','Helado cremoso con perfil de cacao, crema y migas de red velvet.','€8','Chocolate negro · café','berry',selected[0],{accent:'#b42f45',accentSoft:'#f3a8b5',accentDeep:'#52131f',button:'#d84d66',price:'#ffe2e7',ambient:'rgba(180,47,69,.24)',backdrop:'radial-gradient(circle at 68% 34%,#a52a42 0%,#571321 38%,#20090f 70%,#090607 100%)',glow:'0 42px 130px rgba(180,47,69,.42)'}),
      mk('review-helado-2','Green Apple Caramel','APPLE','Manzana verde, caramelo y vainilla en una copa fresca y cremosa.','€8','Tarta de manzana · brunch','cool',selected[1],{accent:'#9bc04c',accentSoft:'#d9ef9a',accentDeep:'#42621a',button:'#add45b',price:'#efffcf',ambient:'rgba(155,192,76,.23)',backdrop:'radial-gradient(circle at 68% 34%,#9fbd62 0%,#557126 38%,#202c0f 70%,#080b05 100%)',glow:'0 42px 130px rgba(155,192,76,.38)'}),
      mk('review-helado-3','White Chocolate Crisp','WHITE','Chocolate blanco, textura crujiente y crema helada de acabado sedoso.','€9','Frutos secos · sobremesa','neutral',selected[2],{accent:'#d4b36d',accentSoft:'#fff0c8',accentDeep:'#7a5a24',button:'#e0c17b',price:'#fff4d6',ambient:'rgba(212,179,109,.22)',backdrop:'radial-gradient(circle at 68% 34%,#d6bd87 0%,#806335 38%,#332715 70%,#0b0906 100%)',glow:'0 42px 130px rgba(212,179,109,.34)'}),
      mk('review-helado-4','Dark Chocolate','DARK','Chocolate intenso y cremoso con un final profundo de cacao.','€9','Espresso · cacao','warm',selected[3],{accent:'#9b673f',accentSoft:'#dfb58e',accentDeep:'#432817',button:'#b47a4f',price:'#f4d8bd',ambient:'rgba(155,103,63,.24)',backdrop:'radial-gradient(circle at 68% 34%,#805234 0%,#432719 39%,#1a100b 70%,#070504 100%)',glow:'0 42px 130px rgba(155,103,63,.38)'})
    ]
  };

  /* The fixture is editable during review, but it never enters IndexedDB/localStorage.
     Existing Class25 Studio code continues using RestaurantStudioConfig; only the
     beverages namespace is overlaid for this page, keeping one Studio and one durable
     Project State while giving review and engine exactly the same effective state. */
  let current=B.normalize(fixture);
  const pathGet=(obj,path)=>path?path.split('.').reduce((a,k)=>a?.[k],obj):obj;
  const pathSet=(obj,path,value)=>{if(!path)return value;const p=path.split('.'),last=p.pop(),target=p.reduce((a,k)=>(a[k]??={}),obj);target[last]=value;return obj};
  const relative=path=>String(path||'').replace(/^beverages(?:\.|$)/,'');
  const snapshot=()=>B.clone(current);
  const read=path=>{const value=pathGet(current,relative(path));return value===undefined?undefined:B.clone(value)};
  const write=(path,value)=>{
    const rel=relative(path);
    current=rel?B.normalize(pathSet(B.clone(current),rel,value)):B.normalize(value);
    document.dispatchEvent(new CustomEvent('restaurant:beverages-review-changed'));
    queueMicrotask(()=>{
      window.RestaurantBeveragesEngine?.refresh?.();
      window.RestaurantBeveragesStudio?.render?.();
    });
    return true;
  };

  const studio=window.RestaurantStudioConfig;
  if(studio&&!studio.__class25ReviewOverlay){
    const original={get:studio.get?.bind(studio),set:studio.set?.bind(studio),snapshot:studio.snapshot?.bind(studio)};
    Object.defineProperty(studio,'__class25ReviewOverlay',{value:original,configurable:true});
    studio.get=path=>String(path||'')==='beverages'||String(path||'').startsWith('beverages.')?read(path):original.get?.(path);
    studio.set=(path,value)=>String(path||'')==='beverages'||String(path||'').startsWith('beverages.')?write(path,value):original.set?.(path,value);
    studio.snapshot=()=>{const durable=original.snapshot?.()||{};return {...durable,beverages:snapshot()}};
  }

  /* A saved project is allowed to remember Traveler=ON, but that must never leak into
     a Beverage review. Deactivate it at runtime and watch its ready marker so even an
     asynchronous re-activation is cancelled before paint. No Class14 config is saved. */
  const enforceTravelerOff=()=>{
    window.RestaurantScrollTraveler?.deactivate?.();
    const checkbox=document.querySelector('#studio [data-path="scrollTraveler.enabled"]');
    if(checkbox){checkbox.checked=false;checkbox.disabled=true;checkbox.title='Desactivado durante la revisión de Class 25'}
    root.dataset.class25ReviewTraveler='off';
  };
  const travelerObserver=new MutationObserver(()=>{if(root.dataset.scrollTraveler)enforceTravelerOff()});
  travelerObserver.observe(root,{attributes:true,attributeFilter:['data-scroll-traveler']});
  document.addEventListener('restaurant:config-applied',()=>queueMicrotask(enforceTravelerOff));
  [0,120,500].forEach(ms=>setTimeout(enforceTravelerOff,ms));

  const api={active:true,snapshot,read,write,refs,map,allAssets,families,selectedAssets:selected};
  Object.defineProperty(api,'beverages',{get:snapshot});
  window.RestaurantBeveragesReview=Object.freeze(api);
  root.dataset.beverageReview='on';
})();