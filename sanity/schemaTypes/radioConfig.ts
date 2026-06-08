export default {
  name: 'radioConfig',
  title: 'Konfigurasi Radio & Live',
  type: 'document',
  fields: [
    {
      name: 'isYouTubeLive',
      title: 'Aktifkan Live YouTube?',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'youtubeVideoId',
      title: 'YouTube Video ID (Live)',
      type: 'string',
      description: 'Masukkan 11 karakter ID video dari URL Live YouTube (Contoh: dQw4w9WgXcQ)',
      hidden: ({ document }: { document: any }) => !document?.isYouTubeLive, // otomatis sembunyi jika saklar OFF
    },
  ],
  // =========================================================================
  // PERBAIKAN UTAMA: Mengatur Judul Tampilan List Agar Tidak Muncul ID Dokumen
  // =========================================================================
  preview: {
    select: {
      isLive: 'isYouTubeLive',
    },
    prepare(selection: { isLive: boolean }) {
      const { isLive } = selection;
      return {
        // Mengunci judul utama list menggunakan Nama Channel / Stasiun Radio Anda
        title: 'PCM Kembaran', 
        // Subtitle dinamis untuk memberikan info cepat di panel navigasi kiri
        subtitle: isLive ? '🔴 LIVE YOUTUBE AKTIF' : '📻 MODE STREAMING MP3',
      };
    },
  },
}