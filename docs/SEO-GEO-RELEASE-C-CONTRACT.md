# Rubik SEO/GEO Core — Release C · Intelligence & GEO

Release C añade medición post publicación sin crear una segunda aplicación: **un Studio, un Project State, una Media Library, un Page Registry, un Core y un Publisher**, más una única capa de Intelligence.

## Estados y honestidad

Los adapters usan `NOT_CONFIGURED`, `NOT_CONNECTED`, `CONNECTED`, `SYNCING`, `READY`, `ERROR`, `STALE` y `NOT_MEASURED`. La ausencia de autorización nunca se representa como cero. Las métricas externas sólo se guardan con proveedor, propiedad, periodo y fecha de captura.

## Adapters

OpenSEO recibe una URL productiva y las páginas publicadas, comprueba conectividad, normaliza crawl findings y guarda snapshots inmutables. Search Console normaliza filas reales por query, página, fecha y periodo. DataForSEO es opcional, sólo manual, cacheado y con aviso de coste; sin credenciales permanece `NOT_MEASURED`.

## Snapshots, diffs e insights

Cada snapshot conserva proveedor, fechas, URL base, páginas, issues y métricas. El diff clasifica `NEW`, `RESOLVED`, `UNCHANGED` y `REGRESSED`. Un insight exige evidencia visible y sólo recomienda cambios; no aplica automáticamente títulos, rutas ni contenido.

## GEO / AI Search

Entity, citability y crawler access son señales verificables. Citability se etiqueta siempre `HEURISTIC`; no es ranking ni probabilidad de citación. La observación externa de AI Search queda `NOT_MEASURED` hasta disponer de una fuente real. `llms.txt` es experimental y nunca blocker.

## Seguridad y resiliencia

Credenciales viven únicamente en backend/serverless y variables de entorno. La web pública no depende de ningún provider: un error o timeout de integración sólo deja el estado correspondiente en el Project State.

