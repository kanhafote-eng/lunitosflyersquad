'use strict';
/* MondQuest · Google Sheet connection. Does nothing when config.js has no sheetUrl (local demo mode). */
(function(){
const C=window.MQ_CONFIG||{};if(!C.sheetUrl)return;
const num=v=>{v=Number(v);return isFinite(v)?v:0},bool=v=>v===true||String(v).toUpperCase()==='TRUE';
const S=()=>{state.__sync=state.__sync||{lastAt:0,reqs:[],places:[],applied:[],ack:[]};state.__sync.pk=state.__sync.pk||[];return state.__sync};
// The public game never has local admin powers: those live in admin.html behind the server PIN.
try{Object.defineProperty(state,'adminMode',{get:()=>false,set:()=>{},enumerable:false,configurable:true})}catch(e){}
new MutationObserver(()=>{const t=document.getElementById('admin-toggle');if(t){const l=t.closest('label');(l||t).remove()}}).observe(document.documentElement,{childList:true,subtree:true});

function setPath(root,key,val){const p=key.split('.');let o=root;for(let i=0;i<p.length-1;i++){if(o[p[i]]==null||typeof o[p[i]]!=='object')return;o=o[p[i]]}if(p.length>1&&!(p[p.length-1] in o))return;o[p[p.length-1]]=val}
let applied=false;
function applyRemote(r){
  if(!r||!r.ok)return;
  try{if(window.mqSetPickupPoints)mqSetPickupPoints(r.pickuppoints)}catch(e){}
  try{window.mqChatEnabled=r.chatEnabled===true;if(Array.isArray(r.banners)){window.mqBanners=r.banners.map(x=>({id:String(x.id),emoji:String(x.emoji||'📣'),text:String(x.text||''),endsAt:Number(x.endsAt)||0,startsAt:Number(x.startsAt)||0}));if(window.mqBannersToNews)mqBannersToNews()}setTimeout(()=>{try{if(window.mqDrawBanner)mqDrawBanner();if(window.mqPaintChat)mqPaintChat()}catch(e){}},50)}catch(e){}
  (r.config||[]).forEach(x=>{const k=String(x.Key||x.key||'');const v=num(x.Value!==undefined?x.Value:x.value);if(k)setPath(CONFIG,k,v)});
  if(r.combos&&r.combos.length)CONFIG.combos=r.combos.map(c=>({id:String(c.id),stat:String(c.stat),at:num(c.at),bonus:num(c.bonus),label:String(c.label)}));
  if(r.ranks&&r.ranks.length){MQ_RANKS.length=0;r.ranks.sort((a,b)=>num(a.rank)-num(b.rank)).forEach(x=>MQ_RANKS.push([String(x.name),num(x.earned)]))}
  // prizes: keep local artwork/description by id, take name, price, stock and visibility from the sheet
  if(r.rewards){const old=Object.fromEntries(state.rewards.map(x=>[x.id,x]));const ids=new Set();
    const next=r.rewards.map((x,i)=>{const o=old[x.id]||{};ids.add(x.id);return{...o,id:String(x.id),name:String(x.name),category:String(x.category),cost:num(x.cost),stock:num(x.stock),minAge:num(x.minAge),description:o.description||(x.category+' · prize Zirkus Mond'),svg:o.svg||DEFAULT_REWARD_SVGS[i%DEFAULT_REWARD_SVGS.length]}});
    state.rewards=next;CONFIG.rewards=next.map(x=>({id:x.id,name:x.name,category:x.category,cost:x.cost,minAge:x.minAge}))}
  if(r.cosmetics){const m=Object.fromEntries(r.cosmetics.map(x=>[x.id,x]));
    CONFIG.cosmetics.forEach(c=>{const x=m[c.id];c.hidden=!x;if(x){c.cost=num(x.cost);c.rank=num(x.rank)||c.rank}});
    CONFIG.cosmetics=CONFIG.cosmetics.filter(c=>!c.hidden||num(c.cost)===0)}
  if(r.gadgets){const m=Object.fromEntries(r.gadgets.map(x=>[x.id,x]));
    for(let i=MQ_GADGETS.length-1;i>=0;i--){const g=MQ_GADGETS[i],x=m[g.id];if(!x){MQ_GADGETS.splice(i,1);continue}
      g.cost=num(x.cost);g.rank=num(x.rank)||g.rank;g.min={};['comet','meteor','nebula','void','rings'].forEach(k=>{if(num(x[k])>0)g.min[k]=num(x[k])})}}
  if(r.places){const sy=S();const remote=new Map(r.places.map(p=>[String(p.id),p]));
    r.places.forEach(p=>{const id=String(p.id);let l=state.places.find(x=>x.id===id);
      const f={name:String(p.name),type:String(p.type),posterSize:String(p.posterSize||'A4'),address:String(p.address||''),lat:num(p.lat),lng:num(p.lng),spot:String(p.spot||''),notes:String(p.notes||''),retired:false,remote:true,verified:p.verified!==false,serverAt:Date.parse(p.updatedAt)||0};
      if(l){let pend=false;try{pend=!!JSON.parse(localStorage.getItem('mq-place-edits')||'{}')[id]}catch(e){}if(pend){l.remote=true;l.verified=f.verified;l.serverAt=f.serverAt}else Object.assign(l,f)}else state.places.push({id,discoverer:String(p.addedBy||'Zirkus Mond'),createdAt:Date.parse(p.updatedAt)||Date.now(),closed:false,ratings:{},status:'needs',lastUpdated:Date.now(),...f})});
    state.places.forEach(p=>{if((p.remote||/^seed-/.test(p.id))&&!remote.has(p.id)){p.retired=true}})}
  if(r.news){state.newsPages=[...r.news.map(n=>({id:'sheet-'+n.id,title:String(n.title),body:String(n.body),type:String(n.type||'new flyers'),image:n.image||svgData('#f6bd4e'),sheet:true})),...state.newsPages.filter(n=>!n.demo&&!n.sheet)];state.newsSeeded=true}
  applied=true;
}
const CACHE='mq-remote';
try{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c)applyRemote(c)}catch(e){}
async function post(o){const r=await fetch(C.sheetUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:C.writeKey,...o})});const j=await r.json();if(j&&j.banned&&window.mqBanned)window.mqBanned();return j}
window.mqPost=post;window.mqRefresh=()=>{try{refreshView()}catch(e){}};
async function loadConfig(){try{const r=await (await fetch(C.sheetUrl+'?action=config')).json();if(r.ok){try{localStorage.setItem(CACHE,JSON.stringify(r))}catch(e){}applyRemote(r);save0();return true}}catch(e){}return false}
function save0(){try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(state))}catch(e){}}
let rvT=0,lastTouch=0;
['touchstart','touchmove','pointerdown','wheel','scroll'].forEach(ev=>document.addEventListener(ev,()=>{lastTouch=Date.now()},{passive:true,capture:true}));
function refreshView(){if(Date.now()-lastTouch<1500){clearTimeout(rvT);rvT=setTimeout(refreshView,1700);return}try{if(state.user&&!state.user.age&&window.mqAgeScreen){if(document.querySelector('.age-btns[data-legacy]'))return}if(currentView==='chat'||currentView==='wardrobe')return;if(typeof currentView==='string'&&!document.querySelector('input:focus,textarea:focus,select:focus'))go(currentView)}catch(e){}}

