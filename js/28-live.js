/* MondQuest · live players status, "someone is sharing" banner, and the place finder in Places & Route. */
(function(){'use strict';
const E=s=>esc(String(s==null?'':s));
/* ---------- Online players: honest status line ---------- */
function statText(){const P=window.mqPresence;if(!P)return '';const st=P.status?P.status():{at:0,err:''},on=P.online().filter(x=>!x.me).length,sh=P.sharing().filter(x=>!x.me).length;
  if(st.err&&!st.at)return `⚠️ Can't reach the server yet (${E(st.err)}). Trying again…`;
  if(!st.at)return 'Checking who is online…';
  const s=Math.round((Date.now()-st.at)/1000),when=s<5?'just now':s<90?s+' s ago':Math.round(s/60)+' min ago';
  return (st.err?`⚠️ Last try failed (${E(st.err)}). `:'')+`Updated ${when} · ${on} other${on===1?'':'s'} online · ${sh} sharing`}
function paintStat(){const el=document.querySelector('[data-mq29-stat]');if(el)el.innerHTML=statText()}
const _ps=window.playersScreen;
if(_ps)window.playersScreen=function(){const r=_ps.apply(this,arguments);
  try{const card=document.querySelector('.view>.card,main .card'),first=card&&card.querySelector('p.small');
    if(first&&!card.querySelector('[data-mq29-stat]')){first.insertAdjacentHTML('afterend','<p class="small mq29-stat" data-mq29-stat></p>');paintStat();
      const P=window.mqPresence;if(P&&!mqAgeU16()&&!P.sharing().some(x=>!x.me))card.querySelector('[data-mq29-stat]').insertAdjacentHTML('afterend','<p class="small">Nobody is sharing a location right now. Players only appear on the map while they tap <b>Share my location</b>, and only roughly.</p>')}}catch(e){}
  return r};
setInterval(()=>{if(currentView==='players')paintStat()},4000);
/* ---------- banner when someone starts sharing ---------- */
let knownSh=null;
setInterval(()=>{try{const P=window.mqPresence;if(!P||!state.user||mqAgeU16())return;const st=P.status&&P.status();if(!st||!st.at)return;
  const cur=P.sharing().filter(x=>!x.me),ids=new Set(cur.map(x=>x.pid));
  if(knownSh===null){knownSh=ids;return}
  cur.forEach(x=>{if(!knownSh.has(x.pid)&&window.mqBanner)mqBanner('📍',`<b>${E(x.name)}</b> is sharing their location — look for them on the map`)});
  knownSh=ids}catch(e){}},4000);
/* ---------- place finder ---------- */
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function results(q){const t=norm(q).split(/\s+/).filter(Boolean);if(!t.length)return null;
  return activePlaces().filter(p=>{const m=typeMeta(p.type)||[],hay=norm([p.name,m[0],m[2],p.type,addressText(p),p.address,p.spot,p.notes].filter(Boolean).join(' '));return t.every(w=>hay.includes(w))}).slice(0,30)}
function rowHtml(p){const m=typeMeta(p.type)||['','📍'];return `<div class="mq29-res" role="option"><button type="button" class="mq29-hit" data-mq29-go="${E(p.id)}"><span class="place-icon">${m[1]||'📍'}</span><span class="mq29-t"><b>${E(p.name)}</b><small>${E(addressText(p))}</small></span><span class="mq29-show">Map</span></button></div>`}
function paintResults(q){const box=document.querySelector('[data-mq29-results]');if(!box)return;const r=results(q);
  if(r===null){box.innerHTML='';box.hidden=true;return}
  box.hidden=false;box.innerHTML=r.length?`<p class="small">${r.length} place${r.length===1?'':'s'} found</p>`+r.map(rowHtml).join(''):'<p class="mq29-none">No results. Try another name, a street or a type like “cafe”.</p>'}
const _pl=placesScreen;
placesScreen=function(){const keep=(document.querySelector('[data-mq29-q]')||{}).value||'';const r=_pl.apply(this,arguments);
  try{const card=document.querySelector('.view>.card,main .card');if(!card||card.querySelector('[data-mq29-q]'))return r;
    const h=card.querySelector('.row')||card.querySelector('h1');
    (h.closest('.row')||h).insertAdjacentHTML('afterend',`<div class="mq29-find"><label class="mq29-lab" for="mq29-q">Find a place on the map</label><div class="mq29-box"><input id="mq29-q" data-mq29-q type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Name, street or type…" aria-controls="mq29-res"><button type="button" class="button small quiet" data-mq29-clear aria-label="Clear search" hidden>✕</button></div><div id="mq29-res" class="mq29-results" data-mq29-results role="listbox" hidden></div></div>`);
    const i=card.querySelector('[data-mq29-q]');if(keep){i.value=keep;paintResults(keep);card.querySelector('[data-mq29-clear]').hidden=false}}catch(e){}
  return r};
document.addEventListener('input',e=>{const i=e.target;if(!i||!i.matches||!i.matches('[data-mq29-q]'))return;paintResults(i.value);const c=document.querySelector('[data-mq29-clear]');if(c)c.hidden=!i.value});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('[data-mq29-q]')){e.preventDefault();e.target.blur()}});
document.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('[data-mq29-clear]');if(c){const i=document.querySelector('[data-mq29-q]');if(i){i.value='';paintResults('');c.hidden=true;i.focus()}return}
  const g=e.target.closest&&e.target.closest('[data-mq29-go]');if(!g)return;
  const p=state.places.find(x=>x.id===g.dataset.mq29Go);if(!p)return;
  try{document.activeElement&&document.activeElement.blur()}catch(x){}
  if(window.mqCelebrate)mqCelebrate({kind:'place',lat:p.lat,lng:p.lng,popup:true,msg:'📍 '+p.name});else go('map')},true);
})();
