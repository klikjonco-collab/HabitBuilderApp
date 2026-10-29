/**
 * Habit Builder · server (Google Apps Script, terikat ke Google Sheet pembeli).
 *
 * Struktur Sheet
 *   _config   Kunci | Nilai                       (tersembunyi)
 *   _habits   ID | Nama terakhir | Dibuat         (tersembunyi)
 *   _journal  Tanggal | Teks | Diubah | Afirmasi  (tersembunyi)
 *   2026 …    Bulan | ID | Habit | Jadwal | Goal | Mulai | 1 … 31
 *             Satu baris per habit per bulan, lalu satu baris MOOD per bulan.
 *             Sel tanggal habit = checkbox, sel tanggal MOOD = skor 1–10
 *             (jumlah & nama skor diatur di Pengaturan aplikasi).
 */

var SCHEMA = 1;
var HEAD = ['Bulan', 'ID', 'Habit', 'Jadwal', 'Goal', 'Mulai'];
var DAY_COL = HEAD.length + 1; // kolom G = tanggal 1
var WIDTH = HEAD.length + 31;
var MOOD_ID = 'MOOD';
var MAX_MOOD = 10;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Habit Builder')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/* ───────────── API yang dipanggil dari aplikasi ───────────── */

function getInitial(y) {
  var cfg = getCfg_();
  var years = years_();
  var out = {
    user: Session.getActiveUser().getEmail() || '',
    years: years,
    settings: parseJson_(cfg.settings, {}),
    lastModified: Number(cfg.lastModified) || null,
    backupAt: Number(cfg.backupAt) || null,
    affLatest: latestAffirm_(),
    data: null
  };
  if (years.indexOf(Number(y)) >= 0) out.data = getYear(y);
  return out;
}

function getYear(y) {
  y = Number(y);
  var model = readYear_(y);
  if (!model) throw new Error(tr_('Lembar ' + y + ' belum ada', 'The ' + y + ' sheet doesn’t exist yet'));
  var jr = readJournal_().map, journal = {}, affirm = {};
  Object.keys(jr).forEach(function (k) {
    if (k.indexOf(y + '-') !== 0) return;
    if (jr[k].text) journal[k] = jr[k].text;
    if (jr[k].aff) affirm[k] = jr[k].aff;
  });
  model.journal = journal;
  model.affirm = affirm;
  return model;
}

/** Menerapkan sekumpulan perubahan dalam satu panggilan (centang, mood, jurnal, daftar habit, pengaturan). */
function applyOps(ops) {
  return withLock_(function () {
    var years = {}, jr = null;
    (ops || []).forEach(function (op) {
      if (op.t === 'journal' || op.t === 'affirm') {
        jr = jr || readJournal_();
        setJournalField_(jr, op.date, op.t === 'journal' ? 'text' : 'aff', op.text);
        return;
      }
      if (op.t === 'settings') { setCfg_('settings', JSON.stringify(op.settings || {})); return; }
      var y = Number(op.y);
      if (!(y in years)) years[y] = readYear_(y);
      var Y = years[y];
      if (!Y) return;
      var M = Y.months[op.m];
      if (!M) return;
      if (op.t === 'check') {
        if (!M.habits.some(function (h) { return h.id === op.id; })) return;
        var a = M.checks[op.id] || (M.checks[op.id] = []);
        a[op.d - 1] = !!op.v;
      } else if (op.t === 'mood') {
        M.mood[op.d - 1] = clampMood_(op.v);
      } else if (op.t === 'habits') {
        var old = M.checks;
        M.habits = (op.habits || []).map(cleanHabit_);
        M.checks = {};
        M.habits.forEach(function (h) { M.checks[h.id] = old[h.id] || []; });
        registerHabits_(M.habits);
      }
    });
    Object.keys(years).forEach(function (y) { if (years[y]) writeYear_(Number(y), years[y], false); });
    if (jr) writeJournal_(jr);
    return { savedAt: touch_() };
  });
}

/** Membuat lembar tahun baru berisi 12 bulan. Habit Januari disalin dari bulan terakhir tahun terdekat sebelumnya. */
function createYear(y, copyHabits) {
  return withLock_(function () {
    y = Number(y);
    if (!(y >= 2000 && y <= 2100)) throw new Error(tr_('Tahun tidak valid', 'Invalid year'));
    if (ss_().getSheetByName(String(y))) throw new Error(tr_(y + ' sudah ada', y + ' already exists'));
    newYearSheet_(y);
    var model = emptyYear_(y);
    if (copyHabits) {
      var src = lastHabitsBefore_(y);
      if (src) {
        model.months[0].habits = src.map(cleanHabit_);
        src.forEach(function (h) { model.months[0].checks[h.id] = []; });
      }
    }
    writeYear_(y, model, true);
    touch_();
    return getYear(y);
  });
}

