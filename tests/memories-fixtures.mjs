/* Fixtures de CLASS 23. Contenido de DEMO, y sólo para los tests.

   El proyecto base no puede afirmar recuerdos que no existen —ni un aniversario, ni un
   cliente, ni un premio—, así que estos textos viven aquí y nunca en `class4-config.js`.

   La media es real, no simulada: la imagen sale de un asset del repositorio y el vídeo
   se GENERA con MediaRecorder en una página de usar y tirar, así que los tests recorren
   la subida de verdad (`<input type=file>` → Media Library compartida) en vez de
   escribir referencias a mano.
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const MEMORIES = [
  {title: 'La primera noche', type: 'event', date: '2019', place: 'Alicante',
    author: 'El equipo', visualWeight: 'hero', featured: true,
    text: 'Abrimos con doce mesas y una sola cocinera al fuego. A las once y media todavía había gente esperando en la calle, y nadie del equipo se acordó de cenar. De aquella noche queda la manera de trabajar: primero el producto, después la prisa. Es el recuerdo que seguimos contando cuando entra alguien nuevo en la casa.'},
  {title: 'Mesa 7, todos los jueves', type: 'testimonial', date: '2021', place: 'Sala',
    author: 'Marta y Julián', rating: 5, visualWeight: 'medium',
    text: 'Reservamos el mismo jueves desde hace dos años. Ya no hace falta que pidamos: sale lo que hay bueno ese día.'},
  {title: 'Sol Repsol', type: 'press', date: '2022', place: 'Guía Repsol',
    visualWeight: 'small', link: 'https://example.com/guia',
    text: 'Un reconocimiento que no cambió la carta.'},
  {title: 'Cinco años de brasa', type: 'milestone', date: '2024', place: 'Muelle 08',
    visualWeight: 'medium',
    text: 'Cinco años del mismo carbón de olivo y del mismo proveedor de la lonja.'},
  {title: 'La cocina en agosto', type: 'memory', date: 'Agosto 2023', place: 'Cocina',
    visualWeight: 'small',
    text: 'Cuarenta grados dentro y el pase impecable.'}
];

/* imagen real del repositorio: `setInputFiles` acepta el payload en memoria, así que no
   hace falta copiar nada a un temporal */
export function imageFile(name = 'recuerdo.webp') {
  const file = path.join(ROOT, 'assets', 'depth-carousel', 'dish-01-food.webp');
  return {name, mimeType: 'image/webp', buffer: fs.readFileSync(file)};
}

/* vídeo real, fabricado en el navegador. Pequeño a propósito: lo que se prueba es el
   camino de la media, no el códec. */
export async function videoFile(browser, name = 'recuerdo.webm') {
  const page = await browser.newPage();
  await page.goto('about:blank');
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(12);
    const mime = ['video/webm;codecs=vp8', 'video/webm']
      .find(t => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, {mimeType: mime});
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.start();
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${20 + i * 6} 45% ${14 + (i % 5) * 4}%)`;
      ctx.fillRect(0, 0, 480, 300);
      ctx.fillStyle = 'rgba(242,237,226,.9)';
      ctx.font = '28px serif';
      ctx.fillText('MEMORIA', 40, 160 + Math.sin(i / 3) * 12);
      await new Promise(r => setTimeout(r, 40));
    }
    await new Promise(r => { rec.onstop = r; rec.stop(); });
    const blob = new Blob(chunks, {type: 'video/webm'});
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  });
  await page.close();
  return {name, mimeType: 'video/webm', buffer: Buffer.from(base64, 'base64')};
}

/* Siembra recuerdos por el Project State, para los casos donde lo que se prueba es la
   PRESENTACIÓN y no el editor. La media, cuando hace falta, se sube por el panel. */
export const seedItems = (page, count = MEMORIES.length) => page.evaluate(list => {
  const model = window.RestaurantMemoriesModel;
  window.RestaurantStudioConfig.set('modules.memories.items',
    list.map(patch => model.item(patch)));
}, MEMORIES.slice(0, count));
