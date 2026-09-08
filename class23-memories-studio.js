/* CLASS 23 — MEMORIES STUDIO. El MISMO Restaurant Studio, un panel más.

   No hay segundo Studio, ni popup externo, ni LAB, ni editor en iframe: se añade una
   pestaña al cajón existente, exactamente como hizo Class 20 con Módulos.

   Dos reglas de la casa que este panel respeta al pie de la letra:

   1. El Studio enlaza los `[data-path]` UNA vez al arrancar, así que un panel creado
      después tiene que escribir él mismo por `RestaurantStudioConfig.set` — que es el
      camino `mutate → applyAll → persist` de siempre. Cero persistencia propia, cero
      historia propia: Undo/Redo salen gratis porque no se inventa nada.
   2. El panel se construye PEREZOSAMENTE, en el primer click. Class 19 provocó una
      carrera de restauración de preset por construirse con el cajón cerrado.

   La media se sube a la Media Library COMPARTIDA (`RestaurantMedia` → `RestaurantStore`)
   y en el Project State queda una REFERENCIA lógica, nunca un `blob:` ni un File.

   Al eliminar un recuerdo la referencia se DESVINCULA; el asset no se borra. Undo tiene
   que poder devolver el recuerdo con su media puesta.
*/
(() => {
  'use strict';

  const M = () => window.RestaurantMemoriesModel;
  const media = () => window.RestaurantMedia;
  const picker = () => window.RestaurantMediaPicker;
  const engine = () => window.RestaurantMemoriesEngine;
  const cfg = () => window.RestaurantStudioConfig;

  const PATH = 'modules.memories';
  const get = p => cfg()?.get(p);
  const set = (p, v) => cfg()?.set(p, v);
  const state = () => M().normalize(get(PATH));

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  let panel = null, built = false, openItem = null;

  const TYPE_LABELS = [
    ['memory', 'Recuerdo'], ['event', 'Evento'], ['testimonial', 'Testimonio'],
    ['press', 'Prensa'], ['milestone', 'Hito']
  ];
  const WEIGHT_LABELS = [['hero', 'Grande (hero)'], ['medium', 'Media'], ['small', 'Pequeña']];
  const PRESET_LABELS = [
    ['cinematic-memory-wall', 'Cinematic Memory Wall'],
    ['memory-stack', 'Memory Stack'],
    ['editorial-journal', 'Editorial Journal']
  ];

  /* ---------- controles ----------
     Escriben en el Project State en el mismo evento que los nativos (`input`), para que
     el preview sea inmediato y el comportamiento del cajón sea uno solo. */
  function field(label, path, {type = 'text', options = null, value = ''} = {}) {
    const wrap = el('label', 'mem-field');
    wrap.append(el('span', '', label));
    let input;
    if (options) {
      input = el('select');
      for (const [v, text] of options) {
        const opt = el('option', '', text);
        opt.value = v;
        input.append(opt);
      }
    } else if (type === 'textarea') {
      input = el('textarea');
      input.rows = 4;
    } else {
      input = el('input');
      input.type = type;
    }
    input.dataset.memPath = path;
    if (type === 'checkbox') input.checked = !!value; else input.value = value ?? '';
    input.addEventListener(options || type === 'checkbox' || type === 'date' ? 'change' : 'input',
      () => {
        let v = type === 'checkbox' ? input.checked : input.value;
        if (type === 'number') {
          const n = Number(v);
          v = v === '' || !Number.isFinite(n) ? null : n;   /* vacío = sin valor, no 0 */
        }
        set(path, v);
      });
    if (type === 'checkbox') { wrap.classList.add('mem-check'); wrap.prepend(input); }
    else wrap.append(input);
    return wrap;
  }

  /* ---------- operaciones sobre el array (el ORDEN es data) ----------
     Se escribe el array completo: una entrada de historial por operación, que es lo que
     hace que Undo devuelva el recuerdo entero, con sus referencias. */
  const itemsNow = () => M().clone(state().items);

  function addItem() {
    const next = itemsNow();
    const item = M().item();
    next.push(item);
    set(`${PATH}.items`, next);
    openItem = item.id;
    render();
    /* el foco entra en el primer campo del recuerdo nuevo */
    panel.querySelector(`[data-mem-card="${item.id}"] input`)?.focus();
  }

  function removeItem(id) {
    /* la referencia de media se DESVINCULA, no se destruye: Undo debe poder recuperarla */
    set(`${PATH}.items`, itemsNow().filter(i => i.id !== id));
    if (openItem === id) openItem = null;
    render();
  }

  function moveItem(id, delta) {
    const next = itemsNow();
    const from = next.findIndex(i => i.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    panel.querySelector(`[data-mem-card="${id}"] [data-mem-${delta < 0 ? 'up' : 'down'}]`)?.focus();
  }

  /* ---------- media ---------- */
  async function attach(id, kind, file) {
    if (!file) return;
    const expected = kind === 'video' ? 'video/' : 'image/';
    if (!file.type.startsWith(expected)) {
      status(`El archivo no es ${kind === 'video' ? 'un vídeo' : 'una imagen'}.`);
      return;
    }
    const mediaId = M().newMediaId(kind);
    const ref = M().refFor(id, mediaId);
    try {
      await media().save(ref, file);                 /* Media Library COMPARTIDA */
    } catch (err) {
      console.error(err);
      status('No se pudo guardar el archivo en la Media Library.');
      return;
    }
    link(id, {id: mediaId, kind, ref, alt: ''});
  }

  async function chooseExisting(id, kind) {
    const title = kind === 'video' ? 'Vídeos del proyecto'
      : kind === 'image' ? 'Imágenes del proyecto'
      : 'Media del proyecto';
    const chosen = await picker().open({kind, title});
    if (!chosen) return;
    link(id, {id: chosen.ref.split('/').pop(), kind: chosen.kind, ref: chosen.ref, alt: ''});
  }

  /* En el Project State entra la REFERENCIA, nunca la URL: es lo que permite que el
     proyecto viaje y que Cloud Media sustituya al proveedor sin migrar Memories. */
  function link(id, mediaRef) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    if (!item) return;
    item.media = [...(item.media || []), mediaRef];
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    engine()?.refresh?.();
  }

  function unlink(id, ref) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    if (!item) return;
    item.media = (item.media || []).filter(m => m.ref !== ref);
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    engine()?.refresh?.();
  }

  function setAlt(id, ref, alt) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    const m = item?.media?.find(x => x.ref === ref);
    if (!m) return;
    m.alt = alt;
    set(`${PATH}.items`, next);
  }

  function status(message) {
    const node = panel?.querySelector('[data-mem-status]');
    if (node) node.textContent = message || '';
  }

  /* ---------- render del panel ---------- */
  function itemCard(item, index, total) {
    const card = el('details', 'mem-card-edit');
    card.dataset.memCard = item.id;
    if (openItem === item.id) card.open = true;
    card.addEventListener('toggle', () => { if (card.open) openItem = item.id; });

    const summary = el('summary');
    summary.append(el('strong', '', item.title || 'Recuerdo sin título'));
    const badge = el('span', 'mem-badge', `${String(index + 1).padStart(2, '0')} · ${item.enabled === false ? 'OCULTO' : 'VISIBLE'}${item.featured ? ' · DESTACADO' : ''}`);
    summary.append(badge);
    card.append(summary);

    const base = `${PATH}.items.${index}`;
    const body = el('div', 'mem-card-body');

    /* orden accesible: el arrastre puede llegar después, pero nunca ser la única vía */
    const ops = el('div', 'mem-ops');
    const up = el('button', 'mem-op', '↑ Subir');
    up.type = 'button'; up.dataset.memUp = item.id; up.disabled = index === 0;
    up.setAttribute('aria-label', `Subir ${item.title || 'este recuerdo'}`);
    up.addEventListener('click', () => moveItem(item.id, -1));
    const down = el('button', 'mem-op', '↓ Bajar');
    down.type = 'button'; down.dataset.memDown = item.id; down.disabled = index === total - 1;
    down.setAttribute('aria-label', `Bajar ${item.title || 'este recuerdo'}`);
    down.addEventListener('click', () => moveItem(item.id, 1));
    const del = el('button', 'mem-op mem-op-danger', 'Eliminar');
    del.type = 'button'; del.dataset.memDelete = item.id;
    del.addEventListener('click', () => removeItem(item.id));
    ops.append(up, down, del);
    body.append(ops);

    body.append(field('Visible en la web', `${base}.enabled`, {type: 'checkbox', value: item.enabled !== false}));
    body.append(field('Destacado', `${base}.featured`, {type: 'checkbox', value: item.featured === true}));
    body.append(field('Peso visual', `${base}.visualWeight`, {options: WEIGHT_LABELS, value: item.visualWeight}));
    body.append(field('Tipo', `${base}.type`, {options: TYPE_LABELS, value: item.type}));
    body.append(field('Título', `${base}.title`, {value: item.title}));
    body.append(field('Historia', `${base}.text`, {type: 'textarea', value: item.text}));
    body.append(field('Autor / quién lo cuenta', `${base}.author`, {value: item.author}));
    body.append(field('Fecha', `${base}.date`, {value: item.date}));
    body.append(field('Lugar', `${base}.place`, {value: item.place}));
    body.append(field('Valoración (0–5)', `${base}.rating`, {type: 'number', value: item.rating ?? ''}));
    body.append(field('Enlace (https)', `${base}.link`, {type: 'url', value: item.link}));

    /* media */
    const mediaBox = el('div', 'mem-media-box');
    mediaBox.append(el('span', 'mem-sub', 'Media'));
    for (const m of item.media || []) {
      const row = el('div', 'mem-media-row');
      row.dataset.memMediaRef = m.ref;
      /* Una MINIATURA, no la referencia cruda: `project/memories/mem-…/image-…` le dice
         al desarrollador dónde está el asset y al restaurante absolutamente nada. La
         ref queda en el `title`, para cuando hace falta leerla. */
      const thumb = el('span', 'mem-media-thumb');
      thumb.title = m.ref;
      media().url(m.ref).then(url => {
        if (!url) { thumb.textContent = m.kind === 'video' ? 'VÍDEO' : 'IMAGEN'; return; }
        const node = document.createElement(m.kind === 'video' ? 'video' : 'img');
        node.src = url;
        if (m.kind === 'video') { node.muted = true; node.playsInline = true; node.preload = 'metadata'; }
        else node.alt = '';
        thumb.append(node);
      }).catch(() => {});
      row.append(thumb);
      row.append(el('span', 'mem-media-kind', m.kind === 'video' ? 'VÍDEO' : 'IMAGEN'));
      const alt = el('input');
      alt.type = 'text';
      alt.placeholder = m.kind === 'video' ? 'Descripción del vídeo' : 'Texto alternativo';
      alt.value = m.alt || '';
      alt.dataset.memAlt = m.ref;
      alt.addEventListener('input', () => setAlt(item.id, m.ref, alt.value));
      row.append(alt);
      const drop = el('button', 'mem-op', 'Quitar');
      drop.type = 'button';
      drop.dataset.memUnlink = m.ref;
      drop.addEventListener('click', () => unlink(item.id, m.ref));
      row.append(drop);
      mediaBox.append(row);
    }
    const actions = el('div', 'mem-media-actions');
    for (const [kind, label, accept] of [['image', 'Subir imagen', 'image/*'], ['video', 'Subir vídeo', 'video/*']]) {
      const up = el('label', 'mem-upload', label);
      const input = el('input');
      input.type = 'file';
      input.accept = accept;
      input.dataset.memUpload = `${item.id}:${kind}`;
      input.addEventListener('change', async () => {
        await attach(item.id, kind, input.files?.[0]);
        input.value = '';
      });
      up.append(input);
      actions.append(up);
    }
    const pick = el('button', 'mem-op', 'Elegir de la Media Library');
    pick.type = 'button';
    pick.dataset.memPick = item.id;
    pick.addEventListener('click', () => chooseExisting(item.id, ''));
    actions.append(pick);
    mediaBox.append(actions);
    body.append(mediaBox);

    card.append(body);
    return card;
  }

  function render() {
    if (!panel) return;
    const value = state();
    const list = panel.querySelector('[data-mem-list]');
    list.replaceChildren();
    if (!value.items.length) {
      const empty = el('p', 'mem-hint', 'Ningún recuerdo todavía. El proyecto no publica nada hasta que añadas uno.');
      empty.dataset.memListEmpty = '1';
      list.append(empty);
    } else {
      value.items.forEach((item, index) => list.append(itemCard(item, index, value.items.length)));
    }
    panel.querySelector('[data-mem-count]').textContent =
      `${value.items.length} ${value.items.length === 1 ? 'recuerdo' : 'recuerdos'}`;
    panel.querySelector('[data-mem-state]').textContent = value.enabled ? 'ON' : 'OFF';
    sync();
  }

  /* Refleja el proyecto en los controles sin pisar lo que el usuario está escribiendo. */
  function sync() {
    if (!panel) return;
    const value = state();
    panel.querySelectorAll('[data-mem-path]').forEach(input => {
      const v = get(input.dataset.memPath);
      if (document.activeElement === input) return;
      if (input.type === 'checkbox') input.checked = !!v;
      else input.value = v ?? '';
    });
    panel.querySelector('[data-mem-state]').textContent = value.enabled ? 'ON' : 'OFF';
  }

  function build() {
    if (built) return;
    built = true;
    panel = el('div', 'studio-panel mem-panel');
    panel.dataset.panel = 'memories';
    panel.hidden = true;

    const head = el('div', 'mem-panel-head');
    head.append(el('h3', '', 'Memories'));
    const badge = el('span', 'mem-badge');
    badge.dataset.memState = '1';
    head.append(badge);
    panel.append(head);

    panel.append(el('p', 'mem-hint',
      'La memoria del restaurante: recuerdos, eventos, testimonios, prensa e hitos. Un solo conjunto de datos, tres formas de presentarlo.'));

    const value = state();
    panel.append(field('Publicar Memories en la web', `${PATH}.enabled`, {type: 'checkbox', value: value.enabled}));
    panel.append(field('Presentación', `${PATH}.preset`, {options: PRESET_LABELS, value: value.preset}));
    panel.append(field('Antetítulo', `${PATH}.eyebrow`, {value: value.eyebrow}));
    panel.append(field('Título de la sección', `${PATH}.title`, {value: value.title}));
    panel.append(field('Entradilla', `${PATH}.intro`, {type: 'textarea', value: value.intro}));

    const listHead = el('div', 'mem-list-head');
    listHead.append(el('span', 'mem-sub', 'Recuerdos'));
    const count = el('span', 'mem-badge');
    count.dataset.memCount = '1';
    listHead.append(count);
    const add = el('button', 'mem-add', '+ Añadir recuerdo');
    add.type = 'button';
    add.dataset.memAdd = '1';
    add.addEventListener('click', addItem);
    listHead.append(add);
    panel.append(listHead);

    const list = el('div', 'mem-list');
    list.dataset.memList = '1';
    panel.append(list);

    const statusNode = el('p', 'mem-status');
    statusNode.dataset.memStatus = '1';
    statusNode.setAttribute('role', 'status');
    statusNode.setAttribute('aria-live', 'polite');
    panel.append(statusNode);

    const preview = el('button', 'mem-op', 'Ver la sección en la web →');
    preview.type = 'button';
    preview.dataset.memPreview = '1';
    preview.addEventListener('click', () => {
      window.RestaurantStudioShell?.close?.();
      setTimeout(() => document.querySelector('#memories')?.scrollIntoView({behavior: 'smooth', block: 'start'}), 140);
    });
    panel.append(preview);

    document.querySelector('#studio-scroll').append(panel);
    render();
  }

  /* estilos: una hoja propia de la fase, cargada una vez */
  if (!document.querySelector('link[data-memories-styles]')) {
    const link = el('link');
    link.rel = 'stylesheet';
    link.href = 'styles-v23.css';
    link.dataset.memoriesStyles = '1';
    document.head.append(link);
  }

  /* Mostrar el panel es cosa nuestra, y no por gusto: `app-v4.js` asigna el `onclick`
     de las pestañas UNA vez, en `bindStudio()`, recorriendo las que existen en ese
     momento. Class 20 se salva porque `index.html` la carga ANTES de app-v4; Class 23
     se carga después, de forma aditiva, así que su pestaña nunca pasaría por ese
     enlazado y el panel se construiría sin llegar a verse.

     Se replica el MISMO contrato de DOM que usa el Studio —`.active` en la pestaña,
     `hidden` en los `.studio-panel`— en vez de inventar otra mecánica. */
  function showPanel() {
    document.querySelectorAll('.studio-nav button')
      .forEach(b => b.classList.toggle('active', b === button));
    document.querySelectorAll('.studio-panel')
      .forEach(p => { p.hidden = p !== panel; });
    const scroll = document.querySelector('#studio-scroll');
    if (scroll) scroll.scrollTop = 0;
  }

  /* la pestaña, junto a las demás y antes de Proyecto — como hizo Class 20 */
  const button = el('button', '', 'Memories');
  button.type = 'button';
  button.dataset.panel = 'memories';
  document.querySelector('.studio-nav [data-panel="project"]')?.before(button);
  button.addEventListener('click', () => { build(); showPanel(); });

  /* el proyecto cambia (edición, Undo, Redo, import, reset) → el panel se refleja */
  document.addEventListener('restaurant:config-applied', () => {
    if (!built) return;
    /* una edición estructural (Undo de un borrado, un import) cambia la lista entera */
    const value = state();
    const painted = panel.querySelectorAll('[data-mem-card]').length;
    if (painted !== value.items.length) render(); else sync();
  });

  window.RestaurantMemoriesStudio = Object.freeze({
    open() { build(); showPanel(); },
    isBuilt: () => built,
    addItem, removeItem, moveItem,
    attach, chooseExisting, unlink
  });
})();
