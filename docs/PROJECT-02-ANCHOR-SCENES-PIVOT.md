# PROJECT 02 — PIVOT TO PRECOMPOSED ANCHOR SCENES

> **STATUS: Blocked on the real master scene photography.** Everything else is built,
> tested, deployed and navigable.
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
  image,   // la escena maestra: mano + objeto + fondo + luz, ya compuesta
  hit      // { x, y, w, h } — la región del objeto dentro de la escena, en fracciones
}
```

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

## 5. Estado de los assets de escena — EL BLOQUEO

**No hay fotografía real de una mano sosteniendo cada producto en el repositorio.**
Se buscó en `main`, en `MANOS/` y en la rama anterior: sólo existen los tres PNG de la
mano y los recortes de objeto de Project 01.

Siguiendo la instrucción de preparar el sistema sin bloquear el desarrollo, se ha
construido un **set proxy de 6 escenas** con `scripts/build-anchor-scenes.mjs`, a partir
de la mano maestra y los objetos de Project 01. Comparte lienzo, encuadre, colocación de
la mano, geometría de luz, viñeta y grado; sólo cambian objeto y mundo. Es exactamente
el contrato que consume el motor.

Y precisamente porque se compone **una sola vez y offline**, el set proxy ya incorpora
lo que el ensamblaje en vivo no podía:

- sombra de contacto pintada escalando el contexto, no recortando un degradado circular
  a una elipse (recortarlo corta la caída antes de llegar a cero y deja un borde recto);
- sombra de las yemas **enmascarada al objeto**, para que la línea de recorte de los
  dedos no dibuje una banda sobre la palma;
- alfa del objeto saneado, porque el halo residual del recorte compone como una neblina
  de borde recto.

Cada uno de esos tres puntos fue un artefacto real detectado mirando la imagen, no un
test en rojo.

**Por qué esto es Blocked y no Ready:** la instrucción es explícita — no declarar Ready
for Human Visual Review hasta que el sistema esté probado con las imágenes maestras
reales. El proxy demuestra el motor y la dirección; no sustituye a una sesión
fotográfica. **En cuanto dejéis 4–6 escenas reales en `assets/anchor-scenes/source` y
apuntéis `dish.anchorScene.image`, el sistema las consume sin un solo cambio de código.**

## 6. Auditoría de consistencia entre escenas

La auditoría de la mano partida (¿reconstruyen BACK+FRONT el MASTER?) ya no aplica.
La pregunta ahora es la que decide si el swap vende: **¿parecen la misma toma?**

`scripts/audit-anchor-scenes.mjs` comprueba lo que de verdad rompe la ilusión:

| Control | Tolerancia | Medido |
|---|---:|---:|
| Mismo lienzo y dimensiones | idéntico | 6 escenas @ 1200×1500 · **OK** |
| Misma orientación | idéntica | portrait · **OK** |
| Dispersión de iluminación (luma media) | ≤ 0.10 | **0.0537** |
| Región del ancla · diferencia media | ≤ 26 / 255 | **9.37** |
| Región del ancla · píxeles alterados | ≤ 5.5% | **0.00%** |
| Escala del objeto · dispersión | ≤ 0.34 | **0.0914** |
| Centro del objeto · dispersión | ≤ 0.06 | **0.0008** |

La **región del ancla** es el tercio inferior, donde viven muñeca y palma y donde el
objeto nunca llega: si la mano se hubiera movido o la luz hubiera cambiado entre tomas,
se ve ahí y en ningún otro sitio. 9.37 sobre 255 es lo que hace que el barrido sea
imperceptible sobre la mano.

Salidas: `_scenes-sheet.png` (hoja comparativa), `anchor-region-diff.png` y
`scenes-audit.json`. La auditoría **falla con exit 1** si una escena entra desalineada,
y el CI la ejecuta.

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
  normal, el scrim se reorienta a 3° porque el texto va debajo, el lettering sube a
  24vw y la máscara de sujeto se ensancha para el formato vertical.
- **Reduced motion**: la transición se resuelve casi instantánea; escena, copy,
  navegación y ficha siguen disponibles. Verificado por test.

## 14. Tests

**60/60** en desktop 1440×900, móvil 390×844 y reduced motion.

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
| Capturas desktop | `anchor-scenes-desktop-0{1,2,3,4,5,6}-*.png` (idle · quarter · half · three-quarter · complete · detail) + `07-orbital-regression` |
| Capturas mobile | las equivalentes |
| Reduced motion | `anchor-scenes-reduced-motion.png` |
| Vídeo | `tests/video/anchor-scenes-desktop.webm` (19.4s) · `anchor-scenes-mobile.webm` (18.0s) |
| Escenas | `assets/anchor-scenes/audit/_scenes-sheet.png` |
| Auditoría | `assets/anchor-scenes/audit/scenes-audit.json` · `anchor-region-diff.png` |

## 16. Known issues

1. **Las escenas son proxy, no fotografía.** Es el bloqueo declarado. Comparten toma y
   consistencia auditada, pero se componen a partir de fotografía cenital de plato: no
   son un objeto fotografiado *para ser sostenido*. Una copa, un bowl en tres cuartos o
   un cucurucho darían otro salto.
2. **Un borde vertical tenue** subsiste en el tercio izquierdo, donde la máscara del
   sujeto se apaga contra su propio baño. Se atenuó igualando exposiciones (era un paso
   duro: sujeto a brillo pleno contra baño al 0.56) y queda bajo el scrim del copy, pero
   con fotografía real de fondo continuo desaparecería solo.
3. **Una sola mano, una sola pose.** Las variantes B (mesa), C (copa) y D (utensilio)
   del documento maestro siguen sin implementar.
4. **Sin panel en Studio.** El preset se selecciona; no hay controles de dirección,
   intensidad ni encuadre de escena.
5. **La palabra no es bilingüe**, a diferencia del resto del copy de Clase 06.
6. **Sin traza de FPS en dispositivo real.** El motor es mucho más ligero que el
   anterior —dos capas de imagen y una máscara, en vez de cinco capas transformadas—
   pero no está medido.
7. **`goTo` a un índice lejano** puede dejar el contador base un índice por detrás
   durante un instante antes de resincronizarse. No afecta al arrastre ni a prev/next.

## 17. Qué falta para el cierre final

1. **Las 4–6 escenas maestras reales.** Es lo único que separa esto de Ready for Human
   Visual Review. Requisitos: mismo lienzo, misma orientación, misma posición de la
   mano, misma distancia de cámara, misma luz; el objeto dentro del hueco, sin salirse.
   La auditoría los valida automáticamente al entrar.
2. Revisión visual humana del resultado con esas escenas.
3. Si se aprueba: subir a la capa común del Motion Engine los tres primitivos que
   Project 01 y Project 02 ya comparten — la **arista única** de barrido, el **modelo de
   progreso reversible con commit en el crossover**, y los **grupos de decor con rate
   propio**. Son los mismos en ambos presets y es el momento de extraerlos, antes de
   escribir Project 03.
4. Decidir si el generador de escenas (`build-anchor-scenes.mjs`) pasa a ser una
   capacidad de producto: un restaurante que sube su mano y sus productos obtendría su
   propio set consistente sin sesión de estudio.
