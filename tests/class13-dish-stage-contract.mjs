import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync('class13-dish-stage.js', 'utf8');
const css = fs.readFileSync('styles-v13.css', 'utf8');
const html = fs.readFileSync('labs/project10-dish-stage/index.html', 'utf8');
const doc = fs.readFileSync('docs/PROJECT-10-DISH-STAGE.md', 'utf8');

const checks = [];
const test = (name, fn) => { fn(); checks.push(name); };

test('one canonical scalar is declared', () => {
  assert.match(js, /let position = 0;/);
  assert.doesNotMatch(js, /let (activeProduct|selectedProduct|currentProduct|incomingProduct)\b/);
});

test('active index is derived from canonical position', () => {
  assert.match(js, /activeIndex = \(\) => normalize\(Math\.round\(position\)\)/);
});

test('products come from RestaurantDefaults rather than a duplicate catalog', () => {
  assert.match(js, /window\.RestaurantDefaults\?\.dishes/);
  assert.doesNotMatch(js, /const dishes = \[\s*\{/);
});

test('existing asset registry is preferred', () => {
  assert.match(js, /dish\.depthCarousel\?\.asset \|\| dish\.image/);
});

test('fractional drag writes position directly', () => {
  assert.match(js, /position = dragOriginPosition - \(e\.clientX - dragOriginX\) \/ unit/);
});

test('all stepped navigation converges on animatePosition', () => {
  assert.match(js, /function step\(direction\)/);
  assert.match(js, /animatePosition\(base \+ Math\.sign/);
});

test('release is restrained to adjacent product', () => {
  assert.match(js, /const target = anchor \+ direction/);
});

test('desktop and mobile trajectories are distinct', () => {
  assert.match(js, /const mobile = innerWidth < 760/);
  assert.match(js, /distance > 0 \? -a \* 235 : a \* 255/);
});

test('copy and commerce fields derive from active dish', () => {
  for (const token of ['ingredientsEl','priceEl','titleEl','shortEl','metaEl']) assert.ok(js.includes(token));
});

test('detail content derives from activeDish()', () => {
  assert.match(js, /const d = activeDish\(\)/);
});

test('reduced motion preserves navigation', () => {
  assert.match(js, /if \(reduced\.matches \|\| !window\.gsap\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('lab loads approved baseline config read-only before engine', () => {
  const configAt = html.indexOf('../../class4-config.js');
  const engineAt = html.indexOf('../../class13-dish-stage.js');
  assert.ok(configAt > -1 && engineAt > configAt);
});

test('lab has direct manipulation and alternative controls', () => {
  for (const token of ['data-ds-stage','data-ds-prev','data-ds-next','tabindex="0"']) assert.ok(html.includes(token));
});

test('documentation locks shared parallel files', () => {
  for (const path of ['app-v4.js','class4-runtime-guard.js','class5-studio-motion.js','class11-pizza-slice-orbit.js','styles-v11.css','index.html']) assert.ok(doc.includes(path));
});

test('dish stage does not reuse premium pizza class12 filenames', () => {
  assert.ok(!html.includes('styles-v12.css'));
  assert.ok(!html.includes('class12-dish-stage.js'));
});

console.log(`PROJECT10_DISH_STAGE_CONTRACT_PASS ${checks.length}/${checks.length}`);
