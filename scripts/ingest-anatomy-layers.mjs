/* CLASS 26 — ANATOMY LAYER AUDIT + NORMALIZATION.

   N capas recortadas tienen que apilarse en UNA composición densa y creíble. El lienzo
   de origen es el mismo para todas (1536x1024 RGBA en el juego de referencia) pero el
   CONTENIDO VISIBLE no lo es: las dimensiones del fichero no son registro.

   Así que se mide lo que de verdad decide el apilado —la caja de contenido alfa de cada
   capa, y su componente conexo mayor para ignorar motas— y las diferencias se resuelven
   con DATOS DE REGISTRO, nunca con condicionales por capa dentro del motor.

   Una capa de comida se apila por su BORDE VISIBLE, así que la caja de contenido es el
   ancla de registro: normaliza cada capa contra el mismo eje y el mismo ancho útil y
   todas caen donde les toca, en el orden que diga el dato.

   POR QUÉ NO SE CABLEAN CONSTANTES
     La referencia de la que viene esta gramática (thebuggeddev/burger, src/pages/Home.tsx)
     resolvió esto con ocho constantes calibradas a mano contra una captura a 1920. Eso
     funciona exactamente para ese juego de imágenes y para ese ancho. Cambiar un asset
     obliga a recalibrar a mano. Aquí el registro se GENERA, con tolerancias y veredicto,
     como en scripts/ingest-pizza-slices.mjs.

   POR QUÉ TAMBIÉN REDIMENSIONA
     Los másters pesan ~1.6-2.5 MB cada uno y se pintan a ~35-52vw. Servir el máster es
     regalar entre 3 y 4 veces los píxeles que se ven. El runtime se emite al ancho útil
     real, recortado a su caja de contenido, así que además desaparece el relleno
     transparente —que en este juego es más de la mitad del fichero.

   Los ficheros de origen son másters inmutables. Esto los lee y escribe en otro sitio.

   Sin dependencias: PNG se decodifica y recodifica con el zlib de Node. No hay build
   step en este repositorio y no se introduce uno.

   Los platos se DESCUBREN: cada assets/anatomy/source/<id>/layers.json es uno.
   Anadir un producto nuevo no toca este fichero.

   Uso:  node scripts/ingest-anatomy-layers.mjs
   Salida: assets/anatomy/runtime/<dish>/<layer>.png
           assets/anatomy/layers-manifest.json
           assets/anatomy/audit/layer-registration.json
*/
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'anatomy', 'source');
const RUNTIME = path.join(ROOT, 'assets', 'anatomy', 'runtime');
const AUDIT = path.join(ROOT, 'assets', 'anatomy', 'audit');
const MANIFEST = path.join(ROOT, 'assets', 'anatomy', 'layers-manifest.json');

/* --check mide y valida pero NO escribe: es el modo para iterar sobre un juego recien
   generado sin ensuciar el arbol con runtimes de capas que todavia van a cambiar. */
const CHECK_ONLY = process.argv.includes('--check');

/* LOS PLATOS SON DATOS, NO CÓDIGO.

   La primera versión traía la hamburguesa cableada aquí dentro. Eso convertía "añadir
   pizza" en "editar el ingestor", que es justo el patrón que este repositorio evita en
   todas partes: el catálogo es dato y el renderizador conmuta.

   Ahora se descubren solos. Cada carpeta de `assets/anatomy/source/<id>/` con un
   `layers.json` es un plato:

       { "id", "name", "product", "layers": [ {"file", "label"}, ... ] }

   El ORDEN del array es el orden de arriba abajo, y es autoría: nadie puede MEDIR que
   el pan va encima de la carne. La etiqueta también. Todo lo demás se mide.

   Para generar un juego nuevo: `node scripts/anatomy-prompt-kit.mjs <producto>`. */
