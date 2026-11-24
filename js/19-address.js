/* MondQuest · build 18: easier addresses. "Use my location", suggestions while typing, and tap-on-map all fill the form.
   Search and reverse lookup use Photon (OpenStreetMap data); Nominatim is the backup. Nothing is sent until the player acts. */
(function(){'use strict';
const PHOTON='https://photon.komoot.io',NOMI='https://nominatim.openstreetmap.org';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const center=()=>{try{const c=leafletInstance&&leafletInstance.getCenter();return c?{lat:c.lat,lng:c.lng}:{lat:52.503,lng:13.4557}}catch(e){return{lat:52.503,lng:13.4557}}};
function fromPhoton(f){const p=f.properties||{},g=f.geometry&&f.geometry.coordinates||[];
  const street=p.street||'',line=street?street+(p.housenumber?' '+p.housenumber:''):(p.name||'');
  const venue=p.name&&p.name!==p.street?p.name:'';
  const city=p.city||p.town||p.village||p.locality||p.district||p.county||'';
  return{lat:+g[1],lng:+g[0],venue,line:(venue&&!street)?'':line,city,country:p.country||'',postcode:p.postcode||''}}
function fromNomi(r){const a=r.address||{},line=a.road?a.road+(a.house_number?' '+a.house_number:''):'',venue=r.name&&r.name!==a.road?r.name:'';
  return{lat:+r.lat,lng:+r.lon,venue,line,city:a.city||a.town||a.village||a.suburb||a.municipality||'',country:a.country||'',postcode:a.postcode||''}}
const label=a=>[a.venue,a.line,a.city,a.country].filter((x,i,arr)=>x&&arr.indexOf(x)===i).join(', ');
async function jget(u,sig){const r=await fetch(u,{signal:sig,headers:{'Accept':'application/json'}});if(!r.ok)throw Error('lookup '+r.status);return r.json()}
async function search(q,sig){
  const c=center();
  try{const j=await jget(`${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&lat=${c.lat}&lon=${c.lng}`,sig);const out=(j.features||[]).map(fromPhoton).filter(a=>isFinite(a.lat)&&isFinite(a.lng));if(out.length)return out}catch(e){if(e.name==='AbortError')throw e}
  const j=await jget(`${NOMI}/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=6&accept-language=en`,sig);return j.map(fromNomi)}
async function reverse(lat,lng){
  try{const j=await jget(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`);const f=(j.features||[])[0];if(f){const a=fromPhoton(f);a.lat=lat;a.lng=lng;if(a.line||a.city||a.country)return a}}catch(e){}
  const j=await jget(`${NOMI}/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18&addressdetails=1&accept-language=en`);const a=fromNomi(j);a.lat=lat;a.lng=lng;return a}

function setVal(f,name,v,force){const el=f.elements[name];if(!el)return;
  if(force||!el.value||el.dataset.mqAuto==='1'){el.value=v||'';el.dataset.mqAuto='1'}}
function apply(f,a,opts){
  const spotted=f.id==='spotted-form';
  setVal(f,'street',a.line,true);setVal(f,'city',a.city,true);setVal(f,'country',a.country,true);
  if(spotted)setVal(f,'exactAddress',[a.venue,a.line,a.city].filter(Boolean).join(', '),true);
  else if(a.venue)setVal(f,'name',a.venue,false);
  const pos={lat:a.lat,lng:a.lng};
  try{mapDraft=pos}catch(e){}
  if(spotted&&f.elements.lat){f.elements.lat.value=a.lat;f.elements.lng.value=a.lng;const n=document.getElementById('coordinate-note');if(n)n.textContent='Location set. Tap the map to fine-tune.';try{updateSpottedPreview()}catch(e){}}
  try{if(leafletInstance){if(!(opts&&opts.keepView))leafletInstance.setView([a.lat,a.lng],17);drawDraftMarker(pos)}}catch(e){}
}
function ui(f){
  const box=document.createElement('div');box.className='mq-addr';
  box.innerHTML=`<button type="button" class="button primary mq-addr-here">📍 Use my location</button>
    <label class="field">Or search an address or place<input type="search" class="mq-addr-q" autocomplete="off" maxlength="120" placeholder="Start typing a street or place…"></label>
    <ul class="mq-addr-list" role="listbox" hidden></ul><p class="small mq-addr-note" role="status" aria-live="polite"></p>`;
  const q=box.querySelector('.mq-addr-q'),list=box.querySelector('.mq-addr-list'),note=box.querySelector('.mq-addr-note'),here=box.querySelector('.mq-addr-here');
  let t=0,ctl=null,res=[];
  const say=m=>{note.textContent=m||''};
  const show=a=>{res=a;list.innerHTML=a.map((x,i)=>`<li role="option"><button type="button" data-i="${i}"><b>${E(x.venue||x.line||x.city)}</b><span>${E([x.venue&&x.line?x.line:'',x.city,x.country].filter(Boolean).join(', '))}</span></button></li>`).join('');list.hidden=!a.length};
  q.addEventListener('input',()=>{clearTimeout(t);const v=q.value.trim();if(ctl)ctl.abort();if(v.length<3){show([]);say('');return}
    t=setTimeout(async()=>{ctl=new AbortController();say('Searching…');try{const r=await search(v,ctl.signal);show(r);say(r.length?'Tap the right one:':'Nothing found. Try fewer words, or tap the map.')}catch(e){if(e.name!=='AbortError'){show([]);say('Search is not available right now. You can type the address below or tap the map.')}}},350)});
  list.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;const a=res[+b.dataset.i];if(!a)return;apply(f,a);q.value=label(a);show([]);say('Got it! Check the details below.')});
  here.addEventListener('click',()=>{
    if(!navigator.geolocation){say('Your browser cannot share its location. Search an address instead.');return}
    here.disabled=true;say('Finding you…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      const lat=Math.round(pos.coords.latitude*1e5)/1e5,lng=Math.round(pos.coords.longitude*1e5)/1e5;
      try{const a=await reverse(lat,lng);apply(f,a);q.value=label(a);say('Found you! Check the details below.')}
      catch(e){apply(f,{lat,lng,line:'',city:'',country:'',venue:''});say('Got your spot on the map. Please type the street and country below.')}
      here.disabled=false},
      err=>{here.disabled=false;say(err&&err.code===1?'Location is switched off for this site. Search an address instead, or allow location in your browser.':'Could not find you. Search an address instead, or tap the map.')},
      {enableHighAccuracy:true,timeout:12000,maximumAge:30000})});
  return box}
function mount(f){
  if(!f||f.querySelector('.mq-addr'))return;
  const box=ui(f);f.insertBefore(box,f.firstElementChild);
  if(f.id==='spotted-form'){['street','city'].forEach(n=>{const l=f.elements[n]&&f.elements[n].closest('label');if(l)l.hidden=true});
    const b=f.querySelector('[data-action="geocode-spotted"]');if(b)b.hidden=true;
    const first=f.querySelector('input[name=exactAddress]');if(first){const l=first.closest('label');if(l&&l.firstChild)l.firstChild.textContent='Address (filled in for you)'}}
  // tapping the map also fills the address
  let tries=0;const hook=()=>{if(window.leafletInstance&&leafletInstance.on&&document.body.contains(f)){
      let rt=0;leafletInstance.on('click',e=>{clearTimeout(rt);rt=setTimeout(async()=>{try{const a=await reverse(+e.latlng.lat.toFixed(5),+e.latlng.lng.toFixed(5));apply(f,a,{keepView:true})}catch(x){}},500)})}
    else if(tries++<20)setTimeout(hook,250)};
  setTimeout(hook,400);
  // any manual typing means the player is in charge of that field
  f.addEventListener('input',e=>{if(e.target&&e.target.dataset&&!e.target.classList.contains('mq-addr-q'))e.target.dataset.mqAuto='0'},true)}
const _sp=spottedScreen;spottedScreen=function(){const r=_sp.apply(this,arguments);try{mount(document.getElementById('spotted-form'))}catch(e){}return r};
const _pf=renderPlaceForm;renderPlaceForm=function(){const r=_pf.apply(this,arguments);try{const f=document.getElementById('place-form');if(f&&!f.dataset.edit)mount(f)}catch(e){}return r};
window.mqAddr={search,reverse,mount};
})();