function snapshot(){const u=state.user;if(!u)return null;const inv=state.inventory||{};
  return{code:u.code,name:u.name,wallet:state.wallet,earned:state.earned,flyers:inv.flyers||0,posters:inv.posters||0,stickers:inv.stickers||0,age:u.age||'',extras:mqExtras()}}
function mqExtras(){try{const u=state.user,look={};Object.keys(CONFIG.look.defaults||{}).forEach(k=>{look[k]=u[k]});const A=state.accessories||{},G=state.gadgets||{};return{look,acc:{o:A.owned||[],e:A.equipped||[]},gad:{o:G.owned||[],e:G.equipped||[]},min:state.minerals||{},ch:state.chests||0,at:u.createdAt||0,cd:state.combosDone||[]}}catch(e){return null}}
window.mqRecover=async code=>{const r=await post({action:'recoverPlayer',code});if(!r||!r.ok)throw new Error((r&&r.error)||'Could not reach the circus. Check your connection and try again.');return r};
let busy=false;
async function sync(){
  if(busy||!state.user||!navigator.onLine)return;busy=true;const sy=S();
  try{
    const entries=(state.history||[]).filter(h=>h.at>sy.lastAt&&!/^(grant)/.test(h.type)).slice(0,200);
    const reds=(state.redemptionRequests||[]).filter(r=>r.type==='reward'&&r.playerCode===state.user.code&&isPending(r)&&!sy.reqs.includes(r.id)).map(r=>({id:r.id,item:r.name,cost:r.cost,category:r.category}));
    const pls=(state.places||[]).filter(p=>!p.remote&&!/^seed-/.test(p.id)&&!p.retired&&!sy.places.includes(p.id)&&(p.discoverer===state.user.name||p.discoverer===state.user.code||!p.discoverer||p.mine)).slice(0,5);
    const pks=(state.pickupRequests||[]).filter(r=>r.awaiting&&r.status==='pending'&&r.playerCode===String(state.user.code)&&!sy.pk.includes(r.id)).slice(0,5);
    const res=await post({action:'sync',player:snapshot(),snap:window.mqEcon&&mqEcon.snap(),pickups:pks.map(r=>({id:r.id,flyers:r.quantities.flyers,posters:r.quantities.posters,stickers:r.quantities.stickers})),entries:entries.map(h=>({id:h.id,type:h.type,label:h.label,amount:h.amount,at:new Date(h.at).toISOString()})),redemptions:reds,places:pls.map(p=>({id:p.id,name:p.name,type:p.type,posterSize:p.posterSize,address:p.address,lat:p.lat,lng:p.lng,spot:p.spot,notes:p.notes}))});
    if(res&&res.ok){if(entries.length)sy.lastAt=Math.max(...entries.map(h=>h.at));reds.forEach(r=>sy.reqs.push(r.id));pks.forEach(r=>sy.pk.push(r.id));pls.forEach(p=>sy.places.push(p.id));
      if(res.dups){let any=false;Object.keys(res.dups).forEach(id=>{const l=state.places.find(x=>x.id===id);if(l&&!l.retired){l.retired=true;l.dupOf=res.dups[id];any=true}});if(any){try{toast('Someone already added that spot, so we merged it. ✨');refreshMarkers()}catch(e){}}}
      if(res.state&&window.mqEcon)mqEcon.adopt(res.state);
      save0()}
  }catch(e){}finally{busy=false}
}
async function pull(){
  if(!state.user||!navigator.onLine)return;const sy=S();let changed=false;
  try{
    const res=await post({action:'pull',code:state.user.code,ack:sy.ack});
    if(!res||!res.ok)return;sy.ack=[];
    if((res.age==='u16'||res.age==='16+')&&state.user.age!==res.age){state.user.age=res.age;changed=true;if(res.age==='u16'){try{stopLocationShare()}catch(e){}}}
    (res.grants||[]).forEach(g=>{
      if(!sy.applied.includes(g.id)){
        const q={flyers:num(g.flyers),posters:num(g.posters),stickers:num(g.stickers)};
        if(q.flyers||q.posters||q.stickers){
          history('grant',(g.type==='pickup'?'Pickup approved · ':'Staff restock · ')+[q.flyers&&q.flyers+' flyers',q.posters&&q.posters+' posters',q.stickers&&q.stickers+' stickers'].filter(Boolean).join(', '),0);toast(g.type==='pickup'?'Pickup approved! Material added to your bag.':'Staff added material to your bag.')}
        const p=num(g.points);if(p){history('grant',(g.note||'Admin adjustment'),p);if(g.type!=='pickup')toast((p>0?'+':'')+p+' Mondinos from the circus team.')}
        sy.applied.push(g.id);if(sy.applied.length>100)sy.applied.shift();changed=true}
      sy.ack.push(g.id)});
    (res.pickups||[]).forEach(pk=>{const r=(state.pickupRequests||[]).find(x=>x.id===pk.id&&x.awaiting&&x.status==='pending');if(!r)return;
      if(pk.status==='accepted'){r.status='verified';r.awaiting=false;r.resolvedAt=Date.now();changed=true}
      else if(pk.status==='rejected'){r.status='rejected';r.awaiting=false;r.resolvedAt=Date.now();toast('The staff declined a pickup request.');changed=true}});
    (res.redemptions||[]).forEach(rd=>{const r=(state.redemptionRequests||[]).find(x=>x.id===rd.id);if(!r||!isPending(r))return;
      if(rd.status==='delivered'){r.status='delivered';r.resolvedAt=Date.now();history('redemption-approved','Delivery verified · '+r.name,0,{requestId:r.id});toast('Prize delivered: '+r.name);changed=true}
      else if(rd.status==='rejected'){const it=state.rewards.find(x=>x.id===r.itemId);if(it)it.stock++;r.status='rejected';r.resolvedAt=Date.now();history('redemption-refund','Rejected prize · '+r.name,-r.cost,{requestId:r.id});toast('Prize request rejected. Mondinos refunded.');changed=true}});
    if(res.state&&window.mqEcon&&mqEcon.adopt(res.state))changed=true;
    if(changed){save0();refreshView()}
  }catch(e){}
}

