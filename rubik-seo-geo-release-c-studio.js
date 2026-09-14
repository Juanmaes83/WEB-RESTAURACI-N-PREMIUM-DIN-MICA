/* Release C Studio extension. One Intelligence surface inside the existing SEO·GEO Studio. */
(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const api=()=>window.RestaurantStudioConfig;
  const intelligence=()=>window.RubikSEOGeoIntelligence;
  const core=()=>window.RubikSEOGeoCore;
  const clients=()=>window.RubikSEOGeoProviderClients||{};
  const snapshot=()=>api()?.snapshot?.()||{};
  const patch=entries=>api()?.patch?api().patch(entries):Object.entries(entries||{}).forEach(([path,value])=>api()?.set?.(path,value));
  const safeProviderEndpoint=value=>intelligence()?.providerEndpoint?.(value)||'';
  const stamp=()=>new Date().toISOString();

  function addStyles(){
    if($('#release-c-ux-style'))return;
    const style=el('style');style.id='release-c-ux-style';
    style.textContent=`
      [data-seo-intelligence] .rc-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
      [data-seo-intelligence] .rc-status-card{border:1px solid rgba(20,20,20,.14);padding:12px;display:grid;gap:5px;background:rgba(255,255,255,.32)}
      [data-seo-intelligence] .rc-status-head{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
      [data-seo-intelligence] .rc-badge{display:inline-flex;align-items:center;border:1px solid currentColor;border-radius:999px;padding:3px 7px;font-size:10px;line-height:1;letter-spacing:.04em}
      [data-seo-intelligence] .rc-section{border-top:1px solid rgba(20,20,20,.14);padding-top:15px;margin-top:16px;display:grid;gap:10px}
      [data-seo-intelligence] .rc-section>h4{margin:0;font-size:14px}
      [data-seo-intelligence] .rc-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      [data-seo-intelligence] .rc-actions .studio-primary{margin:0}
      [data-seo-intelligence] .rc-action-note{padding:9px;border:1px dashed rgba(20,20,20,.2)}
      [data-seo-intelligence] .rc-row{display:grid;gap:4px;padding:8px 0;border-bottom:1px solid rgba(20,20,20,.08)}
      [data-seo-intelligence] .rc-data-table{display:grid;gap:5px}
      [data-seo-intelligence] details.rc-manual{border:1px solid rgba(20,20,20,.12);padding:10px}
      [data-seo-intelligence] details.rc-manual>summary{cursor:pointer;font-weight:600}
      [data-seo-intelligence] button:disabled{opacity:.42;cursor:not-allowed}
      [data-seo-intelligence] .rc-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      [data-seo-checks] .rc-audit-ref{display:block;font-size:10px;opacity:.72;margin-top:3px}
      @media(max-width:620px){
        [data-seo-intelligence] .rc-status-grid,[data-seo-intelligence] .rc-actions{grid-template-columns:1fr}
      }`;
    document.head.append(style);
  }

  function input(label,value,{type='text',textarea=false,onChange,data,placeholder='',disabled=false}={}){
    const wrap=el('label','seo-field',label),field=el(textarea?'textarea':'input');
    if(!textarea)field.type=type; else field.rows=3;
    field.value=value??'';field.placeholder=placeholder;field.disabled=disabled;
    if(data)field.dataset[data]='';
    field.addEventListener('change',()=>onChange?.(field.value,field));
    wrap.append(field);
    return {wrap,field};
  }

  function button(label,fn,{disabled=false,cls='studio-primary',data}={}){
    const b=el('button',cls,label);b.type='button';b.disabled=!!disabled;if(data)b.dataset[data]='';
    b.addEventListener('click',event=>{if(!b.disabled)fn?.(event,b);});
    return b;
  }

  function help(text,cls='seo-help'){return el('small',cls,text);}
  function section(host,title,description){
    const box=el('section','rc-section'),h=el('h4','',title);box.append(h);
    if(description)box.append(help(description));
    host.append(box);return box;
  }

  function statusCard(name,state,description,error=''){
    const card=el('article','rc-status-card'),head=el('div','rc-status-head');
    head.append(el('strong','',name),el('span','rc-badge',state));
    card.append(head,help(description));
    if(error)card.append(help(error,'seo-help rc-error'));
    return card;
  }

  function focusProduction(){
    const field=$('[data-seo-path="seo.site.baseUrl"]');
    field?.scrollIntoView?.({behavior:'smooth',block:'center'});
    field?.focus?.();
  }

  function hasCrawlerEvidence(ev={}){
    return !!String(ev.robotsText||'').trim() || !!String(ev.metaRobots||'').trim() || ev.httpStatus!==null&&ev.httpStatus!==undefined&&ev.httpStatus!=='';
  }

  function expectedCanonical(c){
    return core()?.baseUrl?.(c.seo?.site?.baseUrl||'')||'';
  }

  function renderStatusOverview(host,c){
    const s=c.seo?.integrations||{},geo=c.seo?.geo||{},grid=el('div','rc-status-grid');
    grid.append(
      statusCard('OpenSEO',s.openseo?.status||'NOT_CONFIGURED','Crawl técnico explícito sobre URLs públicas.',s.openseo?.error||''),
      statusCard('Search Console',s.searchConsole?.status||'NOT_CONNECTED','Datos reales sólo con backend/OAuth server-side.',s.searchConsole?.error||''),
      statusCard('DataForSEO',s.dataForSEO?.status||'NOT_MEASURED','Medición opcional, manual y con control de coste.',s.dataForSEO?.error||''),
      statusCard('GEO / AI Search',geo.citationReadiness?.label||'HEURISTIC',`Readiness heurística · AI Search ${geo.aiSearchAudit?.status||'NOT_MEASURED'}.`)
    );
    host.append(grid);
  }

  function renderProduction(host,c){
    const production=expectedCanonical(c),box=el('div','rc-action-note');
    if(production)box.append(el('strong','','Producción configurada'),help(production));
    else{
      box.append(el('strong','','Producción pendiente'),help('Define una URL HTTPS productiva antes de ejecutar crawls.'));
      box.append(button('Configurar URL de producción',focusProduction,{cls:'studio-secondary'}));
    }
    host.append(box);
    return production;
  }

  function renderOpenSEO(host,c,production){
    const a=api(),i=intelligence(),s=c.seo?.integrations||{},state=s.openseo||{},clientState=safeProviderEndpoint(state.endpoint||'');
    const box=section(host,'OpenSEO','Conexión y crawl sólo sobre producción. El endpoint se valida antes de persistirse.');
    const endpoint=input('OpenSEO endpoint',state.endpoint||'',{
      type:'url',data:'intelligenceEndpoint',placeholder:'https://openseo.example/api',
      onChange:(value,field)=>{
        const raw=String(value||'').trim(),clean=safeProviderEndpoint(raw);
        if(raw&&!clean){
          field.value='';field.setCustomValidity('Usa HTTPS sin usuario, contraseña, query ni fragment.');field.reportValidity();
          a.set('seo.integrations.openseo',{...state,endpoint:'',status:'NOT_CONFIGURED',error:'Endpoint OpenSEO no válido.'});return;
        }
        field.setCustomValidity('');
        a.set('seo.integrations.openseo',{...state,endpoint:clean,status:clean?'NOT_CONNECTED':'NOT_CONFIGURED',error:''});
      }
    });
    box.append(endpoint.wrap);

    const actions=el('div','rc-actions');
    actions.append(
      button('Test OpenSEO connection',async()=>{
        const e=a.get('seo.integrations.openseo')||{},adapter=new i.OpenSEOAdapter({endpoint:e.endpoint});
        a.set('seo.integrations.openseo',{...e,status:'SYNCING',error:'',lastSyncAt:stamp()});
        const result=await adapter.connectivity(),latest=a.get('seo.integrations.openseo')||e,when=stamp();
        a.set('seo.integrations.openseo',{...latest,status:result.status,error:result.error||'',lastSyncAt:when,lastSuccessfulSyncAt:result.status==='CONNECTED'?when:latest.lastSuccessfulSyncAt});
      },{disabled:!clientState}),
      button('Run OpenSEO crawl',async()=>{
        const fresh=snapshot(),e=fresh.seo?.integrations?.openseo||{},base=expectedCanonical(fresh);
        if(!base){focusProduction();return;}
        const adapter=new i.OpenSEOAdapter({endpoint:e.endpoint});
        a.set('seo.integrations.openseo',{...e,status:'SYNCING',error:'',lastSyncAt:stamp()});
        const result=await adapter.crawl({baseUrl:base,pages:i.pages(fresh)});
        const latest=a.get('seo.integrations.openseo')||e;
        if(result.status!=='READY'){
          a.set('seo.integrations.openseo',{...latest,status:result.status,error:result.error||(base?'OpenSEO crawl failed':'Configura primero la URL HTTPS productiva.')});
          return;
        }
        const current=snapshot(),normalized=adapter.normalize(result.result||{},current),snap=i.makeSnapshot('openseo',normalized,base),intel=current.seo?.intelligence||{},geo=current.seo?.geo||{};
        const providerEvidence=result.result?.crawlerEvidence||result.result?.crawlerAuditEvidence||null;
        const changes={
          'seo.integrations.openseo':{...latest,status:'READY',error:'',lastSyncAt:stamp(),lastSuccessfulSyncAt:stamp()},
          'seo.intelligence':{...intel,snapshots:[...(intel.snapshots||[]),snap],issues:normalized.issues}
        };
        if(providerEvidence&&hasCrawlerEvidence(providerEvidence)){
          const evidence={...providerEvidence,expectedCanonical:base,source:'openseo'};
          changes['seo.geo']={...geo,crawlerEvidence:evidence,crawlerAccess:i.crawlerAudit(evidence)};
        }
        patch(changes);
      },{disabled:!clientState||!production})
    );
    box.append(actions);
    if(!production)box.append(help('Crawl deshabilitado: configura primero la URL HTTPS productiva.'));
    if(!clientState)box.append(help('OpenSEO permanece NOT_CONFIGURED hasta definir un endpoint HTTPS válido.'));
  }

  function renderSnapshots(host,c){
    const i=intelligence(),intel=c.seo?.intelligence||{},box=section(host,'Snapshots y diff','Histórico inmutable del provider y comparación entre las dos últimas mediciones compatibles.');
    box.dataset.intelligenceSnapshots='';
    const openSnapshots=(intel.snapshots||[]).filter(x=>x.provider==='openseo');
    if(!openSnapshots.length){box.append(help('Sin snapshots OpenSEO todavía.'));return;}
    for(const item of openSnapshots.slice(-5).reverse()){
      const row=el('div','rc-row');
      row.append(el('strong','',item.completedAt||item.startedAt||'Sin fecha'),help(`${item.pagesScanned??0} páginas · ${(item.issues||[]).length} issues · ${item.snapshotId}`));
      box.append(row);
    }
    if(openSnapshots.length>1){
      const delta=i.diff(openSnapshots.at(-2),openSnapshots.at(-1)),counts=delta.reduce((m,x)=>(m[x.change]=(m[x.change]||0)+1,m),{});
      const line=help(`Diff: ${counts.NEW||0} NEW · ${counts.RESOLVED||0} RESOLVED · ${counts.IMPROVED||0} IMPROVED · ${counts.REGRESSED||0} REGRESSED · ${counts.UNCHANGED||0} UNCHANGED`);
      line.dataset.intelligenceDiff='';box.append(line);
    }
  }

  function renderSearchConsole(host,c){
    const a=api(),i=intelligence(),providerClients=clients(),s=c.seo?.integrations||{},state=s.searchConsole||{},intel=c.seo?.intelligence||{},client=providerClients.searchConsole;
    const box=section(host,'Search Console','Conecta el backend OAuth para consultar datos reales. Sin conexión no se muestran métricas cero.');
    const property=input('Propiedad',state.property||'',{
      data:'gscProperty',placeholder:'sc-domain:example.com',
      onChange:value=>a.set('seo.integrations.searchConsole',{...(a.get('seo.integrations.searchConsole')||{}),property:String(value||'').trim(),status:'NOT_CONNECTED',error:''})
    });
    const range=el('select');range.dataset.gscDateRange='';
    for(const value of ['7d','28d','90d']){const o=el('option','',value);o.value=value;o.selected=(state.dateRange||'28d')===value;range.append(o);}
    range.addEventListener('change',()=>a.set('seo.integrations.searchConsole',{...(a.get('seo.integrations.searchConsole')||{}),dateRange:range.value}));
    const rangeWrap=el('label','seo-field','Periodo');rangeWrap.append(range);
    box.append(property.wrap,rangeWrap);
    if(!client)box.append(help('Backend/OAuth no conectado. Las acciones permanecen deshabilitadas hasta disponer de autorización server-side.'));

    const canCheck=!!client&&!!String(state.property||'').trim(),canSync=canCheck&&['CONNECTED','READY','STALE'].includes(state.status);
    const actions=el('div','rc-actions');
    actions.append(
      button('Conectar / comprobar Search Console',async()=>{
        const e=a.get('seo.integrations.searchConsole')||{},adapter=new i.SearchConsoleAdapter({client,property:e.property,dateRange:e.dateRange});
        a.set('seo.integrations.searchConsole',{...e,status:'SYNCING',error:'',lastSyncAt:stamp()});
        const result=await adapter.connectivity(),latest=a.get('seo.integrations.searchConsole')||e,when=stamp();
        a.set('seo.integrations.searchConsole',{...latest,status:result.status,error:result.error||(result.status==='NOT_CONNECTED'?'Backend/OAuth no conectado.':''),lastSyncAt:when,lastSuccessfulSyncAt:result.status==='CONNECTED'?when:latest.lastSuccessfulSyncAt});
      },{disabled:!canCheck}),
      button('Sincronizar Search Console',async()=>{
        const e=a.get('seo.integrations.searchConsole')||{},adapter=new i.SearchConsoleAdapter({client,property:e.property,dateRange:e.dateRange});
        a.set('seo.integrations.searchConsole',{...e,status:'SYNCING',error:'',lastSyncAt:stamp()});
        const result=await adapter.sync(),fresh=snapshot(),current=fresh.seo?.intelligence||{},latest=fresh.seo?.integrations?.searchConsole||e;
        if(result.status!=='READY'){a.set('seo.integrations.searchConsole',{...latest,status:result.status,error:result.error||'Search Console sync failed'});return;}
        const opportunities=adapter.opportunities(result.rows);let insights=[...(current.insights||[])];
        for(const op of opportunities){try{insights=i.upsertInsight(insights,{type:op.type,source:'searchConsole',query:op.query||'',pageId:op.page||'',evidence:op.evidence,recommendation:'Revisar la oportunidad antes de aplicar cambios.'});}catch{}}
        patch({
          'seo.integrations.searchConsole':{...latest,status:'READY',error:'',dateRange:result.dateRange,lastSyncAt:stamp(),lastSuccessfulSyncAt:stamp()},
          'seo.intelligence':{...current,queries:result.queries,pages:result.pages,opportunities,insights}
        });
      },{disabled:!canSync})
    );
    box.append(actions);

    const rows=[...(intel.queries||[])].slice(0,5);
    const metrics=el('div','rc-data-table');metrics.dataset.gscResults='';
    if(!rows.length)metrics.append(help(state.status==='READY'?'Sin filas en el periodo seleccionado.':'Métricas: NOT_MEASURED hasta sincronizar una propiedad conectada.'));
    else for(const row of rows){
      const line=el('div','rc-row');line.append(el('strong','',row.query||'(sin query)'),help(`${row.clicks??'—'} clics · ${row.impressions??'—'} impresiones · CTR ${row.ctr??'—'} · posición ${row.averagePosition??'—'}`));metrics.append(line);
    }
    box.append(metrics);
  }

  function renderDataForSEO(host,c){
    const a=api(),i=intelligence(),s=c.seo?.integrations||{},state=s.dataForSEO||{},intel=c.seo?.intelligence||{},client=clients().dataForSEO,clientReady=typeof client==='function';
    const box=section(host,'DataForSEO','Power-up opcional. Sólo refresh manual, cacheado y con confirmación explícita de coste.');
    const enabledWrap=el('label','seo-field','Activar consultas manuales'),enabled=el('input');enabled.type='checkbox';enabled.checked=!!state.enabled;enabled.dataset.dataforseoEnabled='';enabled.disabled=!clientReady;
    enabled.addEventListener('change',()=>a.set('seo.integrations.dataForSEO',{...(a.get('seo.integrations.dataForSEO')||{}),enabled:enabled.checked,status:enabled.checked?'CONNECTED':'NOT_MEASURED',error:''}));
    enabledWrap.append(enabled);
    const query=input('Keyword',state.lastQuery||'',{
      data:'dataforseoQuery',placeholder:'comprar casa costa blanca',
      onChange:value=>a.set('seo.integrations.dataForSEO',{...(a.get('seo.integrations.dataForSEO')||{}),lastQuery:String(value||'').trim()})
    });
    box.append(enabledWrap,query.wrap);
    if(!clientReady)box.append(help('Backend DataForSEO no conectado. Estado NOT_MEASURED y controles de pago deshabilitados.'));
    else box.append(help('Sólo refresh manual. Nunca se llama durante render.'));

    const canRefresh=clientReady&&!!state.enabled&&!!String(state.lastQuery||'').trim();
    box.append(button('Refresh manual DataForSEO',async()=>{
      const e=a.get('seo.integrations.dataForSEO')||{};
      if(!window.confirm('DataForSEO puede generar coste. ¿Confirmas este refresh manual?'))return;
      const adapter=new i.DataForSEOAdapter({enabled:true,client});
      a.set('seo.integrations.dataForSEO',{...e,status:'SYNCING',error:'',costWarning:true,lastSyncAt:stamp()});
      const result=await adapter.manualRefresh('keyword',{query:e.lastQuery||''}),fresh=snapshot(),latest=fresh.seo?.integrations?.dataForSEO||e,current=fresh.seo?.intelligence||{};
      if(result.status==='ERROR'){a.set('seo.integrations.dataForSEO',{...latest,status:'ERROR',error:result.error||'DataForSEO refresh failed',lastFetchedAt:result.lastFetchedAt||''});return;}
      if(result.status==='NOT_MEASURED'){a.set('seo.integrations.dataForSEO',{...latest,status:'NOT_MEASURED',error:'Sin medición disponible.'});return;}
      const raw=result.keyword&&typeof result.keyword==='object'?result.keyword:result,keywords=(e.lastQuery||raw.query)?adapter.normalizeKeywords([{...raw,query:e.lastQuery||raw.query}]):current.keywords||[];
      patch({
        'seo.integrations.dataForSEO':{...latest,status:'READY',error:'',lastSyncAt:stamp(),lastSuccessfulSyncAt:stamp(),lastFetchedAt:result.lastFetchedAt||stamp(),lastCost:result.cost??null,costWarning:true},
        'seo.intelligence':{...current,keywords}
      });
    },{disabled:!canRefresh}));

    const rows=(intel.keywords||[]).slice(0,5),results=el('div','rc-data-table');results.dataset.dataforseoResults='';
    if(state.lastFetchedAt)results.append(help(`Última medición: ${state.lastFetchedAt}${state.lastCost!=null?` · coste ${state.lastCost}`:''}.`));
    if(!rows.length)results.append(help('Keywords: NOT_MEASURED.'));
    else for(const row of rows){const line=el('div','rc-row');line.append(el('strong','',row.query||'(sin keyword)'),help(`volumen ${row.volume??'—'} · dificultad ${row.difficulty??'—'} · ${row.measuredAt||'sin fecha'}`));results.append(line);}
    if(state.costWarning)results.append(help('Aviso de coste activo: cada refresh requiere confirmación humana.'));
    box.append(results);
  }

  function applyCrawlerAudit(){
    const a=api(),i=intelligence(),fresh=snapshot(),geo=fresh.seo?.geo||{},evidence={...(geo.crawlerEvidence||{}),expectedCanonical:expectedCanonical(fresh)};
    if(!hasCrawlerEvidence(evidence)){alert('No hay evidencia medida suficiente. Ejecuta OpenSEO o abre el override manual.');return;}
    a.set('seo.geo',{...geo,crawlerEvidence:evidence,crawlerAccess:i.crawlerAudit(evidence)});
  }

  function renderCrawlerAudit(host,c){
    const a=api(),geo=c.seo?.geo||{},evidence=geo.crawlerEvidence||{},box=section(host,'Crawler audit','Prioriza evidencia capturada por el provider. El formulario manual queda como override de QA, no como medición automática.');
    const source=evidence.source||'NOT_MEASURED';
    box.append(help(`Fuente de evidencia: ${source}. ${hasCrawlerEvidence(evidence)?'Hay datos disponibles para auditar.':'Aún no hay robots/meta/HTTP medidos.'}`));
    box.append(button('Auditar evidencia disponible',applyCrawlerAudit,{disabled:!hasCrawlerEvidence(evidence)}));

    const manual=el('details','rc-manual');manual.append(el('summary','','Evidencia manual · override / QA'),help('Usa estos campos sólo para introducir evidencia observada manualmente. Vacío significa NOT_MEASURED.'));
    const robots=input('robots.txt observado',evidence.robotsText||'',{textarea:true,data:'crawlerRobots',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),robotsText:value,source:'manual'})});
    const meta=input('Meta robots observado',evidence.metaRobots||'',{data:'crawlerMeta',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),metaRobots:value,source:'manual'})});
    const http=input('HTTP status',evidence.httpStatus==null?'':String(evidence.httpStatus),{type:'number',data:'crawlerHttp',placeholder:'Sin medir',onChange:value=>{
      const clean=String(value||'').trim();
      a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),httpStatus:clean===''?null:Number(clean),source:'manual'});
    }});
    const canonical=input('Canonical observado',evidence.canonical||'',{type:'url',data:'crawlerCanonical',placeholder:'Sin medir',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),canonical:value,source:'manual'})});
    manual.append(robots.wrap,meta.wrap,http.wrap,canonical.wrap,button('Aplicar override y auditar',applyCrawlerAudit));
    box.append(manual);

    const results=el('div','seo-crawler-results');results.dataset.intelligenceCrawlers='';const access=geo.crawlerAccess||{};
    if(!Object.keys(access).length)results.append(help('Crawler audit: NOT_MEASURED.'));
    else for(const [name,result] of Object.entries(access)){
      const line=el('div','rc-row');line.append(el('strong','',`${name} · ${result.status}`),help(`allowed=${String(result.allowed)} · canonical ${result.evidence?.canonicalStatus||'NOT_MEASURED'} · HTTP ${result.evidence?.httpStatus??'NOT_MEASURED'} · source ${evidence.source||'unknown'}`));results.append(line);
    }
    box.append(results);
  }

  function renderGeo(host,c){
    const a=api(),i=intelligence(),geo=c.seo?.geo||{},computed=i.geoReadiness(c),entity=geo.entityReadiness&&Object.keys(geo.entityReadiness).length?geo.entityReadiness:computed.entity,citation=geo.citationReadiness||computed.citation,technical=geo.technicalReadiness||computed.technical,ai=geo.aiSearchAudit||computed.aiSearch;
    const box=section(host,'GEO / AI Search','Readiness heurística claramente separada de cualquier observación externa de buscadores de IA.');
    const recalc=button('Recalcular GEO readiness',()=>{
      const fresh=snapshot(),next=i.geoReadiness(fresh);
      a.set('seo.geo',{...(fresh.seo?.geo||{}),entityReadiness:next.entity,citationReadiness:next.citation,technicalReadiness:next.technical,contentReadiness:next.content,aiSearchAudit:next.aiSearch});
    });
    box.append(recalc);
    const rows=[
      ['Entity readiness',entity.label||'HEURISTIC',entity.gaps?.length?`Gaps: ${entity.gaps.join(', ')}`:'Sin gaps básicos detectados.'],
      ['Citability readiness',citation.label||'HEURISTIC',`Fortalezas: ${(citation.strengths||[]).join(', ')||'—'} · Debilidades: ${(citation.weaknesses||[]).join(', ')||'—'}`],
      ['Structured data',technical.structuredData||'NOT_MEASURED','Sólo MEASURED/MISSING cuando existe evidencia publicada.'],
      ['Public HTML',technical.publicHtml||'NOT_MEASURED','Sólo MEASURED/MISSING cuando existe evidencia publicada.'],
      ['AI Search',ai.status||'NOT_MEASURED','No se infiere visibilidad ni probabilidad de citación.']
    ];
    for(const [name,state,description] of rows){const line=el('div','rc-row');line.append(el('strong','',`${name} · ${state}`),help(description));box.append(line);}
    if((citation.recommendations||[]).length)box.append(help(`Recomendaciones: ${citation.recommendations.join(' · ')}`));
  }

  function renderInsights(host,c){
    const a=api(),i=intelligence(),intel=c.seo?.intelligence||{},box=section(host,'Insights con evidencia','DATA → INSIGHT → RECOMMENDATION → HUMAN REVIEW → APPLY. Nunca auto-aplica cambios SEO.');
    box.dataset.intelligenceInsights='';
    box.append(button('Crear insights desde issues OpenSEO',()=>{
      const fresh=snapshot(),state=fresh.seo?.intelligence||{};let list=[...(state.insights||[])];
      for(const issue of state.issues||[]){try{list=i.upsertInsight(list,{type:'TECHNICAL_FIX',source:'openseo',pageId:issue.pageId||'',severity:issue.severity||'MEDIUM',evidence:{category:issue.category,message:issue.message,...(issue.evidence||{})},recommendation:issue.recommendedAction||`Revisar ${issue.category||'issue técnico'}`});}catch{}}
      a.set('seo.intelligence.insights',list);
    },{disabled:!(intel.issues||[]).length}));
    const items=intel.insights||[];
    if(!items.length){box.append(help('Sin insights: no se generan recomendaciones sin evidencia.'));return;}
    for(const item of items.slice(-20).reverse()){
      const row=el('article','rc-row'),title=el('strong','',`${item.status||'OPEN'} · ${item.type||'INSIGHT'}`);
      row.append(title,help(`${item.source||'unknown'} · severidad ${item.severity||'—'} · confianza ${item.confidence??'—'}`),help(item.recommendation||'Revisión humana requerida.'));
      const ev=el('details','rc-manual');ev.append(el('summary','','Ver evidencia'));
      const pre=el('pre','seo-json');pre.textContent=JSON.stringify(item.evidence||{},null,2);ev.append(pre);row.append(ev);
      const actions=el('div','rc-actions');
      actions.append(
        button('Marcar revisado',()=>a.set('seo.intelligence.insights',[...(a.get('seo.intelligence.insights')||[])].map(x=>x.id===item.id?{...x,status:'REVIEWED'}:x)),{disabled:item.status==='REVIEWED'||item.status==='RESOLVED'}),
        button('Resolver',()=>a.set('seo.intelligence.insights',[...(a.get('seo.intelligence.insights')||[])].map(x=>x.id===item.id?{...x,status:'RESOLVED'}:x)),{disabled:item.status==='RESOLVED'})
      );
      row.append(actions);box.append(row);
    }
  }

  async function annotateMediaAudit(c){
    const list=$('[data-seo-checks]');const media=window.RubikSEOGeoMedia,store=window.RestaurantStore;
    if(!list||!media?.audit||!store?.listMedia)return;
    try{
      const records=await store.listMedia(),issues=media.audit(c,records),queues=new Map();
      for(const issue of issues){
        const key=`${issue.severity}|${issue.message}`,ref=String(issue.id||'').split('.')[1]||'asset',q=queues.get(key)||[];q.push(ref);queues.set(key,q);
      }
      for(const li of $$('li',list)){
        const severity=li.querySelector('strong')?.textContent||'',message=li.querySelector('span')?.textContent||'',q=queues.get(`${severity}|${message}`);
        if(!q?.length)continue;
        const ref=q.shift();const tag=help(`Asset: ${ref}`,'rc-audit-ref');li.append(tag);
      }
    }catch{}
  }

  function render(){
    const panel=$('.studio-panel[data-panel="seo-geo"]'),host=panel?.querySelector('[data-seo-intelligence]'),a=api(),i=intelligence();
    if(!panel||!host||!a||!i)return;
    addStyles();
    panel.querySelector('[data-release-c-advanced]')?.remove();
    host.replaceChildren();
    const c=snapshot();
    renderStatusOverview(host,c);
    const production=renderProduction(host,c);
    renderOpenSEO(host,c,production);
    renderSnapshots(host,c);
    renderSearchConsole(host,c);
    renderDataForSEO(host,c);
    renderCrawlerAudit(host,c);
    renderGeo(host,c);
    renderInsights(host,c);
    queueMicrotask(()=>annotateMediaAudit(snapshot()));
  }

  function ensure(){queueMicrotask(render);}

  const nav=$('.studio-nav [data-panel="seo-geo"]');
  nav?.addEventListener('click',ensure);
  document.addEventListener('restaurant:config-applied',ensure);
  window.addEventListener('load',ensure,{once:true});
})();
