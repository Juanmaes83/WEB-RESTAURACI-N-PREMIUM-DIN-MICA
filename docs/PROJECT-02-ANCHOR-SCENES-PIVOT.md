# PROJECT 02 — PIVOT TO PRECOMPOSED ANCHOR SCENES

> **STATUS: REAL MASTER SCENES INTEGRATED — READY FOR HUMAN VISUAL REVIEW.**
> El bloqueo queda levantado: las escenas maestras reales están integradas,
> auditadas, registradas y desplegadas. El set proxy ha salido de la demo.
> Este documento no aprueba nada. Aprueba Juanma tras revisión visual.
> Rama: `feat/anchor-swap-scenes-lab`, creada desde `main` con Project 01 integrado.
> No se ha mergeado a `main`. La exploración previa queda archivada, sin mergear, en
> `feat/anchor-swap-lab`, y su documentación sigue en `docs/PROJECT-02-ANCHOR-SWAP.md`.

---

## 1. Por qué se pivota

La primera implementación de Project 02 ensamblaba la mano en tiempo de ejecución a
partir de tres capas: `anchor-back` → producto → `anchor-front`. Técnicamente
funcionaba —59/59 en tests, CI verde— y la revisión humana la rechazó:

> la mano separada en capas no convence; se percibe **entrecortada**; el ensamblaje
> BACK / PRODUCT / FRONT no vende un resultado premium; la ilusión no está conseguida.

El diagnóstico era correcto y la causa es estructural, no de ajuste. Un ensamblaje en
vivo no puede tener las dos cosas que hacen creíble una mano sujetando algo:

1. **la sombra de contacto** donde el objeto se apoya en la palma;
2. **la sombra que las yemas proyectan sobre el objeto**.

Ninguna se puede componer por z-index. Y hay una tercera, que descubrimos al hacer el
pivot: la línea por donde se recortaron los dedos del master, al desenfocarse como
sombra, dibuja **una banda recta atravesando la palma** — la delación definitiva de que
la escena está montada.

Por eso no se ha intentado salvar el enfoque anterior con más máscaras, más offsets ni
más oclusión. Se ha cambiado el modelo.

## 2. El nuevo objetivo visual

Ya no vendemos *una mano partida con un producto incrustado entre capas*.
Vendemos **escenas precompuestas**: una imagen maestra cerrada por producto, que ya
contiene la misma mano, el mismo encuadre, el mismo plano y la misma iluminación. Sólo
cambian el objeto, el universo cromático y el copy.

### Por qué eso hace que la transición funcione

Ésta es la propiedad central del pivot, y es la razón por la que el resultado es a la
vez más simple y más convincente:

> Como la mano es **la misma en todas las escenas**, un barrido de bordes suaves entre
> dos escenas es **invisible sobre la mano** y sólo se ve donde difieren el objeto y el
> fondo.

El ancla se percibe perfectamente continua mientras el producto y el mundo cambian
alrededor. No hay que fijar la mano con código: la mano no se mueve porque **no se
mueven las escenas**. El efecto se consigue quitando maquinaria, no añadiéndola.

Corolario de diseño: las escenas tienen `rate 0`. Desplazarlas movería el ancla. El
movimiento espacial lo aporta el decor, que es de motor y sí puede viajar.

## 3. Arquitectura

Contrato heredado de Project 01, sin cambios:

```text
ORBITAL ENGINE (app-v4 / class4-runtime-guard)   ← ESTADO AUTORITATIVO
        │  #dish-counter = única fuente de verdad del índice activo
        │
        ├── class6-product.js / class6-detail-bridge.js   ← ficha real
        ├── class8-depth-carousel.js                      ← Project 01 (aprobado)
        └── class9-anchor-scenes.js                       ← SOLO la coreografía visible
```

- Ni segundo índice, ni segundo modelo de plato, ni ficha duplicada, ni persistencia propia.
- `index.html` **no se ha tocado**: el runtime se carga desde `class4-runtime-guard.js`.
- Preset en Studio: `#motion-orbital-style` → **Anchor Scenes**. Sin panel de
  configuración: primero el efecto.

