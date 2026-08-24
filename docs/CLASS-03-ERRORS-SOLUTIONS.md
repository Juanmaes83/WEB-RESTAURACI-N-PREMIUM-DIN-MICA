# CLASE 03 — ERRORES, DECISIONES Y SOLUCIONES

## 1. Error heredado: confundir órbita con carrusel

**Problema:** la Clase 02 movía los platos principalmente como estados discretos.

**Solución:** sustituir el modelo por un progreso orbital continuo. Cada plato calcula su posición sobre una elipse y deriva su profundidad visual de ese punto.

## 2. Riesgo: intentar resolver la profundidad con Three.js

**Problema:** añadir 3D real habría aumentado peso y complejidad sin respetar el truco visual de la referencia.

**Solución:** mantener imágenes 2D con un contrato fotográfico estricto y construir 2.5D mediante escala, blur, brillo, opacidad, rotación y z-index.

## 3. Problema: fotografías incompatibles destruyen la ilusión

**Solución aplicada:** producir seis platos nuevos con el mismo fondo oscuro, misma vajilla, encuadre, distancia y luz.

## 4. Problema: un plato cambia de pantalla al abrir la ficha

**Riesgo:** parecer un modal convencional sin continuidad espacial.

**Solución:** mover el mismo nodo DOM desde la órbita a la ficha y usar GSAP Flip para animar el cambio de posición/tamaño. Al cerrar se invierte el proceso.

## 5. Problema: wheel y touch producen entradas diferentes

**Solución:** Observer para wheel y eventos Pointer para drag/swipe; todas las entradas gobiernan la misma variable `orbitProgress`.

## 6. Problema: drag sin resolución final

**Solución:** proyectar la velocidad al soltar y hacer `snap` al índice entero más cercano. La interacción tiene momentum perceptivo sin requerir Three.js.

## 7. Problema: una plantilla no puede depender de editar JavaScript

**Solución:** Restaurant Studio con edición de marca/platos, subida de imagen, export/import JSON y persistencia local.

## 8. Límite actual del “mini backend”

**Transparencia:** `localStorage` no es un backend remoto. Es una capa CMS local para demostrar que el motor está desacoplado del contenido y que una imagen puede sustituirse sin editar código.

**Producción siguiente:** Supabase/Postgres + Storage + Auth o CMS equivalente.

## 9. Riesgo: uploads visualmente incompatibles

**Solución:** el Studio redimensiona las imágenes a 1024 × 1024 WebP sobre fondo oscuro, y documenta el contrato visual recomendado. Esto normaliza formato, pero no puede corregir automáticamente una fotografía tomada desde otra perspectiva; esa sigue siendo una responsabilidad de dirección de arte.

## 10. Problema: el espectáculo degrada la accesibilidad

**Solución:** controles de teclado/botones, etiquetas ARIA y `prefers-reduced-motion` para reducir animación sin perder acceso al contenido.

## 11. Problema: parallax genérico

**Solución:** aplicar scroll motion solo a imágenes/hero y reservar la interacción fuerte para el Orbital Menu. La jerarquía de efectos evita que toda la página compita por atención.

## 12. Estado honesto

La Clase 03 está diseñada como demostración premium funcional y personalizable en navegador. No debe presentarse todavía como SaaS terminado: faltan persistencia remota, auth, storage propio, reservas reales, analítica, SEO local completo y pruebas automáticas cross-browser.
