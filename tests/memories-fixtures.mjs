/* Fixtures de CLASS 23. Contenido de DEMO, y sólo para los tests.

   El proyecto base no puede afirmar recuerdos que no existen —ni un aniversario, ni un
   cliente, ni un premio—, así que estos textos viven aquí y nunca en `class4-config.js`.

   §34 del contrato de recuperación, al pie de la letra y sin trampa:

     · 5 recuerdos
     · 12 medias (9 imágenes + 3 vídeos)
     · uno con CUATRO medias
     · uno con imagen + vídeo + imagen
     · uno con `artifactStyle:'paper'` y otro con `artifactStyle:'cloth'`
     · un destacado hero, y los tres pesos visuales

   Y explícitamente NO se hace lo que §35 prohíbe: no hay un recuerdo "de imagen" y otro
   "de vídeo" para poder demostrar vídeo esquivando la multimedia. El recuerdo 01 mezcla
   imagen, vídeo, imagen y vídeo, y hay que llegar a los cuatro.

   La media es real, no simulada: las imágenes salen de assets del repositorio y los
   vídeos se GENERAN con MediaRecorder en una página de usar y tirar, así que los tests
   recorren la subida de verdad (`<input type=file>` → Media Library compartida).
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* imágenes distintas para que un cambio de media se VEA, no sólo se mida */
const IMAGE_POOL = [
  'assets/depth-carousel/dish-01-food.webp',
  'assets/depth-carousel/dish-02-food.webp',
  'assets/depth-carousel/dish-03-food.webp',
  'assets/depth-carousel/dish-04-food.webp',
  'assets/depth-carousel/dish-05-food.webp',
  'assets/depth-carousel/dish-06-food.webp',
  'assets/anchor-scenes/runtime/scene-01-gamba-roja.webp',
  'assets/anchor-scenes/runtime/scene-03-brasa-pulpo.webp',
  'assets/anchor-scenes/runtime/scene-05-presa-iberica.webp'
];

/* El PLAN de media por recuerdo. `i` = imagen, `v` = vídeo.
   Recuerdo 01: cuatro medias mezcladas — el caso que §35 obliga a probar. */
export const MEDIA_PLAN = [
  ['i', 'v', 'i', 'v'],     /* 01 · destacado hero: 4 medias, imagen y vídeo alternados */
  ['i', 'v', 'i'],          /* 02 · imagen + vídeo + imagen */
  ['i', 'i'],               /* 03 · papel: documento con dos piezas */
  ['i'],                    /* 04 · tejido: una pieza sobre tela */
  ['i', 'i']                /* 05 · dos piezas */
];

export const MEMORIES = [
  {title: 'La primera noche', type: 'event', date: '2019', place: 'Alicante',
    author: 'El equipo', visualWeight: 'hero', featured: true, artifactStyle: 'none',
    text: 'Abrimos con doce mesas y una sola cocinera al fuego. A las once y media todavía había gente esperando en la calle, y nadie del equipo se acordó de cenar. De aquella noche queda la manera de trabajar: primero el producto, después la prisa. Es el recuerdo que seguimos contando cuando entra alguien nuevo en la casa.'},
  {title: 'Mesa 7, todos los jueves', type: 'testimonial', date: '2021', place: 'Sala',
    author: 'Marta y Julián', rating: 5, visualWeight: 'medium', artifactStyle: 'none',
    text: 'Reservamos el mismo jueves desde hace dos años. Ya no hace falta que pidamos: sale lo que hay bueno ese día, y siempre hay algo que no habíamos probado.'},
  {title: 'Sol Repsol', type: 'press', date: '2022', place: 'Guía Repsol',
    visualWeight: 'medium', artifactStyle: 'paper', link: 'https://example.com/guia',
    text: 'Un reconocimiento que no cambió la carta. La misma brasa, el mismo proveedor y la misma hora de cierre.'},
  {title: 'Cinco años de brasa', type: 'milestone', date: '2024', place: 'Muelle 08',
    visualWeight: 'hero', artifactStyle: 'cloth',
    text: 'Cinco años del mismo carbón de olivo y del mismo cajón de la lonja. El mantel que colgamos esa noche sigue en la pared del office.'},
  {title: 'La cocina en agosto', type: 'memory', date: 'Agosto 2023', place: 'Cocina',
    visualWeight: 'small', artifactStyle: 'none',
    text: 'Cuarenta grados dentro y el pase impecable.'}
];

