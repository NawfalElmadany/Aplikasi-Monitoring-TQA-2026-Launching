<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SiTQA TQA Dashboard

Dashboard monitoring hafalan dan tartili TQA berbasis React + Vite, sekarang dengan integrasi Supabase untuk data siswa, pengaturan aplikasi, dan catatan guru.

## Menjalankan Proyek

**Prerequisites:** Node.js

1. Install dependency:
   `npm install`
2. Copy file environment:
   `copy .env.example .env.local`
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` sesuai project Supabase Anda.
4. Jalankan SQL di [supabase/schema.sql](/C:/Nawfal-Aplikasi-TQA-main/Nawfal-Aplikasi-TQA-main/supabase/schema.sql) melalui SQL Editor Supabase.
5. Start aplikasi:
   `npm run dev`

## Mode Fallback

Kalau environment Supabase belum diisi, aplikasi tetap bisa berjalan memakai seed data lokal. Setelah kredensial Supabase tersedia, aplikasi akan otomatis sinkron ke tabel:

- `students`
- `app_settings`
- `notes`

## Catatan Implementasi

- Login masih mempertahankan flow demo yang sudah ada supaya aplikasi tidak rusak sebelum akun/auth Supabase Anda siap.
- Data `students`, `academicYear`, `targets`, `teachers`, dan `notes` sekarang dimuat dari Supabase saat konfigurasi environment tersedia.
- Backup/restore dari menu pengaturan juga ikut menulis balik ke Supabase setelah data dipulihkan.
