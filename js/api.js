'use strict';
const MQ=window.MQ_CONFIG||{};
const Api={
  pin:()=>{try{return sessionStorage.getItem('mq-pin')||''}catch(e){return''}},
  setPin:p=>{try{sessionStorage.setItem('mq-pin',p)}catch(e){}},
  clear:()=>{try{sessionStorage.removeItem('mq-pin')}catch(e){}},
  async call(action,data){
    if(!MQ.sheetUrl)throw new Error('config.js has no sheetUrl yet.');
    const r=await fetch(MQ.sheetUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,pin:Api.pin(),...data})});
    const j=await r.json();if(!j.ok)throw new Error(j.error||'Error');return j;
  }
};
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
