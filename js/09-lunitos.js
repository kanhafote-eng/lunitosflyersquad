/* 09-lunitos.js — location notice + glowing button, photo notice, announcements banner */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function modal(html){
  closeModal();
  const o=document.createElement('div');o.className='mq9-modal';o.id='mq9-modal';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
  o.innerHTML=`<div class="mq9-box">${html}</div>`;document.body.appendChild(o);
  const b=o.querySelector('button');if(b)try{b.focus()}catch(e){}}
function closeModal(){const o=document.getElementById('mq9-modal');if(o)o.remove()}

/* ---------- location: friendly notice the first time, then a glowing button ---------- */
const _share=shareLocation;
shareLocation=function(){
  if(state.user&&state.user.glowSeen)return _share.apply(this,arguments);
  modal(`<div class="mq9-emoji" aria-hidden="true">✨</div><h2>Want to glow on the map?</h2><p>Other Lunitos will see your Lunito roughly where you are (within a couple of hundred metres) for 30 minutes. You can switch it off anytime by tapping the glowing Location button.</p><div class="mq9-row"><button type="button" class="button primary" data-mq9="glow-yes">Let's glow</button><button type="button" class="button quiet" data-mq9="glow-no">Not now</button></div>`)};
const _stop=stopLocationShare;
stopLocationShare=function(){const r=_stop.apply(this,arguments);paintGlow();return r};
function glowing(){
  try{return !!state.user&&livePresence().some(x=>!x.remote&&String(x.code)===String(state.user.code))}catch(e){return false}}
function paintGlow(){
  const b=document.querySelector('.location-tool');if(!b)return;
  const on=glowing();b.classList.toggle('glow',on);
  b.setAttribute('aria-label',on?'You are glowing on the map. Tap to switch off':'Share your current location, optional');
  b.setAttribute('aria-pressed',on?'true':'false')}
setInterval(paintGlow,1500);

/* ---------- sticker photo notice ---------- */
window.mqPhotoConsentBox=function(){
  return `<div class="mq9-consent"><p>Nice find! 📸 We might share your photo on our social media — so keep faces out of the shot, just the sticker please! 🙂</p><label class="mq9-check"><input type="checkbox" name="photoOk"> <span>Sounds good!</span></label></div>`};
window.mqPhotoConsentOk=function(f){return !!(f&&f.elements&&f.elements.photoOk&&f.elements.photoOk.checked)};

/* ---------- announcements banner on the main screen ---------- */
function seen(){try{return JSON.parse(localStorage.getItem('mq-banner-seen')||'[]')}catch(e){return []}}
function markSeen(id){try{const a=seen();if(!a.includes(id)){a.push(id);localStorage.setItem('mq-banner-seen',JSON.stringify(a.slice(-40)))}}catch(e){}}
function drawBanner(){
  const w=document.querySelector('.map-world');let el=document.getElementById('mq-banner');
  const now=Date.now(),s=seen();
  const list=(window.mqBanners||[]).filter(b=>b.text&&b.endsAt>now&&b.startsAt<=now+120000&&!s.includes(b.id));
  const b=list[list.length-1];
  if(!w||!b){if(el)el.remove();return}
  if(el&&el.dataset.id===b.id)return;
  if(el)el.remove();
  el=document.createElement('div');el.id='mq-banner';el.className='mq-banner';el.dataset.id=b.id;el.setAttribute('role','status');
  el.innerHTML=`<span class="mq-banner-e" aria-hidden="true">${E(b.emoji)}</span><p>${E(b.text)}</p><button type="button" data-mq9="banner-x" aria-label="Close announcement">×</button>`;
  w.appendChild(el)}
function badge(){try{const el=document.querySelector('[data-unread-count]');if(!el)return;const n=unreadNews();el.textContent=n||'';el.hidden=!n}catch(e){}}
window.mqDrawBanner=function(){badge();drawBanner()};
window.mqBannersToNews=function(){
  try{const list=window.mqBanners||[];if(!state.user||!list.length)return;
    state.newsPages=state.newsPages||[];let add=false;
    list.forEach(b=>{const id='bn-'+b.id;if(!b.text||state.newsPages.some(n=>n.id===id))return;
      state.newsPages.unshift({id,title:(b.emoji||'📣')+' Announcement',body:b.text,type:'announcement',banner:true});add=true});
    if(add){let k=0;state.newsPages=state.newsPages.filter(n=>!n.banner||++k<=30);save()}}catch(e){}}
