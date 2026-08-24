/* CLASS 05 — Studio Motion controls. Injected before app-v4 binds data-path controls. */
(() => {
  'use strict';
  const studio=document.getElementById('studio');
  const nav=studio?.querySelector('.studio-nav');
  const scroll=document.getElementById('studio-scroll');
  if(!studio||!nav||!scroll||nav.querySelector('[data-panel="motion"]'))return;

  const tab=document.createElement('button');
  tab.type='button';tab.dataset.panel='motion';tab.textContent='Motion';
  const projectTab=nav.querySelector('[data-panel="project"]');
  nav.insertBefore(tab,projectTab||null);

  const panel=document.createElement('section');
  panel.className='studio-panel motion-panel';panel.dataset.panel='motion';panel.hidden=true;
  panel.innerHTML=`
    <div class="panel-intro"><p class="eyebrow">06 · Motion Direction</p><h3>Dirección de movimiento</h3><p>Elige lenguajes de movimiento diseñados. No hay parámetros técnicos: cada preset mantiene coherencia, rendimiento y buen gusto.</p></div>
    <article class="motion-card motion-card-featured">
      <div class="motion-card-head"><div><span class="motion-number">01</span><strong>Orbital Menu</strong></div><span class="motion-badge">CORE</span></div>
      <p>Una coreografía por proyecto para toda la colección de platos.</p>
      <label>Coreografía de platos<select data-path="motion.orbitalStyle" id="motion-orbital-style"><option value="elegant">Elegant Orbit</option><option value="urban">Urban Acrobatics</option></select></label>
      <button type="button" class="motion-preview" data-motion-preview="#signature">▶ Probar coreografía</button>
    </article>
    <div class="motion-grid">
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">02</span><strong>Hero</strong></div></div><label>Text reveal<select data-path="motion.text.hero"><option value="cinematic">Cinematic</option><option value="mask">Mask</option><option value="soft">Soft Rise</option><option value="reduced">Reduced</option></select></label><label>Media motion<select data-path="motion.media.hero"><option value="cinematic">Cinematic</option><option value="slowZoom">Slow Zoom</option><option value="still">Still</option></select></label><button type="button" class="motion-preview" data-motion-preview="#top">▶ Probar Hero</button></article>
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">03</span><strong>Philosophy</strong></div></div><label>Text reveal<select data-path="motion.text.philosophy"><option value="line">Line Reveal</option><option value="mask">Mask</option><option value="soft">Soft Rise</option><option value="reduced">Reduced</option></select></label><button type="button" class="motion-preview" data-motion-preview="#story">▶ Probar sección</button></article>
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">04</span><strong>Origin</strong></div></div><label>Text reveal<select data-path="motion.text.origin"><option value="soft">Soft Rise</option><option value="mask">Mask</option><option value="editorial">Editorial</option><option value="reduced">Reduced</option></select></label><label>Media motion<select data-path="motion.media.origin"><option value="parallax">Parallax</option><option value="mask">Mask Reveal</option><option value="still">Still</option></select></label><button type="button" class="motion-preview" data-motion-preview="#experience">▶ Probar sección</button></article>
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">05</span><strong>Atmosphere</strong></div></div><label>Text reveal<select data-path="motion.text.atmosphere"><option value="editorial">Editorial</option><option value="mask">Mask</option><option value="soft">Soft Rise</option><option value="reduced">Reduced</option></select></label><label>Media motion<select data-path="motion.media.atmosphere"><option value="slowZoom">Slow Zoom</option><option value="cinematic">Cinematic</option><option value="still">Still</option></select></label><button type="button" class="motion-preview" data-motion-preview=".experience-section">▶ Probar sección</button></article>
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">06</span><strong>Chef</strong></div></div><label>Text reveal<select data-path="motion.text.chef"><option value="mask">Mask</option><option value="editorial">Editorial</option><option value="soft">Soft Rise</option><option value="reduced">Reduced</option></select></label><label>Media motion<select data-path="motion.media.chef"><option value="parallax">Parallax</option><option value="mask">Mask Reveal</option><option value="still">Still</option></select></label><button type="button" class="motion-preview" data-motion-preview=".chef-section">▶ Probar sección</button></article>
      <article class="motion-card"><div class="motion-card-head"><div><span class="motion-number">07</span><strong>Visit</strong></div></div><label>Text reveal<select data-path="motion.text.visit"><option value="rise">Editorial Rise</option><option value="mask">Mask</option><option value="reduced">Reduced</option></select></label><button type="button" class="motion-preview" data-motion-preview="#visit">▶ Probar cierre</button></article>
    </div>
    <p class="studio-help motion-help"><strong>Accesibilidad.</strong> Si el sistema operativo solicita movimiento reducido, la web conserva contenido, navegación, reserva, Studio y Orbital pero elimina animaciones no esenciales.</p>`;
  scroll.appendChild(panel);

  let lastSignature='';
  const publish=()=>{
    const root=document.documentElement;
    const orbital=document.getElementById('motion-orbital-style')?.value||'elegant';
    root.dataset.orbitalMotion=orbital;
    const parts=[orbital];
    panel.querySelectorAll('[data-path^="motion.text."]').forEach(el=>{const key=el.dataset.path.split('.').pop();root.dataset[`text${key.replace(/^./,c=>c.toUpperCase())}`]=el.value;parts.push(el.dataset.path,el.value)});
    panel.querySelectorAll('[data-path^="motion.media."]').forEach(el=>{const key=el.dataset.path.split('.').pop();root.dataset[`media${key.replace(/^./,c=>c.toUpperCase())}`]=el.value;parts.push(el.dataset.path,el.value)});
    const signature=parts.join('|');
    if(signature===lastSignature)return;
    lastSignature=signature;
    window.dispatchEvent(new CustomEvent('restaurant:motion-change',{detail:{signature,orbital}}));
  };
  panel.addEventListener('input',()=>setTimeout(publish,0));
  panel.addEventListener('change',()=>setTimeout(publish,0));
  let ticks=0;const timer=setInterval(()=>{publish();if(++ticks>24)clearInterval(timer)},100);
  window.RestaurantMotionStudio={publish,panel};
})();