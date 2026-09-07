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
check('circular drag uses pointer angle', js.includes('Math.atan2'));
check('drag accumulates angular movement across full turns', js.includes('dragAccumulatedDeg += frameDelta'));
check('drag updates progress continuously', js.includes('rotationProgress = dragStartProgress - dragAccumulatedDeg / STEP_DEG'));
check('release snaps to nearest integer', js.includes('Math.round(projectedProgress)'));
check('step navigation shares canonical progress', js.includes('animateTo(anchor + amount'));
check('discover performs multiple complete turns', js.includes('turns * COUNT + forwardSteps'));
check('discover can be made deterministic for tests', js.includes('targetOverride') && js.includes('turnsOverride'));
check('selector is independent SVG overlay', html.includes('class="cdr-selector"') && css.includes('.cdr-selector'));
check('selector itself is not rotated by JS', !js.includes('cdr-selector'));
check('reduced motion preserves selection path', js.includes('reducedMotion.matches'));
check('keyboard navigation exists', js.includes("event.key === 'ArrowRight'") && js.includes("event.key === 'ArrowLeft'"));
check('accessibility live region exists', html.includes('id="cdr-live"') && js.includes('Selected pizza:'));
check('isolated lab does not depend on shared motion engine JS', !html.includes('app-v4.js') && !html.includes('class10-orbital-food.js'));

console.log(`Project 06 contract PASS — ${checks.length}/${checks.length}`);
for (const name of checks) console.log(`  ✓ ${name}`);
