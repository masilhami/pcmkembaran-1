import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { client } from "@/lib/sanity.client"; // Dipertahankan sesuai path impor client Sanity Anda

export const dynamic = "force-dynamic"; // Memaksa API selalu fresh tanpa membeku di cache Vercel

// =================================================================
// 1. KONFIGURASI JINGLE OTOMATIS
// =================================================================
const JINGLE_URL = "/audio/jingle-pcm.mp3";
const JINGLE_DURATION = 25;

// =================================================================
// 2. DAFTAR AUDIO CADANGAN (FILLER)
// =================================================================
const FILLER_PLAYLIST = [
  {
    title: "Murottal Jeda - Surah Al-Mulk",
    url: "https://sdit.my.id/radio/SurahAlMulk-Saad-Al-Ghamdi.mp3",
    duration: 415,
  },
  {
    title: "Nasyid Jeda - Rikhie Asbo",
    url: "https://sdit.my.id/radio/Rikhie-Asbo.mp3",
    duration: 5760,
  },
  {
    title: "Murottal Jeda - Surah Al-Waqiah",
    url: "https://sdit.my.id/radio/al-waqiah-ust-shidqy.mp3",
    duration: 780,
  },
  {
    title: "Nasyid Jeda - Hanya Rindu Versi Arab",
    url: "https://sdit.my.id/radio/hanya-rindu-versi-arab.mp3",
    duration: 258,
  },
  {
    title: "Murottal Jeda - Al Fatihah Syaikh Abdullah Al-Mathrud",
    url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/001-Al-Fatihah.mp3",
    duration: 27,
  },
  {
    title: "Murottal Jeda - Al Baqarah Syaikh Abdullah Al-Mathrud",
    url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/002-Al-Baqarah.mp3",
    duration: 7200,
  },
  {
    title: "Murottal Jeda - Ali Imron Syaikh Abdullah Al-Mathrud",
    url: "https://ia801406.us.archive.org/8/items/abdullahal-mathrud/003-Ali-Imran.mp3",
    duration: 4800,
  },
];

const TOTAL_FILLER_DURATION = FILLER_PLAYLIST.reduce(
  (acc, item) => acc + item.duration,
  0
);

// Fungsi pembantu mengubah string "HH:MM" menjadi total menit
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

function titleFromAudioUrl(audioUrl?: string, fallback = "Radio Suara Berkemajuan") {
  if (!audioUrl) return fallback;

  try {
    const url = new URL(audioUrl);
    const rawFilename = url.pathname.split("/").pop() || "";
    const withoutExtension = rawFilename.replace(/\.[a-z0-9]+$/i, "");
    return decodeURIComponent(withoutExtension).replace(/[_-]+/g, " ").trim() || fallback;
  } catch {
    const rawFilename = audioUrl.split("/").pop() || "";
    return rawFilename.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim() || fallback;
  }
}

function getVirtualFillerTrack(gapSeconds: number) {
  if (TOTAL_FILLER_DURATION <= 0) {
    return {
      title: "Radio Suara Berkemajuan",
      audio_url: "",
      elapsed_seconds: 0,
    };
  }

  const virtualTimeline = Math.floor(Math.abs(gapSeconds)) % TOTAL_FILLER_DURATION;
  let accumulatedTime = 0;

  for (const track of FILLER_PLAYLIST) {
    if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + track.duration) {
      return {
        title: track.title || titleFromAudioUrl(track.url),
        audio_url: track.url,
        elapsed_seconds: virtualTimeline - accumulatedTime,
      };
    }
    accumulatedTime += track.duration;
  }

  return {
    title: FILLER_PLAYLIST[0].title || titleFromAudioUrl(FILLER_PLAYLIST[0].url),
    audio_url: FILLER_PLAYLIST[0].url,
    elapsed_seconds: 0,
  };
}

