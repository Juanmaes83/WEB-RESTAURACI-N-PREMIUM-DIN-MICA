# VIDEO AUDIT — 5 MOTION PROJECTS FOR RESTAURANT EXPERIENCE STUDIO

## Estado del documento

**Documento de dirección y supervisión.**

Este archivo traduce la auditoría visual del vídeo de referencia `Grabación de pantalla 2026-09-05 091256.mp4` a cinco proyectos concretos de I+D que se desarrollarán con **Claude Code**.

**Claude Code desarrolla. Juanma + ChatGPT supervisan, comparan, validan visualmente y deciden qué entra en producto.**

No se debe interpretar este documento como autorización para reescribir la plataforma completa. La regla heredada del proyecto sigue vigente:

> `CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`

Cada proyecto debe probarse de forma aislada, conservar el baseline aprobado y demostrar visualmente que aporta valor antes de integrarse en el Restaurant Experience Engine / Restaurant Studio.

---

# 1. Qué hemos aprendido del vídeo

El vídeo no interesa por sus interfaces concretas ni porque queramos copiar sus diseños. Interesa porque muestra una **gramática de movimiento reutilizable** capaz de producir experiencias de producto muy espectaculares sin depender de una escena 3D pesada.

Los recursos recurrentes observados son:

- producto como protagonista físico de la interfaz;
- continuidad espacial entre estados;
- objetos que entran y salen siguiendo trayectorias, no simples fades;
- elementos persistentes que actúan como ancla visual;
- escalas distintas según profundidad;
- parallax y solapamiento para crear 2.5D;
- cambios sincronizados de fondo, color, copy y producto;
- drag/swipe como interacción natural;
- composición fotográfica recortada en capas;
- máscaras, transforms, clipping y easing;
- sensación de cámara y coreografía sin necesidad de modelado 3D.

## Conclusión estratégica

La evolución que proponemos para el producto es:

```text
ANTES
Restaurant Studio
├── Branding
├── Content
├── Media
└── Menu

AHORA
Restaurant Experience Studio
├── Branding
├── Content
├── Media
├── Menu
└── Motion / Interaction
    ├── Experience preset
    ├── Product navigation
    ├── Transition system
    ├── Drag / swipe
    ├── Parallax
    ├── Motion intensity
    └── Reduced motion
```

No queremos fabricar cinco demos desconectadas. Queremos investigar cinco comportamientos y convertir los que superen la validación en **presets reutilizables de un único Restaurant Motion Engine**.

---

# 2. Resultado final que queremos conseguir

El objetivo final no es simplemente que una web tenga animaciones bonitas.

Queremos que el Restaurant Studio pueda transformar no sólo la marca, textos, imágenes y carta, sino también **la forma en que la experiencia se mueve y responde al usuario**.

Un restaurante debería poder utilizar el mismo motor y elegir, por configuración, una experiencia como:

```text
Experience style
○ Editorial
○ Cinematic
● Immersive

Product navigation
○ Product Rail
○ Dish Stage
○ Orbital
● Depth Carousel

Transition
○ Slide
○ Orbit
● Anchor Swap / Split Drop

Motion intensity
────────●────

Drag / swipe        ON
Parallax            ON
Reduced motion      AUTO
```

## Qué significaría éxito

La plataforma será claramente mejor si conseguimos que:

1. varios restaurantes puedan utilizar las mismas coreografías sustituyendo assets y datos;
2. el movimiento siga ligado al contenido real del restaurante;
3. la espectacularidad no destruya la usabilidad;
4. la carta, el precio, los alérgenos y el CTA sigan siendo accesibles;
5. móvil tenga una coreografía específica y no una reducción torpe de desktop;
6. `prefers-reduced-motion` conserve toda la funcionalidad;
7. los módulos mantengan un rendimiento razonable;
8. ningún preset dependa de assets 3D para funcionar;
9. el usuario pueda cambiar de restaurante sin reescribir los motores;
10. la diferencia respecto a una web convencional sea visible inmediatamente.

---

# 3. Por qué nos interesa para restauración premium

La restauración tiene una ventaja visual enorme: **el producto puede convertirse literalmente en la interfaz**.

