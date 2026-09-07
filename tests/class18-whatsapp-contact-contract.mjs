import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync('class18-whatsapp-contact.js','utf8');
const css = fs.readFileSync('styles-v18.css','utf8');
const html = fs.readFileSync('labs/module-whatsapp-contact/index.html','utf8');
const doc = fs.readFileSync('docs/MODULE-WHATSAPP-CONTACT.md','utf8');
const check = (condition, message) => assert.ok(condition, message);

check(js.includes('enabled: false'), 'production default OFF');
check(js.includes("floating-launcher") && js.includes("inline-concierge") && js.includes("direct-cta"), 'three modes present');
check(js.includes("return raw.replace(/[^0-9]/g, '')"), 'phone normalization present');
check(js.includes('/^\\d{8,15}$/'), 'international phone length validation present');
check(js.includes('https://wa.me/${digits}'), 'wa.me destination built');
check(js.includes('encodeURIComponent(msg)'), 'message encoded');
check(js.includes("a.rel = 'noopener noreferrer'"), 'external link protection present');
check(html.includes('<base href="../../">'), 'LAB base path fixed to repo root');
check(html.includes('name="enabled"') && html.includes('name="phone"') && html.includes('name="message"'), 'core controls present');
check(html.includes('name="showPrompt"') && html.includes('name="position"'), 'prompt and position controls present');
check(css.includes('@media(max-width:560px)'), 'mobile layout present');
check(css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced motion rule present');
check(doc.includes('Do not replace the current Studio'), 'additive Studio integration documented');
check(doc.includes('No third-party chatbot/provider script is loaded'), 'provider boundary documented');
console.log('PASS · WhatsApp Contact isolated contract');
