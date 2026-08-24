# CLASE 02 — IMPLEMENTATION LOG

## De la teoría a una web completa de restauración

Este documento registra **decisiones, problemas, errores potenciales detectados durante la implementación y soluciones adoptadas**. El objetivo no es presentar una construcción “mágicamente perfecta”, sino enseñar cómo se toma una demo de aula y se convierte en una interfaz comercial razonablemente robusta.

---

## 1. Punto de partida

El repositorio estaba vacío. No había framework, componentes, dependencias, assets ni configuración de despliegue.

### Decisión

Construir una primera versión con **HTML + CSS + JavaScript nativo**.

### Motivo

- Reduce fricción para estudiantes de primero.
- Hace visible toda la arquitectura.
- Permite aislar claramente estructura, estilos y comportamiento.
- Evita confundir calidad visual con complejidad de stack.
- Permite servir la demo como sitio estático.

---

## 2. Problema: un carrusel bonito no es una web de restaurante

### Riesgo

La Clase 01 podía quedarse en un único componente espectacular pero comercialmente incompleto.

### Solución

Diseñar una arquitectura de página completa:

1. navegación;
2. hero;
3. posicionamiento / manifiesto;
4. platos signature;
5. menú;
6. experiencia;
7. chef;
8. reserva;
9. ubicación y horarios;
10. footer.

El carrusel pasa de ser “el producto” a ser **una herramienta dentro de un funnel de marca y reserva**.

---

## 3. Problema: profundidad sin WebGL ni 3D

### Riesgo

Introducir Three.js/WebGL demasiado pronto habría complicado la práctica sin aportar valor proporcional.

### Solución

Mantener profundidad perceptiva mediante:

- posición horizontal;
- `scale`;
- `opacity`;
- `z-index`;
- ligera diferencia de brillo.

La distancia circular respecto al índice activo gobierna el estado visual de cada plato.

---

## 4. Problema: carrusel circular con extremos

### Error típico

Con `d = index - active`, el primer y último elemento quedan separados aunque visualmente deberían ser vecinos.

### Solución

Normalizar la distancia:

```js
function circularDistance(i, a, n) {
  let d = i - a;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}
```

Esto permite continuidad visual sin duplicar nodos.

---

## 5. Problema: una pasada del trackpad dispara varias transiciones

### Síntoma

Los eventos `wheel` pueden emitirse muchas veces durante un solo gesto.

### Consecuencia

El usuario salta tres o cuatro platos sin querer.

### Solución

- umbral mínimo de delta;
- bloqueo temporal de 700 ms;
- navegación de un estado por gesto.

En una versión más avanzada se sustituiría por inercia real e interpolación continua.

---

## 6. Problema: el texto cambia antes que el plato

### Consecuencia

Se rompe la correspondencia entre objeto visual y copy.

### Solución

Crear una transición de salida de 170 ms antes de reemplazar contenido y volver a mostrarlo.

El objetivo es que imagen + nombre + descripción se perciban como **un mismo evento**.

---

## 7. Problema: interacción solo con ratón

### Riesgo

Una demo de escritorio puede fallar completamente en móvil o para usuarios de teclado.

### Solución

Se implementaron cuatro entradas:

- botones;
- teclado;
- rueda/trackpad;
- gesto horizontal con Pointer Events.

El escenario del carrusel tiene `tabindex="0"` y una etiqueta que explica el uso de flechas.

---

## 8. Problema: movimiento premium vs accesibilidad

### Riesgo

La animación puede ser molesta para usuarios que solicitan reducción de movimiento.

### Solución

`@media (prefers-reduced-motion: reduce)`:

- elimina prácticamente la duración de transiciones;
- detiene la órbita decorativa del hero;
- conserva el contenido y la navegación.

---

## 9. Problema: formulario de reserva sin backend

### Riesgo

Una demo pública que parece enviar reservas puede inducir a error o recoger datos sin infraestructura adecuada.

### Solución

El formulario:

- valida campos en navegador;
- simula la confirmación local;
- declara explícitamente que no envía datos reales.

### Producción

Conectar con el sistema real del cliente: CoverManager, TheFork, Resy o endpoint propio.

---