Platos, pizzas, bowls, cócteles, vinos, postres e ingredientes tienen volumen visual, textura, color y geometrías que permiten construir navegación alrededor de ellos.

Esto permite evolucionar desde:

```text
MENU CARD -> CLICK -> DETAIL
```

hacia:

```text
DISCOVER -> MOVE -> REVEAL -> FOCUS -> DETAIL -> RESERVE / ORDER
```

La espectacularidad deja de ser decoración cuando cada coreografía conduce a una acción útil: descubrir un plato, comprenderlo, compararlo, abrir su ficha, reservar o pedir.

El valor comercial está precisamente ahí: **experiencia de marca + descubrimiento de producto + conversión**.

---

# 4. Arquitectura de producto propuesta

No crear cinco motores independientes.

Crear una capa común:

```text
RESTAURANT MOTION ENGINE
│
├── Project 01 — Cinematic Depth Carousel
├── Project 02 — Anchor Swap / Split Drop
├── Project 03 — Orbital Food Slider
├── Project 04 — Dish Stage
└── Project 05 — Cinematic Product Rail
```

Cada proyecto debe compartir, cuando sea posible:

- modelo canónico de producto/plato;
- asset registry;
- active index;
- next / previous;
- drag/swipe intent;
- keyboard fallback;
- snap;
- transition state;
- copy synchronization;
- CTA synchronization;
- responsive breakpoints;
- reduced motion;
- Studio configuration contract.

No queremos cinco implementaciones incompatibles de la misma lógica.

---

# PROJECT 01 — CINEMATIC DEPTH CAROUSEL

## Referencia visual del vídeo

Es el sistema final de productos flotantes en profundidad, con varios objetos simultáneamente visibles alrededor del protagonista.

La selección central es dominante y los productos anteriores/siguientes ocupan posiciones laterales, escaladas, parcialmente recortadas y a distintas profundidades aparentes.

## Movimiento observado

Al cambiar de producto no se sustituye una imagen por otra.

Todos los objetos cambian simultáneamente de posición:

```text
ITEM -2
      ITEM -1
             ACTIVE
                    ITEM +1
                           ITEM +2
```

Después de un drag o navegación:

```text
-2 -> -3
-1 -> -2
 0 -> -1
+1 ->  0
+2 -> +1
```

Cada slot puede tener propiedades propias:

- `x`
- `y`
- `scale`
- `rotation`
- `opacity`
- `blur`
- `z-index`

Las diferentes distancias y velocidades generan sensación de **parallax y profundidad 2.5D**.

## Resultado final esperado

Una experiencia de platos signature donde el usuario vea varios productos coexistiendo en escena, arrastre horizontalmente y sienta que está desplazando una colección física.

Ejemplo:

```text
          small dish

                 medium dish

                         WAGYU
                      active dish

                                   medium dish

                                             small dish
```

Al arrastrar hacia la izquierda:

- Wagyu abandona el centro;
- Lobster avanza desde el lateral;
- los demás platos reajustan su profundidad;
- el fondo cambia de forma sincronizada;
- el gran lettering cambia de `WAGYU` a `LOBSTER`;
- nombre, descripción, precio y CTA cambian con el active index;
- al hacer click/tap sobre el protagonista se abre la ficha real del plato.

## Por qué nos interesa

Es el sistema más completo de la auditoría porque demuestra casi todos los principios que necesitamos:

- drag;
- snap;
- depth;
- parallax;
- multi-object choreography;
- continuidad espacial;
- producto protagonista;
- sincronización con datos;
- navegación altamente visual sin 3D.

Si resolvemos bien este motor, parte de su arquitectura servirá para varios presets posteriores.

## Aplicaciones

- Signature dishes;
- tasting menu;
- pizzas;
- postres;
- coctelería;
- vinos destacados;
- menú estacional.

## Prioridad

**P0 — Primer desarrollo.**

## Criterio de aprobación

No se aprueba si parece un slider horizontal normal con `scale()`.

Debe existir una sensación inequívoca de espacio, profundidad y coreografía física, manteniendo drag, snap, copy sincronizado y selección fiable.

---

# PROJECT 02 — ANCHOR SWAP / SPLIT DROP