/** Mendeteksi dan memperbaiki baris/kolom yang rusak akibat edit manual di Sheet. */
function repairStructure() {
  return withLock_(function () {
    var report = [];
    cfgSheet_(); habitsSheet_(); journalSheet_();
    years_().forEach(function (y) {
      var sh = ss_().getSheetByName(String(y));
      var head = sh.getRange(1, 1, 1, WIDTH).getValues()[0];
      var want = yearHeader_();
      if (head.join('|') !== want.join('|')) {
        sh.getRange(1, 1, 1, WIDTH).setValues([want]);
        report.push(y + ': ' + tr_('baris judul dipulihkan', 'header row restored'));
      }
      var notes = [];
      var model = readYear_(y, notes);
      writeYear_(y, model, true);
      notes.forEach(function (n) { report.push(y + ': ' + n); });
    });
    var jr = readJournal_();
    writeJournal_(jr);
    if (jr.fixed) report.push(tr_('Jurnal: ' + jr.fixed + ' baris tanggal dirapikan', 'Journal: ' + jr.fixed + ' date rows tidied'));
    touch_();
    return { report: report };
  });
}

/* ── Save / Load ke Google Drive (cadangan JSON di folder "Habit Builder") ── */

function saveBackup() {
  return withLock_(function () {
    var data = JSON.stringify(exportAll_());
    var file = backupFile_();
    if (file) file.setContent(data);
    else {
      file = backupFolder_().createFile('habit-builder-data.json', data, MimeType.PLAIN_TEXT);
      setCfg_('backupId', file.getId());
    }
    var at = Date.now();
    setCfg_('backupAt', at);
    return { backupAt: at };
  });
}

function getBackupInfo() {
  var cfg = getCfg_(), file = backupFile_();
  return {
    exists: !!file,
    driveAt: file ? file.getLastUpdated().getTime() : null,
    appAt: Number(cfg.lastModified) || null
  };
}

function loadBackup(keepCopy) {
  return withLock_(function () {
    var file = backupFile_();
    if (!file) throw new Error(tr_('Belum ada data di Drive', 'There’s no data in Drive yet'));
    var data = JSON.parse(file.getBlob().getDataAsString());
    if (!data || data.app !== 'habit-builder') throw new Error(tr_('File cadangan tidak dikenali', 'Backup file not recognized'));
    if (keepCopy) {
      var stamp = Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmm');
      backupFolder_().createFile('habit-builder-cadangan-' + stamp + '.json', JSON.stringify(exportAll_()), MimeType.PLAIN_TEXT);
    }
    (data.years || []).forEach(function (Y) {
      if (!ss_().getSheetByName(String(Y.year))) newYearSheet_(Y.year);
      writeYear_(Y.year, Y, true);
      Y.months.forEach(function (M) { registerHabits_(M.habits); });
    });
    var jr = { map: {} };
    Object.keys(data.journal || {}).forEach(function (k) { setJournalField_(jr, k, 'text', data.journal[k]); });
    Object.keys(data.affirm || {}).forEach(function (k) { setJournalField_(jr, k, 'aff', data.affirm[k]); });
    writeJournal_(jr);
    if (data.settings) setCfg_('settings', JSON.stringify(data.settings));
    touch_();
    return { ok: true };
  });
}

/* ───────────── Model tahun ───────────── */

function emptyYear_(y) {
  var months = [];
  for (var m = 0; m < 12; m++) months.push({ habits: [], checks: {}, mood: zeros_(31) });
  return { year: y, months: months };
}

