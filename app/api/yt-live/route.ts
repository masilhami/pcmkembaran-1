import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || !apiKey) {
      return NextResponse.json({
        isLive: false,
        error: 'Missing env'
      });
    }

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=${channelId}` +
      `&eventType=live` +
      `&type=video` +
      `&maxResults=1` +
      `&key=${apiKey}`;

    const response = await fetch(url, {
      cache: 'no-store'
    });

    const data = await response.json();

    if (
      data.items &&
      data.items.length > 0
    ) {

      const liveVideo = data.items[0];

      return NextResponse.json({
        isLive: true,
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title
      });
    }

    return NextResponse.json({
      isLive: false,
      videoId: null
    });

  } catch (error) {

    return NextResponse.json({
      isLive: false,
      error: String(error)
    });
  }
}