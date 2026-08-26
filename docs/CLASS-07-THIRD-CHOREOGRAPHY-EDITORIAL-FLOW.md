# CLASE 07 — TERCER MOTOR · EDITORIAL FLOW V2

## Origen

Reconstrucción funcional a partir del vídeo de referencia `PRUEBA WEB 4.mp4`.

La V1 consiguió integrar visualmente el tercer lenguaje, pero la comparación con el vídeo detectó tres errores de arquitectura: el titular usaba un único color global, el cambio tipográfico reaccionaba después del cambio del plato y los platos se desplazaban entre slots demasiado discretos.

La V2 corrige esos tres puntos sin reescribir `app-v4.js` ni degradar Elegant Orbit o Urban Acrobatics.

## Regla heredada

`CLASE 07 = CLASE 06 APROBADA + TERCER LENGUAJE DE COREOGRAFÍA`

No se degrada:

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

## Lectura correcta del vídeo

La referencia funciona como una **cinta vertical-diagonal continua**. Varios platos atraviesan simultáneamente la escena y existe una zona de lectura central.

El cambio no es `índice cambia → después animamos`.

La secuencia correcta es:

```text
plato actual inicia salida
↓
término dinámico actual comienza a salir
↓
platos avanzan de forma continua
↓
el Orbital Engine cruza su índice real de activación
↓  CUE
nuevo término + nuevo color entran
↓
plato entrante termina de alcanzar HERO
↓
plato + titular quedan asentados juntos
```

El crossover real del motor existente se usa como **cue intermedio de una timeline ya en marcha**, no como disparador tardío de toda la coreografía.

## Roles visibles

1. `EXIT TOP` — abandona arriba, pequeño y lejano.
2. `PREVIOUS` — plato anterior, por encima del foco.
3. `HERO / READING ZONE` — protagonista, máxima nitidez y jerarquía.
4. `NEXT` — siguiente plato, por debajo del foco.
5. `ENTRY BOTTOM` — nuevo plato que entra desde profundidad inferior.

## Trayectoria continua

La V1 animaba de slot a slot. La V2 conserva esos puntos únicamente como **puntos de control**.

`sampleTrack(distance)` interpola posición, escala, opacidad y blur entre los puntos. Durante la transición un `progress` continuo gobierna a todos los platos.

Resultado:

`CONVEYOR / SPLINE FEEL` en lugar de `POSICIÓN A → POSICIÓN B`.

La rotación se reduce a aproximadamente ±0,55° fuera del HERO y 0° en el protagonista. Este motor no debe parecer acrobático.

## Master timeline visible

Editorial Flow V2 posee la transición visible.

Duración objetivo aproximada: `0,90 s`.

```text
0.00  outgoing + track empiezan
0.00  término dinámico actual sale
0.02  se inicia en paralelo el step oculto del Orbital Engine
~0.35 crossover real del active index
      → COMMIT CUE
      → nuevo término
      → nuevo color
      → meta / descripción del motor base
0.90  nuevo plato alcanza HERO y termina el beat
```

Existe un fallback de seguridad si el crossover no se notifica, pero el camino principal usa el cambio real de `dish-counter`.

## Arquitectura del titular

La V1 animaba `dish-title`, `dish-meta` y `dish-short` como un bloque completo.

La V2 crea una arquitectura semejante a la referencia:

```text
Discover
[DYNAMIC TERM]
Signature plates in motion.
```

Sólo `[DYNAMIC TERM]` cambia y se anima.

`dish-meta` y `dish-short` siguen perteneciendo al Orbital Engine y cambian en el mismo crossover de estado.

El `dish-title` original se oculta únicamente mientras Editorial Flow está activo; Elegant y Urban continúan usando el copy original.

## Color por plato

El color ya no usa `brand.accent` como valor único.

Cada plato dispone de:

```json
{
  "editorialFlow": {
    "headline": "Bluefin / Blood Orange",
    "color": "#9270dc"
  }
}
```

Cuando cambia el HERO:

`PLATO → HEADLINE → COLOR`

pertenecen al mismo estado.

La paleta inicial sólo funciona como fallback. El restaurante puede personalizar titular y color por plato.

## Studio

El selector Motion mantiene tres lenguajes:

- Elegant Orbit
- Urban Acrobatics
- Editorial Flow

En **Studio → Platos → Ficha del plato** se añaden dos campos:

- `Editorial Flow · Título dinámico`
- `Editorial Flow · Color`

Estos datos se persisten dentro del propio plato. Un wrapper de persistencia conserva esos metadatos también cuando el Studio guarda posteriormente otros campos del proyecto.

## Interacción: ownership

Cuando `editorial-flow` está activo, Editorial Flow captura y dirige:

- next / prev;
- wheel;
- teclado;
- drag / swipe;
- autoplay;
- click en platos visuales.

El step real del Orbital Engine se ejecuta internamente en paralelo para mantener:

- active dish real;
- contador;
- detalle;
- meta;
- descripción;
- persistencia y resto del producto.

Elegant y Urban no intervienen porque cada motor posee un `orbitalMotion` exclusivo.

## Autoplay

- sólo con la sección visible;
- pausa fuera del viewport;
- pausa con detalle abierto;
- pausa tras interacción;
- reanuda después de inactividad;
- desactivado con `prefers-reduced-motion`.

## Reduced motion

Con movimiento reducido:

- no hay autoplay;
- los relevos se resuelven prácticamente de forma inmediata;
- el contenido y navegación siguen operativos;
- la asociación plato / headline / color permanece correcta.

## Criterios V2

Antes de aprobar visualmente:

1. Editorial Flow es claramente distinto de Elegant y Urban.
2. El término dinámico cambia de color con cada plato.
3. El término anterior sale antes del relevo.
4. El término nuevo entra en el crossover del plato.
5. El nuevo plato termina de llegar después del cue, no antes.
6. El track se percibe continuo y no como saltos de slot.
7. Wheel, buttons, keyboard y drag usan la misma coreografía.
8. Autoplay usa exactamente el mismo `step()`.
9. El HERO abre el detalle real.
10. El Studio permite editar headline y color por plato.
11. Los metadatos persisten tras reload y futuras ediciones.
12. Elegant y Urban no sufren regresiones.

## Rama de validación

`feat/third-orbital-editorial-flow`

No fusionar a `main` hasta aprobación visual del usuario.
