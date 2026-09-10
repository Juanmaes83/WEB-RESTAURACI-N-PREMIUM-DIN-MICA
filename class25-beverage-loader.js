/* CLASS 25 — BEVERAGE CAPABILITY LOADER
   Loaded additively by the guaranteed Class 24 governance entrypoint. It waits for
   the shared Media Library and Studio config already owned by the platform, then
   loads Class 25 in deterministic order. */
(() => {
  'use strict';
  if(window.parent!==window)return;
  const root=document.documentElement;
  const CHAIN=['class25-beverages-model.js','class25-beverages-review.js','class25-beverages-engine.js','class25-beverages-studio.js'];
  function ensureStyles(){if(document.querySelector('link[data-class25-beverage-styles]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='styles-v25.css';l.dataset.class25BeverageStyles='1';document.head.appendChild(l)}
  function load(i=0){if(i>=CHAIN.length){root.dataset.class25Beverages='ready';document.dispatchEvent(new CustomEvent('restaurant:beverages-ready'));return}const src=CHAIN[i];if(document.querySelector(`script[src="${src}"]`)){load(i+1);return}const s=document.createElement('script');s.src=src;s.dataset.class25BeveragePart=String(i+1);s.onload=()=>load(i+1);s.onerror=()=>{root.dataset.class25Beverages='error';console.error(`Class 25 failed to load ${src}`)};document.body.appendChild(s)}
  function waitForPlatform(attempt=0){if(window.RestaurantMedia&&window.RestaurantMediaPicker&&window.RestaurantStudioConfig){ensureStyles();load();return}if(attempt>160){root.dataset.class25Beverages='error';console.error('Class 25 timed out waiting for shared platform APIs');return}setTimeout(()=>waitForPlatform(attempt+1),50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>waitForPlatform(),{once:true});else waitForPlatform();
})();