setTimeout(()=>{if(window.mqBannersToNews)mqBannersToNews()},2500);
const _menu=menu;
menu=function(){const r=_menu.apply(this,arguments);setTimeout(()=>{drawBanner();paintGlow()},80);return r};
setInterval(drawBanner,15000);setTimeout(drawBanner,2500);

document.addEventListener('click',e=>{
  const t=e.target.closest('.location-tool');
  if(t&&glowing()){e.stopPropagation();e.preventDefault();stopLocationShare();toast("You're off the map. See you in the dark! 🌙");return}
  const b=e.target.closest('[data-mq9]');if(!b)return;
  const a=b.dataset.mq9;
  if(a==='close'){closeModal();return}
  if(a==='glow-no'){if(state.user){state.user.glowSeen=true;save()}closeModal();return}
  if(a==='glow-yes'){if(state.user){state.user.glowSeen=true;save()}closeModal();_share();setTimeout(paintGlow,1500);setTimeout(paintGlow,4000);return}
  if(a==='banner-x'){const el=document.getElementById('mq-banner');if(el){markSeen(el.dataset.id);el.remove()}return}
},true);
})();

/* ===== social links, wardrobe, open chat, removed-player screen ===== */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICONS={
 ig:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".8" fill="currentColor"/></svg>',
 web:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.600 5.900 12 3.500z"/></svg>',
 tg:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4 3.5 11l5.5 2 2 6 3-4 4.500 3.300z"/><path d="m9 13 7.500-5.500"/></svg>'};
const LINKS=[['ig','Instagram','https://www.instagram.com/zirkus_mond/'],['web','Website zirkusmond.de','https://zirkusmond.de/'],['tg','Telegram group','https://t.me/+bTzQFVB2cHc5b4Zm']];
window.mqSocialHtml=function(){
  return `<nav class="mq9-social" aria-label="Zirkus Mond on the web">${LINKS.map(l=>`<a href="${l[2]}" target="_blank" rel="noopener noreferrer" aria-label="${l[1]}">${ICONS[l[0]]}</a>`).join('')}</nav>`};

/* ---------- removed from the app ---------- */
window.mqIsBanned=function(){return window.__mqBanned===true};
window.mqBanned=function(){
  window.__mqBanned=true;
  const a=document.getElementById('app');if(!a||a.querySelector('.mq9-removed'))return;
  a.innerHTML=`<main class="onboarding mq9-removed"><section class="onboard-panel"><div class="onboard-emblem" aria-hidden="true">☾</div><h1>Your Lunito has landed</h1><p>This account has been removed from MondQuest. If you think this is a mistake, please talk to the Zirkus Mond team.</p>${mqSocialHtml()}</section></main>`};
setInterval(()=>{if(window.__mqBanned)mqBanned()},1500);

/* ---------- wardrobe ---------- */
const DEF={hairStyle:'tuft',headgear:'none',suitStyle:'plain'};
const KEY={hairStyle:'hairStyle',headgear:'headgear',suitStyle:'suitStyle'};
function ensure(){state.accessories=state.accessories||{owned:[],equipped:[]};state.accessories.owned=state.accessories.owned||[];state.accessories.equipped=state.accessories.equipped||[];state.gadgets=state.gadgets||{owned:[],equipped:[]};state.gadgets.owned=state.gadgets.owned||[];state.gadgets.equipped=state.gadgets.equipped||[]}
function worn(c){return KEY[c.kind]?state.user[KEY[c.kind]]===c.value:state.accessories.equipped.includes(c.id)}
function ownedCos(){return CONFIG.cosmetics.filter(c=>{if(KEY[c.kind]&&c.value===DEF[c.kind])return false;return state.accessories.owned.includes(c.id)||(!c.cost&&KEY[c.kind])})}
function gadgetSvg(g){return `<svg viewBox="0 0 48 48" fill="none" stroke="#1a1250" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.icon}</svg>`}
window.wardrobeScreen=function(){
  ensure();if(!state.user){go('welcome');return}
  const cos=ownedCos(),gads=(typeof mqGadgets==='function'?mqGadgets():[]).filter(g=>state.gadgets.owned.includes(g.id));
  const card=(kind,id,icon,name,on)=>`<button type="button" class="mq9-item ${on?'on':''}" data-mq9="wear" data-kind="${kind}" data-id="${E(id)}" aria-pressed="${on?'true':'false'}"><span class="mq9-ico" aria-hidden="true">${icon}</span><b>${E(name)}</b><small>${on?'Wearing · tap to take off':'In your bag · tap to wear'}</small></button>`;
  const items=cos.map(c=>card('c',c.id,c.emoji,c.name,worn(c))).concat(gads.map(g=>card('g',g.id,gadgetSvg(g),g.name,state.gadgets.equipped.includes(g.id))));
  shell(`<section class="card mq9-wardrobe"><button class="button quiet small" data-view="courier">← Profile</button><div class="eyebrow">YOUR WARDROBE</div><h1>Wardrobe</h1><div class="mq9-preview">${courierSvg(state.user)}</div><p class="small">Tap anything to put it on or take it off. Nothing is ever lost — it all stays yours.</p><div class="mq9-items">${items.length?items.join(''):'<p class="small">Your bag is empty for now. Spend a few Mondinos in the shop or craft a gadget in Cargo and it will show up here!</p>'}</div><div class="actions"><button type="button" class="button quiet" data-mq9="reset-look">Reset look</button></div></section>`)};
function wearToggle(kind,id){
  ensure();
  if(kind==='c'){const c=CONFIG.cosmetics.find(x=>x.id===id);if(!c)return;
    if(KEY[c.kind]){const k=KEY[c.kind];state.user[k]=state.user[k]===c.value?DEF[c.kind]:c.value}
    else{const a=state.accessories.equipped,i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id)}}
  else{const a=state.gadgets.equipped,i=a.indexOf(id);if(i>=0)a.splice(i,1);else{if(a.length>=3)a.shift();a.push(id)}}
  save();if(!wardrobeSync()){const v=document.querySelector('.view'),top=v?v.scrollTop:0;wardrobeScreen();const v2=document.querySelector('.view');if(v2)v2.scrollTop=top}}
