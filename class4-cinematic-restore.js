/* CLASS 04 — restore the proven Class 03 cinematic layer without owning Studio state. */
(() => {
  'use strict';
  const loadGuard=()=>{if(document.querySelector('script[data-class4-guard]'))return;const s=document.createElement('script');s.src='class4-runtime-guard.js';s.dataset.class4Guard='1';document.body.appendChild(s);};
  const loadUrban=()=>{if(document.querySelector('script[data-class5-urban]'))return;const s=document.createElement('script');s.src='class5-urban-acrobatics.js';s.dataset.class5Urban='1';document.body.appendChild(s);};
  const ready=()=>{
    loadGuard();
    loadUrban();
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
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ready,80));else setTimeout(ready,80);
})();