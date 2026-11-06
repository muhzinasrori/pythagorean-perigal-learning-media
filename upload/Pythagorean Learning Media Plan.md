# Rencana Pengembangan Media Pembelajaran Interaktif Teorema Pythagoras

**Topik:** Pembuktian Visual Teorema Pythagoras melalui Irisan Henry Perigal (*Perigal’s Dissection*)

**Platform:** Web Interaktif (Desktop & Tablet Friendly)

**Target Pengguna:** Siswa SMP / SMA & Pengajar Matematika

---

## 📑 Daftar Isi

1. [Landasan Konseptual & Pedagogis](https://www.google.com/search?q=%231-landasan-konseptual--pedagogis)
2. [Arsitektur & Struktur Navigasi Web](https://www.google.com/search?q=%232-arsitektur--struktur-navigasi-web)
3. [Rincian Modul & Alur Aktivitas Siswa](https://www.google.com/search?q=%233-rincian-modul--alur-aktivitas-siswa)
4. [Desain Antarmuka & UX (*User Experience*)](https://www.google.com/search?q=%234-desain-antarmuka--ux-user-experience)
5. [Spesifikasi Teknis & Stack Teknologi](https://www.google.com/search?q=%235-spesifikasi-teknis--stack-teknologi)
6. [Langkah-Langkah Implementasi Kode Markdown/Web](https://www.google.com/search?q=%236-langkah-langkah-implementasi-kode-markdownweb)

---

## 1. Landasan Konseptual & Pedagogis

### 1.1 Konsep Irisan Henry Perigal

Henry Perigal (1801–1898) menemukan metode pembuktian secara visual di mana kuadrat dari sisi tegak menengah ($b^2$) dibagi menjadi 4 bagian kongruen melalui titik pusatnya. Keempat potongan ini, jika diletakkan di 4 sudut persegi hipotenusa ($c^2$), akan menyisakan ruang kosong berbentuk persegi tepat di tengah yang pas diisi oleh persegi dari sisi terkecil ($a^2$).

```
        Persegi b²                      Persegi c² (Tujuan)
     +-------+-------+                  +---------------+
     |   1   |   2   |                  | 1 |       | 2 |
     |-------O-------|   + Persegi a²   |---+  a²   +---|
     |   3   |   4   |   =======>       | 3 |       | 4 |
     +-------+-------+                  +---------------+
 (Dipotong melalui O)                (Disusun di 4 sudut)

```

### 1.2 Model Pembelajaran (*Guided Discovery Learning*)

Media ini dirancang tidak hanya untuk menyajikan visualisasi pasif, melainkan memfasilitasi **penemuan terbimbing**:

* **Eksplorasi Hipotesis:** Siswa mencoba memilih sudut potong sendiri.
* **Konstruktif:** Siswa melakukan eksperimen potong-pasang secara mandiri.
* **Reflektif:** Siswa menyimpulkan mengapa aturan ketersejajaran dengan hipotenusa menjadi syarat wajib kesempurnaan puzzle.

---

## 2. Arsitektur & Struktur Navigasi Web

```
[ Beranda / Landing Page ]
          │
          ├──> [ Modul 1: Pre-Konsep (Luas & Tripel Pythagoras) ]
          │
          ├──> [ Modul 2: Eksplorasi Konstruksi Perigal (Utama) ]
          │          ├── Tahap 1: Penentuan Titik Pusat (O)
          │          ├── Tahap 2: Rotasi & Alignment Garis Pemotong
          │          ├── Tahap 3: Eksekusi Pemotongan Visual
          │          └── Tahap 4: Drag-and-Drop ke Bingkai c²
          │
          └──> [ Modul 3: Evaluasi & Refleksi Interaktif ]
                     ├── Mode Puzzle Bebas (Tantangan)
                     └── Kuis Formatif (Auto-Grading)

```

---

## 3. Rincian Modul & Alur Aktivitas Siswa

### Modul 1: Orientasi Konsep Dasar

* **Tujuan:** Mengingatkan siswa bahwa $a^2 + b^2 = c^2$ adalah perbandingan luas tiga persegi.
* **Fitur Utama:**
* Canvas interaktif dengan slider $a$ dan $b$.
* Tampilan nilai luas $a^2$, $b^2$, dan $c^2$ secara dinamis.



### Modul 2: Studio Interaktif Konstruksi Perigal (Core Feature)

#### **Tahap 1: Menemukan Titik Pusat $O$**

* **Aktivitas:** Siswa menarik dua garis diagonal pada persegi $b^2$.
* **Output:** Perpotongan diagonal membentuk titik pusat $O$.

#### **Tahap 2: Rotasi & Pemotongan Mandiri**

* **Aktivitas:**
* Siswa mengontrol slider rotasi ($0^\circ - 180^\circ$) yang memutar garis pemotong di titik $O$.
* Terdapat petunjuk kemiringan hipotenusa $c$.


* **Dua Mode Eksplorasi:**
* **Mode Bebas:** Siswa dipersilakan memotong pada sudut berapa saja.
* **Mode Magnet (Snap):** Garis terkunci otomatis ketika paralel dengan hipotenusa $c$ (memberikan *feedback* visual warna hijau).



#### **Tahap 3: Pemotongan Visual**

* **Aktivitas:** Siswa mengeklik tombol **"Potong Persegi"**.
* **Output:** Persegi $b^2$ terpisah menjadi 4 keping polygon independen.

#### **Tahap 4: Perakitan ke Persegi $c^2$ (*Drag & Drop*)**

* **Aktivitas:** Siswa memindahkan 4 kepingan $b^2$ dan 1 kepingan $a^2$ ke dalam kerangka $c^2$.
* **Feedback:** Jika sudut potong salah pada Tahap 2, kepingan akan tumpang tindih (*overlap*) atau menyisakan celah tidak rapi. Jika benar, kepingan akan masuk secara presisi (*perfect snap*).

### Modul 3: Evaluasi & Refleksi

* **Tantangan Waktu:** Menyusun puzzle Perigal dengan variasi ukuran segitiga siku-siku acak.
* **Kuis Konseptual:** 3-5 pertanyaan pilihan ganda interaktif dengan penjelasan langsung.

---

## 4. Desain Antarmuka & UX (*User Experience*)

### Layout Workspace (Modul Utama)

```
+-----------------------------------------------------------------------+
|  HEADER: Media Interaktif Perigal's Dissection            [Bantuan]   |
+------------------------------------+----------------------------------+
|  AREA SIMULASI (CANVAS / SVG)      |  PANEL KONTROL SISWA             |
|                                    |                                  |
|   +----+                           |  Langkah 2: Tentukan Arah Potong |
|   | a² |                           |                                  |
|   +----+      +-----------+        |  Sudut Potong: [=====|====] 36.8°|
|               |           |        |  [ ] Kunci Sejajar Hipotenusa    |
|               |    b²     |        |                                  |
|               +-----------+        |  [   POTONG SEKARANG   ]         |
|                                    |                                  |
|   Bingkai c²:                      |  Status:                         |
|   +-----------------------+        |  "Garis potong sejajar dengan    |
|   |                       |        |   hipotenusa c!"                 |
|   +-----------------------+        |                                  |
+------------------------------------+----------------------------------+
|  FOOTER: Navigasi Modul ( [Kembali]  [1]  [2]  [3]  [Lanjut] )       |
+-----------------------------------------------------------------------+

```

---

## 5. Spesifikasi Teknis & Stack Teknologi

| Komponen | Teknologi Terpilih | Alasan Pemilihan |
| --- | --- | --- |
| **Framework Web** | Next.js / React (TypeScript) | Arsitektur komponen modular dan efisien |
| **Styling** | Tailwind CSS | Pengembangan UI responsif & rapi |
| **Render Geometri** | SVG / HTML5 Canvas | Penanganan bentuk geometri dan kepingan puzzle secara presisi |
| **Interaktivitas & Drag** | `react-rnd` / HTML5 Drag and Drop API | Pengoperasian *drag and drop* yang intuitif |
| **Animasi Potongan** | Framer Motion | Pergerakan potongan geometri secara halus (*smooth transition*) |

---