/* CLASS 26 — ANATOMY LAYER PROMPT KIT

   Genera el juego de prompts para producir las capas de un producto nuevo, y el
   `layers.json` que el ingestor espera. Cierra el ciclo:

       recipe -> prompts -> imagenes -> check -> ingest -> runtime

   POR QUE ESTO ES UN SCRIPT Y NO UNA LISTA EN UN DOC

   El apilado no funciona porque las imagenes sean bonitas: funciona porque las N capas
   comparten camara, distancia, lente, luz y lienzo. Si la lechuga esta fotografiada
   dos grados mas alta que el queso, el apilado se rompe y no hay registro que lo
   arregle — el ingestor mide donde esta el contenido, no puede reorientar un objeto.

   Asi que el bloque INVARIANTE tiene que ir palabra por palabra IGUAL en los N prompts.
   Escrito a mano nueve veces, alguien cambiara una coma en la quinta. Emitido por un
   script, no puede pasar.

   EL CONTRATO SALE DE MEDIR, NO DE OPINAR

   Los numeros de abajo estan medidos sobre el juego de referencia de nueve capas con
   `scripts/ingest-anatomy-layers.mjs`:

       lienzo identico en las 9 .... 1536x1024 (3:2), sin excepcion
       objeto centrado ............. cx entre 0.479 y 0.502 -> desvio maximo 2.1%
       ancho del contenido ......... 68% a 92% del lienzo
       aspecto del contenido ....... 1.30 a 2.80 (la salsa es plana; el motor lo absorbe)
       cobertura alfa .............. 20% a 59% -> mucho aire alrededor, es lo normal

   Uso:
     node scripts/anatomy-prompt-kit.mjs                 lista las recetas
     node scripts/anatomy-prompt-kit.mjs pizza           prompts + layers.json de pizza
     node scripts/anatomy-prompt-kit.mjs taco --json     salida legible por maquina
     node scripts/anatomy-prompt-kit.mjs kebab --write   crea la carpeta y el layers.json
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'anatomy', 'source');

/* ============================================================ EL BLOQUE INVARIANTE

   Esto es lo unico que de verdad importa. Va IGUAL en cada prompt del juego.
   Cambiar una palabra aqui obliga a regenerar el juego ENTERO, no una capa. */

/* La parte GEOMETRICA del invariante es la misma para todo: es lo que hace que las
   capas encajen, y no depende de si lo que se despieza es una hamburguesa o un reloj.
   El despiece nacio en la ilustracion tecnica —relojeria, planos de patente, manuales
   de montaje—; la comida es la aplicacion rara, no al reves. */
const GEOMETRY = [
  'isolated on a fully transparent background, no backdrop, no surface, no scene',
  'single elevated three-quarter view, camera 45 degrees above the horizon, dead centre',
  'same camera, same lens, same distance and same framing as the rest of the set',
  'soft neutral studio lighting from the upper left, identical across the set',
  'subject horizontally and vertically centred in the frame',
  'subject occupies about 80 percent of the frame width',
  'generous empty margin on all four sides'
];

const FRAME = '3:2 aspect ratio, 1536 by 1024 pixels';

/* Lo unico que cambia entre familias de producto es el ESTILO fotografico y lo que hay
   que prohibir. La geometria no se toca: si se tocara, dejarian de apilarse. */
const PROFILES = {
  food: {
    style: 'photorealistic food photography, crisp focus edge to edge, natural colour',
    negative: ['plate', 'board', 'tray', 'cutlery', 'garnish not requested']
  },
  product: {
    style: 'photorealistic studio product photography, macro detail, crisp focus edge to edge, neutral colour, clean and unworn',
    negative: ['packaging', 'box', 'display stand', 'price tag', 'person wearing it',
      'mannequin', 'dust', 'fingerprints', 'scratches', 'studio equipment reflected in the surface']
  }
};

const NEGATIVE_COMMON = [
  'background', 'backdrop', 'table', 'surface',
  'drop shadow on a surface', 'reflection', 'text', 'logo', 'watermark',
  'hands', 'multiple items', 'collage',
  'top-down view', 'side view at eye level', 'tilted horizon',
  'cropped subject', 'subject touching the frame edge', 'vignette', 'blur'
];

const invariantFor = profile =>
  [...GEOMETRY, PROFILES[profile].style, FRAME].join(', ');