function readYear_(y, notes) {
  var sh = ss_().getSheetByName(String(y));
  if (!sh) return null;
  var model = emptyYear_(y);
  var last = sh.getLastRow();
  if (last < 2) return model;
  var vals = sh.getRange(2, 1, last - 1, WIDTH).getValues();
  var registry = null, seen = {}, curMonth = 0, moodSeen = {};
  vals.forEach(function (r, i) {
    var mo = Number(r[0]);
    var id = String(r[1] || '').trim();
    var name = String(r[2] || '').trim();
    if (!id && !name && !r.slice(DAY_COL - 1).some(function (v) { return v !== '' && v !== false; })) return;
    if (!(mo >= 1 && mo <= 12)) {
      if (!curMonth) { if (notes) notes.push(tr_('baris ' + (i + 2) + ' tanpa bulan dilewati', 'row ' + (i + 2) + ' without a month skipped')); return; }
      if (notes) notes.push(tr_('baris ' + (i + 2) + ': bulan diisi ulang (' + curMonth + ')', 'row ' + (i + 2) + ': month refilled (' + curMonth + ')'));
      mo = curMonth;
    }
    curMonth = mo;
    var M = model.months[mo - 1], n = dim_(y, mo - 1), days = r.slice(DAY_COL - 1, DAY_COL - 1 + 31);
    if (id.toUpperCase() === MOOD_ID) {
      if (moodSeen[mo] && notes) notes.push(tr_('baris MOOD ganda di bulan ' + mo + ' digabung', 'duplicate MOOD row in month ' + mo + ' merged'));
      moodSeen[mo] = true;
      days.forEach(function (v, d) { if (d < n && clampMood_(v)) M.mood[d] = clampMood_(v); });
      return;
    }
    if (!id) {
      registry = registry || readRegistry_();
      id = registry.byName[name.toLowerCase()] || newId_();
      if (notes) notes.push(tr_('"' + name + '" (bulan ' + mo + ') diberi ID ' + id, '"' + name + '" (month ' + mo + ') given ID ' + id));
    }
    var checks = days.map(function (v, d) { return d < n && truthy_(v); });
    if (seen[mo + '|' + id]) {
      if (notes) notes.push(tr_('baris ganda "' + name + '" di bulan ' + mo + ' digabung', 'duplicate row "' + name + '" in month ' + mo + ' merged'));
      var prev = M.checks[id];
      checks.forEach(function (c, d) { if (c) prev[d] = true; });
      return;
    }
    seen[mo + '|' + id] = true;
    M.habits.push({
      id: id,
      name: name || 'Habit',
      f: parseFreq_(r[3]),
      goal: Number(r[4]) > 0 ? Math.round(Number(r[4])) : null,
      start: fmtDate_(r[5])
    });
    M.checks[id] = checks;
  });
  if (notes) for (var m = 1; m <= 12; m++) if (!moodSeen[m]) notes.push(tr_('baris MOOD bulan ' + m + ' dibuat ulang', 'MOOD row for month ' + m + ' recreated'));
  return model;
}

function rowsOf_(model) {
  var rows = [];
  model.months.forEach(function (M, mi) {
    var n = dim_(model.year, mi);
    M.habits.forEach(function (h) {
      var c = M.checks[h.id] || [], row = [mi + 1, h.id, h.name, JSON.stringify(h.f), h.goal || '', h.start || ''];
      for (var d = 0; d < 31; d++) row.push(d < n ? !!c[d] : '');
      rows.push(row);
    });
    var mood = [mi + 1, MOOD_ID, 'Mood', '', '', ''];
    for (var d = 0; d < 31; d++) mood.push(d < n && M.mood[d] ? M.mood[d] : '');
    rows.push(mood);
  });
  return rows;
}

function writeYear_(y, model, force) {
  var sh = ss_().getSheetByName(String(y));
  var rows = rowsOf_(model);
  var last = sh.getLastRow();
  var oldKeys = last > 1 ? sh.getRange(2, 1, last - 1, 2).getValues().map(function (r) { return r[0] + '|' + r[1]; }).join(',') : '';
  var newKeys = rows.map(function (r) { return r[0] + '|' + r[1]; }).join(',');
  if (!force && oldKeys === newKeys) {
    // Struktur baris sama: cukup satu kali tulis.
    sh.getRange(2, 1, rows.length, WIDTH).setValues(rows);
    return;
  }
  if (last > 1) {
    var old = sh.getRange(2, 1, last - 1, WIDTH);
    old.clearDataValidations();
    old.clearContent();
  }
  // Checkbox dipasang dulu, karena insertCheckboxes() mengosongkan nilai sel.
  var i = 0;
  while (i < rows.length) {
    if (rows[i][1] === MOOD_ID) { i++; continue; }
    var j = i;
    while (j < rows.length && rows[j][1] !== MOOD_ID && rows[j][0] === rows[i][0]) j++;
    sh.getRange(i + 2, DAY_COL, j - i, dim_(y, rows[i][0] - 1)).insertCheckboxes();
    i = j;
  }
  sh.getRange(2, 1, rows.length, WIDTH).setValues(rows);
  sh.getRange(2, 6, rows.length, 1).setNumberFormat('yyyy-mm-dd');
}

