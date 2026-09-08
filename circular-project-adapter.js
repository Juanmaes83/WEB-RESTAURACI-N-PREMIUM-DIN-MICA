/* FASE 1C — CIRCULAR DISH ROTATOR · adapter de PROYECTO (sólo lectura).

   Lo carga únicamente la puerta PRODUCTIVA de la experiencia, antes del motor. Dentro
   del producto no puede haber un segundo Studio ni un segundo Project State, así que
   este fichero es el único sitio donde Circular mira: el proyecto activo.

       PROJECT STATE
         ├── pizzaSliceOrbit.products   → 8 sectores (unidos por NOMBRE)
         ├── pizzaSliceOrbit.brand      → perfil (marca, colección, acento, CTA)
         └── circularDishRotator.media  → refs de media (Media Library)
                  ↓  adapter de sólo lectura
            MOTOR CANÓNICO (geometría propia, intacta)

   Tres reglas que este adapter NO rompe:

   1. La GEOMETRÍA es del motor. Ocho sectores, 45°, en el orden del asset horneado. La
      unión se hace por nombre y el orden lo sigue mandando el motor; unir por índice
      desincronizaría la foto de la porción y su etiqueta. Un producto que el proyecto
      marque como no disponible tampoco desaparece: quitar un sector dejaría un hueco
      fotográfico. Eso es semántica del motor, no del catálogo.

   2. NO se inventa nada. El fallback es campo a campo contra el demo que el motor pasa:
      si el proyecto no trae un valor —o lo trae nulo, como el precio, que en
      `pizzaSliceOrbit` es `null` a propósito en las ocho— se conserva el del motor.

   3. Sólo LEE. Ni escribe, ni persiste, ni expone nada que prometa guardar. Lo que se
      edita, se edita en el Studio del producto.

   Abierta la experiencia directamente (fuera del producto) este fichero no se carga y el
   motor se comporta exactamente como siempre, con su contenido demo.
*/
(() => {
  'use strict';

  const NS_PRODUCTS_DEFAULT = 'pizzaSliceOrbit';
  const NS_SELF = 'circularDishRotator';

  /* La configuración VIVA, no la plantilla. Dentro del marco, el puente ya ha fundido el
     proyecto activo sobre `RestaurantDefaults`; en una página con Studio, las ediciones
     viven en la copia de trabajo que expone `RestaurantStudioConfig`. Leer la plantilla
     mostraría los valores originales para siempre. */
  const cfg = key => window.RestaurantStudioConfig?.get?.(key)
    || window.RestaurantDefaults?.[key]
    || null;

  const self = () => cfg(NS_SELF) || {};
  const productsNs = () => self().productsFrom || NS_PRODUCTS_DEFAULT;
  const domain = () => cfg(productsNs()) || {};

  const text = v => (typeof v === 'string' ? v.trim() : '');
  /* mismo plato escrito de dos maneras: se compara sin acentos, sin signos y sin caja */
  const norm = v => text(v).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');

  /* ---------- 1. los ocho sectores ---------- */
  function sectors(demo) {
    const base = Array.isArray(demo) ? demo : [];
    const products = Array.isArray(domain().products) ? domain().products : [];
    if (!base.length || !products.length) return base;

    const byName = new Map();
    for (const p of products) {
      const k = norm(p?.name);
      if (k && !byName.has(k)) byName.set(k, p);
    }

    let joined = 0;
    const out = base.map((sector, i) => {
      const p = byName.get(norm(sector.name));
      /* A) el proyecto no tiene este producto: el sector se queda como DEMO, entero */
      if (!p) return {...sector};
      joined++;
      return {
        ...sector,
        name: text(p.name) || sector.name,
        ingredients: text(p.ingredients) || sector.ingredients,
        descriptor: text(p.descriptor) || sector.descriptor,
        accent: text(p.accent) || sector.accent,
        lead: text(p.headlineLead) || sector.lead,
        tail: text(p.headlineTail) || sector.tail,
        /* el `mood` del motor lleva el ordinal del sector (`FIRE · SIGNATURE 01`), que
           es geometría; el del proyecto es sólo el ánimo. Se compone conservando el
           ordinal en vez de perderlo. */
        mood: text(p.mood)
          ? `${text(p.mood).toUpperCase()} · SIGNATURE ${String(i + 1).padStart(2, '0')}`
          : sector.mood,
        /* El precio NO cae al demo. Si el proyecto tiene este producto, es la
           autoridad sobre su precio, y `null` significa exactamente "sin precio
           auténtico" — no "usa el de la demo". Mostrar €14 aquí sería inventar un
           dato del restaurante.

             B) producto encontrado y `price` nulo/vacío → sin precio ('')
             C) producto encontrado con precio real      → ese precio

           Cadena vacía y no `null` porque es lo que consumen el DOM y el resumen de
           pedido, que ya la tratan como ausencia. */
        price: text(p.price)
      };
    });

    document.documentElement.dataset.circularSource = `project:${joined}/${base.length}`;
    return out;
  }

  /* ---------- 2. el perfil de restaurante ---------- */
  function profile(defaults) {
    const d = defaults || {};
    const brand = domain().brand || {};
    const project = cfg('brand') || {};
    return {
      ...d,
      restaurantName: text(brand.restaurantName) || text(project.name) || d.restaurantName,
      collectionLabel: text(brand.collectionName) || d.collectionLabel,
      usePizzaPalette: typeof brand.perProductWorlds === 'boolean'
        ? brand.perProductWorlds : d.usePizzaPalette,
      brandAccent: text(brand.accent) || text(project.accent) || d.brandAccent,
      primaryAction: brand.ctaPriority === 'reserve' ? 'reserve'
        : brand.ctaPriority === 'order' ? 'order' : d.primaryAction,
      orderUrl: text(brand.orderUrl) || d.orderUrl,
      reservationUrl: text(brand.reservationUrl) || d.reservationUrl
    };
  }

  /* ---------- 3. la media, por la Media Library del proyecto ---------- */
  /* Una ref vacía deja el asset demo del motor en su sitio; `slot:<nombre>` resuelve
     contra las ranuras de media del proyecto; cualquier otra cosa se toma como URL. */
  function resolveRef(ref) {
    const v = text(ref);
    if (!v) return '';
    if (v.startsWith('slot:')) {
      const slot = v.slice(5);
      /* primero la Media Library del proyecto —que resuelve también la media subida,
         viva como blob en el store del padre—, después la plantilla */
      const resolved = text(window.RestaurantProjectMedia?.resolve?.(slot));
      if (resolved) return resolved;
      const media = cfg('media') || {};
      return text(media[slot]?.url);
    }
    return v;
  }

  function media() {
    const refs = self().media || {};
    const out = {};
    for (const key of ['logo', 'wheel', 'background']) out[key] = resolveRef(refs[key]);
    document.documentElement.dataset.circularMedia =
      Object.entries(out).filter(([, v]) => v).map(([k]) => k).join(',') || 'demo';
    return out;
  }

  window.RestaurantCircularSource = Object.freeze({sectors, profile, media});
})();