/* ---------- first pickup free, later pickups need staff approval ---------- */
if(state.firstPickupDone===undefined)state.firstPickupDone=(state.pickupRequests||[]).length>0||(state.history||[]).some(h=>h.type==='pickup');
window.mqPickupGate=function(q){
  if(!state.firstPickupDone){state.firstPickupDone=true;return false}
  state.pickupRequests.push({id:uid(),playerName:state.user?.name||'Courier',playerCode:String(state.user?.code||''),quantities:q,points:0,status:'pending',awaiting:true,at:Date.now()});
  save();toast('Request sent. Show your QR code to the staff to get it approved.');pickup();return true};
const _pickup=pickup;
pickup=function(){_pickup();
  const f=document.getElementById('pickup-form');if(!f)return;
  const btn=f.querySelector('button.primary');
  if(btn&&state.firstPickupDone)btn.textContent='Request pickup · staff approves it';
  const wait=(state.pickupRequests||[]).filter(r=>r.awaiting&&r.status==='pending');
  const note=document.createElement('div');note.className='batch-notice';note.style.margin='10px 0';
  note.innerHTML=state.firstPickupDone?'<b>Pickups are approved by the staff.</b> Show your QR code at the tent: the material and points reach your bag as soon as they accept.'+(wait.length?'<br>Waiting for approval: '+wait.map(r=>['flyers','posters','stickers'].filter(k=>r.quantities[k]).map(k=>r.quantities[k]+' '+k).join(', ')).join(' · '):''):'<b>Your first pickup is free.</b> After that, the staff approves each pickup.';
  f.parentNode.insertBefore(note,f);
  if(window.mqQrCard)f.parentNode.appendChild(window.mqQrCard())};

