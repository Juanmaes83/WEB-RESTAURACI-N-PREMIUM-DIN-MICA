# VALIDACIÓN FINAL — CLASE 02

## Objetivo

Comprobar que la demo LÚMINA funciona como una web completa de restauración y no únicamente como una animación aislada.

## 1. Estructura

- [x] Documento HTML válido como página autónoma.
- [x] `lang="es"`, viewport y metadatos básicos.
- [x] Header, main, sections y footer.
- [x] Navegación por anclas.
- [x] CTA de reserva accesible desde varios puntos.

## 2. Carrusel Signature

- [x] Cinco platos cargados desde datos.
- [x] Índice activo inicial.
- [x] Loop circular.
- [x] Protagonista central dominante.
- [x] Vecinos laterales como anticipación.
- [x] Estados derivados de distancia circular.
- [x] Escala, opacidad, `z-index` y brillo.
- [x] Copy sincronizado.
- [x] Contador `01 / 05`.
- [x] Botones anterior/siguiente.
- [x] Flechas izquierda/derecha.
- [x] Wheel/trackpad con lock anti-salto.
- [x] Swipe horizontal con Pointer Events.

## 3. Navegación responsive

- [x] Header desktop.
- [x] Botón menú en tablet/móvil.
- [x] Panel móvil a pantalla completa.
- [x] Cierre explícito del panel.
- [x] Cierre al navegar a una sección.

## 4. Contenido comercial

- [x] Hero y propuesta de valor.
- [x] Filosofía de marca.
- [x] Platos signature.
- [x] Menú degustación.
- [x] Precios y etiquetas.
- [x] Galería de ambiente.
- [x] Perfil de chef.
- [x] Reserva.
- [x] Horarios.
- [x] Ubicación.
- [x] Footer.

## 5. Reserva demo

- [x] Apertura mediante `dialog` nativo.
- [x] Cierre por botón.
- [x] Cierre al pulsar backdrop.
- [x] Campos requeridos.
- [x] Validación nativa de email/fecha.
- [x] Fecha mínima = día actual.
- [x] Confirmación local tras submit.
- [x] Aviso explícito de que no se envían datos reales.

## 6. Accesibilidad

- [x] Textos alternativos en imágenes informativas.
- [x] `aria-label` en controles.
- [x] `aria-live="polite"` para cambios de plato.
- [x] Carrusel enfocable con teclado.
- [x] Controles visibles además de gestos.
- [x] `prefers-reduced-motion`.
- [x] Tamaño táctil suficiente en controles principales.

## 7. Rendimiento / estabilidad visual

- [x] Transiciones principales con `transform` y `opacity`.
- [x] Lazy loading en imágenes secundarias.
- [x] Sin framework ni bundle.
- [x] Imágenes de demostración solicitadas a CDN con ancho/calidad limitados.
- [x] No se usa vídeo para simular el carrusel.

## 8. Responsive objetivo

Breakpoints implementados:

- Desktop > 900 px.
- Tablet <= 900 px.
- Mobile <= 620 px.

Escenarios de validación recomendados:

- 1440 × 900.
- 1024 × 768.
- 768 × 1024.
- 390 × 844.

## 9. Publicación

- [x] Repositorio público y accesible.
- [x] `index.html` en `main`.
- [x] Workflow de GitHub Pages incluido en `.github/workflows/pages.yml`.
- [x] `actions/configure-pages@v5` con `enablement: true`.
- [x] Artefacto estático y `deploy-pages@v4` configurados.

URL esperada de GitHub Pages:

`https://juanmaes83.github.io/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/`

Fallback de render estático mientras GitHub Pages completa su primera activación:

`https://raw.githack.com/Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/main/index.html`

## 10. Límites conscientes antes de producción comercial

- [ ] Sustituir fotografías demo por material propio/licenciado.
- [ ] Conectar motor de reservas real.
- [ ] Implementar CMS.
- [ ] Instrumentar analítica y consentimiento.
- [ ] Añadir SEO local y schema `Restaurant` / `Menu`.
- [ ] Ejecutar Lighthouse y pruebas en dispositivos físicos.
- [ ] Añadir tests automatizados de interacción si el proyecto evoluciona.

## Veredicto

**APTO COMO DEMO ACADÉMICA COMPLETA Y NAVEGABLE.**

No debe presentarse todavía como una web comercial conectada a operaciones reales porque la reserva, el CMS, la analítica y los assets definitivos se han dejado conscientemente fuera del alcance de esta Clase 02.
