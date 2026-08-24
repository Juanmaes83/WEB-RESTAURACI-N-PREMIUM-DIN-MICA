/* CLASS 05 — MOTION DIRECTION PREMIUM
   Configurable text/media presets, preview replay, hover, cursor and responsive motion.
   Does not own restaurant content or persistence. */
(() => {
  'use strict';
  const root=document.documentElement;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=()=>innerWidth<768;
  let triggers=[];

  const sectionMap={
    hero:{target:'.hero',text:['.hero-copy .kicker','.split-reveal span','.split-reveal em','.hero-side','.hero-stamp','.scroll-hint'],media:'[data-media-host="hero"]'},
    philosophy:{target:'#story',text:['#philosophy-index','#philosophy-title','.intro-grid p']},
    origin:{target:'#experience',text:['#origin-index','#origin-title','#origin-body','#origin-caption'],media:'[data-media-host="origin"]'},
    atmosphere:{target:'.experience-section',text:['#atmosphere-index','#atmosphere-title','#atmosphere-caption','#atmosphere-body','#atmosphere-cta'],media:'[data-media-host="atmosphere"]'},
    chef:{target:'.chef-section',text:['#chef-index','#chef-title','#chef-quote','#chef-badges > *'],media:'[data-media-host="chef"]'},
    visit:{target:'#visit',text:['#visit-kicker','#visit-title','#visit-cta','.visit-grid > div']}
  };

  function textPreset(key){return root.dataset[`text${key[0].toUpperCase()+key.slice(1)}`]||({hero:'cinematic',philosophy:'line',origin:'soft',atmosphere:'editorial',chef:'mask',visit:'rise'}[key]||'soft')}
  function mediaPreset(key){return root.dataset[`media${key[0].toUpperCase()+key.slice(1)}`]||({hero:'cinematic',origin:'parallax',atmosphere:'slowZoom',chef:'parallax'}[key]||'still')}
  function qsa(selectors){return selectors.flatMap(sel=>$$(sel)).filter((el,i,a)=>a.indexOf(el)===i)}
  function clearTargets(key){const def=sectionMap[key];if(!def)return;const els=qsa(def.text);if(def.media)els.push(...$$(def.media));if(window.gsap)gsap.killTweensOf(els)}

  function animateText(key){
    if(!window.gsap)return;
    const def=sectionMap[key],els=qsa(def?.text||[]);if(!els.length)return;
    gsap.killTweensOf(els);
    if(reduced.matches){gsap.set(els,{clearProps:'all',opacity:1});return}
    const preset=textPreset(key),short=mobile(),dur=short ? .58 : .88,stagger=short ? .035 : .065;
    let from={opacity:0,y:short?18:34};
    if(preset==='reduced')from={opacity:0};
    else if(preset==='mask')from={opacity:0,y:short?16:28,clipPath:'inset(0 0 100% 0)'};
    else if(preset==='editorial')from={opacity:0,x:short?12:28,y:8};
    else if(preset==='line')from={opacity:0,y:short?22:46,clipPath:'inset(0 0 100% 0)'};
    else if(preset==='cinematic')from={opacity:0,y:short?20:38,scale:.985,clipPath:'inset(0 0 24% 0)'};
    else if(preset==='rise')from={opacity:0,y:short?24:52};
    gsap.fromTo(els,from,{opacity:1,x:0,y:0,scale:1,clipPath:'inset(0 0 0% 0)',duration:preset==='reduced' ? .35 : dur,stagger,ease:preset==='cinematic'?'power4.out':'power3.out',overwrite:true});
  }

  function animateMedia(key){
    if(!window.gsap)return;
    const def=sectionMap[key],host=$(def?.media);if(!host)return;
    const media=$('.section-media-element',host)||host;
    gsap.killTweensOf(media);
    if(reduced.matches){gsap.set(media,{clearProps:'transform,filter,clipPath,opacity'});return}
    const preset=mediaPreset(key),short=mobile();
    if(preset==='still'){gsap.set(media,{clearProps:'transform,filter,clipPath,opacity'});return}
    if(preset==='mask'){gsap.fromTo(media,{clipPath:'inset(0 0 100% 0)',scale:1.035},{clipPath:'inset(0 0 0% 0)',scale:1,duration:short?.7:1.05,ease:'power4.out',overwrite:true});return}
    if(preset==='cinematic'){gsap.fromTo(media,{scale:short?1.035:1.075,filter:'brightness(.68)'},{scale:1,filter:'brightness(.88)',duration:short ? .9 : 1.5,ease:'power3.out',overwrite:true});return}
    if(preset==='slowZoom'){gsap.fromTo(media,{scale:1},{scale:short?1.025:1.06,duration:short?5:8,ease:'sine.inOut',yoyo:true,repeat:-1,overwrite:true});return}
    if(preset==='parallax'){
      const trigger=host.closest('.parallax-card,.produce-media,.chef-image')||host;
      const tween=gsap.fromTo(media,{yPercent:short?-2:-5,scale:short?1.02:1.05},{yPercent:short?2:6,scale:1.01,ease:'none',scrollTrigger:{trigger,start:'top bottom',end:'bottom top',scrub:true}});
      triggers.push(tween.scrollTrigger);
    }
  }

  function play(key,{scroll=false}={}){
    const def=sectionMap[key];if(!def)return;
    clearTargets(key);
    if(scroll)$(def.target)?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});
    setTimeout(()=>{animateText(key);animateMedia(key)},scroll?420:0);
  }

  function setupScrollReveals(){
    triggers.forEach(t=>t?.kill?.());triggers=[];
    if(!window.gsap||!window.ScrollTrigger)return;
    if(reduced.matches){Object.keys(sectionMap).forEach(key=>{animateText(key);animateMedia(key)});return}
    Object.entries(sectionMap).forEach(([key,def])=>{
      if(key==='hero')return;
      const target=$(def.target);if(!target)return;
      const st=ScrollTrigger.create({trigger:target,start:'top 82%',once:true,onEnter:()=>{animateText(key);animateMedia(key)}});triggers.push(st);
    });
    const progress=ScrollTrigger.create({start:0,end:'max',onUpdate:self=>gsap.set('.page-progress',{width:`${self.progress*100}%`})});triggers.push(progress);
  }

  function setupHero(){if(reduced.matches){animateText('hero');animateMedia('hero');return}setTimeout(()=>{animateText('hero');animateMedia('hero')},120)}

  function setupPreviewButtons(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('[data-motion-preview]');if(!btn)return;
      const target=btn.dataset.motionPreview;
      const key=Object.entries(sectionMap).find(([,d])=>d.target===target)?.[0]||(target==='#signature'?'orbital':null);
      window.RestaurantStudioShell?.close?.();
      if(key==='orbital'){
        setTimeout(()=>{$('#signature')?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});setTimeout(()=>$('#next-dish')?.click(),420)},100);return;
      }
      if(key)setTimeout(()=>play(key,{scroll:true}),100);
    });
  }

  function setupHover(){
    if(!window.gsap||!matchMedia('(pointer:fine)').matches||reduced.matches)return;
    $$('.produce-media,.wide-image,.chef-image').forEach(card=>{
      if(card.dataset.motionHoverBound)return;card.dataset.motionHoverBound='1';
      card.addEventListener('mouseenter',()=>{const media=$('.section-media-element',card)||$('.media-host-fill',card);if(media)gsap.to(media,{scale:1.045,duration:.65,ease:'power3.out',overwrite:'auto'})});
      card.addEventListener('mouseleave',()=>{const media=$('.section-media-element',card)||$('.media-host-fill',card);if(media)gsap.to(media,{scale:1.01,duration:.85,ease:'power3.out',overwrite:'auto'})});
    });
    $$('.circle-btn,.text-link,.text-button,.reserve-open,.explore').forEach(btn=>{
      if(btn.dataset.motionHoverBound)return;btn.dataset.motionHoverBound='1';
      btn.addEventListener('mouseenter',()=>gsap.to(btn,{y:-2,scale:1.025,duration:.22,ease:'power2.out'}));
      btn.addEventListener('mouseleave',()=>gsap.to(btn,{y:0,scale:1,duration:.32,ease:'power3.out'}));
    });
  }

  function setupCursorContext(){
    if(!matchMedia('(pointer:fine)').matches)return;
    const label=$('.cursor span');if(!label)return;
    document.addEventListener('mouseover',e=>{
      const rules=[['.detail-close,.modal-close','CLOSE'],['.studio-open,.studio','EDIT'],['.reserve-open,#visit-cta','RESERVE'],['.orbit-dish,.explore','EXPLORE'],['.orbit-shell','DRAG'],['.produce-media,.wide-image,.chef-image','VIEW']];
      for(const [sel,text] of rules){if(e.target.closest(sel)){label.textContent=text;break}}
    },true);
  }

  function applyMotion(){
    root.dataset.motionReduced=reduced.matches?'true':'false';
    setupScrollReveals();setupHover();
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }
  window.addEventListener('restaurant:motion-change',()=>setTimeout(applyMotion,20));
  reduced.addEventListener?.('change',applyMotion);
  setupPreviewButtons();setupCursorContext();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setupHero();setTimeout(applyMotion,350)});else{setupHero();setTimeout(applyMotion,350)}
  window.RestaurantMotionDirector={play,applyMotion};
})();