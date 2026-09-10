/* CLASS 25 — BEVERAGE EXPERIENCE · PROJECT MODEL
   Half Orbit is Class 24. Beverages therefore starts at the next free class number.
   Structural restaurant content: one Project State, no parallel store, no DOM. */
(() => {
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const PRESETS=Object.freeze(['dynamic-selector','beverage-cellar','bottle-rail','cocktail-stage','minimal-wine-list']);
  const TYPES=Object.freeze(['coffee','cocktail','wine','beer','spirit','soft-drink','mocktail','other']);
  const MOTION=Object.freeze(['cool','warm','berry','neutral']);
  const DEFAULT_THEME=Object.freeze({accent:'#d8ff4f',accentSoft:'#efffb3',accentDeep:'#7f9727',button:'#d8ff4f',price:'#f5f0e7',ambient:'rgba(216,255,79,.16)',backdrop:'radial-gradient(circle at 66% 38%,#55641d 0%,#1b210c 38%,#080807 74%)',glow:'0 42px 120px rgba(216,255,79,.24)'});
  const DEFAULTS=Object.freeze({enabled:false,preset:'dynamic-selector',eyebrow:'Bebidas',title:'La carta también se bebe.',intro:'',ctaLabel:'Ver carta',ctaUrl:'',showPrice:true,showPairing:true,ambientParticles:true,items:[]});
  const mediaRef=m=>m&&m.ref?{id:m.id||String(m.ref).split('/').pop(),kind:m.kind==='video'?'video':'image',ref:String(m.ref),alt:m.alt||''}:null;
  const item=(patch={})=>({id:patch.id||`bev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,enabled:patch.enabled!==false,type:TYPES.includes(patch.type)?patch.type:'other',name:patch.name||'',shortName:patch.shortName||patch.name||'',description:patch.description||'',price:patch.price??null,ingredients:patch.ingredients||'',pairing:patch.pairing||'',availability:patch.availability||'',featured:patch.featured===true,motionPreset:MOTION.includes(patch.motionPreset)?patch.motionPreset:'neutral',theme:{...clone(DEFAULT_THEME),...(patch.theme||{})},media:Array.isArray(patch.media)?patch.media.map(mediaRef).filter(Boolean):[]});
  function normalize(value){const v=value&&typeof value==='object'?value:{};return {...clone(DEFAULTS),...v,enabled:v.enabled===true,preset:PRESETS.includes(v.preset)?v.preset:DEFAULTS.preset,eyebrow:typeof v.eyebrow==='string'?v.eyebrow:DEFAULTS.eyebrow,title:typeof v.title==='string'?v.title:DEFAULTS.title,intro:typeof v.intro==='string'?v.intro:'',ctaLabel:typeof v.ctaLabel==='string'?v.ctaLabel:DEFAULTS.ctaLabel,ctaUrl:typeof v.ctaUrl==='string'?v.ctaUrl:'',showPrice:v.showPrice!==false,showPairing:v.showPairing!==false,ambientParticles:v.ambientParticles!==false,items:Array.isArray(v.items)?v.items.map(item):[]};}
  const visible=b=>(b?.items||[]).filter(x=>x&&x.enabled!==false);
  const newMediaId=kind=>`${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`;
  const refFor=(itemId,mediaId)=>`project/beverages/${itemId}/${mediaId}`;
  if(window.RestaurantDefaults&&!window.RestaurantDefaults.beverages)window.RestaurantDefaults.beverages=clone(DEFAULTS);
  window.RestaurantBeveragesModel=Object.freeze({PRESETS,TYPES,MOTION,DEFAULT_THEME,DEFAULTS,item,mediaRef,normalize,visible,newMediaId,refFor,clone});
})();