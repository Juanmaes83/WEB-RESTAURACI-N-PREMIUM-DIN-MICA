/* CLASS 24 — VISUAL REVIEW FIXTURE
   Activated by ?beverage-review=1 OR by the dedicated beverage-review.html surface.
   It maps source-repo images through the shared RestaurantMedia resolver and never
   writes demo content into the Restaurant Project State. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const dedicatedReview=window.__CLASS24_REVIEW__===true || /\/beverage-review\.html$/i.test(location.pathname);
  if(params.get('beverage-review')!=='1' && !dedicatedReview) return;

  /* The source repo stores these assets at /assets (not /public/assets). */
  const base='https://raw.githubusercontent.com/Juanmaes83/starbucks/main/assets/';
  const refs={matcha:'review/beverages/matcha',vanilla:'review/beverages/vanilla',berry:'review/beverages/berry'};
  const map=()=>{
    window.RestaurantMedia?.map?.(refs.matcha,base+'drink-matcha.png');
    window.RestaurantMedia?.map?.(refs.vanilla,base+'drink-vanilla.png');
    window.RestaurantMedia?.map?.(refs.berry,base+'drink-strawberry.png');
  };
  map();
  const B=window.RestaurantBeveragesModel;
  const mk=(id,type,name,shortName,description,price,pairing,motion,ref,theme)=>B.item({
    id,type,name,shortName,description,price,pairing,motionPreset:motion,featured:id==='review-matcha',
    availability:'Disponible',media:[{id:'hero',kind:'image',ref,alt:name}],theme
  });
  const beverages={
    enabled:true,preset:'dynamic-selector',eyebrow:'Beverage Experience',
    title:'Una bebida. Un mundo.',
    intro:'Selecciona una bebida y toda la escena cambia: producto, color, atmósfera, precio y narrativa. Motor adaptado del proyecto fuente Starbucks sin importar React, Next, Zustand ni Lenis.',
    ctaLabel:'Explorar bebidas',ctaUrl:'#beverages',showPrice:true,showPairing:true,ambientParticles:true,
    items:[
      mk('review-matcha','coffee','Matcha Fusion','MATCHA','Matcha frío, crema sedosa y un final vegetal limpio.','€8','Postres cítricos · brunch','cool',refs.matcha,{accent:'#47b987',accentSoft:'#9fe1c1',accentDeep:'#075b3e',button:'#47b987',price:'#d8ffea',ambient:'rgba(71,185,135,.22)',backdrop:'radial-gradient(circle at 68% 34%,#61d6a0 0%,#16805b 34%,#063c2b 66%,#06110d 100%)',glow:'0 42px 130px rgba(71,185,135,.42)'}),
      mk('review-vanilla','coffee','Vanilla Flow','VANILLA','Vainilla, café frío y caramelo con textura cremosa.','€9','Tarta de almendra · sobremesa','warm',refs.vanilla,{accent:'#e3a53b',accentSoft:'#ffd77e',accentDeep:'#8a4d07',button:'#e3a53b',price:'#ffe4a6',ambient:'rgba(227,165,59,.22)',backdrop:'radial-gradient(circle at 68% 34%,#ffe394 0%,#d99528 36%,#7c4108 68%,#170d04 100%)',glow:'0 42px 130px rgba(227,165,59,.38)'}),
      mk('review-berry','mocktail','Strawberry Cloud','BERRY','Fresa, crema ligera y un acabado brillante y refrescante.','€10','Chocolate · frutos rojos','berry',refs.berry,{accent:'#ef6f91',accentSoft:'#ffb0c2',accentDeep:'#982a4a',button:'#ef6f91',price:'#ffdbe4',ambient:'rgba(239,111,145,.22)',backdrop:'radial-gradient(circle at 68% 34%,#ffafc0 0%,#e6577d 38%,#8a2245 70%,#1b0710 100%)',glow:'0 42px 130px rgba(239,111,145,.40)'})
    ]
  };
  window.RestaurantBeveragesReview=Object.freeze({active:true,beverages,refs,map});
  document.documentElement.dataset.beverageReview='on';
})();