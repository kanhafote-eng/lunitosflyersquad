'use strict';
/* MondQuest · Google Sheet connection. Does nothing when config.js has no sheetUrl (local demo mode). */
(function(){
const C=window.MQ_CONFIG||{};if(!C.sheetUrl)return;
const num=v=>{v=Number(v);return isFinite(v)?v:0},bool=v=>v===true||String(v).toUpperCase()==='TRUE';
const S=()=>{state.__sync=state.__sync||{lastAt:0,reqs:[],places:[],applied:[],ack:[]};return state.__sync};
// The public game never has local admin powers: those live in admin.html behind the server PIN.
try{Object.defineProperty(state,'adminMode',{get:()=>false,set:()=>{},enumerable:false,configurable:true})}catch(e){}
new MutationObserver(()=>{const t=document.getElementById('admin-toggle');if(t){const l=t.closest('label');(l||t).remove()}}).observe(document.documentElement,{childList:true,subtree:true});

function setPath(root,key,val){const p=key.split('.');let o=root;for(let i=0;i<p.length-1;i++){if(o[p[i]]==null||typeof o[p[i]]!=='object')return;o=o[p[i]]}if(p.length>1&&!(p[p.length-1] in o))return;o[p[p.length-1]]=val}
let applied=false;
function applyRemote(r){
  if(!r||!r.ok)return;
  (r.config||[]).forEach(x=>{const k=String(x.Key||x.key||'');const v=num(x.Value!==undefined?x.Value:x.value);if(k)setPath(CONFIG,k,v)});
  if(r.combos&&r.combos.length)CONFIG.combos=r.combos.map(c=>({id:String(c.id),stat:String(c.stat),at:num(c.at),bonus:num(c.bonus),label:String(c.label)}));
  if(r.ranks&&r.ranks.length){MQ_RANKS.length=0;r.ranks.sort((a,b)=>num(a.rank)-num(b.rank)).forEach(x=>MQ_RANKS.push([String(x.name),num(x.earned)]))}
  // prizes: keep local artwork/description by id, take name, price, stock and visibility from the sheet
  if(r.rewards){const old=Object.fromEntries(state.rewards.map(x=>[x.id,x]));const ids=new Set();
    const next=r.rewards.map((x,i)=>{const o=old[x.id]||{};ids.add(x.id);return{...o,id:String(x.id),name:String(x.name),category:String(x.category),cost:num(x.cost),stock:num(x.stock),description:o.description||(x.category+' · prize Zirkus Mond'),svg:o.svg||DEFAULT_REWARD_SVGS[i%DEFAULT_REWARD_SVGS.length]}});
    state.rewards=next;CONFIG.rewards=next.map(x=>({id:x.id,name:x.name,category:x.category,cost:x.cost}))}
  if(r.cosmetics){const m=Object.fromEntries(r.cosmetics.map(x=>[x.id,x]));
    CONFIG.cosmetics.forEach(c=>{const x=m[c.id];c.hidden=!x;if(x){c.cost=num(x.cost);c.rank=num(x.rank)||c.rank}});
    CONFIG.cosmetics=CONFIG.cosmetics.filter(c=>!c.hidden||num(c.cost)===0)}
  if(r.gadgets){const m=Object.fromEntries(r.gadgets.map(x=>[x.id,x]));
    for(let i=MQ_GADGETS.length-1;i>=0;i--){const g=MQ_GADGETS[i],x=m[g.id];if(!x){MQ_GADGETS.splice(i,1);continue}
      g.cost=num(x.cost);g.rank=num(x.rank)||g.rank;g.min={};['comet','meteor','nebula','void','rings'].forEach(k=>{if(num(x[k])>0)g.min[k]=num(x[k])})}}
  if(r.places){const sy=S();const remote=new Map(r.places.map(p=>[String(p.id),p]));
    r.places.forEach(p=>{const id=String(p.id);let l=state.places.find(x=>x.id===id);
      const f={name:String(p.name),type:String(p.type),posterSize:String(p.posterSize||'A4'),address:String(p.address||''),lat:num(p.lat),lng:num(p.lng),spot:String(p.spot||''),notes:String(p.notes||''),retired:false,remote:true};
      if(l)Object.assign(l,f);else state.places.push({id,discoverer:String(p.addedBy||'Zirkus Mond'),createdAt:Date.now(),closed:false,ratings:{},status:'needs',lastUpdated:Date.now(),...f})});
    state.places.forEach(p=>{if((p.remote||/^seed-/.test(p.id))&&!remote.has(p.id)){p.retired=true}})}
  if(r.news){state.newsPages=[...r.news.map(n=>({id:'sheet-'+n.id,title:String(n.title),body:String(n.body),type:String(n.type||'new flyers'),image:n.image||svgData('#f6bd4e'),sheet:true})),...state.newsPages.filter(n=>!n.demo&&!n.sheet)];state.newsSeeded=true}
  applied=true;
}
const CACHE='mq-remote';
try{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c)applyRemote(c)}catch(e){}
async function post(o){const r=await fetch(C.sheetUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:C.writeKey,...o})});return r.json()}
async function loadConfig(){try{const r=await (await fetch(C.sheetUrl+'?action=config')).json();if(r.ok){try{localStorage.setItem(CACHE,JSON.stringify(r))}catch(e){}applyRemote(r);save0();return true}}catch(e){}return false}
function save0(){try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(state))}catch(e){}}
function refreshView(){try{if(typeof currentView==='string'&&!document.querySelector('input:focus,textarea:focus,select:focus'))go(currentView)}catch(e){}}

