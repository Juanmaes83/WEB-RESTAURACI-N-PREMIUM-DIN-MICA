/* MEDIA LIBRARY compartida — adaptador canónico, NO un almacén.

   El almacén sigue siendo uno solo: `RestaurantStore` (IndexedDB
   `restaurant-premium-studio` v3, con fallback a Cache Storage). Aquí no se guarda
   nada; esto es la capa de RESOLUCIÓN que `app-v4.js` ya tenía en privado:

       function replaceObjectUrl(key,blob){…}   // caché de object URLs
       function resolveMedia(slot,…){…}         // interna, y sobre una lista fija de slots

   Memories necesita resolver referencias arbitrarias, no cinco slots conocidos, así que
   esa capacidad se expone en un sitio compartido en vez de duplicarse. Beverages (Fase 3)
   usará esto mismo sin tocarlo, y es el único punto donde Cloud Media tendrá que
   sustituir al proveedor: el dominio guarda `ref`, nunca una URL.

   Contrato:
     save(ref, file)  → guarda el Blob bajo esa ref y devuelve el registro
     load(ref)        → el registro, o null
     url(ref)         → object URL cacheado (crea uno si hace falta)
     list()           → todo lo que hay en la Media Library, con su kind
     revoke(ref)      → suelta el object URL (el asset NO se borra)
     forget(ref)      → borra el asset del almacén (uso explícito, nunca automático)

   Por qué `forget` no se llama al eliminar un recuerdo: Undo tiene que poder devolver
   el ítem CON su referencia. Desvincular es del dominio; limpiar huérfanos es otra
   responsabilidad, de otra fase.
*/
(() => {
  'use strict';

  const urls = new Map();
  const store = () => window.RestaurantStore;

  const kindOf = rec =>
    rec?.kind || ((rec?.type || '').startsWith('video/') ? 'video' : 'image');

  async function save(ref, file) {
    if (!ref) throw new Error('media ref required');
    if (!(file instanceof Blob)) throw new Error('media must be a Blob/File');
    const rec = await store().saveMedia(ref, file, {});
    /* si la ref ya tenía una URL viva, se reemplaza: el consumidor pedirá url() otra vez */
    revoke(ref);
    return rec;
  }

  async function load(ref) {
    if (!ref) return null;
    try { return await store().loadMedia(ref); } catch { return null; }
  }

  async function url(ref) {
    if (!ref) return '';
    if (urls.has(ref)) return urls.get(ref);
    const rec = await load(ref);
    if (!rec?.file) return '';
    const objectUrl = URL.createObjectURL(rec.file);
    urls.set(ref, objectUrl);
    return objectUrl;
  }

  /* Lo que el picker enseña. Se anota el kind para poder separar imagen y vídeo sin
     volver a abrir cada Blob. */
  async function list() {
    let records = [];
    try { records = await store().listMedia() || []; } catch { records = []; }
    return records.map(rec => ({
      ref: rec.slot,
      kind: kindOf(rec),
      name: rec.name || rec.slot,
      type: rec.type || '',
      size: rec.size || 0,
      updatedAt: rec.updatedAt || ''
    }));
  }

  function revoke(ref) {
    if (!urls.has(ref)) return;
    try { URL.revokeObjectURL(urls.get(ref)); } catch {}
    urls.delete(ref);
  }

  function revokeAll() { for (const ref of [...urls.keys()]) revoke(ref); }

  /* Borrado real del asset. Explícito y nunca implícito: eliminar un recuerdo desvincula
     la referencia, no destruye el archivo. */
  async function forget(ref) {
    revoke(ref);
    try { await store().deleteMedia(ref); } catch {}
  }

  window.RestaurantMedia = Object.freeze({save, load, url, list, revoke, revokeAll, forget, kindOf});

  /* `class22-experience-shell.js` ya llamaba a `window.RestaurantMediaResolve(slot)` con
     `?.` — no existía y caía siempre al fallback. Ahora existe, y sigue siendo síncrono
     para no cambiar ese contrato: devuelve la URL sólo si ya está cacheada. */
  if (!window.RestaurantMediaResolve) {
    window.RestaurantMediaResolve = ref => urls.get(ref) || '';
  }
})();