## Referencia visual del vídeo

Es la transición del producto sostenido por una mano, donde la mano permanece como ancla mientras el producto y el universo cromático cambian.

## Principio principal

**Objeto persistente + mundo que muta alrededor.**

La mano evita que el espectador pierda la referencia espacial.

Durante una transición pueden coexistir temporalmente dos estados:

```text
OLD WORLD             NEW WORLD
old background        new background
old product ↓         ↑ new product

             ANCHOR
```

El producto anterior sale mientras el siguiente entra y el fondo se divide o desplaza hasta completar el cambio.

## Resultado final esperado

Crear transiciones gastronómicas en las que un elemento común permanezca estable mientras cambia el producto.

Variantes posibles:

### A. Camarero / mano

Una mano sostiene o presenta un plato o cóctel. El recipiente/producto cambia manteniendo la continuidad del gesto.

### B. Mesa

La mesa permanece como plano fijo y los platos intercambian posición mediante entradas/salidas coreografiadas.

### C. Copa

Ideal para coctelería: misma zona de agarre, diferentes bebidas y universos cromáticos.

### D. Utensilio / ingrediente

Una cuchara, bandeja, tabla, ingrediente o elemento de mise-en-place actúa como ancla.

## Técnica prevista

Assets divididos en capas cuando sea necesario:

```text
BACKGROUND
DECORATIVE INGREDIENTS
COPY
BACK ANCHOR LAYER
PRODUCT
FRONT ANCHOR LAYER
UI
```

Tecnología posible:

- CSS transforms;
- masks;
- clip-path;
- translate/scale;
- GSAP o motor equivalente;
- PNG/WebP/AVIF con transparencia;
- imágenes de composición bloqueada;
- vídeos cortos sólo si aportan más valor que una composición por capas.

## Por qué nos interesa

Introduce un lenguaje mucho más cinematográfico que un cambio de slide tradicional.

Además, la continuidad mediante ancla nos permite crear una identidad de marca fuerte y memorable sin usar 3D.

Es especialmente valioso para restaurantes con fotografía o producción audiovisual de alto nivel.

## Prioridad

**P0/P1 — Segundo desarrollo.**

## Criterio de aprobación

No se aprueba si la transición se reduce a dos elementos haciendo slide vertical sobre un fondo que cambia.

Debe percibirse claramente la continuidad del ancla y la coexistencia/control entre estado saliente y entrante.

---

# PROJECT 03 — ORBITAL FOOD SLIDER

## Referencia visual del vídeo

Es el sistema circular observado en la primera parte del vídeo: producto, textos y decoración organizados alrededor de una geometría circular que rota de forma coordinada.

## Principio principal

**La geometría del producto define la navegación.**

En el vídeo, productos circulares conducen naturalmente a un movimiento orbital.

En restauración esto encaja de forma excepcional con:

- pizza;
- platos vistos cenitalmente;
- tartas;
- bowls;
- tablas circulares;
- degustaciones dispuestas radialmente.

## Resultado final esperado

No queremos simplemente reutilizar nuestro Orbital Menu actual sin cambios.

Queremos una variante donde producto, copy, decoración e indicadores formen una composición circular completa y la navegación se perciba como una rotación de un sistema físico.

Ejemplo pizza:

```text
              DIAVOLA

         chili · tomato

              orbit

               PIZZA

      previous        next
```

Al cambiar:

- la pizza recorre la órbita;
- la siguiente ocupa el foco;
- cambia el fondo;
- cambian ingredientes periféricos;
- cambian nombre, precio y copy;
- la tipografía/ornamentación puede rotar o recomponerse con el mismo movimiento;
- drag/swipe mantiene continuidad y snap.

## Relación con lo ya existente

Este proyecto debe estudiar y reutilizar nuestro **Orbital Menu 2.5D** en lugar de crear un segundo motor orbital incompatible.

La pregunta de desarrollo no es "¿podemos hacer otro carrusel circular?".

La pregunta correcta es:

> ¿Cómo convertimos el Orbital Engine existente en un preset de producto todavía más compositivo, gastronómico y configurable desde Studio?

## Por qué nos interesa

Tenemos ventaja porque parte del conocimiento ya existe en el repo.

