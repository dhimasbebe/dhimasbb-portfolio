# Portfolio — Dhimas Bintang Bagaskara

Situs portfolio statis untuk **Dhimas Bintang Bagaskara** — Lead Service Representative Officer & Software Quality Assurance.
Dibangun dengan **Astro 7** (static output), tanpa framework UI tambahan, dan dirancang agar seluruh teks dapat diedit
lewat Markdown / CMS tanpa menyentuh kode.

Live: <https://dhimasbb.web.id>

---

## Menjalankan

```bash
npm install      # sekali saja
npm run dev      # http://localhost:4321
npm run build    # hasil statis di dist/
npm run preview  # pratinjau hasil build
npm run check    # type-check Astro + TypeScript
```

Butuh Node.js 20+.

---

## Struktur

```
astro.config.mjs          site URL, output static, sitemap
public/
  assets/                 CV PDF (diunduh dari tombol Download CV)
  admin/                  Sveltia CMS (index.html + config.yml)
  favicon.svg             ikon monogram "D"
  og-image.png            1200×630 untuk Open Graph / Twitter
  robots.txt              allow-all + referensi sitemap
src/
  content.config.ts       skema content collections (zod)
  content/
    site/profile.md       singleton: meta, nav, hero, marquee, about, contact, footer
    experience/           3 role
    education/            4 entri
    certifications/       4 sertifikasi
    projects/             8 proyek
    publications/         2 jurnal
  layouts/BaseLayout.astro  <head>, SEO, chrome (grain/glow/progress), Nav, MobileMenu
  pages/index.astro         satu-satunya halaman
  components/               Nav, MobileMenu, LanguageToggle, Hero, Marquee, SectionHead,
                            About, Experience, Education, Projects, ProjectCard,
                            Publications, Contact, Footer, ProjectModal
  i18n/                     labels.ts (label modal), types.ts (tipe bersama)
  lib/                      content.ts (akses koleksi), modal-payload.ts (payload JSON modal)
  styles/                   tokens.css, base.css, components.css, motion.css
  scripts/                  main.ts + lang, scroll, reveal, pointer, modal, nav
legacy/index.html           situs single-file sebelumnya (arsip, tidak dipakai build)
backup/                     snapshot historis
deploy-backup/              salinan .deploy/ sebelum migrasi
```

---

## Model bilingual (single URL)

Tidak ada route `/id/`. Kedua bahasa dikirim dalam satu HTML:

```html
<span data-en="About" data-id="Tentang">About</span>
```

`src/scripts/lang.ts` menulis ulang `textContent` setiap node `[data-en]` dari atribut `data-<lang>`,
mengubah `<html lang>`, menyimpan pilihan ke `localStorage` (`portfolio-lang`), lalu menjalankan ulang
`splitTitles()` agar animasi judul tetap bekerja. Konsekuensinya:

- **Jangan menaruh elemen anak di dalam `.sec-title` / `.contact-title`** — `splitTitles()` menimpa `innerHTML`.
- Setiap teks baru yang perlu diterjemahkan harus dirender sebagai atribut `data-en` + `data-id`.

Isi modal proyek **berbeda** dari isi kartu proyek. Kartu memakai blok `card:` (tag, desc, chips),
sedangkan modal memakai blok `en:` dan `id:` (tag, status, sub, overview, challenge, role, features, linkText).

---

## Mengedit konten

### Opsi A — CMS (Sveltia)

Buka `/admin/` setelah situs ter-deploy. CMS menulis langsung ke repository sebagai commit,
dan setiap commit memicu build ulang.

Sebelum dipakai, siapkan sekali:

1. Isi `backend.repo` di `public/admin/config.yml` dengan `OWNER/REPO` yang benar.
2. Deploy OAuth worker (mis. `sveltia-cms-auth` di Cloudflare Workers) lalu isi `backend.base_url`.
3. Login lewat GitHub.

Repository ini **tidak** menyertakan implementasi OAuth.

