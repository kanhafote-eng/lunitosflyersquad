/**
 * MondQuest backend (Google Apps Script web app) - Zirkus Mond
 * Script properties required: WRITE_KEY, STAFF_PIN, ADMIN_PIN
 * Deploy as web app: Execute as ME, access ANYONE.
 */
var TABS_PUBLIC = ['Config','Combos','Rewards','Cosmetics','Gadgets','Ranks','Places','News','Banners'];
var EDITABLE = ['Config','Combos','Rewards','Cosmetics','Gadgets','Ranks','Places','News'];
var MAX_ENTRIES = 200;

function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function prop_(k){ return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(n){ var s = ss_().getSheetByName(n); if(!s) throw new Error('Missing tab '+n); return s; }
function table_(n){
  var v = sh_(n).getDataRange().getValues(); if(!v.length) return {h:[],rows:[]};
  var h = v[0].map(String), rows = [];
  for(var i=1;i<v.length;i++){ var o={}; var empty=true;
    for(var j=0;j<h.length;j++){ o[h[j]]=v[i][j]; if(v[i][j]!=='' && v[i][j]!==null) empty=false; }
    if(!empty){ o._row=i+1; rows.push(o); } }
  return {h:h,rows:rows};
}
function strip_(rows){ return rows.map(function(r){ var o={}; for(var k in r) if(k!=='_row') o[k]=r[k]; return o; }); }
function bool_(v){ return v===true || String(v).toUpperCase()==='TRUE'; }
function now_(){ return new Date().toISOString(); }
function clean_(s,n){ return String(s==null?'':s).replace(/[\u0000-\u001f]/g,' ').slice(0,n||200); }
function safeCell_(v){ // block formula injection
  if(typeof v==='string' && /^[=+@\-]/.test(v) && isNaN(Number(v))) return "'"+v; return v; }

function publicConfig_(){
  var cache = CacheService.getScriptCache(), c = cache.get('cfg');
  // cfgv lives in the shared store, so a change made on one server instance clears the cached copy on every instance
  var ver = String(cache.get('cfgv')||'0');
  if(c){ try{ var hit = JSON.parse(c); if(hit._v===ver) return hit; }catch(e){} }
  schema_();
  var o = {ok:true, updatedAt:now_(), _v:ver};
  TABS_PUBLIC.forEach(function(n){ o[n.toLowerCase()] = strip_(table_(n).rows); });
  o.rewards = o.rewards.filter(function(r){return bool_(r.active);});
  o.cosmetics = o.cosmetics.filter(function(r){return bool_(r.active);});
  o.gadgets = o.gadgets.filter(function(r){return bool_(r.active);});
  o.news = o.news.filter(function(r){return bool_(r.active);});
  o.chatEnabled = bool_((findRow_('Config','Key','chat.enabled')||{}).Value);
  o.pickuppoints = pickupPointsList_(true);
  o.banners = o.banners.filter(function(r){return bool_(r.active) && Number(r.endsAt)>Date.now();});
  o.places = o.places.filter(function(r){return bool_(r.active) && (String(r.status)==='approved' || String(r.status)==='unverified');}).map(function(r){ r.verified = String(r.status)==='approved'; return r; });
  try{ cache.put('cfg', JSON.stringify(o), 60); }catch(e){}
  return o;
}

// Extra flyer pickup points, set in Admin > Pickup points. Stored as JSON in Config (key pickup.points), no new table needed.
function cleanPoint_(p, i){
  p = p || {}; var lat = Number(p.lat), lng = Number(p.lng);
  var col = /^#[0-9a-fA-F]{6}$/.test(String(p.color||'')) ? String(p.color) : '#35E6FF';
  var id = String(p.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24) || ('pp'+Date.now().toString(36)+i);
  return { id:id, name:clean_(p.name,60), address:clean_(p.address,120), note:clean_(p.note,160), color:col,
    lat: isFinite(lat) && Math.abs(lat)<=90 ? lat : null, lng: isFinite(lng) && Math.abs(lng)<=180 ? lng : null,
    active: p.active===false || String(p.active)==='false' ? false : true, main: id==='hq' };
}
function pickupPointsList_(onlyActive){
  var r = findRow_('Config','Key','pickup.points'), arr = [];
  try{ arr = r && r.Value ? JSON.parse(String(r.Value)) : []; }catch(e){ arr = []; }
  if(!Array.isArray(arr)) arr = [];
  arr = arr.slice(0,30).map(cleanPoint_).filter(function(p){ return p.lat!=null && p.lng!=null && (p.name || p.main); });
  return onlyActive ? arr.filter(function(p){ return p.active; }) : arr;
}
function bust_(){ var c = CacheService.getScriptCache(); c.remove('cfg'); c.put('cfgv', String(Date.now()), 86400); }

function doGet(e){
  try{
    var a = (e.parameter && e.parameter.action) || 'config';
    if(a==='config') return out_(publicConfig_());
    return out_({ok:false,error:'unknown action'});
  }catch(err){ return out_({ok:false,error:String(err.message||err)}); }
}

function doPost(e){
  var lock = LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    var req = JSON.parse(e.postData.contents);
    var a = req.action, role = auth_(req, a);
    var h = HANDLERS[a]; if(!h) return out_({ok:false,error:'unknown action'});
    if(role==='player'){
      var pc = (req.player && req.player.code) || req.code;
      if(pc && validCode_(pc)){ var pw = findRow_('Players','Code',pc);
        if(pw && String(pw.Access)==='banned') return out_({ok:false, banned:true, error:'This Lunito has been removed from MondQuest.'}); }
    }
    return out_(h(req, role));
  }catch(err){ return out_({ok:false,error:String(err.message||err)}); }
  finally{ try{lock.releaseLock();}catch(x){} }
}

var ACTION_ROLE = { sync:'player', pull:'player',
  staffLookup:'staff', staffGrant:'staff', staffRedemptions:'staff', staffHandle:'staff',
  adminGet:'admin', adminSave:'admin', adminPlayers:'admin', adminSetTrust:'admin', adminReviewPlace:'admin', adminGrant:'admin', adminLog:'admin', adminStats:'admin', adminPlayerSave:'admin', adminPlayerDelete:'admin', adminPhotoDelete:'admin',
  presenceSync:'player', placeEdit:'player', staffPickups:'staff', staffPickupHandle:'staff', adminImportPlaces:'admin',
  photoUpload:'player', staffSetAge:'staff', adminPhotos:'admin', adminPhotoPick:'admin',
  adminBanner:'admin', adminBannerStop:'admin', adminBanners:'admin',
  chatSync:'player', flagPlace:'player', act:'player', ranking:'player', adminFlags:'admin', adminFlagResolve:'admin', worldPost:'player', worldGet:'player', worldThumb:'player', recoverPlayer:'player', adminChat:'admin', adminPickupPoints:'admin', adminChatSetting:'admin', adminChatHide:'admin', adminSetAccess:'admin' };

function auth_(req, a){
  var need = ACTION_ROLE[a]; if(!need) throw new Error('unknown action');
  if(need==='player'){
    var k = prop_('WRITE_KEY'); if(!k || req.key!==k) throw new Error('bad key');
    return 'player';
  }
  var cache = CacheService.getScriptCache(), fails = Number(cache.get('pinfails')||0);
  if(fails>=8) throw new Error('Too many wrong PINs. Wait 10 minutes.');
  var pin = String(req.pin||''), admin = prop_('ADMIN_PIN'), staff = prop_('STAFF_PIN');
  var role = (admin && pin===admin) ? 'admin' : (staff && pin===staff ? 'staff' : '');
  if(!role || (need==='admin' && role!=='admin')){
    cache.put('pinfails', String(fails+1), 600); throw new Error('Wrong PIN');
  }
  return role;
}

function appendObj_(name, o){
  var s = sh_(name), h = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  s.appendRow(h.map(function(k){ return o[k]===undefined?'':safeCell_(o[k]); }));
}
function findRow_(name, col, val){
  var t = table_(name); for(var i=0;i<t.rows.length;i++) if(String(t.rows[i][col])===String(val)) return t.rows[i]; return null;
}
function setCells_(name, row, o){
  var s = sh_(name), h = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  for(var k in o){ var c = h.indexOf(k); if(c>=0) s.getRange(row, c+1).setValue(safeCell_(o[k])); }
}
function validCode_(c){ return /^[A-Za-z0-9\-]{3,24}$/.test(String(c||'')); }

