/* CLASS 17 — OPTIONAL SOCIAL / REPUTATION MODULE
   Isolated LAB. Production target defaults OFF and later mounts additively inside existing Studio. */
(() => {
  'use strict';

  const PLATFORM_META = Object.freeze({
    instagram: { label: 'Instagram', mark: 'IG', hosts: ['instagram.com'] },
    facebook: { label: 'Facebook', mark: 'FB', hosts: ['facebook.com', 'fb.com'] },
    tripadvisor: { label: 'Tripadvisor', mark: 'TA', hosts: ['tripadvisor.com', 'tripadvisor.es'] },
    google: { label: 'Google', mark: 'G', hosts: ['google.com', 'google.es', 'goo.gl', 'maps.app.goo.gl'] },
    thefork: { label: 'TheFork', mark: 'TF', hosts: ['thefork.com', 'thefork.es'] },
    michelin: { label: 'MICHELIN Guide', mark: 'MG', hosts: ['guide.michelin.com'] },
    tiktok: { label: 'TikTok', mark: 'TT', hosts: ['tiktok.com'] },
    youtube: { label: 'YouTube', mark: 'YT', hosts: ['youtube.com', 'youtu.be'] }
  });

  const DEFAULTS = Object.freeze({
    enabled: false,
    heading: 'Stay close to the table.',
    eyebrow: 'SOCIAL · REVIEWS · COMMUNITY',
    body: 'Follow the kitchen, read what guests remember, and find us where you already plan your night.',
    preset: 'editorial-footer',
    showRating: true,
    rating: 4.8,
    reviewCount: 486,
    ratingLabel: 'Guest rating',
    reviewCtaLabel: 'Read our reviews',
    reviewCtaUrl: '',
    platforms: [
      { id: 'instagram', enabled: true, url: 'https://www.instagram.com/' },
      { id: 'tripadvisor', enabled: true, url: 'https://www.tripadvisor.com/' },
      { id: 'facebook', enabled: true, url: 'https://www.facebook.com/' },
      { id: 'google', enabled: true, url: 'https://www.google.com/maps/' },
      { id: 'thefork', enabled: false, url: 'https://www.thefork.es/' },
      { id: 'michelin', enabled: false, url: 'https://guide.michelin.com/' },
      { id: 'tiktok', enabled: false, url: 'https://www.tiktok.com/' },
      { id: 'youtube', enabled: false, url: 'https://www.youtube.com/' }
    ]
  });

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const text = (v) => String(v ?? '').trim();
  const PRESETS = new Set(['editorial-footer', 'reputation-strip', 'social-minimal']);

  function isAllowedPlatformUrl(platformId, value) {
    if (!value || !PLATFORM_META[platformId]) return false;
    try {
      const u = new URL(value);
      if (u.protocol !== 'https:') return false;
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      return PLATFORM_META[platformId].hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    } catch { return false; }
  }

  function normalize(input = {}) {
    const base = clone(DEFAULTS);
    const list = Array.isArray(input.platforms) ? input.platforms : base.platforms;
    const byId = new Map(list.map((item) => [item?.id, item]));
    const platforms = Object.keys(PLATFORM_META).map((id) => {
      const seed = base.platforms.find((p) => p.id === id) || { id, enabled: false, url: '' };
      const next = byId.get(id) || seed;
      return { id, enabled: Boolean(next.enabled), url: text(next.url) };
    });
    const out = {
      ...base,
      ...input,
      enabled: Boolean(input.enabled ?? base.enabled),
      heading: text(input.heading) || base.heading,
      eyebrow: text(input.eyebrow) || base.eyebrow,
      body: text(input.body) || base.body,
      preset: PRESETS.has(input.preset) ? input.preset : base.preset,
      showRating: Boolean(input.showRating ?? base.showRating),
      rating: Number.isFinite(Number(input.rating)) ? Math.min(5, Math.max(0, Number(input.rating))) : base.rating,
      reviewCount: Number.isFinite(Number(input.reviewCount)) ? Math.max(0, Math.round(Number(input.reviewCount))) : base.reviewCount,
      ratingLabel: text(input.ratingLabel) || base.ratingLabel,
      reviewCtaLabel: text(input.reviewCtaLabel) || base.reviewCtaLabel,
      reviewCtaUrl: text(input.reviewCtaUrl),
      platforms
    };
    return out;
  }

  function validPlatforms(config) {
    return config.platforms.filter((p) => p.enabled && isAllowedPlatformUrl(p.id, p.url));
  }

  function reviewUrl(config) {
    if (config.reviewCtaUrl) {
      try {
        const u = new URL(config.reviewCtaUrl);
        if (u.protocol === 'https:') return u.href;
      } catch {}
    }
    const preferred = ['google', 'tripadvisor', 'thefork'].map((id) => config.platforms.find((p) => p.id === id)).find((p) => p && p.enabled && isAllowedPlatformUrl(p.id, p.url));
    return preferred?.url || '';
  }

  const Utils = Object.freeze({ PLATFORM_META, DEFAULTS, normalize, validPlatforms, isAllowedPlatformUrl, reviewUrl });
  if (typeof window !== 'undefined') window.SocialReputationModuleUtils = Utils;
  if (typeof document === 'undefined') return;

  const root = document.getElementById('sr-lab');
  const form = document.getElementById('sr-controls');
  const mount = document.getElementById('sr-preview');
  if (!root || !form || !mount) return;

  let config = normalize({ ...clone(DEFAULTS), enabled: true });

  const get = (name) => form.querySelector(`[name="${name}"]`);
  const fields = {
    enabled: get('enabled'), heading: get('heading'), eyebrow: get('eyebrow'), body: get('body'), preset: get('preset'),
    showRating: get('showRating'), rating: get('rating'), reviewCount: get('reviewCount'), reviewCtaLabel: get('reviewCtaLabel')
  };

  function sync() {
    fields.enabled.checked = config.enabled;
    fields.heading.value = config.heading;
    fields.eyebrow.value = config.eyebrow;
    fields.body.value = config.body;
    fields.preset.value = config.preset;
    fields.showRating.checked = config.showRating;
    fields.rating.value = String(config.rating);
    fields.reviewCount.value = String(config.reviewCount);
    fields.reviewCtaLabel.value = config.reviewCtaLabel;
    config.platforms.forEach((p) => {
      const enabled = get(`${p.id}-enabled`); const url = get(`${p.id}-url`);
      if (enabled) enabled.checked = p.enabled;
      if (url) url.value = p.url;
    });
  }

  function read() {
    return normalize({
      enabled: fields.enabled.checked,
      heading: fields.heading.value,
      eyebrow: fields.eyebrow.value,
      body: fields.body.value,
      preset: fields.preset.value,
      showRating: fields.showRating.checked,
      rating: fields.rating.value,
      reviewCount: fields.reviewCount.value,
      reviewCtaLabel: fields.reviewCtaLabel.value,
      platforms: Object.keys(PLATFORM_META).map((id) => ({ id, enabled: Boolean(get(`${id}-enabled`)?.checked), url: get(`${id}-url`)?.value || '' }))
    });
  }

  function node(tag, cls, value) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = value;
    return el;
  }

  function render() {
    mount.replaceChildren();
    root.dataset.enabled = String(config.enabled);
    root.dataset.preset = config.preset;
    if (!config.enabled) {
      const off = node('div', 'sr-off');
      off.innerHTML = '<span>OPTIONAL MODULE · OFF</span><strong>Social & Reputation is not published.</strong><p>No social links, review score or footer extension are rendered.</p>';
      mount.appendChild(off);
      return;
    }

    const section = node('section', `sr-experience sr-${config.preset}`);
    section.dataset.socialReputation = 'true';
    const intro = node('div', 'sr-intro');
    intro.append(node('p', 'sr-eyebrow', config.eyebrow), node('h2', 'sr-title', config.heading), node('p', 'sr-body', config.body));

    const social = node('nav', 'sr-platforms');
    social.setAttribute('aria-label', 'Social and reputation links');
    const items = validPlatforms(config);
    items.forEach((p) => {
      const meta = PLATFORM_META[p.id];
      const a = document.createElement('a');
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'sr-platform';
      a.innerHTML = `<span class="sr-mark" aria-hidden="true">${meta.mark}</span><span>${meta.label}</span><i aria-hidden="true">↗</i>`;
      social.appendChild(a);
    });
    if (!items.length) social.appendChild(node('p', 'sr-empty', 'Activa al menos una plataforma con una URL válida.'));

    const rep = node('aside', 'sr-reputation');
    if (config.showRating) {
      rep.append(node('span', 'sr-rating-label', config.ratingLabel), node('strong', 'sr-rating', config.rating.toFixed(1)), node('span', 'sr-stars', '★★★★★'), node('small', '', `${config.reviewCount.toLocaleString('es-ES')} reviews`));
      const url = reviewUrl(config);
      if (url) {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'sr-review-cta'; a.textContent = `${config.reviewCtaLabel} →`;
        rep.appendChild(a);
      }
    }

    const foot = node('footer', 'sr-footer-line');
    foot.innerHTML = '<span>LÚMINA</span><span>Alicante · Mediterranean dining</span><span>Reservations · Tue—Sat</span>';
    section.append(intro, social, rep, foot);
    mount.appendChild(section);
  }

  form.addEventListener('input', () => { config = read(); render(); });
  form.addEventListener('change', () => { config = read(); render(); });
  document.getElementById('sr-reset')?.addEventListener('click', () => { config = normalize({ ...clone(DEFAULTS), enabled: true }); sync(); render(); });

  window.SocialReputationLab = Object.freeze({ getConfig: () => clone(config), setConfig: (next) => { config = normalize(next); sync(); render(); }, render });
  sync(); render();
})();