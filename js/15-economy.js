/* MondQuest · build 15: the server owns points, material and progress.
   The phone only reports what the player DID (intents). The server works out the numbers and the phone shows them.
   Offline is fine: intents wait in the outbox and are sent when the connection is back. Needs sheetUrl. */
(function(){'use strict';
const C=window.MQ_CONFIG||{};if(!C.sheetUrl||!window.mqPost)return;
const QK='mq-act-q';
let q=[];try{q=JSON.parse(localStorage.getItem(QK)||'[]')}catch(e){q=[]}
const keep=()=>{try{localStorage.setItem(QK,JSON.stringify(q.slice(-200)))}catch(e){}};
const me=()=>String(state.user&&state.user.code||'');
const nid=p=>p+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
let busy=false,timer=0,celeNow=null;

function snap(){try{return{dist:state.distributed||{},pl:(state.history||[]).filter(h=>h.type==='discover').length,fp:!!state.firstPickupDone}}catch(e){return{}}}
function enq(it){if(!me())return;if(!it.id)it.id=nid('i');q.push(it);keep();clearTimeout(timer);timer=setTimeout(flush,1200)}

/* ---------- take over the numbers the server sends back ---------- */
function adopt(S){
  if(!S||q.length||!state||!state.user)return false;
  const sig=()=>JSON.stringify([state.wallet||0,state.earned||0,[state.inventory.flyers,state.inventory.posters,state.inventory.stickers],Object.values(state.minerals||{}),state.chests||0,state.adventure?state.adventure.left:null,[...(state.gadgets&&state.gadgets.owned||[])].sort(),[...(state.accessories&&state.accessories.owned||[])].sort(),[...(state.combosDone||[])].sort()]);
  const before=sig();
  const cele=celeNow;celeNow=null;
  state.wallet=S.w;state.earned=S.e;
  try{window.mqFx&&mqFx.settle(S.e,cele)}catch(e){}
  state.inventory={...(state.inventory||{}),...S.inv};
  state.distributed={...(state.distributed||{}),...S.dist};
  state.carry=S.carry||0;
  state.minerals={meteor:0,comet:0,nebula:0,void:0,rings:0,...S.min};
  state.chests=S.ch;
  state.adventure=S.adv?{...S.adv}:null;
  state.gadgets=state.gadgets||{owned:[],equipped:[]};
  state.gadgets.owned=[...S.gO];state.gadgets.equipped=(state.gadgets.equipped||[]).filter(i=>S.gO.includes(i));
  state.accessories=state.accessories||{owned:[],equipped:[]};
  const free=(state.accessories.owned||[]).filter(id=>{const c=(CONFIG.cosmetics||[]).find(x=>x.id===id);return c&&!c.cost});
  state.accessories.owned=[...new Set([...S.aO,...free])];
  state.combosDone=[...S.cd];
  state.batches=(S.bt||[]).map(b=>({...b}));
  if(S.pk)state.firstPickupDone=true;
  const after=sig();
  try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(state))}catch(e){}
  if(before!==after){if(!document.querySelector('.lunar-sheet')){try{window.mqRefresh&&mqRefresh()}catch(e){}}return true}
  return false}

/* ---------- a rejected action is undone on the phone, with a friendly note ---------- */
function undo(it,err){
  try{
    if(it.t==='drop'){const bid=String(it.id).replace(/-[fps]$/,'');state.deliveries=(state.deliveries||[]).filter(d=>{const k=String(d.submitId||d.id).slice(0,36);return String(d.submitId||d.id)!==it.id&&String(d.id)!==it.id&&k!==bid})}
    if(it.t==='sight'){state.spotted=(state.spotted||[]).filter(x=>String(x.id)!==it.id)}
    if(it.t==='redeem'){const r=(state.redemptionRequests||[]).find(x=>x.id===it.id);if(r){r.status='rejected';r.resolvedAt=Date.now();const rw=(state.rewards||[]).find(x=>x.id===r.itemId);if(rw)rw.stock++}}
    toast(err||'That did not go through.');
  }catch(e){}}

