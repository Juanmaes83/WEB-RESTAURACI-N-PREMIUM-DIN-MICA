# CLASS 23 — MEMORIES · AUDITORÍA PREVIA

Leída del código en `477dac2` (main, con Fase 1C ya mergeada), **antes** de implementar.
Responde sólo lo que hace falta para construir sin inventar arquitectura.

## PROJECT STATE PATH

`modules.memories` — la ubicación que el roadmap ya reservaba. Sin incompatibilidad
técnica, pero **con un detalle de orden de carga que sí la habría causado**:

`class20-modules-studio.js` **reemplaza** el objeto entero:

```js
RestaurantDefaults.modules = { location:…, social:…, whatsapp:… };   // asignación, no merge
```

y se carga en `index.html` **antes** de `app-v4.js`, que clona la plantilla en su copia
de trabajo. Consecuencias:

- declarar `modules.memories` en `class4-config.js` no serviría: class20 lo borra;
- declararlo desde el runtime (que se carga *después* de app-v4) llega tarde para la
  copia de trabajo del proyecto.

Solución sin tocar el orden ni crear estado paralelo: el modelo se declara en la
plantilla (`RestaurantDefaults.modules.memories`, añadido por el propio Class 23) **y**
se siembra en el proyecto vivo si la rama no existe, escribiendo por referencia sobre el
objeto que devuelve `RestaurantStudioConfig.get('modules')` — es una migración de
esquema, no una edición del usuario, así que no debe entrar en el historial de Undo ni
marcar el proyecto como sucio. Las ediciones reales van todas por `set`.

## STUDIO INSERTION

Patrón ya establecido por Class 20, que se reutiliza tal cual:

```js
const button = el('button','','Memories'); button.dataset.panel='memories';
document.querySelector('.studio-nav [data-panel="project"]').before(button);
document.querySelector('#studio-scroll').append(panel);      // construido en el primer click
button.addEventListener('click', build);                      // lazy: no se construye al arrancar
document.addEventListener('restaurant:config-applied', sync);
```

Dos cosas que la arquitectura ya enseñó y hay que respetar:

- **el Studio enlaza los `[data-path]` una sola vez al arrancar**, así que un panel
  creado después tiene que escribir él mismo por `RestaurantStudioConfig.set`;
- **construir el panel de forma perezosa** (en el primer click). Class 19 provocó una
  carrera de restauración de preset por construirse con el cajón cerrado.

## MEDIA API

Una sola, la de siempre — `class4-store.js`, IndexedDB `restaurant-premium-studio` v3
con fallback a Cache Storage + `localStorage` para los metadatos:

```
RestaurantStore.saveMedia(slot, file, meta)   → record {slot,file,name,type,kind,size,…}
RestaurantStore.loadMedia(slot)               → record | null
RestaurantStore.listMedia()                   → record[]
RestaurantStore.deleteMedia(slot)
```

`saveMedia` ya distingue `kind: 'video' | 'image'` por el MIME del Blob, así que **el
vídeo no necesita infraestructura nueva**. La clave es un `slot` (string) libre: es el
punto de anclaje para una referencia lógica estable.

## MEDIA RESOLUTION

Aquí está el hueco real. `app-v4.js` resuelve media **internamente**:

```js
function replaceObjectUrl(key,blob){…}                      // caché de object URLs
function resolveMedia(slot,fallback=''){ return objectUrls[slot] || config.media?.[slot]?.url || fallback }
```

y la hidratación al arrancar recorre una **lista fija**: `['logo','hero','origin','atmosphere','chef']`
más los ids de plato. No hay resolver público (`class22-experience-shell.js:72` ya
llamaba a un `window.RestaurantMediaResolve` **que no existe**, con `?.`, y caía al
fallback).

Decisión: exponer un adaptador canónico **compartido** —`RestaurantMedia`— sobre
`RestaurantStore`, con caché de object URLs y revocación. No es un almacén: no guarda
nada por su cuenta. Sirve a Memories hoy y a Beverages en Fase 3, y es el punto donde
Cloud Media sustituirá al proveedor sin migrar el dominio.

## UNDO/REDO

Existe y es de la casa; no se crea historia propia:

```js
function snapshot(){ history.push(JSON.stringify(config)); … }
function mutate(fn,{immediate}={}){ snapshot(); fn(); applyAll(); scheduleSave() }
RestaurantStudioConfig = { get, set(path,value){ mutate(()=>pathSet(config,path,value)) }, snapshot }
```

`pathSet` parte el path por `.` y funciona con índices numéricos, así que
`modules.memories.items.2.title` es un path válido. **Reordenar y borrar se hacen
escribiendo el array completo** (`set('modules.memories.items', next)`): una entrada de
historial por operación, que es lo que hace que Undo devuelva el ítem *con* su
referencia de media.

## PUBLIC INSERTION

Orden real de la página: `hero → #story → #signature → #experience → .experience-section
→ .chef-section → #visit → footer`. Los módulos ya insertan así: Location tras `#visit`,
Social al principio del `footer`, WhatsApp al final del `body`.

Memories entra **antes de `#visit`**: la memoria del restaurante cierra el relato justo
antes de la invitación a reservar. Queda `… chef → MEMORIES → visit → location → footer`.

## LIFECYCLE

- carga aditiva desde `class4-runtime-guard.js`, como Class 21 y Class 22 — **`index.html`
  no se toca**;
- `restaurant:config-applied` → `applyConfig()`; comparación por *fingerprint* para no
  repintar sin cambios (el patrón de Class 20);
- OFF ⇒ se desmonta el host y se cortan observers: cero DOM, cero espacio, cero trabajo;
- vídeo: `IntersectionObserver` para pausar fuera de viewport, `visibilitychange` para
  pausar con el documento oculto, y pausa al apagar; los object URLs se revocan al
  desmontar.

## RISKS

1. **Scroll Traveler.** Su ruta ancla en `.chef-section` y `#visit`, y Memories se
   inserta justo en medio: el objeto sobrevolará la sección nueva. **No se rediseña
   Project 09.** `styles-v14.css` documenta el contrato: el contenido de la página se
   eleva a la escala de capas (`copy: 5`, `media: 3`) bajo
   `html[data-scroll-traveler="ready"]`. Memories se suma a ese contrato desde su propia
   hoja. A verificar con `elementFromPoint`, no con rects — un rect no demuestra quién
   pinta encima.
2. **`modules` se asigna, no se fusiona** (arriba). Si otra fase añade un módulo con el
   mismo descuido, se pierden claves. Sembrar por referencia lo evita.
3. **Vídeo y peso.** Una pared con varios vídeos puede descargar decenas de MB.
   `preload="metadata"`, un solo vídeo reproduciéndose y nada de audio.
4. **Media local no viaja.** Los assets viven en el IndexedDB del navegador. El
   export/import lleva las *referencias*, no los bytes: en otro ordenador las refs
   quedan sin resolver y cae el fallback. Es la limitación honesta de esta fase; la capa
   Cloud es la que la cierra.
5. **Contenido inventado.** El proyecto base no puede afirmar recuerdos que no existen:
   `enabled:false`, `items:[]`, y los fixtures sólo dentro de los tests.
