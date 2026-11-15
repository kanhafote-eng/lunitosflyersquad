/**
 * MondQuest backend (Google Apps Script web app) - Zirkus Mond
 * Script properties required: WRITE_KEY, STAFF_PIN, ADMIN_PIN
 * Deploy as web app: Execute as ME, access ANYONE.
 */
var TABS_PUBLIC = ['Config','Combos','Rewards','Cosmetics','Gadgets','Ranks','Places','News'];
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
  if(c) return JSON.parse(c);
  var o = {ok:true, updatedAt:now_()};
  TABS_PUBLIC.forEach(function(n){ o[n.toLowerCase()] = strip_(table_(n).rows); });
  o.rewards = o.rewards.filter(function(r){return bool_(r.active);});
  o.cosmetics = o.cosmetics.filter(function(r){return bool_(r.active);});
  o.gadgets = o.gadgets.filter(function(r){return bool_(r.active);});
  o.news = o.news.filter(function(r){return bool_(r.active);});
  o.places = o.places.filter(function(r){return bool_(r.active) && String(r.status)==='approved';});
  try{ cache.put('cfg', JSON.stringify(o), 60); }catch(e){}
  return o;
}
function bust_(){ CacheService.getScriptCache().remove('cfg'); }

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
    return out_(h(req, role));
  }catch(err){ return out_({ok:false,error:String(err.message||err)}); }
  finally{ try{lock.releaseLock();}catch(x){} }
}

var ACTION_ROLE = { sync:'player', pull:'player',
  staffLookup:'staff', staffGrant:'staff', staffRedemptions:'staff', staffHandle:'staff',
  adminGet:'admin', adminSave:'admin', adminPlayers:'admin', adminSetTrust:'admin', adminReviewPlace:'admin', adminGrant:'admin', adminLog:'admin' };

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

function upsertPlayer_(p){
  if(!validCode_(p.code)) throw new Error('bad player code');
  var r = findRow_('Players','Code',p.code), t = now_();
  var vals = {Name:clean_(p.name,40), LastSeen:t, Wallet:Number(p.wallet)||0, Earned:Number(p.earned)||0,
    Flyers:Number(p.flyers)||0, Posters:Number(p.posters)||0, Stickers:Number(p.stickers)||0};
  if(r){ setCells_('Players', r._row, vals); return r.Trust||'new'; }
  vals.Code = p.code; vals.FirstSeen = t; vals.Trust = 'new'; appendObj_('Players', vals); return 'new';
}

var HANDLERS = {
  sync: function(req){
    var p = req.player||{}; var trust = upsertPlayer_(p);
    var entries = (req.entries||[]).slice(0,MAX_ENTRIES), n=0;
    var seen = {}; table_('Log').rows.slice(-1000).forEach(function(r){ seen[r.PlayerCode+'|'+r.EntryId]=1; });
    entries.forEach(function(en){
      var id = clean_(en.id,40); if(!id || seen[p.code+'|'+id]) return;
      appendObj_('Log',{Received:now_(),PlayerCode:p.code,PlayerName:clean_(p.name,40),EntryId:id,Type:clean_(en.type,30),
        Label:clean_(en.label,120),Amount:Number(en.amount)||0,At:clean_(en.at,30),Extra:clean_(en.extra,200)}); n++;
    });
    (req.redemptions||[]).slice(0,20).forEach(function(rd){
      var id = clean_(rd.id,40); if(!id || findRow_('Redemptions','ReqId',id)) return;
      appendObj_('Redemptions',{ReqId:id,PlayerCode:p.code,PlayerName:clean_(p.name,40),Item:clean_(rd.item,60),Cost:Number(rd.cost)||0,
        Category:clean_(rd.category,20),Status:'pending',RequestedAt:now_(),UpdatedAt:now_()});
    });
    (req.places||[]).slice(0,5).forEach(function(pl){
      var id = clean_(pl.id,40); if(!id || findRow_('Places','id',id)) return;
      var lat=Number(pl.lat), lng=Number(pl.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      appendObj_('Places',{id:id,name:clean_(pl.name,60),type:clean_(pl.type,20),posterSize:clean_(pl.posterSize,10),address:clean_(pl.address,120),
        lat:lat,lng:lng,spot:clean_(pl.spot,80),notes:clean_(pl.notes,200),active:false,status:'submitted',addedBy:clean_(p.name,40)+' ('+p.code+')',updatedAt:now_()});
    });
    return {ok:true, logged:n, trust:trust};
  },
  pull: function(req){
    var code = req.code; if(!validCode_(code)) throw new Error('bad player code');
    var grants = table_('Grants').rows.filter(function(g){ return g.PlayerCode===code && !bool_(g.Applied); });
    var reds = table_('Redemptions').rows.filter(function(r){ return r.PlayerCode===code; }).slice(-30)
      .map(function(r){ return {id:r.ReqId,status:r.Status,note:r.StaffNote}; });
    var pr = findRow_('Players','Code',code);
    return {ok:true, grants:strip_(grants).map(function(g){return {id:g.GrantId,type:g.Type,flyers:g.Flyers,posters:g.Posters,stickers:g.Stickers,points:g.Points,note:g.Note};}),
      redemptions:reds, trust:pr?pr.Trust:'new'};
  },
  // applied-ack comes with the next pull via req.ack
  staffLookup: function(req){
    var code = String(req.code||'').trim(); var pr = findRow_('Players','Code',code);
    if(!pr) return {ok:true, found:false};
    var pend = table_('Redemptions').rows.filter(function(r){return r.PlayerCode===code && r.Status==='pending';});
    return {ok:true, found:true, player:{code:pr.Code,name:pr.Name,wallet:pr.Wallet,earned:pr.Earned,flyers:pr.Flyers,posters:pr.Posters,stickers:pr.Stickers,trust:pr.Trust,lastSeen:pr.LastSeen}, pending:strip_(pend)};
  },
  staffGrant: function(req, role){
    if(!validCode_(req.code) || !findRow_('Players','Code',req.code)) throw new Error('Player not found');
    var f=Math.max(0,Math.min(300,Number(req.flyers)||0)), po=Math.max(0,Math.min(50,Number(req.posters)||0)), st=Math.max(0,Math.min(100,Number(req.stickers)||0));
    if(!f&&!po&&!st) throw new Error('Nothing to give');
    var id='G'+Date.now().toString(36)+Math.floor(Math.random()*1000);
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
    return {ok:true};
  },
  adminGet: function(){
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
  adminPlayers: function(){ return {ok:true, rows:strip_(table_('Players').rows)}; },
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
  return _origPull(req);
};