const negativeFor = profile =>
  [...NEGATIVE_COMMON, ...PROFILES[profile].negative].join(', ');

/* Compatibilidad con quien importe el modulo esperando las constantes de antes. */
const INVARIANT = invariantFor('food');
const NEGATIVE = negativeFor('food');

/* Nota de produccion que acompana a los prompts. No es relleno: es lo que hace que un
   juego salga coherente en vez de nueve fotos sueltas del mismo tema. */
const METHOD = `COMO GENERARLO PARA QUE EL JUEGO SEA COHERENTE

  1. Genera PRIMERO la capa base (la ultima de la lista): es la mas grande y la que
     fija la camara.
  2. Usa esa imagen como REFERENCIA de camara y luz para las demas. Casi todos los
     modelos actuales aceptan una imagen de referencia; es la diferencia entre un
     juego y nueve fotos parecidas. Con modelos que aceptan semilla, fija la misma.
  3. Genera el resto en la MISMA sesion, cambiando solo la linea del sujeto.
  4. Si el modelo no devuelve alfa real, recorta el fondo despues. El ingestor exige
     canal alfa: sin el, la capa no se apila.
  5. Valida antes de invertir mas tiempo:
         node scripts/ingest-anatomy-layers.mjs --check
     Regenera solo las capas que salgan marcadas y vuelve a validar.
  6. Cuando pase, ingesta de verdad:
         node scripts/ingest-anatomy-layers.mjs

QUE MIRA EL VALIDADOR

  · mismo lienzo en todas las capas del juego (es el fallo mas comun y el mas caro)
  · canal alfa real
  · objeto centrado, desvio maximo del 3 por ciento
  · ancho del contenido entre el 55 y el 95 por ciento del lienzo
  · al menos 3 capas: con menos, el motor cae a heroe anotado`;

/* ==================================================================== LAS RECETAS

   Cada receta es: el nombre del producto, la base fotografica y las capas de arriba
   abajo. El ORDEN es autoria — nadie puede medir que el pan va encima de la carne.

   `subject` es la unica parte que cambia entre prompts del mismo juego.
   `label` es lo que vera el visitante en la ficha; se puede editar luego en el Studio. */

