/* MEDIA PICKER compartido — no es de Memories.

   Auditado antes de escribirlo: en el producto **no existía** ningún selector de Media
   Library reutilizable. El Studio sube media por slots fijos (`hero`, `origin`,
   `atmosphere`, `chef`, y la imagen de cada plato) con un `<input type=file>` por
   destino; no hay forma de ELEGIR un asset ya subido. Memories la necesita, y Beverages
   la necesitará en Fase 3, así que la abstracción es compartida desde el primer día —
   por eso se llama `RestaurantMediaPicker` y no `MemoriesMediaPicker`.

   No guarda nada. Lista lo que hay en la Media Library compartida
   (`RestaurantMedia` → `RestaurantStore`) y devuelve una REFERENCIA lógica.

   Uso:
       const chosen = await RestaurantMediaPicker.open({kind:'image'});   // o 'video', o nada
       // chosen === {ref, kind, name} | null   (null = cancelado)
*/
(() => {
  'use strict';

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  let layer = null, resolveOpen = null, lastFocus = null;

  function close(result) {
    if (!layer) return;
    layer.remove();
    layer = null;
    document.removeEventListener('keydown', onKey, true);
    const done = resolveOpen; resolveOpen = null;
    const focus = lastFocus; lastFocus = null;
    /* el foco vuelve después de que el DOM se asiente, como hace la shell de experiencias */
    if (focus?.isConnected) requestAnimationFrame(() => focus.focus());
    done?.(result || null);
  }

  /* Captura y `stopImmediatePropagation`: el Studio registra su propio Escape en
     captura sobre `document` (`class4-store.js`), y sin esto cerrar el picker cerraría
     también el cajón. Misma lección que Class 22. */
  function onKey(event) {
    if (event.key !== 'Escape' || !layer) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    close(null);
  }

  async function open({kind = '', title = 'Media Library'} = {}) {
    close(null);
    lastFocus = document.activeElement;
    const items = (await window.RestaurantMedia.list())
      .filter(m => !kind || m.kind === kind);

    layer = el('div', 'rmp-layer');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', title);
    layer.dataset.mediaPicker = 'open';

    const sheet = el('div', 'rmp-sheet');
    const head = el('div', 'rmp-head');
    head.append(el('strong', '', title));
    const count = el('span', 'rmp-count',
      `${items.length} ${items.length === 1 ? 'archivo' : 'archivos'}${kind ? ` · ${kind === 'video' ? 'vídeo' : 'imagen'}` : ''}`);
    head.append(count);
    const cancel = el('button', 'rmp-cancel', 'Cancelar');
    cancel.type = 'button';
    cancel.dataset.mediaPickerCancel = '1';
    cancel.addEventListener('click', () => close(null));
    head.append(cancel);
    sheet.append(head);

    if (!items.length) {
      /* sin inventar nada: si la biblioteca está vacía se dice, y se sube desde el panel */
      const empty = el('p', 'rmp-empty',
        'La Media Library todavía no tiene archivos de este tipo. Súbelos desde el panel y quedarán disponibles para cualquier sección.');
      empty.dataset.mediaPickerEmpty = '1';
      sheet.append(empty);
    } else {
      const grid = el('div', 'rmp-grid');
      for (const m of items) {
        const card = el('button', 'rmp-card');
        card.type = 'button';
        card.dataset.mediaPickerRef = m.ref;
        card.dataset.kind = m.kind;
        const thumb = el('div', 'rmp-thumb');
        const url = await window.RestaurantMedia.url(m.ref);
        if (m.kind === 'video') {
          const v = document.createElement('video');
          v.src = url; v.muted = true; v.playsInline = true; v.preload = 'metadata';
          thumb.append(v);
        } else {
          const i = document.createElement('img');
          i.src = url; i.alt = '';
          thumb.append(i);
        }
        card.append(thumb);
        card.append(el('span', 'rmp-name', m.name));
        card.append(el('span', 'rmp-kind', m.kind === 'video' ? 'VÍDEO' : 'IMAGEN'));
        card.addEventListener('click', () => close({ref: m.ref, kind: m.kind, name: m.name}));
        grid.append(card);
      }
      sheet.append(grid);
    }

    layer.append(sheet);
    layer.addEventListener('click', e => { if (e.target === layer) close(null); });
    document.body.append(layer);
    document.addEventListener('keydown', onKey, true);
    (layer.querySelector('.rmp-card') || cancel).focus();

    return new Promise(resolve => { resolveOpen = resolve; });
  }

  window.RestaurantMediaPicker = Object.freeze({open, close: () => close(null),
    isOpen: () => !!layer});
})();
