/* MondQuest · public ranking: nicknames, Lunitos, and what each courier has earned */
(function(){'use strict';
const C=window.MQ_CONFIG||{};if(!C.sheetUrl)return;
const E=s=>esc(String(s==null?'':s)),RK='mq-rank-cache';
let data=null,sel='',loading=false,err='';
try{data=JSON.parse(localStorage.getItem(RK)||'null')}catch(e){}
function lunito(r){const a=state.accessories,g=state.gadgets,sa=a&&a.equipped,sg=g&&g.equipped;
  try{if(a)a.equipped=r.equipped||[];if(g)g.equipped=r.gadgetsOn||[];return courierSvg(r.look||{})}finally{if(a)a.equipped=sa;if(g)g.equipped=sg}}
const medal=i=>i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
function detail(r){
  const cos=(r.owned||[]).map(id=>CONFIG.cosmetics.find(c=>c.id===id)).filter(Boolean),
        gad=(r.gadgets||[]).map(id=>MQ_GADGETS.find(g=>g.id===id)).filter(Boolean),
        combos=(CONFIG.combos||[]).filter(c=>(r.combos||[]).includes(c.id)),s=r.stats||{};
  const since=r.since?new Date(r.since).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'';
  return `<div class="mq14-detail"><div class="mq14-hero">${lunito(r)}<div><strong>${E(r.name)}</strong><br><small>Rank ${E(r.rank)} · ${E(r.rankName)}${since?' · since '+E(since):''}</small><br><b>${E(r.earned)} Mondinos earned</b></div></div>
  <div class="mq14-chips"><span class="mq14-chip">📍 ${E(s.places||0)} ${(s.places||0)===1?'place':'places'} found</span><span class="mq14-chip">📜 ${E(s.flyers||0)} flyers</span><span class="mq14-chip">🪧 ${E(s.posters||0)} posters</span><span class="mq14-chip">🏷️ ${E(s.stickers||0)} stickers</span><span class="mq14-chip">🔭 ${E(s.spotted||0)} spotted</span></div>
  <div><small>Achievements</small><div class="mq14-items">${combos.length?combos.map(c=>`<span class="mq14-item">🏅 ${E(c.label)}</span>`).join(''):'<span class="small">None yet</span>'}</div></div>
  <div><small>Outfits (${cos.length})</small><div class="mq14-items">${cos.length?cos.map(c=>`<span class="mq14-item${(r.equipped||[]).includes(c.id)?'" style="outline:1px solid #ffd666':''}">${E(c.emoji||'✨')} ${E(c.name)}</span>`).join(''):'<span class="small">Nothing yet</span>'}</div></div>
  <div><small>Gadgets (${gad.length})</small><div class="mq14-items">${gad.length?gad.map(g=>`<span class="mq14-item">${mqSvg(g.icon,20)} ${E(g.name)}</span>`).join(''):'<span class="small">Nothing yet</span>'}</div></div></div>`}
function paint(){
  if(currentView!=='ranking')return;
  const rows=(data&&data.rows)||[];
  const row=(r,i)=>`<button type="button" class="rank-row rank-link mq14-row${r.pid===(data&&data.me)?' mq14-me':''}" data-mq14="${E(r.pid)}" aria-expanded="${sel===r.pid}"><span class="mq14-pos">${medal(i)}</span><span class="rank-avatar">${lunito(r)}</span><span><strong>${E(r.name)}${r.pid===(data&&data.me)?' (you)':''}</strong><small>Rank ${E(r.rank)} · ${E(r.rankName)}</small></span><b>${E(r.earned)}</b></button>${sel===r.pid?detail(r):''}`;
  const mine=data&&data.pos>0?`<p class="small">You are <b>#${E(data.pos)}</b> of ${E(rows.length>=100?'100+':rows.length)}.</p>`:(data?'<p class="small">Earn your first Mondinos to join the ranking!</p>':'');
  shell(`<section class="card"><div class="eyebrow">COMMUNITY RANKING</div><h1>Courier ranking</h1><p class="small">Every courier, by Mondinos earned. Tap a Lunito to see its outfits, gadgets and achievements.</p>${mine}${err?`<p class="small">${E(err)}</p>`:''}<div class="actions"><button type="button" class="button quiet" data-mq14-refresh>${loading?'Loading…':'Refresh'}</button></div>${rows.length?rows.map(row).join(''):`<p class="small">${loading?'Loading the ranking…':'No couriers in the ranking yet.'}</p>`}</section>`)}
async function load(){if(loading||!window.mqPost||!state.user)return;loading=true;err='';paint();
  try{const r=await mqPost({action:'ranking',player:{code:state.user.code,name:state.user.name}});
    if(r&&r.ok){data={rows:r.rows,me:r.me,pos:r.pos};try{localStorage.setItem(RK,JSON.stringify(data))}catch(e){}}else err='Could not load the ranking right now.'}
  catch(e){err=navigator.onLine?'Could not load the ranking right now.':'You are offline. Showing the last ranking you saw.'}
  finally{loading=false;paint()}}
ranking=function(){sel='';paint();load()};
document.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('[data-mq14]');
  if(r){sel=sel===r.dataset.mq14?'':r.dataset.mq14;paint();return}
  if(e.target.closest&&e.target.closest('[data-mq14-refresh]'))load()});
})();