var PLACE_TYPES = ['restaurant','cafe','bar','späti','shop','kindergarten','social','studio','rehearsal','cultural','other'];
var TAB_HEADERS = {
  Pickups:['ReqId','PlayerCode','PlayerName','Flyers','Posters','Stickers','Status','RequestedAt','UpdatedAt','HandledBy','StaffNote'],
  Presence:['Code','Name','Lat','Lng','Look','UpdatedAt'],
  Photos:['PhotoId','FileId','Url','Nick','PlayerCode','Country','City','Consent','UploadedAt','Pick'],
  Banners:['id','emoji','text','startsAt','endsAt','active'],
  Chat:['MsgId','PlayerCode','Name','Look','Text','At','Hidden'],
  World:['Id','Kind','PlaceId','Lat','Lng','Nick','PlayerCode','Flyers','Posters','Stickers','Text','Country','At','Hidden','Rep'],
  Thumbs:['Id','Data'],
  Flags:['Id','PlaceId','PlaceName','PlayerCode','Nick','Reason','At','Status']
};
// Adds a column to an existing tab when it is missing (older sheets keep working). fill(row) may return a starting value per row.
function ensureCol_(tab, head, fill){
  var s = ss_().getSheetByName(tab); if(!s) return;
  var lc = s.getLastColumn(), h = s.getRange(1,1,1,lc).getValues()[0].map(String);
  if(h.indexOf(head)>=0) return;
  s.getRange(1,lc+1).setValue(head);
  if(fill){ var v = s.getDataRange().getValues();
    for(var i=1;i<v.length;i++){ var o={}; for(var j=0;j<h.length;j++) o[h[j]]=v[i][j]; var x=fill(o); if(x!=='' && x!=null) s.getRange(i+1,lc+1).setValue(x); } }
}
function schema_(){
  var cache = CacheService.getScriptCache(); if(cache.get('schema7')) return;
  ensureCol_('Players','Age');
  ensure_('Banners'); ensure_('Photos'); ensure_('Chat'); ensure_('World'); ensure_('Thumbs'); ensure_('Flags');
  ensureCol_('Players','Access'); ensureCol_('Players','Extras'); ensureCol_('Players','State'); ensureCol_('World','Rep');
  if(!findRow_('Config','Key','chat.enabled')) appendObj_('Config',{Key:'chat.enabled',Value:'FALSE','What it does':'Moon chat on (TRUE) or off (FALSE). Easier to change in Admin > Chat.'});
  cache.put('schema7','1',21600);
}
// Creates Pickups / Presence on first use, so older sheets keep working without manual steps.
function ensure_(name){
  var s = ss_().getSheetByName(name);
  if(!s){ s = ss_().insertSheet(name); s.appendRow(TAB_HEADERS[name]); s.setFrozenRows(1);  }
  return s;
}
function ms_(v){ var t = (v instanceof Date) ? v.getTime() : new Date(String(v||'')).getTime(); return isFinite(t) ? t : 0; }
function lookJson_(l){ var o = {}; try{ if(typeof l==='string') l = JSON.parse(l); }catch(e){ l = {}; }
  if(l && typeof l==='object'){ var n = 0; for(var k in l){ if(n>=14) break; var v = l[k];
    if(/^[A-Za-z]{1,20}$/.test(k) && (typeof v==='number' || (typeof v==='string' && /^[#\w. -]{1,24}$/.test(v)))){ o[k]=v; n++; } } }
  return JSON.stringify(o); }
function idList_(a){ var o = []; if(a && a.length) for(var i=0;i<a.length && o.length<80;i++){ if(/^[\w-]{1,40}$/.test(String(a[i]))) o.push(String(a[i])); } return o; }
function extrasJson_(x){
  if(!x || typeof x!=='object') return '';
  var o = {look: JSON.parse(lookJson_(x.look)), acc:{o:idList_((x.acc||{}).o), e:idList_((x.acc||{}).e)}, gad:{o:idList_((x.gad||{}).o), e:idList_((x.gad||{}).e)}, min:{}, ch:Math.max(0,Math.min(999,Number(x.ch)||0)), at:Number(x.at)||0, cd:idList_(x.cd)};
  ['meteor','comet','nebula','void','rings'].forEach(function(k){ o.min[k] = Math.max(0, Math.min(99999, Number((x.min||{})[k])||0)); });
  var s = JSON.stringify(o); return s.length<=4000 ? s : '';
}
function pid_(code){ var h = 5381, s = 'mq:' + String(code); for(var i=0;i<s.length;i++){ h = ((h<<5)+h + s.charCodeAt(i)) | 0; } return 'p' + (h>>>0).toString(36); }
function pickupPoints_(){ var r = findRow_('Config','Key','points.pickup'); var v = r ? Number(r.Value) : 5; return isFinite(v) ? v : 5; }
function distM_(a,b,c,d){ var R=6371000,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)*Math.sin(y/2); return 2*R*Math.asin(Math.min(1,Math.sqrt(h))); }
function qty_(v, max){ v = Math.floor(Number(v)||0); return Math.max(0, Math.min(max, v)); }

function mergeExtras_(clientJson, serverJson, fresh){
  // The phone may change what it wears; what the player OWNS (and minerals, chests, combos) only the server changes.
  var c = {}, v = {}; try{ c = JSON.parse(clientJson||'{}'); }catch(e){} try{ v = JSON.parse(serverJson||'{}'); }catch(e){}
  if(!c || typeof c!=='object') c = {}; if(!v || typeof v!=='object') v = {};
  c.acc = c.acc||{o:[],e:[]}; c.gad = c.gad||{o:[],e:[]};
  c.acc.o = fresh ? [] : ((v.acc||{}).o||[]); c.gad.o = fresh ? [] : ((v.gad||{}).o||[]);
  c.min = fresh ? {meteor:0,comet:0,nebula:0,void:0,rings:0} : (v.min||{meteor:0,comet:0,nebula:0,void:0,rings:0});
  c.ch = fresh ? 1 : (Number(v.ch)||0); c.cd = fresh ? [] : (v.cd||[]);
  var o = JSON.stringify(c); return o.length<=4000 ? o : '';
}
function upsertPlayer_(p){
  if(!validCode_(p.code)) throw new Error('bad player code');
  var r = findRow_('Players','Code',p.code), t = now_();
  var vals = {Name:clean_(p.name,40), LastSeen:t};
  // The age group is stored once; after that only staff/admin can change it.
  var age = (p.age==='u16' || p.age==='16+') ? p.age : '';
  var ex0 = extrasJson_(p.extras);
  if(r){
    if(age && !r.Age) vals.Age = age;
    if(ex0) vals.Extras = r.State ? mergeExtras_(ex0, r.Extras, false) : ex0;
    setCells_('Players', r._row, vals); return r.Trust||'new';
  }
  // A brand-new player always starts from the circus starter kit: the phone cannot claim points.
  vals.Wallet = 0; vals.Earned = 0; vals.Flyers = cfg_('initialInventory.flyers'); vals.Posters = cfg_('initialInventory.posters'); vals.Stickers = cfg_('initialInventory.stickers');
  vals.Extras = mergeExtras_(ex0||'{}', '', true);
  vals.Code = p.code; vals.FirstSeen = t; vals.Trust = 'new'; vals.Age = age; appendObj_('Players', vals); return 'new';
}
// Makes sure the player has a server-side state and hands it back (used by sync and pull).
function stateSync_(code, snap, touch){
  var row = findRow_('Players','Code',code); if(!row) return null;
  var S = stateOf_(row, snap), before = JSON.stringify(S.bt)+S.w+S.e;
  expire_(S, Date.now());
  if(touch || !row.State || before!==JSON.stringify(S.bt)+S.w+S.e) saveState_(row, S);
  return publicState_(S);
}
// Staff/admin material and points go straight into the player's real state.
function grantNow_(code, g){
  var row = findRow_('Players','Code',code); if(!row) return;
  var S = stateOf_(row); grantApply_(S, g); saveState_(row, S);
}

var HANDLERS = {
  sync: function(req){
    schema_();
    var p = req.player||{}; var trust = upsertPlayer_(p);
    var entries = (req.entries||[]).slice(0,MAX_ENTRIES), n=0;
    var seen = {}; table_('Log').rows.slice(-1000).forEach(function(r){ seen[r.PlayerCode+'|'+r.EntryId]=1; });
    entries.forEach(function(en){
      var id = clean_(en.id,40); if(!id || seen[p.code+'|'+id]) return;
      appendObj_('Log',{Received:now_(),PlayerCode:p.code,PlayerName:clean_(p.name,40),EntryId:id,Type:clean_(en.type,30),
        Label:clean_(en.label,120),Amount:Number(en.amount)||0,At:clean_(en.at,30),Extra:clean_(en.extra,200)}); n++;
    });
    var dups = {};
    (req.places||[]).slice(0,5).forEach(function(pl){
      var id = clean_(pl.id,40); if(!id || findRow_('Places','id',id)) return;
      var lat=Number(pl.lat), lng=Number(pl.lng); if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) return;
      var nm = clean_(pl.name,60), key = nm.toLowerCase().replace(/[^a-z0-9äöüß]/g,'');
      var twin = table_('Places').rows.filter(function(r){
        if(!bool_(r.active)) return false;
        var d = distM_(lat,lng,Number(r.lat),Number(r.lng));
        var k2 = String(r.name||'').toLowerCase().replace(/[^a-z0-9äöüß]/g,'');
        return d<25 || (d<150 && key && k2===key); })[0];
      if(twin){ dups[id] = String(twin.id); return; }
      appendObj_('Places',{id:id,name:nm,type:clean_(pl.type,20),posterSize:clean_(pl.posterSize,10),address:clean_(pl.address,120),
        lat:lat,lng:lng,spot:clean_(pl.spot,80),notes:clean_(pl.notes,200),active:true,status:'unverified',addedBy:clean_(p.name,40)+' ('+p.code+')',updatedAt:now_()});
      bust_();
    });
    ensure_('Pickups');
    (req.pickups||[]).slice(0,5).forEach(function(pk){
      var id = clean_(pk.id,40); if(!id || findRow_('Pickups','ReqId',id)) return;
      var waiting = table_('Pickups').rows.filter(function(r){ return r.PlayerCode===p.code && r.Status==='pending'; }).length;
      if(waiting>=3) return;
      var f=qty_(pk.flyers,300), po=qty_(pk.posters,50), st=qty_(pk.stickers,100); if(!f&&!po&&!st) return;
      appendObj_('Pickups',{ReqId:id,PlayerCode:p.code,PlayerName:clean_(p.name,40),Flyers:f,Posters:po,Stickers:st,Status:'pending',RequestedAt:now_(),UpdatedAt:now_()});
    });
    return {ok:true, logged:n, trust:trust, dups:dups, state:stateSync_(p.code, req.snap, false)};
  },
  pull: function(req){
    var code = req.code; if(!validCode_(code)) throw new Error('bad player code');
    var grants = table_('Grants').rows.filter(function(g){ return g.PlayerCode===code && !bool_(g.Applied); });
    var reds = table_('Redemptions').rows.filter(function(r){ return r.PlayerCode===code; }).slice(-30)
      .map(function(r){ return {id:r.ReqId,status:r.Status,note:r.StaffNote}; });
    var pr = findRow_('Players','Code',code);
    return {ok:true, grants:strip_(grants).map(function(g){return {id:g.GrantId,type:g.Type,flyers:g.Flyers,posters:g.Posters,stickers:g.Stickers,points:g.Points,note:g.Note};}),
      redemptions:reds, trust:pr?pr.Trust:'new', age:pr&&pr.Age?String(pr.Age):'',
      pickups: (function(){ ensure_('Pickups'); return table_('Pickups').rows.filter(function(r){ return r.PlayerCode===code; }).slice(-30)
        .map(function(r){ return {id:r.ReqId,status:r.Status,note:r.StaffNote}; }); })()};
  },
  // applied-ack comes with the next pull via req.ack
  staffLookup: function(req){
    var code = String(req.code||'').trim(); var pr = findRow_('Players','Code',code);
    if(!pr) return {ok:true, found:false};
    var pend = table_('Redemptions').rows.filter(function(r){return r.PlayerCode===code && r.Status==='pending';});
    return {ok:true, found:true, player:{code:pr.Code,name:pr.Name,wallet:pr.Wallet,earned:pr.Earned,flyers:pr.Flyers,posters:pr.Posters,stickers:pr.Stickers,trust:pr.Trust,lastSeen:pr.LastSeen,age:pr.Age||''}, pending:strip_(pend),
      pickups: (function(){ ensure_('Pickups'); return strip_(table_('Pickups').rows.filter(function(r){return r.PlayerCode===code && r.Status==='pending';})); })()};
  },
  staffGrant: function(req, role){
    if(!validCode_(req.code) || !findRow_('Players','Code',req.code)) throw new Error('Player not found');
    var f=Math.max(0,Math.min(300,Number(req.flyers)||0)), po=Math.max(0,Math.min(50,Number(req.posters)||0)), st=Math.max(0,Math.min(100,Number(req.stickers)||0));
    if(!f&&!po&&!st) throw new Error('Nothing to give');
    var id='G'+Date.now().toString(36)+Math.floor(Math.random()*1000);
    grantNow_(req.code,{Flyers:f,Posters:po,Stickers:st,Points:0});
    appendObj_('Grants',{GrantId:id,PlayerCode:req.code,Type:'material',Flyers:f,Posters:po,Stickers:st,Points:0,Note:clean_(req.note,100),By:'staff',CreatedAt:now_(),Applied:false});
    return {ok:true,id:id};
  },
  staffRedemptions: function(){
    var rows = table_('Redemptions').rows.filter(function(r){return r.Status==='pending';});
    return {ok:true, rows:strip_(rows)};
  },
  staffHandle: function(req){
    var r = findRow_('Redemptions','ReqId',req.id); if(!r) throw new Error('Request not found');
    if(r.Status!=='pending') throw new Error('Already '+r.Status);
    var st = req.status==='delivered'?'delivered':(req.status==='rejected'?'rejected':''); if(!st) throw new Error('bad status');
    setCells_('Redemptions', r._row, {Status:st,UpdatedAt:now_(),StaffNote:clean_(req.note,100),HandledBy:clean_(req.by||'staff',30)});
    if(st==='rejected'){ var pr0 = findRow_('Players','Code',r.PlayerCode); if(pr0){ var S0 = stateOf_(pr0); S0.w += Number(r.Cost)||0; saveState_(pr0,S0); } }
    return {ok:true};
  },
  staffPickups: function(req){
    ensure_('Pickups');
    var rows = table_('Pickups').rows;
    if(!req.all) rows = rows.filter(function(r){return r.Status==='pending';}); else rows = rows.slice(-150).reverse();
    return {ok:true, rows:strip_(rows), points:pickupPoints_()};
  },
  staffPickupHandle: function(req, role){
    ensure_('Pickups');
    var r = findRow_('Pickups','ReqId',req.id); if(!r) throw new Error('Pickup not found');
    if(r.Status!=='pending') throw new Error('Already '+r.Status);
    var by = role==='admin' ? 'admin' : 'staff';
    if(req.decision==='reject'){
      setCells_('Pickups', r._row, {Status:'rejected',UpdatedAt:now_(),HandledBy:by,StaffNote:clean_(req.note,100)});
      return {ok:true,status:'rejected'};
    }
    if(req.decision!=='accept') throw new Error('bad decision');
    var f = req.flyers===undefined ? Number(r.Flyers) : qty_(req.flyers,300), po = req.posters===undefined ? Number(r.Posters) : qty_(req.posters,50), st = req.stickers===undefined ? Number(r.Stickers) : qty_(req.stickers,100);
    if(!f&&!po&&!st) throw new Error('Nothing to hand over');
    var id='G'+Date.now().toString(36)+Math.floor(Math.random()*1000);
    grantNow_(r.PlayerCode,{Flyers:f,Posters:po,Stickers:st,Points:pickupPoints_()});
    appendObj_('Grants',{GrantId:id,PlayerCode:r.PlayerCode,Type:'pickup',Flyers:f,Posters:po,Stickers:st,Points:pickupPoints_(),Note:'Pickup approved',By:by,CreatedAt:now_(),Applied:false});
    setCells_('Pickups', r._row, {Status:'accepted',Flyers:f,Posters:po,Stickers:st,UpdatedAt:now_(),HandledBy:by,StaffNote:clean_(req.note,100)});
    return {ok:true,status:'accepted',id:id};
  },
  staffSetAge: function(req){
    var r = findRow_('Players','Code',req.code); if(!r) throw new Error('Player not found');
    if(req.age!=='u16' && req.age!=='16+') throw new Error('bad age group');
    setCells_('Players', r._row, {Age:req.age});
    if(req.age==='u16'){ var pz = findRow_('Presence','Code',req.code); if(pz) setCells_('Presence', pz._row, {Lat:'',Lng:'',UpdatedAt:now_()}); }
    return {ok:true, age:req.age};
  },
  photoUpload: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    var pr = findRow_('Players','Code',p.code); if(!pr) throw new Error('Unknown player');
    if(String(pr.Age)==='u16') throw new Error('Photos are not available for this player.');
    if(req.consent!==true) throw new Error('Photo consent is missing.');
    var fid = prop_('PHOTO_FOLDER_ID'); if(!fid) throw new Error('The photo folder is not set up yet.');
    var id = clean_(req.id,40); if(!id) throw new Error('missing photo id');
    if(findRow_('Photos','PhotoId',id)) return {ok:true, duplicate:true};
    var b64 = String(req.image||''); if(!b64 || b64.length>900000) throw new Error('Photo too large');
    var today = now_().slice(0,10);
    var n = table_('Photos').rows.filter(function(r){ return r.PlayerCode===p.code && String(r.UploadedAt).slice(0,10)===today; }).length;
    if(n>=10) throw new Error('Enough photos for today, Lunito!');
    var bytes = Utilities.base64Decode(b64);
    if(!(bytes.length>4 && (bytes[0]&255)===255 && (bytes[1]&255)===216)) throw new Error('That does not look like a JPEG photo');
    var nick = clean_(pr.Name||p.name,24).replace(/[^A-Za-z0-9_-]+/g,'_');
    var name = 'sticker_' + now_().slice(0,19).replace(/[:T]/g,'-') + '_' + nick + '.jpg';
    var file = DriveApp.getFolderById(fid).createFile(Utilities.newBlob(bytes,'image/jpeg',name));
    appendObj_('Photos',{Size:bytes.length,PhotoId:id,FileId:file.getId(),Url:file.getUrl(),Nick:clean_(pr.Name||p.name,40),PlayerCode:p.code,
      Country:clean_(req.country,60),City:clean_(req.city,60),Consent:'yes',UploadedAt:now_(),Pick:''});
    return {ok:true, url:file.getUrl()};
  },
  adminPhotos: function(req){
    var rows = table_('Photos').rows.slice().reverse();
    if(req.pick) rows = rows.filter(function(r){ return r.Pick==='yes'; });
    var start = Math.max(0, Number(req.offset)||0), page = rows.slice(start, start+12);
    var items = page.map(function(r){
      var o = {id:r.PhotoId,url:r.Url,nick:r.Nick,player:r.PlayerCode,country:r.Country,city:r.City,at:r.UploadedAt,pick:r.Pick==='yes',consent:r.Consent,thumb:'',size:Number(r.Size)||0,file:String(r.FileId||'').split('/').pop()};
      try{
        var f = DriveApp.getFileById(r.FileId), b = f.getThumbnail() || f.getBlob(), by = b.getBytes();
        if(by.length<260000) o.thumb = 'data:'+b.getContentType()+';base64,'+Utilities.base64Encode(by);
      }catch(e){}
      return o;
    });
    return {ok:true, items:items, total:rows.length, next:(start+12<rows.length)?start+12:null, folder:prop_('PHOTO_FOLDER_ID')?true:false};
  },
  recoverPlayer: function(req){
    var cache = CacheService.getScriptCache(), f = Number(cache.get('recfails')||0);
    if(f>=30) throw new Error('Too many tries. Please wait a few minutes and try again.');
    var m = String(req.code||'').trim().toUpperCase().match(/^(?:MQ:)?([A-Z0-9\-]{3,24})$/), code = m ? m[1] : '';
    var pr = code ? findRow_('Players','Code',code) : null;
    if(!pr){ cache.put('recfails', String(f+1), 600); throw new Error("We couldn't find that code. Check it and try again."); }
    if(String(pr.Access)==='banned') return {ok:false, banned:true, error:'This Lunito has been removed from MondQuest.'};
    var ex = {}; try{ ex = JSON.parse(pr.Extras||'{}'); }catch(e){}
    return {ok:true, player:{code:pr.Code, name:pr.Name, wallet:Number(pr.Wallet)||0, earned:Number(pr.Earned)||0, flyers:Number(pr.Flyers)||0, posters:Number(pr.Posters)||0, stickers:Number(pr.Stickers)||0}, extras:ex};
  },
  // ---- reports about a place (one per player and place); enough reports hide the place until an admin looks ----
  flagPlace: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    schema_();
    var pl = findRow_('Places','id',clean_(req.placeId,40)); if(!pl) throw new Error('Place not found');
    var reason = req.reason==="Place doesn't exist" ? "Place doesn't exist" : (req.reason==='No flyers allowed here' ? 'No flyers allowed here' : '');
    if(!reason) throw new Error('bad reason');
    var rows = table_('Flags').rows;
    if(rows.some(function(r){ return r.PlaceId===pl.id && r.PlayerCode===p.code && r.Status==='open'; })) return {ok:true, duplicate:true};
    var who = findRow_('Players','Code',p.code);
    appendObj_('Flags',{Id:clean_(req.id,40)||('f'+Date.now().toString(36)),PlaceId:pl.id,PlaceName:clean_(pl.name,60),PlayerCode:p.code,Nick:clean_(who?who.Name:p.name,40),Reason:reason,At:now_(),Status:'open'});
    var open = {}; table_('Flags').rows.forEach(function(r){ if(r.PlaceId===pl.id && r.Status==='open') open[r.PlayerCode]=1; });
    if(who){ var Sf = stateOf_(who), kf = 'F:'+pl.id;
      if(Sf.rated.indexOf(kf)<0){ Sf.rated.push(kf); award_(Sf, cfg_('points.rating'), {}, []); saveState_(who, Sf); } }
    var n = Object.keys(open).length, limit = Number((findRow_('Config','Key','flags.hideAt')||{}).Value)||3, hidden=false;
    if(n>=limit && bool_(pl.active)){ setCells_('Places',pl._row,{active:false,status:'flagged',updatedAt:now_()}); bust_(); hidden=true; }
    return {ok:true, reports:n, hidden:hidden};
  },
  adminFlags: function(){
    schema_();
    return {ok:true, rows:strip_(table_('Flags').rows.slice(-300).reverse())};
  },
  adminFlagResolve: function(req){
    schema_();
    var pl = findRow_('Places','id',clean_(req.placeId,40)); if(!pl) throw new Error('Place not found');
    var remove = req.remove===true;
    setCells_('Places',pl._row, remove ? {active:false,status:'rejected',updatedAt:now_()} : {active:true,status:(pl.status==='flagged'?'approved':pl.status),updatedAt:now_()});
    table_('Flags').rows.forEach(function(r){ if(r.PlaceId===pl.id && r.Status==='open') setCells_('Flags',r._row,{Status:remove?'confirmed':'dismissed'}); });
    bust_(); return {ok:true};
  },
  // ---- public ranking: nicknames, Lunitos, outfits and gadgets (never codes or locations) ----
  ranking: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    schema_();
    var cache = CacheService.getScriptCache(), c = cache.get('rank'), list;
    if(c){ list = JSON.parse(c); } else {
      var ranks = strip_(table_('Ranks').rows).map(function(r){ return {name:String(r.name),earned:Number(r.earned)||0,rank:Number(r.rank)||0}; }).sort(function(a,b){return a.earned-b.earned;});
      var stat = {};
      table_('World').rows.forEach(function(r){ if(bool_(r.Hidden)) return; var o = stat[r.PlayerCode] || (stat[r.PlayerCode]={flyers:0,posters:0,stickers:0,spotted:0,places:0});
        if(r.Kind==='drop'){ o.flyers+=Number(r.Flyers)||0; o.posters+=Number(r.Posters)||0; o.stickers+=Number(r.Stickers)||0; } else if(r.Kind==='sight') o.spotted++; });
      table_('Places').rows.forEach(function(r){ var m = /\(([A-Za-z0-9\-]{3,24})\)\s*$/.exec(String(r.addedBy||'')); if(m){ var o = stat[m[1]] || (stat[m[1]]={flyers:0,posters:0,stickers:0,spotted:0,places:0}); if(bool_(r.active)) o.places++; } });
      list = table_('Players').rows.filter(function(r){ return String(r.Access||'')!=='banned' && String(r.Access||'')!=='removed' && Number(r.Earned)>0; })
        .map(function(r){ var ex = {}; try{ ex = JSON.parse(r.Extras||'{}'); }catch(e){}
          var e = Number(r.Earned)||0, rk = 0, rn = ranks.length?ranks[0].name:''; ranks.forEach(function(x,i){ if(e>=x.earned){ rk=i; rn=x.name; } });
          var s = stat[r.Code] || {flyers:0,posters:0,stickers:0,spotted:0,places:0};
          return {pid:pid_(r.Code), name:String(r.Name||'Courier'), earned:Math.round(e), rank:rk+1, rankName:rn, look:ex.look||{}, owned:(ex.acc||{}).o||[], equipped:(ex.acc||{}).e||[], gadgets:(ex.gad||{}).o||[], gadgetsOn:(ex.gad||{}).e||[], combos:ex.cd||[], stats:s, since:Number(ex.at)||0};
        }).sort(function(a,b){ return b.earned-a.earned; }).slice(0,100);
      try{ cache.put('rank', JSON.stringify(list), 60); }catch(e){}
    }
    var me = pid_(p.code), pos = -1; list.forEach(function(x,i){ if(x.pid===me) pos=i+1; });
    return {ok:true, rows:list, me:me, pos:pos};
  },
  // ---- shared world activity: flyer drops and sticker sightings every player can see ----
  worldPost: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    var pr = findRow_('Players','Code',p.code); if(!pr) throw new Error('Unknown player');
    schema_();
    var today = now_().slice(0,10), mine = table_('World').rows.filter(function(r){ return r.PlayerCode===p.code; });
    var todayN = mine.filter(function(r){ return String(r.At).slice(0,10)===today; }).length;
    var seen = {}; mine.forEach(function(r){ seen[r.Id]=1; });
    var nick = clean_(pr.Name||p.name,40), n = 0;
    (req.items||[]).slice(0,10).forEach(function(it){
      // build 15: drops and sightings are recorded by the server itself (act); this only adds a missing photo to my own sighting
      var id = clean_(it.id,40); if(!id || it.kind!=='sight') return;
      if(seen[id]){ var th0 = String(it.thumb||''); if(/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(th0) && th0.length<=30000 && !findRow_('Thumbs','Id',id)) appendObj_('Thumbs',{Id:id,Data:th0}); return; }
      return;
      var at = Number(it.at); if(!isFinite(at) || at<Date.now()-8*86400000 || at>Date.now()+3600000) at = Date.now();
      if(it.kind==='drop'){
        var pl = clean_(it.placeId,40); if(!/^[\w-]{1,40}$/.test(pl)) return;
        var f=qty_(it.flyers,500), po=qty_(it.posters,100), st=qty_(it.stickers,200); if(!f&&!po&&!st) return;
        appendObj_('World',{Id:id,Kind:'drop',PlaceId:pl,Nick:nick,PlayerCode:p.code,Flyers:f,Posters:po,Stickers:st,At:new Date(at).toISOString()}); n++;
      } else if(it.kind==='sight'){
        var lat=Number(it.lat), lng=Number(it.lng); if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) return;
        appendObj_('World',{Id:id,Kind:'sight',Lat:Math.round(lat*100000)/100000,Lng:Math.round(lng*100000)/100000,Nick:nick,PlayerCode:p.code,
          Text:clean_(it.text,160),Country:clean_(it.country,60),At:new Date(at).toISOString()});
        var th = String(it.thumb||'');
        if(/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(th) && th.length<=30000) appendObj_('Thumbs',{Id:id,Data:th});
        n++;
      }
    });
    return {ok:true, added:n};
  },
  worldGet: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    schema_();
    var cut = Date.now()-30*86400000, drops = [], sights = [], ratings = {}, mine = {};
    var hasThumb = {}, ts = sh_('Thumbs'), tl = ts.getLastRow();
    if(tl>1) ts.getRange(2,1,tl-1,1).getValues().forEach(function(r){ if(r[0]!=='') hasThumb[String(r[0])]=1; });
    table_('World').rows.forEach(function(r){
      if(bool_(r.Hidden)) return;
      var at = ms_(r.At), me = r.PlayerCode===p.code, pid = pid_(r.PlayerCode);
      if(r.Kind==='drop'){ if(at<cut) return;
        drops.push({id:String(r.Id),placeId:String(r.PlaceId),nick:String(r.Nick||'Courier'),pid:pid,me:me,flyers:Number(r.Flyers)||0,posters:Number(r.Posters)||0,stickers:Number(r.Stickers)||0,at:at});
      } else if(r.Kind==='rate'){
        var rt = Math.round(Number(r.Text)); if(rt>=1 && rt<=5){ var ro = ratings[r.PlaceId]||(ratings[r.PlaceId]={s:0,n:0}); ro.s += rt; ro.n++; if(me) mine[r.PlaceId] = rt; }
      } else if(r.Kind==='sight'){
        sights.push({id:String(r.Id),lat:Number(r.Lat),lng:Number(r.Lng),nick:String(r.Nick||'Courier'),pid:pid,me:me,text:String(r.Text||''),country:String(r.Country||''),thumb:!!hasThumb[r.Id],at:at});
      }
    });
    drops.sort(function(a,b){return b.at-a.at}); sights.sort(function(a,b){return b.at-a.at});
    return {ok:true, drops:drops.slice(0,400), sights:sights.slice(0,300), ratings:ratings, mine:mine};
  },
  worldThumb: function(req){
    var id = clean_(req.id,40); if(!id) throw new Error('missing id');
    var w = findRow_('World','Id',id); if(!w || bool_(w.Hidden)) return {ok:true, thumb:''};
    var r = findRow_('Thumbs','Id',id);
    return {ok:true, thumb: r ? String(r.Data) : ''};
  },
  chatSync: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    schema_();
    if(!bool_((findRow_('Config','Key','chat.enabled')||{}).Value)) return {ok:true, enabled:false, messages:[]};
    var pr = findRow_('Players','Code',p.code), canPost = !!pr && String(pr.Access)!=='nochat', nowMs = Date.now();
    var text = clean_(req.text,140).replace(/\s+/g,' ').trim();
    if(text){
      if(!canPost) throw new Error("You can't post in the chat right now.");
      if(/https?:|www\.|\.(com|de|net|org|io|me|ly|gg)\b|@\w/i.test(text)) throw new Error('Links and @handles are not allowed here. Keep it simple and friendly!');
      var all = table_('Chat').rows, last = null;
      for(var i=all.length-1;i>=0;i--){ if(all[i].PlayerCode===p.code){ last = all[i]; break; } }
      if(last && nowMs - Number(last.At) < 5000) throw new Error('Easy, Lunito! Give it a few seconds.');
      appendObj_('Chat', {MsgId:'m'+nowMs.toString(36)+Math.floor(Math.random()*1296).toString(36), PlayerCode:p.code, Name:clean_(pr.Name,40), Look:lookJson_(req.look), Text:text, At:nowMs, Hidden:''});
      var sh = sh_('Chat'), n = sh.getLastRow()-1; if(n>250) sh.deleteRows(2, n-200);
    }
    if(req.peek){
      var since = Number(req.since)||0, mute = {}; (Array.isArray(req.mute)?req.mute:[]).slice(0,60).forEach(function(m){ mute[String(m)] = 1; });
      var unread = 0, rows = table_('Chat').rows;
      for(var j=rows.length-1;j>=0 && j>=rows.length-80;j--){ var rw = rows[j];
        if(Number(rw.At) <= since) break;
        if(String(rw.Hidden)!=='yes' && rw.PlayerCode!==p.code && !mute[pid_(rw.PlayerCode)]) unread++; }
      return {ok:true, enabled:true, canPost:canPost, unread:unread, now:nowMs};
    }
    var msgs = table_('Chat').rows.filter(function(r){ return String(r.Hidden)!=='yes'; }).slice(-80).map(function(r){
      var lk = {}; try{ lk = JSON.parse(r.Look||'{}'); }catch(e){}
      return {id:r.MsgId, pid:pid_(r.PlayerCode), me:r.PlayerCode===p.code, name:r.Name, look:lk, text:r.Text, at:Number(r.At)}; });
    return {ok:true, enabled:true, canPost:canPost, messages:msgs};
  },
  adminChat: function(){
    ensure_('Chat');
    var rows = table_('Chat').rows.slice(-60).reverse().map(function(r){
      var pw = findRow_('Players','Code',r.PlayerCode);
      return {id:r.MsgId, code:r.PlayerCode, name:r.Name, text:r.Text, at:Number(r.At), hidden:String(r.Hidden)==='yes', access:pw?String(pw.Access||''):''}; });
    return {ok:true, enabled:bool_((findRow_('Config','Key','chat.enabled')||{}).Value), rows:rows};
  },
  adminPickupPoints: function(req){
    if(Array.isArray(req.points)){
      var list = req.points.slice(0,30).map(cleanPoint_).filter(function(p){ return p.lat!=null && p.lng!=null && (p.name || p.main); });
      var seen = {}; list = list.filter(function(p){ if(seen[p.id]) return false; seen[p.id]=1; return true; });
      var v = JSON.stringify(list), r = findRow_('Config','Key','pickup.points');
      if(r) setCells_('Config', r._row, {Value:v}); else appendObj_('Config',{Key:'pickup.points',Value:v,'What it does':'Extra flyer pickup points. Edit in Admin > Pickup points, not here.'});
      bust_();
    }
    return {ok:true, points:pickupPointsList_(false)};
  },
  adminChatSetting: function(req){
    var v = req.enabled===true ? 'TRUE' : 'FALSE', r = findRow_('Config','Key','chat.enabled');
    if(r) setCells_('Config', r._row, {Value:v}); else appendObj_('Config',{Key:'chat.enabled',Value:v,'What it does':'Moon chat on (TRUE) or off (FALSE).'});
    bust_(); return {ok:true, enabled:v==='TRUE'};
  },
  adminChatHide: function(req){
    var r = findRow_('Chat','MsgId',req.id); if(!r) throw new Error('Message not found');
    setCells_('Chat', r._row, {Hidden: req.hide===false ? '' : 'yes'}); return {ok:true};
  },
  adminSetAccess: function(req){
    var a = String(req.access||''); if(['','nochat','banned'].indexOf(a)<0) throw new Error('bad access value');
    if(!validCode_(req.code)) throw new Error('bad player code');
    var r = findRow_('Players','Code',req.code); if(!r) throw new Error('Player not found');
    setCells_('Players', r._row, {Access:a});
    if(a==='banned'){ var c = table_('Chat').rows; c.forEach(function(m){ if(m.PlayerCode===req.code && String(m.Hidden)!=='yes') setCells_('Chat', m._row, {Hidden:'yes'}); }); }
    return {ok:true};
  },
  adminBanner: function(req){
    var text = clean_(req.text,160).trim(); if(!text) throw new Error('Write a message first.');
    var hrs = Math.max(0.25, Math.min(168, Number(req.hours)||3)), t = Date.now(), id = 'bn' + t.toString(36);
    ensure_('Banners');
    appendObj_('Banners', {id:id, emoji:clean_(req.emoji||'📣',8), text:text, startsAt:t, endsAt:t+Math.round(hrs*3600000), active:true});
    bust_(); return {ok:true, id:id};
  },
  adminBannerStop: function(req){
    var r = findRow_('Banners','id',req.id); if(!r) throw new Error('Announcement not found');
    setCells_('Banners', r._row, {active:false}); bust_(); return {ok:true};
  },
  adminBanners: function(){ ensure_('Banners'); return {ok:true, rows:strip_(table_('Banners').rows.slice(-30).reverse())}; },
  adminPhotoPick: function(req){
    var r = findRow_('Photos','PhotoId',req.id); if(!r) throw new Error('Photo not found');
    setCells_('Photos', r._row, {Pick: req.pick===true ? 'yes' : ''});
    return {ok:true};
  },
  placeEdit: function(req){
    // the player who added a place may fix its details; everybody gets the change on their next refresh
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    var pl = req.place||{}, id = clean_(pl.id,40), r = id ? findRow_('Places','id',id) : null;
    if(!r) return {ok:false, error:'Place not found'};
    if(String(r.addedBy||'').indexOf('('+p.code+')')<0) return {ok:false, error:'Only the player who added this place can edit it'};
    var lat=Number(pl.lat), lng=Number(pl.lng); if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) throw new Error('bad position');
    var nm = clean_(pl.name,60); if(!nm) throw new Error('name needed');
    setCells_('Places', r._row, {name:nm,type:clean_(pl.type,20),posterSize:clean_(pl.posterSize,10),address:clean_(pl.address,120),lat:lat,lng:lng,spot:clean_(pl.spot,80),notes:clean_(pl.notes,200),updatedAt:now_()});
    bust_(); return {ok:true};
  },
  presenceSync: function(req){
    var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
    ensure_('Presence');
    var pr = findRow_('Players','Code',p.code); if(pr) setCells_('Players', pr._row, {LastSeen:now_()});
    var row = findRow_('Presence','Code',p.code), t = now_();
    var minor = !!(pr && String(pr.Age)==='u16');
    if(minor){ if(row && row.Lat!=='') setCells_('Presence', row._row, {Lat:'',Lng:'',UpdatedAt:t}); }
    else if(req.stop){
      if(row) setCells_('Presence', row._row, {Lat:'',Lng:'',UpdatedAt:t});
    } else if(req.lat!==undefined && req.lng!==undefined){
      var lat=Number(req.lat), lng=Number(req.lng);
      if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) throw new Error('bad position');
      var vals={Name:clean_(p.name,40),Lat:Math.round(lat*500)/500,Lng:Math.round(lng*500)/500,Look:clean_(JSON.stringify(req.look||{}),700),UpdatedAt:t};
      if(row) setCells_('Presence', row._row, vals); else { vals.Code=p.code; appendObj_('Presence', vals); }
    }
    var nowMs = Date.now(), sharing = [], sharingIds = {};
    if(!minor) table_('Presence').rows.forEach(function(r){
      if(r.Lat==='' || r.Lng==='' || nowMs-ms_(r.UpdatedAt) > 30*60000) return;
      var look = {}; try{ look = JSON.parse(String(r.Look||'{}')); }catch(e){}
      var id = pid_(r.Code); sharingIds[id]=1;
      sharing.push({pid:id,name:String(r.Name||'Courier'),lat:Number(r.Lat),lng:Number(r.Lng),look:look,updatedAt:ms_(r.UpdatedAt),me:r.Code===p.code});
    });
    var online = [];
    table_('Players').rows.forEach(function(r){
      if(nowMs-ms_(r.LastSeen) > 5*60000) return;
      var id = pid_(r.Code);
      online.push({pid:id,name:String(r.Name||'Courier'),sharing:!!sharingIds[id],me:r.Code===p.code});
    });
    return {ok:true, online:online.slice(0,100), sharing:sharing.slice(0,100)};
  },
  adminImportPlaces: function(req){
    var rows = req.rows||[]; if(!rows.length) throw new Error('No rows to import');
    if(rows.length>300) throw new Error('Import at most 300 places at a time');
    var status = req.status==='submitted' ? 'submitted' : 'approved', active = status==='approved';
    var existing = table_('Places').rows.map(function(r){ return {name:String(r.name).toLowerCase().trim(), lat:Number(r.lat), lng:Number(r.lng)}; });
    var added=0, skipped=[], bad=[], base=Date.now();
    rows.forEach(function(r, i){
      var name = clean_(r.name,60).trim(), lat=Number(r.lat), lng=Number(r.lng);
      if(!name){ bad.push('Row '+(i+1)+': missing name'); return; }
      if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180||(lat===0&&lng===0)){ bad.push(name+': invalid coordinates'); return; }
      var dup = existing.some(function(e){ return e.name===name.toLowerCase() && Math.abs(e.lat-lat)<0.0005 && Math.abs(e.lng-lng)<0.0005; });
      if(dup){ skipped.push(name); return; }
      var type = clean_(r.type,20).toLowerCase().trim(); if(PLACE_TYPES.indexOf(type)<0) type='other';
      var size = clean_(r.posterSize,10).toUpperCase().trim(); if(['A4','A3','A2','A1'].indexOf(size)<0) size='A4';
      appendObj_('Places',{id:'imp'+(base+i).toString(36),name:name,type:type,posterSize:size,address:clean_(r.address,120),lat:lat,lng:lng,
        spot:clean_(r.spot,80),notes:clean_(r.notes,200),active:active,status:status,addedBy:'admin (CSV import)',updatedAt:now_()});
      existing.push({name:name.toLowerCase(),lat:lat,lng:lng}); added++;
    });
    bust_();
    return {ok:true, added:added, skipped:skipped, invalid:bad};
  },
  adminGet: function(){
    schema_();
    var o={ok:true}; EDITABLE.concat(['Redemptions']).forEach(function(n){ var t=table_(n); o[n]={headers:t.h,rows:strip_(t.rows)}; });
    return o;
  },
  adminSave: function(req){
    var n=req.sheet; if(EDITABLE.indexOf(n)<0) throw new Error('Tab not editable');
    var rows=req.rows||[]; if(rows.length>500) throw new Error('Too many rows');
    var s=sh_(n), h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
    if(n==='Cosmetics'||n==='Gadgets') rows.forEach(function(r){ var c=Number(r.cost); if(!(c>=3&&c<=10)) throw new Error('Cost must be between 3 and 10: '+r.name); });
    if(n==='Rewards') rows.forEach(function(r){ if(!(Number(r.cost)>0)) throw new Error('Reward cost must be positive: '+r.name); });
    var data = rows.map(function(r){ return h.map(function(k){ var v=r[k]; return v===undefined?'':safeCell_(v); }); });
    var last=s.getLastRow(); if(last>1) s.getRange(2,1,last-1,h.length).clearContent();
    if(data.length) s.getRange(2,1,data.length,h.length).setValues(data);
    bust_(); return {ok:true,saved:data.length};
  },
  adminPlayers: function(){
    var dist = {}; table_('World').rows.forEach(function(r){ if(r.Kind==='drop'){ var d = dist[r.PlayerCode]||(dist[r.PlayerCode]={f:0,p:0,s:0}); d.f+=Number(r.Flyers)||0; d.p+=Number(r.Posters)||0; d.s+=Number(r.Stickers)||0; } });
    var rows = strip_(table_('Players').rows).map(function(r){
      var S = null; try{ if(r.State) S = JSON.parse(r.State); }catch(e){}
      var d = S&&S.dist ? S.dist : null, w = dist[r.Code]||{f:0,p:0,s:0};
      r.dFlyers = d ? d.flyers : w.f; r.dPosters = d ? d.posters : w.p; r.dStickers = d ? d.stickers : w.s;
      r.rank = S ? rk_(S.e) + 1 : rk_(Number(r.Earned)||0) + 1;
      delete r.State; delete r.Extras; return r; });
    return {ok:true, rows:rows};
  },
  adminLog: function(){ return {ok:true, rows:strip_(table_('Log').rows.slice(-300))}; },
  adminSetTrust: function(req){
    var r=findRow_('Players','Code',req.code); if(!r) throw new Error('Player not found');
    if(['new','trusted','flagged'].indexOf(req.trust)<0) throw new Error('bad trust');
    setCells_('Players',r._row,{Trust:req.trust}); return {ok:true};
  },
  adminReviewPlace: function(req){
    var r=findRow_('Places','id',req.id); if(!r) throw new Error('Place not found');
    var ok = req.approve===true;
    setCells_('Places',r._row,{status:ok?'approved':'rejected',active:ok,updatedAt:now_()}); bust_(); return {ok:true};
  },
  adminGrant: function(req){
    if(!validCode_(req.code) || !findRow_('Players','Code',req.code)) throw new Error('Player not found');
    var pts=Math.max(-500,Math.min(500,Number(req.points)||0)), f=Math.max(0,Number(req.flyers)||0), po=Math.max(0,Number(req.posters)||0), st=Math.max(0,Number(req.stickers)||0);
    var id='G'+Date.now().toString(36)+Math.floor(Math.random()*1000);
    grantNow_(req.code,{Flyers:f,Posters:po,Stickers:st,Points:pts});
    appendObj_('Grants',{GrantId:id,PlayerCode:req.code,Type:pts?'points':'material',Flyers:f,Posters:po,Stickers:st,Points:pts,Note:clean_(req.note,100),By:'admin',CreatedAt:now_(),Applied:false});
    return {ok:true,id:id};
  }
};

