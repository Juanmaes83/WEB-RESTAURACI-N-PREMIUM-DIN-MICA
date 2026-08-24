# CLASE 05 — MOTION DIRECTION PREMIUM

## Propósito

La Clase 05 no reconstruirá la web. Parte de la Clase 04 aprobada y añade una nueva capa de dirección de movimiento.

Contrato:

`CLASE 05 = CLASE 04 APROBADA + MOTION DIRECTION PREMIUM`

No se permite degradar:

- Studio;
- personalización;
- persistencia/fallback;
- Orbital Menu;
- detalle inmersivo;
- reserva;
- responsive;
- contenido editable.

## Objetivo

Conseguir que navegar por la web deje de sentirse como recorrer secciones independientes y se convierta en una experiencia audiovisual interactiva coherente.

La mejora debe ser visible sin explicación verbal.

## 1. Hero cinematográfico

Crear una secuencia de apertura de aproximadamente 1,5–2 segundos:

1. media entra con escala/respiración controlada;
2. kicker aparece con tracking progresivo;
3. línea principal se revela mediante máscara;
4. segunda línea entra con una dirección/ritmo diferente;
5. copy lateral aparece después;
6. navegación y elementos secundarios cierran la composición.

El Hero no debe ser un simple `fadeIn` simultáneo.

## 2. Gramática de movimiento por sección

Cada capítulo tendrá una firma distinta.

### Philosophy

- titular línea a línea o mediante clip/máscara;
- aparición editorial del énfasis;
- cuerpos secundarios escalonados.

### Orbital Menu

- entrada escénica de la colección;
- platos emergen desde profundidad;
- distribución progresiva por la órbita;
- protagonista avanza al centro;
- copy sincronizado con la llegada.

La interacción existente debe conservar wheel, drag, swipe, teclado, momentum y snap.

### Origin

- mask reveal del media;
- parallax controlado;
- copy sticky o desplazamiento diferencial;
- transición producto → lugar → procedencia.

### Atmosphere

- imagen o vídeo con zoom lento;
- máscara de entrada distinta de Origin;
- captions/narrativa escalonados;
- posibilidad de transición de plano si hay vídeo/media adicional.

### Chef

- crop/reveal propio;
- quote con ritmo textual;
- meta/badges posteriores;
- movimiento diferencial entre retrato y texto.

### Reservation

- el color de acento no aparece simplemente de golpe;
- la transición debe preparar el cambio y convertir la reserva en cierre narrativo.

## 3. Hover system premium

### Fotografías

- zoom suave aproximado 1 → 1.04/1.06;
- easing lento;
- opción de desplazamiento focal muy sutil;
- caption reveal cuando proceda.

### Plato activo

- micro scale/depth;
- sombra/contraste;
- cursor EXPLORE;
- click directo sobre el protagonista abre la ficha.

### Botones

- magnetic hover sutil cuando sea apropiado;
- arrow motion;
- underline/fill transition;
- sin perjudicar accesibilidad ni tactilidad móvil.

## 4. Cursor contextual

Estados previstos:

- DRAG;
- VIEW;
- EXPLORE;
- ZOOM;
- RESERVE;
- CLOSE;
- EDIT en Studio cuando corresponda.

Sólo desktop/pointer fine.

## 5. Transiciones entre secciones

Reducir la sensación:

`SECCIÓN → CORTE → SECCIÓN → CORTE`

Explorar con criterio:

- overlap;
- masks;
- background transitions;
- sticky/pinning temporal;
- elementos que cruzan el límite entre capítulos;
- parallax con velocidades distintas.

No abusar de pinning ni convertir el scroll en una demo técnica.

## 6. Motion configurable desde Studio

Añadir controles limitados y seguros, no un After Effects dentro del CMS.

Preset global sugerido:

- Reduced;
- Elegant;
- Cinematic.

Posibles presets por sección:

- Mask;
- Slide;
- Split;
- Scale;
- Fade editorial.

El usuario puede elegir dentro de un sistema diseñado; no debe poder destruir la identidad visual.

## 7. Mobile Motion Direction

No reducir simplemente el desktop.

En móvil:

- menor amplitud;
- duraciones más cortas;
- menos blur/filtros caros;
- swipe prioritario;
- protagonista orbital dominante;
- transiciones adaptadas al viewport vertical.

## 8. Reduced motion

`prefers-reduced-motion` debe mantener:

- contenido accesible;
- navegación;
- Orbital Menu usable mediante botones/teclado;
- Studio operativo;
- ausencia de animaciones innecesarias.

## 9. Performance durante Motion

La dirección de movimiento debe trabajar dentro de un presupuesto.

Objetivos:

- evitar creación masiva de tweens por frame;
- mantener render orbital directo y progresión animada externa;
- limitar blur/filtros GPU en móvil;
- evitar layouts forzados en scroll;
- revisar ScrollTrigger activos;
- preservar objetivo de 60fps cuando el hardware lo permita.

## 10. Regression Matrix obligatoria

Antes de fusionar Clase 05 se compara con la Clase 04 aprobada.

### Funcionalidad que debe seguir PASS

- Studio abre/cierra;
- editar marca;
- editar copy;
- subir imagen;
- subir vídeo;
- editar plato;
- proyecto se restaura;
- fallback de storage no tumba la web;
- reserva funciona;
- ficha funciona.

### Experiencia pública que debe seguir PASS

- Orbital next/prev;
- wheel;
- drag;
- keyboard;
- snap;
- profundidad 2.5D;
- copy sincronizado;
- detail → return orbit;
- responsive.

### Nueva capa que debe demostrar Clase 05

- Hero claramente más cinematográfico;
- reveals diferenciados por capítulo;
- hover premium;
- transiciones entre secciones;
- cursor contextual ampliado;
- Orbital Menu con entrada escénica;
- motion preset desde Studio;
- reduced motion;
- mobile motion específico.

## 11. Demostración de aprobación

La prueba final será A/B:

`Clase 04 baseline` vs `Clase 05`

Mismo restaurante, mismo contenido, mismos assets.

La diferencia debe proceder esencialmente de la dirección de movimiento.

Criterio docente:

> Si hay que explicar dónde está la mejora, la Clase 05 no ha mejorado lo suficiente.

## 12. Lo que NO haremos en Clase 05

No se utilizará la clase para:

- rehacer el Studio;
- cambiar el modelo de datos;
- implantar backend remoto;
- reescribir el Orbital Engine;
- hacer SEO final;
- hacer la auditoría final de producción.

Esos cambios romperían el foco.

## 13. Preparación para Clase 06

Clase 06 recibirá una plataforma ya editable y con motion premium y se concentrará en:

- QA exhaustivo;
- responsive final;
- performance;
- accesibilidad;
- SEO/schema;
- publicación estable;
- prueba de segundo restaurante;
- documentación final.

## Regla maestra heredada de Clase 04

`CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`

Antes de cualquier merge de Clase 05 debe existir una comparación explícita contra el baseline de Clase 04.
