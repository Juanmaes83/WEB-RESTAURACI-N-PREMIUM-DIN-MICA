/* CLASS 06 — visual hero click bridge
   Resolves overlapping orbit dishes by hit-testing the geometrically central dish
   from the orbit-shell capture phase. It does not modify Class 05 choreography. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const shell=$('.orbit-shell');
  const stage=$('#orbit-stage');
  if(!shell||!stage)return;

  /* The bridge exists to catch clicks that land near the hero but not on a dish
     element, so it deliberately does not require a dish as the target. That makes it
     fire for ANY click inside the shell — including clicks on content a motion preset
     has put there, which then opens a dish detail nobody asked for.
     So it stands down whenever #orbit-stage is not the interactive stage: a preset
     that hides the base dishes owns the shell and its own selection. */
  const baseStageLive=()=>{
    const cs=getComputedStyle(stage);
    return cs.visibility!=='hidden'&&cs.display!=='none'&&cs.pointerEvents!=='none';
  };

  const visualHero=()=>{
    const sr=shell.getBoundingClientRect();
    const cx=sr.left+sr.width/2, cy=sr.top+sr.height/2;
    return $$('.orbit-dish',stage)
      .map(el=>{
        const r=el.getBoundingClientRect();
        return {el,r,score:Math.abs(r.left+r.width/2-cx)+Math.abs(r.top+r.height/2-cy)*.18};
      })
      .sort((a,b)=>a.score-b.score)[0]||null;
  };

  const pointInsideHero=(hero,x,y)=>{
    const r=hero.r;
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const rx=Math.max(1,r.width*.47), ry=Math.max(1,r.height*.47);
    const nx=(x-cx)/rx, ny=(y-cy)/ry;
    return nx*nx+ny*ny<=1;
  };

  function openHero(hero){
    if(!hero?.el)return;
    /* Class 06 owns the public detail. Request its explicit API when present. */
    if(typeof window.RestaurantClass6Detail?.open==='function'){
      window.RestaurantClass6Detail.open(hero.el);
      return;
    }
    /* Safe fallback for older Class 06 runtime: use the public Explore action. */
    $('#explore-dish')?.click();
  }

  shell.addEventListener('click',e=>{
    if(document.documentElement.dataset.dishDetail==='open')return;
    if(!baseStageLive())return;
    const hero=visualHero();
    if(!hero||!pointInsideHero(hero,e.clientX,e.clientY))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openHero(hero);
  },true);

  shell.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||document.documentElement.dataset.dishDetail==='open')return;
    if(!baseStageLive())return;
    const hero=visualHero();
    if(!hero)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openHero(hero);
  },true);
})();