### Opsi B — edit Markdown langsung di GitHub (selalu tersedia)

1. Buka `src/content/...` di GitHub.
2. Pilih file → ikon pensil → ubah teks → **Commit changes**.
3. Build & deploy otomatis berjalan.

Panduan singkat per kebutuhan:

| Ingin mengubah | Edit file |
| --- | --- |
| Judul hero, sub, statistik, menu nav | `src/content/site/profile.md` |
| Judul section ("Selected work", dll.) | `src/content/site/profile.md` → `sections` |
| Paragraf About, 3 kartu duty, chips toolbox | `src/content/site/profile.md` → `about` |
| Email / LinkedIn / WhatsApp | `src/content/site/profile.md` → `contact` |
| Pengalaman kerja | `src/content/experience/*.md` |
| Pendidikan | `src/content/education/*.md` |
| Sertifikasi | `src/content/certifications/*.md` |
| Proyek (kartu + modal) | `src/content/projects/*.md` |
| Publikasi | `src/content/publications/*.md` |
| CV PDF | ganti `public/assets/CV-Dhimas-Bintang-Bagaskara.pdf` |
| Gambar OG | ganti `public/og-image.png` (1200×630) |

### Menambah proyek

Buat file baru di `src/content/projects/`, mis. `proyek-baru.md`. **Nama file = id proyek** dan
otomatis menjadi atribut `data-project` pada kartu. Urutan tampil mengikuti field `order`.

```yaml
---
order: 9
title: { en: "Nama Proyek", id: "Nama Proyek" }
card:
  ariaLabel: "Open Nama Proyek project details"
  tag: { en: "Kategori · Sub", id: "Kategori · Sub" }
  desc:
    en: >-
      Deskripsi singkat untuk kartu.
    id: >-
      Deskripsi singkat untuk kartu.
  chips:
    - { en: "Flutter", id: "Flutter" }
tools: ["Flutter", "Figma"]
link: ""
en:
  tag: "Kategori · Sub"
  status: ""
  title: "Nama Proyek"
  sub: "Satu kalimat ringkas."
  overview: >-
    ...
  challenge: >-
    ...
  role: >-
    ...
  features:
    - "Fitur satu"
  linkText: ""
id:
  # struktur sama, versi Bahasa Indonesia
---
```

Catatan YAML: bungkus string dengan tanda kutip bila mengandung `:` `—` `·` `&` `'` `#`,
atau gunakan blok `>-` untuk paragraf panjang.

---

## Catatan teknis

- **CSS** dipecah empat lapis dan diimpor berurutan: `tokens → base → components → motion`.
  Aturan disalin apa adanya dari versi single-file agar tampilan identik.
- **Tanpa JavaScript**: inline script di `<head>` menambahkan kelas `js` ke `<html>`. Semua keadaan
  tersembunyi (`.reveal`, `.tw-i`, garis `.sec-label`) hanya aktif di bawah `.js`, sehingga konten
  tetap terbaca bila JS mati. Angka statistik dirender server sebagai nilai final (`02+`, `04`, `02`);
  JS hanya menganimasikan bila berjalan.
- **Modal**: delapan entri proyek ditanam sebagai `<script type="application/json" id="projects-data">`
  (hanya teks modal, tanpa `card.*`). Tidak ada request jaringan saat modal dibuka.
- **Breakpoint**: 1080 / 980 / 640 / 420 px. Hero memakai `min-height:100svh` dengan fallback `100vh`.
- **Reduced motion** dihormati: `prefers-reduced-motion: reduce` mematikan animasi dan membuat semua
  elemen reveal langsung terlihat.
- **SEO**: canonical, OG/Twitter meta, JSON-LD `Person`, `sitemap-index.xml` dari `@astrojs/sitemap`.

---

## Deploy

Output statis di `dist/` dapat dilayani hosting apa pun (Cloudflare Pages, Netlify, Vercel, Nginx).
Tidak ada server runtime.

```
Build command : npm run build
Output folder : dist
```
