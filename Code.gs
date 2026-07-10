/**
 * ============================================================
 *  SISTEM e-UNDIAN BWP - MRSM
 *  Backend Google Apps Script
 * ============================================================
 *  ARAHAN PEMASANGAN:
 *  1. Buka Google Sheet baharu, salin ID nya (dalam URL selepas /d/)
 *  2. Buat folder di Google Drive untuk simpan gambar calon, salin ID folder
 *  3. Isi CONFIG di bawah
 *  4. Jalankan fungsi setupSheets() SEKALI sahaja (Run > setupSheets)
 *  5. Deploy > New deployment > Web app
 *     - Execute as: Me
 *     - Who has access: Anyone (atau Anyone with Google account ikut keperluan)
 * ============================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1tLOe2_mJSS7AmqvQZ-HOOsifuL0nxAbwJF5Hfa9CSGQ',
  ADMIN_PASSWORD: 'admin123', // TUKAR password ini sebelum guna sistem sebenar
  BAHAGIAN_LIST: ['L4', 'P4', 'L2', 'P2'],
  BAHAGIAN_LABEL: {
    L4: 'Lelaki Tingkatan 4',
    P4: 'Perempuan Tingkatan 4',
    L2: 'Lelaki Tingkatan 2',
    P2: 'Perempuan Tingkatan 2'
  },
  SHEET_CALON: 'Calon',
  SHEET_TETAPAN: 'Tetapan',
  SHEET_PENGUNDI: 'Pengundi',
  SHEET_UNDIAN: 'Undian'
};

// ================= UTILITIES =================

function ss_() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function sheet_(name) {
  return ss_().getSheetByName(name);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  const tmpl = HtmlService.createTemplateFromFile('Index');
  return tmpl.evaluate()
    .setTitle('Sistem e-Undian BWP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ================= SETUP (jalankan sekali) =================

function setupSheets() {
  const ss = ss_();

  // Sheet Calon
  let sh = ss.getSheetByName(CONFIG.SHEET_CALON);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_CALON);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID', 'Bahagian', 'Nama', 'Kelas', 'Motto', 'GambarURL', 'Aktif']);
    sh.setFrozenRows(1);
  }

  // Sheet Tetapan
  sh = ss.getSheetByName(CONFIG.SHEET_TETAPAN);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_TETAPAN);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Bahagian', 'MaxPilihan']);
    CONFIG.BAHAGIAN_LIST.forEach(function (b) {
      sh.appendRow([b, 7]);
    });
    sh.setFrozenRows(1);
  }

  // Sheet Pengundi
  sh = ss.getSheetByName(CONFIG.SHEET_PENGUNDI);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_PENGUNDI);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['NoMaktab', 'Nama', 'Status', 'TimestampUndi']);
    sh.setFrozenRows(1);
  }

  // Sheet Undian
  sh = ss.getSheetByName(CONFIG.SHEET_UNDIAN);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_UNDIAN);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Timestamp', 'NoMaktab', 'Bahagian', 'CalonID', 'NamaCalon']);
    sh.setFrozenRows(1);
  }

  SpreadsheetApp.getUi && SpreadsheetApp.getUi().alert('Setup selesai! Sheet Calon, Tetapan, Pengundi, Undian telah disediakan.');
}

// ================= CACHE HELPERS =================

function invalidateCache_() {
  CacheService.getScriptCache().remove('CALON_DATA');
  CacheService.getScriptCache().remove('TETAPAN_DATA');
}

// ================= CANDIDATES & SETTINGS (voter-facing) =================

function getSettings_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('TETAPAN_DATA');
  if (cached) return JSON.parse(cached);

  const sh = sheet_(CONFIG.SHEET_TETAPAN);
  const data = sh.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = Number(data[i][1]) || 0;
  }
  cache.put('TETAPAN_DATA', JSON.stringify(settings), 21600); // 6 jam
  return settings;
}

function getCandidatesGrouped_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('CALON_DATA');
  if (cached) return JSON.parse(cached);

  const sh = sheet_(CONFIG.SHEET_CALON);
  const data = sh.getDataRange().getValues();
  const grouped = {};
  CONFIG.BAHAGIAN_LIST.forEach(function (b) { grouped[b] = []; });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[0], bahagian = row[1], nama = row[2], kelas = row[3],
      motto = row[4], aktif = row[6];
    // NOTA: gambar TIDAK disertakan dalam cache/response utama — diambil berasingan
    if (String(aktif).toUpperCase() === 'FALSE') continue;
    if (!grouped[bahagian]) grouped[bahagian] = [];
    grouped[bahagian].push({
      id: String(id), nama: nama, kelas: kelas, motto: motto
    });
  }
  cache.put('CALON_DATA', JSON.stringify(grouped), 3600);
  return grouped;
}

/**
 * Dipanggil dari frontend untuk ambil gambar satu calon sahaja mengikut ID.
 * Return: string data URL atau '' jika tiada gambar.
 */
