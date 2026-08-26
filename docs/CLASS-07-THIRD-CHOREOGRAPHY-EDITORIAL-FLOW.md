# CLASE 07 — TERCER MOTOR · EDITORIAL FLOW

## Origen

Reconstrucción funcional a partir del vídeo de referencia `PRUEBA WEB 4.mp4` (20,2 s · 30 fps · 2558×1438).

No se copia la interfaz del vídeo. Se extrae su gramática de movimiento y se adapta al Restaurant Experience Engine existente usando las imágenes/platos del proyecto.

## Regla heredada

`CLASE 07 = CLASE 06 APROBADA + TERCER LENGUAJE DE COREOGRAFÍA`

No se reescribe `app-v4.js`, no se reemplaza el Orbital Engine y no se degrada:

- Studio;
- persistencia;
- gestor de platos;
- detalle inmersivo;
- contador/copy;
- wheel;
- drag/swipe;
- teclado;
- responsive;
- reduced motion.

## Lectura del vídeo

La referencia no utiliza una órbita circular ni una actuación acrobática.

Su gramática es una **cinta vertical-diagonal ascendente** situada en el lateral visual. Varios platos están simultáneamente presentes y atraviesan una zona de lectura/foco. El plato que alcanza esa zona se convierte en protagonista y provoca el relevo del titular.

### Roles visibles

Cada plato ocupa temporalmente uno de estos roles:

1. `EXIT TOP` — abandona por la parte superior, pequeño, lejano y con poca opacidad.
2. `PREVIOUS` — plato anterior, por encima del foco, menor escala y contraste.
3. `HERO / READING ZONE` — plato protagonista, máxima escala, nitidez y jerarquía.
4. `NEXT` — siguiente plato, por debajo del foco, preparado para entrar.
5. `ENTRY BOTTOM` — entrada inferior, pequeña y más lejana.

Se mantienen además posiciones de continuidad fuera del viewport para que el ciclo no parezca teletransportarse.

## Coreografía reconstruida

Cuando cambia el plato activo:

```text
EXIT TOP        ↑ sale y pierde presencia
PREVIOUS        ↑ ocupa la salida próxima
HERO            ↑ abandona la zona de lectura
NEXT            ↑ entra en la zona HERO
ENTRY BOTTOM    ↑ ocupa la posición NEXT
NEW ENTRY       ↑ aparece desde profundidad inferior
```

Todos los elementos se desplazan durante el mismo beat con easing `power3.inOut` y una duración aproximada de 0,86 s.

La trayectoria no es una línea vertical perfecta. La coordenada X oscila ligeramente por slot para reproducir la sensación diagonal/editorial de la referencia.

## Profundidad

La jerarquía se construye mediante:

- posición Y;
- desplazamiento X;
- escala;
- opacidad;
- brillo;
- blur;
- z-index;
- sombra del plato.

El HERO queda aproximadamente en escala `1.10`, brillo `1.06` y blur `0`.

Los platos alejados reducen escala/opacidad y aumentan blur de forma progresiva.

## Relevo del titular

El vídeo de referencia vincula el plato protagonista y el titular.

Editorial Flow conserva la fuente de verdad del Orbital Engine (`dish-title`, `dish-meta`, `dish-short`, `dish-counter`) y añade un relevo tipográfico:

1. se conserva momentáneamente el titular anterior como ghost;
2. el titular anterior asciende y desaparece;
3. el nuevo titular entra desde abajo;
4. meta y descripción siguen con stagger corto;
5. el titular activo usa el color de acento del restaurante.

Por tanto:

`CAMBIO DE PLATO = CAMBIO DE HERO VISUAL + CAMBIO DE COPY`

No existen dos estados independientes.

## Arquitectura

Archivo nuevo:

- `class7-editorial-flow.js`

Cambio mínimo en:

- `class5-elegant-orbit.js`

### Aislamiento de motores

Antes:

```js
isElegant = orbitalMotion !== 'urban'
```

Esto habría provocado que cualquier tercer valor ejecutara Elegant accidentalmente.

Ahora:

```js
isElegant = orbitalMotion === 'elegant'
isUrban    = orbitalMotion === 'urban'
isFlow     = orbitalMotion === 'editorial-flow'
```

Cada coreografía posee un único dueño.

## Estrategia de compatibilidad

Editorial Flow **no sustituye el estado del Orbital Engine**.

El Orbital Engine continúa funcionando debajo como autoridad para:

- plato activo;
- contador;
- copy;
- navegación;
- detalle;
- configuración;
- persistencia.

Cuando Editorial Flow está seleccionado, el stage orbital original se oculta visualmente y se crea un stage de presentación independiente con clones visuales de las mismas imágenes.

Esto evita reescribir el motor aprobado y reduce el riesgo de regresión.

## Studio

El selector queda ampliado a:

- Elegant Orbit
- Urban Acrobatics
- Editorial Flow

Valor persistido:

```json
{
  "motion": {
    "orbitalStyle": "editorial-flow"
  }
}
```

El preset pertenece al proyecto completo, exactamente igual que Elegant y Urban.

## Interacción

Editorial Flow conserva los controles existentes porque escucha el estado producido por el Orbital Engine:

- next / prev;
- wheel;
- drag / swipe;
- teclado;
- click de plato;
- detail open / close.

Los platos visuales del Flow delegan el click en el plato real correspondiente para conservar el detalle inmersivo existente.

## Autoplay de referencia

El vídeo demuestra una secuencia autónoma. Para reproducir esa cualidad, Editorial Flow puede avanzar automáticamente mientras el menú está suficientemente visible.

Contrato:

- empieza sólo cuando la sección entra en viewport;
- pausa al salir del viewport;
- pausa con detalle abierto;
- pausa tras interacción del usuario;
- reanuda después de un periodo de inactividad;
- se desactiva con `prefers-reduced-motion`.

El intervalo objetivo es aproximadamente 2,3 s entre relevos.

## Mobile

El sistema mantiene la misma gramática, con:

- platos más pequeños;
- menor amplitud horizontal;
- posiciones adaptadas al viewport vertical;
- misma relación HERO → NEXT → ENTRY;
- sin añadir filtros más caros.

## Criterio de aprobación visual

La implementación sólo debe declararse final cuando en navegador se compruebe:

1. selector visible en Studio;
2. Elegant sigue intacto;
3. Urban sigue intacto;
4. Editorial Flow tiene trayectoria vertical-diagonal claramente distinta;
5. no aparecen dos coreografías simultáneas;
6. el nuevo plato llega al foco y el titular cambia sincronizado;
7. autoplay no lucha contra interacción manual;
8. click en plato protagonista abre detalle;
9. retorno desde detalle reconstruye el Flow;
10. reload restaura `editorial-flow`;
11. mobile mantiene lectura y jerarquía;
12. reduced motion conserva navegación sin autoplay.

## Estado

Implementación inicial construida en rama:

`feat/third-orbital-editorial-flow`

No fusionar a `main` hasta validación visual.