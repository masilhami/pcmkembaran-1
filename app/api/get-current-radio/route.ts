import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { client } from "@/lib/sanity.client"; 

export const dynamic = "force-dynamic"; 

const ADZAN_URL = "/audio/adzan.mp3"; 
const ADZAN_DURATION = 300; // 5 Menit

const FILLER_PLAYLIST = [
  { title: "Murottal Jeda - Surah Al-Mulk", url: "https://sdit.my.id/radio/SurahAlMulk-Saad-Al-Ghamdi.mp3", duration: 415, speaker: "Saad Al-Ghamdi" },
  { title: "Nasyid Jeda - Rikhie Asbo", url: "https://sdit.my.id/radio/Rikhie-Asbo.mp3", duration: 5760, speaker: "Rikhie Asbo" },
  { title: "Murottal Jeda - Surah Al-Waqiah", url: "https://sdit.my.id/radio/al-waqiah-ust-shidqy.mp3", duration: 780, speaker: "Ust. Shidqy" },
  { title: "Nasyid Jeda - Hanya Rindu Versi Arab", url: "https://sdit.my.id/radio/hanya-rindu-versi-arab.mp3", duration: 258, speaker: "Anonim" },
  { title: "Murottal Jeda - Al Fatihah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/001-Al-Fatihah.mp3", duration: 27, speaker: "Syaikh Abdullah Al-Mathrud" },
  { title: "Murottal Jeda - Al Baqarah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/002-Al-Baqarah.mp3", duration: 7200, speaker: "Syaikh Abdullah Al-Mathrud" },
  { title: "Murottal Jeda - Ali Imron Syaikh Abdullah Al-Mathrud", url: "https://ia801406.us.archive.org/8/items/abdullahal-mathrud/003-Ali-Imran.mp3", duration: 4800, speaker: "Syaikh Abdullah Al-Mathrud" }
];

const TOTAL_FILLER_DURATION = FILLER_PLAYLIST.reduce((acc, item) => acc + item.duration, 0);

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Menghitung Virtual Timeline secara presisi berbasis akumulasi durasi riil antarlagu
function getVirtualTrackFromPlaylist(
  playlist: Array<{title?: string, trackTitle?: string, duration?: number, url?: string, audioFileUrl?: string, speaker?: string}>, 
  secondsElapsedSinceStart: number
) {
  const getDuration = (track: any) => Number(track.duration) || 240; 
  const totalDuration = playlist.reduce((acc, item) => acc + getDuration(item), 0);

  if (totalDuration <= 0) {
    return { title: "Radio Suara Berkemajuan", audio_url: "", elapsed_seconds: 0, artist: "PCM Kembaran" };
  }

  const virtualTimeline = Math.floor(Math.abs(secondsElapsedSinceStart)) % totalDuration;
  let accumulatedTime = 0;

  for (const track of playlist) {
    const d = getDuration(track);
    if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + d) {
      return {
        title: track.trackTitle || track.title || "Kajian Pilihan",
        audio_url: track.audioFileUrl || track.url || "",
        elapsed_seconds: virtualTimeline - accumulatedTime,
        artist: track.speaker || "PCM Kembaran", 
      };
    }
    accumulatedTime += d;
  }

  return {
    title: playlist[0].trackTitle || playlist[0].title || "Kajian Pilihan",
    audio_url: playlist[0].audioFileUrl || playlist[0].url || "",
    elapsed_seconds: 0,
    artist: playlist[0].speaker || "PCM Kembaran",
  };
}

function getVirtualFillerTrack(gapSeconds: number) {
  return getVirtualTrackFromPlaylist(FILLER_PLAYLIST, gapSeconds);
}

