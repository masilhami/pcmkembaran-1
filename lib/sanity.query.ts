import { client } from "./sanity.client";
import { groq } from "next-sanity";

/**
 * 1. Ambil SEMUA postingan terbaru (Untuk Homepage)
 */
export async function getAllPosts() {
  return client.fetch(
    groq`*[_type == "post"] | order(publishedAt desc)[0...10] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Umum"),
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
 * Ditambah: downloadLink & fileSize agar bisa muncul indikator di list kategori
 */
export async function getPostsByCategory(categoryName: string) {
  return client.fetch(
    groq`*[_type == "post" && (category match $categoryName || categories[0]->title match $categoryName)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, $categoryName),
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
 * KRUSIAL: Menambahkan downloadLink & fileSize agar tombol download muncul!
 */
export async function getSinglePost(slug: string) {
  if (!slug) return null;
  return client.fetch(
    groq`*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      publishedAt,
      "category": coalesce(category, categories[0]->title, "Umum"),
      "views": coalesce(views, 0),
      "downloadLink": downloadLink,
      "fileSize": fileSize,
      body,
      "author": author->name
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
    groq`*[_type == "post" && (category match $category || categories[0]->title match $category) && slug.current != $currentSlug] | order(publishedAt desc) [0...8] {
      _id,
      title,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, $category),
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
    groq`*[_type == "post"] | order(views desc)[0...5] {
      _id,
      title,
      "slug": slug.current,
      "publishedAt": publishedAt,
      "category": coalesce(category, categories[0]->title, "Berita"),
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
      groq`*[_type == "post" && (title match $searchQuery || pt::text(body) match $searchQuery)] | order(publishedAt desc) {
        _id,
        title,
        "slug": slug.current,
        "image": mainImage.asset->url,
        "category": coalesce(category, categories[0]->title, "Umum"),
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