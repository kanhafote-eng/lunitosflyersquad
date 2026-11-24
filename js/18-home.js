/* MondQuest · build 18: every page has a clear Home button (the old compass icon was not understood) */
(function(){'use strict';
const HOUSE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg><span>Home</span>';
const _s=shell;
shell=function(){const r=_s.apply(this,arguments);
  try{
    if(currentView==='menu')return r;
    const view=document.querySelector('.view');if(!view||view.querySelector('.map-world'))return r;
    let b=view.querySelector('.map-sheet-close');
    if(!b){b=document.createElement('button');b.type='button';b.className='map-sheet-close';view.appendChild(b)}
    b.classList.add('mq-home');b.innerHTML=HOUSE;b.setAttribute('aria-label','Home');b.title='Home';b.setAttribute('data-view','menu');
  }catch(e){}
  return r};
})();