## 10. Problema: responsive no significa “encoger desktop”

### Soluciones específicas

- navegación se convierte en panel móvil;
- hero reorganiza columnas;
- grids pasan de 3 → 2 → 1 columnas;
- carrusel usa platos más grandes proporcionalmente en móvil;
- galería cambia su estructura;
- formulario pasa a una columna;
- áreas de interacción mantienen tamaño táctil.

---

## 11. Problema: imágenes pesadas y primera impresión lenta

### Solución aplicada en la demo

- imágenes servidas desde CDN externo con parámetros de tamaño/calidad;
- `loading="lazy"` fuera del contenido prioritario;
- animación únicamente de `transform`, `opacity` y estados visuales ligeros.

### Solución de producción recomendada

- descargar y licenciar assets definitivos;
- generar AVIF/WebP propios;
- `srcset` y `sizes`;
- CDN del proyecto;
- preload del hero y primer plato;
- auditoría Lighthouse.

---

## 12. Problema: dependencia visual de fotografías inconsistentes

### Observación

El motor puede estar correctamente programado y seguir pareciendo defectuoso si los platos usan ángulos, escalas o fondos incompatibles.

### Solución de dirección de arte

Para cliente real:

- misma focal aproximada;
- mismo ángulo;
- escala de plato coherente;
- iluminación compatible;
- tratamiento de color común;
- fondos fáciles de integrar.

La calidad fotográfica forma parte del sistema de interfaz.

---

## 13. Decisión: una marca ficticia en vez de copiar un restaurante real

### Motivo

La demo se llama **LÚMINA — Mediterranean Atelier** y no reproduce identidad, carta ni activos de un negocio existente.

Esto permite enseñar:

- diseño de marca;
- tono verbal;
- dirección de arte;
- arquitectura de conversión;
- adaptación del motor visual;

sin convertir la práctica en una copia literal.

---

## 14. Estado funcional implementado

### Navegación

- [x] header fijo;
- [x] navegación por secciones;
- [x] menú móvil;
- [x] indicador de progreso de scroll.

### Carrusel

- [x] loop circular;
- [x] protagonista central;
- [x] laterales visibles;
- [x] escala/opacidad/capa por estado;
- [x] copy sincronizado;
- [x] botones;
- [x] teclado;
- [x] wheel/trackpad;
- [x] swipe/pointer;
- [x] contador.

### Negocio

- [x] menú degustación;
- [x] precios;
- [x] etiquetas;
- [x] experiencia/sala;
- [x] chef;
- [x] horarios;
- [x] ubicación;
- [x] CTA de reserva recurrente;
- [x] formulario de reserva demo.

### Calidad

- [x] responsive;
- [x] reduced motion;
- [x] HTML semántico básico;
- [x] alt text;
- [x] aria labels;
- [x] lazy loading de contenido secundario.

---

## 15. Limitaciones conscientes de esta versión

No se ocultan como “errores resueltos” porque requieren una decisión de producto/cliente:

1. **Las fotografías son remotas y demostrativas.** En producción deben sustituirse por assets propios/licenciados.
2. **La reserva no llega a ningún restaurante.** Falta integración real.
3. **No hay CMS.** El contenido vive en JavaScript/HTML.
4. **No hay analítica.** Falta instrumentación de eventos.
5. **No hay SEO local completo ni schema Restaurant/Menu.**
6. **No existe backend de disponibilidad ni pagos.**

Estas limitaciones son correctas para una demo académica y deben resolverse antes de un lanzamiento comercial real.

---

## 16. Evolución para Clase 03

Transformar la demo en un sistema de producción:

- componentes;
- CMS;
- assets locales/CDN;
- integración de reservas;
- analítica;
- SEO local;
- tests de interacción;
- Lighthouse/Core Web Vitals;
- estados de carga/error;
- despliegue continuo.

---

## Conclusión

La práctica confirma el principio de la Clase 01: **primero se diseñan estados visuales; después se programa la transición entre ellos**.

La diferencia del Día 2 es que esos estados ya no viven solos. Están conectados a una experiencia de marca, navegación, información, credibilidad y conversión. Ahí es donde una animación se convierte en diseño web para un cliente real.
