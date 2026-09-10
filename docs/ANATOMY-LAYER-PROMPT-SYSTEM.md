# ANATOMY LAYER PROMPT SYSTEM

> Cómo generar las capas de **cualquier** producto para que Class 26 · Anatomy Theater
> funcione con él. Pizza, taco, kebab, postre, cóctel — la mecánica es la misma; lo que
> cambia es una línea por capa.

Complementa [`CLASS-26-ANATOMY-THEATER.md`](CLASS-26-ANATOMY-THEATER.md).

---

## 1. El ciclo completo

```text
receta  ->  prompts  ->  imágenes  ->  --check  ->  ingest  ->  runtime
   │           │            │            │           │           │
   │           │            │            │           │           └─ el motor ya lo pinta
   │           │            │            │           └─ registro medido + manifiesto
   │           │            │            └─ valida sin escribir; dice QUÉ regenerar
   │           │            └─ el modelo que uses
   │           └─ node scripts/anatomy-prompt-kit.mjs <producto>
   └─ una entrada en RECIPES, o copiar la más parecida
```

Ningún paso toca código del motor. Añadir pizza es añadir una carpeta.

---

## 2. Por qué hay un contrato, y de dónde sale

El apilado **no** funciona porque las imágenes sean bonitas. Funciona porque las N capas
comparten cámara, distancia, lente, luz y lienzo.

Si la lechuga está fotografiada dos grados más alta que el queso, el apilado se rompe y
**no hay registro que lo arregle**: el ingestor mide *dónde está* el contenido, no puede
reorientar un objeto.

Los umbrales de abajo están **medidos** sobre el juego de referencia de nueve capas, no
opinados:

| Invariante | Medido en la referencia | Lo que exige el validador |
|---|---|---|
| Lienzo idéntico en todo el juego | 1536×1024 en las 9, sin excepción | **igualdad estricta** |
| Objeto centrado | `cx` 0.479–0.502 → desvío máx. 2.1% | ≤ 3% |
| Ancho del contenido | 68–92% del lienzo | 55–95% |
| Capas por juego | 9 | ≥ 3 (con menos, el motor cae a héroe anotado) |
| Canal alfa | real en las 9 | obligatorio |
| Aspecto del contenido | 1.30–2.80 | libre — el motor lo absorbe |
| Cobertura alfa | 20–59% | libre — mucho aire es lo normal |

El fallo más común y el más caro es el primero: un modelo devuelve una capa a otra
resolución y **el juego entero deja de registrar**. Por eso se comprueba antes que nada.

---

## 3. El bloque invariante

Es la pieza central del sistema. Va **palabra por palabra igual** en los N prompts de un
juego; lo único que cambia entre capas es la línea del sujeto.

```text
isolated on a fully transparent background, no backdrop, no surface, no scene,
single elevated three-quarter view, camera 45 degrees above the horizon, dead centre,
same camera, same lens, same distance and same framing as the rest of the set,
soft neutral studio lighting from the upper left, identical across the set,
subject horizontally and vertically centred in the frame,
subject occupies about 80 percent of the frame width,
generous empty margin on all four sides,
photorealistic food photography, crisp focus edge to edge, natural colour,
3:2 aspect ratio, 1536 by 1024 pixels
```

**Negative prompt**, el mismo para todas:

```text
background, backdrop, table, surface, plate, board, tray, drop shadow on a surface,
reflection, text, logo, watermark, hands, cutlery, garnish not requested,
multiple items, collage, top-down view, side view at eye level, tilted horizon,
cropped subject, subject touching the frame edge, vignette, blur
```

> **Por qué esto es un script y no una lista en un documento.** Escrito a mano nueve
> veces, alguien cambia una coma en la quinta y el juego se descuadra sin que nadie sepa
> por qué. Emitido por `scripts/anatomy-prompt-kit.mjs`, no puede pasar.

---

## 4. Método de generación

El orden importa, y no es capricho:

1. **Genera primero la capa base** (la última de la lista: pan base, masa, tortilla,
   arroz). Es la más grande y la que fija la cámara del juego.
2. **Usa esa imagen como referencia** de cámara y luz para las demás. Casi todos los
   modelos actuales aceptan una imagen de referencia, y es literalmente la diferencia
   entre *un juego* y *nueve fotos parecidas del mismo tema*. Con modelos que aceptan
   semilla, fija la misma.
3. Genera el resto **en la misma sesión**, cambiando sólo la línea del sujeto.
4. Si el modelo no devuelve alfa real, **recorta el fondo después**. Sin canal alfa la
   capa no se apila: el validador la rechaza.
5. **Valida antes de invertir más tiempo.** Regenera sólo lo que salga marcado.
6. Cuando pase, ingesta de verdad.

```bash
node scripts/anatomy-prompt-kit.mjs pizza --write
```

```bash
node scripts/ingest-anatomy-layers.mjs --check
```

```bash
node scripts/ingest-anatomy-layers.mjs
```

