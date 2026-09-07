import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync('class15-cinematic-product-rail.js','utf8');
const css = fs.readFileSync('styles-v15.css','utf8');
const html = fs.readFileSync('labs/project11-cinematic-product-rail/index.html','utf8');
const doc = fs.readFileSync('docs/PROJECT-11-CINEMATIC-PRODUCT-RAIL.md','utf8');

const pass = (name, condition) => { assert.ok(condition, name); console.log(`PASS · ${name}`); };

pass('nested LAB resolves from repository root', html.includes('<base href="../../">'));
pass('LAB loads canonical restaurant config', html.includes('src="class4-config.js"'));
pass('LAB loads Class 15 engine', html.includes('src="class15-cinematic-product-rail.js"'));
pass('LAB loads Class 15 styles', html.includes('href="styles-v15.css"'));
pass('engine reads canonical dish catalogue', js.includes('window.RestaurantDefaults.dishes'));
pass('engine prefers existing depth-carousel product assets', js.includes('dish.depthCarousel?.asset || dish.image'));
pass('exactly one canonical railProgress declaration', (js.match(/let railProgress\s*=/g) || []).length === 1);
pass('active index derives from railProgress', js.includes('Math.round(railProgress)'));
pass('no selectedProduct state', !/selectedProduct\s*=/.test(js));
pass('no currentProduct authoritative state', !/let currentProduct|const currentProduct|var currentProduct/.test(js));
pass('continuous wrapped distance exists', js.includes('wrapDistance'));
pass('fractional pointer drag writes progress before release', js.includes("addEventListener('pointermove'") && js.includes('railProgress = nextProgress'));
pass('release uses measured progress velocity', js.includes('progressVelocity') && js.includes('projected'));
pass('single drag target is restrained to adjacent product', js.includes('origin - 1') && js.includes('origin + 1'));
pass('prev/next share canonical step()', js.includes("els.prev?.addEventListener('click', () => step(-1))") && js.includes("els.next?.addEventListener('click', () => step(1))"));
pass('keyboard uses same step path', js.includes("event.key === 'ArrowRight'") && js.includes('step(1)'));
pass('wheel uses same step path', js.includes("addEventListener('wheel'") && js.includes('step(delta > 0 ? 1 : -1)'));
pass('world interpolates from existing product metadata', js.includes('backgroundColor') && js.includes('mixHex'));
pass('copy is synchronized from derived active index', js.includes('updateCopy(index)'));
pass('debug adapter exposes progress and active index', js.includes('window.CinematicProductRail') && js.includes('getProgress') && js.includes('getActiveIndex'));
pass('no Swiper dependency or vocabulary', !/Swiper|swiper/i.test(js + html));
pass('mobile breakpoint exists', css.includes('@media (max-width:640px)'));
pass('reduced-motion fallback exists', css.includes('@media (prefers-reduced-motion:reduce)') && js.includes('reducedMotion.matches'));
pass('page overflow is contained by experience', css.includes('overflow:hidden'));
pass('documentation marks isolated human review', doc.includes('READY FOR HUMAN VISUAL REVIEW') && doc.includes('DO NOT MERGE'));
pass('documentation reserves final Studio integration', doc.includes('Studio/runtime integration waits'));

console.log('\nPROJECT 11 CONTRACT: PASS');