// Called by pull when the player confirms (ack) grants it has applied
HANDLERS._ack = null;
var _origPull = HANDLERS.pull;
HANDLERS.pull = function(req){
  (req.ack||[]).slice(0,50).forEach(function(id){
    var g=findRow_('Grants','GrantId',id); if(g && g.PlayerCode===req.code) setCells_('Grants',g._row,{Applied:true});
  });
  var rp = _origPull(req); rp.state = stateSync_(req.code, null, false); return rp;
};

// ===================================================================
// Economy engine (build 15): the server owns points, material and progress.
// The phone only sends what the player DID (an "intent"); the server works out the rest.
// ===================================================================
var RANKS_ = [0,20,50,90,140,200,270,350,450,600];
var ADV_ = {night:{name:'Night Adventure',mult:2,uses:5,rank:1,reward:{comet:2}}, run:{name:'Cargo Run',mult:1.5,uses:8,rank:2,reward:{meteor:1,rings:1}}, eclipse:{name:'Eclipse Quest',mult:3,uses:3,rank:5,reward:{void:1,nebula:1}}};
var MINS_ = ['meteor','comet','nebula','void','rings'];
var MATS_ = ['flyers','posters','stickers'];
var COMBOS_ = [{id:'p3',stat:'places',at:3,bonus:10},{id:'p5',stat:'places',at:5,bonus:20},{id:'p10',stat:'places',at:10,bonus:50},{id:'f100',stat:'flyers',at:100,bonus:10},{id:'f250',stat:'flyers',at:250,bonus:25},{id:'f500',stat:'flyers',at:500,bonus:50},{id:'po5',stat:'posters',at:5,bonus:15}];
var EUROPE_ = ['albania','andorra','austria','belarus','belgium','belgique','bosnia','bulgaria','croatia','cyprus','czechia','czech republic','denmark','estonia','finland','france','germany','deutschland','greece','hungary','iceland','ireland','italy','kosovo','latvia','liechtenstein','lithuania','luxembourg','malta','moldova','monaco','montenegro','netherlands','north macedonia','norway','poland','portugal','romania','san marino','serbia','slovakia','slovenia','spain','sweden','switzerland','ukraine','united kingdom','uk','vatican','europe'];
var CFGDEF_ = {'points.pickup':5,'points.discover':10,'points.deliverPerItem':0.2,'points.posterPerItem':20,'points.stickerPerItem':1,'points.deliveryPhoto':2,'points.discoverPhoto':2,'points.spottedPhoto':2,'points.rating':1,'points.flyerHotMultiplier':0.5,'points.route':15,
  'spotted.baseBerlin':5,'spotted.baseGermany':8,'spotted.baseEurope':12,'spotted.max':20,'spotted.maxDistanceKm':10000,'spotted.scalePerKm':0.0015,
  'pickup.flyers':30,'pickup.posters':6,'pickup.stickers':12,'pickup.expiryDays':15,'pickup.expiryPenalty':5,'regularity.days':3,'regularity.windowDays':7,'regularity.bonus':5,
  'initialInventory.flyers':30,'initialInventory.posters':6,'initialInventory.stickers':12};
