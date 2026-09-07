import fs from 'node:fs';

const html = fs.readFileSync('labs/project06-circular-dish-rotator/index.html', 'utf8');
const js = fs.readFileSync('labs/project06-circular-dish-rotator/project06-circular-dish-rotator.js', 'utf8');
const css = fs.readFileSync('labs/project06-circular-dish-rotator/project06-circular-dish-rotator.css', 'utf8');

const checks = [];
const check = (name, pass) => {
  if (!pass) throw new Error(`FAIL: ${name}`);
  checks.push(name);
};

check('full pizza source is used', html.includes('PIZZA%20COMPLETA%20DE%208%20TROZOS.png'));
check('independent slice sources are not used', !html.includes('/source/slices/') && !js.includes('/source/slices/'));
check('eight-sector geometry exists', js.includes('const COUNT = 8') && js.includes('const STEP_DEG = 45'));
check('single canonical rotationProgress exists', (js.match(/let rotationProgress/g) || []).length === 1);
check('active index derives from rotationProgress', js.includes('Math.round(rotationProgress)'));
check('visual rotation derives from rotationProgress', js.includes('BASE_OFFSET_DEG - rotationProgress * STEP_DEG'));
check('base disc and hero-sector clone share the same rotation', js.includes('sectorDisc.style.transform = transform'));
check('circular drag uses pointer angle', js.includes('Math.atan2'));
check('drag accumulates angular movement across full turns', js.includes('dragAccumulatedDeg += frameDelta'));
check('drag updates progress continuously', js.includes('rotationProgress = dragStartProgress - dragAccumulatedDeg / STEP_DEG'));
check('release snaps to nearest integer', js.includes('Math.round(projectedProgress)'));
check('flick can project multiple full sectors', js.includes('COUNT * 3') && js.includes('projectionMs'));
check('step navigation shares canonical progress', js.includes('animateTo(anchor + amount'));
check('discover defaults to fortune-wheel multi-turn range', js.includes('4 + Math.floor(Math.random() * 3)'));
check('discover has reverse anticipation before main throw', js.includes("spinPhase = 'anticipation'") && js.includes('rotationProgress - .18'));
check('discover has long controlled deceleration', js.includes('easing: easeOutQuint'));
check('discover can be deterministic for tests', js.includes('targetOverride') && js.includes('turnsOverride'));
check('selector is independent SVG overlay', html.includes('class="cdr-selector"') && css.includes('.cdr-selector'));
check('selector itself is not rotated by JS', !js.includes('cdr-selector'));
check('selected sector uses independent clipped hero layer', html.includes('class="cdr-active-sector"') && html.includes('id="cdr-sector-disc"') && css.includes('clip-path:polygon'));
check('settled hero sector receives stronger phase-1 lift', css.includes('data-settled="true"] .cdr-active-sector') && css.includes('translateY(-14px) scale(1.055)'));
check('base pizza is visually subordinated when hero settles', css.includes('data-settled="true"] .cdr-disc') && css.includes('brightness(.88)'));
check('phase-1 product data has eight authored pizzas', js.includes('const PIZZAS = [') && (js.match(/ingredients:/g) || []).length === 8);
check('ingredients are driven by selected pizza', html.includes('id="cdr-ingredients"') && js.includes('ingredientsEl.textContent = pizza.ingredients'));
check('price is driven by selected pizza', html.includes('id="cdr-price"') && js.includes('priceEl.textContent = pizza.price'));
check('descriptor is driven by selected pizza', html.includes('id="cdr-descriptor"') && js.includes('descriptorEl.textContent = pizza.descriptor'));
check('wow headline has dynamic lead, hero name and tail', html.includes('id="cdr-headline-lead"') && html.includes('id="cdr-hero-name"') && html.includes('id="cdr-headline-tail"') && js.includes('leadEl.textContent = pizza.lead') && js.includes('tailEl.textContent = pizza.tail'));
check('mood line is data driven', html.includes('id="cdr-mood"') && js.includes('moodEl.textContent = pizza.mood'));
check('accent can follow active product', js.includes("style.setProperty('--cdr-accent', pizza.accent)"));
check('visual copy-to-product relationship exists', html.includes('cdr-copy-link') && html.includes('cdr-selection-beam'));
check('ghost typography is driven by active pizza', html.includes('id="cdr-ghost-name"') && js.includes('ghostName.textContent = pizza.name.toUpperCase()'));
check('sector crossings create physical pointer feedback', js.includes('cdr-tick-hit') && css.includes('cdrPointerTick'));
check('landing creates hero + copy choreography', js.includes('cdr-land') && js.includes('cdr-copy-land') && css.includes('cdrSliceLand') && css.includes('cdrStoryReveal'));
check('reduced motion preserves selection path', js.includes('reducedMotion.matches'));
check('keyboard navigation exists', js.includes("event.key === 'ArrowRight'") && js.includes("event.key === 'ArrowLeft'"));
check('accessibility live region exists', html.includes('id="cdr-live"') && js.includes('Selected pizza:'));
check('isolated lab does not depend on shared motion engine JS', !html.includes('app-v4.js') && !html.includes('class10-orbital-food.js'));

console.log(`Project 06 Phase 1 contract PASS — ${checks.length}/${checks.length}`);
for (const name of checks) console.log(`  ✓ ${name}`);
