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
  /* TRATAMIENTO: lo elige el restaurante y nunca se deduce del tipo. Cambiarlo conserva
     el recuerdo, sus datos y su media — sólo cambia cómo se presenta. */
  const ARTIFACT_LABELS = [['none', 'Normal'], ['paper', 'Papel / Archivo'], ['cloth', 'Tejido / Heritage']];
  const PRESET_LABELS = [
    ['cinematic-memory-wall', 'Cinematic Memory Wall'],
    ['memory-stack', 'Memory Stack'],
    ['editorial-journal', 'Editorial Journal']
  ];
  /* Los tres presets, presentados. El `<select>` sigue existiendo —hay tests y hay teclado
     que dependen de él— pero deja de ser la única forma de descubrirlos: el usuario
     reportó que no encontraba Wall/Stack/Journal, y un desplegable no los enseña. */
  const PRESET_CARDS = [
    ['cinematic-memory-wall', 'Cinematic Memory Wall',
      'Vista cinematográfica · collage · profundidad'],
    ['memory-stack', 'Memory Stack',
      'Tarjetas físicas · arrastre · lanzamiento · profundidad'],
    ['editorial-journal', 'Editorial Journal',
      'Archivo editorial · spreads · filmstrip']
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

  /* El ORDEN de `media[]` es dato, igual que el de los recuerdos: se escribe el array
     completo, así que cada operación es UNA entrada de historial y Undo devuelve el
     orden anterior con sus referencias intactas. */
  function moveMedia(id, ref, delta) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    if (!item) return;
    item.media = M().moveMedia(item.media, ref, delta);
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    engine()?.refresh?.();
    focusMediaRow(id, ref);
  }

  /* "Usar como portada" = mover esa media al índice 0. No hace falta un `primaryMediaId`
     que pueda discrepar del array. */
  function makeCover(id, ref) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    if (!item) return;
    item.media = M().makeCover(item.media, ref);
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    engine()?.refresh?.();
    status('Portada actualizada.');
    focusMediaRow(id, ref);
  }

  const focusMediaRow = (id, ref) => {
    const row = panel?.querySelector(`[data-mem-card="${id}"] [data-mem-media-ref="${ref}"]`);
    row?.querySelector('[data-mem-cover]')?.focus();
  };

  /* REEMPLAZAR ≠ AÑADIR. Era el fallo que el usuario vivía como «siguen apareciendo las
     imágenes antiguas»: subía otra foto creyendo sustituir y en realidad añadía una
     referencia más al array, con la vieja todavía de portada. Esto sustituye ESA
     referencia en SU posición; el asset global no se borra (otro recuerdo puede usarlo, y
     Undo tiene que poder volver). */
  async function replaceMedia(id, ref, kind, file) {
    if (!file) return;
    const expected = kind === 'video' ? 'video/' : 'image/';
    if (!file.type.startsWith(expected)) {
      status(`El archivo no es ${kind === 'video' ? 'un vídeo' : 'una imagen'}.`);
      return;
    }
    const mediaId = M().newMediaId(kind);
    const nextRef = M().refFor(id, mediaId);
    try {
      await media().save(nextRef, file);
    } catch (err) {
      console.error(err);
      status('No se pudo guardar el archivo en la Media Library.');
      return;
    }
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    if (!item) return;
    const at = (item.media || []).findIndex(x => x.ref === ref);
    if (at < 0) return;
    const previous = item.media[at];
    item.media[at] = {id: mediaId, kind, ref: nextRef, alt: previous.alt || ''};
    set(`${PATH}.items`, next);
    openItem = id;
    render();
    engine()?.refresh?.();
    status(`Media ${String(at + 1).padStart(2, '0')} reemplazada. La anterior ya no está vinculada a este recuerdo.`);
  }

  function setAlt(id, ref, alt) {
    const next = itemsNow();
    const item = next.find(i => i.id === id);
    const m = item?.media?.find(x => x.ref === ref);
    if (!m) return;
    m.alt = alt;
    set(`${PATH}.items`, next);
  }

  /* Abre la sección REAL del producto: cierra el cajón y lleva el scroll. Sin pestaña
     nueva, sin iframe, sin LAB. */
  function preview(preset) {
    if (preset) set(`${PATH}.preset`, preset);
    if (!state().enabled) {
      set(`${PATH}.enabled`, true);
      status('Memories se ha activado para poder verlo.');
    }
    window.RestaurantStudioShell?.close?.();
    setTimeout(() => {
      const section = document.querySelector('#memories');
      if (section) section.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }, 220);
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
    body.append(field('Tratamiento', `${base}.artifactStyle`, {options: ARTIFACT_LABELS, value: item.artifactStyle}));
    body.append(field('Tipo', `${base}.type`, {options: TYPE_LABELS, value: item.type}));
    body.append(field('Título', `${base}.title`, {value: item.title}));
    body.append(field('Historia', `${base}.text`, {type: 'textarea', value: item.text}));
    body.append(field('Autor / quién lo cuenta', `${base}.author`, {value: item.author}));
    body.append(field('Fecha', `${base}.date`, {value: item.date}));
    body.append(field('Lugar', `${base}.place`, {value: item.place}));
    body.append(field('Valoración (0–5)', `${base}.rating`, {type: 'number', value: item.rating ?? ''}));
    body.append(field('Enlace (https)', `${base}.link`, {type: 'url', value: item.link}));

    /* media */
    /* El editor tiene que ENSEÑAR lo que contiene el recuerdo, no sólo ofrecer botones
       de subir: miniatura real, orden, portada, alt y Play para el vídeo. */
    const mediaBox = el('div', 'mem-media-box');
    const mediaHead = el('div', 'mem-media-head');
    mediaHead.append(el('span', 'mem-sub', 'Media del recuerdo'));
    const mediaCount = el('span', 'mem-badge',
      `${(item.media || []).length} ${(item.media || []).length === 1 ? 'archivo' : 'archivos'}`);
    mediaHead.append(mediaCount);
    mediaBox.append(mediaHead);

    (item.media || []).forEach((m, mi, all) => {
      const row = el('div', 'mem-media-row');
      row.dataset.memMediaRef = m.ref;
      row.dataset.memMediaIndex = String(mi);
      if (mi === 0) row.dataset.cover = '1';

      /* miniatura de verdad; la ref cruda se guarda en el `title` para quien la necesite */
      const thumb = el('span', 'mem-media-thumb');
      thumb.title = m.ref;
      thumb.dataset.kind = m.kind;
      media().url(m.ref).then(url => {
        if (!url) { thumb.textContent = m.kind === 'video' ? 'VÍDEO' : 'IMAGEN'; return; }
        if (m.kind === 'video') {
          const v = document.createElement('video');
          v.src = url; v.muted = true; v.playsInline = true; v.preload = 'metadata';
          v.dataset.memStudioVideo = m.ref;
          thumb.append(v);
          /* Play/Pause MANUAL en el editor: nunca autoplay mientras se edita */
          const play = el('button', 'mem-studio-play');
          play.type = 'button';
          play.dataset.memStudioPlay = m.ref;
          play.setAttribute('aria-label', 'Reproducir el vídeo');
          play.addEventListener('click', e => {
            e.preventDefault();
            if (v.paused) { v.play().catch(() => {}); play.dataset.state = 'playing'; }
            else { v.pause(); play.dataset.state = 'paused'; }
          });
          v.addEventListener('pause', () => { play.dataset.state = 'paused'; });
          v.addEventListener('play', () => { play.dataset.state = 'playing'; });
          thumb.append(play);
        } else {
          const img = document.createElement('img');
          img.src = url; img.alt = '';
          thumb.append(img);
        }
      }).catch(() => {});
      row.append(thumb);

      const info = el('div', 'mem-media-info');
      const kindLine = el('div', 'mem-media-kindline');
      kindLine.append(el('span', 'mem-media-kind', m.kind === 'video' ? 'VÍDEO' : 'IMAGEN'));
      kindLine.append(el('span', 'mem-media-pos', String(mi + 1).padStart(2, '0')));
      if (mi === 0) kindLine.append(el('span', 'mem-media-coverbadge', 'PORTADA'));
      info.append(kindLine);
      const alt = el('input');
      alt.type = 'text';
      alt.placeholder = m.kind === 'video' ? 'Descripción del vídeo' : 'Texto alternativo';
      alt.value = m.alt || '';
      alt.dataset.memAlt = m.ref;
      alt.addEventListener('input', () => setAlt(item.id, m.ref, alt.value));
      info.append(alt);
      row.append(info);

      const ops = el('div', 'mem-media-ops');
      const up = el('button', 'mem-op', '↑');
      up.type = 'button'; up.dataset.memMediaUp = m.ref; up.disabled = mi === 0;
      up.setAttribute('aria-label', 'Subir esta media');
      up.addEventListener('click', () => moveMedia(item.id, m.ref, -1));
      const down = el('button', 'mem-op', '↓');
      down.type = 'button'; down.dataset.memMediaDown = m.ref; down.disabled = mi === all.length - 1;
      down.setAttribute('aria-label', 'Bajar esta media');
      down.addEventListener('click', () => moveMedia(item.id, m.ref, 1));
      const cover = el('button', 'mem-op', 'Portada');
      cover.type = 'button'; cover.dataset.memCover = m.ref; cover.disabled = mi === 0;
      cover.setAttribute('aria-label', 'Usar como portada');
      cover.addEventListener('click', () => makeCover(item.id, m.ref));
      /* Reemplazar es un `<label>` con su propio input: mismo gesto que subir, pero
         sustituye en su sitio en vez de añadir al final. */
      const replace = el('label', 'mem-op mem-op-replace', 'Reemplazar');
      const replaceInput = el('input');
      replaceInput.type = 'file';
      replaceInput.accept = m.kind === 'video' ? 'video/*' : 'image/*';
      replaceInput.dataset.memReplace = m.ref;
      replaceInput.addEventListener('change', async () => {
        await replaceMedia(item.id, m.ref, m.kind, replaceInput.files?.[0]);
        replaceInput.value = '';
      });
      replace.append(replaceInput);
      const drop = el('button', 'mem-op mem-op-danger', 'Quitar');
      drop.type = 'button';
      drop.dataset.memUnlink = m.ref;
      drop.title = 'Desvincula esta media del recuerdo. El archivo sigue en la Media Library.';
      drop.addEventListener('click', () => unlink(item.id, m.ref));
      ops.append(up, down, cover, replace, drop);
      row.append(ops);
      mediaBox.append(row);
    });

    if (!(item.media || []).length) {
      const none = el('p', 'mem-hint', 'Sin media todavía. Sube una imagen o un vídeo, o elige algo que ya esté en la Media Library.');
      none.dataset.memMediaEmpty = item.id;
      mediaBox.append(none);
    }
    const actions = el('div', 'mem-media-actions');
    for (const [kind, label, accept] of [['image', '+ Añadir imagen', 'image/*'],
      ['video', '+ Añadir vídeo', 'video/*']]) {
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
    const hint = el('p', 'mem-hint',
      'AÑADIR suma una media nueva al recuerdo. Para cambiar una que ya está, usa '
      + 'REEMPLAZAR en su fila: sustituye esa y la anterior deja de estar vinculada. '
      + 'QUITAR sólo desvincula — el archivo permanece en la Media Library.');
    actions.append(hint);
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
    panel.querySelectorAll('[data-mem-preset-card]').forEach(card => {
      card.dataset.current = card.dataset.memPresetCard === value.preset ? '1' : '0';
      card.setAttribute('aria-pressed', card.dataset.current === '1' ? 'true' : 'false');
    });
  }

  function build() {
    if (built) return;
    built = true;
    panel = el('div', 'studio-panel mem-panel');
    panel.dataset.panel = 'memories';
    panel.hidden = true;

    /* Entrada inequívoca: el usuario reportó que no localizaba Memories */
    const intro = el('div', 'mem-panel-intro');
    intro.dataset.memEntry = '1';
    const head = el('div', 'mem-panel-head');
    head.append(el('p', 'mem-eyebrow-studio', 'MEMORIES'));
    const badge = el('span', 'mem-badge');
    badge.dataset.memState = '1';
    head.append(badge);
    intro.append(head);
    intro.append(el('h3', '', 'Memorias del restaurante'));
    intro.append(el('p', 'mem-hint',
      'Recuerdos, eventos, testimonios, prensa e hitos. Un solo conjunto de datos y tres '
      + 'formas de presentarlo — la misma media, distinta puesta en escena.'));
    panel.append(intro);

    const value = state();
    panel.append(field('Publicar Memories en la web', `${PATH}.enabled`, {type: 'checkbox', value: value.enabled}));

    /* ---------- selección VISUAL de presentación ---------- */
    const presetBox = el('div', 'mem-preset-box');
    presetBox.append(el('span', 'mem-sub', 'Presentación'));
    const presetGrid = el('div', 'mem-preset-grid');
    presetGrid.dataset.memPresetGrid = '1';
    for (const [id, name, note] of PRESET_CARDS) {
      const card = el('button', 'mem-preset-card');
      card.type = 'button';
      card.dataset.memPresetCard = id;
      card.append(el('strong', '', name));
      card.append(el('span', 'mem-preset-note', note));
      const view = el('span', 'mem-preset-view', 'Previsualizar →');
      card.append(view);
      card.addEventListener('click', () => {
        set(`${PATH}.preset`, id);
        /* seleccionar y previsualizar en el mismo gesto: la sección REAL del producto */
        preview(id);
      });
      presetGrid.append(card);
    }
    presetBox.append(presetGrid);
    /* el select se conserva: teclado, lectores de pantalla y los contratos existentes */
    presetBox.append(field('Presentación (lista)', `${PATH}.preset`,
      {options: PRESET_LABELS, value: value.preset}));
    panel.append(presetBox);
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

    /* ---------- accesos de revisión rápida ---------- */
    const review = el('div', 'mem-review-actions');
    const see = el('button', 'mem-primary', 'VER MEMORIES →');
    see.type = 'button';
    see.dataset.memPreview = '1';
    see.addEventListener('click', () => preview());
    review.append(see);
    for (const [id, name] of PRESET_CARDS.map(([i, n]) => [i, n.split(' ').pop()])) {
      const b = el('button', 'mem-op', `Previsualizar ${name}`);
      b.type = 'button';
      b.dataset.memPreviewPreset = id;
      b.addEventListener('click', () => { set(`${PATH}.preset`, id); preview(id); });
      review.append(b);
    }
    panel.append(review);

    /* ---------- restablecer SÓLO Memories ----------
       El usuario necesitaba una forma explícita de quitarse de encima los recuerdos y las
       imágenes antiguas de su navegador sin tirar la carta, la marca ni los módulos. Pasa
       por `set`, así que entra en Undo y en el guardado de siempre. */
    const danger = el('div', 'mem-danger-zone');
    const reset = el('button', 'mem-op mem-op-danger', 'Restablecer Memories');
    reset.type = 'button';
    reset.dataset.memReset = '1';
    reset.addEventListener('click', () => {
      const total = state().items.length;
      const ok = window.confirm(
        `¿Restablecer Memories?\n\nSe quitan ${total} ${total === 1 ? 'recuerdo' : 'recuerdos'} `
        + 'y sus vínculos de media, y la sección queda apagada.\n\n'
        + 'NO se toca la carta, ni la marca, ni los demás módulos, ni la Media Library: '
        + 'los archivos subidos siguen disponibles. Se puede deshacer con Undo.');
      if (!ok) return;
      set(PATH, M().clone(M().DEFAULTS));
      openItem = null;
      render();
      engine()?.refresh?.();
      status('Memories restablecido. Los archivos siguen en la Media Library.');
    });
    danger.append(reset);
    danger.append(el('p', 'mem-hint',
      'Restablecer afecta SÓLO a Memories: apaga la sección y vacía sus recuerdos. '
      + 'La carta, la marca, los módulos y los archivos de la Media Library no se tocan.'));
    panel.append(danger);

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
  const button = el('button', '', 'Memorias');
  button.type = 'button';
  button.dataset.panel = 'memories';
  button.title = 'Memories · memorias del restaurante';
  document.querySelector('.studio-nav [data-panel="project"]')?.before(button);
  button.addEventListener('click', () => { build(); showPanel(); });

  /* El proyecto cambia (edición, Undo, Redo, import, reset) → el panel se refleja.

     Comparar CANTIDADES era un bug real y estaba pendiente: un reorder —o un Undo de un
     reorder, o un import con el mismo número de recuerdos— deja el mismo total y el DOM
     se quedaba en el orden viejo, con cada input apuntando por índice a OTRO recuerdo.
     Se comparan los IDs EN ORDEN, que es lo único que describe el estado pintado.

     Lo mismo con la media: si el orden de `media[]` del recuerdo abierto cambió, hay que
     repintar su ficha para que la portada y las posiciones digan la verdad. */
  const paintedSignature = () => [...(panel?.querySelectorAll('[data-mem-card]') || [])]
    .map(card => {
      const refs = [...card.querySelectorAll('[data-mem-media-ref]')]
        .map(r => r.dataset.memMediaRef).join(',');
      return `${card.dataset.memCard}:${refs}`;
    }).join('|');
  const stateSignature = () => state().items
    .map(i => `${i.id}:${(i.media || []).map(m => m.ref).join(',')}`).join('|');

  document.addEventListener('restaurant:config-applied', () => {
    if (!built) return;
    if (paintedSignature() !== stateSignature()) render(); else sync();
  });

  window.RestaurantMemoriesStudio = Object.freeze({
    open() { build(); showPanel(); },
    preview,
    isBuilt: () => built,
    addItem, removeItem, moveItem,
    attach, chooseExisting, unlink
  });
})();
