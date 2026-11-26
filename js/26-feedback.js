/* MondQuest · every reported action shows up in the game at once: map flies to it, pin pulses, message says what happened. */
(function(){'use strict';
function whenMap(cb,n){n=n||0;
  try{if((currentView==='menu'||currentView==='map')&&leafletInstance&&leafletInstance.getContainer&&document.body.contains(leafletInstance.getContainer())&&leafletInstance._loaded){cb();return}}catch(e){}
  if(n<50)setTimeout(()=>whenMap(cb,n+1),160)}
function pulse(lat,lng){try{const ic=L.divIcon({className:'mq26-pulse',html:'<i></i><i></i><b></b>',iconSize:[64,64],iconAnchor:[32,32]});
  const m=L.marker([lat,lng],{icon:ic,interactive:false,zIndexOffset:900}).addTo(leafletInstance);setTimeout(()=>{try{leafletInstance.removeLayer(m)}catch(e){}},7000)}catch(e){}}
/* kind: 'place' | 'sticker' | 'drop' */
window.mqCelebrate=function(o){
  try{if(o.kind==='sticker')showSpottedMarkers=true;else showPlaceMarkers=true}catch(e){}
  if(currentView!=='menu'&&currentView!=='map')go('map');
  whenMap(()=>{try{refreshMarkers()}catch(e){}
    const lat=+o.lat,lng=+o.lng;
    if(Number.isFinite(lat)&&Number.isFinite(lng)){try{leafletInstance.setView([lat,lng],Math.max(leafletInstance.getZoom()||0,16),{animate:true})}catch(e){}
      pulse(lat,lng);
      setTimeout(()=>{try{const m=(leafletMarkers||[]).find(x=>x.getLatLng&&Math.abs(x.getLatLng().lat-lat)<1e-6&&Math.abs(x.getLatLng().lng-lng)<1e-6&&x.getPopup&&x.getPopup());if(m&&o.popup)m.openPopup()}catch(e){}},700)}});
  if(o.msg)setTimeout(()=>{try{toast(o.msg)}catch(e){}},350);
  try{if(window.mqSheet&&mqSheet.sync)setTimeout(()=>mqSheet.sync(),600)}catch(e){}};
/* New place: needs a pin; try the address first, never save a place that cannot be shown on the map */
const _snp=saveNewPlace;
saveNewPlace=function(form){
  const edit=!!form.dataset.edit;
  const hasPin=()=>mapDraft&&Number.isFinite(+mapDraft.lat)&&Number.isFinite(+mapDraft.lng)&&mapDraft.lat!==null;
  const run=()=>{const n0=state.places.length;_snp(form);
    if(!edit&&state.places.length>n0){const p=state.places[state.places.length-1];
      mqCelebrate({kind:'place',lat:p.lat,lng:p.lng,popup:true,msg:`✨ ${p.name} is now on the map!`})}};
  if(edit||hasPin()){run();return}
  const f=form.elements;if(!(f.street&&f.street.value.trim()&&f.city&&f.city.value.trim())){_snp(form);return}
  toast('Finding that address on the map…');
  geocodeQuery(f.country.value,f.street.value,f.city.value).then(pos=>{mapDraft=pos;try{if(leafletInstance){leafletInstance.setView([pos.lat,pos.lng],15);drawDraftMarker(pos)}}catch(e){}run()})
   .catch(()=>toast('We could not find that address. Tap the map to drop the pin, then save again.'))};
/* Sticker found */
const _ss=submitSpotted;
submitSpotted=async function(f){const n0=(state.spotted||[]).length;await _ss(f);
  if((state.spotted||[]).length>n0){const s=state.spotted[state.spotted.length-1];
    mqCelebrate({kind:'sticker',lat:s.lat,lng:s.lng,popup:true,msg:'🔭 Sticker found — it is on the map now!'})}};
/* Flyers / posters / stickers dropped */
const _pl=processLog;
processLog=function(form){const n0=(state.deliveries||[]).length;_pl(form);
  if((state.deliveries||[]).length>n0){const d=state.deliveries[state.deliveries.length-1],p=state.places.find(x=>x.id===d.placeId);
    const what=d.kind==='poster'?'Poster up':d.kind==='stickers'?'Stickers placed':d.kind==='restock'?'Restocked':'Flyers dropped';
    if(p)mqCelebrate({kind:'drop',lat:p.lat,lng:p.lng,popup:false,msg:`✅ ${what} · ${p.name}${d.points?' · +'+d.points+' Mondinos':''}`})}};
})();
