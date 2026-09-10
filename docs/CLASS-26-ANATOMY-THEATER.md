# CLASS 26 — ANATOMY THEATER

> El plato abierto en sus capas. Una Section Experience configurable desde el Studio de
> siempre, sobre `dishes[]`, con la Media Library compartida y apagada por defecto.

Origen del análisis: [`docs/BURGER-SOURCE-ADAPTATION-AUDIT.md`](BURGER-SOURCE-ADAPTATION-AUDIT.md).

---

## 1. Qué problema resuelve

La plataforma tiene trece motores de movimiento. Los nueve presets de producto responden
todos a la misma pregunta —*cómo paso de un plato al siguiente con belleza*— y la
responden bien. Ninguno responde a otra que el producto no había formulado:

```text
¿QUÉ HAY DENTRO DE ESTE PLATO?
```

Los campos `origin`, `technique`, `pairing`, `note` y `allergens` existen en `dishes[]`
desde Class 04 y hasta ahora sólo se leían como texto en la ficha. Anatomy Theater es la
superficie visual que esos campos llevaban esperando.

**No es un motor de producto.** No navega la colección: profundiza en un producto. Por eso
es una Section Experience —como Memories (Class 23) y Beverages (Class 25)— y **no aparece
en el catálogo de `class19-motion-library.js`**. La regla de Class 24 —un solo motor de
producto + 0/1 transversal + N experiencias— queda intacta.

---

## 2. Arquitectura

```text
dish.anatomy.layers[]            ← las capas pertenecen al PLATO
        +
anatomy.*                        ← la configuración de la SECCIÓN
        ↓
class26-anatomy-model.js         normalize / layer / refFor
class26-anatomy-review.js        ?review=anatomy (sesión, nunca persiste)
class26-anatomy-engine.js        apilado, selección, montaje, ciclo de vida
class26-anatomy-studio.js        un panel más en el Studio actual
        ↓
RestaurantMedia · RestaurantMediaPicker · RestaurantStudioConfig · dishes[]
```

Cadena de carga: `index.html` → `class26-anatomy-loader.js`, que espera a
`RestaurantMedia`, `RestaurantMediaPicker` y `RestaurantStudioConfig` y encadena los
cuatro ficheros en orden determinista. Class 25 tuvo que engancharse a
`class24-motion-governance.js` porque llegó después de la cadena; aquí no hace falta el
atajo y una etiqueta `<script>` se lee mejor que una dependencia escondida.

### Contrato de datos

Lo único nuevo, y sólo esto:

```js
dish.anatomy = {
  enabled: true,
  layers: [ { id, label, note, enabled, order,
              media: {id, kind:'image', ref, alt},
              width, height, top, squashY, offsetX, depth } ]
}
```

`width/height/top/squashY` en fracción del ancho del escenario. **Pueden venir a `null`**:
entonces el motor mide la capa en el navegador. `offsetX` es autoría —el desplazamiento
lateral que da vida al apilado— y se guarda siempre.

La sección guarda su propia configuración en `anatomy.*`: `enabled`, `preset`, `resting`,
copy, los cuatro refuerzos de movimiento, los tres toggles de campos y `dishId`.

**Cero campos nuevos en la raíz del plato.** `origin`, `technique`, `pairing` y `allergens`
se leen de donde ya estaban y se siguen editando en el panel Platos: pedirlos otra vez aquí
sería abrir un segundo sitio donde editar lo mismo.

---

## 3. El registro se mide, no se cablea

Ésta es la diferencia técnica de fondo con la referencia auditada.

`thebuggeddev/burger` resolvió su apilado con ocho constantes calibradas a ojo contra una
captura a 1920 —`w`, `top`, `cx` y `sy` por capa—. Funciona exactamente para esas ocho
imágenes y para ese ancho; cambiar un asset obliga a recalibrar a mano.

`scripts/ingest-anatomy-layers.mjs` lo genera:

| Paso | Qué hace |
|---|---|
| Decodifica | PNG con el `zlib` de Node. Sin dependencias: este repositorio no tiene build step y no se le añade uno |
| Mide | Caja de contenido alfa por **componente conexo mayor**, para que una mota de compresión en una esquina no registre la capa contra ruido |
| Recorta | El runtime sale ajustado a su contenido, así que elemento == contenido y el motor no compensa nada |
| Redimensiona | A 820px de ancho útil con área ponderada y alfa premultiplicado (sin premultiplicar aparece orla en el borde) |
| Deriva el aplastado | **Un solo número**, no nueve: `squashY = (altoObjetivo − huecos) / sumaDeAltos` |
| Emite veredicto | Dispersión de anchos, cobertura, alto del apilado, con tolerancias |

