import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync('class17-social-reputation.js','utf8');
const css = fs.readFileSync('styles-v17.css','utf8');
const html = fs.readFileSync('labs/module-social-reputation/index.html','utf8');
const doc = fs.readFileSync('docs/MODULE-SOCIAL-REPUTATION.md','utf8');
const check = (condition, message) => assert.ok(condition, message);

check(js.includes("enabled: false"), 'production default OFF');
check(js.includes("editorial-footer") && js.includes("reputation-strip") && js.includes("social-minimal"), 'three presets present');
for (const name of ['instagram','facebook','tripadvisor','google','thefork','michelin','tiktok','youtube']) check(js.includes(`${name}:`), `${name} metadata present`);
check(js.includes('isAllowedPlatformUrl'), 'platform URL validator present');
check(js.includes("u.protocol !== 'https:'"), 'HTTPS enforcement present');
check(js.includes("rel = 'noopener noreferrer'"), 'external links protected');
check(js.includes('validPlatforms(config)'), 'invalid/disabled platforms filtered');
check(js.includes('showRating') && js.includes('reviewCount'), 'rating/review controls present');
check(html.includes('<base href="../../">'), 'LAB base path fixed to repo root');
check(html.includes('name="enabled"'), 'OFF/ON control present');
check(html.includes('name="google-url"') && html.includes('name="tripadvisor-url"'), 'core reputation URLs exposed');
check(css.includes('@media(max-width:560px)'), 'mobile layout present');
check(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced motion rule present');
check(doc.includes('Do not replace the current Studio or footer'), 'additive Studio/footer integration documented');
console.log('PASS · Social / Reputation isolated contract');
