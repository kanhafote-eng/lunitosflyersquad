/* MondQuest · build 19: flyer pickup points. Zirkus Mond HQ is always the biggest pin; extra points come from Admin > Pickup points. */
(function(){'use strict';
const HQ0={id:'hq',name:'Zirkus Mond HQ',address:'Rudolfstraße 14c, 10245 Berlin',lat:52.50336,lng:13.4557,note:'',color:'#FF4FA3',active:true,main:true};
let remote=[];
const num=v=>Number.isFinite(+v)?+v:null;
function clean(p){return{id:String(p.id||'').replace(/[^\w-]/g,'').slice(0,24),name:String(p.name||'').slice(0,60),address:String(p.address||'').slice(0,120),note:String(p.note||'').slice(0,160),
  color:/^#[0-9a-fA-F]{6}$/.test(String(p.color||''))?String(p.color):'#35E6FF',lat:num(p.lat),lng:num(p.lng),active:p.active!==false}}
window.mqSetPickupPoints=function(arr){remote=Array.isArray(arr)?arr.map(clean).filter(p=>p.id&&p.lat!=null&&p.lng!=null):[];
  try{if(typeof leafletInstance!=="undefined"&&leafletInstance&&typeof refreshMarkers==='function')refreshMarkers()}catch(e){}
  try{if(typeof currentView!=='undefined'&&currentView==='pickup'&&typeof pickup==='function')pickup()}catch(e){}};
window.mqPoints=function(){
  const o=remote.find(p=>p.id==='hq'),hq=Object.assign({},HQ0,o?{lat:o.lat,lng:o.lng,address:o.address||HQ0.address,note:o.note||''}:{});
  return [hq].concat(remote.filter(p=>p.id!=='hq'&&p.active))};
const esc2=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hue(hex){const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return Math.round((h*60+360)%360)}
function popup(p){return `<b>${esc2(p.main?'Zirkus Mond · Flyer pickup':p.name)}</b><br>${esc2(p.address)}${p.note?`<br><small>${esc2(p.note)}</small>`:'<br><small>Collect flyers, posters &amp; stickers here</small>'}`}
window.mqAddHq=function(map,markers){
  const pts=window.mqPoints();
  pts.slice(1).forEach(p=>{
    const ic=L.divIcon({className:'custom-pin hq extra',html:'<span aria-hidden="true"><svg class="mq-i" aria-hidden="true" focusable="false"><use href="#i-moon"></use></svg></span>',iconSize:[42,42],iconAnchor:[21,36]});
    const m=L.marker([p.lat,p.lng],{icon:ic,zIndexOffset:300}).bindPopup(popup(p)).addTo(map);
    const el=m.getElement&&m.getElement();if(el){el.style.setProperty('--pc',p.color);el.style.setProperty('--ph',(hue(p.color)-45)+'deg')}
    m.on('add',()=>{const e=m.getElement();if(e){e.style.setProperty('--pc',p.color);e.style.setProperty('--ph',(hue(p.color)-45)+'deg')}});
    markers.push(m)});
  const h=pts[0],m=L.marker([h.lat,h.lng],{icon:makeIcon('☾','hq'),zIndexOffset:900}).bindPopup(popup(h)).addTo(map);markers.push(m);return m};
window.mqFlyTo=function(lat,lng){try{go('menu');setTimeout(()=>{if(typeof leafletInstance!=="undefined"&&leafletInstance)leafletInstance.setView([lat,lng],18,{animate:true})},700)}catch(e){}};
/* pickup page: a list of all pickup points when there is more than one */
const _p=pickup;
pickup=function(){const r=_p.apply(this,arguments);
  try{const pts=window.mqPoints();if(pts.length>1){const card=document.querySelector('.view .card');if(card&&!document.getElementById('pp-list')){
    const box=document.createElement('section');box.className='card pp-card';box.id='pp-list';
    box.innerHTML='<div class="eyebrow">PICKUP POINTS</div><h2>Where to collect</h2>'+pts.map((p,i)=>`<div class="pp-item" style="--pc:${p.color}"><span class="pp-dot${i?'':' big'}" aria-hidden="true"></span><div class="pp-txt"><b>${esc2(i?p.name:'Zirkus Mond HQ')}</b>${i?'':' <span class="pp-tag">Main</span>'}<div class="small">${esc2(p.address)}</div>${p.note?`<div class="small">${esc2(p.note)}</div>`:''}</div><div class="pp-btns"><button type="button" class="button quiet small" data-ppgo="${i}">Map</button><a class="button quiet small" target="_blank" rel="noopener" href="https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lng}">Route</a></div></div>`).join('');
    card.parentNode.insertBefore(box,card);
    box.querySelectorAll('[data-ppgo]').forEach(b=>b.addEventListener('click',()=>{const p=pts[+b.dataset.ppgo];mqFlyTo(p.lat,p.lng)}))}}}catch(e){}
  return r};
})();