Nuevos: `class9-anchor-scenes.js`, `styles-v9.css`, `scripts/build-anchor-scenes.mjs`,
`scripts/audit-anchor-scenes.mjs`, `tests/class9-anchor-scenes-e2e.mjs`,
`tests/record-anchor-scenes-video.mjs`.
Modificados: `class4-runtime-guard.js` (loader aditivo) y `class4-config.js`
(`dish.anchorScene`).

## 4. Contrato de assets

```js
dish.anchorScene = {
  image,        // la escena maestra: mano + objeto + fondo + luz, ya compuesta
  hit,          // { x, y, w, h } — la región del objeto, en fracciones de la escena
  registration  // { scale, offsetX, offsetY, objectPosition } — ver abajo
}
```

`registration` es el contrato que hace personalizable el sistema. **No se hornea en los
píxeles**: una escena que cae unos píxeles desplazada se corrige con sus propios números,
así que sustituir la fotografía es un cambio de datos y no de código. El motor los aplica
como custom properties (`--sc-reg-x/y/s`) que **componen** con la colocación de la caja
en vez de reemplazarla — un `transform` en línea aplastaría la diferencia entre desktop y
móvil. `objectPosition` es el centro del objeto, en las mismas fracciones.

`word`, `accent`, `backgroundColor`, `foregroundDecor` y `backgroundDecor` se heredan de
`dish.depthCarousel`, que Project 01 ya definió: un proyecto no describe su paleta dos
veces. `anchorScene` gana sobre `depthCarousel` campo a campo, así que un restaurante
puede dar a este preset otra palabra u otro acento si quiere.

```text
assets/anchor-scenes/
├── source/     ← aquí van las fotografías maestras reales
├── runtime/    ← lo que carga el motor
├── audit/      ← hoja comparativa + diff de la región del ancla + JSON
└── scenes-manifest.json
```

**Fallback**: sin `anchorScene.image` el motor pinta el mundo derivado del acento más el
recorte del objeto, sin mano. Un proyecto sin la fotografía sigue renderizando algo
coherente en vez de romperse.

## 5. Los assets reales — EL BLOQUEO LEVANTADO

Las seis fotografías maestras están en **`MANO+OBJETO/`**, todas a **1122×1402**: una
mano, una pose, un fondo, una luz, un bol de cerámica, y la comida cambiando dentro.
Es exactamente el material para el que se diseñó el pivot.

Las consume `scripts/ingest-anchor-scenes.mjs`, que mide cada fuente y decide cuáles
pertenecen **a la misma toma** — una pregunta más estricta que si cada una es una buena
fotografía. Cinco lo son.

### Escenas seleccionadas (5)

| # | Fuente | Plato | Runtime | registration offsetX / offsetY / scale |
|---|---|---|---|---|
| 1 | `affdb8f4-8d6…` | Gamba roja salvaje | `scene-01-gamba-roja.webp` | 0.000 / 0.000 / 1 |
| 2 | `5faa56e1-c9e…` | Atún rojo / Naranja sanguina | `scene-02-atun-rojo.webp` | 0.000 / 0.000 / 1 |
| 3 | `e8522199-d6d…` | Alcachofa a la brasa | `scene-03-brasa-pulpo.webp` | 0.000 / 0.000 / 1 |
| 4 | `88a2a7a6-51f…` | Lubina salvaje | `scene-04-lubina-salvaje.webp` | 0.000 / 0.000 / 1 |
| 5 | `c4e5577e-ae4…` | Presa ibérica | `scene-05-presa-iberica.webp` | 0.000 / 0.000 / 1 |

Las cinco salieron con **offset 0 y escala 1**: la mano ya venía registrada al píxel.
El solver existe igualmente, y sus números viven en el manifest, para el set que no lo
esté.

### Escena excluida (1) — y por qué

**`22285005-1749-47d7-9274-a45ad6f267f1 (1).png` · Cítricos y miel quemada.** La medición:

