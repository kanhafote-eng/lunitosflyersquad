/* MondQuest · Settings, moon-menu toggle, optional sounds. Loaded after 06-sheet.js, before 05-start.js */
(function(){
  const KEY='mq-settings',DEF={sound:true,places:true,sightings:false};
  let S=Object.assign({},DEF);
  try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
  window.mqSettings=()=>S;
  try{showPlaceMarkers=!!S.places;showSpottedMarkers=!!S.sightings}catch(e){}

  /* ---------- sounds (WebAudio, no files) ---------- */
  let ac=null;
  function tone(freqs,dur,vol){
    if(!S.sound)return;
    try{
      ac=ac||new (window.AudioContext||window.webkitAudioContext)();
      if(ac.state==='suspended')ac.resume();
      const t0=ac.currentTime;
      freqs.forEach((f,i)=>{
        const o=ac.createOscillator(),g=ac.createGain(),t=t0+i*dur;
        o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+.012);
        g.gain.exponentialRampToValueAtTime(.0001,t+dur*1.7);
        o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur*1.9);
      });
    }catch(e){}
  }
  window.mqSfx=k=>k==='coin'?tone([784,1175],.09,.05):k==='error'?tone([233,196],.1,.05):tone([587],.05,.025);
  if(typeof toast==='function'){
    const baseToast=toast;
    toast=function(m){
      baseToast(m);
      const s=String(m||'');
      mqSfx(/not enough|could not|unlocks at|required|unavailable|no chests|choose|first/i.test(s)?'error':/\+|earn|verified|purchas|complete|saved|updated|equipped|collected|submitted/i.test(s)?'coin':'tick');
    };
  }

  /* ---------- theme ---------- */
  function setTheme(t){
    t=t==='day'?'day':'night';
    document.documentElement.dataset.theme=t;
    try{localStorage.setItem('mq-theme',t)}catch(e){}
    const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='day'?'#1F4BFF':'#0B1B6B';
  }

  /* ---------- settings screen ---------- */
  const sw=(key,title,sub)=>`<div class="set-row"><div><b>${title}</b><small>${sub}</small></div><button type="button" class="switch" role="switch" aria-label="${title}" aria-checked="${S[key]?'true':'false'}" data-mq-set="${key}"><i></i></button></div>`;
  window.settingsScreen=function(){
    const th=document.documentElement.dataset.theme==='day'?'day':'night';
    shell(`<section class="card settings"><div class="eyebrow">CONTROL PANEL</div><h1>Settings</h1>
      <h2>Look</h2>
      <div class="seg" role="group" aria-label="Theme">
        <button type="button" class="button ${th==='night'?'primary':''}" data-set-theme="night" aria-pressed="${th==='night'}">Night mode</button>
        <button type="button" class="button ${th==='day'?'primary':''}" data-set-theme="day" aria-pressed="${th==='day'}">Day mode</button>
      </div>
      <h2>Sound</h2>
      ${sw('sound','Sounds','Soft taps and coin chimes')}
      <h2>Map</h2>
      ${sw('places','Distribution places','Show place pins on the map')}
      ${sw('sightings','Sticker sightings','Show reported stickers on the map')}
      <h2>Location</h2>
      <p class="small">Sharing is always optional. While you share, other players can see your approximate position (about 100 m) on the map for up to 30 minutes. Tap “Stop sharing” to disappear at once.</p>
      <div class="actions"><button type="button" class="button quiet" data-action="location-on">Share my location now</button><button type="button" class="button quiet" data-action="location-off">Stop sharing</button></div>
      <div id="online-list" class="online-list">Checking who is online…</div>
      <div class="actions"><button type="button" class="button quiet" data-view="players">See players online</button></div>
      <h2>Help</h2>
      <div class="actions"><button type="button" class="button quiet" data-mq-act="replay">Replay the how-to-play guide</button></div>
      <h2>This device</h2>
      <p class="small">Signs you out here and clears what is saved in this browser. Anything already synced to Zirkus Mond stays safe.</p>
      <div class="actions"><button type="button" class="button danger" data-mq-act="reset">Sign out &amp; clear this device</button></div>
      <p class="small set-about">MondQuest · Flyer pickup: Zirkus Mond, Rudolfplatz 14c, Berlin</p>
    </section>`);
    try{refreshPresenceList()}catch(e){}
  };

  document.addEventListener('click',function(e){
    const t=e.target.closest('[data-set-theme]');
    if(t){setTheme(t.dataset.setTheme);settingsScreen();return}
    const s=e.target.closest('[data-mq-set]');
    if(s){
      const k=s.dataset.mqSet;S[k]=!S[k];persist();
      if(k==='places'){try{showPlaceMarkers=S.places;refreshMarkers()}catch(x){}}
      if(k==='sightings'){try{showSpottedMarkers=S.sightings;refreshMarkers()}catch(x){}}
      s.setAttribute('aria-checked',S[k]?'true':'false');
      if(k==='sound')mqSfx('coin');
      return;
    }
    const a=e.target.closest('[data-mq-act]');
    if(a){
      if(a.dataset.mqAct==='replay'){state.guideDone=false;save();guide();return}
      if(a.dataset.mqAct==='reset'){
        if(a.dataset.sure!=='1'){a.dataset.sure='1';a.textContent='Tap again to confirm';setTimeout(()=>{if(a.isConnected){a.dataset.sure='';a.textContent='Sign out & clear this device'}},4000);return}
        try{localStorage.removeItem(CONFIG.storageKey)}catch(x){}
        location.reload();
      }
      return;
    }
    /* soft tap sound on any button */
    if(e.target.closest('button,.button'))mqSfx('tick');
  });

  /* ---------- moon menu: toggle + tap outside ---------- */
  function closeSheet(){
    const sh=document.querySelector('.lunar-sheet');
    if(!sh)return false;
    sh.remove();
    if(currentView==='more')currentView='menu';
    return true;
  }
  document.addEventListener('click',function(e){
    const sheet=document.querySelector('.lunar-sheet');
    if(!sheet)return;
    const tgt=e.target;
    if(tgt.closest('.lunar-sheet'))return;
    if(tgt.closest('.moon-menu')){e.preventDefault();e.stopImmediatePropagation();closeSheet();return}
    if(tgt.closest('#toast-root'))return;
    /* any other tap outside: close; swallow it when it lands on the bare map so no pin/popup opens by accident */
    const onMap=tgt.closest('.leaflet-container')&&!tgt.closest('button,a,.button,.float-actions,.map-hud');
    closeSheet();
    if(onMap){e.preventDefault();e.stopImmediatePropagation()}
  },true);

  /* ---------- player QR code ---------- */
  window.mqQrSvg=function(text,cell){
    try{const q=qrcode(0,'M');q.addData(text);q.make();return q.createSvgTag({cellSize:cell||5,margin:3,scalable:true})}catch(e){return ''}
  };
  window.mqQrCard=function(){
    const code=String(state.user?.code||'');
    const d=document.createElement('section');d.className='card qr-card';
    d.innerHTML=`<div class="eyebrow">YOUR PLAYER QR</div><div class="qr-box" role="img" aria-label="QR code for player ${esc(code)}">${code?mqQrSvg('MQ:'+code):''}</div><p class="player-code">PLAYER CODE<br><strong>${esc(code||'MQ-PENDING')}</strong></p><p class="small">Show this QR to the staff: they scan it to approve your pickups and hand over prizes.</p>`;
    return d};
  const baseCourier=courier;
  courier=function(){baseCourier();const v=document.querySelector('.view');if(v&&state.user?.code)v.insertBefore(mqQrCard(),v.firstChild)};

  /* ---------- players online screen ---------- */
  let lastFetch=0;
  const ago=ms=>{const m=Math.max(0,Math.round((Date.now()-ms)/60000));return m<1?'just now':m+' min ago'};
  window.playersScreen=function(){
    const P=window.mqPresence;
    let sharing,online;
    if(P){sharing=P.sharing().filter(x=>!x.me);online=P.online().filter(x=>!x.me&&!x.sharing)}
    else{sharing=livePresence().filter(x=>String(x.code)!==String(state.user?.code)).map(x=>({name:x.name,lat:x.lat,lng:x.lng,updatedAt:x.updatedAt}));online=[]}
    const mine=livePresence().some(x=>!x.remote&&String(x.code)===String(state.user?.code));
    shell(`<section class="card"><div class="eyebrow">COMMUNITY · LIVE</div><h1>Players online</h1>
      <p class="small">Players seen in the last 5 minutes. Those who share their location appear on the map for up to 30 minutes.</p>
      <p><b>You are ${mine?'sharing your location':'not sharing your location'}.</b></p>
      <div class="actions"><button type="button" class="button quiet" data-action="location-on">Share my location</button><button type="button" class="button quiet" data-action="location-off">Stop sharing</button><button type="button" class="button quiet" data-mq-act="players-refresh">Refresh</button></div>
      <h2>Sharing location (${sharing.length})</h2>
      ${sharing.length?sharing.map(x=>`<div class="set-row"><div><b>${esc(x.name)}</b><small>Updated ${ago(x.updatedAt)} · approximate position</small></div><button type="button" class="button small" data-mq-focus="${x.lat},${x.lng}">Show on map</button></div>`).join(''):'<p class="small">Nobody is sharing their location right now.</p>'}
      <h2>Online, not sharing (${online.length})</h2>
      ${online.length?online.map(x=>`<div class="set-row"><div><b>${esc(x.name)}</b><small>Online now</small></div></div>`).join(''):'<p class="small">No other players online.</p>'}
    </section>`);
    if(window.mqSheet&&Date.now()-lastFetch>8000){lastFetch=Date.now();window.mqSheet.presence()}
  };
  document.addEventListener('click',function(e){
    const f=e.target.closest('[data-mq-focus]');
    if(f){const [la,ln]=f.dataset.mqFocus.split(',').map(Number);go('menu');setTimeout(()=>{try{leafletInstance&&leafletInstance.setView([la,ln],16)}catch(x){}},700);return}
    if(e.target.closest('[data-mq-act="players-refresh"]')){lastFetch=0;playersScreen()}
  });
})();