/* imagen real del repositorio: `setInputFiles` acepta el payload en memoria */
export function imageFile(index = 0, name = null) {
  const rel = IMAGE_POOL[index % IMAGE_POOL.length];
  const file = path.join(ROOT, rel);
  return {
    name: name || `recuerdo-${String(index + 1).padStart(2, '0')}.webp`,
    mimeType: 'image/webp',
    buffer: fs.readFileSync(file)
  };
}

/* Vídeo real, fabricado en el navegador. Cada uno con su propio color y su rótulo, para
   que al cambiar de media se distinga a simple vista cuál se está viendo. */
export async function videoFile(browser, index = 0, name = null) {
  const page = await browser.newPage();
  await page.goto('about:blank');
  const base64 = await page.evaluate(async i => {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(12);
    const mime = ['video/webm;codecs=vp8', 'video/webm']
      .find(t => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, {mimeType: mime});
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.start();
    const hue = [18, 96, 210][i % 3];
    /* ~3,4 s: con un clip de un segundo no hay margen para comprobar que `currentTime`
       avanza, ni para grabar la evidencia de reproducción */
    for (let f = 0; f < 80; f++) {
      ctx.fillStyle = `hsl(${hue} 34% ${10 + (f % 6) * 3}%)`;
      ctx.fillRect(0, 0, 640, 400);
      ctx.strokeStyle = 'rgba(244,239,228,.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(320, 200, 60 + (f % 13) * 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(244,239,228,.94)';
      ctx.font = '30px serif';
      ctx.fillText(`VÍDEO 0${i + 1}`, 40, 60);
      ctx.font = '15px monospace';
      ctx.fillText(`frame ${String(f).padStart(2, '0')}`, 40, 360);
      await new Promise(r => setTimeout(r, 42));
    }
    await new Promise(r => { rec.onstop = r; rec.stop(); });
    const buffer = await new Blob(chunks, {type: 'video/webm'}).arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let k = 0; k < bytes.length; k++) binary += String.fromCharCode(bytes[k]);
    return btoa(binary);
  }, index);
  await page.close();
  return {
    name: name || `video-${String(index + 1).padStart(2, '0')}.webm`,
    mimeType: 'video/webm',
    buffer: Buffer.from(base64, 'base64')
  };
}

/* Siembra los cinco recuerdos por el Project State (sin media): para los casos donde lo
   que se prueba es la PRESENTACIÓN. La media se sube por el panel. */
export const seedItems = (page, count = MEMORIES.length) => page.evaluate(list => {
  const model = window.RestaurantMemoriesModel;
  window.RestaurantStudioConfig.set('modules.memories.items',
    list.map(patch => model.item(patch)));
}, MEMORIES.slice(0, count));

/* Siembra las DOCE medias del plan directamente en la Media Library compartida y las
   vincula a sus recuerdos. Es el atajo para las capturas y para los tests de
   presentación; la subida por `<input type=file>` se prueba aparte, con su propio caso. */
export async function seedMedia(page, {images, videos}) {
  return page.evaluate(async ({plan, imgs, vids}) => {
    const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const items = JSON.parse(JSON.stringify(
      window.RestaurantStudioConfig.get('modules.memories.items')));
    let imgAt = 0, vidAt = 0;
    for (let i = 0; i < items.length && i < plan.length; i++) {
      const media = [];
      for (const kind of plan[i]) {
        const id = `${kind === 'v' ? 'video' : 'image'}-${i}-${media.length}`;
        const ref = `project/memories/${items[i].id}/${id}`;
        const payload = kind === 'v' ? vids[vidAt++ % vids.length] : imgs[imgAt++ % imgs.length];
        await window.RestaurantMedia.save(ref, new Blob([bytes(payload)],
          {type: kind === 'v' ? 'video/webm' : 'image/webp'}));
        media.push({
          id, kind: kind === 'v' ? 'video' : 'image', ref,
          alt: kind === 'v' ? `Vídeo del recuerdo ${i + 1}` : `Fotografía del recuerdo ${i + 1}`
        });
      }
      items[i].media = media;
    }
    window.RestaurantStudioConfig.set('modules.memories.items', items);
    await window.RestaurantMemoriesEngine.refresh();
    return items.reduce((n, it) => n + it.media.length, 0);
  }, {
    plan: MEDIA_PLAN,
    imgs: images.map(f => f.buffer.toString('base64')),
    vids: videos.map(f => f.buffer.toString('base64'))
  });
}

/* los ficheros que hacen falta para cubrir el plan: 9 imágenes y 3 vídeos */
export async function fixtureFiles(browser) {
  const images = IMAGE_POOL.map((_, i) => imageFile(i));
  const videos = [];
  for (let i = 0; i < 3; i++) videos.push(await videoFile(browser, i));
  return {images, videos};
}
