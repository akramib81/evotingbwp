# Panduan Memuat Naik ke GitHub

## Kenapa GitHub?
GitHub membolehkan anda simpan semua kod secara selamat, jejak perubahan (version control),
dan mudah untuk dikongsi atau dipulihkan jika ada masalah.

---

## BAHAGIAN 1 — Buat Akaun GitHub (jika belum ada)

1. Pergi ke https://github.com
2. Klik **Sign up**
3. Ikut langkah pendaftaran (emel, password, verify)
4. Pilih pelan **Free**

---

## BAHAGIAN 2 — Buat Repository Baharu

1. Log masuk ke https://github.com
2. Klik butang **+** (atas kanan) → **New repository**
3. Isi maklumat:
   - **Repository name**: `evoting-bwp-mrsm` (atau nama lain pilihan anda)
   - **Description**: `Sistem e-Undian BWP MRSM Sultan Azlan Shah`
   - **Visibility**: pilih **Private** (disyorkan — supaya kod tidak terbuka kepada umum)
   - Tandakan ✅ **Add a README file**
4. Klik **Create repository**

---

## BAHAGIAN 3 — Muat Naik Fail Kod

### Cara A: Terus dari browser (paling mudah)

1. Dalam halaman repository anda, klik **Add file** → **Upload files**
2. Seret atau pilih fail-fail berikut:
   - `Code.gs`
   - `Index.html`
   - `appsscript.json`
   - `PANDUAN_PEMASANGAN.md`
3. Di bahagian bawah, isi **Commit changes**:
   - Tajuk commit: `Muat naik awal sistem e-Undian BWP`
4. Klik **Commit changes**

### Cara B: Guna GitHub Desktop (lebih mudah untuk kemaskini berulang)

1. Muat turun GitHub Desktop: https://desktop.github.com
2. Log masuk dengan akaun GitHub anda
3. Klik **Clone a repository** → pilih repo `evoting-bwp-mrsm`
4. Salin semua fail kod ke dalam folder yang di-clone
5. Dalam GitHub Desktop, anda akan nampak fail-fail baharu/berubah
6. Isi ringkasan commit (cth: "Kemaskini fungsi laporan PDF")
7. Klik **Commit to main** → **Push origin**

---

## BAHAGIAN 4 — Cara Kemaskini Kod (selepas ada perubahan)

Bila ada perubahan pada `Code.gs` atau `Index.html`:

### Cara browser:
1. Pergi ke fail dalam repository (klik nama fail)
2. Klik ikon pensel ✏️ (Edit this file)
3. Padam kandungan lama, tampal kandungan baharu
4. Klik **Commit changes** → isi tajuk → **Commit changes**

### Cara GitHub Desktop:
1. Salin fail baharu ke folder repo yang di-clone (gantikan yang lama)
2. GitHub Desktop akan detect perubahan secara automatik
3. Isi ringkasan commit → **Commit to main** → **Push origin**

---

## BAHAGIAN 5 — Struktur Repository yang Disyorkan

```
evoting-bwp-mrsm/
├── Code.gs                  ← Backend GAS
├── Index.html               ← Frontend (pengundi + admin)
├── appsscript.json          ← Manifest Apps Script
├── PANDUAN_PEMASANGAN.md    ← Panduan setup penuh
├── PANDUAN_GITHUB.md        ← Panduan ini
└── README.md                ← Penerangan projek
```

---

## BAHAGIAN 6 — Amalan Keselamatan Penting

⚠️ **JANGAN sekali-kali commit maklumat sensitif ke GitHub:**

- `SPREADSHEET_ID` — ID Google Sheet anda
- `ADMIN_PASSWORD` — Kata laluan admin

### Cara selamat:
Sebelum push ke GitHub, gantikan nilai sensitif dalam `Code.gs` dengan placeholder:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'PASTE_SPREADSHEET_ID_ANDA_DI_SINI',
  ADMIN_PASSWORD: 'TUKAR_PASSWORD_INI',
  ...
};
```

Simpan versi dengan ID sebenar dalam Apps Script Editor sahaja (bukan dalam GitHub).

---

## BAHAGIAN 7 — Pulihkan Kod dari GitHub

Jika berlaku masalah dan anda perlukan kod lama:

1. Pergi ke repository di GitHub
2. Klik **Commits** (atas kanan, tunjuk bilangan commit)
3. Cari commit yang dikehendaki, klik ikon `<>` (Browse the repository)
4. Salin semula kandungan fail yang diperlukan

---

## Tips Tambahan

- Buat commit setiap kali ada perubahan besar (jangan tunggu terlalu lama)
- Isi mesej commit yang jelas: cth `Tambah fungsi laporan PDF` bukan sekadar `update`
- Untuk kolaborasi dengan rakan sekerja, boleh tambah mereka sebagai **Collaborator**:
  Settings → Collaborators → Add people → cari username/emel mereka
