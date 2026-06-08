import { type SchemaTypeDefinition } from 'sanity'
import post from './post'
import download from './download'
import gallery from './gallery'
import ranting from './ranting'
import masjid from './masjid'
import profile from './profile'
import pimpinan from './pimpinan' 
import installations from './installations' 
import youtube from './youtube'
import jadwalKajian from './jadwalKajian'
// =========================================================================
// INTERVENSI DASHBOARD: Impor skema konfigurasi radio & live terpusat yang baru
// =========================================================================
import radioConfig from './radioConfig' // <-- TAMBAHKAN IMPORT INI

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    post,          // Artikel/Berita
    profile,       // Profil PCM
    pimpinan,      // Struktur Pengurus
    ranting,       // Data Ranting
    masjid,        // Data Masjid
    gallery,       // Galeri Foto
    download,      // File Download
    installations, // Registrasi data aplikasi
    youtube,       // Objek Youtube
    jadwalKajian,  // Jadwal Kajian
    
    // =========================================================================
    // REGISTRASI MODUL: Masukkan skema radioConfig agar aktif di Sanity Studio
    // =========================================================================
    radioConfig,   // <-- TAMBAHKAN DI SINI
  ],
}