function getCalonGambar(calonId) {
  const sh = sheet_(CONFIG.SHEET_CALON);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(calonId)) {
      return data[i][5] || ''; // kolum GambarURL (index 5)
    }
  }
  return '';
}

/**
 * Dipanggil oleh Index.html selepas login berjaya.
 * Return: { bahagian: { candidates:[...], maxPilihan: n, label: '...' } }
 */
function getVotingData() {
  const candidates = getCandidatesGrouped_();
  const settings = getSettings_();
  const result = {};
  CONFIG.BAHAGIAN_LIST.forEach(function (b) {
    result[b] = {
      label: CONFIG.BAHAGIAN_LABEL[b],
      maxPilihan: settings[b] || 1,
      candidates: candidates[b] || []
    };
  });
  return result;
}

// ================= LOGIN / VOTER STATUS =================

/**
 * Semak No Maktab: wujud? sudah undi?
 * return {ok:true} atau {ok:false, mesej:'...'}
 */
function checkVoter(noMaktab) {
  noMaktab = String(noMaktab).trim();
  if (!noMaktab) return { ok: false, mesej: 'Sila masukkan No. Maktab.' };

  // Semak status sesi pengundian dahulu
  const sesi = getStatusSesi();
  if (!sesi.buka) {
    return { ok: false, mesej: sesi.mesej || 'Sesi pengundian belum dibuka. Sila tunggu arahan penyelaras.' };
  }

  const sh = sheet_(CONFIG.SHEET_PENGUNDI);
  const finder = sh.createTextFinder(noMaktab).matchEntireCell(true).matchCase(false);
  const cell = finder.findNext();

  if (!cell) {
    return { ok: false, mesej: 'No. Maktab tidak berdaftar dalam senarai pengundi. Sila hubungi penyelaras.' };
  }
  const row = cell.getRow();
  const status = sh.getRange(row, 3).getValue();
  if (String(status).trim() === 'Sudah') {
    return { ok: false, mesej: 'Anda telah pun mengundi. Setiap pengundi hanya dibenarkan mengundi SEKALI sahaja.' };
  }
  return { ok: true };
}

// ================= SUBMIT VOTE =================

/**
 * votes = { L4:[id,id,...], P4:[...], L2:[...], P2:[...] }
 */
