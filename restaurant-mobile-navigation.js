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
