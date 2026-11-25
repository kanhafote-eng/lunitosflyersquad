/* MondQuest · build 22: a little Lunito crew on the welcome screen */
(function(){'use strict';
const CREW=[{skin:'#FFB3E6',hair:'#35E6FF',suit:'#9A6BFF'},{skin:'#7FE0D0',hair:'#FFD21F',suit:'#FF5FB0'},{skin:'#B9A6FF',hair:'#FF8A3D',suit:'#35E6FF'}];
const _w=welcome;
welcome=function(){const r=_w.apply(this,arguments);
  try{const p=document.querySelector('.onboard-panel');
    if(p&&!p.querySelector('.mq-crew')){const row=document.createElement('div');row.className='mq-crew';row.setAttribute('aria-hidden','true');
      row.innerHTML=CREW.map((l,i)=>`<span class="mq-crew-l c${i}">${courierSvg(l)}</span>`).join('');
      const em=p.querySelector('.onboard-emblem');if(em)em.insertAdjacentElement('afterend',row);else p.insertBefore(row,p.firstChild)}}catch(e){}
  return r};
})();