/* ---------- players online + shared locations (server side) ---------- */
let rOnline=[],rSharing=[];const PST={at:0,err:''};
window.mqPresence={online:()=>rOnline,sharing:()=>rSharing,status:()=>PST};
async function presence(extra){
  if(!state.user||!navigator.onLine)return;
  if(mqAgeU16())extra=undefined;
  try{const look={...playerSnapshot()};delete look.code;delete look.name;try{look.equipped=((state.accessories&&state.accessories.equipped)||[]).slice(0,12);look.gadgetsOn=((state.gadgets&&state.gadgets.equipped)||[]).slice(0,8)}catch(e){}
    const res=await post({action:'presenceSync',player:{code:state.user.code,name:state.user.name},look,...(extra||{})});
    if(res&&res.ok){PST.at=Date.now();PST.err='';rOnline=res.online||[];rSharing=res.sharing||[];try{refreshPresenceList();if(leafletInstance)refreshMarkers();if(currentView==='players'&&window.playersScreen&&!document.querySelector('input:focus'))playersScreen()}catch(e){}}
    else PST.err=(res&&res.error)||'The server did not answer.';
  }catch(e){PST.err=e&&e.message?e.message:'No connection.'}
}
const _live=livePresence;
livePresence=function(){if(mqAgeU16())return [];const m=new Map();
  rSharing.filter(x=>!x.me).forEach(x=>m.set('r:'+x.pid,{code:'',name:x.name,avatar:x.look,lat:x.lat,lng:x.lng,updatedAt:x.updatedAt,expires:x.updatedAt+30*60000,remote:true}));
  _live().forEach(x=>m.set(String(x.code),x));return [...m.values()]};
refreshPresenceList=function(){const el=document.getElementById('online-list');if(!el)return;
  const on=rOnline.filter(x=>!x.me);
  el.innerHTML=on.length?'<b>Online now ('+on.length+')</b><br>'+on.map(x=>'<span>'+(x.sharing?'📍':'●')+' '+esc(x.name)+(x.sharing?' · sharing location':'')+'</span>').join(' '):(rOnline.length?'No other players online right now.':'Checking who is online…')};
shareLocation=function(){
  if(mqAgeU16())return;
  if(!state.user?.code){toast('Create a profile first.');return}
  if(!navigator.geolocation){toast('Geolocation is unavailable in this browser.');return}
  if(!window.isSecureContext&&location.hostname!=='localhost'){toast('Location requires HTTPS or localhost.');return}
  navigator.geolocation.getCurrentPosition(pos=>{
    const code=String(state.user.code),entry={code,name:state.user.name,avatar:playerSnapshot(),lat:pos.coords.latitude,lng:pos.coords.longitude,updatedAt:Date.now(),expires:Date.now()+30*60*1000};
    try{localStorage.setItem(presenceKey(code),JSON.stringify(entry))}catch(e){}
    presence({lat:pos.coords.latitude,lng:pos.coords.longitude});refreshPresenceList();refreshMarkers();
    toast('Location shared with other players for 30 minutes (shown only roughly, within a couple of hundred metres).')},
    ()=>toast('Could not get your location. Nothing was shared.'),{enableHighAccuracy:false,timeout:10000,maximumAge:0})};
