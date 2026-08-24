# CLASE 04 — Errores, diagnóstico y soluciones

## 1. Studio oscurecía la web pero el drawer no aparecía

**Síntoma**

El backdrop reaccionaba, pero el panel permanecía fuera de pantalla.

**Causa**

Dos sistemas intentaban gobernar la misma transformación del drawer: CSS y GSAP.

**Solución final**

- El shell de Studio tiene un único propietario de apertura/cierre.
- El estado abierto/cerrado se expresa con una clase estable (`is-open`).
- El panel debe poder abrir aunque fallen IndexedDB, GSAP o el runtime de edición.
- `aria-hidden`, backdrop y focus deben mantenerse sincronizados con ese estado.

**Regla**

> Una propiedad crítica de UI no puede tener dos propietarios de animación simultáneos.

---

## 2. La media desaparecía al cambiar de `<img>` a un host dinámico

**Síntoma**

Origin / Atmosphere / Chef podían quedar sin altura visual al utilizar un `div` como host dinámico de imagen o vídeo.

**Causa**

El elemento hijo tenía `height:100%`, pero el host no ocupaba explícitamente el contenedor.

**Solución**

`media-host-fill` usa `position:absolute; inset:0` y los padres mantienen `position:relative`.

---

## 3. `blob:` no es persistencia

**Problema**

Un Object URL (`blob:...`) sólo sirve como preview temporal de sesión. Al recargar desaparece.

**Solución**

Flujo correcto:

`File/Blob → almacenamiento persistente → reload → leer Blob → crear nuevo ObjectURL → render`

Primary:

- proyecto/config → IndexedDB;
- media → IndexedDB como Blob/File.

Fallback cuando el host/navegador bloquea IndexedDB:

- proyecto/config → `localStorage`;
- media → Cache Storage.

**Regla**

> Nunca guardar un `blob:` como referencia definitiva de un asset.

---

## 4. IndexedDB podía mostrar “Guardado” antes de terminar

**Problema**

La primera implementación resolvía la operación en `request.onsuccess`.

**Causa**

Una request puede tener éxito antes de que toda la transacción haya terminado.

**Solución**

El estado `Guardado ✓` sólo se emite después de `transaction.oncomplete`.

Errores y abortos se manejan mediante:

- `transaction.onerror`;
- `transaction.onabort`.

**Regla**

> “Guardado” significa commit de almacenamiento completado, no función invocada.

---

## 5. El HTML seguía siendo fuente de verdad

**Problema**

Cambiar `brand` no convertía realmente la web en otro restaurante porque gran parte de los titulares, dirección, chef y footer seguían escritos en HTML.

**Solución**

`class4-config.js` concentra:

- marca;
- navegación;
- Hero;
- Philosophy;
- Orbital Menu;
- Origin;
- Atmosphere;
- Chef;
- Visit;
- Footer;
- media defaults;
- platos.

El HTML contiene estructura y destinos de render, no el copy principal.

---

## 6. Un panel con muchos inputs puede ser incomprensible

**Problema**

El usuario necesita saber qué zona está modificando.

**Solución**

Cada panel incluye:

- número / categoría;
- título comprensible;
- explicación funcional;
- nombres de slot orientados a la web real;
- formato recomendado;
- botón “Ver … en la web”.

---

## 7. Imagen y vídeo no deben tratarse igual en todo el producto

**Decisión**

Hero, Origin, Atmosphere y Chef aceptan imagen o vídeo.

El Orbital Menu mantiene imagen 1:1 porque la consistencia fotográfica forma parte del efecto 2.5D.

Contrato orbital:

- mismo fondo oscuro;
- misma distancia de cámara;
- misma perspectiva;
- mismo tamaño aparente;
- plato centrado;
- encuadre 1:1.

---

## 8. Importar un segundo restaurante podía romper las imágenes orbitales

**Problema**

El merge de arrays sustituye el array completo de platos. Si un preset no incluye media, puede perderla.

**Solución actual**

El preset de prueba incluye explícitamente media orbital por plato.

**Mejora futura**

Normalización por `dish.id` en backend/CMS remoto.

---

## 9. GitHub Pages se entregó antes de estar realmente habilitado

**Error de proceso**

Se entregó una URL `github.io` que devolvía 404.

**Diagnóstico posterior**

GitHub Actions llegaba a `Configure Pages`, pero el repositorio no tenía el sitio Pages habilitado y la integración no podía crearlo automáticamente (`Resource not accessible by integration`).

**Regla**

Una URL no se considera entregable por existir un workflow. Debe pasar:

1. HTTP 200;
2. apertura real;
3. assets cargados;
4. Studio abre;
5. navegación/motion funciona;
6. guardado y reload funcionan.

---

## 10. `htmlpreview.github.io` no fue una plataforma de validación fiable

**Síntoma**

La URL podía devolver una página vacía o no representar correctamente la aplicación multiarchivo.

**Error**

Se cambió de host de preview durante la depuración, rompiendo continuidad y generando confusión.

**Solución / regla**

