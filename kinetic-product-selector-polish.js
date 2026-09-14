/* Project 12 — final motion polish for the 05/06 handoff.
   Keeps the core selector untouched and only normalizes the problematic final transition. */
(() => {
  'use strict';

  const root=document.documentElement;
  const hero=document.querySelector('#kps-hero');
  const stage=document.querySelector('#kps-stage');
  const cta=document.querySelector('#kps-cta');
  const shadow=document.querySelector('#kps-product-shadow');
  if(!hero||!stage)return;

  let previousIndex=Number(root.dataset.kpsIndex||window.KineticProductSelector?.state?.().index||0);
  let transitionToken=0;
  let revealTimer=0;

  const setFinalVisible=visible=>{
    stage.classList.toggle('is-final',visible);
    if(!cta)return;
    cta.tabIndex=visible?0:-1;
    cta.setAttribute('aria-hidden',String(!visible));
  };

  const clearReveal=()=>{
    if(!revealTimer)return;
    clearTimeout(revealTimer);
    revealTimer=0;
  };

  const cancelHeroMotion=()=>{
    hero.getAnimations().forEach(animation=>animation.cancel());
    shadow?.getAnimations().forEach(animation=>animation.cancel());
    hero.style.clipPath='none';
    hero.style.opacity='1';
  };

  const cleanupHero=()=>{
    hero.style.clipPath='none';
    hero.style.opacity='';
    hero.style.transform='';
  };

  const HANDOFFS={
    '4>5':[
      {transform:'translate3d(14%,12%,0) scale(.88) rotate(3deg)',clipPath:'inset(0 0 0 0 round 0)',opacity:.34},
      {transform:'translate3d(-1%,-2%,0) scale(1.025) rotate(-1deg)',clipPath:'inset(0 0 0 0 round 0)',opacity:1,offset:.72},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',clipPath:'inset(0 0 0 0 round 0)',opacity:1}
    ],
    '5>4':[
      {transform:'translate3d(-14%,8%,0) scale(.9) rotate(-3deg)',clipPath:'inset(0 0 0 0 round 0)',opacity:.34},
      {transform:'translate3d(1%,-1%,0) scale(1.02) rotate(1deg)',clipPath:'inset(0 0 0 0 round 0)',opacity:1,offset:.72},
      {transform:'translate3d(0,0,0) scale(1) rotate(0)',clipPath:'inset(0 0 0 0 round 0)',opacity:1}
    ]
  };

  function runHandoff(from,to){
    const frames=HANDOFFS[`${from}>${to}`];
    if(!frames)return false;

    cancelHeroMotion();
    const token=++transitionToken;
    const animation=hero.animate(frames,{duration:480,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});
    const shadowAnimation=shadow?.animate([
      {transform:'translateX(-50%) scale(.82)',opacity:.1},
      {transform:'translateX(-50%) scale(1.04)',opacity:.21,offset:.72},
      {transform:'translateX(-50%) scale(1)',opacity:.18}
    ],{duration:480,easing:'cubic-bezier(.16,.86,.2,1)',fill:'both'});

    animation.finished.then(()=>{
      if(token!==transitionToken)return;
      cleanupHero();
      animation.cancel();
      shadowAnimation?.cancel();
      if(to===5&&Number(root.dataset.kpsIndex)===5)setFinalVisible(true);
    }).catch(()=>{});
    return true;
  }

  document.addEventListener('kinetic:product-change',event=>{
    clearReveal();
    const next=Number(event.detail?.index??root.dataset.kpsIndex??0);
    const from=previousIndex;
    previousIndex=next;

    if(next!==5)setFinalVisible(false);

    if(next===5){
      /* The core selector exposes the CTA immediately. Hide it until the hero has landed. */
      setFinalVisible(false);
      if(runHandoff(from,next))return;

      const token=++transitionToken;
      hero.style.clipPath='none';
      revealTimer=setTimeout(()=>{
        if(token===transitionToken&&Number(root.dataset.kpsIndex)===5)setFinalVisible(true);
      },430);
      return;
    }

    if(from===5&&next===4){
      runHandoff(from,next);
      return;
    }

    ++transitionToken;
  });
})();