async function getAdzanMinutesToday(): Promise<{ [key: string]: number }> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');

    const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${year}/${month}/${date}`, { 
      next: { revalidate: 3600 } 
    });
    const json = await res.json();

    if (json?.status && json?.data?.jadwal) {
      const j = json.data.jadwal;
      return {
        subuh: timeToMinutes(j.subuh),
        dzuhur: timeToMinutes(j.dzuhur),
        ashar: timeToMinutes(j.ashar),
        maghrib: timeToMinutes(j.maghrib),
        isya: timeToMinutes(j.isya),
      };
    }
  } catch (err) {
    console.error("Gagal mengambil API Jadwal Sholat:", err);
  }
  return { subuh: 275, dzuhur: 710, ashar: 915, maghrib: 1075, isya: 1145 };
}

export async function GET() {
  try {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const timeParts = timeFormatter.formatToParts(now);
    const currentHours = Number(timeParts.find(p => p.type === 'hour')?.value || 0);
    const currentMinutes = Number(timeParts.find(p => p.type === 'minute')?.value || 0);
    const currentSecs = Number(timeParts.find(p => p.type === 'second')?.value || 0);
    
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    // 1. CEK INTERUPSI ADZAN
    try {
      const jadwalSholat = await getAdzanMinutesToday();
      const namaWaktuSholat = Object.keys(jadwalSholat).find(key => {
        const waktuSholatMenit = jadwalSholat[key];
        const selisihDetik = ((currentTotalMinutes - waktuSholatMenit) * 60) + currentSecs;
        return selisihDetik >= 0 && selisihDetik < ADZAN_DURATION;
      });

      if (namaWaktuSholat) {
        const waktuSholatMenit = jadwalSholat[namaWaktuSholat];
        const elapsedAdzanSeconds = ((currentTotalMinutes - waktuSholatMenit) * 60) + currentSecs;

        return NextResponse.json({
          active: true,
          type: "adzan",
          youtube_video_id: null,
          thumbnail: "/bg-player.png",
          title: `Panggilan Adzan - Waktu ${namaWaktuSholat.toUpperCase()}`,
          artist: "Radio Suara Al Muttaqin",
          program_title: "Adzan Otomatis Wilayah Purwokerto",
          audio_url: ADZAN_URL,
          elapsed_seconds: elapsedAdzanSeconds > 10 ? 0 : elapsedAdzanSeconds, 
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 2. AMBIL DATA JADWAL SANITY CMS
    try {
      const sanityQuery = `
        *[_type == "radioConfig"][0] {
          radioName,
          stationTagline,
          schedules[] {
            day,
            eventName,
            speaker,
            startTime,
            endTime,
            broadcastMode,
            youtubeVideoId,
            relayUrl,
            playlist[] {
              trackTitle,
              speaker,
              duration, 
              "audioFileUrl": audioFile.asset->url
            }
          }
        }
      `;
      
      const config = await client.fetch(sanityQuery, {}, { cache: 'no-store' });

      if (config?.schedules && Array.isArray(config.schedules)) {
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long'
        });
        const currentDayName = dayFormatter.format(now);

        let activeSchedule = null;
        for (const schedule of config.schedules) {
          const start = timeToMinutes(schedule.startTime);
          const end = timeToMinutes(schedule.endTime);
          const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
          const isDayMatch = schedule.day === 'everyday' || schedule.day === currentDayName;

          if (isTimeMatch && isDayMatch) {
            activeSchedule = schedule;
            break;
          }
        }

        if (activeSchedule) {
          const isYoutube = activeSchedule.broadcastMode === 'youtube_live';
          const isLiveRelay = activeSchedule.broadcastMode?.includes('relay') || activeSchedule.broadcastMode === 'live_relay';
          const stationName = config.radioName || "Radio Suara Berkemajuan";
          const startMinutes = timeToMinutes(activeSchedule.startTime);
          const secondsSinceScheduleStarted = ((currentTotalMinutes - startMinutes) * 60) + currentSecs;

          if (isYoutube) {
            const videoId = activeSchedule.youtubeVideoId?.trim() || null;
            return NextResponse.json({
              active: true,
              type: "youtube_live",
              youtube_video_id: videoId,
              thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming YouTube",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
              elapsed_seconds: 0
            });
          }

          if (isLiveRelay) {
            const cleanRelayUrl = activeSchedule.relayUrl?.trim() || "";
            const secureAudioUrl = cleanRelayUrl 
              ? `/api/radio-stream?url=${encodeURIComponent(cleanRelayUrl)}` 
              : "/api/radio-stream";

            return NextResponse.json({
              active: true,
              type: "live_relay",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming Radio",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: secureAudioUrl,
              elapsed_seconds: 0 
            });
          }

          if (activeSchedule.playlist && activeSchedule.playlist.length > 0) {
            const virtualTrack = getVirtualTrackFromPlaylist(activeSchedule.playlist, secondsSinceScheduleStarted);
            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: virtualTrack.title,
              artist: virtualTrack.artist, 
              program_title: stationName,
              audio_url: virtualTrack.audio_url,
              elapsed_seconds: virtualTrack.elapsed_seconds,
            });
          } else {
            const virtualFiller = getVirtualTrackFromPlaylist(FILLER_PLAYLIST, secondsSinceScheduleStarted);
            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: virtualFiller.title,
              artist: virtualFiller.artist, 
              program_title: activeSchedule.eventName || stationName,
              audio_url: virtualFiller.audio_url,
              elapsed_seconds: virtualFiller.elapsed_seconds,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 3. JALUR CADANGAN PRISMA DB
    const currentTrack = await prisma.radioStream.findFirst({
      orderBy: { start_time: "desc" },
    });

    if (!currentTrack) {
      const nowTimestampSeconds = Math.floor(Date.now() / 1000);
      const currentFiller = getVirtualFillerTrack(nowTimestampSeconds);
      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        artist: currentFiller.artist,
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

    // FIX LOGIKA SINKRONISASI: Jika lagu utama selesai, paksa filler berputar mengikuti timestamp absolut saat ini
    if (elapsedSeconds >= allowedDuration || elapsedSeconds > currentTrack.duration) {
      const totalTimelineSeconds = Math.floor(nowTimestamp / 1000);
      const currentFiller = getVirtualFillerTrack(totalTimelineSeconds);
      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        artist: currentFiller.artist,
        program_title: "Audio Cadangan (Jeda)",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      });
    }

    // FIX UTAMA: Biarkan elapsed_seconds berjalan maju secara real-time absolut (tidak di-reset atau dibatasi rem)
    return NextResponse.json({
      active: true,
      title: currentTrack.title,
      artist: "Kajian Pilihan",
      program_title: currentTrack.title,
      audio_url: currentTrack.audio_url,
      elapsed_seconds: Math.floor(elapsedSeconds), 
      type: "main",
    });

  } catch (error: any) {
    const fallbackSeconds = Math.floor(Date.now() / 1000);
    const emergencyFiller = getVirtualFillerTrack(fallbackSeconds);
    return NextResponse.json({
      active: true,
      title: emergencyFiller.title,
      artist: emergencyFiller.artist,
      program_title: "Audio Cadangan (Emergency)",
      audio_url: emergencyFiller.audio_url,
      elapsed_seconds: emergencyFiller.elapsed_seconds,
      type: "fallback",
    });
  }
}