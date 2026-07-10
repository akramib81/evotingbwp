# Sistem e-Undian BWP — MRSM Sultan Azlan Shah

Sistem pilihanraya elektronik Badan Wakil Pelajar (BWP) berasaskan Google Apps Script + Google Sheets.

## Ciri-ciri Utama

- Log masuk pengundi guna No. Maktab (satu kali sahaja)
- 4 bahagian pengundian: Lelaki T4, Perempuan T4, Lelaki T2, Perempuan T2
- Multi-pilihan dengan had boleh diset (cth: pilih 7 dari 12 calon)
- Gambar profil, nama, kelas, motto setiap calon
- Panel admin dengan dashboard, carta pai/bar, senarai calon terpilih
- Buka/tutup sesi pengundian dengan satu klik
- Eksport laporan PDF (kehadiran pengundi + keputusan undi)
- Sokongan sehingga 500 pengundi serentak

## Struktur Fail

```
├── Code.gs          # Backend Google Apps Script
├── Index.html       # Frontend (pengundi + admin) — satu halaman
├── appsscript.json  # Manifest konfigurasi Apps Script
└── README.md        # Panduan ini
```

## Pemasangan

Rujuk `PANDUAN_PEMASANGAN.md` untuk arahan lengkap.

## Teknologi

- Google Apps Script (GAS)
- Google Sheets (database)
- Chart.js (carta dashboard)
- HTML/CSS/JS (frontend)
