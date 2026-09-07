/* CLASS 18 — OPTIONAL WHATSAPP CONTACT / CONCIERGE MODULE
   Isolated LAB. Production target defaults OFF. No third-party chat script is loaded. */
(() => {
  'use strict';

  const DEFAULTS = Object.freeze({
    enabled: false,
    mode: 'floating-launcher',
    phone: '+34 600 123 456',
    message: 'Hola, quiero reservar una mesa.',
    label: 'Hablar por WhatsApp',
    eyebrow: 'CONCIERGE',
    title: 'Need a table tonight?',
    body: 'Escríbenos directamente. Sin formularios y sin cambiar el tono de la experiencia.',
    availability: 'Replies during service hours',
    position: 'right',
    showPrompt: true,
    openInNewTab: true
  });

  const MODES = new Set(['direct-cta', 'floating-launcher', 'inline-concierge']);
  const POSITIONS = new Set(['right', 'left']);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const text = (v) => String(v ?? '').trim();

  function normalizePhone(value) {
    const raw = text(value);
    if (!raw) return '';
    return raw.replace(/[^0-9]/g, '');
  }

  function isValidPhone(value) {
    const digits = normalizePhone(value);
    return /^\d{8,15}$/.test(digits);
  }

  function buildWhatsAppUrl(config) {
    const digits = normalizePhone(config.phone);
    if (!/^\d{8,15}$/.test(digits)) return '';
    const msg = text(config.message);
    const qs = msg ? `?text=${encodeURIComponent(msg)}` : '';
    return `https://wa.me/${digits}${qs}`;
  }

  function normalize(input = {}) {
    const base = clone(DEFAULTS);
    return {
      ...base,
      ...input,
      enabled: Boolean(input.enabled ?? base.enabled),
      mode: MODES.has(input.mode) ? input.mode : base.mode,
      phone: text(input.phone),
      message: text(input.message),
      label: text(input.label) || base.label,
      eyebrow: text(input.eyebrow) || base.eyebrow,
      title: text(input.title) || base.title,
      body: text(input.body) || base.body,
      availability: text(input.availability),
      position: POSITIONS.has(input.position) ? input.position : base.position,
      showPrompt: Boolean(input.showPrompt ?? base.showPrompt),
      openInNewTab: Boolean(input.openInNewTab ?? base.openInNewTab)
    };
  }

  const Utils = Object.freeze({ DEFAULTS, normalize, normalizePhone, isValidPhone, buildWhatsAppUrl });
  if (typeof window !== 'undefined') window.WhatsAppContactModuleUtils = Utils;
  if (typeof document === 'undefined') return;

  const root = document.getElementById('wa-lab');
  const form = document.getElementById('wa-controls');
  const mount = document.getElementById('wa-preview');
  if (!root || !form || !mount) return;
  let config = normalize({ ...clone(DEFAULTS), enabled: true });
  let promptOpen = true;

  const field = (name) => form.querySelector(`[name="${name}"]`);
  const fields = {
    enabled: field('enabled'), mode: field('mode'), phone: field('phone'), message: field('message'), label: field('label'),
    eyebrow: field('eyebrow'), title: field('title'), body: field('body'), availability: field('availability'), position: field('position'), showPrompt: field('showPrompt')
  };

  function sync() {
    fields.enabled.checked = config.enabled; fields.mode.value = config.mode; fields.phone.value = config.phone; fields.message.value = config.message;
    fields.label.value = config.label; fields.eyebrow.value = config.eyebrow; fields.title.value = config.title; fields.body.value = config.body;
    fields.availability.value = config.availability; fields.position.value = config.position; fields.showPrompt.checked = config.showPrompt;
  }

  function read() {
    return normalize({
      enabled: fields.enabled.checked, mode: fields.mode.value, phone: fields.phone.value, message: fields.message.value, label: fields.label.value,
      eyebrow: fields.eyebrow.value, title: fields.title.value, body: fields.body.value, availability: fields.availability.value,
      position: fields.position.value, showPrompt: fields.showPrompt.checked
    });
  }

  function el(tag, cls, value) {
    const n = document.createElement(tag); if (cls) n.className = cls; if (value !== undefined) n.textContent = value; return n;
  }

  function makeLink(className, compact = false) {
    const url = buildWhatsAppUrl(config);
    const a = document.createElement('a');
    a.className = className;
    a.setAttribute('aria-label', config.label);
    if (url) {
      a.href = url;
      if (config.openInNewTab) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    } else {
      a.href = '#'; a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', (e) => e.preventDefault());
    }
    a.innerHTML = compact ? '<span class="wa-mark">WA</span>' : `<span>${config.label}</span><i aria-hidden="true">↗</i>`;
    return a;
  }

  function renderFloating(stage) {
    const wrap = el('div', `wa-floating wa-pos-${config.position}`);
    if (config.showPrompt && promptOpen) {
      const prompt = el('div', 'wa-prompt');
      const close = el('button', 'wa-prompt-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Cerrar mensaje');
      close.addEventListener('click', () => { promptOpen = false; render(); });
      prompt.append(close, el('span', 'wa-mini', config.eyebrow), el('strong', '', config.title), el('p', '', config.body));
      if (config.availability) prompt.appendChild(el('small', '', config.availability));
      stage.appendChild(prompt);
    }
    const launcher = makeLink('wa-launcher', true);
    launcher.appendChild(el('span', 'wa-launcher-label', config.label));
    wrap.appendChild(launcher); stage.appendChild(wrap);
  }

  function renderInline(stage) {
    const card = el('article', 'wa-concierge');
    const copy = el('div', 'wa-concierge-copy');
    copy.append(el('p', 'wa-mini', config.eyebrow), el('h2', '', config.title), el('p', '', config.body));
    if (config.availability) copy.appendChild(el('small', '', config.availability));
    card.append(copy, makeLink('wa-inline-cta'));
    stage.appendChild(card);
  }

  function renderDirect(stage) {
    const direct = el('div', 'wa-direct');
    direct.append(el('span', 'wa-mini', config.eyebrow), el('strong', '', config.title), makeLink('wa-direct-cta'));
    stage.appendChild(direct);
  }

  function render() {
    mount.replaceChildren();
    root.dataset.enabled = String(config.enabled); root.dataset.mode = config.mode; root.dataset.position = config.position;
    if (!config.enabled) {
      const off = el('div', 'wa-off'); off.innerHTML = '<span>OPTIONAL MODULE · OFF</span><strong>WhatsApp is not published.</strong><p>No launcher, no external request and no contact CTA are rendered.</p>'; mount.appendChild(off); return;
    }
    const stage = el('section', `wa-experience wa-mode-${config.mode}`);
    stage.innerHTML = '<div class="wa-demo-copy"><span>PRIVATE DINING · ALICANTE</span><h1>Some nights deserve a direct line.</h1><p>This is a neutral restaurant canvas for reviewing the optional contact layer.</p></div><div class="wa-demo-orb"></div>';
    if (config.mode === 'floating-launcher') renderFloating(stage);
    else if (config.mode === 'inline-concierge') renderInline(stage);
    else renderDirect(stage);
    if (!isValidPhone(config.phone)) stage.appendChild(el('p', 'wa-invalid', 'Añade un número internacional válido para activar el enlace.'));
    mount.appendChild(stage);
  }

  form.addEventListener('input', () => { config = read(); promptOpen = true; render(); });
  form.addEventListener('change', () => { config = read(); promptOpen = true; render(); });
  document.getElementById('wa-reset')?.addEventListener('click', () => { config = normalize({ ...clone(DEFAULTS), enabled: true }); promptOpen = true; sync(); render(); });

  window.WhatsAppContactLab = Object.freeze({ getConfig: () => clone(config), setConfig: (next) => { config = normalize(next); promptOpen = true; sync(); render(); }, buildWhatsAppUrl: () => buildWhatsAppUrl(config), render });
  sync(); render();
})();