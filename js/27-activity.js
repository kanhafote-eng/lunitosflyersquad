/* MondQuest · what other couriers do: live banner on the map + a recent-activity history inside the notifications screen. */
(function(){'use strict';
const WINDOW=14*864e5, START=Date.now();
const me=()=>String(state.user&&state.user.code||'');
const E=s=>esc(String(s==null?'':s));
const KEY=()=>'mq-feed-seen-'+(me()||'guest'), TKEY=()=>'mq-feed-toast-'+(me()||'guest');
const seenAt=()=>{let v=+localStorage.getItem(KEY());if(!v){v=Date.now()-864e5;try{localStorage.setItem(KEY(),String(v))}catch(e){}}return v};
const placeName=id=>{const p=(state.places||[]).find(x=>x.id===String(id));return p?p.name:'a place'};
const ago=ms=>{const m=Math.max(0,Math.round((Date.now()-ms)/60000));return m<2?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
function entries(){const out=[],m=me(),cut=Date.now()-WINDOW;if(!state.user)return out;
  (state.deliveries||[]).forEach(d=>{if(!d.remoteW||!d.at||d.at<cut||String(d.playerCode)===m||String(d.playerCode)==='')return;
    const bits=[];if(d.flyers)bits.push(d.flyers+(d.flyers===1?' flyer':' flyers'));if(d.posters)bits.push(d.posters+(d.posters===1?' poster':' posters'));if(d.stickers)bits.push(d.stickers+(d.stickers===1?' sticker':' stickers'));
    if(!bits.length)return;const icon=d.posters&&!d.flyers?'🖼️':d.stickers&&!d.flyers?'⭐':'📨';
    const p=(state.places||[]).find(x=>x.id===String(d.placeId));
    out.push({id:'d:'+d.id,at:d.at,icon,who:d.user||'A courier',html:`<b>${E(d.user||'A courier')}</b> dropped ${E(bits.join(', '))} at <b>${E(placeName(d.placeId))}</b>`,lat:p&&p.lat,lng:p&&p.lng,short:`${d.user||'A courier'} dropped ${bits.join(', ')} · ${placeName(d.placeId)}`})});
  (state.spotted||[]).forEach(x=>{if(!x.remoteW||!x.at||x.at<cut||String(x.playerCode)===m)return;
    const where=x.exactAddress?` · ${x.exactAddress}`:'';
    out.push({id:'s:'+x.id,at:x.at,icon:'🔭',who:x.user||'A courier',html:`<b>${E(x.user||'A courier')}</b> found a sticker${E(where)}`,lat:x.lat,lng:x.lng,short:`${x.user||'A courier'} found a sticker${where}`})});
  (state.places||[]).forEach(p=>{if(!p.remote||p.retired)return;const mm=/^(.*?)\s*\(([A-Za-z0-9\-]{3,24})\)\s*$/.exec(String(p.discoverer||''));if(!mm||mm[2]===m)return;
    const at=p.serverAt||p.createdAt||0;if(!at||at<cut)return;
    out.push({id:'p:'+p.id,at,icon:'📍',who:mm[1],html:`<b>${E(mm[1])}</b> added a new place: <b>${E(p.name)}</b>`,lat:p.lat,lng:p.lng,short:`${mm[1]} added a new place: ${p.name}`})});
  return out.sort((a,b)=>b.at-a.at)}
const unreadFeed=()=>{const s=seenAt();return entries().filter(e=>e.at>s).length};
/* ---- bell badge: news + activity ---- */
const _un=unreadNews;unreadNews=function(){let n=0;try{n=_un.apply(this,arguments)}catch(e){}try{n+=unreadFeed()}catch(e){}return n};
function paintBell(){try{const el=document.querySelector('[data-unread-count]');if(!el)return;const n=unreadNews();el.textContent=n>99?'99+':n||'';el.hidden=!n}catch(e){}}
/* ---- notifications screen: history of what others did ---- */
const _an=announcements;
announcements=function(){const s0=seenAt();const r=_an.apply(this,arguments);
  try{const list=entries().slice(0,40),card=document.querySelector('.view>.card,main .card');
    const h=`<section class="mq28-feed"><div class="eyebrow">WHAT OTHER LUNITOS DID</div><h2>Recent activity</h2>`+(list.length?`<ul class="mq28-list">${list.map(e=>`<li class="${e.at>s0?'new':''}"><span class="mq28-ic">${e.icon}</span><div class="mq28-tx">${e.html}<small>${ago(e.at)}</small></div>${Number.isFinite(+e.lat)&&e.lat!==undefined&&e.lat!==null&&e.lat!==''?`<button type="button" class="button small" data-mq28-show="${+e.lat},${+e.lng}">Show</button>`:''}</li>`).join('')}</ul>`:'<p class="small">Nothing new yet. When other Lunitos drop flyers, find stickers or add places, you will see it here.</p>')+'</section>';
    if(card)card.insertAdjacentHTML('beforeend',h);
    try{localStorage.setItem(KEY(),String(Date.now()))}catch(e){}paintBell()}catch(e){}
  return r};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-mq28-show]');if(!b)return;
  const [la,ln]=b.dataset.mq28Show.split(',').map(Number);go('map');setTimeout(()=>{try{leafletInstance.setView([la,ln],17,{animate:true});if(window.mqCelebrate)mqCelebrate({kind:'drop',lat:la,lng:ln})}catch(x){}},600)});
/* ---- live banner ---- */
let toasted=new Set(),queue=[],showing=false,root=null;
try{toasted=new Set(JSON.parse(localStorage.getItem(TKEY())||'[]'))}catch(e){}
const saveToasted=()=>{try{localStorage.setItem(TKEY(),JSON.stringify([...toasted].slice(-300)))}catch(e){}};
function ensureRoot(){if(root&&document.body.contains(root))return root;root=document.createElement('div');root.className='mq28-live';root.setAttribute('aria-live','polite');document.body.appendChild(root);return root}
function showNext(){if(showing)return;if(!['map','menu'].includes(currentView))return;
  const e=queue.shift();if(!e)return;showing=true;
  const r=ensureRoot(),d=document.createElement('button');d.type='button';d.className='mq28-note';d.innerHTML=`<span class="mq28-ic">${e.icon}</span><span class="mq28-tx">${e.html}</span>`;
  d.addEventListener('click',()=>{go('announcements')});r.appendChild(d);
  requestAnimationFrame(()=>d.classList.add('in'));
  const more=queue.length;if(more>2){queue.length=0;d.querySelector('.mq28-tx').insertAdjacentHTML('beforeend',` <small>+${more} more</small>`)}
  setTimeout(()=>{d.classList.remove('in');setTimeout(()=>{d.remove();showing=false;showNext()},350)},5200)}
function tick(){try{if(!state.user)return;
  const fresh=entries().filter(e=>!toasted.has(e.id)&&e.at>=START-90000);
  /* everything currently known counts as seen for banners (older items live in the history) */
  entries().forEach(e=>toasted.add(e.id));
  if(fresh.length){saveToasted();fresh.sort((a,b)=>a.at-b.at).forEach(e=>{if(Date.now()-e.at<5*60000)queue.push(e)})}
  else if(toasted.size)saveToasted();
  showNext();paintBell()}catch(e){}}
setTimeout(()=>{try{entries().filter(e=>e.at<START-90000).forEach(e=>toasted.add(e.id))}catch(x){}},0);
setInterval(tick,3000);
window.mqActivity={entries,unread:unreadFeed};
})();
