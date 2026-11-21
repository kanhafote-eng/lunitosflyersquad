/* MondQuest · Moon menu as swipeable pages (no more tiny buttons squeezed into one screen) */
(function(){'use strict';
const PAGES=[['missions','places','pickup','shop','adventures','ranking','spotted','players'],['chat','courier','announcements','manual','settings']];
function build(){
  const sc=document.querySelector('.lunar-sheet-scroll');if(!sc||sc.querySelector('.mq12-pager'))return;
  const grid=sc.querySelector('.more-grid');if(!grid)return;
  const by={};grid.querySelectorAll('.button[data-view]').forEach(b=>{by[b.dataset.view]=b});
  const pager=document.createElement('div');pager.className='mq12-pager';pager.setAttribute('aria-label','Menu pages, swipe sideways');
  const used=new Set();
  PAGES.forEach(list=>{const pg=document.createElement('div');pg.className='mq12-page more-grid';
    list.forEach(v=>{if(by[v]){pg.appendChild(by[v]);used.add(v)}});pager.appendChild(pg)});
  // anything new that is not listed yet goes on the last page (never lost)
  Object.keys(by).forEach(v=>{if(!used.has(v)&&v!=='map'&&v!=='wardrobe')pager.lastChild.appendChild(by[v])});
  pager.querySelectorAll('.mq12-page').forEach(p=>{if(!p.children.length)p.remove()});
  const n=pager.children.length,dots=document.createElement('div');dots.className='mq12-dots';
  dots.innerHTML=Array.from({length:n},(_,i)=>`<button type="button" class="mq12-dot${i?'':' on'}" data-mq12="${i}" aria-label="Menu page ${i+1} of ${n}"></button>`).join('');
  const keep=(window.MQ_CONFIG&&window.MQ_CONFIG.sheetUrl)?null:sc.querySelector('.admin-console');
  sc.innerHTML='';if(n>1)sc.appendChild(dots);sc.appendChild(pager);if(keep)sc.appendChild(keep);
  pager.addEventListener('scroll',()=>{const i=Math.round(pager.scrollLeft/Math.max(1,pager.clientWidth));
    dots.querySelectorAll('.mq12-dot').forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true});
}
const _more=more;
more=function(){const r=_more.apply(this,arguments);try{build()}catch(e){}return r};
document.addEventListener('click',e=>{const d=e.target.closest&&e.target.closest('[data-mq12]');if(!d)return;
  const p=document.querySelector('.mq12-pager');if(p)p.scrollTo({left:p.clientWidth*(+d.dataset.mq12),behavior:'smooth'})},true);
})();

/* Wardrobe lives in Profile, next to the look controls */
(function(){'use strict';
const _courier=courier;
courier=function(){const r=_courier.apply(this,arguments);
  try{const b=document.querySelector('.view [data-action="save-look"]');
    if(b&&!document.querySelector('.view [data-view="wardrobe"]')){const w=document.createElement('button');w.type='button';w.className='button';w.dataset.view='wardrobe';w.innerHTML='👕 Wardrobe · try things on';w.style.marginTop='8px';b.insertAdjacentElement('afterend',w)}}catch(e){}
  return r};
})();
