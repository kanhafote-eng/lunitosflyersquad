/* MondQuest · build 21: smoother pages. Keeps the scroll position when a page redraws itself and makes every page scrollable even where CSS :has() is missing (older Safari / DuckDuckGo on iOS). */
(function(){'use strict';
let last={v:null,t:''};
const title=el=>{const h=el&&el.querySelector('h1,h2');return h?(h.textContent||'').trim().slice(0,60):''};
const _s=shell;
shell=function(){
  const old=document.querySelector('.view'),top=old?old.scrollTop:0,wasV=last.v,wasT=last.t;
  const r=_s.apply(this,arguments);
  try{
    const v=document.querySelector('.view');if(!v)return r;
    const isMap=!!v.querySelector('.map-world');
    v.classList.toggle('mq-page',!isMap);
    const t=title(v);
    if(!isMap&&top>0&&wasV===currentView&&wasT===t){v.scrollTop=top;requestAnimationFrame(()=>{const n=document.querySelector('.view');if(n&&n.scrollTop!==top)n.scrollTop=top})}
    last={v:currentView,t:t};
  }catch(e){}
  return r};
})();
