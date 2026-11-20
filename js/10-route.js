/* MondQuest · nearby sorting + Moon route (uses the player's location only when Location is on) */
(function(){'use strict';
const ROUTE_BONUS=15,ROUTE_MAX_KM=15,ROUTE_TTL=24*36e5;
function mqPos(){try{if(!state||!state.user)return null;const m=livePresence().find(x=>!x.remote&&String(x.code)===String(state.user.code));
  if(m&&Number.isFinite(+m.lat)&&Number.isFinite(+m.lng))return{lat:+m.lat,lng:+m.lng}}catch(e){}return null}
window.mqPos=mqPos;
const fmt=km=>km<1?Math.max(10,Math.round(km*1000/10)*10)+' m':(km<10?km.toFixed(1):Math.round(km))+' km';
const ok=p=>p&&!p.retired&&!p.flagged&&hasMapCoords(p);
function ranked(pos){return activePlaces().filter(ok).map(p=>({p,km:haversineKm(pos,{lat:+p.lat,lng:+p.lng})})).sort((a,b)=>a.km-b.km)}
let dist={};
/* ---- distance text on each place card ---- */
const _card=placeCard;
placeCard=function(p){const h=_card(p),d=dist[p.id];return d==null?h:h.replace('<span class="small"></span>','<span class="small mq10-dist">📍 '+fmt(d)+' away</span>')};
/* ---- Places & routes: nearest first, one "New place" button ---- */
placesScreen=function(){
  const pos=mqPos();dist={};let list=activePlaces();
  if(pos){const r=ranked(pos);r.forEach(x=>dist[x.p.id]=x.km);const rest=list.filter(p=>!ok(p));list=r.map(x=>x.p).concat(rest)}
  const hint=pos?'Sorted by distance from you · closest first.':'Turn on your Location (the Location button on the map) and the closest places will come first.';
  const tag=p=>`<button class="tag-button" data-action="open-place" data-id="${esc(p.id)}">${typeMeta(p.type)[1]} ${esc(p.name)}</button>`;
  shell(`<section class="card"><div class="eyebrow">COMMUNITY PLACEBOOK</div><div class="row"><h1>Places & routes</h1><button class="button small" data-action="new-place">+ New place</button></div><div class="actions"><button class="button quiet" data-view="map">Open map · World / Berlin</button></div><h2>${pos?'Nearest stops':'Nearby stops · Moonbeam loop'}</h2><p class="small">${hint}</p>${list.map(placeCard).join('')}<h2>By theme · Cafes & convenience stores</h2><p class="small">The Coffee Comet · a theme-based browse list, not a timed route.</p><div>${list.filter(p=>['cafe','späti'].includes(p.type)).slice(0,4).map(tag).join('')}</div><h2>By theme · Kids & culture</h2><p class="small">The Little Big Top · follow any order that suits you.</p><div>${list.filter(p=>['kindergarten','social','cultural','studio','rehearsal'].includes(p.type)).slice(0,4).map(tag).join('')||'<p class="small">New discoveries will appear here.</p>'}</div></section>`)};
/* ---- Moon route ---- */
function myDone(r){const me=String(state.user&&state.user.code||'');return r.ids.filter(id=>state.deliveries.some(d=>d.placeId===id&&String(d.playerCode)===me&&d.at>=r.startedAt))}
function check(){const r=state&&state.route;if(!r||r.done)return;
  if(Date.now()-r.startedAt>ROUTE_TTL){state.route=null;save();return}
  if(myDone(r).length>=r.ids.length){r.done=true;r.doneAt=Date.now();history('combo','Moon route · '+r.ids.length+' stops',ROUTE_BONUS);award(ROUTE_BONUS,{noBonuses:true,consumeAdventure:false});save();toast('Moon route complete! +'+ROUTE_BONUS+' 🌙 combo bonus ✨')}}
const _hist=history;history=function(type){const r=_hist.apply(this,arguments);if(type==='distribution')setTimeout(check,0);return r};
function routeCard(){
  const pos=mqPos(),r=state.route;
  if(r&&!r.done&&Date.now()-r.startedAt>ROUTE_TTL){state.route=null;save()}
  const R=state.route;
  const head='<div class="mq10-route"><strong>🌙 Moon route</strong>';
  if(R&&!R.done){const done=myDone(R);
    return head+`<small>Visit all ${R.ids.length} stops for a +${ROUTE_BONUS} 🌙 combo · ${done.length}/${R.ids.length}</small>`+R.ids.map(id=>{const p=state.places.find(x=>x.id===id);if(!p)return'';const d=done.includes(id),km=pos&&hasMapCoords(p)?haversineKm(pos,{lat:+p.lat,lng:+p.lng}):null;
      return `<div class="mq10-stop${d?' done':''}"><span>${d?'✓':'○'} ${esc(p.name)}${km!=null?' · '+fmt(km):''}</span>${d?'':`<button class="button small" data-action="open-place" data-id="${esc(id)}" data-kind="drop">Go</button>`}</div>`}).join('')+'<button class="button quiet small" data-mq10="reroll">New route</button></div>'}
  if(R&&R.done)return head+`<small>Route complete · +${ROUTE_BONUS} 🌙 collected. Nice walk!</small><button class="button small" data-mq10="start">Start another route</button></div>`;
  if(!pos)return head+'<small>Turn on your Location (the Location button on the map) and get a route with the 3 places closest to you. Visit all three for a combo bonus!</small></div>';
  const near=ranked(pos).filter(x=>x.km<=ROUTE_MAX_KM).slice(0,3);
  if(near.length<3)return head+'<small>Not enough places near you yet. Found a new spot? Add it with “+ New place”!</small></div>';
  return head+`<small>Your 3 closest places. Visit them all for a +${ROUTE_BONUS} 🌙 combo!</small>`+near.map(x=>`<div class="mq10-stop"><span>○ ${esc(x.p.name)} · ${fmt(x.km)}</span></div>`).join('')+'<button class="button small" data-mq10="start">Start route</button></div>'}
const _missions=missions;
missions=function(){_missions.apply(this,arguments);const l=document.querySelector('.mission-list');if(l&&!document.querySelector('.mq10-route'))l.insertAdjacentHTML('beforebegin',routeCard())};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-mq10]');if(!b)return;
  const pos=mqPos();if(!pos){toast('Turn on Location first.');return}
  const near=ranked(pos).filter(x=>x.km<=ROUTE_MAX_KM).slice(0,3);
  if(near.length<3){toast('Not enough places near you yet.');go('missions');return}
  state.route={ids:near.map(x=>x.p.id),startedAt:Date.now(),done:false};save();go('missions');toast('Route started! 3 stops, closest first. ✨')});
setInterval(()=>{try{if(state&&state.route)check()}catch(e){}},5000);
})();