- No cambiar de sistema de preview durante una validación salvo causa documentada.
- Mantener una única URL de trabajo conocida durante la clase.
- No presentar hosts intermedios como hosting final.

---

## 11. RawGitHack abre la web, pero puede restringir IndexedDB

**Síntoma real observado**

La web y Studio abrían, pero al guardar aparecía:

`No se pudo guardar el archivo en IndexedDB.`

**Aprendizaje**

Un preview externo puede ejecutar perfectamente la UI y, aun así, comportarse distinto en APIs de almacenamiento del navegador.

**Solución**

Storage degradable:

- IndexedDB como primary;
- `localStorage` para configuración si IndexedDB falla;
- Cache Storage para media si IndexedDB falla.

**Regla**

> El entorno de preview nunca debe ser una dependencia crítica del motor público.

---

## 12. El error más grave: Studio/storage apagaba el motor visual

**Síntoma**

Tras ampliar Clase 4 se observó:

- platos congelados;
- pérdida de wheel/drag;
- menos parallax;
- reveals desaparecidos;
- detalle y reserva sin enlazar en algunos escenarios;
- web visualmente peor que Clase 3.

**Causa raíz**

Storage verification y visual initialisation estaban dentro del mismo `try` de `boot()`.

Si IndexedDB fallaba, el código saltaba al `catch` antes de ejecutar:

- `setupOrbitInteraction()`;
- `setupScroll()`;
- `setupCursor()`;
- `setupDetail()`;
- `setupReserve()`.

Un fallo del CMS podía tumbar el frontend público.

**Solución**

La arquitectura pasa a ser:

`PUBLIC EXPERIENCE → siempre arranca`

`STUDIO → enhancement`

`STORAGE → enhancement degradable`

La experiencia pública ya no depende del éxito del almacenamiento.

---

## 13. Clase 4 reemplazó demasiado del runtime probado de Clase 3

**Error arquitectónico**

La Clase 3 final (`97d30a0d85b2aee427fef9d17484a8bd4664db9b`) ya tenía una gramática visual probada:

- órbita continua;
- drag / wheel / swipe / keyboard;
- GSAP Flip;
- parallax;
- reveals;
- cursor contextual;
- detalle inmersivo.

Clase 4 debía añadir edición y persistencia, no sustituir ese runtime.

**Solución**

Se reintrodujo una capa cinematográfica compatible con el DOM de Clase 4 y un `class4-runtime-guard.js`.

El guard comprueba que el runtime principal haya enlazado el Orbital Menu. Si no lo hizo, restaura automáticamente:

- next/prev;
- wheel;
- teclado;
- pointer drag;
- momentum/snap;
- geometría orbital centre-first;
- escala/blur/brillo/opacidad/z-index;
- copy sincronizado;
- ficha;
- reserva;
- cursor.

---

## 14. Se perdieron transiciones y calidad visual durante una clase funcional

**Error de método**

Se priorizó el builder hasta el punto de aceptar temporalmente una experiencia pública peor.

**Nueva regla académica**

> Una clase funcional no puede degradar la dirección de arte aprobada de la clase anterior.

Cada clase debe comprobar explícitamente:

- Hero;
- Orbital Menu;
- parallax;
- reveals;
- detalle;
- hover;
- responsive;
- Studio.

---

## 15. Los tests iniciales no cubrían regresión visual/funcional

**Problema**

El smoke test comprobaba principalmente sintaxis, DOM y JSON.

Eso no detectaba:

- platos congelados;
- falta de wheel/drag;
- pérdida de motion;
- Studio conectado pero runtime público incompleto.

**Solución**

El contrato de CI/QA debe crecer progresivamente e incluir pruebas de comportamiento crítico.

Guard mínimo desde Clase 4:

- sintaxis JS;
- DOM contract;
- preset válido;
- runtime cinematic cargado;
- runtime guard cargado.

En Clase 5 se añadirá una matriz explícita de motion regression.

---

## 16. Regla maestra para todas las clases siguientes

La evolución del curso queda definida así:

`CLASS N+1 = CLASS N APROBADA + NUEVA CAPACIDAD`

Nunca:

`CLASS N+1 = REWRITE CLASS N + INTENTAR RECUPERAR PARIDAD`

Antes de fusionar una nueva clase:

1. identificar commit baseline de la clase anterior;
2. listar comportamientos que no pueden perderse;
3. implementar en rama propia;
4. comparar baseline vs nueva clase;
5. comprobar web pública antes de Studio;
6. comprobar Studio después;
7. provocar fallo de storage y verificar que la web sigue viva;
8. sólo entonces fusionar.

---

## 17. Lo que todavía es intencionadamente local

El Studio continúa siendo un builder local persistente, no un SaaS multiusuario.

Pendiente de una fase de producto posterior:

- autenticación;
- base de datos remota;
- almacenamiento cloud;
- roles;
- drafts/publicaciones remotas;
- multi-restaurante por cuenta.

Clase 04 demuestra:

- ENGINE / CONTENT / MEDIA separados;
- personalización sin editar código;
- media imagen/vídeo;
- persistencia con degradación;
- la experiencia pública sobreviviendo a fallos del editor/storage.
