import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const js = fs.readFileSync('class16-location-maps.js', 'utf8');
const html = fs.readFileSync('labs/module-location-maps/index.html', 'utf8');
const css = fs.readFileSync('styles-v16.css', 'utf8');
const workflow = fs.readFileSync('.github/workflows/location-maps-module.yml', 'utf8');

const sandbox = { window: {}, URL, console };
vm.runInNewContext(js, sandbox, { filename: 'class16-location-maps.js' });
const U = sandbox.window.LocationMapsModuleUtils;
assert.ok(U, 'LocationMapsModuleUtils must be exposed without DOM');

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

check(U.DEFAULTS.enabled === false, 'production module contract must default OFF');
check(U.DEFAULTS.maps.privacyMode === 'click', 'privacy default must be click-to-load');
check(U.DEFAULTS.design.preset === 'split-editorial', 'default visual preset must be split-editorial');

const enabled = U.normalizeConfig({ enabled: true, design: { preset: 'full-width' }, maps: { privacyMode: 'auto' } });
check(enabled.enabled === true, 'module can be enabled');
check(enabled.design.preset === 'full-width', 'full-width preset accepted');
check(enabled.maps.privacyMode === 'auto', 'auto privacy mode accepted');

const fallback = U.normalizeConfig({ design: { preset: 'hacked' }, maps: { mode: 'other', privacyMode: 'always' } });
check(fallback.design.preset === 'split-editorial', 'unknown preset falls back safely');
check(fallback.maps.mode === 'address', 'unknown map mode falls back to address');
check(fallback.maps.privacyMode === 'click', 'unknown privacy mode falls back to click');

const torrevieja = U.normalizeConfig({
  enabled: true,
  address: { street: 'Paseo Vistalegre 12', postalCode: '03181', city: 'Torrevieja', region: 'Alicante', country: 'España' }
});
const directions = U.buildDirectionsUrl(torrevieja);
check(directions.startsWith('https://www.google.com/maps/search/?api=1&query='), 'address mode generates canonical Google Maps search URL');
check(decodeURIComponent(directions).includes('Torrevieja'), 'generated directions contain city');

const coords = U.normalizeConfig({ maps: { latitude: 37.9787, longitude: -0.6822 } });
check(decodeURIComponent(U.buildDirectionsUrl(coords)).includes('37.9787,-0.6822'), 'coordinates override address when explicitly supplied');

check(U.isAllowedGoogleMapUrl('https://www.google.com/maps/place/Torrevieja') === true, 'normal Google Maps URL accepted');
check(U.isAllowedGoogleMapUrl('https://maps.google.com/?q=Torrevieja') === true, 'maps.google.com accepted');
check(U.isAllowedGoogleMapUrl('http://www.google.com/maps/place/Torrevieja') === false, 'non-HTTPS map URL rejected');
check(U.isAllowedGoogleMapUrl('https://evil.example/maps/place/Torrevieja') === false, 'non-Google host rejected');
check(U.isAllowedGoogleMapUrl('https://www.google.com/maps/embed?pb=test', { embedOnly: true }) === true, 'Google embed URL accepted');
check(U.isAllowedGoogleMapUrl('https://www.google.com/maps/place/Torrevieja', { embedOnly: true }) === false, 'normal map URL rejected in embed-only mode');

const embedMode = U.normalizeConfig({ maps: { mode: 'embed', embedUrl: 'https://www.google.com/maps/embed?pb=test' } });
check(U.deriveEmbedUrl(embedMode) === 'https://www.google.com/maps/embed?pb=test', 'explicit valid embed preserved');

const badEmbed = U.normalizeConfig({ maps: { mode: 'embed', embedUrl: 'https://evil.example/embed' } });
check(U.deriveEmbedUrl(badEmbed).startsWith('https://www.google.com/maps?q='), 'invalid embed safely falls back to generated Google embed');
check(U.deriveEmbedUrl(torrevieja).includes('output=embed'), 'address embed uses output=embed');

check(html.includes('../../styles-v16.css'), 'nested LAB resolves root CSS correctly');
check(html.includes('../../class16-location-maps.js'), 'nested LAB resolves root JS correctly');
check(html.includes('name="enabled"'), 'LAB exposes OFF/ON control');
check(html.includes('Split Editorial') && html.includes('Full Width Map') && html.includes('Minimal Location'), 'LAB exposes all three visual presets');
check(html.includes('Cargar al pulsar') && html.includes('Cargar al entrar'), 'LAB exposes both privacy modes');

check(js.includes("if (!config.enabled)"), 'render has explicit OFF branch');
check(js.includes("document.createElement('iframe')"), 'iframe is created dynamically rather than hard-coded in HTML');
check(!html.includes('<iframe'), 'HTML contains no eager iframe');
check(js.includes("target = '_blank'") && js.includes("noopener noreferrer"), 'external directions link is hardened');
check(js.includes('isAllowedGoogleMapUrl'), 'Google URL allow-list validation exists');
check(js.includes('mount.replaceChildren()'), 'public preview is fully replaced when module toggles');

check(css.includes('.lm-preset-split-editorial'), 'Split Editorial CSS exists');
check(css.includes('.lm-preset-full-width'), 'Full Width CSS exists');
check(css.includes('.lm-preset-minimal'), 'Minimal CSS exists');
check(css.includes('@media(max-width:760px)'), 'mobile-specific layout exists');
check(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion fallback exists');

check(workflow.includes('Parallel collision guard'), 'workflow protects shared files during parallel development');
check(workflow.includes('class16-location-maps.js'), 'workflow scopes Class 16 JS');
check(workflow.includes('labs/module-location-maps/'), 'workflow scopes isolated LAB');

console.log(`PASS · Location / Google Maps module contract · ${checks}/${checks}`);