function submitVote(noMaktab, votes) {
  noMaktab = String(noMaktab).trim();
  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(15000);
  if (!gotLock) {
    return { ok: false, mesej: 'Sistem sedang sibuk, sila cuba semula sebentar lagi.' };
  }

  try {
    // 1. Re-check status di dalam lock (elak race condition)
    const shPengundi = sheet_(CONFIG.SHEET_PENGUNDI);
    const finder = shPengundi.createTextFinder(noMaktab).matchEntireCell(true).matchCase(false);
    const cell = finder.findNext();
    if (!cell) {
      return { ok: false, mesej: 'No. Maktab tidak berdaftar.' };
    }
    const row = cell.getRow();
    const statusSemasa = shPengundi.getRange(row, 3).getValue();
    if (String(statusSemasa).trim() === 'Sudah') {
      return { ok: false, mesej: 'Anda telah pun mengundi.' };
    }

    // 2. Validasi bilangan pilihan setiap bahagian — MESTI TEPAT sama dengan maxPilihan
    const settings = getSettings_();
    const candidates = getCandidatesGrouped_();
    for (let i = 0; i < CONFIG.BAHAGIAN_LIST.length; i++) {
      const b = CONFIG.BAHAGIAN_LIST[i];
      const pilihan = votes[b] || [];
      const max = settings[b] || 1;
      if (pilihan.length !== max) {
        return {
          ok: false,
          mesej: 'Bilangan pilihan untuk bahagian ' + CONFIG.BAHAGIAN_LABEL[b] +
            ' tidak tepat. Mesti pilih ' + max + ' calon (anda pilih ' + pilihan.length + ').'
        };
      }
    }

    // 3. Kumpul semua baris undian untuk ditulis sekali (batch)
    const now = new Date();
    const rowsToWrite = [];
    for (let i = 0; i < CONFIG.BAHAGIAN_LIST.length; i++) {
      const b = CONFIG.BAHAGIAN_LIST[i];
      const pilihan = votes[b] || [];
      const listCalon = candidates[b] || [];
      pilihan.forEach(function (calonId) {
        const calonObj = listCalon.filter(function (c) { return c.id === String(calonId); })[0];
        const nama = calonObj ? calonObj.nama : '';
        rowsToWrite.push([now, noMaktab, b, calonId, nama]);
      });
    }

    const shUndian = sheet_(CONFIG.SHEET_UNDIAN);
    if (rowsToWrite.length > 0) {
      shUndian.getRange(shUndian.getLastRow() + 1, 1, rowsToWrite.length, 5).setValues(rowsToWrite);
    }

    // 4. Tandakan pengundi sudah mengundi
    shPengundi.getRange(row, 3).setValue('Sudah');
    shPengundi.getRange(row, 4).setValue(now);

    return { ok: true, mesej: 'Undian anda berjaya direkodkan. Terima kasih!' };

  } catch (err) {
    return { ok: false, mesej: 'Ralat sistem: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

// ================= ADMIN AUTH =================

function adminLogin(password) {
  return String(password) === String(CONFIG.ADMIN_PASSWORD);
}

// ================= ADMIN: DASHBOARD DATA =================

function getDashboardData() {
  const shPengundi = sheet_(CONFIG.SHEET_PENGUNDI);
  const dataPengundi = shPengundi.getDataRange().getValues();
  let jumlahBerdaftar = 0, jumlahSudah = 0;
  for (let i = 1; i < dataPengundi.length; i++) {
    if (!dataPengundi[i][0]) continue;
    jumlahBerdaftar++;
    if (String(dataPengundi[i][2]).trim() === 'Sudah') jumlahSudah++;
  }

  const shUndian = sheet_(CONFIG.SHEET_UNDIAN);
  const dataUndian = shUndian.getDataRange().getValues();
  const settings = getSettings_();
  const candidates = getCandidatesGrouped_();

  // kira undian setiap calon
  const kiraan = {}; // {bahagian: {calonId: count}}
  CONFIG.BAHAGIAN_LIST.forEach(function (b) { kiraan[b] = {}; });

  for (let i = 1; i < dataUndian.length; i++) {
    const bahagian = dataUndian[i][2];
    const calonId = String(dataUndian[i][3]);
    if (!kiraan[bahagian]) kiraan[bahagian] = {};
    kiraan[bahagian][calonId] = (kiraan[bahagian][calonId] || 0) + 1;
  }

  const result = {
    jumlahBerdaftar: jumlahBerdaftar,
    jumlahSudah: jumlahSudah,
    jumlahBelum: jumlahBerdaftar - jumlahSudah,
    bahagian: {}
  };

  CONFIG.BAHAGIAN_LIST.forEach(function (b) {
    const list = (candidates[b] || []).map(function (c) {
      return {
        id: c.id,
        nama: c.nama,
        kelas: c.kelas,
        undi: kiraan[b][c.id] || 0
      };
    });
    list.sort(function (a, b2) { return b2.undi - a.undi; });
    const max = settings[b] || 0;
    result.bahagian[b] = {
      label: CONFIG.BAHAGIAN_LABEL[b],
      maxPilihan: max,
      calon: list,
      terpilih: list.slice(0, max)
    };
  });

  return result;
}

// ================= ADMIN: URUS CALON =================

function getAllCandidatesAdmin() {
  const sh = sheet_(CONFIG.SHEET_CALON);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    out.push({
      id: data[i][0], bahagian: data[i][1], nama: data[i][2], kelas: data[i][3],
      motto: data[i][4], gambar: data[i][5], aktif: data[i][6]
    });
  }
  return out;
}

/**
 * candidate = {bahagian, nama, kelas, motto, imageBase64, imageMime}
 * Gambar disimpan sebagai Data URL terus dalam Sheet — tiada DriveApp diperlukan.
 */
function addCandidate(candidate) {
  try {
    if (!candidate || !candidate.nama || !candidate.kelas || !candidate.bahagian) {
      return { ok: false, mesej: 'Data calon tidak lengkap (bahagian/nama/kelas wajib diisi).' };
    }

    const sh = sheet_(CONFIG.SHEET_CALON);
    if (!sh) {
      return { ok: false, mesej: 'Sheet "' + CONFIG.SHEET_CALON + '" tidak dijumpai. Sila jalankan setupSheets() dahulu.' };
    }

    // Simpan gambar sebagai Data URL dalam sheet (tiada DriveApp diperlukan)
    let gambarUrl = '';
    if (candidate.imageBase64 && candidate.imageMime) {
      gambarUrl = 'data:' + candidate.imageMime + ';base64,' + candidate.imageBase64;
    }

    const newId = 'C' + new Date().getTime();
    sh.appendRow([newId, candidate.bahagian, candidate.nama, candidate.kelas, candidate.motto || '', gambarUrl, true]);
    SpreadsheetApp.flush();

    invalidateCache_();
    return { ok: true, id: newId };

  } catch (err) {
    return { ok: false, mesej: 'Ralat semasa tambah calon: ' + err.message };
  }
}

function deleteCandidate(id) {
  const sh = sheet_(CONFIG.SHEET_CALON);
  const finder = sh.createTextFinder(String(id)).matchEntireCell(true);
  const cell = finder.findNext();
  if (cell) {
    sh.deleteRow(cell.getRow());
    invalidateCache_();
    return { ok: true };
  }
  return { ok: false, mesej: 'Calon tidak dijumpai.' };
}

function toggleCandidateActive(id, aktif) {
  const sh = sheet_(CONFIG.SHEET_CALON);
  const finder = sh.createTextFinder(String(id)).matchEntireCell(true);
  const cell = finder.findNext();
  if (cell) {
    sh.getRange(cell.getRow(), 7).setValue(aktif);
    invalidateCache_();
    return { ok: true };
  }
  return { ok: false };
}

// ================= LAPORAN PDF =================

function getLaporanData() {
  const dash = getDashboardData();
  const now = new Date();
  const tarikhMasa = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'dd MMMM yyyy, HH:mm');

  return {
    tarikhMasa: tarikhMasa,
    jumlahBerdaftar: dash.jumlahBerdaftar,
    jumlahSudah: dash.jumlahSudah,
    jumlahBelum: dash.jumlahBelum,
    peratusHadir: dash.jumlahBerdaftar > 0
      ? Math.round(dash.jumlahSudah / dash.jumlahBerdaftar * 100) : 0,
    bahagian: dash.bahagian
  };
}

// ================= STATUS SESI PENGUNDIAN =================

function getStatusSesi() {
  const sh = sheet_(CONFIG.SHEET_TETAPAN);
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'STATUS_SESI') {
      return {
        buka: data[i][1] === true || String(data[i][1]).toUpperCase() === 'TRUE',
        mesej: data[i][2] || ''
      };
    }
  }
  // Default: sesi tutup jika tiada rekod
  return { buka: false, mesej: 'Sesi pengundian belum dibuka.' };
}

