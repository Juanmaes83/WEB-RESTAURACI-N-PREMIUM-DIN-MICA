/* CLASS 25 — BEVERAGE REVIEW FIXTURE
   Only ?review=beverages. Uses the repo-local ASIATICO asset first; two source-repo
   drinks remain temporary comparison fixtures until the newly uploaded asset set is
   visually classified. No review data is persisted into Restaurant Project State. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('review')!=='beverages')return;
  const B=window.RestaurantBeveragesModel;if(!B)return;
  const refs={asiatico:'review/beverages/asiatico',matcha:'review/beverages/matcha',berry:'review/beverages/berry'};
  const map=()=>{
    window.RestaurantMedia?.map?.(refs.asiatico,'assets/half-orbit/dishes-transparent/ASIATICO 1.png');
    window.RestaurantMedia?.map?.(refs.matcha,'https://raw.githubusercontent.com/Juanmaes83/starbucks/main/assets/drink-matcha.png');
    window.RestaurantMedia?.map?.(refs.berry,'https://raw.githubusercontent.com/Juanmaes83/starbucks/main/assets/drink-strawberry.png');
  };
  map();
  const mk=(id,type,name,shortName,description,price,pairing,motion,ref,theme)=>B.item({id,type,name,shortName,description,price,pairing,motionPreset:motion,featured:id==='review-asiatico',availability:'Disponible',media:[{id:'hero',kind:'image',ref,alt:name}],theme});
  const beverages={enabled:true,preset:'dynamic-selector',eyebrow:'Beverage Experience',title:'Una bebida. Un mundo.',intro:'Elige una bebida y cambia la escena completa: producto, color, atmósfera, precio y narrativa. Integrado sobre la línea Half Orbit actual.',ctaLabel:'Explorar bebidas',ctaUrl:'#beverages',showPrice:true,showPairing:true,ambientParticles:true,items:[
    mk('review-asiatico','coffee','Café Asiático','ASIÁTICO','Café, licor y crema en una composición de sobremesa con identidad mediterránea.','€8','Chocolate · sobremesa','warm',refs.asiatico,{accent:'#d59a53',accentSoft:'#f2d6aa',accentDeep:'#6d3918',button:'#d59a53',price:'#ffe7c1',ambient:'rgba(213,154,83,.23)',backdrop:'radial-gradient(circle at 68% 34%,#d4a363 0%,#7a431e 37%,#30180e 69%,#0c0806 100%)',glow:'0 42px 130px rgba(213,154,83,.38)'}),
    mk('review-matcha','coffee','Matcha Fusion','MATCHA','Matcha frío y crema sedosa con un final vegetal limpio.','€9','Cítricos · brunch','cool',refs.matcha,{accent:'#47b987',accentSoft:'#9fe1c1',accentDeep:'#075b3e',button:'#47b987',price:'#d8ffea',ambient:'rgba(71,185,135,.22)',backdrop:'radial-gradient(circle at 68% 34%,#61d6a0 0%,#16805b 34%,#063c2b 66%,#06110d 100%)',glow:'0 42px 130px rgba(71,185,135,.42)'}),
    mk('review-berry','mocktail','Strawberry Cloud','BERRY','Fresa y crema ligera con un acabado brillante y refrescante.','€10','Chocolate · frutos rojos','berry',refs.berry,{accent:'#ef6f91',accentSoft:'#ffb0c2',accentDeep:'#982a4a',button:'#ef6f91',price:'#ffdbe4',ambient:'rgba(239,111,145,.22)',backdrop:'radial-gradient(circle at 68% 34%,#ffafc0 0%,#e6577d 38%,#8a2245 70%,#1b0710 100%)',glow:'0 42px 130px rgba(239,111,145,.40)'})
  ]};
  window.RestaurantBeveragesReview=Object.freeze({active:true,beverages,refs,map});
  document.documentElement.dataset.beverageReview='on';
})();