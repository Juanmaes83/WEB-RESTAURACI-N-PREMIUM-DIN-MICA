# WEB RESTAURACIÓN PREMIUM DINÁMICA

## Día 2 — De la teoría a la práctica

Demo académica completa de una web premium para restauración construida desde cero a partir de los principios de la **Clase 01: presentación web inmersiva de platos**.

La misión de esta segunda clase es demostrar que el carrusel no es un efecto aislado: puede convertirse en el núcleo de un sistema comercial real para un restaurante.

## Concepto de marca de la demo

**LÚMINA — Mediterranean Atelier**  
Restaurante ficticio de cocina mediterránea contemporánea en Alicante.

La identidad se ha diseñado específicamente para la práctica:

- fondo oscuro y editorial;
- color de acento ácido para acciones y estados;
- tipografía display de alto contraste + sans funcional;
- fotografía gastronómica y de sala;
- lenguaje de marca sobrio;
- navegación sencilla y orientada a reserva.

> LÚMINA es una marca ficticia creada únicamente para esta demostración docente.

## Qué contiene la web

1. **Header flotante** con navegación por anclas, CTA y menú móvil.
2. **Hero inmersivo** de pantalla completa con fotografía, identidad y CTA.
3. **Manifiesto de marca** para introducir posicionamiento y relato.
4. **Carrusel Signature** basado en la Clase 01:
   - un plato protagonista;
   - laterales de anticipación;
   - escala y opacidad por estado;
   - copy sincronizado;
   - navegación circular;
   - botones;
   - flechas de teclado;
   - wheel / trackpad;
   - swipe/pointer táctil.
5. **Menú degustación** con nueve tarjetas, etiquetas y precio.
6. **Galería de experiencia** y dirección de arte del espacio.
7. **Bloque Chef** para construir autoridad y relato humano.
8. **Reserva** con CTA recurrente y diálogo accesible.
9. **Formulario de reserva simulado** con validación HTML nativa.
10. **Ubicación y horarios**.
11. **Responsive completo** para escritorio, tablet y móvil.
12. **Accesibilidad básica**:
    - `aria-label`;
    - `aria-live`;
    - navegación por teclado;
    - foco en el carrusel;
    - `prefers-reduced-motion`;
    - textos alternativos.
13. **Rendimiento**:
    - animación basada en `transform` y `opacity`;
    - `loading="lazy"` en contenido no prioritario;
    - imágenes remotas optimizadas por parámetros;
    - sin frameworks ni dependencias JS.

## Arquitectura

La demo está intencionadamente implementada en un único `index.html` para que estudiantes de primero puedan leer todo el sistema sin saltar entre herramientas ni configurar un entorno de compilación.

```text
/
├── index.html
├── README.md
└── docs/
    └── IMPLEMENTATION-LOG.md
```

Dentro de `index.html` se mantienen tres capas perfectamente distinguibles:

```text
HTML       → estructura + semántica
CSS        → identidad + composición + estados visuales
JavaScript → datos + interacción + máquina de estados
```

En una tercera clase el mismo sistema puede migrarse a componentes (`DishShowcase`, `ReservationDialog`, `MenuGrid`, etc.) y conectarse a un CMS o motor de reservas.

## El motor del carrusel

La lógica base sigue el principio estudiado en clase:

```js
distancia = indiceDelPlato - indiceActivo
```

La distancia se normaliza en un carrusel circular y de ella se derivan:

```text
x        → posición horizontal
scale    → profundidad perceptiva
opacity  → jerarquía
z-index  → orden de capas
filter   → énfasis del plato protagonista
```

No existe 3D real. La sensación de profundidad es perceptiva.

## Datos antes que animación

Los platos se almacenan como objetos:

```js
{
  title,
  description,
  meta,
  image
}
```

La interfaz no necesita conocer el negocio. En producción esos datos podrían proceder de WordPress, Sanity, Contentful, Webflow CMS, Shopify o una API propia.

## Reserva: qué es demo y qué sería producción

El diálogo y el formulario son funcionales en navegador, pero **no envían datos reales**. Es una decisión consciente: una demo pública no debe recoger datos personales sin backend, políticas y destino definidos.

En un cliente real el `submit` se sustituiría por integración con, por ejemplo:

- CoverManager;
- TheFork;
- Resy;
- Formspree / endpoint propio;
- CRM + automatización;
- motor de reservas existente del restaurante.

## Cómo probar la práctica

### Carrusel

- Click en flechas.
- Flechas izquierda/derecha del teclado cuando el escenario tiene foco.
- Rueda o trackpad sobre la zona de platos.
- Swipe horizontal en móvil.

### Reserva

- CTA `Reservar` del header.
- CTA del hero.
- CTA de la sección final.
- Completar datos requeridos y enviar.
- La demo muestra una confirmación local y avisa de que no se han enviado datos.

### Responsive

Probar al menos:

- 1440 × 900;
- 1024 × 768;
- 768 × 1024;
- 390 × 844.

## Objetivo docente

El alumno no debe copiar LÚMINA. Debe poder sustituir:

- nombre;
- paleta;
- tipografías;
- fotografías;
- contenido gastronómico;
- número de platos;
- escalas;
- easing;
- copy;
- CTA;
- sistema de reservas;

sin reescribir el motor central.

**Resultado esperado:** una plantilla conceptual reutilizable para alta cocina, brunch, sushi, cocktail bar, pastelería o una selección editorial de producto gastronómico.

## Siguiente evolución recomendada

1. Separar CSS y JavaScript en módulos.
2. Migrar las secciones a componentes.
3. Alojar las fotografías en el propio proyecto/CDN del cliente.
4. Añadir CMS.
5. Conectar motor de reservas real.
6. Añadir analítica de eventos: `dish_view`, `reservation_open`, `reservation_submit`, `menu_engagement`.
7. Ejecutar auditoría Lighthouse y optimizar Core Web Vitals.
8. Añadir SEO local y datos estructurados `Restaurant`/`Menu`.

## Documentación de implementación

Ver [`docs/IMPLEMENTATION-LOG.md`](docs/IMPLEMENTATION-LOG.md) para decisiones, problemas encontrados y soluciones aplicadas durante la construcción.
