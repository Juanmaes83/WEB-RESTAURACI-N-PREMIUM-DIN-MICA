/* Task navigation is a view of the existing product, never a config owner. */
(() => {
  'use strict';
  const nav=document.querySelector('.mobile-actions');
  if(!nav)return;
  function sync(){
    const config=window.RestaurantStudioConfig;
    const en=document.documentElement.dataset.locale==='en';
    const locationOn=config?.get('modules.location.enabled')===true;
    const menu=nav.querySelector('[data-mobile-menu]');
    const visit=nav.querySelector('[data-mobile-visit]');
    menu.textContent=en?'Menu':'Carta';
    nav.querySelector('.reserve-open').textContent=en?'Reserve':'Reservar';
    visit.textContent=locationOn?(en?'Directions':'Cómo llegar'):(en?'Visit':'Visita');
    visit.href=locationOn?'#module-location':'#visit';
    nav.setAttribute('aria-label',en?'Restaurant quick links':'Accesos del restaurante');
  }
  document.addEventListener('restaurant:config-applied',sync);
  window.addEventListener('restaurant:locale-change',sync);
  sync();
})();

/* Phase C1 stays additive: the public mobile navigation remains independent while
   Studio gains a true iframe viewport preview. */
(() => {
  'use strict';
  if(document.querySelector('script[data-studio-real-preview]'))return;
  const script=document.createElement('script');
  script.src='studio-real-preview.js';
  script.dataset.studioRealPreview='1';
  document.body.appendChild(script);
})();
