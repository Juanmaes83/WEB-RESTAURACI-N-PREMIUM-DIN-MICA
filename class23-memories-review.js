/* CLASS 23 — MEMORIES REVIEW. Una composición completa, lista para juzgar, en el deploy.

   Nace de un rechazo concreto: la demostración visual dependía de que Playwright
   inyectara estado después de cargar la página, y eso no es el producto. Aquí no hay
   inyección: se abre

       <URL>/?review=memories

   y el MISMO motor productivo pinta un archivo rico con assets versionados en el
   repositorio. Nada de fork del motor, nada de iframe, nada de LAB, nada de
   localStorage secreto.

   Tres reglas que hacen que esto no sea trampa ni contaminación:

   1. **NO ESCRIBE EN EL PROJECT STATE.** Publica `window.RestaurantMemoriesReview` y el
      motor lo prefiere mientras existe. Al salir de la URL de review, el proyecto del
      restaurante está intacto — ni un `set`, ni un guardado, ni una entrada de Undo.
      Ése es exactamente el problema que reportó el usuario («aparecen imágenes
      antiguas»), y esta ruta no puede volver a causarlo.
   2. **LA MEDIA ES ESTÁTICA Y DEL REPOSITORIO.** Las refs se resuelven contra ficheros
      versionados mediante `RestaurantMedia.map(ref, url)`, que registra una URL sin
      guardar nada en la Media Library. Es, además, la forma que tendrá Cloud Media de
      resolver una ref remota.
   3. **EL CONTENIDO ESTÁ ETIQUETADO COMO DEMO.** Ni una frase se presenta como
      información real del restaurante: el antetítulo, la entradilla y una banda fija lo
      dicen. Esta URL sirve para valorar Wall, Stack y Journal, no para publicar.

   Composición (cumple §9 del contrato): 5 recuerdos · 12 medias · 9 imágenes · 3 vídeos ·
   uno con 4 medias · uno con imagen+vídeo+imagen · un destacado hero · uno de papel ·
   uno de tejido · los tres pesos visuales.
*/
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const mode = params.get('review');
  if (mode !== 'memories' && mode !== '1') return;

  /* ---------- assets versionados ---------- */
  const IMG = [
    'assets/anchor-scenes/runtime/scene-01-gamba-roja.webp',
    'assets/depth-carousel/dish-03-food.webp',
    'assets/depth-carousel/dish-05-food.webp',
    'assets/anchor-scenes/runtime/scene-03-brasa-pulpo.webp',
    'assets/depth-carousel/dish-02-food.webp',
    'assets/depth-carousel/dish-06-food.webp',
    'assets/anchor-scenes/runtime/scene-05-presa-iberica.webp',
    'assets/depth-carousel/dish-04-food.webp',
    'assets/depth-carousel/dish-01-food.webp'
  ];
  const VID = [
    'assets/memories-review/servicio-cocina.webm',
    'assets/memories-review/brasa.webm',
    'assets/memories-review/sala-noche.webm'
  ];

  /* Las refs mantienen la forma del dominio (`project/memories/<item>/<media>`) para que
     el motor no tenga que saber que esto es una review. */
  const m = (item, id, kind, file, alt) => ({
    id, kind, alt,
    ref: `project/memories/${item}/${id}`,
    src: file
  });

  const ITEMS = [
    {
      id: 'review-01', enabled: true, type: 'event', featured: true, visualWeight: 'hero',
      artifactStyle: 'none',
      title: 'La primera noche',
      text: 'Contenido DEMO para revisión visual. Doce mesas, una cocinera al fuego y una cola en la calle a las once y media. De esa noche viene la manera de trabajar: primero el producto, después la prisa. Este recuerdo lleva cuatro medias —dos fotografías y dos vídeos— para que se vea cómo compone la pared cuando un recuerdo es una colección y no una foto.',
      author: 'Equipo de sala', date: '2019', place: 'Alicante', rating: null, link: '',
      media: [
        m('review-01', 'image-01', 'image', IMG[0], 'Fotografía de demostración · servicio'),
        m('review-01', 'video-01', 'video', VID[0], 'Vídeo de demostración · cocina'),
        m('review-01', 'image-02', 'image', IMG[1], 'Fotografía de demostración · brasa'),
        m('review-01', 'video-02', 'video', VID[1], 'Vídeo de demostración · brasa')
      ]
    },
    {
      id: 'review-02', enabled: true, type: 'testimonial', featured: false,
      visualWeight: 'medium', artifactStyle: 'none',
      title: 'Mesa 7, todos los jueves',
      text: 'Contenido DEMO. Un testimonio con imagen, vídeo e imagen: la secuencia que el contrato exige poder recorrer entera.',
      author: 'Clientela de demostración', date: '2021', place: 'Sala', rating: 5, link: '',
      media: [
        m('review-02', 'image-01', 'image', IMG[2], 'Fotografía de demostración · mesa'),
        m('review-02', 'video-01', 'video', VID[2], 'Vídeo de demostración · sala de noche'),
        m('review-02', 'image-02', 'image', IMG[3], 'Fotografía de demostración · pase')
      ]
    },
    {
      id: 'review-03', enabled: true, type: 'press', featured: false,
      visualWeight: 'medium', artifactStyle: 'paper',
      title: 'Reconocimiento de guía',
      text: 'Contenido DEMO con tratamiento de PAPEL: hoja con canto, pliegue y un grabado cinético dibujado en canvas. Sirve para valorar la materialidad del artefacto, no para afirmar ningún premio real.',
      author: '', date: '2022', place: 'Archivo', rating: null,
      link: 'https://example.com/demo',
      media: [
        m('review-03', 'image-01', 'image', IMG[4], 'Documento de demostración'),
        m('review-03', 'image-02', 'image', IMG[5], 'Detalle de demostración')
      ]
    },
    {
      id: 'review-04', enabled: true, type: 'milestone', featured: false,
      visualWeight: 'hero', artifactStyle: 'cloth',
      title: 'Cinco años de brasa',
      text: 'Contenido DEMO con tratamiento de TEJIDO: una tela resuelta con solver Verlet, con urdimbre, trama, caída y luz. Para valorar si el material se siente material.',
      author: '', date: '2024', place: 'Muelle 08', rating: null, link: '',
      media: [
        m('review-04', 'image-01', 'image', IMG[6], 'Fotografía de demostración · hito')
      ]
    },
    {
      id: 'review-05', enabled: true, type: 'memory', featured: false,
      visualWeight: 'small', artifactStyle: 'none',
      title: 'La cocina en agosto',
      text: 'Contenido DEMO. Cuarenta grados dentro y el pase impecable.',
      author: '', date: 'Agosto 2023', place: 'Cocina', rating: null, link: '',
      media: [
        m('review-05', 'image-01', 'image', IMG[7], 'Fotografía de demostración · cocina'),
        m('review-05', 'image-02', 'image', IMG[8], 'Fotografía de demostración · detalle')
      ]
    }
  ];

  const MEMORIES = {
    enabled: true,
    preset: params.get('preset') || 'cinematic-memory-wall',
    eyebrow: 'Memoria · CONTENIDO DEMO DE REVISIÓN',
    title: 'Lo que ha pasado en esta casa',
    intro: 'Composición de DEMOSTRACIÓN para revisión visual: cinco recuerdos, doce medias entre fotografías y vídeos, y los dos tratamientos materiales. No son datos del restaurante.',
    items: ITEMS
  };

  /* ---------- publicación del override ---------- */
  window.RestaurantMemoriesReview = Object.freeze({
    active: true,
    memories: MEMORIES,
    /* el motor pide las refs resueltas; aquí son ficheros del repositorio */
    map() {
      const media = window.RestaurantMedia;
      if (!media?.map) return 0;
      let mapped = 0;
      for (const item of ITEMS) {
        for (const asset of item.media) {
          media.map(asset.ref, asset.src);
          mapped++;
        }
      }
      return mapped;
    }
  });

  /* ---------- banda de aviso, para que nadie confunda esto con el producto ---------- */
  function banner() {
    if (document.querySelector('[data-memories-review-banner]')) return;
    const bar = document.createElement('div');
    bar.className = 'mem-review-banner';
    bar.dataset.memoriesReviewBanner = '1';
    bar.innerHTML =
      '<strong>MEMORIES · REVISIÓN VISUAL</strong>'
      + '<span>Contenido de demostración. No se guarda nada en el proyecto del restaurante.</span>';
    const nav = document.createElement('div');
    nav.className = 'mem-review-presets';
    for (const [preset, label] of [['cinematic-memory-wall', 'Wall'],
      ['memory-stack', 'Stack'], ['editorial-journal', 'Journal']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.dataset.reviewPreset = preset;
      b.addEventListener('click', () => {
        MEMORIES.preset = preset;
        nav.querySelectorAll('[data-review-preset]').forEach(n =>
          n.dataset.current = n.dataset.reviewPreset === preset ? '1' : '0');
        window.RestaurantMemoriesEngine?.refresh?.();
        setTimeout(() => document.querySelector('#memories')
          ?.scrollIntoView({block: 'start', behavior: 'smooth'}), 260);
      });
      b.dataset.current = preset === MEMORIES.preset ? '1' : '0';
      nav.append(b);
    }
    bar.append(nav);
    document.body.append(bar);
    document.documentElement.dataset.memoriesReview = 'ready';
  }

  const start = () => {
    banner();
    window.RestaurantMemoriesReview.map();
    /* el motor puede haber pintado ya con el proyecto real: se le pide repintar */
    window.RestaurantMemoriesEngine?.refresh?.();
    /* y si aún no existe, se espera a que la cadena aditiva lo cargue */
    if (!window.RestaurantMemoriesEngine) {
      let tries = 0;
      const timer = setInterval(() => {
        if (window.RestaurantMemoriesEngine) {
          clearInterval(timer);
          window.RestaurantMemoriesReview.map();
          window.RestaurantMemoriesEngine.refresh();
        } else if (++tries > 80) clearInterval(timer);
      }, 100);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