var CFGMAP_ = null;
function cfg_(k){
  if(!CFGMAP_){ CFGMAP_ = {}; try{ table_('Config').rows.forEach(function(r){ CFGMAP_[String(r.Key)] = r.Value; }); }catch(e){} }
  var v = Number(CFGMAP_[k]); return (CFGMAP_[k]!=='' && CFGMAP_[k]!==undefined && isFinite(v)) ? v : CFGDEF_[k];
}
function rank_(e){ var r=0; for(var i=0;i<RANKS_.length;i++) if(e>=RANKS_[i]) r=i; return r; }
function rankList_(){ try{ var t=table_('Ranks').rows; if(t.length){ var a=t.map(function(r){return Number(r.earned)||0;}); a.sort(function(x,y){return x-y;}); return a; } }catch(e){} return RANKS_; }
function rk_(e){ var L=rankList_(), r=0; for(var i=0;i<L.length;i++) if(e>=L[i]) r=i; return r; }
function combos_(){ try{ var t=table_('Combos').rows; if(t.length) return t.map(function(c){ return {id:String(c.id),stat:String(c.stat),at:Number(c.at),bonus:Number(c.bonus)}; }); }catch(e){} return COMBOS_; }
function outfitRank_(c){ var cost=Number(c.cost)||0; return Number(c.rank) || (cost<=4?1:cost<=6?2:cost<=7?3:cost<=8?4:cost<=9?5:6); }
function actList_(a,max){ return Array.isArray(a) ? a.slice(0,max||200).map(String) : []; }
function newState_(){
  return {v:1,w:0,e:0,inv:{flyers:cfg_('initialInventory.flyers'),posters:cfg_('initialInventory.posters'),stickers:cfg_('initialInventory.stickers')},
    dist:{flyers:0,posters:0,stickers:0},col:{flyers:0,posters:0,stickers:0},carry:0,min:{meteor:0,comet:0,nebula:0,void:0,rings:0},ch:1,adv:null,gO:[],aO:[],cd:[],days:[],rw:0,bt:[],pl:0,rated:[],seen:[],pk:false,dd:{d:'',n:0},rd:{d:'',n:0}};
}
// Reads (or creates, once) the authoritative state of a player. Older players start from what their row already holds.
function stateOf_(row, snap){
  var S = null; try{ if(row.State) S = JSON.parse(row.State); }catch(e){ S = null; }
  if(S && S.v) return S;
  S = newState_();
  var legacy = Number(row.Earned)>0 || Number(row.Wallet)>0;
  if(legacy){
    S.w = Number(row.Wallet)||0; S.e = Number(row.Earned)||0;
    S.inv = {flyers:Math.max(0,Number(row.Flyers)||0),posters:Math.max(0,Number(row.Posters)||0),stickers:Math.max(0,Number(row.Stickers)||0)};
    try{ var x = JSON.parse(row.Extras||'{}');
      S.gO = idList_((x.gad||{}).o); S.aO = idList_((x.acc||{}).o); S.cd = idList_(x.cd); S.ch = Math.max(0,Math.min(999,Number(x.ch)||0));
      MINS_.forEach(function(k){ S.min[k] = Math.max(0,Number((x.min||{})[k])||0); }); }catch(e){}
    S.pk = S.e>0;
    try{ table_('Grants').rows.forEach(function(g){ if(g.PlayerCode===row.Code && bool_(g.Applied)){ S.col.flyers+=Number(g.Flyers)||0; S.col.posters+=Number(g.Posters)||0; S.col.stickers+=Number(g.Stickers)||0; } }); }catch(e){}
    if(S.pk){ S.col.flyers+=cfg_('pickup.flyers'); S.col.posters+=cfg_('pickup.posters'); S.col.stickers+=cfg_('pickup.stickers'); }
    snap = snap||{};
    if(snap.dist){ MATS_.forEach(function(k){ S.dist[k] = qty_(snap.dist[k],1000000); }); }
    S.pl = qty_(snap.pl,100000);
    if(snap.fp) S.pk = true;
  }
  // grants the staff created before this player had a server-side state
  try{ table_('Grants').rows.forEach(function(g){ if(g.PlayerCode===row.Code && !bool_(g.Applied)) grantApply_(S,g); }); }catch(e){}
  return S;
}
function saveState_(row, S){
  S.seen = S.seen.slice(-120); S.bt = S.bt.filter(function(b){ return !b.expired; }).slice(-30); S.rated = S.rated.slice(-400); S.days = S.days.slice(-60);
  S.w = Math.round(S.w*1e6)/1e6; S.e = Math.round(S.e*1e6)/1e6;
  var ex = {}; try{ ex = JSON.parse(row.Extras||'{}'); }catch(e){} if(!ex || typeof ex!=='object') ex = {};
  ex.acc = ex.acc||{o:[],e:[]}; ex.gad = ex.gad||{o:[],e:[]};
  ex.acc.o = S.aO; ex.gad.o = S.gO; ex.min = S.min; ex.ch = S.ch; ex.cd = S.cd;
  var exs = JSON.stringify(ex);
  setCells_('Players', row._row, {State:JSON.stringify(S), Wallet:S.w, Earned:S.e, Flyers:S.inv.flyers, Posters:S.inv.posters, Stickers:S.inv.stickers, Extras: exs.length<=4000?exs:row.Extras});
}
function publicState_(S){
  var a = S.adv ? {id:S.adv.id,name:S.adv.name,mult:S.adv.mult,left:S.adv.left,uses:S.adv.uses,reward:S.adv.reward} : null;
  var bt = S.bt.filter(function(b){ return !b.expired; }).map(function(b){ return {id:b.id,at:b.at,taken:b.taken,delivered:b.delivered,expired:false}; });
  return {w:S.w,e:S.e,inv:S.inv,dist:S.dist,carry:S.carry,min:S.min,ch:S.ch,adv:a,gO:S.gO,aO:S.aO,cd:S.cd,bt:bt,pl:S.pl,pk:S.pk,rated:S.rated.slice(-200),rank:rk_(S.e)};
}
function batchAdd_(S, q, now){ S.col = S.col||{flyers:0,posters:0,stickers:0}; S.col.flyers+=q.flyers||0; S.col.posters+=q.posters||0; S.col.stickers+=q.stickers||0; S.bt.push({id:'b'+now.toString(36)+Math.floor(Math.random()*1000),at:now,taken:{flyers:q.flyers||0,posters:q.posters||0,stickers:q.stickers||0},delivered:{flyers:0,posters:0,stickers:0},expired:false}); }
function expire_(S, now){
  S.bt.forEach(function(b){
    if(b.expired || now-b.at < cfg_('pickup.expiryDays')*864e5) return;
    var done = (b.delivered.flyers||0)+(b.delivered.posters||0)+(b.delivered.stickers||0);
    MATS_.forEach(function(k){ var und=Math.max(0,(b.taken[k]||0)-(b.delivered[k]||0)); S.inv[k]=Math.max(0,(S.inv[k]||0)-und); });
    if(!done){ var pen=cfg_('pickup.expiryPenalty'); S.w=Math.max(0,S.w-pen); S.e=Math.max(0,S.e-pen); }
    b.expired = true;
  });
}
function grantApply_(S, g){
  var f=Number(g.Flyers)||0, po=Number(g.Posters)||0, st=Number(g.Stickers)||0, p=Number(g.Points)||0;
  if(f||po||st){ S.inv.flyers+=f; S.inv.posters+=po; S.inv.stickers+=st; batchAdd_(S,{flyers:f,posters:po,stickers:st},Date.now()); }
  if(p){ var r0=rk_(S.e); S.w+=p; if(p>0) S.e+=p; S.w=Math.max(0,S.w); var r1=rk_(S.e); if(r1>r0) S.ch+=r1-r0; }
}
function finishAdv_(S, ev){ var a=S.adv; Object.keys(a.reward||{}).forEach(function(k){ S.min[k]=(S.min[k]||0)+a.reward[k]; }); ev.push({t:'advDone',name:a.name}); S.adv=null; }
function award_(S, n, o, ev){
  o = o||{}; n = Math.max(0, Number(n)||0);
  var r0 = rk_(S.e), extra = 0;
  if(n>0 && S.adv){ extra = Math.floor(n*(Math.min(3,S.adv.mult)-1)); if(o.consume!==false) S.adv.left--; }
  var tot = n+extra; S.w+=tot; S.e+=tot;
  if(S.adv && S.adv.left<=0) finishAdv_(S, ev);
  var r1 = rk_(S.e); if(r1>r0){ S.ch+=r1-r0; ev.push({t:'rank',rank:r1,chests:r1-r0}); }
  if(n>0 && !o.noBonuses) bonuses_(S, ev);
  return tot;
}
function bonuses_(S, ev){
  var st = {places:S.pl, flyers:S.dist.flyers||0, posters:S.dist.posters||0}, list = [];
  combos_().forEach(function(c){ if(S.cd.indexOf(c.id)<0 && (st[c.stat]||0)>=c.at){ S.cd.push(c.id); list.push({n:c.bonus,label:'combo'}); } });
  var day = new Date().toISOString().slice(0,10); if(S.days.indexOf(day)<0) S.days.push(day); S.days = S.days.slice(-60);
  var wk = Math.floor(Date.now()/(7*864e5)), win = cfg_('regularity.windowDays'), recent = S.days.filter(function(d){ return Date.now()-Date.parse(d) < win*864e5; }).length;
  if(recent>=cfg_('regularity.days') && S.rw!==wk){ S.rw = wk; list.push({n:cfg_('regularity.bonus'),label:'regular'}); }
  list.forEach(function(b){ ev.push({t:b.label,n:b.n}); award_(S,b.n,{noBonuses:true,consume:false},ev); });
}
function carry_(S, x){ S.carry = Math.round(((S.carry||0)+x)*1e6)/1e6; var w = Math.floor(S.carry+1e-9); S.carry = Math.round((S.carry-w)*1e6)/1e6; return w; }
function spottedBase_(lat, lng, country, city){
  var c = String(country||'').trim().toLowerCase(), ct = String(city||'').trim().toLowerCase();
  if(ct==='berlin' || c==='berlin') return cfg_('spotted.baseBerlin');
  if(c==='germany' || c==='deutschland') return cfg_('spotted.baseGermany');
  var base = cfg_('spotted.baseEurope');
  if(EUROPE_.indexOf(c)>=0) return base;
  if(!isFinite(lat) || !isFinite(lng)) return base;
  var km = distM_(52.5030,13.4557,lat,lng)/1000;
  var sc = base + Math.min(cfg_('spotted.maxDistanceKm'),km)*cfg_('spotted.scalePerKm');
  return Math.min(cfg_('spotted.max'), Math.max(base, Math.round(sc)));
}
function dayKey_(){ return new Date().toISOString().slice(0,10); }

