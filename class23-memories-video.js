/* CLASS 23 — CONTROLADOR DE VÍDEO de Memories. Uno solo, para todo.

   La entrega anterior fue rechazada porque «se pueden subir vídeos, pero la experiencia
   no garantiza que una persona pueda reproducirlos». La causa: el autoplay dependía por
   completo de un IntersectionObserver, un `play()` rechazado se ignoraba en silencio, y
   el vídeo del story overlay quedaba fuera del ciclo de observación.

   Aquí el contrato se invierte:

     · TODO vídeo tiene un control de Play/Pause visible y usable. Siempre. Es la vía
       principal, no el plan B.
     · El autoplay es un extra silencioso: sólo para el vídeo hero/ambiente, sólo si es
       visible, el documento está visible, no hay reduced-motion, está `muted` y es
       `playsinline`. Como máximo UNO a la vez.
     · Si `play()` se rechaza, el control sigue ahí y el estado vuelve a "pausado" — el
       usuario ve que puede pulsar, que es justo lo que faltaba.

   La disciplina de ciclo de vida es la de `Gallery.tsx` de ThreeUI (MIT © Meng To),
   auditada en `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`: nada corre si el host
   no es visible o el documento está oculto, y al desmontar se cancela y se desconecta
   todo. Registro único, así que el vídeo del story entra por la misma puerta que el
   vídeo inline.
*/
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* video → {wrap, button, autoplay, visible} */
  const registry = new Map();
  let io = null;
  let current = null;                 /* el único que puede sonar/moverse solo */

  const isPlaying = v => !!v && !v.paused && !v.ended;

  function observer() {
    if (io) return io;
    /* Dos condiciones DISTINTAS, y la diferencia importa:

         ARRANCAR SOLO  → `isIntersecting` y más del 50% a la vista
         PAUSAR         → `isIntersecting === false`, es decir, fuera de pantalla de verdad

       Un umbral de proporción para pausar parece más fino y es un error. El revelado de
       entrada de la sección anima un `clip-path`, y el IntersectionObserver CUENTA EL
       RECORTE: durante esos ~1,1 s la proporción sube de 0 a 1, así que un vídeo que la
       persona acababa de arrancar se pausaba solo a mitad de la animación. Se localizó
       instrumentando el observer, no leyendo el código.

       «Pausa cuando sale del viewport» es literalmente lo que pide el contrato, y es lo
       que hace esto — inmune a recortes, escalas y animaciones de entrada. */
    io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const rec = registry.get(entry.target);
        if (!rec) continue;
        rec.visible = entry.isIntersecting && entry.intersectionRatio > 0.5;
        if (!entry.isIntersecting) pause(entry.target, {reason: 'offscreen'});
        else if (rec.visible) maybeAutoplay(entry.target);
      }
    }, {threshold: [0, 0.5, 0.9]});
    return io;
  }

  /* ---------- estado visible en el DOM ----------
     El botón y el contenedor llevan el estado, para que el CSS pueda mostrar el póster,
     el gradiente y el icono correctos sin que nadie tenga que consultar el motor. */
  function paint(video) {
    const rec = registry.get(video);
    if (!rec) return;
    const playing = isPlaying(video);
    rec.wrap?.setAttribute('data-playing', playing ? '1' : '0');
    if (rec.button) {
      rec.button.dataset.state = playing ? 'playing' : 'paused';
      rec.button.setAttribute('aria-pressed', playing ? 'true' : 'false');
      const label = playing ? 'Pausar el vídeo' : 'Reproducir el vídeo';
      rec.button.setAttribute('aria-label', label);
      rec.button.title = label;
    }
  }

  async function play(video, {manual = false} = {}) {
    if (!video) return false;
    /* uno cada vez: arrancar uno pausa el anterior, sea inline o del story */
    if (current && current !== video) pause(current, {reason: 'exclusive'});
    current = video;
    /* Un vídeo parado EN SU FINAL no arranca: `play()` lo deja donde está y vuelve a
       terminar en el mismo instante, así que el control no hacía nada visible. Se
       rebobina, que es lo que hace cualquier reproductor y lo que la persona espera. */
    const atEnd = video.ended
      || (Number.isFinite(video.duration) && video.duration > 0
          && video.currentTime >= video.duration - 0.08);
    if (atEnd) { try { video.currentTime = 0; } catch {} }
    try {
      await video.play();
      paint(video);
      return true;
    } catch (err) {
      /* NO se ignora: si el navegador lo rechaza —gesto requerido, códec, lo que sea—
         el control queda disponible y visible en estado "pausado" */
      current = current === video ? null : current;
      paint(video);
      if (manual) console.warn('Memories: el vídeo no pudo arrancar', err?.name || err);
      return false;
    }
  }

  function pause(video, {reason = ''} = {}) {
    if (!video) return;
    try { video.pause(); } catch {}
    if (current === video) current = null;
    paint(video);
    if (reason === 'teardown') video.removeAttribute('src');
  }

  const pauseAll = () => { for (const v of registry.keys()) pause(v, {reason: 'all'}); };

  function maybeAutoplay(video) {
    const rec = registry.get(video);
    if (!rec?.autoplay || !rec.visible) return;
    if (document.hidden || reduced.matches) return;
    if (!video.muted || !video.playsInline) return;
    if (current && current !== video && isPlaying(current)) return;   /* ya hay uno */
    play(video, {manual: false});
  }

  /* ---------- registro ----------
     `wrap` es el marco (recibe data-playing) y `button` el control. Ambos opcionales
     para el caso del Studio, donde el control lo pone el panel. */
  function register(video, {wrap = null, button = null, autoplay = false} = {}) {
    if (!video || registry.has(video)) return;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.loop = autoplay;                       /* sólo el ambiente se repite */
    registry.set(video, {wrap, button, autoplay, visible: false});
    video.addEventListener('play', () => paint(video));
    video.addEventListener('pause', () => paint(video));
    video.addEventListener('ended', () => paint(video));
    if (button) {
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();                 /* no abrir la historia al dar Play */
        if (isPlaying(video)) pause(video, {reason: 'manual'});
        else play(video, {manual: true});
      });
    }
    observer().observe(video);
    paint(video);
  }

  function unregister(video) {
    if (!registry.has(video)) return;
    pause(video, {reason: 'teardown'});
    io?.unobserve(video);
    registry.delete(video);
  }

  /* Pausa todo lo que haya dentro de un subárbol: cambiar de media, cambiar de tarjeta,
     cerrar el story. Es la operación que la entrega anterior no tenía. */
  function pauseWithin(root) {
    if (!root) return;
    for (const v of registry.keys()) if (root.contains(v)) pause(v, {reason: 'within'});
  }

  function releaseWithin(root) {
    if (!root) return;
    for (const v of [...registry.keys()]) if (root.contains(v)) unregister(v);
  }

  function destroy() {
    pauseAll();
    for (const v of [...registry.keys()]) unregister(v);
    io?.disconnect();
    io = null;
    current = null;
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
  reduced.addEventListener?.('change', () => { if (reduced.matches) pauseAll(); });

  window.RestaurantMemoriesVideo = Object.freeze({
    register, unregister, play, pause, pauseAll, pauseWithin, releaseWithin, destroy,
    isPlaying,
    /* para los tests y para el motor: cuántos hay y cuántos suenan */
    state: () => ({
      registered: registry.size,
      playing: [...registry.keys()].filter(isPlaying).length,
      current: current ? (current.dataset.memMediaRef || '1') : null
    })
  });
})();
