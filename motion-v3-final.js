/* CLASS 03 — final motion tuning: centre-first orbital perspective + precise Studio drawer */
renderOrbit=function(immediate=false){
  const shell=document.querySelector('.orbit-shell');
  if(!shell)return;
  const mobile=innerWidth<620;
  const rx=(mobile?.47:.40)*shell.clientWidth;
  const ry=(mobile?.25:.27)*shell.clientHeight;
  document.querySelectorAll('.orbit-dish').forEach((el,i)=>{
    const d=continuousDistance(i);
    const angle=d*(Math.PI*2/config.dishes.length);
    const front=(Math.cos(angle)+1)/2;
    const x=Math.sin(angle)*rx;
    const y=-(1-front)*ry*.85+Math.abs(Math.sin(angle))*ry*.20;
    const scale=.42+Math.pow(front,1.4)*(mobile?.76:.72);
    const opacity=.22+front*.78;
    const blur=(1-front)*4;
    const brightness=.54+front*.50;
    const rotate=Math.sin(angle)*5;
    const z=Math.round(front*100);
    gsap.set(el,{xPercent:-50,yPercent:-50,x,y,scale,rotation:rotate,opacity,filter:`blur(${blur}px) brightness(${brightness})`,zIndex:z});
  });
};
openStudio=function(){
  const studio=document.querySelector('#studio'),back=document.querySelector('#studio-backdrop');
  studio.setAttribute('aria-hidden','false');document.body.classList.add('studio-open');
  back.style.visibility='visible';
  gsap.fromTo(studio,{xPercent:102},{xPercent:0,duration:.6,ease:'power4.out',overwrite:true});
  gsap.to(back,{autoAlpha:1,duration:.3,overwrite:true});
};
closeStudio=function(){
  const studio=document.querySelector('#studio'),back=document.querySelector('#studio-backdrop');
  studio.setAttribute('aria-hidden','true');document.body.classList.remove('studio-open');
  gsap.to(studio,{xPercent:102,duration:.45,ease:'power3.in',overwrite:true});
  gsap.to(back,{autoAlpha:0,duration:.3,overwrite:true,onComplete:()=>back.style.visibility='hidden'});
};