var ACT_ = {
  drop: function(S, it, ctx, ev){
    var kind = it.kind==='restock' ? 'restock' : (it.kind==='poster' ? 'poster' : (it.kind==='stickers' ? 'stickers' : 'drop'));
    var mat = kind==='poster' ? 'posters' : (kind==='stickers' ? 'stickers' : 'flyers');
    var pid = clean_(it.placeId,40); if(!/^[\w-]{1,40}$/.test(pid)) throw new Error('Place not found.');
    var q = qty_(it[mat], 500); if(!q) throw new Error('Enter a positive quantity.');
    var pl = findRow_('Places','id',pid); if(pl && (!bool_(pl.active) || String(pl.status)==='flagged')) throw new Error('This place is temporarily unavailable.');
    if(S.inv[mat] < q) throw new Error('Only '+S.inv[mat]+' '+mat+' available. Collect more at the material tent.');
    var today = dayKey_(), rows = table_('World').rows;
    if(rows.filter(function(r){ return r.Kind==='drop' && r.PlayerCode===ctx.code && String(r.At).slice(0,10)===today; }).length >= 60) throw new Error('That is plenty for today, Lunito!');
    var pts = 0, repeat = false, hot = false;
    if(mat==='flyers'){
      var per = cfg_('points.deliverPerItem'), now = Date.now();
      var drops = rows.filter(function(r){ return r.Kind==='drop' && String(r.PlaceId)===pid && Number(r.Flyers)>0 && !bool_(r.Rep) && !bool_(r.Hidden); })
        .map(function(r){ return {at:ms_(r.At), by:String(r.PlayerCode)}; }).sort(function(a,b){ return b.at-a.at; });
      var last = drops[0] || null, own = null; for(var i=0;i<drops.length;i++){ if(drops[i].by===ctx.code){ own = drops[i]; break; } }
      var ownLast = !!last && last.by===ctx.code, elapsed = last ? now-last.at : Infinity;
      if(own){ if(kind==='restock' && now-own.at>=86400000 && elapsed>=86400000) pts = q*per; else { pts = 0; repeat = true; } }
      else if(last && elapsed<86400000 && !ownLast){ pts = q*per*cfg_('points.flyerHotMultiplier'); hot = true; }
      else if(ownLast){ pts = 0; repeat = true; }
      else pts = q*per;
    } else pts = q*cfg_(mat==='stickers' ? 'points.stickerPerItem' : 'points.posterPerItem');
    if(it.photo && mat==='posters') pts += cfg_('points.deliveryPhoto');
    pts = carry_(S, pts);
    S.inv[mat] -= q; S.dist[mat] += q;
    var left = q; S.bt.forEach(function(b){ if(b.expired || left<=0) return; var av=Math.max(0,(b.taken[mat]||0)-(b.delivered[mat]||0)), t=Math.min(left,av); b.delivered[mat]=(b.delivered[mat]||0)+t; left-=t; });
    var got = award_(S, pts, {}, ev);
    var o = {Id:clean_(it.id,40),Kind:'drop',PlaceId:pid,Nick:ctx.nick,PlayerCode:ctx.code,Flyers:0,Posters:0,Stickers:0,At:new Date().toISOString(),Rep:repeat};
    o[mat.charAt(0).toUpperCase()+mat.slice(1)] = q; appendObj_('World', o);
    return {points:got, repeat:repeat, hot:hot};
  },
  sight: function(S, it, ctx, ev){
    // Every sighting is recorded and shown to everybody at once. Only the Mondinos have rules.
    var country = clean_(it.country,60).trim() || 'Unknown', lat = Number(it.lat), lng = Number(it.lng);
    if(!isFinite(lat) || !isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) throw new Error('Invalid location.');
    var now = Date.now(), rows = table_('World').rows.filter(function(r){ return r.Kind==='sight'; });
    var mine = rows.filter(function(r){ return r.PlayerCode===ctx.code && now-ms_(r.At) < 86400000; });
    if(mine.length>=15) throw new Error('That is plenty of stickers for today, Lunito! Come back tomorrow.');
    var eligible = !(mine.length>=3
      || mine.some(function(r){ return distM_(lat,lng,Number(r.Lat),Number(r.Lng)) < 200; })
      || mine.some(function(r){ return now-ms_(r.At) < 3600000; })
      || rows.some(function(r){ return !bool_(r.Hidden) && distM_(lat,lng,Number(r.Lat),Number(r.Lng)) < 200; }));
    var got = 0, id = clean_(it.id,40);
    if(eligible) got = award_(S, spottedBase_(lat,lng,country,it.city) + (it.photo ? cfg_('points.spottedPhoto') : 0), {}, ev);
    appendObj_('World',{Id:id,Kind:'sight',Lat:Math.round(lat*100000)/100000,Lng:Math.round(lng*100000)/100000,Nick:ctx.nick,PlayerCode:ctx.code,Text:clean_(it.text,160),Country:country,At:new Date().toISOString()});
    var th = String(it.thumb||''); if(/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(th) && th.length<=30000) appendObj_('Thumbs',{Id:id,Data:th});
    return {points:got, noPoints:!eligible};
  },
  discover: function(S, it, ctx, ev){
    var d = dayKey_(); if(S.dd.d!==d) S.dd = {d:d,n:0};
    if(S.dd.n>=10) throw new Error('That is plenty of new places for today, Lunito!');
    S.dd.n++; S.pl++;
    var got = award_(S, cfg_('points.discover') + (it.photo ? cfg_('points.discoverPhoto') : 0), {}, ev);
    return {points:got};
  },
  rate: function(S, it, ctx, ev){
    var pid = clean_(it.placeId,40); if(!pid) throw new Error('Place not found.');
    if(S.rated.indexOf(pid)>=0) throw new Error('One rating per profile in this demo.');
    var stars = Math.round(Number(it.stars)); if(!(stars>=1 && stars<=5)) stars = 5;
    S.rated.push(pid);
    appendObj_('World',{Id:'rt-'+clean_(it.id,36),Kind:'rate',PlaceId:pid,Nick:ctx.nick,PlayerCode:ctx.code,Text:String(stars),At:new Date().toISOString()});
    return {points:award_(S, cfg_('points.rating'), {}, ev)};
  },
  pickup: function(S, it, ctx, ev){
    if(S.pk) throw new Error('Request sent. Show your QR code to the staff to get it approved.');
    var q = {flyers:Math.min(qty_(it.flyers,300),cfg_('pickup.flyers')),posters:Math.min(qty_(it.posters,50),cfg_('pickup.posters')),stickers:Math.min(qty_(it.stickers,100),cfg_('pickup.stickers'))};
    if(!q.flyers && !q.posters && !q.stickers) throw new Error('Collect at least one item.');
    S.pk = true; batchAdd_(S, q, Date.now()); MATS_.forEach(function(k){ S.inv[k] += q[k]; });
    return {points:award_(S, cfg_('points.pickup'), {}, ev)};
  },
  advStart: function(S, it, ctx, ev){
    var a = ADV_[it.adv]; if(!a) throw new Error('Adventure not found.');
    if(S.adv) throw new Error('Finish or stop your current adventure first.');
    if(rk_(S.e)+1 < a.rank) throw new Error('Unlocks at Rank '+a.rank+'.');
    S.adv = {id:String(it.adv),name:a.name,mult:a.mult,left:a.uses,uses:a.uses,reward:a.reward}; return {};
  },
  advStop: function(S, it, ctx, ev){ S.adv = null; return {}; },
  craft: function(S, it, ctx, ev){
    var g = findRow_('Gadgets','id',clean_(it.item,30)); if(!g || !bool_(g.active)) throw new Error('Gadget not found.');
    if(S.gO.indexOf(g.id)>=0) throw new Error('You already have this one.');
    var cost = Number(g.cost)||0, rank = Number(g.rank)||1;
    if(rk_(S.e)+1 < rank) throw new Error('Unlocks at Rank '+rank+'.');
    if(S.w < cost) throw new Error('Not enough Mondinos.');
    for(var i=0;i<MINS_.length;i++){ var k=MINS_[i], n=Number(g[k])||0; if((S.min[k]||0)<n) throw new Error('Not enough '+k+'.'); }
    S.w -= cost; MINS_.forEach(function(k){ S.min[k] -= Number(g[k])||0; }); S.gO.push(String(g.id)); return {};
  },
  buy: function(S, it, ctx, ev){
    var c = findRow_('Cosmetics','id',clean_(it.item,30)); if(!c || !bool_(c.active)) throw new Error('Accessory not found.');
    if(S.aO.indexOf(c.id)>=0) return {};
    var cost = Number(c.cost)||0; if(rk_(S.e)+1 < outfitRank_(c)) throw new Error('Unlocks at Rank '+outfitRank_(c)+'.');
    if(S.w < cost) throw new Error('Not enough Mondinos.');
    S.w -= cost; S.aO.push(String(c.id)); return {};
  },
  chest: function(S, it, ctx, ev){
    if(S.ch<1) throw new Error('No chests left.');
    var r = rk_(S.e)+1, pool = [];
    table_('Gadgets').rows.forEach(function(g){ if(bool_(g.active) && (Number(g.rank)||1)<=r && S.gO.indexOf(String(g.id))<0) pool.push(['g',String(g.id),String(g.name)]); });
    table_('Cosmetics').rows.forEach(function(c){ var k=String(c.kind); if(bool_(c.active) && Number(c.cost)>0 && ['hairStyle','headgear','suitStyle'].indexOf(k)<0 && outfitRank_(c)<=r && S.aO.indexOf(String(c.id))<0) pool.push(['o',String(c.id),String(c.name)]); });
    if(!pool.length) throw new Error('Nothing new to find at your rank yet. Rank up to unlock more!');
    var p = pool[Math.floor(Math.random()*pool.length)]; S.ch--;
    if(p[0]==='g') S.gO.push(p[1]); else S.aO.push(p[1]);
    return {kind:p[0], item:p[1], name:p[2]};
  },
  route: function(S, it, ctx, ev){
    var ids = actList_(it.ids,3), started = Number(it.startedAt)||0, now = Date.now();
    if(ids.length!==3 || started<now-26*3600000 || started>now+60000) throw new Error('This route has expired.');
    var d = dayKey_(); if(S.rd.d!==d) S.rd = {d:d,n:0}; if(S.rd.n>=2) throw new Error('Two Moon routes a day is the limit, Lunito!');
    var rows = table_('World').rows.filter(function(r){ return r.Kind==='drop' && r.PlayerCode===ctx.code && ms_(r.At)>=started-60000; });
    var ok = ids.every(function(id,i){ return ids.indexOf(id)===i && rows.some(function(r){ return String(r.PlaceId)===id; }); });
    if(!ok) throw new Error('Visit all three stops first.');
    S.rd.n++; return {points:award_(S, cfg_('points.route'), {noBonuses:true,consume:false}, ev)};
  },
  redeem: function(S, it, ctx, ev){
    var rw = findRow_('Rewards','id',clean_(it.itemId,30)); if(!rw || !bool_(rw.active)) throw new Error('Prize not found.');
    var who = findRow_('Players','Code',ctx.code); if(who && String(who.Age)==='u16' && Number(rw.minAge)>=16) throw new Error('Prize not found.');
    if(Number(rw.stock)<=0) throw new Error('Not enough stock.');
    var cost = Number(rw.cost)||0; if(S.w<cost) throw new Error('Not enough Mondinos.');
    var id = clean_(it.id,40); if(!id || findRow_('Redemptions','ReqId',id)) return {};
    var open = table_('Redemptions').rows.some(function(r){ return r.PlayerCode===ctx.code && r.Item===String(rw.name) && r.Status==='pending'; });
    if(open) throw new Error('You already have a pending request for this prize.');
    S.w -= cost;
    appendObj_('Redemptions',{ReqId:id,PlayerCode:ctx.code,PlayerName:ctx.nick,Item:clean_(rw.name,60),Cost:cost,Category:clean_(rw.category,20),Status:'pending',RequestedAt:now_(),UpdatedAt:now_()});
    return {};
  }
};

