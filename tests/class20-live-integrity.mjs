import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'https://restaurant-class20-review.vercel.app';
const files=['index.html','app-v4.js','class4-config.js','class4-store.js','class4-runtime-guard.js','class16-location-maps.js','class17-social-reputation.js','class18-whatsapp-contact.js','class19-motion-library.js','class20-modules-studio.js','styles-v20.css','styles-v20-public.css'];
for(const file of files){const response=await fetch(`${base}/${file}`);assert.equal(response.status,200,file);const local=execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'}).replace(/\r\n/g,'\n');const remote=(await response.text()).replace(/\r\n/g,'\n');assert.equal(remote,local,`Deployed file differs from HEAD: ${file}`);console.log('PASS HEAD content / HTTP 200',file)}
console.log('VERIFIED_HEAD',execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
