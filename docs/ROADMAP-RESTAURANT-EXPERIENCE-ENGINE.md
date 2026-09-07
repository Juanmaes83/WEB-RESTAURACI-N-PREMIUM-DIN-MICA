# ROADMAP — RESTAURANT EXPERIENCE ENGINE + RESTAURANT STUDIO

## North Star

El producto no es una web concreta de restaurante. El activo es un **Restaurant Experience Engine + Restaurant Studio** reutilizable, donde un restaurante puede activar únicamente las capacidades que necesita, personalizarlas sin tocar código y mantener desactivado el resto.

Principio de producto:

```text
CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD
```

Principio de configuración para módulos opcionales:

```text
OFF
→ ACTIVAR
→ DESPLEGAR CAMPOS
→ PERSONALIZAR
→ PREVIEW
→ GUARDAR EN PROJECT STATE
```

Los módulos opcionales deben estar **OFF por defecto**. Si están OFF no deben reservar espacio visual, ejecutar lógica innecesaria ni contaminar la UI pública.

---

# 1. ARQUITECTURA OBJETIVO

```text
RESTAURANT EXPERIENCE ENGINE
├── CONTENT ENGINE
├── MEDIA ENGINE
├── MENU / PRODUCT ENGINE
├── PROJECT STATE
├── MOTION ENGINE
├── SECTION EXPERIENCES
├── OPTIONAL MODULES
└── INTEGRATIONS
```

Separación obligatoria:

- **Motion Engine** gobierna navegación/coreografía de producto y movimiento transversal.
- **Section Experiences** son secciones visuales premium activables.
- **Optional Modules** añaden funcionalidad/comercialización sin convertirse en motores de producto.
- **Integrations** conectan servicios externos sin acoplar el core a un proveedor.
- **Project State** sigue siendo la fuente persistente de configuración.
- **Media Engine / RestaurantStore** sigue siendo la vía para assets binarios; no crear almacenes paralelos sin necesidad.

---

# 2. MOTION CATALOG — ESTADO Y OBJETIVO

## Motores/capacidades ya construidos

1. **Elegant Orbit** — órbita elegante, lift/twist/settle contenido.
2. **Urban Acrobatics** — coreografía orbital agresiva con spins, sweeps y recoil.
3. **Editorial Flow** — flujo editorial de productos con hero central y copy sincronizado.
4. **Depth Carousel** — colección 2.5D con profundidad, parallax y drag continuo.
5. **Anchor Scenes** — escenas precompuestas con ancla fija y cambio de producto.
6. **Orbital Food Slider** — órbita física continua de platos con mundos visuales sincronizados.
7. **Pizza Slice Orbit Premium** — ocho porciones independientes orbitando una estación HERO fija.
8. **Circular Dish Rotator / Full Pizza Wheel** — producto circular completo que gira como una unidad; Discover/ruleta, storytelling, personalización y commerce.
9. **Dish Stage** — escenario limpio de producto HERO con outgoing/incoming coexistentes, drag fraccional y continuidad espacial.

## Pendientes principales

10. **Scroll Traveler / Red Prawn Journey** — objeto persistente que viaja entre capítulos de la página según scroll. Capacidad transversal; puede coexistir con cualquier motor de producto.
11. **Cinematic Product Rail** — colección horizontal cinematográfica con previous / HERO / next y movimiento de colección completo, evitando apariencia de carrusel convencional.

## Motion Catalog Integration Pass

Después de cerrar los motores pendientes:

- promover **Circular Dish Rotator** desde LAB a preset/capacidad oficial de Studio;
- promover **Dish Stage** desde LAB a preset/capacidad oficial de Studio;
- conservar sus LABs como pruebas/referencias históricas;
- no borrar ni reemplazar motores existentes;
- evitar forzar capacidades incompatibles dentro del antiguo dropdown Orbital;
- separar claramente **Product Motion** y **Page Motion** cuando sea necesario.

Objetivo de Studio:

```text
MOTION
├── PRODUCT MOTION
│   ├── Elegant Orbit
│   ├── Urban Acrobatics
│   ├── Editorial Flow
│   ├── Depth Carousel
│   ├── Anchor Scenes
│   ├── Orbital Food Slider
│   ├── Pizza Slice Orbit
│   ├── Circular Dish Rotator
│   ├── Dish Stage
│   └── Cinematic Product Rail
└── PAGE MOTION
    └── Scroll Traveler
```