| | Excluida | Las cinco entre sí |
|---|---:|---:|
| Ancho del bol | **646 px** (−9.4%) | 711–728 px (±2.3%) |
| Altura del bol | **486** (9.0% del cuadro más abajo) | 360–398 |
| Zona de los dedos · diff media | **24.34** | 11.31–17.72 |
| Zona de los dedos · píxeles movidos | **14.03%** | 3.65–7.18% |

El mismo bol de cerámica cambiando de tamaño un 9.4% entre dos estados de reposo no se
lee como «otro plato»: se lee como **que la cámara se ha movido**. Y no se puede
registrar: escalar la imagen un 11% para cuadrar el bol escalaría **la mano** un 11%.

Lo importante es **qué la detectó**. Palma y muñeca son idénticas al píxel en las seis
(3–9/255 de media, menos del 0.6% de píxeles), así que una auditoría que mirara sólo
ahí la habría aprobado. Los **dedos** la delatan: envuelven el objeto, así que un objeto
de otro tamaño los mueve. Ésa es la zona que decide.

Queda registrada en el manifest bajo `excluded`, con sus medidas y su motivo. No se
descarta en silencio y no se fuerza porque el auditor diga PASS.

**Consecuencia:** el plato 06 (`Cítricos y miel quemada`, el postre) es justamente el
que retrataba esa fotografía, así que se queda sin escena. El preset **no lo navega**
—ver §16.3— en lugar de mostrarlo con el fallback sin mano.

### Sustituir o ampliar el set

Se deja el archivo en `MANO+OBJETO/`, se añade a la tabla de curación de
`ingest-anchor-scenes.mjs` y se ejecuta el ingest más la auditoría. Nada más. El
generador proxy sigue existiendo como *dev fallback* para un proyecto sin sesión de
fotos, pero ahora escribe en `assets/anchor-scenes/proxy-dev/` y **no puede sobrescribir
el set real** ni el manifest que lee el motor.

## 6. Auditoría de consistencia entre escenas

La auditoría de la mano partida (¿reconstruyen BACK+FRONT el MASTER?) ya no aplica.
La pregunta ahora es la que decide si el swap vende: **¿parecen la misma toma?**

`scripts/audit-anchor-scenes.mjs` comprueba lo que de verdad rompe la ilusión:

| Control | Tolerancia | Set proxy | **Fotografía real** |
|---|---:|---:|---:|
| Mismo lienzo y dimensiones | idéntico | 6 @ 1200×1500 | **5 @ 1122×1402 · OK** |
| Misma orientación | idéntica | portrait | **portrait · OK** |
| Dispersión de iluminación (luma media) | ≤ 0.10 | 0.0537 | **0.0229** |
| Región del ancla · diferencia media | ≤ 26 / 255 | 9.37 | **6.75** |
| Región del ancla · píxeles alterados | ≤ 5.5% | 0.00% | **0.20%** |
| Escala del objeto · dispersión | ≤ 0.34 | 0.0914 | **0.0234** |
| Centro del objeto · dispersión | ≤ 0.06 | 0.0008 | **0.0271** |

La fotografía real gana al proxy en todas las medidas que importan. La escala del
objeto ya no es un parámetro que yo elegí al generar: es **el ancho del borde del bol
medido en la foto**, así que 0.0234 dice que el mismo recipiente se lee del mismo
tamaño en las cinco tomas.

La **región del ancla** es el tercio inferior, donde viven muñeca y palma y donde el
objeto nunca llega: si la mano se hubiera movido o la luz hubiera cambiado entre tomas,
se ve ahí y en ningún otro sitio. 9.37 sobre 255 es lo que hace que el barrido sea
imperceptible sobre la mano.

Salidas: `_scenes-sheet.png` (hoja comparativa), `anchor-region-diff.png` y
`scenes-audit.json`. La auditoría **falla con exit 1** si una escena entra desalineada,
y el CI la ejecuta.

## 6b. Dos aristas que la geometría no delataba

