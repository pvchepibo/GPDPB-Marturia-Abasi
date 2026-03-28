# GPDPB Marturia Abasi - Website Jemaat & Admin

Website resmi **GPDPB Marturia Abasi** yang dirancang untuk memberikan informasi jemaat secara real-time dan transparansi laporan keuangan gereja. Dibangun dengan teknologi modern untuk performa tinggi dan kemudahan pengelolaan data.

## ✨ Fitur Utama

### ⛪ Sisi Jemaat (Publik)
- **Warta Jemaat Real-time:** Pengumuman, jadwal ibadah, dan kegiatan jemaat yang selalu terupdate otomatis.
- **Laporan Kas Keuangan:** Transparansi dana masuk dan keluar beserta ringkasan saldo akhir.
- **Desain Responsif:** Tampilan yang bersih dan nyaman dibuka melalui smartphone (Mobile Friendly) maupun komputer.

### 🔐 Sisi Admin (Privat)
- **Login Autentikasi:** Keamanan akses menggunakan Google Authentication (Firebase Auth).
- **Panel Admin Khusus:** Antarmuka intuitif untuk menambah, mengedit, dan menghapus data warta serta transaksi keuangan.
- **Keamanan Data:** Dilindungi dengan *Firestore Security Rules* untuk mencegah akses tidak sah.

## 🚀 Teknologi yang Digunakan

- **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Motion](https://motion.dev/)

## 🛠️ Persiapan & Instalasi

Jika Anda ingin menjalankan proyek ini secara lokal atau mempublikasikannya ke GitHub:

1. **Clone Repositori:**
   ```bash
   git clone <url-repositori-anda>
   cd gpdpb-marturia-abasi
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Firebase:**
   Pastikan file `firebase-applet-config.json` sudah berisi kredensial Firebase Anda:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_AUTH_DOMAIN",
     "projectId": "YOUR_PROJECT_ID",
     "appId": "YOUR_APP_ID",
     "firestoreDatabaseId": "YOUR_DATABASE_ID"
   }
   ```

4. **Variabel Lingkungan (.env):**
   Buat file `.env.local` dan tambahkan kunci API jika diperlukan (seperti Gemini API Key).

5. **Jalankan Mode Pengembangan:**
   ```bash
   npm run dev
   ```

## 📦 Deployment

Proyek ini siap dideploy ke platform seperti **Vercel**, **Netlify**, atau **Cloud Run**. Karena menggunakan Next.js, proses deployment sangat mudah dan otomatis.

---

**© 2026 GPDPB Marturia Abasi.** Melayani dengan Kasih dan Kebenaran.