---

# 3. OPTIONAL MODULES — NUEVA CAPA DE PERSONALIZACIÓN

Todos los módulos siguientes son **opcionales, activables y plegables** en Studio.

Patrón UI común:

```text
┌────────────────────────────────────────┐
│ NOMBRE DEL MÓDULO               OFF ○ │
│ Descripción corta.                     │
└────────────────────────────────────────┘

al activar:

┌────────────────────────────────────────┐
│ NOMBRE DEL MÓDULO                ● ON │
│ [campos de personalización]             │
│ [preview / configuración]               │
└────────────────────────────────────────┘
```

No mostrar decenas de campos cuando el módulo está apagado.

---

## 3.1 LOCATION / GOOGLE MAPS

**Tipo:** Optional Module + Integration.

### Objetivo

Permitir configurar una sección premium de ubicación con dirección y mapa, sin incrustar un iframe visualmente pobre como única solución.

### Studio

- Enabled OFF/ON
- Nombre del restaurante
- Dirección
- Código postal
- Ciudad
- País
- Teléfono opcional
- Horarios opcionales
- CTA label: `Cómo llegar`
- Modo de mapa:
  - generar desde dirección;
  - Google Maps URL personalizada;
  - embed/place personalizado.
- Preset visual:
  - Split Editorial
  - Full Width Map
  - Minimal Location

### Frontend

Composición editorial con mapa integrado en el lenguaje de marca.

### Regla

Si está OFF, la sección no existe en la experiencia pública.

---

## 3.2 WHATSAPP / CHAT

**Tipo:** Integration.

### Objetivo

Añadir contacto inmediato sin destruir la estética premium.

### Studio

- Enabled OFF/ON
- Número / país
- Mensaje inicial
- Texto CTA
- Posición:
  - inferior derecha;
  - inferior izquierda;
  - inline.
- Modo:
  - Direct WhatsApp CTA
  - Floating Launcher
  - External Chat Provider

### Diseño

Evitar por defecto un círculo verde genérico y sobredimensionado. Debe heredar marca, tipografía y acento del restaurante.

### Arquitectura

El core debe funcionar con un enlace WhatsApp simple. Integraciones de chatbot/proveedor se añaden mediante adapter, no como dependencia del motor base.

---

## 3.3 SOCIAL + REPUTATION / FOOTER

**Tipo:** Optional Module.

### Objetivo

Convertir el footer/contacto en una capa real de marca, reputación y descubrimiento.

### Studio

- Enabled OFF/ON
- Instagram URL
- Facebook URL
- TikTok URL opcional
- YouTube URL opcional
- Tripadvisor URL
- Google Business Profile URL
- TheFork URL opcional
- Michelin URL opcional
- Otros enlaces configurables
- Mostrar/ocultar:
  - iconos/redes;
  - CTA reviews;
  - rating manual o proveniente de integración futura.

### Frontend

Footer editorial; no una fila genérica de iconos.

Ejemplo conceptual:

```text
FOLLOW THE TABLE
Instagram · Tripadvisor · Facebook · Google
Alicante · Spain
Reservations · Contact
```

---

# 4. SECTION EXPERIENCES — BLOQUES VISUALES PREMIUM

Estas capacidades no son simples integraciones. Son experiencias de contenido activables que merecen dirección visual propia.

---

## 4.1 MEMORIES / GUEST STORIES

**Tipo:** Section Experience.

### Objetivo

Crear una sección opcional y espectacular para combinar:

- imágenes;
- vídeo;
- historia del restaurante;
- testimonios;
- clientes;
- celebraciones;
- eventos;
- prensa;
- recuerdos/momentos.

No debe terminar como una cuadrícula genérica de testimonios.

### Nombre de producto recomendado

**Memories** / **Guest Stories**.

### Presets iniciales

1. **Cinematic Memory Wall** — composición de imágenes/vídeos/citas con escalas, capas y scroll editorial.
2. **Editorial Journal** — secuencia narrativa tipo revista.
3. **Guest Mosaic** — mosaico premium con jerarquía, no grid uniforme.

### Studio

- Enabled OFF/ON
- Título
- Subtítulo
- Preset
- `+ Añadir recuerdo`
- Reordenar items

Cada item:

- tipo: imagen / vídeo / testimonio / historia / cliente;
- media;
- título;
- texto;
- autor;
- fecha opcional;
- lugar opcional;
- rating opcional;
- enlace opcional.

### Requisito visual

Debe ser una de las secciones más memorables del sistema, con layering, composición, ritmo y transiciones propias.

---

## 4.2 BEVERAGE EXPERIENCE

**Tipo:** Section Experience + Product Domain.

### Objetivo

Dar a bebidas una experiencia premium independiente de la carta de platos.

Categorías soportadas:

- vinos;
- espumosos;
- cervezas;
- cócteles;
- destilados;
- copas;
- sin alcohol;
- café / té.

### Modelo de producto beverage

- nombre;
- categoría;
- productor / bodega;
- origen;
- añada opcional;
- descripción;
- notas;
- maridaje;
- precio copa;
- precio botella;
- imagen;
- disponibilidad;
- tags opcionales.

### Presets iniciales

1. **Beverage Cellar** — botella HERO + copy + origen + precio copa/botella.
2. **Bottle Rail** — colección premium de botellas.
3. **Cocktail Stage** — hero de cóctel con ingredientes/color/atmósfera.
4. **Minimal Wine List** — modo editorial para restaurantes con carta extensa.

### Studio

- Enabled OFF/ON
- Título / subtítulo
- Preset
- Categorías activas
- Gestor de bebidas
- Reordenación
- Media por producto

### Regla

Los datos pertenecen al Beverage/Product domain; el preset sólo gobierna presentación y movimiento.

---

# 5. PROJECT STATE — CONTRATO PROPUESTO

Los módulos opcionales deben vivir dentro del estado del proyecto, no en stores nuevos.

```js
modules: {
  location: {
    enabled: false
  },
  whatsapp: {
    enabled: false
  },
  social: {
    enabled: false
  },
  memories: {
    enabled: false,
    preset: 'cinematic-memory-wall',
    items: []
  },
  beverages: {
    enabled: false,
    preset: 'beverage-cellar',
    categories: [],
    products: []
  }
}
```

Los assets binarios deben continuar utilizando Media Engine / RestaurantStore siempre que sea posible.

---

# 6. ORDEN DE EJECUCIÓN

## Fase A — cerrar catálogo Motion

1. Scroll Traveler / Red Prawn Journey.
2. Cinematic Product Rail.
3. Motion Catalog Integration Pass.
4. Integrar Circular Dish Rotator y Dish Stage como capacidades oficiales de Studio sin borrar sus LABs.
5. Regression + human visual validation.

## Fase B — personalización comercial rápida

6. Location / Google Maps.
7. Social + Reputation / Footer.
8. WhatsApp / Chat.

## Fase C — experiencias premium de contenido

9. Memories / Guest Stories.
10. Beverage Experience.

## Fase D — hardening

11. Responsive/mobile completo.
12. Reduced motion/accessibility.
13. Performance budgets.
14. Cross-browser/device QA.
15. SEO/structured data de ubicación, restaurante y productos cuando corresponda.
16. Adapters reales para reservas/pedidos/chat/reviews según cliente/proveedor.

---

# 7. REGLAS DE ACEPTACIÓN

Un módulo no se considera terminado sólo porque funcione técnicamente.

```text
CODE PASS
+
FUNCTIONAL PASS
+
VISUAL PASS
+
PRODUCT PASS
=
APPROVED
```

Para módulos visuales (Memories/Beverages/Motion), la validación humana visual es obligatoria antes de merge final.

Para integraciones (Maps/WhatsApp/Social), además debe comprobarse:

- configuración OFF/ON;
- persistencia;
- ausencia total de UI pública al estar OFF;
- enlaces/acciones correctos;
- mobile;
- accesibilidad;
- no regresión de motores existentes.

---

# 8. RESULTADO OBJETIVO

Restaurant Studio debe poder construir una experiencia donde un restaurante decida, por ejemplo:

```text
Product Motion      → Dish Stage
Page Motion         → Scroll Traveler
Memories            → ON / Cinematic Memory Wall
Beverages           → ON / Beverage Cellar
Location            → ON / Split Editorial Map
WhatsApp            → ON
Social / Reputation → ON
```

mientras otro restaurante puede dejar todos esos módulos OFF y conservar una experiencia más minimalista.

La personalización no debe requerir tocar código.
