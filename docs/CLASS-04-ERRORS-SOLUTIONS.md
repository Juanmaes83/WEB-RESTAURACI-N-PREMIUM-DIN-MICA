# CLASE 04 — Errores, diagnóstico y soluciones

## 1. Studio oscurecía la web pero el drawer no aparecía

**Síntoma**

El backdrop reaccionaba, pero el panel permanecía fuera de pantalla.

**Causa**

Clase 03 dejaba `transform: translateX(102%)` en CSS y después GSAP intentaba gobernar la misma propiedad mediante `xPercent`. Dos sistemas eran propietarios del mismo transform.

**Solución Clase 04**

- CSS deja de desplazar el Studio.
- GSAP es el único propietario del desplazamiento.
- El estado inicial se fija con `gsap.set(... xPercent:100)`.
- Apertura: `100 → 0`.
- Cierre: `0 → 100`.
- `aria-hidden` controla además visibilidad/pointer events.

## 2. La media desaparecía al cambiar de `<img>` a un host dinámico

**Síntoma**

Origin / Atmosphere / Chef podían quedar sin altura visual al utilizar un `div` como host dinámico de imagen o vídeo.

**Causa**

El elemento hijo tenía `height:100%`, pero el host no ocupaba explícitamente el contenedor.

**Solución**

`media-host-fill` pasa a `position:absolute; inset:0` y los padres mantienen `position:relative`.

## 3. localStorage no era un almacén correcto para media

**Problema**

Clase 03 convertía imágenes a datos locales dentro de la configuración. No escala a vídeo y tiene límites pequeños.

**Solución**

IndexedDB con stores independientes:

- `projects`
- `media`

Los archivos permanecen como Blob/File y se hidratan con Object URLs al abrir la web.

## 4. El HTML seguía siendo fuente de verdad

**Problema**

Cambiar `brand` no convertía realmente la web en otro restaurante porque gran parte de los titulares, dirección, chef y footer seguían escritos en HTML.

**Solución**

`class4-config.js` concentra contenido, marca, datos de visita, media defaults y platos. El HTML contiene estructura y destinos de render, no el copy principal.

## 5. Un panel con muchos inputs puede ser incomprensible

**Problema**

El usuario necesita saber qué zona está modificando.

**Solución**

Cada panel incluye:

- número / categoría
- título comprensible
- explicación funcional
- nombres de slot orientados a la web real
- formato recomendado
- botón “Ver … en la web”

## 6. Imagen y vídeo no deben tratarse igual en todo el producto

**Decisión**

Hero, Origin, Atmosphere y Chef aceptan imagen o vídeo.

El Orbital Menu mantiene imagen 1:1 porque la consistencia fotográfica forma parte del efecto 2.5D. Permitir vídeo arbitrario en cada plato rompería el contrato visual de esta fase.

## 7. Importar un segundo restaurante podía romper las imágenes orbitales

**Problema detectado en revisión**

El merge de arrays sustituye el array completo de platos. Si el preset NAMI no incluye `image`, el menú pierde media.

**Solución**

El preset de prueba incluye explícitamente la media orbital de cada plato. En una versión de backend se normalizará el schema por `dish.id`.

## 8. La Clase 04 no debe intentar resolver Motion Direction

**Riesgo**

Añadir reveals, hover y transiciones mientras se está reconstruyendo el sistema de personalización mezcla dos problemas y dificulta localizar errores.

**Decisión**

Clase 04 prioriza builder, schema, media y persistencia. Clase 05 será la pasada visual/motion sobre esta arquitectura ya desacoplada.

## 9. El enlace de GitHub Pages de Clase 03 se entregó sin estar validado

**Error de proceso**

No se debe afirmar que una URL está publicada si devuelve 404.

**Nueva regla**

Clase 04 no se considera cerrada por tener commits. Antes de entregar URL canónica:

1. CI estático/sintaxis.
2. Merge controlado.
3. Despliegue.
4. HTTP 200.
5. Apertura real.
6. Studio abre/cierra.
7. Cambios sobreviven recarga.
8. Media carga.
9. Orbital sigue operativo.

## 10. Lo que todavía es intencionadamente local

El Studio es un builder local persistente. No se presenta todavía como SaaS multiusuario.

Pendiente de una fase de producto posterior:

- autenticación
- base de datos remota
- almacenamiento cloud
- roles
- drafts/publicaciones remotas
- multi-restaurante por cuenta

La Clase 04 demuestra la separación ENGINE / CONTENT / MEDIA y la capacidad de personalizar sin editar código.