const RECIPES = {
  pizza: {
    id: 'pizza-margarita',
    name: 'Pizza Margarita',
    dish: 'a round Neapolitan pizza',
    layers: [
      ['albahaca',   'Albahaca fresca',      'a scattering of fresh basil leaves arranged in a loose circle, as they would sit on a pizza'],
      ['aceite',     'Aceite de oliva',      'a thin glossy drizzle of extra virgin olive oil forming a loose spiral ring'],
      ['mozzarella', 'Mozzarella fior di latte', 'melted fior di latte mozzarella spread in an irregular circle, glossy and slightly browned at the edges'],
      ['tomate',     'Tomate San Marzano',   'a smooth circular layer of crushed San Marzano tomato sauce with an uneven rim'],
      ['masa',       'Masa madre horneada',  'a baked round sourdough pizza base with a puffed leopard-spotted cornicione, no toppings']
    ]
  },

  taco: {
    id: 'taco-carnitas',
    name: 'Taco de carnitas',
    dish: 'a Mexican street taco',
    layers: [
      ['cilantro',  'Cilantro y cebolla',   'a small handful of chopped fresh coriander and diced white onion, loosely piled'],
      ['salsa',     'Salsa verde',          'a spoonful of green tomatillo salsa, glossy and slightly pooling'],
      ['aguacate',  'Aguacate',             'three thin slices of ripe avocado, fanned out'],
      ['carnitas',  'Carnitas',             'a pile of shredded slow-cooked pork carnitas with crisp browned edges'],
      ['tortilla',  'Tortilla de maiz',     'a single soft corn tortilla lying flat and slightly curled, warm and lightly charred in spots']
    ]
  },

  kebab: {
    id: 'kebab-ternera',
    name: 'Kebab de ternera',
    dish: 'a doner kebab',
    layers: [
      ['pan-top',   'Pan de pita (tapa)',   'the upper half of a warm pita bread, cut side down, lightly toasted'],
      ['salsa-ajo', 'Salsa de ajo',         'a white garlic yoghurt sauce drizzled in loose parallel lines'],
      ['cebolla',   'Cebolla y perejil',    'thin red onion rings tossed with flat-leaf parsley, loosely arranged'],
      ['tomate',    'Tomate en rodajas',    'four thin slices of ripe tomato, slightly overlapping in a row'],
      ['ternera',   'Ternera al asador',    'a generous pile of thinly shaved rotisserie beef doner meat with crisp caramelised edges'],
      ['lechuga',   'Lechuga juliana',      'a bed of finely shredded iceberg lettuce, loose and airy'],
      ['pan-base',  'Pan de pita (base)',   'the lower half of a warm pita bread opened flat, cut side up, lightly toasted']
    ]
  },

  burger: {
    id: 'burger-clasica',
    name: 'Hamburguesa clásica con queso',
    dish: 'a classic cheeseburger',
    note: 'El juego de referencia. Esta receta reproduce el contrato original.',
    layers: [
      ['top-bun',    'Pan brioche con sésamo', 'the top half of a glossy brioche bun with sesame seeds, domed side up'],
      ['bacon',      'Bacon crujiente',        'three strips of crisp streaky bacon, slightly rippled and overlapping'],
      ['tomato',     'Tomate en rodaja',       'two thick slices of ripe beef tomato, side by side'],
      ['cheese',     'Cheddar fundido',        'a square slice of melted cheddar draping with soft folded edges'],
      ['patty',      'Carne a la brasa',       'a thick flame-grilled beef patty with a dark seared crust'],
      ['sauce',      'Salsa de la casa',       'a wide flat swoosh of creamy burger sauce'],
      ['onion',      'Cebolla roja',           'a few thin raw red onion rings, loosely separated'],
      ['lettuce',    'Lechuga fresca',         'two ruffled green lettuce leaves, loose and airy'],
      ['bottom-bun', 'Pan base',               'the bottom half of a brioche bun, cut side up, lightly toasted']
    ]
  },

  poke: {
    id: 'poke-atun',
    name: 'Poke de atún',
    dish: 'a Hawaiian poke bowl',
    layers: [
      ['sesamo',   'Sésamo y cebollino',  'a light scattering of black and white sesame seeds with thin chive rings'],
      ['aguacate', 'Aguacate',            'half an avocado sliced into a fan'],
      ['atun',     'Atún rojo marinado',  'cubes of marinated raw red tuna, glossy, loosely piled'],
      ['edamame',  'Edamame y wakame',    'bright green edamame beans mixed with dark wakame seaweed'],
      ['arroz',    'Arroz de sushi',      'a rounded bed of seasoned sushi rice']
    ]
  },

  /* ------------------------------------------------------ mas alla de la comida

     El motor apila en UN eje, de arriba abajo. Todo lo que se despiece asi entra sin
     tocar una linea: reloj, movil, portatil, auriculares, zapatilla, cosmetica.

     Lo que NO entra bien:
       · un anillo — dos o tres piezas, por debajo del minimo de 3 capas del motor,
         asi que cae al modo heroe anotado (que sigue siendo una ficha correcta);
       · cualquier cosa cuya gramatica natural sea lateral y no vertical. Las gafas
         estan al limite: se despiezan en vertical y funcionan, pero es el caso mas
         flojo del juego y conviene saberlo antes de invertir en generar. */

  reloj: {
    id: 'reloj-automatico',
    name: 'Reloj automático',
    product: 'watch',
    profile: 'product',
    dish: 'a mechanical wristwatch head without strap',
    layout: {targetStackHeight: 1.0, gapFraction: 0.004},
    layers: [
      ['cristal',   'Cristal de zafiro',   'a single round sapphire watch crystal, clear glass disc with a polished bevelled edge'],
      ['bisel',     'Bisel',               'a brushed steel watch bezel ring, empty in the centre'],
      ['esfera',    'Esfera y agujas',     'a watch dial with applied indices and three hands, detached and lying flat'],
      ['movimiento','Movimiento',          'an exposed mechanical watch movement with visible gears, balance wheel and jewels'],
      ['junta',     'Junta de estanqueidad','a thin red rubber gasket ring for a watch case'],
      ['caja',      'Caja y fondo',        'a brushed steel watch case body seen from above, empty, with the screw-down case back beside it']
    ]
  },

  zapatilla: {
    id: 'zapatilla-running',
    name: 'Zapatilla de running',
    product: 'sneaker',
    profile: 'product',
    dish: 'a running sneaker',
    layout: {targetStackHeight: 1.05},
    layers: [
      ['cordones',  'Cordones',        'a pair of flat woven shoelaces loosely coiled'],
      ['upper',     'Upper de malla',  'the knitted mesh upper of a running shoe, detached and flattened, no sole'],
      ['plantilla', 'Plantilla',       'a foam insole seen from above'],
      ['mediasuela','Mediasuela',      'a thick foam midsole slab of a running shoe'],
      ['suela',     'Suela de caucho', 'the rubber outsole of a running shoe with a moulded tread pattern, tread facing down']
    ]
  },

  movil: {
    id: 'movil-smartphone',
    name: 'Smartphone',
    product: 'phone',
    profile: 'product',
    dish: 'a modern smartphone',
    layout: {targetStackHeight: 0.95, gapFraction: 0.006},
    layers: [
      ['pantalla',  'Pantalla OLED',     'a rectangular OLED phone display panel, detached, screen facing up, thin flex cable folded behind'],
      ['marco',     'Marco de aluminio', 'an empty aluminium phone mid-frame chassis, rectangular ring with cutouts'],
      ['placa',     'Placa lógica',      'a compact green phone logic board with chips and connectors'],
      ['bateria',   'Batería',           'a flat rectangular lithium phone battery pouch with a short connector cable'],
      ['tapa',      'Tapa trasera',      'the rear glass panel of a phone with a camera cutout, inner side up']
    ]
  },

  gafas: {
    id: 'gafas-sol',
    name: 'Gafas de sol',
    product: 'eyewear',
    profile: 'product',
    /* El caso mas flojo del juego: su gramatica natural es lateral. Se despiezan en
       vertical y funcionan, pero con menos naturalidad que un reloj. */
    dish: 'a pair of sunglasses',
    layout: {targetStackHeight: 0.85, gapFraction: 0.008},
    layers: [
      ['lentes',   'Lentes polarizadas', 'two tinted oval sunglass lenses lying side by side, detached from any frame'],
      ['frontal',  'Frontal de acetato', 'the front piece of an acetate sunglasses frame with two empty lens openings'],
      ['bisagras', 'Bisagras',           'two small metal eyewear hinges with tiny screws'],
      ['varillas', 'Varillas',           'a pair of acetate sunglasses temple arms lying parallel']
    ]
  },

  tiramisu: {
    id: 'tiramisu',
    name: 'Tiramisú',
    dish: 'a slice of tiramisu',
    layers: [
      ['cacao',      'Cacao espolvoreado', 'a fine even dusting of dark cocoa powder forming a soft rectangular veil'],
      ['mascarpone', 'Crema de mascarpone','a smooth thick layer of mascarpone cream with a softly rippled top'],
      ['bizcocho',   'Bizcocho al café',   'a layer of coffee-soaked savoiardi ladyfinger biscuits laid side by side'],
      ['mascarpone2','Segunda crema',      'a second smooth layer of mascarpone cream, slightly thinner'],
      ['base',       'Base de bizcocho',   'a bottom layer of coffee-soaked ladyfinger biscuits, darker and denser']
    ]
  }
};