Además, en el proyecto PIZZERIAS conecta directamente con:

- Pizza Roulette;
- Pizza Table;
- navegación de pizzas;
- producto circular como interfaz.

## Prioridad

**P1 — Tercer desarrollo.**

## Criterio de aprobación

Debe conservar la profundidad, momentum, drag, swipe, snap y sincronización del Orbital existente. No se permite sustituir un motor aprobado por una demo visual más débil.

---

# PROJECT 04 — DISH STAGE

## Referencia visual del vídeo

Es la composición editorial con bowl/plato protagonista, copy lateral y cambio de producto mediante una trayectoria física visible.

## Principio principal

**Escenario limpio + producto hero + continuidad espacial.**

Un producto entra mientras otro abandona la escena. Durante parte de la transición pueden coexistir ambos, evitando el efecto de simple reemplazo.

## Resultado final esperado

Un preset especialmente útil para gastronomía premium:

```text
COPY / STORY                       DISH

SEA                                [PLATO]
Sea bass
caviar
citrus

Explore dish
```

Swipe / next:

```text
EARTH                              [NUEVO PLATO]
Wagyu
mushroom
truffle
```

Durante el cambio:

- el plato saliente abandona el stage;
- el nuevo entra con una trayectoria distinta o complementaria;
- el copy se revela sincronizado;
- el fondo o atmósfera puede cambiar de forma contenida;
- el CTA permanece usable;
- al seleccionar se abre la ficha real del plato.

## Por qué nos interesa

Es probablemente el preset con mejor equilibrio entre:

- espectacularidad;
- legibilidad;
- facilidad de producción de assets;
- rendimiento;
- responsive;
- aplicabilidad a restaurantes reales.

No todos los clientes necesitarán el Depth Carousel. Dish Stage puede convertirse en el preset premium más vendible y estable.

## Prioridad

**P1 — Cuarto desarrollo.**

## Criterio de aprobación

Debe sentirse como una puesta en escena gastronómica, no como un slideshow de fotografías con texto a la izquierda.

---

# PROJECT 05 — CINEMATIC PRODUCT RAIL

## Referencia visual del vídeo

Es el carrusel horizontal donde existe un producto claramente seleccionado y se mantienen visibles productos anteriores/siguientes, ofreciendo una affordance inmediata de navegación.

## Principio principal

**Espectáculo + claridad de navegación.**

El usuario comprende sin explicación que puede continuar explorando porque ve parte de la colección alrededor del protagonista.

## Resultado final esperado

Una banda cinematográfica de productos/platos:

```text
previous          ACTIVE          next
  dish             dish            dish
                   name
                   price
                   CTA
```

Al navegar:

- toda la colección se desplaza;
- el producto entrante gana escala y jerarquía;
- el saliente pierde protagonismo;
- fondo, ingredientes decorativos y copy cambian sincronizados;
- el centro siempre corresponde al producto canónico seleccionado;
- drag/swipe y botones deben producir el mismo estado final.

## Aplicaciones

- vinos;
- coctelería;
- postres;
- pizzas;
- carta principal;
- menú degustación;
- promociones;
- bebidas o productos retail del restaurante.

## Por qué nos interesa

Es menos extremo que Depth Carousel, pero muy potente comercialmente porque mantiene excelente comprensión de uso.

Debe convertirse en una alternativa más ligera y universal para clientes que quieran una experiencia premium sin el coste visual/técnico del preset más complejo.

## Prioridad

**P2 — Quinto desarrollo.**

## Criterio de aprobación

Debe mantener sensación de producto físico y jerarquía cinematográfica. Si acaba pareciendo un Swiper/slider convencional con tarjetas, no aporta suficiente valor.

---

# 5. Elemento del vídeo que NO se convierte en proyecto independiente

También se observó un sistema de **producto central persistente / flavor slider** donde un objeto se mantiene aproximadamente en la misma zona mientras cambian sabor, color, decoración y fondo.

La idea es válida, pero no justifica por ahora un sexto proyecto.

La consideramos una variante de implementación que puede vivir dentro de Dish Stage o Product Rail como preset `CENTER_STAGE`.