/* update the page in place (no full redraw): keeps the scroll alive on iOS Safari */
function wardrobeSync(){
  try{const items=document.querySelectorAll('.mq9-wardrobe .mq9-item');if(!items.length)return false;
    items.forEach(b=>{const k=b.dataset.kind,id=b.dataset.id;let on=false;
      if(k==='c'){const c=CONFIG.cosmetics.find(x=>x.id===id);on=!!c&&worn(c)}else on=state.gadgets.equipped.includes(id);
      b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');const sm=b.querySelector('small');if(sm)sm.textContent=on?'Wearing · tap to take off':'In your bag · tap to wear'});
    const pv=document.querySelector('.mq9-wardrobe .mq9-preview');if(pv)pv.innerHTML=courierSvg(state.user);return true}catch(e){return false}}
function resetLook(){ensure();state.accessories.equipped=[];state.gadgets.equipped=[];Object.keys(DEF).forEach(k=>{state.user[k]=DEF[k]});save();wardrobeScreen();toast('Fresh as a new Lunito! Everything is still in your bag.')}

/* ---------- open chat: one shared channel, no private messages, slides out from the map ---------- */
let unread=0,lastPeek=0,msgs=[],muted=[],timer=null,canPost=true,note='',noteAt=0,enabled=true,open=false;
try{muted=JSON.parse(localStorage.getItem('mq-chat-muted')||'[]')}catch(e){}
const saveMuted=()=>{try{localStorage.setItem('mq-chat-muted',JSON.stringify(muted))}catch(e){}};
const hhmm=ms=>{try{return new Date(ms).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
function list(){
  const l=msgs.filter(m=>m.me||!muted.includes(m.pid));
  if(!l.length)return '<p class="small mq9-empty">Quiet on the moon right now. Say hi! 👋</p>';
  return l.map(m=>`<article class="mq9-msg ${m.me?'me':''}"><span class="mq9-av">${courierSvg({...CONFIG.look.defaults,...(m.look||{})})}</span><div><b>${E(m.name)}</b> <small>${hhmm(m.at)}</small><p>${E(m.text)}</p></div>${m.me?'':`<button type="button" class="mq9-mute" data-mq9="mute" data-pid="${E(m.pid)}" aria-label="Hide messages from ${E(m.name)}" title="Hide messages from ${E(m.name)}">🔇</button>`}</article>`).join('')}
const readGet=()=>{try{return +localStorage.getItem('mq-chat-read')||0}catch(e){return 0}};
const readSet=t=>{try{localStorage.setItem('mq-chat-read',String(t))}catch(e){}};
function paintBadge(){const b=document.getElementById('mq9-chatbtn');if(!b)return;let k=b.querySelector('.mq9-badge');
  if(open||!unread){if(k)k.remove();b.setAttribute('aria-label','Moon chat');return}
  if(!k){k=document.createElement('span');k.className='mq9-badge';b.appendChild(k)}
  k.textContent=unread>99?'99+':String(unread);b.setAttribute('aria-label','Moon chat, '+unread+' unread')}
async function peek(){
  if(open||document.hidden||!window.mqChatEnabled||!window.mqChat||!state.user||!document.querySelector('.map-world'))return;
  if(!readGet())readSet(Date.now());
  try{const r=await mqChat.peek(readGet(),muted);if(r&&r.enabled!==false){unread=r.unread||0;paintBadge()}}catch(e){}}
function markRead(){const t=msgs.reduce((m,x)=>Math.max(m,x.at||0),0);if(t)readSet(Math.max(readGet(),t));unread=0;paintBadge()}
function paint(){
  const l=document.getElementById('mq9-chatlist');if(!l)return;
  const near=l.scrollHeight-l.scrollTop-l.clientHeight<70;l.innerHTML=list();if(near)l.scrollTop=l.scrollHeight;
  const er=document.getElementById('mq9-chaterr');if(er)er.textContent=note;
  const f=document.getElementById('mq9-form');if(f)f.hidden=!canPost||!enabled;
  const off=document.getElementById('mq9-off');if(off)off.hidden=enabled;
  const np=document.getElementById('mq9-nopost');if(np)np.hidden=!(enabled&&!canPost)}
async function poll(text){
  if(!window.mqChat)return;
  try{const r=await mqChat.sync(text);msgs=r.messages||[];canPost=r.canPost!==false;enabled=r.enabled!==false;if(Date.now()-noteAt>5000)note='';
    if(!enabled){window.mqChatEnabled=false;closePanel();paintChatBtn();return}}catch(e){note=e.message||'Chat is taking a nap.';noteAt=Date.now()}
  markRead();paint()}
function panelHtml(){
  return `<div class="mq9-panel-head"><b>💬 Moon chat</b><button type="button" data-mq9="chat-x" aria-label="Close chat">×</button></div><p class="mq9-rules">One open channel for all Lunitos. No private messages. Be kind and don't share personal details.</p><p id="mq9-off" class="mq9-off" hidden>Moon chat is resting right now. 🌙</p><div id="mq9-chatlist" class="mq9-chatlist" aria-live="polite">${list()}</div><p id="mq9-chaterr" class="small mq9-err"></p><p id="mq9-nopost" class="small" hidden>You can read the chat, but posting is switched off for you right now.</p><form id="mq9-form" class="mq9-form" autocomplete="off"><input name="t" maxlength="140" placeholder="Say something nice…" aria-label="Your message"><button class="button primary" type="submit">Send</button></form>`}
function openPanel(){
  const w=document.querySelector('.map-world');if(!w||!window.mqChatEnabled||!window.mqChat)return;
  closePanel();open=true;unread=0;paintBadge();
  const p=document.createElement('section');p.id='mq9-panel';p.className='mq9-panel';p.setAttribute('aria-label','Moon chat');p.innerHTML=panelHtml();w.appendChild(p);
  const b=document.getElementById('mq9-chatbtn');if(b)b.setAttribute('aria-expanded','true');
  poll();clearInterval(timer);timer=setInterval(()=>{if(!open||!document.getElementById('mq9-panel')){clearInterval(timer);return}if(!document.hidden)poll()},6000);
  setTimeout(()=>{const l=document.getElementById('mq9-chatlist');if(l)l.scrollTop=l.scrollHeight},80)}
function closePanel(){open=false;clearInterval(timer);const p=document.getElementById('mq9-panel');if(p)p.remove();const b=document.getElementById('mq9-chatbtn');if(b)b.setAttribute('aria-expanded','false')}
function paintChatBtn(){
  const w=document.querySelector('.map-world');let b=document.getElementById('mq9-chatbtn');
  const on=!!w&&window.mqChatEnabled===true&&!!window.mqChat&&!!state.user;
  if(!on){if(b)b.remove();if(!w)closePanel();else if(document.getElementById('mq9-panel')&&!window.mqChatEnabled)closePanel();return}
  if(b&&w.contains(b))return;
  b=document.createElement('button');b.id='mq9-chatbtn';b.type='button';b.className='world-shortcut chat-shortcut';b.dataset.mq9='chat-toggle';
  b.setAttribute('aria-label','Moon chat');b.setAttribute('aria-expanded',open?'true':'false');b.title='Moon chat';
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.3A8 8 0 1 1 21 12z"/><circle cx="9" cy="12" r=".6" fill="currentColor"/><circle cx="13" cy="12" r=".6" fill="currentColor"/><circle cx="17" cy="12" r=".6" fill="currentColor"/></svg>';
  w.appendChild(b);paintBadge()}
window.mqPaintChat=paintChatBtn;window.mqChatPeek=peek;
setInterval(peek,25000);setTimeout(peek,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(peek,800)});
window.chatScreen=function(){go('menu');setTimeout(()=>{paintChatBtn();openPanel()},350)};
const _menu2=menu;menu=function(){const r=_menu2.apply(this,arguments);open=false;setTimeout(paintChatBtn,100);return r};
setInterval(paintChatBtn,3000);setTimeout(paintChatBtn,2500);
setInterval(()=>{if(!document.hidden&&window.mqSheet&&mqSheet.loadConfig)mqSheet.loadConfig().then(()=>{paintChatBtn();if(window.mqDrawBanner)mqDrawBanner()})},45000);
document.addEventListener('submit',e=>{
  const f=e.target.closest('#mq9-form');if(!f)return;e.preventDefault();
  const i=f.elements.t,t=i.value.trim();if(!t)return;
  i.value='';poll(t)});

/* ---------- social links at the end of Cargo, Profile and News ---------- */
const SOCIAL_VIEWS=['shop','courier','announcements'];
const _shell=shell;
shell=function(){const r=_shell.apply(this,arguments);
  try{if(SOCIAL_VIEWS.includes(currentView)){const cards=document.querySelectorAll('.view section.card, .view > section');const last=cards[cards.length-1]||document.querySelector('.view');
    if(last&&!last.querySelector('.mq9-social')){last.insertAdjacentHTML('beforeend',mqSocialHtml())}}
    if(currentView==='settings'){const c=document.querySelector('.view section.card, .view > section');if(c&&!c.querySelector('.mq9-build'))c.insertAdjacentHTML('beforeend','<p class="small mq9-build">MondQuest build 25 · 25 Nov 2026'+(window.mqEcon&&mqEcon.queue?(mqEcon.queue().length?' · '+mqEcon.queue().length+' action(s) waiting to sync':' · all saved'):'')+'</p>')}}catch(e){}
  return r};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-mq9]');if(!b)return;const a=b.dataset.mq9;
  if(a==='wear'){wearToggle(b.dataset.kind,b.dataset.id);return}
  if(a==='reset-look'){
    const o=document.createElement('div');o.className='mq9-modal';o.id='mq9-modal';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    o.innerHTML=`<div class="mq9-box"><div class="mq9-emoji" aria-hidden="true">🪄</div><h2>Reset your look?</h2><p>Everything comes off, like when you first landed. Nothing is lost — it all stays in your bag and you can wear it again anytime.</p><div class="mq9-row"><button type="button" class="button primary" data-mq9="reset-yes">Yes, reset</button><button type="button" class="button quiet" data-mq9="close">Keep my look</button></div></div>`;
    document.body.appendChild(o);return}
  if(a==='reset-yes'){const m=document.getElementById('mq9-modal');if(m)m.remove();resetLook();return}
  if(a==='chat-toggle'){if(document.getElementById('mq9-panel'))closePanel();else openPanel();return}
  if(a==='chat-x'){closePanel();return}
  if(a==='mute'){const pid=b.dataset.pid;if(pid&&!muted.includes(pid)){muted.push(pid);saveMuted();paint();toast('Hidden for you. 🔇')}return}
});
})();