Las dos escenas se pintaban como imagen de fondo dentro de un `div` a sangre. En la
revisión visual del fotograma al 50% aparecían **dos verticales duras** cruzando el
cuadro, en x≈463 y x≈1241. Son exactamente los bordes de la propia imagen: con
`background-size:auto 108%` sobre un escenario de 900px la banda mide 777.6px de ancho y,
posicionada al 70%, empieza en 463. La máscara radial que debía difuminarla se mide
contra el `div` —el viewport— y no contra la imagen, así que su caída nunca llegaba al
borde.

El sujeto es ahora **una caja con la relación de aspecto de la imagen**
(`left:70%` + `translateX(-70%)` reproduce `background-position:70%` exactamente), con un
degradado de bordes sólo lateral: arriba y abajo los recorta el escenario, y desvanecer
el inferior desvanecería la muñeca. Y el baño usa **la misma geometría, escalada y
desenfocada**, no un `cover`: donde el sujeto se apaga, el baño muestra píxeles de la
misma imagen, así que el empalme no tiene por dónde escalonarse.

El segundo borde era invisible en los tests. La región clicable del objeto se expresa en
fracciones de la imagen de escena, y **tanto el motor como su test la leían de esa misma
caja equivocada**: coincidían entre sí, apuntando los dos a un sitio que no era el objeto
—pasaba porque la región es amplia y solapaba por suerte—. Al corregir la caja se
corrigen los dos a la vez. Es el mismo aprendizaje que Project 01 dejó escrito: la
geometría de acuerdo consigo misma no es prueba visual.

## 7. Modelo de capas

```text
L0 .sc-decor-back   ingredientes de fondo + atmósfera        rate .35
L2 .sc-scene-a      escena saliente (opaca)                  rate 0
L3 .sc-scene-b      escena entrante, revelada por máscara    rate 0
L4 .sc-word          lettering                                rate .55
L5 .sc-seam          la luz sobre la arista del barrido
L6 .sc-decor-front  ingredientes en primer plano             rate 1.20
L9 copy · controles · cursor
```

Cada escena es un envoltorio con dos capas: un **baño** a sangre de la misma imagen,
desenfocado, para que el mundo cromático llene el cuadro; y el **sujeto** contenido, para
que la mano no se recorte nunca. La máscara va en el envoltorio, así ambos se mueven
como uno.

El lettering va **delante** de las escenas: al ser imágenes opacas no existe un "detrás"
donde poner tipografía.

## 8. Modelo de progreso

```text
progress: 0 ─────────── 0.5 ─────────── 1
          reposo      crossover      confirmado
```

Lo gobierna el arrastre vertical. 0.25 es visualmente el 25%. Arrastrar hacia atrás lo
revierte de forma continua. El índice se compromete **en el crossover**, con histéresis
(0.55 al avanzar, 0.45 al retroceder), así el copy sigue al gesto y una reversión lo
descompromete. Al soltar: por debajo de 0.42 y sin velocidad, cancela; si no, completa.

Medido por el test, la arista recorre **-14 → 11 → 39 → 67 → 95 %** (0/.25/.5/.75/1).

## 9. Split de mundos

Aquí el pivot simplifica de verdad: **el split de mundos y el swap de escena son el
mismo movimiento**. Cada escena maestra lleva su propio mundo cromático, así que
revelar B sobre A hace convivir los dos mundos y los dos objetos con una sola máscara.

`mask-image: linear-gradient()` con una banda suave del 14% de la altura y una
inclinación de 4°, más una fina línea de acento sobre la costura que sólo aparece
durante el gesto. Nada de crossfade global: la mezcla se limita a esa banda, y sobre la
mano —píxeles equivalentes— es invisible. Sin barro cromático.

### Lo que cambió con la fotografía real

Las seis fotografías comparten **el mismo fondo beige de estudio**. Con el set proxy cada
escena traía su propio universo cromático y el barrido hacía convivir dos mundos; con las
reales, el mundo **no cambia con la escena**: cambia el objeto.

Eso no es una pérdida, es la misión (§20: *misma mano, mismo plano, objeto que cambia*).
Y el cambio de universo sigue existiendo, sólo que lo aporta la capa de motor y no el
píxel: el acento por plato, el lettering, la atmósfera teñida y el decor. Es la
separación correcta — la fotografía describe el producto, el motor describe la marca.

