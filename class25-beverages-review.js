/* CLASS 25 — BEVERAGE / ICE CREAM REVIEW FIXTURE
   ?review=beverages only. All visual assets come from this repository.
   Visual review classified the HELADO files into three camera families. The main
   selector intentionally uses only the strongest homogeneous family: HELADO 1–4.
   The full inventory is still exposed for future variants; nothing is discarded. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('review')!=='beverages')return;
  const B=window.RestaurantBeveragesModel;if(!B)return;
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
  const beverages={
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
  window.RestaurantBeveragesReview=Object.freeze({active:true,beverages,refs,map,allAssets,families,selectedAssets:selected});
  document.documentElement.dataset.beverageReview='on';
})();