/* ======================================================================== salida */

const slug = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const profileOf = r => r.profile || 'food';

function prompt(recipe, layer) {
  const [, , subject] = layer;
  /* El sujeto primero y el invariante despues, siempre en el mismo orden: los modelos
     pesan mas el principio, y lo que cambia entre capas es el sujeto. */
  return `${subject}, ${invariantFor(profileOf(recipe))}`;
}

function heroPrompt(recipe) {
  return `${recipe.dish}, fully assembled and photographed as a whole, ${invariantFor(profileOf(recipe))}`;
}

function layersJson(recipe) {
  const out = {
    id: recipe.id,
    name: recipe.name,
    product: recipe.product || Object.keys(RECIPES).find(k => RECIPES[k] === recipe) || '',
    layers: recipe.layers.map(([id, label]) => ({ file: `layer-${id}.png`, label }))
  };
  /* Los parametros de apilado por defecto estan calibrados para comida a 45 grados.
     Un reloj son discos finos y un movil laminas planas: si el juego los necesita
     distintos, viajan CON EL, no como constante global del ingestor. */
  if (recipe.layout) out.layout = recipe.layout;
  return out;
}

function render(key, recipe, {json = false} = {}) {
  if (json) {
    return JSON.stringify({
      recipe: key, id: recipe.id, name: recipe.name,
      profile: profileOf(recipe),
      invariant: invariantFor(profileOf(recipe)), negative: negativeFor(profileOf(recipe)),
      hero: {file: 'hero.png', prompt: heroPrompt(recipe)},
      layers: recipe.layers.map(([id, label], i) => ({
        order: i, file: `layer-${id}.png`, label, prompt: prompt(recipe, recipe.layers[i])
      })),
      layersJson: layersJson(recipe)
    }, null, 2);
  }

  const dir = `assets/anatomy/source/${recipe.id}/layers/`;
  const out = [];
  out.push(`ANATOMY LAYER SET  ·  ${recipe.name}  (${recipe.layers.length} capas)`);
  out.push('='.repeat(78));
  if (recipe.note) out.push(`\n${recipe.note}`);
  out.push(`\nDestino:  ${dir}`);
  out.push(`Orden:    de ARRIBA hacia ABAJO, tal y como se apilan.\n`);
  out.push('-'.repeat(78));
  out.push('\nNEGATIVE PROMPT (el mismo para todas):\n');
  out.push(`  ${negativeFor(profileOf(recipe))}\n`);
  out.push('-'.repeat(78));

  recipe.layers.forEach(([id, label], i) => {
    out.push(`\n[${String(i + 1).padStart(2, '0')}/${recipe.layers.length}]  ${label}`);
    out.push(`fichero: layer-${id}.png\n`);
    out.push(prompt(recipe, recipe.layers[i]));
    out.push('');
  });

  out.push('-'.repeat(78));
  out.push(`\n[HERO]  ${recipe.name} montado  ·  fichero: hero.png`);
  out.push('Opcional: lo usa el modo de heroe anotado y la ficha de producto.\n');
  out.push(heroPrompt(recipe));
  out.push('');
  out.push('-'.repeat(78));
  out.push(`\n${METHOD}\n`);
  out.push('-'.repeat(78));
  out.push(`\nlayers.json  ->  assets/anatomy/source/${recipe.id}/layers.json\n`);
  out.push(JSON.stringify(layersJson(recipe), null, 2));
  return out.join('\n');
}