La decisión busca evitar duplicar motores y mantener el foco en cinco capacidades con valor claramente diferencial.

---

# 6. Orden de desarrollo con Claude Code

El orden recomendado es deliberado:

```text
01 DEPTH CAROUSEL
      ↓
02 ANCHOR SWAP / SPLIT DROP
      ↓
03 ORBITAL FOOD SLIDER
      ↓
04 DISH STAGE
      ↓
05 PRODUCT RAIL
```

## Motivo

### Project 01 primero

Resuelve el núcleo más complejo:

- state;
- drag;
- snap;
- posiciones;
- profundidad;
- escalas;
- z-order;
- copy sincronizado.

Gran parte de ese conocimiento puede reutilizarse.

### Project 02 después

Añade transición cinematográfica y composición por capas.

### Project 03 después

Cruza lo aprendido con el Orbital Engine ya existente.

### Projects 04 y 05

Convierten los principios complejos en presets más simples, robustos y comercializables.

---

# 7. Método de trabajo: Claude Code + supervisión Juanma/ChatGPT

## Rol de Claude Code

Claude Code será responsable de:

- analizar la arquitectura actual antes de tocarla;
- proponer el mínimo cambio compatible;
- construir cada LAB/proyecto;
- documentar decisiones;
- conservar contratos existentes;
- ejecutar checks;
- dejar cada avance visible en GitHub;
- aportar URL o procedimiento reproducible de validación;
- no declarar éxito basándose sólo en código o tests.

## Rol de Juanma

Juanma valida principalmente:

- impacto visual;
- fidelidad a la intención;
- sensación premium;
- utilidad comercial;
- claridad de interacción;
- si el resultado final realmente merece entrar en producto.

## Rol de ChatGPT

ChatGPT supervisará:

- arquitectura;
- coherencia con el producto;
- comparación con la referencia auditada;
- regresiones;
- rendimiento y responsive;
- contratos de interacción;
- calidad de documentación;
- resultados entregados por Claude Code;
- criterio de integración o rechazo.

## Regla de gobernanza

**Claude Code no se autoaprueba.**

Un test en verde no equivale a una experiencia aprobada.

Cada proyecto necesita:

```text
CODE PASS
+ FUNCTIONAL PASS
+ VISUAL PASS
+ PRODUCT PASS
= APPROVED
```

---

# 8. Flujo obligatorio por proyecto

Cada uno de los cinco proyectos seguirá este ciclo:

```text
1. BASELINE
   ↓
2. LAB AISLADO
   ↓
3. IMPLEMENTACIÓN MÍNIMA
   ↓
4. TEST FUNCIONAL
   ↓
5. CAPTURA / VÍDEO / URL DE PRUEBA
   ↓
6. REVISIÓN CHATGPT
   ↓
7. VALIDACIÓN JUANMA
   ↓
8. CORRECCIONES
   ↓
9. APROBACIÓN
   ↓
10. INTEGRACIÓN EN MOTION ENGINE
```

No se debe pasar automáticamente del LAB al producto principal.

---

# 9. Qué debe entregar Claude Code en cada proyecto

Como mínimo:

1. rama identificable;
2. descripción del baseline que no debe romperse;
3. LAB o ruta aislada;
4. implementación navegable;
5. assets utilizados versionados cuando proceda;
6. datos/preset de demostración;
7. lista de archivos modificados;
8. explicación de la coreografía;
9. tests ejecutados;
10. errores encontrados y solución aplicada;
11. estado desktop;
12. estado mobile;
13. estado reduced-motion;
14. evidencia visual;
15. enlace o procedimiento de validación;
16. lista explícita de limitaciones pendientes.

---

# 10. Contratos que no podemos degradar

Los cinco proyectos deben respetar lo ya conseguido por Restaurant Studio / Motion Direction:

- Studio abre y cierra;
- edición de marca;
- edición de copy;
- media editable;
- edición de platos;
- persistencia;
- fallback de storage;
- reserva;
- fichas de plato;
- responsive;
- keyboard donde corresponda;
- drag/swipe donde corresponda;
- reduced motion;
- segundo restaurante por configuración;
- separación ENGINE / CONTENT / MEDIA / PROJECT STATE.

