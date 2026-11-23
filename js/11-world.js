/* MondQuest · shared world: flyer drops light up places for everyone, sticker sightings show on the map for everyone. Needs sheetUrl. */
(function(){'use strict';
const C=window.MQ_CONFIG||{};if(!C.sheetUrl)return;
const E=s=>esc(String(s==null?'':s));
const SK='mq-world-sent';
let sent=new Set();try{sent=new Set(JSON.parse(localStorage.getItem(SK)||'[]'))}catch(e){}
const saveSent=()=>{try{localStorage.setItem(SK,JSON.stringify([...sent].slice(-400)))}catch(e){}};
const myCode=()=>String(state.user&&state.user.code||'');
// sightings are visible by default now (one-time switch for people who already have saved settings)
try{if(!localStorage.getItem('mq-sv12')){localStorage.setItem('mq-sv12','1');const S=window.mqSettings&&mqSettings();if(S){S.sightings=true;localStorage.setItem('mq-settings',JSON.stringify(S))}showSpottedMarkers=true}}catch(e){}

/* ---------- send my drops and sightings ---------- */
let pushing=false;
async function push(){
  if(window.mqEcon)return;   // build 15: the server records drops and sightings itself
  if(pushing||!state.user||!navigator.onLine||!window.mqPost)return;const me=myCode();if(!me)return;
  const items=[];
  (state.deliveries||[]).forEach(d=>{if(items.length>=10||d.remoteW||String(d.playerCode)!==me||!d.id||sent.has(d.id)||!d.placeId)return;
    if(!((+d.flyers||0)+(+d.posters||0)+(+d.stickers||0)>0)||Date.now()-d.at>7*864e5)return;
    items.push({kind:'drop',id:String(d.id),placeId:String(d.placeId),flyers:+d.flyers||0,posters:+d.posters||0,stickers:+d.stickers||0,at:d.at})});
  (state.spotted||[]).forEach(x=>{if(items.length>=10||x.remoteW||String(x.playerCode)!==me||!x.id||sent.has(x.id)||x.approximate)return;
    if(!Number.isFinite(+x.lat)||!Number.isFinite(+x.lng)||Date.now()-x.at>7*864e5)return;
    items.push({kind:'sight',id:String(x.id),lat:+x.lat,lng:+x.lng,text:String(x.exactAddress||[x.addressParts&&x.addressParts.street,x.addressParts&&x.addressParts.city].filter(Boolean).join(', ')),country:String(x.addressParts&&x.addressParts.country||''),thumb:/^data:image\/jpeg;base64,/.test(x.thumbnail||'')?x.thumbnail:'',at:x.at})});
  if(!items.length)return;
  pushing=true;
  try{const r=await mqPost({action:'worldPost',player:{code:me,name:state.user.name},items});
    if(r&&r.ok){items.forEach(i=>sent.add(i.id));saveSent();setTimeout(pull,500)}}catch(e){}finally{pushing=false}}

/* ---------- read everybody's ---------- */
let sig='',pending=false,pulling=false;
async function pull(){
  if(pulling||!state.user||!navigator.onLine||!window.mqPost)return;const me=myCode();if(!me)return;pulling=true;
  try{const r=await mqPost({action:'worldGet',player:{code:me,name:state.user.name}});if(!r||!r.ok)return;
    const s2=(r.drops||[]).map(d=>d.id).join(',')+'|'+(r.sights||[]).map(x=>x.id).join(',');
    if(s2===sig)return;sig=s2;
    const haveD=new Set((state.deliveries||[]).filter(d=>!d.remoteW).map(d=>String(d.id))),haveS=new Set((state.spotted||[]).filter(x=>!x.remoteW).map(x=>String(x.id)));
    state.deliveries=(state.deliveries||[]).filter(d=>!d.remoteW);
    (r.drops||[]).forEach(d=>{if(haveD.has(d.id))return;const code=d.me?me:'r:'+d.pid;
      state.deliveries.push({id:d.id,placeId:d.placeId,placeName:'',user:d.nick,userId:code,playerCode:code,avatarSnapshot:{code,name:d.nick},kind:'delivery',flyers:d.flyers,posters:d.posters,stickers:d.stickers,points:0,noPointRepeat:false,at:d.at,remoteW:true})});
    state.spotted=(state.spotted||[]).filter(x=>!x.remoteW);
    (r.sights||[]).forEach(x=>{if(haveS.has(x.id))return;const code=x.me?me:'r:'+x.pid;
      state.spotted.push({id:x.id,addressParts:{country:x.country},exactAddress:x.text,lat:x.lat,lng:x.lng,photo:!!x.thumb,thumbnail:'',points:0,at:x.at,user:x.nick,playerCode:code,remoteW:true})});
    try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(state))}catch(e){}
    redraw()}catch(e){}finally{pulling=false}}