function snapshot(){const u=state.user;if(!u)return null;const inv=state.inventory||{};
  return{code:u.code,name:u.name,wallet:state.wallet,earned:state.earned,flyers:inv.flyers||0,posters:inv.posters||0,stickers:inv.stickers||0}}
let busy=false;
async function sync(){
  if(busy||!state.user||!navigator.onLine)return;busy=true;const sy=S();
  try{
    const entries=(state.history||[]).filter(h=>h.at>sy.lastAt&&!/^(grant)/.test(h.type)).slice(0,200);
    const reds=(state.redemptionRequests||[]).filter(r=>r.type==='reward'&&r.playerCode===state.user.code&&isPending(r)&&!sy.reqs.includes(r.id)).map(r=>({id:r.id,item:r.name,cost:r.cost,category:r.category}));
    const pls=(state.places||[]).filter(p=>!p.remote&&!/^seed-/.test(p.id)&&p.discoverer===state.user.name&&!p.retired&&!sy.places.includes(p.id)).slice(0,5);
    const res=await post({action:'sync',player:snapshot(),entries:entries.map(h=>({id:h.id,type:h.type,label:h.label,amount:h.amount,at:new Date(h.at).toISOString()})),redemptions:reds,places:pls.map(p=>({id:p.id,name:p.name,type:p.type,posterSize:p.posterSize,address:p.address,lat:p.lat,lng:p.lng,spot:p.spot,notes:p.notes}))});
    if(res&&res.ok){if(entries.length)sy.lastAt=Math.max(...entries.map(h=>h.at));reds.forEach(r=>sy.reqs.push(r.id));pls.forEach(p=>sy.places.push(p.id));save0()}
  }catch(e){}finally{busy=false}
}
async function pull(){
  if(!state.user||!navigator.onLine)return;const sy=S();let changed=false;
  try{
    const res=await post({action:'pull',code:state.user.code,ack:sy.ack});
    if(!res||!res.ok)return;sy.ack=[];
    (res.grants||[]).forEach(g=>{
      if(!sy.applied.includes(g.id)){
        const q={flyers:num(g.flyers),posters:num(g.posters),stickers:num(g.stickers)};
        if(q.flyers||q.posters||q.stickers){state.inventory.flyers+=q.flyers;state.inventory.posters+=q.posters;state.inventory.stickers+=q.stickers;mqBatchAdd(q);
          history('grant','Staff restock · '+[q.flyers&&q.flyers+' flyers',q.posters&&q.posters+' posters',q.stickers&&q.stickers+' stickers'].filter(Boolean).join(', '),0);toast('Staff added material to your bag.')}
        const p=num(g.points);if(p){state.wallet+=p;if(p>0)state.earned+=p;history('grant',(g.note||'Admin adjustment'),p);toast((p>0?'+':'')+p+' Mondinos from the circus team.')}
        sy.applied.push(g.id);if(sy.applied.length>100)sy.applied.shift();changed=true}
      sy.ack.push(g.id)});
    (res.redemptions||[]).forEach(rd=>{const r=(state.redemptionRequests||[]).find(x=>x.id===rd.id);if(!r||!isPending(r))return;
      if(rd.status==='delivered'){r.status='delivered';r.resolvedAt=Date.now();history('redemption-approved','Delivery verified · '+r.name,0,{requestId:r.id});toast('Prize delivered: '+r.name);changed=true}
      else if(rd.status==='rejected'){state.wallet+=r.cost;const it=state.rewards.find(x=>x.id===r.itemId);if(it)it.stock++;r.status='rejected';r.resolvedAt=Date.now();history('redemption-refund','Rejected prize · '+r.name,-r.cost,{requestId:r.id});toast('Prize request rejected. Mondinos refunded.');changed=true}});
    if(changed){save0();refreshView()}
  }catch(e){}
}
// debounce syncing after every save
const _save=save;let t=null;
save=function(){const r=_save.apply(this,arguments);clearTimeout(t);t=setTimeout(sync,4000);return r};
async function cycle(){await loadConfig();await sync();await pull();if(applied)refreshView()}
cycle();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)cycle()});
setInterval(()=>{if(!document.hidden){pull();sync()}},90000);
window.mqSheet={sync,pull,loadConfig};
})();
