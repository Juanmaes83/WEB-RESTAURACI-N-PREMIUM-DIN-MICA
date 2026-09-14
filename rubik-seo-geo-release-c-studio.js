/* Release C Studio extension. Same Studio, Project State and provider model; no parallel store. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const api=()=>window.RestaurantStudioConfig;
  const intelligence=()=>window.RubikSEOGeoIntelligence;
  const core=()=>window.RubikSEOGeoCore;
  const clients=()=>window.RubikSEOGeoProviderClients||{};
  const snapshot=()=>api()?.snapshot?.()||{};
  const patch=entries=>api()?.patch?api().patch(entries):Object.entries(entries||{}).forEach(([path,value])=>api()?.set?.(path,value));
  const input=(label,value,{type='text',textarea=false,onChange,data}={})=>{
    const wrap=el('label','seo-field',label),field=el(textarea?'textarea':'input');
    if(!textarea)field.type=type;
    else field.rows=3;
    field.value=value??'';
    if(data)field.dataset[data]='';
    field.addEventListener('change',()=>onChange?.(field.value,field));
    wrap.append(field);
    return {wrap,field};
  };
  const button=(label,fn)=>{const b=el('button','studio-primary',label);b.type='button';b.addEventListener('click',fn);return b;};
  const providerRow=(name,state,help,error='')=>{const row=el('article','seo-media-row');row.append(el('strong','',name),el('span','seo-status',state),el('small','seo-help',help));if(error)row.append(el('small','seo-help',error));return row;};

  function ensure(){
    const panel=$('.studio-panel[data-panel="seo-geo"]');
    if(!panel)return;
    let box=$('[data-release-c-advanced]',panel);
    if(!box){
      box=el('details','seo-card');box.dataset.releaseCAdvanced='';box.open=true;
      box.append(el('summary','','Intelligence avanzado · Release C'),el('p','seo-help','Snapshots, Search Console, DataForSEO, crawlers e insights dentro del mismo Project State. Sin métricas inventadas ni secretos en cliente.'));
      const body=el('div','seo-intelligence');body.dataset.releaseCBody='';box.append(body);panel.append(box);
    }
    render();
  }

  function render(){
    const body=$('[data-release-c-body]'),a=api(),i=intelligence();
    if(!body||!a||!i)return;
    body.replaceChildren();
    const c=snapshot(),s=c.seo?.integrations||{},intel=c.seo?.intelligence||{},geo=c.seo?.geo||{};
    body.append(
      providerRow('OpenSEO',s.openseo?.status||'NOT_CONFIGURED','Crawl técnico explícito sobre URLs públicas.',s.openseo?.error||''),
      providerRow('Search Console',s.searchConsole?.status||'NOT_CONNECTED','OAuth y refresh token son server-side.',s.searchConsole?.error||''),
      providerRow('DataForSEO',s.dataForSEO?.status||'NOT_MEASURED','Refresh manual y con aviso de coste.',s.dataForSEO?.error||''),
      providerRow('GEO / AI Search',geo.citationReadiness?.label||'HEURISTIC','Readiness heurística; AI Search sigue NOT_MEASURED sin proveedor externo.')
    );

    const production=core()?.baseUrl?.(c.seo?.site?.baseUrl||'')||'';
    body.append(el('p','seo-help',production?`Producción: ${production}`:'Producción pendiente: define una URL HTTPS válida antes del crawl.'));

    const snapshots=el('div','seo-intelligence-history');snapshots.dataset.intelligenceSnapshots='';snapshots.append(el('strong','','Snapshots y diff'));
    const openSnapshots=(intel.snapshots||[]).filter(x=>x.provider==='openseo');
    if(!openSnapshots.length)snapshots.append(el('small','seo-help','Sin snapshots OpenSEO todavía.'));
    else{
      for(const item of openSnapshots.slice(-5).reverse())snapshots.append(el('small','seo-help',`${item.completedAt||item.startedAt} · ${item.pagesScanned||0} páginas · ${(item.issues||[]).length} issues · ${item.snapshotId}`));
      if(openSnapshots.length>1){
        const delta=i.diff(openSnapshots.at(-2),openSnapshots.at(-1)),counts=delta.reduce((m,x)=>(m[x.change]=(m[x.change]||0)+1,m),{});
        const line=el('small','seo-help',`Diff: ${counts.NEW||0} NEW · ${counts.RESOLVED||0} RESOLVED · ${counts.IMPROVED||0} IMPROVED · ${counts.REGRESSED||0} REGRESSED · ${counts.UNCHANGED||0} UNCHANGED`);line.dataset.intelligenceDiff='';snapshots.append(line);
      }
    }
    body.append(snapshots);

    const gsc=el('div','seo-intelligence-provider');gsc.append(el('strong','','Search Console'));
    const property=input('Propiedad',s.searchConsole?.property||'',{data:'gscProperty',onChange:value=>a.set('seo.integrations.searchConsole',{...(a.get('seo.integrations.searchConsole')||{}),property:value,status:'NOT_CONNECTED',error:''})});
    const range=el('select');range.dataset.gscDateRange='';for(const value of ['7d','28d','90d']){const o=el('option','',value);o.value=value;o.selected=(s.searchConsole?.dateRange||'28d')===value;range.append(o);}range.addEventListener('change',()=>a.set('seo.integrations.searchConsole',{...(a.get('seo.integrations.searchConsole')||{}),dateRange:range.value}));const rangeWrap=el('label','seo-field','Periodo');rangeWrap.append(range);
    gsc.append(property.wrap,rangeWrap);
    gsc.append(button('Comprobar Search Console',async()=>{
      const e=a.get('seo.integrations.searchConsole')||{},adapter=new i.SearchConsoleAdapter({client:clients().searchConsole,property:e.property,dateRange:e.dateRange}),result=await adapter.connectivity(),stamp=new Date().toISOString();
      a.set('seo.integrations.searchConsole',{...e,status:result.status,error:result.error||(result.status==='NOT_CONNECTED'?'Backend/OAuth no conectado.':''),lastSyncAt:stamp,lastSuccessfulSyncAt:result.status==='CONNECTED'?stamp:e.lastSuccessfulSyncAt});
    }));
    gsc.append(button('Sincronizar Search Console',async()=>{
      const e=a.get('seo.integrations.searchConsole')||{},client=clients().searchConsole,adapter=new i.SearchConsoleAdapter({client,property:e.property,dateRange:e.dateRange});
      if(!client){a.set('seo.integrations.searchConsole',{...e,status:'NOT_CONNECTED',error:'Backend/OAuth no conectado.'});return;}
      a.set('seo.integrations.searchConsole',{...e,status:'SYNCING',error:'',lastSyncAt:new Date().toISOString()});
      const result=await adapter.sync(),fresh=snapshot(),state=fresh.seo?.intelligence||{},latest=fresh.seo?.integrations?.searchConsole||e;
      if(result.status!=='READY'){a.set('seo.integrations.searchConsole',{...latest,status:result.status,error:result.error||'Search Console sync failed'});return;}
      const opportunities=adapter.opportunities(result.rows);let insights=[...(state.insights||[])];
      for(const op of opportunities){try{insights=i.upsertInsight(insights,{type:op.type,source:'searchConsole',query:op.query||'',pageId:op.page||'',evidence:op.evidence,recommendation:'Revisar la oportunidad antes de aplicar cambios.'});}catch{}}
      patch({'seo.integrations.searchConsole':{...latest,status:'READY',error:'',dateRange:result.dateRange,lastSyncAt:new Date().toISOString(),lastSuccessfulSyncAt:new Date().toISOString()},'seo.intelligence':{...state,queries:result.queries,pages:result.pages,opportunities,insights}});
    }));
    body.append(gsc);

    const dfs=el('div','seo-intelligence-provider');dfs.append(el('strong','','DataForSEO'));
    const enabledWrap=el('label','seo-field','Activar consultas manuales'),enabled=el('input');enabled.type='checkbox';enabled.checked=!!s.dataForSEO?.enabled;enabled.dataset.dataforseoEnabled='';enabled.addEventListener('change',()=>a.set('seo.integrations.dataForSEO',{...(a.get('seo.integrations.dataForSEO')||{}),enabled:enabled.checked,status:enabled.checked&&clients().dataForSEO?'CONNECTED':'NOT_MEASURED',error:''}));enabledWrap.append(enabled);
    const query=input('Keyword',s.dataForSEO?.lastQuery||'',{data:'dataforseoQuery',onChange:value=>a.set('seo.integrations.dataForSEO',{...(a.get('seo.integrations.dataForSEO')||{}),lastQuery:value})});
    dfs.append(enabledWrap,query.wrap,el('small','seo-help','Sólo refresh manual. Nunca se llama durante render.'));
    dfs.append(button('Refresh manual DataForSEO',async()=>{
      const e=a.get('seo.integrations.dataForSEO')||{},client=clients().dataForSEO;
      if(!e.enabled){a.set('seo.integrations.dataForSEO',{...e,status:'NOT_MEASURED',error:'Activa las consultas manuales antes del refresh.'});return;}
      if(!client){a.set('seo.integrations.dataForSEO',{...e,status:'NOT_MEASURED',error:'Backend DataForSEO no conectado.'});return;}
      const adapter=new i.DataForSEOAdapter({enabled:true,client});a.set('seo.integrations.dataForSEO',{...e,status:'SYNCING',error:'',costWarning:true,lastSyncAt:new Date().toISOString()});
      const result=await adapter.manualRefresh('keyword',{query:e.lastQuery||''}),fresh=snapshot(),latest=fresh.seo?.integrations?.dataForSEO||e,state=fresh.seo?.intelligence||{};
      if(result.status==='ERROR'){a.set('seo.integrations.dataForSEO',{...latest,status:'ERROR',error:result.error||'DataForSEO refresh failed',lastFetchedAt:result.lastFetchedAt||''});return;}
      if(result.status==='NOT_MEASURED'){a.set('seo.integrations.dataForSEO',{...latest,status:'NOT_MEASURED',error:'Sin medición disponible.'});return;}
      const raw=result.keyword&&typeof result.keyword==='object'?result.keyword:result,keywords=(e.lastQuery||raw.query)?adapter.normalizeKeywords([{...raw,query:e.lastQuery||raw.query}]):state.keywords||[];
      patch({'seo.integrations.dataForSEO':{...latest,status:'READY',error:'',lastSyncAt:new Date().toISOString(),lastSuccessfulSyncAt:new Date().toISOString(),lastFetchedAt:result.lastFetchedAt||new Date().toISOString(),lastCost:result.cost??null,costWarning:true},'seo.intelligence':{...state,keywords}});
    }));
    if(s.dataForSEO?.costWarning)dfs.append(el('small','seo-help',`Aviso de coste activo${s.dataForSEO.lastCost!=null?` · último coste ${s.dataForSEO.lastCost}`:''}.`));
    body.append(dfs);

    const crawler=el('div','seo-intelligence-provider');crawler.append(el('strong','','Crawler audit con evidencia'));
    const evidence=geo.crawlerEvidence||{};
    const robots=input('robots.txt observado',evidence.robotsText||'',{textarea:true,data:'crawlerRobots',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),robotsText:value})});
    const meta=input('Meta robots observado',evidence.metaRobots||'',{data:'crawlerMeta',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),metaRobots:value})});
    const http=input('HTTP status',String(evidence.httpStatus??200),{type:'number',data:'crawlerHttp',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),httpStatus:Number(value)||0})});
    const canonical=input('Canonical observado',evidence.canonical||'',{type:'url',data:'crawlerCanonical',onChange:value=>a.set('seo.geo.crawlerEvidence',{...(a.get('seo.geo.crawlerEvidence')||{}),canonical:value})});
    crawler.append(robots.wrap,meta.wrap,http.wrap,canonical.wrap,button('Auditar crawlers con evidencia',()=>{
      const fresh=snapshot(),ev={...(fresh.seo?.geo?.crawlerEvidence||{}),expectedCanonical:core()?.baseUrl?.(fresh.seo?.site?.baseUrl||'')||''};
      if(!ev.robotsText&&!ev.metaRobots&&!ev.canonical){alert('Añade robots.txt, meta robots o canonical observado antes de auditar.');return;}
      a.set('seo.geo',{...(fresh.seo?.geo||{}),crawlerEvidence:ev,crawlerAccess:i.crawlerAudit(ev)});
    }));
    const crawlerResults=el('div','seo-crawler-results');crawlerResults.dataset.intelligenceCrawlers='';const access=geo.crawlerAccess||{};
    if(!Object.keys(access).length)crawlerResults.append(el('small','seo-help','Crawler audit: NOT_MEASURED.'));
    else for(const [name,result] of Object.entries(access))crawlerResults.append(el('small','seo-help',`${name}: ${result.status} · canonical ${result.evidence?.canonicalStatus||'NOT_MEASURED'}`));
    crawler.append(crawlerResults);body.append(crawler);

    const insightBox=el('div','seo-intelligence-insights');insightBox.dataset.intelligenceInsights='';insightBox.append(el('strong','','Insights con evidencia'));
    insightBox.append(button('Crear insights desde issues OpenSEO',()=>{
      const fresh=snapshot(),state=fresh.seo?.intelligence||{};let list=[...(state.insights||[])];
      for(const issue of state.issues||[]){try{list=i.upsertInsight(list,{type:'TECHNICAL_FIX',source:'openseo',pageId:issue.pageId||'',severity:issue.severity||'MEDIUM',evidence:{category:issue.category,message:issue.message,...(issue.evidence||{})},recommendation:issue.recommendedAction||`Revisar ${issue.category||'issue técnico'}`});}catch{}}
      a.set('seo.intelligence.insights',list);
    }));
    const insights=intel.insights||[];
    if(!insights.length)insightBox.append(el('small','seo-help','Sin insights: no se generan recomendaciones sin evidencia.'));
    else for(const item of insights.slice(-20).reverse()){
      const row=el('article','seo-media-row');row.append(el('strong','',`${item.status} · ${item.type}`),el('small','seo-help',`${item.source} · ${item.recommendation||'Revisión humana requerida.'}`));
      row.append(button('Marcar revisado',()=>a.set('seo.intelligence.insights',[...(a.get('seo.intelligence.insights')||[])].map(x=>x.id===item.id?{...x,status:'REVIEWED'}:x))),button('Resolver',()=>a.set('seo.intelligence.insights',[...(a.get('seo.intelligence.insights')||[])].map(x=>x.id===item.id?{...x,status:'RESOLVED'}:x))));insightBox.append(row);
    }
    body.append(insightBox);
  }

  const nav=$('.studio-nav [data-panel="seo-geo"]');
  nav?.addEventListener('click',()=>queueMicrotask(ensure));
  document.addEventListener('restaurant:config-applied',()=>queueMicrotask(ensure));
  window.addEventListener('load',ensure,{once:true});
})();
