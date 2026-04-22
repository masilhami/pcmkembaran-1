import { client } from "./sanity.client";
import { groq } from "next-sanity";

/**
 * 1. Ambil SEMUA postingan terbaru + Jadwal Kajian (Homepage)
 * Menggunakan sistem Satu Pintu: Prioritas flyerImage untuk Jadwal.
 */
export async function getAllPosts() {
  return client.fetch(
    groq`*[_type in ["post", "jadwalKajian"]] | order(publishedAt desc)[0...10] {
      _id,
      "title": coalesce(title, tema), 
      "slug": slug.current,
      "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
      "views": coalesce(views, 0)
    }`
  );
}

/**
 * 2. Ambil Berita Terbaru
 */
export async function getNewsPosts() {
  return client.fetch(
    groq`*[_type == "post" && (category match "berita" || categories[0]->title match "Berita")] | order(publishedAt desc)[0...6] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": "Berita",
      "views": coalesce(views, 0)
    }`
  );
}

/**
 * 3. Ambil Artikel Terbaru
 */
export async function getArticlePosts() {
  return client.fetch(
    groq`*[_type == "post" && (category match "artikel" || categories[0]->title match "Artikel")] | order(publishedAt desc)[0...5] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": "Artikel",
      "views": coalesce(views, 0)
    }`
  );
}

/**
 * 4. Fungsi Dinamis Rubrik (Halaman Kategori)
 */
export async function getPostsByCategory(categoryName: string) {
  return client.fetch(
    groq`*[(_type == "post" || _type == "jadwalKajian") && (category match $categoryName || categories[0]->title match $categoryName || "Jadwal Kajian" match $categoryName)] | order(publishedAt desc) {
      _id,
      "title": coalesce(title, tema),
      "slug": slug.current,
      "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
      "views": coalesce(views, 0),
      "downloadLink": downloadLink,
      "fileSize": fileSize,
      "excerpt": array::join(string::split(pt::text(body), "")[0...150], "") + "..."
    }`,
    { categoryName }
  );
}

/**
 * 5. Detail Konten (Halaman Baca)
 * Menarik detail lengkap ustadz dan masjid untuk tampilan detail khusus.
 */
export async function getSinglePost(slug: string) {
  if (!slug) return null;
  return client.fetch(
    groq`*[_type in ["post", "jadwalKajian"] && slug.current == $slug][0] {
      _id,
      "title": coalesce(title, tema),
      "slug": slug.current,
      "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
      publishedAt,
      "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
      "views": coalesce(views, 0),
      "downloadLink": downloadLink,
      "fileSize": fileSize,
      body,
      "author": author->name,
      ustadz,
      waktu,
      keterangan,
      "namaMasjid": masjid->name,
      "alamatMasjid": masjid->address
    }`,
    { slug }
  );
}

/**
 * 6. Ambil Naskah Khutbah
 */
export async function getKhutbahPosts() {
  return client.fetch(
    groq`*[_type == "post" && (category match "khutbah" || categories[0]->title match "Khutbah")] | order(publishedAt desc)[0...5] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": "Khutbah",
      "views": coalesce(views, 0)
    }`
  );
}

/**
 * 7. Postingan Terkait
 */
export async function getRelatedPosts(category: string, currentSlug: string) {
  return client.fetch(
    groq`*[_type in ["post", "jadwalKajian"] && (category match $category || categories[0]->title match $category || "Jadwal Kajian" match $category) && slug.current != $currentSlug] | order(publishedAt desc) [0...8] {
      _id,
      "title": coalesce(title, tema),
      "slug": slug.current,
      "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
      "views": coalesce(views, 0)
    }`,
    { category, currentSlug }
  );
}

/**
 * 8. Postingan Terpopuler Global
 */
export async function getPopularPosts() {
  return client.fetch(
    groq`*[_type in ["post", "jadwalKajian"]] | order(views desc)[0...5] {
      _id,
      "title": coalesce(title, tema),
      "slug": slug.current,
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
      "views": coalesce(views, 0)
    }`
  );
}

/**
 * 9. Fungsi Pencarian Global
 */
export async function getSearchedPosts(searchQuery: string) {
  if (!searchQuery) return [];
  try {
    return await client.fetch(
      groq`*[_type in ["post", "jadwalKajian"] && (title match $searchQuery || tema match $searchQuery || pt::text(body) match $searchQuery)] | order(publishedAt desc) {
        _id,
        "title": coalesce(title, tema),
        "slug": slug.current,
        "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
        "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
        "publishedAt": publishedAt,
        "views": coalesce(views, 0)
      }`,
      { searchQuery: `*${searchQuery}*` }
    );
  } catch (error) {
    console.error("Gagal melakukan pencarian:", error);
    return [];
  }
}

/**
 * 10. Ambil Jadwal Kajian Hari Ini (Untuk Flyer & Halaman Utama Radar)
 */
export async function getKajianHariIni(hari: string, tanggal: string, pekanKe: string) {
  return client.fetch(
    groq`*[_type == "jadwalKajian" && (
      (tipe == "insidental" && tanggal == $tanggal) || 
      (tipe == "rutin" && hari == $hari && (count(pekan) == 0 || !defined(pekan) || $pekanKe in pekan))
    )] | order(tipe desc) {
      _id,
      tipe,
      hari,
      pekan,
      tanggal,
      ustadz,
      waktu,
      tema,
      keterangan,
      "namaMasjid": masjid->name,
      "alamatMasjid": masjid->address,
      "logoMasjid": masjid->logo.asset->url,
      "flyerImageUrl": flyerImage.asset->url
    }`,
    { hari, tanggal, pekanKe }
  );
}