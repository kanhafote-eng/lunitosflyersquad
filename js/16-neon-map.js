/* MondQuest · build 17: neon retro-futuristic map (OpenFreeMap vector tiles, drawn with MapLibre inside the existing Leaflet map)
   + Lunito markers for the player and for people who chose to share their (approximate) location.
   Safe by design: the old raster map stays until the neon one has really drawn; any failure keeps the old map. */
(function(){'use strict';
const C=window.MQ_CONFIG||{};
const OFM_STYLE='https://tiles.openfreemap.org/styles/liberty';
const OFM_FALLBACK={sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet'}},glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'};
const ATTR='<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/* ---------- palette (from the brief) ---------- */
const P={
  ground:'#1A1250',            // night blue: background and land
  water:'#35E6FF',             // cyan, with glow
  park:'#2E2275',              // dark violet derived from #9A6BFF
  parkEdge:'#4A3A9E',
  building:'#2A1F70',
  buildingEdge:'#3B2D8C',
  major:'#FF4FA3',             // motorways + main avenues: neon pink
  secondary:'#FFD21F',         // secondary streets: yellow
  tertiary:'#6A5AC4',          // quieter streets: muted violet
  minor:'#3D3390',
  rail:'#35E6FF',
  label:'#FFF5D9',
  labelSoft:'#CFC2FF',
  halo:'#120C3A'
};

/* ---------- build the style (OpenMapTiles schema) ---------- */
function build(base){
  base=base||OFM_FALLBACK;
  const srcs=base.sources||OFM_FALLBACK.sources;
  const sn=Object.keys(srcs).find(k=>srcs[k]&&srcs[k].type==='vector')||'openmaptiles';
  // fonts: reuse what the OpenFreeMap style uses so every glyph request is valid
  const fonts=[];(base.layers||[]).forEach(l=>{const f=l.layout&&l.layout['text-font'];if(Array.isArray(f)&&typeof f[0]==='string'&&f[0]!=='literal')f.forEach(x=>{if(typeof x==='string'&&!fonts.includes(x))fonts.push(x)})});
  const reg=[fonts.find(f=>/regular/i.test(f))||'Noto Sans Regular'],bold=[fonts.find(f=>/bold/i.test(f)&&!/italic/i.test(f))||'Noto Sans Bold'],ital=[fonts.find(f=>/italic/i.test(f))||reg[0]];
  const z=(a)=>['interpolate',['exponential',1.4],['zoom'],...a];
  const cls=(...c)=>['in',['get','class'],['literal',c]];
  const src=sn;
  const road=(id,filter,color,width,extra)=>({id,type:'line',source:src,'source-layer':'transportation',filter:['all',...filter],layout:{'line-cap':'round','line-join':'round'},paint:Object.assign({'line-color':color,'line-width':z(width)},extra||{})});
  const glow=(id,filter,color,width,op)=>road(id,filter,color,width,{'line-blur':z([8,2,14,6,18,14]),'line-opacity':op});
  const L=[
   {id:'bg',type:'background',paint:{'background-color':P.ground}},
   // land use
   {id:'landcover-green',type:'fill',source:src,'source-layer':'landcover',filter:cls('grass','wood','wetland','farmland'),paint:{'fill-color':P.park,'fill-opacity':.85}},
   {id:'park',type:'fill',source:src,'source-layer':'park',paint:{'fill-color':P.park,'fill-opacity':.9}},
   {id:'park-edge',type:'line',source:src,'source-layer':'park',minzoom:12,paint:{'line-color':P.parkEdge,'line-width':1,'line-opacity':.7}},
   {id:'landuse-green',type:'fill',source:src,'source-layer':'landuse',filter:cls('cemetery','pitch','playground','garden','allotments','recreation_ground'),paint:{'fill-color':P.park,'fill-opacity':.8}},
   // water: calm cyan body, glowing edge
   {id:'water',type:'fill',source:src,'source-layer':'water',paint:{'fill-color':P.water,'fill-opacity':.26}},
   {id:'water-glow',type:'line',source:src,'source-layer':'water',paint:{'line-color':P.water,'line-width':z([6,2,14,7,18,14]),'line-blur':z([6,3,14,7]),'line-opacity':.42}},
   {id:'water-edge',type:'line',source:src,'source-layer':'water',paint:{'line-color':P.water,'line-width':z([6,.6,14,1.4,18,2.2]),'line-opacity':.95}},
   {id:'waterway-glow',type:'line',source:src,'source-layer':'waterway',filter:cls('river','canal'),paint:{'line-color':P.water,'line-width':z([8,2,14,8,18,18]),'line-blur':z([8,3,14,8]),'line-opacity':.5}},
   {id:'waterway',type:'line',source:src,'source-layer':'waterway',paint:{'line-color':P.water,'line-width':z([8,.7,14,[ 'match',['get','class'],['river','canal'],2.6,1],18,5]),'line-opacity':.95}},
   // buildings: subtle
   {id:'building',type:'fill',source:src,'source-layer':'building',minzoom:14,paint:{'fill-color':P.building,'fill-opacity':.75}},
   {id:'building-edge',type:'line',source:src,'source-layer':'building',minzoom:15.5,paint:{'line-color':P.buildingEdge,'line-width':.6,'line-opacity':.8}},
   // quiet streets first (so the loud ones sit on top)
   Object.assign(road('road-service',[cls('service','track')],P.minor,[15,.4,18,2.4],{'line-opacity':.55}),{minzoom:15}),
   Object.assign(road('road-path',[cls('path')],P.tertiary,[16,.5,18,1.2],{'line-opacity':.35,'line-dasharray':[1,2]}),{minzoom:16}),
   road('road-minor',[cls('minor')],P.minor,[11,.3,14,1.1,18,7],{'line-opacity':.95}),
   road('road-tertiary',[cls('tertiary')],P.tertiary,[11,.4,14,1.5,18,10],{'line-opacity':.95}),
   // rail: dashed cyan
   {id:'rail',type:'line',source:src,'source-layer':'transportation',filter:['any',['all',['==',['get','class'],'rail'],['!',['in',['get','subclass'],['literal',['narrow_gauge','preserved','funicular']]]]],['all',['==',['get','class'],'transit'],['==',['get','subclass'],'light_rail']]],layout:{'line-join':'round'},paint:{'line-color':P.rail,'line-width':z([9,.6,14,1.5,18,3]),'line-dasharray':[3,2.2],'line-opacity':.9}},
   {id:'rail-faint',type:'line',source:src,'source-layer':'transportation',minzoom:12,filter:['all',['==',['get','class'],'transit'],['in',['get','subclass'],['literal',['subway','tram']]]],paint:{'line-color':P.rail,'line-width':z([12,.5,18,2]),'line-dasharray':[1.5,2.5],'line-opacity':.38}},
   // secondary: yellow, soft glow underneath
   glow('road-secondary-glow',[cls('secondary')],P.secondary,[10,1.5,14,5,18,16],.22),
   road('road-secondary',[cls('secondary')],P.secondary,[10,.5,14,1.9,18,11],{'line-opacity':.92}),
   // avenues + motorways: neon pink with real glow
   glow('road-major-glow',[cls('motorway','trunk','primary')],P.major,[7,2,14,8,18,22],.5),
   road('road-major',[cls('motorway','trunk','primary')],P.major,[6,.7,14,2.8,18,13],{'line-opacity':1}),
   road('road-major-core',[cls('motorway','trunk','primary')],'#FFC2E1',[12,.0,14,.8,18,3.6],{'line-opacity':.9}),
   // labels (names only; shops and other points of interest are left out on purpose)
   {id:'label-road',type:'symbol',source:src,'source-layer':'transportation_name',minzoom:13,filter:cls('motorway','trunk','primary','secondary','tertiary'),layout:{'symbol-placement':'line','text-field':['coalesce',['get','name:latin'],['get','name']],'text-font':bold,'text-size':z([13,10,18,13]),'text-letter-spacing':.04,'text-max-angle':30,'symbol-spacing':320},paint:{'text-color':P.label,'text-halo-color':P.halo,'text-halo-width':1.8,'text-halo-blur':.4}},
   {id:'label-road-minor',type:'symbol',source:src,'source-layer':'transportation_name',minzoom:15.5,filter:cls('minor'),layout:{'symbol-placement':'line','text-field':['coalesce',['get','name:latin'],['get','name']],'text-font':reg,'text-size':11,'text-max-angle':30,'symbol-spacing':260},paint:{'text-color':P.labelSoft,'text-halo-color':P.halo,'text-halo-width':1.6}},
   {id:'label-waterway',type:'symbol',source:src,'source-layer':'waterway',minzoom:11,filter:cls('river','canal'),layout:{'symbol-placement':'line','text-field':['coalesce',['get','name:latin'],['get','name']],'text-font':ital,'text-size':z([11,10,17,14]),'text-letter-spacing':.12,'symbol-spacing':420},paint:{'text-color':'#9DF3FF','text-halo-color':P.halo,'text-halo-width':1.8}},
   {id:'label-water',type:'symbol',source:src,'source-layer':'water_name',minzoom:9,layout:{'text-field':['coalesce',['get','name:latin'],['get','name']],'text-font':ital,'text-size':z([9,10,16,15]),'text-letter-spacing':.12,'text-max-width':6},paint:{'text-color':'#9DF3FF','text-halo-color':P.halo,'text-halo-width':1.8}},
   {id:'label-place-small',type:'symbol',source:src,'source-layer':'place',minzoom:12,filter:cls('suburb','quarter','neighbourhood','village','hamlet'),layout:{'text-field':['upcase',['coalesce',['get','name:latin'],['get','name']]],'text-font':bold,'text-size':z([12,10,16,13]),'text-letter-spacing':.14,'text-max-width':7,'symbol-sort-key':['match',['get','class'],'suburb',0,'quarter',1,2]},paint:{'text-color':P.labelSoft,'text-halo-color':P.halo,'text-halo-width':2,'text-halo-blur':.5}},
   {id:'label-place',type:'symbol',source:src,'source-layer':'place',filter:cls('city','town','island'),layout:{'text-field':['coalesce',['get','name:latin'],['get','name']],'text-font':bold,'text-size':z([4,11,10,17,14,22]),'text-max-width':8},paint:{'text-color':P.label,'text-halo-color':P.halo,'text-halo-width':2.2,'text-halo-blur':.5}}
  ].filter(Boolean);
  // ---- detail: shops, landmarks, park names, house numbers (shown from street-level zoom) ----
  const IC={food:['🍴','#FFB347'],cafe:['☕','#FFD21F'],bar:['🍺','#FF4FA3'],shop:['🛍️','#35E6FF'],bakery:['🥖','#35E6FF'],health:['✚','#6EE7A8'],civic:['🏛️','#CFC2FF'],police:['🛡️','#CFC2FF'],fire:['🚒','#FF8A65'],post:['✉️','#CFC2FF'],library:['📚','#9A6BFF'],museum:['🖼️','#FF4FA3'],theatre:['🎭','#FF4FA3'],cinema:['🎬','#FF4FA3'],star:['⭐','#FFD21F'],school:['🎒','#9A6BFF'],college:['🎓','#9A6BFF'],worship:['⛪','#CFC2FF'],sport:['🏟️','#6EE7A8'],hotel:['🛏️','#CFC2FF'],train:['🚆','#35E6FF'],bus:['🚌','#35E6FF'],bank:['🏦','#CFC2FF']};
  const CLS={restaurant:'food',fast_food:'food',food_court:'food',ice_cream:'food',cafe:'cafe',bar:'bar',pub:'bar',beer:'bar',biergarten:'bar',nightclub:'bar',
    shop:'shop',grocery:'shop',clothing_store:'shop',department_store:'shop',mall:'shop',jewelry:'shop',books:'shop',bicycle:'shop',florist:'shop',hairdresser:'shop',beauty:'shop',laundry:'shop',optician:'shop',toys:'shop',gift:'shop',electronics:'shop',
    pharmacy:'health',doctors:'health',dentist:'health',veterinary:'health',hospital:'health',clinic:'health',
    town_hall:'civic',courthouse:'civic',embassy:'civic',police:'police',fire_station:'fire',post:'post',library:'library',museum:'museum',theatre:'theatre',cinema:'cinema',art_gallery:'museum',
    attraction:'star',monument:'star',zoo:'star',school:'school',kindergarten:'school',college:'college',university:'college',place_of_worship:'worship',
    stadium:'sport',swimming:'sport',fitness_centre:'sport',lodging:'hotel',railway:'train',bus:'bus',bank:'bank'};
  const LAND=['town_hall','courthouse','embassy','police','fire_station','post','library','museum','theatre','cinema','art_gallery','attraction','monument','zoo','school','college','university','place_of_worship','hospital','stadium','railway'];
  const REG=Object.keys(CLS).filter(c=>!LAND.includes(c));
  const iconExpr=['case',['==',['get','subclass'],'bakery'],'mq-bakery',['match',['get','class'],...Object.keys(CLS).flatMap(c=>[c,'mq-'+CLS[c]]),'']];
  const nm=['coalesce',['get','name:latin'],['get','name']];
  const rankOk=['<=',['coalesce',['get','rank'],99],['step',['zoom'],12,15.5,30,16.5,80,17.5,999]];
  const txt=(c)=>({'text-color':c,'text-halo-color':P.halo,'text-halo-width':1.6,'text-halo-blur':.4});
  const DETAIL=[
   {id:'detail-park-name',type:'symbol',source:src,'source-layer':'park',minzoom:13,filter:['has','name'],layout:{'text-field':nm,'text-font':ital,'text-size':z([13,10,17,14]),'text-letter-spacing':.08,'text-max-width':7},paint:txt('#A8F0CF')},
   {id:'detail-poi-green',type:'symbol',source:src,'source-layer':'poi',minzoom:15,filter:cls('park','garden','playground','dog_park'),layout:{'text-field':nm,'text-font':ital,'text-size':11,'text-max-width':7,'text-optional':true},paint:txt('#A8F0CF')},
   {id:'detail-housenumber',type:'symbol',source:src,'source-layer':'housenumber',minzoom:17,layout:{'text-field':['get','housenumber'],'text-font':reg,'text-size':z([17,9,19,12]),'text-padding':2},paint:txt('#8E7FDD')},
   {id:'detail-poi',type:'symbol',source:src,'source-layer':'poi',minzoom:15,filter:['all',cls(...REG),rankOk],layout:{'icon-image':iconExpr,'icon-size':z([15,.5,18,.8]),'icon-padding':5,'symbol-sort-key':['coalesce',['get','rank'],99],'text-field':['step',['zoom'],'',16.5,nm],'text-font':reg,'text-size':10.5,'text-offset':[0,1.15],'text-anchor':'top','text-max-width':7,'text-optional':true},paint:txt(P.labelSoft)},
   {id:'detail-landmark',type:'symbol',source:src,'source-layer':'poi',minzoom:14,filter:cls(...LAND),layout:{'icon-image':iconExpr,'icon-size':z([14,.62,18,1]),'icon-padding':6,'symbol-sort-key':['coalesce',['get','rank'],99],'text-field':['step',['zoom'],'',15.3,nm],'text-font':bold,'text-size':11.5,'text-offset':[0,1.25],'text-anchor':'top','text-max-width':8,'text-optional':true},paint:txt(P.label)}
  ];
  L.splice(L.findIndex(l=>l.id==='label-road'),0,...DETAIL);
  window.mqNeonIcons=IC;
  return {version:8,name:'MondQuest Neon',sources:srcs,glyphs:base.glyphs||OFM_FALLBACK.glyphs,layers:L};
}

/* ---------- loading ---------- */
let stylePromise=null,libPromise=null;
const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>no(new Error('load '+u));document.head.appendChild(s)});
const loadCss=u=>{if(document.querySelector('link[data-mq-neon]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href=u;l.dataset.mqNeon='1';document.head.appendChild(l)};
function libs(){if(window.maplibregl&&window.L&&L.maplibreGL)return Promise.resolve();
  if(!libPromise){loadCss('vendor/maplibre/maplibre-gl.css');libPromise=loadScript('vendor/maplibre/maplibre-gl.js?v=17').then(()=>loadScript('vendor/maplibre/leaflet-maplibre-gl.js?v=17')).catch(e=>{libPromise=null;throw e})}
  return libPromise}
function style(){if(!stylePromise){
  const t=new Promise(r=>setTimeout(()=>r(null),6000));
  const f=fetch(OFM_STYLE).then(r=>r.ok?r.json():null).catch(()=>null);
  stylePromise=Promise.race([f,t]).then(b=>build(b)).catch(()=>build(null))}
  return stylePromise}
let _gl=null;function glOk(){if(_gl!==null)return _gl;try{const c=document.createElement('canvas');const g=c.getContext('webgl2')||c.getContext('webgl');_gl=!!(window.WebGLRenderingContext&&g);try{const x=g&&g.getExtension('WEBGL_lose_context');x&&x.loseContext()}catch(e){}}catch(e){_gl=false}return _gl}


/* neon badges for the map icons, drawn when the map asks for them */
function badge(id){
  const key=id.replace(/^mq-/,''),d=(window.mqNeonIcons||{})[key];if(!d)return null;
  const S=3,N=26*S,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  g.beginPath();g.arc(N/2,N/2,N/2-2*S,0,Math.PI*2);g.fillStyle='rgba(18,12,58,.94)';g.fill();
  g.lineWidth=1.6*S;g.strokeStyle=d[1];g.shadowColor=d[1];g.shadowBlur=3*S;g.stroke();g.shadowBlur=0;
  g.font=`${13*S}px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji","Twemoji Mozilla",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=d[1];
  g.fillText(d[0],N/2,N/2+S*.6);
  return g.getImageData(0,0,N,N)}
let brokenAt=0;
window.mqNeonWanted=()=>C.neonMap!==false&&(Date.now()-brokenAt>60000)&&glOk();
function fail(map,soft,why){try{console.warn('[MondQuest] neon map unavailable, using the standard map:',why||'unknown')}catch(e){}if(!soft)brokenAt=Date.now();try{if(map._mqRaster&&!map._mqRasterOn&&map===leafletInstance&&document.body.contains(map.getContainer())){map._mqRasterOn=1;map._mqRaster()}}catch(e){}}
function upgrade(map){
  if(!map||map._mqNeon||!window.mqNeonWanted())return;
  map._mqNeon=1;map._mqGone=0;
  Promise.all([libs(),style()]).then(([,st0])=>{let st=st0;
    if(!map.getContainer||!map.getContainer()||!document.body.contains(map.getContainer()))return;   // the screen changed meanwhile
    let det=!window.__mqLite;try{if(window.mqSettings&&mqSettings().detail===false)det=false}catch(e){}
    if(!det){st=JSON.parse(JSON.stringify(st));st.layers.forEach(l=>{if(/^detail-/.test(l.id))l.layout=Object.assign({},l.layout,{visibility:'none'})})}
    const layer=L.maplibreGL({style:st,padding:window.__mqLite?.05:.15,interactive:false});
    layer.addTo(map);
    const mm=layer.getMaplibreMap();let done=false;
    mm.on('styleimagemissing',e=>{try{if(/^mq-/.test(e.id)&&!mm.hasImage(e.id)){const im=badge(e.id);if(im)mm.addImage(e.id,im,{pixelRatio:3})}}catch(x){}});
    const ok=()=>{if(done)return;done=true;
      map.eachLayer(l=>{if(l instanceof L.TileLayer&&l!==layer)map.removeLayer(l)});
      map.getContainer().classList.add('mq-neon');
      try{map.attributionControl.addAttribution(ATTR)}catch(e){}
      let w=document.getElementById('map-fallback');if(w)w.hidden=true};
    const bad=()=>{if(done||map._mqGone||!document.body.contains(map.getContainer()))return;done=true;try{map.removeLayer(layer)}catch(e){}fail(map,false,'no first draw in 30 s')};
    mm.on('error',e=>{try{console.warn('[MondQuest] map error:',e&&e.error&&e.error.message||e)}catch(x){}});
    mm.on('idle',ok);mm.on('load',ok);
    let lostT=0;const cv=mm.getCanvas();layer.on('remove',()=>{map._mqGone=1;clearTimeout(lostT)});cv.addEventListener('webglcontextlost',()=>{if(map._mqGone)return;clearTimeout(lostT);lostT=setTimeout(()=>{if(map._mqGone)return;try{map.removeLayer(layer)}catch(e){}if(!window.__mqLite){window.__mqLite=1;console.warn('[MondQuest] map context lost, retrying lighter');map._mqNeon=0;setTimeout(()=>{try{if(document.body.contains(map.getContainer()))upgrade(map)}catch(x){}},400)}else fail(map,true,'WebGL context lost twice')},12000)});cv.addEventListener('webglcontextrestored',()=>{clearTimeout(lostT);try{mm.triggerRepaint()}catch(e){}});
    setTimeout(()=>{if(!done)bad()},30000);
    window.__mqNeonLayer=layer;
  }).catch(e=>{map._mqNeon=0;fail(map,false,e&&e.message||String(e))})
}
const _il=initLeaflet;
initLeaflet=function(){const r=_il.apply(this,arguments);try{window.__mqMap=leafletInstance;upgrade(leafletInstance)}catch(e){}return r};
window.mqNeonStyle=build;window.mqNeonPalette=P;
try{if(typeof leafletInstance!=='undefined'&&leafletInstance){window.__mqMap=leafletInstance;upgrade(leafletInstance)}}catch(e){}

/* ---------- Lunito markers ---------- */
function lunSvg(look,self){
  if(typeof courierSvg!=='function')return '<span>👤</span>';
  const a=state.accessories,g=state.gadgets,sa=a&&a.equipped,sg=g&&g.equipped;
  try{
    if(!self){if(a)a.equipped=Array.isArray(look&&look.equipped)?look.equipped.slice(0,12):[];if(g)g.equipped=Array.isArray(look&&look.gadgetsOn)?look.gadgetsOn.slice(0,8):[]}
    return courierSvg(self?(typeof playerSnapshot==='function'?playerSnapshot():{}):(look||{}))
  }catch(e){return '<span>👤</span>'}
  finally{if(!self){if(a)a.equipped=sa;if(g)g.equipped=sg}}}
window.mqLunitoIcon=function(x){
  if(!window.L)return null;
  const self=!x.remote&&state.user&&String(x.code)===String(state.user.code);
  const name=self?'You':String(x.name||'Courier').slice(0,14);
  const esc2=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return L.divIcon({className:'mq-lun-wrap',iconSize:[72,78],iconAnchor:[36,68],popupAnchor:[0,-60],
    html:`<div class="mq-lun${self?' me':''}"><span class="mq-lun-ring"></span><div class="mq-lun-fig">${lunSvg(x.avatar,self)}</div><span class="mq-lun-name">${esc2(name)}</span></div>`})};
})();