HANDLERS.act = function(req){
  schema_();
  var p = req.player||{}; if(!validCode_(p.code)) throw new Error('bad player code');
  var row = findRow_('Players','Code',p.code);
  if(!row){ upsertPlayer_(p); row = findRow_('Players','Code',p.code); }
  var S = stateOf_(row, req.snap);
  var ctx = {code:p.code, nick:clean_(row.Name||p.name,40)};
  var res = [];
  expire_(S, Date.now());
  (req.intents||[]).slice(0,25).forEach(function(it){
    var id = clean_(it&&it.id,40), r = {id:id,ok:false};
    if(!id){ res.push(r); return; }
    if(S.seen.indexOf(id)>=0){ r.ok = true; r.dup = true; res.push(r); return; }
    var fn = ACT_[String(it.t)];
    if(!fn){ r.err = 'unknown'; res.push(r); return; }
    var snapS = JSON.stringify(S), ev = [];
    try{ var out = fn(S, it, ctx, ev); r.ok = true; r.out = out||{}; r.ev = ev; S.seen.push(id); }
    catch(e){ S = JSON.parse(snapS); r.err = String(e.message||e); S.seen.push(id); }
    res.push(r);
  });
  saveState_(row, S);
  return {ok:true, results:res, state:publicState_(S)};
};


