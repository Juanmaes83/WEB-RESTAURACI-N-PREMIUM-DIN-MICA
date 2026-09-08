/* CLASS 23 — MEMORIES · el DOMINIO. Sin DOM, sin presentación, sin almacén.

   Un solo dominio de datos para las tres presentaciones. El `type` de un recuerdo es
   DATA, no una rama de arquitectura: no hay cinco sistemas, hay un modelo con un campo.

   Vive en `modules.memories`, la ubicación que el roadmap reservaba.

   ORDEN DE CARGA — el detalle que casi obliga a inventar otro sitio:
   `class20-modules-studio.js` ASIGNA `RestaurantDefaults.modules = {…}` (no fusiona), y
   se carga antes de `app-v4.js`, que clona la plantilla en la copia de trabajo. Así que
   este fichero hace dos cosas distintas:

     1. añade `memories` a la PLANTILLA — para proyectos nuevos, import/export y reset;
     2. SIEMBRA la rama en el proyecto VIVO si no existe, escribiendo por referencia.

   Lo segundo es una migración de esquema, no una edición del usuario: no debe entrar en
   el historial de Undo ni marcar el proyecto como sucio. Todas las ediciones reales
   pasan por `RestaurantStudioConfig.set`.
*/
(() => {
  'use strict';

  const clone = x => JSON.parse(JSON.stringify(x));

  const PRESETS = Object.freeze(['cinematic-memory-wall', 'memory-stack', 'editorial-journal']);
  const TYPES = Object.freeze(['memory', 'event', 'testimonial', 'press', 'milestone']);
  const WEIGHTS = Object.freeze(['hero', 'medium', 'small']);
  /* TRATAMIENTO de presentación, elegido por el restaurante y nunca deducido del `type`:
     un hito puede querer papel y una apertura puede querer tela. Cambiar el tratamiento
     conserva el ítem, sus datos y su media. */
  const ARTIFACTS = Object.freeze(['none', 'paper', 'cloth']);
  const KINDS = Object.freeze(['image', 'video']);

  /* El proyecto base NO afirma recuerdos que no existen: apagado y vacío.
     Los fixtures viven en los tests, no aquí. */
  const DEFAULTS = Object.freeze({
    enabled: false,
    preset: 'cinematic-memory-wall',
    eyebrow: 'Memoria',
    title: 'Lo que ha pasado en esta casa',
    intro: '',
    items: []
  });

  /* Un recuerdo recién creado está VACÍO y activo. Un título por defecto sería una
     afirmación sobre el restaurante; el placeholder del editor es el sitio de la ayuda. */
  const item = (patch = {}) => ({
    id: patch.id || `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: patch.enabled !== false,
    type: TYPES.includes(patch.type) ? patch.type : 'memory',
    title: patch.title || '',
    text: patch.text || '',
    author: patch.author || '',
    date: patch.date || '',
    place: patch.place || '',
    rating: Number.isFinite(patch.rating) ? patch.rating : null,
    link: patch.link || '',
    featured: patch.featured === true,
    visualWeight: WEIGHTS.includes(patch.visualWeight) ? patch.visualWeight : 'medium',
    artifactStyle: ARTIFACTS.includes(patch.artifactStyle) ? patch.artifactStyle : 'none',
    media: Array.isArray(patch.media) ? patch.media.map(mediaRef).filter(Boolean) : []
  });

  /* Una referencia LÓGICA y estable. Nunca un blob:, nunca un object URL, nunca un
     File: el Project State tiene que poder viajar y sobrevivir a un reload, y más
     adelante a un proveedor remoto. `ref` es la clave del asset en la Media Library
     compartida — la resuelve `RestaurantMedia`, no el dominio. */
  const mediaRef = m => {
    if (!m || !m.ref) return null;
    return {
      id: m.id || String(m.ref).split('/').pop(),
      kind: KINDS.includes(m.kind) ? m.kind : 'image',
      ref: String(m.ref),
      alt: m.alt || ''
    };
  };

  /* La ref se compone del dominio, no del almacén: si mañana el proveedor es remoto,
     la misma cadena sigue identificando el asset. */
  const refFor = (itemId, mediaId) => `project/memories/${itemId}/${mediaId}`;

  /* El ORDEN de `media[]` también es dato: `media[0]` es la portada. Mover una media a la
     posición 0 ES "usar como portada", así que no hace falta un `primaryMediaId` que
     pueda discrepar del array. Devuelve un array nuevo para que el llamante lo escriba
     por `set` y quede UNA entrada de historial. */
  function moveMedia(media, ref, delta) {
    const next = (media || []).map(m => ({...m}));
    const from = next.findIndex(m => m.ref === ref);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= next.length) return next;
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  }
  function makeCover(media, ref) {
    const next = (media || []).map(m => ({...m}));
    const from = next.findIndex(m => m.ref === ref);
    if (from <= 0) return next;
    const [picked] = next.splice(from, 1);
    next.unshift(picked);
    return next;
  }
  const newMediaId = kind => `${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  /* Normaliza sin inventar: un campo ausente queda vacío, y un campo vacío no se
     rellena con texto de relleno. Sólo se corrigen valores fuera de dominio. */
  function normalize(value) {
    const v = value && typeof value === 'object' ? value : {};
    return {
      ...clone(DEFAULTS),
      ...v,
      enabled: v.enabled === true,
      preset: PRESETS.includes(v.preset) ? v.preset : DEFAULTS.preset,
      eyebrow: typeof v.eyebrow === 'string' ? v.eyebrow : DEFAULTS.eyebrow,
      title: typeof v.title === 'string' ? v.title : DEFAULTS.title,
      intro: typeof v.intro === 'string' ? v.intro : '',
      items: Array.isArray(v.items) ? v.items.map(item) : []
    };
  }

  /* Lo que el motor pinta: activos, en el orden del array — el orden ES data. */
  const visible = memories => (memories?.items || []).filter(i => i && i.enabled !== false);

  /* ---------- plantilla ---------- */
  const defaults = window.RestaurantDefaults;
  if (defaults) {
    defaults.modules = defaults.modules || {};
    if (!defaults.modules.memories) defaults.modules.memories = clone(DEFAULTS);
  }

  /* ---------- siembra en el proyecto vivo ----------
     Por referencia y a propósito: `RestaurantStudioConfig.get` devuelve el objeto vivo,
     así que añadir la rama que falta no crea entrada de Undo ni marca el proyecto como
     modificado. Es exactamente lo que debe hacer una migración de esquema. */
  function seed() {
    const cfg = window.RestaurantStudioConfig;
    if (!cfg?.get) return false;
    const modules = cfg.get('modules');
    if (!modules || typeof modules !== 'object') return false;
    if (!modules.memories) {
      modules.memories = clone(DEFAULTS);
      return true;
    }
    /* un proyecto guardado antes de esta fase puede traer la rama a medias */
    const before = JSON.stringify(modules.memories);
    const after = normalize(modules.memories);
    if (JSON.stringify(after) !== before) Object.assign(modules.memories, after);
    return false;
  }

  window.RestaurantMemoriesModel = Object.freeze({
    PRESETS, TYPES, WEIGHTS, KINDS, ARTIFACTS, DEFAULTS,
    item, mediaRef, refFor, newMediaId, normalize, visible, seed, clone,
    moveMedia, makeCover
  });
})();
