(() => {
  'use strict';

  const engine = window.CircularDishRotator;
  if (!engine) return;

  const $ = id => document.getElementById(id);
  const page = $('cdr-page');
  const shell = $('cdr-shell');
  const disc = $('cdr-disc');
  const sectorDisc = $('cdr-sector-disc');
  const brand = $('cdr-brand');
  const brandText = $('cdr-brand-text');
  const brandLogo = $('cdr-brand-logo');
  const personalizeOpen = $('cdr-personalize-open');
  const personalizeClose = $('cdr-personalize-close');
  const customizer = $('cdr-customizer');
  const backdrop = $('cdr-customizer-backdrop');
  const worldType = $('cdr-world-type');
  const worldWord = $('cdr-world-word');
  const worldIndex = $('cdr-world-index');
  const worldSub = $('cdr-world-sub');
  const primaryCta = $('cdr-primary-cta');
  const secondaryCta = $('cdr-secondary-cta');
  const ctaNote = $('cdr-cta-note');
  const toast = $('cdr-toast');
  const orderDialog = $('cdr-order-dialog');
  const reserveDialog = $('cdr-reserve-dialog');
  const orderTitle = $('cdr-order-title');
  const orderSummary = $('cdr-order-summary');
  const orderForm = $('cdr-order-form');
  const reserveForm = $('cdr-reserve-form');

  /* El personalizador NO entra en esta guarda a propósito: dentro del producto no
     existe —la configuración vive en el Studio— y exigirlo aquí apagaba en silencio
     toda la capa premium (mundos cromáticos, CTA, marca) en la puerta productiva. */
  if (!page || !shell || !disc || !sectorDisc || !primaryCta || !secondaryCta) return;

  const SOURCE_WHEEL = '../../assets/pizza-motion/source/full-pizza/PIZZA%20COMPLETA%20DE%208%20TROZOS.png';
  const PROFILE_KEY = 'cdr.project06.phase2.profile.v1';
  const DB_NAME = 'cdr-project06-assets';
  const DB_STORE = 'assets';

  const DEFAULT_PROFILE = Object.freeze({
    restaurantName: 'LÚMINA',
    collectionLabel: 'Signature Pizza Collection',
    usePizzaPalette: true,
    brandAccent: '#ff5a36',
    primaryAction: 'order',
    orderUrl: '',
    reservationUrl: ''
  });

  const PALETTES = [
    {word:'FIRE',accent:'#ff5534',accent2:'#ffb15c',worldA:'#260806',worldB:'#09090b',soft:'rgba(255,85,52,.22)'},
    {word:'FOREST',accent:'#d5a166',accent2:'#7a4f2a',worldA:'#24170d',worldB:'#09090b',soft:'rgba(213,161,102,.20)'},
    {word:'CREAM',accent:'#f1c96b',accent2:'#fff0bd',worldA:'#241d0d',worldB:'#0b0a08',soft:'rgba(241,201,107,.20)'},
    {word:'PISTACHIO',accent:'#a9c875',accent2:'#e9d8a4',worldA:'#14200e',worldB:'#090b08',soft:'rgba(169,200,117,.20)'},
    {word:'GOLD',accent:'#e7b947',accent2:'#f4dd94',worldA:'#271b08',worldB:'#0a0907',soft:'rgba(231,185,71,.21)'},
    {word:'SMOKE',accent:'#d86f43',accent2:'#8f3724',worldA:'#25100b',worldB:'#090909',soft:'rgba(216,111,67,.22)'},
    {word:'GARDEN',accent:'#72c579',accent2:'#c5dc81',worldA:'#0b2010',worldB:'#080a08',soft:'rgba(114,197,121,.20)'},
    {word:'CLASSIC',accent:'#e35d50',accent2:'#4f9a67',worldA:'#25100d',worldB:'#09090b',soft:'rgba(227,93,80,.20)'}
  ];

  /* FASE 1C — ONE PROJECT STATE / ONE STUDIO.
     Dentro del producto, `RestaurantCircularSource` sirve el perfil desde el proyecto
     activo. Con fuente presente este motor NO lee ni escribe su propio localStorage:
     no basta con descartar la escritura si la UI sigue prometiendo guardarla, así que
     tampoco existe la UI. Abierto directamente, el LAB conserva su perfil histórico. */
  const source = window.RestaurantCircularSource || null;
  let profile = loadProfile();
  let lastIndex = -1;
  let toastTimer = 0;
  const objectUrls = new Map();

  function loadProfile() {
    if (source) return source.profile?.(DEFAULT_PROFILE) || {...DEFAULT_PROFILE};
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return {...DEFAULT_PROFILE, ...saved};
    } catch {
      return {...DEFAULT_PROFILE};
    }
  }

  function saveProfile() {
    if (source) return;            // el proyecto es la fuente; aquí no hay nada que guardar
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function products() {
    return engine.getProducts?.() || [];
  }

  function activeIndex() {
    return engine.getActiveIndex?.() ?? Number(shell.dataset.activeIndex || 0);
  }

  function activeProduct() {
    return products()[activeIndex()] || {name:'Pizza',price:'',ingredients:'',descriptor:'',mood:''};
  }

  function paletteFor(index) {
    if (!profile.usePizzaPalette) {
      return {word:'SIGNATURE',accent:profile.brandAccent,accent2:profile.brandAccent,worldA:'#151012',worldB:'#09090b',soft:`color-mix(in srgb,${profile.brandAccent} 20%,transparent)`};
    }
    return PALETTES[index % PALETTES.length];
  }

  function applyBrand() {
    brandText.textContent = profile.restaurantName || DEFAULT_PROFILE.restaurantName;
    const mark = document.querySelector('.cdr-project-mark span');
    if (mark) mark.textContent = (profile.collectionLabel || DEFAULT_PROFILE.collectionLabel).toUpperCase();
    document.documentElement.style.setProperty('--cdr-brand-accent', profile.brandAccent || DEFAULT_PROFILE.brandAccent);
  }

  function applyWorld(index, {animate = true} = {}) {
    const product = products()[index] || activeProduct();
    const palette = paletteFor(index);

    page.style.setProperty('--cdr-accent', palette.accent);
    page.style.setProperty('--cdr-world-a', palette.worldA);
    page.style.setProperty('--cdr-world-b', palette.worldB);
    page.style.setProperty('--cdr-world-soft', palette.soft);
    page.style.setProperty('--cdr-world-accent2', palette.accent2);

    worldWord.textContent = palette.word;
    worldIndex.textContent = String(index + 1).padStart(2, '0');
    worldSub.textContent = String(product.name || '').toUpperCase();

    if (animate) {
      shell.classList.remove('cdr-world-swap');
      void worldType?.offsetWidth;
      shell.classList.add('cdr-world-swap');
      setTimeout(() => shell.classList.remove('cdr-world-swap'), 650);
    }

    updateContextCta(product);
    lastIndex = index;
  }

  function updateContextCta(product = activeProduct()) {
    const name = product.name || 'la porción elegida';
    const orderFirst = profile.primaryAction === 'order';
    /* Estas dos etiquetas se reescriben en CADA cambio de porción, así que el marcado
       inicial del lab no las decide: la fuente canónica del copy es esta función. */
    primaryCta.querySelector('span').textContent = orderFirst ? `Pedir ${name}` : 'Reservar mesa';
    secondaryCta.textContent = orderFirst ? 'Reservar mesa' : `Pedir ${name}`;
    ctaNote.textContent = `${profile.collectionLabel} · ${product.descriptor || 'producto seleccionado'}`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function populatePanel() {
    if (!customizer) return;
    $('cdr-profile-name').value = profile.restaurantName;
    $('cdr-profile-collection').value = profile.collectionLabel;
    $('cdr-profile-palette').checked = profile.usePizzaPalette;
    $('cdr-profile-accent').value = profile.brandAccent;
    $('cdr-profile-primary').value = profile.primaryAction;
    $('cdr-profile-order-url').value = profile.orderUrl;
    $('cdr-profile-reserve-url').value = profile.reservationUrl;
  }

  function openCustomizer() {
    if (!customizer) return;
    populatePanel();
    customizer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    setTimeout(() => $('cdr-profile-name')?.focus(), 120);
  }

  function closeCustomizer() {
    if (!customizer) return;
    customizer.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    personalizeOpen?.focus();
  }

  function readPanel() {
    if (!customizer) return;
    profile = {
      restaurantName: $('cdr-profile-name').value.trim() || DEFAULT_PROFILE.restaurantName,
      collectionLabel: $('cdr-profile-collection').value.trim() || DEFAULT_PROFILE.collectionLabel,
      usePizzaPalette: $('cdr-profile-palette').checked,
      brandAccent: $('cdr-profile-accent').value || DEFAULT_PROFILE.brandAccent,
      primaryAction: $('cdr-profile-primary').value === 'reserve' ? 'reserve' : 'order',
      orderUrl: $('cdr-profile-order-url').value.trim(),
      reservationUrl: $('cdr-profile-reserve-url').value.trim()
    };
  }

  function savePanel() {
    readPanel();
    saveProfile();
    applyBrand();
    applyWorld(activeIndex(), {animate:true});
    showToast('Perfil guardado');
    closeCustomizer();
  }

  function resetProfile() {
    profile = {...DEFAULT_PROFILE};
    localStorage.removeItem(PROFILE_KEY);
    populatePanel();
    applyBrand();
    applyWorld(activeIndex(), {animate:true});
    showToast('Perfil restaurado');
  }

  function integrationUrl(base, type, product) {
    try {
      const url = new URL(base, location.href);
      url.searchParams.set('source', 'circular-dish-rotator');
      url.searchParams.set('product', product.name || 'pizza');
      if (product.price) url.searchParams.set('price', product.price);
      url.searchParams.set('action', type);
      return url.toString();
    } catch {
      return base;
    }
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, {detail}));
  }

  function requestOrder() {
    const product = activeProduct();
    emit('cdr:commerce-intent', {type:'order',product,index:activeIndex()});
    if (profile.orderUrl) {
      window.open(integrationUrl(profile.orderUrl, 'order', product), '_blank', 'noopener');
      return;
    }
    orderTitle.textContent = product.name;
    orderSummary.textContent = `${product.ingredients || ''}${product.price ? ` · ${product.price}` : ''}`;
    orderDialog.showModal();
  }

  function requestReservation() {
    const product = activeProduct();
    emit('cdr:commerce-intent', {type:'reserve',product,index:activeIndex()});
    if (profile.reservationUrl) {
      window.open(integrationUrl(profile.reservationUrl, 'reserve', product), '_blank', 'noopener');
      return;
    }
    reserveDialog.showModal();
  }

  function runPrimary() {
    profile.primaryAction === 'reserve' ? requestReservation() : requestOrder();
  }

  function runSecondary() {
    profile.primaryAction === 'reserve' ? requestOrder() : requestReservation();
  }

  function openAssetDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeAsset(key, blob) {
    const db = await openAssetDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function getAsset(key) {
    const db = await openAssetDb();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  }

  async function deleteAsset(key) {
    const db = await openAssetDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  function objectUrl(key, blob) {
    if (objectUrls.has(key)) URL.revokeObjectURL(objectUrls.get(key));
    const url = URL.createObjectURL(blob);
    objectUrls.set(key, url);
    return url;
  }

  function applyAsset(key, blob) {
    if (!blob) return;
    applyAssetUrl(key, objectUrl(key, blob));
  }

  /* El LAB trae Blobs de su IndexedDB; el producto trae URLs de la Media Library del
     proyecto. La aplicación al DOM es la misma, así que se comparte. */
  function applyAssetUrl(key, url) {
    if (!url) return;
    if (key === 'wheel') {
      disc.src = url;
      sectorDisc.src = url;
    } else if (key === 'logo') {
      brandLogo.src = url;
      brandLogo.hidden = false;
      brandText.hidden = true;
      brand.setAttribute('aria-label', profile.restaurantName);
    } else if (key === 'background') {
      page.style.setProperty('--cdr-restaurant-bg-image', `url("${url}")`);
    }
  }

  async function uploadAsset(key, input) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Sólo se admiten imágenes');
      input.value = '';
      return;
    }
    await storeAsset(key, file);
    applyAsset(key, file);
    showToast(`Asset ${key} cargado`);
  }

  async function restoreAssets() {
    /* Con fuente de proyecto, la media sale de sus refs y este motor NO abre su
       IndexedDB: cero almacén paralelo dentro del producto. Una ref vacía deja el
       asset demo en su sitio, que sigue siendo fallback legítimo. */
    if (source) {
      const refs = source.media?.() || {};
      for (const key of ['logo','wheel','background']) applyAssetUrl(key, refs[key]);
      return;
    }
    for (const key of ['logo','wheel','background']) {
      try {
        const blob = await getAsset(key);
        if (blob) applyAsset(key, blob);
      } catch {
        // IndexedDB may be disabled; the LAB remains fully usable with source assets.
      }
    }
  }

  async function resetAssets() {
    for (const key of ['logo','wheel','background']) {
      try { await deleteAsset(key); } catch {}
      if (objectUrls.has(key)) {
        URL.revokeObjectURL(objectUrls.get(key));
        objectUrls.delete(key);
      }
    }
    disc.src = SOURCE_WHEEL;
    sectorDisc.src = SOURCE_WHEEL;
    brandLogo.hidden = true;
    brandLogo.removeAttribute('src');
    brandText.hidden = false;
    page.style.setProperty('--cdr-restaurant-bg-image', 'none');
    showToast('Assets demo restaurados');
  }

  const observer = new MutationObserver(() => {
    const index = activeIndex();
    if (index !== lastIndex) applyWorld(index, {animate:true});
  });
  observer.observe(shell, {attributes:true, attributeFilter:['data-active-index']});

  personalizeOpen?.addEventListener('click', openCustomizer);
  personalizeClose?.addEventListener('click', closeCustomizer);
  backdrop?.addEventListener('click', closeCustomizer);
  $('cdr-profile-save')?.addEventListener('click', savePanel);
  $('cdr-profile-reset')?.addEventListener('click', resetProfile);
  $('cdr-assets-reset')?.addEventListener('click', resetAssets);
  $('cdr-logo-upload')?.addEventListener('change', event => uploadAsset('logo', event.currentTarget));
  $('cdr-wheel-upload')?.addEventListener('change', event => uploadAsset('wheel', event.currentTarget));
  $('cdr-background-upload')?.addEventListener('change', event => uploadAsset('background', event.currentTarget));
  primaryCta.addEventListener('click', runPrimary);
  secondaryCta.addEventListener('click', runSecondary);

  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));

  orderForm?.addEventListener('submit', event => {
    event.preventDefault();
    const product = activeProduct();
    const detail = {
      product,
      index:activeIndex(),
      quantity:Math.max(1, Number($('cdr-order-qty').value) || 1),
      notes:$('cdr-order-notes').value.trim(),
      source:'project06-circular-dish-rotator'
    };
    emit('cdr:order-request', detail);
    orderDialog.close();
    showToast(`Pedido preparado · ${product.name}`);
  });

  reserveForm?.addEventListener('submit', event => {
    event.preventDefault();
    const product = activeProduct();
    const detail = {
      product,
      index:activeIndex(),
      date:$('cdr-reserve-date').value,
      guests:Math.max(1, Number($('cdr-reserve-guests').value) || 2),
      notes:$('cdr-reserve-notes').value.trim(),
      source:'project06-circular-dish-rotator'
    };
    emit('cdr:reservation-request', detail);
    reserveDialog.close();
    showToast(`Reserva preparada · ${product.name}`);
  });

  addEventListener('keydown', event => {
    if (event.key === 'Escape' && customizer?.getAttribute('aria-hidden') === 'false') closeCustomizer();
  });

  window.CircularDishPremium = Object.freeze({
    getProfile: () => ({...profile}),
    getCurrentProduct: () => ({...activeProduct()}),
    getCurrentPalette: () => ({...paletteFor(activeIndex())}),
    openCustomizer,
    closeCustomizer,
    requestOrder,
    requestReservation,
    resetAssets
  });

  applyBrand();
  populatePanel();
  applyWorld(activeIndex(), {animate:false});
  restoreAssets();
})();
