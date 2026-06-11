# Edulab Schedule API

RESTful API untuk mengelola jadwal pelajaran sekolah. Dibangun dengan **Node.js + PostgreSQL**.

---

## ⚙️ Instalasi & Konfigurasi

### 1. Clone & install

```bash
git clone https://github.com/akbarardi/edulab-schedule-api.git
cd edulab-schedule-api
npm install
```

### 2. Buat file `.env`

```env
PORT=3000
API_KEY=SECRET123

DB_HOST=localhost
DB_NAME=db_edulab_schedule
DB_USER=postgres
DB_PASS=yourpassword

# Konfigurasi database production/cloud (Supabase Connection String)
DB_URI=
```

### 3. Jalankan server

```bash
# Development (nodemon)
npm run dev

# Production
npm start
```

> Tabel `schedules` akan dibuat otomatis oleh Sequelize saat server pertama kali jalan (`sequelize.sync()`).

---

## 🔐 Autentikasi

Semua endpoint wajib menyertakan header berikut:

```
x-api-key: SECRET123
```

Jika tidak valid atau tidak ada:

```json
{ "error": "Unauthorized" }
```

---

## Deteksi Bentrok Jadwal

Sistem secara otomatis mendeteksi bentrok saat `POST` maupun `PUT`. Bentrok terjadi apabila:

- **Kelas yang sama** sudah memiliki jadwal di tanggal dan jam yang sama, **atau**
- **Guru yang sama** sudah dijadwalkan di tanggal dan jam yang sama

Response jika terjadi bentrok:
```json
{
  "error": "Jadwal bentrok: kelas atau guru sudah memiliki jadwal di jam dan tanggal yang sama"
}
```

### Dokumentasi API & Pengujian (Postman)

Anda dapat mengakses, melihat struktur rute, maupun menguji API ini langsung melalui tautan berikut:

https://www.postman.com/akbarardiansyahs-team/edulab-schedule-api/overview

---

## Contoh File Excel Upload

Header kolom di baris pertama harus persis seperti berikut (boleh huruf kecil):

| class_code | class_name | subject_code | teacher_nik | teacher_name | date | jam_ke | time_start | time_end |
|---|---|---|---|---|---|---|---|---|
| XA01 | X-A | CHEM | 20222029 | Najdin Aqmarina, S.Pd. | 2025-02-10 | 2 | 08:40:00 | 09:20:00 |