### Qué dice el validador cuando algo va mal

```text
[pizza-margarita] 5 capas · pizza
  CONTRATO DE ASSETS - regenera estas capas:
    *                  lienzos distintos en el juego: 1536x1024, 1024x1024
    mozzarella         descentrado 12.5% (maximo 3%)
    aceite             objeto pequeno: ocupa el 20% del ancho (minimo 55%)
```

Lo útil no es «el juego está mal»: es **«regenera estas dos»**.

---

## 5. Recetas incluidas

```bash
node scripts/anatomy-prompt-kit.mjs
```

| Receta | Capas | Producto |
|---|---|---|
| `pizza` | 5 | Pizza Margarita — albahaca · aceite · mozzarella · tomate · masa |
| `taco` | 5 | Taco de carnitas — cilantro · salsa · aguacate · carnitas · tortilla |
| `kebab` | 7 | Kebab de ternera — pita · salsa de ajo · cebolla · tomate · ternera · lechuga · pita base |
| `burger` | 9 | La referencia, reproducida desde el contrato |
| `poke` | 5 | Poke de atún — sésamo · aguacate · atún · edamame · arroz |
| `tiramisu` | 5 | Tiramisú — cacao · mascarpone · bizcocho · mascarpone · base |

### Un producto que no está en la lista

Copia la receta más parecida en `RECIPES` dentro de `scripts/anatomy-prompt-kit.mjs`,
cambia las líneas de sujeto y **deja el bloque invariante intacto**.

Tres reglas al escribir una receta:

- **El orden es autoría.** De arriba abajo, tal y como se apila. Nadie puede *medir* que
  el pan va encima de la carne.
- **Una capa = un ingrediente.** Si dos ingredientes siempre van juntos y nunca se
  explican por separado, son una capa (por eso la referencia tiene `onion-tomato`).
- **La capa base sostiene el conjunto.** Suele ser la más ancha y es la que fija la
  cámara.

Cuántas capas: **entre 4 y 9**. Con menos de 3 el motor cae a héroe anotado; con más de 9
el apilado se aplasta tanto que las capas dejan de leerse.

---

## 6. Dónde caen los ficheros

```text
assets/anatomy/source/<dish-id>/
├── layers.json          ← lo escribe --write; el orden y las etiquetas
├── hero.png             ← opcional: el producto montado
└── layers/
    ├── layer-<id>.png   ← los másters, inmutables
    └── ...

assets/anatomy/runtime/<dish-id>/   ← lo genera el ingestor, no se edita
assets/anatomy/layers-manifest.json ← el registro medido
```

`layers.json`:

```json
{
  "id": "pizza-margarita",
  "name": "Pizza Margarita",
  "product": "pizza",
  "layers": [
    { "file": "layer-albahaca.png", "label": "Albahaca fresca" }
  ]
}
```

**Los platos se descubren.** Cualquier carpeta con un `layers.json` es un plato: añadir
pizza no toca el ingestor ni el motor.

---

## 7. Del asset al producto real

El ingestor deja el registro en el manifiesto, pero eso es la **ruta de revisión**. Para
que un plato real del restaurante tenga anatomía:

1. Panel **Anatomía** del Studio → elegir el plato de `dishes[]`.
2. Añadir una capa por ingrediente, en orden.
3. Subir el recorte o elegirlo de la Media Library.

Ahí las capas no necesitan pasar por el ingestor: **el motor las mide en el navegador**,
compensando el relleno transparente. El ingestor es para juegos versionados en el repo;
un restaurante no ejecuta scripts.

---

## 8. Lo que NO hay que hacer

```text
NO cambiar el bloque invariante entre capas del mismo juego
NO mezclar resoluciones — es el fallo que más caro sale
NO generar con fondo y confiar en que el motor lo quite: exige alfa real
NO meter plato, tabla o mantel salvo que la capa SEA la base
NO poner la sombra proyectada sobre una superficie: viaja con la capa y delata el montaje
NO recortar el sujeto contra el borde: el ingestor necesita margen para medir
NO usar vista cenital ni de perfil — rompe la ilusión de pila
NO editar el ingestor para añadir un producto
```

---

## 9. Por qué el sistema es así y no de otra forma

La referencia auditada (`thebuggeddev/burger`) resolvió su apilado con **ocho constantes
calibradas a ojo** contra una captura a 1920: `w`, `top`, `cx` y `sy` por capa. Funciona
exactamente para esas ocho imágenes y para ese ancho.

Aquí la cadena es al revés: **el contrato manda sobre la generación, y la medida manda
sobre el layout**. El generador produce capas que cumplen el contrato; el ingestor mide lo
que llegue y deriva el apilado. Cambiar un asset, añadir una capa o cambiar de producto no
obliga a recalibrar nada a mano — sólo a volver a ejecutar.

Eso es lo que convierte una demo de hamburguesa en una mecánica de plataforma.
