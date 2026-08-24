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

/* CLASS 06 — product layer: bilingual content + emotional dish storytelling.
   Runs before app-v4 so every data-path field is persisted by the proven Class 04 store. */
(() => {
  'use strict';
  const D=window.RestaurantDefaults;
  const studio=document.getElementById('studio'),nav=studio?.querySelector('.studio-nav'),scroll=document.getElementById('studio-scroll');
  if(!D||!studio||!nav||!scroll)return;

  D.schemaVersion=6;
  D.locale='es';
  D.footer={...D.footer,center:'Class 06 · Restaurant Product Final'};
  D.i18n={
    es:{
      hero:{kicker:'Alicante · Cocina mediterránea',line1:'LÚMINA',line2:'después del sol.',body:'Producto mediterráneo, fuego y precisión. Una carta que no se desplaza: orbita.',cta:'Descubrir el menú',stamp:'ORBITAL MENU · CLASS 06 ·',scroll:'DESLIZA PARA ENTRAR'},
      philosophy:{index:'01 / Filosofía',title:'La cocina entra en escena como un objeto de deseo, no como una lista.',body1:'Cada plato comparte un mismo lenguaje visual: encuadre, distancia, vajilla, fondo y luz. La disciplina convierte la carta en una experiencia.',body2:'El movimiento añade jerarquía; la fotografía aporta credibilidad. El resultado debe sentirse físico, cercano y memorable.'},
      orbital:{index:'02 / Platos de autor',kicker:'Arrastra · rueda · desliza · flechas',title:'The Orbital Menu',explore:'Descubrir plato'},
      origin:{index:'03 / Origen',title:'Antes del plato, existe un lugar.',body:'La procedencia forma parte de la experiencia. Ingrediente, productor y técnica aparecen como información que da sentido a cada decisión.',caption:'Santa Pola · 07:20'},
      atmosphere:{index:'04 / Atmósfera',title:'La cena se convierte en recuerdo.',caption:'Sala · Alicante',body:'Materia, temperatura, luz y sonido se diseñan con la misma intención que el plato.',cta:'Reserva tu mesa →'},
      chef:{index:'05 / Chef',title:'Precisión sin ruido.',quote:'“La técnica desaparece cuando el plato parece inevitable.”',badges:['Menú de temporada','Productores locales','Cocina de fuego']},
      visit:{kicker:'Alicante · Mar — Sáb',title:'Toma asiento.',cta:'Reservar mesa',addressLabel:'Dirección',serviceLabel:'Servicio',contactLabel:'Contacto'},
      ui:{reserve:'Reservar',story:'La historia',elaboration:'Elaboración',ingredients:'Ingredientes',origin:'Origen',technique:'Técnica',pairing:'Maridaje',chefNote:'Nota del chef',allergens:'Alérgenos',close:'Cerrar ficha',language:'Idioma'},
      dishes:{
        'dish-01':{name:'Gamba roja salvaje',meta:'Santa Pola · Fuego · Cítrico',short:'Gamba roja, almendra ahumada, beurre blanc cítrico e hinojo marino.',story:'Llega de madrugada desde Santa Pola y apenas necesita que la cocina intervenga. Este plato nace de una pregunta sencilla: ¿cómo acercar el instante de la lonja a una mesa nocturna sin domesticarlo? El fuego toca la gamba sólo lo suficiente para despertar su dulzor; el resto es sal, humo y Mediterráneo.',elaboration:'Marcada 38 segundos sobre carbón de olivo. La cabeza conserva su jugo; la cola queda nacarada. Un beurre blanc de cítricos aporta tensión y la almendra ahumada prolonga el recuerdo de la brasa.',ingredients:'Gamba roja · almendra ahumada · cítricos · hinojo marino',origin:'Lonja de Santa Pola · Alicante',technique:'Carbón de olivo · 38 segundos',pairing:'Moscatel seco · Alicante DOP',note:'Calor, yodo y cítrico. Nada debería ponerse en medio.',allergens:'Crustáceos · frutos secos'},
        'dish-02':{name:'Atún rojo / Naranja sanguina',meta:'Mediterráneo · Crudo · Ponzu',short:'Atún rojo, naranja sanguina, hoja de alcaparra y polvo de aceituna negra.',story:'El Mediterráneo también puede ser frío, limpio y eléctrico. El atún llega a la mesa casi intacto; la naranja sanguina introduce una acidez luminosa y la aceituna recuerda que seguimos junto al mar. Es un plato construido para que cada bocado cambie de dirección.',elaboration:'Corte manual justo antes del servicio. El pescado se aliña en frío con un ponzu ligero; la naranja y la alcaparra aparecen al final para conservar perfume y textura.',ingredients:'Atún rojo · naranja sanguina · ponzu · hoja de alcaparra',origin:'Mediterráneo occidental',technique:'Corte a cuchillo · aliño en frío',pairing:'Brut nature rosado',note:'Primero ácido, después grasa, finalmente el mar.',allergens:'Pescado · soja'},
        'dish-03':{name:'Alcachofa a la brasa',meta:'Vega Baja · Humo · Avellana',short:'Alcachofa caramelizada, yema ahumada, aceite de perejil y avellana tostada.',story:'La Vega Baja entra en la carta sin pedir permiso. Queríamos tratar una alcachofa con la misma ceremonia que un gran pescado: fuego, reposo, salsa y silencio. Su amargor vegetal no se corrige; se convierte en el centro del plato.',elaboration:'La alcachofa se asa lentamente sobre brasas, se glasea con sus propios jugos y termina con yema ahumada. La avellana aporta crujiente y el aceite de perejil devuelve frescor.',ingredients:'Alcachofa · yema de huevo · avellana · aceite de perejil',origin:'Vega Baja · Alicante',technique:'Asada a la brasa · glaseada',pairing:'Vermut inspirado en Fondillón',note:'El amargor vegetal merece la misma ceremonia que el marisco.',allergens:'Huevo · frutos secos'},
        'dish-04':{name:'Lubina salvaje',meta:'Calpe · Azafrán · Hinojo',short:'Lubina de piel crujiente, salsa de azafrán, puerro e hinojo translúcido.',story:'Una pieza de costa convertida en precisión. La piel debe sonar antes de que la salsa llegue al paladar; debajo, la carne permanece húmeda y delicada. El azafrán aparece como aroma, nunca como maquillaje.',elaboration:'La lubina se cocina a la plancha únicamente por la piel hasta quedar crujiente. El calor residual termina el centro. Una salsa ligera de azafrán, puerro y láminas de hinojo completa el plato.',ingredients:'Lubina · azafrán · puerro · hinojo',origin:'Costa de Calpe · Alicante',technique:'Plancha · piel crujiente',pairing:'Blanco de Marina Alta',note:'Piel crujiente, centro suave y el azafrán justo por debajo del perfume.',allergens:'Pescado · lácteos'},
        'dish-05':{name:'Presa ibérica',meta:'Dehesa · Brasa · PX',short:'Presa ibérica, berenjena asada, Pedro Ximénez y cebolleta.',story:'La brasa aquí no busca demostrar fuerza, sino controlar el tiempo. La presa llega de la dehesa con grasa suficiente para cocinarse casi a sí misma. La berenjena recoge el humo y el Pedro Ximénez aparece en pequeñas dosis, como una sombra dulce.',elaboration:'Sellado intenso sobre brasa y reposo largo para redistribuir los jugos. La berenjena se asa entera, se abre al servicio y se termina con una reducción contenida de PX y cebolleta fresca.',ingredients:'Presa ibérica · berenjena · Pedro Ximénez · cebolleta',origin:'Dehesa · Extremadura',technique:'Sellado fuerte · reposo de brasa',pairing:'Monastrell · Alicante DOP',note:'El humo debe enmarcar la carne, nunca cubrirla.',allergens:'Sulfitos'},
        'dish-06':{name:'Cítricos y miel quemada',meta:'Alicante · Miel · Verbena',short:'Helado de miel tostada, cítricos, bizcocho de aceite de oliva y praliné de almendra.',story:'El final de la cena no tenía que ser más dulce, sino más despierto. Quemamos la miel hasta rozar el amargor, usamos cítricos de Alicante para limpiar el paladar y dejamos que el aceite de oliva una el postre con todo lo que ocurrió antes.',elaboration:'La miel se carameliza hasta desarrollar notas tostadas y se incorpora a un helado cremoso. Cítricos frescos y confitados, bizcocho de aceite de oliva y praliné de almendra construyen contraste de temperatura y textura.',ingredients:'Miel tostada · cítricos · aceite de oliva · almendra',origin:'Cítricos y miel local · Alicante',technique:'Mantecado · confitado · aireado',pairing:'Moscatel de vendimia tardía',note:'Un postre con suficiente amargor para mantener despierta la noche.',allergens:'Lácteos · huevo · frutos secos'}
      }
    },
    en:{
      hero:{kicker:'Alicante · Mediterranean dining',line1:'LÚMINA',line2:'after dark.',body:'Mediterranean produce, fire and precision. A menu that does not scroll: it orbits.',cta:'Discover the menu',stamp:'ORBITAL MENU · CLASS 06 ·',scroll:'SCROLL TO ENTER'},
      philosophy:{index:'01 / Philosophy',title:'Food enters the room as an object of desire, not a list.',body1:'Every dish shares one visual language: framing, distance, tableware, background and light. Discipline turns the menu into an experience.',body2:'Motion creates hierarchy; photography creates credibility. The result should feel physical, intimate and memorable.'},
      orbital:{index:'02 / Signature plates',kicker:'Drag · wheel · swipe · arrows',title:'The Orbital Menu',explore:'Explore dish'},
      origin:{index:'03 / Origin',title:'Before the plate, there is a place.',body:'Provenance is part of the experience. Ingredient, producer and technique become information that gives meaning to every decision.',caption:'Santa Pola · 07:20'},
      atmosphere:{index:'04 / Atmosphere',title:'Dinner becomes memory.',caption:'Dining room · Alicante',body:'Material, temperature, light and sound are designed with the same intention as the food.',cta:'Reserve your table →'},
      chef:{index:'05 / Chef',title:'Precision without noise.',quote:'“Technique disappears when the dish feels inevitable.”',badges:['Seasonal menu','Local producers','Fire-led kitchen']},
      visit:{kicker:'Alicante · Tue — Sat',title:'Take your seat.',cta:'Reserve a table',addressLabel:'Address',serviceLabel:'Service',contactLabel:'Contact'},
      ui:{reserve:'Reserve',story:'The story',elaboration:'Preparation',ingredients:'Ingredients',origin:'Origin',technique:'Technique',pairing:'Pairing',chefNote:"Chef's note",allergens:'Allergens',close:'Close dish',language:'Language'},
      dishes:{
        'dish-01':{name:'Wild Red Prawn',meta:'Santa Pola · Fire · Citrus',short:'Red prawn, smoked almond, citrus beurre blanc and sea fennel.',story:'It arrives before dawn from Santa Pola and asks the kitchen for almost nothing. The dish began with one question: how can the energy of the fish market reach a night-time table without being tamed? Fire touches the prawn just long enough to wake its sweetness; everything else is salt, smoke and Mediterranean.',elaboration:'Seared for 38 seconds over olive-wood charcoal. The head keeps its juices while the tail stays pearly. Citrus beurre blanc brings tension and smoked almond extends the memory of the embers.',ingredients:'Red prawn · smoked almond · citrus · sea fennel',origin:'Santa Pola fish market · Alicante',technique:'Olive-wood charcoal · 38 seconds',pairing:'Dry Moscatel · Alicante DOP',note:'Heat, iodine and citrus. Nothing else should get in the way.',allergens:'Shellfish · nuts'},
        'dish-02':{name:'Bluefin / Blood Orange',meta:'Mediterranean · Raw · Ponzu',short:'Bluefin tuna, blood orange, caper leaf and black olive dust.',story:'The Mediterranean can also be cold, precise and electric. The tuna reaches the table almost untouched; blood orange adds bright acidity and black olive reminds you that the sea is still close. Every bite is designed to change direction.',elaboration:'Hand-cut just before service. The fish is dressed cold with a light ponzu; orange and caper are added at the end to preserve perfume and texture.',ingredients:'Bluefin tuna · blood orange · ponzu · caper leaf',origin:'Western Mediterranean',technique:'Hand-cut · cold dressed',pairing:'Brut nature rosé',note:'Acid first, then fat, then the sea.',allergens:'Fish · soy'},
        'dish-03':{name:'Charred Artichoke',meta:'Vega Baja · Smoke · Hazelnut',short:'Caramelised artichoke, smoked yolk, parsley oil and toasted hazelnut.',story:'Vega Baja enters the menu without asking permission. We wanted to treat an artichoke with the same ceremony as a great fish: fire, rest, sauce and silence. Its vegetal bitterness is not corrected; it becomes the centre of the plate.',elaboration:'Slow-roasted over embers, glazed with its own juices and finished with smoked yolk. Hazelnut gives crunch while parsley oil restores freshness.',ingredients:'Artichoke · egg yolk · hazelnut · parsley oil',origin:'Vega Baja · Alicante',technique:'Ember-roasted · glazed',pairing:'Fondillón-inspired vermouth',note:'Vegetal bitterness deserves the same ceremony as seafood.',allergens:'Egg · nuts'},
        'dish-04':{name:'Wild Sea Bass',meta:'Calpe · Saffron · Fennel',short:'Crisp-skinned sea bass, saffron sauce, leek and translucent fennel.',story:'A piece of coastline turned into precision. The skin should make a sound before the sauce reaches the palate; underneath, the flesh stays moist and delicate. Saffron appears as aroma, never decoration.',elaboration:'Cooked on the plancha almost entirely skin-side down until crisp. Residual heat finishes the centre. A light saffron sauce, leek and translucent fennel complete the plate.',ingredients:'Sea bass · saffron · leek · fennel',origin:'Calpe coast · Alicante',technique:'Plancha · skin-side crisp',pairing:'Marina Alta white',note:'Crisp skin, soft centre, saffron held just below perfume.',allergens:'Fish · dairy'},
        'dish-05':{name:'Iberian Presa',meta:'Dehesa · Ember · PX',short:'Iberian presa, roasted aubergine, Pedro Ximénez and spring onion.',story:'The ember is not here to show force, but to control time. Presa arrives from the dehesa with enough fat to almost cook itself. Aubergine catches the smoke and Pedro Ximénez appears in small doses, like a sweet shadow.',elaboration:'Hard sear over embers followed by a long rest to redistribute the juices. Aubergine is roasted whole, opened at service and finished with a restrained PX reduction and fresh spring onion.',ingredients:'Iberian pork · aubergine · Pedro Ximénez · spring onion',origin:'Dehesa · Extremadura',technique:'Hard sear · ember rest',pairing:'Monastrell · Alicante DOP',note:'Smoke should frame the meat, never cover it.',allergens:'Sulphites'},
        'dish-06':{name:'Burnt Honey Citrus',meta:'Alicante · Honey · Verbena',short:'Burnt-honey ice cream, citrus, olive-oil sponge and almond praline.',story:'The end of dinner did not need to be sweeter; it needed to be more awake. We burn the honey until bitterness begins, use Alicante citrus to clear the palate and let olive oil connect dessert with everything that came before.',elaboration:'Honey is caramelised until deeply toasted and folded into a creamy ice cream. Fresh and candied citrus, olive-oil sponge and almond praline build temperature and texture contrast.',ingredients:'Burnt honey · citrus · olive oil · almond',origin:'Local citrus & honey · Alicante',technique:'Churned · candied · aerated',pairing:'Late-harvest Moscatel',note:'Dessert with enough bitterness to keep the night awake.',allergens:'Dairy · egg · nuts'}
      }
    }
  };

  const link=document.createElement('link');link.rel='stylesheet';link.href='styles-v6.css';document.head.appendChild(link);

  const tab=document.createElement('button');tab.type='button';tab.dataset.panel='class6';tab.textContent='Idiomas & Story';
  const projectTab=nav.querySelector('[data-panel="project"]');nav.insertBefore(tab,projectTab||null);

  const globalFields=[
    ['hero.kicker','Hero · Kicker','input'],['hero.line1','Hero · Línea 1','input'],['hero.line2','Hero · Línea 2','input'],['hero.body','Hero · Texto','textarea'],['hero.cta','Hero · CTA','input'],
    ['philosophy.title','Philosophy · Titular','textarea'],['philosophy.body1','Philosophy · Texto 1','textarea'],['philosophy.body2','Philosophy · Texto 2','textarea'],
    ['origin.title','Origin · Titular','textarea'],['origin.body','Origin · Texto','textarea'],['atmosphere.title','Atmosphere · Titular','input'],['atmosphere.body','Atmosphere · Texto','textarea'],
    ['chef.title','Chef · Titular','input'],['chef.quote','Chef · Quote','textarea'],['visit.title','Visit · Titular','input'],['visit.cta','Visit · CTA','input']
  ];
  const dishFields=[
    ['name','Nombre','input'],['meta','Meta / procedencia','input'],['short','Descripción corta','textarea'],['story','Storytelling emocional','textarea'],['elaboration','Elaboración','textarea'],['ingredients','Ingredientes','textarea'],['origin','Origen','input'],['technique','Técnica','input'],['pairing','Maridaje','input'],['note','Chef note','textarea'],['allergens','Alérgenos','input']
  ];
  const fieldMarkup=(prefix,fields)=>fields.map(([key,label,type])=>`<label class="${type==='textarea'?'full':''}">${label}${type==='textarea'?`<textarea rows="${key==='story'||key==='elaboration'?5:3}" data-class6-field="${key}" data-path="${prefix}.${key}"></textarea>`:`<input data-class6-field="${key}" data-path="${prefix}.${key}">`}</label>`).join('');
  const panel6=document.createElement('section');panel6.className='studio-panel class6-panel';panel6.dataset.panel='class6';panel6.hidden=true;
  panel6.innerHTML=`
    <div class="panel-intro"><p class="eyebrow">07 · Product Final</p><h3>Idiomas & storytelling</h3><p>La web pública funciona en ES/EN. Aquí editas ambos idiomas y la historia emocional de cada plato sin tocar código.</p></div>
    <article class="class6-card class6-card-featured"><div class="class6-card-head"><strong>Idioma del proyecto</strong><span>ES / EN</span></div><div class="control-grid"><label>Idioma inicial<select id="class6-default-locale" data-path="locale"><option value="es">Español</option><option value="en">English</option></select></label><label>Editar ahora<select id="class6-edit-locale"><option value="es">Español</option><option value="en">English</option></select></label></div><button type="button" class="motion-preview" id="class6-preview-language">Ver idioma en la web ↗</button></article>
    <article class="class6-card"><div class="class6-card-head"><strong>Copy global bilingüe</strong><span id="class6-global-lang">ES</span></div><div class="control-grid class6-global-fields">${fieldMarkup('i18n.es',globalFields)}</div></article>
    <article class="class6-card class6-story-editor"><div class="class6-card-head"><strong>Ficha emocional del plato</strong><span id="class6-dish-lang">ES</span></div><label>Plato<select id="class6-dish-select">${D.dishes.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></label><div class="control-grid class6-dish-fields">${fieldMarkup('i18n.es.dishes.dish-01',dishFields)}</div><button type="button" class="motion-preview" id="class6-preview-dish">Ver ficha del plato ↗</button></article>
    <p class="studio-help"><strong>Contrato editorial.</strong> Los nuevos platos nacen con campos vacíos/editables. El restaurante es responsable de escribir y validar sus textos, ingredientes y alérgenos.</p>`;
  scroll.appendChild(panel6);

  const editLocale=document.getElementById('class6-edit-locale'),dishSelect=document.getElementById('class6-dish-select');
  const setDynamicPaths=()=>{
    const lang=editLocale.value,dish=dishSelect.value;
    document.getElementById('class6-global-lang').textContent=lang.toUpperCase();document.getElementById('class6-dish-lang').textContent=lang.toUpperCase();
    panel6.querySelectorAll('.class6-global-fields [data-class6-field]').forEach(el=>{const suffix=el.dataset.path.split('.').slice(2).join('.');el.dataset.path=`i18n.${lang}.${suffix}`});
    panel6.querySelectorAll('.class6-dish-fields [data-class6-field]').forEach(el=>{el.dataset.path=`i18n.${lang}.dishes.${dish}.${el.dataset.class6Field}`});
  };
  setDynamicPaths();
  const syncDynamic=async()=>{
    setDynamicPaths();
    let cfg=D;try{const saved=await window.RestaurantStore?.loadProject?.();if(saved?.config)cfg={...D,...saved.config,i18n:{...D.i18n,...saved.config.i18n}}}catch{}
    panel6.querySelectorAll('[data-class6-field]').forEach(el=>{const v=el.dataset.path.split('.').reduce((a,k)=>a?.[k],cfg);if(v!==undefined)el.value=v});
  };
  editLocale.addEventListener('change',syncDynamic);dishSelect.addEventListener('change',syncDynamic);
  document.getElementById('class6-preview-language').addEventListener('click',()=>{const lang=editLocale.value;localStorage.setItem('restaurant-locale',lang);window.dispatchEvent(new CustomEvent('restaurant:locale-request',{detail:{lang}}));window.RestaurantStudioShell?.close?.();setTimeout(()=>document.getElementById('top')?.scrollIntoView({behavior:'smooth'}),80)});
  document.getElementById('class6-preview-dish').addEventListener('click',()=>{window.RestaurantStudioShell?.close?.();setTimeout(()=>{document.getElementById('signature')?.scrollIntoView({behavior:'smooth',block:'start'});window.dispatchEvent(new CustomEvent('restaurant:class6-open-dish',{detail:{id:dishSelect.value,lang:editLocale.value}}))},160)});

  const loadRuntime=()=>{if(document.querySelector('script[data-class6-runtime]'))return;const s=document.createElement('script');s.src='class6-product.js';s.dataset.class6Runtime='1';document.body.appendChild(s)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadRuntime,140));else setTimeout(loadRuntime,140);
})();