function redraw(){
  if(document.querySelector('.leaflet-popup')){pending=true;return}
  pending=false;try{if(typeof leafletInstance!=='undefined'&&leafletInstance)refreshMarkers()}catch(e){}
  try{if(currentView==='places'&&!document.querySelector('input:focus'))go('places')}catch(e){}}
setInterval(()=>{if(pending&&!document.querySelector('.leaflet-popup'))redraw()},4000);

/* ---------- popups: who, where, when ---------- */
const ago=ms=>{const m=Math.max(0,Math.round((Date.now()-ms)/60000));return m<2?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
const _pp=placePopupHtml;
placePopupHtml=function(p){let h=_pp.apply(this,arguments);
  const last=(state.deliveries||[]).filter(d=>d.placeId===p.id&&(+d.flyers||0)>0&&!d.noPointRepeat).sort((a,b)=>b.at-a.at)[0];
  h=h.replace(/ · r:[A-Za-z0-9]+/,'');
  if(last)h=h.replace(/(Last delivery by [^<]*)<\/p>/,'$1 · '+ago(last.at)+'</p>');
  return h};
window.mqStickerPopup=function(x){
  const addr=x.exactAddress||[x.addressParts&&x.addressParts.street,x.addressParts&&x.addressParts.city,x.addressParts&&x.addressParts.country].filter(Boolean).join(', ');
  const ctry=x.addressParts&&x.addressParts.country,when=x.at?ago(x.at):'';
  const img=x.thumbnail?`<img class="sticker-thumb" src="${E(x.thumbnail)}" alt="Sticker photo" loading="lazy">`:(x.photo&&x.remoteW?`<img class="sticker-thumb" data-wid="${E(String(x.id))}" alt="Sticker photo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">`:'');
  return `<div class="sticker-popup"><b>🔭 Sticker spotted</b><br>📍 ${E(addr)}${ctry&&addr.indexOf(ctry)<0?', '+E(ctry):''}<br><small>Reported by <b>${E(x.user||'a Lunito')}</b>${when?' · '+when:''}${!x.remoteW&&x.points?' · '+E(x.points)+' Mondinos':''}</small>${img}</div>`};
const thumbs={};
new MutationObserver(()=>{document.querySelectorAll('img[data-wid]:not([data-wl])').forEach(im=>{
  im.dataset.wl='1';const id=im.dataset.wid;
  const put=t=>{if(t)im.src=t;else im.remove()};
  if(id in thumbs){put(thumbs[id]);return}
  mqPost({action:'worldThumb',id}).then(r=>{thumbs[id]=r&&r.ok?r.thumb:'';put(thumbs[id])}).catch(()=>im.remove())})
}).observe(document.body,{childList:true,subtree:true});

/* ---------- triggers ---------- */
const _save=save;let t=null;
save=function(){const r=_save.apply(this,arguments);clearTimeout(t);t=setTimeout(push,2500);return r};
setTimeout(()=>{push();pull()},3500);
setInterval(()=>{if(!document.hidden){push();pull()}},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){push();pull()}});
window.mqWorld={push,pull,redraw};
})();