// ---------------- build 16: admin overview, player editing, photo space ----------------
HANDLERS.adminStats = function(req){
  var now = Date.now(), DAY = 864e5;
  var pl = table_('Players').rows, wr = table_('World').rows, gr = table_('Grants').rows, ph = table_('Photos').rows;
  var day = function(ms){ return new Date(ms).toISOString().slice(0,10); };
  var grantBy = {}; gr.forEach(function(g){ var o = grantBy[g.PlayerCode]||(grantBy[g.PlayerCode]={f:0,p:0,s:0}); o.f+=Number(g.Flyers)||0; o.p+=Number(g.Posters)||0; o.s+=Number(g.Stickers)||0; });
  var worldBy = {}; wr.forEach(function(r){ if(r.Kind==='drop' && !bool_(r.Hidden)){ var o = worldBy[r.PlayerCode]||(worldBy[r.PlayerCode]={f:0,p:0,s:0}); o.f+=Number(r.Flyers)||0; o.p+=Number(r.Posters)||0; o.s+=Number(r.Stickers)||0; } });
  var P = {total:0,new24h:0,new7d:0,active24h:0,active7d:0,banned:0}, col = {flyers:0,posters:0,stickers:0}, del = {flyers:0,posters:0,stickers:0}, bags = {flyers:0,posters:0,stickers:0}, mond = {earned:0,wallet:0}, top = [];
  var newBy = {};
  pl.forEach(function(r){
    var banned = String(r.Access)==='banned'; if(banned) P.banned++;
    if(banned && String(r.Name)==='(deleted)') return;
    P.total++;
    var fs = ms_(r.FirstSeen), ls = ms_(r.LastSeen);
    if(now-fs < DAY) P.new24h++; if(now-fs < 7*DAY) P.new7d++; if(now-ls < DAY) P.active24h++; if(now-ls < 7*DAY) P.active7d++;
    if(fs && now-fs < 14*DAY){ var k = day(fs); newBy[k] = (newBy[k]||0)+1; }
    var S = null; try{ if(r.State) S = JSON.parse(r.State); }catch(e){}
    var g = grantBy[r.Code]||{f:0,p:0,s:0}, w = worldBy[r.Code]||{f:0,p:0,s:0};
    if(S){ var c = S.col||{}; col.flyers+=c.flyers||0; col.posters+=c.posters||0; col.stickers+=c.stickers||0; del.flyers+=S.dist.flyers||0; del.posters+=S.dist.posters||0; del.stickers+=S.dist.stickers||0; }
    else { col.flyers+=g.f; col.posters+=g.p; col.stickers+=g.s; if(Number(r.Earned)>0){ col.flyers+=cfg_('pickup.flyers'); col.posters+=cfg_('pickup.posters'); col.stickers+=cfg_('pickup.stickers'); } del.flyers+=w.f; del.posters+=w.p; del.stickers+=w.s; }
    bags.flyers+=Number(r.Flyers)||0; bags.posters+=Number(r.Posters)||0; bags.stickers+=Number(r.Stickers)||0;
    mond.earned+=Number(r.Earned)||0; mond.wallet+=Number(r.Wallet)||0;
    if(!banned) top.push({code:r.Code,name:r.Name,earned:Number(r.Earned)||0,wallet:Number(r.Wallet)||0,rank:(S?rk_(S.e):rk_(Number(r.Earned)||0))+1,flyers:S?(S.dist.flyers||0):w.f,lastSeen:r.LastSeen});
  });
  top.sort(function(a,b){ return b.earned-a.earned; });
  var sights = wr.filter(function(r){ return r.Kind==='sight' && !bool_(r.Hidden); });
  var flyBy = {}, sigBy = {};
  wr.forEach(function(r){ var t = ms_(r.At); if(!t || now-t > 14*DAY || bool_(r.Hidden)) return; var k = day(t);
    if(r.Kind==='drop') flyBy[k] = (flyBy[k]||0)+(Number(r.Flyers)||0); else if(r.Kind==='sight') sigBy[k] = (sigBy[k]||0)+1; });
  var daily = []; for(var i=13;i>=0;i--){ var k = day(now-i*DAY); daily.push({d:k, players:newBy[k]||0, flyers:flyBy[k]||0, stickers:sigBy[k]||0}); }
  var pcs = table_('Places').rows;
  var places = {active:0,unverified:0,flagged:0,added7d:0};
  pcs.forEach(function(r){ var st = String(r.status); if(bool_(r.active)) places.active++; if(st==='unverified'||st==='submitted') places.unverified++; if(st==='flagged') places.flagged++; if(now-ms_(r.updatedAt) < 7*DAY && String(r.addedBy||'').indexOf('Zirkus')<0) places.added7d++; });
  var bytes = 0, picked = 0, unknown = 0; ph.forEach(function(r){ var b = Number(r.Size)||0; bytes+=b; if(!b) unknown++; if(r.Pick==='yes') picked++; });
  var queues = {
    pickups: table_('Pickups').rows.filter(function(r){ return r.Status==='pending'; }).length,
    prizes: table_('Redemptions').rows.filter(function(r){ return r.Status==='pending'; }).length,
    reports: (function(){ var o = {}; table_('Flags').rows.forEach(function(r){ if(r.Status==='open') o[r.PlaceId]=1; }); return Object.keys(o).length; })()
  };
  return {ok:true, players:P, material:{collected:col, delivered:del, inBags:bags}, mondinos:mond,
    stickers:{total:sights.length, week:sights.filter(function(r){ return now-ms_(r.At) < 7*DAY; }).length},
    places:places, queues:queues, photos:{count:ph.length, bytes:bytes, picked:picked, unknownSize:unknown},
    top:top.slice(0,10), daily:daily, at:now_()};
};

