<p align="center"><img src="logo.png" alt="E-Tanol" width="40%"></p>

# E-Tanol Library
> E-Tanol — Sistem Perpustakaan Digital dengan Pencarian & Rekomendasi Buku berbasis LSA dan PCA untuk Tugas Besar Aljabar Linier dan Geometri

E-Tanol adalah sebuah aplikasi web yang menyediakan katalog buku lengkap beserta mesin pencarian dan rekomendasi. Aplikasi ini mengkombinasikan frontend Next.js dan backend FastAPI untuk menampilkan daftar buku, detail buku, pencarian dokumen, serta pencarian berbasis gambar (cover). Dataset buku (teks & cover) tersimpan di folder `data/`.

## Fitur Utama
* Halaman katalog buku (pagination, pencarian teks sederhana)
* Halaman detail buku termasuk pratinjau teks dan daftar rekomendasi (LSA)
* Pencarian dokumen: unggah file .txt untuk mencari buku serupa
* Pencarian gambar: unggah file gambar cover untuk mencari buku serupa
* API publik untuk daftar buku, detail buku, dan pencarian
* Disediakan Docker + docker-compose untuk deploy cepat

---
## Instalasi / Getting Started
Berikut cara cepat menjalankan aplikasi secara lokal (menggunakan Docker Compose) atau menjalankan bagian frontend/backend secara terpisah.

### Menggunakan Local Deployment
Saat ini kami menggunakan 2 environment yang berbeda, yang pertama branch ```main``` untuk deploy ke VPS dan branch ```localdeployment``` untuk menjalankan di local (dapat dengan docker maupun tanpa docker). 

### Menggunakan Docker Compose (direkomendasikan)
Pastikan Docker dan Docker Compose sudah terinstal di mesin Anda.

```powershell
docker-compose build

docker-compose up -d
```

Container yang dipakai:
- `backend`: FastAPI (port 8000)
- `frontend`: Next.js (port 3000 -> dipublish ke 5005 via docker-compose)

Setelah docker compose selesai, buka frontend di: http://localhost:5005 (atau sesuai port pada konfigurasi Anda) dan API backend di http://localhost:8000.

## Local
### Menjalankan Backend (dev) tanpa Docker
```powershell
cd src/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Endpoint utama:
- GET / -> Root message
- GET /health -> Health check
- GET /api/books -> Daftar buku (q, page, per_page)
- GET /api/books/{book_id} -> Detail buku
- POST /api/search/image -> Pencarian berbasis gambar (form-data: file)
- POST /api/search/document -> Pencarian berbasis teks (.txt saja)

### Menjalankan Frontend (dev) tanpa Docker
```powershell
cd src/frontend
npm ci
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000"; npm run dev
```

Jika menggunakan Command Prompt (cmd):
```cmd
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 && npm run dev
```

### Konfigurasi Awal
- Pastikan direktori `data` sudah di-root proyek dan berisi `mapper.json`, `covers/` dan `txt/`.
- Frontend memakai variabel environment `NEXT_PUBLIC_API_BASE_URL` untuk menentukan base API.
- Backend memuat `.env` bila ada (menggunakan python-dotenv). Default cors origin dan versi aplikasi sudah diset di `src/backend/app/core/config.py`.

---
## Pengembangan (Developing)
Berikut langkah pengembangan untuk berkontribusi pada source code:

```bash
git clone https://github.com/IRK-23/algeo2-e-tanol.git
cd algeo2-e-tanol
```

### Proses Build
- Frontend (production): `cd src/frontend && npm run build` lalu deploy (Dockerfile juga menyediakan proses build).
- Backend: tidak ada proses build, cukup run `uvicorn main:app` atau containerize.

### Deploying / Publishing
Gunakan Docker (Dockerfile di `src/backend` dan `src/frontend`) dan `docker-compose` untuk memudahkan deploy ke server/VM.

---
## API — Ringkasan Singkat

1. GET /api/books
	- Params: q, page, per_page
	- Response: list buku singkat + pagination

2. GET /api/books/{book_id}
	- Response: detail buku, pratinjau teks (1000 char), url baca teks, rekomendasi

3. POST /api/search/image
	- Body: form-data `file` (image)
	- Query params: threshold (float, default 0.3)
	- Response: list hasil (id, title, cover_url, similarity_score)

4. POST /api/search/document
	- Body: form-data `file` (.txt), threshold (float, default 0.1)
	- Response: list dokumen serupa

Contoh cURL untuk tes lokal:
```bash
# Daftar buku
curl "http://localhost:8000/api/books?page=1&per_page=12"

# Detail buku
curl "http://localhost:8000/api/books/100"

# Search dokumen (.txt)
curl -F "file=@./example.txt" "http://localhost:8000/api/search/document"

# Search image
curl -F "file=@./cover.jpg" "http://localhost:8000/api/search/image"
```

---
## Konfigurasi & Argumen
Beberapa variabel / argumen penting:

- `NEXT_PUBLIC_API_BASE_URL` (frontend) — URL base ke API backend.
- `PYTHONUNBUFFERED` (Docker) — di-setup dalam docker-compose agar output log langsung muncul.

Argumen API (contoh):
- page (Number) — halaman hasil pencarian (default 1)
- per_page (Number) — jumlah item per halaman (default 12)
- q (String) — query pencarian judul buku

---
## Fitur & Catatan Implementasi
* Mesin pencarian teks: LSA (Latent Semantic Analysis) untuk menemukan dokumen/halaman buku yang mirip.
* Pencarian gambar: pengambilan fitur gambar cover lalu melakukan pencocokan terhadap dataset (image search).
* Rekomendasi: dihasilkan oleh engine `lsa_engine.get_recommendations(book_id)` di backend.
* Data buku dan cover disimpan di folder `data/` — format mapping ada di `data/mapper.json`.

---
## Contributing
Jika Anda mau berkontribusi:
1. Fork repositori
2. Buat branch fitur: `git checkout -b feat/your-feature`
3. Commit dan push
4. Ajukan pull request ke branch utama `main`

---
## Links
- Repository: https://github.com/IRK-23/algeo2-e-tanol
- Deployed: https://algeo2.neutroncodes.com
- Dataset: dataset yang digunakan menyertakan koleksi teks & cover image (lihat folder `data/`)
- Issue tracker: https://github.com/IRK-23/algeo2-e-tanol/issues

---
## License
Lisensi: MIT — lihat `LICENSE`.

---
## Acknowledgements
Terima kasih kepada anggota kelompok E-Tanol (Algeo 24/25) atas kontribusi dan Asisten Laboratorium Ilmu Rekayasa Komputasi.