## 10. Copy

Un solo bloque, nunca dos superpuestos: 100% → ~0% en el crossover → 100%, con la
atención en la escena y el cambio de mundo. Título, meta y descripción los sigue
escribiendo el motor base; precio, ingredientes e indicadores los escribe este preset
desde `#dish-counter`, la misma fuente, así que no pueden discrepar.

## 11. Decor

Concepto validado en Project 01, mismo modelo de datos: un grupo por producto y por
capa, con atmósfera teñida por el acento del plato. Rates propios (`.35` detrás, `1.20`
delante) y entrada/salida con su producto. Son el movimiento espacial que las escenas
deliberadamente no aportan. El test comprueba que **cambian al cambiar el producto**.

## 12. Detail bridge

La región del objeto dentro de la escena la registra el generador por plato
(`anchorScene.hit`), así que el área clicable es el objeto, no la sección entera. Abre
`RestaurantClass6Detail.open()` — la ficha real. No hay un segundo modal.

## 13. Desktop / Mobile / Reduced motion

- **Desktop**: escena a la derecha, copy en columna editorial izquierda con caída de luz
  propia, controles abajo a la izquierda, lettering en la banda superior.
- **Mobile**: composición propia — la escena se centra, copy y controles pasan al flujo
  normal, el scrim se reorienta a 3° porque el texto va debajo. El encuadre está
  **medido, no heredado**: al 104% de la sección el sujeto salía de 600px de ancho en un
  viewport de 390 y el bol se cortaba por los dos lados con el borde detrás del header.
  Al 66%/19% el bol entra completo (23–361 px de ancho, 86–364 de alto) y la muñeca
  sigue corriendo por detrás del copy.
- **Reduced motion**: la transición se resuelve casi instantánea; escena, copy,
  navegación y ficha siguen disponibles. Verificado por test.

## 14. Tests

**70/70** en desktop 1440×900, móvil 390×844 y reduced motion.

Diez comprobaciones nuevas son de **procedencia**, porque un proxy que sobreviviera por
accidente pasaría todas las puertas geométricas mostrando lo que no es: cada escena en
pantalla viene de `assets/anchor-scenes/runtime/`, el set cableado es el que declara el
manifest, el manifest es el real y trazado a ficheros que existen en `MANO+OBJETO/`, no
hay ningún asset no declarado en la carpeta de runtime, y cada escena pintada lleva su
registration. La cadena se afirma de punta a punta; no se supone.

Dos comprobaciones se hacen **sobre píxeles**, porque son las que deciden el pivot:

1. **El ancla es la misma entre escenas** — se cargan dos escenas consecutivas en un
   canvas y se mide la diferencia en la banda del ancla: 9.37/255 de media y 0% de
   píxeles alterados. Eso es lo que hace invisible el barrido sobre la mano.
2. **Los dos mundos conviven** — se capturan dos recortes del fondo, por encima y por
   debajo de la costura al 50%, y se exige que difieran entre sí y respecto al reposo.

El resto: el preset ya no monta una mano partida (0 capas heredadas en el DOM) · 4–6
escenas maestras cableadas · dos superficies de escena resueltas · lienzo común · ambas
escenas en escena al 50% · la luz de la costura aparece · el copy se aparta · el barrido
sigue al gesto · arrastrar hacia atrás revierte · un release cancelado no compromete
nada · uno completado sí · la escena sostenida cambia de verdad · arrastre y swipe
completan · el decor cambia con el producto · copy, precio e indicador describen el mismo
plato · la ficha real se abre desde el CTA y desde el objeto · sin overflow ·
**Project 01 sigue funcionando y se aparta** · **Orbital se restaura intacto** · Studio
abre · sin errores de consola.

Regresión verificada: `class8-depth-carousel-e2e` (114/114), `class5-complete-e2e`,
`class6-product-e2e`, `class7-editorial-flow-static`.

El grabador de vídeo **se niega a grabar si el preset activo no es éste y con las
escenas resueltas**: un vídeo del modo equivocado es un fallo, no evidencia, y ese error
ya nos costó una vez.