Resultado sobre el juego de nueve capas: **14.8 MB → 6.0 MB (−59.3%)**, apilado a
1.120× el ancho, `squashY` derivado 0.47647, registro **OK**.

### Por qué hay aplastado

Los recortes de comida están fotografiados a unos 45°, así que cada capa es casi tan alta
como ancha. Nueve capas apiladas sin más miden **2.4 veces** el ancho del escenario: no cabe
en ninguna pantalla y, peor, no parece una pila — parece una columna de objetos sueltos.

Se declara la intención (`targetStackHeight: 1.12`) y el aplastado sale de dividir.
Sobrevive a cambiar un asset o a añadir una capa.

### Densidad, no separación

`gapFraction: -0.006` — negativo a propósito. Un despiece con huecos generosos parece un
diagrama de montaje de IKEA; con solapes de 3–4px parece comida. **Es el detalle que separa
"bonito" de "apetecible"**, y es la mejor observación de dirección que se trae de la
referencia.

### Capas que sube el restaurante

No traen registro y probablemente tengan relleno transparente alrededor. `measureOne()` las
mide en un canvas de 220px la primera vez de la sesión y deriva el mismo apilado,
compensando `cx` y `ctop`. **Por eso un restaurante puede usar esto sin ejecutar ningún
script.**

Ese registro medido **no se persiste**, y es deliberado: guardar sólo `width/top` y leerlos
después por la vía rápida —que da por hecho un recorte ajustado— colocaría la capa mal.
Guardarlo bien exigiría añadir `cx` y `ctop` al contrato para todos. Medir cuesta un canvas
por capa y se cachea toda la sesión; no merece dos campos más. El botón *Volver a medir* del
Studio tira la caché.

---

## 4. El estado explotado es el reposo

La composición abierta está ahí desde el primer frame. No hay que ganársela con scroll.

La consecuencia que importa es de accesibilidad: con `prefers-reduced-motion` se apagan
flotación, parallax y deriva, y **la composición sigue siendo la composición**. No hay
versión degradada. Y el `matchMedia` es reactivo, no una foto al montar.

El scroll añade una deriva de ±0.62% del ancho — un refuerzo, no una coreografía. El reposo
ya es el estado bueno y el scroll no debe apropiárselo.

---

## 5. Interacción

| Gesto | Qué hace |
|---|---|
| Clic / toque en una capa | La elige. La ficha cuenta esa capa; el resto cede foco (opacidad .52, sin esconder nada) |
| ← → ↑ ↓ | Avanza y retrocede de capa |
| Escape | Suelta la selección |
| *Montar el plato* | Lleva las capas a un apilado apretado. Medido: **614px → 184px**, solapes de 33–68px |
| Puntero sobre el escenario | Parallax por capa con la profundidad = índice |
| *Ver plato* | Abre la ficha unificada de Class 21 por su seam público |

Cada capa es un `<button>` real con foco, teclado y área táctil. En la referencia el
apilado lleva `pointer-events:none` y no se puede tocar: ahí es donde estaba el valor sin
explotar.

La ficha no se reimplementa. Se invoca `RestaurantProductDetail.open(dish,{via:'button'})`
y, si no hay adaptador, el evento `restaurant:class6-open-dish` **en `window`** —es donde lo
escucha `class6-product.js:170`—. Class 06 decide: si el plato ya es el héroe abre, y si no
navega primero.

---

## 6. Fallback progresivo

| Assets disponibles | Qué se ve |
|---|---|
| Sin `anatomy.layers` o menos de 2 resolubles | **Héroe anotado**: la foto del plato con sus ingredientes como llamadas. El control de montaje se esconde |
| 2 o más recortes con alfa | El apilado explotado completo |
| Recortes del ingestor | Igual, con registro generado y auditado |

Una experiencia que funciona con los assets que haya y mejora cuando el restaurante sube
mejores medios. Los nombres del modo anotado se parten de `dish.ingredients` — no se
inventan.

---

## 7. Ruta de revisión — `?review=anatomy`

| URL | Qué es |
|---|---|
| `<base>/` | Producto. `anatomy.enabled:false` por defecto: cero sección, cero espacio, cero observers |
| `<base>/?review=anatomy` | **REVISIÓN.** Una composición completa lista para juzgar, con assets versionados |

El estado de revisión es una capa de sesión: el Studio y el motor ven los mismos valores y
el Project State durable no se toca. Mismo contrato que `class25-beverages-review.js`.

**Por qué hay un plato de revisión y no un plato nuevo en la carta:** LÚMINA es un
restaurante mediterráneo de autor y su carta son seis platos. Meter una hamburguesa en
`dishes[]` sería inventar contenido del restaurante para lucir un motor. El plato de la
anatomía llega sólo en esta ruta, en memoria, con `demoContent: true`, y el motor lo consume
por el mismo camino que consumiría un plato real.