/* ===== recover a Lunito with its code or QR, and map zoom buttons ===== */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* link on the welcome screen */
const _welcome=welcome;
welcome=function(){const r=_welcome.apply(this,arguments);
  try{const foot=document.querySelector('.onboard-panel .onboard-foot');
    if(foot&&!document.querySelector('[data-mq9=recover]'))foot.insertAdjacentHTML('beforebegin','<button type="button" class="button quiet onboard-next" data-mq9="recover">I already have a Lunito</button>')}catch(e){}
  return r};

function recoverScreen(msg){
  app.innerHTML=`<main class="onboarding"><section class="onboard-panel"><div class="onboard-emblem" aria-hidden="true">☾</div><p class="onboard-step">WELCOME BACK</p><h1>Bring your Lunito back</h1><p>Type the code from your Profile (it looks like MQ-ABC123), or scan your QR from another phone.</p><label class="onboard-field">Your Lunito code<input id="mq9-rec" maxlength="24" placeholder="MQ-ABC123" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><p id="mq9-recmsg" class="mq9-err" role="status">${E(msg||'')}</p><button type="button" class="button primary onboard-next" data-mq9="rec-go">Recover my Lunito</button><button type="button" class="button onboard-next" data-mq9="rec-scan">📷 Scan my QR</button><button type="button" class="button quiet onboard-next" data-mq9="rec-back">← Back</button><p class="onboard-foot">Keep your code and QR private: anyone who has them can open your Lunito.</p></section></main>`;
  const i=document.getElementById('mq9-rec');if(i)i.addEventListener('keydown',e=>{if(e.key==='Enter')doRecover(i.value)})}