function newYearSheet_(y) {
  var ss = ss_();
  var idx = ss.getSheets().filter(function (s) { return /^\d{4}$/.test(s.getName()) && Number(s.getName()) < y; }).length;
  var sh = ss.insertSheet(String(y), idx);
  sh.getRange(1, 1, 1, WIDTH).setValues([yearHeader_()]).setFontWeight('bold').setBackground('#111111').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  sh.setColumnWidth(1, 52);
  sh.setColumnWidth(2, 90);
  sh.setColumnWidth(3, 200);
  sh.setColumnWidth(4, 120);
  sh.setColumnWidths(5, 2, 80);
  sh.setColumnWidths(DAY_COL, 31, 30);
  return sh;
}

function yearHeader_() {
  var h = HEAD.slice();
  for (var d = 1; d <= 31; d++) h.push(d);
  return h;
}

function lastHabitsBefore_(y) {
  var earlier = years_().filter(function (v) { return v < y; });
  for (var k = earlier.length - 1; k >= 0; k--) {
    var Y = readYear_(earlier[k]);
    for (var m = 11; m >= 0; m--) if (Y.months[m].habits.length) return Y.months[m].habits;
  }
  return null;
}

function years_() {
  return ss_().getSheets()
    .map(function (s) { return s.getName(); })
    .filter(function (n) { return /^\d{4}$/.test(n); })
    .map(Number)
    .sort(function (a, b) { return a - b; });
}

/* ───────────── Jurnal ───────────── */

var JCOLS = 4; // Tanggal | Teks | Diubah | Afirmasi

function journalSheet_() {
  var sh = sheet_('_journal', ['Tanggal', 'Teks', 'Diubah', 'Afirmasi'], true);
  sh.getRange('A:A').setNumberFormat('@');
  // Sheet lama (sebelum ada afirmasi) hanya punya 3 kolom
  if (sh.getMaxColumns() < JCOLS) sh.insertColumnsAfter(sh.getMaxColumns(), JCOLS - sh.getMaxColumns());
  var h = sh.getRange(1, 4);
  if (h.getValue() !== 'Afirmasi') h.setValue('Afirmasi').setFontWeight('bold');
  return sh;
}

function readJournal_() {
  var sh = journalSheet_(), last = sh.getLastRow(), map = {}, fixed = 0;
  if (last > 1) {
    sh.getRange(2, 1, last - 1, JCOLS).getValues().forEach(function (r) {
      var raw = r[0], k = fmtDate_(raw), text = String(r[1]), aff = String(r[3]);
      if (!k || (!text.trim() && !aff.trim())) return;
      if (k !== raw) fixed++;
      map[k] = { text: text.trim() ? text : '', aff: aff.trim() ? aff : '', at: Number(r[2]) || 0 };
    });
  }
  return { map: map, fixed: fixed };
}

function writeJournal_(jr) {
  var sh = journalSheet_(), last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, JCOLS).clearContent();
  var rows = Object.keys(jr.map).sort().map(function (k) { var e = jr.map[k]; return [k, e.text || '', e.at, e.aff || '']; });
  if (rows.length) sh.getRange(2, 1, rows.length, JCOLS).setValues(rows);
}

/** Mengisi teks jurnal ('text') atau afirmasi ('aff') satu tanggal; baris dihapus kalau keduanya kosong. */
function setJournalField_(jr, date, field, val) {
  var e = jr.map[date] || { text: '', aff: '', at: 0 };
  e[field] = val && String(val).trim() ? String(val) : '';
  e.at = Date.now();
  if (e.text || e.aff) jr.map[date] = e; else delete jr.map[date];
}

/** Afirmasi dari tanggal paling akhir (sampai hari ini) yang punya afirmasi, untuk sapaan dashboard. */
function latestAffirm_() {
  var map = readJournal_().map, todayKey = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), best = null;
  Object.keys(map).forEach(function (k) { if (map[k].aff && k <= todayKey && (!best || k > best)) best = k; });
  return best ? { date: best, text: map[best].aff } : null;
}

/* ───────────── Registry habit & konfigurasi ───────────── */

function habitsSheet_() { return sheet_('_habits', ['ID', 'Nama terakhir', 'Dibuat'], true); }

function readRegistry_() {
  var sh = habitsSheet_(), last = sh.getLastRow(), byId = {}, byName = {}, rows = [];
  if (last > 1) rows = sh.getRange(2, 1, last - 1, 3).getValues();
  rows.forEach(function (r) {
    if (!r[0]) return;
    byId[r[0]] = r;
    byName[String(r[1]).toLowerCase()] = String(r[0]);
  });
  return { rows: rows, byId: byId, byName: byName };
}