/* ---------- outbox ---------- */
async function flush(){
  if(busy||!q.length||!state.user||!navigator.onLine)return;busy=true;
  try{
    try{if(window.mqSheet&&mqSheet.sync)await mqSheet.sync()}catch(e){}
    const batch=q.slice(0,25);
    const res=await mqPost({action:'act',player:{code:me(),name:state.user.name,age:state.user.age||''},intents:batch,snap:snap()});
    if(!res||!res.ok)return;
    const done=new Set(batch.map(i=>i.id));q=q.filter(i=>!done.has(i.id));keep();
    (res.results||[]).forEach(r=>{if(!r.ok&&!r.dup){const it=batch.find(i=>i.id===r.id);if(it)undo(it,r.err)}});
    try{(res.results||[]).forEach(r=>{if(r.ok&&!r.dup&&r.out&&r.out.noPoints){const it=batch.find(i=>i.id===r.id);if(it&&it.t==='sight')toast('Sticker saved on the map for everyone! No Mondinos this time (daily limit, or one was already found here).')}})}catch(e){}
    const okIts=(res.results||[]).filter(r=>r.ok&&!r.dup).map(r=>batch.find(i=>i.id===r.id)).filter(Boolean);
    celeNow=(celeNow||[]).concat(okIts.map(i=>i.t));
    try{okIts.filter(i=>i.t==='redeem').forEach(i=>{const rw=(state.rewards||[]).find(x=>x.id===i.itemId);window.mqFx&&mqFx.redeem(rw&&rw.name)})}catch(e){}
    window.mqEcon.last=res;
    if(!q.length){adopt(res.state);celeNow=null}else{busy=false;setTimeout(flush,50)}
  }catch(e){}finally{busy=false}}
window.mqEcon={adopt,snap,flush,enq,queue:()=>q.slice(),last:null};
setInterval(()=>{if(!document.hidden)flush()},30000);setTimeout(flush,3000);
window.addEventListener('online',()=>setTimeout(flush,500));

/* ---------- report what the player does ---------- */
if(typeof mqExpire==='function')mqExpire=function(){};   // expiry now happens on the server

const _pl=processLog;
processLog=function(form){const n=(state.deliveries||[]).length;let r;try{r=_pl.apply(this,arguments)}finally{
  const d=(state.deliveries||[]);if(d.length>n){const l=d[d.length-1];
    if(l&&String(l.playerCode)===me()&&!l.remoteW){const base=String(l.submitId||l.id).slice(0,36),pid=String(l.placeId);
      if(l.kind==='poster'||l.kind==='stickers'||l.kind==='restock')enq({t:'drop',id:String(l.submitId||l.id).slice(0,40),placeId:pid,kind:l.kind,flyers:+l.flyers||0,posters:+l.posters||0,stickers:+l.stickers||0,photo:!!l.photo});
      else{ /* the server records one material per action: a mixed delivery becomes one action per material, so posters and stickers reach the server (and every other player) too */
        const f=+l.flyers||0,po=+l.posters||0,st=+l.stickers||0;
        if(f)enq({t:'drop',id:base+'-f',placeId:pid,kind:'drop',flyers:f,posters:0,stickers:0,photo:false});
        if(po)enq({t:'drop',id:base+'-p',placeId:pid,kind:'poster',flyers:0,posters:po,stickers:0,photo:!!l.photo});
        if(st)enq({t:'drop',id:base+'-s',placeId:pid,kind:'stickers',flyers:0,posters:0,stickers:st,photo:false})}}}}
  return r};

