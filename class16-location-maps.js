/* CLASS 16 — OPTIONAL LOCATION / GOOGLE MAPS MODULE
   Isolated LAB. No shared Studio/runtime mutation. */
(() => {
  'use strict';

  const DEFAULTS = Object.freeze({
    enabled: false,
    title: 'Find us',
    eyebrow: 'Torrevieja · Spain',
    address: {
      street: 'Paseo Vistalegre 12',
      postalCode: '03181',
      city: 'Torrevieja',
      region: 'Alicante',
      country: 'España'
    },
    phone: '+34 965 000 000',
    hours: 'Tue — Sun · 13:00 — 00:00',
    maps: {
      mode: 'address',
      googleMapsUrl: '',
      embedUrl: '',
      latitude: null,
      longitude: null,
      privacyMode: 'click'
    },
    cta: { label: 'Cómo llegar' },
    design: { preset: 'split-editorial' }
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const safeText = (value) => String(value ?? '').trim();
  const allowedPresets = new Set(['split-editorial', 'full-width', 'minimal']);
  const allowedModes = new Set(['address', 'url', 'embed']);
  const allowedPrivacy = new Set(['click', 'auto']);

  function normalizeConfig(input = {}) {
    const base = clone(DEFAULTS);
    const out = {
      ...base,
      ...input,
      address: { ...base.address, ...(input.address || {}) },
      maps: { ...base.maps, ...(input.maps || {}) },
      cta: { ...base.cta, ...(input.cta || {}) },
      design: { ...base.design, ...(input.design || {}) }
    };
    out.enabled = Boolean(out.enabled);
    out.title = safeText(out.title) || base.title;
    out.eyebrow = safeText(out.eyebrow);
    Object.keys(out.address).forEach((key) => { out.address[key] = safeText(out.address[key]); });
    out.phone = safeText(out.phone);
    out.hours = safeText(out.hours);
    out.maps.mode = allowedModes.has(out.maps.mode) ? out.maps.mode : 'address';
    out.maps.privacyMode = allowedPrivacy.has(out.maps.privacyMode) ? out.maps.privacyMode : 'click';
    out.design.preset = allowedPresets.has(out.design.preset) ? out.design.preset : 'split-editorial';
    out.cta.label = safeText(out.cta.label) || base.cta.label;
    return out;
  }

  function fullAddress(config) {
    const a = config.address || {};
    return [a.street, a.postalCode, a.city, a.region, a.country].map(safeText).filter(Boolean).join(', ');
  }

  function isAllowedGoogleMapUrl(value, { embedOnly = false } = {}) {
    if (!value) return false;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return false;
      const host = url.hostname.toLowerCase();
      const hostOK = host === 'google.com' || host.endsWith('.google.com') || host === 'goo.gl' || host.endsWith('.goo.gl');
      if (!hostOK) return false;
      if (embedOnly) return host.includes('google.') && (url.pathname.includes('/maps/embed') || url.searchParams.get('output') === 'embed');
      return host === 'maps.google.com' || url.pathname.includes('/maps') || host.endsWith('goo.gl');
    } catch {
      return false;
    }
  }

  function buildDirectionsUrl(config) {
    const custom = safeText(config.maps?.googleMapsUrl);
    if (config.maps?.mode === 'url' && isAllowedGoogleMapUrl(custom)) return custom;
    const rawLat = config.maps?.latitude;
    const rawLng = config.maps?.longitude;
    const hasCoordinates = rawLat !== null && rawLat !== '' && rawLng !== null && rawLng !== '' && Number.isFinite(Number(rawLat)) && Number.isFinite(Number(rawLng));
    const query = hasCoordinates ? `${Number(rawLat)},${Number(rawLng)}` : fullAddress(config);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function deriveEmbedUrl(config) {
    const custom = safeText(config.maps?.embedUrl);
    if (config.maps?.mode === 'embed' && isAllowedGoogleMapUrl(custom, { embedOnly: true })) return custom;
    const query = fullAddress(config);
    return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
  }

  const Utils = Object.freeze({ DEFAULTS, normalizeConfig, fullAddress, isAllowedGoogleMapUrl, buildDirectionsUrl, deriveEmbedUrl });
  if (typeof window !== 'undefined') window.LocationMapsModuleUtils = Utils;
  if (typeof document === 'undefined') return;

  const root = document.getElementById('lm-lab');
  const mount = document.getElementById('lm-preview-mount');
  const form = document.getElementById('lm-controls');
  if (!root || !mount || !form) return;

  // The production contract defaults OFF. The isolated LAB deliberately starts ON
  // so the reviewer lands directly on the visual proof.
  let config = normalizeConfig({ ...clone(DEFAULTS), enabled: true });
  let mapLoaded = false;

  const fields = {
    enabled: form.querySelector('[name="enabled"]'),
    title: form.querySelector('[name="title"]'),
    eyebrow: form.querySelector('[name="eyebrow"]'),
    street: form.querySelector('[name="street"]'),
    postalCode: form.querySelector('[name="postalCode"]'),
    city: form.querySelector('[name="city"]'),
    region: form.querySelector('[name="region"]'),
    country: form.querySelector('[name="country"]'),
    phone: form.querySelector('[name="phone"]'),
    hours: form.querySelector('[name="hours"]'),
    mode: form.querySelector('[name="mode"]'),
    googleMapsUrl: form.querySelector('[name="googleMapsUrl"]'),
    embedUrl: form.querySelector('[name="embedUrl"]'),
    privacyMode: form.querySelector('[name="privacyMode"]'),
    preset: form.querySelector('[name="preset"]'),
    ctaLabel: form.querySelector('[name="ctaLabel"]')
  };

  function syncFields() {
    fields.enabled.checked = config.enabled;
    fields.title.value = config.title;
    fields.eyebrow.value = config.eyebrow;
    fields.street.value = config.address.street;
    fields.postalCode.value = config.address.postalCode;
    fields.city.value = config.address.city;
    fields.region.value = config.address.region;
    fields.country.value = config.address.country;
    fields.phone.value = config.phone;
    fields.hours.value = config.hours;
    fields.mode.value = config.maps.mode;
    fields.googleMapsUrl.value = config.maps.googleMapsUrl;
    fields.embedUrl.value = config.maps.embedUrl;
    fields.privacyMode.value = config.maps.privacyMode;
    fields.preset.value = config.design.preset;
    fields.ctaLabel.value = config.cta.label;
  }

  function readConfigFromFields() {
    return normalizeConfig({
      enabled: fields.enabled.checked,
      title: fields.title.value,
      eyebrow: fields.eyebrow.value,
      address: {
        street: fields.street.value,
        postalCode: fields.postalCode.value,
        city: fields.city.value,
        region: fields.region.value,
        country: fields.country.value
      },
      phone: fields.phone.value,
      hours: fields.hours.value,
      maps: {
        mode: fields.mode.value,
        googleMapsUrl: fields.googleMapsUrl.value,
        embedUrl: fields.embedUrl.value,
        privacyMode: fields.privacyMode.value
      },
      cta: { label: fields.ctaLabel.value },
      design: { preset: fields.preset.value }
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildMapShell(section) {
    const shell = el('div', 'lm-map-shell');
    shell.setAttribute('data-map-state', mapLoaded ? 'loaded' : 'placeholder');
    const decor = el('div', 'lm-map-decor');
    decor.setAttribute('aria-hidden', 'true');
    decor.innerHTML = '<span class="lm-map-line lm-map-line-a"></span><span class="lm-map-line lm-map-line-b"></span><span class="lm-map-line lm-map-line-c"></span><span class="lm-map-dot"></span>';
    shell.appendChild(decor);

    const mapUrl = deriveEmbedUrl(config);
    if (config.maps.privacyMode === 'auto') mapLoaded = true;

    if (mapLoaded && mapUrl) {
      const frame = document.createElement('iframe');
      frame.className = 'lm-map-frame';
      frame.title = `Mapa de ${config.address.city || 'la ubicación'}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.src = mapUrl;
      frame.setAttribute('allowfullscreen', '');
      frame.addEventListener('error', () => {
        mapLoaded = false;
        render();
      });
      shell.appendChild(frame);
    } else {
      const placeholder = el('div', 'lm-map-placeholder');
      placeholder.append(
        el('span', 'lm-map-city', (config.address.city || 'LOCATION').toUpperCase()),
        el('strong', '', 'Your table is closer than it feels.'),
        el('p', '', config.maps.privacyMode === 'click' ? 'El mapa de Google sólo se carga cuando tú lo decides.' : 'Mapa disponible cuando la ubicación está completa.')
      );
      if (mapUrl) {
        const load = el('button', 'lm-load-map', 'Mostrar Google Maps');
        load.type = 'button';
        load.addEventListener('click', () => {
          mapLoaded = true;
          render();
        });
        placeholder.appendChild(load);
      }
      shell.appendChild(placeholder);
    }

    section.appendChild(shell);
  }

  function render() {
    mount.replaceChildren();
    root.dataset.enabled = String(config.enabled);
    root.dataset.preset = config.design.preset;
    root.dataset.privacy = config.maps.privacyMode;

    if (!config.enabled) {
      const off = el('div', 'lm-off-state');
      off.innerHTML = '<span>OPTIONAL MODULE · OFF</span><strong>Location is not part of the public experience.</strong><p>No map iframe, no Google request, no reserved section.</p>';
      mount.appendChild(off);
      return;
    }

    const section = el('section', `lm-location lm-preset-${config.design.preset}`);
    section.id = 'location';
    section.dataset.locationModule = 'true';

    const copy = el('div', 'lm-copy');
    const eyebrow = el('p', 'lm-eyebrow', config.eyebrow || [config.address.city, config.address.country].filter(Boolean).join(' · '));
    const title = el('h2', 'lm-title', config.title);
    const statement = el('p', 'lm-statement', config.design.preset === 'minimal' ? 'Come by.' : 'Come for dinner. Stay for the night.');
    const address = el('address', 'lm-address');
    address.textContent = fullAddress(config) || 'Añade una dirección en el configurador';

    const meta = el('div', 'lm-meta');
    if (config.hours) meta.appendChild(el('span', '', config.hours));
    if (config.phone) {
      const phone = document.createElement('a');
      phone.href = `tel:${config.phone.replace(/[^+\d]/g, '')}`;
      phone.textContent = config.phone;
      meta.appendChild(phone);
    }

    const directions = document.createElement('a');
    directions.className = 'lm-directions';
    directions.href = buildDirectionsUrl(config);
    directions.target = '_blank';
    directions.rel = 'noopener noreferrer';
    directions.innerHTML = `<span>${config.cta.label}</span><i aria-hidden="true">↗</i>`;

    copy.append(eyebrow, title, statement, address, meta, directions);
    section.appendChild(copy);
    buildMapShell(section);
    mount.appendChild(section);
  }

  form.addEventListener('input', () => {
    const previousPrivacy = config.maps.privacyMode;
    const previousMode = config.maps.mode;
    const previousAddress = fullAddress(config);
    config = readConfigFromFields();
    if (previousPrivacy !== config.maps.privacyMode || previousMode !== config.maps.mode || previousAddress !== fullAddress(config)) mapLoaded = false;
    render();
  });

  form.addEventListener('change', () => {
    config = readConfigFromFields();
    mapLoaded = false;
    render();
  });

  document.getElementById('lm-reset')?.addEventListener('click', () => {
    config = normalizeConfig({ ...clone(DEFAULTS), enabled: true });
    mapLoaded = false;
    syncFields();
    render();
  });

  document.getElementById('lm-open-directions')?.addEventListener('click', () => {
    window.open(buildDirectionsUrl(config), '_blank', 'noopener,noreferrer');
  });

  window.LocationMapsLab = Object.freeze({
    getConfig: () => clone(config),
    setConfig: (next) => {
      config = normalizeConfig(next);
      mapLoaded = false;
      syncFields();
      render();
    },
    render,
    buildDirectionsUrl: () => buildDirectionsUrl(config),
    deriveEmbedUrl: () => deriveEmbedUrl(config)
  });

  syncFields();
  render();
})();