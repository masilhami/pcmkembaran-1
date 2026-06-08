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
}