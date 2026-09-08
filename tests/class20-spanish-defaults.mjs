/* CLASS 20 — the public template starts in SPANISH.

   The optional modules shipped with English default copy, which is a product
   inconsistency: a fresh installation of this template is a Spanish restaurant. This
   guard is deliberately narrow. It does NOT police the whole repository and it does not
   touch internal names, enums, ids, data attributes, config paths, preset values, brand
   names or URLs — those are legitimately English and must stay.

   What it does:
     1. the known English phrases that were shipped can never come back;
     2. the public defaults each module renders are Spanish, asserted one by one;
     3. the rendered public DOM of the three modules carries no stray English copy,
        checked against a small dictionary of the words that actually appeared;
     4. and the modules still behave: OFF renders nothing, Location keeps its
        click-to-load privacy gate, WhatsApp refuses an invalid phone.

   Usage: node tests/class20-spanish-defaults.mjs
*/
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer} from './static-server.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];
const check=(name,ok,detail='')=>{results.push({name,ok});
  console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`)};

/* ---------- 1. the phrases that shipped in English must not return ---------- */
const MODULE_FILES=['class16-location-maps.js','class17-social-reputation.js',
  'class18-whatsapp-contact.js','class20-modules-studio.js'];
const BANNED=['Find us','Come for dinner','Stay for the night','Come by.',
  'Your table is closer','Tue — Sun','Torrevieja · Spain','Stay close to the table',
  'SOCIAL · REVIEWS · COMMUNITY','Guest rating','Read our reviews',
  'Follow the kitchen','Need a table tonight','Replies during service hours',
  'Social and reputation links','} reviews`',"'Eyebrow'"];
const offenders=[];
for(const f of MODULE_FILES){
  const src=fs.readFileSync(path.join(ROOT,f),'utf8');
  for(const phrase of BANNED)if(src.includes(phrase))offenders.push(`${f}: ${phrase}`);
}
check('source · none of the English phrases that shipped is back',
  offenders.length===0,offenders.slice(0,4).join(' | ')||`${BANNED.length} phrases checked`);

/* the Spanish replacements are the declared defaults, not a coincidence of rendering */
const EXPECTED={
  'class16-location-maps.js':["title: 'Encuéntranos'","eyebrow: 'Torrevieja · España'",
    "hours: 'Mar — Dom · 13:00 — 00:00'",'Tu mesa está más cerca de lo que parece.',
    'Ven a cenar. Quédate a disfrutar de la noche.','UBICACIÓN'],
  'class17-social-reputation.js':["heading: 'Sigue cerca de nuestra mesa.'",
    "eyebrow: 'SOCIAL · RESEÑAS · COMUNIDAD'","ratingLabel: 'Valoración de clientes'",
    "reviewCtaLabel: 'Leer reseñas'",'} reseñas`','Enlaces sociales y de reputación'],
  'class18-whatsapp-contact.js':["title: '¿Necesitas mesa esta noche?'",
    "availability: 'Respondemos durante el horario de servicio'"]
};
const missing=[];
for(const [f,list] of Object.entries(EXPECTED)){
  const src=fs.readFileSync(path.join(ROOT,f),'utf8');
  for(const s of list)if(!src.includes(s))missing.push(`${f}: ${s}`);
}
check('source · every Spanish default is declared where it belongs',
  missing.length===0,missing.slice(0,4).join(' | ')
    ||`${Object.values(EXPECTED).flat().length} defaults asserted`);

/* ---------- 2. and the rendered page agrees ---------- */
const {server,url:BASE}=await startServer(0);
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:960}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.RestaurantStudioConfig,null,{timeout:30000});

/* OFF first: the modules must not reserve any public space */
const off=await page.evaluate(()=>({
  location:document.querySelectorAll('[class^="lm-"],.lm-section').length,
  social:document.querySelectorAll('[class^="sr-"]').length,
  whatsapp:document.querySelectorAll('[class^="wa-"]').length,
  iframes:document.querySelectorAll('iframe').length}));
check('OFF · the three modules render no public DOM at all',
  off.location===0&&off.social===0&&off.whatsapp===0&&off.iframes===0,
  `location ${off.location} · social ${off.social} · whatsapp ${off.whatsapp}`);

/* now ON, with the shipped defaults untouched */
await page.evaluate(()=>{
  window.RestaurantStudioConfig.set('modules.location.enabled',true);
  window.RestaurantStudioConfig.set('modules.social.enabled',true);
  window.RestaurantStudioConfig.set('modules.whatsapp.enabled',true);
});
await page.waitForFunction(()=>document.querySelectorAll('[class^="lm-"]').length>0
  &&document.querySelectorAll('[class^="sr-"]').length>0
  &&document.querySelectorAll('[class^="wa-"]').length>0,null,{timeout:20000});
await page.waitForTimeout(900);

const rendered=await page.evaluate(()=>{
  const grab=sel=>[...document.querySelectorAll(sel)]
    .map(el=>el.innerText||el.textContent||'').join(' ');
  const aria=[...document.querySelectorAll('[aria-label]')]
    .map(el=>el.getAttribute('aria-label')).join(' | ');
  return {location:grab('[class^="lm-"]'),social:grab('[class^="sr-"]'),
    whatsapp:grab('[class^="wa-"]'),aria};
});

/* A fresh install ships COPY, not business data: class20 seeds the Studio defaults with
   the address, phone, rating and platform URLs deliberately blank so no restaurant is
   ever published with invented information. So what is asserted here is the copy. */
