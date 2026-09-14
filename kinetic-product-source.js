/* PROJECT 12 — read-only adapter between Restaurant Project State and the Kinetic Product Selector.
   No persistence, no second store, no geometry. Direct page = demo defaults. Shell = current project snapshot. */
(() => {
  'use strict';
  const framed=()=>{
    try{return window.parent!==window&&location.hash==='#shell'&&typeof window.parent.RestaurantExperienceShell?.project==='function'}catch{return false}
  };
  const project=()=>{try{return framed()?window.parent.RestaurantExperienceShell.project():null}catch{return null}};
  const text=v=>typeof v==='string'?v.trim():'';
  const image=(ref,p)=>{
    const v=text(ref);if(!v)return '';
    if(v.startsWith('slot:')){try{return text(p?.resolveMedia?.(v.slice(5)))}catch{return ''}}
    if(/^(https?:|data:|blob:|\/)/.test(v))return v;
    if(v.startsWith('assets/'))return `../../${v}`;
    return v;
  };
  function config(defaults){
    const p=project();const src=p?.kineticProductSelector;
    if(!src||typeof src!=='object')return defaults;
    const out=structuredClone(defaults);
    out.brand={...out.brand,...(src.brand||{})};
    out.cta={...out.cta,...(src.cta||{})};
    out.autoplay={...out.autoplay,...(src.autoplay||{})};
    if(Array.isArray(src.products)&&src.products.length){
      out.products=out.products.map((base,i)=>{
        const over=src.products[i]||{};const resolved=image(over.image,p);
        return {...base,...over,image:resolved||base.image};
      });
    }
    document.documentElement.dataset.kpsSource='project';
    return out;
  }
  window.RestaurantKineticSource=Object.freeze({config});
})();