HANDLERS.adminPlayerSave = function(req){
  var r = findRow_('Players','Code',req.code); if(!r) throw new Error('Player not found');
  var vals = {};
  if(req.name!==undefined){ var nm = clean_(req.name,24).trim(); if(!nm) throw new Error('The nickname cannot be empty'); vals.Name = nm; }
  if(req.notes!==undefined) vals.Notes = clean_(req.notes,200);
  if(req.trust!==undefined){ if(['new','trusted','flagged'].indexOf(req.trust)<0) throw new Error('bad trust'); vals.Trust = req.trust; }
  if(req.access!==undefined){ if(['','nochat','banned'].indexOf(req.access)<0) throw new Error('bad access'); vals.Access = req.access; }
  if(req.age!==undefined){ if(['','u16','16+'].indexOf(req.age)<0) throw new Error('bad age group'); vals.Age = req.age; }
  // exact numbers (a correction): they go into the player's real state
  var S = stateOf_(r), any = false;
  if(req.wallet!==undefined && req.wallet!==''){ S.w = Math.max(0, Number(req.wallet)||0); any = true; }
  if(req.earned!==undefined && req.earned!==''){ S.e = Math.max(0, Number(req.earned)||0); any = true; }
  ['flyers','posters','stickers'].forEach(function(k){ if(req[k]!==undefined && req[k]!==''){ S.inv[k] = qty_(req[k],100000); any = true; } });
  if(any) saveState_(r, S);
  var r2 = findRow_('Players','Code',req.code);
  if(Object.keys(vals).length) setCells_('Players', r2._row, vals);
  if(vals.Name){ var pz = findRow_('Presence','Code',req.code); if(pz) setCells_('Presence', pz._row, {Name:vals.Name}); }
  if(vals.Access==='banned' || vals.Name){ CacheService.getScriptCache().remove('rank'); }
  return {ok:true};
};

HANDLERS.adminPlayerDelete = function(req){
  var code = String(req.code||''); if(!validCode_(code)) throw new Error('bad code');
  var r = findRow_('Players','Code',code); if(!r) throw new Error('Player not found');
  if(String(req.confirm||'').trim().toLowerCase() !== String(r.Name||'').trim().toLowerCase()) throw new Error('Type the nickname exactly to confirm.');
  table_('Photos').rows.forEach(function(p){ if(p.PlayerCode===code && p.FileId) DriveApp.getFileById(p.FileId).setTrashed(true); });
  NativeSQL.run('delete from "Thumbs" where "Id" in (select "Id" from "World" where "PlayerCode"=$1)', [code]);
  ['World','Chat','Pickups','Redemptions','Grants','Log','Photos'].forEach(function(t){
    NativeSQL.run('delete from "'+t+'" where "PlayerCode"=$1', [code]); });
  NativeSQL.run('delete from "Presence" where "Code"=$1', [code]);
  NativeSQL.run('delete from "Flags" where "PlayerCode"=$1', [code]);
  if(req.block!==false) NativeSQL.run('update "Players" set "Name"=\'(deleted)\',"Access"=\'banned\',"Extras"=\'\',"State"=\'\',"Notes"=\'\',"Wallet"=0,"Earned"=0,"Flyers"=0,"Posters"=0,"Stickers"=0,"Age"=\'\' where "Code"=$1', [code]);
  else NativeSQL.run('delete from "Players" where "Code"=$1', [code]);
  CacheService.getScriptCache().remove('rank'); bust_();
  return {ok:true, blocked: req.block!==false};
};

HANDLERS.adminPhotoDelete = function(req){
  var r = findRow_('Photos','PhotoId',clean_(req.id,40)); if(!r) throw new Error('Photo not found');
  if(r.FileId) DriveApp.getFileById(r.FileId).setTrashed(true);
  NativeSQL.run('delete from "Photos" where "PhotoId"=$1', [r.PhotoId]);
  return {ok:true};
};
