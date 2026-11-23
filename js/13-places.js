/* MondQuest · places appear for everybody at once (with a tiny "unverified" tag), reports reach the admin */
(function(){'use strict';
const C=window.MQ_CONFIG||{},LIVE=!!C.sheetUrl;
const isUnv=p=>LIVE&&p&&!p.retired&&(p.remote?p.verified===false:!/^seed-/.test(String(p.id)));
const TAG='<span class="mq14-unv" title="Not checked by the circus team yet">unverified</span>';
const _card=placeCard;
placeCard=function(p){const h=_card.apply(this,arguments);return isUnv(p)?h.replace(/(<h3>[^<]*)(<\/h3>)/,'$1 '+TAG+'$2'):h};
const _pop=placePopupHtml;
placePopupHtml=function(p){const h=_pop.apply(this,arguments);return isUnv(p)?h.replace('</strong>','</strong> '+TAG):h};
if(!LIVE)return;
/* ---- reports go to the server (kept in a small queue until they get through) ---- */
const QK='mq-flag-q',qGet=()=>{try{return JSON.parse(localStorage.getItem(QK)||'[]')}catch(e){return[]}},qSet=a=>{try{localStorage.setItem(QK,JSON.stringify(a.slice(-30)))}catch(e){}};
let busy=false;
async function flush(){if(busy||!window.mqPost||!state.user||!navigator.onLine)return;const q=qGet();if(!q.length)return;busy=true;
  try{const left=[];for(const f of q){try{const r=await mqPost({action:'flagPlace',player:{code:state.user.code,name:state.user.name},id:f.id,placeId:f.placeId,reason:f.reason});
      if(r&&r.ok)continue;                               // delivered
      if(r&&r.error&&!/network|timeout|busy|lock/i.test(r.error))continue;   // server said no (e.g. the place only exists on this phone): drop it
      left.push(f)}catch(e){left.push(f)}}
    qSet(left)}finally{busy=false}}
const _flag=flagPlace;
flagPlace=function(placeId,reason){const r=_flag.apply(this,arguments);
  if(r&&r.ok&&r.record){qSet(qGet().concat([{id:r.record.id,placeId,reason}]));setTimeout(flush,800)}return r};
setInterval(flush,60000);setTimeout(flush,6000);
/* ---- when the shared list of places changes, redraw the map ---- */
let sig='';const psig=()=>(state.places||[]).filter(p=>!p.retired).map(p=>p.id+(p.verified===false?'u':'v')).sort().join(',');
function wrap(){if(!window.mqSheet||!mqSheet.loadConfig||mqSheet.__w13)return;mqSheet.__w13=1;const _lc=mqSheet.loadConfig;
  mqSheet.loadConfig=async function(){const r=await _lc.apply(this,arguments);try{const s=psig();if(sig&&s!==sig&&window.mqWorld)mqWorld.redraw();sig=s}catch(e){}return r}}
wrap();setTimeout(()=>{wrap();sig=psig()},1500);
})();