// =================================================================
// MAIN HANDLER GET
// =================================================================
export async function GET() {
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // =================================================================
    // 0. PRIORITAS UTAMA BARU: DETEKSI JADWAL 24 JAM hybrid DARI SANITY
    // =================================================================
    try {
      const sanityQuery = `
        *[_type == "radioConfig"][0] {
          radioName,
          stationTagline,
          schedules[] {
            eventName,
            speaker,
            startTime,
            endTime,
            broadcastMode,
            youtubeVideoId,
            playlist[] {
              trackTitle,
              speaker,
              "audioFileUrl": audioFile.asset->url
            }
          }
        }
      `;
      
      const config = await client.fetch(sanityQuery, {}, { cache: 'no-store' });

      if (config && config.schedules && Array.isArray(config.schedules)) {
        // Ambil waktu sekarang di zona lokal Asia/Jakarta (WIB)
        const localTimeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
        const [currentHours, currentMinutes] = localTimeStr.split('.').map(Number);
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        let activeSchedule = null;
        for (const schedule of config.schedules) {
          const start = timeToMinutes(schedule.startTime);
          const end = timeToMinutes(schedule.endTime);

          if (currentTotalMinutes >= start && currentTotalMinutes < end) {
            activeSchedule = schedule;
            break;
          }
        }

        // JIKA MENEMUKAN JADWAL YANG COCOK DI JAM SEKARANG
        if (activeSchedule) {
          const isYoutube = activeSchedule.broadcastMode === 'youtube_live';
          const currentTrack = !isYoutube && activeSchedule.playlist?.length > 0 ? activeSchedule.playlist[0] : null;
          const stationName = config.radioName || "Radio Suara Berkemajuan";

          return NextResponse.json({
            active: true,
            type: activeSchedule.broadcastMode, // 'youtube_live' atau 'playlist_mp3'
            youtube_video_id: isYoutube ? (activeSchedule.youtubeVideoId?.trim() || null) : null,
            thumbnail: isYoutube ? `https://img.youtube.com/vi/${activeSchedule.youtubeVideoId?.trim()}/hqdefault.jpg` : "/bg-player.png",
            
            // Pemetaan nama data dinamis agar sesuai desain komponen player
            title: isYoutube 
              ? (activeSchedule.eventName || "Live Streaming YouTube") 
              : (currentTrack?.trackTitle || activeSchedule.eventName),
            artist: isYoutube 
              ? (activeSchedule.speaker || "PCM Kembaran") 
              : (currentTrack?.speaker || activeSchedule.speaker || "PCM Kembaran"),
            program_title: stationName,
            
            // Audio streaming direct dari CDN Sanity CMS jika mode playlist aktif
            audio_url: isYoutube ? `https://www.youtube.com/watch?v=${activeSchedule.youtubeVideoId?.trim()}` : (currentTrack?.audioFileUrl || null),
            elapsed_seconds: 0,
            schedules: config.schedules // Payload cadangan baris jadwal
          });
        }
      }
    } catch (sanityError) {
      console.error("Gagal memproses otomatisasi jadwal Sanity CMS:", sanityError);
      // Jika Sanity down, program otomatis meluncur ke bawah mengeksekusi data fallback Prisma/Filler
    }

    // =================================================================
    // A. JINGLE TIAP 5 MENIT (DIKONDISIKAN SEBAGAI CRON BACKEND LAMA)
    // =================================================================
    if (currentMinute % 5 === 0 && currentMinute !== 0 && currentSecond < JINGLE_DURATION) {
      return NextResponse.json({
        active: true,
        title: titleFromAudioUrl(JINGLE_URL, "Jingle Suara Berkemajuan"),
        program_title: "Jingle Suara Berkemajuan",
        audio_url: JINGLE_URL,
        elapsed_seconds: currentSecond,
        type: "jingle",
      });
    }

    // =================================================================
    // B. JALUR CADANGAN (PRISMA DATABASE ENGINE LAMA)
    // =================================================================
    const currentTrack = await prisma.radioStream.findFirst({
      orderBy: {
        start_time: "desc",
      },
    });

    // =================================================================
    // C. JIKA TIDAK ADA JADWAL UTAMA SAMA SEKALI, PUTAR FILLER
    // =================================================================
    if (!currentTrack) {
      const nowTimestampSeconds = Math.floor(Date.now() / 1000);
      const currentFiller = getVirtualFillerTrack(nowTimestampSeconds);

      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        program_title: "Audio Cadangan",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      });
    }

    const startTime = new Date(currentTrack.start_time).getTime();
    const nowTimestamp = Date.now();
    const elapsedSeconds = (nowTimestamp - startTime) / 1000;
    const allowedDuration = currentTrack.duration;

    // =================================================================
    // D. JIKA AUDIO UTAMA MELEBIHI JATAH SLOT / SELESAI -> FILLER SEAMLESS
    // =================================================================
    if (elapsedSeconds >= allowedDuration) {
      const gapSeconds = elapsedSeconds - allowedDuration;
      const totalTimelineSeconds = Math.floor(startTime / 1000) + allowedDuration + gapSeconds;
      
      const currentFiller = getVirtualFillerTrack(totalTimelineSeconds);

      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        program_title: "Audio Cadangan (Jeda)",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      });
    }

    // =================================================================
    // E. KONDISI NORMAL (MP3 PRISMA UTAMA SEDANG BERJALAN)
    // =================================================================
    return NextResponse.json({
      active: true,
      title: titleFromAudioUrl(currentTrack.audio_url, currentTrack.title),
      program_title: currentTrack.title,
      audio_url: currentTrack.audio_url,
      elapsed_seconds: elapsedSeconds,
      type: "main",
    });

  } catch (error: any) {
    console.error("Gagal memuat get-current-radio emergency block:", error);
    const fallbackSeconds = Math.floor(Date.now() / 1000);
    const emergencyFiller = getVirtualFillerTrack(fallbackSeconds);
    return NextResponse.json({
      active: true,
      title: emergencyFiller.title,
      program_title: "Audio Cadangan (Emergency)",
      audio_url: emergencyFiller.audio_url,
      elapsed_seconds: emergencyFiller.elapsed_seconds,
      type: "fallback",
    });
  }
}