function discoverDishes(){
  if(!fs.existsSync(SRC))return [];
  return fs.readdirSync(SRC,{withFileTypes:true})
    .filter(d=>d.isDirectory())
    .map(d=>path.join(SRC,d.name,'layers.json'))
    .filter(f=>fs.existsSync(f))
    .map(f=>{
      const spec=JSON.parse(fs.readFileSync(f,'utf8'));
      const id=spec.id||path.basename(path.dirname(f));
      if(!Array.isArray(spec.layers)||!spec.layers.length)
        throw new Error(`${id}/layers.json no declara capas`);
      return {id,name:spec.name||id,product:spec.product||'',
        /* Los valores por defecto estan calibrados para comida fotografiada a 45
           grados. Un reloj son discos finos y un movil laminas planas: el juego
           puede traer los suyos y viajan CON EL, no como constante global. */
        layout:spec.layout&&typeof spec.layout==='object'?spec.layout:null,
        order:spec.layers.map(l=>[l.file,l.label||''])};
    })
    .sort((a,b)=>a.id.localeCompare(b.id));
}

/* ---------------------------------------------------------------- parámetros de apilado

   La densidad es la decisión de dirección que hace que un despiece parezca comida y no
   un diagrama de montaje. La referencia deja huecos <=30px a 1920 (~1.56vw) y permite
   solapes intencionados. Estos son los valores de partida; el Studio los puede mover.  */
const LAYOUT = {
  /* la capa más ancha ocupa esta fracción del ancho del escenario */
  widestFraction: 0.52,
  /* Alto total del apilado, en fracción del ancho del escenario. De aquí sale el
     aplastado vertical, y esto merece explicación.

     Los recortes de comida están fotografiados a unos 45 grados, así que cada capa es
     casi tan alta como ancha. Apiladas sin más, nueve capas miden 2.4 veces el ancho del
     escenario: no cabe en ninguna pantalla y, peor, no parece una pila —parece una
     columna de objetos sueltos.

     La referencia resolvió esto con un `sy` por capa, de 0.361 a 1.129, calibrado a ojo
     contra una captura concreta. Funciona para esas ocho imágenes y para nada más.

     Aquí se declara la INTENCIÓN —el apilado ocupa esto de alto— y el aplastado sale de
     dividir. Un solo número derivado, no nueve cableados, y sobrevive a cambiar un
     asset o a añadir una capa. */
  targetStackHeight: 1.12,
  /* hueco vertical entre cajas de contenido consecutivas, en fracción del ancho del
     escenario, YA aplastado. Negativo = solape intencionado.

     La densidad es la decisión que separa "apetecible" de "diagrama de despiece": la
     referencia deja huecos <=30px a 1920 (~1.56vw) y hace pisar el tomate sobre el
     bacon a propósito. */
  gapFraction: -0.006,
  /* umbral de alfa por encima del cual un píxel cuenta como contenido */
  alphaThreshold: 60,
  /* un componente conexo con menos de esta fracción de píxeles del mayor se descarta */
  specklePart: 0.06,
  /* Ancho máximo del asset de runtime, en píxeles de contenido.

     La capa más ancha se pinta a 52vw: 750px en un portátil de 1440, 1000px en 1920.
     Y encima se aplasta verticalmente, así que la mitad de las filas de píxeles del
     máster no llegan nunca a la pantalla. Servir 1400px de ancho es regalar banda.
     820 cubre 1440 con holgura y deja el juego completo por debajo de 5MB, que es lo
     que hace viable una revisión visual desde una rama. */
  maxRuntimeWidth: 820
};

/* CONTRATO DE ASSETS — lo que un juego generado tiene que cumplir para que el apilado
   funcione. Los umbrales salen de medir el juego de referencia, no de opinar:

     lienzo identico en las 9 ... 1536x1024, sin excepcion  -> se exige igualdad
     objeto centrado ............ cx 0.479..0.502           -> se admite 3%
     ancho del contenido ........ 68%..92% del lienzo       -> se admite 55%..95%

   El fallo mas comun y el mas caro es el primero: un modelo devuelve una capa a otra
   resolucion y el juego entero deja de registrar. Por eso se comprueba antes que nada. */
const CONTRACT = {
  centreTolerance: 0.03,
  minContentWidth: 0.55,
  maxContentWidth: 0.95,
  minLayers: 3
};

