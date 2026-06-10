import { NextResponse, NextRequest } from 'next/server';
import { client } from '@/lib/sanity.client';

export const dynamic = 'force-dynamic';

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestType = searchParams.get('type'); // 🌟 Cek apakah frontend minta metadata JSON

  const now = new Date();
  let targetAudioUrl = '';
  let broadcastMode = 'playlist_mp3';
  let secondsSinceStarted = 0;

  try {
    const sanityQuery = `*[_type == "radioConfig"][0] {
      schedules[] {
        day,
        startTime,
        endTime,
        broadcastMode,
        playlist[] { 
          "audioFileUrl": audioFile.asset->url,
          "duration": audioFile.asset->metadata.duration
        }
      }
    }`;
    
    const config = await client.fetch(sanityQuery, {}, { cache: 'no-store' });

    if (config?.schedules && Array.isArray(config.schedules)) {
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      const timeParts = timeFormatter.formatToParts(now);
      const currentHours = Number(timeParts.find(p => p.type === 'hour')?.value || 0);
      const currentMinutes = Number(timeParts.find(p => p.type === 'minute')?.value || 0);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' });
      const currentDayName = dayFormatter.format(now);

      for (const schedule of config.schedules) {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
        const isDayMatch = schedule.day === 'everyday' || schedule.day === currentDayName;

        if (isTimeMatch && isDayMatch) {
          broadcastMode = schedule.broadcastMode;
          
          if (broadcastMode === 'playlist_mp3' && schedule.playlist?.length > 0) {
            const playlist = schedule.playlist;
            const currentGlobalTimestampSeconds = Math.floor(Date.now() / 1000);
            
            const totalPlaylistDuration = playlist.reduce((acc: number, item: any) => {
              return acc + (Math.floor(Number(item.duration)) || 240);
            }, 0);

            if (totalPlaylistDuration > 0) {
              const virtualTimeline = currentGlobalTimestampSeconds % totalPlaylistDuration;
              let accumulatedTime = 0;

              for (const track of playlist) {
                const trackLen = Math.floor(Number(track.duration)) || 240;
                
                if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + trackLen) {
                  targetAudioUrl = track.audioFileUrl || '';
                  secondsSinceStarted = virtualTimeline - accumulatedTime;
                  break;
                }
                accumulatedTime += trackLen;
              }
            }
          }
          break;
        }
      }
    }
  } catch (sanityError) {
    console.error('Sanity Error:', sanityError);
  }

  // =========================================================================
  // JALUR 1: Jika Frontend melakukan fetchMetadata (Minta data JSON resmi)
  // =========================================================================
  if (requestType === 'metadata') {
    return NextResponse.json({
      active: true,
      type: broadcastMode,
      title: broadcastMode === "adzan" ? "Panggilan Adzan Sholat" : "Siaran Utama Radio",
      artist: "Radio Suara Berkemajuan",
      thumbnail: "/bg-player.png",
      // Mengarahkan player audio untuk menembak file ini kembali tanpa parameter metadata
      audio_url: `/api/radio-stream?mode=${broadcastMode}&url=${encodeURIComponent(targetAudioUrl)}&seek=${secondsSinceStarted}`,
      elapsed_seconds: secondsSinceStarted
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  // =========================================================================
  // JALUR 2: Jika Player Audio meminta Biner Musik murni (audio/mpeg)
  // =========================================================================
  // Ambil parameter fallback/override jika stream dialirkan ulang dari audio_url
  const finalMode = searchParams.get('mode') || broadcastMode;
  const finalUrl = searchParams.get('url') || targetAudioUrl;
  const finalSeek = searchParams.get('seek') || secondsSinceStarted;

  const HAWKHOST_CORE_URL = `https://sdit.my.id/radio/stream.php?mode=${finalMode}&stream_url=${encodeURIComponent(finalUrl)}&current_seconds=${finalSeek}`;

  try {
    const response = await fetch(HAWKHOST_CORE_URL, {
      cache: 'no-store',
      headers: { 'Accept': 'audio/mpeg' },
    });

    if (!response.ok || !response.body) {
      return new NextResponse('Radio Offline (Hawkhost Unreachable)', { status: 503 });
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}