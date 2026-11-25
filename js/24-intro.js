/* MondQuest · build 23: optional intro video. Never autoplays: it only starts when someone taps the button. */
(function(){'use strict';
const SRC='assets/intro.mp4',POSTER='assets/intro-poster.jpg';
let ov=null,lastFocus=null;
function close(){if(!ov)return;try{const v=ov.querySelector('video');v.pause();v.removeAttribute('src');v.load()}catch(e){}ov.remove();ov=null;document.removeEventListener('keydown',onKey,true);
  try{localStorage.setItem('mq-intro-seen','1')}catch(e){}
  if(lastFocus&&document.body.contains(lastFocus))try{lastFocus.focus()}catch(e){}
  const n=document.getElementById('new-name');if(n&&lastFocus&&lastFocus.classList.contains('mq-introbtn'))try{n.focus({preventScroll:true})}catch(e){}}
function onKey(e){if(e.key==='Escape'){e.stopPropagation();close()}}
function open(){if(ov)return;lastFocus=document.activeElement;
  ov=document.createElement('div');ov.className='mq-intro-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','MondQuest intro video');
  ov.innerHTML=`<video class="mq-intro-v" playsinline webkit-playsinline preload="auto" poster="${POSTER}" src="${SRC}"></video>
   <button type="button" class="mq-intro-x" aria-label="Close video">✕</button>
   <div class="mq-intro-end" hidden><p>That's MondQuest!</p><button type="button" class="button" data-intro-act="again">↻ Watch again</button><button type="button" class="button primary" data-intro-act="go">Let's play</button></div>
   <p class="mq-intro-err" hidden>The video could not load. Check your connection and try again.</p>`;
  document.body.appendChild(ov);document.addEventListener('keydown',onKey,true);
  const v=ov.querySelector('video'),end=ov.querySelector('.mq-intro-end'),err=ov.querySelector('.mq-intro-err');
  v.addEventListener('ended',()=>{end.hidden=false;try{end.querySelector('[data-intro-act=go]').focus()}catch(e){}});
  v.addEventListener('error',()=>{err.hidden=false});
  v.addEventListener('click',()=>{if(v.paused)v.play().catch(()=>{});else v.pause()});
  ov.querySelector('.mq-intro-x').addEventListener('click',close);
  end.addEventListener('click',e=>{const a=e.target.closest('[data-intro-act]');if(!a)return;if(a.dataset.introAct==='again'){end.hidden=true;v.currentTime=0;v.play().catch(()=>{})}else close()});
  v.play().catch(()=>{/* the controls overlay is shown by tapping the video */});
  try{ov.querySelector('.mq-intro-x').focus({preventScroll:true})}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-mq-intro]');if(b){e.preventDefault();open()}});
/* welcome screen: a clear, optional button above the nickname form */
const _w=welcome;
welcome=function(){const r=_w.apply(this,arguments);
  try{const p=document.querySelector('.onboard-panel');
    if(p&&!p.querySelector('.mq-introbtn')){const b=document.createElement('button');b.type='button';b.className='mq-introbtn';b.setAttribute('data-mq-intro','');b.setAttribute('aria-label','Watch the intro video');
      b.innerHTML=`<span class="mq-introbtn-img"><img src="${POSTER}" alt="" loading="lazy" width="54" height="96"><span class="mq-introbtn-play" aria-hidden="true">▶</span></span><span class="mq-introbtn-txt"><b>Watch intro</b><small>See what MondQuest is about</small></span>`;
      const crew=p.querySelector('.mq-crew'),em=p.querySelector('.onboard-emblem');(crew||em||p.firstChild).insertAdjacentElement(crew||em?'afterend':'beforebegin',b)}}catch(e){}
  return r};
window.mqIntro={open,close};
})();