const TOLERANCES = {
  /* dispersión máxima aceptable del ancho de contenido respecto a la mediana */
  widthSpread: 3.2,
  /* una capa cuyo contenido ocupe menos de esto de su lienzo avisa: hay mucho relleno */
  minCoverage: 0.04,
  /* alto total del apilado respecto al ancho del escenario; por encima de esto no cabe
     en una pantalla razonable sin scroll interno */
  maxStackHeight: 1.9
};

/* ============================================================== PNG · CRC + decodificar */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/* Devuelve {w, h, data} con data en RGBA de 8 bits, siempre 4 canales. */
function decodePNG(file) {
  const buf = fs.readFileSync(file);
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${path.basename(file)}: no es un PNG`);

  let off = 8, ihdr = null;
  const idat = [];
  let palette = null, trns = null;

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: body.readUInt32BE(0), height: body.readUInt32BE(4),
        bitDepth: body[8], colorType: body[9], interlace: body[12]
      };
    } else if (type === 'PLTE') palette = Buffer.from(body);
    else if (type === 'tRNS') trns = Buffer.from(body);
    else if (type === 'IDAT') idat.push(Buffer.from(body));
    else if (type === 'IEND') break;
    off += 12 + len;
  }

  if (!ihdr) throw new Error(`${path.basename(file)}: sin IHDR`);
  if (ihdr.interlace) throw new Error(`${path.basename(file)}: PNG entrelazado (Adam7) no soportado — reexporta sin entrelazado`);
  if (ihdr.bitDepth !== 8) throw new Error(`${path.basename(file)}: profundidad ${ihdr.bitDepth} bits; este ingestor sólo lee 8`);

  const CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4};
  const ch = CHANNELS[ihdr.colorType];
  if (!ch) throw new Error(`${path.basename(file)}: colorType ${ihdr.colorType} no soportado`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const {width: w, height: h} = ihdr;
  const stride = w * ch;
  const px = Buffer.alloc(h * stride);

  /* desfiltrado por scanline */
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride); p += stride;
    const cur = px.subarray(y * stride, y * stride + stride);
    const prev = y ? px.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      else if (filter !== 0) throw new Error(`${path.basename(file)}: filtro ${filter} desconocido`);
      cur[i] = v & 0xff;
    }
  }

  /* normalizar a RGBA */
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    const s = i * ch, d = i * 4;
    if (ihdr.colorType === 6) { out[d] = px[s]; out[d + 1] = px[s + 1]; out[d + 2] = px[s + 2]; out[d + 3] = px[s + 3]; }
    else if (ihdr.colorType === 2) { out[d] = px[s]; out[d + 1] = px[s + 1]; out[d + 2] = px[s + 2]; out[d + 3] = 255; }
    else if (ihdr.colorType === 4) { out[d] = out[d + 1] = out[d + 2] = px[s]; out[d + 3] = px[s + 1]; }
    else if (ihdr.colorType === 0) { out[d] = out[d + 1] = out[d + 2] = px[s]; out[d + 3] = 255; }
    else { /* 3: indexado */
      const idx = px[s] * 3;
      out[d] = palette[idx]; out[d + 1] = palette[idx + 1]; out[d + 2] = palette[idx + 2];
      out[d + 3] = trns && px[s] < trns.length ? trns[px[s]] : 255;
    }
  }
  return {w, h, data: out};
}

/* ================================================================== PNG · recodificar */

function chunk(type, body) {
  const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, body])));
  return Buffer.concat([len, t, body, crc]);
}

/* Se prueban los cinco filtros por scanline y gana el de menor suma de valores
   absolutos: es la heurística estándar y en fotografía con alfa vale mucho. */
function encodePNG({w, h, data}) {
  const stride = w * 4;
  const lines = [];
  const cand = [Buffer.alloc(stride + 1), Buffer.alloc(stride + 1), Buffer.alloc(stride + 1),
                Buffer.alloc(stride + 1), Buffer.alloc(stride + 1)];
  for (let y = 0; y < h; y++) {
    const cur = data.subarray(y * stride, y * stride + stride);
    const prev = y ? data.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    let best = -1, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      if (f > 1 && !prev && f !== 4) { /* Up/Average sin fila previa degeneran, se permiten igual */ }
      const buf = cand[f]; buf[0] = f;
      let sum = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? cur[i - 4] : 0;
        const b = prev ? prev[i] : 0;
        const c = prev && i >= 4 ? prev[i - 4] : 0;
        let v;
        if (f === 0) v = cur[i];
        else if (f === 1) v = cur[i] - a;
        else if (f === 2) v = cur[i] - b;
        else if (f === 3) v = cur[i] - ((a + b) >> 1);
        else v = cur[i] - paeth(a, b, c);
        v &= 0xff;
        buf[i + 1] = v;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) { bestSum = sum; best = f; }
    }
    lines.push(Buffer.from(cand[best]));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(Buffer.concat(lines), {level: 9});
  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ===================================================================== medir + recortar */

/* Caja de contenido del COMPONENTE CONEXO MAYOR. El bbox ingenuo lo estropea una sola
   mota de compresión en una esquina, y entonces la capa se registra contra ruido. */
function contentBox({w, h, data}, threshold, specklePart) {
  const mask = new Uint8Array(w * h);
  let opaque = 0;
  for (let i = 0, n = w * h; i < n; i++) if (data[i * 4 + 3] > threshold) { mask[i] = 1; opaque++; }
  if (!opaque) return null;

  const label = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const comps = [];
  for (let start = 0, n = w * h; start < n; start++) {
    if (!mask[start] || label[start] >= 0) continue;
    const id = comps.length;
    let sp = 0, count = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    stack[sp++] = start; label[start] = id;
    while (sp) {
      const i = stack[--sp];
      const x = i % w, y = (i - x) / w;
      count++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && label[i - 1] < 0) { label[i - 1] = id; stack[sp++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && label[i + 1] < 0) { label[i + 1] = id; stack[sp++] = i + 1; }
      if (y > 0 && mask[i - w] && label[i - w] < 0) { label[i - w] = id; stack[sp++] = i - w; }
      if (y < h - 1 && mask[i + w] && label[i + w] < 0) { label[i + w] = id; stack[sp++] = i + w; }
    }
    comps.push({id, count, x0, y0, x1, y1});
  }

  comps.sort((a, b) => b.count - a.count);
  const main = comps[0];
  /* Una capa como la lechuga son varias hojas separadas: los componentes grandes forman
     parte del producto y se unen; sólo se descartan las motas. */
  let {x0, y0, x1, y1} = main;
  let kept = 1, keptPx = main.count;
  for (let i = 1; i < comps.length; i++) {
    const c = comps[i];
    if (c.count < main.count * specklePart) continue;
    x0 = Math.min(x0, c.x0); y0 = Math.min(y0, c.y0);
    x1 = Math.max(x1, c.x1); y1 = Math.max(y1, c.y1);
    kept++; keptPx += c.count;
  }
  return {
    x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1,
    opaquePx: opaque, components: comps.length, componentsKept: kept,
    discardedPx: opaque - keptPx
  };
}

function crop(img, box) {
  const out = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    const src = ((box.y0 + y) * img.w + box.x0) * 4;
    img.data.copy(out, y * box.w * 4, src, src + box.w * 4);
  }
  return {w: box.w, h: box.h, data: out};
}

/* Área ponderada con alfa premultiplicado. Sin premultiplicar, los píxeles totalmente
   transparentes arrastran su color al borde y aparece una orla. */
function resize(img, tw, th) {
  const out = Buffer.alloc(tw * th * 4);
  const sx = img.w / tw, sy = img.h / th;
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.min(img.h, Math.max(y0 + 1, Math.ceil((y + 1) * sy)));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.min(img.w, Math.max(x0 + 1, Math.ceil((x + 1) * sx)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const s = (yy * img.w + xx) * 4, al = img.data[s + 3];
          r += img.data[s] * al; g += img.data[s + 1] * al; b += img.data[s + 2] * al;
          a += al; n++;
        }
      }
      const d = (y * tw + x) * 4;
      if (a > 0) { out[d] = Math.round(r / a); out[d + 1] = Math.round(g / a); out[d + 2] = Math.round(b / a); }
      out[d + 3] = Math.round(a / n);
    }
  }
  return {w: tw, h: th, data: out};
}

/* ============================================================================== ingesta */

function ingestDish(dishId, spec) {
  const LAY = {...LAYOUT, ...(spec.layout || {})};
  const layersDir = path.join(SRC, dishId, 'layers');
  const outDir = path.join(RUNTIME, dishId);
  if (!CHECK_ONLY) fs.mkdirSync(outDir, {recursive: true});

  const measured = [];
  const missing = [];
  for (const [file, label] of spec.order) {
    const src = path.join(layersDir, file);
    if (!fs.existsSync(src)) { missing.push(file); continue; }
    const srcBytes = fs.statSync(src).size;
    const img = decodePNG(src);
    const box = contentBox(img, LAY.alphaThreshold, LAY.specklePart);
    if (!box) throw new Error(`${file}: no hay ningún píxel por encima del umbral de alfa`);

    const cropped = crop(img, box);
    const tw = Math.min(LAY.maxRuntimeWidth, cropped.w);
    const runtime = tw === cropped.w ? cropped : resize(cropped, tw, Math.max(1, Math.round(cropped.h * tw / cropped.w)));
    const id = file.replace(/^layer-/, '').replace(/\.png$/, '');
    const outFile = path.join(outDir, `${id}.png`);
    if (!CHECK_ONLY) fs.writeFileSync(outFile, encodePNG(runtime));
    const outBytes = fs.existsSync(outFile) ? fs.statSync(outFile).size : 0;

    measured.push({
      id, label, source: `assets/anatomy/source/${dishId}/layers/${file}`,
      runtimeAsset: `assets/anatomy/runtime/${dishId}/${id}.png`,
      sourceBytes: srcBytes, runtimeBytes: outBytes,
      canvas: {w: img.w, h: img.h},
      content: {
        x0: box.x0, y0: box.y0, w: box.w, h: box.h,
        aspect: +(box.w / box.h).toFixed(5),
        coverage: +(box.opaquePx / (img.w * img.h)).toFixed(5),
        /* centro del contenido como fracción del lienzo del máster: por qué la
           referencia necesitaba un cx por capa, ahora medido */
        cx: +((box.x0 + box.w / 2) / img.w).toFixed(5),
        cy: +((box.y0 + box.h / 2) / img.h).toFixed(5)
      },
      alpha: {
        threshold: LAY.alphaThreshold, opaquePx: box.opaquePx,
        components: box.components, componentsKept: box.componentsKept, discardedPx: box.discardedPx
      },
      runtime: {w: runtime.w, h: runtime.h}
    });
  }

  if (missing.length) return {id: dishId, name: spec.name, pending: missing};

  /* --- contrato de assets ---
     Se evalua sobre lo YA medido, asi que no cuesta nada, y se reporta por capa: lo
     util no es "el juego esta mal", es "regenera estas dos". */
  const canvases = new Set(measured.map(m => `${m.canvas.w}x${m.canvas.h}`));
  const issues = [];
  if (canvases.size > 1)
    issues.push({layer: '*', problem: `lienzos distintos en el juego: ${[...canvases].join(', ')}`});
  if (measured.length < CONTRACT.minLayers)
    issues.push({layer: '*', problem: `solo ${measured.length} capas; con menos de ${CONTRACT.minLayers} el motor cae a heroe anotado`});
  for (const m of measured) {
    const off = Math.abs(m.content.cx - 0.5);
    if (off > CONTRACT.centreTolerance)
      issues.push({layer: m.id, problem: `descentrado ${(off * 100).toFixed(1)}% (maximo ${(CONTRACT.centreTolerance * 100).toFixed(0)}%)`});
    const rel = m.content.w / m.canvas.w;
    if (rel < CONTRACT.minContentWidth)
      issues.push({layer: m.id, problem: `objeto pequeno: ocupa el ${(rel * 100).toFixed(0)}% del ancho (minimo ${(CONTRACT.minContentWidth * 100).toFixed(0)}%)`});
    if (rel > CONTRACT.maxContentWidth)
      issues.push({layer: m.id, problem: `objeto al borde: ocupa el ${(rel * 100).toFixed(0)}% del ancho (maximo ${(CONTRACT.maxContentWidth * 100).toFixed(0)}%)`});
  }

  /* El héroe del plato, si existe, pasa por el mismo tratamiento. Lo usa el modo de
     héroe anotado —el fallback cuando no hay capas suficientes— y la ficha de producto.
     Servir el máster de 1.6MB para eso sería absurdo. */
  let hero=null;
  const heroSrc=path.join(SRC, dishId, 'hero.png');
  if(fs.existsSync(heroSrc)){
    const img=decodePNG(heroSrc);
    const box=contentBox(img, LAY.alphaThreshold, LAY.specklePart);
    const cropped=box?crop(img,box):img;
    const tw=Math.min(LAY.maxRuntimeWidth, cropped.w);
    const out=tw===cropped.w?cropped:resize(cropped,tw,Math.max(1,Math.round(cropped.h*tw/cropped.w)));
    const outFile=path.join(outDir,'hero.png');
    if(!CHECK_ONLY) fs.writeFileSync(outFile, encodePNG(out));
    hero={source:`assets/anatomy/source/${dishId}/hero.png`,
      runtimeAsset:`assets/anatomy/runtime/${dishId}/hero.png`,
      sourceBytes:fs.statSync(heroSrc).size,
      runtimeBytes:fs.existsSync(outFile)?fs.statSync(outFile).size:0,
      runtime:{w:out.w,h:out.h}};
  }

  /* --- layout generado ---
     El runtime ya está recortado a su contenido, así que ancho de caja == ancho visible
     y no hace falta ningún cx de compensación en el motor: por eso el registro sale más
     simple que el de la referencia. */
  const widest = Math.max(...measured.map(m => m.content.w));
  const unit = LAY.widestFraction / widest;   /* fracción del escenario por píxel de máster */

  /* El aplastado vertical se DERIVA del alto que queremos para el apilado. Los huecos se
     descuentan antes porque no se aplastan: un hueco es una decisión de densidad, no una
     propiedad de la imagen. */
  const rawHeights = measured.map(m => m.content.h * unit);
  const rawTotal = rawHeights.reduce((a, b) => a + b, 0);
  const gapTotal = LAY.gapFraction * (measured.length - 1);
  const squashY = +((LAY.targetStackHeight - gapTotal) / rawTotal).toFixed(5);

  let top = 0;
  const layers = measured.map((m, i) => {
    const w = +(m.content.w * unit).toFixed(5);
    const h = +(m.content.h * unit * squashY).toFixed(5);
    const entry = {
      ...m,
      layout: {
        order: i,
        /* todo en fracción del ancho del escenario; el motor lo pasa a vw */
        width: w, height: h, top: +top.toFixed(5),
        /* El motor pinta la imagen con scaleY(squashY) y origen arriba, así que la caja
           mide `height` y la imagen conserva su aspecto real dentro. Se guarda por capa
           —aunque hoy salga igual para todas— porque el Studio tiene que poder aflojarlo
           en una capa concreta sin recalcular el apilado entero. */
        squashY,
        /* desplazamiento lateral respecto al eje; 0 = centrado. Dato, no medida:
           el Studio lo mueve para dar vida al apilado. */
        offsetX: 0,
        /* profundidad percibida = índice. Un solo parámetro, como en la referencia. */
        depth: i
      }
    };
    top += h + LAY.gapFraction;
    return entry;
  });
  const stackHeight = +(top - LAY.gapFraction).toFixed(5);

  /* --- veredicto --- */
  const widths = measured.map(m => m.content.w).sort((a, b) => a - b);
  const median = widths[Math.floor(widths.length / 2)];
  const widthSpread = +(Math.max(...widths.map(w => Math.abs(w - median) / median))).toFixed(4);
  const minCoverage = Math.min(...measured.map(m => m.content.coverage));
  const savedBytes = measured.reduce((a, m) => a + m.sourceBytes - m.runtimeBytes, 0);

  const verdict = {
    layers: layers.length,
    squashY,
    widthSpread, widthSpreadOk: widthSpread <= TOLERANCES.widthSpread,
    minCoverage, coverageAdvisory: minCoverage >= TOLERANCES.minCoverage ? 'ok' : 'mucho relleno transparente en el máster',
    stackHeight, stackHeightOk: stackHeight <= TOLERANCES.maxStackHeight,
    sourceBytes: measured.reduce((a, m) => a + m.sourceBytes, 0),
    runtimeBytes: measured.reduce((a, m) => a + m.runtimeBytes, 0),
    savedBytes,
    savedPct: +(100 * savedBytes / measured.reduce((a, m) => a + m.sourceBytes, 0)).toFixed(1),
    contractIssues: issues,
    contractOk: issues.length === 0,
    registered: true
  };
  verdict.registered = verdict.widthSpreadOk && verdict.stackHeightOk && verdict.contractOk;

  return {id: dishId, name: spec.name, layout: LAY, tolerances: TOLERANCES, verdict, hero, layers};
}

/* =================================================================================== main */

if (!CHECK_ONLY) fs.mkdirSync(AUDIT, {recursive: true});
const dishes = [];
const found = discoverDishes();
if (!found.length) {
  console.error(`no hay ningun plato con layers.json en ${SRC.replace(ROOT + path.sep, '')}`);
  process.exit(1);
}
for (const spec of found) {
  const dishId = spec.id;
  process.stdout.write(`\n[${dishId}] ${spec.order.length} capas\n`);
  const result = ingestDish(dishId, spec);
  if (result.pending) {
    console.log(`  PENDIENTE - faltan ${result.pending.length} master(es):`);
    for (const f of result.pending) console.log(`    ${f}`);
    console.log('  genera las imagenes con: node scripts/anatomy-prompt-kit.mjs <receta>');
    continue;
  }
  dishes.push(result);
  for (const l of result.layers) {
    process.stdout.write(
      `  ${l.id.padEnd(18)} contenido ${String(l.content.w).padStart(4)}x${String(l.content.h).padStart(4)}` +
      `  cobertura ${(l.content.coverage * 100).toFixed(1).padStart(5)}%` +
      `  comp ${l.alpha.componentsKept}/${l.alpha.components}` +
      `  ${(l.sourceBytes / 1024).toFixed(0).padStart(5)}KB -> ${(l.runtimeBytes / 1024).toFixed(0).padStart(4)}KB\n`
    );
  }
  const v = result.verdict;
  if (!v.contractOk) {
    console.log('  CONTRATO DE ASSETS - regenera estas capas:');
    for (const i of v.contractIssues) console.log(`    ${i.layer.padEnd(18)} ${i.problem}`);
  }
  process.stdout.write(
    `  --> dispersión de ancho ${(v.widthSpread * 100).toFixed(1)}% ${v.widthSpreadOk ? 'ok' : 'FUERA DE TOLERANCIA'}` +
    ` · alto del apilado ${v.stackHeight.toFixed(3)} del ancho ${v.stackHeightOk ? 'ok' : 'FUERA DE TOLERANCIA'}` +
    ` · ${(v.sourceBytes / 1048576).toFixed(1)}MB -> ${(v.runtimeBytes / 1048576).toFixed(1)}MB (-${v.savedPct}%)\n`
  );
}

const manifest = {
  project: 'CLASS 26 — Anatomy Theater',
  kind: 'real',
  generatedBy: 'scripts/ingest-anatomy-layers.mjs',
  generatedAt: new Date().toISOString().slice(0, 10),
  note: 'El registro se mide; no se cablea. Reejecutar tras cambiar cualquier máster.',
  dishes
};
if (!CHECK_ONLY) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
if (!CHECK_ONLY) fs.writeFileSync(path.join(AUDIT, 'layer-registration.json'), JSON.stringify({
  generatedAt: manifest.generatedAt,
  dishes: dishes.map(d => ({
    id: d.id, verdict: d.verdict,
    layers: d.layers.map(l => ({id: l.id, content: l.content, alpha: l.alpha, layout: l.layout,
      sourceBytes: l.sourceBytes, runtimeBytes: l.runtimeBytes}))
  }))
}, null, 2));

const allOk = dishes.every(d => d.verdict.registered);
console.log(CHECK_ONLY
  ? '\nmodo --check: nada escrito'
  : '\n' + MANIFEST.replace(ROOT + path.sep, '') + ' escrito');
process.stdout.write(`${allOk ? 'REGISTRO OK' : 'REGISTRO CON AVISOS'}\n`);
process.exit(allOk ? 0 : 1);
