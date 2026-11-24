/* MondQuest · build 19: plain-language privacy, fair-play and imprint page (English + Deutsch). Reachable from Settings and the welcome screen. */
(function(){'use strict';
const CFG=(window.MQ_CONFIG&&window.MQ_CONFIG.legal)||{};
const L={operator:CFG.operator||'Zirkus Mond',address:CFG.address||'Rudolfstraße 14c, 10245 Berlin',email:CFG.email||'',phone:CFG.phone||'',rep:CFG.representative||'',updated:'24 Nov 2026'};
const esc2=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mail=(en)=>L.email?`<a href="mailto:${esc2(L.email)}">${esc2(L.email)}</a>`:(en?'the Zirkus Mond team (ask us in person at the address above)':'das Zirkus-Mond-Team (sprich uns persönlich unter der obigen Adresse an)');
const T={
 en:{tab:'English',title:'Privacy & fair play',intro:'MondQuest is a game by Zirkus Mond. Short version: we only keep what the game needs, we never sell anything, and there are no ads. Here it is in plain words.',
  s:[
  ['Who is behind this',`${esc2(L.operator)}, ${esc2(L.address)}.<br>Questions or requests: ${mail(1)}.`],
  ['What we keep',`<ul><li>Your nickname and a random player code.</li><li>Your points, flyers, stickers, outfit and rank.</li><li>Places you add, ratings you give and stickers you spot (with where).</li><li>Your age group (16+ or under 16).</li><li>Chat messages (everybody can read them).</li><li>Photos, only if you are 16+ and say yes.</li></ul>`],
  ['Your location',`We only use it when you tap the location buttons. If you choose to show your Lunito, we share only a rough spot (about 200 m) and it disappears after 30 minutes. Under-16 players can never share location. A place or sticker you add keeps its spot on the map, because that is the whole point.`],
  ['Photos',`Only 16+ and only if you agree. Please keep faces and people out of the picture, just the sticker. Photos can show on the world map and on Zirkus Mond's social media. Want one removed? Tell us and it goes.`],
  ['Who sees what',`Other players see your nickname, Lunito, rank, and what you add (places, sightings, ratings, photos, chat). Zirkus Mond staff see a bit more so they can run the game and hand out prizes.`],
  ['Other services we use',`The map comes from OpenFreeMap. Address suggestions come from Photon / OpenStreetMap: they receive what you type and your rough location. The website is hosted on GitHub Pages and the data lives with Supabase. Like every website, these services can see your IP address.`],
  ['On your phone',`The game saves your progress in your browser. No ads, no tracking cookies, no analytics. “Sign out & clear this device” in Settings wipes it from your phone.`],
  ['Your rights',`You can ask what we hold about you, ask us to fix it, or ask us to delete it, by writing to ${mail(1)}. You can also complain to the Berlin data protection authority (Berliner Beauftragte für Datenschutz und Informationsfreiheit).`],
  ['If you are under 16',`Please play with a parent's OK. Under-16 players can't share location or send photos.`],
  ['Fair play',`<ul><li>Be kind, in chat and everywhere.</li><li>No faces or private things in photos.</li><li>Only put flyers and stickers where it is allowed. Ask first, never block a way or climb anywhere unsafe.</li><li>Watch the traffic: the game is never worth a risk.</li><li>No cheating. We can pause or remove accounts that break these rules.</li></ul>`],
  ['Imprint',`${esc2(L.operator)}<br>${esc2(L.address)}${L.rep?`<br>Represented by: ${esc2(L.rep)}`:''}${L.phone?`<br>Phone: ${esc2(L.phone)}`:''}<br>Email: ${mail(1)}`]
  ],foot:'Last updated '+L.updated+'. We will tell you in the game if this changes in a big way.'},
 de:{tab:'Deutsch',title:'Datenschutz & Fair Play',intro:'MondQuest ist ein Spiel von Zirkus Mond. Kurz gesagt: Wir speichern nur, was das Spiel braucht, wir verkaufen nichts und es gibt keine Werbung. Hier alles in einfachen Worten.',
  s:[
  ['Wer steckt dahinter',`${esc2(L.operator)}, ${esc2(L.address)}.<br>Fragen oder Wünsche: ${mail(0)}.`],
  ['Was wir speichern',`<ul><li>Dein Spitzname und ein zufälliger Spielercode.</li><li>Deine Punkte, Flyer, Sticker, dein Outfit und dein Rang.</li><li>Orte, die du hinzufügst, Bewertungen und gefundene Sticker (mit Ort).</li><li>Deine Altersgruppe (ab 16 oder unter 16).</li><li>Chat-Nachrichten (alle können sie lesen).</li><li>Fotos, nur wenn du mindestens 16 bist und zustimmst.</li></ul>`],
  ['Dein Standort',`Wir nutzen ihn nur, wenn du die Standort-Knöpfe antippst. Wenn du dein Lunito zeigst, teilen wir nur eine ungefähre Stelle (etwa 200 m), und sie verschwindet nach 30 Minuten. Spieler unter 16 können nie ihren Standort teilen. Ein Ort oder Sticker, den du hinzufügst, behält seinen Platz auf der Karte, denn genau darum geht es.`],
  ['Fotos',`Nur ab 16 und nur mit deiner Zustimmung. Bitte keine Gesichter oder Personen aufs Bild, nur den Sticker. Fotos können auf der Weltkarte und in den Social-Media-Kanälen von Zirkus Mond erscheinen. Du möchtest eins entfernen lassen? Sag uns Bescheid, dann verschwindet es.`],
  ['Wer sieht was',`Andere Spieler sehen deinen Spitznamen, dein Lunito, deinen Rang und was du hinzufügst (Orte, Sichtungen, Bewertungen, Fotos, Chat). Das Zirkus-Mond-Team sieht etwas mehr, damit es das Spiel betreuen und Preise ausgeben kann.`],
  ['Andere Dienste, die wir nutzen',`Die Karte kommt von OpenFreeMap. Adressvorschläge kommen von Photon / OpenStreetMap: Dort kommen deine Eingabe und dein ungefährer Standort an. Die Webseite liegt bei GitHub Pages, die Daten bei Supabase. Wie bei jeder Webseite können diese Dienste deine IP-Adresse sehen.`],
  ['Auf deinem Handy',`Das Spiel speichert deinen Fortschritt im Browser. Keine Werbung, keine Tracking-Cookies, keine Analyse. Mit „Sign out & clear this device“ in den Einstellungen löschst du alles vom Handy.`],
  ['Deine Rechte',`Du kannst fragen, was wir über dich speichern, es berichtigen oder löschen lassen. Schreib dazu an ${mail(0)}. Du kannst dich auch bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit beschweren.`],
  ['Wenn du unter 16 bist',`Bitte spiel nur mit dem Okay deiner Eltern. Spieler unter 16 können weder Standort teilen noch Fotos senden.`],
  ['Fair Play',`<ul><li>Sei freundlich, im Chat und überall.</li><li>Keine Gesichter oder Privates auf Fotos.</li><li>Flyer und Sticker nur dort, wo es erlaubt ist. Vorher fragen, nie einen Weg versperren oder irgendwo Unsicheres klettern.</li><li>Achte auf den Verkehr: Das Spiel ist kein Risiko wert.</li><li>Kein Schummeln. Wir können Konten pausieren oder entfernen, die gegen diese Regeln verstoßen.</li></ul>`],
  ['Impressum',`${esc2(L.operator)}<br>${esc2(L.address)}${L.rep?`<br>Vertreten durch: ${esc2(L.rep)}`:''}${L.phone?`<br>Telefon: ${esc2(L.phone)}`:''}<br>E-Mail: ${mail(0)}`]
  ],foot:'Stand: '+L.updated+'. Wenn sich etwas Wesentliches ändert, sagen wir es dir im Spiel.'}};
let lang=(navigator.language||'').toLowerCase().startsWith('de')?'de':'en';
function body(){const t=T[lang];return `<section class="card legal-card"><div class="eyebrow">THE SMALL PRINT, MADE SMALL</div><h1>${t.title}</h1><div class="legal-tabs">${['en','de'].map(k=>`<button type="button" class="button quiet small${k===lang?' on':''}" data-legal-lang="${k}">${T[k].tab}</button>`).join('')}</div><p>${t.intro}</p>${t.s.map(x=>`<h3>${x[0]}</h3><div class="legal-p">${x[1]}</div>`).join('')}<p class="small legal-foot">${t.foot}</p></section>`}
window.legalScreen=function(){currentView='legal';
  const html=body();
  if(state&&state.user){shell(html)}else{app.innerHTML=`<div class="view legal-bare">${html}<div class="mq-backbar"><button type="button" class="mq-back" id="legal-back" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 5l-7 7 7 7"/></svg></button></div></div>`;const b=document.getElementById('legal-back');if(b)b.onclick=()=>go('welcome')}
  document.querySelectorAll('[data-legal-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.legalLang;legalScreen()});
  try{window.scrollTo(0,0)}catch(e){}};
const _g=go;go=function(v){if(v==='legal'){try{window.mqHistPush&&mqHistPush(v)}catch(e){}return legalScreen()}return _g.apply(this,arguments)};
/* link on the welcome screen */
const _w=welcome;welcome=function(){const r=_w.apply(this,arguments);
  try{const p=document.querySelector('.onboard-panel');if(p&&!p.querySelector('.legal-link')){const d=document.createElement('p');d.className='small legal-link';d.innerHTML='By playing you agree to our <button type="button" class="linkish" data-view="legal">privacy &amp; fair-play notes</button>.';p.appendChild(d)}}catch(e){}
  return r};
})();
