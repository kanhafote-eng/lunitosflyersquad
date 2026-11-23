'use strict';
/* Shared side-menu shell for admin.html and staff.html. The menu stays in place while pages change. */
const Shell=(()=>{
  const ICON={
    dash:'<path d="M3 13h7V3H3zM14 21h7V11h-7zM14 3h7v5h-7zM3 21h7v-5H3z"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.4 3.4 0 0 1 0 6.3M18.5 14.8c1.8.7 2.8 2.4 3 4.7"/>',
    chat:'<path d="M4 5h16v11H9l-5 4z"/>',
    flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    gift:'<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2.5 0-4-1-4-2.5S9.5 3 12 8zM12 8c2.5 0 4-1 4-2.5S14.5 3 12 8z"/>',
    shirt:'<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3c-.5 1.6-2 2.5-4 2.5S8.5 4.6 8 3z"/>',
    tool:'<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-3 3-2.5-.5-.5-2.5z"/>',
    sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    medal:'<circle cx="12" cy="14" r="6"/><path d="M8.5 3 12 9l3.5-6M12 11v6"/>',
    pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7"/>',
    mega:'<path d="M3 11v3l12 5V6zM15 8c3 .5 4.500 2 4.500 4s-1.500 3.500-4.500 4M6 15l1.500 5h3"/>',
    photo:'<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5-9 8"/>',
    box:'<path d="M3 8l9-5 9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    search:'<circle cx="11" cy="11" r="6.500"/><path d="m20 20-4.200-4.200"/>',
    out:'<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    refresh:'<path d="M20 11a8 8 0 1 0-1 5M20 4v7h-7"/>'
  };
  const svg=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]||ICON.dash}</svg>`;
  let st=null;
  function mount(o){
    st={o,badges:{},active:null};
    const groups=[];o.items.forEach(i=>{let g=groups.find(x=>x.name===i.group);if(!g){g={name:i.group,items:[]};groups.push(g)}g.items.push(i)});
    document.body.innerHTML=`<div class="shell"><aside class="side"><div class="brand"><div class="moon"></div><div><b>${o.title}</b><small>${o.sub||'MondQuest · Zirkus Mond'}</small></div></div>
     <nav class="nav">${groups.map(g=>(g.name?`<h4>${g.name}</h4>`:'')+g.items.map(i=>`<a data-nav="${i.id}">${svg(i.icon)}<span>${i.label}</span><i class="badge" hidden></i></a>`).join('')).join('')}</nav>
     <div class="side-foot"><button class="alt" id="sh-rl" title="Reload data">${'⟳'} Reload</button><button class="alt" id="sh-out">Sign out</button></div></aside>
     <div class="scrim" id="sh-scrim"></div>
     <main class="main"><div class="topbar"><button class="alt" id="sh-burger" aria-label="Menu">☰</button><b id="sh-tt">${o.title}</b></div><div class="wrap" id="page"></div></main></div>`;
    const close=()=>document.body.classList.remove('menu-open');
    document.getElementById('sh-burger').onclick=()=>document.body.classList.toggle('menu-open');
    document.getElementById('sh-scrim').onclick=close;
    document.getElementById('sh-out').onclick=()=>o.onSignOut&&o.onSignOut();
    document.getElementById('sh-rl').onclick=()=>o.onReload&&o.onReload();
    document.querySelectorAll('[data-nav]').forEach(a=>a.onclick=()=>{close();go(a.dataset.nav)});
    window.onhashchange=()=>{const id=location.hash.slice(1);if(id&&id!==st.active&&o.items.some(i=>i.id===id))go(id,true)};
    return document.getElementById('page');
  }
  function go(id,fromHash){
    if(!st.o.items.some(i=>i.id===id))id=st.o.items[0].id;
    st.active=id;if(!fromHash&&location.hash.slice(1)!==id)history.replaceState(null,'','#'+id);
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===id));
    const it=st.o.items.find(i=>i.id===id);document.getElementById('sh-tt').textContent=it.label;
    const pg=document.getElementById('page');pg.innerHTML='';window.scrollTo(0,0);
    st.o.onSelect(id,pg,it);
  }
  function badge(id,n){const a=document.querySelector(`[data-nav="${id}"] .badge`);if(!a)return;a.hidden=!n;a.textContent=n>99?'99+':n}
  const start=()=>{const h=location.hash.slice(1);go(st.o.items.some(i=>i.id===h)?h:st.o.items[0].id,true)};
  const current=()=>st&&st.active;
  return{mount,go,badge,start,current,svg};
})();