## 15. Evidencias

| | |
|---|---|
| Alineación | `tests/screenshots/anchor-scenes-real-alignment-sheet.png` — las 5 seleccionadas y la excluida, marcada |
| Capturas desktop | `anchor-scenes-desktop-0{1,2,3,4,5,6}-*.png` (idle · quarter · half · three-quarter · complete · detail) + `07-orbital-regression` |
| Capturas mobile | las equivalentes |
| Reduced motion | `anchor-scenes-reduced-motion.png` |
| Vídeo | `tests/video/anchor-scenes-desktop.webm` (19.4s) · `anchor-scenes-mobile.webm` (18.0s) |
| Escenas | `assets/anchor-scenes/audit/_scenes-sheet.png` |
| Auditoría | `assets/anchor-scenes/audit/scenes-audit.json` · `anchor-region-diff.png` |

## 16. Known issues

### Resueltos en esta iteración

- ~~Las escenas son proxy, no fotografía~~ → **integradas las reales** (§5).
- ~~En móvil el lettering queda casi oculto tras el header~~ → bajado y reescalado.
- ~~`goTo` a un índice lejano deja el contador un índice por detrás~~ → el anillo de
  navegación lo hizo exacto; verificado con `goTo(3/0/4/2)`, contador y `restIndex`
  coincidiendo siempre.
- ~~Borde vertical del rectángulo de la escena~~ → resuelto en la iteración anterior.

### Abiertos

1. **El plato 06 no es navegable en este preset.** Su única fotografía candidata es la
   excluida (§5), y un plato sin escena real dejaría caer la mano a mitad del barrido.
   El anillo lo salta: se navegan 5 de 6. El contador, que lo escribe el motor base y
   no este preset, sigue diciendo `01 / 06` … `05 / 06`, así que el `06` nunca aparece.
   Se cierra con **una foto más del postre, a la escala de la toma** — o tocando el
   modelo base, que no toca este proyecto.
2. **El contenido de la fotografía y el copy de la demo no siempre coinciden.** El menú
   de la demo es dato de Project 01 (invención de placeholder) y las fotos son producto
   real. Casan bien 01 gamba, 02 atún y 05 presa; 04 lubina recibe un crudo de otro
   pescado y 03 alcachofa recibe pulpo. Un restaurante real sustituye copy y escenas
   juntos, que es precisamente el contrato de §4 — pero conviene saberlo al mirar la
   demo.
3. **Los boles son todos el mismo bol.** Es lo que hace que el ancla funcione y, a la
   vez, lo que limita la variedad: cinco platos en el mismo recipiente. Una copa o un
   cucurucho en la misma mano serían otro salto de percepción.
4. **Una sola mano, una sola pose.** Las variantes B (mesa), C (copa) y D (utensilio)
   del documento maestro siguen sin implementar.
5. **Sin panel en Studio.** El preset se selecciona; no hay controles de dirección,
   intensidad ni encuadre de escena.
6. **La palabra no es bilingüe**, a diferencia del resto del copy de Clase 06.
7. **Sin traza de FPS en dispositivo real.** El motor es ligero —dos capas de imagen y
   una máscara— pero no está medido.

## 17. Qué falta para el cierre final

1. **La revisión visual humana.** Es lo único que queda por delante. El sistema está
   probado con las imágenes maestras reales, que era la condición para poder pedirla.
2. Si se aprueba, decidir sobre el plato 06: una fotografía más del postre a la escala
   de la toma lo cierra sin tocar nada más.
3. Si se aprueba, subir a la capa común del Motion Engine los tres primitivos que
   Project 01 y Project 02 ya comparten — la **arista única** de barrido, el **progreso
   reversible con commit en el crossover**, y los **grupos de decor con rate propio**.
   Es el momento de extraerlos, antes de escribir Project 03. (Explícitamente fuera del
   alcance de esta iteración.)
4. Decidir si el pipeline de ingest pasa a ser capacidad de producto: un restaurante
   sube su sesión de fotos y obtiene su set auditado, registrado y desplegado.