La geometría **se lee del manifiesto**, no se repite en el fixture: reejecutar el ingestor
con otros másters cambia lo que enseña esta ruta sin tocar una línea.

### Procedencia de los assets

Los nueve recortes y el héroe vienen del proyecto de referencia de hamburguesa auditado en
`docs/BURGER-SOURCE-ADAPTATION-AUDIT.md`, ingeridos a runtime propio. Los másters quedan
inmutables en `assets/anatomy/source/`. Las notas editoriales por capa son material de
revisión, no información oficial de ningún restaurante.

---

## 8. Ciclo de vida

`IntersectionObserver` + `visibilitychange`: **nada corre** si la sección no está a la vista
o el documento está oculto. Al desmontar se cancela y desconecta todo. Patrón de Class 23.

`enabled:false` desmonta el nodo — y desmontar el nodo **es** el teardown.

### Una pasada a la vez

`refresh()` es asíncrona (resolver refs de media y medir recortes lo son) y
`restaurant:config-applied` llega varias veces seguidas: el panel al renderizar, el
autosave, la ruta de revisión al superponer su namespace.

Sin candado, dos pasadas cruzaban el mismo `await`, las dos veían `mounted` en `false` y las
dos construían. **Medido en navegador: cuatro secciones `#anatomy` vivas a la vez** — ids
repetidos y observers que nadie apagaba.

Resuelto con tres candados: un token que descarta la pasada vieja, una cadena de promesas
que impide el solape, y un barrido defensivo en `build()`. El gate lo vigila con doce
cambios de configuración seguidos.

---

## 9. Móvil

No es la composición de escritorio reducida —esa es la lección de `routeMobile` en
Project 09—. En vertical el texto va arriba y el escenario debajo, ocupando el ancho
completo, porque el eje vertical es justo el que escasea en un teléfono y el apilado lo
necesita entero.

El alto del escenario se declara con `min(78svh, 88vw)` y el ancho lo deriva
`aspect-ratio`. La primera versión lo hacía al contrario —el ancho de la columna mandaba— y
salían dos fallos medidos: 924px de alto en un portátil de 900, y un colapso a 224px en una
sola columna.

El alto de la caja de cada capa es dato, no el alto natural de la imagen: así el apilado es
estable desde el primer frame aunque las imágenes diferidas no hayan cargado, y el área de
pulsación coincide con la capa visible.

---

## 10. Gates

| Gate | Qué prueba | Necesita navegador |
|---|---|---|
| `tests/class26-anatomy-registration.mjs` | Integridad del manifiesto y de los assets: alfa real, dimensiones, recorte, acumulado de tops, aplastado único, densidad, peso, reproducibilidad | **No** |
| `tests/class26-anatomy-e2e.mjs` | Montaje, registro visual, selección, teclado, montar/desmontar, OFF ES OFF, fallback, Studio, móvil 390, reduced motion | Sí (Playwright) |
| `.github/workflows/class26-anatomy.yml` | Contrato de arquitectura + los dos anteriores + regresión de Class 21, 24 y 25 | Sí |

El contrato de arquitectura del workflow comprueba lo que no debe pasar: sin React/Next/
Zustand/Lenis/Three, sin segundo almacén, sin `createObjectURL` en el dominio, sin
`anatomy` en el catálogo de Motion, y el ingestor sin escribir en `source/`.

También comprueba que **el ingestor es reproducible**: reejecutarlo sobre los mismos
másters tiene que dar el mismo manifiesto. Si no, el registro no es un dato derivado: es
una casualidad.

---

## 11. Qué NO hace

```text
NO es un motor de producto y no entra en el catálogo de Motion
NO crea un segundo Studio, Project State, almacén ni Media Library
NO duplica dishes[] ni añade un catálogo de producto propio
NO reimplementa la ficha: invoca la de Class 21 por su seam público
NO trae React, Vite, Radix, Lenis ni Three
NO añade un build step
NO guarda URLs ni blob: en el Project State — sólo refs lógicas
NO inventa contenido: un campo vacío no se pinta
NO mete una hamburguesa en la carta de LÚMINA
NO deja nada corriendo fuera de pantalla
```

---

## 12. Estado

**READY FOR HUMAN VISUAL REVIEW.**

Verificado en navegador durante la construcción: montaje de las nueve capas, registro
exacto (alto visible == alto de caja en las nueve), centrado en el eje, densidad con
solapes, escenario dentro de la ventana, selección, teclado, montar/desmontar, OFF ES OFF,
fallback a héroe anotado y ausencia de duplicación bajo tormenta de configuración.

`tests/class26-anatomy-registration.mjs`: **24/24 PASS**.

El gate de Playwright y el juicio visual quedan pendientes de la revisión humana.