function setStatusSesi(buka, mesej) {
  const sh = sheet_(CONFIG.SHEET_TETAPAN);
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'STATUS_SESI') {
      sh.getRange(i + 1, 2).setValue(buka);
      sh.getRange(i + 1, 3).setValue(mesej || '');
      return { ok: true };
    }
  }
  // Baris STATUS_SESI belum wujud — tambah
  sh.appendRow(['STATUS_SESI', buka, mesej || '']);
  return { ok: true };
}

function updateSettings(newSettings) {
  // newSettings = {L4: n, P4: n, L2: n, P2: n}
  const sh = sheet_(CONFIG.SHEET_TETAPAN);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const b = data[i][0];
    if (newSettings[b] !== undefined) {
      sh.getRange(i + 1, 2).setValue(Number(newSettings[b]));
    }
  }
  invalidateCache_();
  return { ok: true };
}

// ================= ADMIN: IMPORT SENARAI PENGUNDI =================

/**
 * teks = No Maktab dipisah dengan baris baru (satu No Maktab setiap baris)
 * Format optional: "NoMaktab,Nama"
 */
function importVoters(teks) {
  const sh = sheet_(CONFIG.SHEET_PENGUNDI);
  const existing = sh.getDataRange().getValues();
  const existingSet = {};
  for (let i = 1; i < existing.length; i++) {
    existingSet[String(existing[i][0]).trim()] = true;
  }

  const lines = teks.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; });
  const rowsToAdd = [];
  let skip = 0;

  lines.forEach(function (line) {
    const parts = line.split(',');
    const noMaktab = parts[0].trim();
    const nama = parts[1] ? parts[1].trim() : '';
    if (!noMaktab || existingSet[noMaktab]) { skip++; return; }
    rowsToAdd.push([noMaktab, nama, 'Belum', '']);
    existingSet[noMaktab] = true;
  });

  if (rowsToAdd.length > 0) {
    sh.getRange(sh.getLastRow() + 1, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
  }

  return { ok: true, ditambah: rowsToAdd.length, dilangkau: skip };
}

function resetAllVotes() {
  const shUndian = sheet_(CONFIG.SHEET_UNDIAN);
  const lastRow = shUndian.getLastRow();
  if (lastRow > 1) shUndian.deleteRows(2, lastRow - 1);

  const shPengundi = sheet_(CONFIG.SHEET_PENGUNDI);
  const lastRowP = shPengundi.getLastRow();
  if (lastRowP > 1) {
    const range = shPengundi.getRange(2, 3, lastRowP - 1, 2);
    const blank = [];
    for (let i = 0; i < lastRowP - 1; i++) blank.push(['Belum', '']);
    range.setValues(blank);
  }
  return { ok: true };
}