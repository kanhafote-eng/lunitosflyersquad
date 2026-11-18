'use strict';
/* Camera QR scanner for staff.html / admin.html. Needs vendor/qr/jsQR.js and HTTPS (GitHub Pages is HTTPS). */
const QrScan={
  parse(txt){const m=String(txt||'').trim().match(/^(?:MQ:)?([A-Za-z0-9\-]{3,24})$/);return m?m[1].toUpperCase():''},
  async open(onCode,opts){opts=opts||{};
    const ov=document.createElement('div');ov.className='scan-ov';
    ov.innerHTML='<div class="scan-box"><h2>'+(opts.title||'Scan player QR')+'</h2><div class="scan-frame"><video playsinline muted></video></div><p class="hint" id="scan-msg">'+(opts.hint||'Point the camera at the QR code in the player’s app.')+'</p><div class="row"><button class="alt" id="scan-x">Cancel</button></div></div>';
    document.body.appendChild(ov);
    const video=ov.querySelector('video'),msg=ov.querySelector('#scan-msg');let stream=null,alive=true;
    const stop=()=>{alive=false;if(stream)stream.getTracks().forEach(t=>t.stop());ov.remove()};
    ov.querySelector('#scan-x').onclick=stop;
    try{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('no camera api');
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      video.srcObject=stream;await video.play();
    }catch(e){msg.textContent='Camera unavailable. Allow camera access, or type the code instead.';msg.className='hint warn';return}
    const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
    const tick=()=>{
      if(!alive)return;
      if(video.readyState>=2&&video.videoWidth){
        const w=Math.min(640,video.videoWidth),h=Math.round(video.videoHeight*w/video.videoWidth);cv.width=w;cv.height=h;
        cx.drawImage(video,0,0,w,h);
        const r=window.jsQR&&jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:'dontInvert'});
        if(r&&r.data){const code=QrScan.parse(r.data);if(code){stop();onCode(code);return}msg.textContent='That QR is not a MondQuest player code.';msg.className='hint warn'}
      }
      requestAnimationFrame(tick)};
    tick();
  }
};
