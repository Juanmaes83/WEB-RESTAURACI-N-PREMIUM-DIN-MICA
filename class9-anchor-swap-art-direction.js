/* CLASS 09 · PROJECT 02 — FINAL ART-DIRECTION MICRO PASS
   Keeps the approved Anchor Swap engine intact and only replaces the held-product
   art direction: three product assets photographed/generated to be held, per-product
   pocket layout, and a slight diagonal departure so the outgoing object never reads
   as travelling through the wrist.

   This file is deliberately additive. class9-anchor-swap.js remains the authoritative
   gesture/world/commit engine. If this layer fails to load, Anchor Swap falls back to
   the original Project 01 food cutouts rather than breaking navigation. */
(() => {
  'use strict';

  const MODE='anchor-swap';
  const root=document.documentElement;
  const ASSETS={
    highball:'https://d2ol7oe51mr4n9.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/7e293eeb-2220-42d0-a436-c3ec593e72e8.webp',
    stemless:'https://d2ol7oe51mr4n9.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/f83605f6-72ca-4608-9e52-e90f1a71d79c.webp',
    bowl:'https://d2ol7oe51mr4n9.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/9e7ced69-1f4c-4556-995e-0d6029be3c45.webp'
  };

  /* Percentages are relative to .as-anchor (the measured hand canvas).
     The three physical product types are each used twice across the six demo dishes.
     Their order is staggered so non-adjacent navigation still proves that highball,
     stemless glass and bowl are genuinely different held objects. */
  const PROFILES=[
    {asset:ASSETS.highball, x:51.5,y:31.2,w:40,rotate:-1.5, outDrift:8.0,inDrift:6.0,type:'highball'},
    {asset:ASSETS.stemless,x:52.0,y:32.0,w:47,rotate: 1.2, outDrift:7.0,inDrift:5.5,type:'stemless'},
    {asset:ASSETS.bowl,    x:51.0,y:34.4,w:58,rotate:-1.0, outDrift:9.0,inDrift:6.5,type:'bowl'},
    {asset:ASSETS.stemless,x:51.8,y:32.1,w:46,rotate: 1.0, outDrift:7.2,inDrift:5.5,type:'stemless'},
    {asset:ASSETS.highball,x:51.4,y:31.1,w:39,rotate:-1.4, outDrift:8.0,inDrift:6.0,type:'highball'},
    {asset:ASSETS.bowl,    x:51.7,y:34.0,w:57,rotate: 1.1, outDrift:9.0,inDrift:6.5,type:'bowl'}
  ];

  const profile=i=>PROFILES[((Number(i)||0)%PROFILES.length+PROFILES.length)%PROFILES.length];
  const state=()=>window.RestaurantAnchorSwap?.state?.();
  const active=()=>root.dataset.orbitalMotion===MODE&&!!window.RestaurantAnchorSwap;

  /* Preload once so a gesture never reveals a late image request. */
  Object.values(ASSETS).forEach(src=>{const i=new Image();i.decoding='async';i.src=src});

  function stageEls(){
    return {
      anchor:document.querySelector('.as-anchor'),
      out:document.querySelector('.as-product-out'),
      incoming:document.querySelector('.as-product-in')
    };
  }

  function setAsset(el,p,index){
    if(!el||!p||el.dataset.heldProfileFailed==='1')return;
    el.dataset.heldIndex=String(index);
    el.dataset.heldType=p.type;

    /* IMPORTANT: class9 refreshPair() is authoritative and can rewrite src whenever
       the base product pair changes. Therefore the source of truth is the ACTUAL src,
       not data-held-asset. Comparing only the dataset made V1 of this micro-pass lose
       the held media after a rebuild while tests still exercised the underlying engine. */
    const current=el.getAttribute('src')||'';
    if(!el.dataset.heldFallback && current && current!==p.asset)el.dataset.heldFallback=current;
    el.dataset.heldAsset=p.asset;
    if(current!==p.asset){
      el.onerror=()=>{
        if(el.dataset.heldProfileFailed==='1')return;
        el.dataset.heldProfileFailed='1';
        const f=el.dataset.heldFallback;
        if(f)el.src=f;
      };
      el.src=p.asset;
    }
  }

  function layout(el,p,progress,dir,isIncoming){
    if(!el||!p)return;
    const t=Math.max(0,Math.min(1,Number(progress)||0));
    /* Independent layout offset is intentionally NOT part of GSAP's transform;
       class9 remains owner of y/scale/rotation/opacity. left gives us the final
       diagonal trajectory without introducing a second transform owner. */
    const drift=isIncoming?(-dir*(1-t)*p.inDrift):(dir*t*p.outDrift);
    el.style.left=`${p.x+drift}%`;
    el.style.top=`${p.y}%`;
    el.style.width=`${p.w}%`;
    el.style.rotate=`${p.rotate}deg`;
    el.style.transformOrigin='50% 62%';
  }

  function apply(){
    if(!active())return;
    const s=state();if(!s)return;
    const {out,incoming}=stageEls();if(!out||!incoming)return;
    const po=profile(s.outIndex), pi=profile(s.inIndex);
    setAsset(out,po,s.outIndex);setAsset(incoming,pi,s.inIndex);
    layout(out,po,s.progress,s.direction,false);
    layout(incoming,pi,s.progress,s.direction,true);
    root.dataset.anchorHeldAssets='ready';
  }

  /* class9 writes data-anchor-progress on every rendered frame. Observing that one
     attribute keeps this art pass phase-locked to the approved continuous gesture. */
  new MutationObserver(m=>{
    if(m.some(x=>x.attributeName==='data-anchor-progress'||x.attributeName==='data-orbital-motion'))apply();
  }).observe(root,{attributes:true,attributeFilter:['data-anchor-progress','data-orbital-motion']});

  /* refreshPair() rewrites product src when a pair changes; immediately remap it. */
  const sceneObserver=new MutationObserver(()=>apply());
  const bind=()=>{
    const scene=document.querySelector('.as-scene');
    if(scene){sceneObserver.disconnect();sceneObserver.observe(scene,{subtree:true,attributes:true,attributeFilter:['src']});apply();return true}
    return false;
  };

  window.addEventListener('restaurant:motion-change',()=>setTimeout(()=>{bind();apply()},80));
  window.addEventListener('restaurant:dish-detail-close',()=>setTimeout(()=>{bind();apply()},320));
  addEventListener('resize',apply);

  let tries=0;const boot=setInterval(()=>{
    tries++;if(bind()||tries>40)clearInterval(boot);
  },100);

  window.RestaurantAnchorSwapArtDirection={
    assets:{...ASSETS},profiles:PROFILES.map(x=>({...x})),apply,
    status:()=>({active:active(),ready:root.dataset.anchorHeldAssets==='ready',state:state(),
      outSrc:document.querySelector('.as-product-out')?.getAttribute('src')||'',
      inSrc:document.querySelector('.as-product-in')?.getAttribute('src')||''})
  };
})();