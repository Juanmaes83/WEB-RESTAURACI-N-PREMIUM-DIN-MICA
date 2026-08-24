/* CLASS 04 — restore the proven Class 03 cinematic layer without owning Studio state. */
(() => {
  'use strict';
  const loadGuard=()=>{if(document.querySelector('script[data-class4-guard]'))return;const s=document.createElement('script');s.src='class4-runtime-guard.js';s.dataset.class4Guard='1';document.body.appendChild(s);};

  /* CLASS 05 — ORBITAL CHOREOGRAPHY ONLY.
     The outer .orbit-dish keeps the proven Class 04 orbital geometry.
     The inner <img> becomes the dancer: lift, twist, counter-rotation and hero landing.
     No Studio, content, persistence or non-orbital section logic is changed here. */
  function setupOrbitalChoreography(){
    const shell=document.querySelector('.orbit-shell');
    const stage=document.querySelector('#orbit-stage');
    if(!shell||!stage||!window.gsap)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    document.documentElement.dataset.orbitalChoreography='class05-dance';

    let lastDance=0;
    let dragStartX=null;
    let breathTween=null;
    let breathTimer=null;

    const dishes=()=>[...stage.querySelectorAll('.orbit-dish')];
    const shellCenter=()=>{const r=shell.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
    const dishInfo=()=>{
      const c=shellCenter();
      return dishes().map((el,index)=>{const r=el.getBoundingClientRect();return {el,index,x:r.left+r.width/2,y:r.top+r.height/2,dx:r.left+r.width/2-c.x,dy:r.top+r.height/2-c.y};});
    };
    const centreInfo=()=>dishInfo().sort((a,b)=>Math.abs(a.dx)+Math.abs(a.dy)*.22-(Math.abs(b.dx)+Math.abs(b.dy)*.22))[0];

    function stopBreathing(){
      clearTimeout(breathTimer);
      breathTween?.kill?.();
      breathTween=null;
      dishes().forEach(el=>{const img=el.querySelector('img');if(img)gsap.set(img,{scale:1,y:0,rotation:0,scaleX:1,scaleY:1});});
    }

    function startBreathing(){
      clearTimeout(breathTimer);
      breathTimer=setTimeout(()=>{
        const centre=centreInfo();
        const img=centre?.el.querySelector('img');
        if(!img)return;
        breathTween=gsap.to(img,{scale:1.012,y:-2,duration:1.75,ease:'sine.inOut',yoyo:true,repeat:-1});
      },1050);
    }

    function ensembleEntrance(){
      const all=dishInfo();
      if(!all.length)return;
      const centre=centreInfo();
      all.sort((a,b)=>Math.abs(b.dx)-Math.abs(a.dx)).forEach((item,i)=>{
        const img=item.el.querySelector('img');
        if(!img)return;
        const side=Math.sign(item.dx)||1;
        const isHero=item.el===centre?.el;
        gsap.fromTo(img,
          {opacity:.3,y:22+Math.abs(item.dx)*.018,rotation:side*(isHero?2:7),scale:isHero?.88:.84,scaleX:.96,scaleY:1.02},
          {opacity:1,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,duration:isHero?1.05:.78,delay:i*.055,ease:isHero?'power4.out':'power3.out'}
        );
      });
      startBreathing();
    }

    function dance(direction=1,source='step'){
      const now=performance.now();
      if(source==='wheel'&&now-lastDance<260)return;
      lastDance=now;
      stopBreathing();
      const info=dishInfo();
      if(info.length<2)return;
      const centre=centreInfo();
      const candidates=info.filter(x=>direction>0?x.dx>8:x.dx<-8).sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx));
      const incoming=candidates[0]||info.filter(x=>x!==centre).sort((a,b)=>Math.abs(a.dx)-Math.abs(b.dx))[0];

      info.forEach(item=>{
        const img=item.el.querySelector('img');
        if(!img)return;
        gsap.killTweensOf(img);
        const side=Math.sign(item.dx)||direction;
        const distanceRank=Math.min(3,Math.round(Math.abs(item.dx)/(Math.max(1,shell.clientWidth)*.16)));

        if(item===incoming){
          /* SOLOIST: curved lift + turn + restrained overshoot + presentation. */
          gsap.timeline({delay:.025,ease:'none'})
            .to(img,{y:-17,rotation:direction*7.2,scaleX:.965,scaleY:1.025,scale:.985,duration:.22,ease:'power2.out'})
            .to(img,{y:-7,rotation:direction*-2.2,scaleX:1.015,scaleY:.99,scale:1.045,duration:.28,ease:'power3.inOut'})
            .to(img,{y:2,rotation:direction*.65,scaleX:1.004,scaleY:.997,scale:1.018,duration:.18,ease:'power2.out'})
            .to(img,{y:0,rotation:0,scaleX:1,scaleY:1,scale:1,duration:.20,ease:'sine.out'});
        }else if(item===centre){
          /* The current soloist yields the stage instead of sliding away mechanically. */
          gsap.timeline()
            .to(img,{y:7,rotation:direction*-3.8,scale:.982,scaleX:.99,scaleY:1.01,duration:.20,ease:'power2.in'})
            .to(img,{y:-4,rotation:direction*-5.2,scale:.97,duration:.25,ease:'power2.inOut'})
            .to(img,{y:0,rotation:0,scale:1,scaleX:1,scaleY:1,duration:.28,ease:'power3.out'});
        }else{
          /* Ensemble wave: every plate moves, but less than the soloist. */
          const delay=.035+distanceRank*.018;
          const lift=4+Math.max(0,2-distanceRank)*2;
          const twist=side*(2.1+distanceRank*.55);
          gsap.timeline({delay})
            .to(img,{y:-lift,rotation:twist,scaleX:.99,scaleY:1.008,duration:.22,ease:'sine.out'})
            .to(img,{y:1,rotation:-twist*.28,duration:.24,ease:'sine.inOut'})
            .to(img,{y:0,rotation:0,scaleX:1,scaleY:1,duration:.24,ease:'sine.out'});
        }
      });

      /* The copy belongs to the soloist: a small musical accent, never a separate show. */
      const copy=document.querySelector('.dish-copy');
      if(copy)gsap.fromTo(copy,{x:direction*8,opacity:.82},{x:0,opacity:1,duration:.52,delay:.22,ease:'power3.out',overwrite:true});
      startBreathing();
    }

    function bind(){
      const next=document.querySelector('#next-dish');
      const prev=document.querySelector('#prev-dish');
      next?.addEventListener('click',()=>dance(1,'button'),true);
      prev?.addEventListener('click',()=>dance(-1,'button'),true);
      shell.addEventListener('wheel',e=>dance(e.deltaY>=0?1:-1,'wheel'),{passive:true,capture:true});
      shell.addEventListener('keydown',e=>{if(e.key==='ArrowRight')dance(1,'keyboard');if(e.key==='ArrowLeft')dance(-1,'keyboard');},true);
      shell.addEventListener('pointerdown',e=>{dragStartX=e.clientX;stopBreathing();},{passive:true,capture:true});
      shell.addEventListener('pointerup',e=>{if(dragStartX===null)return;const dx=e.clientX-dragStartX;dragStartX=null;if(Math.abs(dx)>16)dance(dx<0?1:-1,'drag');else startBreathing();},{passive:true,capture:true});
      stage.addEventListener('click',e=>{const dish=e.target.closest('.orbit-dish');if(!dish)return;const c=shellCenter();const r=dish.getBoundingClientRect();const dx=r.left+r.width/2-c.x;if(Math.abs(dx)>20)dance(dx>0?1:-1,'dish');},true);
    }

    const wait=()=>{
      if(dishes().length){bind();ensembleEntrance();return;}
      const observer=new MutationObserver(()=>{if(dishes().length){observer.disconnect();bind();ensembleEntrance();}});
      observer.observe(stage,{childList:true});
      setTimeout(()=>observer.disconnect(),5000);
    };
    wait();
  }

  const ready=()=>{
    loadGuard();
    if(!window.gsap||!window.ScrollTrigger)return;
    gsap.registerPlugin(ScrollTrigger);

    const heroTl=gsap.timeline({defaults:{ease:'power3.out'}});
    heroTl.fromTo('.hero-media',{scale:1.08,filter:'brightness(.62)'},{scale:1,filter:'brightness(.82)',duration:1.5},0)
      .fromTo('.hero-copy .kicker',{opacity:0,y:18,letterSpacing:'.32em'},{opacity:1,y:0,letterSpacing:'.16em',duration:.65},.18)
      .fromTo('.split-reveal span',{clipPath:'inset(0 0 100% 0)',y:40},{clipPath:'inset(0 0 0% 0)',y:0,duration:1},.28)
      .fromTo('.split-reveal em',{clipPath:'inset(100% 0 0 0)',y:-24,opacity:0},{clipPath:'inset(0% 0 0 0)',y:0,opacity:1,duration:.9},.48)
      .fromTo('.hero-side',{opacity:0,x:32},{opacity:1,x:0,duration:.8},.68)
      .fromTo('.hero-stamp,.scroll-hint',{opacity:0,y:10},{opacity:1,y:0,duration:.6,stagger:.08},.9);

    gsap.to('.hero-media',{yPercent:9,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    document.querySelectorAll('.parallax-card .media-host-fill').forEach(media=>{
      gsap.fromTo(media,{yPercent:-4,scale:1.06},{yPercent:6,scale:1.01,ease:'none',scrollTrigger:{trigger:media.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
    });

    const presets=[
      ['.intro .section-no',{x:-22,opacity:0}],
      ['.produce-sticky',{x:-34,opacity:0}],
      ['.produce-media',{x:34,opacity:0,scale:.97}],
      ['.experience-title',{y:42,opacity:0}],
      ['.wide-image',{clipPath:'inset(0 0 100% 0)'}],
      ['.experience-notes',{x:30,opacity:0}],
      ['.chef-image',{clipPath:'inset(0 100% 0 0)'}],
      ['.chef-copy',{x:34,opacity:0}],
      ['.reserve-banner .display',{y:52,opacity:0}]
    ];
    presets.forEach(([sel,from])=>document.querySelectorAll(sel).forEach(el=>gsap.from(el,{...from,duration:1.05,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%',once:true}})));

    gsap.from('.orbital-heading>*',{opacity:0,y:30,duration:.85,stagger:.09,ease:'power3.out',scrollTrigger:{trigger:'.orbital-section',start:'top 72%',once:true}});
    gsap.from('.orbit-shell',{opacity:0,scale:.88,filter:'blur(10px)',duration:1.1,ease:'power4.out',scrollTrigger:{trigger:'.orbit-shell',start:'top 82%',once:true}});
    gsap.from('.dish-copy>*',{opacity:0,y:16,duration:.65,stagger:.05,ease:'power2.out',scrollTrigger:{trigger:'.dish-copy',start:'top 90%',once:true}});

    document.querySelectorAll('.produce-media,.wide-image,.chef-image').forEach(card=>{
      card.addEventListener('mouseenter',()=>gsap.to(card.querySelector('.media-host-fill'),{scale:1.055,duration:.75,ease:'power3.out'}));
      card.addEventListener('mouseleave',()=>gsap.to(card.querySelector('.media-host-fill'),{scale:1.01,duration:.9,ease:'power3.out'}));
    });

    setupOrbitalChoreography();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ready,80));else setTimeout(ready,80);
})();