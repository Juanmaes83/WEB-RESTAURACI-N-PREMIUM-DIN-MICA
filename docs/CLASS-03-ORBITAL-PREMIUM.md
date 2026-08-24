# CLASE 03 — DE DEMO A EXPERIENCIA PREMIUM PERSONALIZABLE

## Objetivo

Corregir el principal límite de la Clase 02: el carrusel discreto y la dirección de arte insuficientemente controlada. La Clase 03 convierte la demo en una experiencia gastronómica orbital, inmersiva y personalizable.

## Contrato visual de los platos

Los seis platos de la demo se han generado expresamente para esta clase y comparten un contrato de producción:

- lienzo cuadrado 1:1;
- fondo carbón casi negro uniforme;
- plato cerámico marfil centrado;
- plato ocupando aproximadamente el 72% del lienzo;
- misma altura y perspectiva de cámara;
- misma dirección de luz cálida desde arriba/izquierda;
- misma lógica de sombra de contacto;
- ausencia de props externos, texto o cubertería;
- gastronomía premium, realista y diferente en cada plato.

Platos:

1. Wild Red Prawn;
2. Bluefin / Blood Orange;
3. Charred Artichoke;
4. Wild Sea Bass;
5. Iberian Presa;
6. Burnt Honey Citrus.

También se han producido assets coherentes para interior, chef y materia prima.

## Motor orbital

El motor ya no funciona mediante estados rígidos izquierda/centro/derecha. Cada elemento recorre una órbita elíptica continua.

A partir de la profundidad relativa se derivan en tiempo real:

- posición X/Y;
- escala;
- rotación sutil;
- opacidad;
- blur;
- brillo;
- z-index.

El plato delantero aumenta escala, contraste y prioridad de capa. Al abandonar el foco vuelve a reducirse y pasa a las capas posteriores, cediendo el centro al siguiente.

## Interacción

La órbita admite:

- rueda / trackpad;
- drag con ratón;
- swipe / pointer;
- botones anterior/siguiente;
- teclado;
- snap al plato más cercano.

## Ficha inmersiva

El plato central puede abrirse con `Explore dish +`.

Se reutiliza el mismo nodo visual mediante GSAP Flip:

1. el plato abandona la órbita;
2. crece hasta la ficha;
3. aparece información gastronómica;
4. al cerrar, el plato vuelve a su posición original en la órbita.

Campos de ficha:

- nombre;
- precio;
- descripción;
- ingredientes;
- origen;
- técnica;
- maridaje;
- chef note;
- alérgenos;
- CTA de reserva.

## Motion system

La Clase 03 incorpora GSAP 3.13 con:

- Core;
- ScrollTrigger;
- Observer;
- Flip.

Aplicaciones:

- órbita;
- drag y wheel;
- cambio sincronizado de copy;
- transición plato → ficha → órbita;
- parallax de hero e imágenes;
- reveals editoriales;
- progreso de scroll;
- cursor contextual en desktop.

## Restaurant Studio

La web incluye un panel `Studio` para demostrar que el frontend puede comportarse como una plantilla y no como una única web cerrada.

Permite:

- cambiar nombre de restaurante;
- cambiar color de acento;
- seleccionar un plato;
- modificar nombre, precio y descripción;
- sustituir la imagen mediante URL;
- subir una imagen local;
- redimensionar automáticamente el upload a 1024 × 1024 WebP sobre fondo oscuro;
- exportar la configuración como JSON;
- importar una configuración JSON;
- restaurar la demo original.

### Límite consciente

Este Studio persiste en `localStorage` y funciona como CMS local de demostración. No es todavía un backend remoto multiusuario. La siguiente capa de producción sería conectar la misma estructura a Supabase/Postgres + Storage + Auth o a un CMS equivalente.

## Arquitectura actual

- `index.html` — estructura de la experiencia;
- `styles-v3.css` — dirección visual, responsive y estados;
- `app-v3.js` — datos, motor orbital, GSAP, fichas y Studio;
- `.github/workflows/pages.yml` — publicación estática.

La separación permite evolucionar el contenido y la capa de datos sin rehacer el motor de movimiento.

## Responsive y accesibilidad

- desktop, tablet y mobile art direction;
- órbita más compacta en móvil;
- drag/swipe prioritario en touch;
- teclado;
- labels ARIA;
- ficha con rol dialog;
- `prefers-reduced-motion`;
- controles alternativos al gesto.

## Qué se ha resuelto respecto a la Clase 02

- [x] Dirección de arte propia y coherente.
- [x] Seis platos premium producidos con contrato visual común.
- [x] Órbita / torbellino continuo.
- [x] Plato protagonista adelantándose sobre el resto.
- [x] Profundidad perceptiva 2.5D sin Three.js.
- [x] Drag, wheel, swipe, teclado y botones.
- [x] Ficha inmersiva de plato.
- [x] Transición reversible mediante Flip.
- [x] Parallax y scroll motion.
- [x] Restaurant Studio editable.
- [x] Sustitución de imágenes.
- [x] Export/import de configuración.
- [x] Responsive y reduced motion.

## Qué queda para producción comercial

- persistencia remota multiusuario;
- autenticación del cliente;
- CDN/storage propio para media;
- motor real de reservas;
- analítica y consentimiento;
- SEO local y datos estructurados completos;
- optimización final de assets y Core Web Vitals;
- tests automatizados cross-browser.

## Criterio de éxito

La experiencia debe dejar de percibirse como un slider y empezar a sentirse como un objeto manipulable. La fotografía homogénea y el movimiento continuo trabajan juntos: el código no compensa una dirección de arte inconsistente, y una buena fotografía sin jerarquía de movimiento tampoco crea una experiencia premium.