const _stop=stopLocationShare;
stopLocationShare=function(){_stop();presence({stop:true})};
setInterval(()=>{if(document.hidden||!state.user)return;
  const mine=livePresence().find(x=>!x.remote&&String(x.code)===String(state.user.code));
  if(mine&&navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>{try{const e={...mine,lat:p.coords.latitude,lng:p.coords.longitude,updatedAt:Date.now()};localStorage.setItem(presenceKey(mine.code),JSON.stringify(e))}catch(x){}presence({lat:p.coords.latitude,lng:p.coords.longitude})},()=>presence(),{timeout:8000,maximumAge:60000});
  else presence()},15000);
setTimeout(presence,2500);


/* ---------- sticker photos -> Google Drive (16+) ---------- */
function mqResizeJpeg(file,max,q){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*s));c.height=Math.max(1,Math.round(img.height*s));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const d=c.toDataURL('image/jpeg',q);res(d.slice(d.indexOf(',')+1))};
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('bad image'))};img.src=url})}
window.mqResizeJpeg=mqResizeJpeg;
const PQ='mq-photo-queue',pqGet=()=>{try{return JSON.parse(localStorage.getItem(PQ)||'[]')}catch(e){return[]}},pqSet=a=>{try{localStorage.setItem(PQ,JSON.stringify(a));return true}catch(e){return false}};
window.mqUploadStickerPhoto=async function(rec,file){
  if(mqAgeU16()||!file)return;
  let image;try{image=await mqResizeJpeg(file,1080,.7)}catch(e){toast('Could not prepare the photo.');return}
  const q=pqGet();q.push({id:'ph-'+rec.id,image,country:rec.addressParts?.country||'',city:rec.addressParts?.city||''});
  pqSet(q.slice(-4));flushPhotos()};
let flushing=false;
async function flushPhotos(){
  if(flushing||!state.user||!navigator.onLine||mqAgeU16())return;flushing=true;
  try{let q=pqGet();
    for(const it of q.slice()){
      try{const res=await post({action:'photoUpload',id:it.id,player:{code:state.user.code,name:state.user.name},consent:true,image:it.image,country:it.country,city:it.city});
        if(res&&res.ok){q=q.filter(x=>x.id!==it.id);pqSet(q);toast('Your sticker photo reached the circus. Thank you!')}
        else if(res&&/not available|consent|too large|JPEG|Enough photos|Unknown player/i.test(res.error||'')){q=q.filter(x=>x.id!==it.id);pqSet(q)}
        else break}catch(e){break}}
  }finally{flushing=false}}
setInterval(()=>{if(!document.hidden)flushPhotos()},60000);setTimeout(flushPhotos,4000);


/* ---------- open chat ---------- */
window.mqChat={async peek(since,mute){
  const res=await post({action:'chatSync',peek:true,since,mute,player:{code:state.user.code,name:state.user.name}});
  if(!res||!res.ok)throw new Error('peek failed');window.mqChatEnabled=res.enabled!==false;return res},
async sync(text){
  const look={};Object.keys(CONFIG.look.defaults||{}).forEach(k=>{look[k]=state.user[k]});
  const res=await post({action:'chatSync',player:{code:state.user.code,name:state.user.name},look,...(text?{text}:{})});
  if(!res||!res.ok)throw new Error((res&&res.error)||'Chat is taking a nap. Try again soon.');
  window.mqChatEnabled=res.enabled!==false;return res}};

// debounce syncing after every save
const _save=save;let t=null;
save=function(){const r=_save.apply(this,arguments);clearTimeout(t);t=setTimeout(sync,4000);return r};
async function cycle(){await loadConfig();await sync();await pull();if(applied)refreshView()}
cycle();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){cycle();setTimeout(presence,300)}});
setInterval(async()=>{if(document.hidden||!state.user)return;
  const sig=()=>JSON.stringify((state.places||[]).map(p=>[p.id,p.lat,p.lng,!!p.retired,p.name]));const before=sig();
  try{await loadConfig();await sync();await pull()}catch(e){}
  if(sig()!==before){try{refreshMarkers()}catch(e){}if(currentView==='places')refreshView()}},20000);
window.mqSheet={sync,pull,loadConfig,presence};
})();