function say(t){const m=document.getElementById('mq9-recmsg');if(m)m.textContent=t}
let busy=false;
async function doRecover(raw){
  const code=String(raw||'').trim().toUpperCase().replace(/^MQ:/,'');
  if(!/^[A-Z0-9\-]{3,24}$/.test(code)){say('Type the code exactly as it appears in your Profile.');return}
  if(!window.mqRecover){say('Recovery needs the app to be connected to the circus. Try again when you are online.');return}
  if(busy)return;busy=true;say('Looking for your Lunito…');
  try{const r=await mqRecover(code);apply(r);}catch(e){say(e.message||'Something went wrong. Try again.')}finally{busy=false}}
function apply(r){
  const P=r.player,X=r.extras||{},L=X.look||{};
  Object.assign(state,fresh());
  state.user={id:P.code,name:P.name,code:P.code,avatar:AVATARS[0],...CONFIG.look.defaults,...L,createdAt:X.at||Date.now(),age:''};
  state.wallet=Number(P.wallet)||0;state.earned=Number(P.earned)||0;
  state.inventory={...state.inventory,flyers:P.flyers,posters:P.posters,stickers:P.stickers};
  state.accessories={owned:(X.acc&&X.acc.o)||[],equipped:(X.acc&&X.acc.e)||[]};
  state.gadgets={owned:(X.gad&&X.gad.o)||[],equipped:(X.gad&&X.gad.e)||[]};
  if(X.min)state.minerals={...{meteor:0,comet:0,nebula:0,void:0,rings:0},...X.min};
  if(X.ch!=null)state.chests=X.ch;
  state.guideDone=true;state.playerCodes=[P.code];
  state.__sync={lastAt:Date.now(),reqs:[],places:[],applied:[],ack:[],pk:[]};
  save();go('menu');toast('Welcome back, '+P.name+'! 🌙')}
