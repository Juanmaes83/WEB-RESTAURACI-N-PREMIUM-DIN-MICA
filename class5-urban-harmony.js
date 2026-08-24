/* CLASS 05 — URBAN ACROBATICS V5 FINAL · THE ORBITAL MENU ONLY
   V3 harmony and feature tricks are preserved.
   V5 fixes protagonist hierarchy and crew reaction without replacing Class 04 orbit geometry. */
(() => {
  'use strict';
  if (!window.gsap) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const shell = $('.orbit-shell');
  const stage = $('#orbit-stage');
  if (!shell || !stage) return;

  document.documentElement.dataset.orbitalChoreography = 'urban-acrobatics-v5-final';

  let master = null;
  let step = 0;
  let lastWheelAt = 0;
  let dragStartX = null;
  let dragWasActive = false;
  let breath = null;
  let breathTimer = null;
  let internalStep = false;

  const TRICKS = ['tripleSpin','reverseSweep','airTurn','tripleSpin','reverseSweep'];
  const dishes = () => $$('.orbit-dish',stage);
  const imgs = () => dishes().map(el=>$('img',el)).filter(Boolean);

  function geometry(){
    const sr=shell.getBoundingClientRect();
    const cx=sr.left+sr.width/2, cy=sr.top+sr.height/2;
    return dishes().map((el,index)=>{
      const r=el.getBoundingClientRect();
      return {el,index,img:$('img',el),dx:r.left+r.width/2-cx,dy:r.top+r.height/2-cy};
    });
  }

  const score = item => Math.abs(item.dx)+Math.abs(item.dy)*.18;
  const centre = list => [...list].sort((a,b)=>score(a)-score(b))[0];

  function incomingFor(list,outgoing,direction){
    const side=list.filter(x=>x!==outgoing && (direction>0?x.dx>8:x.dx<-8)).sort((a,b)=>score(a)-score(b));
    return side[0] || list.filter(x=>x!==outgoing).sort((a,b)=>score(a)-score(b))[0];
  }

  function featureFor(list,outgoing,solo,direction){
    const rest=list.filter(x=>x!==outgoing&&x!==solo);
    const rear=rest.filter(x=>Math.abs(x.dy)>35).sort((a,b)=>Math.abs(b.dy)-Math.abs(a.dy));
    const preferred=rear.filter(x=>direction>0?x.dx>0:x.dx<0);
    return preferred[0] || rear[0] || rest.sort((a,b)=>Math.abs(b.dx)-Math.abs(a.dx))[0];
  }

  function stopBreath(){
    clearTimeout(breathTimer);
    breath?.kill?.();
    breath=null;
  }

  function resetVisuals(duration=.18){
    imgs().forEach(img=>gsap.to(img,{x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,opacity:1,filter:'brightness(1) blur(0px) drop-shadow(0 0 0 rgba(0,0,0,0))',duration,ease:'power2.out',overwrite:true}));
  }

  function beginHeroBreath(){
    stopBreath();
    breathTimer=setTimeout(()=>{
      const hero=centre(geometry());
      if(!hero?.img)return;
      gsap.set(hero.img,{scale:1.12,y:0,rotation:0,filter:'brightness(1.07) drop-shadow(0 12px 18px rgba(0,0,0,.36))'});
      breath=gsap.to(hero.img,{scale:1.145,y:-2,duration:1.8,ease:'sine.inOut',yoyo:true,repeat:-1,overwrite:true});
    },320);
  }

  function killMaster(){
    stopBreath();
    master?.kill?.();
    master=null;
    imgs().forEach(img=>gsap.killTweensOf(img));
    const copy=$('.dish-copy');
    if(copy)gsap.killTweensOf(copy);
  }

  /* APPROVED V3 FEATURE TRICKS — preserved verbatim. */
  function addTripleSpin(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{rotation:direction*360,y:-12,x:direction*10,scale:.96,scaleX:.95,scaleY:1.03,filter:'brightness(.88)',duration:.20,ease:'power2.in'},.14)
      .to(img,{rotation:direction*720,y:-26,x:direction*24,scale:1.04,scaleX:1.02,scaleY:.98,filter:'brightness(1.05)',duration:.25,ease:'power4.inOut'},.34)
      .to(img,{rotation:direction*1080,y:-9,x:direction*8,scale:1.01,scaleX:.985,scaleY:1.018,filter:'brightness(.94)',duration:.25,ease:'power3.out'},.59)
      .to(img,{rotation:direction*1080,y:0,x:0,scale:1,scaleX:1,scaleY:1,filter:'brightness(.90)',duration:.14,ease:'expo.out'},.84);
  }

  function addReverseSweep(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{x:-direction*16,y:10,rotation:-direction*34,scale:.93,filter:'brightness(.78)',duration:.18,ease:'power3.in'},.14)
      .to(img,{x:-direction*44,y:24,rotation:-direction*145,scale:.83,filter:'brightness(.55)',duration:.28,ease:'power3.inOut'},.32)
      .to(img,{x:direction*16,y:-12,rotation:-direction*220,scale:1.06,filter:'brightness(1.05)',duration:.29,ease:'power4.out'},.60)
      .to(img,{x:0,y:0,rotation:0,scale:1,filter:'brightness(.90)',duration:.13,ease:'expo.out'},.89);
  }

  function addAirTurn(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{y:-18,x:direction*8,rotation:direction*70,scale:.91,scaleX:.95,scaleY:1.035,filter:'brightness(.86)',duration:.18,ease:'power3.in'},.14)
      .to(img,{y:-38,x:direction*20,rotation:direction*210,scale:.82,filter:'brightness(1.08)',duration:.26,ease:'power2.out'},.32)
      .to(img,{y:-10,x:direction*6,rotation:direction*360,scale:1.07,scaleX:1.025,scaleY:.98,filter:'brightness(.98)',duration:.28,ease:'power4.inOut'},.58)
      .to(img,{y:0,x:0,rotation:direction*360,scale:1,scaleX:1,scaleY:1,filter:'brightness(.90)',duration:.15,ease:'expo.out'},.86);
  }

  function addFeature(tl,item,trick,direction){
    if(trick==='reverseSweep')addReverseSweep(tl,item,direction);
    else if(trick==='airTurn')addAirTurn(tl,item,direction);
    else addTripleSpin(tl,item,direction);
  }

  /* APPROVED V3 OUTGOING + INITIAL ENSEMBLE BEAT — preserved. */
  function addOutgoing(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.to(img,{x:-direction*5,y:7,rotation:-direction*3.5,scale:.98,opacity:.82,filter:'brightness(.86)',duration:.16,ease:'power2.in'},0)
      .to(img,{x:-direction*14,y:-7,rotation:-direction*6.5,scale:.95,opacity:.78,filter:'brightness(.80)',duration:.30,ease:'power3.inOut'},.16)
      .to(img,{x:0,y:0,rotation:0,scale:1,opacity:.72,filter:'brightness(.74)',duration:.34,ease:'power3.out'},.46);
  }

  function addEnsemble(tl,list,solo,outgoing,feature,direction){
    const ensemble=list.filter(x=>x!==solo&&x!==outgoing&&x!==feature);
    ensemble.forEach((item,i)=>{
      if(!item.img)return;
      const side=Math.sign(item.dx)||direction;
      const hitY=Math.abs(item.dy)>60?-4:-7;
      const offset=.08+i*.018;
      tl.to(item.img,{y:hitY,rotation:side*1.6,scale:.985,opacity:.62,filter:'brightness(.66)',duration:.12,ease:'power2.out'},offset)
        .to(item.img,{y:2,rotation:-side*.45,scale:1.008,opacity:.64,filter:'brightness(.69)',duration:.13,ease:'power2.inOut'},offset+.12)
        .to(item.img,{y:0,rotation:0,scale:1,opacity:.66,filter:'brightness(.68)',duration:.18,ease:'power3.out'},offset+.25);
    });
  }

  /* V5 SOLOIST: unmistakable depth pull-back -> frontal attack -> hard elegant brake -> hold. */
  function addSoloist(tl,item,direction){
    if(!item?.img)return;
    const img=item.img;
    tl.set(img,{transformOrigin:'50% 50%'},0)
      /* Pull far back while the outer orbital geometry is still travelling. */
      .to(img,{
        x:-direction*24,y:18,rotation:direction*5.5,
        scale:.68,scaleX:.97,scaleY:1.025,
        opacity:.86,filter:'brightness(.68) blur(1.4px)',
        duration:.24,ease:'power3.in'
      },.18)
      /* Compact preparation: still behind the formation. */
      .to(img,{
        x:-direction*8,y:8,rotation:direction*7.5,
        scale:.78,scaleX:.95,scaleY:1.04,
        opacity:.94,filter:'brightness(.82) blur(.55px)',
        duration:.16,ease:'power2.inOut'
      },.42)
      /* Frontal attack. Outer orbit is almost at centre, so inner scale now reads as camera depth. */
      .to(img,{
        x:0,y:-18,rotation:-direction*2.2,
        scale:1.38,scaleX:1.02,scaleY:.985,
        opacity:1,filter:'brightness(1.22) blur(0px) drop-shadow(0 26px 30px rgba(0,0,0,.60))',
        duration:.24,ease:'power4.in'
      },.58)
      /* Hard elegant brake: short deceleration, no bounce. */
      .to(img,{
        y:-11,rotation:-direction*.45,
        scale:1.25,scaleX:1.006,scaleY:.995,
        filter:'brightness(1.18) drop-shadow(0 21px 25px rgba(0,0,0,.55))',
        duration:.07,ease:'power4.out'
      },.82)
      /* Hero freeze. Nothing else reacts until this pose has been read. */
      .to(img,{
        y:-11,rotation:-direction*.45,scale:1.25,
        filter:'brightness(1.18) drop-shadow(0 21px 25px rgba(0,0,0,.55))',
        duration:.17,ease:'none'
      },.89)
      /* Controlled landing; hero remains dominant instead of immediately returning to neutral. */
      .to(img,{
        y:0,rotation:0,scale:1.14,scaleX:1,scaleY:1,
        filter:'brightness(1.08) drop-shadow(0 14px 19px rgba(0,0,0,.40))',
        duration:.22,ease:'expo.out'
      },1.06);
  }

  /* V5 REACTION: starts only after every approved feature trick has finished and hero has braked. */
  function addCrewRecoil(tl,list,solo){
    const others=list.filter(x=>x!==solo);
    others.forEach((item,i)=>{
      if(!item.img)return;
      const side=Math.sign(item.dx)||((i%2)?1:-1);
      const rear=Math.abs(item.dy)>55;
      const retreatScale=rear?.82:.86;
      const retreatX=side*(rear?10:17);
      const retreatY=rear?9:12;
      const retreatOpacity=rear?.48:.56;
      const retreatBrightness=rear?.52:.60;
      const retreatBlur=rear?1.7:.9;

      /* One synchronized step back. */
      tl.to(item.img,{
        x:retreatX,y:retreatY,scale:retreatScale,
        opacity:retreatOpacity,
        filter:`brightness(${retreatBrightness}) blur(${retreatBlur}px)`,
        duration:.12,ease:'power4.out'
      },1.10)
      /* Hold: reaction must be readable, not a vibration. */
      .to(item.img,{
        x:retreatX,y:retreatY,scale:retreatScale,
        opacity:retreatOpacity,
        filter:`brightness(${retreatBrightness}) blur(${retreatBlur}px)`,
        duration:.10,ease:'none'
      },1.22)
      /* Recover the approved formation after acknowledging the protagonist. */
      .to(item.img,{
        x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,
        opacity:1,filter:'brightness(1) blur(0px)',
        duration:.28,ease:'power3.out'
      },1.32);
    });
  }

  function addCopy(tl){
    const copy=$('.dish-copy');
    const nodes=[$('#dish-title'),$('#dish-meta'),$('#dish-short')].filter(Boolean);
    if(!copy||!nodes.length)return;
    tl.to(copy,{opacity:.10,y:7,duration:.18,ease:'power2.in',overwrite:true},0)
      .set(nodes,{opacity:0,y:10},.72)
      /* Identity waits until brake + recoil are both readable. */
      .to(copy,{opacity:1,y:0,duration:.14,ease:'power2.out'},1.40)
      .to(nodes,{opacity:1,y:0,duration:.25,stagger:.045,ease:'power3.out'},1.43);
  }

  function choreograph(direction=1,source='button'){
    killMaster();
    resetVisuals(.05);

    const list=geometry();
    if(list.length<3)return;
    const outgoing=centre(list);
    const solo=incomingFor(list,outgoing,direction);
    const feature=featureFor(list,outgoing,solo,direction);
    const trick=TRICKS[step%TRICKS.length];
    step++;

    master=gsap.timeline({
      defaults:{overwrite:'auto'},
      onComplete(){
        /* Do NOT neutralize the hero. The new protagonist keeps visual authority. */
        const hero=centre(geometry());
        imgs().forEach(img=>{
          if(img===hero?.img)return;
          gsap.set(img,{x:0,y:0,rotation:0,scale:1,scaleX:1,scaleY:1,opacity:1,filter:'brightness(1) blur(0px)'});
        });
        if(hero?.img)gsap.set(hero.img,{x:0,y:0,rotation:0,scale:1.12,scaleX:1,scaleY:1,opacity:1,filter:'brightness(1.07) drop-shadow(0 12px 18px rgba(0,0,0,.36))'});
        beginHeroBreath();
      }
    });

    addOutgoing(master,outgoing,direction);                         // approved V3
    addEnsemble(master,list,solo,outgoing,feature,direction);      // approved V3
    addFeature(master,feature,trick,direction);                     // approved V3: ends <= 1.00s
    addSoloist(master,solo,direction);                              // V5 hero phrase
    addCrewRecoil(master,list,solo);                                // V5 reaction after hero brake
    addCopy(master);                                                // identity after reaction
  }

  function bind(){
    const next=$('#next-dish');
    const prev=$('#prev-dish');

    next?.addEventListener('click',()=>{if(!internalStep)choreograph(1,'button');},true);
    prev?.addEventListener('click',()=>{if(!internalStep)choreograph(-1,'button');},true);

    shell.addEventListener('keydown',e=>{
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      internalStep=true;
      (e.key==='ArrowRight'?next:prev)?.click();
      internalStep=false;
      choreograph(e.key==='ArrowRight'?1:-1,'keyboard');
    },true);

    shell.addEventListener('wheel',e=>{
      if(Math.abs(e.deltaY)<4)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const now=performance.now();
      if(now-lastWheelAt<620)return;
      lastWheelAt=now;
      const direction=e.deltaY>=0?1:-1;
      internalStep=true;
      (direction>0?next:prev)?.click();
      internalStep=false;
      choreograph(direction,'wheel');
    },{passive:false,capture:true});

    shell.addEventListener('pointerdown',e=>{
      dragStartX=e.clientX;
      dragWasActive=true;
      killMaster();
      stopBreath();
    },{passive:true,capture:true});

    shell.addEventListener('pointerup',e=>{
      if(!dragWasActive||dragStartX===null)return;
      const dx=e.clientX-dragStartX;
      dragStartX=null;
      dragWasActive=false;
      if(Math.abs(dx)<18){resetVisuals(.16);beginHeroBreath();return;}
      setTimeout(()=>choreograph(dx<0?1:-1,'drag-release'),90);
    },{passive:true,capture:true});
  }

  function waitForOrbit(){
    if(dishes().length){bind();resetVisuals(0);beginHeroBreath();return;}
    const observer=new MutationObserver(()=>{
      if(!dishes().length)return;
      observer.disconnect();
      bind();resetVisuals(0);beginHeroBreath();
    });
    observer.observe(stage,{childList:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(waitForOrbit,240));
  else setTimeout(waitForOrbit,240);
})();