function registerHabits_(habits) {
  if (!habits || !habits.length) return;
  var reg = readRegistry_(), changed = false;
  habits.forEach(function (h) {
    var r = reg.byId[h.id];
    if (!r) { reg.rows.push([h.id, h.name, fmtDate_(new Date())]); reg.byId[h.id] = reg.rows[reg.rows.length - 1]; changed = true; }
    else if (r[1] !== h.name) { r[1] = h.name; changed = true; }
  });
  if (!changed) return;
  var sh = habitsSheet_();
  sh.getRange(2, 1, reg.rows.length, 3).setValues(reg.rows);
}

function cfgSheet_() { return sheet_('_config', ['Kunci', 'Nilai'], true); }

function getCfg_() {
  var v = cfgSheet_().getDataRange().getValues(), o = {};
  for (var i = 1; i < v.length; i++) if (v[i][0]) o[v[i][0]] = v[i][1];
  if (!o.schema) setCfg_('schema', SCHEMA);
  return o;
}

function setCfg_(key, val) {
  var sh = cfgSheet_(), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][0] === key) { sh.getRange(i + 1, 2).setValue(val); return; }
  sh.appendRow([key, val]);
}

function touch_() {
  var at = Date.now();
  setCfg_('lastModified', at);
  return at;
}

/* ───────────── Drive ───────────── */

function backupFolder_() {
  var id = getCfg_().folderId;
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  var folder = DriveApp.createFolder('Habit Builder');
  setCfg_('folderId', folder.getId());
  return folder;
}

function backupFile_() {
  var id = getCfg_().backupId;
  if (!id) return null;
  try { var f = DriveApp.getFileById(id); return f.isTrashed() ? null : f; } catch (e) { return null; }
}

function exportAll_() {
  var jr = readJournal_().map, journal = {}, affirm = {};
  Object.keys(jr).forEach(function (k) { if (jr[k].text) journal[k] = jr[k].text; if (jr[k].aff) affirm[k] = jr[k].aff; });
  return {
    app: 'habit-builder',
    schema: SCHEMA,
    exportedAt: Date.now(),
    settings: parseJson_(getCfg_().settings, {}),
    years: years_().map(function (y) { return readYear_(y); }),
    journal: journal,
    affirm: affirm
  };
}

/* ───────────── Utilitas ───────────── */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function tz_() { return ss_().getSpreadsheetTimeZone(); }

function sheet_(name, header, hidden) {
  var sh = ss_().getSheetByName(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (hidden) sh.hideSheet();
  }
  return sh;
}

function withLock_(fn) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function dim_(y, m) { return new Date(y, m + 1, 0).getDate(); }
function zeros_(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; }
function newId_() { return 'h' + Utilities.getUuid().replace(/-/g, '').slice(0, 8); }

function truthy_(v) {
  if (v === true || v === 1) return true;
  var s = String(v).trim().toLowerCase();
  return s === 'true' || s === 'x' || s === 'v' || s === '✓' || s === '1' || s === 'ya';
}

function clampMood_(v) {
  var n = Math.round(Number(v));
  return n >= 1 && n <= MAX_MOOD ? n : 0;
}

/** Pesan untuk pengguna mengikuti bahasa di Pengaturan (id/en). */
var LANG_ = null;
function tr_(id, en) {
  if (LANG_ === null) { try { LANG_ = parseJson_(getCfg_().settings, {}).lang || 'id'; } catch (e) { LANG_ = 'id'; } }
  return LANG_ === 'en' ? en : id;
}

function fmtDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(v).trim());
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
}

function parseJson_(s, dflt) { try { return s ? JSON.parse(s) : dflt; } catch (e) { return dflt; } }

function parseFreq_(s) {
  var f = parseJson_(s, null);
  if (!f || ['daily', 'everyN', 'perWeek', 'perMonth'].indexOf(f.type) < 0) f = { type: 'daily' };
  return cleanFreq_(f);
}

function cleanFreq_(f) {
  var out = { type: f.type, days: [], weeks: [] };
  if (f.type !== 'daily') out.n = Math.max(1, Math.round(Number(f.n)) || 1);
  (f.days || []).forEach(function (d) { d = Number(d); if (d >= 0 && d <= 6 && out.days.indexOf(d) < 0) out.days.push(d); });
  (f.weeks || []).forEach(function (w) { w = Number(w); if (w >= 1 && w <= 5 && out.weeks.indexOf(w) < 0) out.weeks.push(w); });
  return out;
}

function cleanHabit_(h) {
  return {
    id: String(h.id || newId_()),
    name: String(h.name || 'Habit').slice(0, 120),
    f: cleanFreq_(h.f || { type: 'daily' }),
    goal: Number(h.goal) > 0 ? Math.round(Number(h.goal)) : null,
    start: fmtDate_(h.start)
  };
}
