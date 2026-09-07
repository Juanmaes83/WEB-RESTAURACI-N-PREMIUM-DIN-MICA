/* CLASS 04 — source-of-truth configuration. No visible restaurant copy should live only in HTML. */
window.RestaurantDefaults={
  id:'restaurant-class4',schemaVersion:4,status:'draft',
  brand:{name:'LÚMINA',logoText:'LÚMINA',accent:'#d8ff4f',ink:'#080807',paper:'#ece6da',fontDisplay:'Italiana',fontBody:'DM Sans'},
  header:{links:[['Signature','#signature'],['Story','#story'],['Experience','#experience'],['Visit','#visit']],studioLabel:'Studio',reserveLabel:'Reservar'},
  hero:{kicker:'Alicante · Mediterranean dining',line1:'LÚMINA',line2:'after dark.',body:'Producto mediterráneo, fuego y precisión. Una carta que no se desplaza: orbita.',cta:'Descubrir el menú',stamp:'ORBITAL MENU · CLASS 04 ·',scroll:'SCROLL TO ENTER'},
  philosophy:{index:'01 / Philosophy',title:'La cocina entra en escena como un objeto de deseo, no como una lista.',body1:'Hemos diseñado cada plato bajo el mismo contrato fotográfico: encuadre, distancia, vajilla, fondo y luz. Esa disciplina hace posible la ilusión de volumen sin recurrir a 3D real.',body2:'El movimiento añade jerarquía; la fotografía aporta credibilidad. El resultado debe sentirse físico aunque todo siga siendo HTML, CSS, imágenes y GSAP.'},
  orbital:{index:'02 / Signature plates',kicker:'Drag · wheel · swipe · arrows',title:'The Orbital Menu',explore:'Explore dish'},
  origin:{index:'03 / Origin',title:'Before the plate, there is a place.',body:'La procedencia también forma parte de la interfaz. Ingrediente, productor y técnica aparecen como información de valor, no como letra pequeña.',caption:'Santa Pola · 07:20'},
  atmosphere:{index:'04 / Atmosphere',title:'Dinner becomes memory.',caption:'Dining room · Alicante',body:'Materia, temperatura, luz y sonido se diseñan con la misma intención que el plato.',cta:'Reserve your table →'},
  chef:{index:'05 / Chef',title:'Precision without noise.',quote:'“La técnica desaparece cuando el plato parece inevitable.”',badges:['Seasonal menu','Local producers','Fire-led kitchen']},
  visit:{kicker:'Alicante · Tue — Sat',title:'Take your seat.',cta:'Reservar mesa',addressLabel:'Address',address:'Muelle 08 · Alicante',serviceLabel:'Service',service:'19:30 — 00:30',contactLabel:'Contact',contact:'hello@lumina.demo',bookingUrl:'#'},
  footer:{left:'LÚMINA',center:'Class 05 · Motion Direction Premium',right:'Educational prototype'},
  motion:{
    orbitalStyle:'elegant',
    text:{hero:'cinematic',philosophy:'line',origin:'soft',atmosphere:'editorial',chef:'mask',visit:'rise'},
    media:{hero:'cinematic',origin:'parallax',atmosphere:'slowZoom',chef:'parallax'}
  },
  media:{
    hero:{type:'image',url:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104220_2a0413f3-7a7a-45a4-9fc3-1d63d737b488.png',fit:'cover',position:'50% 50%'},
    origin:{type:'image',url:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104220_5e88ce28-a269-420c-ac0f-fbaf6f0c7573.png',fit:'cover',position:'50% 50%'},
    atmosphere:{type:'image',url:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104220_2a0413f3-7a7a-45a4-9fc3-1d63d737b488.png',fit:'cover',position:'50% 50%'},
    chef:{type:'image',url:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104220_7aca7ce4-b18c-49b5-a54c-c64cae3aefbc.png',fit:'cover',position:'50% 50%'}
  },
  dishes:[
    {id:'dish-01',anchorScene:{image:'assets/anchor-scenes/runtime/scene-01-gamba-roja.webp',hit:{x:0.1756,y:0.1427,w:0.6488,h:0.4265},registration:{scale:1,offsetX:0,offsetY:0,objectPosition:{x:0.5000,y:0.3559}}},depthCarousel:{asset:'assets/depth-carousel/dish-01-food.webp',foregroundDecor:['assets/depth-carousel/dish-06-decor-c.webp','assets/depth-carousel/dish-06-decor-b.webp'],backgroundDecor:'assets/depth-carousel/dish-06-decor-a.webp',word:'FIRE',accent:'#ff6a3c',backgroundColor:'#1e0a05'},name:'Wild Red Prawn',meta:'Santa Pola · Fire · Citrus',short:'Red prawn, smoked almond, citrus beurre blanc and sea fennel.',price:'€28',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_bdf81ca0-1bf9-428a-86f9-97a68aed9cfb.png',ingredients:'Red prawn · smoked almond · citrus · sea fennel',origin:'Lonja de Santa Pola · Alicante',technique:'Olive wood charcoal · 38 seconds',pairing:'Moscatel seco · Alicante DOP',note:'Heat, iodine and citrus. Nothing else should get in the way.',allergens:'Shellfish · nuts',enabled:true},
    {id:'dish-02',anchorScene:{image:'assets/anchor-scenes/runtime/scene-02-atun-rojo.webp',hit:{x:0.1783,y:0.1213,w:0.6355,h:0.4151},registration:{scale:1,offsetX:0,offsetY:0,objectPosition:{x:0.4960,y:0.3288}}},depthCarousel:{asset:'assets/depth-carousel/dish-02-food.webp',foregroundDecor:['assets/depth-carousel/dish-02-decor-b.webp','assets/depth-carousel/dish-04-decor-a.webp'],backgroundDecor:'assets/depth-carousel/dish-03-decor-b.webp',word:'BLUEFIN',accent:'#4f8dff',backgroundColor:'#050f22'},name:'Bluefin / Blood Orange',meta:'Mediterranean · Raw · Ponzu',short:'Bluefin tuna, blood orange, caper leaf and black olive dust.',price:'€31',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_0787565e-8cf4-4fd3-86c2-0583aa9eaece.png',ingredients:'Bluefin tuna · blood orange · ponzu · caper leaf',origin:'Western Mediterranean',technique:'Hand-cut · cold dressed',pairing:'Brut nature rosé',note:'Acid first, then fat, then the sea.',allergens:'Fish · soy',enabled:true},
    {id:'dish-03',orbitalFood:{orbitScale:1.06,rotationBias:-3},anchorScene:{image:'assets/anchor-scenes/runtime/scene-03-brasa-pulpo.webp',hit:{x:0.1809,y:0.1526,w:0.6346,h:0.3837},registration:{scale:1,offsetX:0,offsetY:0,objectPosition:{x:0.4982,y:0.3445}}},depthCarousel:{asset:'assets/depth-carousel/dish-03-food.webp',foregroundDecor:['assets/depth-carousel/dish-03-decor-a.webp','assets/depth-carousel/dish-04-decor-c.webp'],backgroundDecor:'assets/depth-carousel/dish-04-decor-b.webp',word:'EMBER',accent:'#b9e24d',backgroundColor:'#101c07'},name:'Charred Artichoke',meta:'Vega Baja · Smoke · Hazelnut',short:'Caramelised artichoke, smoked yolk, parsley oil and toasted hazelnut.',price:'€22',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_106d173c-2fe5-4763-bccc-59ecfe401244.png',ingredients:'Artichoke · egg yolk · hazelnut · parsley oil',origin:'Vega Baja · Alicante',technique:'Ember-roasted · glazed',pairing:'Fondillón-inspired vermouth',note:'Vegetal bitterness deserves the same ceremony as seafood.',allergens:'Egg · nuts',enabled:true},
    {id:'dish-04',anchorScene:{image:'assets/anchor-scenes/runtime/scene-04-lubina-salvaje.webp',hit:{x:0.1774,y:0.1569,w:0.6337,h:0.3944},registration:{scale:1,offsetX:0,offsetY:0,objectPosition:{x:0.4942,y:0.3541}}},depthCarousel:{asset:'assets/depth-carousel/dish-04-food.webp',foregroundDecor:['assets/depth-carousel/dish-04-decor-a.webp','assets/depth-carousel/dish-04-decor-c.webp'],backgroundDecor:'assets/depth-carousel/dish-03-decor-a.webp',word:'SEA',accent:'#34d3c6',backgroundColor:'#041d1d'},name:'Wild Sea Bass',meta:'Calpe · Saffron · Fennel',short:'Crisp-skinned sea bass, saffron sauce, leek and translucent fennel.',price:'€34',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_5aa3ae73-18a3-40e5-a05d-6c99799facb3.png',ingredients:'Sea bass · saffron · leek · fennel',origin:'Calpe coast · Alicante',technique:'Plancha · skin-side crisp',pairing:'Marina Alta white',note:'Crisp skin, soft centre, saffron held just below perfume.',allergens:'Fish · dairy',enabled:true},
    {id:'dish-05',anchorScene:{image:'assets/anchor-scenes/runtime/scene-05-presa-iberica.webp',hit:{x:0.1756,y:0.1484,w:0.6390,h:0.3966},registration:{scale:1,offsetX:0,offsetY:0,objectPosition:{x:0.4951,y:0.3466}}},depthCarousel:{asset:'assets/depth-carousel/dish-05-food.webp',foregroundDecor:['assets/depth-carousel/dish-06-decor-b.webp','assets/depth-carousel/dish-06-decor-c.webp'],backgroundDecor:'assets/depth-carousel/dish-03-decor-b.webp',word:'IBERIAN',accent:'#ef5b7e',backgroundColor:'#1d0611'},name:'Iberian Presa',meta:'Dehesa · Ember · PX',short:'Iberian presa, roasted aubergine, Pedro Ximénez and spring onion.',price:'€36',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_901a0cde-ba99-48f4-a012-68bae6baf49f.png',ingredients:'Iberian pork · aubergine · PX · spring onion',origin:'Extremadura · Spain',technique:'Hard sear · ember rest',pairing:'Monastrell · Alicante DOP',note:'Smoke should frame the meat, never cover it.',allergens:'Sulphites',enabled:true},
    {id:'dish-06',orbitalFood:{word:'HONEY',orbitScale:.96,rotationBias:4},depthCarousel:{asset:'assets/depth-carousel/dish-06-food.webp',foregroundDecor:['assets/depth-carousel/dish-06-decor-a.webp','assets/depth-carousel/dish-04-decor-a.webp'],backgroundDecor:'assets/depth-carousel/dish-06-decor-b.webp',word:'HONEY',accent:'#ffc23d',backgroundColor:'#201202'},name:'Burnt Honey Citrus',meta:'Alicante · Honey · Verbena',short:'Burnt-honey ice cream, citrus, olive-oil sponge and almond praline.',price:'€16',image:'https://d8j0ntlcm91z4.cloudfront.net/user_32Z72jiRnAYwuEpbVNGYFa3wWSz/hf_20260824_104106_1e54d625-3cab-4d8a-be7d-87b1d92c824b.png',ingredients:'Burnt honey · citrus · olive oil · almond',origin:'Alicante citrus & local honey',technique:'Churned · candied · aerated',pairing:'Late-harvest Moscatel',note:'Dessert with enough bitterness to keep the night awake.',allergens:'Dairy · egg · nuts',enabled:true}
  ]
};

/* PROJECT 07 PREMIUM — the pizza product story layer.

   The slice GEOMETRY lives in assets/pizza-motion/slices-manifest.json, generated by
   the ingest pipeline and not user-editable. This is the other half: the story and
   the commerce, joined to the manifest by `id`, editable in Studio and persisted by
   the existing project state — no parallel settings system.

   demoContent: true means exactly that. The ingredients and editorial copy are demo
   material to prove the composition; `price` stays null on every product because
   there is no authentic price yet, and a null price is never rendered. Nothing here
   is presented as official restaurant information. */
window.RestaurantDefaults.pizzaSliceOrbit={
  brand:{
    restaurantName:'LÚMINA',
    collectionName:'Pizza selection',
    /* used for every product when perProductWorlds is off */
    accent:'#d8ff4f',
    perProductWorlds:true,
    backgroundTypography:true,
    ctaPriority:'order',
    orderUrl:'',
    reservationUrl:''
  },
  products:[
    {id:'quattro-formaggi',name:'4 Quesos',
      mood:'CREAM',descriptor:'rich · silky · intense',
      headlineOverline:'TONIGHT, CHOOSE',headlineLead:'the slice with',
      headlineTail:'Four cheeses melting into one long, quiet note.',
      ingredients:'Mozzarella fior di latte · gorgonzola · pecorino · parmesano',
      price:null,accent:'#f0c96a',
      background:{a:'#1a1408',b:'#07060a',glow:'rgba(240,201,106,.22)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'barbacoa',name:'Barbacoa',
      mood:'SMOKE',descriptor:'smoked · sweet · deep',
      headlineOverline:'SLOW AND LOW',headlineLead:'the slice with',
      headlineTail:'Smoke first, sweetness after. Nothing hurried.',
      ingredients:'Ternera braseada · salsa barbacoa · cebolla roja · mozzarella',
      price:null,accent:'#e08a4b',
      background:{a:'#1b0f06',b:'#060505',glow:'rgba(224,138,75,.22)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'carbonara',name:'Carbonara',
      mood:'GOLD',descriptor:'creamy · peppery · golden',
      headlineOverline:'ROMAN, ON PURPOSE',headlineLead:'the slice with',
      headlineTail:'Egg, pepper and patience. The oldest kind of luxury.',
      ingredients:'Guanciale · huevo · pecorino romano · pimienta negra',
      price:null,accent:'#f2b338',
      background:{a:'#1c1305',b:'#070604',glow:'rgba(242,179,56,.22)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'diavola',name:'Diavola',
      mood:'FIRE',descriptor:'spicy · smoky · bold',
      headlineOverline:'TONIGHT, CHOOSE',headlineLead:'the slice with',
      headlineTail:'Fire at the centre of the table.',
      ingredients:'Tomate San Marzano · fior di latte · salami picante · albahaca',
      price:null,accent:'#ff5a2b',
      background:{a:'#210a05',b:'#080404',glow:'rgba(255,90,43,.24)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'margarita',name:'Margarita',
      mood:'CLASSIC',descriptor:'clean · bright · essential',
      headlineOverline:'THE ORIGINAL ARGUMENT',headlineLead:'the slice with',
      headlineTail:'Three ingredients with nowhere to hide.',
      ingredients:'Tomate San Marzano · fior di latte · albahaca · aceite de oliva',
      price:null,accent:'#e8443f',
      background:{a:'#1d0a09',b:'#060505',glow:'rgba(232,68,63,.20)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'mortadela-pistacho',name:'Mortadela y Pistacho',
      mood:'SILK',descriptor:'delicate · nutty · soft',
      headlineOverline:'A SOFTER KIND OF',headlineLead:'the slice with',
      headlineTail:'Silk, salt and a green, buttery finish.',
      ingredients:'Mortadela de Bolonia · pistacho · stracciatella · limón',
      price:null,accent:'#a8d06a',
      background:{a:'#101707',b:'#060705',glow:'rgba(168,208,106,.20)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'prosciutto-funghi',name:'Prosciutto Funghi',
      mood:'FOREST',descriptor:'earthy · savoury · fragrant',
      headlineOverline:'A SOFTER KIND OF',headlineLead:'the slice with',
      headlineTail:'Silk, earth and savoury depth.',
      ingredients:'Prosciutto di Parma · champiñón · mozzarella · tomillo',
      price:null,accent:'#c98f5a',
      background:{a:'#150f08',b:'#050505',glow:'rgba(201,143,90,.20)'},
      orderUrl:'',available:true,demoContent:true},

    {id:'verduras',name:'Verduras',
      mood:'GARDEN',descriptor:'fresh · green · vibrant',
      headlineOverline:'STRAIGHT FROM THE ROW',headlineLead:'the slice with',
      headlineTail:'Vegetables treated like the main event.',
      ingredients:'Calabacín · pimiento · berenjena · cebolla roja · oliva negra',
      price:null,accent:'#7fd18a',
      background:{a:'#0a1610',b:'#040605',glow:'rgba(127,209,138,.20)'},
      orderUrl:'',available:true,demoContent:true}
  ]
};

/* PROJECT 09 — SCROLL TRAVELER.

   A page-level capability, not another product carousel: ONE object persists across
   several sections and travels through the page as the visitor scrolls.

   The route is DATA. The renderer contains no product and no section knowledge — no
   `if dish === gamba`, no `if section === chef`. Swap the source and the route and the
   same engine carries a lemon, a bottle or a logo.

   Coordinates are viewport-relative (vw/vh) because the traveler is a fixed overlay:
   that is what makes each chapter's composition predictable at any page length.
   `layer` is a discrete state, not a tween — z-index cannot be interpolated
   meaningfully, so it hands over at the midpoint of a segment. */
window.RestaurantDefaults.scrollTraveler={
  enabled:true,
  preset:'red-prawn',
  /* how much of the designed amplitude to apply: the restaurant picks a language,
     not bezier control points */
  intensity:1,
  scale:1,
  rotationIntensity:1,
  /* dish-01 is the canonical product record — this is a reference to it, not a copy.
     The asset is the cleaned runtime cut of the approved master: see
     scripts/build-traveler-asset.mjs for why a traveller cannot use the stage cut. */
  source:{type:'dish',dishId:'dish-01',
    asset:'assets/scroll-traveler/runtime/dish-01-prawn.webp',
    alt:'Gamba roja salvaje',altEn:'Wild red prawn'},
  /* Desktop route. Each chapter is an intentional composition, not a diagonal drift. */
  route:[
    /* clear of the product stage. Centred on it, the traveller landed among the
       carousel's own plates — the same dish, so it read as a duplicate instead of as
       the one object that is about to leave and travel the page. */
    {anchor:'#signature',chapter:'signature',x:78,y:74,scale:1,rotation:-6,opacity:1,layer:'front',blur:0},
    {anchor:'#experience',chapter:'origin',x:24,y:46,scale:.74,rotation:14,opacity:1,layer:'behind',blur:0},
    {anchor:'.experience-section',chapter:'atmosphere',x:78,y:44,scale:.88,rotation:-16,opacity:1,layer:'between',blur:0},
    {anchor:'.chef-section',chapter:'chef',x:30,y:58,scale:.96,rotation:6,opacity:1,layer:'front',blur:0},
    /* the finale is the biggest the object ever gets, and it lands centred on the
       reservation banner — so it goes BEHIND the page's own copy. At `front` it
       covered "Toma asiento." and the CTA; behind them it reads as the dish arriving
       through the invitation, and every word stays legible. */
    {anchor:'#visit',chapter:'visit',x:52,y:44,scale:1.14,rotation:0,opacity:1,layer:'between',blur:0}
  ],
  /* Mobile is its own route, not shrunken desktop: lower amplitude, fewer crossings,
     and positions that keep the copy columns clear on a 390px screen. */
  /* Mobile scales are NOT the desktop ones reduced: the object's box is already much
     smaller on a narrow screen (see styles-v14.css), so reusing desktop multipliers
     would leave a 70px dish nobody can read. These are chosen against the real 390px
     layout — the object sits in each section's open space, behind the type where the
     type matters and in front of the photograph where there is nothing to obscure. */
  routeMobile:[
    {anchor:'#signature',chapter:'signature',x:64,y:36,scale:.95,rotation:-5,opacity:1,layer:'front',blur:0},
    {anchor:'#experience',chapter:'origin',x:32,y:18,scale:.86,rotation:11,opacity:1,layer:'behind',blur:0},
    {anchor:'.experience-section',chapter:'atmosphere',x:66,y:52,scale:.92,rotation:-12,opacity:1,layer:'between',blur:0},
    {anchor:'.chef-section',chapter:'chef',x:34,y:44,scale:.98,rotation:5,opacity:1,layer:'front',blur:0},
    {anchor:'#visit',chapter:'visit',x:50,y:40,scale:1.12,rotation:0,opacity:1,layer:'between',blur:0}
  ]
};
