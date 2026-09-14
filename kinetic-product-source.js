/* PROJECT 12 — canonical read-only bridge from Restaurant Project State to Kinetic Product Selector.
   Canonical state lives at modules.kineticProductSelector. No second store, no localStorage, no persistence here. */
(() => {
  'use strict';
  const text=v=>typeof v==='string'?v.trim():'';
  const framed=()=>{try{return window.parent!==window&&location.hash==='#shell'}catch{return false}};
  const parentConfig=()=>{try{return framed()?window.parent.RestaurantStudioConfig:null}catch{return null}};
  const shellProject=()=>{try{return framed()&&typeof window.parent.RestaurantExperienceShell?.project==='function'?window.parent.RestaurantExperienceShell.project():null}catch{return null}};
  const source=()=>{
    const cfg=parentConfig();
    const canonical=cfg?.get?.('modules.kineticProductSelector');
    if(canonical&&typeof canonical==='object')return canonical;
    const p=shellProject();
    const nested=p?.modules?.kineticProductSelector;
    if(nested&&typeof nested==='object')return nested;
    /* Legacy is read-only compatibility. New writes never use this path. */
    const legacy=p?.kineticProductSelector;
    return legacy&&typeof legacy==='object'?legacy:null;
  };
  const canonicalAsset=v=>{
    const s=text(v);
    return /^(?:\.\.\/\.\.\/)?assets\/kinetic-product-selector\/0[1-6]-[^/]+\.webp$/i.test(s)?`${s}.png`:s;
  };
  const resolveMedia=slot=>{
    try{return text(window.parent.RestaurantMediaResolve?.(slot))||text(shellProject()?.resolveMedia?.(slot))}catch{return ''}
  };
  const image=ref=>{
    const v=canonicalAsset(ref);if(!v)return '';
    if(v.startsWith('slot:'))return resolveMedia(v.slice(5));
    if(/^(https?:|data:|blob:|\/)/.test(v))return v;
    if(v.startsWith('assets/'))return `../../${v}`;
    return v;
  };
  const merge=(base,over)=>{
    if(Array.isArray(base))return Array.isArray(over)?base.map((v,i)=>merge(v,over[i]||{})):base.map(v=>merge(v,{}));
    if(base&&typeof base==='object'){const out={...base};Object.keys(over||{}).forEach(k=>out[k]=k in base?merge(base[k],over[k]):over[k]);return out;}
    return over===undefined||over===null||over===''?base:over;
  };
  function config(defaults){
    const src=source();const out=merge(structuredClone(defaults),src||{});
    out.products=(out.products||[]).map(p=>({...p,image:image(p.image)||image(defaults?.products?.find?.(d=>d.id===p.id)?.image)||p.image}));
    document.documentElement.dataset.kpsSource=src?'project':'defaults';
    document.documentElement.dataset.kpsStatePath='modules.kineticProductSelector';
    return out;
  }
  window.RestaurantKineticSource=Object.freeze({config,statePath:'modules.kineticProductSelector'});
})();