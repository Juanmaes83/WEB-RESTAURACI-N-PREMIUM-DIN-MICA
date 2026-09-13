from pathlib import Path


def must_replace(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"needle missing in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, count))


# 1. Persisted selector values exist before Project State hydration.
must_replace(
    "class5-studio-motion.js",
    '<label>Coreografía de platos<select data-path="motion.orbitalStyle" id="motion-orbital-style"><option value="elegant">Elegant Orbit</option><option value="urban">Urban Acrobatics</option></select></label>',
    '<label>Coreografía de platos<select data-path="motion.orbitalStyle" id="motion-orbital-style"><option value="elegant">Elegant Orbit</option><option value="urban">Urban Acrobatics</option><option value="circular-product">Circular Dish Rotator · Engine</option><option value="dish-stage-product">Dish Stage · Engine</option><option value="cinematic-rail-product">Cinematic Product Rail · Engine</option></select></label>'
)

# 2. Preserve the original 12 rows and ADD three native Product Engine rows.
p = Path("class19-motion-library.js")
text = p.read_text()
text = text.replace(
    "Twelve motion engines exist in this project: eight selectable product\n   choreographies, one transversal page motion and three complete experiences.",
    "Fifteen Motion elements exist in this project: eleven selectable product\n   choreographies, one transversal page motion and three complete experiences.",
    1,
)
old = """    {n:'12',id:'half-orbit',kind:'preset',value:'half-orbit',
      name:'Half Orbit Selector',project:'Class 24',
      note:'Media circunferencia tipográfica: drag y flechas hacen un barrido de 180°, cambian el fondo y elevan el producto activo.'}
  ];"""
new = """    {n:'12',id:'half-orbit',kind:'preset',value:'half-orbit',
      name:'Half Orbit Selector',project:'Class 24',
      note:'Media circunferencia tipográfica: drag y flechas hacen un barrido de 180°, cambian el fondo y elevan el producto activo.'},
    {n:'13',id:'circular-product',kind:'preset',value:'circular-product',
      name:'Circular Dish Rotator · Engine',project:'Class 27',
      note:'Versión nativa para la web completa: selector radial de producto inspirado en Circular Dish Rotator.'},
    {n:'14',id:'dish-stage-product',kind:'preset',value:'dish-stage-product',
      name:'Dish Stage · Engine',project:'Class 28',
      note:'Versión nativa para Signature: escenario cinematográfico de producto dentro de la web completa.'},
    {n:'15',id:'cinematic-rail-product',kind:'preset',value:'cinematic-rail-product',
      name:'Cinematic Product Rail · Engine',project:'Class 29',
      note:'Versión nativa para Signature: raíl editorial de producto integrado en la web completa.'}
  ];"""
if old not in text:
    raise SystemExit("Class 19 catalogue needle missing")
p.write_text(text.replace(old, new, 1))

# 3. Lazy loader in the guaranteed public entrypoint.
p = Path("class4-runtime-guard.js")
text = p.read_text()
anchor = """/* CLASS 19 — load the Motion Library additively.
   Studio chrome, not an engine: it indexes the eleven motion engines and the modules
   so they can be seen and chosen in one place. It loads last, because it reads what
   every other runtime has registered. index.html stays untouched. */"""
block = """/* MOTION 15 — lazy-load the three native Product Engines additively.
   The selector values exist from Class 05 so Project State can hydrate them normally;
   this guard only downloads the shared runtime when one of those values is active. */
(() => {
  'use strict';
  const MODES=new Set(['circular-product','dish-stage-product','cinematic-rail-product']);
  let requested=false;
  const load=()=>{
    if(requested||window.RestaurantNativeProductEngines)return;
    requested=true;
    if(!document.querySelector('link[data-native-product-engines-styles]')){
      const l=document.createElement('link');l.rel='stylesheet';
      l.href='styles-native-product-engines.css';l.dataset.nativeProductEnginesStyles='1';
      document.head.appendChild(l);
    }
    if(!document.querySelector('script[data-native-product-engines-runtime]')){
      const s=document.createElement('script');s.src='native-product-engines.js';
      s.dataset.nativeProductEnginesRuntime='1';document.body.appendChild(s);
    }
  };
  const maybe=e=>{
    const value=e?.detail?.orbital||document.documentElement.dataset.orbitalMotion
      ||document.getElementById('motion-orbital-style')?.value||'';
    if(MODES.has(value))load();
  };
  window.addEventListener('restaurant:motion-change',maybe);
  document.addEventListener('restaurant:config-applied',maybe);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(maybe,190));
  else setTimeout(maybe,190);
})();

/* CLASS 19 — load the Motion Library additively.
   Studio chrome, not an engine: it indexes the fifteen Motion elements and the modules
   so they can be seen and chosen in one place. It loads last, because it reads what
   every other runtime has registered. index.html stays untouched. */"""
if anchor not in text:
    raise SystemExit("Runtime guard Class19 anchor missing")
p.write_text(text.replace(anchor, block, 1))

# 4. Existing regression suites must reflect the additive 15 = 11 + 1 + 3 contract.
p = Path("tests/class19-motion-library-e2e.mjs")
text = p.read_text()
replacements = [
    (
        "Class 24 evolves the truthful catalogue from eleven to TWELVE engines:\n   eight selectable product choreographies, one transversal page motion and three",
        "Motion 15 evolves the truthful catalogue from twelve to FIFTEEN elements:\n   eleven selectable product choreographies, one transversal page motion and three",
    ),
    ("state?.().available===12", "state?.().available===15"),
    (
        "check('the library declares twelve engines',state.count===12,`${state.count} engines`);",
        "check('the library declares fifteen Motion elements',state.count===15,`${state.count} elements`);",
    ),
    (
        "check('all twelve are really reachable, not just listed',state.available===12,`${state.available}/12 available`);",
        "check('all fifteen are really reachable, not just listed',state.available===15,`${state.available}/15 available`);",
    ),
    (
        "===12\n    &&await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===12,",
        "===15\n    &&await page.evaluate(()=>document.querySelectorAll('.ml-grid [data-ml-kind]').length)===15,",
    ),
    (
        "check('the catalogue is 8 product presets + 1 page motion + 3 experiences',\n    engines.filter(e=>e.kind==='preset').length===8",
        "check('the catalogue is 11 product presets + 1 page motion + 3 experiences',\n    engines.filter(e=>e.kind==='preset').length===11",
    ),
    ("'8 presets · 1 page motion · 3 full-screen experiences');", "'11 presets · 1 page motion · 3 full-screen experiences');"),
    ("!modules.insideGrid&&state.count===12", "!modules.insideGrid&&state.count===15"),
    (
        "for(const [f,expect] of [['preset',8],['page',1],['experience',3],['all',12]]){",
        "for(const [f,expect] of [['preset',11],['page',1],['experience',3],['all',15]]){",
    ),
    ("===12,'all twelve still present');", "===15,'all fifteen still present');"),
    (
        "check('mobile · all twelve engines are listed',mob.count===12&&mob.cards===12,`${mob.cards} cards`);",
        "check('mobile · all fifteen Motion elements are listed',mob.count===15&&mob.cards===15,`${mob.cards} cards`);",
    ),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f"Class19 test needle missing: {old[:110]!r}")
    text = text.replace(old, new, 1)
p.write_text(text)

must_replace(
    "tests/class24-half-orbit-selector-e2e.mjs",
    "check(`${source} · Motion Library registra 12 motores`,initial.libraryCount===12,String(initial.libraryCount));",
    "check(`${source} · Motion Library registra 15 elementos`,initial.libraryCount===15,String(initial.libraryCount));",
)

# 5. Circular geometry fix: percentages are relative to the circular containing block.
p = Path("styles-native-product-engines.css")
text = p.read_text()
old = "transform:rotate(var(--npe-ring-turn,0deg));transition:transform .06s linear"
if old not in text:
    raise SystemExit("Circular ring CSS needle missing")
text = text.replace(old, "transform:none", 1)
old = "left:50%;top:50%;width:112px;min-height:58px;padding:7px 8px;border:0;background:transparent;text-align:center;cursor:pointer;transform:translate(-50%,-50%) translate(var(--npe-x),var(--npe-y)) scale(var(--npe-scale))"
new = "left:calc(50% + var(--npe-x));top:calc(50% + var(--npe-y));width:112px;min-height:58px;padding:7px 8px;border:0;background:transparent;text-align:center;cursor:pointer;transform:translate(-50%,-50%) scale(var(--npe-scale))"
if old not in text:
    raise SystemExit("Circular label CSS needle missing")
p.write_text(text.replace(old, new, 1))

# One-shot integration artifacts remove themselves.
for transient in [
    Path(".github/workflows/apply-native-product-engines.yml"),
    Path("scripts/apply-native-product-engines.py"),
]:
    if transient.exists():
        transient.unlink()