La nueva capa debe ampliar el sistema, no sustituirlo por una demo aislada.

---

# 11. Requisitos de assets

La calidad del resultado depende mucho del material visual.

Los motores deben estar diseñados para aceptar assets sustituibles, pero las pruebas deben utilizar material suficientemente bueno para juzgar el efecto real.

Preferencias:

- fotografía gastronómica limpia;
- fondos o recortes controlados;
- PNG/WebP/AVIF con transparencia cuando la composición lo necesite;
- misma perspectiva y luz cuando varios productos comparten una coreografía;
- variantes mobile cuando sea necesario;
- poster/fallback de vídeo;
- media registry y no rutas hardcodeadas distribuidas por componentes.

La producción con IA, Higgsfield u otras herramientas puede ayudar, pero el frontend no debe quedar acoplado a un proveedor concreto de generación.

---

# 12. Performance y accesibilidad

La espectacularidad no justifica romper el producto.

Requisitos:

- animar principalmente `transform` y `opacity`;
- limitar blur/filtros caros;
- evitar layouts forzados por frame;
- no cargar assets de presets no utilizados;
- lazy-load de experiencias secundarias;
- soporte táctil real;
- `prefers-reduced-motion`;
- navegación y contenido disponibles sin animación;
- evitar que la coreografía retrase reserva/pedido;
- fallback visual estable si un efecto avanzado falla.

---

# 13. Qué NO queremos

No queremos:

- copiar literalmente las interfaces del vídeo;
- cinco demos bonitas sin arquitectura común;
- un slider genérico renombrado como experiencia premium;
- añadir Three.js por defecto;
- sustituir fotografía de producto por modelos 3D innecesarios;
- motion sin relación con producto o navegación;
- una experiencia que sólo funcione con ratón;
- un desktop espectacular y un móvil roto;
- hardcodear un único restaurante;
- permitir que Studio se convierta en un After Effects imposible de controlar;
- integrar un LAB sin validación visual.

---

# 14. Visión final de producto

Si los cinco proyectos funcionan, Restaurant Studio dejará de ser únicamente un personalizador de contenido y se convertirá en un verdadero **Restaurant Experience Studio**.

La plataforma podrá decir:

> No sólo cambiamos cómo se ve tu restaurante digital. También podemos cambiar cómo se mueve, cómo se explora y cómo presenta sus productos, manteniendo un motor reutilizable y configurable.

Arquitectura objetivo:

```text
RESTAURANT EXPERIENCE ENGINE
│
├── CONTENT ENGINE
├── MEDIA ENGINE
├── MENU / PRODUCT ENGINE
├── PROJECT STATE
│
└── MOTION ENGINE
    ├── Depth Carousel
    ├── Anchor Swap
    ├── Orbital
    ├── Dish Stage
    └── Product Rail
          │
          └── Restaurant Studio configuration
```

El activo no será una web concreta como LÚMINA.

El activo será el **motor capaz de generar experiencias gastronómicas premium diferentes sobre una misma arquitectura**.

---

# 15. Decisión

**APROBADO PARA I+D, NO APROBADO TODAVÍA PARA INTEGRACIÓN DIRECTA.**

Los cinco proyectos tienen interés suficiente para desarrollarse con Claude Code bajo supervisión.

Prioridad de negocio/técnica:

| Proyecto | Impacto visual | Reutilización | Valor comercial | Prioridad |
|---|---:|---:|---:|---:|
| Cinematic Depth Carousel | 10/10 | 10/10 | 10/10 | P0 |
| Anchor Swap / Split Drop | 9.5/10 | 9/10 | 9/10 | P0/P1 |
| Orbital Food Slider | 9/10 | 10/10 | 9/10 | P1 |
| Dish Stage | 8.5/10 | 9/10 | 10/10 | P1 |
| Cinematic Product Rail | 8/10 | 9/10 | 9/10 | P2 |

La referencia del vídeo sirve para definir el nivel de movimiento y espectacularidad que perseguimos. No es una especificación para copiar píxel a píxel.

**Nuestro objetivo es extraer la gramática de movimiento, convertirla en tecnología reutilizable y demostrar que puede personalizarse desde Restaurant Studio.**
