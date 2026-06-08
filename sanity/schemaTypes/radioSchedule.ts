import { Rule } from 'sanity'

export default {
  name: 'radioSchedule',
  title: 'Jadwal Siaran',
  type: 'object',
  fields: [
    {
      name: 'eventName',
      title: 'Nama Acara / Kajian',
      type: 'string',
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: 'startTime',
      title: 'Jam Mulai (Format HH:MM)',
      type: 'string',
      description: 'Contoh: 04:30, 09:00, 18:15',
      validation: (rule: Rule) => rule.required().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'HH:MM format' }),
    },
    {
      name: 'endTime',
      title: 'Jam Selesai (Format HH:MM)',
      type: 'string',
      description: 'Contoh: 06:00, 11:30, 19:30',
      validation: (rule: Rule) => rule.required().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'HH:MM format' }),
    },
    {
      name: 'broadcastMode',
      title: 'Mode Siaran Jam Ini',
      type: 'string',
      options: {
        list: [
          { title: '🎥 Live YouTube', value: 'youtube_live' },
          { title: '🎵 Playlist MP3 Internal', value: 'playlist_mp3' },
        ],
        layout: 'radio',
      },
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: 'youtubeVideoId',
      title: 'YouTube Video ID',
      type: 'string',
      description: 'Masukkan ID video saja (Contoh: dQw4w9WgXcQ)',
      hidden: ({ parent }: any) => parent?.broadcastMode !== 'youtube_live',
    },
    {
      name: 'playlist',
      title: 'Daftar File MP3 (Playlist)',
      type: 'array',
      hidden: ({ parent }: any) => parent?.broadcastMode !== 'playlist_mp3',
      of: [
        {
          type: 'object',
          name: 'track',
          title: 'Track Audio',
          fields: [
            { name: 'trackTitle', title: 'Judul Audio', type: 'string', validation: (rule: Rule) => rule.required() },
            { name: 'speaker', title: 'Narasumber / Pengisi', type: 'string' },
            { 
              name: 'audioFile', 
              title: 'Upload File MP3', 
              type: 'file',
              options: { accept: 'audio/mp3, audio/mpeg' },
              validation: (rule: Rule) => rule.required()
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'eventName',
      start: 'startTime',
      end: 'endTime',
      mode: 'broadcastMode',
    },
    prepare(selection: any) {
      const { title, start, end, mode } = selection
      const modeLabel = mode === 'youtube_live' ? '🎥 YT Live' : '🎵 MP3 Playlist'
      return {
        title: title,
        subtitle: `🕒 ${start} - ${end} | ${modeLabel}`,
      }
    },
  },
}