async function loadScan(){
  const add=src=>new Promise((ok,no)=>{const x=document.createElement('script');x.src=src;x.onload=ok;x.onerror=()=>no(new Error('scanner'));document.head.appendChild(x)});
  if(!window.jsQR)await add('vendor/qr/jsQR.js?v=10');
  if(!window.QrScan)await add('js/qrscan.js?v=10')}

document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-mq9]');if(!b)return;const a=b.dataset.mq9;
  if(a==='recover'){recoverScreen();return}
  if(a==='rec-back'){go('welcome');return}
  if(a==='rec-go'){doRecover(document.getElementById('mq9-rec').value);return}
  if(a==='rec-scan'){
    try{say('Opening the camera…');await loadScan();say('');
      QrScan.open(code=>{const i=document.getElementById('mq9-rec');if(i)i.value=code;doRecover(code)},{title:'Scan your Lunito QR',hint:'Point the camera at the QR code in your Profile on your other phone.'})}
    catch(err){say('The scanner could not start. You can type your code instead.')}return}
  if(a==='zoom-in'||a==='zoom-out'){
    if(typeof leafletInstance!=='undefined'&&leafletInstance&&leafletInstance.zoomIn){a==='zoom-in'?leafletInstance.zoomIn():leafletInstance.zoomOut()}
    else toast('The map is offline right now.');return}
});

