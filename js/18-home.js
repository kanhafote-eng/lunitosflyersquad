/* MondQuest · build 19: small round Home button (house + satellite dish) on top, "Back" arrow at the bottom of every page */
(function(){'use strict';
const HOUSE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.8 13.2 9.6 6.6l6.8 6.6"/><path d="M4.9 12v7.6h9.4V12"/><path d="M8.6 19.6v-4.2h2.1v4.2"/><path d="M14.6 3.2a6.4 6.4 0 0 0 6.2 6.2z" fill="currentColor"/><path d="M18.2 6.4l2.2-2.3"/><circle cx="20.7" cy="3.8" r="1" fill="currentColor" stroke="none"/><path d="M16.7 9.2v1.6"/></svg>';
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M11 5l-7 7 7 7"/></svg>';
const hist=[];let goingBack=false;
const _g=go;
go=function(v){try{if(v==='map')v='menu';if(v==='menu')hist.length=0;else if(!goingBack&&currentView&&currentView!==v&&hist[hist.length-1]!==currentView)hist.push(currentView)}catch(e){}return _g.call(this,v)};
const _s=shell;
shell=function(){const r=_s.apply(this,arguments);
  try{
    const view=document.querySelector('.view');
    if(!view||currentView==='menu'||view.querySelector('.map-world'))return r;
    let b=view.querySelector('.map-sheet-close');
    if(!b){b=document.createElement('button');b.type='button';b.className='map-sheet-close';view.appendChild(b)}
    b.classList.add('mq-home');b.innerHTML=HOUSE;b.setAttribute('aria-label','Home');b.title='Home';b.setAttribute('data-view','menu');
    if(!view.querySelector('.mq-backbar')){
      const own=[...view.querySelectorAll('button[data-view]:not(.map-sheet-close)')].find(x=>{const d=x.getAttribute('data-view');return d&&d!=='menu'&&d!=='map'&&(x.textContent||'').trim().length<22});
      const bar=document.createElement('div');bar.className='mq-backbar';
      bar.innerHTML='<button type="button" class="mq-back" aria-label="Back" title="Back">'+ARROW+'</button>';
      bar.firstChild.addEventListener('click',()=>{
        let t=own&&document.body.contains(own)?own.getAttribute('data-view'):'';
        if(!t)t=hist.length?hist[hist.length-1]:'menu';
        goingBack=true;try{if(hist.length&&hist[hist.length-1]===t)hist.pop();go(t)}finally{goingBack=false}});
      view.appendChild(bar)}
  }catch(e){}
  return r};
})();
