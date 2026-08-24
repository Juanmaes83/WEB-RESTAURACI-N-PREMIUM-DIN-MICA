# WEB RESTAURACIÓN PREMIUM DINÁMICA

## CLASE 03 — Orbital Restaurant Experience Engine

La Clase 03 corrige el principal límite de la versión anterior: el carrusel discreto. La demo evoluciona a una experiencia gastronómica premium con **órbita continua de platos, profundidad perceptiva 2.5D, fichas inmersivas, parallax y personalización desde un Restaurant Studio**.

## Demo

- GitHub Pages: `https://juanmaes83.github.io/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/`
- Preview alternativo: `https://raw.githack.com/Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/main/index.html`

## Qué cambia en Clase 03

### 1. Dirección de arte propia

Se han generado expresamente seis platos premium con un contrato visual común:

- 1:1;
- fondo carbón oscuro uniforme;
- plato marfil centrado;
- misma escala aparente (~72% del lienzo);
- misma perspectiva cenital/casi cenital;
- misma dirección de luz y sombra;
- gastronomía distinta pero coherente.

Platos: Wild Red Prawn, Bluefin / Blood Orange, Charred Artichoke, Wild Sea Bass, Iberian Presa y Burnt Honey Citrus.

También se han producido interior, chef y materia prima dentro del mismo universo Mediterranean Dark Editorial.

### 2. Orbital Menu

Los platos ya no cambian entre izquierda/centro/derecha. Cada plato se mueve continuamente sobre una elipse y su posición gobierna:

- X/Y;
- escala;
- opacidad;
- blur;
- brillo;
- rotación sutil;
- z-index.

El plato central se adelanta visualmente y vuelve a hundirse en la órbita cuando cede el foco al siguiente.

### 3. Interacción

- wheel / trackpad;
- drag;
- swipe;
- botones;
- teclado;
- snap al plato más cercano.

### 4. Dish Detail inmersivo

`Explore dish +` mueve el mismo plato desde la órbita a una ficha premium mediante GSAP Flip. La ficha incluye precio, ingredientes, origen, técnica, maridaje, chef note y alérgenos. Al cerrar, el plato vuelve a su lugar orbital.

### 5. Motion System

GSAP 3.13:

- Core;
- ScrollTrigger;
- Observer;
- Flip.

Se utiliza para la órbita, transición plato/ficha, parallax, reveals, progreso de scroll y cursor contextual.

### 6. Restaurant Studio

El botón `Studio` demuestra que la web puede funcionar como plantilla:

- editar nombre del restaurante;
- cambiar color de acento;
- editar nombre/precio/descripción de platos;
- sustituir imagen por URL;
- subir imagen local;
- normalizar upload a 1024×1024 WebP sobre fondo oscuro;
- exportar/importar configuración JSON;
- resetear la demo.

**Límite consciente:** la persistencia actual es `localStorage`. Es un CMS local de demostración, no un backend remoto multiusuario. La siguiente capa productiva sería Supabase/Postgres + Storage + Auth o CMS equivalente.

## Arquitectura

```text
/
├── index.html
├── styles-v3.css
├── app-v3.js
├── README.md
├── docs/
│   ├── CLASS-03-ORBITAL-PREMIUM.md
│   ├── CLASS-03-ERRORS-SOLUTIONS.md
│   └── IMPLEMENTATION-LOG.md
└── .github/workflows/pages.yml
```

## Criterio de éxito

La experiencia debe dejar de percibirse como un slider y empezar a sentirse como un objeto manipulable. La fotografía homogénea y el movimiento continuo trabajan juntos.

## Producción comercial pendiente

- persistencia remota multiusuario;
- auth y permisos;
- storage/CDN propio;
- motor de reservas real;
- analytics/consentimiento;
- SEO local y schema completo;
- optimización final de media/Core Web Vitals;
- tests automáticos cross-browser.

LÚMINA sigue siendo una marca ficticia de demostración docente. El activo reutilizable es el **Restaurant Experience Engine**.