check('ON · Location renders its Spanish copy',
  /Encuéntranos/.test(rendered.location)
  &&/Ven a cenar\. Quédate a disfrutar de la noche\./.test(rendered.location),
  rendered.location.replace(/\s+/g,' ').slice(0,70));
check('ON · Location ships no invented address, phone or hours',
  await page.evaluate(()=>{
    const m=window.RestaurantStudioConfig.get('modules.location');
    return !m.phone&&!m.hours&&!m.eyebrow
      &&Object.values(m.address).every(v=>!v)}),
  'business data blank by design');
check('ON · Social renders its Spanish copy',
  /Sigue cerca de nuestra mesa/.test(rendered.social)
  &&/RESEÑAS · COMUNIDAD/.test(rendered.social)
  &&/Sigue la cocina/.test(rendered.social),
  rendered.social.replace(/\s+/g,' ').slice(0,70));

/* the rating block is off on a fresh install — turn it on and its copy must be Spanish
   too, because that is exactly where "Guest rating" and "reviews" used to appear */
const rating=await page.evaluate(async()=>{
  window.RestaurantStudioConfig.set('modules.social.showRating',true);
  window.RestaurantStudioConfig.set('modules.social.rating',4.8);
  window.RestaurantStudioConfig.set('modules.social.reviewCount',486);
  window.RestaurantStudioConfig.set('modules.social.reviewCtaUrl','https://www.google.com/maps/');
  await new Promise(r=>setTimeout(r,1100));
  const el=document.querySelector('.sr-reputation');
  return el?(el.innerText||el.textContent||''):'';
});
/* innerText returns the RENDERED text, and the label is uppercased by CSS, so the
   comparison has to be case-insensitive or it fails on a correct translation */
check('ON · the rating block is Spanish once enabled',
  /valoración de clientes/i.test(rating)&&/reseñas/i.test(rating)
  &&/leer reseñas/i.test(rating)&&!/guest rating|reviews|read our/i.test(rating),
  rating.replace(/\s+/g,' ').slice(0,80));
check('ON · WhatsApp renders its Spanish copy',
  /¿Necesitas mesa esta noche\?/.test(rendered.whatsapp)
  &&/Respondemos durante el horario de servicio/.test(rendered.whatsapp),
  rendered.whatsapp.replace(/\s+/g,' ').slice(0,70));

/* a dictionary of the words that actually appeared in the shipped English copy —
   narrow on purpose, so brand names and technical values never trip it */
const EN_WORDS=/\b(find us|come for dinner|stay for the night|come by|your table|guest rating|read our reviews|reviews|rating|need a table|tonight|replies|service hours|stay close|community|follow the kitchen)\b/i;
const publicText=`${rendered.location} ${rendered.social} ${rendered.whatsapp}`;
const hits=publicText.match(EN_WORDS);
check('ON · no stray English word in the public module DOM',
  !hits,hits?`found "${hits[0]}"`:'clean');
check('ON · public aria-labels are Spanish too',
  /Enlaces sociales y de reputación/.test(rendered.aria)
  &&!/Social and reputation links/.test(rendered.aria),
  'aria-label translated');

/* ---------- 3. behaviour is untouched ---------- */
/* the gate only has something to gate once there IS an address, which a fresh install
   does not ship — so give it one, the way a restaurant would, and then check the gate */
const privacy=await page.evaluate(async()=>{
  window.RestaurantStudioConfig.set('modules.location.address.street','Paseo Vistalegre 12');
  window.RestaurantStudioConfig.set('modules.location.address.city','Torrevieja');
  await new Promise(r=>setTimeout(r,1100));
  const before=document.querySelectorAll('iframe').length;
  const btn=[...document.querySelectorAll('[class^="lm-"] button')]
    .find(b=>/Google Maps/i.test(b.textContent||''));
  return {before,gate:!!btn,label:btn?.textContent.trim()||''};
});
check('behaviour · Location still gates the map behind a click, no iframe before it',
  privacy.before===0&&privacy.gate,`gate: "${privacy.label}"`);

const phone=await page.evaluate(async()=>{
  window.RestaurantStudioConfig.set('modules.whatsapp.phone','abc');
  await new Promise(r=>setTimeout(r,900));
  const links=[...document.querySelectorAll('[class^="wa-"] a')]
    .map(a=>a.getAttribute('href')||'');
  return {links,any:links.some(h=>/wa\.me|api\.whatsapp/.test(h))};
});
check('behaviour · WhatsApp builds no URL from an invalid phone',
  !phone.any,`${phone.links.length} links, none is a wa.me URL`);
await page.evaluate(()=>window.RestaurantStudioConfig.set('modules.whatsapp.phone','+34 600 123 456'));
await page.waitForTimeout(800);

const social=await page.evaluate(async()=>{
  window.RestaurantStudioConfig.set('modules.social.platforms.0.url','https://example.com/nope');
  await new Promise(r=>setTimeout(r,900));
  const hrefs=[...document.querySelectorAll('[class^="sr-"] a')].map(a=>a.getAttribute('href'));
  return {hrefs,leaked:hrefs.some(h=>/example\.com/.test(h||''))};
});
check('behaviour · Social still validates a URL against its platform host',
  !social.leaked,`${social.hrefs.length} links, no foreign host accepted`);

check('runtime · no page errors while switching the modules on',errors.length===0,
  errors.slice(0,2).join(' | ')||'clean');

await context.close();
await browser.close();server.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
if(failed.length){
  console.error(`SPANISH_DEFAULTS_FAIL: ${failed.map(f=>f.name).join(' | ')}`);
  process.exit(1);
}
console.log('SPANISH_DEFAULTS_PASS');
