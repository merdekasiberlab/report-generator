# AI Generator Report Bug Bounty Merdeka Siber

**Laporan keamanan berbasis AI yang menyajikan temuan secara sistematis, efisien, dan siap unduh dalam format PDF profesional!**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

---

## Ringkasan Proyek

**AI Generator Report Bug Bounty Merdeka Siber** adalah alat bantu berbasis web untuk mempercepat pembuatan laporan temuan kerentanan (bug bounty atau penetration testing). Dengan integrasi Google Gemini API, alat ini membantu menyusun konten laporan, memungkinkan para profesional keamanan siber untuk fokus pada analisis teknis. Output utama adalah dokumen PDF yang terstruktur rapi dan siap pakai.

## Fitur Utama

* 📝 **Formulir Laporan Komprehensif:** Input terstruktur untuk semua detail penting.
* 🤖 **Asisten Penulisan AI:** Bantuan dari Google Gemini untuk deskripsi, dampak, & rekomendasi (memerlukan API Key pengguna).
* 📄 **Output PDF Profesional:** Laporan A4 dengan header, footer, penomoran halaman, dan styling Markdown dasar.
* 🖼️ **Unggah & Pratinjau Screenshot:** Mudah lampirkan bukti visual.
* ✨ **Antarmuka Modern & Dinamis:** Penambahan langkah/referensi secara interaktif.
* 🔒 **Pratinjau HTML Aman:** Sanitasi input untuk mencegah XSS pada pratinjau konten.
* 💻 **Berjalan Lokal:** Tidak memerlukan instalasi server, cukup buka di browser.

## Teknologi

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)
* **AI Integration:** Google Gemini API

## 🚀 Memulai

1.  **Clone Repositori:**
    ```bash
    git clone [https://github.com/](https://github.com/)[NAMA_PENGGUNA_ANDA]/ai-report-generator-merdeka-siber.git
    cd ai-report-generator-merdeka-siber
    ```
2.  **Kunci API Google Gemini:**
    * Alat ini memerlukan kunci API Google Gemini. Dapatkan dari [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Masukkan kunci API Anda pada field yang tersedia di antarmuka aplikasi atau langsung di `script.js` (placeholder `MASUKKAN_API_KEY_ANDA_DISINI`) untuk pengembangan lokal.
    * **PENTING:** JANGAN commit kunci API Anda ke repositori publik.
3.  **Jalankan Aplikasi:**
    Buka file `index.html` di browser web modern Anda. Menggunakan server lokal (seperti ekstensi "Live Server" di VS Code) direkomendasikan.

##  Cara Penggunaan

1.  **Isi Informasi Pelapor & Detail Laporan** pada form yang tersedia.
2.  **Gunakan Bantuan AI** (opsional) dengan mengklik tombol "Isi dengan AI" atau "Isi Otomatis (AI)".
3.  **Unggah Tangkapan Layar** sebagai bukti pendukung.
4.  **Pratinjau Konten** menggunakan tombol "Pratinjau Konten" untuk memeriksa data.
5.  **Unduh PDF** dengan mengklik tombol "Unduh PDF Profesional".

## 🤝 Kontribusi

Kontribusi untuk meningkatkan alat ini sangat kami hargai! Baik itu laporan bug, permintaan fitur, atau pull request kode, semua akan sangat membantu.

Silakan baca panduan kontribusi kami di [CONTRIBUTING.md](CONTRIBUTING.md) untuk detail lebih lanjut tentang cara Anda dapat membantu proyek ini.

## 📜 Lisensi

Proyek ini dilisensikan di bawah **Lisensi MIT**. Lihat file `LICENSE` untuk informasi lengkap.

---

Terima kasih telah menggunakan dan berkontribusi pada AI Generator Report Bug Bounty Merdeka Siber!