/* note under the profile QR (before the social icons) */
const _shell2=shell;
shell=function(){const r=_shell2.apply(this,arguments);
  try{if(currentView==='courier'){const cards=document.querySelectorAll('.view section.card, .view > section');const last=cards[cards.length-1];
    if(last&&!last.querySelector('.mq9-keep')){const n=document.createElement('p');n.className='small mq9-keep';n.textContent='💡 Save a screenshot of your QR or write down your code. With it you can bring your Lunito back on any phone.';const soc=last.querySelector('.mq9-social');soc?last.insertBefore(n,soc):last.appendChild(n)}}}catch(e){}
  return r};

/* zoom + / − above the Center button */
function placeZoom(){
  const w=document.querySelector('.map-world'),z=document.getElementById('mq9-zoom'),c=document.querySelector('.map-world .center-tool');
  if(!w||!z||!c)return;
  const wr=w.getBoundingClientRect(),cr=c.getBoundingClientRect();
  if(!cr.width)return;
  z.classList.add('ready')}
window.mqPlaceZoom=placeZoom;
function paintZoom(){
  const w=document.querySelector('.map-world');if(!w)return;
  if(!document.getElementById('mq9-zoom')){
    const z=document.createElement('div');z.id='mq9-zoom';z.className='mq9-zoom';
    z.innerHTML='<button type="button" data-mq9="zoom-in" aria-label="Zoom in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button><button type="button" data-mq9="zoom-out" aria-label="Zoom out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>';
    w.appendChild(z)}
  placeZoom()}
const _menu3=menu;menu=function(){const r=_menu3.apply(this,arguments);setTimeout(paintZoom,120);setTimeout(placeZoom,600);return r};
window.addEventListener('resize',()=>setTimeout(placeZoom,100));window.addEventListener('orientationchange',()=>setTimeout(placeZoom,300));
setInterval(paintZoom,3000);setTimeout(paintZoom,2500);
})();

/* hide the side buttons while the menu sheet is open (fallback for browsers without :has) */
(function(){
'use strict';
function sync(){const w=document.querySelector('.map-world');if(!w)return;const on=!!w.querySelector('.lunar-sheet');if(w.classList.contains('mq9-sheet')!==on){w.classList.toggle('mq9-sheet',on);if(!on&&window.mqPlaceZoom)setTimeout(mqPlaceZoom,60)}}
new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
})();
