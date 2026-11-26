/* MondQuest · the Moon menu, rebuilt: every button says what you DO. Three groups, glass look, one tap to the action. */
(function(){'use strict';
const T=(ic,title,sub,attrs)=>({ic,title,sub,attrs});
const MISSIONS=T('star','Missions','Today’s goals and rewards','data-view="missions"');
const GROUPS=[
 ['Play',[
  T('tent','Pick up Material','Grab your material','data-view="pickup"'),
  T('flyer','Drop off Flyers','Leave them at a place','data-action="mission" data-kind="drop"'),
  T('poster','Put up Poster','Hang one up','data-action="mission" data-kind="poster"'),
  T('sticker','Stick Stickers','Place them around town','data-action="mission" data-kind="stickers"'),
  T('scope','Find a Sticker','Spotted one? Share it','data-action="mission" data-kind="spotted"'),
  T('pin','Add New Location','Suggest a new spot','data-action="mission" data-kind="discover"')]],
 ['Explore',[
  T('globe','Places & Route','Stops &amp; adventures','data-view="places"'),
  T('trophy','Ranking','Top couriers','data-view="ranking"'),
  T('user','Online Players','See who’s out now','data-view="players"')]],
 ['My stuff',[
  T('container','Cargo','Bag, outfits, gadgets','data-view="shop"'),
  T('mask','Profile','Your Lunito &amp; stats','data-view="courier"'),
  T('gear','Settings','Map, privacy, how to play','data-view="settings"')]]];
const tile=t=>`<button type="button" class="button mq25-tile" ${t.attrs}><span class="mq25-ic">${window.mqIcon?mqIcon(t.ic,'menu-ic'):''}</span><span class="mq25-tx"><b>${t.title}</b><small>${t.sub}</small></span></button>`;
function html(){return `<div class="mq25-menu" role="menu" aria-label="Moon menu"><button type="button" class="button mq25-tile mq25-wide" ${MISSIONS.attrs}><span class="mq25-ic">${window.mqIcon?mqIcon(MISSIONS.ic,'menu-ic'):''}</span><span class="mq25-tx"><b>${MISSIONS.title}</b><small>${MISSIONS.sub}</small></span></button>`
  +GROUPS.map(([h,l])=>`<h3 class="mq25-h">${h}</h3><div class="mq25-grid">${l.map(tile).join('')}</div>`).join('')+'</div>'}
const _more=more;
more=function(){const r=_more.apply(this,arguments);
  try{const sc=document.querySelector('.lunar-sheet-scroll');if(sc){sc.innerHTML=html();
      setTimeout(()=>{try{document.querySelectorAll('.mq25-menu .menu-ic').forEach(()=>{})}catch(e){}},0)}}catch(e){}
  return r};
/* the "choose a place" hint + Adventures live on Places & Route */
const _pl=placesScreen;
placesScreen=function(){const r=_pl.apply(this,arguments);
  try{const card=document.querySelector('.view>.card');if(!card)return r;
    const names={drop:'Drop off Flyers',poster:'Put up Poster',stickers:'Stick Stickers'};
    let h='';
    if(typeof queuedMission!=='undefined'&&names[queuedMission])h+=`<p class="mq25-hint">👉 Choose a place below to <b>${names[queuedMission]}</b>.</p>`;
    h+='<div class="actions"><button type="button" class="button" data-view="adventures">🪐 Adventures</button></div>';
    const e=card.querySelector('.eyebrow');if(e&&!card.querySelector('.mq25-hint,.mq25-adv'))e.insertAdjacentHTML('afterend','<div class="mq25-adv">'+h+'</div>')}catch(e){}
  return r};
/* Online players: tap Profile to see another courier's card */
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-mq25-prof]');if(!b)return;
  const pid=b.dataset.mq25Prof,box=document.querySelector('.mq25-prof[data-for="'+(window.CSS&&CSS.escape?CSS.escape(pid):pid)+'"]');if(!box)return;
  if(!box.hidden){box.hidden=true;b.textContent='Profile';return}
  b.disabled=true;box.hidden=false;box.innerHTML='<p class="small">Loading…</p>';
  let h=null;try{h=window.mqPlayerProfile?await mqPlayerProfile(pid):null}catch(x){}
  b.disabled=false;b.textContent='Hide';
  box.innerHTML=h||'<p class="small">This courier has no public profile yet. They show up in the ranking after their first Mondinos.</p>'},true);
})();
