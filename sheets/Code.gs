/**
 * MondQuest · Google Apps Script backend (Zirkus Mond)
 * Bound to the control sheet (mondquest-sheet.xlsx imported into Google Sheets).
 * Deploy: Extensions > Apps Script > paste this file > Deploy > New deployment > Web app
 *   Execute as: Me   ·   Who has access: Anyone
 * Then paste the web app URL and WRITE_KEY into the game (MQ_SHEET_URL / MQ_WRITE_KEY).
 * The key lives inside the public game, so it only keeps out random spam. It is not real security.
 */
const WRITE_KEY = 'CHANGE-ME';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'config') return out_({ ok: true, config: configCached_() });
  return out_({ ok: true, service: 'MondQuest' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.key !== WRITE_KEY) return out_({ ok: false, error: 'bad key' });
    const p = b.player || {};
    if (!p.code) return out_({ ok: false, error: 'no player' });
    const now = new Date();
    upsertPlayer_(p, b.snapshot || {}, now);
    appendLog_(p, b.entries || [], now);
    upsertRedemptions_(p, b.redemptions || [], now);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sh_(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function rows_(n) {
  const s = sh_(n), v = s.getDataRange().getValues(), h = v.shift();
  return v.filter(r => r[0] !== '' ).map(r => { const o = {}; h.forEach((k, i) => o[String(k)] = r[i]); return o; });
}
const on_ = v => v === true || String(v).toUpperCase() === 'TRUE';

function configCached_() {
  const c = CacheService.getScriptCache(), hit = c.get('cfg');
  if (hit) return JSON.parse(hit);
  const cfg = buildConfig_();
  c.put('cfg', JSON.stringify(cfg), 30);
  return cfg;
}

function buildConfig_() {
  const cfg = {};
  rows_('Config').forEach(r => {
    const parts = String(r.Key).split('.');
    let o = cfg;
    parts.slice(0, -1).forEach(k => o = (o[k] = o[k] || {}));
    o[parts[parts.length - 1]] = Number(r.Value);
  });
  cfg.combos = rows_('Combos').map(r => ({ id: r.id, stat: r.stat, at: Number(r.at), bonus: Number(r.bonus), label: r.label }));
  const taken = {};
  rows_('Redemptions').forEach(r => { if (r.Status !== 'rejected') taken[r.Item] = (taken[r.Item] || 0) + 1; });
  cfg.rewards = rows_('Rewards').filter(r => on_(r.active)).map(r => ({
    id: r.id, name: r.name, category: r.category, cost: Number(r.cost),
    stock: Math.max(0, Number(r.stock) - (taken[r.name] || 0))
  }));
  cfg.cosmetics = rows_('Cosmetics').map(r => ({ id: r.id, cost: Number(r['cost (3 to 10)']), rank: Number(r['rank needed']), active: on_(r.active) }));
  cfg.gadgets = rows_('Gadgets').map(r => ({
    id: r.id, cost: Number(r['cost (3 to 10)']), rank: Number(r['rank needed']), active: on_(r.active),
    min: { comet: +r.comet || 0, meteor: +r.meteor || 0, nebula: +r.nebula || 0, void: +r.void || 0, rings: +r.rings || 0 }
  }));
  cfg.ranks = rows_('Ranks').map(r => ({ rank: Number(r.rank), name: r.name, earned: Number(r['Mondinos earned in total']) }));
  return cfg;
}

function upsertPlayer_(p, snap, now) {
  const s = sh_('Players'), last = s.getLastRow();
  const inv = snap.inventory || {};
  let row = 0;
  if (last > 1) {
    const f = s.getRange(2, 1, last - 1, 1).createTextFinder(p.code).matchEntireCell(true).findNext();
    if (f) row = f.getRow();
  }
  const vals = [now, snap.wallet || 0, snap.earned || 0, inv.flyers || 0, inv.posters || 0, inv.stickers || 0];
  if (row) {
    s.getRange(row, 2).setValue(p.name || '');
    s.getRange(row, 4, 1, 6).setValues([vals]);
  } else {
    s.appendRow([p.code, p.name || '', now].concat(vals).concat(['new', '']));
  }
}

function appendLog_(p, entries, now) {
  if (!entries.length) return;
  const s = sh_('Log'), last = s.getLastRow();
  const seen = new Set(last > 1 ? s.getRange(2, 4, last - 1, 1).getValues().map(r => String(r[0])) : []);
  const rows = entries.filter(e => !seen.has(String(e.id))).map(e =>
    [now, p.code, p.name || '', String(e.id), e.type, e.label, Number(e.amount) || 0, e.at || '', JSON.stringify(e.extra || {})]);
  if (rows.length) s.getRange(last + 1, 1, rows.length, 9).setValues(rows);
}

function upsertRedemptions_(p, reds, now) {
  if (!reds.length) return;
  const s = sh_('Redemptions');
  reds.forEach(r => {
    const last = s.getLastRow();
    const f = last > 1 ? s.getRange(2, 1, last - 1, 1).createTextFinder(String(r.id)).matchEntireCell(true).findNext() : null;
    if (f) {
      const row = f.getRow();
      if (s.getRange(row, 7).getValue() === 'pending') s.getRange(row, 7).setValue(r.status || 'pending');
      s.getRange(row, 8).setValue(now);
    } else {
      s.appendRow([String(r.id), p.code, p.name || '', r.item, r.cost, r.category || '', r.status || 'pending', now, '']);
    }
  });
}