/* ========================================================================== main */

const args = process.argv.slice(2);
const key = args.find(a => !a.startsWith('--'));
const json = args.includes('--json');
const write = args.includes('--write');

if (!key) {
  console.log('ANATOMY LAYER PROMPT KIT\n');
  console.log('Recetas disponibles:\n');
  for (const [k, r] of Object.entries(RECIPES)) {
    const tag = (r.profile || 'food') === 'food' ? 'comida  ' : 'producto';
    console.log(`  ${k.padEnd(11)} ${tag}  ${String(r.layers.length).padStart(2)} capas   ${r.name}`);
  }
  console.log('\n  node scripts/anatomy-prompt-kit.mjs <receta> [--json] [--write]\n');
  console.log('Para un producto que no este en la lista: copia la receta mas parecida,');
  console.log('cambia las lineas de sujeto y deja el bloque invariante INTACTO.');
  console.log('Ese bloque es lo que hace que las capas encajen entre si.\n');
  process.exit(0);
}

const recipe = RECIPES[key];
if (!recipe) {
  console.error(`no existe la receta "${key}". Disponibles: ${Object.keys(RECIPES).join(', ')}`);
  process.exit(1);
}

console.log(render(key, recipe, {json}));

if (write) {
  const dir = path.join(SRC, recipe.id);
  fs.mkdirSync(path.join(dir, 'layers'), {recursive: true});
  const file = path.join(dir, 'layers.json');
  if (fs.existsSync(file)) {
    console.error(`\n${path.relative(ROOT, file)} ya existe — no se sobrescribe.`);
    process.exit(1);
  }
  fs.writeFileSync(file, JSON.stringify(layersJson(recipe), null, 2) + '\n');
  console.error(`\nescrito ${path.relative(ROOT, file)}`);
  console.error(`deja los PNG en ${path.relative(ROOT, path.join(dir, 'layers'))} y ejecuta:`);
  console.error('  node scripts/ingest-anatomy-layers.mjs --check');
}
