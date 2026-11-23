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
function glOk(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')))}catch(e){return false}}

let broken=false;try{broken=sessionStorage.getItem('mq-neon-broken')==='1'}catch(e){}
window.mqNeonWanted=()=>C.neonMap!==false&&!broken&&glOk();
function fail(map){broken=true;try{sessionStorage.setItem('mq-neon-broken','1')}catch(e){}try{if(map._mqRaster&&!map._mqRasterOn){map._mqRasterOn=1;map._mqRaster()}}catch(e){}}
function upgrade(map){
  if(!map||map._mqNeon||!window.mqNeonWanted())return;
  map._mqNeon=1;
  Promise.all([libs(),style()]).then(([,st])=>{
    if(!map.getContainer||!map.getContainer()||!document.body.contains(map.getContainer()))return;   // the screen changed meanwhile
    const layer=L.maplibreGL({style:st,padding:.25,interactive:false});
    layer.addTo(map);
    const mm=layer.getMaplibreMap();let done=false;
    const ok=()=>{if(done)return;done=true;
      map.eachLayer(l=>{if(l instanceof L.TileLayer&&l!==layer)map.removeLayer(l)});
      map.getContainer().classList.add('mq-neon');
      try{map.attributionControl.addAttribution(ATTR)}catch(e){}
      let w=document.getElementById('map-fallback');if(w)w.hidden=true};
    const bad=()=>{if(done)return;done=true;try{map.removeLayer(layer)}catch(e){}fail(map)};
    mm.on('idle',ok);
    mm.on('webglcontextlost',()=>{try{map.removeLayer(layer)}catch(e){}fail(map)});
    setTimeout(()=>{if(!done)bad()},15000);
    window.__mqNeonLayer=layer;
  }).catch(()=>{map._mqNeon=0;fail(map)})
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
