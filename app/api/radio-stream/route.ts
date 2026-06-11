import { NextResponse, NextRequest } from "next/server";
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

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Pengambil Jadwal Sholat API
async function getAdzanMinutesToday(): Promise<{ [key: string]: number }> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestType = searchParams.get("type"); // Metadata JSON checker

  // Inisialisasi Objek Respons Default (Struktur Data Radio)
  let radioResponseData = {
    active: true,
    type: "playlist_mp3",
    youtube_video_id: null as string | null,
    thumbnail: "/bg-player.png",
    title: "Siaran Utama Radio",
    artist: "Radio Suara Berkemajuan",
    program_title: "Radio Suara Berkemajuan",
    audio_url: "",
    elapsed_seconds: 0,
  };

  const now = new Date();
  
  // Ambil data Waktu Jakarta saat ini
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  const timeParts = timeFormatter.formatToParts(now);
  const currentHours = Number(timeParts.find(p => p.type === "hour")?.value || 0);
  const currentMinutes = Number(timeParts.find(p => p.type === "minute")?.value || 0);
  const currentSecs = Number(timeParts.find(p => p.type === "second")?.value || 0);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  // =========================================================================
  // LOGIKA 1: CEK INTERUPSI JADWAL ADZAN OTOMATIS
  // =========================================================================
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

      radioResponseData = {
        active: true,
        type: "adzan",
        youtube_video_id: null,
        thumbnail: "/bg-player.png",
        title: `Panggilan Adzan - Waktu ${namaWaktuSholat.toUpperCase()}`,
        artist: "Radio Suara Al Muttaqin",
        program_title: "Adzan Otomatis Wilayah Purwokerto",
        audio_url: ADZAN_URL,
        elapsed_seconds: elapsedAdzanSeconds > 10 ? 0 : elapsedAdzanSeconds,
      };

      return memprosesOutput(requestType, searchParams, radioResponseData);
    }
  } catch (e) {
    console.error("Error Adzan Check:", e);
  }

  // =========================================================================
  // LOGIKA 2: PARSING DATA JADWAL UTAMA SANITY CMS
  // =========================================================================
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
            "duration": audioFile.asset->metadata.duration,
            "audioFileUrl": audioFile.asset->url
          }
        }
      }
    `;

    const config = await client.fetch(sanityQuery, {}, { cache: "no-store" });
    const stationName = config?.radioName || "Radio Suara Berkemajuan";

    if (config?.schedules && Array.isArray(config.schedules)) {
      const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "long" });
      const currentDayName = dayFormatter.format(now);

      let activeSchedule = null;
      for (const schedule of config.schedules) {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
        const isDayMatch = schedule.day === "everyday" || schedule.day === currentDayName;

        if (isTimeMatch && isDayMatch) {
          activeSchedule = schedule;
          break;
        }
      }

      if (activeSchedule) {
        const mode = activeSchedule.broadcastMode || "playlist_mp3";
        const startMinutes = timeToMinutes(activeSchedule.startTime);
        // Menghitung berapa detik playlist berjalan sejak jam mulai jadwal
        const secondsSinceScheduleStarted = ((currentTotalMinutes - startMinutes) * 60) + currentSecs;

        // A. JIKA MODE YOUTUBE LIVE
        if (mode === "youtube_live") {
          const videoId = activeSchedule.youtubeVideoId?.trim() || null;
          radioResponseData = {
            active: true,
            type: "youtube_live",
            youtube_video_id: videoId,
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/bg-player.png",
            title: activeSchedule.eventName || "Live Streaming YouTube",
            artist: activeSchedule.speaker || "PCM Kembaran",
            program_title: stationName,
            audio_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
            elapsed_seconds: 0
          };
          return memprosesOutput(requestType, searchParams, radioResponseData);
        }

        // B. JIKA MODE LIVE RELAY (RADIO LAIN)
        if (mode === "live_relay" || mode.includes("relay")) {
          const cleanRelayUrl = activeSchedule.relayUrl?.trim() || "";
          radioResponseData = {
            active: true,
            type: "live_relay",
            youtube_video_id: null,
            thumbnail: "/bg-player.png",
            title: activeSchedule.eventName || "Live Streaming Radio",
            artist: activeSchedule.speaker || "PCM Kembaran",
            program_title: stationName,
            audio_url: cleanRelayUrl,
            elapsed_seconds: 0
          };
          return memprosesOutput(requestType, searchParams, radioResponseData);
        }

        // C. JIKA MODE PLAYLIST MP3 JADWAL SANITY
        if (activeSchedule.playlist && activeSchedule.playlist.length > 0) {
          const playlist = activeSchedule.playlist;
          const totalDuration = playlist.reduce((acc: number, item: any) => acc + (Math.floor(Number(item.duration)) || 240), 0);

          if (totalDuration > 0) {
            const virtualTimeline = Math.abs(secondsSinceScheduleStarted) % totalDuration;
            let accumulatedTime = 0;

            for (const track of playlist) {
              const d = Math.floor(Number(track.duration)) || 240;
              if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + d) {
                radioResponseData = {
                  active: true,
                  type: "playlist_mp3",
                  youtube_video_id: null,
                  thumbnail: "/bg-player.png",
                  title: track.trackTitle || "Kajian Pilihan",
                  artist: track.speaker || "PCM Kembaran",
                  program_title: stationName,
                  audio_url: track.audioFileUrl || "",
                  elapsed_seconds: virtualTimeline - accumulatedTime
                };
                return memprosesOutput(requestType, searchParams, radioResponseData);
              }
              accumulatedTime += d;
            }
          }
        }
      }
    }
  } catch (sanityError) {
    console.error("Sanity CMS Error, Alihkan ke Jalur Cadangan:", sanityError);
  }

  // =========================================================================
  // LOGIKA 3: JALUR CADANGAN (PRISMA DB / FIILER PLAYLIST DEFAULT)
  // =========================================================================
  try {
    const currentTrack = await prisma.radioStream.findFirst({ orderBy: { start_time: "desc" } });
    
    if (currentTrack) {
      const startTime = new Date(currentTrack.start_time).getTime();
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      if (elapsedSeconds < currentTrack.duration) {
        radioResponseData = {
          active: true,
          type: "main",
          youtube_video_id: null,
          thumbnail: "/bg-player.png",
          title: currentTrack.title,
          artist: "Kajian Pilihan",
          program_title: "Audio Utama (Database)",
          audio_url: currentTrack.audio_url,
          elapsed_seconds: Math.floor(elapsedSeconds)
        };
        return memprosesOutput(requestType, searchParams, radioResponseData);
      }
    }
  } catch (dbError) {
    console.error("Prisma Database Error:", dbError);
  }

  // FALLBACK TERAKHIR: Filler Playlist Loop Global agar Audio selalu menyala
  const globalTimestampSeconds = Math.floor(Date.now() / 1000);
  const totalFillerDuration = FILLER_PLAYLIST.reduce((acc, item) => acc + item.duration, 0);
  const virtualFillerTimeline = globalTimestampSeconds % totalFillerDuration;
  let accumulatedFillerTime = 0;

  for (const filler of FILLER_PLAYLIST) {
    if (virtualFillerTimeline >= accumulatedFillerTime && virtualFillerTimeline < accumulatedFillerTime + filler.duration) {
      radioResponseData = {
        active: true,
        type: "filler",
        youtube_video_id: null,
        thumbnail: "/bg-player.png",
        title: filler.title,
        artist: filler.speaker,
        program_title: "Audio Cadangan (Jeda)",
        audio_url: filler.url,
        elapsed_seconds: virtualFillerTimeline - accumulatedFillerTime
      };
      break;
    }
    accumulatedFillerTime += filler.duration;
  }

  return memprosesOutput(requestType, searchParams, radioResponseData);
}

// =========================================================================
// PIPELINE PROSES OUTPUT (FUNGSI ABSTRAKSI UNTUK JALUR JSON VS JALUR BINER)
// =========================================================================
async function memprosesOutput(requestType: string | null, searchParams: URLSearchParams, data: any) {
  
  // JALUR 1: Jika Frontend meminta data JSON Metadata Resmi (?type=metadata)
  if (requestType === "metadata") {
    // Rumuskan URL Direct Proxy Biner Hawkhost langsung dimasukkan ke field audio_url JSON
    const internalProxyUrl = `/api/radio-stream?mode=${data.type}&url=${encodeURIComponent(data.audio_url)}&seek=${data.elapsed_seconds}`;

    return NextResponse.json({
      ...data,
      audio_url: data.type === "adzan" ? data.audio_url : internalProxyUrl // Jika adzan pakai file lokal langsung, selain itu lewat hawkhost proxy
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }

  // JALUR 2: Jika Player HTML5/Audio menyedot stream Biner MP3 murni
  const finalMode = searchParams.get("mode") || data.type;
  const finalUrl = searchParams.get("url") || data.audio_url;
  const finalSeek = searchParams.get("seek") || data.elapsed_seconds;

  // Jika tidak ada URL stream audio murni yang didapatkan, lempar status offline
  if (!finalUrl || finalUrl.trim() === "") {
    return new NextResponse("Radio Offline (No Stream URL Source Specified)", { status: 404 });
  }

  // Kirim data ke core engine sdit php milik Hawkhost
  const HAWKHOST_CORE_URL = `https://sdit.my.id/radio/stream.php?mode=${finalMode}&stream_url=${encodeURIComponent(finalUrl)}&current_seconds=${finalSeek}`;

  try {
    const response = await fetch(HAWKHOST_CORE_URL, {
      cache: "no-store",
      headers: { "Accept": "audio/mpeg" },
    });

    if (!response.ok || !response.body) {
      return new NextResponse("Radio Offline (Hawkhost Server Unreachable)", { status: 503 });
    }

    // Kembalikan Response Biner murni untuk dikonsumsi oleh <audio> HTML5
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    return new NextResponse("Internal Stream Server Error", { status: 500 });
  }
}