const _sp=createSpottedRecord;
createSpottedRecord=function(data){const rec=_sp.apply(this,arguments);
  try{const th=/^data:image\/jpeg;base64,/.test(rec.thumbnail||'')&&rec.thumbnail.length<=30000?rec.thumbnail:'';
    enq({t:'sight',id:String(rec.id),lat:rec.lat,lng:rec.lng,country:rec.addressParts&&rec.addressParts.country||'',city:rec.addressParts&&rec.addressParts.city||'',photo:!!rec.photo,
      text:String(rec.exactAddress||[rec.addressParts&&rec.addressParts.street,rec.addressParts&&rec.addressParts.city].filter(Boolean).join(', ')),thumb:th})}catch(e){}
  return rec};

const _h=history;
history=function(type,label,amount,extra){const r=_h.apply(this,arguments);
  try{
    if(type==='discover'){const h=state.history[state.history.length-1];enq({t:'discover',id:String(h&&h.id||nid('n')).slice(0,40),photo:(+amount||0)>(CONFIG.points.discover||0)})}
    else if(type==='pickup'&&extra&&extra.quantities&&!extra.staff)enq({t:'pickup',flyers:+extra.quantities.flyers||0,posters:+extra.quantities.posters||0,stickers:+extra.quantities.stickers||0});
    else if(type==='rating'&&extra&&extra.placeId){const pl=(state.places||[]).find(x=>x.id===extra.placeId),st=pl&&pl.ratings&&pl.ratings[state.user.id||state.user.code];enq({t:'rate',placeId:String(extra.placeId),stars:+st||5})}
    else if(type==='combo'&&/^Moon route/.test(String(label||''))&&state.route)enq({t:'route',ids:state.route.ids.slice(0,3),startedAt:state.route.startedAt});
  }catch(e){}
  return r};

const _rr=requestRedemption;
requestRedemption=function(itemId,type){const had=(state.accessories&&state.accessories.owned||[]).includes(itemId);const n=(state.redemptionRequests||[]).length;
  const r=_rr.apply(this,arguments);
  try{
    if(type==='accessory'){if(r&&r.cost>0&&!had)enq({t:'buy',item:itemId})}
    else{const q2=state.redemptionRequests;if(q2.length>n)enq({t:'redeem',id:q2[q2.length-1].id,itemId})}
  }catch(e){}
  return r};

const _cr=mqCraft;
mqCraft=function(id){const n=(state.gadgets.owned||[]).length;const r=_cr.apply(this,arguments);if((state.gadgets.owned||[]).length>n)enq({t:'craft',item:id});return r};

const _sa=mqStartAdv;
mqStartAdv=function(id){const had=!!state.adventure;const r=_sa.apply(this,arguments);if(!had&&state.adventure)enq({t:'advStart',adv:id});return r};

// stopping an adventure is a button handled inside handleAction
const _ha=handleAction;
handleAction=function(action,b){if(action==='adv-stop'&&state.adventure)enq({t:'advStop'});return _ha.apply(this,arguments)};

// Magic chests are drawn by the server, so every phone and the sheet agree on what was found
const _oc=mqOpenChest;
mqOpenChest=function(){
  if(!navigator.onLine)throw Error('Open your magic chest when you are back online.');
  mqInit();if(state.chests<1)throw Error('No chests left.');
  (async()=>{
    try{
      await flush();
      const res=await mqPost({action:'act',player:{code:me(),name:state.user.name,age:state.user.age||''},intents:[{t:'chest',id:nid('c')}],snap:snap()});
      const r=res&&res.results&&res.results[0];
      if(!res||!res.ok||!r)return toast('Could not open it right now. Try again in a moment.');
      if(!r.ok)return toast(r.err||'Nothing to find yet.');
      const o=r.out;state.history.push({id:nid('h'),type:'chest',label:'Magic chest: '+o.name,amount:0,at:Date.now(),playerCode:me()});
      adopt(res.state);cargoTab=o.kind==='g'?'gadgets':'outfits';cargoSel=o.item;toast('Magic chest: '+o.name+'!');cargoScreen();
    }catch(e){toast('Could not open it right now. Try again in a moment.')}
  })()};
})();
