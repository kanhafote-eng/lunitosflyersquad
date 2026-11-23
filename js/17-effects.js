/* MondQuest · build 17: small celebrations (points, level up, prize requested).
   Only triggered after the server has confirmed the action, so nothing is ever celebrated and then taken back.
   Respects "reduce motion", can be switched off in Settings, vibration is opt-in. */
(function(){'use strict';
let base=null,layer=null;
const settings=()=>{try{return window.mqSettings?mqSettings():{effects:true}}catch(e){return{effects:true}}};
const on=()=>settings().effects!==false;
const reduce=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const pal=['#FFD21F','#FF4FA3','#35E6FF','#9A6BFF','#FFF5D9'];
function lay(){if(!layer||!document.body.contains(layer)){layer=document.createElement('div');layer.className='mqfx-layer';layer.setAttribute('aria-hidden','true');document.body.appendChild(layer)}return layer}
function el(cls,html,css,ms){const d=document.createElement('div');d.className=cls;if(html)d.innerHTML=html;if(css)d.style.cssText=css;lay().appendChild(d);setTimeout(()=>d.remove(),ms||2600);return d}
function vibe(p){try{if(settings().vibe&&navigator.vibrate&&!reduce())navigator.vibrate(p)}catch(e){}}
function sparks(n,cx,cy,spread){if(reduce())return;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,d=(spread||110)*(.45+Math.random()*.75),s=6+Math.random()*9;
    el('mqfx-spark','',`--x:${cx}px;--y:${cy}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-20}px;--s:${s}px;--c:${pal[i%pal.length]};--d:${.7+Math.random()*.7}s`,1600)}}
const mid=()=>({x:Math.round(innerWidth/2),y:Math.round(innerHeight*.42)});
const LABEL={drop:'Delivered!',sight:'Sticker spotted!',discover:'New place found!',rate:'Thanks!',pickup:'Restocked!',chest:'Chest opened!',poster:'Poster up!',stickers:'Sticker placed!'};
function labelFor(types){const t=(types||[]).find(x=>LABEL[x]);return t?LABEL[t]:'Nice one!'}

const fx={
  points(n,label){if(!on()||!(n>0))return;
    const m=mid();n=Math.round(n);
    el('mqfx-pop',`+${n} ✦<small>${label||''}</small>`,'',1600);sparks(Math.min(26,10+Math.round(n/4)),m.x,m.y,100);vibe(25)},
  levelUp(name,rank){if(!on())return;
    const m=mid();
    el('mqfx-flash','','',1500);
    el('mqfx-level',`<b>Level up!</b><strong>${String(name||'New rank').replace(/[<>&]/g,'')}</strong><span>Rank ${rank}</span>`,'',2900);
    sparks(34,m.x,m.y,170);setTimeout(()=>sparks(22,m.x,m.y,130),350);vibe([40,60,40,60,80])},
  redeem(item){if(!on())return;
    const m=mid();
    el('mqfx-stamp',`Requested!<div style="font:700 11px system-ui;letter-spacing:.1em;margin-top:4px;opacity:.9">${item?String(item).replace(/[<>&]/g,'').slice(0,30):'Show your code at the desk'}</div>`,'',2100);
    if(!reduce())for(let i=0;i<9;i++){const a=(-.5+Math.random())*1.4-Math.PI/2,d=120+Math.random()*90;
      el('mqfx-coin','',`--x:${m.x}px;--y:${m.y+120}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;--d:${.9+Math.random()*.5}s;animation-delay:${i*40}ms`,1900)}
    vibe([30,40,30])},
  /* called by the economy once the server numbers have been adopted */
  settle(newE,types){const prev=base;base=+newE||0;
    if(prev==null||!types||!types.length||base<=prev)return;
    const r0=typeof mqRank==='function'?mqRank(prev):0,r1=typeof mqRank==='function'?mqRank(base):0;
    fx.points(base-prev,labelFor(types));
    if(r1>r0&&typeof MQ_RANKS!=='undefined')setTimeout(()=>fx.levelUp(MQ_RANKS[r1][0],r1+1),900)},
  base:()=>base
};
window.mqFx=fx;
setTimeout(()=>{if(base==null&&!(window.mqEcon&&mqEcon.queue().length))base=+(typeof state!=='undefined'&&state&&state.earned)||0},2000);
})();
